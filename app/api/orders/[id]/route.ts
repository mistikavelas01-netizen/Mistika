import { NextRequest, NextResponse } from "next/server";
import {
  ordersRepo,
  orderItemsRepo,
  productsRepo,
  categoriesRepo,
  toApiEntity,
} from "../../_utils/repos";
import { requireAdminAuth } from "@/lib/auth/api-helper";
import { sendMail } from "@/mail/sendMail";
import type { OrderStatusPayload } from "@/mail/types";
import { logger } from "../../_utils/logger";
import { withApiRoute } from "../../_utils/with-api-route";

async function enrichOrderWithItemsAndCategory(
  order: Awaited<ReturnType<typeof ordersRepo.getById>>,
) {
  if (!order) return null;
  const items = await orderItemsRepo.where("orderId", "==", order._id!);
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await Promise.all(
    productIds.map((id) => productsRepo.getById(id)),
  );
  const productMap = new Map(products.filter(Boolean).map((p) => [p!._id, p]));
  const categoryIds = [
    ...new Set(products.filter(Boolean).map((p) => p!.categoryId)),
  ];
  const categories = await Promise.all(
    categoryIds.map((id) => categoriesRepo.getById(id)),
  );
  const categoryMap = new Map(
    categories.filter(Boolean).map((c) => [c!._id, c]),
  );

  const itemsWithProduct = items.map((item) => {
    const product = productMap.get(item.productId);
    const category = product ? categoryMap.get(product.categoryId) : null;
    return {
      ...toApiEntity(item),
      product: product
        ? {
            id: product._id,
            name: product.name,
            imageUrl: product.imageUrl ?? null,
            category: category ? toApiEntity(category) : undefined,
          }
        : undefined,
    };
  });

  return {
    ...toApiEntity(order),
    items: itemsWithProduct,
  };
}

export const GET = withApiRoute(
  { route: "/api/orders/[id]" },
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireAdminAuth(request);
    if (!auth.success) return auth.response;

    try {
      const { id } = await params;

      const order = await ordersRepo.getById(id);
      if (!order) {
        return NextResponse.json(
          { success: false, error: "Pedido no encontrado" },
          { status: 404 },
        );
      }

      const data = await enrichOrderWithItemsAndCategory(order);
      return NextResponse.json({ success: true, data });
    } catch (error) {
      logger.error("orders.fetch_one_failed", { error });
      return NextResponse.json(
        { success: false, error: "No se pudo obtener el pedido" },
        { status: 500 },
      );
    }
  }
);

export const PUT = withApiRoute(
  { route: "/api/orders/[id]" },
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireAdminAuth(request);
    if (!auth.success) return auth.response;

    try {
      const { id } = await params;
      const body = (await request.json()) as OrderUpdateInput;

      const currentOrder = await ordersRepo.getById(id);
      if (!currentOrder) {
        return NextResponse.json(
          { success: false, error: "Pedido no encontrado" },
          { status: 404 },
        );
      }

      const updateData: Partial<typeof currentOrder> = {};
      if (body.status !== undefined) updateData.status = body.status;
      if (body.paymentStatus !== undefined)
        updateData.paymentStatus = body.paymentStatus;
      if (body.shippingMethod !== undefined)
        updateData.shippingMethod = body.shippingMethod;
      if (body.notes !== undefined) updateData.notes = body.notes;

      await ordersRepo.update(id, updateData);
      const updated = await ordersRepo.getById(id);
      const data = await enrichOrderWithItemsAndCategory(updated!);

      // 🔔 Notificación por email (segura)
      const statusesToNotify = ["processing", "shipped", "delivered"];

      if (
        body.status &&
        body.status !== currentOrder.status &&
        statusesToNotify.includes(body.status)
      ) {
        const { getAppBaseUrl } = await import("@/lib/app-url");
        const orderUrl = `${getAppBaseUrl()}/orders/${updated!.orderNumber}`;
        const emailPayload: OrderStatusPayload = {
          name: currentOrder.customerName,
          orderNumber: updated!.orderNumber,
          status: body.status as "processing" | "shipped" | "delivered",
          orderUrl,
        };
        // Envío de correo deshabilitado para no gastar créditos (Resend)
        // sendMail({
        //   type: "order-status",
        //   to: currentOrder.customerEmail,
        //   payload: emailPayload,
        // }).catch((err) => console.error("[Orders API] Failed to send status email:", err));
      }

      return NextResponse.json({ success: true, data });
    } catch (error) {
      logger.error("orders.update_failed", { error });
      return NextResponse.json(
        { success: false, error: "No se pudo actualizar el pedido" },
        { status: 500 },
      );
    }
});

export const DELETE = withApiRoute(
  { route: "/api/orders/[id]" },
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireAdminAuth(request);
    if (!auth.success) return auth.response;

    try {
      const { id } = await params;

      const order = await ordersRepo.getById(id);
      if (!order) {
        return NextResponse.json(
          { success: false, error: "Pedido no encontrado" },
          { status: 404 },
        );
      }

      const items = await orderItemsRepo.where("orderId", "==", id);
      for (const item of items) {
        if (item._id) await orderItemsRepo.remove(item._id);
      }
      await ordersRepo.remove(id);

      return NextResponse.json({
        success: true,
        message: "Pedido eliminado correctamente",
      });
    } catch (error) {
      logger.error("orders.delete_failed", { error });
      return NextResponse.json(
        { success: false, error: "No se pudo eliminar el pedido" },
        { status: 500 },
      );
    }
});
