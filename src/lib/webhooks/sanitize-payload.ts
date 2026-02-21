import "server-only";

const SENSITIVE_KEYS = new Set([
  "x-signature", "x_signature", "signature", "token", "access_token", "secret",
  "password", "authorization", "api_key", "apikey", "private_key", "credential", "auth", "bearer",
]);
const MASK_VALUE = "[REDACTED]";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function maskEmail(value: string): string {
  if (!value || typeof value !== "string") return MASK_VALUE;
  const at = value.indexOf("@");
  if (at <= 0) return value.length > 4 ? value.slice(0, 2) + "***" : "***";
  const local = value.slice(0, at);
  const domain = value.slice(at);
  return local.length <= 2 ? "***" + domain : local.slice(0, 2) + "***" + domain;
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const keyLower = k.toLowerCase();
      if (SENSITIVE_KEYS.has(keyLower) || keyLower.includes("secret") || keyLower.includes("token")) {
        out[k] = MASK_VALUE;
      } else if (keyLower === "email" && typeof v === "string") {
        out[k] = maskEmail(v);
      } else {
        out[k] = sanitizeValue(v);
      }
    }
    return out;
  }
  return value;
}

export function sanitizeWebhookPayload(raw: string | undefined | null, maxLength = 32_000): string {
  if (raw == null || raw === "" || raw.trim() === "") return "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return raw.length > maxLength ? raw.slice(0, maxLength) + "\n...[truncated]" : raw;
  }
  const str = JSON.stringify(sanitizeValue(parsed), null, 2);
  return str.length > maxLength ? str.slice(0, maxLength) + "\n...[truncated]" : str;
}
