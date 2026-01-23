import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/mail/sendMail";
import { requireAdminAuth } from "@/lib/auth/api-helper";

/**
 * GET /api/orders
 * Fetch orders with pagination and optional status filter
 * Query params: page (default: 1), limit (default: 20), status (optional)
 * Requires admin authentication with full signature verification
 */
export async function GET(request: NextRequest) {
  // Verificar autenticación con validación completa de firma
  const auth = await requireAdminAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status");
    
    const currentPage = Math.max(1, page);
    const pageSize = Math.min(Math.max(1, limit), 100);
    const skip = (currentPage - 1) * pageSize;

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Get total count for pagination metadata
    const total = await prisma.orders.count({ where });
    
    // Fetch paginated orders with items
    const orders = await prisma.orders.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        currentPage,
        pageSize,
        total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Create a new order
 * Public route - customers can create orders
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Calculate totals
    const subtotal = body.items.reduce(
      (sum: number, item: any) => sum + (item.unitPrice * item.quantity),
      0
    );
    
    // Calculate shipping cost based on method
    const shippingCosts: Record<string, number> = {
      standard: 150.0,
      express: 250.0,
      overnight: 500.0,
    };
    const shippingCost = shippingCosts[body.shippingMethod || "standard"] || 150.0;
    
    // Calculate tax (16% IVA in Mexico)
    const tax = subtotal * 0.16;
    const totalAmount = subtotal + shippingCost + tax;

    // Generate order number (format: MIST-YYYYMMDD-XXXX)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `MIST-${dateStr}-${randomNum}`;

    // Create order with items
    const order = await prisma.orders.create({
      data: {
        orderNumber,
        status: "pending",
        totalAmount,
        subtotal,
        shippingCost,
        tax,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone || null,
        shippingStreet: body.shippingAddress.street,
        shippingCity: body.shippingAddress.city,
        shippingState: body.shippingAddress.state,
        shippingZip: body.shippingAddress.zip,
        shippingCountry: body.shippingAddress.country || "México",
        billingStreet: body.billingAddress?.street || null,
        billingCity: body.billingAddress?.city || null,
        billingState: body.billingAddress?.state || null,
        billingZip: body.billingAddress?.zip || null,
        billingCountry: body.billingAddress?.country || null,
        shippingMethod: body.shippingMethod || "standard",
        paymentMethod: body.paymentMethod || null,
        paymentStatus: "pending",
        notes: body.notes || null,
        items: {
          create: body.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            productName: item.productName || "",
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    // Send order confirmation email (don't fail the request if email fails)
    try {
      const formatPrice = (price: number | string) => {
        const numPrice = typeof price === "string" ? parseFloat(price) : price;
        if (isNaN(numPrice)) return "$0.00 MXN";
        return `$${numPrice.toFixed(2)} MXN`;
      };

      const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString("es-MX", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      // Build shipping address string
      const shippingAddress = [
        order.shippingStreet,
        `${order.shippingCity}, ${order.shippingState} ${order.shippingZip}`,
        order.shippingCountry,
      ]
        .filter(Boolean)
        .join("\n");

      // Build order URL
      const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/orders/${order.orderNumber}`;

      await sendMail({
        type: "order-confirmation",
        to: order.customerEmail,
        payload: {
          name: order.customerName,
          orderNumber: order.orderNumber,
          orderDate: formatDate(order.createdAt),
          totalAmount: Number(order.totalAmount),
          items: order.items.map((item: any) => ({
            name: item.productName,
            quantity: item.quantity,
            price: Number(item.unitPrice),
          })),
          shippingAddress,
          orderUrl,
        },
      });

      console.log(`[Orders] Order confirmation email sent to ${order.customerEmail}`);
    } catch (emailError) {
      // Log error but don't fail the request
      console.error("[Orders] Failed to send order confirmation email:", emailError);
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
      },
      { status: 500 }
    );
  }
}
