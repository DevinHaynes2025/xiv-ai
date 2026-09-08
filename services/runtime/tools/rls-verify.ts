/**
 * AC-03 evidence collector.
 *
 * Applies the 62D migration to a local PostgreSQL instance behind a
 * Supabase-compatible auth shim and runs the cross-tenant / cross-universe
 * negative suite as the `authenticated` role. Everything it reports is the
 * result of SQL that actually ran; when PostgreSQL is unavailable it reports
 * UNVERIFIED rather than assuming the policies work.
 *
 * Usage: tsx tools/rls-verify.ts [--json]
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');
const MIGRATION = join(repoRoot, 'supabase/migrations/20260908120000_xiv_runtime_62d.sql');
const SHIM = join(here, 'supabase-auth-shim.sql');
const TESTS = join(here, 'rls-negative-tests.sql');
const DATABASE = process.env.XIV_RLS_DB ?? 'xiv_rls_check';

export type RlsCheck = {
  category: string;
  name: string;
  expectation: string;
  observed: string;
  passed: boolean;
};

export type RlsVerification = {
  status: 'verified' | 'unverified';
  reason: string;
  database: string;
  postgresVersion: string | null;
  checks: RlsCheck[];
  totals: {
    total: number;
    passed: number;
    failed: number;
    crossTenantNegativePassRate: number;
    crossUniverseNegativePassRate: number;
    unauthorizedCrossTenantReads: number;
    unauthorizedCrossTenantWrites: number;
    unauthorizedCrossUniverseAccess: number;
    tablesWithValidatedRls: number;
    tablesWithoutValidatedRls: number;
  };
};

function psql(args: string[], input?: string): string {
  const asPostgres = process.env.XIV_PSQL_SUDO !== '0';
  const file = asPostgres ? 'sudo' : 'psql';
  const argv = asPostgres ? ['-n', '-u', 'postgres', 'psql', ...args] : args;
  return execFileSync(file, argv, {
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 32 * 1024 * 1024,
  });
}

function detectPostgres(): string | null {
  try {
    return psql(['-tAX', '-c', 'show server_version']).trim();
  } catch {
    return null;
  }
}

function rate(checks: RlsCheck[], predicate: (check: RlsCheck) => boolean): number {
  const subset = checks.filter(predicate);
  if (!subset.length) return 0;
  return subset.filter((check) => check.passed).length / subset.length;
}

export function verifyRls(): RlsVerification {
  const base: RlsVerification = {
    status: 'unverified',
    reason: '',
    database: DATABASE,
    postgresVersion: null,
    checks: [],
    totals: {
      total: 0,
      passed: 0,
      failed: 0,
      crossTenantNegativePassRate: 0,
      crossUniverseNegativePassRate: 0,
      unauthorizedCrossTenantReads: 0,
      unauthorizedCrossTenantWrites: 0,
      unauthorizedCrossUniverseAccess: 0,
      tablesWithValidatedRls: 0,
      tablesWithoutValidatedRls: 0,
    },
  };

  if (!existsSync(MIGRATION)) {
    return { ...base, reason: `migration_not_found:${MIGRATION}` };
  }

  const version = detectPostgres();
  if (!version) {
    return {
      ...base,
      reason: 'postgresql_unavailable: cannot execute row level security tests in this environment',
    };
  }

  psql(['-tAX', '-c', `drop database if exists ${DATABASE}`]);
  psql(['-tAX', '-c', `create database ${DATABASE}`]);
  psql(['-v', 'ON_ERROR_STOP=1', '-q', '-d', DATABASE, '-f', SHIM]);
  psql(['-v', 'ON_ERROR_STOP=1', '-q', '-d', DATABASE, '-f', MIGRATION]);
  const raw = psql(['-v', 'ON_ERROR_STOP=1', '-tAX', '-F', '\u0001', '-d', DATABASE, '-f', TESTS]);

  const checks: RlsCheck[] = [];
  for (const line of raw.split('\n')) {
    const parts = line.split('\u0001');
    if (parts.length !== 5) continue;
    const [category, name, expectation, observed, passed] = parts as [string, string, string, string, string];
    checks.push({ category, name, expectation, observed, passed: passed === 't' });
  }

  const structural = checks.filter((check) => check.category === 'structure' && check.name.startsWith('rls_enabled_and_forced:'));
  const verification: RlsVerification = {
    status: 'verified',
    reason: 'executed against local postgresql with supabase auth shim',
    database: DATABASE,
    postgresVersion: version,
    checks,
    totals: {
      total: checks.length,
      passed: checks.filter((check) => check.passed).length,
      failed: checks.filter((check) => !check.passed).length,
      crossTenantNegativePassRate: rate(checks, (check) => check.category.startsWith('cross_tenant')),
      crossUniverseNegativePassRate: rate(checks, (check) => check.category.startsWith('cross_universe')),
      unauthorizedCrossTenantReads: checks.filter(
        (check) => check.category === 'cross_tenant_read' && !check.passed,
      ).length,
      unauthorizedCrossTenantWrites: checks.filter(
        (check) => check.category === 'cross_tenant_write' && !check.passed,
      ).length,
      unauthorizedCrossUniverseAccess: checks.filter(
        (check) => check.category.startsWith('cross_universe') && !check.passed,
      ).length,
      tablesWithValidatedRls: structural.filter((check) => check.passed).length,
      tablesWithoutValidatedRls: structural.filter((check) => !check.passed).length,
    },
  };
  return verification;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*\//, ''))) {
  const result = verifyRls();
  if (process.argv.includes('--json')) {
    console.info(JSON.stringify(result, null, 2));
  } else {
    console.info(`[rls] status=${result.status} ${result.reason}`);
    for (const check of result.checks) {
      if (!check.passed) console.info(`[rls] FAIL ${check.category}/${check.name} expected=${check.expectation} observed=${check.observed}`);
    }
    console.info(
      `[rls] ${result.totals.passed}/${result.totals.total} checks passed; tables with validated RLS: ${result.totals.tablesWithValidatedRls}`,
    );
  }
  if (result.status !== 'verified' || result.totals.failed > 0) process.exitCode = 1;
}
