# Mail System - Resend Integration

Sistema completo de correo transaccional usando Resend vía API.

## Configuración

### Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
RESEND_KEY=tu_api_key_de_resend
RESEND_FROM_EMAIL=noreply@mistika.com
RESEND_FROM_NAME=Mistika
```

### Instalación de Dependencias

```bash
npm install resend zod
```

## Uso

### Desde API Route

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mail`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "welcome",
      to: "usuario@example.com",
      payload: {
        name: "Juan Pérez",
      },
    }),
  });

  const result = await response.json();
  return NextResponse.json(result);
}
```

### Desde Server Component o Server Action

```typescript
import { sendMail } from "@/mail/sendMail";

// En una Server Action o Server Component
await sendMail({
  type: "welcome",
  to: "usuario@example.com",
  payload: {
    name: "Juan Pérez",
  },
});
```

## Tipos de Correos

### 1. Welcome

```json
{
  "type": "welcome",
  "to": "usuario@example.com",
  "payload": {
    "name": "Juan Pérez"
  }
}
```

### 2. Verify Email

```json
{
  "type": "verify-email",
  "to": "usuario@example.com",
  "payload": {
    "name": "Juan Pérez",
    "verifyUrl": "https://mistika.com/verify?token=abc123"
  }
}
```

### 3. Reset Password

```json
{
  "type": "reset-password",
  "to": "usuario@example.com",
  "payload": {
    "name": "Juan Pérez",
    "resetUrl": "https://mistika.com/reset-password?token=abc123"
  }
}
```

### 4. Order Confirmation

```json
{
  "type": "order-confirmation",
  "to": "usuario@example.com",
  "payload": {
    "name": "Juan Pérez",
    "orderNumber": "MIST-20240101-0001",
    "orderDate": "1 de enero de 2024, 10:00",
    "totalAmount": 350.00,
    "items": [
      {
        "name": "Vela Aromática de Lavanda",
        "quantity": 2,
        "price": 99.99
      }
    ],
    "shippingAddress": "Calle Falsa 123\nCiudad de México, CDMX 01000\nMéxico",
    "orderUrl": "https://mistika.com/orders/MIST-20240101-0001"
  }
}
```

### 5. Generic

```json
{
  "type": "generic",
  "to": "usuario@example.com",
  "payload": {
    "subject": "Asunto personalizado",
    "message": "<p>Tu mensaje HTML aquí</p>"
  }
}
```

## Endpoint API

### POST /api/mail

Envía un correo transaccional.

**Request Body:**
```json
{
  "type": "welcome" | "verify-email" | "reset-password" | "order-confirmation" | "generic",
  "to": "usuario@example.com",
  "payload": { ... }
}
```

**Response Success (200):**
```json
{
  "ok": true,
  "messageId": "resend_message_id"
}
```

**Response Error (400/500):**
```json
{
  "ok": false,
  "error": "Error message",
  "details": [] // Solo en errores de validación
}
```

### GET /api/mail

Health check endpoint que retorna información del servicio.

## Templates

Los templates están en `src/mail/templates/` y soportan variables dinámicas:

- `{{name}}` - Nombre del usuario
- `{{verifyUrl}}` - URL de verificación
- `{{resetUrl}}` - URL de restablecimiento
- `{{message}}` - Mensaje personalizado (solo generic)
- `{{subject}}` - Asunto (solo generic, en HTML title)
- `{{orderNumber}}` - Número de pedido (solo order-confirmation)
- `{{orderDate}}` - Fecha del pedido (solo order-confirmation)
- `{{totalAmount}}` - Total del pedido (solo order-confirmation)
- `{{items}}` - Lista de productos (solo order-confirmation)
- `{{shippingAddress}}` - Dirección de envío (solo order-confirmation)
- `{{orderUrl}}` - URL para ver detalles del pedido (opcional, solo order-confirmation)

## Notas

- Los correos incluyen tanto versión HTML como texto plano
- Los templates son compatibles con clientes de correo más comunes
- Errores se registran en consola con prefijo `[Mail]`
- Validación completa con Zod antes de enviar
