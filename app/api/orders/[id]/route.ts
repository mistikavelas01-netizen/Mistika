import { NextRequest, NextResponse } from "next/server";
import {
  ordersRepo,
} from "../../_utils/repos";
import { requireAdminAuth } from "@/lib/auth/api-helper";
import { sendMail } from "@/mail/sendMail";
import type { OrderStatusPayload } from "@/mail/types";
import { logger } from "../../_utils/logger";
import { withApiRoute } from "../../_utils/with-api-route";
import { enrichOrderWithItemsAndCategory } from "../_utils/enrich-order";

const LOCKED_ORDER_STATUSES = new Set(["delivered", "cancelled"]);

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

      if (
        body.status !== undefined &&
        body.status !== currentOrder.status &&
        (
          LOCKED_ORDER_STATUSES.has(currentOrder.status) ||
          currentOrder.paymentStatus === "refunded" ||
          currentOrder.refundStatus === "full"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "No se puede cambiar el estado de un pedido entregado, cancelado o reembolsado",
          },
          { status: 409 },
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
        const { generateOrderDetailUrl } = await import("@/lib/order-token");
        const orderUrl = generateOrderDetailUrl(
          updated!._id!,
          updated!.orderNumber
        );
        const emailPayload: OrderStatusPayload = {
          name: currentOrder.customerName,
          orderNumber: updated!.orderNumber,
          status: body.status as "processing" | "shipped" | "delivered",
          orderUrl,
        };

        try {
          const result = await sendMail({
            type: "order-status",
            to: currentOrder.customerEmail,
            payload: emailPayload,
          });

          if (!result.ok) {
            logger.error("orders.status_email_failed", {
              orderId: id,
              status: body.status,
              error: result.error,
            });
          } else {
            logger.info("orders.status_email_sent", {
              orderId: id,
              status: body.status,
              messageId: result.messageId,
            });
          }
        } catch (err) {
          logger.error("orders.status_email_failed", {
            orderId: id,
            status: body.status,
            error: err,
          });
        }
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
  async (request: NextRequest) => {
    const auth = await requireAdminAuth(request);
    if (!auth.success) return auth.response;

    return NextResponse.json(
      { success: false, error: "No se permite eliminar pedidos" },
      { status: 405 },
    );
});
