import { NextRequest } from "next/server";

const REQUEST_ID_HEADERS = ["x-request-id", "x-correlation-id"] as const;

export const getIncomingRequestId = (request: NextRequest): string | undefined => {
  for (const header of REQUEST_ID_HEADERS) {
    const value = request.headers.get(header);
    if (value) return value;
  }
  return undefined;
};

export const generateRequestId = () => {
  const cryptoAny = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (cryptoAny?.randomUUID) return cryptoAny.randomUUID();
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const maskIpv4 = (ip: string) => {
  const parts = ip.split(".");
  if (parts.length !== 4) return ip;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
};

const maskIpv6 = (ip: string) => {
  const parts = ip.split(":");
  return `${parts.slice(0, 3).join(":")}::`;
};

export const redactIp = (ip: string | null | undefined): string | undefined => {
  if (!ip) return undefined;
  const trimmed = ip.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes(".")) return maskIpv4(trimmed);
  if (trimmed.includes(":")) return maskIpv6(trimmed);
  return undefined;
};

export const getClientIp = (request: NextRequest): string | undefined => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return undefined;
};

export const sanitizeReferer = (referer: string | null): string | undefined => {
  if (!referer) return undefined;
  try {
    const url = new URL(referer);
    return `${url.origin}${url.pathname}`;
  } catch {
    return undefined;
  }
};

export const getPathname = (request: NextRequest) => request.nextUrl.pathname;
