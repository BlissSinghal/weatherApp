import { supabase } from "@/lib/supabase";

export type WeatherRequest = {
  id?: number;
  location_name: string;
  location_lat: number;
  location_lng: number;
  start_date: string;
  end_date: string;
  avg_temp_c?: number | null;
  min_temp_c?: number | null;
  max_temp_c?: number | null;
  weather_summary?: any;
  created_at?: string;
  updated_at?: string;
};

export async function createWeatherRequest(entry: Omit<WeatherRequest, "id">) {
  const { data, error } = await supabase.from("weather_requests").insert([entry]).select();
  if (error) throw error;
  return data?.[0];
}

export async function listWeatherRequests() {
  const { data, error } = await supabase
    .from("weather_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getWeatherRequest(id: number) {
  const { data, error } = await supabase.from("weather_requests").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function updateWeatherRequest(id: number, updates: Partial<WeatherRequest>) {
  const { data, error } = await supabase
    .from("weather_requests")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteWeatherRequest(id: number) {
  const { error } = await supabase.from("weather_requests").delete().eq("id", id);
  if (error) throw error;
  return { ok: true };
}
