"use client";

export type AnalyticsBarRow = {
  id: string;
  label: string;
  value: number;
  valueLabel: string;
  meta: string;
};

type AnalyticsBarListProps = {
  title: string;
  subtitle: string;
  rows: AnalyticsBarRow[];
  accentClassName?: string;
  emptyMessage?: string;
};

export function AnalyticsBarList({
  title,
  subtitle,
  rows,
  accentClassName = "from-amber-500 to-orange-500",
  emptyMessage = "No hay datos para el periodo seleccionado.",
}: AnalyticsBarListProps) {
  const maxValue = rows.reduce(
    (currentMax, row) => Math.max(currentMax, row.value),
    0,
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="border-b border-black/10 bg-black/5 px-6 py-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-0.5 text-sm text-black/60">{subtitle}</p>
      </div>
      <div className="p-6">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/10 bg-black/[0.02] px-4 py-8 text-center text-sm text-black/50">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row, index) => {
              const width =
                maxValue > 0 ? `${Math.max((row.value / maxValue) * 100, 6)}%` : "0%";

              return (
                <div key={row.id}>
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-black">
                        {index + 1}. {row.label}
                      </p>
                      <p className="text-xs text-black/55">{row.meta}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-black/70">
                      {row.valueLabel}
                    </p>
                  </div>

                  <div className="h-2.5 rounded-full bg-black/5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${accentClassName}`}
                      style={{ width }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
