import { NextRequest, NextResponse } from "next/server";
import { carouselItemsRepo, toApiEntity } from "../../_utils/repos";
import { requireAdminAuth } from "@/lib/auth/api-helper";
import { logger } from "../../_utils/logger";
import { withApiRoute } from "../../_utils/with-api-route";

export const GET = withApiRoute(
  { route: "/api/carousel/[id]" },
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const item = await carouselItemsRepo.getById(id);

      if (!item) {
        return NextResponse.json(
          { success: false, message: "Foto no encontrada" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: toApiEntity(item),
      });
    } catch (error) {
      logger.error("carousel.fetch_one_failed", { error });
      return NextResponse.json(
        { success: false, message: "No se pudo obtener la foto" },
        { status: 500 }
      );
    }
  }
);

export const PUT = withApiRoute(
  { route: "/api/carousel/[id]" },
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireAdminAuth(request);
    if (!auth.success) return auth.response;

    try {
      const { id } = await params;
      const body = (await request.json()) as CarouselItemUpdateInput;

      const item = await carouselItemsRepo.getById(id);
      if (!item) {
        return NextResponse.json(
          { success: false, message: "Foto no encontrada" },
          { status: 404 }
        );
      }

      const updateData: Partial<typeof item> = {};
      if (body.name !== undefined) updateData.name = body.name?.trim() || null;
      if (body.imageUrl !== undefined) {
        const trimmed = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
        if (!trimmed) {
          return NextResponse.json(
            { success: false, message: "La imagen es obligatoria" },
            { status: 400 }
          );
        }
        updateData.imageUrl = trimmed;
      }
      if (body.isActive !== undefined) updateData.isActive = body.isActive;

      await carouselItemsRepo.update(id, updateData);
      const updated = await carouselItemsRepo.getById(id);

      return NextResponse.json({
        success: true,
        data: toApiEntity(updated!),
      });
    } catch (error) {
      logger.error("carousel.update_failed", { error });
      return NextResponse.json(
        { success: false, message: "No se pudo actualizar la foto" },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withApiRoute(
  { route: "/api/carousel/[id]" },
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireAdminAuth(request);
    if (!auth.success) return auth.response;

    try {
      const { id } = await params;
      const item = await carouselItemsRepo.getById(id);

      if (!item) {
        return NextResponse.json(
          { success: false, error: "Foto no encontrada" },
          { status: 404 }
        );
      }

      await carouselItemsRepo.remove(id);

      return NextResponse.json({
        success: true,
        message: "Foto eliminada correctamente",
      });
    } catch (error) {
      logger.error("carousel.delete_failed", { error });
      return NextResponse.json(
        { success: false, error: "No se pudo eliminar la foto" },
        { status: 500 }
      );
    }
  }
);
