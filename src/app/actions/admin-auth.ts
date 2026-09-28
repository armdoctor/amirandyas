"use server";

import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { adminPassword, setAdminSession, clearAdminSession } from "@/lib/auth";

export type AdminLoginState = { error?: string } | null;

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function adminLogin(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const password = String(formData.get("password") ?? "");
  const expected = adminPassword();
  if (!expected) return { error: "Admin password is not configured on the server." };
  if (!safeEqual(password, expected)) return { error: "Incorrect password." };
  await setAdminSession();
  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}
