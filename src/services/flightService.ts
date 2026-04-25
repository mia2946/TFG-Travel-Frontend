import { API_CONFIG } from "../config/api";
import { apiRequest } from "./apiClient";
import type { FlightResult, FlightSearchRequest } from "../types/search";

export async function searchFlights(
  request: FlightSearchRequest
): Promise<FlightResult[]> {
  const endpoint = API_CONFIG.flights;
  const url = `${API_CONFIG.baseUrl}${endpoint.path}`;

  return apiRequest<FlightResult[]>(url, {
    method: endpoint.method,
    body: request,
  });
}