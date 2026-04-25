import type { HttpMethod } from "../config/api";

type RequestOptions = {
  method: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiRequest<TResponse>(
  url: string,
  options: RequestOptions
): Promise<TResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method,
    headers,
    body:
      options.method === "GET" || options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP ${response.status} - ${response.statusText}: ${errorText}`
    );
  }

  return response.json() as Promise<TResponse>;
}