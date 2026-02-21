import { NextRequest, NextResponse } from "next/server";
import { productsRepo, categoriesRepo, toApiEntity } from "../_utils/repos";
import { requireAdminAuth } from "@/lib/auth/api-helper";
import { PLACEHOLDER_IMAGE } from "@/constant";
import { logger } from "../_utils/logger";
import { withApiRoute } from "../_utils/with-api-route";

export const GET = withApiRoute({ route: "/api/products" }, async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const sortBy = searchParams.get("sortBy") || "newest";
    const categoryId = searchParams.get("categoryId");

    const currentPage = Math.max(1, page);
    const pageSize = Math.min(Math.max(1, limit), 100);

    let list = await productsRepo.where("isActive", "==", true);
    if (categoryId && categoryId !== "all") {
      list = list.filter((p) => p.categoryId === categoryId);
    }

    switch (sortBy) {
      case "price_asc":
        list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price_desc":
        list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "newest":
      default:
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        break;
    }

    const total = list.length;
    const skip = (currentPage - 1) * pageSize;
    const paginated = list.slice(skip, skip + pageSize);

    const categories = await categoriesRepo.getAll();
    const categoryMap = new Map(categories.map((c) => [c._id, c]));
    const withCategory = paginated.map((p) => ({
      ...toApiEntity(p),
      category: categoryMap.get(p.categoryId)
        ? toApiEntity(categoryMap.get(p.categoryId)!)
        : undefined,
    }));

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: withCategory,
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
    logger.error("products.fetch_failed", { error });
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener los productos" },
      { status: 500 },
    );
  }
});

export const POST = withApiRoute({ route: "/api/products" }, async (request: NextRequest) => {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;

  try {
    const body = (await request.json()) as ProductInput;

    let categoryId = body.categoryId;
    if (!categoryId && body.category) {
      const byName = await categoriesRepo.where("name", "==", body.category);
      if (byName.length > 0) {
        categoryId = byName[0]._id!;
      } else {
        const general = await categoriesRepo.where("name", "==", "General");
        categoryId = general[0]?._id ?? "";
      }
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "El ID de la categoría es obligatorio" },
        { status: 400 },
      );
    }

    const imageUrl =
      body.imageUrl && body.imageUrl.length > 0 ? body.imageUrl.trim() : PLACEHOLDER_IMAGE;

    const created = await productsRepo.create({
      name: body.name,
      description: body.description ?? null,
      price: body.price ?? null,
      discountPrice: body.discountPrice ?? null,
      isOnSale: body.isOnSale ?? false,
      imageUrl,
      slug: body.slug ?? null,
      categoryId,
      stock: body.stock ?? 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    const category = await categoriesRepo.getById(categoryId);

    return NextResponse.json({
      success: true,
      data: {
        ...toApiEntity(created),
        category: category ? toApiEntity(category) : undefined,
      },
    });
  } catch (error) {
    logger.error("products.create_failed", { error });
    return NextResponse.json(
      { success: false, error: "No se pudo crear el producto" },
      { status: 500 },
    );
  }
});
