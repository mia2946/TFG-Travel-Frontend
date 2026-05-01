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

export async function searchTransportPois(
  lat: string | number,
  lon: string | number,
  radius: string | number
): Promise<any[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    radius: String(radius),
  });

  const data = await apiRequest<any>(
    `${API_CONFIG.baseUrl}/pois/v2/transport-pois?${params.toString()}`,
    {
      method: "GET",
    }
  );

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.elements)) return data.elements;
  if (Array.isArray(data?.features)) return data.features;

  return [];
}