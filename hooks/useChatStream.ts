
import { useState } from "react";

export function useChatStream(apiUrl: string) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [response, setResponse] = useState("");

  async function sendMessage(messages: any[]) {
    setIsStreaming(true);
    setResponse("");

    const res = await fetch(`${apiUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!res.body) {
      setIsStreaming(false);
      throw new Error("No response body from server");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    
    //debugging logs
    console.log("Sending to:", `${apiUrl}/api/chat`);
    console.log("Response status:", res.status);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      console.log("Chunk received:", chunk)
      setResponse((prev) => prev + chunk);


    }


    setIsStreaming(false);
  }

  return { isStreaming, response, sendMessage };
}
