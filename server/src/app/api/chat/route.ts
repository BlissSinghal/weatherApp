/**
 * Weather chatbot API — streams responses and can perform CRUD via tools.
 */
import {
  createWeatherRequest,
  deleteWeatherRequest,
  getWeatherRequest,
  listWeatherRequests,
  updateWeatherRequest,
} from "@/lib/weatherReqs/api";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "edge";

/** Optional: CORS (useful if you ever hit this from a web build) */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // tighten to your domain if needed
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-vercel-protection-bypass",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return new Response(JSON.stringify({ ok: true, route: "/api/chat" }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export async function POST(req: NextRequest) {
  try {
    // Read raw text to avoid hard crashes on malformed JSON
    const raw = await req.text();
    let body: any;
    try {
      body = JSON.parse(raw);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body", raw }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    if (!Array.isArray(body?.messages)) {
      return new Response(
        JSON.stringify({ error: 'Body must include "messages": []' }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    console.log("Edge env test:", process.env.OPENAI_API_KEY ? "loaded ✅" : "missing ❌");

    // Guard required env vars before initializing clients
    const OPENAI_API_KEY = requireEnv("OPENAI_API_KEY");

    const openai = createOpenAI({ apiKey: OPENAI_API_KEY });

    const { fullStream } = await streamText({
      model: openai("gpt-4o-mini"),
      messages: body.messages,
      system: `
        You are a weather assistant. You can perform CRUD operations on the "weather_requests" table.
        Validate input:
        - start_date <= end_date
        - location_name must be provided.
        Always confirm successful operations to the user.
        If operation fails, provide a clear error message and prompt for correction.
        If user input is incomplete, ask for the missing information.
        If user input is unclear or unrelated to weather requests, ask for clarification.
      `,
      tools: {
        createWeatherRequest: {
          description: "Create a new weather request record",
          inputSchema: z.object({
            location_name: z.string(),
            location_lat: z.number(),
            location_lng: z.number(),
            start_date: z.string(),
            end_date: z.string(),
            avg_temp_c: z.number().optional(),
            min_temp_c: z.number().optional(),
            max_temp_c: z.number().optional(),
          }),
          execute: async (args) => {
            if (new Date(args.start_date) > new Date(args.end_date)) {
              throw new Error("start_date must be before or equal to end_date");
            }
            return await createWeatherRequest(args);
          },
        },
        listWeatherRequests: {
          description: "List all stored weather requests",
          inputSchema: z.object({}),
          execute: async () => await listWeatherRequests(),
        },
        getWeatherRequest: {
          description: "Get a weather record by ID",
          inputSchema: z.object({ id: z.number() }),
          execute: async ({ id }) => await getWeatherRequest(id),
        },
        updateWeatherRequest: {
          description: "Update an existing weather record",
          inputSchema: z.object({
            id: z.number(),
            updates: z.object({
              location_name: z.string().optional(),
              start_date: z.string().optional(),
              end_date: z.string().optional(),
            }),
          }),
          execute: async ({ id, updates }) => await updateWeatherRequest(id, updates),
        },
        deleteWeatherRequest: {
          description: "Delete a weather record by ID",
          inputSchema: z.object({ id: z.number() }),
          execute: async ({ id }) => await deleteWeatherRequest(id),
        },
      },
    });

    // ✅ Convert to byte stream to satisfy Vercel Edge
    const encoder = new TextEncoder();
    const byteStream = new ReadableStream({
      start(controller) {
        const reader = fullStream.getReader();
        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                break;
              }
              // Convert to bytes
              let chunk: string;
              if (typeof value === "string") {
                chunk = value;
              } else if (value && typeof value === "object") {
                // Convert structured data (like {type, delta, etc.}) into JSON lines
                chunk = JSON.stringify(value) + "\n";
              } else {
                continue;
              }
            }
          } catch (err) {
            controller.error(err);
          }
        })();
      },
    });

    return new Response(byteStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    // Return readable JSON instead of a Vercel HTML 500
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
}
