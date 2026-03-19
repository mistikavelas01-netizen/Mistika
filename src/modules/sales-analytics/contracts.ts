export type SalesAnalyticsGroupBy = "day" | "week" | "month";

export type SalesAnalyticsRevenueDimension = "product" | "category";

export interface SalesAnalyticsQueryParams {
  from?: string | null;
  to?: string | null;
  compareFrom?: string | null;
  compareTo?: string | null;
  groupBy?: string | null;
  topLimit?: string | number | null;
  revenueLimit?: string | number | null;
}

export interface SalesAnalyticsFilters {
  from: string;
  to: string;
  compareFrom: string;
  compareTo: string;
  groupBy: SalesAnalyticsGroupBy;
  topLimit: number;
  revenueLimit: number;
}

export interface SalesTimeBucket {
  bucketStart: string;
  label: string;
  revenue: number;
  orders: number;
  unitsSold: number;
  averageTicket: number;
}

export interface SalesProductInsight {
  productId: string;
  productName: string;
  categoryId: string | null;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  ordersCount: number;
  averageUnitPrice: number;
}

export interface SalesRevenueBreakdownRow {
  id: string;
  name: string;
  revenue: number;
  unitsSold: number;
  ordersCount: number;
  share: number;
}

export interface SalesAverageTicketMetric {
  value: number;
  ordersCount: number;
  revenue: number;
}

export interface SalesDeltaMetric {
  current: number;
  previous: number;
  delta: number;
  deltaPercentage: number | null;
  trend: "up" | "down" | "flat";
}

export interface SalesPeriod {
  from: string;
  to: string;
}

export interface SalesPeriodComparison {
  currentPeriod: SalesPeriod;
  previousPeriod: SalesPeriod;
  revenue: SalesDeltaMetric;
  orders: SalesDeltaMetric;
  averageTicket: SalesDeltaMetric;
  unitsSold: SalesDeltaMetric;
}

export interface SalesKpis {
  totalRevenue: number;
  grossRevenue: number;
  refundedAmount: number;
  totalOrders: number;
  unitsSold: number;
  averageTicket: number;
  uniqueProducts: number;
  uniqueCategories: number;
}

export interface SalesAnalyticsDashboard {
  filters: SalesAnalyticsFilters;
  kpis: SalesKpis;
  salesOverTime: SalesTimeBucket[];
  topProducts: SalesProductInsight[];
  revenueByProduct: SalesRevenueBreakdownRow[];
  revenueByCategory: SalesRevenueBreakdownRow[];
  averageTicket: SalesAverageTicketMetric;
  comparison: SalesPeriodComparison;
}
