# Flujo Checkout Pro (Mercado Pago) – Resumen

## Requisitos clave

- **El carrito NO se vacía** al hacer clic en "Pagar"; solo se vacía cuando el backend confirma `APPROVED` en la página de retorno.
- **UX al pagar:** botón deshabilitado, overlay "Redirigiendo a Mercado Pago…", redirección solo cuando hay `init_point`.
- **Retorno:** una sola URL `/checkout/return`; la página llama a **verify** en backend y no confía en query params para el estado.
- **Webhook:** idempotencia por `paymentId` (PaymentAttempt), máquina de estados en BD.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/payments/mercadopago/preference` | Crea borrador (draft) + **CheckoutOrder** (CREATED) → preferencia MP → devuelve `init_point`, `orderId`. |
| GET | `/api/payments/mercadopago/verify` | Recibe `payment_id`, `preference_id` (query). Consulta MP, actualiza orden, devuelve `{ orderId, status, orderNumber, canRetry, nextAction }`. |
| POST | `/api/webhooks/mercadopago` | Recibe notificaciones MP; idempotencia; actualiza CheckoutOrder y crea orden cuando `approved`. |

---

## Estados (CheckoutOrder)

| Estado | Descripción |
|--------|-------------|
| CREATED | Orden de checkout creada en BD antes de llamar a MP. |
| CHECKOUT_STARTED | Preferencia creada; guardado `preferenceId` e `initPoint`. |
| PENDING | Pago pendiente (in_process, etc.). |
| APPROVED | Pago aprobado; orden final creada (orders + order_items). |
| REJECTED | Pago rechazado. |
| CANCELLED | Cancelado. |
| EXPIRED | Expirado. |
| FAILED | Fallo. |

---

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `MERCADOPAGO_ACCESS_TOKEN` | Obligatorio. Credenciales de prueba o producción. |
| `NEXT_PUBLIC_APP_URL` o `VERCEL_URL` | Base URL para `back_urls` y `notification_url`. |
| `MERCADOPAGO_WEBHOOK_SECRET` | Opcional. Validación de firma `x-signature` en webhook. |
| `NEXT_PUBLIC_MERCADOPAGO_USE_SANDBOX` | Opcional. Forzar sandbox en frontend. |

---

## Cómo probar (sandbox)

1. **approved:** Tarjeta de prueba aprobada (ej. 5031 7557 3453 0604).
2. **rejected:** Tarjeta rechazada (ej. 5031 4332 1540 6351).
3. **pending:** Método pendiente (OXXO, etc.).
4. **Doble clic en Pagar:** Solo una preferencia/orden por submit (botón deshabilitado).
5. **Webhook duplicado:** Enviar mismo `payment_id` dos veces → no duplicar orden (PaymentAttempt + estado APPROVED).
6. **Retorno sin `payment_id`:** Solo `preference_id` → verify devuelve estado actual de la orden por `preferenceId`.

---

## Archivos principales

- **Backend:** `app/api/payments/mercadopago/preference/route.ts`, `verify/route.ts`, `app/api/webhooks/mercadopago/route.ts`, `src/lib/mercadopago/process-payment-result.ts`, `map-status.ts`, `src/firebase/repos.ts` (CheckoutOrder, PaymentAttempt).
- **Frontend:** `src/components/checkout/CheckoutForm.tsx`, `app/(webapp)/checkout/return/page.tsx`.
- **Legacy:** `app/(webapp)/orders/payment/[[...status]]/page.tsx` redirige a `/checkout/return`.
