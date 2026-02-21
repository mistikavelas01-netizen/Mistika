# Observability / API

Este documento describe los logs y la trazabilidad para `/api/*`.

## Request ID (correlation)
- Se acepta `x-request-id` si viene del cliente o del edge.
- Si no viene, se genera uno.
- Se devuelve siempre en el header `x-request-id`.\n- En respuestas JSON con error (status >= 400) se inyecta `requestId` en el body si no existia.

## Campos estandar (logs)
Cada evento es una sola linea JSON. Campos comunes:
- `timestamp` (ISO 8601)
- `level` (`debug`, `info`, `warn`, `error`)
- `service` (por defecto `mistika-api`)
- `env` (`production`, `preview`, `staging`, `development`)
- `event` (nombre estable del evento)
- `requestId`
- `method`, `path`, `route`

Campos frecuentes:
- `statusCode`, `durationMs`, `slow`
- `error`: `{ name, message, code?, stack? }` (stack solo dev/staging o muestreado en prod)
- `http`: `{ userAgent?, ip?, referer? }`
- `dependencyName`, `operation`, `target`, `method`, `path`, `durationMs`

## Eventos clave
- `request.start` (solo debug)
- `request.slow` (cuando supera `SLOW_REQUEST_MS`)
- `request.end` (siempre)
- `dependency.slow`, `dependency.error`, `dependency.http_status`

## Variables de entorno
- `LOG_LEVEL` (default: `info` en prod, `debug` en dev)
- `LOG_SUCCESS_SAMPLE_RATE` (default `0.1`)
- `SLOW_REQUEST_MS` (default `800`)
- `SLOW_DEPENDENCY_MS` (default `500`)
- `LOG_STACK_SAMPLE_RATE` (default `0.01` en prod, `1` en dev)
- `LOG_MAX_STRING_LENGTH` (default `1000`)
- `LOG_MAX_STACK_LENGTH` (default `3000`)
- `SERVICE_NAME` (default `mistika-api`)
- `METRICS_ENABLED` (default `false`)

## Como buscar un requestId
1. Busca en logs `requestId = "<id>"`.
2. Revisa `request.start` (si debug) y `request.end` para status/latencia.
3. Si hay fallos, revisa `request.error` o `dependency.error`.

## Queries de ejemplo
- Errores 5xx:
  - `event = "request.end" AND statusCode >= 500`
- Requests lentos:
  - `event = "request.end" AND durationMs >= 800`
  - `event = "request.slow"`
- Dependencias lentas:
  - `event = "dependency.slow"`
- Dependencias con errores HTTP:
  - `event = "dependency.http_status" AND status >= 400`

## Metricas (hooks simples)
Si `METRICS_ENABLED=true`, se emiten logs tipo `metric.*`:
- `metric.counter` (`requests_total`, `errors_total`, `external_calls_total`)
- `metric.histogram` (`request_duration_ms`, `external_call_duration_ms`)

## Checklist de incidente
1. Identificar `requestId` (header o log de `request.end`).
2. Ver `statusCode` y `durationMs`.
3. Buscar `dependency.error` o `dependency.slow`.
4. Revisar payloads y respuesta (sin PII) en la app.
5. Correlacionar con eventos de webhooks o pagos si aplica.
