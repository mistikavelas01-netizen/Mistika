"use client";

import type { LucideIcon } from "lucide-react";

type AnalyticsKpiCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: "amber" | "blue" | "purple" | "green";
};

const toneStyles: Record<
  NonNullable<AnalyticsKpiCardProps["tone"]>,
  {
    card: string;
    value: string;
    label: string;
    icon: string;
  }
> = {
  amber: {
    card: "border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50",
    value: "text-amber-900",
    label: "text-amber-700",
    icon: "bg-amber-500/20 text-amber-700",
  },
  blue: {
    card: "border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50",
    value: "text-blue-900",
    label: "text-blue-700",
    icon: "bg-blue-500/20 text-blue-700",
  },
  purple: {
    card: "border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50",
    value: "text-purple-900",
    label: "text-purple-700",
    icon: "bg-purple-500/20 text-purple-700",
  },
  green: {
    card: "border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50",
    value: "text-green-900",
    label: "text-green-700",
    icon: "bg-green-500/20 text-green-700",
  },
};

export function AnalyticsKpiCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "amber",
}: AnalyticsKpiCardProps) {
  const styles = toneStyles[tone];

  return (
    <article
      className={`rounded-2xl p-5 transition-all hover:shadow-lg ${styles.card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${styles.label}`}>
            {title}
          </p>
          <p className={`mt-3 text-3xl font-bold ${styles.value}`}>
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-black/60">{description}</p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <Icon size={24} />
        </div>
      </div>
    </article>
  );
}
