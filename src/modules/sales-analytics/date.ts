import type { SalesAnalyticsGroupBy } from "./contracts";

export const DAY_MS = 24 * 60 * 60 * 1000;

const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function startOfUtcDay(timestamp: number): number {
  const date = new Date(timestamp);
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
}

export function shiftUtcDays(timestamp: number, days: number): number {
  return timestamp + days * DAY_MS;
}

export function parseIsoDateOrThrow(value: string, fieldName: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`El parámetro "${fieldName}" debe tener formato YYYY-MM-DD`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`El parámetro "${fieldName}" no contiene una fecha válida`);
  }

  return timestamp;
}

export function formatIsoDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function differenceInUtcDays(startMs: number, endExclusiveMs: number): number {
  return Math.max(1, Math.ceil((endExclusiveMs - startMs) / DAY_MS));
}

export function getBucketStart(timestamp: number, groupBy: SalesAnalyticsGroupBy): number {
  const dayStart = startOfUtcDay(timestamp);
  const date = new Date(dayStart);

  if (groupBy === "day") {
    return dayStart;
  }

  if (groupBy === "week") {
    const weekDay = date.getUTCDay();
    const offset = weekDay === 0 ? 6 : weekDay - 1;
    return shiftUtcDays(dayStart, -offset);
  }

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

export function getNextBucketStart(
  bucketStart: number,
  groupBy: SalesAnalyticsGroupBy,
): number {
  if (groupBy === "day") {
    return shiftUtcDays(bucketStart, 1);
  }

  if (groupBy === "week") {
    return shiftUtcDays(bucketStart, 7);
  }

  const date = new Date(bucketStart);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
}

export function formatBucketLabel(
  bucketStart: number,
  groupBy: SalesAnalyticsGroupBy,
): string {
  const date = new Date(bucketStart);
  const year = date.getUTCFullYear();
  const month = MONTHS_SHORT[date.getUTCMonth()];
  const day = date.getUTCDate();

  if (groupBy === "day") {
    return `${day} ${month}`;
  }

  if (groupBy === "week") {
    const weekEnd = shiftUtcDays(bucketStart, 6);
    const weekEndDate = new Date(weekEnd);
    const sameMonth = date.getUTCMonth() === weekEndDate.getUTCMonth();
    const endMonth = MONTHS_SHORT[weekEndDate.getUTCMonth()];
    return sameMonth
      ? `${day}-${weekEndDate.getUTCDate()} ${month}`
      : `${day} ${month}-${weekEndDate.getUTCDate()} ${endMonth}`;
  }

  return `${month} ${year}`;
}

export function getDefaultRange(now = Date.now()) {
  const todayStart = startOfUtcDay(now);
  const to = todayStart;
  const from = shiftUtcDays(to, -29);
  return { from, to };
}
