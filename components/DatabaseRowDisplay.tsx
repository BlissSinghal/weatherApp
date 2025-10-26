import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
// Adjust the import path to where you export this type
import type { ForecastTemperatureStats } from "@/src/features/weather/api";

export type WeatherRow = {
  id?: number;
  location_name: string;

  // If you pass these, they'll be used for the range.
  // If omitted, we'll try to derive the dates from the stats (periodStartISO/periodEndISO).
  start_date?: string;  // "YYYY-MM-DD"
  end_date?: string;    // "YYYY-MM-DD"

  // Legacy explicit temps (kept for backward-compat). Ignored if stats present.
  avg_temp_c?: number | null;
  min_temp_c?: number | null;
  max_temp_c?: number | null;

  // NEW: plug the result of getForecastTemperatureStats() straight in here.
  forecast_temp_stats?: ForecastTemperatureStats;

  // Unchanged: used to surface an icon
  weather_summary?: any; // expects current.weatherCondition.iconUrl (if present)
};

type Props = {
  item: WeatherRow;
  onPress?: () => void; // optional (e.g., open details)
  compact?: boolean;    // optional smaller padding
};

const isoToYMD = (iso?: string | null): string | undefined => {
  if (!iso) return undefined;
  try {
    // Normalize to local date parts; if you prefer UTC, tweak accordingly.
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return undefined;
  }
};

const formatRange = (s?: string, e?: string) => {
  if (!s || !e) return "—";
  try {
    const sd = new Date(s);
    const ed = new Date(e);
    const f = (d: Date) =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); // Oct 24
    return `${f(sd)} → ${f(ed)}`;
  } catch {
    return `${s} → ${e}`;
  }
};

export default function WeatherMiniCard({ item, onPress, compact }: Props) {
  const icon =
    item?.weather_summary?.current?.weatherCondition?.iconUrl ??
    item?.weather_summary?.current?.weatherCondition?.iconBaseUri ??
    item?.weather_summary?.forecast?.[0]?.iconUrl ??
    undefined;

  const stats = item.forecast_temp_stats;
  const avg = stats?.avgTempC ?? item.avg_temp_c ?? "—";
  const min = stats?.minTempC ?? item.min_temp_c ?? "—";
  const max = stats?.maxTempC ?? item.max_temp_c ?? "—";

  const startDate = item.start_date ?? isoToYMD(stats?.periodStartISO) ?? "—";
  const endDate = item.end_date ?? isoToYMD(stats?.periodEndISO) ?? "—";

  const content = (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.rowTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.location_name}
            </Text>
            {typeof item.id === "number" && (
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>#{item.id}</Text>
              </View>
            )}
          </View>
          <Text style={styles.range}>{formatRange(startDate, endDate)}</Text>
        </View>
        {icon ? (
          <Image source={{ uri: String(icon) }} style={styles.icon} />
        ) : (
          <Text style={styles.iconFallback}>🌤️</Text>
        )}
      </View>

      <View style={styles.rowTemps}>
        <TempPill label="Avg" value={avg} />
        <TempPill label="Min" value={min} tone="cool" />
        <TempPill label="Max" value={max} tone="warm" />
      </View>
    </View>
  );

  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

function TempPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "cool" | "warm";
}) {
  const toneStyle =
    tone === "warm" ? styles.pillWarm : tone === "cool" ? styles.pillCool : styles.pillNeutral;

  const display =
    typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}°C` : "—";

  return (
    <View style={[styles.pill, toneStyle]}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{display}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f2f8ff",
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardCompact: { padding: 10 },
  rowTop: { flexDirection: "row", alignItems: "center" },

  // NEW
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },

  title: { fontSize: 16, fontWeight: "700", color: "#0b1d33", marginRight: 12 },
  range: { fontSize: 12, color: "#4a627d", marginTop: 2 },
  icon: { width: 44, height: 44, borderRadius: 8 },
  iconFallback: { fontSize: 28, marginLeft: 8 },

  rowTemps: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pillNeutral: { backgroundColor: "#e8f0ff" },
  pillCool: { backgroundColor: "#e6f6ff" },
  pillWarm: { backgroundColor: "#ffeee6" },
  pillLabel: { fontSize: 12, color: "#4e5d78", fontWeight: "600" },
  pillValue: { fontSize: 14, color: "#0b1d33", fontWeight: "800" },

  // NEW — id chip
  idBadge: {
    backgroundColor: "#e9eef7",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  idBadgeText: { fontSize: 11, color: "#234", fontWeight: "700" },
});
