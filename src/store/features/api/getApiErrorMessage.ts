import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

export function getApiErrorMessage(
  error: FetchBaseQueryError | SerializedError | undefined
) {
  if (!error) return undefined;

  if ("status" in error) {
    const data = error.data as ApiErrorPayload | string | undefined;
    if (typeof data === "string") return data;
    if (data?.message || data?.error) {
      return data.message || data.error;
    }
    if ("error" in error && typeof error.error === "string") {
      return error.error;
    }
    return "Ocurrió un error inesperado.";
  }

  return error.message || "Ocurrió un error inesperado.";
}
