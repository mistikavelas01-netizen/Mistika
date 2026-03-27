import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

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
 * Construye el host del subdominio admin a partir del host actual.
 * Ejemplos:
 * - localhost:3000 -> admin.localhost:3000
 * - tienda.example.com -> admin.tienda.example.com
 */
function getAdminHost(host: string): string | null {
  const [rawHostname, rawPort] = host.split(":");
  const hostname = rawHostname?.toLowerCase();
  if (!hostname) return null;

  if (hostname === "localhost") {
    return `${ADMIN_SUBDOMAIN}.localhost${rawPort ? `:${rawPort}` : ""}`;
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  if (hostname.startsWith(`${ADMIN_SUBDOMAIN}.`)) {
    return host;
  }

  return `${ADMIN_SUBDOMAIN}.${hostname}${rawPort ? `:${rawPort}` : ""}`;
}

function isSafeAdminPath(path: string | null): path is string {
  if (!path) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  return path.startsWith("/admin");
}

/**
 * Proxy que se ejecuta antes de todas las requests.
 * - Rutas de página: lógica de subdominio admin (redirect/rewrite).
 * - Rutas de API: valida autenticación para rutas admin.
 * Edge Runtime: usa auth/edge.ts (compatible con Edge).
 */
export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const method = request.method;
  const firebaseAdminAuth = getFirebaseAdminAuth();

  // ——— Rutas de página: subdominio admin y redirección ———
  if (!pathname.startsWith("/api/")) {
    const isAdmin = isAdminSubdomain(host);

    if (!isAdmin) {
      // En dominio raíz: rutas admin deben ir al subdominio admin para evitar flujos rotos.
      if (pathname.startsWith("/admin") || pathname === "/login") {
        const adminHost = getAdminHost(host);
        if (adminHost) {
          const url = request.nextUrl.clone();
          url.host = adminHost;
          return NextResponse.redirect(url);
        }

        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
      // /cart, /orders, /orders/..., rutas de producto, etc.: dejar pasar sin tocar
      return NextResponse.next();
    }

    const cookieToken = request.cookies.get("__session")?.value?.trim() ?? "";
    const auth = cookieToken
      ? await firebaseAdminAuth
          .verifySessionCookie(cookieToken, true)
          .then(() => ({ valid: true as const }))
          .catch(() => ({ valid: false as const }))
      : { valid: false as const };
    const redirectToLogin = (nextPath: string) => {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", nextPath);
      return NextResponse.redirect(url);
    };

    if (pathname === "/" || pathname === "") {
      if (!auth.valid) {
        return redirectToLogin("/admin");
      }
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }

    if (pathname === "/login") {
      if (auth.valid) {
        const nextPath = request.nextUrl.searchParams.get("next");
        const url = request.nextUrl.clone();
        url.pathname = isSafeAdminPath(nextPath) ? nextPath : "/admin";
        url.search = "";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    if (pathname.startsWith("/admin")) {
      if (!auth.valid) {
        const nextPath = `${pathname}${request.nextUrl.search || ""}`;
        return redirectToLogin(nextPath);
      }
      return NextResponse.next();
    }

    if (
      pathname.startsWith("/products") ||
      pathname.startsWith("/orders") ||
      pathname.startsWith("/categories")
    ) {
      const nextPath = `/admin${pathname}${request.nextUrl.search || ""}`;
      if (!auth.valid) {
        return redirectToLogin(nextPath);
      }
      const url = request.nextUrl.clone();
      url.pathname = `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  // ——— Rutas de API: validación por sesión Firebase (__session) ———
  const publicRoutes = [
    "/api/auth/session",
    "/api/webhooks", // POST desde Mercado Pago (URL puede ser /api/webhooks o /api/webhooks/mercadopago)
    "/api/webhooks/mercadopago",
  ];

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const isPublicRoute = (() => {
    if (pathname.match(/^\/api\/products(\/[^/]+)?$/) && method === "GET") return true;
    if (pathname.match(/^\/api\/categories(\/[^/]+)?$/) && method === "GET") return true;
    if (
      pathname === "/api/carousel" &&
      method === "GET" &&
      request.nextUrl.searchParams.get("activeOnly") !== "false"
    ) {
      return true;
    }
    if (pathname.match(/^\/api\/orders\/number\/[^/]+$/) && method === "GET") return true;
    if (pathname.match(/^\/api\/orders\/details\/[^/]+$/) && method === "GET") return true;
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

  // Las rutas API protegidas solo se permiten desde el subdominio admin
  // y con sesión Firebase válida.
  if (!isAdminSubdomain(host)) {
    return NextResponse.json(
      { error: "No autorizado. Usa el subdominio admin." },
      { status: 403 }
    );
  }

  const sessionCookie = request.cookies.get("__session")?.value?.trim() ?? "";
  if (!sessionCookie) {
    return NextResponse.json(
      { error: "No autorizado. Sesión requerida." },
      { status: 401 }
    );
  }

  const hasValidSession = await firebaseAdminAuth
    .verifySessionCookie(sessionCookie, true)
    .then(() => true)
    .catch(() => false);

  if (!hasValidSession) {
    return NextResponse.json(
      { error: "No autorizado. Sesión inválida o expirada." },
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
