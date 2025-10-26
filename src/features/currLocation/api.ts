/*
Get's user's current location using Expo Location API
Returns lat/lng coordinates

*/

import * as Location from "expo-location";

export async function getUserLocation() {
  try {
    // Ask for permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permission to access location was denied");
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    const { latitude, longitude } = location.coords;
    return { lat: latitude, lng: longitude };
  } catch (err) {
    console.error("Error getting user location:", err);
    throw err;
  }
}