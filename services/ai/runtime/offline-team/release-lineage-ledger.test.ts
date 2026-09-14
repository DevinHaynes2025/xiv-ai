// 12D-133 — focused tests for the RELEASE-LINEAGE CONSOLIDATION & VALIDATION LEDGER.
// Coverage: inventory + classification + canonical path, lineage cycles, missing
// parents, SHA drift, false CI claims, duplicate stories, cross-lineage
// contamination, divergence, excessive stack depth, abandonment, the
// no-validated-head fail-closed, secret exclusion, honest flags, structural gates.

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import {
  buildReleaseLedger, ledgerToJson, composeCeoReport, RELEASE_LEDGER_POLICY,
  RELEASE_LEDGER_GUARDRAILS,
  type DeclaredMergeRequestRow, type DeclaredPipelineEvidence,
} from './release-lineage-ledger';

const sha40 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 40);
const NOW = 1_757_700_000_000;
const INTEGRATION = 'claude/12d-99-supervised-local-worker';
const DAY = 86_400_000;

const mkRow = (over: Partial<DeclaredMergeRequestRow> & { mrIid: number }): DeclaredMergeRequestRow => ({
  title: `MR !${over.mrIid}`,
  sourceBranch: `claude/story-${over.mrIid}`,
  targetBranch: INTEGRATION,
  headSha: sha40(`head-${over.mrIid}`),
  parentMrIid: null,
  storyId: '',
  pipelineId: null,
  declaredCiStatus: 'NOT_EXECUTED',
  hasConflicts: false,
  openedAtMs: NOW - 3 * DAY,
  ...over,
});

// A representative snapshot: one CI-validated head, one quota-blocked, one
// not-executed, one conflicted, one local-only.
const cleanInventory = (): DeclaredMergeRequestRow[] => [
  mkRow({ mrIid: 10, storyId: '12D-130', sourceBranch: 'claude/12d-130-scaling', pipelineId: 101, declaredCiStatus: 'NATIVE_CI_PASSED', openedAtMs: NOW - 40 * DAY }),
  mkRow({ mrIid: 14, storyId: '12D-132', sourceBranch: 'claude/12d-132-collector', declaredCiStatus: 'NOT_EXECUTED', openedAtMs: NOW - 3 * DAY }),
  mkRow({ mrIid: 16, sourceBranch: 'claude/story-16', declaredCiStatus: 'LOCAL_ONLY' }),
  mkRow({ mrIid: 17, storyId: '12D-128', sourceBranch: 'claude/story-17', declaredCiStatus: 'LOCAL_ONLY', hasConflicts: true }),
  mkRow({ mrIid: 18, sourceBranch: 'claude/story-18', pipelineId: 103, declaredCiStatus: 'QUOTA_BLOCKED' }),
];

const cleanHeads = (rows: DeclaredMergeRequestRow[]): Record<string, string> =>
  Object.fromEntries(rows.map((r) => [r.sourceBranch, r.headSha]));

const buildClean = () => buildReleaseLedger({
  integrationBranch: INTEGRATION,
  lastValidatedHeadSha: sha40('integration-fallback'),
  measuredBranchHeads: cleanHeads(cleanInventory()),
  pipelineEvidence: [
    { pipelineId: 101, status: 'PASSED', recordedAtMs: NOW - 40 * DAY },
    { pipelineId: 103, status: 'QUOTA_BLOCKED', recordedAtMs: NOW - 2 * DAY },
  ],
  rows: cleanInventory(),
  generatedAtMs: NOW,
});

test('12d-133 happy path: the inventory is classified and the canonical path is proposed', () => {
  const ledger = buildClean();
  assert.equal(ledger.kind, 'RELEASE_LINEAGE_LEDGER');
  const byIid = new Map(ledger.rows.map((r) => [r.mrIid, r]));
  assert.equal(byIid.get(10)!.classification, 'NATIVE_CI_PASSED');
  assert.equal(byIid.get(14)!.classification, 'NOT_EXECUTED');
  assert.equal(byIid.get(16)!.classification, 'LOCAL_ONLY');
  assert.equal(byIid.get(17)!.classification, 'CONFLICTED');
  assert.equal(byIid.get(18)!.classification, 'QUOTA_BLOCKED');
  // The path starts from the last native-CI-validated head (mr 10) and walks parents.
  assert.deepEqual(ledger.canonicalPath, [10]);
  assert.equal(ledger.lastValidatedHeadSha, sha40('head-10'));
  assert.match(ledger.canonicalPathBasis, /MR !10/);
  // A clean snapshot raises no findings.
  assert.equal(ledger.findings.length, 0);
  // Issues keep their fixed dispositions.
  assert.equal(ledger.issueDispositions['98'], 'CHANGES_REQUIRED');
  assert.equal(ledger.issueDispositions['99'], 'DIAGNOSTIC_ONLY');
  assert.equal(Object.isFrozen(ledger), true);
});

test('12d-133 lineage cycles are structural failures, not findings', () => {
  const rows = [
    mkRow({ mrIid: 301, storyId: '12D-130', parentMrIid: 302 }),
    mkRow({ mrIid: 302, storyId: '12D-131', parentMrIid: 301 }),
  ];
  assert.throws(() => buildReleaseLedger({
    integrationBranch: INTEGRATION, lastValidatedHeadSha: sha40('fb'),
    measuredBranchHeads: cleanHeads(rows), pipelineEvidence: [], rows, generatedAtMs: NOW,
  }), /lineage cycle/);
});

test('12d-133 missing parents are recorded, never crashed on', () => {
  const rows = [mkRow({ mrIid: 305, storyId: '12D-130', parentMrIid: 999 })];
  const ledger = buildReleaseLedger({
    integrationBranch: INTEGRATION, lastValidatedHeadSha: sha40('fb'),
    measuredBranchHeads: cleanHeads(rows), pipelineEvidence: [],
    rows, generatedAtMs: NOW,
  });
  const f = ledger.findings.find((x) => x.kind === 'MISSING_PARENT');
  assert.ok(f);
  assert.equal(f.mrIid, 305);
  assert.match(f.detail, /!999/);
});

test('12d-133 SHA drift and missing declared heads are detected against measured heads', () => {
  const rows = cleanInventory();
  const measuredHead14 = rows[1]!.headSha;
  rows[1] = { ...rows[1]!, headSha: sha40('stale-14') }; // inventory disagrees with measurement
  const heads = cleanHeads(rows);
  heads['claude/12d-132-collector'] = measuredHead14; // the MEASURED head is the original
  delete heads['claude/story-16']; // no measured head for this branch at all
  const ledger = buildReleaseLedger({
    integrationBranch: INTEGRATION, lastValidatedHeadSha: sha40('fb'),
    measuredBranchHeads: heads, pipelineEvidence: [
      { pipelineId: 101, status: 'PASSED', recordedAtMs: NOW - 40 * DAY },
      { pipelineId: 103, status: 'QUOTA_BLOCKED', recordedAtMs: NOW - 2 * DAY },
    ],
    rows, generatedAtMs: NOW,
  });
  const drift = ledger.findings.find((x) => x.kind === 'SHA_DRIFT');
  assert.ok(drift);
  assert.equal(drift.mrIid, 14);
  assert.ok(ledger.findings.some((x) => x.kind === 'MISSING_DECLARED_HEAD' && x.mrIid === 16));
});

test('12d-133 false CI claims never stand: unbacked PASSED claims are downgraded', () => {
  const rows = [
    mkRow({ mrIid: 401, storyId: '12D-130', declaredCiStatus: 'NATIVE_CI_PASSED', pipelineId: null }),
    mkRow({ mrIid: 402, storyId: '12D-131', declaredCiStatus: 'NATIVE_CI_PASSED', pipelineId: 402 }),
  ];
  const ledger = buildReleaseLedger({
    integrationBranch: INTEGRATION, lastValidatedHeadSha: sha40('fb'),
    measuredBranchHeads: cleanHeads(rows),
    pipelineEvidence: [{ pipelineId: 402, status: 'QUOTA_BLOCKED', recordedAtMs: NOW - DAY }],
    rows, generatedAtMs: NOW,
  });
  const claims = ledger.findings.filter((x) => x.kind === 'FALSE_CI_CLAIM');
  assert.equal(claims.length, 2);
  const byIid = new Map(ledger.rows.map((r) => [r.mrIid, r]));
  // Unbacked → downgraded to NOT_EXECUTED; contradicted by evidence → evidence wins.
  assert.equal(byIid.get(401)!.classification, 'NOT_EXECUTED');
  assert.equal(byIid.get(402)!.classification, 'QUOTA_BLOCKED');
  // And neither row can be the validated head — no canonical path is proposed.
  assert.equal(ledger.canonicalPath, null);
  assert.ok(ledger.findings.some((x) => x.kind === 'NO_NATIVE_CI_HEAD'));
});

test('12d-133 duplicate stories, supersession, divergence, and excessive depth', () => {
  const chain = Array.from({ length: 11 }, (_, i) => mkRow({
    mrIid: 500 + i, storyId: i === 0 ? '12D-130' : `12D-${100 + i}`,
    parentMrIid: i === 0 ? null : 500 + i - 1,
    openedAtMs: NOW - (20 - i) * DAY,
  }));
  const dup = [
    mkRow({ mrIid: 511, storyId: '12D-132', sourceBranch: 'claude/12d-132-a', openedAtMs: NOW - 5 * DAY }),
    mkRow({ mrIid: 512, storyId: '12D-132', sourceBranch: 'claude/12d-132-b', openedAtMs: NOW - 2 * DAY }),
  ];
  const divergent = [
    mkRow({ mrIid: 513, storyId: '12D-129', sourceBranch: 'claude/12d-132-a', targetBranch: 'main' }),
  ];
  const rows = [...chain, ...dup, ...divergent];
  const ledger = buildReleaseLedger({
    integrationBranch: INTEGRATION, lastValidatedHeadSha: sha40('fb'),
    measuredBranchHeads: cleanHeads(rows), pipelineEvidence: [], rows, generatedAtMs: NOW,
  });
  const kinds = new Set(ledger.findings.map((f) => f.kind));
  assert.ok(kinds.has('DUPLICATE_STORY'));
  assert.ok(kinds.has('SUPERSEDED_BY'));
  assert.ok(kinds.has('DIVERGENT_SOURCE'));
  assert.ok(kinds.has('EXCESSIVE_STACK_DEPTH'));
  // Deterministic supersession: the older duplicate is superseded by the newer one.
  const sup = ledger.findings.find((f) => f.kind === 'SUPERSEDED_BY');
  assert.ok(sup);
  assert.equal(sup.mrIid, 511);
  assert.match(sup.detail, /!512/);
  const byIid = new Map(ledger.rows.map((r) => [r.mrIid, r]));
  assert.equal(byIid.get(511)!.classification, 'SUPERSEDED');
  assert.equal(byIid.get(512)!.classification, 'NOT_EXECUTED');
  // Depth findings name exactly the rows deeper than the policy (9, 10, 11).
  const depthFindings = ledger.findings.filter((f) => f.kind === 'EXCESSIVE_STACK_DEPTH');
  assert.deepEqual(depthFindings.map((f) => f.mrIid).sort((a, b) => a - b), [508, 509, 510]);
});

test('12d-133 cross-lineage contamination: one story spanning distinct lineage trees', () => {
  const rows = [
    mkRow({ mrIid: 601, storyId: '12D-130', parentMrIid: 602 }),
    mkRow({ mrIid: 602, storyId: '12D-131' }),
    mkRow({ mrIid: 603, storyId: '12D-130' }), // same story, its own tree
  ];
  const ledger = buildReleaseLedger({
    integrationBranch: INTEGRATION, lastValidatedHeadSha: sha40('fb'),
    measuredBranchHeads: cleanHeads(rows), pipelineEvidence: [], rows, generatedAtMs: NOW,
  });
  const f = ledger.findings.find((x) => x.kind === 'CROSS_LINEAGE_CONTAMINATION');
  assert.ok(f);
  assert.match(f.detail, /12D-130/);
  assert.match(f.detail, /2 distinct lineage trees/);
  // And the plain duplicate-story finding fires alongside it.
  assert.ok(ledger.findings.some((x) => x.kind === 'DUPLICATE_STORY'));
});

test('12d-133 abandoned MRs and the no-validated-head fail-closed', () => {
  const rows = [mkRow({ mrIid: 701, storyId: '12D-126', openedAtMs: NOW - 31 * DAY })];
  const ledger = buildReleaseLedger({
    integrationBranch: INTEGRATION, lastValidatedHeadSha: sha40('integration-fallback'),
    measuredBranchHeads: cleanHeads(rows), pipelineEvidence: [], rows, generatedAtMs: NOW,
  });
  assert.ok(ledger.findings.some((x) => x.kind === 'ABANDONED' && x.mrIid === 701));
  assert.equal(ledger.canonicalPath, null);
  assert.equal(ledger.lastValidatedHeadSha, sha40('integration-fallback'));
  assert.match(ledger.canonicalPathBasis, /refuses to start anywhere/);
  assert.ok(ledger.findings.some((x) => x.kind === 'NO_NATIVE_CI_HEAD'));
});

test('12d-133 the CEO report and JSON exclude secrets and are deterministic', () => {
  const rows = [mkRow({
    mrIid: 801, storyId: '12D-132',
    title: 'Add collector — api_key=sk-live-abcdef123456 rotated on shard 42',
    declaredCiStatus: 'LOCAL_ONLY',
  })];
  const ledger = buildReleaseLedger({
    integrationBranch: INTEGRATION, lastValidatedHeadSha: sha40('fb'),
    measuredBranchHeads: cleanHeads(rows), pipelineEvidence: [], rows, generatedAtMs: NOW,
  });
  const json = ledgerToJson(ledger);
  const report = composeCeoReport(ledger);
  assert.ok(!json.includes('sk-live-abcdef123456'));
  assert.ok(!report.includes('sk-live-abcdef123456'));
  assert.ok(!json.includes('api_key='));
  assert.ok(!report.includes('api_key='));
  assert.match(report, /# Release-Lineage Consolidation & Validation Ledger \(12D-133\)/);
  assert.match(report, /CHANGES_REQUIRED/);
  assert.match(report, /DIAGNOSTIC_ONLY/);
  assert.match(report, /never executed by this ledger/);
  // Deterministic: the same ledger serializes identically twice.
  assert.equal(ledgerToJson(ledger), json);
  assert.equal(composeCeoReport(ledger), report);
});

test('12d-133 honest flags and guardrails: the ledger permits nothing', () => {
  const ledger = buildClean();
  assert.equal(ledger.humanDecision, 'REQUIRED');
  assert.equal(ledger.learningPromoted, false);
  assert.equal(ledger.modelCalls, 0);
  assert.equal(ledger.remoteCalls, 0);
  assert.equal(ledger.billionUsersProven, false);
  assert.equal(ledger.automaticRecovery, false);
  assert.equal(RELEASE_LEDGER_GUARDRAILS.neverClosesMergesRebasesRetriesDeploysOrModifiesBranchesOrIssues, true);
  assert.equal(RELEASE_LEDGER_GUARDRAILS.nativeCiPassedIsNeverTrustedWithoutDeclaredPipelineEvidence, true);
  assert.equal(RELEASE_LEDGER_GUARDRAILS.canonicalPathIsProposedNeverExecuted, true);
  assert.equal(RELEASE_LEDGER_GUARDRAILS.summariesExcludeSecretsAndConfidentialContent, true);
  assert.equal(RELEASE_LEDGER_GUARDRAILS.snapshotInputIsDeclaredNeverFetchedByThisModule, true);
  assert.equal(RELEASE_LEDGER_GUARDRAILS.permitsNoProviderCall, true);
  assert.equal(RELEASE_LEDGER_GUARDRAILS.permitsNoProductionMutation, true);
  assert.equal(RELEASE_LEDGER_GUARDRAILS.permitsNoMergeOrDeployment, true);
  assert.equal(Object.isFrozen(RELEASE_LEDGER_GUARDRAILS), true);
  assert.equal(Object.isFrozen(RELEASE_LEDGER_POLICY), true);
  assert.equal(RELEASE_LEDGER_POLICY.classifications.length, 6);
});

test('12d-133 structural gates: shapes, SHAs, story ids, iids, and futures fail closed', () => {
  // A row with an extra (confidential-shaped) key is rejected outright.
  assert.throws(() => buildReleaseLedger({
    integrationBranch: INTEGRATION, lastValidatedHeadSha: sha40('fb'),
    measuredBranchHeads: {},
    pipelineEvidence: [],
    rows: [{ ...cleanInventory()[0]!, description: 'confidential body' } as unknown as DeclaredMergeRequestRow],
    generatedAtMs: NOW,
  }), /exact keys/);
  const base = {
    integrationBranch: INTEGRATION, lastValidatedHeadSha: sha40('fb'),
    measuredBranchHeads: {}, pipelineEvidence: [], generatedAtMs: NOW,
  };
  assert.throws(() => buildReleaseLedger({ ...base, rows: [mkRow({ mrIid: 1 }), mkRow({ mrIid: 1 })] }), /duplicate MR iid/);
  assert.throws(() => buildReleaseLedger({ ...base, rows: [mkRow({ mrIid: 2, headSha: 'nothex' })] }), /40-hex/);
  assert.throws(() => buildReleaseLedger({ ...base, rows: [mkRow({ mrIid: 3, storyId: '13D-1' })] }), /storyId/);
  assert.throws(() => buildReleaseLedger({ ...base, rows: [mkRow({ mrIid: 4, parentMrIid: 4 })] }), /own parent/);
  assert.throws(() => buildReleaseLedger({ ...base, rows: [mkRow({ mrIid: 5, openedAtMs: NOW + DAY })] }), /future/);
  assert.throws(() => buildReleaseLedger({
    ...base, rows: [mkRow({ mrIid: 6, pipelineId: 9 })],
    pipelineEvidence: [{ pipelineId: 9, status: 'PASSED', recordedAtMs: NOW }, { pipelineId: 9, status: 'PASSED', recordedAtMs: NOW }],
  }), /duplicated for pipeline/);
  assert.throws(() => buildReleaseLedger({ ...base, rows: [mkRow({ mrIid: 7 })], lastValidatedHeadSha: 'short' }), /40-hex/);
});