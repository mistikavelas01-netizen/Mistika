import { NextRequest, NextResponse } from "next/server";
import {
  ordersRepo,
  orderItemsRepo,
  productsRepo,
  categoriesRepo,
  toApiEntity,
} from "../../../_utils/repos";
import { logger } from "../../../_utils/logger";
import { withApiRoute } from "../../../_utils/with-api-route";

async function enrichOrderWithItemsAndCategory(order: Awaited<ReturnType<typeof ordersRepo.getById>>) {
  if (!order) return null;
  const items = await orderItemsRepo.where("orderId", "==", order._id!);
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await Promise.all(productIds.map((id) => productsRepo.getById(id)));
  const productMap = new Map(products.filter(Boolean).map((p) => [p!._id, p]));
  const categoryIds = [...new Set(products.filter(Boolean).map((p) => p!.categoryId))];
  const categories = await Promise.all(categoryIds.map((id) => categoriesRepo.getById(id)));
  const categoryMap = new Map(categories.filter(Boolean).map((c) => [c!._id, c]));

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
  { route: "/api/orders/number/[orderNumber]" },
  async (request: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) => {
  try {
    const { orderNumber } = await params;

    const orders = await ordersRepo.where("orderNumber", "==", orderNumber);
    const order = orders[0] ?? null;

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const data = await enrichOrderWithItemsAndCategory(order);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error("orders.fetch_by_number_failed", { error });
    return NextResponse.json(
      { success: false, error: "No se pudo obtener el pedido" },
      { status: 500 }
    );
  }
});
