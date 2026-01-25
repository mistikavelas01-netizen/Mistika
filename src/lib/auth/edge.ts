/**
 * Funciones de autenticación compatibles con Edge Runtime
 * Para usar en middleware de Next.js
 * 
 * Nota: Solo verifica expiración y rol, NO verifica la firma criptográfica
 * La verificación completa de firma se hace en las rutas API (server.ts)
 */

import { decodeJwtPayload, type JwtPayload } from "./shared";

/**
 * Verifica el formato básico de un JWT (debe tener 3 partes separadas por puntos)
 */
function isValidJwtFormat(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }
  
  // Verificar que cada parte tenga contenido
  if (!parts[0] || !parts[1] || !parts[2]) {
    return false;
  }
  
  return true;
}

/**
 * Verifica un token JWT en Edge Runtime
 * Solo verifica formato, expiración y rol, no la firma criptográfica
 * Para verificación completa de firma, se debe hacer en las rutas API
 */
export function verifyAdminTokenEdge(token: string): {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
} {
  // Primero verificar el formato básico del JWT
  if (!isValidJwtFormat(token)) {
    return { valid: false, error: "Formato de token inválido" };
  }

  const payload = decodeJwtPayload(token);
  
  if (!payload) {
    return { valid: false, error: "Token inválido" };
  }

  // Verificar rol
  if (payload.role !== "admin") {
    return { valid: false, error: "Rol no autorizado" };
  }

  // Verificar expiración
  if (typeof payload.exp !== "number") {
    return { valid: false, error: "Token sin expiración" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    return { valid: false, error: "Token expirado" };
  }

  return { valid: true, payload };
}
