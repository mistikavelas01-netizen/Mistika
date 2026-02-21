# Integración Mercado Pago Checkout Pro (init_point)

**Stack:** Next.js + Firebase Firestore + México (MXN)

---

## 1. Pasos de alto nivel

1. **Borrador creado** → El usuario completa el checkout y se crea un borrador (`order_drafts`) en Firestore. No se crea orden ni se decrementa stock.
2. **Orden de checkout (CREATED)** → Backend crea un registro `checkout_orders` con estado CREATED y `draftId`.
3. **Preferencia MP** → Backend crea preferencia en MP con `external_reference=checkoutOrderId`, `back_urls` a `/checkout/return`, `notification_url` al webhook. Guarda `preferenceId` e `init_point` en la orden de checkout (estado CHECKOUT_STARTED) y devuelve `init_point`.
4. **Redirección** → El frontend **no vacía el carrito**; muestra overlay "Redirigiendo a Mercado Pago…" y redirige a `init_point`.
5. **Usuario paga** → En MP el usuario paga (tarjeta, OXXO, etc.).
6. **Webhook** → MP envía POST a `/api/webhooks/mercadopago`. Backend consulta `GET /v1/payments/{id}`, actualiza `checkout_orders` y `payment_attempts` (idempotencia). Si `approved`, crea la orden desde el borrador.
7. **Retorno** → Usuario vuelve a `/checkout/return?payment_id=...&preference_id=...`. La página llama a **GET /api/payments/mercadopago/verify**, que consulta el estado real en MP y actualiza BD. Solo si el verify devuelve **APPROVED** se vacía el carrito y se muestra éxito.

---

## 2. Diagrama textual del flujo

```
┌─────────────┐     POST /orders      ┌─────────────┐     POST /payments/mercadopago/preference     ┌──────────────────┐
│   Cliente   │ ──────────────────►  │   Backend   │ ◄──────────────────────────────────────────── │   Frontend       │
│   (Browser) │                      │  (Next.js)  │                                               │  (CheckoutForm)  │
└─────────────┘                      └──────┬──────┘                                               └────────┬─────────┘
       │                                    │                                                                 │
       │                                    │ 1. Crea orden en Firestore                                    │
       │                                    │ 2. Devuelve orderId + orderNumber                             │
       │                                    │                                                                 │
       │                                    │ 3. Recibe orderId, items, payer                               │
       │                                    │ 4. Valida order + amount                                      │
       │                                    │ 5. Crea preferencia MP (external_reference = orderId)          │
       │                                    │ 6. Devuelve init_point, sandbox_init_point, preferenceId       │
       │                                    │                                                                 │
       │                                    │ ◄─────────────────────────────────────────────────────────────│
       │                                    │                                                                 │
       │ ◄──────────────────────────────────┼────────────────────────────────────────────────────────────────┤
       │         Redirect to init_point     │                                                                 │
       │                                                                                                     │
       ▼                                                                                                     │
┌─────────────────────┐                                                                                      │
│   Mercado Pago      │  Usuario completa pago (tarjeta, OXXO, etc.)                                        │
│   Checkout Pro      │                                                                                      │
└──────────┬──────────┘                                                                                      │
           │                                                                                                 │
           │ Webhook POST (payment.created, payment.updated)                                                  │
           ▼                                                                                                 │
┌─────────────────────┐    GET /v1/payments/{id}    ┌─────────────────┐                                     │
│  Webhook Handler    │ ─────────────────────────►  │  Mercado Pago    │                                     │
│  /webhooks/         │                             │  API             │                                     │
│  mercadopago        │ ◄─────────────────────────  └─────────────────┘                                     │
└──────────┬──────────┘    payment completo                                                                   │
           │                                                                                                 │
           │ Idempotencia: si mp_payment_id ya procesado → skip                                              │
           │ Actualiza orden: paymentStatus, status, mp_payment_id                                           │
           ▼                                                                                                 │
┌─────────────────────┐                                                                                      │
│   Firestore         │                                                                                      │
│   orders            │                                                                                      │
└─────────────────────┘                                                                                      │
           │                                                                                                 │
           │ Usuario vuelve vía back_urls (success/failure/pending)                                          │
           ▼                                                                                                 │
┌─────────────────────┐                                                                                      │
│   /orders/{number}  │  Muestra estado (NO confiar en success para confirmar pago)                          │
│   o /orders/payment │                                                                                      │
│   ?status=approved  │                                                                                      │
└─────────────────────┘                                                                                      │
```

---

## 3. back_urls y por qué NO confiar en "success"

- **success**: El usuario ve la pantalla de éxito de MP. Puede llegar ahí incluso si:
  - El webhook aún no llegó.
  - El usuario cerró la ventana antes de completar.
  - Hubo fraude o reversa posterior.

- **failure**: El usuario canceló o el pago falló.

- **pending**: Pago pendiente (ej. OXXO, transferencia).

**Regla:** La única fuente de verdad es el webhook + consulta server-to-server. Las `back_urls` sirven solo para UX (mensaje, redirección), nunca para marcar el pago como confirmado.

---

## 4. Tabla de mapeo de estados (MP → nuestro sistema)

| Mercado Pago status | PaymentStatus (nuestro) | Order status (nuestro) | Acción |
|---------------------|-------------------------|------------------------|--------|
| approved            | paid                    | processing             | Confirmar pago |
| pending             | pending                 | pending                | Esperar |
| in_process          | pending                 | pending                | Esperar |
| in_mediation        | pending                 | pending                | Esperar |
| rejected            | failed                  | pending                | Registrar rechazo |
| cancelled           | failed                  | pending                | Cancelar intención |
| refunded            | refunded                | (sin cambio)           | Registrar devolución |
| charged_back        | refunded                | (sin cambio)           | Chargeback |

---

## 5. Plan de pruebas

| Caso | Cómo | Verificación |
|------|------|--------------|
| Sandbox | Usar credenciales de prueba MP | init_point usa dominio de prueba |
| approved | Tarjeta de prueba 5031 7557 3453 0604 | paymentStatus → paid |
| pending | OXXO o pago pendiente | paymentStatus → pending |
| rejected | Tarjeta 5031 4332 1540 6351 | paymentStatus → failed |
| Webhook simulado | POST a /webhooks/mercadopago con payload de prueba | Logs + orden actualizada |
| Idempotencia | Enviar mismo webhook 2 veces | No duplicar confirmación |
| Timeout MP | Simular retraso en API MP | Reintentos, logs de error |

---

## 6. Validación según documentación oficial

| Requisito | Estado |
|-----------|--------|
| Preferencia: items, external_reference, back_urls, notification_url, payer | ✓ |
| notification_url con `?source_news=webhooks` (solo Webhooks, no IPN) | ✓ |
| Webhook: type=payment, data.id, consultar GET /v1/payments/{id} | ✓ |
| Validación x-signature (opcional con MERCADOPAGO_WEBHOOK_SECRET) | ✓ |
| Payload JSON (y form-urlencoded legacy) | ✓ |
| Idempotencia por mp_payment_id | ✓ |

### 6.1 Clave secreta del webhook (MERCADOPAGO_WEBHOOK_SECRET)

En [Tus integraciones](https://www.mercadopago.com.mx/developers/panel/app) → tu app → **Webhooks** → Configurar notificaciones, al guardar se genera una **clave secreta**. Esa clave permite validar que la notificación la envió Mercado Pago (header `x-signature`).

- **Variable:** `MERCADOPAGO_WEBHOOK_SECRET` en `.env`.
- **Comportamiento:** Si está definida y la petición trae `x-signature` y `data.id` (en body o query), se calcula HMAC-SHA256 con el manifest `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` (si falta `x-request-id` se omite). Si el HMAC coincide con `v1` del header, el evento se **procesa** (pagos, órdenes, etc.). Si la firma falta o es inválida, el evento se **guarda** en BD para auditoría pero **no se procesa**.
- **Tolerancia de tiempo:** En producción se rechaza un `ts` con más de 5 minutos de diferencia para evitar replay. En desarrollo se ignora la tolerancia para que el simulador del panel funcione.
- **Doc:** [Webhooks - Validar origen de una notificación](https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks).

## 7. Dónde se configura cada cosa (proyecto vs dashboard MP)

| Qué | Dónde | Dónde se configura |
|-----|--------|----------------------|
| **Access Token** | Proyecto (`.env` → `MERCADOPAGO_ACCESS_TOKEN`) | Lo **copias** del dashboard: [Tus integraciones](https://www.mercadopago.com.mx/developers/panel/app) → tu app → **Credenciales de prueba** (pruebas) o **Credenciales de producción** (producción). El token puede empezar con `APP_USR-` en ambos. |
| **URL base de la app** | Proyecto (`.env` → `NEXT_PUBLIC_APP_URL`) | La **defines tú**: `http://localhost:3000` en desarrollo, `https://tudominio.com` en producción. Debe ser absoluta (MP la usa en `back_urls` y `notification_url`). |
| **URL del webhook** | Proyecto (código) | Se **arma en código** con `NEXT_PUBLIC_APP_URL`: `{baseUrl}/api/webhooks/mercadopago?source_news=webhooks`. No se pone en el dashboard para el flujo por preferencia (cada preferencia lleva su `notification_url`). |
| **Webhooks en el panel** | Dashboard MP (opcional) | En [Tus integraciones](https://www.mercadopago.com.mx/developers/panel/app) → **Webhooks** puedes configurar una URL y obtener el **Secret** para validar firma. Si usas el Secret, ponlo en `.env` como `MERCADOPAGO_WEBHOOK_SECRET`. Los pagos de **prueba** no disparan webhooks automáticos; para probar usa “Simular” en el panel o un túnel (ngrok) con credenciales de producción en modo test. |
| **Tarjetas de prueba** | Documentación MP | No se configuran en el proyecto ni en el dashboard. Usa las de [Tarjetas de prueba (México)](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/additional-content/test-cards). En localhost la app ya redirige a **sandbox** para que funcionen. |
| **Usuarios de prueba** | Dashboard MP | Opcional: en el panel puedes crear compradores de prueba para no usar tu cuenta real. |

**Resumen:** En el **proyecto** solo debes tener bien el `MERCADOPAGO_ACCESS_TOKEN` (copiado del dashboard) y `NEXT_PUBLIC_APP_URL`. El resto (preferencia, back_urls, webhook handler) ya está implementado en el código. En el **dashboard** solo necesitas las credenciales; el webhook URL y el Secret son opcionales si quieres validar la firma.

---

## 8. Checklist para producción

- [ ] `MERCADOPAGO_ACCESS_TOKEN` en env (producción)
- [ ] Webhook URL pública (ngrok para desarrollo local)
- [ ] URL del webhook configurada en panel de Mercado Pago
- [ ] Validar `orderId` y `amount` en backend ✓ (ya implementado)
- [ ] No exponer access token en frontend ✓ (solo en servidor)
- [ ] Logs y payload raw para auditoría ✓ (mpWebhookLogs en orden)
- [ ] Manejo de reintentos ante fallos de MP (MP reintenta webhooks automáticamente)
- [ ] Probar casos: approved, pending, rejected
- [ ] Probar idempotencia del webhook
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` (si configuras webhooks en Tus integraciones)

---

## 9. Archivos implementados

| Archivo | Descripción |
|---------|-------------|
| `src/lib/mercadopago/client.ts` | Cliente MP (Preference, Payment) |
| `src/lib/mercadopago/get-payment.ts` | Consulta pago por ID (server-to-server) |
| `src/lib/mercadopago/map-status.ts` | Mapeo estados MP → CheckoutOrderStatus |
| `src/lib/mercadopago/process-payment-result.ts` | Actualiza CheckoutOrder + PaymentAttempt, idempotencia, crea orden si approved |
| `app/api/payments/mercadopago/preference/route.ts` | POST: crea CheckoutOrder (CREATED), preferencia MP, devuelve init_point |
| `app/api/payments/mercadopago/verify/route.ts` | GET: verifica pago en MP, actualiza BD, devuelve status/orderId/orderNumber/canRetry |
| `app/api/webhooks/mercadopago/route.ts` | POST webhook; idempotencia; procesa con processPaymentResult |
| `app/(webapp)/checkout/return/page.tsx` | Página de retorno: llama verify, render por status, vacía carrito solo si APPROVED |
| `app/(webapp)/orders/payment/[[...status]]/page.tsx` | Redirige a `/checkout/return` (compatibilidad) |
| `src/firebase/repos.ts` | CheckoutOrderEntity, PaymentAttemptEntity, ordersRepo, orderDraftsRepo |
| `src/components/checkout/CheckoutForm.tsx` | No vacía carrito al pagar; overlay "Redirigiendo…"; redirect con init_point |

Ver también **docs/CHECKOUT_PRO_FLOW.md** para flujo, estados y pruebas.

---

## 10. Simulación de webhook (pruebas)

**Importante (según docs MP):** Los pagos de prueba creados con credenciales de prueba NO envían webhooks automáticamente. Para probar webhooks debes:
1. Configurar la URL en [Tus integraciones](https://www.mercadopago.com.mx/developers/panel/app) > Webhooks > Configurar notificaciones, y
2. Usar la función "Simular" en el panel, o enviar manualmente:

```bash
# Simular webhook (sin MERCADOPAGO_WEBHOOK_SECRET o con firma válida)
curl -X POST http://localhost:3000/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"12345678"}}'
```

Reemplaza `12345678` por un payment_id real de una transacción.
