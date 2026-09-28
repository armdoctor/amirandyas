import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listGuests } from "@/lib/store";
import { rowsToCsv } from "@/lib/csv";
import { EVENT_KEYS } from "@/lib/events";
import { pickPromptForId } from "@/lib/notePrompts";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const guests = await listGuests();
  const byId = new Map(guests.map((g) => [g.id, g]));
  const yn = (v: boolean | null | undefined) => (v === true ? "yes" : v === false ? "no" : "");
  const rows = guests.map((g) => {
    const row: Record<string, string | boolean> = {
      firstName: g.firstName,
      lastName: g.lastName,
      fullName: g.fullName,
      primaryFullName: g.primaryGuestId ? byId.get(g.primaryGuestId)?.fullName ?? "" : "",
    };
    for (const k of EVENT_KEYS) row[k] = g.invitedTo.includes(k) ? "yes" : "no";
    for (const k of EVENT_KEYS) row[`attending_${k}`] = g.invitedTo.includes(k) ? yn(g.attending[k]) : "";
    Object.assign(row, {
      plusOneAllowed: g.plusOneAllowed ? "yes" : "no",
      hasResponded: g.hasResponded ? "yes" : "no",
      dietaryRestrictions: g.dietaryRestrictions ?? "",
      plusOneAttending: yn(g.plusOneAttending),
      plusOneName: g.plusOneName ?? "",
      plusOneDietary: g.plusOneDietary ?? "",
      messagePrompt: g.primaryGuestId ? "" : pickPromptForId(g.id),
      message: g.message ?? "",
      submittedAt: g.submittedAt ?? "",
    });
    return row;
  });
  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(rowsToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="amir-yasmin-guests-${today}.csv"`,
    },
  });
}
