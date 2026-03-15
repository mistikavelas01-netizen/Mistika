export const EXPRESS_SHIPPING_METHOD = "express" as const;
export const XALAPA_SHIPPING_COST = 40;
export const OUTSIDE_XALAPA_SHIPPING_COST = 70;

// Derivado de doc/CodigosPostales.csv
const XALAPA_POSTAL_CODES = new Set([
  "91000", "91010", "91013", "91014", "91015", "91016", "91017", "91018",
  "91020", "91023", "91024", "91025", "91026", "91027", "91028", "91030",
  "91033", "91037", "91040", "91045", "91046", "91047", "91048", "91049",
  "91050", "91053", "91054", "91055", "91056", "91057", "91060", "91063",
  "91064", "91065", "91066", "91067", "91069", "91070", "91073", "91075",
  "91080", "91083", "91084", "91090", "91094", "91095", "91096", "91097",
  "91098", "91100", "91103", "91104", "91105", "91106", "91107", "91110",
  "91113", "91114", "91119", "91120", "91123", "91129", "91130", "91133",
  "91140", "91143", "91150", "91152", "91153", "91154", "91155", "91156",
  "91157", "91158", "91160", "91163", "91164", "91165", "91166", "91170",
  "91173", "91174", "91179", "91180", "91183", "91184", "91185", "91186",
  "91190", "91193", "91194", "91195", "91196", "91197", "91198", "91200",
  "91203", "91204", "91205", "91207", "91210", "91213", "91215", "91216",
  "91217", "91220", "91225", "91226", "91227",
]);

export function normalizePostalCode(value: string): string {
  return value.replace(/\D+/g, "").slice(0, 5);
}

export function isCompletePostalCode(value: string): boolean {
  return /^\d{5}$/.test(normalizePostalCode(value));
}

export function isXalapaPostalCode(postalCode: string): boolean {
  return XALAPA_POSTAL_CODES.has(normalizePostalCode(postalCode));
}

export function getShippingCostForPostalCode(postalCode: string): number {
  return isXalapaPostalCode(postalCode)
    ? XALAPA_SHIPPING_COST
    : OUTSIDE_XALAPA_SHIPPING_COST;
}

export function getShippingZoneLabelForPostalCode(postalCode: string): string {
  return isXalapaPostalCode(postalCode) ? "Dentro de Xalapa" : "Fuera de Xalapa";
}

export function getShippingMethodLabel(method?: string | null): string {
  if (method === "standard") return "Estándar";
  if (method === "overnight") return "Overnight";
  return "Express";
}

export function getShippingEstimateLabel(
  method?: string | null,
  shippingCost?: number | null,
): string {
  if (method === "standard") return "5-7 días hábiles";
  if (method === "overnight") return "24 horas";
  if (method === "express" && typeof shippingCost === "number" && shippingCost >= 100) {
    return "2-3 días hábiles";
  }
  return "1 a 3 días hábiles";
}
