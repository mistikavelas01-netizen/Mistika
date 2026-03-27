import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

const SESSION_COOKIE_NAME = "__session";
const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const firebaseAdminAuth = getFirebaseAdminAuth();
    const body = (await request.json()) as { idToken?: string };
    const idToken = body.idToken;

    if (!idToken) {
      return NextResponse.json({ ok: false, error: "idToken es requerido" }, { status: 400 });
    }

    await firebaseAdminAuth.verifyIdToken(idToken);
    const sessionCookie = await firebaseAdminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });

    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("auth.session.post_failed", error);
    }
    return NextResponse.json(
      {
        ok: false,
        error:
          process.env.NODE_ENV !== "production" && error instanceof Error
            ? error.message
            : "Token inválido",
      },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
