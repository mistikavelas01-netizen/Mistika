import { NextRequest, NextResponse } from "next/server";
import {
  ordersRepo,
  orderItemsRepo,
  productsRepo,
  toApiEntity,
} from "../_utils/repos";
import { sendMail } from "@/mail/sendMail";
import { requireAdminAuth } from "@/lib/auth/api-helper";
import { logger } from "../_utils/logger";
import { withApiRoute } from "../_utils/with-api-route";

async function enrichOrderWithItems(order: Awaited<ReturnType<typeof ordersRepo.getById>>) {
  if (!order) return null;
  const items = await orderItemsRepo.where("orderId", "==", order._id!);
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await Promise.all(productIds.map((id) => productsRepo.getById(id)));
  const productMap = new Map(products.filter(Boolean).map((p) => [p!._id, p]));

  const itemsWithProduct = items.map((item) => {
    const product = productMap.get(item.productId);
    return {
      ...toApiEntity(item),
      product: product
        ? { id: product._id, name: product.name, imageUrl: product.imageUrl ?? null }
        : undefined,
    };
  });

  return {
    ...toApiEntity(order),
    items: itemsWithProduct,
  };
}

export const GET = withApiRoute({ route: "/api/orders" }, async (request: NextRequest) => {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status");

    const currentPage = Math.max(1, page);
    const pageSize = Math.min(Math.max(1, limit), 100);

    let all = await ordersRepo.getAll();
    if (status) all = all.filter((o) => o.status === status);
    all.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    const total = all.length;
    const skip = (currentPage - 1) * pageSize;
    const pageOrders = all.slice(skip, skip + pageSize);

    const data = await Promise.all(
      pageOrders.map((o) => enrichOrderWithItems(o))
    );

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data,
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
    logger.error("orders.fetch_failed", { error });
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener los pedidos" },
      { status: 500 }
    );
  }
});

export const POST = withApiRoute({ route: "/api/orders" }, async (request: NextRequest) => {
  try {
    const body = (await request.json()) as OrderInput;

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Los artículos del pedido son obligatorios" },
        { status: 400 }
      );
    }

    const normalizedItems = rawItems.map((item) => {
      const productId = String(item.productId);
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const unitPriceRaw = Number(item.unitPrice);
      const unitPrice = Number.isFinite(unitPriceRaw) ? unitPriceRaw : 0;
      return {
        productId,
        quantity,
        unitPrice,
        productName: typeof item.productName === "string" ? item.productName : "",
      };
    });

    const invalidItems = normalizedItems.filter((item) => !item.productId);
    if (invalidItems.length > 0) {
      return NextResponse.json(
        { success: false, error: "Producto inválido en los artículos del pedido" },
        { status: 400 }
      );
    }

    const groupedItems = new Map<string, { productId: string; quantity: number }>();
    for (const item of normalizedItems) {
      const existing = groupedItems.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        groupedItems.set(item.productId, {
          productId: item.productId,
          quantity: item.quantity,
        });
      }
    }

    const productIds = Array.from(groupedItems.keys());
    const products = await Promise.all(productIds.map((id) => productsRepo.getById(id)));
    const productMap = new Map(products.filter(Boolean).map((p) => [p!._id!, p]));

    const missingProducts = productIds.filter((id) => !productMap.has(id));
    if (missingProducts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No se encontraron algunos productos",
          missingProductIds: missingProducts,
        },
        { status: 400 }
      );
    }

    const inactiveProducts = productIds.filter((id) => {
      const p = productMap.get(id);
      return p ? !p.isActive : false;
    });
    if (inactiveProducts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Algunos productos no están disponibles",
          inactiveProductIds: inactiveProducts,
        },
        { status: 409 }
      );
    }

    const insufficientStock: { productId: string; name: string; available: number; requested: number }[] = [];
    for (const id of productIds) {
      const product = productMap.get(id)!;
      const requested = groupedItems.get(id)!.quantity;
      if (product.stock < requested) {
        insufficientStock.push({
          productId: id,
          name: product.name,
          available: product.stock,
          requested,
        });
      }
    }
    if (insufficientStock.length > 0) {
      return NextResponse.json(
        { success: false, error: "Stock insuficiente para algunos productos", items: insufficientStock },
        { status: 409 }
      );
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const shippingCosts: Record<string, number> = {
      standard: 150.0,
      express: 250.0,
      overnight: 500.0,
    };
    const shippingCost = shippingCosts[body.shippingMethod || "standard"] ?? 150.0;
    const tax = subtotal * 0.16;
    const totalAmount = subtotal + shippingCost + tax;

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `MIST-${dateStr}-${randomNum}`;

    const orderItemsForCreate = normalizedItems.map((item) => {
      const product = productMap.get(item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        productName: product?.name ?? item.productName ?? "",
      };
    });

    // Decrement stock (best-effort; no transaction in Firestore)
    for (const entry of groupedItems.values()) {
      const product = productMap.get(entry.productId)!;
      await productsRepo.update(entry.productId, {
        stock: Math.max(0, product.stock - entry.quantity),
      });
    }

    const orderData = {
      orderNumber,
      status: "pending",
      totalAmount,
      subtotal,
      shippingCost,
      tax,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone ?? null,
      shippingStreet: body.shippingAddress.street,
      shippingCity: body.shippingAddress.city,
      shippingState: body.shippingAddress.state,
      shippingZip: body.shippingAddress.zip,
      shippingCountry: body.shippingAddress.country ?? "México",
      billingStreet: body.billingAddress?.street ?? null,
      billingCity: body.billingAddress?.city ?? null,
      billingState: body.billingAddress?.state ?? null,
      billingZip: body.billingAddress?.zip ?? null,
      billingCountry: body.billingAddress?.country ?? null,
      shippingMethod: body.shippingMethod ?? "standard",
      paymentMethod: body.paymentMethod ?? null,
      paymentStatus: "pending",
      notes: body.notes ?? null,
    };

    const createdOrder = await ordersRepo.create(orderData);
    const orderId = createdOrder._id!;

    for (const item of orderItemsForCreate) {
      await orderItemsRepo.create({
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        productName: item.productName,
      });
    }

    const orderWithItems = await enrichOrderWithItems(createdOrder);

    try {
      const formatDate = (date: Date | number | string) => {
        return new Date(date).toLocaleDateString("es-MX", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      };
      const shippingAddress = [
        createdOrder.shippingStreet,
        `${createdOrder.shippingCity}, ${createdOrder.shippingState} ${createdOrder.shippingZip}`,
        createdOrder.shippingCountry,
      ]
        .filter(Boolean)
        .join("\n");
      const { generateOrderDetailUrl } = await import("@/lib/order-token");
      const orderUrl = generateOrderDetailUrl(orderId, createdOrder.orderNumber);

      // Envío de correo deshabilitado para no gastar créditos (Resend)
      // await sendMail({
      //   type: "order-confirmation",
      //   to: createdOrder.customerEmail,
      //   payload: {
      //     name: createdOrder.customerName,
      //     orderNumber: createdOrder.orderNumber,
      //     orderDate: formatDate(createdOrder.createdAt ?? Date.now()),
      //     totalAmount: Number(createdOrder.totalAmount),
      //     items: orderItemsForCreate.map((item) => ({
      //       name: item.productName,
      //       quantity: item.quantity,
      //       price: Number(item.unitPrice),
      //     })),
      //     shippingAddress,
      //     orderUrl,
      //   },
      // });
      // console.log(`[Orders] Order confirmation email sent to ${createdOrder.customerEmail}`);
    } catch (emailError) {
      logger.error("orders.confirmation_email_failed", { error: emailError });
    }

    return NextResponse.json({
      success: true,
      data: orderWithItems,
    });
  } catch (error) {
    logger.error("orders.create_failed", { error });
    return NextResponse.json(
      { success: false, error: "No se pudo crear el pedido" },
      { status: 500 }
    );
  }
});
