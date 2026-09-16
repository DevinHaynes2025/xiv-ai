// 12D-282 — adversarial tests for the reading provenance VIEW MODEL
// (the story shell's rendering contract over the 12D-281 view).
// Central properties under attack:
//   1. VERIFY BEFORE RENDER: the REAL 12D-264 replay + the REAL 12D-281
//      view run first; a tampered or empty ledger REFUSES — never an
//      empty success, never a partial render, and the door NEVER THROWS.
//   2. PROVENANCE CARRIED, NOT INVENTED: the records show exactly the
//      refs the ledgered candidates carry.
//   3. NO WRITE PATH: the door's transient store refuses save; the
//      submitted lines are never mutated.
//   4. REFUSED SUBMISSIONS RENDER ZERO LEDGER CONTENT.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue } from './offline-story-queue';
import { prepareDocumentStories } from './xiv-document-ingest';
import { registerReadingSource, type ReadingSourceStore } from './xiv-reading-source-register';
import { admitBoundReading } from './xiv-bound-admission';
import { prepareBoundReadingPathwayEvidence } from './xiv-bound-reading-evidence';
import { buildPathwayApprovalPlan, applyRecordedApproval } from './xiv-pathway-approval-link';
import {
  appendPathwayCandidate, replayPathwayCensus, type PathwayLedgerStore,
} from './xiv-pathway-ledger';
import {
  READING_PROVENANCE_VIEW_MODEL_POLICY, READING_PROVENANCE_VIEW_MODEL_GUARDRAILS,
  buildReadingProvenanceViewModel,
} from './xiv-reading-provenance-view-model';

const GENESIS = '12d-282-register-genesis';
const LEDGER_GENESIS = '12d-282-ledger-genesis';
const tenantId = 'reading-tenant';
const OPERATOR = 'ceo-operator';
const NOW_MS = 1_700_000_000_000;
const OUTPUT = 'e'.repeat(64);

class MemoryRegisterStore implements ReadingSourceStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
}
class MemoryLedgerStore implements PathwayLedgerStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
}

const pad = (seed: string): string => seed + '.'.repeat(Math.max(0, 1200 - seed.length));
const DOC = [
  pad('First paragraph of the provenance view model reading.'),
  pad('Second paragraph of the provenance view model reading.'),
  pad('Third paragraph of the provenance view model reading.'),
].join('\n\n');

/** The REAL chain to a LEDGERED reading candidate: register → prepare →
 *  bound admit → claim → settle → review → 12D-279 evidence → 12D-269
 *  recorded approval → 12D-264 append. */
function ledgerOneReadingEntry(store: PathwayLedgerStore): { pathwayId: string; registerDigest: string; documentDigest: string; sourceId: string } {
  const registerStore = new MemoryRegisterStore();
  registerReadingSource(registerStore, GENESIS, {
    tenantId, sourceId: 'quantumlib-cirq',
    title: 'Cirq — open-source quantum circuit framework',
    sourceUrl: 'https://github.com/quantumlib/Cirq',
    sourceClass: 'OPEN_SOURCE_REPO',
    licenseNote: 'Apache 2.0 — public repository, cited verbatim',
  });
  const prepared = prepareDocumentStories({ tenantId, documentId: 'cirq-reading-1', title: 'Cirq reading', bodyText: DOC });
  const dir = mkdtempSync(join(tmpdir(), 'xiv-reading-provenance-vm-'));
  const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
  try {
    const bound = admitBoundReading(q, registerStore, GENESIS, prepared, {
      tenantId, sourceId: 'quantumlib-cirq', documentId: 'cirq-reading-1',
      documentDigestSha256: prepared.documentDigestSha256,
    });
    const lease = q.claimNext(tenantId, 'memory_curator', 'worker-1', 120000);
    assert.ok(lease);
    q.settle(lease!, { outcome: 'DRAFT', outputHash: OUTPUT, providerSettled: true });
    const storyId = prepared.stories[0]!.id;
    q.applyReviewDecision({ tenantId, storyId, reviewerId: 'secure_code_reviewer', expectedOutputHash: OUTPUT, decision: 'APPROVED', reviewRef: 'review:reading-1' });
    const packet = prepareBoundReadingPathwayEvidence(q, bound, {
      tenantId, storyId, pathwayId: 'pathway-reading-vm', domain: 'SECURITY' as const,
      version: 1, confidence: 0.9, evaluationScore: 0.95,
      evidenceRefs: ['run:reading-vm'], reviewRefs: ['review:one', 'review:two'],
      expectedOutputHash: OUTPUT, rollbackRef: 'rollback:reading-282',
    });
    const bridgePacket = {
      kind: 'QUEUE_OUTCOME_TO_PATHWAY_CANDIDATE' as const,
      tenantId: packet.tenantId, storyId: packet.storyId, outputHash: packet.outputHash,
      candidate: packet.candidate, currentEligibility: packet.currentEligibility,
      activationAttempted: false as const, learningPromoted: false as const,
      modelWeightMutation: false as const, productionMutation: false as const,
      humanDecision: 'REQUIRED' as const,
    };
    const plan = buildPathwayApprovalPlan({ packet: bridgePacket, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    const outcome = applyRecordedApproval(bridgePacket, plan);
    assert.ok(outcome.kind === 'LEDGER_READY_PATHWAY_CANDIDATE');
    appendPathwayCandidate(store, LEDGER_GENESIS, outcome.candidate);
    return {
      pathwayId: 'pathway-reading-vm',
      registerDigest: bound.binding.sourceEntryDigestSha256,
      documentDigest: bound.binding.documentDigestSha256,
      sourceId: 'quantumlib-cirq',
    };
  } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
}

/** A ledger-eligible candidate with NO reading provenance (plain bridge
 *  candidate class): counts as an otherEntry in the view model. */
function plainCandidate(pathwayId: string): Record<string, unknown> {
  return {
    pathwayId, tenantId, domain: 'GENERAL', version: 1,
    confidence: 0.9, evaluationScore: 0.95,
    evidenceRefs: ['run:plain-1'], reviewRefs: ['review:plain-1', 'review:plain-2'],
    humanApproved: true, rollbackRef: `rollback:${pathwayId}`,
    modelWeightMutation: false, productionMutation: false,
  };
}

test('12d-282: the view model renders the verified provenance from the REAL chain', () => {
  const store = new MemoryLedgerStore();
  const known = ledgerOneReadingEntry(store);
  assert.equal(replayPathwayCensus(store, LEDGER_GENESIS).entries, 1);
  const vm = buildReadingProvenanceViewModel({ ledgerGenesis: LEDGER_GENESIS, lines: [...store.load()!] });
  assert.equal(vm.kind, 'VERIFIED_READING_PROVENANCE');
  if (vm.kind !== 'VERIFIED_READING_PROVENANCE') return;
  assert.equal(vm.policyVersion, '12d-282-v1');
  assert.equal(vm.display.ledgerEntries, 1);
  assert.equal(vm.display.readingProvenanceEntries, 1);
  assert.equal(vm.display.otherEntries, 0);
  assert.equal(vm.display.bySource['quantumlib-cirq'], 1);
  assert.equal(vm.display.records.length, 1);
  const rec = vm.display.records[0]!;
  assert.equal(rec.pathwayId, known.pathwayId);
  assert.equal(rec.sourceId, known.sourceId);
  assert.equal(rec.registerEntryDigestSha256, known.registerDigest);
  assert.equal(rec.documentDigestSha256, known.documentDigest);
  assert.equal(/^[0-9a-f]{64}$/.test(rec.ledgerEntryDigest), true);
  assert.ok(vm.display.operatorNote.includes('PROVENANCE IS CARRIED, NOT RE-PROVEN'));
  assert.ok(vm.display.operatorNote.includes("humanDecision: 'REQUIRED'"));
});

test('12d-282: a plain candidate renders as an otherEntry — counts only, never invented', () => {
  const store = new MemoryLedgerStore();
  ledgerOneReadingEntry(store);
  appendPathwayCandidate(store, LEDGER_GENESIS, plainCandidate('pathway-plain-vm'));
  const vm = buildReadingProvenanceViewModel({ ledgerGenesis: LEDGER_GENESIS, lines: [...store.load()!] });
  if (vm.kind !== 'VERIFIED_READING_PROVENANCE') throw new Error('expected verified');
  assert.equal(vm.display.ledgerEntries, 2);
  assert.equal(vm.display.readingProvenanceEntries, 1);
  assert.equal(vm.display.otherEntries, 1);
  assert.equal(vm.display.records.length, 1);
});

test('12d-282: a tampered ledger renders REFUSED — zero ledger content, never throws', () => {
  const store = new MemoryLedgerStore();
  ledgerOneReadingEntry(store);
  const lines = [...store.load()!];
  lines[0] = lines[0]!.replace('"confidence":0.9', '"confidence":0.5');
  const vm = buildReadingProvenanceViewModel({ ledgerGenesis: LEDGER_GENESIS, lines });
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.ok(vm.reason.length > 0, 'the operator gets a diagnostic');
  assert.ok(!vm.display.bodyText.includes('"confidence"'), 'no ledger content renders');
  assert.ok(vm.display.bodyText.includes('NOT rendered'));
});

test('12d-282: an empty ledger renders REFUSED — the door never fabricates a zero-entry success', () => {
  const vm = buildReadingProvenanceViewModel({ ledgerGenesis: LEDGER_GENESIS, lines: [] });
  assert.equal(vm.kind, 'REFUSED');
});

test('12d-282: an over-budget ledger renders REFUSED — the view never truncates', () => {
  const store = new MemoryLedgerStore();
  for (let i = 1; i <= 257; i += 1) {
    appendPathwayCandidate(store, LEDGER_GENESIS, plainCandidate(`pathway-bulk-vm-${i}`));
  }
  const vm = buildReadingProvenanceViewModel({ ledgerGenesis: LEDGER_GENESIS, lines: [...store.load()!] });
  assert.equal(vm.kind, 'REFUSED');
});

test('12d-282: malformed submissions render REFUSED and never throw', () => {
  assert.equal(buildReadingProvenanceViewModel(null).kind, 'REFUSED');
  assert.equal(buildReadingProvenanceViewModel(42).kind, 'REFUSED');
  assert.equal(buildReadingProvenanceViewModel(['lines']).kind, 'REFUSED');
  assert.equal(buildReadingProvenanceViewModel({ ledgerGenesis: LEDGER_GENESIS }).kind, 'REFUSED', 'missing lines');
  assert.equal(buildReadingProvenanceViewModel({ ledgerGenesis: 'short', lines: [] }).kind, 'REFUSED');
  assert.equal(
    buildReadingProvenanceViewModel({ ledgerGenesis: LEDGER_GENESIS, lines: [42] }).kind, 'REFUSED',
    'a non-string line refuses',
  );
  assert.equal(
    buildReadingProvenanceViewModel({ lines: [], ledgerGenesis: LEDGER_GENESIS }).kind, 'REFUSED',
    'reordered keys refuse (exact keys in order)',
  );
});

test('12d-282: the submitted lines are never mutated and the door has no write path', () => {
  const store = new MemoryLedgerStore();
  ledgerOneReadingEntry(store);
  const lines = [...store.load()!];
  const snapshot = JSON.stringify(lines);
  const vm = buildReadingProvenanceViewModel({ ledgerGenesis: LEDGER_GENESIS, lines });
  assert.equal(vm.kind, 'VERIFIED_READING_PROVENANCE');
  assert.equal(JSON.stringify(lines), snapshot, 'the submission bytes are untouched');
});

test('12d-282: determinism and pinned policy/guardrails', () => {
  const store = new MemoryLedgerStore();
  ledgerOneReadingEntry(store);
  const submission = { ledgerGenesis: LEDGER_GENESIS, lines: [...store.load()!] };
  assert.equal(
    JSON.stringify(buildReadingProvenanceViewModel(submission)),
    JSON.stringify(buildReadingProvenanceViewModel(submission)),
  );
  assert.equal(READING_PROVENANCE_VIEW_MODEL_POLICY.policyVersion, '12d-282-v1');
  assert.equal(READING_PROVENANCE_VIEW_MODEL_GUARDRAILS.verifyBeforeRender, true);
  assert.equal(READING_PROVENANCE_VIEW_MODEL_GUARDRAILS.provenanceCarriedNotInvented, true);
  assert.equal(READING_PROVENANCE_VIEW_MODEL_GUARDRAILS.measuredCountsOnly, true);
  assert.equal(READING_PROVENANCE_VIEW_MODEL_GUARDRAILS.noWritePath, true);
  assert.equal(READING_PROVENANCE_VIEW_MODEL_GUARDRAILS.noActivationPath, true);
  assert.equal(READING_PROVENANCE_VIEW_MODEL_GUARDRAILS.refusedRendersAsRefused, true);
  assert.equal(READING_PROVENANCE_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(READING_PROVENANCE_VIEW_MODEL_GUARDRAILS.remoteCalls, 0);
  assert.equal(READING_PROVENANCE_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(READING_PROVENANCE_VIEW_MODEL_GUARDRAILS.activated, 0);
  assert.equal(READING_PROVENANCE_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(READING_PROVENANCE_VIEW_MODEL_GUARDRAILS.automaticRecovery, false);
  assert.equal(READING_PROVENANCE_VIEW_MODEL_GUARDRAILS.billionUsersProven, false);
});