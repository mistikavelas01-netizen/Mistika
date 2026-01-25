/**
 * Funciones compartidas de autenticación
 * Usables en cliente, servidor y Edge Runtime
 */

export const ADMIN_TOKEN_KEY = "mistika_admin_token";

export type JwtPayload = {
  exp?: number;
  role?: string;
  sub?: string;
  username?: string;
  [key: string]: unknown;
};

/**
 * Decodifica Base64URL (compatible con Edge Runtime y Browser)
 */
function decodeBase64Url(value: string): string | null {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    return atob(padded);
  } catch {
    return null;
  }
}

/**
 * Decodifica el payload de un JWT sin verificar la firma
 * Compatible con Edge Runtime y Browser
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const decoded = decodeBase64Url(parts[1]);
  if (!decoded) {
    return null;
  }

  try {
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}
