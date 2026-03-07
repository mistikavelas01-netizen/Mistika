import { Suspense } from "react";
import AutenticacionView from "@/views/admin/AutenticacionView";

function LoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-black/40" />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <AutenticacionView />
    </Suspense>
  );
}
