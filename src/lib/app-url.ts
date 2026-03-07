import "server-only";

/**
 * Base URL pública según el entorno.
 * Se usa en correos (enlaces a pedidos, etc.), redirecciones y back_urls.
 *
 * - Desarrollo: http://localhost:3000
 * - Producción: https://tudominio.com
 */
const DEFAULT_BASE_URL = "http://localhost:3000";
const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

function normalizeUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function ensureAbsoluteHttpUrl(url: string, source: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${source} debe ser una URL absoluta (ej. https://tudominio.com).`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${source} debe usar http o https.`);
  }

  return parsed;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function assertNotLocalhostInProduction(parsed: URL, source: string): void {
  if (!isProduction()) return;
  if (LOCALHOST_HOSTS.has(parsed.hostname)) {
    throw new Error(`${source} no puede apuntar a localhost en producción.`);
  }
}

function resolveSiteUrl(): string {
  const siteUrl = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (siteUrl) {
    const parsed = ensureAbsoluteHttpUrl(siteUrl, "NEXT_PUBLIC_SITE_URL");
    assertNotLocalhostInProduction(parsed, "NEXT_PUBLIC_SITE_URL");
    return siteUrl;
  }

  const appUrl = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (appUrl) {
    const parsed = ensureAbsoluteHttpUrl(appUrl, "NEXT_PUBLIC_APP_URL");
    assertNotLocalhostInProduction(parsed, "NEXT_PUBLIC_APP_URL");
    return appUrl;
  }

  if (!isProduction()) {
    const vercelUrl = normalizeUrl(
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
    );
    if (vercelUrl) {
      return vercelUrl;
    }
    return DEFAULT_BASE_URL;
  }

  throw new Error("NEXT_PUBLIC_SITE_URL o NEXT_PUBLIC_APP_URL es obligatoria en producción.");
}

export function isAbsoluteHttpUrl(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getSiteUrl(): string {
  return resolveSiteUrl();
}

export function getAppBaseUrl(): string {
  const appUrl = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (appUrl) {
    const parsed = ensureAbsoluteHttpUrl(appUrl, "NEXT_PUBLIC_APP_URL");
    assertNotLocalhostInProduction(parsed, "NEXT_PUBLIC_APP_URL");
    return appUrl;
  }
  return resolveSiteUrl();
}
