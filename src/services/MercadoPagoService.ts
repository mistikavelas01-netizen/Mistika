import "server-only";
import { getMercadoPagoPayment } from "@/lib/mercadopago/get-payment";

const MP_API_BASE = "https://api.mercadopago.com";
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

export async function getPaymentById(paymentId: string) {
  try {
    return await getMercadoPagoPayment(paymentId);
  } catch {
    return null;
  }
}

export async function getChargebackById(chargebackId: string): Promise<Record<string, unknown> | null> {
  if (!ACCESS_TOKEN) return null;
  try {
    const res = await fetch(`${MP_API_BASE}/v1/chargebacks/${chargebackId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getClaimById(claimId: string): Promise<Record<string, unknown> | null> {
  if (!ACCESS_TOKEN) return null;
  try {
    const res = await fetch(`${MP_API_BASE}/v1/claims/${claimId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
