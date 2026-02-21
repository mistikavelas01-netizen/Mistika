import { NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenEdge } from "@/lib/auth";

const ADMIN_SUBDOMAIN = "admin";

/**
 * Determina si el host actual corresponde al subdominio de administración.
 * Ejemplos: admin.localhost, admin.dominio.example.com
 */
function isAdminSubdomain(host: string): boolean {
  const hostname = host.split(":")[0].toLowerCase();
  const parts = hostname.split(".");
  if (parts.length < 2) return false;
  return parts[0] === ADMIN_SUBDOMAIN;
}

/**
 * Proxy que se ejecuta antes de todas las requests.
 * - Rutas de página: lógica de subdominio admin (redirect/rewrite).
 * - Rutas de API: valida autenticación para rutas admin.
 * Edge Runtime: usa auth/edge.ts (compatible con Edge).
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const method = request.method;

  // ——— Rutas de página: subdominio admin y redirección ———
  if (!pathname.startsWith("/api/")) {
    const isAdmin = isAdminSubdomain(host);

    if (!isAdmin) {
      // En dominio raíz: solo redirigir /admin y /login a /. El resto (incl. /cart, /orders, productos) pasa.
      if (pathname.startsWith("/admin") || pathname === "/login") {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
      // /cart, /orders, /orders/..., rutas de producto, etc.: dejar pasar sin tocar
      return NextResponse.next();
    }

    if (pathname === "/" || pathname === "") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }
    if (pathname === "/login" || pathname.startsWith("/admin")) {
      return NextResponse.next();
    }
    if (
      pathname.startsWith("/products") ||
      pathname.startsWith("/orders") ||
      pathname.startsWith("/categories")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  // ——— Rutas de API: validación de token admin ———

  // Rutas que no requieren Bearer token (MP webhook, login, etc.)
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/verify",
    "/api/mail",
    "/api/cloudinary/sign",
    "/api/webhooks", // POST desde Mercado Pago (URL puede ser /api/webhooks o /api/webhooks/mercadopago)
    "/api/webhooks/mercadopago",
  ];

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const isPublicRoute = (() => {
    if (pathname.match(/^\/api\/products(\/[^/]+)?$/) && method === "GET") return true;
    if (pathname.match(/^\/api\/categories(\/[^/]+)?$/) && method === "GET") return true;
    if (pathname === "/api/orders" && method === "POST") return true;
    if (pathname.match(/^\/api\/orders\/number\/[^/]+$/) && method === "GET") return true;
    if (pathname.match(/^\/api\/orders\/details\/\d+$/) && method === "GET") return true;
    // Checkout y pagos: cualquier usuario puede comprar sin token admin
    if (pathname === "/api/checkout/draft" && method === "POST") return true;
    if (pathname.match(/^\/api\/checkout\/draft\/[^/]+\/status$/) && method === "GET") return true;
    if (pathname === "/api/payments/mercadopago/preference" && method === "POST") return true;
    // Verificación de retorno desde MP (lo llama el front en /checkout/return, sin token)
    if (pathname === "/api/payments/mercadopago/verify" && method === "GET") return true;
    // Webhook de Mercado Pago (lo llama MP, sin token)
    if ((pathname === "/api/webhooks" || pathname === "/api/webhooks/mercadopago") && method === "POST") return true;
    return false;
  })();

  if (isPublicRoute) {
    return NextResponse.next();
  }

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

  const verification = verifyAdminTokenEdge(token);
  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error || "Token inválido o expirado." },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/",
    "/admin",
    "/admin/:path*",
    "/login",
    "/products",
    "/products/:path*",
    "/orders",
    "/orders/:path*",
    "/categories",
    "/categories/:path*",
  ],
};
