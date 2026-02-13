import "server-only";
import crypto from "crypto";
import { getAppBaseUrl } from "@/lib/app-url";

const ORDER_TOKEN_SECRET = process.env.JWT_SECRET;

if (!ORDER_TOKEN_SECRET) {
  throw new Error("JWT_SECRET must be set in environment variables");
}

/**
 * Genera un token único vinculado al ID de la orden (Firebase document id)
 * El token es determinístico: siempre genera el mismo token para el mismo ID
 */
export function generateOrderToken(orderId: string): string {
  const data = `${orderId}:${ORDER_TOKEN_SECRET}`;
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  return hash.substring(0, 32);
}

/**
 * Verifica que un token sea válido para un ID de orden específico
 */
export function verifyOrderToken(orderId: string, token: string): boolean {
  if (!token || token.length !== 32) {
    return false;
  }
  const expectedToken = generateOrderToken(orderId);
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expectedToken)
  );
}

/**
 * Genera la URL completa para ver los detalles de una orden con token
 */
export function generateOrderDetailUrl(orderId: string, orderNumber: string, baseUrl?: string): string {
  const token = generateOrderToken(orderId);
  const url = baseUrl ?? getAppBaseUrl();
  return `${url}/orders/details/${orderId}?token=${token}&orderNumber=${orderNumber}`;
}
