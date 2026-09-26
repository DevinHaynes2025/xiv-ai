import React from 'react';
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import CoreConsole, { CoreMap } from './src/app/quantum-core/console';
import { ENGINE_NAMES, FIXTURE_TIME, UNIVERSES, activeUniverse, agents, approvalIdentity, auditView, initialState, reviewDemo, switchUniverse, visibleApprovals, visibleReceipts, executionStatus, type ConsoleState, type Decision } from './src/app/quantum-core/model';

const now = Date.parse(FIXTURE_TIME) + 1000;
const command = (state: ConsoleState, decision: Decision = 'APPROVE', index = 0) => JSON.stringify({ identity: approvalIdentity(visibleApprovals(state)[index]), decision });
const digest = (s: string) => createHash('sha256').update(s).digest('hex');

test('audit filters hide selected details together with excluded rows without changing the ledger', async () => {
  const original = initialState();
  const state = (await reviewDemo(original, command(original), now)).state;
  const receipt = state.receipts[0];
  const before = JSON.stringify(state);
  assert.equal(auditView(state, '', 'ALL', '', receipt.id).selectedReceipt, receipt);
  for (const [query, verification, date] of [
    ['', 'VERIFIED', ''], ['', 'TAMPERED', ''], ['', 'INCOMPLETE', ''], ['', 'EXPIRED', ''],
    ['no matching action', 'ALL', ''], ['', 'ALL', '2026-09-25'],
  ]) {
    const view = auditView(state, query, verification, date, receipt.id);
    assert.deepEqual(view.receipts, []);
    assert.equal(view.selectedReceipt, undefined);
  }
  const matching = auditView(state, 'PUBLISH EVALUATION', 'UNVERIFIED', '2026-09-26', receipt.id);
  assert.deepEqual(matching.receipts, [receipt]);
  assert.equal(matching.selectedReceipt, receipt);
  assert.ok(Object.isFrozen(matching));
  assert.ok(Object.isFrozen(matching.receipts));
  assert.equal(JSON.stringify(state), before);
});

test('audit selection cannot reveal a foreign-universe or unknown receipt', async () => {
  const original = initialState();
  const state = (await reviewDemo(original, command(original), now)).state;
  const receipt = state.receipts[0];
  const other = switchUniverse(state, UNIVERSES[1].id);
  const foreign = auditView(other, '', 'ALL', '', receipt.id);
  assert.deepEqual(foreign.receipts, []);
  assert.equal(foreign.selectedReceipt, undefined);
  const missing = auditView(state, '', 'ALL', '', 'missing-receipt');
  assert.deepEqual(missing.receipts, [receipt]);
  assert.equal(missing.selectedReceipt, undefined);
});

test('fixture has twelve engine slots, zero authority and organization-scoped disabled agents', () => {
  assert.equal(ENGINE_NAMES.length, 12);
  assert.equal(new Set(ENGINE_NAMES).size, 12);
  const state = initialState();
  assert.ok(agents(state).every(a => a.state === 'OFFLINE' && a.tools === 'None' && a.organization === activeUniverse(state).organizationId));
  assert.equal(executionStatus().permitted, false);
  assert.ok(Object.isFrozen(state));
  assert.ok(Object.isFrozen(state.approvals));
});

test('every approval identity field changes the key and tuple boundaries cannot alias', () => {
  const original = initialState().approvals[0];
  const variants = [{ actionId: 'different' }, { reviewCycleId: 'different' }, { organizationId: 'different' }, { membershipId: 'different' }, { membershipRoleVersion: 2 }];
  const keys = variants.map(v => approvalIdentity({ ...original, ...v }));
  assert.equal(new Set([approvalIdentity(original), ...keys]).size, 6);
  assert.notEqual(approvalIdentity({ ...original, actionId: 'a:b', reviewCycleId: 'c' }), approvalIdentity({ ...original, actionId: 'a', reviewCycleId: 'b:c' }));
});

test('demo review appends an immutable unverified receipt without executing', async () => {
  const state = initialState();
  const result = await reviewDemo(state, command(state), now);
  assert.equal(result.state.receipts.length, 1);
  assert.equal(state.receipts.length, 0);
  const receipt = result.state.receipts[0];
  assert.equal(receipt.verification, 'UNVERIFIED');
  assert.equal(receipt.result, 'DEMO_REVIEW_ONLY');
  assert.equal(receipt.source, 'DEMO_DATA');
  assert.equal(receipt.digest, digest(receipt.canonicalPayload));
  assert.equal(receipt.evidenceDigest, digest(state.approvals[0].evidence));
  assert.equal(receipt.correlationId, approvalIdentity(state.approvals[0]));
  assert.ok(Object.isFrozen(receipt));
  assert.equal(executionStatus().permitted, false);
});

test('receipts reproduce deterministically and bind decision, organization and history', async () => {
  const state = initialState();
  const a = await reviewDemo(state, command(state), now);
  const b = await reviewDemo(state, command(state), now);
  assert.deepEqual(a, b);
  const denied = await reviewDemo(state, command(state, 'DENY'), now);
  assert.notEqual(a.state.receipts[0].digest, denied.state.receipts[0].digest);
  const second = await reviewDemo(a.state, command(a.state, 'REQUEST_CHANGES', 1), now + 1);
  assert.equal(second.state.receipts[1].previousDigest, a.state.receipts[0].digest);
  assert.equal(second.state.receipts[1].digest, digest(second.state.receipts[1].canonicalPayload));
  assert.deepEqual(second.state.receipts[0], a.state.receipts[0]);
  const other = switchUniverse(state, UNIVERSES[1].id);
  const foreign = await reviewDemo(other, command(other), now);
  assert.notEqual(a.state.receipts[0].digest, foreign.state.receipts[0].digest);
});

test('cross-organization, membership, role version and unknown identities refuse unchanged', async () => {
  const state = initialState();
  const original = visibleApprovals(state)[0];
  for (const change of [{ organizationId: 'org-orion' }, { membershipId: 'other-member' }, { membershipRoleVersion: 100 }, { actionId: 'unknown' }]) {
    const result = await reviewDemo(state, JSON.stringify({ identity: approvalIdentity({ ...original, ...change }), decision: 'APPROVE' }), now);
    assert.equal(result.state, state);
    assert.equal(result.message, 'Scope or identity refused');
  }
  const other = switchUniverse(state, UNIVERSES[1].id);
  assert.equal((await reviewDemo(other, command(state), now)).state, other);
});

test('duplicate and replay decisions cannot append a receipt or change a previous decision', async () => {
  const state = initialState();
  const first = await reviewDemo(state, command(state), now);
  for (const decision of ['APPROVE', 'DENY', 'REQUEST_CHANGES'] as const) {
    const replay = await reviewDemo(first.state, command(state, decision), now + 1);
    assert.equal(replay.state, first.state);
    assert.equal(replay.message, 'Already decided or revoked');
  }
});

test('expired, future-dated and revoked requests fail closed', async () => {
  const state = initialState();
  for (const time of [Date.parse(state.approvals[0].expiresAt), Date.parse(FIXTURE_TIME) - 1]) {
    const result = await reviewDemo(state, command(state), time);
    assert.equal(result.state, state);
    assert.equal(result.message, 'Approval expired or not yet valid');
  }
  const revoked: ConsoleState = { ...state, approvals: state.approvals.map(a => ({ ...a, state: 'REVOKED' })) };
  assert.equal((await reviewDemo(revoked, command(revoked), now)).state, revoked);
});

test('malformed inputs and hostile objects cannot invoke accessors or inject extra fields', async () => {
  const state = initialState();
  let calls = 0;
  const hostile = new Proxy({}, { get() { calls++; throw new Error('getter'); }, ownKeys() { calls++; throw new Error('keys'); } });
  for (const input of [hostile, null, undefined, 42, 'null', '[]', '{}', '{', '界'.repeat(700), 'x'.repeat(2049), JSON.stringify({ identity: approvalIdentity(state.approvals[0]), decision: 'EXECUTE' }), '{"identity":"x","decision":"APPROVE","__proto__":{}}']) {
    const result = await reviewDemo(state, input, now);
    assert.equal(result.state, state);
    assert.equal(result.message, 'Malformed request');
  }
  assert.equal(calls, 0);
  assert.equal((await reviewDemo(state, command(state), NaN)).state, state);
});

test('throwing digest dependency fails closed with a generic message and unchanged state', async t => {
  const state = initialState();
  t.mock.method(globalThis.crypto.subtle, 'digest', async () => { throw new Error('SYNTHETIC_INTERNAL_DETAIL'); });
  const result = await reviewDemo(state, command(state), now);
  assert.equal(result.state, state);
  assert.equal(result.message, 'Review unavailable');
  assert.ok(!JSON.stringify(result).includes('SYNTHETIC_INTERNAL_DETAIL'));
});

test('universe reads are isolated and do not consume proposals or receipt state', async () => {
  const state = initialState();
  const reviewed = (await reviewDemo(state, command(state), now)).state;
  const other = switchUniverse(reviewed, UNIVERSES[1].id);
  assert.equal(visibleReceipts(other).length, 0);
  assert.ok(visibleApprovals(other).every(a => a.organizationId === 'org-orion'));
  assert.equal(visibleReceipts(switchUniverse(other, UNIVERSES[0].id)).length, 1);
  const before = JSON.stringify(reviewed);
  for (let i = 0; i < 10; i++) { visibleApprovals(reviewed); visibleReceipts(reviewed); }
  assert.equal(JSON.stringify(reviewed), before);
  assert.equal(switchUniverse(reviewed, 'unauthorized'), reviewed);
});

test('model has no network, provider, storage or execution side effects', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('network forbidden'); });
  const state = initialState();
  assert.equal((await reviewDemo(state, command(state), now)).state.receipts.length, 1);
  const source = readFileSync(new URL('./src/app/quantum-core/model.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(fetch|localStorage|sessionStorage|eval|WebSocket|child_process)\s*[.(]/);
  assert.doesNotMatch(source, /^import /m);
});

test('console renders truthful source labels, keyboard controls and all twelve inspectable engines', () => {
  const html = renderToStaticMarkup(<CoreConsole />);
  for (const text of ['DEMO DATA', 'OFFLINE_ONLY', 'CI_UNVERIFIED', 'No runtime evidence', 'No agents activated', 'No verified runtime', 'Demo organization universe']) assert.ok(html.includes(text), text);
  assert.match(html, /aria-label="Console sections"/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(html, /href="#qc-main"/);
  const map = renderToStaticMarkup(<CoreMap onSelect={() => {}} />);
  assert.equal((map.match(/aria-label="Inspect /g) ?? []).length, 12);
  assert.ok(!html.includes('<script'));
});

test('responsive styles provide desktop ring, mobile carousel, touch targets and reduced motion', () => {
  const css = readFileSync(new URL('./src/app/quantum-core/console.css', import.meta.url), 'utf8');
  for (const rule of ['@media(max-width:1200px)', '@media(max-width:720px)', 'scroll-snap-type:x proximity', 'min-height:44px', '@media(prefers-reduced-motion:reduce)', ':focus-visible']) assert.ok(css.includes(rule), rule);
});
