export type AppZone = "public" | "admin";

export function getAppZoneFromHostname(hostname?: string | null): AppZone {
  if (!hostname) {
    return "public";
  }

  const normalized = hostname.toLowerCase().trim();
  const hostWithoutPort = normalized.split(":")[0] ?? normalized;

  return hostWithoutPort.startsWith("admin.") ? "admin" : "public";
}
