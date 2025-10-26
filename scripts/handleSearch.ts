/*
Our "on search func" 
    1. Takes in user input (city name, zip code, landmark)
    2. Uses geocoding API to get the address + lat/lng
    3. Returns an array of possible matches (GeocodeHit[])
    We will display these as cards for the user to select the correct one if multiple are returned
*/

import { geocode } from "@/src/features/geocode/api";

/**
 * Fetches all possible geocoding results for a search query.
 * Each result includes formatted address and coordinates.
 * @param query - User input (city, zip, landmark)
 * @returns GeocodeHit[]
 */
export async function handleSearch(query: string) {
  if (!query.trim()) throw new Error("Search query cannot be empty.");

  const hits = await geocode(query);

  if (!hits.length) throw new Error("No results found.");

  // Each hit already includes address + lat + lng
  return hits;
}

