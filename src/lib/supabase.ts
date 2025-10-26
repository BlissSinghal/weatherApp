import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra || {};

const supabaseUrl = extra.supabaseUrl;
const supabaseAnonKey = extra.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or anon key missing in app.json");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
