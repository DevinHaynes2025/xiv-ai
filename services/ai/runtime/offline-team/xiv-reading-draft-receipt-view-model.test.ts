// 12D-286 — adversarial tests for the reading draft receipt view model.
// Every test drives the REAL 12D-285 pure receipt door through the view
// model and asserts the two structural invariants: a verified view never
// echoes the draft text, and a refused view carries ZERO draft content.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  buildReadingDraftReceiptViewModel,
  READING_DRAFT_RECEIPT_VIEW_MODEL_POLICY,
} from './xiv-reading-draft-receipt-view-model';

const TENANT = 'tenant-12d-286-shell';
const STORY = '12d-286-story';
const DOC = '12d-286-doc';
const MODEL = 'qwen2.5-coder:7b';
const DRAFT = [
  'The registered reading source documents an Apache-2.0 licensed repo.',
  'The binding receipt re-derived the document digest from the bytes.',
  'The first reader settled one chunk as AWAITING_REVIEW with its digest.',
  ' ' + 'x'.repeat(1200),
].join('\n');

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function submission(draftSha256: string, draftText: string): Record<string, string> {
  return {
    tenantId: TENANT,
    storyId: STORY,
    documentId: DOC,
    draftSha256,
    draftText,
    model: MODEL,
  };
}

test('12d-286 verified view: the real receipt door runs and the digest renders', () => {
  const vm = buildReadingDraftReceiptViewModel(submission(sha256(DRAFT), DRAFT));
  assert.equal(vm.kind, 'VERIFIED_READING_DRAFT_RECEIPT');
  assert.equal(vm.policyVersion, READING_DRAFT_RECEIPT_VIEW_MODEL_POLICY.policyVersion);
  if (vm.kind !== 'VERIFIED_READING_DRAFT_RECEIPT') return;
  assert.equal(vm.display.receipt.draftSha256, sha256(DRAFT));
  assert.equal(vm.display.receipt.draftChars, DRAFT.length);
  assert.equal(vm.display.receipt.model, MODEL);
  assert.equal(vm.display.receipt.tenantId, TENANT);
  assert.equal(vm.display.receipt.storyId, STORY);
  assert.equal(vm.display.receipt.documentId, DOC);
  assert.equal(vm.display.receipt.humanDecision, 'REQUIRED');
  assert.equal(vm.display.receipt.modelCalls, 0);
  assert.equal(vm.display.receipt.remoteCalls, 0);
});

test('12d-286 verified view: the draft text is NEVER echoed anywhere in the render', () => {
  const vm = buildReadingDraftReceiptViewModel(submission(sha256(DRAFT), DRAFT));
  const rendered = JSON.stringify(vm);
  assert.ok(!rendered.includes(DRAFT));
  for (const fragment of DRAFT.split('\n').filter((f) => f.trim().length > 0))
    assert.ok(!rendered.includes(fragment));
  assert.ok(rendered.includes(sha256(DRAFT))); // the digest DOES render
});

test('12d-286 refused: a claimed digest that does not match the held text refuses', () => {
  const wrong = sha256(DRAFT + ' tampered');
  const vm = buildReadingDraftReceiptViewModel(submission(wrong, DRAFT));
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.match(vm.reason, /not holding the draft they claim/);
  assert.ok(!JSON.stringify(vm).includes(DRAFT));
  assert.ok(!JSON.stringify(vm).includes(wrong)); // even the claimed digest stays back
});

test('12d-286 refused: a credential-shaped draft never becomes review material', () => {
  const secretDraft = '-----BEGIN RSA PRIVATE KEY-----\nMIIBCg==\n-----END RSA PRIVATE KEY-----';
  const vm = buildReadingDraftReceiptViewModel(submission(sha256(secretDraft), secretDraft));
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.match(vm.reason, /credential-shaped content/);
  assert.ok(!JSON.stringify(vm).includes(secretDraft));
});

test('12d-286 refused: an over-budget draft refuses', () => {
  const big = 'y'.repeat(8001); // one over the 12D-280/285 draft budget
  const vm = buildReadingDraftReceiptViewModel(submission(sha256(big), big));
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.match(vm.reason, /exceeds 8000 chars/);
  assert.ok(!JSON.stringify(vm).includes(big));
});

test('12d-286 refused: malformed key shape (wrong order, extra key) refuses', () => {
  const reordered = {
    draftText: DRAFT,
    tenantId: TENANT,
    storyId: STORY,
    documentId: DOC,
    draftSha256: sha256(DRAFT),
    model: MODEL,
  };
  const vmA = buildReadingDraftReceiptViewModel(reordered);
  assert.equal(vmA.kind, 'REFUSED');
  const extra = { ...submission(sha256(DRAFT), DRAFT), extra: 1 };
  const vmB = buildReadingDraftReceiptViewModel(extra);
  assert.equal(vmB.kind, 'REFUSED');
  assert.ok(!JSON.stringify(vmB).includes(DRAFT));
});

test('12d-286 refused: non-object submissions refuse with zero content', () => {
  for (const raw of [null, undefined, 42, 'draft', [], true]) {
    const vm = buildReadingDraftReceiptViewModel(raw);
    assert.equal(vm.kind, 'REFUSED', String(raw));
    if (vm.kind === 'REFUSED') assert.match(vm.reason, /fail closed/);
  }
});

test('12d-286 refused: a non-string draft text refuses without echoing anything', () => {
  const raw = submission(sha256(DRAFT), DRAFT) as unknown as Record<string, unknown>;
  raw.draftText = 12345;
  const vm = buildReadingDraftReceiptViewModel(raw);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.match(vm.reason, /non-empty string/);
});

test('12d-286 determinism: two verified views of the same submission are deep-equal', () => {
  const a = buildReadingDraftReceiptViewModel(submission(sha256(DRAFT), DRAFT));
  const b = buildReadingDraftReceiptViewModel(submission(sha256(DRAFT), DRAFT));
  assert.deepEqual(a, b);
  const refusedA = buildReadingDraftReceiptViewModel(null);
  const refusedB = buildReadingDraftReceiptViewModel(null);
  assert.deepEqual(refusedA, refusedB);
});