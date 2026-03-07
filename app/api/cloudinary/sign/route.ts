import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "../../_utils/logger";
import { withApiRoute } from "../../_utils/with-api-route";
import { requireAdminAuth } from "@/lib/auth/api-helper";

const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY =
  process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const ALLOWED_FOLDERS = new Set(["products", "carousel"]);
const ALLOWED_SIGN_KEYS = new Set([
  "timestamp",
  "folder",
  "public_id",
  "tags",
  "context",
  "source",
  "resource_type",
  "upload_preset",
]);
const TIMESTAMP_TOLERANCE_SEC = 10 * 60;

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export const POST = withApiRoute({ route: "/api/cloudinary/sign" }, async (request: NextRequest) => {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;

  try {
    if (!CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: "Cloudinary no está configurado correctamente" },
        { status: 503 }
      );
    }

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

    const keys = Object.keys(paramsToSign);
    const disallowedKeys = keys.filter((key) => !ALLOWED_SIGN_KEYS.has(key));
    if (disallowedKeys.length > 0) {
      return NextResponse.json(
        { error: "Parámetros inválidos para firma" },
        { status: 400 }
      );
    }

    const folder = String(paramsToSign.folder ?? "").trim();
    if (!folder || !ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json(
        { error: "Carpeta de subida no permitida" },
        { status: 400 }
      );
    }

    const timestampValue = Number(paramsToSign.timestamp);
    const nowSec = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(timestampValue) || Math.abs(nowSec - timestampValue) > TIMESTAMP_TOLERANCE_SEC) {
      return NextResponse.json(
        { error: "Timestamp inválido o expirado" },
        { status: 400 }
      );
    }

    const sanitizedParams: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(paramsToSign)) {
      if (ALLOWED_SIGN_KEYS.has(key)) {
        sanitizedParams[key] = value;
      }
    }

    const signature = cloudinary.utils.api_sign_request(
      sanitizedParams,
      CLOUDINARY_API_SECRET
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
