import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma client with app-level guards. These sit on top of the database-level
 * safety net in prisma/migrations/*_safety_net (audit triggers, append-only
 * AuditLog, TRUNCATE refusal, bulk-change limits) — two independent layers.
 *
 *  - Guest.deleteMany / updateMany must target specific rows (non-empty where).
 *  - AuditLog can only be inserted into and read — never updated or deleted.
 */

type ExtendedClient = ReturnType<typeof createClient>;
const globalForPrisma = globalThis as unknown as { __ayPrisma?: ExtendedClient };

function isUnboundedWhere(where: unknown): boolean {
  if (where == null) return true;
  if (typeof where !== "object") return false;
  return Object.keys(where as object).length === 0;
}

function refuse(msg: string): never {
  throw new Error(`Refused: ${msg}`);
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const base = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  return base.$extends({
    name: "data-safety-guards",
    query: {
      guest: {
        async deleteMany({ args, query }) {
          if (isUnboundedWhere(args.where)) refuse("Guest.deleteMany() without a where clause would wipe the guest list.");
          return query(args);
        },
        async updateMany({ args, query }) {
          if (isUnboundedWhere(args.where)) refuse("Guest.updateMany() without a where clause would overwrite every guest.");
          return query(args);
        },
      },
      auditLog: {
        async update() {
          refuse("AuditLog is append-only.");
        },
        async updateMany() {
          refuse("AuditLog is append-only.");
        },
        async upsert() {
          refuse("AuditLog is append-only.");
        },
        async delete() {
          refuse("AuditLog is append-only.");
        },
        async deleteMany() {
          refuse("AuditLog is append-only.");
        },
      },
    },
  });
}

export function getPrisma(): ExtendedClient {
  if (!globalForPrisma.__ayPrisma) globalForPrisma.__ayPrisma = createClient();
  return globalForPrisma.__ayPrisma;
}

export type Tx = Parameters<Parameters<ExtendedClient["$transaction"]>[0]>[0];

/**
 * Run writes in a transaction tagged with who/what is making the change, so
 * the database audit trigger records it (e.g. "rsvp:update" by "guest").
 */
export async function withAudit<T>(
  ctx: { action: string; actor: "guest" | "admin" },
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return getPrisma().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.action', ${ctx.action}, true), set_config('app.actor', ${ctx.actor}, true)`;
    return fn(tx as Tx);
  });
}
