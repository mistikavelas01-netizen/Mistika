"use client";

import { useMemo } from "react";
import type { SalesTimeBucket } from "@/modules/sales-analytics/contracts";

type SalesTimeChartProps = {
  data: SalesTimeBucket[];
  formatCurrency: (value: number) => string;
};

const VIEWBOX_WIDTH = 760;
const VIEWBOX_HEIGHT = 260;
const PADDING_X = 24;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 34;

export function SalesTimeChart({
  data,
  formatCurrency,
}: SalesTimeChartProps) {
  const chart = useMemo(() => {
    if (data.length === 0) {
      return null;
    }

    const innerWidth = VIEWBOX_WIDTH - PADDING_X * 2;
    const innerHeight = VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
    const maxRevenue = Math.max(...data.map((point) => point.revenue), 1);
    const step = data.length > 1 ? innerWidth / (data.length - 1) : 0;

    const points = data.map((point, index) => {
      const x = PADDING_X + step * index;
      const y =
        PADDING_TOP + innerHeight - (point.revenue / maxRevenue) * innerHeight;

      return {
        ...point,
        x,
        y,
      };
    });

    const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const areaPath =
      points.length === 1
        ? `M ${firstPoint.x} ${VIEWBOX_HEIGHT - PADDING_BOTTOM} L ${firstPoint.x} ${firstPoint.y} L ${firstPoint.x} ${VIEWBOX_HEIGHT - PADDING_BOTTOM} Z`
        : `M ${firstPoint.x} ${VIEWBOX_HEIGHT - PADDING_BOTTOM} L ${linePoints
            .replace(/,/g, " ")
            .replace(/ /g, " ")} L ${lastPoint.x} ${VIEWBOX_HEIGHT - PADDING_BOTTOM} Z`;

    const grid = Array.from({ length: 4 }, (_, index) => {
      const ratio = index / 3;
      const y = PADDING_TOP + innerHeight * ratio;
      const label = formatCurrency(maxRevenue - maxRevenue * ratio);

      return { y, label };
    });

    const tickEvery = Math.max(1, Math.ceil(data.length / 5));
    const ticks = points.filter(
      (_, index) => index % tickEvery === 0 || index === points.length - 1,
    );

    return {
      points,
      linePoints,
      areaPath,
      grid,
      ticks,
    };
  }, [data, formatCurrency]);

  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="border-b border-black/10 bg-black/5 px-6 py-4">
        <h3 className="font-semibold">Ventas en el tiempo</h3>
        <p className="mt-0.5 text-sm text-black/60">Evolución del ingreso neto</p>
      </div>
      <div className="p-6">
      {chart ? (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-black/[0.02] p-4">
          <svg
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            className="h-[280px] w-full"
            role="img"
            aria-label="Gráfica de ventas netas en el tiempo"
          >
            <defs>
              <linearGradient id="sales-area-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(245,158,11,0.25)" />
                <stop offset="100%" stopColor="rgba(245,158,11,0.02)" />
              </linearGradient>
            </defs>

            {chart.grid.map((gridLine) => (
              <g key={gridLine.y}>
                <line
                  x1={PADDING_X}
                  x2={VIEWBOX_WIDTH - PADDING_X}
                  y1={gridLine.y}
                  y2={gridLine.y}
                  stroke="rgba(28,22,18,0.10)"
                  strokeDasharray="4 6"
                />
                <text
                  x={VIEWBOX_WIDTH - PADDING_X}
                  y={Math.max(gridLine.y - 8, 12)}
                  textAnchor="end"
                  fontSize="11"
                  fill="rgba(28,22,18,0.48)"
                >
                  {gridLine.label}
                </text>
              </g>
            ))}

            <path d={chart.areaPath} fill="url(#sales-area-fill)" />

            <polyline
              fill="none"
              stroke="rgb(245,158,11)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={chart.linePoints}
            />

            {chart.points.map((point) => (
              <g key={point.bucketStart}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="white"
                  stroke="rgb(245,158,11)"
                  strokeWidth="3"
                />
              </g>
            ))}

            {chart.ticks.map((tick) => (
              <text
                key={`tick-${tick.bucketStart}`}
                x={tick.x}
                y={VIEWBOX_HEIGHT - 10}
                textAnchor="middle"
                fontSize="11"
                fill="rgba(28,22,18,0.52)"
              >
                {tick.label}
              </text>
            ))}
          </svg>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {data.slice(-3).map((point) => (
              <div
                key={point.bucketStart}
                className="rounded-xl border border-black/10 bg-white px-4 py-3"
              >
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-black/50">
                  {point.label}
                </p>
                <p className="mt-2 text-base font-semibold text-black sm:text-lg">
                  {formatCurrency(point.revenue)}
                </p>
                <p className="text-xs text-black/55">
                  {point.orders} pedido{point.orders === 1 ? "" : "s"} · {point.unitsSold} unidad
                  {point.unitsSold === 1 ? "" : "es"}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-black/10 bg-black/[0.02] px-4 py-14 text-center text-sm text-black/50">
          No hay ventas suficientes para dibujar la serie temporal.
        </div>
      )}
      </div>
    </section>
  );
}
