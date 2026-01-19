import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../lib/prisma";

/**
 * GET /api/products
 * Fetch all products
 */
export async function GET(request: NextRequest) {
  try {
    const products = await prisma.products.findMany({
      orderBy: { id: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const product = await prisma.products.create({
      data: {
        name: body.name,
        description: body.description,
        price: body.price ? parseFloat(body.price) : null,
        imageUrl: body.imageUrl,
        slug: body.slug,
        category: body.category || "General",
        stock: body.stock || 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create product",
      },
      { status: 500 }
    );
  }
}
