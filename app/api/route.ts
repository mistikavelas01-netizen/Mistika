import { NextRequest, NextResponse } from "next/server";

// This is a proxy route that handles all RTK Query requests
// RTK Query sends requests to /api with endpoint and method in headers
export async function POST(req: NextRequest) {
  try {
    const method = req.headers.get("method") || "GET";
    const endpoint = req.headers.get("endpoint") || "";

    if (!endpoint) {
      return NextResponse.json(
        { error: "Se requiere el encabezado endpoint" },
        { status: 400 }
      );
    }

    // Get the body if it exists
    let body = null;
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON, that's okay
    }

    // Get cookies to forward authentication
    const cookies = req.headers.get("cookie") || "";

    // Determine the backend URL
    // You can use an environment variable for this
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const url = `${backendUrl}/${endpoint}`;

    // Forward the request to the backend
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookies,
        // Forward other relevant headers if needed
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Handle GET requests as well
export async function GET(req: NextRequest) {
  return POST(req);
}

// Handle PUT requests
export async function PUT(req: NextRequest) {
  return POST(req);
}

// Handle DELETE requests
export async function DELETE(req: NextRequest) {
  return POST(req);
}

// Handle PATCH requests
export async function PATCH(req: NextRequest) {
  return POST(req);
}
