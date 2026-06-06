import { API_CONFIG } from "../config/api";

export type AirportResponse = {
  name?: string;
  iata?: string;
  icao?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
};

export type AirportRouteableResponse = {
  name?: string;
  iata?: string;
  latitude?: number;
  longitude?: number;
  originalLatitude?: number;
  originalLongitude?: number;
  routePointName?: string;
};

// Resolves an IATA code to basic display coordinates (centroid only, fast).
export async function getAirportCoordinates(
  iata: string
): Promise<AirportResponse | null> {
  try {
    const url = `${API_CONFIG.baseUrl}/api/airports/coordinates?iata=${encodeURIComponent(iata)}`;
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Resolves an IATA code to routeable coordinates (nearest transport access point via Overpass).
// Used only at route search time, not for combobox display.
export async function getRouteableAirportCoordinates(
  iata: string
): Promise<AirportRouteableResponse | null> {
  try {
    const url = `${API_CONFIG.baseUrl}/api/airports/routeable-coordinates?iata=${encodeURIComponent(iata)}`;
    console.log(`[airport] routeable-coordinates lookup: iata=${iata}`);
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function getAirportsByCoordinates(
  lat: number,
  lon: number
): Promise<AirportResponse[]> {
  const url = new URL(`${API_CONFIG.baseUrl}${API_CONFIG.airports.path}`);

  url.searchParams.append("lat", String(lat));
  url.searchParams.append("lon", String(lon));

  const response = await fetch(url.toString(), {
    method: "GET",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Could not retrieve nearby airports.");
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data.filter((airport) => airport.iata);
  }

  if (Array.isArray(data?.airports)) {
    return data.airports.filter((airport: AirportResponse) => airport.iata);
  }

  if (data?.iata) {
    return [data];
  }

  return [];
}