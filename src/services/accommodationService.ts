import { API_CONFIG } from "../config/api";
import { apiRequest } from "./apiClient";
import type {
  AccommodationResult,
  AccommodationSearchRequest,
} from "../types/search";

export async function searchAccommodations(
  request: AccommodationSearchRequest
): Promise<AccommodationResult[]> {
  const endpoint = API_CONFIG.accommodations;
  const url = `${API_CONFIG.baseUrl}${endpoint.path}`;

  return apiRequest<AccommodationResult[]>(url, {
    method: endpoint.method,
    body: request,
  });
}