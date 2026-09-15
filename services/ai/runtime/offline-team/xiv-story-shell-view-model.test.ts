// 12D-254 — adversarial tests for the story-shell view model.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStoryShellViewModel,
  STORY_SHELL_VIEW_MODEL_GUARDRAILS,
} from './xiv-story-shell-view-model';
import {
  buildStoryShellPacket, verifyStoryShellPacket, type StoryShellPacket,
} from './xiv-os-wire-contract';

function makePacket(generatedAtMs: number, headline: string): StoryShellPacket {
  const packet = buildStoryShellPacket({
    storyId: '12d-254-story-shell-view-model-test',
    headline,
    bodyText: 'the shell renders this only after full wire verification passes',
    generatedAtMs,
    avatar: null,
    decidingOver: 'whether the verified packet may proceed to operator review',
  });
  assert.equal(verifyStoryShellPacket(packet).ok, true, 'fixture must verify');
  return packet;
}

test('12d-254: a verified packet yields a VERIFIED_PACKET view model with the full display surface', () => {
  const packet = makePacket(1_000_000, 'the avatar requests operator review');
  const vm = buildStoryShellViewModel(JSON.parse(JSON.stringify(packet)));
  assert.equal(vm.kind, 'VERIFIED_PACKET');
  if (vm.kind !== 'VERIFIED_PACKET') return; // narrowing for tsc
  assert.equal(vm.display.headline, packet.headline);
  assert.equal(vm.display.bodyText, packet.bodyText);
  assert.equal(vm.display.storyId, packet.storyId);
  assert.equal(vm.display.avatarId, null);
  assert.equal(vm.display.decisionKind, 'APPROVAL_REQUIRED');
  assert.equal(vm.display.humanDecision, 'REQUIRED');
  assert.match(vm.display.operatorNote, /never through this shell/);
  // The packet survived a JSON round-trip and STILL verified — the
  // by-value guardrail property holds through the view model too.
});

test('12d-254: the view model carries NO approve control — display only', () => {
  const packet = makePacket(1_000_000, 'the avatar requests operator review');
  const vm = buildStoryShellViewModel(packet);
  assert.equal(vm.kind, 'VERIFIED_PACKET');
  if (vm.kind !== 'VERIFIED_PACKET') return;
  const displayKeys = Object.keys(vm.display);
  for (const key of displayKeys) {
    assert.ok(!/approv|action|endpoint|button|allow|execute/i.test(key), `display key ${key} must not be an action descriptor`);
  }
  assert.match(vm.display.operatorNote, /custody stack/);
});

test('12d-254: EVERY tamper refuses — digest, headline, body, decision surface, guardrails', () => {
  const packet = makePacket(1_000_000, 'tamper targets will be applied to this');

  const tampers: ReadonlyArray<readonly [string, unknown]> = [
    ['headline edit in flight', { ...packet, headline: 'a different headline entirely' }],
    ['body edit in flight', { ...packet, bodyText: 'quietly replaced body text' }],
    ['decisionSurface smuggle', { ...packet, decisionSurface: { ...packet.decisionSurface, decidingOver: 'something else entirely' } }],
    ['humanDecision flipped', { ...packet, decisionSurface: { ...packet.decisionSurface, humanDecision: 'OPTIONAL' } }],
    ['guardrail flipped', { ...packet, guardrails: { ...packet.guardrails, humanDecision: 'OPTIONAL' } }],
    ['packetId swapped', { ...packet, packetId: '0'.repeat(64) }],
    ['generatedAtMs shifted', { ...packet, generatedAtMs: 1_000_001 }],
  ];
  for (const [label, tampered] of tampers) {
    const vm = buildStoryShellViewModel(tampered);
    assert.equal(vm.kind, 'REFUSED', `${label} must refuse`);
    if (vm.kind === 'REFUSED') assert.match(vm.reason, /fail closed|mismatch|shape|version|pinned/);
  }
});

test('12d-254: a refused view renders NOTHING from the packet — never a partial render', () => {
  const packet = makePacket(1_000_000, 'this headline must never leak');
  const tampered = { ...packet, bodyText: 'tampered body' } as unknown as StoryShellPacket;
  const vm = buildStoryShellViewModel(tampered);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.equal(vm.display.headline, 'Packet refused — HUMAN DECISION REQUIRED');
  assert.ok(!JSON.stringify(vm).includes('must never leak'), 'refused view must not carry any packet content');
  assert.ok(!JSON.stringify(vm).includes('tampered body'));
  assert.match(vm.reason, /fail closed|mismatch/);
});

test('12d-254: non-object garbage refuses honestly (null, array, string, number)', () => {
  for (const garbage of [null, [], 'packet', 42, true]) {
    const vm = buildStoryShellViewModel(garbage);
    assert.equal(vm.kind, 'REFUSED');
    if (vm.kind === 'REFUSED') assert.match(vm.reason, /packet object is required|fail closed/);
  }
});

test('12d-254: the view model NEVER throws — a crash is a bug, a refusal is the contract', () => {
  // Hostile inputs of every shape; all must return, none may throw.
  const hostile: unknown[] = [
    undefined, null, 0, -1, '', 'x', [], [1, 2], {}, { a: 1 },
    { get headline(): string { throw new Error('getter bomb'); } },
    { headline: 'x', get bodyText(): string { throw new Error('getter bomb'); } },
  ];
  for (const h of hostile) {
    const vm = buildStoryShellViewModel(h);
    assert.ok(vm.kind === 'VERIFIED_PACKET' || vm.kind === 'REFUSED');
  }
});

test('12d-254: guardrails pin the honest flags; policy is frozen', () => {
  assert.equal(Object.isFrozen(STORY_SHELL_VIEW_MODEL_GUARDRAILS), true);
  assert.equal(STORY_SHELL_VIEW_MODEL_GUARDRAILS.noApproveControl, true);
  assert.equal(STORY_SHELL_VIEW_MODEL_GUARDRAILS.verifyBeforeRender, true);
  assert.equal(STORY_SHELL_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(STORY_SHELL_VIEW_MODEL_GUARDRAILS.remoteCalls, 0);
  assert.equal(STORY_SHELL_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(STORY_SHELL_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(STORY_SHELL_VIEW_MODEL_GUARDRAILS.billionUsersProven, false);
});