import { geocode } from "@/src/features/geocode/api";
import { computeForecastTemperatureStats, getWeatherWithForecast } from "@/src/features/weather/api";
import { supabase } from "@/src/lib/supabase";
import React, { useState } from "react";
import {
    Alert, Button, ScrollView, StyleSheet, Switch, Text, TextInput, View
} from "react-native";

import WeatherMiniCard, { WeatherRow as WeatherCardRow } from "@/components/DatabaseRowDisplay";
import type { ForecastTemperatureStats } from "@/src/features/weather/api";

type WeatherRow = WeatherCardRow & {
  location_lat?: number;
  location_lng?: number;
  created_at?: string;
  updated_at?: string;
};

function daysBetween(startISO: string, endISO: string) {
  const ms = Math.max(0, new Date(endISO).getTime() - new Date(startISO).getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

export default function WeatherAutoCrudScreen() {
  // form inputs
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState("");     // YYYY-MM-DD

  // update/delete target id
  const [targetId, setTargetId] = useState("");

  // options
  const [recomputeOnUpdate, setRecomputeOnUpdate] = useState(true);

  // data
  const [cards, setCards] = useState<WeatherRow[]>([]);
  const [busy, setBusy] = useState(false);

  /**
   * Geocode + fetch weather + compute stats.
   * Returns:
   *  - entryForDb: object safe to write to Supabase (no new columns)
   *  - cardRow:    enriched object we keep only in UI state (includes forecast_temp_stats)
   */
  async function autoFill(locationName: string, s: string, e: string): Promise<{
    entryForDb: Partial<WeatherRow>;
    cardRow: WeatherRow;
  }> {
    const hits = await geocode(locationName.trim());
    if (!hits.length) throw new Error(`Couldn't geocode "${locationName}"`);
    const hit = hits[0];
    const lat = hit.location.lat;
    const lng = hit.location.lng;
    const resolvedName = hit.formatted_address;

    // Request the window size based on the user’s date range (1..10)
    const totalDays = Math.min(10, Math.max(1, daysBetween(s, e)));

    // Fetch weather and compute stats (single fetch; compute locally)
    const weather = await getWeatherWithForecast(lat, lng, totalDays);
    const stats: ForecastTemperatureStats = computeForecastTemperatureStats(weather);

    // Legacy fields (kept for DB and backward-compat in cards)
    const avg_temp_c = Number.isFinite(stats.avgTempC) ? +stats.avgTempC.toFixed(2) : null;
    const min_temp_c = Number.isFinite(stats.minTempC) ? stats.minTempC : null;
    const max_temp_c = Number.isFinite(stats.maxTempC) ? stats.maxTempC : null;

    const weather_summary = {
      provider: "google-weather",
      current: weather.current,
      forecast: weather.forecast,
      resolvedName,
    };

    const entryForDb: Partial<WeatherRow> = {
      location_name: resolvedName,
      location_lat: lat,
      location_lng: lng,
      start_date: s,
      end_date: e,
      avg_temp_c,
      min_temp_c,
      max_temp_c,
      weather_summary,
    };

    // Add the stats ONLY to the UI card object (don’t persist unless your table has a column for it)
    const cardRow: WeatherRow = {
      ...(entryForDb as WeatherRow),
      forecast_temp_stats: stats,
    };

    return { entryForDb, cardRow };
  }

  async function handleCreate() {
    try {
      if (!location || !startDate || !endDate) {
        Alert.alert("Missing fields", "Enter location, start date, and end date.");
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        Alert.alert("Validation", "start_date must be before or equal to end_date");
        return;
      }
      setBusy(true);

      const { entryForDb, cardRow } = await autoFill(location, startDate, endDate);

      const { data, error } = await supabase
        .from("weather_requests")
        .insert([entryForDb])
        .select()
        .single();

      if (error) throw error;

      // Keep DB record’s authoritative fields, but enrich with stats for the UI
      const merged: WeatherRow = {
        ...(data as WeatherRow),
        forecast_temp_stats: cardRow.forecast_temp_stats,
      };

      setCards(prev => [merged, ...prev]);
      Alert.alert("✅ Created", `#${data.id} • ${data.location_name}`);
    } catch (e: any) {
      Alert.alert("Create failed", e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleList() {
    try {
      setBusy(true);
      const { data, error } = await supabase
        .from("weather_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Older rows won’t have stats persisted. We leave them as-is;
      // WeatherMiniCard will fall back to avg/min/max fields.
      setCards((data ?? []) as WeatherRow[]);
    } catch (e: any) {
      Alert.alert("List failed", e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate() {
    try {
      const id = Number(targetId);
      if (!Number.isFinite(id)) {
        Alert.alert("Validation", "Enter a valid numeric id to update");
        return;
      }
      setBusy(true);

      let updates: Partial<WeatherRow> = {};
      let uiStats: ForecastTemperatureStats | undefined;

      if (recomputeOnUpdate) {
        if (!location || !startDate || !endDate) {
          Alert.alert("Missing fields", "For recompute, enter location, start and end date.");
          setBusy(false);
          return;
        }
        const { entryForDb, cardRow } = await autoFill(location, startDate, endDate);
        updates = entryForDb;
        uiStats = cardRow.forecast_temp_stats;
      } else {
        if (location) updates.location_name = location.trim();
        if (startDate) updates.start_date = startDate;
        if (endDate) updates.end_date = endDate;
      }

      const { data, error } = await supabase
        .from("weather_requests")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Enrich the updated card in UI with computed stats (if recomputed)
      const merged: WeatherRow = {
        ...(data as WeatherRow),
        ...(uiStats ? { forecast_temp_stats: uiStats } : {}),
      };

      setCards(prev => prev.map(r => (r.id === id ? merged : r)));
      Alert.alert("✅ Updated", `#${data.id} • ${data.location_name}`);
    } catch (e: any) {
      Alert.alert("Update failed", e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    try {
      const id = Number(targetId);
      if (!Number.isFinite(id)) {
        Alert.alert("Validation", "Enter a valid numeric id to delete");
        return;
      }
      setBusy(true);
      const { error } = await supabase.from("weather_requests").delete().eq("id", id);
      if (error) throw error;
      setCards(prev => prev.filter(r => r.id !== id));
      Alert.alert("🗑 Deleted", `Record #${id} removed`);
    } catch (e: any) {
      Alert.alert("Delete failed", e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>🌦 Weather → Supabase</Text>

      <TextInput
        style={styles.input}
        placeholder="Location (city, address, zip…)"
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={styles.input}
        placeholder="Start date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
      />
      <TextInput
        style={styles.input}
        placeholder="End date (YYYY-MM-DD)"
        value={endDate}
        onChangeText={setEndDate}
      />

      <View style={styles.row}>
        <Button title={busy ? "Working..." : "Create"} onPress={handleCreate} disabled={busy} />
        <View style={{ width: 10 }} />
        <Button title="List" onPress={handleList} disabled={busy} />
      </View>

      <Text style={styles.section}>Update / Delete by id</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Record id"
          value={targetId}
          onChangeText={setTargetId}
          keyboardType="numeric"
        />
        <View style={{ width: 10 }} />
        <Button title="Delete" onPress={handleDelete} color="#c62828" disabled={busy} />
      </View>

      <View style={styles.switchRow}>
        <Text>Recompute lat/lng + temps from location/start/end</Text>
        <Switch value={recomputeOnUpdate} onValueChange={setRecomputeOnUpdate} />
      </View>
      <Button title="Update" onPress={handleUpdate} disabled={busy} />

      {/* Pretty output as cards */}
      <View style={{ height: 14 }} />
      {cards.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#666", marginTop: 8 }}>
          No weather records yet 🌧
        </Text>
      ) : (
        <View>
          {cards.map(item => (
            <WeatherMiniCard
              key={item.id ?? `${item.location_name}-${item.start_date}`}
              item={item}
              onPress={() => {
                // optional: navigate to a details page
                // router.push({ pathname: "/weather/[id]", params: { id: item.id } });
              }}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  section: { marginTop: 18, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 6 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
});
