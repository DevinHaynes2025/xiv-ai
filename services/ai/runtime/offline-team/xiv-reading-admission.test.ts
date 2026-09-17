// 12D-275 — adversarial tests for the reading admission door. Central
// properties under attack:
//   1. THE DOOR IS REAL: prepared reading stories admit into an actual
//      12D-1xx queue, the census measures what the queue itself
//      reports, and a claimable READY row exists after admission.
//   2. RE-VERIFIED, NEVER TRUSTED: tampered prepared results refuse
//     BEFORE any write — digest/story cross-binding, chunk sequence,
//     policy versions, the approved plan hash, and the ORDINARY shape.
//   3. THE QUEUE'S OWN CONTRACT does the work: batch bounds and dedup
//      are the queue's; the door never re-implements them.
//   4. The honest boundary: supervised admission only — no claim, no
//      settle, no review, no activation; measured counts only.
//   5. 12D-295 ADOPTION: provenance is REQUIRED — an unregistered or
//      unbound reading physically cannot pass (NO REGISTER, NO
//      BINDING, NO ADMISSION), and the binding receipt travels with
//      the measured admission.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue } from './offline-story-queue';
import { APPROVED_MASTER_PLAN_SHA256 } from './approved-master-plan-meeting';
import { prepareDocumentStories } from './xiv-document-ingest';
import {
  registerReadingSource, type ReadingSourceStore,
} from './xiv-reading-source-register';
import {
  READING_ADMISSION_GUARDRAILS,
  READING_ADMISSION_POLICY,
  admitReadingStories,
} from './xiv-reading-admission';

const tenantId = 'admission-tenant';
const OPERATOR_TENANT = tenantId;
const GENESIS = '12d-275-register-genesis';
const SOURCE_ID = 'psychopy-repo';

const pad = (seed: string): string => `${seed}${'.'.repeat(1200 - seed.length)}`;
const DOC = [
  pad('Admission test paragraph one.'),
  pad('Admission test paragraph two.'),
  pad('Admission test paragraph three.'),
].join('\n\n');

function prepareFresh(documentId: string) {
  return prepareDocumentStories({ tenantId, documentId, title: 'The Admission Handbook', bodyText: DOC });
}

class MemoryRegisterStore implements ReadingSourceStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
}

/** A register store with the reading's source genuinely registered. */
function registeredStore(): MemoryRegisterStore {
  const store = new MemoryRegisterStore();
  registerReadingSource(store, GENESIS, {
    tenantId, sourceId: SOURCE_ID,
    title: 'PsychoPy — open-source psychology experiment platform',
    sourceUrl: 'https://github.com/psychopy/psychopy',
    sourceClass: 'OPEN_SOURCE_REPO',
    licenseNote: 'GPL-3.0 — public repository, cited verbatim',
  });
  return store;
}

/** The REQUIRED provenance for the adopted door (a fresh store each time). */
function prov(sourceId: string = SOURCE_ID): { registerStore: ReadingSourceStore; registerGenesis: string; sourceId: string } {
  return { registerStore: registeredStore(), registerGenesis: GENESIS, sourceId };
}

function openQueue(dir: string, name: string): { q: OfflineStoryQueue; path: string } {
  const path = join(mkdtempSync(join(tmpdir(), dir)), name);
  return { q: new OfflineStoryQueue(path), path };
}

function closeIn(q: OfflineStoryQueue, path: string, fn: () => void): void {
  try { fn(); } finally {
    q.close();
    rmSync(join(path, '..'), { recursive: true, force: true });
  }
}

test('12d-275: supervised admission into a REAL queue, measured, and claimable — with the binding carried', () => {
  const prepared = prepareFresh('admit-1');
  const { q, path } = openQueue('xiv-reading-admit-', 'q.sqlite');
  closeIn(q, path, () => {
    const result = admitReadingStories(q, prepared, prov());
    assert.equal(result.kind, 'READING_STORIES_ADMITTED');
    assert.equal(result.policyVersion, READING_ADMISSION_POLICY.policyVersion);
    assert.equal(result.admission.prepared, prepared.chunkCount);
    assert.equal(result.admission.inserted, prepared.chunkCount);
    assert.equal(result.admission.duplicates, 0);
    // The binding receipt travels with the admission — provenance carried.
    assert.equal(result.binding.kind, 'READING_BOUND_TO_SOURCE');
    assert.equal(result.binding.sourceId, SOURCE_ID);
    assert.equal(result.binding.documentId, prepared.documentId);
    assert.equal(result.binding.documentDigestSha256, prepared.documentDigestSha256);
    // The census is the QUEUE'S OWN summary, re-derived after admission.
    assert.equal(result.census.leaseHeld, false);
    assert.equal(result.census.liveAgentCount, null);
    assert.equal(result.census.capacityRowsAreUserStories, false);
    assert.equal(result.census.hostWideCoordinationVerified, false);
    const readyRow = result.census.counts.find((c) => (c as { state?: string }).state === 'READY') as { count: number } | undefined;
    assert.ok(readyRow && readyRow.count === prepared.chunkCount, 'the census measures READY reading rows');
    // The door admits; it never works the queue — but the rows it wrote
    // ARE claimable through the queue's own discipline.
    const lease = q.claimNext(OPERATOR_TENANT, 'memory_curator', 'worker-1', 120000);
    assert.ok(lease, 'an admitted reading story is claimable through the REAL queue');
    assert.equal(result.learningPromoted, false);
    assert.equal(result.activated, 0);
    assert.equal(result.humanDecision, 'REQUIRED');
  });
});

test('12d-275: supervised RE-admission of the same document is idempotent by the queue dedup', () => {
  const prepared = prepareFresh('admit-2');
  const { q, path } = openQueue('xiv-reading-admit2-', 'q.sqlite');
  closeIn(q, path, () => {
    const first = admitReadingStories(q, prepared, prov());
    assert.equal(first.admission.inserted, prepared.chunkCount);
    const second = admitReadingStories(q, prepared, prov());
    assert.equal(second.admission.inserted, 0);
    assert.equal(second.admission.duplicates, prepared.chunkCount);
    assert.equal(second.admission.prepared, prepared.chunkCount);
  });
});

test('12d-295 ADOPTION: a provenance-less invocation refuses — the unbound door is GONE', () => {
  const prepared = prepareFresh('admit-prov-0');
  const { q, path } = openQueue('xiv-reading-admitp0-', 'q.sqlite');
  closeIn(q, path, () => {
    // @ts-expect-error — the old two-argument invocation must not typecheck
    assert.throws(() => admitReadingStories(q, prepared), /NO REGISTER, NO BINDING, NO ADMISSION/);
    assert.equal(q.summary(tenantId).counts.length, 0, 'nothing was written');
  });
});

test('12d-295 ADOPTION: an UNREGISTERED source refuses — NO REGISTER, NO BINDING, NO ADMISSION', () => {
  const prepared = prepareFresh('admit-prov-1');
  const { q, path } = openQueue('xiv-reading-admitp1-', 'q.sqlite');
  closeIn(q, path, () => {
    assert.throws(() => admitReadingStories(q, prepared, prov('unregistered-source')), /NO REGISTER, NO BINDING/);
    assert.equal(q.summary(tenantId).counts.length, 0, 'nothing was written');
    // malformed provenance shapes refuse by name
    assert.throws(() => admitReadingStories(q, prepared, null), /NO REGISTER, NO BINDING, NO ADMISSION/);
    assert.throws(() => admitReadingStories(q, prepared, { registerGenesis: GENESIS, sourceId: SOURCE_ID }), /in order/);
    assert.throws(() => admitReadingStories(q, prepared, { registerStore: registeredStore(), registerGenesis: 'short', sourceId: SOURCE_ID }), /at least 8 chars/);
  });
});

test('12d-275: a tampered digest (stories from another document) refuses — cross-binding', () => {
  const prepared = prepareFresh('admit-3');
  const tampered = {
    ...prepared,
    documentDigestSha256: 'a'.repeat(64),
  } as unknown as Record<string, unknown>;
  const { q, path } = openQueue('xiv-reading-admit3-', 'q.sqlite');
  closeIn(q, path, () => {
    // The structural cross-binding fires first (the stories still carry
    // the original sourceRevision); the binding gate would refuse next
    // — fail closed either way, nothing written.
    assert.throws(() => admitReadingStories(q, tampered, prov()), /sourceRevision mismatch/);
    // Nothing was written: the queue still measures zero rows.
    const census = q.summary(tenantId);
    assert.equal(census.counts.length, 0);
  });
});

test('12d-275: a tampered chunk id (foreign sequence) refuses', () => {
  const prepared = prepareFresh('admit-4');
  const stories = [...prepared.stories];
  stories[0] = { ...stories[0]!, id: 'doc-admit-4-chunk-99' } as (typeof stories)[0];
  const tampered = { ...prepared, stories } as unknown as Record<string, unknown>;
  const { q, path } = openQueue('xiv-reading-admit4-', 'q.sqlite');
  closeIn(q, path, () => {
    assert.throws(() => admitReadingStories(q, tampered, prov()), /foreign or reordered chunk id/);
  });
});

test('12d-275: policy-version drift refuses', () => {
  const prepared = prepareFresh('admit-5');
  const tampered = { ...prepared, policyVersion: '12d-999-v9' } as unknown as Record<string, unknown>;
  const { q, path } = openQueue('xiv-reading-admit5-', 'q.sqlite');
  closeIn(q, path, () => {
    assert.throws(() => admitReadingStories(q, tampered, prov()), /12d-274 ingest material/);
  });
});

test('12d-275: chunkCount/stories-count mismatch refuses', () => {
  const prepared = prepareFresh('admit-6');
  const tampered = { ...prepared, chunkCount: prepared.chunkCount + 1 } as unknown as Record<string, unknown>;
  const { q, path } = openQueue('xiv-reading-admit6-', 'q.sqlite');
  closeIn(q, path, () => {
    assert.throws(() => admitReadingStories(q, tampered, prov()), /must equal the prepared stories count/);
  });
});

test('12d-275: an approved-plan drift refuses', () => {
  const prepared = prepareFresh('admit-7');
  const stories = [...prepared.stories];
  stories[1] = { ...stories[1]!, masterPlanSha256: '0'.repeat(64) } as (typeof stories)[0];
  const tampered = { ...prepared, stories } as unknown as Record<string, unknown>;
  const { q, path } = openQueue('xiv-reading-admit7-', 'q.sqlite');
  closeIn(q, path, () => {
    assert.throws(() => admitReadingStories(q, tampered, prov()), /approved master plan hash/);
    assert.equal(APPROVED_MASTER_PLAN_SHA256.length, 64);
  });
});

test('12d-275: a role/class drift refuses', () => {
  const prepared = prepareFresh('admit-8');
  const stories = [...prepared.stories];
  stories[2] = { ...stories[2]!, roleId: 'release_verifier' } as (typeof stories)[0];
  const tampered = { ...prepared, stories } as unknown as Record<string, unknown>;
  const { q, path } = openQueue('xiv-reading-admit8-', 'q.sqlite');
  closeIn(q, path, () => {
    assert.throws(() => admitReadingStories(q, tampered, prov()), /ORDINARY memory_curator/);
  });
});

test('12d-275: an over-batch prepared result refuses BEFORE the queue is touched', () => {
  // Build a prepared-SHAPED result with more stories than the queue's own
  // batch bound — the door refuses without calling enqueue at all.
  const storyTemplate = prepareFresh('admit-9').stories[0]!;
  const stories = Array.from({ length: READING_ADMISSION_POLICY.maxBatchStories + 1 }, (_, i) => ({
    ...storyTemplate,
    id: `doc-admit-9-chunk-${i + 1}`,
  }));
  const oversized = {
    policyVersion: '12d-274-v1',
    documentId: 'admit-9',
    tenantId,
    documentDigestSha256: storyTemplate.sourceRevision.padEnd(64, '0').slice(0, 64),
    chunkCount: stories.length,
    stories,
  };
  const { q, path } = openQueue('xiv-reading-admit9-', 'q.sqlite');
  closeIn(q, path, () => {
    assert.throws(() => admitReadingStories(q, oversized, prov()), /batch bound/);
    assert.equal(q.summary(tenantId).counts.length, 0, 'the queue was never touched');
  });
});

test('12d-275: a foreign queue object refuses — the door never opens a database', () => {
  const prepared = prepareFresh('admit-10');
  const fake = { enqueue: () => ({ inserted: 3, duplicates: 0 }), summary: () => ({ counts: [], leaseHeld: false, leaseExpired: false, liveAgentCount: null, capacityRowsAreUserStories: false, hostWideCoordinationVerified: false }) };
  assert.throws(() => admitReadingStories(fake, prepared, prov()), /trusted OfflineStoryQueue instance/);
  assert.throws(() => admitReadingStories(null, prepared, prov()), /trusted OfflineStoryQueue instance/);
});

test('12d-275: the exact-keys gate refuses reordering, extras, and absences', () => {
  const prepared = prepareFresh('admit-11');
  const { q, path } = openQueue('xiv-reading-admit11-', 'q.sqlite');
  closeIn(q, path, () => {
    const reordered = {
      stories: prepared.stories, documentId: prepared.documentId, policyVersion: prepared.policyVersion,
      tenantId: prepared.tenantId, documentDigestSha256: prepared.documentDigestSha256, chunkCount: prepared.chunkCount,
    };
    assert.throws(() => admitReadingStories(q, reordered, prov()), /in order; fail closed/);
    const extra = { ...prepared, smuggled: true } as unknown as Record<string, unknown>;
    assert.throws(() => admitReadingStories(q, extra, prov()), /in order; fail closed/);
    const { chunkCount, ...missing } = prepared as unknown as Record<string, unknown>;
    assert.throws(() => admitReadingStories(q, missing, prov()), /in order; fail closed/);
    for (const bad of [null, undefined, 42, 'text', [], true]) {
      assert.throws(() => admitReadingStories(q, bad, prov()), /fail closed/);
    }
    // story-level exact keys: a story whose keys are genuinely reordered
    // (id moved to the END) refuses
    const s = prepared.stories[0] as unknown as Record<string, unknown>;
    const reorderedStoryObject: Record<string, unknown> = {
      tenantId: s.tenantId, roleId: s.roleId, objective: s.objective,
      acceptance: s.acceptance, dependencies: s.dependencies,
      sourceRevision: s.sourceRevision, masterPlanSha256: s.masterPlanSha256,
      securityClass: s.securityClass, kind: s.kind, id: s.id,
    };
    const reorderedStory = [...prepared.stories];
    reorderedStory[0] = reorderedStoryObject as never;
    assert.throws(() => admitReadingStories(q, { ...prepared, stories: reorderedStory }, prov()), /in order; fail closed/);
  });
});

test('12d-275: guardrails and policy are pinned and frozen — supervised, never automatic, bound-only', () => {
  assert.ok(Object.isFrozen(READING_ADMISSION_POLICY));
  assert.ok(Object.isFrozen(READING_ADMISSION_GUARDRAILS));
  assert.equal(READING_ADMISSION_POLICY.maxBatchStories, 1000, 'the batch bound is the queue policy ceiling');
  assert.equal(READING_ADMISSION_POLICY.adoptedBoundAdmission, '12d-278-v1', 'the 12D-295 adoption is pinned');
  assert.equal(READING_ADMISSION_GUARDRAILS.supervisedOperatorDoor, true);
  assert.equal(READING_ADMISSION_GUARDRAILS.reVerifiesPreparedNeverTrusted, true);
  assert.equal(READING_ADMISSION_GUARDRAILS.boundAdmissionOnlyDoor, true, 'the 12D-295 adoption guardrail is pinned');
  assert.equal(READING_ADMISSION_GUARDRAILS.realQueueContractOnly, true);
  assert.equal(READING_ADMISSION_GUARDRAILS.measuredCountsOnly, true);
  assert.equal(READING_ADMISSION_GUARDRAILS.noClaimNoSettleNoReview, true);
  assert.equal(READING_ADMISSION_GUARDRAILS.noActivationPath, true);
  assert.equal(READING_ADMISSION_GUARDRAILS.learningPromotionStaysCEOgated, true);
  assert.equal(READING_ADMISSION_GUARDRAILS.shellDatabaseFree, true);
  assert.equal(READING_ADMISSION_GUARDRAILS.modelCalls, 0);
  assert.equal(READING_ADMISSION_GUARDRAILS.remoteCalls, 0);
  assert.equal(READING_ADMISSION_GUARDRAILS.learningPromoted, false);
  assert.equal(READING_ADMISSION_GUARDRAILS.automaticRecovery, false);
  assert.equal(READING_ADMISSION_GUARDRAILS.billionUsersProven, false);
  assert.equal(READING_ADMISSION_GUARDRAILS.humanDecision, 'REQUIRED');
});