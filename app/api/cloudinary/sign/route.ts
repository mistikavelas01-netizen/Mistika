import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "../../_utils/logger";
import { withApiRoute } from "../../_utils/with-api-route";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

export const POST = withApiRoute({ route: "/api/cloudinary/sign" }, async (request: NextRequest) => {
  try {
    const body = (await request.json()) as {
      paramsToSign?: Record<string, string | number>;
    };
    const { paramsToSign } = body;

    if (!paramsToSign) {
      return NextResponse.json(
        { error: "Faltan parámetros para firmar" },
        { status: 400 }
      );
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET as string
    );

    return NextResponse.json({ signature });
  } catch (error) {
    logger.error("cloudinary.sign_failed", { error });
    return NextResponse.json(
      { error: "No se pudo firmar la solicitud de subida" },
      { status: 500 }
    );
  }
});
