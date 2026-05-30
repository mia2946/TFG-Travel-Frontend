import { API_CONFIG } from "../config/api";
import type { FlightSearchRequest, FlightsApiResponse } from "../types/search";

export async function searchFlights(
  request: FlightSearchRequest
): Promise<FlightsApiResponse> {
  const url = new URL(`${API_CONFIG.baseUrl}/api/flights/search`);

  url.searchParams.append("departureId", request.departureId);
  url.searchParams.append("arrivalId", request.arrivalId);
  url.searchParams.append("outboundDate", request.outboundDate);

  if (request.returnDate) {
    url.searchParams.append("returnDate", request.returnDate);
  }

  url.searchParams.append("currency", request.currency ?? "EUR");
  url.searchParams.append("hl", request.hl ?? "es");
  url.searchParams.append("gl", request.gl ?? "es");
  url.searchParams.append("type", String(request.type ?? 2));
  url.searchParams.append("travelClass", String(request.travelClass ?? 1));
  url.searchParams.append("sortBy", String(request.sortBy ?? 1));
  url.searchParams.append("showHidden", String(request.showHidden ?? false));
  url.searchParams.append("deepSearch", String(request.deepSearch ?? false));

  const response = await fetch(url.toString(), {
    method: "GET",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Could not search flights.");
  }

  return response.json();
}

export async function addFlightToTravel(
  userId: number,
  travelId: number,
  payload: unknown
) {
  const response = await fetch(
    `${API_CONFIG.baseUrl}/flights/${userId}/${travelId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Could not add flight to travel.");
  }

  return response.json();
}