import { API_CONFIG } from "../config/api";
import { apiRequest } from "./apiClient";
import type { PoiResult, PoiSearchRequest } from "../types/search";

export async function searchPois(
  request: PoiSearchRequest
): Promise<PoiResult[]> {
  const endpoint = API_CONFIG.pois;
  const url = `${API_CONFIG.baseUrl}${endpoint.path}`;

  return apiRequest<PoiResult[]>(url, {
    method: endpoint.method,
    body: request,
  });
}