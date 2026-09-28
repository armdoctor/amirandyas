import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { DEMO_MODE } from "@/lib/config";

const GUEST_COOKIE = "ay_guest_session";
const ADMIN_COOKIE = "ay_admin_session";
const ONE_MONTH_SECONDS = 60 * 60 * 24 * 30;

// Only used in preview mode so the demo deploys with zero configuration.
const DEMO_SECRET = "amir-yasmin-preview-only-secret-not-for-production";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (DEMO_MODE) return DEMO_SECRET;
  throw new Error("SESSION_SECRET must be set (>= 16 chars)");
}

export function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  if (p) return p;
  return DEMO_MODE ? "amiryasmin2027" : null;
}

function sign(payload: string): string {
  const mac = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

function verify(value: string): string | null {
  const idx = value.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = value.slice(0, idx);
  const mac = value.slice(idx + 1);
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  try {
    const a = Buffer.from(mac, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return null;
    return timingSafeEqual(a, b) ? payload : null;
  } catch {
    return null;
  }
}

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ONE_MONTH_SECONDS,
};

// ---- Guest session ----

export async function setGuestSession(guestId: string): Promise<void> {
  (await cookies()).set(GUEST_COOKIE, sign(guestId), cookieOpts);
}

export async function getGuestSession(): Promise<string | null> {
  const v = (await cookies()).get(GUEST_COOKIE)?.value;
  return v ? verify(v) : null;
}

export async function clearGuestSession(): Promise<void> {
  (await cookies()).delete(GUEST_COOKIE);
}

// ---- Admin session ----

export async function setAdminSession(): Promise<void> {
  (await cookies()).set(ADMIN_COOKIE, sign("admin"), cookieOpts);
}

export async function isAdmin(): Promise<boolean> {
  const v = (await cookies()).get(ADMIN_COOKIE)?.value;
  return v ? verify(v) === "admin" : false;
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

// Proxy-side verification (same algorithm).
export function verifyCookie(value: string | undefined): string | null {
  return value ? verify(value) : null;
}

export const COOKIE_NAMES = { guest: GUEST_COOKIE, admin: ADMIN_COOKIE };
