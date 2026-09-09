import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createEvidenceLedger } from './evidence';
import { EVIDENCE_CATEGORIES, skippedMandatory } from './manifest';
import { sha256 } from './store';
import type { CodeIdentity, EvidenceActor, EvidenceStatus, OutcomeKind } from './types';

// Section 60 — automated evidence collection.
//
// This is the part of the framework that has to actually run, because a
// governance layer nobody feeds is a schema with opinions. It executes the real
// suites, reads what they emitted, hashes the artifacts, binds everything to the
// commit that produced them and writes the xiv-evidence package described in
// section 39.
//
// It does exactly four of the five things automation is permitted to do:
// collect, hash, calculate thresholds and recommend. It does not verify and it
// does not approve. There is no flag for that, and adding one would be the
// single most damaging change anybody could make to this file — most gates come
// out of a run as VERIFICATION_PENDING or UNPROVEN, and that is the output
// working correctly rather than the output being incomplete.

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');

type CollectedResult = {
  suite: string;
  testCase: string;
  expected: string;
  actual: string;
  status: EvidenceStatus;
  outcomeKind: OutcomeKind;
};

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
}

function codeIdentity(): CodeIdentity & { dirty: boolean } {
  const commitSha = git('rev-parse', 'HEAD');
  let repository = 'unknown';
  try {
    repository = git('config', '--get', 'remote.origin.url');
  } catch {
    repository = 'local';
  }
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  const dirty = git('status', '--porcelain').length > 0;

  // Section 38 asks for the versions the result depends on, not just the commit.
  // The migration hash matters most here: a schema change invalidates every RLS
  // result taken before it, and the hash is what lets XIV notice.
  const migrationFiles = git('ls-files', 'supabase/migrations').split('\n').filter(Boolean);
  const migrationHash = sha256(
    migrationFiles.map((file) => `${file}:${git('hash-object', file)}`).join('\n'),
  );

  let dependencyLockHash: string | null = null;
  try {
    dependencyLockHash = git('hash-object', 'services/ai/package-lock.json');
  } catch {
    dependencyLockHash = git('hash-object', 'services/ai/package.json');
  }

  return {
    repository,
    branch,
    commitSha,
    buildId: process.env.GITHUB_RUN_ID ?? process.env.CI_JOB_ID ?? null,
    migrationHash,
    dependencyLockHash,
    runtimeVersion: process.version,
    dirty,
  };
}

// The SQL harnesses print one line per expectation. Parsing their own output is
// deliberate: the evidence is what the database said it checked, not what this
// file assumes it checked because the exit code was zero.
const EVIDENCE_LINE = /XIV-EVIDENCE\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)/;

function parseSqlEvidence(output: string): CollectedResult[] {
  const results: CollectedResult[] = [];
  for (const line of output.split('\n')) {
    const match = EVIDENCE_LINE.exec(line);
    if (!match) continue;
    const [, suite, testCase, expected, actual, status, kind] = match;
    results.push({
      suite,
      testCase,
      expected,
      actual,
      status: (status as EvidenceStatus) ?? 'error',
      outcomeKind: kind === 'negative' ? 'negative' : 'positive',
    });
  }
  return results;
}

// TAP is parsed rather than the spec reporter's prose because it is a format
// with a grammar. A skipped test carries a SKIP directive and is recorded as
// skipped, never folded into the pass count.
function parseTap(output: string): CollectedResult[] {
  const results: CollectedResult[] = [];
  for (const raw of output.split('\n')) {
    const line = raw.trim();
    const match = /^(not ok|ok)\s+\d+\s+-\s+(.*)$/.exec(line);
    if (!match) continue;
    const [, verdict, rest] = match;
    const skipped = /#\s*(SKIP|TODO)/i.test(rest);
    const name = rest.replace(/\s*#\s*(SKIP|TODO).*$/i, '').trim();
    // Node prints a summary line per file as well as per test; the file-level
    // ones duplicate their children, so they are dropped.
    if (name.endsWith('.test.ts')) continue;
    results.push({
      suite: 'services/ai unit and behaviour tests',
      testCase: name,
      expected: 'pass',
      actual: verdict === 'ok' ? 'pass' : 'fail',
      status: skipped ? 'skipped' : verdict === 'ok' ? 'pass' : 'fail',
      outcomeKind: 'positive',
    });
  }
  return results;
}

// Both streams are kept. psql writes its notices to stderr, and the notices are
// where the SQL harnesses put their evidence, so a collector that read only
// stdout would silently produce an empty package from a suite that ran
// perfectly.
function run(command: string, args: string[], cwd: string): { output: string; ok: boolean } {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, NODE_OPTIONS: '' },
  });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  return { output, ok: result.status === 0 };
}

// Which criterion a result speaks to. One check can be evidence for more than
// one gate, and honestly is: a cross-tenant DENY on a table proves something
// about row level security and something about tenant isolation, and pretending
// it only counts once would understate both.
const ROUTES: readonly { gate: string; match: RegExp }[] = [
  { gate: 'rls', match: /rls|anon select|UNAUTHENTICATED|REVOKED|SELECT ORG_|UPDATE ORG_|DELETE ORG_/i },
  { gate: 'tenant_isolation', match: /ORG_A|ORG_B|organization|another tenant|cross-tenant/i },
  { gate: 'universe_isolation', match: /universe [ab]|cross-universe|another universe/i },
  { gate: 'kill_switch', match: /kill switch|halted|paused agent|stopped/i },
  { gate: 'dangerous_workload_stoppable', match: /kill switch|paused agent|control state/i },
  { gate: 'resource_governor', match: /budget|quota|exhaust|beyond its participant/i },
  { gate: 'no_guardian_bypass', match: /guardian|injection|injected instruction/i },
  { gate: 'workload_authorization', match: /capability|authoriz|approval|impersonat|speaking grant/i },
  { gate: 'no_unauthorized_production_action', match: /without human approval|unauthorized|revoked action/i },
  { gate: 'provenance', match: /provenance|lineage|traces back|reconstruct/i },
  { gate: 'agent_runtime_assignment', match: /runtime|node|scheduler/i },
  { gate: 'model_authorization', match: /model|evaluation gate/i },
  { gate: 'no_exposed_production_secrets', match: /secret|token|credential/i },
];

function routeGates(result: CollectedResult, isDatabaseSuite: boolean): string[] {
  const haystack = `${result.suite} ${result.testCase}`;
  const gates = ROUTES.filter((route) => route.match.test(haystack)).map((route) => route.gate);
  if (gates.length > 0) return gates;
  // Everything that matched nothing still has to land somewhere, or the package
  // would quietly lose results. The fallback follows the suite rather than being
  // a single bucket, so a database result never ends up filed under a web
  // regression gate and overstating what that gate has behind it.
  return isDatabaseSuite ? ['rls'] : ['api_web_regression'];
}

function categoryFor(gate: string): string {
  if (gate === 'rls') return 'rls';
  if (gate === 'tenant_isolation' || gate === 'universe_isolation') return 'tenant-isolation';
  if (gate === 'provenance') return 'provenance';
  if (gate === 'no_exposed_production_secrets') return 'secrets';
  if (gate === 'agent_runtime_assignment') return 'runtime';
  if (gate === 'model_authorization') return 'models';
  if (gate.startsWith('no_') || gate.includes('kill') || gate.includes('guardian')) return 'security';
  if (gate === 'api_web_regression') return 'unit';
  return 'integration';
}

export type CollectionReport = {
  code: CodeIdentity & { dirty: boolean };
  testRunId: string;
  outputDir: string;
  sqlOk: boolean;
  unitOk: boolean;
  recordCount: number;
  skippedMandatory: number;
  manifestHash: string;
  readinessSummary: ReturnType<ReturnType<typeof createEvidenceLedger>['canaryReadiness']>;
};

export function collect(options: { outputDir?: string; environment?: string } = {}): CollectionReport {
  const code = codeIdentity();
  const outputDir = options.outputDir ?? join(REPO_ROOT, 'xiv-evidence');
  const environment = options.environment ?? 'local-developer-workstation';
  const testRunId = sha256(`${code.commitSha}:${Date.now()}`).slice(0, 32);

  const sql = run('bash', [join(REPO_ROOT, 'supabase/tests/run-local.sh')], REPO_ROOT);

  const serviceRoot = join(REPO_ROOT, 'services/ai');
  const testFiles = readdirSync(join(serviceRoot, 'civilization/tests'))
    .filter((file) => file.endsWith('.test.ts'))
    .map((file) => join('civilization/tests', file));
  const unit = run(
    process.execPath,
    ['--import', 'tsx', '--test', '--test-reporter=tap', ...testFiles],
    serviceRoot,
  );

  const results = [...parseSqlEvidence(sql.output), ...parseTap(unit.output)];

  // The ledger runs against a single-tenant stub of the civilization's
  // membership model. XIV's own delivery evidence belongs to XIV, so there is
  // one universe here and the collector is a member of it.
  const universeId = 'xiv-platform';
  const collector: EvidenceActor = { universeId, userId: 'xiv-evidence-collector' };
  const ledger = createEvidenceLedger({
    isMember: () => true,
    isSupervisor: () => true,
    organizationOf: () => 'xiv',
  });

  ledger.seedOwnershipMatrix(collector);
  for (const gate of ledger.listGates(collector)) {
    // Ownership is by role, and the roles are all currently one small team, so
    // the collector records the owning role rather than inventing a person. It
    // is enough to lift a gate out of UNASSIGNED and no further: the verifier
    // is deliberately left empty, because automation cannot appoint one.
    ledger.assignGate(collector, { gateKey: gate.gateKey, ownerId: `role:${gate.ownerRole}` });
  }

  rmSync(outputDir, { recursive: true, force: true });
  for (const category of EVIDENCE_CATEGORIES) {
    mkdirSync(join(outputDir, category), { recursive: true });
  }

  const artifactLines = new Map<string, string[]>();
  for (const result of results) {
    const fromDatabase = result.suite !== 'services/ai unit and behaviour tests';
    for (const gateKey of routeGates(result, fromDatabase)) {
      const category = categoryFor(gateKey);
      const location = `xiv-evidence/${category}/${gateKey}.jsonl`;
      const line = JSON.stringify({
        suite: result.suite,
        testCase: result.testCase,
        expected: result.expected,
        actual: result.actual,
        status: result.status,
        outcomeKind: result.outcomeKind,
        commitSha: code.commitSha,
      });
      const lines = artifactLines.get(location) ?? [];
      lines.push(line);
      artifactLines.set(location, lines);

      const isDatabaseSuite = fromDatabase;
      ledger.recordEvidence(collector, {
        gateKey,
        testRunId,
        code,
        environment,
        testSuite: result.suite,
        testCase: result.testCase,
        expectedResult: result.expected,
        actualResult: result.actual,
        status: result.status,
        outcomeKind: result.outcomeKind,
        // A database policy test and an RLS adversarial suite are named in
        // section 35 as E3. A unit test is named as E2, and is recorded as E2
        // even though it would technically clear the E3 bar here, because
        // calling a locally-run unit test system-generated verified evidence
        // would be exactly the sort of inflation this framework exists to stop.
        claimedLevel: isDatabaseSuite ? 'E3' : 'E2',
        executorType: isDatabaseSuite ? 'database' : 'ci',
        executorId: isDatabaseSuite ? 'postgresql-16' : `node-${process.version}`,
        evidenceLocation: location,
        evidenceContent: line,
        reproductionCommand: isDatabaseSuite
          ? './supabase/tests/run-local.sh'
          : 'npm --prefix services/ai test',
        primaryOwner: `role:${ledger.listGates(collector).find((g) => g.gateKey === gateKey)?.ownerRole}`,
      });
    }
  }

  for (const [location, lines] of artifactLines) {
    const path = join(REPO_ROOT, location);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${lines.join('\n')}\n`);
  }

  // A suite that failed to run at all is not silence. It is recorded as a
  // blocked mandatory result so the gates it would have covered drop out of
  // PASS rather than simply having nothing to say.
  if (!sql.ok) {
    ledger.recordEvidence(collector, {
      gateKey: 'rls',
      testRunId,
      code,
      environment,
      testSuite: 'sql harnesses',
      testCase: 'the SQL suite did not complete',
      expectedResult: 'the suite runs to completion',
      actualResult: 'the suite exited non-zero',
      status: 'blocked',
      claimedLevel: 'E1',
      executorType: 'ci',
      executorId: 'run-local.sh',
      evidenceLocation: 'xiv-evidence/rls/suite-failure.txt',
      evidenceContent: sql.output.slice(-4000),
      primaryOwner: 'role:Database',
    });
    writeFileSync(join(outputDir, 'rls/suite-failure.txt'), sql.output.slice(-20000));
  }

  const allRecords = ledger.listRecords(collector);
  const manifest = ledger.buildManifest(collector, {
    testRunId,
    code,
    environment,
    generatedBy: 'services/ai/evidence/collect.ts',
  });

  const readinessRows = ledger.readiness(collector, code.commitSha);
  const summary = ledger.canaryReadiness(collector, code.commitSha);
  const skipped = skippedMandatory(allRecords);

  writeFileSync(
    join(outputDir, 'manifest.json'),
    `${JSON.stringify(
      {
        ...manifest,
        // Named, not counted. Section 39's rule is that a skipped mandatory test
        // stays visible, and a number on its own is not visible enough.
        skippedMandatoryTests: skipped.map((record) => ({
          gate: ledger.listGates(collector).find((g) => g.id === record.gateId)?.gateKey,
          testCase: record.testCase,
          reason: record.actualResult,
        })),
        workingTreeDirty: code.dirty,
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    join(outputDir, 'readiness.json'),
    `${JSON.stringify({ commitSha: code.commitSha, summary, gates: readinessRows }, null, 2)}\n`,
  );
  writeFileSync(join(outputDir, 'founder-brief.md'), founderBrief(code, summary, readinessRows));

  return {
    code,
    testRunId,
    outputDir,
    sqlOk: sql.ok,
    unitOk: unit.ok,
    recordCount: allRecords.length,
    skippedMandatory: skipped.length,
    manifestHash: manifest.manifestHash,
    readinessSummary: summary,
  };
}

// Section 58, rendered. The brief leads with what is not proven, because a
// readiness document that opens with its successes is a sales document.
function founderBrief(
  code: CodeIdentity & { dirty: boolean },
  summary: ReturnType<ReturnType<typeof createEvidenceLedger>['canaryReadiness']>,
  rows: ReturnType<ReturnType<typeof createEvidenceLedger>['readiness']>,
): string {
  const byClassification = new Map<string, typeof rows>();
  for (const row of rows) {
    byClassification.set(row.classification, [...(byClassification.get(row.classification) ?? []), row]);
  }

  const order = ['UNPROVEN', 'BLOCKED', 'UNAVAILABLE', 'REPORTED', 'OBSERVED', 'VERIFIED'];
  const sections = order
    .filter((classification) => byClassification.has(classification))
    .map((classification) => {
      const entries = byClassification.get(classification) ?? [];
      const lines = entries
        .map((row) => `- **${row.gateKey}** — ${row.state}. ${row.reasons.join('; ')}`)
        .join('\n');
      return `## ${classification} (${entries.length})\n\n${lines}\n`;
    })
    .join('\n');

  return `# XIV deployment readiness

Commit \`${code.commitSha}\` on \`${code.branch}\`${code.dirty ? ' (working tree dirty)' : ''}.
Generated by \`services/ai/evidence/collect.ts\`. Automation collected this
evidence and calculated these thresholds. It did not verify anything and it did
not approve anything.

**Canary eligible: ${summary.canaryEligible ? 'yes' : 'no'}.**
${summary.reasons.map((reason) => `- ${reason}`).join('\n')}

${summary.pass} of ${summary.total} gates PASS, ${summary.fail} FAIL, ${summary.tbd} TBD.
TBD is not PASS.

${sections}`;
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  const report = collect();
  console.log(`[xiv-evidence] commit ${report.code.commitSha}${report.code.dirty ? ' (dirty tree)' : ''}`);
  console.log(`[xiv-evidence] ${report.recordCount} records, manifest ${report.manifestHash.slice(0, 16)}`);
  console.log(`[xiv-evidence] sql suite ${report.sqlOk ? 'ok' : 'FAILED'}, unit suite ${report.unitOk ? 'ok' : 'FAILED'}`);
  console.log(
    `[xiv-evidence] ${report.readinessSummary.pass}/${report.readinessSummary.total} gates PASS, ` +
      `${report.readinessSummary.tbd} TBD, canary eligible: ${report.readinessSummary.canaryEligible}`,
  );
  for (const reason of report.readinessSummary.reasons) console.log(`[xiv-evidence]   ${reason}`);
}
