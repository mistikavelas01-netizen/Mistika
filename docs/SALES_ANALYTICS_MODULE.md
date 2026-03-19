# Módulo de Analítica de Ventas

## Resumen

Implementación real integrada sobre `Next.js + Firestore` con estos endpoints:

- `GET /api/admin/analytics/dashboard`
- `GET /api/admin/analytics/sales`
- `GET /api/admin/analytics/top-products`
- `GET /api/admin/analytics/revenue?dimension=product`
- `GET /api/admin/analytics/revenue?dimension=category`
- `GET /api/admin/analytics/average-ticket`
- `GET /api/admin/analytics/comparison`

Filtros soportados:

- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`
- `groupBy=day|week|month`
- `compareFrom=YYYY-MM-DD`
- `compareTo=YYYY-MM-DD`
- `topLimit=5`
- `revenueLimit=6`

La implementación productiva del repo agrega datos desde:

- `orders`
- `order_items`
- `products`
- `categories`

Para equipos que quieran migrar a SQL, abajo se incluyen las queries equivalentes usando las tablas solicitadas:

- `ventas (id, fecha, total, cliente_id)`
- `detalle_ventas (venta_id, producto_id, cantidad, precio)`
- `productos (id, nombre, categoria)`

## Estructura

```text
app/api/admin/analytics/
  average-ticket/route.ts
  comparison/route.ts
  dashboard/route.ts
  revenue/route.ts
  sales/route.ts
  top-products/route.ts

app/(webapp)/admin/analytics/page.tsx

src/modules/sales-analytics/
  cache.ts
  contracts.ts
  date.ts
  http.ts
  service.ts

src/store/features/analytics/analyticsApi.ts
src/views/admin/SalesAnalyticsView.tsx
src/components/admin/analytics/
  AnalyticsBarList.tsx
  AnalyticsKpiCard.tsx
  SalesTimeChart.tsx
```

## Ejemplos de rutas

```http
GET /api/admin/analytics/dashboard?from=2026-02-01&to=2026-02-29&groupBy=day
GET /api/admin/analytics/sales?from=2026-01-01&to=2026-03-31&groupBy=week
GET /api/admin/analytics/top-products?from=2026-03-01&to=2026-03-18&topLimit=5
GET /api/admin/analytics/revenue?from=2026-03-01&to=2026-03-18&dimension=product&revenueLimit=8
GET /api/admin/analytics/revenue?from=2026-03-01&to=2026-03-18&dimension=category&revenueLimit=6
GET /api/admin/analytics/average-ticket?from=2026-03-01&to=2026-03-18
GET /api/admin/analytics/comparison?from=2026-03-01&to=2026-03-18&compareFrom=2026-02-12&compareTo=2026-02-29
```

## Ejemplos de JSON

### `GET /api/admin/analytics/sales`

```json
{
  "success": true,
  "data": [
    {
      "bucketStart": "2026-03-01",
      "label": "1 mar",
      "revenue": 12840,
      "orders": 14,
      "unitsSold": 38,
      "averageTicket": 917.14
    },
    {
      "bucketStart": "2026-03-02",
      "label": "2 mar",
      "revenue": 10320,
      "orders": 11,
      "unitsSold": 27,
      "averageTicket": 938.18
    }
  ]
}
```

### `GET /api/admin/analytics/top-products`

```json
{
  "success": true,
  "data": [
    {
      "productId": "prod_01",
      "productName": "Vela Ritual Solar",
      "categoryId": "cat_home",
      "categoryName": "Hogar",
      "unitsSold": 42,
      "revenue": 18480,
      "ordersCount": 21,
      "averageUnitPrice": 440
    },
    {
      "productId": "prod_08",
      "productName": "Aceite de Lavanda",
      "categoryId": "cat_wellness",
      "categoryName": "Wellness",
      "unitsSold": 31,
      "revenue": 13330,
      "ordersCount": 18,
      "averageUnitPrice": 430
    }
  ]
}
```

### `GET /api/admin/analytics/revenue?dimension=product`

```json
{
  "success": true,
  "data": [
    {
      "id": "prod_01",
      "name": "Vela Ritual Solar",
      "revenue": 18480,
      "unitsSold": 42,
      "ordersCount": 21,
      "share": 22.61
    },
    {
      "id": "prod_08",
      "name": "Aceite de Lavanda",
      "revenue": 13330,
      "unitsSold": 31,
      "ordersCount": 18,
      "share": 16.31
    }
  ]
}
```

### `GET /api/admin/analytics/revenue?dimension=category`

```json
{
  "success": true,
  "data": [
    {
      "id": "cat_home",
      "name": "Hogar",
      "revenue": 29840,
      "unitsSold": 72,
      "ordersCount": 33,
      "share": 36.51
    },
    {
      "id": "cat_wellness",
      "name": "Wellness",
      "revenue": 24490,
      "unitsSold": 57,
      "ordersCount": 28,
      "share": 29.97
    }
  ]
}
```

### `GET /api/admin/analytics/average-ticket`

```json
{
  "success": true,
  "data": {
    "value": 982.45,
    "ordersCount": 83,
    "revenue": 81543.35
  }
}
```

### `GET /api/admin/analytics/comparison`

```json
{
  "success": true,
  "data": {
    "currentPeriod": {
      "from": "2026-03-01",
      "to": "2026-03-18"
    },
    "previousPeriod": {
      "from": "2026-02-11",
      "to": "2026-02-28"
    },
    "revenue": {
      "current": 81543.35,
      "previous": 70218.9,
      "delta": 11324.45,
      "deltaPercentage": 16.13,
      "trend": "up"
    },
    "orders": {
      "current": 83,
      "previous": 74,
      "delta": 9,
      "deltaPercentage": 12.16,
      "trend": "up"
    },
    "averageTicket": {
      "current": 982.45,
      "previous": 948.9,
      "delta": 33.55,
      "deltaPercentage": 3.54,
      "trend": "up"
    },
    "unitsSold": {
      "current": 201,
      "previous": 174,
      "delta": 27,
      "deltaPercentage": 15.52,
      "trend": "up"
    }
  }
}
```

### `GET /api/admin/analytics/dashboard`

```json
{
  "success": true,
  "data": {
    "filters": {
      "from": "2026-03-01",
      "to": "2026-03-18",
      "compareFrom": "2026-02-11",
      "compareTo": "2026-02-28",
      "groupBy": "day",
      "topLimit": 5,
      "revenueLimit": 6
    },
    "kpis": {
      "totalRevenue": 81543.35,
      "grossRevenue": 83410.35,
      "refundedAmount": 1867,
      "totalOrders": 83,
      "unitsSold": 201,
      "averageTicket": 982.45,
      "uniqueProducts": 6,
      "uniqueCategories": 4
    },
    "salesOverTime": [],
    "topProducts": [],
    "revenueByProduct": [],
    "revenueByCategory": [],
    "averageTicket": {
      "value": 982.45,
      "ordersCount": 83,
      "revenue": 81543.35
    },
    "comparison": {
      "currentPeriod": {
        "from": "2026-03-01",
        "to": "2026-03-18"
      },
      "previousPeriod": {
        "from": "2026-02-11",
        "to": "2026-02-28"
      },
      "revenue": {
        "current": 81543.35,
        "previous": 70218.9,
        "delta": 11324.45,
        "deltaPercentage": 16.13,
        "trend": "up"
      },
      "orders": {
        "current": 83,
        "previous": 74,
        "delta": 9,
        "deltaPercentage": 12.16,
        "trend": "up"
      },
      "averageTicket": {
        "current": 982.45,
        "previous": 948.9,
        "delta": 33.55,
        "deltaPercentage": 3.54,
        "trend": "up"
      },
      "unitsSold": {
        "current": 201,
        "previous": 174,
        "delta": 27,
        "deltaPercentage": 15.52,
        "trend": "up"
      }
    }
  }
}
```

## Queries SQL equivalentes

### 1. Ventas totales por día

```sql
SELECT
  DATE(v.fecha) AS periodo,
  COUNT(*) AS pedidos,
  SUM(v.total) AS ventas_totales
FROM ventas v
WHERE v.fecha >= :from
  AND v.fecha < DATE_ADD(:to, INTERVAL 1 DAY)
GROUP BY DATE(v.fecha)
ORDER BY periodo ASC;
```

### 2. Ventas totales por semana

```sql
SELECT
  YEAR(v.fecha) AS anio,
  WEEK(v.fecha, 3) AS semana_iso,
  COUNT(*) AS pedidos,
  SUM(v.total) AS ventas_totales
FROM ventas v
WHERE v.fecha >= :from
  AND v.fecha < DATE_ADD(:to, INTERVAL 1 DAY)
GROUP BY YEAR(v.fecha), WEEK(v.fecha, 3)
ORDER BY anio ASC, semana_iso ASC;
```

### 3. Ventas totales por mes

```sql
SELECT
  DATE_FORMAT(v.fecha, '%Y-%m-01') AS periodo,
  COUNT(*) AS pedidos,
  SUM(v.total) AS ventas_totales
FROM ventas v
WHERE v.fecha >= :from
  AND v.fecha < DATE_ADD(:to, INTERVAL 1 DAY)
GROUP BY DATE_FORMAT(v.fecha, '%Y-%m-01')
ORDER BY periodo ASC;
```

### 4. Productos más vendidos

```sql
SELECT
  p.id AS producto_id,
  p.nombre,
  p.categoria,
  SUM(dv.cantidad) AS unidades_vendidas,
  SUM(dv.cantidad * dv.precio) AS ingresos,
  COUNT(DISTINCT dv.venta_id) AS pedidos
FROM detalle_ventas dv
INNER JOIN ventas v ON v.id = dv.venta_id
INNER JOIN productos p ON p.id = dv.producto_id
WHERE v.fecha >= :from
  AND v.fecha < DATE_ADD(:to, INTERVAL 1 DAY)
GROUP BY p.id, p.nombre, p.categoria
ORDER BY unidades_vendidas DESC, ingresos DESC
LIMIT :limit;
```

### 5. Ingresos por producto

```sql
SELECT
  p.id AS producto_id,
  p.nombre,
  SUM(dv.cantidad * dv.precio) AS ingresos,
  SUM(dv.cantidad) AS unidades_vendidas,
  COUNT(DISTINCT dv.venta_id) AS pedidos
FROM detalle_ventas dv
INNER JOIN ventas v ON v.id = dv.venta_id
INNER JOIN productos p ON p.id = dv.producto_id
WHERE v.fecha >= :from
  AND v.fecha < DATE_ADD(:to, INTERVAL 1 DAY)
GROUP BY p.id, p.nombre
ORDER BY ingresos DESC
LIMIT :limit;
```

### 6. Ingresos por categoría

```sql
SELECT
  p.categoria,
  SUM(dv.cantidad * dv.precio) AS ingresos,
  SUM(dv.cantidad) AS unidades_vendidas,
  COUNT(DISTINCT dv.venta_id) AS pedidos
FROM detalle_ventas dv
INNER JOIN ventas v ON v.id = dv.venta_id
INNER JOIN productos p ON p.id = dv.producto_id
WHERE v.fecha >= :from
  AND v.fecha < DATE_ADD(:to, INTERVAL 1 DAY)
GROUP BY p.categoria
ORDER BY ingresos DESC
LIMIT :limit;
```

### 7. Ticket promedio

```sql
SELECT
  AVG(v.total) AS ticket_promedio,
  COUNT(*) AS total_pedidos,
  SUM(v.total) AS ingreso_total
FROM ventas v
WHERE v.fecha >= :from
  AND v.fecha < DATE_ADD(:to, INTERVAL 1 DAY);
```

### 8. Comparación entre periodos

```sql
SELECT
  periodo,
  COUNT(*) AS pedidos,
  SUM(total) AS ingresos,
  AVG(total) AS ticket_promedio
FROM (
  SELECT 'actual' AS periodo, v.total
  FROM ventas v
  WHERE v.fecha >= :current_from
    AND v.fecha < DATE_ADD(:current_to, INTERVAL 1 DAY)

  UNION ALL

  SELECT 'previo' AS periodo, v.total
  FROM ventas v
  WHERE v.fecha >= :previous_from
    AND v.fecha < DATE_ADD(:previous_to, INTERVAL 1 DAY)
) base
GROUP BY periodo;
```

## Índices recomendados

### SQL

```sql
CREATE INDEX idx_ventas_fecha ON ventas (fecha);
CREATE INDEX idx_ventas_fecha_cliente ON ventas (fecha, cliente_id);
CREATE INDEX idx_detalle_ventas_venta ON detalle_ventas (venta_id);
CREATE INDEX idx_detalle_ventas_producto ON detalle_ventas (producto_id);
CREATE INDEX idx_productos_categoria ON productos (categoria);
```

### Firestore

- Índice por `orders.createdAt`.
- Índice compuesto por `orders.createdAt + paymentStatus` si quieres filtrar pagos aprobados directamente desde query.
- Índice por `order_items.orderId`.
- Índice por `products.categoryId`.

## Cache

El servicio usa cache en memoria con TTL de 5 minutos en `src/modules/sales-analytics/cache.ts`.

Objetivo:

- Reducir lecturas repetidas de Firestore en filtros frecuentes.
- Reutilizar el mismo snapshot entre `dashboard`, `sales`, `top-products`, `revenue`, `average-ticket` y `comparison`.

## Notas de implementación

- El cálculo de ventas usa pedidos pagados y excluye pedidos cancelados.
- El ingreso neto descuenta `refundedAmount` cuando existe.
- El ingreso por producto/categoría distribuye reembolsos proporcionalmente sobre los items del pedido.
- El dashboard principal del admin ahora incluye acceso directo al módulo en `/admin/analytics`.
