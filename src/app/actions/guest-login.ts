"use server";

import { redirect } from "next/navigation";
import { findGuestByName, getGuest } from "@/lib/store";
import { loadHousehold } from "@/lib/household";
import { setGuestSession, clearGuestSession } from "@/lib/auth";

export type LoginState = { error?: string } | null;

export async function guestLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const name = String(formData.get("name") ?? "");
  if (!name.trim()) return { error: "Please enter your full name." };

  const guest = await findGuestByName(name);
  if (!guest) {
    return {
      error:
        "We couldn't find your invitation. Please check the spelling of your full name, or reach out to Amir or Yasmin.",
    };
  }

  if (!guest.isPrimaryContact) {
    const primary = guest.primaryGuestId ? await getGuest(guest.primaryGuestId) : null;
    const params = new URLSearchParams({ primary: primary?.fullName ?? "" });
    redirect(`/not-primary?${params.toString()}`);
  }

  const household = await loadHousehold(guest.id);
  if (!household || household.events.length === 0) {
    return { error: "Your invitation isn't fully set up yet. Please reach out to Amir or Yasmin." };
  }

  await setGuestSession(guest.id);
  redirect("/invite");
}

export async function guestLogout(): Promise<void> {
  await clearGuestSession();
  redirect("/");
}
