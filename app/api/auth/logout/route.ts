import { NextResponse } from "next/server";
import { ADMIN_TOKEN_KEY } from "@/lib/auth/shared";
import { withApiRoute } from "../../_utils/with-api-route";

export const POST = withApiRoute(
  { route: "/api/auth/logout" },
  async () => {
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: ADMIN_TOKEN_KEY,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  }
);
