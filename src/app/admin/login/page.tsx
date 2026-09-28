export const dynamic = "force-dynamic";

import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { DEMO_MODE } from "@/lib/config";
import { Brand } from "@/components/admin/Brand";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 px-4 py-16 text-neutral-900">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <Brand />
        <h1 className="mt-5 text-lg font-semibold text-neutral-900">Sign in</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Manage the guest list and view RSVPs.</p>
        <div className="mt-5">
          <AdminLoginForm />
        </div>
        {DEMO_MODE && !process.env.ADMIN_PASSWORD && (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Preview password: <span className="font-mono font-medium">amiryasmin2027</span>
          </p>
        )}
      </div>
    </main>
  );
}
