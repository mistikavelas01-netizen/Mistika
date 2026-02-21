import "server-only";
import { getPaymentClient } from "./client";

/**
 * Consulta un pago en Mercado Pago por ID (server-to-server).
 * Usado en el webhook para obtener el estado real del pago.
 */
export async function getMercadoPagoPayment(paymentId: string) {
  const client = getPaymentClient();
  const result = await client.get({ id: paymentId });
  return result;
}
