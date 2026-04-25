import { API_CONFIG } from "../config/api";
import { apiRequest } from "./apiClient";
import type { TransportResult, TransportSearchRequest } from "../types/search";

export async function searchTransport(
  request: TransportSearchRequest
): Promise<TransportResult[]> {
  const endpoint = API_CONFIG.transport;
  const url = `${API_CONFIG.baseUrl}${endpoint.path}`;

  return apiRequest<TransportResult[]>(url, {
    method: endpoint.method,
    body: request,
  });
}