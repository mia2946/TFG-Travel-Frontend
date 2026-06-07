import type { TravelPlan } from "../types/travel";
import { getSession } from "./authService";
import { API_CONFIG } from "../config/api";
import { apiRequest } from "./apiClient";

export async function getTravelPlans(): Promise<TravelPlan[]> {
  const user = getSession();

  if (!user) {
    throw new Error("User not logged");
  }

  const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.travels.path}/${user.id}`, {
    method: API_CONFIG.travels.method,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching travels: ${response.status}`);
  }

  return await response.json();
}

export async function deleteTravelPlan(travelId: number): Promise<void> {
  const user = getSession();

  if (!user) {
    throw new Error("User not logged");
  }

  const response = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.travels.path}/${user.id}/${travelId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(`Error deleting travel: ${response.status}`);
  }
}

export async function createTravelPlan(name: string): Promise<TravelPlan> {
  const user = getSession();

  if (!user) {
    throw new Error("User not logged");
  }

  return apiRequest<TravelPlan>(
    `${API_CONFIG.baseUrl}${API_CONFIG.travels.path}/${user.id}`,
    {
      method: "POST",
      body: {
        userId: user.id,
        name,
        startDate: "2026-06-12",
        endDate: "2026-06-15",
        description: name,
      },
    }
  );
}

export async function addAccommodationToTravel(
  travelId: number,
  accommodation: any
): Promise<any> {
  const user = getSession();

  if (!user) {
    throw new Error("User not logged");
  }

  const response = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.accommodationsSave.path}/${user.id}/${travelId}`,
    {
      method: API_CONFIG.accommodationsSave.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(accommodation),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error saving accommodation: ${response.status} ${text}`);
  }

  return await response.json();
}

export async function addActivityToTravel(
  travelId: number,
  activity: any
): Promise<any> {
  const user = getSession();

  if (!user) {
    throw new Error("User not logged");
  }

  const response = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.activitiesSave.path}/${user.id}/${travelId}`,
    {
      method: API_CONFIG.activitiesSave.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(activity),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error saving activity: ${response.status} ${text}`);
  }

  return await response.json();
}

export async function addPoiToTravel(
  travelId: number,
  poi: any
): Promise<any> {
  const user = getSession();

  if (!user) {
    throw new Error("User not logged");
  }

  const response = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.pois.save.path}/${user.id}/${travelId}`,
    {
      method: API_CONFIG.pois.save.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(poi),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error saving POI: ${response.status} ${text}`);
  }

  return await response.json();
}

export async function deleteAccommodationFromTravel(
  travelId: number,
  accommodationId: number
): Promise<void> {
  const user = getSession();
  if (!user) throw new Error("User not logged");
  const response = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.accommodationsSave.path}/${user.id}/${travelId}/${accommodationId}`,
    { method: "DELETE" }
  );
  if (!response.ok) throw new Error(`Error deleting accommodation: ${response.status}`);
}

export async function deleteActivityFromTravel(
  travelId: number,
  activityId: number
): Promise<void> {
  const user = getSession();
  if (!user) throw new Error("User not logged");
  const response = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.activitiesSave.path}/${user.id}/${travelId}/${activityId}`,
    { method: "DELETE" }
  );
  if (!response.ok) throw new Error(`Error deleting activity: ${response.status}`);
}

export async function deletePoiFromTravel(
  travelId: number,
  poiId: number
): Promise<void> {
  const user = getSession();
  if (!user) throw new Error("User not logged");
  const response = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.pois.save.path}/${user.id}/${travelId}/${poiId}`,
    { method: "DELETE" }
  );
  if (!response.ok) throw new Error(`Error deleting POI: ${response.status}`);
}

export async function deleteFlightFromTravel(
  travelId: number,
  flightId: number
): Promise<void> {
  const user = getSession();
  if (!user) throw new Error("User not logged");
  const response = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.flightsSave.path}/${user.id}/${travelId}/${flightId}`,
    { method: "DELETE" }
  );
  if (!response.ok) throw new Error(`Error deleting flight: ${response.status}`);
}

export async function deleteTransportFromTravel(
  travelId: number,
  transportId: number
): Promise<void> {
  const user = getSession();
  if (!user) throw new Error("User not logged");
  const response = await fetch(
    `${API_CONFIG.baseUrl}/transports/${user.id}/${travelId}/${transportId}`,
    { method: "DELETE" }
  );
  if (!response.ok) throw new Error(`Error deleting transport: ${response.status}`);
}