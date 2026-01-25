import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth/api-helper";

/**
 * GET /api/categories/[id]
 * Fetch a single category by ID
 * Public route - no authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    const category = await prisma.categories.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch category",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories/[id]
 * Update a category
 * Requires admin authentication with full signature verification
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar autenticación con validación completa de firma
  const auth = await requireAdminAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Generate slug from name if name changed and slug not provided
    let slug = body.slug;
    if (body.name && !body.slug) {
      slug = body.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (slug !== undefined) updateData.slug = slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const category = await prisma.categories.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error("Error updating category:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "Ya existe una categoría con ese nombre o slug",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update category",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete a category
 * Requires admin authentication with full signature verification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar autenticación con validación completa de firma
  const auth = await requireAdminAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    // Check if category has products
    const productsCount = await prisma.products.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede eliminar la categoría porque tiene ${productsCount} producto(s) asignado(s)`,
        },
        { status: 400 }
      );
    }

    await prisma.categories.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete category",
      },
      { status: 500 }
    );
  }
}
