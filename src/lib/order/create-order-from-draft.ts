import "server-only";
import {
  ordersRepo,
  orderItemsRepo,
  productsRepo,
  orderDraftsRepo,
  type OrderDraftEntity,
} from "@/firebase/repos";
import { generateOrderDetailUrl } from "@/lib/order-token";
import { sendMail } from "@/mail/sendMail";
import type { OrderConfirmationPayload } from "@/mail/types";

/**
 * Crea una orden desde un borrador cuando el pago fue aprobado por Mercado Pago.
 * Decrementa stock, crea order y order_items.
 */
export async function createOrderFromDraft(
  draft: OrderDraftEntity,
  mpPaymentId: string,
  mpPreferenceId?: string
): Promise<{ orderId: string; orderNumber: string } | null> {
  if (draft.status !== "pending") {
    console.warn("[createOrderFromDraft] Draft already converted or expired:", draft._id);
    return null;
  }

  const groupedItems = new Map<string, { productId: string; quantity: number }>();
  for (const item of draft.items) {
    const existing = groupedItems.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      groupedItems.set(item.productId, { productId: item.productId, quantity: item.quantity });
    }
  }

  const productIds = Array.from(groupedItems.keys());
  const products = await Promise.all(productIds.map((id) => productsRepo.getById(id)));
  const productMap = new Map(products.filter(Boolean).map((p) => [p!._id!, p]));

  const insufficientStock: { productId: string; name: string; available: number; requested: number }[] = [];
  for (const id of productIds) {
    const product = productMap.get(id);
    if (!product) continue;
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
    console.error("[createOrderFromDraft] Insufficient stock after payment - manual review needed:", insufficientStock);
    return null;
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `MIST-${dateStr}-${randomNum}`;

  const orderData = {
    orderNumber,
    status: "processing",
    totalAmount: draft.totalAmount,
    subtotal: draft.subtotal,
    shippingCost: draft.shippingCost,
    tax: draft.tax,
    customerName: draft.customerName,
    customerEmail: draft.customerEmail,
    customerPhone: draft.customerPhone ?? null,
    shippingStreet: draft.shippingStreet,
    shippingCity: draft.shippingCity,
    shippingState: draft.shippingState,
    shippingZip: draft.shippingZip,
    shippingCountry: draft.shippingCountry,
    billingStreet: draft.billingStreet ?? null,
    billingCity: draft.billingCity ?? null,
    billingState: draft.billingState ?? null,
    billingZip: draft.billingZip ?? null,
    billingCountry: draft.billingCountry ?? null,
    shippingMethod: draft.shippingMethod,
    paymentMethod: draft.paymentMethod ?? "card",
    paymentStatus: "paid" as const,
    notes: draft.notes ?? null,
    mpPaymentId,
    mpPreferenceId: mpPreferenceId ?? null,
    externalReference: draft._id ?? null,
    currency: "MXN",
  };

  const createdOrder = await ordersRepo.create(orderData);
  const orderId = createdOrder._id!;

  for (const item of draft.items) {
    await orderItemsRepo.create({
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      productName: item.productName,
    });
  }

  for (const entry of groupedItems.values()) {
    const product = productMap.get(entry.productId);
    if (product) {
      await productsRepo.update(entry.productId, {
        stock: Math.max(0, product.stock - entry.quantity),
      });
    }
  }

  try {
    const formatDate = (date: Date | number | string) =>
      new Date(date).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    const shippingAddress = [
      createdOrder.shippingStreet,
      `${createdOrder.shippingCity}, ${createdOrder.shippingState} ${createdOrder.shippingZip}`,
    ]
      .filter(Boolean)
      .join("\n");
    const orderUrl = generateOrderDetailUrl(orderId, createdOrder.orderNumber);
    const emailPayload: OrderConfirmationPayload = {
      name: createdOrder.customerName,
      orderNumber: createdOrder.orderNumber,
      orderDate: formatDate(createdOrder.createdAt ?? Date.now()),
      totalAmount: Number(createdOrder.totalAmount),
      items: draft.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        price: Number(item.unitPrice),
      })),
      shippingAddress,
      orderUrl,
    };

    const result = await sendMail({
      type: "order-confirmation",
      to: createdOrder.customerEmail,
      payload: emailPayload,
    });

    if (!result.ok) {
      console.error("[Orders] Failed to send confirmation email:", result.error);
    }
  } catch (error) {
    console.error("[Orders] Confirmation email error:", error);
  }

  await orderDraftsRepo.update(draft._id!, {
    status: "converted",
    convertedOrderId: orderId,
    orderNumber,
  });

  return { orderId, orderNumber };
}
