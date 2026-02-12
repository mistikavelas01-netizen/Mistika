import "server-only";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

const JWT_SECRET: string | undefined = process.env.JWT_SECRET;
const JWT_EXPIRES_IN: StringValue | number = (process.env.JWT_EXPIRES_IN || "8h") as StringValue;

/**
 * Firma un token JWT para administradores
 */
export function signAdminToken(payload: { id: string; username: string }): string {
  if (!JWT_SECRET) {
    throw new Error("Falta JWT_SECRET");
  }

  const tokenPayload = {
    sub: payload.id,
    username: payload.username,
    role: "admin" as const,
  };

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verifica y decodifica un token JWT (verifica la firma criptográfica)
 * Solo para uso en Node.js runtime (rutas API)
 */
export function verifyAdminToken(token: string): AdminTokenPayload {
  if (!JWT_SECRET) {
    throw new Error("Falta JWT_SECRET");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Type guard to ensure decoded is an object with role
    if (typeof decoded === "object" && decoded !== null && "role" in decoded) {
      return decoded as AdminTokenPayload;
    }
    
    throw new Error("Payload de token inválido");
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Token inválido");
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expirado");
    }
    throw error;
  }
}

/**
 * Hashea una contraseña con un salt usando SHA-256
 */
export function hashPassword(password: string, salt: string): string {
  return crypto
    .createHash("sha256")
    .update(`${salt}:${password}`)
    .digest("hex");
}

/**
 * Comparación segura de strings para evitar timing attacks
 */
export function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}
