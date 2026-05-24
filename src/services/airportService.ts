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

export async function getAirportsByCoordinates(
  lat: number,
  lon: number
): Promise<AirportResponse[]> {
  const url = new URL(`${API_CONFIG.baseUrl}/api/airports/search`);

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