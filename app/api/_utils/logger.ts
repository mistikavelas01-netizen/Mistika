import { ENVIRONMENT, LOG_LEVEL, MAX_LOG_STRING_LENGTH, MAX_STACK_LENGTH, SERVICE_NAME, STACK_SAMPLE_RATE, type LogLevel } from "./config";
import { getRequestContext } from "./request-context";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const shouldLog = (level: LogLevel) => LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[LOG_LEVEL];

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi;
const JWT_REGEX = /eyJ[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+/g;
const BEARER_REGEX = /Bearer\s+[A-Za-z0-9._+\/-~]+=*/g;

const redactString = (value: string) =>
  value
    .replace(EMAIL_REGEX, "[redacted_email]")
    .replace(JWT_REGEX, "[redacted_token]")
    .replace(BEARER_REGEX, "Bearer [redacted]");

const truncate = (value: string, max: number) => {
  const redacted = redactString(value);
  return redacted.length > max ? `${redacted.slice(0, max)}...[truncated]` : redacted;
};

const sanitizeValue = (value: unknown, depth = 0): unknown => {
  if (value == null) return value;
  if (typeof value === "string") return truncate(value, MAX_LOG_STRING_LENGTH);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, depth + 1));
  if (typeof value === "object") {
    if (depth > 4) return "[MaxDepth]";
    const entries = Object.entries(value as Record<string, unknown>);
    const output: Record<string, unknown> = {};
    for (const [key, entry] of entries) {
      if (entry === undefined) continue;
      output[key] = sanitizeValue(entry, depth + 1);
    }
    return output;
  }
  return String(value);
};

const safeStringify = (payload: Record<string, unknown>) => {
  const seen = new WeakSet();
  return JSON.stringify(payload, (_key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  });
};

export const buildErrorDetails = (err: unknown, includeStack: boolean) => {
  if (!err) return { name: "Error", message: "Unknown error" };
  const error = err as { name?: string; message?: string; stack?: string; code?: string | number };
  const details: Record<string, unknown> = {
    name: error.name || "Error",
    message: error.message || "Unknown error",
  };
  if (error.code) details.code = error.code;
  if (includeStack && error.stack) {
    details.stack = truncate(error.stack, MAX_STACK_LENGTH);
  }
  return details;
};

export const logger = {
  debug: (event: string, fields: Record<string, unknown> = {}) => {
    if (!shouldLog("debug")) return;
    log("debug", event, fields);
  },
  info: (event: string, fields: Record<string, unknown> = {}) => {
    if (!shouldLog("info")) return;
    log("info", event, fields);
  },
  warn: (event: string, fields: Record<string, unknown> = {}) => {
    if (!shouldLog("warn")) return;
    log("warn", event, fields);
  },
  error: (event: string, fields: Record<string, unknown> = {}) => {
    if (!shouldLog("error")) return;
    log("error", event, fields);
  },
};

const shouldIncludeStack = () =>
  ENVIRONMENT !== "production" || Math.random() < STACK_SAMPLE_RATE;

const normalizeErrorField = (value: unknown) => {
  if (!value) return value;
  const includeStack = shouldIncludeStack();
  if (value instanceof Error) {
    return buildErrorDetails(value, includeStack);
  }
  if (typeof value === "object") {
    const err = value as { name?: string; message?: string; stack?: string; code?: string | number };
    if (err.message || err.stack) {
      const details = {
        name: err.name || "Error",
        message: err.message || "Unknown error",
      } as Record<string, unknown>;
      if (err.code) details.code = err.code;
      if (includeStack && err.stack) details.stack = truncate(err.stack, MAX_STACK_LENGTH);
      return details;
    }
  }
  return value;
};

const log = (level: LogLevel, event: string, fields: Record<string, unknown>) => {
  const context = getRequestContext();
  const payload: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    env: ENVIRONMENT,
    event,
  };

  if (context) {
    payload.requestId = context.requestId;
    payload.method = context.method;
    payload.path = context.path;
    if (context.route) payload.route = context.route;
  }

  const merged = { ...payload, ...fields };
  if ("error" in merged) {
    merged.error = normalizeErrorField(merged.error);
  }
  const sanitized = sanitizeValue(merged) as Record<string, unknown>;
  const line = safeStringify(sanitized);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
};
