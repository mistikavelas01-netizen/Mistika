import { ENVIRONMENT, STACK_SAMPLE_RATE } from "./config";
import { buildErrorDetails, logger } from "./logger";

export class HttpError extends Error {
  statusCode: number;
  code?: string;
  expose: boolean;

  constructor(message: string, statusCode = 500, code?: string, expose = false) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
    this.expose = expose;
  }
}

export type NormalizedError = {
  statusCode: number;
  code: string;
  message: string;
  details: Record<string, unknown>;
};

const isZodError = (error: unknown): error is { name?: string; issues?: unknown[] } => {
  const err = error as { name?: string; issues?: unknown[] } | null;
  return !!err && err.name === "ZodError" && Array.isArray(err.issues);
};

const normalizeStatusCode = (value: unknown) => {
  if (typeof value === "number" && value >= 400 && value <= 599) return value;
  return undefined;
};

export const shouldIncludeStack = () =>
  ENVIRONMENT !== "production" || Math.random() < STACK_SAMPLE_RATE;

export const normalizeError = (error: unknown): NormalizedError => {
  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      code: error.code || "HTTP_ERROR",
      message: error.expose ? error.message : "Error interno del servidor",
      details: buildErrorDetails(error, shouldIncludeStack()),
    };
  }

  if (isZodError(error)) {
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Solicitud inválida",
      details: buildErrorDetails(error, false),
    };
  }

  const err = error as { status?: number; statusCode?: number; code?: string | number; message?: string } | null;
  const status = normalizeStatusCode(err?.status) ?? normalizeStatusCode(err?.statusCode) ?? 500;
  const code = typeof err?.code === "string" ? err.code : err?.code ? String(err.code) : "INTERNAL_ERROR";
  return {
    statusCode: status,
    code,
    message: status >= 500 ? "Error interno del servidor" : err?.message || "Solicitud inválida",
    details: buildErrorDetails(error, shouldIncludeStack()),
  };
};

export const logError = (event: string, error: unknown, fields: Record<string, unknown> = {}) => {
  const normalized = normalizeError(error);
  logger.error(event, {
    ...fields,
    error: normalized.details,
    errorCode: normalized.code,
    statusCode: normalized.statusCode,
  });
  return normalized;
};
