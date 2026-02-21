import { NextRequest, NextResponse } from "next/server";
import { fetchWithObservability } from "./_utils/dependencies";
import { logger } from "./_utils/logger";
import { withApiRoute } from "./_utils/with-api-route";

// This is a proxy route that handles all RTK Query requests
// RTK Query sends requests to /api with endpoint and method in headers
const proxyHandler = async (req: NextRequest) => {
  try {
    const method = req.headers.get("method") || "GET";
    const endpoint = req.headers.get("endpoint") || "";

    if (!endpoint) {
      return NextResponse.json(
        { error: "Se requiere el encabezado endpoint" },
        { status: 400 }
      );
    }

    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON, that's okay
    }

    const cookies = req.headers.get("cookie") || "";
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const url = `${backendUrl}/${endpoint}`;

    const response = await fetchWithObservability(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookies,
      },
      body: body ? JSON.stringify(body) : undefined,
    }, "backend");

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    logger.error("api.proxy_error", { error });
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
};

export const POST = withApiRoute({ route: "/api" }, proxyHandler);

// Handle GET requests as well
export const GET = withApiRoute({ route: "/api" }, proxyHandler);

// Handle PUT requests
export const PUT = withApiRoute({ route: "/api" }, proxyHandler);

// Handle DELETE requests
export const DELETE = withApiRoute({ route: "/api" }, proxyHandler);

// Handle PATCH requests
export const PATCH = withApiRoute({ route: "/api" }, proxyHandler);
