import { METRICS_ENABLED } from "./config";
import { logger } from "./logger";

export type MetricLabels = Record<string, string | number | boolean | undefined>;

const sanitizeLabels = (labels: MetricLabels) => {
  const sanitized: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(labels)) {
    if (value === undefined) continue;
    sanitized[key] = value;
  }
  return sanitized;
};

export const incCounter = (
  name: string,
  labels: MetricLabels = {},
  value = 1
) => {
  if (!METRICS_ENABLED) return;
  logger.info("metric.counter", {
    metric: name,
    value,
    labels: sanitizeLabels(labels),
  });
};

export const observeHistogram = (
  name: string,
  value: number,
  labels: MetricLabels = {}
) => {
  if (!METRICS_ENABLED) return;
  logger.info("metric.histogram", {
    metric: name,
    value,
    labels: sanitizeLabels(labels),
  });
};
