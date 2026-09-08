/**
 * Static guard: every RLS-enabled agent table carrying universe_id must have a
 * Universe-scoped policy, not a tenant-only one.
 *
 * UNIT/SEMANTIC — this reads migration SQL. It is not a hosted RLS proof.
 *
 * 2I-AI-62B §3 requires organization AND Universe ownership on every
 * tenant-bearing table, and §22 requires a passing Universe Boundary test.
 * The tenant-only policy shape leaked from 20260908040000 into 20260908150000
 * once already; this reviewer exists so it cannot happen a third time.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const UNIVERSE_RLS_MIGRATION = '20260908160000_xiv_agent_universe_rls.sql';

/** Predicate helper that makes a policy Universe-scoped. */
export const UNIVERSE_PREDICATE = 'xiv_universe_ref_is_member';

/**
 * Membership tables are the authority the Universe predicate is resolved
 * against, so they cannot be governed by it without a cycle. They carry
 * universe_id but are guarded by their own role helpers instead.
 */
export const TENANCY_AUTHORITY_TABLES = [
  'universe_memberships',
  'xiv_universe_memberships',
] as const;

export type RlsFinding = {
  table: string;
  reason: string;
};

export type RlsReview = {
  ok: boolean;
  universeScoped: readonly string[];
  denyAll: readonly string[];
  findings: readonly RlsFinding[];
};

function migrationsDir() {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '../../../../supabase/migrations');
}

export function loadMigrationSql(): string {
  const dir = migrationsDir();
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n');
}

function stripQualifier(name: string): string {
  return name.replace(/^public\./i, '').replace(/"/g, '');
}

/** Tables declared with a universe_id column. */
export function tablesWithUniverseColumn(sql: string): string[] {
  const found = new Set<string>();
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z_."]+)\s*\(([\s\S]*?)\n\s*\)\s*;/gi;
  for (const m of sql.matchAll(re)) {
    if (/^\s*universe_id\s/im.test(m[2]!)) found.add(stripQualifier(m[1]!));
  }
  return [...found];
}

/** Tables that have RLS switched on. */
export function tablesWithRlsEnabled(sql: string): string[] {
  const found = new Set<string>();
  const re = /alter\s+table\s+([a-z_."]+)\s+enable\s+row\s+level\s+security/gi;
  for (const m of sql.matchAll(re)) found.add(stripQualifier(m[1]!));
  return [...found];
}

/**
 * Tables covered by a Universe-scoped policy, whether written out per table or
 * driven by a DO block that loops over an array of table names.
 */
export function universeScopedTables(sql: string): string[] {
  const found = new Set<string>();

  const explicit = /create\s+policy[\s\S]{0,400}?\bon\s+([a-z_."]+)[\s\S]{0,400}?xiv_universe_ref_is_member/gi;
  for (const m of sql.matchAll(explicit)) found.add(stripQualifier(m[1]!));

  for (const block of sql.matchAll(/do\s+\$\$([\s\S]*?)\$\$\s*;/gi)) {
    const body = block[1]!;
    if (!body.includes(UNIVERSE_PREDICATE)) continue;
    for (const arr of body.matchAll(/array\s*\[([\s\S]*?)\]/gi)) {
      for (const name of arr[1]!.matchAll(/'([a-z0-9_]+)'/gi)) found.add(name[1]!);
    }
  }
  return [...found];
}

/** Deny-all is stricter than Universe scoping, so it satisfies the guard. */
export function denyAllTables(sql: string): string[] {
  const found = new Set<string>();
  const re = /create\s+policy\s+[a-z_]+\s+on\s+([a-z_."]+)[\s\S]{0,200}?using\s*\(\s*false\s*\)/gi;
  for (const m of sql.matchAll(re)) found.add(stripQualifier(m[1]!));
  return [...found];
}

export function reviewUniverseScopedRls(sql: string): RlsReview {
  const withUniverse = new Set(tablesWithUniverseColumn(sql));
  const rlsOn = new Set(tablesWithRlsEnabled(sql));
  const scoped = new Set(universeScopedTables(sql));
  const denied = new Set(denyAllTables(sql));

  const findings: RlsFinding[] = [];
  for (const table of [...withUniverse].sort()) {
    if ((TENANCY_AUTHORITY_TABLES as readonly string[]).includes(table)) continue;
    if (!rlsOn.has(table)) {
      findings.push({ table, reason: 'carries universe_id but RLS is not enabled' });
      continue;
    }
    if (!scoped.has(table) && !denied.has(table)) {
      findings.push({
        table,
        reason: 'RLS policy is tenant-only; a tenant JWT can read every Universe in the tenant',
      });
    }
  }

  return {
    ok: findings.length === 0,
    universeScoped: [...scoped].sort(),
    denyAll: [...denied].sort(),
    findings,
  };
}
