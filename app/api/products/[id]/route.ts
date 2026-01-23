import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth/api-helper";

/**
 * GET /api/products/[id]
 * Fetch a single product by ID
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
          message: "Invalid product ID",
        },
        { status: 400 }
      );
    }

    const product = await prisma.products.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/[id]
 * Update a product
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
          message: "Invalid product ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Handle category - can be categoryId or category name (legacy)
    let categoryId = body.categoryId;
    if (!categoryId && body.category) {
      // Try to find category by name (legacy support)
      const category = await prisma.categories.findFirst({
        where: { name: body.category },
      });
      if (category) {
        categoryId = category.id;
      }
    }

    const updateData: any = {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.price !== undefined && {
        price: body.price ? parseFloat(body.price) : null,
      }),
      ...(body.discountPrice !== undefined && {
        discountPrice: body.discountPrice ? parseFloat(body.discountPrice) : null,
      }),
      ...(body.isOnSale !== undefined && { isOnSale: body.isOnSale }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(categoryId !== undefined && { categoryId }),
      ...(body.stock !== undefined && { stock: body.stock }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    };

    const product = await prisma.products.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]
 * Delete a product
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
          error: "Invalid product ID",
        },
        { status: 400 }
      );
    }

    await prisma.products.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete product",
      },
      { status: 500 }
    );
  }
}
