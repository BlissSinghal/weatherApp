/* 
This is our home screen. 

Title: Weather 
Search bar

Display all the searched locations below as cards. 
Each card shows:
- Location name (formatted address)
- lat/lng coordinates (for now)
- clickable → later navigate to weather details
*/

import SearchBar from "@/components/SearchBar";
import ResultCard from "@/components/SearchResult";
import { handleSearch } from "@/scripts/handleSearch";
import { getUserLocation } from "@/src/features/currLocation/api";
import type { GeocodeHit } from "@/src/features/geocode/api";
import { getWeatherWithForecast, type WeatherWithForecast } from "@/src/features/weather/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Constants from "expo-constants";

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeocodeHit[]>([]);
  const [infoOpen, setInfoOpen] = useState(false); // NEW: info modal

  //for navigation
  const router = useRouter();

  console.log(
    "extra at runtime:",
    Constants.expoConfig?.extra ?? (Constants as any).manifest?.extra
  );

  // Search logic
  const onSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const hits = await handleSearch(query); // returns all matches
      setResults(hits);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (hit: GeocodeHit) => {
    try {
      // Fetch current conditions + 5-day forecast in one go
      const weatherData: WeatherWithForecast = await getWeatherWithForecast(
        hit.location.lat,
        hit.location.lng,
        5
      );

      // Navigate to detail screen with params
      router.push({
        pathname: "/WeatherDisplay", // keep your route name
        params: {
          lat: String(hit.location.lat),
          lng: String(hit.location.lng),

          weather: JSON.stringify(weatherData),
        },
      });
    } catch (err: any) {
      console.error("Weather fetch failed:", err?.message || err);
      alert("Could not load weather data. Try again.");
    }
  };

  //On click -> gets users current location, fetches weather, navigates to WeatherDisplay screen
  const handleCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const { lat, lng } = await getUserLocation();
      const weatherData: WeatherWithForecast = await getWeatherWithForecast(lat, lng, 5);

      router.push({
        pathname: "/WeatherDisplay",
        params: {
          lat: String(lat),
          lng: String(lng),
          weather: JSON.stringify(weatherData),
        },
      });
    } catch (err: any) {
      console.error("Location/weather fetch failed:", err?.message || err);
      alert("Could not fetch weather for current location. Make sure GPS is enabled.");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openUrl = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
      {/* Header row with title + info button */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>🌤 Weather</Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setInfoOpen(true)}
          accessibilityLabel="About PM Accelerator"
        >
          <Ionicons name="information-circle-outline" size={26} color="#ffd33d" />
        </TouchableOpacity>
      </View>

      {/* Your name */}
      <Text style={styles.subtitle}>by Bliss Singhal</Text>

      {/* Search Bar Row with GPS button */}
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <SearchBar placeholder="Search by location" onSearch={onSearch} />
        </View>

        <TouchableOpacity
          style={styles.locButton}
          onPress={handleCurrentLocation}
          disabled={loading}
        >
          <Ionicons name="navigate" size={26} color="#ffd33d" />
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}
      {error && <Text style={styles.error}>❌ {error}</Text>}

      {/* Show result cards */}
      {results.length > 0 && (
        <View style={styles.resultsList}>
          {results.map((hit) => (
            <ResultCard key={hit.place_id} hit={hit} onSelect={handleSelect} />
          ))}
        </View>
      )}

      {/* Info Modal */}
      <Modal
        visible={infoOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setInfoOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>PM Accelerator</Text>
              <Pressable onPress={() => setInfoOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#0b1d33" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalText}>
                The Product Manager Accelerator Program is designed to support PM professionals
                through every stage of their careers. From students looking for entry-level jobs to
                Directors looking to take on a leadership role, our program has helped over hundreds
                of students fulfill their career aspirations.{"\n\n"}
                Our Product Manager Accelerator community are ambitious and committed. Through our
                program they have learnt, honed and developed new PM and leadership skills, giving
                them a strong foundation for their future endeavors.{"\n\n"}
                Here are the examples of services we offer. Check out our website (link under my
                profile) to learn more about our services.
              </Text>

              <Text style={styles.bullet}>🚀 PMA Pro</Text>
              <Text style={styles.modalTextSmall}>
                End-to-end product manager job hunting program that helps you master FAANG-level
                Product Management skills, conduct unlimited mock interviews, and gain job referrals
                through our largest alumni network. 25% of our offers came from tier 1 companies and
                get paid as high as $800K/year.
              </Text>

              <Text style={styles.bullet}>🚀 AI PM Bootcamp</Text>
              <Text style={styles.modalTextSmall}>
                Gain hands-on AI Product Management skills by building a real-life AI product with a
                team of AI Engineers, data scientists, and designers. We will also help you launch
                your product with real user engagement using our 100,000+ PM community and social
                media channels.
              </Text>

              <Text style={styles.bullet}>🚀 PMA Power Skills</Text>
              <Text style={styles.modalTextSmall}>
                Designed for existing product managers to sharpen their product management skills,
                leadership skills, and executive presentation skills.
              </Text>

              <Text style={styles.bullet}>🚀 PMA Leader</Text>
              <Text style={styles.modalTextSmall}>
                We help you accelerate your product management career, get promoted to Director and
                product executive levels, and win in the board room.
              </Text>

              <Text style={styles.bullet}>🚀 1:1 Resume Review</Text>
              <Text style={styles.modalTextSmall}>
                We help you rewrite your killer product manager resume to stand out from the crowd,
                with an interview guarantee. Get started by using our FREE killer PM resume
                template.
              </Text>

              <View style={styles.linkRow}>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => openUrl("https://www.drnancyli.com/pmresume")}
                >
                  <Ionicons name="link-outline" size={16} color="#0b1d33" />
                  <Text style={styles.linkButtonText}>Resume Template</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => openUrl("https://www.youtube.com/c/drnancyli")}
                >
                  <Ionicons name="logo-youtube" size={16} color="#0b1d33" />
                  <Text style={styles.linkButtonText}>YouTube</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => openUrl("https://www.instagram.com/drnancyli")}
                >
                  <Ionicons name="logo-instagram" size={16} color="#0b1d33" />
                  <Text style={styles.linkButtonText}>Instagram</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <Pressable style={styles.modalClose} onPress={() => setInfoOpen(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    backgroundColor: "#25292e",
    padding: 16,
    alignItems: "center",
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 2,
  },
  subtitle: {
    color: "#c9d4e0",
    fontSize: 14,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 8,
  },
  locButton: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  infoButton: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  error: { color: "#ff7a7a", marginTop: 16 },
  resultsList: {
    width: "100%",
    marginTop: 20,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 16,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#f2f8ff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    maxHeight: "80%",
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0b1d33",
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  modalText: { color: "#0b1d33", fontSize: 14, lineHeight: 20 },
  modalTextSmall: { color: "#0b1d33", fontSize: 13, lineHeight: 19 },
  bullet: { color: "#0b1d33", fontSize: 14, fontWeight: "800", marginTop: 6 },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  linkButton: {
    backgroundColor: "#e9eef7",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  linkButtonText: { color: "#0b1d33", fontSize: 13, fontWeight: "700" },
  modalClose: {
    backgroundColor: "#0b1d33",
    paddingVertical: 12,
    alignItems: "center",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  modalCloseText: { color: "#fff", fontWeight: "700" },
});
