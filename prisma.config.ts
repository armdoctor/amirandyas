import { defineConfig } from "prisma/config";
import "dotenv/config";

// Migrations use the direct (unpooled) connection; the app itself uses the
// pooled DATABASE_URL (see src/lib/db.ts). Both point at Amir & Yasmin's own
// Neon database — never Azure & Lauren's.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "",
  },
});
