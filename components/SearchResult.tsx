

/*
Will display a result card for each geocoding hit returned from our search
    Each card shows:
    - Overall name 
    - Formatted address

    OnClick: 
    - Pass lat/lng to fetch weather data
    - Navigate to WeatherDisplay screen 
    
*/

import type { GeocodeHit } from "@/src/features/geocode/api";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

//defining the props our ResultCard will accept

interface ResultCardProps {
  hit: GeocodeHit; //the geocoding hit to display
  onSelect: (hit: GeocodeHit) => void; //function thats called when user clicks this card 
}

export default function ResultCard({ hit, onSelect }: ResultCardProps) {
  // Split address to get a shorter "title"
  const name = hit.formatted_address.split(",")[0] ?? hit.formatted_address;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onSelect(hit)}>
      <View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.address}>{hit.formatted_address}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#333",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    width: "100%",
  },
  name: {
    color: "#ffd33d",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  address: {
    color: "#ccc",
    fontSize: 14,
  },
});