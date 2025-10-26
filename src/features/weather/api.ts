/*
WEATHER DATA API HANDLING

INPUTS: LAtitude and Longitude coordinates

OUTPUTS: Weather data for that location: 
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


// src/features/weather/api.ts
import Constants from "expo-constants";

const API_KEY = (Constants.expoConfig?.extra as any)?.GOOGLE_MAPS_API_KEY as string;

export type WeatherSummary = {
  currentTime: string;
  timeZone: string;
  isDaytime: boolean;
  weatherCondition: { type: string; description: string; iconUrl: string };
  temperatureC: number;
  feelsLikeC: number;
  uvIndex: number;
  wind: { directionDegrees: number; directionCardinal: string; speedKph: number; gustKph: number };
  thunderstormProbability: number;
  maxTempC: number;
  minTempC: number;
  visibilityKm: number;
};

export type DailyBlock = {
  description: string;           // “Partly sunny”
  iconUrl: string;               // https://...png
  uvIndex: number;               // 0..11+
  precipPercent: number;         // %
  windKph: number;               // speed
  windGustKph: number;           // gust
  windDirCardinal: string;       // WEST, etc.
  windDirDegrees: number;        // 0..360
  cloudCover?: number;           // %
  humidity?: number;             // %
};

export type DailyForecast = {
  dateISO: string;               // interval.startTime for the day
  displayDate: { year: number; month: number; day: number };
  maxTempC: number;
  minTempC: number;
  feelsLikeMaxC?: number;
  feelsLikeMinC?: number;
  sunriseTime?: string;
  sunsetTime?: string;
  daytime: DailyBlock;
  nighttime: DailyBlock;
};

export type WeatherWithForecast = {
  current: WeatherSummary;
  forecast: DailyForecast[]; // 5 entries
};

export type ForecastTemperatureStats = {
  /** Number of days included (e.g., 5) */
  periodDays: number;
  /** First day (start) in ISO-8601 from the forecast array, or null if unavailable */
  periodStartISO: string | null;
  /** Last day (end) in ISO-8601 from the forecast array, or null if unavailable */
  periodEndISO: string | null;
  /** Lowest daily min across the period */
  minTempC: number;
  /** Highest daily max across the period */
  maxTempC: number;
  /** Average temp across the period (mean of each day's (max+min)/2) */
  avgTempC: number;
};




export async function getWeatherSummary(lat: number, lng: number): Promise<WeatherSummary> {
  if (!API_KEY) throw new Error("Missing GOOGLE_MAPS_API_KEY in app config.");

  const url =
    `https://weather.googleapis.com/v1/currentConditions:lookup` +
    `?key=${API_KEY}&location.latitude=${lat}&location.longitude=${lng}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Network error: ${res.status} ${res.statusText}`);
  const data = await res.json();

  // Basic presence checks
  if (!data || !data.weatherCondition) {
    console.log("Unexpected Weather API response:", data);
    throw new Error("Invalid response from Weather API");
  }

  const iconUrl = data.weatherCondition?.iconBaseUri
    ? `${data.weatherCondition.iconBaseUri}.png`
    : "";

  return {
    currentTime: data.currentTime,
    timeZone: data.timeZone?.id ?? "Unknown",
    isDaytime: !!data.isDaytime,
    weatherCondition: {
      type: data.weatherCondition?.type ?? "UNKNOWN",
      description: data.weatherCondition?.description?.text ?? "Unknown",
      iconUrl,
    },
    temperatureC: data.temperature?.degrees ?? 0,
    feelsLikeC: data.feelsLikeTemperature?.degrees ?? 0,
    uvIndex: data.uvIndex ?? 0,
    wind: {
      directionDegrees: data.wind?.direction?.degrees ?? 0,
      directionCardinal: data.wind?.direction?.cardinal ?? "UNKNOWN",
      speedKph: data.wind?.speed?.value ?? 0,
      gustKph: data.wind?.gust?.value ?? 0,
    },
    thunderstormProbability: data.thunderstormProbability ?? 0,
    maxTempC: data.currentConditionsHistory?.maxTemperature?.degrees ?? 0,
    minTempC: data.currentConditionsHistory?.minTemperature?.degrees ?? 0,
    visibilityKm: data.visibility?.distance ?? 0,
  };
}


async function getDailyForecast(lat: number, lng: number, days = 5): Promise<DailyForecast[]> {
  if (!API_KEY) throw new Error("Missing GOOGLE_MAPS_API_KEY in app config.");

  const url =
    `https://weather.googleapis.com/v1/forecast/days:lookup` +
    `?key=${API_KEY}&location.latitude=${lat}&location.longitude=${lng}` +
    `&days=${days}&pageSize=${days}`; // keep it to one page

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Network error: ${res.status} ${res.statusText}`);
  const data = await res.json();

  const tz = data?.timeZone?.id; // present on this response too

  const toBlock = (block: any): DailyBlock => ({
    description: block?.weatherCondition?.description?.text ?? "Unknown",
    iconUrl: block?.weatherCondition?.iconBaseUri ? `${block.weatherCondition.iconBaseUri}.png` : "",
    uvIndex: block?.uvIndex ?? 0,
    precipPercent: block?.precipitation?.probability?.percent ?? 0,
    windKph: block?.wind?.speed?.value ?? 0,
    windGustKph: block?.wind?.gust?.value ?? 0,
    windDirCardinal: block?.wind?.direction?.cardinal ?? "UNKNOWN",
    windDirDegrees: block?.wind?.direction?.degrees ?? 0,
    cloudCover: block?.cloudCover ?? undefined,
    humidity: block?.relativeHumidity ?? undefined,
  });

  const out: DailyForecast[] = (data?.forecastDays ?? []).map((d: any) => ({
    dateISO: d?.interval?.startTime ?? "",
    displayDate: {
      year: d?.displayDate?.year ?? 0,
      month: d?.displayDate?.month ?? 0,
      day: d?.displayDate?.day ?? 0,
    },
    maxTempC: d?.maxTemperature?.degrees ?? 0,
    minTempC: d?.minTemperature?.degrees ?? 0,
    feelsLikeMaxC: d?.feelsLikeMaxTemperature?.degrees ?? undefined,
    feelsLikeMinC: d?.feelsLikeMinTemperature?.degrees ?? undefined,
    sunriseTime: d?.sunEvents?.sunriseTime ?? undefined,
    sunsetTime: d?.sunEvents?.sunsetTime ?? undefined,
    daytime: toBlock(d?.daytimeForecast),
    nighttime: toBlock(d?.nighttimeForecast),
  }));

  return out;
}

export async function getWeatherWithForecast(
  lat: number,
  lng: number,
  days = 5
): Promise<WeatherWithForecast> {
  const [current, forecast] = await Promise.all([
    getWeatherSummary(lat, lng),
    getDailyForecast(lat, lng, days),
  ]);
  return { current, forecast };
}

/**
 * Compute temperature stats from either:
 * - a WeatherWithForecast object, or
 * - a raw DailyForecast[].
 *
 * @param input - WeatherWithForecast or DailyForecast[]
 */
export function computeForecastTemperatureStats(
  input: WeatherWithForecast | DailyForecast[]
): ForecastTemperatureStats {
  const forecast = Array.isArray(input)
    ? input
    : input?.forecast ?? [];

  if (!forecast || forecast.length === 0) {
    return {
      periodDays: 0,
      periodStartISO: null,
      periodEndISO: null,
      minTempC: 0,
      maxTempC: 0,
      avgTempC: 0,
    };
  }

  let maxTemp = -Infinity;
  let minTemp = Infinity;
  let avgAccumulator = 0;

  for (const day of forecast) {
    const dayMax = Number.isFinite(day.maxTempC) ? day.maxTempC : 0;
    const dayMin = Number.isFinite(day.minTempC) ? day.minTempC : 0;

    if (dayMax > maxTemp) maxTemp = dayMax;
    if (dayMin < minTemp) minTemp = dayMin;

    avgAccumulator += (dayMax + dayMin) / 2;
  }

  const avgTemp = avgAccumulator / forecast.length;

  return {
    periodDays: forecast.length,
    periodStartISO: forecast[0]?.dateISO ?? null,
    periodEndISO: forecast[forecast.length - 1]?.dateISO ?? null,
    minTempC: Number.isFinite(minTemp) ? minTemp : 0,
    maxTempC: Number.isFinite(maxTemp) ? maxTemp : 0,
    avgTempC: Number.isFinite(avgTemp) ? avgTemp : 0,
  };
}

// --- Optional helper: fetch forecast & compute directly ---
export async function getForecastTemperatureStats(
  lat: number,
  lng: number,
  days = 5
): Promise<ForecastTemperatureStats> {
  const data = await getWeatherWithForecast(lat, lng, days);
  return computeForecastTemperatureStats(data);
}
