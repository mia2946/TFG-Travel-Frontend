import { API_CONFIG } from "../config/api";
import { apiRequest } from "./apiClient";
import { getSession } from "./authService";
import type {
  RouteSearchResponse,
  RouteSearchResult,
  SavedRoute,
  SaveRouteRequest,
  StoredRoute,
} from "../types/route";

type BackendRouteRequest = {
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
};

export async function searchRoute(
  request: BackendRouteRequest
): Promise<RouteSearchResult> {
  const response = await fetch(`${API_CONFIG.baseUrl}/transport/routes/public`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Error searching route: ${response.status}`);
  }

  const rawData = await response.json();
  const feature = rawData.features?.[0];

  if (!feature) {
    throw new Error("No route found");
  }

  let coordinates: [number, number][] = [];

  if (feature.geometry?.type === "MultiLineString") {
    coordinates = feature.geometry.coordinates.flatMap(
      (line: [number, number][]) => line
    );
  } else {
    coordinates = feature.geometry.coordinates;
  }

  const steps =
    feature.properties?.legs?.flatMap((leg: any) =>
      leg.steps?.map((step: any) => ({
        instruction: step.instruction?.text ?? "Continue",
        distanceMeters: step.distance ?? 0,
        durationSeconds: step.time ?? 0,
      }))
    ) ?? [];

  const route: RouteSearchResponse = {
    distanceMeters: feature.properties?.distance ?? 0,
    durationSeconds: feature.properties?.time ?? 0,
    geometry: { type: "LineString", coordinates },
    steps,
  };

  return { route, rawData };
}

export async function saveRoute(
  travelId: number,
  payload: SaveRouteRequest
): Promise<SavedRoute> {
  const user = getSession();
  if (!user) throw new Error("User not logged");

  return apiRequest<SavedRoute>(
    `${API_CONFIG.baseUrl}/routes/${user.id}/${travelId}`,
    { method: "POST", body: payload }
  );
}

export async function getRoute(
  travelId: number,
  transportId: number
): Promise<StoredRoute> {
  const user = getSession();
  if (!user) throw new Error("User not logged");

  const response = await fetch(
    `${API_CONFIG.baseUrl}/routes/${user.id}/${travelId}/${transportId}`,
    { method: "GET", headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    throw new Error(`Error fetching route: ${response.status}`);
  }

  return response.json();
}
