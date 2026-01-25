import { NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenEdge } from "@/lib/auth/edge";

/**
 * Middleware de Next.js que se ejecuta antes de todas las requests
 * Valida autenticación para rutas admin de la API
 * 
 * Este middleware se ejecuta en Edge Runtime, por lo que usa funciones
 * compatibles con Edge (auth/edge.ts) en lugar de módulos de Node.js
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Solo procesar rutas de API
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Rutas completamente públicas (cualquier método)
  const publicRoutes = [
    "/api/auth/login", // Login es público
    "/api/auth/verify", // Verificación de token es público (necesario para AdminGuard)
    "/api/mail", // Mail puede ser público o tener su propia validación
    "/api/cloudinary/sign", // Firma de uploads Cloudinary (el widget no envía headers de auth)
  ];

  // Verificar si es una ruta pública exacta
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Rutas públicas por método HTTP y patrón
  const isPublicRoute = (() => {
    // GET productos (individual o lista) - público
    if (pathname.match(/^\/api\/products(\/\d+)?$/) && method === "GET") {
      return true;
    }

    // GET categorías (individual o lista) - público
    if (pathname.match(/^\/api\/categories(\/\d+)?$/) && method === "GET") {
      return true;
    }

    // POST orders (crear orden) - público para clientes
    if (pathname === "/api/orders" && method === "POST") {
      return true;
    }

    // GET order por número - público para clientes
    if (pathname.match(/^\/api\/orders\/number\/[^/]+$/) && method === "GET") {
      return true;
    }

    // GET order details con token - público para clientes (requiere token válido)
    if (pathname.match(/^\/api\/orders\/details\/\d+$/) && method === "GET") {
      return true;
    }

    return false;
  })();

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Todas las demás rutas de API requieren autenticación admin
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "No autorizado. Token requerido." },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return NextResponse.json(
      { error: "No autorizado. Token requerido." },
      { status: 401 }
    );
  }

  // Verificar token usando función compatible con Edge Runtime
  const verification = verifyAdminTokenEdge(token);

  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error || "Token inválido o expirado." },
      { status: 401 }
    );
  }

  // Token válido, continuar con la request
  return NextResponse.next();
}

/**
 * Configuración del matcher para optimizar el middleware
 * Solo se ejecuta en rutas de API
 */
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de API
     * El middleware decide internamente cuáles requieren autenticación
     */
    "/api/:path*",
  ],
};
