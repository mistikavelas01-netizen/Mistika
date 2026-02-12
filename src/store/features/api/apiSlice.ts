import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getStoredToken } from "@/lib/auth/client";

const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
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
  tagTypes: [
    "Products",
    "Orders",
    "Categories",
    "Cart",
    // Add more tag types as needed
  ],
  endpoints: () => ({}), // Empty initially - endpoints injected later
});
