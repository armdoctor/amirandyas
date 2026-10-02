import "server-only";
import { DEMO_MODE } from "@/lib/config";
import * as mem from "@/lib/storeMemory";
import * as db from "@/lib/storePrisma";

/**
 * Data layer entry point. Every guest-list read/write goes through here.
 *
 * - Real mode (default): Postgres via Prisma — see storePrisma.ts.
 * - Preview mode: only when DEMO_MODE="1" is set explicitly. In-memory sample
 *   guests; nothing is saved.
 *
 * There is NO silent fallback: if the database isn't configured, the site
 * errors instead of quietly accepting RSVPs into memory and losing them.
 */
const impl: typeof db = DEMO_MODE ? (mem as unknown as typeof db) : db;

export const {
  listGuests,
  getGuest,
  findGuestByName,
  findGuestsByFullNames,
  householdMembers,
  createInvite,
  createMember,
  updateGuestRecord,
  updateMany,
  deleteInvite,
  listDeletedInvites,
  restoreDeletedInvite,
} = impl;

export { normalizeName, fullNameOf } from "@/lib/storePrisma";
export type { NewGuest, WriteCtx, DeletedInvite } from "@/lib/storeTypes";
