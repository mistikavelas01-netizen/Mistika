export type LogLevel = "debug" | "info" | "warn" | "error";

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const SERVICE_NAME = process.env.SERVICE_NAME || "mistika-api";
export const ENVIRONMENT = process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown";

export const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) ||
  (ENVIRONMENT === "production" ? "info" : "debug");

export const SLOW_REQUEST_MS = parseNumber(process.env.SLOW_REQUEST_MS, 800);
export const SLOW_DEPENDENCY_MS = parseNumber(process.env.SLOW_DEPENDENCY_MS, 500);

export const SUCCESS_LOG_SAMPLE_RATE = clamp01(
  parseNumber(process.env.LOG_SUCCESS_SAMPLE_RATE, 0.1)
);

export const STACK_SAMPLE_RATE = clamp01(
  parseNumber(process.env.LOG_STACK_SAMPLE_RATE, ENVIRONMENT === "production" ? 0.01 : 1)
);

export const MAX_LOG_STRING_LENGTH = parseNumber(process.env.LOG_MAX_STRING_LENGTH, 1000);
export const MAX_STACK_LENGTH = parseNumber(process.env.LOG_MAX_STACK_LENGTH, 3000);

export const METRICS_ENABLED = process.env.METRICS_ENABLED === "true";
