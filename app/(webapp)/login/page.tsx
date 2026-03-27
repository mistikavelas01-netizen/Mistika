import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAppZoneFromHostname } from "@/lib/subdomain";

export default async function LoginPage() {
  const requestHeaders = await headers();
  const zone = getAppZoneFromHostname(requestHeaders.get("host"));

  if (zone !== "admin") {
    redirect("/");
  }

  return <AdminLoginForm />;
}
