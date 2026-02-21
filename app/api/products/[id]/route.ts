import { NextRequest, NextResponse } from "next/server";
import { productsRepo, categoriesRepo, toApiEntity } from "../../_utils/repos";
import { requireAdminAuth } from "@/lib/auth/api-helper";
import { PLACEHOLDER_IMAGE } from "@/constant";
import { logger } from "../../_utils/logger";
import { withApiRoute } from "../../_utils/with-api-route";

export const GET = withApiRoute(
  { route: "/api/products/[id]" },
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;

    const product = await productsRepo.getById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const category = await categoriesRepo.getById(product.categoryId);

    return NextResponse.json({
      success: true,
      data: {
        ...toApiEntity(product),
        category: category ? toApiEntity(category) : undefined,
      },
    });
  } catch (error) {
    logger.error("products.fetch_one_failed", { error });
    return NextResponse.json(
      { success: false, message: "No se pudo obtener el producto" },
      { status: 500 }
    );
  }
});

export const PUT = withApiRoute(
  { route: "/api/products/[id]" },
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<ProductInput>;

    const product = await productsRepo.getById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Producto no encontrado" },
        { status: 404 }
      );
    }

    let categoryId = body.categoryId;
    if (!categoryId && body.category) {
      const byName = await categoriesRepo.where("name", "==", body.category);
      if (byName.length > 0) categoryId = byName[0]._id!;
    }

    const updateData: Partial<typeof product> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price ?? null;
    if (body.discountPrice !== undefined) updateData.discountPrice = body.discountPrice ?? null;
    if (body.isOnSale !== undefined) updateData.isOnSale = body.isOnSale;
    if (body.imageUrl !== undefined) {
      updateData.imageUrl =
        typeof body.imageUrl === "string" && body.imageUrl.trim() !== ""
          ? body.imageUrl.trim()
          : PLACEHOLDER_IMAGE;
    }
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (body.stock !== undefined) updateData.stock = body.stock;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    await productsRepo.update(id, updateData);
    const updated = await productsRepo.getById(id);
    const category = updated ? await categoriesRepo.getById(updated.categoryId) : null;

    return NextResponse.json({
      success: true,
      data: {
        ...toApiEntity(updated!),
        category: category ? toApiEntity(category) : undefined,
      },
    });
  } catch (error) {
    logger.error("products.update_failed", { error });
    return NextResponse.json(
      { success: false, message: "No se pudo actualizar el producto" },
      { status: 500 }
    );
  }
});

export const DELETE = withApiRoute(
  { route: "/api/products/[id]" },
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;

    const product = await productsRepo.getById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    await productsRepo.update(id, { isActive: false });

    return NextResponse.json({
      success: true,
      message: "Producto eliminado correctamente",
    });
  } catch (error) {
    logger.error("products.delete_failed", { error });
    return NextResponse.json(
      { success: false, error: "No se pudo eliminar el producto" },
      { status: 500 }
    );
  }
});
