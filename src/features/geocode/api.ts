/*
GEOCODING API HANDLING 

INPUTS: Location query
ACCEPTABLE QUERY TYPES: 
| Query type                    | Example                                          | Result                                              |
| ----------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| **Zip / Postal code**         | `"94103"`                                        | Returns center of that zip code area                |
| **Landmark / Building / POI** | `"Eiffel Tower"` or `"Statue of Liberty"`        | Returns that exact place                            |
| **City or town name**         | `"San Francisco"`                                | Returns the city center                             |
| **Street address**            | `"1600 Amphitheatre Parkway, Mountain View, CA"` | Returns that precise address                        |
| **Partial address**           | `"Amphitheatre Pkwy, Mountain View"`             | Best-match geocoded location                        |
| **Neighborhood**              | `"SoHo, New York"`                               | Returns neighborhood center                         |
| **Country name**              | `"Japan"`                                        | Returns country center coordinates                  |
| **Coordinates (reverse)**     | `"40.714224,-73.961452"`                         | Returns a full address (reverse geocoding behavior) |


OUTPUT: GeocodeHit[]: Array of geocoded results with formatted address, place ID, and lat/lng
-> We can display this to the user and have them select which one is correct if multiple results are returned


*/




//reading the API key from app config
import Constants from "expo-constants";

const API_KEY = (Constants.expoConfig?.extra as any)?.googleMapsApiKey as string;

//defines the format of our output 
export type GeocodeHit = {
  formatted_address: string;
  place_id: string;
  location: { lat: number; lng: number };
};

//function to perform geocoding: any location -> lat/lng 



export async function geocode(query: string): Promise<GeocodeHit[]> {
    //what to do if API key is missing
  if (!API_KEY) throw new Error("Missing GOOGLE_MAPS_API_KEY in app config.");

  //creating our request URL
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json" +
    `?address=${encodeURIComponent(query)}` +
    `&key=${API_KEY}`;
    
    //making the network request
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Network error: ${res.status} ${res.statusText}`);

  const data = await res.json();

  // Common statuses: OK, ZERO_RESULTS, OVER_DAILY_LIMIT, REQUEST_DENIED, INVALID_REQUEST
  if (data.status !== "OK") {
    const msg = data.error_message || data.status || "Geocoding failed";
    throw new Error(msg);
  }

    //transforming the response to our GeocodeHit format
  return data.results.map((r: any) => ({
    formatted_address: r.formatted_address as string,
    place_id: r.place_id as string,
    location: {
        //the lat and lng are the most important, that is what we will use for both mapping and getting weather data 
      lat: r.geometry.location.lat as number, 
      lng: r.geometry.location.lng as number,
    },
  }));
}
