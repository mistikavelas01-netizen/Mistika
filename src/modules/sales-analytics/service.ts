import "server-only";

import {
  collection,
  documentId,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import type {
  CategoryEntity,
  OrderEntity,
  OrderItemEntity,
  ProductEntity,
} from "@/firebase/repos";
import { withSalesAnalyticsCache } from "./cache";
import type {
  SalesAnalyticsDashboard,
  SalesAnalyticsFilters,
  SalesAnalyticsGroupBy,
  SalesAnalyticsQueryParams,
  SalesAverageTicketMetric,
  SalesDeltaMetric,
  SalesPeriodComparison,
  SalesProductInsight,
  SalesRevenueBreakdownRow,
  SalesTimeBucket,
} from "./contracts";
import {
  differenceInUtcDays,
  formatBucketLabel,
  formatIsoDate,
  getBucketStart,
  getDefaultRange,
  getNextBucketStart,
  parseIsoDateOrThrow,
  shiftUtcDays,
} from "./date";

type NormalizedOrder = OrderEntity & {
  _id: string;
  createdAt: number;
  updatedAt: number;
};

type NormalizedOrderItem = OrderItemEntity & {
  _id: string;
  createdAt: number;
  updatedAt: number;
};

type NormalizedProduct = ProductEntity & {
  _id: string;
  createdAt: number;
  updatedAt: number;
};

type NormalizedCategory = CategoryEntity & {
  _id: string;
  createdAt: number;
  updatedAt: number;
};

type MutableMetric = {
  id: string;
  name: string;
  revenue: number;
  unitsSold: number;
  orderIds: Set<string>;
};

type RangeOrderSummary = {
  createdAt: number;
  revenue: number;
  unitsSold: number;
};

type RangeDataset = {
  from: string;
  to: string;
  grossRevenue: number;
  netRevenue: number;
  refundedAmount: number;
  totalOrders: number;
  unitsSold: number;
  averageTicket: number;
  uniqueProducts: number;
  uniqueCategories: number;
  topProducts: SalesProductInsight[];
  revenueByProduct: SalesRevenueBreakdownRow[];
  revenueByCategory: SalesRevenueBreakdownRow[];
  salesOrders: RangeOrderSummary[];
};

const ORDERS_COLLECTION = "orders";
const ORDER_ITEMS_COLLECTION = "order_items";
const PRODUCTS_COLLECTION = "products";
const CATEGORIES_COLLECTION = "categories";

const MAX_IN_QUERY = 30;

export class SalesAnalyticsInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SalesAnalyticsInputError";
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function safeNumber(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeFirestoreData<T>(value: T): T {
  if (isTimestamp(value)) {
    return value.toMillis() as T;
  }

  if (value instanceof Date) {
    return value.getTime() as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeFirestoreData(item)) as T;
  }

  if (isPlainObject(value)) {
    const normalized: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, entry]) => {
      normalized[key] = normalizeFirestoreData(entry);
    });
    return normalized as T;
  }

  return value;
}

function chunkValues<T>(values: T[], chunkSize = MAX_IN_QUERY): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }

  return chunks;
}

function resolveDefaultGroupBy(days: number): SalesAnalyticsGroupBy {
  if (days <= 45) {
    return "day";
  }

  if (days <= 180) {
    return "week";
  }

  return "month";
}

function calculateRefundedAmount(order: Pick<OrderEntity, "totalAmount" | "paymentStatus" | "refundedAmount">): number {
  const grossRevenue = safeNumber(order.totalAmount);
  const explicitRefund = clamp(safeNumber(order.refundedAmount), 0, grossRevenue);

  if (explicitRefund > 0) {
    return explicitRefund;
  }

  if (`${order.paymentStatus ?? ""}`.toLowerCase() === "refunded") {
    return grossRevenue;
  }

  return 0;
}

function createDeltaMetric(current: number, previous: number): SalesDeltaMetric {
  const delta = round(current - previous);
  const deltaPercentage =
    previous === 0 ? (current === 0 ? 0 : null) : round((delta / previous) * 100);

  return {
    current: round(current),
    previous: round(previous),
    delta,
    deltaPercentage,
    trend: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
  };
}

function sortRevenueRows(rows: SalesRevenueBreakdownRow[]) {
  return [...rows].sort((left, right) => {
    if (right.revenue !== left.revenue) {
      return right.revenue - left.revenue;
    }

    return right.unitsSold - left.unitsSold;
  });
}

function toPercentage(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return round((value / total) * 100);
}

function getOrderRevenueEligibility(order: NormalizedOrder): boolean {
  const paymentStatus = `${order.paymentStatus ?? ""}`.toLowerCase();
  const status = `${order.status ?? ""}`.toLowerCase();
  return status !== "cancelled" && (paymentStatus === "paid" || paymentStatus === "refunded");
}

async function getOrdersInRange(
  fromMs: number,
  toExclusiveMs: number,
): Promise<NormalizedOrder[]> {
  const ordersQuery = query(
    collection(db, ORDERS_COLLECTION),
    where("createdAt", ">=", Timestamp.fromMillis(fromMs)),
    where("createdAt", "<", Timestamp.fromMillis(toExclusiveMs)),
  );

  const snapshot = await getDocs(ordersQuery);

  return snapshot.docs.map((document) =>
    normalizeFirestoreData({
      ...(document.data() as OrderEntity),
      _id: document.id,
    }) as NormalizedOrder,
  );
}

async function getOrderItemsByOrderIds(orderIds: string[]): Promise<NormalizedOrderItem[]> {
  if (orderIds.length === 0) {
    return [];
  }

  const snapshots = await Promise.all(
    chunkValues(orderIds).map((orderIdChunk) =>
      getDocs(
        query(
          collection(db, ORDER_ITEMS_COLLECTION),
          where("orderId", "in", orderIdChunk),
        ),
      ),
    ),
  );

  return snapshots.flatMap((snapshot) =>
    snapshot.docs.map((document) =>
      normalizeFirestoreData({
        ...(document.data() as OrderItemEntity),
        _id: document.id,
      }) as NormalizedOrderItem,
    ),
  );
}

async function getProductsByIds(productIds: string[]): Promise<NormalizedProduct[]> {
  if (productIds.length === 0) {
    return [];
  }

  const snapshots = await Promise.all(
    chunkValues(productIds).map((productIdChunk) =>
      getDocs(
        query(
          collection(db, PRODUCTS_COLLECTION),
          where(documentId(), "in", productIdChunk),
        ),
      ),
    ),
  );

  return snapshots.flatMap((snapshot) =>
    snapshot.docs.map((document) =>
      normalizeFirestoreData({
        ...(document.data() as ProductEntity),
        _id: document.id,
      }) as NormalizedProduct,
    ),
  );
}

async function getCategoriesByIds(categoryIds: string[]): Promise<NormalizedCategory[]> {
  if (categoryIds.length === 0) {
    return [];
  }

  const snapshots = await Promise.all(
    chunkValues(categoryIds).map((categoryIdChunk) =>
      getDocs(
        query(
          collection(db, CATEGORIES_COLLECTION),
          where(documentId(), "in", categoryIdChunk),
        ),
      ),
    ),
  );

  return snapshots.flatMap((snapshot) =>
    snapshot.docs.map((document) =>
      normalizeFirestoreData({
        ...(document.data() as CategoryEntity),
        _id: document.id,
      }) as NormalizedCategory,
    ),
  );
}

function getAnalyticsQueryParams(
  params: SalesAnalyticsQueryParams,
): SalesAnalyticsFilters {
  const defaults = getDefaultRange();
  const defaultTo = defaults.to;

  const toMs = params.to
    ? parseIsoDateOrThrow(params.to, "to")
    : defaultTo;
  const fromMs = params.from
    ? parseIsoDateOrThrow(params.from, "from")
    : shiftUtcDays(toMs, -29);

  if (fromMs > toMs) {
    throw new SalesAnalyticsInputError(
      'El parámetro "from" no puede ser mayor que "to"',
    );
  }

  const currentRangeDays = differenceInUtcDays(fromMs, shiftUtcDays(toMs, 1));
  const normalizedGroupBy =
    params.groupBy === "day" || params.groupBy === "week" || params.groupBy === "month"
      ? params.groupBy
      : resolveDefaultGroupBy(currentRangeDays);

  const hasCustomComparison = Boolean(params.compareFrom && params.compareTo);
  const compareToMs = hasCustomComparison
    ? parseIsoDateOrThrow(params.compareTo as string, "compareTo")
    : shiftUtcDays(fromMs, -1);
  const compareFromMs = hasCustomComparison
    ? parseIsoDateOrThrow(params.compareFrom as string, "compareFrom")
    : shiftUtcDays(compareToMs, -(currentRangeDays - 1));

  if (compareFromMs > compareToMs) {
    throw new SalesAnalyticsInputError(
      'El parámetro "compareFrom" no puede ser mayor que "compareTo"',
    );
  }

  const topLimit = clamp(safeNumber(params.topLimit || 5), 3, 20);
  const revenueLimit = clamp(safeNumber(params.revenueLimit || 6), 3, 20);

  return {
    from: formatIsoDate(fromMs),
    to: formatIsoDate(toMs),
    compareFrom: formatIsoDate(compareFromMs),
    compareTo: formatIsoDate(compareToMs),
    groupBy: normalizedGroupBy,
    topLimit,
    revenueLimit,
  };
}

function normalizeSearchParams(
  searchParams: URLSearchParams,
): SalesAnalyticsQueryParams {
  return {
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    compareFrom: searchParams.get("compareFrom"),
    compareTo: searchParams.get("compareTo"),
    groupBy: searchParams.get("groupBy"),
    topLimit: searchParams.get("topLimit"),
    revenueLimit: searchParams.get("revenueLimit"),
  };
}

function buildTimeSeries(
  salesOrders: RangeOrderSummary[],
  fromMs: number,
  toInclusiveMs: number,
  groupBy: SalesAnalyticsGroupBy,
): SalesTimeBucket[] {
  const buckets = new Map<string, SalesTimeBucket>();

  for (
    let bucketStart = getBucketStart(fromMs, groupBy);
    bucketStart <= toInclusiveMs;
    bucketStart = getNextBucketStart(bucketStart, groupBy)
  ) {
    const bucketKey = formatIsoDate(bucketStart);
    buckets.set(bucketKey, {
      bucketStart: bucketKey,
      label: formatBucketLabel(bucketStart, groupBy),
      revenue: 0,
      orders: 0,
      unitsSold: 0,
      averageTicket: 0,
    });
  }

  salesOrders.forEach((order) => {
    const bucketKey = formatIsoDate(getBucketStart(order.createdAt, groupBy));
    const bucket = buckets.get(bucketKey);

    if (!bucket) {
      return;
    }

    bucket.revenue = round(bucket.revenue + order.revenue);
    bucket.orders += 1;
    bucket.unitsSold += order.unitsSold;
  });

  return Array.from(buckets.values()).map((bucket) => ({
    ...bucket,
    revenue: round(bucket.revenue),
    averageTicket:
      bucket.orders > 0 ? round(bucket.revenue / bucket.orders) : 0,
  }));
}

function buildBreakdownRows(
  metrics: MutableMetric[],
  limit: number,
): SalesRevenueBreakdownRow[] {
  const totalRevenue = metrics.reduce(
    (sum, metric) => sum + Math.max(0, metric.revenue),
    0,
  );

  return sortRevenueRows(
    metrics.map((metric) => ({
      id: metric.id,
      name: metric.name,
      revenue: round(metric.revenue),
      unitsSold: metric.unitsSold,
      ordersCount: metric.orderIds.size,
      share: toPercentage(metric.revenue, totalRevenue),
    })),
  ).slice(0, limit);
}

function buildTopProducts(
  metrics: Array<
    MutableMetric & { categoryId: string | null; categoryName: string }
  >,
  limit: number,
): SalesProductInsight[] {
  return [...metrics]
    .sort((left, right) => {
      if (right.unitsSold !== left.unitsSold) {
        return right.unitsSold - left.unitsSold;
      }

      return right.revenue - left.revenue;
    })
    .slice(0, limit)
    .map((metric) => ({
      productId: metric.id,
      productName: metric.name,
      categoryId: metric.categoryId,
      categoryName: metric.categoryName,
      unitsSold: metric.unitsSold,
      revenue: round(metric.revenue),
      ordersCount: metric.orderIds.size,
      averageUnitPrice:
        metric.unitsSold > 0 ? round(metric.revenue / metric.unitsSold) : 0,
    }));
}

async function buildRangeDataset(
  fromMs: number,
  toInclusiveMs: number,
  options: {
    includeDimensions: boolean;
    topLimit: number;
    revenueLimit: number;
  },
): Promise<RangeDataset> {
  const toExclusiveMs = shiftUtcDays(toInclusiveMs, 1);
  const allOrders = await getOrdersInRange(fromMs, toExclusiveMs);
  const orders = allOrders.filter(getOrderRevenueEligibility);

  if (orders.length === 0) {
    return {
      from: formatIsoDate(fromMs),
      to: formatIsoDate(toInclusiveMs),
      grossRevenue: 0,
      netRevenue: 0,
      refundedAmount: 0,
      totalOrders: 0,
      unitsSold: 0,
      averageTicket: 0,
      uniqueProducts: 0,
      uniqueCategories: 0,
      topProducts: [],
      revenueByProduct: [],
      revenueByCategory: [],
      salesOrders: [],
    };
  }

  const orderIds = orders.map((order) => order._id);
  const orderItems = await getOrderItemsByOrderIds(orderIds);
  const itemsByOrderId = new Map<string, NormalizedOrderItem[]>();

  orderItems.forEach((item) => {
    const currentItems = itemsByOrderId.get(item.orderId) ?? [];
    currentItems.push(item);
    itemsByOrderId.set(item.orderId, currentItems);
  });

  const productIds = options.includeDimensions
    ? Array.from(new Set(orderItems.map((item) => item.productId).filter(Boolean)))
    : [];
  const products = options.includeDimensions
    ? await getProductsByIds(productIds)
    : [];
  const productsById = new Map(products.map((product) => [product._id, product]));
  const categoryIds = options.includeDimensions
    ? Array.from(
        new Set(products.map((product) => product.categoryId).filter(Boolean)),
      )
    : [];
  const categories = options.includeDimensions
    ? await getCategoriesByIds(categoryIds)
    : [];
  const categoriesById = new Map(
    categories.map((category) => [category._id, category]),
  );

  const productMetrics = new Map<
    string,
    MutableMetric & { categoryId: string | null; categoryName: string }
  >();
  const categoryMetrics = new Map<string, MutableMetric>();
  const salesOrders: RangeOrderSummary[] = [];

  let grossRevenue = 0;
  let netRevenue = 0;
  let refundedAmount = 0;
  let unitsSold = 0;

  orders.forEach((order) => {
    const orderItemsForOrder = itemsByOrderId.get(order._id) ?? [];
    const orderGrossRevenue = safeNumber(order.totalAmount);
    const orderRefundedAmount = calculateRefundedAmount(order);
    const orderNetRevenue = Math.max(0, orderGrossRevenue - orderRefundedAmount);
    const orderUnitsSold = orderItemsForOrder.reduce(
      (sum, item) => sum + Math.max(0, Math.floor(safeNumber(item.quantity))),
      0,
    );
    const itemsGrossRevenue = orderItemsForOrder.reduce(
      (sum, item) => sum + Math.max(0, safeNumber(item.totalPrice)),
      0,
    );
    const allocatableRefund = Math.min(orderRefundedAmount, itemsGrossRevenue);

    grossRevenue += orderGrossRevenue;
    netRevenue += orderNetRevenue;
    refundedAmount += orderRefundedAmount;
    unitsSold += orderUnitsSold;

    salesOrders.push({
      createdAt: safeNumber(order.createdAt),
      revenue: round(orderNetRevenue),
      unitsSold: orderUnitsSold,
    });

    if (!options.includeDimensions) {
      return;
    }

    orderItemsForOrder.forEach((item) => {
      const itemGrossRevenue = Math.max(0, safeNumber(item.totalPrice));
      const itemRefund =
        itemsGrossRevenue > 0
          ? allocatableRefund * (itemGrossRevenue / itemsGrossRevenue)
          : 0;
      const itemNetRevenue = Math.max(0, itemGrossRevenue - itemRefund);
      const quantity = Math.max(0, Math.floor(safeNumber(item.quantity)));
      const product = productsById.get(item.productId);
      const category = product?.categoryId
        ? categoriesById.get(product.categoryId)
        : undefined;
      const categoryId = product?.categoryId ?? null;
      const categoryName = category?.name ?? "Sin categoría";

      if (!productMetrics.has(item.productId)) {
        productMetrics.set(item.productId, {
          id: item.productId,
          name: product?.name ?? item.productName ?? "Producto sin nombre",
          categoryId,
          categoryName,
          revenue: 0,
          unitsSold: 0,
          orderIds: new Set<string>(),
        });
      }

      const currentProductMetric = productMetrics.get(item.productId)!;
      currentProductMetric.revenue += itemNetRevenue;
      currentProductMetric.unitsSold += quantity;
      currentProductMetric.orderIds.add(order._id);

      const categoryMetricKey = categoryId ?? "uncategorized";
      if (!categoryMetrics.has(categoryMetricKey)) {
        categoryMetrics.set(categoryMetricKey, {
          id: categoryMetricKey,
          name: categoryName,
          revenue: 0,
          unitsSold: 0,
          orderIds: new Set<string>(),
        });
      }

      const currentCategoryMetric = categoryMetrics.get(categoryMetricKey)!;
      currentCategoryMetric.revenue += itemNetRevenue;
      currentCategoryMetric.unitsSold += quantity;
      currentCategoryMetric.orderIds.add(order._id);
    });
  });

  const productMetricValues = Array.from(productMetrics.values());
  const categoryMetricValues = Array.from(categoryMetrics.values());

  return {
    from: formatIsoDate(fromMs),
    to: formatIsoDate(toInclusiveMs),
    grossRevenue: round(grossRevenue),
    netRevenue: round(netRevenue),
    refundedAmount: round(refundedAmount),
    totalOrders: orders.length,
    unitsSold,
    averageTicket: orders.length > 0 ? round(netRevenue / orders.length) : 0,
    uniqueProducts: productMetricValues.length,
    uniqueCategories: categoryMetricValues.length,
    topProducts: buildTopProducts(productMetricValues, options.topLimit),
    revenueByProduct: buildBreakdownRows(productMetricValues, options.revenueLimit),
    revenueByCategory: buildBreakdownRows(categoryMetricValues, options.revenueLimit),
    salesOrders,
  };
}

function buildAverageTicketMetric(dataset: RangeDataset): SalesAverageTicketMetric {
  return {
    value: dataset.averageTicket,
    ordersCount: dataset.totalOrders,
    revenue: dataset.netRevenue,
  };
}

function buildComparison(
  current: RangeDataset,
  previous: RangeDataset,
): SalesPeriodComparison {
  return {
    currentPeriod: {
      from: current.from,
      to: current.to,
    },
    previousPeriod: {
      from: previous.from,
      to: previous.to,
    },
    revenue: createDeltaMetric(current.netRevenue, previous.netRevenue),
    orders: createDeltaMetric(current.totalOrders, previous.totalOrders),
    averageTicket: createDeltaMetric(
      current.averageTicket,
      previous.averageTicket,
    ),
    unitsSold: createDeltaMetric(current.unitsSold, previous.unitsSold),
  };
}

async function buildDashboard(
  filters: SalesAnalyticsFilters,
): Promise<SalesAnalyticsDashboard> {
  const currentFromMs = parseIsoDateOrThrow(filters.from, "from");
  const currentToMs = parseIsoDateOrThrow(filters.to, "to");
  const compareFromMs = parseIsoDateOrThrow(filters.compareFrom, "compareFrom");
  const compareToMs = parseIsoDateOrThrow(filters.compareTo, "compareTo");

  const [current, previous] = await Promise.all([
    buildRangeDataset(currentFromMs, currentToMs, {
      includeDimensions: true,
      topLimit: filters.topLimit,
      revenueLimit: filters.revenueLimit,
    }),
    buildRangeDataset(compareFromMs, compareToMs, {
      includeDimensions: false,
      topLimit: filters.topLimit,
      revenueLimit: filters.revenueLimit,
    }),
  ]);

  return {
    filters,
    kpis: {
      totalRevenue: current.netRevenue,
      grossRevenue: current.grossRevenue,
      refundedAmount: current.refundedAmount,
      totalOrders: current.totalOrders,
      unitsSold: current.unitsSold,
      averageTicket: current.averageTicket,
      uniqueProducts: current.uniqueProducts,
      uniqueCategories: current.uniqueCategories,
    },
    salesOverTime: buildTimeSeries(
      current.salesOrders,
      currentFromMs,
      currentToMs,
      filters.groupBy,
    ),
    topProducts: current.topProducts,
    revenueByProduct: current.revenueByProduct,
    revenueByCategory: current.revenueByCategory,
    averageTicket: buildAverageTicketMetric(current),
    comparison: buildComparison(current, previous),
  };
}

function buildCacheKey(filters: SalesAnalyticsFilters): string {
  return JSON.stringify(filters);
}

export function getSalesAnalyticsFilters(
  params: SalesAnalyticsQueryParams,
): SalesAnalyticsFilters {
  return getAnalyticsQueryParams(params);
}

export function getSalesAnalyticsParamsFromSearchParams(
  searchParams: URLSearchParams,
): SalesAnalyticsQueryParams {
  return normalizeSearchParams(searchParams);
}

export async function getSalesAnalyticsDashboard(
  params: SalesAnalyticsQueryParams,
): Promise<SalesAnalyticsDashboard> {
  const filters = getAnalyticsQueryParams(params);
  const cacheKey = buildCacheKey(filters);

  return withSalesAnalyticsCache(cacheKey, () => buildDashboard(filters));
}

export async function getSalesOverTime(params: SalesAnalyticsQueryParams): Promise<SalesTimeBucket[]> {
  const dashboard = await getSalesAnalyticsDashboard(params);
  return dashboard.salesOverTime;
}

export async function getTopProducts(params: SalesAnalyticsQueryParams): Promise<SalesProductInsight[]> {
  const dashboard = await getSalesAnalyticsDashboard(params);
  return dashboard.topProducts;
}

export async function getRevenueBreakdown(
  params: SalesAnalyticsQueryParams,
  dimension: "product" | "category",
): Promise<SalesRevenueBreakdownRow[]> {
  const dashboard = await getSalesAnalyticsDashboard(params);
  return dimension === "category"
    ? dashboard.revenueByCategory
    : dashboard.revenueByProduct;
}

export async function getAverageTicket(
  params: SalesAnalyticsQueryParams,
): Promise<SalesAverageTicketMetric> {
  const dashboard = await getSalesAnalyticsDashboard(params);
  return dashboard.averageTicket;
}

export async function getPeriodComparison(
  params: SalesAnalyticsQueryParams,
): Promise<SalesPeriodComparison> {
  const dashboard = await getSalesAnalyticsDashboard(params);
  return dashboard.comparison;
}
