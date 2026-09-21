import React from 'react';
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createHumanWorkspace } from '../ai/runtime/offline-team/xvi-human-workspace';
import { HumanWorkspaceView } from './src/app/human-collaboration/workspace';

function render(workspace = createHumanWorkspace('tenant-demo', 'conversation-demo')) {
  return renderToStaticMarkup(<HumanWorkspaceView snapshot={workspace.snapshot()} bases={{ laptop: 0, mobile: 0 }} consent={false} mobileOffline={true} notice="" exported=""
    onConsent={() => {}} onOffline={() => {}} onFeedback={() => {}} onReview={() => {}} onRefresh={() => {}} onControl={() => {}} />);
}

test('desktop and mobile previews share a responsive, accessible conversation surface', () => {
  const html = render();
  assert.match(html, /data-device="laptop"/);
  assert.match(html, /data-device="mobile"/);
  assert.match(html, /@media\(max-width:720px\)/);
  assert.match(html, /grid-template-columns:minmax\(0,1fr\)/);
  assert.match(html, /aria-label="Workspace sections"/);
  assert.match(html, /href="#workspace-conversation"/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(html, /for="laptop-feedback"/);
  assert.match(html, /id="laptop-feedback"/);
  assert.match(html, /for="mobile-feedback"/);
  assert.match(html, /:focus-visible/);
  assert.match(html, /min-height:44px/);
  assert.match(html, /button[^>]*disabled=""[^>]*>Propose from laptop/);
  assert.match(html, /button[^>]*disabled=""[^>]*>Propose from mobile/);
});

test('rendering states offline limitations, provenance, uncertainty, and zero authority', () => {
  const html = render();
  for (const label of ['OFFLINE_ONLY', 'CI_UNVERIFIED', 'Online synchronization unavailable', 'SYNTHETIC_EXAMPLE', 'CC0-1.0', 'Zero permissions', 'Kill session', 'Delete conversation']) assert.ok(html.includes(label), label);
  assert.equal((html.match(/Disabled · Zero permissions/g) ?? []).length, 6);
  assert.ok(!html.includes('<script'));
  assert.ok(!html.includes('https://'));
});

test('proposal decisions and deleted state render without executing or retaining conversation content', () => {
  const workspace = createHumanWorkspace('tenant-demo', 'conversation-demo');
  workspace.recordHumanInput(JSON.stringify({ tenantId: 'tenant-demo', conversationId: 'conversation-demo', requestId: 'ui-1', baseRevision: 0, kind: 'FEEDBACK', value: 'NEED_EVIDENCE', consent: true }));
  const html = render(workspace);
  assert.match(html, /Approve for review only: proposal-1/);
  assert.match(html, /Not executed/);
  assert.match(html, /Please provide evidence and state uncertainty/);
  assert.match(html, /Evidence ID: synthetic-evidence-1/);
  assert.match(html, /Plan a clearer explanation of a fictional task/);
  workspace.humanOverride.deleteConversation();
  const cleared = render(workspace);
  assert.ok(!cleared.includes('Please provide evidence and state uncertainty'));
  assert.ok(!cleared.includes('synthetic-evidence-1'));
  assert.ok(!cleared.includes('Plan a clearer explanation of a fictional task'));
  assert.match(cleared, /Conversation data deleted from this session/);
});
