import { NextRequest, NextResponse } from "next/server";
import { adminsRepo } from "@/firebase/repos";
import { hashPassword, safeEqual, signAdminToken } from "@/lib/auth/server";

type LoginPayload = {
  username?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginPayload;
    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña requeridos" },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 100) {
      return NextResponse.json(
        { error: "El usuario debe tener entre 3 y 100 caracteres" },
        { status: 400 }
      );
    }

    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { error: "La contraseña debe tener entre 6 y 128 caracteres" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "El usuario solo puede contener letras, números y guiones bajos" },
        { status: 400 }
      );
    }

    const admins = await adminsRepo.where("username", "==", username);
    const admin = admins[0] ?? null;

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const hashedPassword = hashPassword(password, admin.passwordSalt);
    if (!safeEqual(hashedPassword, admin.passwordHash)) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const adminId = admin._id ?? "";
    const token = signAdminToken({ id: adminId, username: admin.username });
    return NextResponse.json({ token });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al iniciar sesión" },
      { status: 500 }
    );
  }
}
