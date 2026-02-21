import "server-only";
import crypto from "crypto";
import { getAppBaseUrl } from "@/lib/app-url";

export const runtime = "nodejs";

const ORDER_TOKEN_SECRET = process.env.JWT_SECRET;

if (!ORDER_TOKEN_SECRET) {
  throw new Error("JWT_SECRET must be set in environment variables");
}

const EXPIRATION_HOURS = 24;

// Crear firma segura con HMAC
function createSignature(data: string): string {
  return crypto
    .createHmac("sha256", ORDER_TOKEN_SECRET!)
    .update(data)
    .digest("hex")
    .substring(0, 32);
}

// Generar token con expiración
export function generateOrderToken(orderId: string) {
  const expiresAt = Date.now() + EXPIRATION_HOURS * 60 * 60 * 1000;
  const data = `${orderId}:${expiresAt}`;
  const token = createSignature(data);

  return { token, expiresAt };
}

// Verificar token
export function verifyOrderToken(
  orderId: string,
  token: string,
  expiresAt: string
): boolean {
  if (!token || token.length !== 32) return false;

  const expirationTime = Number(expiresAt);
  if (!expirationTime || Date.now() > expirationTime) return false;

  const data = `${orderId}:${expirationTime}`;
  const expectedToken = createSignature(data);

  return token === expectedToken;
}

// Generar URL completa para el correo
export function generateOrderDetailUrl(
  orderId: string,
  orderNumber: string,
  baseUrl?: string
): string {
  const { token, expiresAt } = generateOrderToken(orderId);
  const url = baseUrl ?? getAppBaseUrl();

  return `${url}/orders/details/${orderId}?token=${encodeURIComponent(
    token
  )}&expires=${expiresAt}&orderNumber=${encodeURIComponent(orderNumber)}`;
}