import type { OrderEntity } from "@/firebase/repos";
import {
  orderItemsRepo,
  productsRepo,
  categoriesRepo,
  refundsRepo,
  toApiEntity,
} from "../../_utils/repos";

export async function enrichOrderWithItemsAndCategory(order: OrderEntity | null) {
  if (!order) return null;

  const items = await orderItemsRepo.where("orderId", "==", order._id!);
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await Promise.all(
    productIds.map((id) => productsRepo.getById(id)),
  );
  const productMap = new Map(products.filter(Boolean).map((p) => [p!._id, p]));

  const categoryIds = [
    ...new Set(products.filter(Boolean).map((product) => product!.categoryId)),
  ];
  const categories = await Promise.all(
    categoryIds.map((id) => categoriesRepo.getById(id)),
  );
  const categoryMap = new Map(
    categories.filter(Boolean).map((category) => [category!._id, category]),
  );

  const refunds = await refundsRepo.where("orderId", "==", order._id!);
  refunds.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

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
    refunds: refunds.map((refund) => toApiEntity(refund)),
  };
}
