import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { EvidenceLedger } from './ledger';
import { GATES, MANDATORY_GATES, directoryForGate } from './gates';
import type { CommitBinding, EvidenceActor, EvidenceStatus, GateId, TestSuitePayload } from './types';

/**
 * Section 39: the CI evidence package. Each candidate commit produces an
 * `xiv-evidence/<commit>/` tree containing per-area results and a manifest that
 * states, for that exact revision, what ran, what passed, what failed and what
 * was skipped.
 *
 * Skipped tests are listed rather than omitted. A package that quietly drops a
 * gate reads as a clean run, which is the specific failure mode this section
 * exists to prevent.
 *
 * Section 60 applies here too: this collector produces and formats evidence.
 * It records nothing as verified and approves nothing.
 */

const REPO_ROOT = resolve(import.meta.dirname, '../../..');
const SERVICE_ROOT = resolve(import.meta.dirname, '..');

/** Which acceptance criteria each suite speaks to (section 37). */
const SUITE_GATES: Readonly<Record<string, readonly GateId[]>> = Object.freeze({
  'hardware-lanes.test.ts': ['intel_runtime', 'amd_runtime', 'nvidia_runtime'],
  'identity.test.ts': ['runtime_identity', 'runtime_attestation'],
  'tenancy.test.ts': ['tenant_isolation', 'universe_isolation'],
  'mobile.test.ts': ['ios', 'android'],
  'model-routing.test.ts': ['model_authorization'],
  'budget.test.ts': ['resource_governor', 'cost_governance'],
  'offline.test.ts': ['offline_mode'],
  'recovery.test.ts': ['failure_recovery'],
  'kill-switch.test.ts': ['kill_switch'],
  'device-network.test.ts': ['agent_runtime_assignment'],
  'security-lock.test.ts': ['workload_authorization'],
  'definition-of-done.test.ts': ['provenance', 'compute_routing'],
});

type CaseResult = { name: string; status: 'pass' | 'fail' | 'skip'; durationMs: number };

function git(args: string[]): string {
  try {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

export function resolveCommitBinding(): CommitBinding {
  return {
    repository: git(['config', '--get', 'remote.origin.url']) || 'unknown',
    branch: process.env.GITHUB_REF_NAME || git(['rev-parse', '--abbrev-ref', 'HEAD']) || 'unknown',
    commitSha: process.env.GITHUB_SHA || git(['rev-parse', 'HEAD']) || 'unknown',
    buildId: process.env.GITHUB_RUN_ID ?? null,
    dependencyLockHash: git(['hash-object', 'services/ai/package-lock.json']) || undefined,
    runtimeVersion: '62d.0.0',
    policyVersion: '62d-security-lock',
  };
}

/** Parses the newline-delimited stream produced by `ndjson-reporter.mjs`. */
export function parseTestEvents(stdout: string): Map<string, CaseResult[]> {
  const bySuite = new Map<string, CaseResult[]>();

  for (const line of stdout.split('\n')) {
    if (!line.startsWith('{')) continue;
    let event: { type?: string; data?: Record<string, unknown> };
    try {
      event = JSON.parse(line) as typeof event;
    } catch {
      continue;
    }
    const type = event.type;
    if (type !== 'test:pass' && type !== 'test:fail') continue;

    const data = event.data ?? {};
    const details = (data.details ?? {}) as { duration_ms?: number; type?: string };
    // Suites roll their children up, so counting them would double every case.
    if (details.type === 'suite') continue;

    const file = typeof data.file === 'string' ? data.file.split('/').pop()! : 'unknown';
    const skipped = data.skip === true || data.todo === true;
    const status: CaseResult['status'] = skipped ? 'skip' : type === 'test:pass' ? 'pass' : 'fail';

    const cases = bySuite.get(file) ?? [];
    cases.push({
      name: String(data.name ?? 'unnamed'),
      status,
      durationMs: Math.round(details.duration_ms ?? 0),
    });
    bySuite.set(file, cases);
  }

  return bySuite;
}

function suiteStatus(cases: readonly CaseResult[]): EvidenceStatus {
  if (cases.length === 0) return 'unavailable';
  if (cases.some((entry) => entry.status === 'fail')) return 'fail';
  if (cases.every((entry) => entry.status === 'skip')) return 'skipped';
  return 'pass';
}

export type CollectOptions = {
  outputDir?: string;
  environment?: string;
  write?: boolean;
};

export function collectEvidence(options: CollectOptions = {}) {
  const commit = resolveCommitBinding();
  const environment = options.environment ?? process.env.XIV_EVIDENCE_ENVIRONMENT ?? 'ci';
  const startedAt = new Date().toISOString();

  const run = spawnSync(
    process.execPath,
    [
      '--import',
      'tsx',
      '--test',
      '--test-reporter=./evidence/ndjson-reporter.mjs',
      'runtime/tests/*.test.ts',
      'evidence/tests/*.test.ts',
    ],
    { cwd: SERVICE_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  const completedAt = new Date().toISOString();

  const bySuite = parseTestEvents(run.stdout ?? '');
  const ledger = new EvidenceLedger();
  const ci: EvidenceActor = {
    actorId: process.env.GITHUB_RUN_ID ? `github:${process.env.GITHUB_RUN_ID}` : 'local-cli',
    actorType: 'ci',
    roles: ['owner'],
    scope: { organizationId: 'xiv-platform', universeId: 'engineering' },
  };

  const written: string[] = [];
  for (const [suite, gates] of Object.entries(SUITE_GATES)) {
    const cases = bySuite.get(suite) ?? [];
    const payload: TestSuitePayload = {
      kind: 'test_suite',
      runner: 'node:test',
      passed: cases.filter((entry) => entry.status === 'pass').length,
      failed: cases.filter((entry) => entry.status === 'fail').length,
      skipped: cases.filter((entry) => entry.status === 'skip').length,
      cases,
    };
    const status = suiteStatus(cases);

    for (const criterion of gates) {
      const result = ledger.recordEvidence(ci, {
        criterion,
        commit,
        environment,
        testSuite: `services/ai/runtime/tests/${suite}`,
        testCase: suite,
        testVersion: commit.commitSha.slice(0, 12),
        expectedResult: `every case in ${suite} passes`,
        actualResult: `${payload.passed} passed, ${payload.failed} failed, ${payload.skipped} skipped`,
        status,
        startedAt,
        completedAt,
        primaryOwner: GATES[criterion].primaryOwner,
        payload,
        reproducibleCommand: `npm test --prefix services/ai -- ${suite}`,
      });
      if (!result.ok) {
        process.stderr.write(`evidence rejected for ${criterion}: ${result.code} — ${result.message}\n`);
        continue;
      }
      if (options.write === false) continue;

      const target = join(
        options.outputDir ?? join(REPO_ROOT, 'xiv-evidence'),
        commit.commitSha,
        directoryForGate(criterion),
        `${result.record.evidenceId}.json`,
      );
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, `${JSON.stringify(result.record, null, 2)}\n`);
      written.push(relative(REPO_ROOT, target));
    }
  }

  const manifest = ledger.manifest(commit, environment);
  if (options.write !== false) {
    const manifestPath = join(options.outputDir ?? join(REPO_ROOT, 'xiv-evidence'), commit.commitSha, 'manifest.json');
    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    written.push(relative(REPO_ROOT, manifestPath));
  }

  return { ledger, manifest, written, testRunExitCode: run.status ?? 1 };
}

function main(): void {
  const requireMandatory = process.argv.includes('--require-mandatory');
  const { manifest, written, testRunExitCode } = collectEvidence();

  process.stdout.write(`xiv evidence package for ${manifest.commit.commitSha}\n`);
  process.stdout.write(
    `  ${manifest.testsExecuted} entries — ${manifest.passes} pass, ${manifest.failures} fail, ` +
      `${manifest.testsSkipped} skipped, ${manifest.warnings} unavailable\n`,
  );
  if (manifest.skippedMandatoryGates.length > 0) {
    process.stdout.write(`  skipped release-critical gates: ${manifest.skippedMandatoryGates.join(', ')}\n`);
  }
  if (manifest.missingMandatoryGates.length > 0) {
    // Section 39 and 56: absence is a reportable state, not an empty cell that
    // quietly reads as success.
    process.stdout.write(
      `  release-critical gates with no evidence in this package (${manifest.missingMandatoryGates.length}/` +
        `${MANDATORY_GATES.length}): ${manifest.missingMandatoryGates.join(', ')}\n`,
    );
  }
  for (const path of written) process.stdout.write(`  wrote ${path}\n`);

  const blocked =
    manifest.failures > 0 ||
    testRunExitCode !== 0 ||
    (requireMandatory && (manifest.missingMandatoryGates.length > 0 || manifest.skippedMandatoryGates.length > 0));
  process.exit(blocked ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  main();
}
