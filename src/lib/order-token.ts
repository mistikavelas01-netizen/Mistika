import "server-only";
import crypto from "crypto";

const ORDER_TOKEN_SECRET = process.env.JWT_SECRET;

if (!ORDER_TOKEN_SECRET) {
  throw new Error("JWT_SECRET must be set in environment variables");
}

/**
 * Genera un token único vinculado al ID de la orden
 * El token es determinístico: siempre genera el mismo token para el mismo ID
 * Esto previene que alguien pueda cambiar el ID y acceder a otras órdenes
 */
export function generateOrderToken(orderId: number): string {
  // Crear un hash usando el ID de la orden y un secreto
  // Esto asegura que el token solo funcione para ese ID específico
  const data = `${orderId}:${ORDER_TOKEN_SECRET}`;
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  
  // Tomar los primeros 32 caracteres para un token más corto
  // Pero aún seguro (128 bits de seguridad)
  return hash.substring(0, 32);
}

/**
 * Verifica que un token sea válido para un ID de orden específico
 * Retorna true solo si el token coincide con el ID proporcionado
 */
export function verifyOrderToken(orderId: number, token: string): boolean {
  if (!token || token.length !== 32) {
    return false;
  }

  const expectedToken = generateOrderToken(orderId);
  
  // Usar comparación segura para evitar timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expectedToken)
  );
}

/**
 * Genera la URL completa para ver los detalles de una orden con token
 */
export function generateOrderDetailUrl(orderId: number, orderNumber: string, baseUrl?: string): string {
  const token = generateOrderToken(orderId);
  const url = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${url}/orders/details/${orderId}?token=${token}&orderNumber=${orderNumber}`;
}
