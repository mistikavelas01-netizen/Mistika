"use client";

/**
 * Funciones de autenticación para el cliente (Browser)
 * Maneja el almacenamiento del token en localStorage
 */

import { ADMIN_TOKEN_KEY, decodeJwtPayload, type JwtPayload } from "./shared";

/**
 * Verifica si un token es válido (rol admin y no expirado)
 */
export function isTokenValid(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || payload.role !== "admin") {
    return false;
  }

  if (typeof payload.exp !== "number") {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
}

/**
 * Obtiene el token almacenado en localStorage
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

/**
 * Guarda el token en localStorage
 */
export function setStoredToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

/**
 * Elimina el token de localStorage
 */
export function clearStoredToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
