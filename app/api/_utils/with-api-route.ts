import { NextRequest, NextResponse } from "next/server";
import { SUCCESS_LOG_SAMPLE_RATE, SLOW_REQUEST_MS } from "./config";
import { logError } from "./errors";
import { getClientIp, getIncomingRequestId, getPathname, generateRequestId, redactIp, sanitizeReferer } from "./http";
import { logger } from "./logger";
import { incCounter, observeHistogram } from "./metrics";
import { runWithRequestContext } from "./request-context";

export type ApiHandler<TContext = unknown> = (
  request: NextRequest,
  context: TContext
) => Promise<Response>;

export type ApiRouteOptions = {
  route: string;
};

const nowMs = () => Date.now();

const shouldSampleSuccess = () => Math.random() < SUCCESS_LOG_SAMPLE_RATE;

export const withApiRoute = <TContext>(
  options: ApiRouteOptions,
  handler: ApiHandler<TContext>
) => {
  return async (request: NextRequest, context: TContext): Promise<Response> => {
    const requestId = getIncomingRequestId(request) || generateRequestId();
    const method = request.method;
    const path = getPathname(request);
    const route = options.route;

    const userAgent = request.headers.get("user-agent") || undefined;
    const referer = sanitizeReferer(request.headers.get("referer"));
    const ip = redactIp(getClientIp(request));

    const start = nowMs();
    let slowLogged = false;
    const slowTimer = setTimeout(() => {
      slowLogged = true;
      logger.warn("request.slow", {
        statusCode: undefined,
        durationMs: nowMs() - start,
        http: {
          userAgent,
          ip,
          referer,
        },
      });
    }, SLOW_REQUEST_MS);

    const run = async () => {
      if (logger.debug) {
        logger.debug("request.start", {
          http: {
            userAgent,
            ip,
            referer,
          },
        });
      }

      try {
        const response = await handler(request, context);
        clearTimeout(slowTimer);
        const durationMs = nowMs() - start;
        const statusCode = response?.status ?? 200;
        let finalResponse = response;

        if (
          statusCode >= 400 &&
          response?.headers?.get("content-type")?.includes("application/json")
        ) {
          try {
            const payload = await response.clone().json();
            if (payload && typeof payload === "object" && !("requestId" in payload)) {
              finalResponse = NextResponse.json(
                { ...payload, requestId },
                { status: statusCode, headers: response.headers }
              );
            }
          } catch {
            // If body isn't JSON, leave response as-is.
          }
        }
        const sampledSuccess = statusCode < 400 ? shouldSampleSuccess() : true;

        const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : sampledSuccess ? "info" : "debug";

        logger[level]("request.end", {
          statusCode,
          durationMs,
          slow: slowLogged || durationMs >= SLOW_REQUEST_MS,
          http: {
            userAgent,
            ip,
            referer,
          },
        });

        observeHistogram("request_duration_ms", durationMs, { route, status: statusCode });
        incCounter("requests_total", { route, status: statusCode });
        if (statusCode >= 400) {
          incCounter("errors_total", { code: statusCode, route });
        }

        if (finalResponse && finalResponse.headers) {
          finalResponse.headers.set("x-request-id", requestId);
        }
        return finalResponse;
      } catch (error) {
        clearTimeout(slowTimer);
        const durationMs = nowMs() - start;
        const normalized = logError("request.error", error, { durationMs });

        observeHistogram("request_duration_ms", durationMs, { route, status: normalized.statusCode });
        incCounter("requests_total", { route, status: normalized.statusCode });
        incCounter("errors_total", { code: normalized.code, route });

        const response = NextResponse.json(
          { error: normalized.message, code: normalized.code, requestId },
          { status: normalized.statusCode }
        );
        response.headers.set("x-request-id", requestId);
        return response;
      }
    };

    return runWithRequestContext(
      {
        requestId,
        method,
        path,
        route,
      },
      run
    );
  };
};
