import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getStoredToken } from "@/lib/auth/client";

/**
 * Fetch que evita "Unexpected end of JSON input" cuando el servidor devuelve body vacío o no-JSON.
 * Lee el body como texto; si está vacío y se espera JSON, devuelve "{}".
 */
async function safeFetchFn(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, init);
  const text = await res.text();
  const isJson =
    res.headers.get("content-type")?.includes("application/json") ?? false;
  const body =
    text.trim() === ""
      ? (isJson ? "{}" : text)
      : text;
  return new Response(body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  fetchFn: safeFetchFn,
  prepareHeaders: (headers) => {
    // Add admin token to headers if available
    const token = getStoredToken();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ["Products", "Orders", "Categories", "Cart", "Webhooks"],
  endpoints: () => ({}), // Empty initially - endpoints injected later
});
