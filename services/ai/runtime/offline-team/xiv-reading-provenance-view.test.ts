// 12D-281 — adversarial tests for the reading provenance view.
// Central properties under attack:
//   1. THE REAL LEDGER REPLAY IS THE TRUTH: a tampered ledger refuses
//      here exactly as it does for the census (the view never
//      re-implements or repairs the chain).
//   2. PROVENANCE IS COUNTED, NEVER INVENTED: an entry counts as
//      reading provenance ONLY if its own evidenceRefs carry a
//      reading-source ref; everything else is an otherEntry.
//   3. VIEW-ONLY: the store is only ever LOADED — save is never called.
//   4. MEASURED, BOUNDED, HONEST: counts only describe ledgered
//      entries; an over-budget view refuses rather than truncating.

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
  READING_PROVENANCE_VIEW_POLICY, READING_PROVENANCE_VIEW_GUARDRAILS,
  summarizeReadingProvenance,
} from './xiv-reading-provenance-view';

const GENESIS = '12d-281-register-genesis';
const LEDGER_GENESIS = '12d-281-ledger-genesis';
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
/** A ledger store that counts every save — the view must never call it. */
class SaveSpyLedgerStore implements PathwayLedgerStore {
  saves = 0;
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.saves += 1; this.lines = [...lines]; }
}

const pad = (seed: string): string => seed + '.'.repeat(Math.max(0, 1200 - seed.length));
const DOC = [
  pad('First paragraph of the provenance view reading.'),
  pad('Second paragraph of the provenance view reading.'),
  pad('Third paragraph of the provenance view reading.'),
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
  const dir = mkdtempSync(join(tmpdir(), 'xiv-reading-provenance-view-'));
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
      tenantId, storyId, pathwayId: 'pathway-reading-view', domain: 'SECURITY' as const,
      version: 1, confidence: 0.9, evaluationScore: 0.95,
      evidenceRefs: ['run:reading-view'], reviewRefs: ['review:one', 'review:two'],
      expectedOutputHash: OUTPUT, rollbackRef: 'rollback:reading-281',
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
      pathwayId: 'pathway-reading-view',
      registerDigest: bound.binding.sourceEntryDigestSha256,
      documentDigest: bound.binding.documentDigestSha256,
      sourceId: 'quantumlib-cirq',
    };
  } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
}

/** A ledger-eligible candidate with NO reading provenance (plain bridge
 *  candidate class): counts as an otherEntry in the view. */
function plainCandidate(pathwayId: string): Record<string, unknown> {
  return {
    pathwayId, tenantId, domain: 'GENERAL', version: 1,
    confidence: 0.9, evaluationScore: 0.95,
    evidenceRefs: ['run:plain-1'], reviewRefs: ['review:plain-1', 'review:plain-2'],
    humanApproved: true, rollbackRef: `rollback:${pathwayId}`,
    modelWeightMutation: false, productionMutation: false,
  };
}

test('12d-281: the view reads reading provenance from the verified ledger', () => {
  const store = new MemoryLedgerStore();
  const known = ledgerOneReadingEntry(store);
  assert.equal(replayPathwayCensus(store, LEDGER_GENESIS).entries, 1);
  const view = summarizeReadingProvenance(store, LEDGER_GENESIS);
  assert.equal(view.kind, 'READING_PROVENANCE_VIEW');
  assert.equal(view.ledgerEntries, 1);
  assert.equal(view.readingProvenanceEntries, 1);
  assert.equal(view.otherEntries, 0);
  assert.equal(view.bySource['quantumlib-cirq'], 1);
  assert.equal(view.records.length, 1);
  const rec = view.records[0]!;
  assert.equal(rec.pathwayId, known.pathwayId);
  assert.equal(rec.sourceId, known.sourceId);
  assert.equal(rec.registerEntryDigestSha256, known.registerDigest);
  assert.equal(rec.documentDigestSha256, known.documentDigest);
  assert.equal(HexOk(rec.registerEntryDigestSha256), true);
  assert.equal(view.activated, 0);
  assert.equal(view.learningPromoted, false);
  assert.equal(view.humanDecision, 'REQUIRED');
  assert.equal(view.modelCalls, 0);
  assert.equal(view.remoteCalls, 0);
});

test('12d-281: a plain candidate counts as an otherEntry — provenance is counted, never invented', () => {
  const store = new MemoryLedgerStore();
  ledgerOneReadingEntry(store);
  appendPathwayCandidate(store, LEDGER_GENESIS, plainCandidate('pathway-plain-1'));
  const view = summarizeReadingProvenance(store, LEDGER_GENESIS);
  assert.equal(view.ledgerEntries, 2);
  assert.equal(view.readingProvenanceEntries, 1);
  assert.equal(view.otherEntries, 1);
  assert.equal(view.records.length, 1);
});

test('12d-281: a tampered ledger refuses — the view never repairs the chain', () => {
  const store = new MemoryLedgerStore();
  ledgerOneReadingEntry(store);
  const lines = [...store.load()!];
  lines[0] = lines[0]!.replace('"confidence":0.9', '"confidence":0.5');
  const tampered = new MemoryLedgerStore();
  tampered.save(lines);
  assert.throws(() => summarizeReadingProvenance(tampered, LEDGER_GENESIS), /tampered/);
});

test('12d-281: an empty ledger refuses (the view reports, never fabricates)', () => {
  const store = new MemoryLedgerStore();
  assert.throws(() => summarizeReadingProvenance(store, LEDGER_GENESIS), /no pathway ledger found/);
  // An empty ARRAY is an empty ledger too — a zero-entry success is
  // never fabricated (defect found and paid down during 12D-282
  // authoring: the first view accepted lines:[] as a zero-entry view).
  const emptyArray = new MemoryLedgerStore();
  emptyArray.save([]);
  assert.throws(() => summarizeReadingProvenance(emptyArray, LEDGER_GENESIS), /no pathway ledger found/);
});

test('12d-281: a malformed carried reading-source ref refuses (carried, then checked)', () => {
  const store = new MemoryLedgerStore();
  const bad = plainCandidate('pathway-bad-src');
  (bad.evidenceRefs as string[]).push('reading-source:'); // empty source id
  appendPathwayCandidate(store, LEDGER_GENESIS, bad);
  assert.throws(() => summarizeReadingProvenance(store, LEDGER_GENESIS), /malformed source id/);
});

test('12d-281: a malformed carried digest ref refuses', () => {
  const store = new MemoryLedgerStore();
  const bad = plainCandidate('pathway-bad-digest');
  (bad.evidenceRefs as string[]).push('reading-document-sha256:zz-not-hex');
  appendPathwayCandidate(store, LEDGER_GENESIS, bad);
  assert.throws(() => summarizeReadingProvenance(store, LEDGER_GENESIS), /malformed digest/);
});

test('12d-281: the view is bounded — an over-budget ledger refuses, never truncates', () => {
  const store = new MemoryLedgerStore();
  for (let i = 1; i <= READING_PROVENANCE_VIEW_POLICY.maxEntriesInView + 1; i += 1) {
    appendPathwayCandidate(store, LEDGER_GENESIS, plainCandidate(`pathway-bulk-${i}`));
  }
  assert.throws(() => summarizeReadingProvenance(store, LEDGER_GENESIS), /open a narrower view/);
});

test('12d-281: the view never saves — the ledger store is only ever loaded', () => {
  const store = new SaveSpyLedgerStore();
  ledgerOneReadingEntry(store);
  const savesBefore = store.saves;
  const view = summarizeReadingProvenance(store, LEDGER_GENESIS);
  assert.equal(view.ledgerEntries, 1);
  assert.equal(store.saves, savesBefore, 'the view performed no writes');
});

test('12d-281: malformed store or genesis refuse before anything is read', () => {
  const store = new MemoryLedgerStore();
  assert.throws(() => summarizeReadingProvenance(null, LEDGER_GENESIS), /the view never opens a database/);
  assert.throws(() => summarizeReadingProvenance(store, 'short'), /at least 8 chars/);
  assert.throws(() => summarizeReadingProvenance({ save: () => undefined }, LEDGER_GENESIS), /trusted pathway ledger store/);
});

test('12d-281: determinism and pinned policy/guardrails', () => {
  const store = new MemoryLedgerStore();
  ledgerOneReadingEntry(store);
  assert.equal(
    JSON.stringify(summarizeReadingProvenance(store, LEDGER_GENESIS)),
    JSON.stringify(summarizeReadingProvenance(store, LEDGER_GENESIS)),
  );
  assert.equal(READING_PROVENANCE_VIEW_POLICY.policyVersion, '12d-281-v1');
  assert.equal(READING_PROVENANCE_VIEW_GUARDRAILS.viewOnly, true);
  assert.equal(READING_PROVENANCE_VIEW_GUARDRAILS.storeLoadOnlyNeverSaved, true);
  assert.equal(READING_PROVENANCE_VIEW_GUARDRAILS.realLedgerReplayOnly, true);
  assert.equal(READING_PROVENANCE_VIEW_GUARDRAILS.shellDatabaseFree, true);
  assert.equal(READING_PROVENANCE_VIEW_GUARDRAILS.modelCalls, 0);
  assert.equal(READING_PROVENANCE_VIEW_GUARDRAILS.remoteCalls, 0);
  assert.equal(READING_PROVENANCE_VIEW_GUARDRAILS.learningPromoted, false);
  assert.equal(READING_PROVENANCE_VIEW_GUARDRAILS.activated, 0);
  assert.equal(READING_PROVENANCE_VIEW_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(READING_PROVENANCE_VIEW_GUARDRAILS.automaticRecovery, false);
  assert.equal(READING_PROVENANCE_VIEW_GUARDRAILS.billionUsersProven, false);
});

function HexOk(v: string): boolean { return /^[0-9a-f]{64}$/.test(v); }