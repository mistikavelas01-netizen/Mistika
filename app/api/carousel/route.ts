import { NextRequest, NextResponse } from "next/server";
import { carouselItemsRepo, toApiEntity, toApiEntityList } from "../_utils/repos";
import { requireAdminAuth } from "@/lib/auth/api-helper";
import { logger } from "../_utils/logger";
import { withApiRoute } from "../_utils/with-api-route";

export const GET = withApiRoute({ route: "/api/carousel" }, async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnlyParam = searchParams.get("activeOnly");
    const activeOnly = activeOnlyParam !== "false";

    if (!activeOnly) {
      const auth = await requireAdminAuth(request);
      if (!auth.success) return auth.response;
    }

    const list = activeOnly
      ? await carouselItemsRepo.where("isActive", "==", true)
      : await carouselItemsRepo.getAll();

    const sorted = list.sort((a, b) => Number(a.createdAt ?? 0) - Number(b.createdAt ?? 0));

    return NextResponse.json({
      success: true,
      data: toApiEntityList(sorted),
    });
  } catch (error) {
    logger.error("carousel.fetch_failed", { error });
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener las fotos del carrusel" },
      { status: 500 }
    );
  }
});

export const POST = withApiRoute({ route: "/api/carousel" }, async (request: NextRequest) => {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;

  try {
    const body = (await request.json()) as CarouselItemInput;

    const imageUrl =
      typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "La imagen es obligatoria" },
        { status: 400 }
      );
    }

    const created = await carouselItemsRepo.create({
      name: body.name?.trim() || null,
      imageUrl,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    return NextResponse.json({
      success: true,
      data: toApiEntity(created),
    });
  } catch (error) {
    logger.error("carousel.create_failed", { error });
    return NextResponse.json(
      { success: false, error: "No se pudo crear la foto del carrusel" },
      { status: 500 }
    );
  }
});
