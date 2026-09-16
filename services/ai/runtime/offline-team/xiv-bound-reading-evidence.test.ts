// 12D-279 — adversarial tests for provenance-bound pathway evidence.
// Central properties under attack:
//   1. THE STORY MUST BELONG TO THE BOUND DOCUMENT: a candidate about
//      another story, another tenant, or a malformed chunk id refuses
//      BEFORE the bridge is ever called.
//   2. THE REAL BRIDGE DOES THE WORK: DONE-state and output-hash truth
//      come from the queue's own records — a READY story and a declared
//      hash mismatch both refuse.
//   3. PROVENANCE IS CARRIED, NEVER SILENTLY DROPPED: the enriched ref
//      list carries the register-entry digest, source, and document
//      digest — and over the ref budget the WHOLE preparation refuses.
//   4. LEDGERED, NEVER ACTIVATED: the packet only PREPARES a candidate;
//      approval (12D-269) and the 12D-264 ledger stay downstream, and
//      the ledgered census still reports activated: 0.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue } from './offline-story-queue';
import { prepareDocumentStories } from './xiv-document-ingest';
import { registerReadingSource, type ReadingSourceStore } from './xiv-reading-source-register';
import { admitBoundReading } from './xiv-bound-admission';
import {
  BOUND_READING_EVIDENCE_GUARDRAILS,
  BOUND_READING_EVIDENCE_POLICY,
  prepareBoundReadingPathwayEvidence,
} from './xiv-bound-reading-evidence';
import { buildPathwayApprovalPlan, applyRecordedApproval } from './xiv-pathway-approval-link';
import { appendPathwayCandidate, replayPathwayCensus, type PathwayLedgerStore } from './xiv-pathway-ledger';

const GENESIS = '12d-279-register-genesis';
const LEDGER_GENESIS = '12d-279-ledger-genesis';
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

// Padded paragraphs (the 12D-274 fixture lesson): three paragraphs over
// half the 2,200-char chunk budget so the document produces TWO chunks
// — chunk 1 reviewed DONE, chunk 2 left READY for the DONE-gate test.
const pad = (seed: string): string => seed + '.'.repeat(Math.max(0, 1200 - seed.length));
const DOC = [
  pad('First paragraph of the bound reading evidence.'),
  pad('Second paragraph of the bound reading evidence.'),
  pad('Third paragraph of the bound reading evidence.'),
].join('\n\n');

/** The REAL chain: register → prepare → admitBoundReading, then claim →
 *  settle → review so chunk 1 is DONE with a known output hash. */
function setup(): { bound: ReturnType<typeof admitBoundReading>; storyId: string; queuePath: string; dir: string } {
  const store = new MemoryRegisterStore();
  registerReadingSource(store, GENESIS, {
    tenantId, sourceId: 'quantumlib-cirq',
    title: 'Cirq — open-source quantum circuit framework',
    sourceUrl: 'https://github.com/quantumlib/Cirq',
    sourceClass: 'OPEN_SOURCE_REPO',
    licenseNote: 'Apache 2.0 — public repository, cited verbatim',
  });
  const prepared = prepareDocumentStories({ tenantId, documentId: 'cirq-reading-1', title: 'Cirq reading', bodyText: DOC });
  const dir = mkdtempSync(join(tmpdir(), 'xiv-bound-reading-evidence-'));
  const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
  const bound = admitBoundReading(q, store, GENESIS, prepared, {
    tenantId, sourceId: 'quantumlib-cirq',
    documentId: 'cirq-reading-1',
    documentDigestSha256: prepared.documentDigestSha256,
  });
  const lease = q.claimNext(tenantId, 'memory_curator', 'worker-1', 120000);
  assert.ok(lease);
  q.settle(lease!, { outcome: 'DRAFT', outputHash: OUTPUT, providerSettled: true });
  q.applyReviewDecision({ tenantId, storyId: prepared.stories[0]!.id, reviewerId: 'secure_code_reviewer', expectedOutputHash: OUTPUT, decision: 'APPROVED', reviewRef: 'review:reading-1' });
  q.close();
  return { bound, storyId: prepared.stories[0]!.id, queuePath: join(dir, 'q.sqlite'), dir };
}

function requestFor(storyId: string) {
  return {
    tenantId, storyId, pathwayId: 'pathway-reading', domain: 'GENERAL' as const,
    version: 1, confidence: 0.9, evaluationScore: 0.95,
    evidenceRefs: ['run:reading-1'], reviewRefs: ['review:one', 'review:two'],
    expectedOutputHash: OUTPUT,
    rollbackRef: 'rollback:reading-279',
  };
}

function withQueue<T>(dir: string, queuePath: string, fn: (q: OfflineStoryQueue) => T): T {
  const q = new OfflineStoryQueue(queuePath);
  try { return fn(q); } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
}

test('12d-279: a reviewed DONE chunk of a bound reading prepares provenance-carrying evidence', () => {
  const { bound, storyId, queuePath, dir } = setup();
  withQueue(dir, queuePath, (q) => {
    const packet = prepareBoundReadingPathwayEvidence(q, bound, requestFor(storyId));
    assert.equal(packet.kind, 'BOUND_READING_EVIDENCE_PACKET');
    assert.equal(packet.policyVersion, BOUND_READING_EVIDENCE_POLICY.policyVersion);
    assert.equal(packet.outputHash, OUTPUT);
    assert.ok(packet.candidate.evidenceRefs.includes(`reading-register-entry-sha256:${bound.binding.sourceEntryDigestSha256}`), 'register-entry digest carried');
    assert.ok(packet.candidate.evidenceRefs.includes('reading-source:quantumlib-cirq'), 'source carried');
    assert.ok(packet.candidate.evidenceRefs.includes(`reading-document-sha256:${bound.binding.documentDigestSha256}`), 'document digest carried');
    assert.ok(packet.candidate.evidenceRefs.includes(`queue-story:${tenantId}:${storyId}`), 'the queue ref from the real bridge is kept');
    assert.equal(packet.candidate.humanApproved, false, 'nothing is approved here');
    assert.equal(packet.admissionCounts.inserted, 3, 'three padded paragraphs → three chunks');
    assert.equal(packet.activationAttempted, false);
    assert.equal(packet.learningPromoted, false);
    assert.equal(packet.humanDecision, 'REQUIRED');
  });
});

test('12d-279: END-TO-END — bound reading evidence flows to the 12D-264 ledger, provenance intact', () => {
  const { bound, storyId, queuePath, dir } = setup();
  withQueue(dir, queuePath, (q) => {
    const packet = prepareBoundReadingPathwayEvidence(q, bound, requestFor(storyId));
    // The enriched candidate rides the REAL approval link's bridge
    // packet shape — the 12D-269 link re-checks it, never trusts it.
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
    const store = new MemoryLedgerStore();
    appendPathwayCandidate(store, LEDGER_GENESIS, outcome.candidate);
    const census = replayPathwayCensus(store, LEDGER_GENESIS);
    assert.equal(census.entries, 1);
    assert.equal(census.activated, 0, 'reading evidence LEDGERS, never activates');
    // The ledgered candidate carries the provenance refs.
    const last = store.load()![store.load()!.length - 1]!;
    assert.ok(last.includes('reading-register-entry-sha256:'), 'register provenance reaches the ledger bytes');
    assert.ok(last.includes('reading-source:quantumlib-cirq'), 'source provenance reaches the ledger bytes');
  });
});

test('12d-279: the story must belong to the bound document — foreign/malformed story ids refuse', () => {
  const { bound, queuePath, dir } = setup();
  withQueue(dir, queuePath, (q) => {
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, requestFor('doc-other-doc-chunk-1')), /not one of the bound document/);
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, requestFor('doc-cirq-reading-1-chunk-x')), /chunk index is malformed/);
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, requestFor('doc-cirq-reading-1-chunk-0')), /chunk index is malformed/);
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, { ...requestFor('doc-cirq-reading-1-chunk-1'), tenantId: 'other-tenant' }), /does not match the binding tenant/);
  });
});

test('12d-279: only reviewed DONE stories become evidence — the queue’s own state is the truth', () => {
  const { bound, queuePath, dir } = setup();
  // Chunk 2 of the SAME document is still READY (never claimed) — it
  // passes the belongs-to gate but the REAL bridge refuses a READY story.
  withQueue(dir, queuePath, (q) => {
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, { ...requestFor('doc-cirq-reading-1-chunk-2'), expectedOutputHash: OUTPUT }), /only independently reviewed DONE stories/);
    // A declared output hash that is not the queue's stored hash refuses.
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, { ...requestFor('doc-cirq-reading-1-chunk-1'), expectedOutputHash: 'a'.repeat(64) }), /queue output hash mismatch/);
  });
});

test('12d-279: malformed or tampered bound results refuse', () => {
  const { bound, storyId, queuePath, dir } = setup();
  const tamperedBinding = { ...bound, binding: { ...bound.binding, kind: 'FORGED' } } as unknown as typeof bound;
  const reordered = {
    humanDecision: bound.humanDecision, activated: bound.activated, learningPromoted: bound.learningPromoted,
    census: bound.census, admission: bound.admission, binding: bound.binding,
    policyVersion: bound.policyVersion, kind: bound.kind,
  } as unknown as typeof bound;
  withQueue(dir, queuePath, (q) => {
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, null, requestFor(storyId)), /required; fail closed/);
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, 42, requestFor(storyId)), /required; fail closed/);
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, { ...bound, kind: 'SOMETHING_ELSE' }, requestFor(storyId)), /not a BOUND_READING_ADMITTED/);
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, { ...bound, policyVersion: '12d-999-v1' }, requestFor(storyId)), /not 12d-278 material/);
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, tamperedBinding, requestFor(storyId)), /not 12d-277 material/);
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, reordered, requestFor(storyId)), /in order; fail closed/);
    const flagTamper = { ...bound, binding: { ...bound.binding, learningPromoted: true } } as unknown as typeof bound;
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, flagTamper, requestFor(storyId)), /tampered honest flags/);
  });
});

test('12d-279: malformed or reordered requests refuse', () => {
  const { bound, storyId, queuePath, dir } = setup();
  const reordered = {
    expectedOutputHash: OUTPUT, reviewRefs: ['review:one'], evidenceRefs: ['run:r'],
    evaluationScore: 0.95, confidence: 0.9, version: 1, domain: 'GENERAL',
    pathwayId: 'pathway-reading', storyId, tenantId,
  };
  withQueue(dir, queuePath, (q) => {
    for (const bad of [null, undefined, 42, 'text', [], true]) {
      assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, bad), /required; fail closed/);
    }
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, reordered), /in order; fail closed/);
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, { ...requestFor(storyId), smuggled: 1 } as unknown as Record<string, unknown>), /in order; fail closed/);
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, { ...requestFor(storyId), domain: 'QUANTUM' }), /domain must be one of/);
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, { ...requestFor(storyId), expectedOutputHash: 'nope' }), /hex64 expectedOutputHash/);
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, { ...requestFor(storyId), reviewRefs: ['a', 'a'] }), /duplicate review refs/);
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, { ...requestFor(storyId), version: 0 }), /version must be/);
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, { ...requestFor(storyId), rollbackRef: '' }), /bounded rollbackRef is required/);
  });
});

test('12d-279: provenance is never silently dropped — over the ref budget the preparation refuses', () => {
  const { bound, storyId, queuePath, dir } = setup();
  const many = Array.from({ length: 32 }, (_, i) => `evidence:${i}`);
  withQueue(dir, queuePath, (q) => {
    // 32 operator refs + queue refs + 3 provenance refs > 32 → refuse.
    assert.throws(() => prepareBoundReadingPathwayEvidence(q, bound, { ...requestFor(storyId), evidenceRefs: many }), /32-ref budget/);
  });
});

test('12d-279: a foreign queue instance refuses', () => {
  const { bound, storyId } = setup();
  const fake = { inspectStory: () => ({ state: 'DONE', role: 'memory_curator', outputHash: OUTPUT }) };
  assert.throws(() => prepareBoundReadingPathwayEvidence(fake, bound, requestFor(storyId)), /trusted OfflineStoryQueue instance/);
});

test('12d-279: deterministic — two preparations are byte-identical', () => {
  const { bound, storyId, queuePath, dir } = setup();
  withQueue(dir, queuePath, (q) => {
    const a = JSON.stringify(prepareBoundReadingPathwayEvidence(q, bound, requestFor(storyId)));
    const b = JSON.stringify(prepareBoundReadingPathwayEvidence(q, bound, requestFor(storyId)));
    assert.equal(a, b);
  });
});

test('12d-279: guardrails and policy are pinned and frozen — provenance carried, never activated', () => {
  assert.ok(Object.isFrozen(BOUND_READING_EVIDENCE_POLICY));
  assert.ok(Object.isFrozen(BOUND_READING_EVIDENCE_GUARDRAILS));
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.provenanceCarriedIntoEvidence, true);
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.realQueueOutcomeOnly, true);
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.realBridgeContractOnly, true);
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.storyMustBelongToTheBoundDocument, true);
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.provenanceNeverSilentlyDropped, true);
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.preparedNotApprovedNotLedgered, true);
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.noActivationPath, true);
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.learningPromotionStaysCEOgated, true);
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.shellDatabaseFree, true);
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.modelCalls, 0);
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.remoteCalls, 0);
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.learningPromoted, false);
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.automaticRecovery, false);
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.billionUsersProven, false);
  assert.equal(BOUND_READING_EVIDENCE_GUARDRAILS.humanDecision, 'REQUIRED');
});