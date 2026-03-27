import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

const SESSION_COOKIE_NAME = "__session";

export async function requireAdminAuth(
  request: NextRequest,
): Promise<
  | { success: true; payload: AdminTokenPayload }
  | { success: false; response: NextResponse }
> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value?.trim() ?? "";
  if (!sessionCookie) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "No autorizado. Sesión requerida." },
        { status: 401 },
      ),
    };
  }

  try {
    const payload = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
    return { success: true, payload };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Sesión inválida o expirada.";
    return {
      success: false,
      response: NextResponse.json({ error: errorMessage }, { status: 401 }),
    };
  }
}

/**
 * Verifica si la request trae una sesión de administrador válida por cookie.
 * Se usa para habilitar bypass en rutas que permiten modo público/admin.
 */
export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value?.trim() ?? "";
  if (!sessionCookie) {
    return false;
  }

  try {
    await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
    return true;
  } catch {
    return false;
  }
}
