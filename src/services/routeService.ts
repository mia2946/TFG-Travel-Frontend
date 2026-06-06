import { API_CONFIG } from "../config/api";
import { apiRequest } from "./apiClient";
import { getSession } from "./authService";
import type {
  RouteSearchRequest,
  RouteSearchResponse,
  RouteSearchResult,
  SavedRoute,
  SaveRouteRequest,
  StoredRoute,
} from "../types/route";

export async function searchRoute(
  request: RouteSearchRequest
): Promise<RouteSearchResult> {
  const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.transport.path}`, {
    method: API_CONFIG.transport.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Error searching route: ${response.status}`);
  }

  const rawData = await response.json();
  console.log("route search raw response", rawData);

  let route: RouteSearchResponse;

  try {
    // Backend format: { totalDistanceMeters, totalTimeSeconds, geometryCoordinates, steps }
    // geometryCoordinates is a MultiLineString: [[[lon, lat], ...], ...]
    // TravelRouteMap swaps [lon, lat] → [lat, lon] itself, so store as [lon, lat].
    if (rawData.geometryCoordinates !== undefined || rawData.totalDistanceMeters !== undefined) {
      const geoCoords: [number, number][][] = Array.isArray(rawData.geometryCoordinates)
        ? rawData.geometryCoordinates
        : [];

      const coordinates: [number, number][] = geoCoords.flat();

      const steps = (rawData.steps ?? []).map((step: any) => ({
        instruction: step.instructionText ?? step.instruction ?? "Continue",
        distanceMeters: step.distanceMeters ?? 0,
        durationSeconds: step.timeSeconds ?? step.durationSeconds ?? 0,
      }));

      route = {
        distanceMeters: rawData.totalDistanceMeters ?? 0,
        durationSeconds: rawData.totalTimeSeconds ?? 0,
        geometry: { type: "LineString", coordinates },
        steps,
      };
    } else {
      // Geoapify raw GeoJSON format: { features: [{ geometry, properties }] }
      const feature = rawData.features?.[0];
      if (!feature) throw new Error("No route found in response");

      let coordinates: [number, number][] = [];
      if (feature.geometry?.type === "MultiLineString") {
        coordinates = feature.geometry.coordinates.flatMap(
          (line: [number, number][]) => line
        );
      } else {
        coordinates = feature.geometry?.coordinates ?? [];
      }

      const steps =
        feature.properties?.legs?.flatMap((leg: any) =>
          leg.steps?.map((step: any) => ({
            instruction: step.instruction?.text ?? "Continue",
            distanceMeters: step.distance ?? 0,
            durationSeconds: step.time ?? 0,
          }))
        ) ?? [];

      route = {
        distanceMeters: feature.properties?.distance ?? 0,
        durationSeconds: feature.properties?.time ?? 0,
        geometry: { type: "LineString", coordinates },
        steps,
      };
    }
  } catch (err) {
    console.error("Error mapping route response:", err, rawData);
    throw err;
  }

  console.log("mapped route", route);
  return { route, rawData };
}

export async function saveRoute(
  travelId: number,
  payload: SaveRouteRequest
): Promise<SavedRoute> {
  const user = getSession();
  if (!user) throw new Error("User not logged");

  return apiRequest<SavedRoute>(
    `${API_CONFIG.baseUrl}${API_CONFIG.routes.path}/${user.id}/${travelId}`,
    { method: API_CONFIG.routes.method, body: payload }
  );
}

export async function deleteRoute(
  travelId: number,
  routeId: number
): Promise<void> {
  const user = getSession();
  if (!user) throw new Error("User not logged");
  const response = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.routes.path}/${user.id}/${travelId}/${routeId}`,
    { method: "DELETE" }
  );
  if (!response.ok) throw new Error(`Error deleting route: ${response.status}`);
}

export async function getRoute(
  travelId: number,
  transportId: number
): Promise<StoredRoute> {
  const user = getSession();
  if (!user) throw new Error("User not logged");

  const response = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.routes.path}/${user.id}/${travelId}/${transportId}`,
    { method: "GET", headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    throw new Error(`Error fetching route: ${response.status}`);
  }

  return response.json();
}
