import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { createCapabilitySession, CAPABILITY_POLICY_VERSION } from '../ai/runtime/offline-team/xvi-capability-contract';
import { CapabilityStatusView } from './src/app/capability-contract/preview';

const session = () => createCapabilitySession('tenant-demo', 'universe-demo', 'human-demo');
const render = (s = session(), notice = '') => renderToStaticMarkup(<CapabilityStatusView snapshot={s.snapshot()} consent={false} mobileRevision={0} notice={notice} onConsent={() => {}} onRefresh={() => {}} onRequest={() => {}} />);
test('both device previews visibly disclose mode, connectivity, sync, uncertainty and pending review', () => {
  const html = render();
  for (const device of ['laptop', 'mobile']) assert.ok(html.includes(`data-device="${device}"`));
  assert.equal((html.match(/<dt>Execution mode<\/dt>/g) ?? []).length, 2);
  for (const label of ['Connectivity', 'Synchronization', 'Uncertainty', 'Pending human review', 'OFFLINE_ONLY', 'ONLINE_ALLOWED', 'CLOUD_GOVERNED', 'CI_UNVERIFIED', 'tenant-demo', 'universe-demo', 'human-demo', CAPABILITY_POLICY_VERSION]) assert.ok(html.includes(label), label);
  assert.match(html, /not verified identities/); assert.match(html, /Reload loses this queue/);
  assert.match(html, /Agents disabled · Zero permissions/);
  assert.ok(!html.includes('<script')); assert.ok(!html.includes('https://'));
});
test('status surface has labelled consent, keyboard focus, responsive layout and announced receipts', () => {
  const html = render(session(), 'REFUSED: MODE_TRANSITION_UNAVAILABLE');
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(html, /REFUSED: MODE_TRANSITION_UNAVAILABLE/);
  assert.match(html, /<label><input type="checkbox"/);
  assert.match(html, /button disabled=""[^>]*>Propose local change from laptop/);
  assert.match(html, /button disabled=""[^>]*>Request cloud mode/);
  assert.match(html, /:focus-visible/); assert.match(html, /min-height:44px/);
  assert.match(html, /@media\(max-width:720px\)/);
  assert.match(html, /href="#capability-status"/);
});
test('pending count follows local state and clears after discard without claiming synchronization', () => {
  const s = session(); const request = { requestId: 'one', executionMode: 'OFFLINE_ONLY', tenantId: 'tenant-demo', universeId: 'universe-demo', actorId: 'human-demo', purpose: 'CLARIFY_GOAL', policyVersion: CAPABILITY_POLICY_VERSION, baseRevision: 0, operation: 'PROPOSE_LOCAL_CHANGE', targetMode: null, consent: true };
  s.record(JSON.stringify(request)); assert.match(render(s), /1 local proposal\(s\)/);
  s.record(JSON.stringify({ ...request, requestId: 'two', baseRevision: 1, operation: 'DISCARD_LOCAL_CHANGES' }));
  assert.match(render(s), /0 local proposal\(s\)/); assert.match(render(s), /nothing is uploaded/);
});
