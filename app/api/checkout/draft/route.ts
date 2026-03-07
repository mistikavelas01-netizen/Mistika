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
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    if (!customerName) {
      return NextResponse.json(
        { success: false, error: "El nombre del cliente es obligatorio" },
        { status: 400 }
      );
    }

    const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim().toLowerCase() : "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail || !emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { success: false, error: "El correo electrónico del cliente no es válido" },
        { status: 400 }
      );
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Los artículos del pedido son obligatorios" },
        { status: 400 }
      );
    }

    const customerPhone = typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";
    if (!customerPhone) {
      return NextResponse.json(
        { success: false, error: "El teléfono del cliente es obligatorio" },
        { status: 400 }
      );
    }

    const shippingStreet = typeof body.shippingAddress?.street === "string" ? body.shippingAddress.street.trim() : "";
    const shippingCity = typeof body.shippingAddress?.city === "string" ? body.shippingAddress.city.trim() : "";
    const shippingState = typeof body.shippingAddress?.state === "string" ? body.shippingAddress.state.trim() : "";
    const shippingZip = typeof body.shippingAddress?.zip === "string" ? body.shippingAddress.zip.trim() : "";
    const shippingCountry = typeof body.shippingAddress?.country === "string"
      ? body.shippingAddress.country.trim() || "México"
      : "México";

    if (!shippingStreet || !shippingCity || !shippingState || !shippingZip) {
      return NextResponse.json(
        { success: false, error: "La dirección de envío está incompleta" },
        { status: 400 }
      );
    }

    const normalizedItems = rawItems.map((item) => {
      const productId = String(item.productId);
      const quantityRaw = Number(item.quantity);
      const quantity = Number.isFinite(quantityRaw) ? Math.floor(quantityRaw) : 0;
      return {
        productId,
        quantity,
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

    const invalidQuantities = normalizedItems.filter((item) => !Number.isInteger(item.quantity) || item.quantity <= 0);
    if (invalidQuantities.length > 0) {
      return NextResponse.json(
        { success: false, error: "Cantidad inválida en uno o más artículos" },
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

    const resolveUnitPrice = (product: NonNullable<(typeof products)[number]>) => {
      if (product.isOnSale && typeof product.discountPrice === "number") {
        return product.discountPrice;
      }
      if (typeof product.price === "number") {
        return product.price;
      }
      return null;
    };

    const productsWithoutPrice = productIds.filter((id) => {
      const product = productMap.get(id);
      if (!product) return true;
      const unitPrice = resolveUnitPrice(product);
      return unitPrice == null || unitPrice < 0;
    });
    if (productsWithoutPrice.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Algunos productos no tienen precio válido",
          productIds: productsWithoutPrice,
        },
        { status: 400 }
      );
    }

    const shippingMethod = typeof body.shippingMethod === "string" ? body.shippingMethod.trim() : "standard";
    const shippingCosts: Record<string, number> = { standard: 80, express: 120, overnight: 500 };
    const shippingCost = shippingCosts[shippingMethod] ?? 150;
    const tax = 0;

    const orderItemsForCreate = normalizedItems.map((item) => {
      const product = productMap.get(item.productId);
      const unitPrice = product ? resolveUnitPrice(product) : null;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: unitPrice ?? 0,
        totalPrice: (unitPrice ?? 0) * item.quantity,
        productName: product?.name ?? item.productName ?? "",
      };
    });
    const subtotal = orderItemsForCreate.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = subtotal + shippingCost;

    const draftData = {
      status: "pending" as const,
      totalAmount,
      subtotal,
      shippingCost,
      tax,
      customerName,
      customerEmail,
      customerPhone,
      shippingStreet,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      billingStreet: body.billingAddress?.street?.trim() || null,
      billingCity: body.billingAddress?.city?.trim() || null,
      billingState: body.billingAddress?.state?.trim() || null,
      billingZip: body.billingAddress?.zip?.trim() || null,
      billingCountry: body.billingAddress?.country?.trim() || null,
      shippingMethod,
      paymentMethod: "card",
      notes: body.notes?.trim() || null,
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
