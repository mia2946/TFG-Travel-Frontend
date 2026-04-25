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
    method: getMethod("VITE_ACCOMMODATIONS_METHOD", "POST"),
  } satisfies EndpointConfig,

  activities: {
    path: getEnv("VITE_ACTIVITIES_PATH", "/api/activities/search"),
    method: getMethod("VITE_ACTIVITIES_METHOD", "POST"),
  } satisfies EndpointConfig,

  transport: {
    path: getEnv("VITE_TRANSPORT_PATH", "/api/transport/search"),
    method: getMethod("VITE_TRANSPORT_METHOD", "POST"),
  } satisfies EndpointConfig,

  pois: {
    path: getEnv("VITE_POIS_PATH", "/api/pois/search"),
    method: getMethod("VITE_POIS_METHOD", "POST"),
  } satisfies EndpointConfig,
};