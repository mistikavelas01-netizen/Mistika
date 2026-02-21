import "server-only";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

function getConfig(): MercadoPagoConfig {
  if (!ACCESS_TOKEN) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
  }
  return new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
}

let preferenceClient: Preference | null = null;
let paymentClient: Payment | null = null;

export function getPreferenceClient(): Preference {
  if (!preferenceClient) {
    preferenceClient = new Preference(getConfig());
  }
  return preferenceClient;
}

export function getPaymentClient(): Payment {
  if (!paymentClient) {
    paymentClient = new Payment(getConfig());
  }
  return paymentClient;
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(ACCESS_TOKEN);
}
