import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth/api-helper";

/**
 * GET /api/categories
 * Fetch all categories
 * Query params: activeOnly (default: false) - if true, only return active categories
 * Public route - no authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("activeOnly") === "true";

    const categories = await prisma.categories.findMany({
      orderBy: { name: "asc" },
      where: activeOnly
        ? {
            isActive: true,
          }
        : undefined,
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Create a new category
 * Requires admin authentication with full signature verification
 */
export async function POST(request: NextRequest) {
  // Verificar autenticación con validación completa de firma
  const auth = await requireAdminAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await request.json();

    // Generate slug from name if not provided
    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const categories = await prisma.categories.create({
      data: {
        name: body.name,
        slug,
        description: body.description || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error("Error creating category:", error);
    
    // Handle unique constraint violations
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
        error: "Failed to create category",
      },
      { status: 500 }
    );
  }
}
