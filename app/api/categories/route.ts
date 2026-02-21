import { NextRequest, NextResponse } from "next/server";
import { categoriesRepo, toApiEntityList, toApiEntity } from "../_utils/repos";
import { requireAdminAuth } from "@/lib/auth/api-helper";
import { logger } from "../_utils/logger";
import { withApiRoute } from "../_utils/with-api-route";

export const GET = withApiRoute({ route: "/api/categories" }, async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("activeOnly") === "true";

    const all = await categoriesRepo.getAll();
    const filtered = activeOnly ? all.filter((c) => c.isActive) : all;
    const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      data: toApiEntityList(sorted),
    });
  } catch (error) {
    logger.error("categories.fetch_failed", { error });
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener las categorías" },
      { status: 500 }
    );
  }
});

export const POST = withApiRoute({ route: "/api/categories" }, async (request: NextRequest) => {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;

  try {
    const body = (await request.json()) as CategoryInput;

    const slug =
      body.slug ??
      body.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const existing = await categoriesRepo.where("slug", "==", slug);
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Ya existe una categoría con ese nombre o slug" },
        { status: 400 }
      );
    }

    const created = await categoriesRepo.create({
      name: body.name,
      slug,
      description: body.description ?? null,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    return NextResponse.json({
      success: true,
      data: toApiEntity(created),
    });
  } catch (error) {
    logger.error("categories.create_failed", { error });
    return NextResponse.json(
      { success: false, error: "No se pudo crear la categoría" },
      { status: 500 }
    );
  }
});
