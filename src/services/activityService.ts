import { API_CONFIG } from "../config/api";
import { apiRequest } from "./apiClient";
import type { ActivityResult, ActivitySearchRequest } from "../types/search";

export async function searchActivities(
  request: ActivitySearchRequest
): Promise<ActivityResult[]> {
  const endpoint = API_CONFIG.activities;
  const url = `${API_CONFIG.baseUrl}${endpoint.path}`;

  return apiRequest<ActivityResult[]>(url, {
    method: endpoint.method,
    body: request,
  });
}