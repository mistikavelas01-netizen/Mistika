import "server-only";

/**
 * Base URL de la aplicación según el entorno.
 * Se usa en correos (enlaces a pedidos, etc.) y en redirecciones.
 * Configurar en cada entorno: desarrollo, staging, producción.
 *
 * - Desarrollo: http://localhost:3000
 * - Producción: https://tudominio.com
 */
const DEFAULT_BASE_URL = "http://localhost:3000";

function normalizeAbsoluteHttpUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  const parsed = (() => {
    try {
      return new URL(value);
    } catch {
      return null;
    }
  })();
  if (!parsed) return null;
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  return parsed.href.replace(/\/$/, "");
}

export function isAbsoluteHttpUrl(raw: string | undefined): boolean {
  return normalizeAbsoluteHttpUrl(raw) !== null;
}

export function getSiteUrl(): string {
  return (
    normalizeAbsoluteHttpUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeAbsoluteHttpUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeAbsoluteHttpUrl(
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
    ) ??
    DEFAULT_BASE_URL
  );
}

export function getAppBaseUrl(): string {
  return (
    normalizeAbsoluteHttpUrl(process.env.NEXT_PUBLIC_APP_URL) ?? getSiteUrl()
  );
}
