import type { TravelPlan } from "../types/travel";
import { getSession } from "./authService";
import { API_CONFIG } from "../config/api";
import { apiRequest } from "./apiClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TRAVELS_PATH = "/travels";

export async function getTravelPlans(): Promise<TravelPlan[]> {
  const user = getSession();

  if (!user) {
    throw new Error("User not logged");
  }

  const response = await fetch(`${API_BASE_URL}${TRAVELS_PATH}/${user.id}`, {
    method: "GET",
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
    `${API_BASE_URL}${TRAVELS_PATH}/${user.id}/${travelId}`,
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
    `${API_CONFIG.baseUrl}/travels/${user.id}`,
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

export async function addPoiToTravel(
  travelId: number,
  poi: any
): Promise<any> {
  const user = getSession();

  if (!user) {
    throw new Error("User not logged");
  }

  const response = await fetch(
    `${API_CONFIG.baseUrl}/pois/${user.id}/${travelId}`,
    {
      method: "POST",
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