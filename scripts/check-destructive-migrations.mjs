#!/usr/bin/env node
/**
 * Scans prisma/migrations/**\/*.sql for destructive SQL and fails the build if
 * it finds any: DROP TABLE / SCHEMA / DATABASE / COLUMN / TRIGGER / FUNCTION,
 * TRUNCATE, ALTER TABLE ... DISABLE TRIGGER, or DELETE FROM without a WHERE.
 *
 * Runs in `npm run build` (so Vercel refuses to deploy) and in CI.
 *
 * Comments, plpgsql function bodies ($$ ... $$) and CREATE TRIGGER statements
 * are ignored, so the safety-net triggers themselves don't trip the scanner.
 *
 * Bypass for a migration you *really* mean to land, after confirming with the
 * couple's admin: put this marker in the migration's own .sql file, e.g.
 *   -- ALLOW_DESTRUCTIVE_MIGRATION: <reason>
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "prisma/migrations";

const PATTERNS = [
  { re: /\bDROP\s+TABLE\b/gi, label: "DROP TABLE" },
  { re: /\bTRUNCATE\b/gi, label: "TRUNCATE" },
  { re: /\bDROP\s+SCHEMA\b/gi, label: "DROP SCHEMA" },
  { re: /\bDROP\s+DATABASE\b/gi, label: "DROP DATABASE" },
  { re: /\bDROP\s+COLUMN\b/gi, label: "DROP COLUMN" },
  { re: /\bDROP\s+TRIGGER\b/gi, label: "DROP TRIGGER (removes a safety net)" },
  { re: /\bDROP\s+FUNCTION\b/gi, label: "DROP FUNCTION (may remove a safety net)" },
  { re: /\bDISABLE\s+TRIGGER\b/gi, label: "DISABLE TRIGGER (removes a safety net)" },
  {
    re: /\bDELETE\s+FROM\s+[^;]*?;/gi,
    label: "DELETE FROM (no WHERE)",
    test: (m) => !/\bWHERE\b/i.test(m),
  },
];

function listSqlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...listSqlFiles(p));
    else if (entry.endsWith(".sql")) out.push(p);
  }
  return out;
}

// Blank out ignorable regions but keep newlines so line numbers stay right.
function blank(s) {
  return s.replace(/[^\n]/g, " ");
}
function scrub(text) {
  return text
    .replace(/\$\$[\s\S]*?\$\$/g, blank) // function bodies
    .replace(/--[^\n]*/g, blank) // line comments
    .replace(/\bCREATE\s+TRIGGER\b[\s\S]*?;/gi, blank); // trigger definitions
}

const findings = [];
let scanned = 0;
try {
  for (const file of listSqlFiles(ROOT)) {
    scanned++;
    const raw = readFileSync(file, "utf8");
    if (/ALLOW_DESTRUCTIVE_MIGRATION/i.test(raw)) continue;
    const text = scrub(raw);
    const lines = raw.split("\n");
    for (const { re, label, test } of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        if (test && !test(m[0])) continue;
        const lineNo = text.slice(0, m.index).split("\n").length;
        findings.push({ file, line: lineNo, label, excerpt: lines[lineNo - 1]?.trim() ?? m[0] });
      }
    }
  }
} catch (err) {
  if (err.code === "ENOENT") {
    console.log(`No ${ROOT}/ directory yet — nothing to scan.`);
    process.exit(0);
  }
  throw err;
}

if (findings.length === 0) {
  console.log(`OK — ${scanned} migration file(s) scanned, no destructive SQL found.`);
  process.exit(0);
}
console.error(`\n✗ Destructive SQL detected in ${findings.length} place(s):\n`);
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  [${f.label}]`);
  console.error(`    ${f.excerpt}`);
}
console.error(
  "\nIf this is intentional, add a SQL comment containing the marker\n" +
    "  ALLOW_DESTRUCTIVE_MIGRATION\n" +
    "to the migration file (with a short reason) and commit again.\n",
);
process.exit(1);
