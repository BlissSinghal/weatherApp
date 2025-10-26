/*
Display's detailed weather info for a specific location 

INPUT: lat/lng of the location to display weather for
OUTPUT: A detailed weather view showing:
"Heart icon" to favorite/unfavorite this location, favoriting it will display it on the home screen
"Map buttton" to view this location on a map

Detailed weather info to display:

| **Field name (in your code)**  | **Source field in API JSON**                      | **Description**                                     | **Value type**        | **Example value**                                         |
| ------------------------------ | ------------------------------------------------- | --------------------------------------------------- | --------------------- | --------------------------------------------------------- |
| `currentTime`                  | `currentTime`                                     | The UTC timestamp of when the data was last updated | `string (ISO 8601)`   | `"2025-10-24T21:30:59.018947878Z"`                        |
| `timeZone`                     | `timeZone.id`                                     | IANA timezone ID for the location                   | `string`              | `"America/Los_Angeles"`                                   |
| `isDaytime`                    | `isDaytime`                                       | Indicates whether it’s currently day or night       | `boolean`             | `true`                                                    |
| `weatherCondition.type`        | `weatherCondition.type`                           | Short weather condition code (like enum)            | `string`              | `"MOSTLY_CLOUDY"`                                         |
| `weatherCondition.description` | `weatherCondition.description.text`               | Human-readable weather description                  | `string`              | `"Mostly cloudy"`                                         |
| `weatherCondition.iconUrl`     | `weatherCondition.iconBaseUri` + `.png`           | Full URL of the weather icon image                  | `string (URL)`        | `"https://maps.gstatic.com/weather/v1/mostly_cloudy.png"` |
| `temperatureC`                 | `temperature.degrees`                             | Current air temperature in Celsius                  | `number`              | `18.4`                                                    |
| `feelsLikeC`                   | `feelsLikeTemperature.degrees`                    | “Feels like” (apparent) temperature                 | `number`              | `18.4`                                                    |
| `uvIndex`                      | `uvIndex`                                         | UV index value (0–11+)                              | `number`              | `2`                                                       |
| `wind.directionDegrees`        | `wind.direction.degrees`                          | Wind direction in degrees (0–360)                   | `number`              | `325`                                                     |
| `wind.directionCardinal`       | `wind.direction.cardinal`                         | Wind direction in compass notation                  | `string`              | `"NORTHWEST"`                                             |
| `wind.speedKph`                | `wind.speed.value`                                | Wind speed                                          | `number`              | `8`                                                       |
| `wind.gustKph`                 | `wind.gust.value`                                 | Wind gust speed                                     | `number`              | `19`                                                      |
| `thunderstormProbability`      | `thunderstormProbability`                         | Probability of thunderstorms                        | `number (percentage)` | `0`                                                       |
| `maxTempC`                     | `currentConditionsHistory.maxTemperature.degrees` | Highest temp recorded recently                      | `number`              | `19.3`                                                    |
| `minTempC`                     | `currentConditionsHistory.minTemperature.degrees` | Lowest temp recorded recently                       | `number`              | `11.7`                                                    |
| `visibilityKm`                 | `visibility.distance`                             | Visibility distance                                 | `number (km)`         | `16`                                                      |


*/

/*
Displays detailed weather info for a specific location

INPUT (via route params):
- lat, lng (strings)
- weather: JSON.stringify({ current: WeatherSummary, forecast: DailyForecast[] })

OUTPUT:
- Current conditions (from WeatherSummary)
- 5-day forecast (from DailyForecast[])
- "Favorite" and "Map" buttons (wire up later)

*/

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type {
  DailyForecast,
  WeatherSummary,
  WeatherWithForecast,
} from "@/src/features/weather/api";

//Helpers for formatting time and date

const formatTime = (isoString: string, timeZone: string) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
};

const getAbbrevFromTimeZone = (tz: string) => {
  try {
    const date = new Date();
    const parts = date
      .toLocaleString("en-US", { timeZone: tz, timeZoneName: "short" })
      .split(" ");
    return parts[parts.length - 1]; // e.g. "EST", "PDT"
  } catch {
    return "";
  }
};

const formatDayLabel = (isoString: string, timeZone: string) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { timeZone, weekday: "short" }); // Mon, Tue, ...
  } catch {
    return "";
  }
};

const formatMonthDay = (isoString: string, timeZone: string) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { timeZone, month: "short", day: "numeric" }); // Oct 24
  } catch {
    return "";
  }
};

//card that shows the forecast for one day in our 5 day forecast list

function ForecastCard({ item, timeZone }: { item: DailyForecast; timeZone: string }) {
  const dayLabel = formatDayLabel(item.dateISO, timeZone);
  const dateLabel = formatMonthDay(item.dateISO, timeZone);

  const hasDay = item.daytime && typeof item.daytime === "object";
  const hasNight = item.nighttime && typeof item.nighttime === "object";

  const iconUrl =
    (hasDay && item.daytime?.iconUrl) ||
    (hasNight && item.nighttime?.iconUrl) ||
    undefined;

  const desc =
    (hasDay && item.daytime?.description) ||
    (hasNight && item.nighttime?.description) ||
    "—";

  return (
    <View style={styles.forecastCard}>
      <Text style={styles.forecastDay}>{dayLabel}</Text>
      <Text style={styles.forecastDate}>{dateLabel}</Text>

      {iconUrl ? (
        <Image source={{ uri: iconUrl }} style={styles.forecastIcon} />
      ) : (
        <Ionicons name="help-circle-outline" size={40} color="#777" />
      )}

      <Text style={styles.forecastDesc}>{desc}</Text>

      <Text style={styles.forecastTemps}>
        {Math.round(item.maxTempC)}° / {Math.round(item.minTempC)}°
      </Text>
    </View>
  );
}


//Main Screen

export default function WeatherDisplayScreen() {
  const router = useRouter();
  const { lat, lng, weather } = useLocalSearchParams<{
    lat: string;
    lng: string;
    weather: string; // JSON of WeatherWithForecast
  }>();

  const parsed: WeatherWithForecast | null = weather ? JSON.parse(weather) : null;
  if (!parsed) return <Text style={styles.error}>❌ No weather data found.</Text>;

  const data: WeatherSummary = parsed.current;
  const forecast: DailyForecast[] = parsed.forecast ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/")} // Always go back to home tab
        >
            <Ionicons name="arrow-back" size={26} color="#ffd33d" />
        </TouchableOpacity>

        <Text style={styles.title}>Weather Details</Text>

        {/* Placeholder to balance layout */}
        <View style={{ width: 26 }} />
        </View>

      {/* Icon and summary */}
      {!!data.weatherCondition.iconUrl && (
        <Image source={{ uri: data.weatherCondition.iconUrl }} style={styles.icon} />
      )}
      <Text style={styles.temp}>{Math.round(data.temperatureC)}°C</Text>
      <Text style={styles.desc}>{data.weatherCondition.description}</Text>

      {/* Action Buttons */}
      <View style={styles.actions}>
        

        <TouchableOpacity style={styles.button} onPress={() => {/* TODO: navigate to map */}}>
          <Ionicons name="map" size={22} color="#fff" />
          <Text style={styles.btnText}>View on Map</Text>
        </TouchableOpacity>
      </View>

      {/* Info Table (current) */}
      <View style={styles.infoBox}>
        <Text style={styles.label}>
          🌍 Timezone: {data.timeZone} ({getAbbrevFromTimeZone(data.timeZone)})
        </Text>
        <Text style={styles.label}>
          🕒 Current Time: {formatTime(data.currentTime, data.timeZone)}
        </Text>

        <Text style={styles.label}>☀️ Daytime: {data.isDaytime ? "Yes" : "No"}</Text>
        <Text style={styles.label}>🌡️ Feels Like: {Math.round(data.feelsLikeC)}°C</Text>
        <Text style={styles.label}>🌞 UV Index: {data.uvIndex}</Text>
        <Text style={styles.label}>
          💨 Wind: {Math.round(data.wind.speedKph)} km/h {data.wind.directionCardinal} ({data.wind.directionDegrees}°)
        </Text>
        <Text style={styles.label}>💨 Gust: {Math.round(data.wind.gustKph)} km/h</Text>
        <Text style={styles.label}>🌩️ Thunderstorm Probability: {data.thunderstormProbability}%</Text>
        <Text style={styles.label}>👁️ Visibility: {data.visibilityKm} km</Text>
        <Text style={styles.label}>⬆️ Max Temp (recent): {Math.round(data.maxTempC)}°C</Text>
        <Text style={styles.label}>⬇️ Min Temp (recent): {Math.round(data.minTempC)}°C</Text>
        {!!lat && !!lng && <Text style={styles.label}>📍 Coords: {lat}, {lng}</Text>}
      </View>

      {/* 5-day Forecast */}
      {forecast.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>5-Day Forecast</Text>
          <FlatList
            data={forecast.slice(0, 5)}
            keyExtractor={(_, idx) => String(idx)}
            renderItem={({ item }) => <ForecastCard item={item} timeZone={data.timeZone} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.forecastRow}
          />
        </>
      )}
    </ScrollView>
  );
}

//Styles 
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#25292e",
    alignItems: "center",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { color: "#ffd33d", fontSize: 22, fontWeight: "700" },
  icon: { width: 120, height: 120, marginVertical: 10 },
  temp: { color: "#fff", fontSize: 48, fontWeight: "bold" },
  desc: { color: "#ccc", fontSize: 18, marginBottom: 20 },

  actions: { flexDirection: "row", gap: 20, marginVertical: 10 },
  button: {
    flexDirection: "row",
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    gap: 6,
  },
  btnText: { color: "#fff" },

  infoBox: {
    width: "100%",
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
  },
  label: { color: "#fff", marginBottom: 6 },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    width: "100%",
    marginTop: 18,
    marginBottom: 8,
  },
  forecastRow: { gap: 10 },
  forecastCard: {
    width: 120,
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  forecastDay: { color: "#ffd33d", fontWeight: "700", marginBottom: 2 },
  forecastDate: { color: "#bbb", fontSize: 12, marginBottom: 6 },
  forecastIcon: { width: 50, height: 50, marginBottom: 6 },
  forecastDesc: { color: "#eee", fontSize: 12, textAlign: "center", minHeight: 32 },
  forecastTemps: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 4 },

  error: { color: "#f77", textAlign: "center", marginTop: 50 },

  backButton: {
  padding: 6,
  backgroundColor: "#333",
  borderRadius: 10,
  justifyContent: "center",
  alignItems: "center",
  },


});
