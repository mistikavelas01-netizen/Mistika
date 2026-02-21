import { NextRequest, NextResponse } from "next/server";
import {
  orderDraftsRepo,
  productsRepo,
} from "../../_utils/repos";
import { logger } from "../../_utils/logger";
import { withApiRoute } from "../../_utils/with-api-route";

/**
 * POST /api/checkout/draft
 *
 * Crea un borrador de orden (sin decrementar stock ni crear orden).
 * La orden se crea cuando el webhook de MP confirma el pago.
 */
export const POST = withApiRoute({ route: "/api/checkout/draft" }, async (request: NextRequest) => {
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
        groupedItems.set(item.productId, { productId: item.productId, quantity: item.quantity });
      }
    }

    const productIds = Array.from(groupedItems.keys());
    const products = await Promise.all(productIds.map((id) => productsRepo.getById(id)));
    const productMap = new Map(products.filter(Boolean).map((p) => [p!._id!, p]));

    const missingProducts = productIds.filter((id) => !productMap.has(id));
    if (missingProducts.length > 0) {
      return NextResponse.json(
        { success: false, error: "No se encontraron algunos productos", missingProductIds: missingProducts },
        { status: 400 }
      );
    }

    const inactiveProducts = productIds.filter((id) => {
      const p = productMap.get(id);
      return p ? !p.isActive : false;
    });
    if (inactiveProducts.length > 0) {
      return NextResponse.json(
        { success: false, error: "Algunos productos no están disponibles", inactiveProductIds: inactiveProducts },
        { status: 409 }
      );
    }

    const insufficientStock: { productId: string; name: string; available: number; requested: number }[] = [];
    for (const id of productIds) {
      const product = productMap.get(id)!;
      const requested = groupedItems.get(id)!.quantity;
      if (product.stock < requested) {
        insufficientStock.push({ productId: id, name: product.name, available: product.stock, requested });
      }
    }
    if (insufficientStock.length > 0) {
      return NextResponse.json(
        { success: false, error: "Stock insuficiente", items: insufficientStock },
        { status: 409 }
      );
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const shippingCosts: Record<string, number> = { standard: 150, express: 250, overnight: 500 };
    const shippingCost = shippingCosts[body.shippingMethod || "standard"] ?? 150;
    const tax = subtotal * 0.16;
    const totalAmount = subtotal + shippingCost + tax;

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

    const draftData = {
      status: "pending" as const,
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
      paymentMethod: "card",
      notes: body.notes ?? null,
      items: orderItemsForCreate,
    };

    const createdDraft = await orderDraftsRepo.create(draftData);

    return NextResponse.json({
      success: true,
      data: { id: createdDraft._id },
    });
  } catch (error) {
    logger.error("checkout.draft_create_failed", { error });
    return NextResponse.json(
      { success: false, error: "No se pudo crear el borrador" },
      { status: 500 }
    );
  }
});
