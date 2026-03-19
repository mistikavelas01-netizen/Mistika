"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  CalendarRange,
  Coins,
  Layers3,
  Package,
  RefreshCcw,
  ShoppingCart,
  Undo2,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ServerError } from "@/components/ui/ServerError";
import { AnalyticsKpiCard } from "@/components/admin/analytics/AnalyticsKpiCard";
import {
  AnalyticsBarList,
  type AnalyticsBarRow,
} from "@/components/admin/analytics/AnalyticsBarList";
import { SalesTimeChart } from "@/components/admin/analytics/SalesTimeChart";
import { useFetchSalesAnalyticsDashboardQuery } from "@/store/features/analytics/analyticsApi";
import type {
  SalesAnalyticsGroupBy,
  SalesAnalyticsQueryParams,
  SalesDeltaMetric,
} from "@/modules/sales-analytics/contracts";

type FilterDraft = {
  from: string;
  to: string;
  groupBy: SalesAnalyticsGroupBy;
};

const TOP_LIMIT = 5;
const REVENUE_LIMIT = 6;

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function pad(value: number) {
  return `${value}`.padStart(2, "0");
}

function toIsoDate(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

function shiftIsoDate(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return toIsoDate(date);
}

function getDefaultDraft(): FilterDraft {
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const to = toIsoDate(today);

  return {
    from: shiftIsoDate(to, -29),
    to,
    groupBy: "day",
  };
}

function getDraftFromSearchParams(searchParams: URLSearchParams): FilterDraft {
  const defaults = getDefaultDraft();
  const groupBy = searchParams.get("groupBy");

  return {
    from: searchParams.get("from") || defaults.from,
    to: searchParams.get("to") || defaults.to,
    groupBy:
      groupBy === "day" || groupBy === "week" || groupBy === "month"
        ? groupBy
        : defaults.groupBy,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMetricValue(type: "currency" | "number", value: number) {
  return type === "currency" ? formatCurrency(value) : formatNumber(value);
}

function formatDelta(metric: SalesDeltaMetric, type: "currency" | "number") {
  const deltaLabel = `${metric.delta >= 0 ? "+" : ""}${formatMetricValue(
    type,
    metric.delta,
  )}`;
  const percentageLabel =
    metric.deltaPercentage === null
      ? "base 0"
      : `${metric.deltaPercentage >= 0 ? "+" : ""}${metric.deltaPercentage}%`;

  return `${deltaLabel} · ${percentageLabel}`;
}

function getComparisonTone(metric: SalesDeltaMetric) {
  if (metric.trend === "up") {
    return "text-green-700 bg-green-50 border-green-200";
  }

  if (metric.trend === "down") {
    return "text-red-700 bg-red-50 border-red-200";
  }

  return "text-black/65 bg-black/5 border-black/10";
}

function buildQueryFromDraft(draft: FilterDraft): SalesAnalyticsQueryParams {
  return {
    from: draft.from,
    to: draft.to,
    groupBy: draft.groupBy,
    topLimit: TOP_LIMIT,
    revenueLimit: REVENUE_LIMIT,
  };
}

export function SalesAnalyticsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [isPending, startTransition] = useTransition();

  const activeDraft = useMemo(
    () => getDraftFromSearchParams(new URLSearchParams(searchParamsKey)),
    [searchParamsKey],
  );

  const [draft, setDraft] = useState<FilterDraft>(activeDraft);

  useEffect(() => {
    setDraft(activeDraft);
  }, [activeDraft]);

  const queryParams = useMemo(
    () => buildQueryFromDraft(activeDraft),
    [activeDraft],
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useFetchSalesAnalyticsDashboardQuery(queryParams);

  const dashboard = data?.data;
  const hasInvalidRange = draft.from > draft.to;

  const updateUrl = (nextDraft: FilterDraft) => {
    const nextParams = new URLSearchParams(searchParamsKey);

    nextParams.set("from", nextDraft.from);
    nextParams.set("to", nextDraft.to);
    nextParams.set("groupBy", nextDraft.groupBy);
    nextParams.set("topLimit", String(TOP_LIMIT));
    nextParams.set("revenueLimit", String(REVENUE_LIMIT));

    startTransition(() => {
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hasInvalidRange) {
      return;
    }

    updateUrl(draft);
  };

  const handlePreset = (days: number) => {
    const nextDraft = {
      from: shiftIsoDate(draft.to, -(days - 1)),
      to: draft.to,
      groupBy: days > 90 ? "month" : days > 45 ? "week" : "day",
    } satisfies FilterDraft;

    setDraft(nextDraft);
    updateUrl(nextDraft);
  };

  const topProductsRows: AnalyticsBarRow[] = (dashboard?.topProducts ?? []).map(
    (product) => ({
      id: product.productId,
      label: product.productName,
      value: product.unitsSold,
      valueLabel: `${formatNumber(product.unitsSold)} uds`,
      meta: `${product.categoryName} · ${formatCurrency(product.revenue)} ingresos · Precio prom. ${formatCurrency(product.averageUnitPrice)}`,
    }),
  );

  const revenueByProductRows: AnalyticsBarRow[] = (
    dashboard?.revenueByProduct ?? []
  ).map((row) => ({
    id: row.id,
    label: row.name,
    value: row.revenue,
    valueLabel: `${formatCurrency(row.revenue)} · ${row.share}% del total`,
    meta: `${formatNumber(row.unitsSold)} uds vendidas · ${formatNumber(
      row.ordersCount,
    )} pedidos`,
  }));

  const revenueByCategoryRows: AnalyticsBarRow[] = (
    dashboard?.revenueByCategory ?? []
  ).map((row) => ({
    id: row.id,
    label: row.name,
    value: row.revenue,
    valueLabel: `${formatCurrency(row.revenue)} · ${row.share}% del total`,
    meta: `${formatNumber(row.unitsSold)} uds vendidas · ${formatNumber(
      row.ordersCount,
    )} pedidos`,
  }));

  const bestDay = useMemo(() => {
    const buckets = dashboard?.salesOverTime ?? [];
    if (buckets.length === 0) return null;
    return buckets.reduce((best, b) =>
      b.revenue > best.revenue ? b : best
    );
  }, [dashboard?.salesOverTime]);

  const periodTotalFromChart = useMemo(() => {
    const buckets = dashboard?.salesOverTime ?? [];
    return buckets.reduce((sum, b) => sum + b.revenue, 0);
  }, [dashboard?.salesOverTime]);

  if (isError) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
        <ServerError
          title="No se pudo cargar la analítica"
          message="Verifica la configuración de Firestore o intenta nuevamente."
          onRetry={refetch}
          showHomeButton={false}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header - mismo estilo que Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-black/50">
                Panel de administración
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[0.05em] sm:text-4xl">
                Analítica de ventas
              </h1>
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black/70 transition hover:bg-black hover:text-white self-start"
            >
              <ArrowLeft size={18} />
              Dashboard
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={containerVariants}
          className="space-y-8"
        >
          <motion.section variants={itemVariants}>
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-black/50">
                    Selecciona el periodo a analizar
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">
                    Todas las cifras provienen de pedidos pagados. La comparación
                    es automática con el periodo anterior de igual longitud.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[7, 30, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handlePreset(days)}
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/70 transition hover:bg-black hover:text-white"
                    >
                      {days} días
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_180px_auto]">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-black/50">
                    <CalendarRange size={14} />
                    Desde
                  </span>
                  <input
                    type="date"
                    value={draft.from}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, from: event.target.value }))
                    }
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-black/50">
                    <CalendarRange size={14} />
                    Hasta
                  </span>
                  <input
                    type="date"
                    value={draft.to}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, to: event.target.value }))
                    }
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-black/50">
                    <Layers3 size={14} />
                    Agrupación
                  </span>
                  <select
                    value={draft.groupBy}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        groupBy: event.target.value as SalesAnalyticsGroupBy,
                      }))
                    }
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5"
                  >
                    <option value="day">Diaria</option>
                    <option value="week">Semanal</option>
                    <option value="month">Mensual</option>
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={hasInvalidRange || isPending}
                  className="flex items-center justify-center gap-2 self-end rounded-xl border border-black/10 bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
                  {isPending ? "Aplicando..." : "Actualizar"}
                </button>
              </form>

              {hasInvalidRange && (
                <p className="mt-3 text-sm text-red-600">
                  La fecha inicial no puede ser posterior a la fecha final.
                </p>
              )}
            </div>
          </motion.section>

          {isLoading || !dashboard ? (
            <motion.section
              variants={itemVariants}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-2xl border-2 border-black/10 bg-white"
                />
              ))}
            </motion.section>
          ) : (
            <>
              <motion.section
                variants={itemVariants}
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                <AnalyticsKpiCard
                  title="Ingresos netos"
                  value={formatCurrency(dashboard.kpis.totalRevenue)}
                  description={
                    dashboard.kpis.refundedAmount > 0
                      ? `Bruto ${formatCurrency(dashboard.kpis.grossRevenue)}; ${formatCurrency(dashboard.kpis.refundedAmount)} reembolsados. Lo que realmente entra a caja.`
                      : `Bruto ${formatCurrency(dashboard.kpis.grossRevenue)} (sin reembolsos en el periodo).`
                  }
                  icon={Coins}
                  tone="amber"
                />
                <AnalyticsKpiCard
                  title="Ticket promedio"
                  value={formatCurrency(dashboard.kpis.averageTicket)}
                  description={`Promedio por pedido. Basado en ${formatNumber(
                    dashboard.averageTicket.ordersCount,
                  )} pedidos pagados — sirve para metas de venta y promociones.`}
                  icon={ShoppingCart}
                  tone="blue"
                />
                <AnalyticsKpiCard
                  title="Unidades vendidas"
                  value={formatNumber(dashboard.kpis.unitsSold)}
                  description={`Total de piezas vendidas. ${formatNumber(
                    dashboard.kpis.uniqueProducts,
                  )} productos distintos tuvieron ventas — referencia para inventario.`}
                  icon={Package}
                  tone="purple"
                />
                <AnalyticsKpiCard
                  title="Pedidos cerrados"
                  value={formatNumber(dashboard.kpis.totalOrders)}
                  description={`${formatNumber(
                    dashboard.kpis.uniqueCategories,
                  )} categorías con movimiento. Número de transacciones pagadas en el periodo.`}
                  icon={Boxes}
                  tone="green"
                />
              </motion.section>

              {/* Resumen en una línea para contexto rápido */}
              <motion.section variants={itemVariants}>
                <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-5 py-4">
                  <p className="text-sm text-black/70">
                    <span className="font-medium text-black">
                      Resumen del periodo:
                    </span>{" "}
                    {formatNumber(dashboard.kpis.totalOrders)} pedidos,{" "}
                    {formatNumber(dashboard.kpis.unitsSold)} unidades vendidas,{" "}
                    {formatCurrency(dashboard.kpis.totalRevenue)} ingresos netos.
                    {dashboard.comparison.revenue.trend !== "flat" && (
                      <span className="ml-1">
                        Los ingresos{" "}
                        {dashboard.comparison.revenue.trend === "up"
                          ? "subieron"
                          : "bajaron"}{" "}
                        {dashboard.comparison.revenue.deltaPercentage != null
                          ? `${Math.abs(dashboard.comparison.revenue.deltaPercentage)}%`
                          : ""}{" "}
                        respecto al periodo anterior.
                      </span>
                    )}
                  </p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants}>
                <h2 className="mb-4 text-lg font-semibold text-black">
                  Comparación con el periodo anterior
                </h2>
                <div className="grid gap-4 lg:grid-cols-4">
                  {[
                    {
                      label: "Ingresos",
                      metric: dashboard.comparison.revenue,
                      kind: "currency" as const,
                    },
                    {
                      label: "Nº de pedidos",
                      metric: dashboard.comparison.orders,
                      kind: "number" as const,
                    },
                    {
                      label: "Ticket promedio",
                      metric: dashboard.comparison.averageTicket,
                      kind: "currency" as const,
                    },
                    {
                      label: "Unidades vendidas",
                      metric: dashboard.comparison.unitsSold,
                      kind: "number" as const,
                    },
                  ].map((entry) => (
                    <article
                      key={entry.label}
                      className={`rounded-2xl border-2 p-5 ${getComparisonTone(
                        entry.metric,
                      )}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.24em]">
                        {entry.label}
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                        {formatDelta(entry.metric, entry.kind)}
                      </p>
                      <p className="mt-2 text-sm opacity-80">
                        {entry.metric.current === 0 && entry.metric.previous === 0
                          ? "Sin actividad en uno o ambos periodos."
                          : `Este periodo: ${formatMetricValue(
                              entry.kind,
                              entry.metric.current,
                            )} · Anterior: ${formatMetricValue(
                              entry.kind,
                              entry.metric.previous,
                            )}`}
                      </p>
                    </article>
                  ))}
                </div>
              </motion.section>

              <motion.section
                variants={itemVariants}
                className="grid gap-6 xl:grid-cols-[1.6fr_1fr]"
              >
                <div className="space-y-3">
                  <SalesTimeChart
                    data={dashboard.salesOverTime}
                    formatCurrency={formatCurrency}
                  />
                  {bestDay && dashboard.salesOverTime.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm">
                      <span className="text-black/60">
                        Mejor día del periodo:
                      </span>
                      <span className="font-semibold text-black">
                        {bestDay.label} · {formatCurrency(bestDay.revenue)} (
                        {formatNumber(bestDay.orders)} pedidos,{" "}
                        {formatNumber(bestDay.unitsSold)} uds)
                      </span>
                      <span className="text-black/50">
                        · Total gráfica: {formatCurrency(periodTotalFromChart)}
                      </span>
                    </div>
                  )}
                </div>

                <AnalyticsBarList
                  title="Productos más vendidos (unidades)"
                  subtitle="Referencia para stock y reabastecimiento — los que más piezas movieron"
                  rows={topProductsRows}
                  accentClassName="from-amber-500 to-orange-500"
                />
              </motion.section>

              <motion.section
                variants={itemVariants}
                className="grid gap-6 xl:grid-cols-2"
              >
                <AnalyticsBarList
                  title="Ingresos por producto"
                  subtitle="Qué productos aportan más al total — % sobre ventas del periodo"
                  rows={revenueByProductRows}
                  accentClassName="from-blue-500 to-indigo-500"
                />

                <AnalyticsBarList
                  title="Ingresos por categoría"
                  subtitle="Qué categorías generan más — para enfocar surtido y promociones"
                  rows={revenueByCategoryRows}
                  accentClassName="from-purple-500 to-pink-500"
                />
              </motion.section>

              <motion.section variants={itemVariants}>
                <div className="grid gap-4 lg:grid-cols-3">
                  <article className="overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/5">
                        <BarChart3 size={24} className="text-black/70" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-black/50">
                          Rango actual
                        </p>
                        <p className="mt-1 text-base font-semibold text-black">
                          {dashboard.filters.from} a {dashboard.filters.to}
                        </p>
                      </div>
                    </div>
                  </article>

                  <article className="overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/5">
                        <Undo2 size={24} className="text-black/70" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-black/50">
                          Comparación automática
                        </p>
                        <p className="mt-1 text-base font-semibold text-black">
                          {dashboard.comparison.previousPeriod.from} a{" "}
                          {dashboard.comparison.previousPeriod.to}
                        </p>
                      </div>
                    </div>
                  </article>

                  <article className="overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/5">
                        <Layers3 size={24} className="text-black/70" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-black/50">
                          Agregación
                        </p>
                        <p className="mt-1 text-base font-semibold capitalize text-black">
                          {dashboard.filters.groupBy}
                        </p>
                      </div>
                    </div>
                  </article>
                </div>
              </motion.section>
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}
