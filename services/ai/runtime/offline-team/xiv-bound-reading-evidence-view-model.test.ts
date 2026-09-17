// 12D-304 — adversarial tests for the bound-reading pathway-evidence view
// model. Central properties under attack:
//   1. THE PACKET IS RE-VERIFIED, NEVER TRUSTED: exact-key gate (14 keys,
//      in order), policy pin, honest flags, binding receipt re-gated —
//      and ELIGIBILITY IS RE-DERIVED with the REAL growth-engine
//      evaluator; a tampered eligibility refuses the render.
//   2. A PACKET IS A CANDIDATE, NEVER AN APPROVAL: humanApproved true in
//      the candidate refuses — approval is the separate CEO-gated door.
//   3. NOTHING ACTIVATES THROUGH THE VIEW: flag tampering of every
//      honest flag refuses; the render says "ledgered NEVER activated".
//   4. FAIL CLOSED, HONESTLY: junk inputs render REFUSED — never throw,
//      never leak packet content, never claim success.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue } from './offline-story-queue';
import { prepareDocumentStories } from './xiv-document-ingest';
import { registerReadingSource, type ReadingSourceStore } from './xiv-reading-source-register';
import { admitBoundReading } from './xiv-bound-admission';
import { prepareBoundReadingPathwayEvidence } from './xiv-bound-reading-evidence';
import {
  BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS,
  BOUND_READING_EVIDENCE_VIEW_MODEL_POLICY,
  buildBoundReadingEvidenceViewModel,
} from './xiv-bound-reading-evidence-view-model';

const GENESIS = '12d-304-register-genesis';
const tenantId = 'reading-tenant';
const OUTPUT = 'e'.repeat(64);

class MemoryRegisterStore implements ReadingSourceStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
}

const pad = (seed: string): string => seed + '.'.repeat(Math.max(0, 1200 - seed.length));
const DOC = [
  pad('First paragraph of the evidence view-model fixture.'),
  pad('Second paragraph of the evidence view-model fixture.'),
  pad('Third paragraph of the evidence view-model fixture.'),
].join('\n\n');

/** The REAL chain: register → prepare → admit → claim → settle → review
 *  → the REAL 12D-279 evidence door. The test attacks the VIEW MODEL
 *  over a packet the real doors produced — never a fabricated one. */
function realPacket(): Record<string, unknown> {
  const store = new MemoryRegisterStore();
  registerReadingSource(store, GENESIS, {
    tenantId, sourceId: 'quantumlib-cirq',
    title: 'Cirq — open-source quantum circuit framework',
    sourceUrl: 'https://github.com/quantumlib/Cirq',
    sourceClass: 'OPEN_SOURCE_REPO',
    licenseNote: 'Apache 2.0 — public repository, cited verbatim',
  });
  const prepared = prepareDocumentStories({ tenantId, documentId: 'cirq-reading-1', title: 'Cirq reading', bodyText: DOC });
  const dir = mkdtempSync(join(tmpdir(), 'xiv-evidence-view-'));
  const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
  try {
    const bound = admitBoundReading(q, store, GENESIS, prepared, {
      tenantId, sourceId: 'quantumlib-cirq',
      documentId: 'cirq-reading-1',
      documentDigestSha256: prepared.documentDigestSha256,
    });
    const lease = q.claimNext(tenantId, 'memory_curator', 'worker-1', 120000);
    assert.ok(lease);
    q.settle(lease!, { outcome: 'DRAFT', outputHash: OUTPUT, providerSettled: true });
    q.applyReviewDecision({ tenantId, storyId: prepared.stories[0]!.id, reviewerId: 'secure_code_reviewer', expectedOutputHash: OUTPUT, decision: 'APPROVED', reviewRef: 'review:reading-1' });
    const packet = prepareBoundReadingPathwayEvidence(q, bound, {
      tenantId, storyId: prepared.stories[0]!.id, pathwayId: 'pathway-reading',
      domain: 'GENERAL' as const, version: 1, confidence: 0.5, evaluationScore: 0.5,
      evidenceRefs: ['run:reading-1'], reviewRefs: ['review:one'],
      expectedOutputHash: OUTPUT, rollbackRef: 'rollback:reading-304',
    });
    return JSON.parse(JSON.stringify(packet)) as Record<string, unknown>;
  } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
}

/** Clone with a top-level mutation, preserving key order via delete+set
 *  is unnecessary — spread preserves insertion order for existing keys. */
function tampered(packet: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(packet)) as Record<string, unknown>;
  const [head, ...rest] = path.split('.');
  if (rest.length === 0) clone[head] = value;
  else (clone[head] as Record<string, unknown>)[rest.join('.')] = value;
  return clone;
}

test('12d-304: a REAL door-produced packet renders verified with honest eligibility and provenance', () => {
  const packet = realPacket();
  const vm = buildBoundReadingEvidenceViewModel(packet);
  assert.ok(vm.kind === 'VERIFIED_BOUND_READING_EVIDENCE', `expected verified, got ${vm.kind}: ${vm.kind === 'REFUSED' ? vm.reason : ''}`);
  assert.equal(vm.policyVersion, BOUND_READING_EVIDENCE_VIEW_MODEL_POLICY.policyVersion);
  assert.ok(vm.display.headline.includes(vm.display.storyId));
  assert.ok(vm.display.headline.includes('NEVER activated'));
  assert.equal(vm.display.eligible, false, 'a prepared candidate is honestly NOT eligible (human approval unmet)');
  assert.ok(vm.display.eligibilityReasons.length > 0, 'the unmet gates render as reasons');
  assert.ok(vm.display.evidenceRefs.includes('reading-source:quantumlib-cirq'));
  assert.ok(vm.display.evidenceRefs.some((r) => r.startsWith('reading-register-entry-sha256:')));
  assert.ok(vm.display.evidenceRefs.some((r) => r.startsWith('reading-document-sha256:')));
  assert.ok(vm.display.operatorNote.includes('Ledgered NEVER activated'));
});

test('12d-304: eligibility is RE-DERIVED — tampered currentEligibility refuses both directions', () => {
  const packet = realPacket();
  assert.ok((packet.currentEligibility as { eligible: boolean }).eligible === false);
  // Forged eligible:true must refuse (the real evaluator says false).
  const forgedTrue = tampered(packet, 'currentEligibility.eligible', true);
  assert.equal(buildBoundReadingEvidenceViewModel(forgedTrue).kind, 'REFUSED');
  // A dropped reason must refuse (reason-count mismatch with the re-derivation).
  const droppedReason = tampered(packet, 'currentEligibility.reasons', ['only one reason']);
  assert.equal(buildBoundReadingEvidenceViewModel(droppedReason).kind, 'REFUSED');
  // A reordered reasons list must refuse.
  const reordered = tampered(packet, 'currentEligibility.reasons', [...(packet.currentEligibility as { reasons: string[] }).reasons].reverse());
  assert.equal(buildBoundReadingEvidenceViewModel(reordered).kind, 'REFUSED');
});

test('12d-304: honest-flag tampering refuses — nothing activates through the view', () => {
  const packet = realPacket();
  for (const [path, value] of [
    ['activationAttempted', true], ['learningPromoted', true],
    ['modelWeightMutation', true], ['productionMutation', true],
    ['humanDecision', 'AUTO'],
  ] as const) {
    const vm = buildBoundReadingEvidenceViewModel(tampered(packet, path, value));
    assert.equal(vm.kind, 'REFUSED', `flag tamper ${path}=${String(value)} must refuse`);
  }
});

test('12d-304: a candidate is never an approval — humanApproved true refuses', () => {
  const packet = realPacket();
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'candidate.humanApproved', true)).kind, 'REFUSED');
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'candidate.modelWeightMutation', true)).kind, 'REFUSED');
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'candidate.productionMutation', true)).kind, 'REFUSED');
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'candidate.confidence', 7)).kind, 'REFUSED');
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'candidate.domain', 'QUANTUM')).kind, 'REFUSED');
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'candidate.tenantId', 'other-tenant')).kind, 'REFUSED');
});

test('12d-304: the binding receipt is re-gated — forged/malformed bindings refuse', () => {
  const packet = realPacket();
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'binding.kind', 'FORGED')).kind, 'REFUSED');
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'binding.policyVersion', '12d-999-v1')).kind, 'REFUSED');
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'binding.documentDigestSha256', 'nope')).kind, 'REFUSED');
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'binding.learningPromoted', true)).kind, 'REFUSED');
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'binding.activated', 3)).kind, 'REFUSED');
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'binding.sourceId', 'UPPERCASE-SOURCE')).kind, 'REFUSED');
});

test('12d-304: packet identity and shape — wrong kind/policy, malformed ids, reordered keys refuse', () => {
  const packet = realPacket();
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'kind', 'SOMETHING_ELSE')).kind, 'REFUSED');
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'policyVersion', '12d-999-v1')).kind, 'REFUSED');
  // Format gate: the belongs-to check is the REAL door's job (the view
  // model holds no queue) — a malformed chunk id still refuses here.
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'storyId', 'doc-cirq-reading-1-chunk-x')).kind, 'REFUSED');
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'storyId', 'doc-cirq-reading-1-chunk-0')).kind, 'REFUSED');
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'outputHash', 'nope')).kind, 'REFUSED');
  // Reordered top-level keys refuse (the door's order is part of the contract).
  const entries = Object.entries(packet);
  const reordered = Object.fromEntries([entries[13]!, ...entries.slice(0, 13)]);
  assert.equal(buildBoundReadingEvidenceViewModel(reordered).kind, 'REFUSED');
  // A smuggled extra key refuses.
  assert.equal(buildBoundReadingEvidenceViewModel({ ...packet, smuggled: 1 }).kind, 'REFUSED');
  // admissionCounts tampering refuses.
  assert.equal(buildBoundReadingEvidenceViewModel(tampered(packet, 'admissionCounts.inserted', -1)).kind, 'REFUSED');
});

test('12d-304: a secret-shaped evidence ref never renders', () => {
  const packet = realPacket();
  const secretRefs = tampered(packet, 'candidate.evidenceRefs', ['run:ok', 'leak: ghp_' + 'a'.repeat(34)]);
  const vm = buildBoundReadingEvidenceViewModel(secretRefs);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(!vm.reason.includes('ghp_'), 'the refusal never echoes the secret');
});

test('12d-304: junk inputs render honest REFUSED — never throw, never leak', () => {
  for (const junk of [null, undefined, 42, 'packet', [], true, {}, { kind: 'BOUND_READING_EVIDENCE_PACKET' }]) {
    const vm = buildBoundReadingEvidenceViewModel(junk);
    assert.equal(vm.kind, 'REFUSED');
    if (vm.kind === 'REFUSED') {
      assert.ok(vm.reason.length >= 1 && vm.reason.length <= 500, 'refusal reason bounded 1..500');
      assert.ok(vm.display.headline.includes('refused'));
      assert.ok(vm.display.bodyText.includes('NOT rendered'));
    }
  }
});

test('12d-304: deterministic — the same packet renders byte-identical views', () => {
  const packet = realPacket();
  assert.equal(JSON.stringify(buildBoundReadingEvidenceViewModel(packet)), JSON.stringify(buildBoundReadingEvidenceViewModel(packet)));
});

test('12d-304: guardrails and policy are pinned and frozen — the view never activates', () => {
  assert.ok(Object.isFrozen(BOUND_READING_EVIDENCE_VIEW_MODEL_POLICY));
  assert.ok(Object.isFrozen(BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS));
  assert.equal(BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS.eligibilityReDerivedNeverTrusted, true);
  assert.equal(BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS.humanApprovedMustBeFalse, true);
  assert.equal(BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS.bindingReGated, true);
  assert.equal(BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS.ledgeredNeverActivated, true);
  assert.equal(BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS.refusedRendersAsRefused, true);
  assert.equal(BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS.remoteCalls, 0);
  assert.equal(BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS.activated, 0);
  assert.equal(BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS.collectsNothing, true);
  assert.equal(BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS.automaticRecovery, false);
  assert.equal(BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS.billionUsersProven, false);
  assert.equal(BOUND_READING_EVIDENCE_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
});

test('12d-304: source purity — the view-model module stays pure (no fs, no network, no clock)', () => {
  const src = readFileSync(join(import.meta.dirname.replace(/\\/g, '/'), 'xiv-bound-reading-evidence-view-model.ts'), 'utf8');
  for (const banned of ['node:fs', 'node:path', 'fetch(', 'http://', 'https://', '127.0.0.1', '11434', 'Date.now', 'Math.random', 'child_process', 'XMLHttpRequest', 'WebSocket', 'require(']) {
    assert.ok(!src.includes(banned), `the view model must not contain ${banned}`);
  }
});