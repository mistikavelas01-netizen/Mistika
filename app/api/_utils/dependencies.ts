import { SLOW_DEPENDENCY_MS } from "./config";
import { logError } from "./errors";
import { incCounter, observeHistogram } from "./metrics";
import { logger } from "./logger";
import { getRequestContext } from "./request-context";

export type DependencyInfo = {
  name: string;
  operation: string;
  target?: string;
  method?: string;
  path?: string;
};

const nowMs = () => Date.now();

export const withDependency = async <T>(
  info: DependencyInfo,
  fn: () => Promise<T>
): Promise<T> => {
  const start = nowMs();
  try {
    const result = await fn();
    const durationMs = nowMs() - start;
    observeHistogram("external_call_duration_ms", durationMs, {
      dep: info.name,
      operation: info.operation,
    });
    incCounter("external_calls_total", { dep: info.name, status: "ok" });
    if (durationMs >= SLOW_DEPENDENCY_MS) {
      logger.warn("dependency.slow", {
        dependencyName: info.name,
        operation: info.operation,
        target: info.target,
        method: info.method,
        path: info.path,
        durationMs,
      });
    }
    return result;
  } catch (error) {
    const durationMs = nowMs() - start;
    observeHistogram("external_call_duration_ms", durationMs, {
      dep: info.name,
      operation: info.operation,
    });
    incCounter("external_calls_total", { dep: info.name, status: "error" });
    logError("dependency.error", error, {
      dependencyName: info.name,
      operation: info.operation,
      target: info.target,
      method: info.method,
      path: info.path,
      durationMs,
    });
    throw error;
  }
};

const stripQuery = (url: URL) => `${url.origin}${url.pathname}`;

const buildRequestHeaders = (init?: RequestInit) => {
  const headers = new Headers(init?.headers || {});
  const context = getRequestContext();
  if (context?.requestId && !headers.has("x-request-id")) {
    headers.set("x-request-id", context.requestId);
  }
  return headers;
};

export const fetchWithObservability = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  dependencyName = "http"
) => {
  const url = typeof input === "string" ? new URL(input) : input instanceof URL ? input : new URL(input.url);
  const method = (init?.method || "GET").toUpperCase();
  const path = url.pathname;
  const target = url.host;
  const operation = `${method} ${path}`;

  return withDependency(
    { name: dependencyName, operation, target, method, path },
    async () => {
      const response = await fetch(input, {
        ...init,
        headers: buildRequestHeaders(init),
      });

      if (response.status >= 400) {
        const level = response.status >= 500 ? "error" : "warn";
        logger[level]("dependency.http_status", {
          dependencyName,
          operation,
          target,
          method,
          path,
          status: response.status,
          url: stripQuery(url),
        });
      }

      return response;
    }
  );
};
