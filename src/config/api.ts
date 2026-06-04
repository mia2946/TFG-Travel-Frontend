export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type EndpointConfig = {
  path: string;
  method: HttpMethod;
};

function getEnv(name: string, fallback = ""): string {
  return import.meta.env[name] || fallback;
}

function getMethod(name: string, fallback: HttpMethod = "POST"): HttpMethod {
  const value = (import.meta.env[name] || fallback).toUpperCase();

  if (
    value === "GET" ||
    value === "POST" ||
    value === "PUT" ||
    value === "DELETE" ||
    value === "PATCH"
  ) {
    return value;
  }

  return fallback;
}

export const API_CONFIG = {
  baseUrl: getEnv("VITE_API_BASE_URL", "http://localhost:8080"),

  flights: {
    path: getEnv("VITE_FLIGHTS_PATH", "/api/flights/search"),
    method: getMethod("VITE_FLIGHTS_METHOD", "POST"),
  } satisfies EndpointConfig,

  accommodations: {
    path: getEnv("VITE_ACCOMMODATIONS_PATH", "/api/accommodations/search"),
    method: getMethod("VITE_ACCOMMODATIONS_METHOD", "GET"),
  } satisfies EndpointConfig,

  accommodationsSave: {
    path: getEnv("VITE_ACCOMMODATIONS_SAVE_PATH", "/accommodations"),
    method: getMethod("VITE_ACCOMMODATIONS_SAVE_METHOD", "POST"),
  } satisfies EndpointConfig,

  activities: {
    path: getEnv("VITE_ACTIVITIES_PATH", "/api/activities/search"),
    method: getMethod("VITE_ACTIVITIES_METHOD", "POST"),
  } satisfies EndpointConfig,

  activitiesSave: {
    path: getEnv("VITE_ACTIVITIES_SAVE_PATH", "/activities"),
    method: getMethod("VITE_ACTIVITIES_SAVE_METHOD", "POST"),
  } satisfies EndpointConfig,

  transport: {
    path: getEnv("VITE_TRANSPORT_PATH", "/api/transport/search"),
    method: getMethod("VITE_TRANSPORT_METHOD", "POST"),
  } satisfies EndpointConfig,

  pois: {
    foodDrink: {
      path: getEnv("VITE_POIS_FOOD_DRINK_PATH", "/pois/v2/food-drink/details"),
      method: getMethod("VITE_POIS_FOOD_DRINK_METHOD", "GET"),
    } satisfies EndpointConfig,

    transport: {
      path: getEnv("VITE_POIS_TRANSPORT_PATH", "/pois/v2/transport-pois"),
      method: getMethod("VITE_POIS_TRANSPORT_METHOD", "GET"),
    } satisfies EndpointConfig,

    amenities: {
      path: getEnv("VITE_POIS_AMENITIES_PATH", "/pois/v2/amenities"),
      method: getMethod("VITE_POIS_AMENITIES_METHOD", "POST"),
    } satisfies EndpointConfig,

    embassies: {
      path: getEnv("VITE_POIS_EMBASSIES_PATH", "/pois/v2/embassies"),
      method: getMethod("VITE_POIS_EMBASSIES_METHOD", "POST"),
    } satisfies EndpointConfig,

    save: {
      path: getEnv("VITE_POIS_SAVE_PATH", "/pois"),
      method: getMethod("VITE_POIS_SAVE_METHOD", "POST"),
    } satisfies EndpointConfig,
  },

  airports: {
    path: getEnv("VITE_AIRPORTS_PATH", "/api/airports/search"),
    method: getMethod("VITE_AIRPORTS_METHOD", "GET"),
  } satisfies EndpointConfig,

  travels: {
    path: getEnv("VITE_TRAVELS_PATH", "/travels"),
    method: getMethod("VITE_TRAVELS_METHOD", "GET"),
  } satisfies EndpointConfig,

  routes: {
    path: getEnv("VITE_ROUTES_PATH", "/routes"),
    method: getMethod("VITE_ROUTES_METHOD", "POST"),
  } satisfies EndpointConfig,

  flightsSave: {
    path: getEnv("VITE_FLIGHTS_SAVE_PATH", "/flights"),
    method: getMethod("VITE_FLIGHTS_SAVE_METHOD", "POST"),
  } satisfies EndpointConfig,

};