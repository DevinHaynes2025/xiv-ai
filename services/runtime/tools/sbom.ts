/**
 * AC-17 SBOM generation and dependency analysis.
 *
 * The SBOM is derived from each shipping runtime's lockfile, so the component
 * list is the resolved dependency tree rather than the declared ranges. The
 * vulnerability analysis calls `npm audit`, which needs the registry advisory
 * database: when that call cannot complete, this reports the analysis as
 * unavailable instead of reporting zero findings.
 *
 * Usage: tsx tools/sbom.ts [--json] [--write <dir>]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');

/** Every runtime that ships as part of XIV and therefore needs analysis. */
export const SHIPPING_RUNTIMES = ['apps/mobile', 'services/ai', 'services/runtime'] as const;

export type SbomComponent = {
  name: string;
  version: string;
  purl: string;
  integrity: string | null;
  resolved: string | null;
  dev: boolean;
  direct: boolean;
  licenseDeclared: string | null;
};

export type AuditSeverityCounts = {
  critical: number;
  high: number;
  moderate: number;
  low: number;
  info: number;
};

export type RuntimeSbom = {
  runtime: string;
  lockfileVersion: number | null;
  components: SbomComponent[];
  componentCount: number;
  directCount: number;
  componentsWithIntegrity: number;
  componentsWithVersion: number;
  audit:
    | { available: true; vulnerabilities: AuditSeverityCounts; total: number; advisories: string[] }
    | { available: false; reason: string };
};

export type SbomReport = {
  generatedAt: string;
  runtimes: RuntimeSbom[];
  coveragePercent: number;
  runtimesAnalyzed: number;
  runtimesTotal: number;
  auditableRuntimes: number;
  criticalHighTotal: number;
};

type LockPackage = {
  version?: string;
  resolved?: string;
  integrity?: string;
  dev?: boolean;
  license?: string;
  link?: boolean;
};

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

function componentsFromLockfile(runtimeDir: string): { components: SbomComponent[]; lockfileVersion: number | null } {
  const lock = readJson<{
    lockfileVersion?: number;
    packages?: Record<string, LockPackage>;
  }>(join(runtimeDir, 'package-lock.json'));
  const manifest = readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
    join(runtimeDir, 'package.json'),
  );
  const direct = new Set([
    ...Object.keys(manifest?.dependencies ?? {}),
    ...Object.keys(manifest?.devDependencies ?? {}),
  ]);
  if (!lock?.packages) return { components: [], lockfileVersion: lock?.lockfileVersion ?? null };

  const components: SbomComponent[] = [];
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (path === '' || entry.link) continue;
    const name = path.replace(/^(?:.*node_modules\/)/, '');
    if (!name) continue;
    components.push({
      name,
      version: entry.version ?? '',
      purl: `pkg:npm/${name.replace('/', '%2F')}@${entry.version ?? 'unknown'}`,
      integrity: entry.integrity ?? null,
      resolved: entry.resolved ?? null,
      dev: Boolean(entry.dev),
      direct: direct.has(name),
      licenseDeclared: entry.license ?? null,
    });
  }
  components.sort((a, b) => a.name.localeCompare(b.name));
  return { components, lockfileVersion: lock.lockfileVersion ?? null };
}

function runAudit(runtimeDir: string): RuntimeSbom['audit'] {
  try {
    const raw = execFileSync('npm', ['audit', '--json', '--audit-level=none'], {
      cwd: runtimeDir,
      encoding: 'utf8',
      timeout: 120_000,
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return parseAudit(raw);
  } catch (error) {
    // `npm audit` exits non-zero when it finds advisories, and still prints
    // usable JSON, so the payload is checked before the failure is believed.
    const stdout = (error as { stdout?: string }).stdout;
    if (stdout) {
      const parsed = parseAudit(stdout);
      if (parsed.available) return parsed;
    }
    const stderr = (error as { stderr?: string }).stderr ?? '';
    const message = (error as Error).message ?? 'unknown failure';
    return { available: false, reason: `npm audit unavailable: ${(stderr || message).split('\n')[0]}` };
  }
}

export function parseAudit(raw: string): RuntimeSbom['audit'] {
  let parsed: {
    metadata?: { vulnerabilities?: Partial<AuditSeverityCounts> };
    vulnerabilities?: Record<string, { severity?: string; via?: unknown[] }>;
    error?: { code?: string; summary?: string };
  };
  try {
    parsed = JSON.parse(raw) as never;
  } catch {
    return { available: false, reason: 'npm audit did not return JSON' };
  }
  if (parsed.error) {
    return { available: false, reason: `npm audit error: ${parsed.error.summary ?? parsed.error.code ?? 'unknown'}` };
  }
  const counts = parsed.metadata?.vulnerabilities;
  if (!counts) return { available: false, reason: 'npm audit returned no vulnerability metadata' };
  const vulnerabilities: AuditSeverityCounts = {
    critical: counts.critical ?? 0,
    high: counts.high ?? 0,
    moderate: counts.moderate ?? 0,
    low: counts.low ?? 0,
    info: counts.info ?? 0,
  };
  const advisories: string[] = [];
  for (const [name, entry] of Object.entries(parsed.vulnerabilities ?? {})) {
    if (entry.severity === 'critical' || entry.severity === 'high') advisories.push(`${name}:${entry.severity}`);
  }
  const total =
    vulnerabilities.critical + vulnerabilities.high + vulnerabilities.moderate + vulnerabilities.low + vulnerabilities.info;
  return { available: true, vulnerabilities, total, advisories: advisories.sort() };
}

export function buildSbom(options: { audit?: boolean } = {}): SbomReport {
  const runtimes: RuntimeSbom[] = [];
  for (const runtime of SHIPPING_RUNTIMES) {
    const runtimeDir = join(repoRoot, runtime);
    if (!existsSync(join(runtimeDir, 'package.json'))) continue;
    const { components, lockfileVersion } = componentsFromLockfile(runtimeDir);
    runtimes.push({
      runtime,
      lockfileVersion,
      components,
      componentCount: components.length,
      directCount: components.filter((component) => component.direct).length,
      componentsWithIntegrity: components.filter((component) => component.integrity !== null).length,
      componentsWithVersion: components.filter((component) => component.version !== '').length,
      audit:
        options.audit === false
          ? { available: false, reason: 'audit skipped by caller' }
          : existsSync(join(runtimeDir, 'package-lock.json'))
            ? runAudit(runtimeDir)
            : { available: false, reason: 'no lockfile present' },
    });
  }

  const analyzed = runtimes.filter((entry) => entry.componentCount > 0).length;
  const auditable = runtimes.filter((entry) => entry.audit.available).length;
  const criticalHighTotal = runtimes.reduce(
    (total, entry) =>
      total + (entry.audit.available ? entry.audit.vulnerabilities.critical + entry.audit.vulnerabilities.high : 0),
    0,
  );

  return {
    generatedAt: new Date().toISOString(),
    runtimes,
    coveragePercent: SHIPPING_RUNTIMES.length ? (analyzed / SHIPPING_RUNTIMES.length) * 100 : 0,
    runtimesAnalyzed: analyzed,
    runtimesTotal: SHIPPING_RUNTIMES.length,
    auditableRuntimes: auditable,
    criticalHighTotal,
  };
}

/** CycloneDX 1.5 document for one runtime, so the SBOM is consumable elsewhere. */
export function toCycloneDx(entry: RuntimeSbom) {
  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      component: { type: 'application', name: `xiv/${entry.runtime}`, version: '0.0.0' },
      tools: [{ vendor: 'XIV', name: 'services/runtime/tools/sbom.ts' }],
    },
    components: entry.components.map((component) => ({
      type: 'library',
      name: component.name,
      version: component.version,
      purl: component.purl,
      scope: component.dev ? 'excluded' : 'required',
      hashes: component.integrity ? [{ alg: 'SHA-512', content: component.integrity }] : [],
      licenses: component.licenseDeclared ? [{ license: { id: component.licenseDeclared } }] : [],
    })),
  };
}

const invokedDirectly = process.argv[1] ? resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (invokedDirectly) {
  const report = buildSbom();
  const writeIndex = process.argv.indexOf('--write');
  if (writeIndex >= 0) {
    const target = resolve(process.argv[writeIndex + 1] ?? join(repoRoot, 'docs/62d/sbom'));
    mkdirSync(target, { recursive: true });
    for (const entry of report.runtimes) {
      const name = entry.runtime.replace(/\//g, '-');
      writeFileSync(join(target, `${name}.cdx.json`), `${JSON.stringify(toCycloneDx(entry), null, 2)}\n`);
    }
  }
  if (process.argv.includes('--json')) {
    console.info(JSON.stringify(report, null, 2));
  } else {
    for (const entry of report.runtimes) {
      const audit = entry.audit.available
        ? `critical=${entry.audit.vulnerabilities.critical} high=${entry.audit.vulnerabilities.high} moderate=${entry.audit.vulnerabilities.moderate} low=${entry.audit.vulnerabilities.low}`
        : `UNAVAILABLE (${entry.audit.reason})`;
      console.info(
        `[sbom] ${entry.runtime}: ${entry.componentCount} components (${entry.directCount} direct, ${entry.componentsWithIntegrity} with integrity hash) audit: ${audit}`,
      );
    }
    console.info(
      `[sbom] coverage=${report.coveragePercent.toFixed(0)}% auditable=${report.auditableRuntimes}/${report.runtimesTotal} criticalHigh=${report.criticalHighTotal}`,
    );
  }
}
