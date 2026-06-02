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
    `${API_CONFIG.baseUrl}${API_CONFIG.transport.path}`,
    {
      method: API_CONFIG.transport.method,
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
  const url = new URL(`${API_CONFIG.baseUrl}${API_CONFIG.pois.transport.path}`);

  url.searchParams.append("lat", String(lat));
  url.searchParams.append("lon", String(lon));
  url.searchParams.append("radiusMeters", String(radiusMeters));

  const response = await fetch(url.toString(), {
    method: API_CONFIG.pois.transport.method,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Could not retrieve transport POIs.");
  }

  const data = await response.json();

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.elements)) return data.elements;
  if (Array.isArray(data?.features)) return data.features;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export async function addTransportRouteToTravel(
  userId: number,
  travelId: number,
  payload: unknown
) {
  const response = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.transportSave.path}/${userId}/${travelId}`,
    {
      method: API_CONFIG.transportSave.method,
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