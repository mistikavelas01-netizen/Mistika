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

export function getAppBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    DEFAULT_BASE_URL;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
