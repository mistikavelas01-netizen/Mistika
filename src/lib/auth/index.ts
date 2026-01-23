/**
 * Módulo de autenticación
 * 
 * Estructura:
 * - client.ts: Funciones para el cliente (Browser)
 * - server.ts: Funciones para el servidor (Node.js runtime)
 * - edge.ts: Funciones para Edge Runtime (middleware)
 * - shared.ts: Funciones compartidas entre todos los entornos
 */

// Re-exportar funciones del cliente
export {
  isTokenValid,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
} from "./client";

// Re-exportar funciones del servidor
export {
  signAdminToken,
  verifyAdminToken,
  hashPassword,
  safeEqual,
} from "./server";

// Re-exportar funciones de Edge
export { verifyAdminTokenEdge } from "./edge";

// Re-exportar tipos y constantes compartidos
export { ADMIN_TOKEN_KEY, decodeJwtPayload, type JwtPayload } from "./shared";
