"use client";

import { useActionState } from "react";
import { adminLogin, type AdminLoginState } from "@/app/actions/admin-auth";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState<AdminLoginState, FormData>(adminLogin, null);
  return (
    <form action={formAction} className="space-y-3">
      <label htmlFor="password" className="block text-xs font-medium text-neutral-700">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoFocus
        required
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
      />
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
