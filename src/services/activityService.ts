import { API_CONFIG } from "../config/api";
import { apiRequest } from "./apiClient";
import type { ActivityResult, ActivitySearchRequest } from "../types/search";

export async function searchActivities(
  request: ActivitySearchRequest
): Promise<ActivityResult[]> {
  const radiusMeters = request.radius ?? 3000;

  const params = new URLSearchParams({
    lat: String(request.lat),
    lon: String(request.lon),
    radiusMeters: String(radiusMeters),
  });

  return apiRequest<ActivityResult[]>(
    `${API_CONFIG.baseUrl}/pois/v2/activities/geoapify?${params.toString()}`,
    {
      method: "GET",
    }
  );
}