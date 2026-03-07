"use client";

function normalizePublicUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getStoreUrlFromBrowser(): string {
  const configured =
    normalizePublicUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizePublicUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) {
    return configured;
  }

  if (typeof window === "undefined") {
    return "/";
  }

  const { protocol, hostname, port } = window.location;
  if (hostname.startsWith("admin.")) {
    const mainHost = hostname.slice("admin.".length);
    if (mainHost) {
      return `${protocol}//${mainHost}${port ? `:${port}` : ""}`;
    }
  }

  return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
}
