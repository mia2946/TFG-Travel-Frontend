import { API_CONFIG } from "../config/api";
import { apiRequest } from "./apiClient";
import type {
  AccommodationResult,
  AccommodationSearchRequest,
} from "../types/search";

export async function searchAccommodations(
  request: AccommodationSearchRequest
): Promise<AccommodationResult[]> {
  const params = new URLSearchParams({
    lat: String(request.lat ?? ""),
    lon: String(request.lon ?? ""),
    radius: String(request.radius ?? 5000),
    limit: String(request.limit ?? 20),
  });

  const url = `${API_CONFIG.baseUrl}${API_CONFIG.accommodations.path}?${params.toString()}`;

  return apiRequest<AccommodationResult[]>(url, {
    method: "GET",
  });
}
