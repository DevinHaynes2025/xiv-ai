// 12D-242 tests — adversarial coverage for the XIV OS story-shell renderer.
// Under test: verify-BEFORE-render (an unverified packet refuses everything),
// the render-time credential re-gate (a DIGEST-CONSISTENT hand-forged packet
// passes the 12D-241 wire and MUST refuse at the screen), escaping of every
// packet-sourced string (the XSS boundary), the never-auto-approve decision
// surface, the no-telemetry/no-script/no-fetch structural audit, avatar-card
// embedding (12D-239 verified visuals only), and determinism. Nothing calls a
// network or a model.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'crypto';
import {
  XIV_STORY_SHELL_POLICY,
  XIV_STORY_SHELL_GUARDRAILS,
  renderStoryShell,
} from './xiv-story-shell';
import {
  buildStoryShellPacket,
  verifyStoryShellPacket,
  type StoryShellPacket,
} from './xiv-os-wire-contract';
import { createAvatarIdentity, renderAvatarCard, type AvatarIdentity } from './xiv-avatar';

const T0 = 1_000_000_000;
const SCOPE = 'presents governed XIV AI orientation and platform honesty flags';

const AVATAR = createAvatarIdentity({
  representationScope: SCOPE,
  operator: 'devin',
  createdAtMs: T0,
});

const INPUT = {
  storyId: '12d-242-story-001',
  headline: 'XIV AI OS build digest — the story shell renders only verified packets',
  bodyText: 'The shell renders this operator-authored text verbatim and escaped.\n\nA human decides what happens next; nothing auto-approves.',
  generatedAtMs: T0 + 50,
  avatar: AVATAR as Readonly<AvatarIdentity> | null,
  decidingOver: 'whether the story shell may render verified packets',
};

const build = (overrides?: Partial<typeof INPUT>) => buildStoryShellPacket({ ...INPUT, ...overrides });

/** The XSS boundary is also a determinism boundary: same packet, same bytes. */
test('12D-242 policy and guardrails match the charter and are frozen', () => {
  assert.equal(XIV_STORY_SHELL_POLICY.policyVersion, '12d-242-v1');
  assert.equal(XIV_STORY_SHELL_POLICY.wireVersionRequired, 1);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.rendersOnlyVerifiedPackets, true);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.escapesAllPacketText, true);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.secretsNeverRender, true);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.neverAutoApproves, true);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.approvalHappensInCustodyNotInTheShell, true);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.avatarVisualsOnlyFromVerifiedIdentity, true);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.noScriptTags, true);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.noTelemetryHooks, true);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.noExternalFetches, true);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.collectsNothing, true);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.deterministicOutput, true);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.zeroModelCalls, true);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.learningPromoted, false);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.automaticRecovery, false);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.billionUsersProven, false);
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(Object.isFrozen(XIV_STORY_SHELL_POLICY), true);
  assert.equal(Object.isFrozen(XIV_STORY_SHELL_GUARDRAILS), true);
});

test('12D-242 a verified packet renders the full escaped document', () => {
  const html = renderStoryShell(build());
  assert.match(html, /^<!doctype html>/);
  assert.match(html, /<\/html>$/);
  assert.ok(html.includes('XIV AI OS · story shell · 12d-242-story-001'));
  assert.ok(html.includes('<h1>XIV AI OS build digest — the story shell renders only verified packets</h1>'));
  assert.ok(html.includes('renders this operator-authored text verbatim and escaped'));
  assert.ok(html.includes('HUMAN DECISION REQUIRED'));
  assert.ok(html.includes('APPROVAL_REQUIRED'));
  assert.ok(html.includes('humanDecision: REQUIRED'));
  assert.ok(html.includes('billionUsersProven: false'));
  assert.ok(html.includes('learningPromoted: false'));
});

test('12D-242 the render is deterministic (same packet → same bytes)', () => {
  const packet = build();
  assert.equal(renderStoryShell(packet), renderStoryShell(packet));
  assert.notEqual(renderStoryShell(packet), renderStoryShell(build({ generatedAtMs: T0 + 1 })));
});

test('12D-242 an unverified packet refuses the whole render (verify FIRST)', () => {
  const packet = build();
  assert.throws(
    () => renderStoryShell({ ...packet, headline: `${packet.headline} TAMPERED` } as StoryShellPacket),
    /tampered in flight/,
  );
  assert.throws(
    () => renderStoryShell({ ...packet, apiKey: 'sk-abcdefghijklmnopqrstuvwxyz012345' } as never),
    /shape mismatch/,
  );
  assert.throws(
    () => renderStoryShell({
      ...packet,
      decisionSurface: {
        kind: 'APPROVAL_REQUIRED', humanDecision: 'AUTO_APPROVED', decidingOver: INPUT.decidingOver,
      },
    } as unknown as StoryShellPacket),
    /pinned to humanDecision 'REQUIRED'/,
  );
});

test('12D-242 a DIGEST-CONSISTENT forged packet passes the wire but refuses at render (secrets never render)', () => {
  // Re-derive the 12D-241 packet digest from the packet's OWN declared fields
  // — exactly what any receiving side can do — then smuggle credential text
  // in and FIX THE DIGEST. The wire verifies integrity in flight, not
  // authorship; the render layer's own content re-gate is what refuses.
  const packet = build();
  const CRED = 'sk-abcdefghijklmnopqrstuvwxyz012345';
  const reforged = (headline: string, bodyText = packet.bodyText): string =>
    createHash('sha256').update(JSON.stringify({
      domain: 'XIV_OS_STORY_SHELL_WIRE',
      wireVersion: 1,
      storyId: packet.storyId,
      headline,
      bodyText,
      generatedAtMs: packet.generatedAtMs,
      avatarId: packet.avatar === null ? null : (packet.avatar as AvatarIdentity).avatarId,
      decidingOver: packet.decisionSurface.decidingOver,
    }), 'utf8').digest('hex');

  const forgedHeadline = { ...packet, headline: CRED, packetId: reforged(CRED) } as unknown as StoryShellPacket;
  assert.equal(verifyStoryShellPacket(forgedHeadline).ok, true);
  assert.throws(() => renderStoryShell(forgedHeadline), /secrets never render/);

  const forgedBody = {
    ...packet,
    bodyText: `-----BEGIN OPENVPN PRIVATE KEY-----`,
    packetId: reforged(packet.headline, `-----BEGIN OPENVPN PRIVATE KEY-----`),
  } as unknown as StoryShellPacket;
  assert.equal(verifyStoryShellPacket(forgedBody).ok, true);
  assert.throws(() => renderStoryShell(forgedBody), /secrets never render/);
});

test('12D-242 every packet-sourced string is escaped (the XSS boundary)', () => {
  const packet = build({
    headline: 'story <script>alert(1)</script> digest',
    bodyText: 'trust no packet <img src=x onerror=alert(1)> the shell did not verify',
  });
  const html = renderStoryShell(packet);
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<img\b/i);
  assert.doesNotMatch(html, /<iframe/i);
  assert.doesNotMatch(html, /javascript:/i);
});

test('12D-242 an attribute-breakout attempt stays inside the tag', () => {
  const packet = build({ headline: 'breakout "><img src=x onerror=alert(1)> payload' });
  const html = renderStoryShell(packet);
  assert.ok(html.includes('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;'));
  assert.doesNotMatch(html, /<img\b/i);
  // No on* ATTRIBUTE on any raw tag — escaped packet text may still contain
  // the inert substring (e.g. "onerror=" inside &lt;img …&gt;), and only an
  // unescaped attribute position would be live.
  assert.doesNotMatch(html, /<\w+[^>]*\son\w+=/i);
});

test('12D-242 the avatar card embeds verbatim from the verified identity only', () => {
  const packet = build();
  const html = renderStoryShell(packet);
  assert.ok(html.includes(renderAvatarCard(packet.avatar as Readonly<AvatarIdentity>)));
  // The 12D-239 SVG interpolates only digest-derived hues + the fixed literal.
  assert.ok(html.includes('aria-label="XIV AI avatar"'));
  // The avatar's representationScope is escaped like every packet-sourced text.
  assert.ok(html.includes(`Scope: ${SCOPE}</figcaption>`));
  // A tampered avatar refuses the WHOLE packet at render (12D-241 gate).
  const tampered = {
    ...packet,
    avatar: { ...(packet.avatar as AvatarIdentity), avatarId: 'f'.repeat(64) } as AvatarIdentity,
  } as unknown as StoryShellPacket;
  assert.throws(() => renderStoryShell(tampered), /tampered|shape mismatch/);
});

test('12D-242 an avatar-less packet renders with no avatar visual', () => {
  const html = renderStoryShell(build({ avatar: null }));
  assert.equal(html.includes('<svg'), false);
  assert.equal(html.includes('xiv-avatar'), false);
  assert.ok(html.includes('HUMAN DECISION REQUIRED'));
});

test('12D-242 the decision surface renders with NO approval control (custody, not the shell)', () => {
  const html = renderStoryShell(build());
  assert.equal(html.includes('<button'), false);
  assert.equal(html.includes('<input'), false);
  assert.equal(html.includes('<a '), false);
  assert.equal(html.includes('AUTO_APPROVED'), false);
  assert.ok(html.includes('No approval control renders here and nothing auto-approves.'));
  assert.ok(html.includes('OUT-OF-BAND in operator custody'));
});

test('12D-242 no telemetry hooks and no fetch surface exist in the output', () => {
  const html = renderStoryShell(build());
  for (const hook of ['fetch(', 'navigator.', 'localStorage', 'sessionStorage', 'document.cookie', 'analytics', 'XMLHttpRequest', 'WebSocket', 'sendBeacon']) {
    assert.equal(html.includes(hook), false, `output must not contain ${hook}`);
  }
  assert.equal(XIV_STORY_SHELL_GUARDRAILS.collectsNothing, true);
});

test('12D-242 the honest flags render visibly on the shell', () => {
  const html = renderStoryShell(build());
  assert.ok(html.includes('modelCalls: 0'));
  assert.ok(html.includes('remoteCalls: 0'));
  assert.ok(html.includes('collectsNothing: true'));
  assert.ok(html.includes('automaticRecovery: false'));
  assert.ok(html.includes('verified packet '));
  // The verify digest line is the packet's own re-derived id (hex only).
  assert.match(html, /verified packet [0-9a-f]{64}<\/header>/);
});

test('12D-242 the shell is byte-identical after a JSON round-trip (both-sides render)', () => {
  const packet = build();
  const transported = JSON.parse(JSON.stringify(packet)) as StoryShellPacket;
  assert.equal(renderStoryShell(transported), renderStoryShell(packet));
});

test('12D-242 distinct packets render distinct shells (deterministic binding)', () => {
  const a = renderStoryShell(build());
  const b = renderStoryShell(build({ headline: 'a different governed story headline' }));
  assert.notEqual(a, b);
});