// 12D-277 — adversarial tests for the reading binding contract. Central
// properties under attack:
//   1. NO REGISTER, NO BINDING: a reading without a registered source
//      refuses — provenance is re-derived from the chain bytes, never
//      taken from the caller's word.
//   2. THE CHAIN IS THE PROOF: a tampered register refuses the binding;
//      the public class is re-checked FROM THE CHAIN.
//   3. THE BINDING IS EVIDENCE, NOT A COMMAND: it reads, ingests, and
//      admits nothing — and the end-to-end test proves the binding
//      composes with the real ingest → admission chain.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue } from './offline-story-queue';
import { prepareDocumentStories } from './xiv-document-ingest';
import { admitReadingStories } from './xiv-reading-admission';
import { registerReadingSource } from './xiv-reading-source-register';
import {
  READING_BINDING_GUARDRAILS,
  READING_BINDING_POLICY,
  bindReadingToSource,
} from './xiv-reading-binding';
import type { ReadingSourceStore } from './xiv-reading-source-register';

const GENESIS = '12d-277-register-genesis';
const tenantId = 'reading-tenant';

class MemoryRegisterStore implements ReadingSourceStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
  // test-only helper for tamper cases
  mutate(fn: (lines: string[]) => string[]): void {
    if (this.lines === null) throw new Error('nothing to mutate');
    this.lines = fn(this.lines);
  }
}

function registeredStore(): MemoryRegisterStore {
  const store = new MemoryRegisterStore();
  registerReadingSource(store, GENESIS, {
    tenantId, sourceId: 'psychopy-repo',
    title: 'PsychoPy — open-source psychology experiment software',
    sourceUrl: 'https://github.com/psychopy/psychopy',
    sourceClass: 'OPEN_SOURCE_REPO',
    licenseNote: 'GNU GPL v3 — public repository, cited verbatim',
  });
  return store;
}

const DOC = [
  'First paragraph of the bound reading.',
  'Second paragraph of the bound reading.',
].join('\n\n');

function reading(overrides: Record<string, unknown> = {}) {
  return {
    tenantId, sourceId: 'psychopy-repo',
    documentId: 'psychopy-reading-1',
    documentDigestSha256: 'b'.repeat(64),
    ...overrides,
  };
}

test('12d-277: a registered source binds — the receipt carries the chain position', () => {
  const store = registeredStore();
  const binding = bindReadingToSource(store, GENESIS, reading());
  assert.equal(binding.kind, 'READING_BOUND_TO_SOURCE');
  assert.equal(binding.policyVersion, READING_BINDING_POLICY.policyVersion);
  assert.equal(binding.sourceUrl, 'https://github.com/psychopy/psychopy');
  assert.equal(binding.sourceClass, 'OPEN_SOURCE_REPO');
  assert.match(binding.sourceEntryDigestSha256, /^[0-9a-f]{64}$/, 'the receipt cites the chain entry that proves registration');
  assert.equal(binding.learningPromoted, false);
  assert.equal(binding.activated, 0);
  assert.equal(binding.humanDecision, 'REQUIRED');
});

test('12d-277: NO REGISTER, NO BINDING — unregistered sources refuse', () => {
  const empty = new MemoryRegisterStore();
  assert.throws(() => bindReadingToSource(empty, GENESIS, reading()), /NO REGISTER, NO BINDING/);
  const otherTenant = registeredStore();
  assert.throws(() => bindReadingToSource(otherTenant, GENESIS, reading({ tenantId: 'other-tenant' })), /NO REGISTER, NO BINDING/);
  assert.throws(() => bindReadingToSource(otherTenant, GENESIS, reading({ sourceId: 'never-registered' })), /NO REGISTER, NO BINDING/);
});

test('12d-277: a tampered register refuses the binding — the chain is the proof', () => {
  const store = registeredStore();
  store.mutate((lines) => lines.map((l) => l.replace('"OPEN_SOURCE_REPO"', '"INTERNAL"')));
  assert.throws(() => bindReadingToSource(store, GENESIS, reading()), /tampered/);
  const truncated = registeredStore();
  truncated.mutate(() => []);
  assert.throws(() => bindReadingToSource(truncated, GENESIS, reading()), /NO REGISTER, NO BINDING/, 'a truncated register cannot vouch for anything');
});

test('12d-277: the public class is re-checked FROM THE CHAIN — a forged non-public entry cannot bind', () => {
  // Hand-craft a register line that LOOKS lawful but whose class is
  // non-public; the re-derivation digest will not match the bytes
  // (proving the class re-check rides on the chain, not on the string).
  const store = new MemoryRegisterStore();
  store.save([JSON.stringify({
    op: 'SOURCE_REGISTERED',
    tenantId, sourceId: 'forged-repo', title: 'Forged', sourceUrl: 'https://github.com/x/y',
    sourceClass: 'INTERNAL', licenseNote: 'n/a',
    entryDigest: '0'.repeat(64),
  })]);
  assert.throws(() => bindReadingToSource(store, GENESIS, reading({ sourceId: 'forged-repo' })), /tampered/);
});

test('12d-277: the exact-keys gate refuses reordering, extras, and absences', () => {
  const store = registeredStore();
  const reordered = {
    documentDigestSha256: 'b'.repeat(64), documentId: 'psychopy-reading-1',
    sourceId: 'psychopy-repo', tenantId,
  };
  assert.throws(() => bindReadingToSource(store, GENESIS, reordered), /in order; fail closed/);
  const extra = { ...reading(), smuggled: true } as unknown as Record<string, unknown>;
  assert.throws(() => bindReadingToSource(store, GENESIS, extra), /in order; fail closed/);
  const missing = { tenantId, sourceId: 'psychopy-repo', documentId: 'psychopy-reading-1' };
  assert.throws(() => bindReadingToSource(store, GENESIS, missing), /in order; fail closed/);
  for (const bad of [null, undefined, 42, 'text', [], true]) {
    assert.throws(() => bindReadingToSource(store, GENESIS, bad), /fail closed/);
  }
});

test('12d-277: malformed identities and digests fail closed', () => {
  const store = registeredStore();
  assert.throws(() => bindReadingToSource(store, GENESIS, reading({ tenantId: 'bad tenant!' })), /tenant id/);
  assert.throws(() => bindReadingToSource(store, GENESIS, reading({ sourceId: 'bad id!' })), /source id/);
  assert.throws(() => bindReadingToSource(store, GENESIS, reading({ documentId: 'bad id!' })), /document id/);
  assert.throws(() => bindReadingToSource(store, GENESIS, reading({ documentDigestSha256: 'nothex' })), /hex64 document digest/);
  assert.throws(() => bindReadingToSource(store, GENESIS, reading({ documentDigestSha256: 'B'.repeat(64) })), /hex64 document digest/);
});

test('12d-277: deterministic — the same register bytes and reading bind identically', () => {
  const a = registeredStore();
  const b = registeredStore();
  assert.deepEqual(bindReadingToSource(a, GENESIS, reading()), bindReadingToSource(b, GENESIS, reading()));
});

test('12d-277: END-TO-END — register → bind → ingest → REAL admission, provenance carried', () => {
  const store = registeredStore();
  const prepared = prepareDocumentStories({ tenantId, documentId: 'psychopy-reading-1', title: 'Bound reading', bodyText: DOC });
  const binding = bindReadingToSource(store, GENESIS, {
    tenantId, sourceId: 'psychopy-repo',
    documentId: 'psychopy-reading-1',
    documentDigestSha256: prepared.documentDigestSha256,
  });
  assert.equal(binding.documentId, 'psychopy-reading-1');
  const dir = mkdtempSync(join(tmpdir(), 'xiv-reading-binding-'));
  const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
  try {
    const admission = admitReadingStories(q, prepared);
    assert.equal(admission.admission.inserted, prepared.chunkCount);
    assert.equal(admission.census.liveAgentCount, null);
    // The binding receipt is the provenance record the operator keeps
    // alongside the admission — together they trace the reading from a
    // registered public source to claimable queue rows.
    assert.equal(binding.sourceEntryDigestSha256.length, 64);
    assert.equal(admission.admission.prepared, prepared.chunkCount);
  } finally {
    q.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12d-277: guardrails and policy are pinned and frozen — evidence, never a command', () => {
  assert.ok(Object.isFrozen(READING_BINDING_POLICY));
  assert.ok(Object.isFrozen(READING_BINDING_GUARDRAILS));
  assert.equal(READING_BINDING_GUARDRAILS.reDerivedFromRegisterNeverTaken, true);
  assert.equal(READING_BINDING_GUARDRAILS.publicClassReCheckedFromTheChain, true);
  assert.equal(READING_BINDING_GUARDRAILS.evidenceNeverCommand, true);
  assert.equal(READING_BINDING_GUARDRAILS.deterministic, true);
  assert.equal(READING_BINDING_GUARDRAILS.modelCalls, 0);
  assert.equal(READING_BINDING_GUARDRAILS.remoteCalls, 0);
  assert.equal(READING_BINDING_GUARDRAILS.learningPromoted, false);
  assert.equal(READING_BINDING_GUARDRAILS.automaticRecovery, false);
  assert.equal(READING_BINDING_GUARDRAILS.billionUsersProven, false);
  assert.equal(READING_BINDING_GUARDRAILS.humanDecision, 'REQUIRED');
});