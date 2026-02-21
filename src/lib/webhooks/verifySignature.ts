import "server-only";
import crypto from "crypto";

/**
 * Verificación de firma de webhooks Mercado Pago (clave secreta).
 * Doc oficial: https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
 *
 * - Header x-signature: "ts=<timestamp>,v1=<hmac_hex>"
 * - Template del manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 *   Si algún valor no está presente en la notificación, se omite (ej. sin request-id: id:123;ts:456;).
 * - data.id debe ir en minúsculas si es alfanumérico; puede venir en el body o en query params.
 * - HMAC-SHA256(manifest, secret) en hexadecimal debe coincidir con v1.
 */
const TS_TOLERANCE_SEC = 300; // 5 min: rechazar si el ts del header es muy antiguo (replay)

export function verifyMercadoPagoWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string,
  options?: { skipTimestampTolerance?: boolean }
): boolean {
  if (!xSignature || !secret) {
    return false;
  }
  const dataIdNormalized = String(dataId).trim().toLowerCase();
  if (!dataIdNormalized) {
    return false;
  }

  const parts = xSignature.split(",");
  let ts = "";
  let hash = "";
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key === "ts") ts = val;
    else if (key === "v1") hash = val;
  }
  if (!ts || !hash) return false;

  if (!options?.skipTimestampTolerance) {
    const tsNum = parseInt(ts, 10);
    if (Number.isNaN(tsNum)) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - tsNum) > TS_TOLERANCE_SEC) {
      return false;
    }
  }

  const manifestParts: string[] = [
    `id:${dataIdNormalized}`,
    ...(xRequestId != null && xRequestId !== "" ? [`request-id:${xRequestId}`] : []),
    `ts:${ts}`,
  ];
  const manifest = manifestParts.join(";") + ";";
  const computed = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const hashBuf = Buffer.from(hash, "hex");
  const computedBuf = Buffer.from(computed, "hex");
  if (hashBuf.length !== computedBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, computedBuf);
}
