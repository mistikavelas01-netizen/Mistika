import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOrderToken } from "@/lib/order-token";

/**
 * GET /api/orders/details/[id]
 * Fetch order details by ID with token verification
 * Public route - requires valid token linked to the order ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de pedido inválido",
        },
        { status: 400 }
      );
    }

    // Obtener el token de los query parameters
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Token requerido para acceder a los detalles del pedido",
        },
        { status: 401 }
      );
    }

    // Verificar que el token sea válido para este ID específico
    if (!verifyOrderToken(id, token)) {
      return NextResponse.json(
        {
          success: false,
          error: "Token inválido o no autorizado para este pedido",
        },
        { status: 403 }
      );
    }

    // Token válido, obtener la orden
    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Pedido no encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener los detalles del pedido",
      },
      { status: 500 }
    );
  }
}
