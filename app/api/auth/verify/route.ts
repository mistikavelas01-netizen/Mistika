import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth/server";

/**
 * GET /api/auth/verify
 * Verifica que el token del usuario sea válido (incluyendo la firma criptográfica)
 * Usado por AdminGuard para verificar autenticación en el cliente
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { valid: false, error: "No token provided" },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return NextResponse.json(
      { valid: false, error: "No token provided" },
      { status: 401 }
    );
  }

  try {
    // Verificación completa de la firma criptográfica
    const payload = verifyAdminToken(token);

    // Verificar que el rol es admin
    if (typeof payload === "object" && payload !== null && "role" in payload) {
      if (payload.role !== "admin") {
        return NextResponse.json(
          { valid: false, error: "Not an admin token" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      valid: true,
      payload: {
        sub: payload.sub,
        username: payload.username,
        role: payload.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : "Invalid token",
      },
      { status: 401 }
    );
  }
}
