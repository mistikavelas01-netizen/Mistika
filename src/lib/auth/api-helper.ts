import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth/server";

/**
 * Helper para verificar autenticación admin en rutas API
 * Verifica la firma criptográfica completa del token (no solo expiración y rol)
 * 
 * IMPORTANTE: El middleware solo hace validación básica. Esta función hace
 * la verificación completa de la firma criptográfica para seguridad real.
 */
export async function requireAdminAuth(
  request: NextRequest
): Promise<
  | { success: true; payload: { sub?: string; username?: string; role?: string; [key: string]: unknown } }
  | { success: false; response: NextResponse }
> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "No autorizado. Token requerido." },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "No autorizado. Token requerido." },
        { status: 401 }
      ),
    };
  }

  try {
    // Verificación completa de la firma criptográfica
    const payload = verifyAdminToken(token);

    // Verificar que el rol es admin
    if (typeof payload === "object" && payload !== null && "role" in payload) {
      if (payload.role !== "admin") {
        return {
          success: false,
          response: NextResponse.json(
            { error: "No autorizado. Se requieren permisos de administrador." },
            { status: 403 }
          ),
        };
      }
    }

    return { success: true, payload };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Token inválido o expirado.";
    return {
      success: false,
      response: NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      ),
    };
  }
}
