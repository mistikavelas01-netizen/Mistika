/**
 * POST /api/webhooks — misma lógica que /api/webhooks/mercadopago.
 * Mercado Pago puede configurar la URL como /api/webhooks o /api/webhooks/mercadopago.
 */
export { POST, GET } from "./mercadopago/route";
