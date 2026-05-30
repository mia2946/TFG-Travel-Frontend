import { API_CONFIG } from "../config/api";

export type TransportRouteRequest = {
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
};

export async function searchPublicTransportRoute(
  request: TransportRouteRequest
) {
  const response = await fetch(
    `${API_CONFIG.baseUrl}/transport/routes/public`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Could not search public transport route.");
  }

  const data = await response.json();

  if (!data?.features || data.features.length === 0) {
    throw new Error("No public transport route found.");
  }

  return data;
}

export async function searchTransportPois(
  lat: number | string,
  lon: number | string,
  radiusMeters: number
) {
  const url = new URL(`${API_CONFIG.baseUrl}/pois/transport`);

  url.searchParams.append("lat", String(lat));
  url.searchParams.append("lon", String(lon));
  url.searchParams.append("radiusMeters", String(radiusMeters));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Could not retrieve transport POIs.");
  }

  const data = await response.json();

  return data?.data || [];
}

export async function addTransportRouteToTravel(
  userId: number,
  travelId: number,
  payload: unknown
) {
  const response = await fetch(
    `${API_CONFIG.baseUrl}/transport/${userId}/${travelId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Could not add transport route to travel.");
  }

  return response.json();
}