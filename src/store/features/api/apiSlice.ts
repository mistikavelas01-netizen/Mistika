import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import { getStoredToken } from "@/lib/auth/client";

const PUBLIC_REQUEST_HEADER = "x-public-request";

function cloneHeaders(headersInit?: FetchArgs["headers"]): Headers {
  const headers = new Headers();

  if (!headersInit) {
    return headers;
  }

  if (headersInit instanceof Headers) {
    headersInit.forEach((value, key) => {
      headers.set(key, value);
    });
    return headers;
  }

  if (Array.isArray(headersInit)) {
    for (const header of headersInit) {
      if (header.length >= 2) {
        headers.set(header[0], header[1] ?? "");
      }
    }
    return headers;
  }

  for (const [key, value] of Object.entries(headersInit)) {
    if (value !== undefined) {
      headers.set(key, value);
    }
  }

  return headers;
}

export function asPublicRequest(args: string | FetchArgs): FetchArgs {
  if (typeof args === "string") {
    return {
      url: args,
      headers: {
        [PUBLIC_REQUEST_HEADER]: "true",
      },
    };
  }

  const headers = cloneHeaders(args.headers);
  headers.set(PUBLIC_REQUEST_HEADER, "true");

  return {
    ...args,
    headers,
  };
}

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
    const isPublicRequest = headers.get(PUBLIC_REQUEST_HEADER) === "true";
    headers.delete(PUBLIC_REQUEST_HEADER);

    if (isPublicRequest) {
      return headers;
    }

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
  tagTypes: ["Products", "Orders", "Categories", "Cart", "Webhooks", "Carousel"],
  endpoints: () => ({}), // Empty initially - endpoints injected later
});
