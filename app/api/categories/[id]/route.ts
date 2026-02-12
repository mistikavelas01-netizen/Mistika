import { NextRequest, NextResponse } from "next/server";
import { categoriesRepo, productsRepo, toApiEntity } from "@/firebase/repos";
import { requireAdminAuth } from "@/lib/auth/api-helper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await categoriesRepo.getById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: toApiEntity(category),
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener la categoría" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const body = (await request.json()) as CategoryUpdateInput;

    const category = await categoriesRepo.getById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    let slug = body.slug;
    if (body.name && slug === undefined) {
      slug = body.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    if (slug !== undefined) {
      const existing = await categoriesRepo.where("slug", "==", slug);
      if (existing.length > 0 && existing[0]._id !== id) {
        return NextResponse.json(
          { success: false, error: "Ya existe una categoría con ese nombre o slug" },
          { status: 400 }
        );
      }
    }

    const updateData: Partial<typeof category> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (slug !== undefined) updateData.slug = slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    await categoriesRepo.update(id, updateData);
    const updated = await categoriesRepo.getById(id);

    return NextResponse.json({
      success: true,
      data: toApiEntity(updated),
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo actualizar la categoría" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;

    const category = await categoriesRepo.getById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    const productsInCategory = await productsRepo.where("categoryId", "==", id);
    if (productsInCategory.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede eliminar la categoría porque tiene ${productsInCategory.length} producto(s) asignado(s)`,
        },
        { status: 400 }
      );
    }

    await categoriesRepo.remove(id);

    return NextResponse.json({
      success: true,
      message: "Categoría eliminada correctamente",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo eliminar la categoría" },
      { status: 500 }
    );
  }
}
