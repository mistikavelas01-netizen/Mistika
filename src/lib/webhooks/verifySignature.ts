import "server-only";
import crypto from "crypto";

/**
 * Mercado Pago webhook signature verification (x-signature).
 * Docs: https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
 *
 * Header: x-signature = "ts=<timestamp>,v1=<hmac_hex>"
 * Manifest: id:<data.id_lowercase>;request-id:<x-request-id>;ts:<ts>;
 * HMAC-SHA256(manifest, secret) must equal v1.
 */
export function verifyMercadoPagoWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string
): boolean {
  if (!xSignature || !secret || !dataId) {
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
  const dataIdNormalized = String(dataId).toLowerCase();
  const manifest = `id:${dataIdNormalized};request-id:${xRequestId ?? ""};ts:${ts};`;
  const computed = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const hashBuf = Buffer.from(hash, "hex");
  const computedBuf = Buffer.from(computed, "hex");
  if (hashBuf.length !== computedBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, computedBuf);
}
