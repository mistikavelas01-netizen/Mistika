import { Suspense, type ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}
