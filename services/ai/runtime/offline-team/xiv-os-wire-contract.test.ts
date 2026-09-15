// 12D-241 tests — adversarial coverage for the XIV OS wire contract v1.
// Under test: digest re-derivation (tamper in flight refuses BOTH directions),
// the embedded-avatar verification requirement (12D-239), the pinned
// humanDecision surface, the no-secrets gate (keys AND text), exact packet
// shape (no telemetry field), and the honest flags. Nothing calls a network
// or a model — this file IS the wire shape, not a transport.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  XIV_OS_WIRE_POLICY,
  XIV_OS_WIRE_GUARDRAILS,
  buildStoryShellPacket,
  verifyStoryShellPacket,
  type StoryShellPacket,
} from './xiv-os-wire-contract';
import { createAvatarIdentity, type AvatarIdentity } from './xiv-avatar';

const T0 = 1_000_000_000;
const SCOPE = 'presents governed XIV AI orientation and platform honesty flags';

const AVATAR = createAvatarIdentity({
  representationScope: SCOPE,
  operator: 'devin',
  createdAtMs: T0,
});

const INPUT = {
  storyId: '12d-241-story-001',
  headline: 'XIV AI OS build digest — custody chain complete through 12D-238',
  bodyText: 'The governed runtime presents this story verbatim; a human decides what happens next.',
  generatedAtMs: T0 + 50,
  avatar: AVATAR as Readonly<AvatarIdentity> | null,
  decidingOver: 'whether to adopt the 12D-241 wire contract for the web shell',
};

const build = (overrides?: Partial<typeof INPUT>) => buildStoryShellPacket({ ...INPUT, ...overrides });

test('12D-241 policy and guardrails match the charter and are frozen', () => {
  assert.equal(XIV_OS_WIRE_POLICY.policyVersion, '12d-241-v1');
  assert.equal(XIV_OS_WIRE_POLICY.wireVersion, 1);
  assert.equal(XIV_OS_WIRE_GUARDRAILS.frontEndNeverTrustsUnverifiedPackets, true);
  assert.equal(XIV_OS_WIRE_GUARDRAILS.backendNeverEmitsUnreDerivablePackets, true);
  assert.equal(XIV_OS_WIRE_GUARDRAILS.humanDecisionPinnedRequired, true);
  assert.equal(XIV_OS_WIRE_GUARDRAILS.noTelemetryFieldOnAnyPacket, true);
  assert.equal(XIV_OS_WIRE_GUARDRAILS.avatarMustBeAVerifiedIdentity, true);
  assert.equal(XIV_OS_WIRE_GUARDRAILS.secretsNeverEnter, true);
  assert.equal(XIV_OS_WIRE_GUARDRAILS.statementsAreOperatorAuthored, true);
  assert.equal(XIV_OS_WIRE_GUARDRAILS.zeroModelCalls, true);
  assert.equal(XIV_OS_WIRE_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(XIV_OS_WIRE_GUARDRAILS.learningPromoted, false);
  assert.equal(XIV_OS_WIRE_GUARDRAILS.automaticRecovery, false);
  assert.equal(XIV_OS_WIRE_GUARDRAILS.billionUsersProven, false);
  assert.equal(XIV_OS_WIRE_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(Object.isFrozen(XIV_OS_WIRE_POLICY), true);
  assert.equal(Object.isFrozen(XIV_OS_WIRE_GUARDRAILS), true);
});

test('12D-241 build produces a frozen, digest-bound packet with the pinned decision surface', () => {
  const packet = build();
  assert.match(packet.packetId, /^[0-9a-f]{64}$/);
  assert.equal(packet.schemaVersion, 1);
  assert.equal(packet.policyVersion, '12d-241-v1');
  assert.deepEqual(packet.decisionSurface, {
    kind: 'APPROVAL_REQUIRED',
    humanDecision: 'REQUIRED',
    decidingOver: INPUT.decidingOver,
  });
  assert.equal(Object.isFrozen(packet), true);
  assert.equal(Object.isFrozen(packet.decisionSurface), true);
  const verdict = verifyStoryShellPacket(packet);
  assert.equal(verdict.ok, true);
  assert.equal(verdict.packetId, packet.packetId);
});

test('12D-241 the avatar embedded in the packet is verified (12D-239 re-derivation)', () => {
  const packet = build();
  assert.equal((packet.avatar as AvatarIdentity).avatarId, AVATAR.avatarId);
  // An impersonated avatar (forged identity) refuses at BUILD time.
  const forged = { ...AVATAR, representationScope: SCOPE.replace('honesty flags', 'anything') } as AvatarIdentity;
  assert.throws(
    () => build({ avatar: forged }),
    /digest mismatch.*tampered/,
  );
});

test('12D-241 an avatar-less packet builds and verifies (avatar: null is an exact key)', () => {
  const packet = build({ avatar: null });
  assert.equal(packet.avatar, null);
  assert.equal(verifyStoryShellPacket(packet).ok, true);
  // A DIFFERENT avatar id changes the digest — the packet binds the presenter.
  const other = createAvatarIdentity({
    representationScope: SCOPE, operator: 'devin', createdAtMs: T0 + 1,
  });
  const packetB = build({ avatar: other });
  assert.notEqual(packet.packetId, packetB.packetId);
});

test('12D-241 tamper in flight refuses: headline, body, avatarId, decision surface', () => {
  const packet = build();
  assert.throws(
    () => verifyStoryShellPacket({ ...packet, headline: `${packet.headline} TAMPERED` } as StoryShellPacket),
    /tampered in flight/,
  );
  assert.throws(
    () => verifyStoryShellPacket({ ...packet, bodyText: `${packet.bodyText} edited` } as StoryShellPacket),
    /tampered in flight/,
  );
  assert.throws(
    () => verifyStoryShellPacket({
      ...packet,
      avatar: { ...(packet.avatar as AvatarIdentity), avatarId: 'f'.repeat(64) } as AvatarIdentity,
    } as StoryShellPacket),
    /digest mismatch.*tampered|shape mismatch/,
  );
  assert.throws(
    () => verifyStoryShellPacket({
      ...packet,
      decisionSurface: {
        kind: 'APPROVAL_REQUIRED', humanDecision: 'AUTO_APPROVED', decidingOver: INPUT.decidingOver,
      },
    } as unknown as StoryShellPacket),
    /pinned to humanDecision 'REQUIRED'/,
  );
});

test('12D-241 an added field (a smuggled secret) refuses the exact-shape gate', () => {
  const packet = build();
  assert.throws(
    () => verifyStoryShellPacket({ ...packet, apiKey: 'sk-abcdefghijklmnopqrstuvwxyz012345' } as never),
    /shape mismatch/,
  );
  assert.throws(
    () => build({ ...INPUT, telemetry: { viewedAtMs: T0 } } as never),
    /exactly the keys/,
  );
});

test('12D-246 a field smuggled INSIDE decisionSurface refuses verify (residual paid down)', () => {
  const packet = build();
  // The smuggled field is NOT digest-covered (the digest covers decidingOver
  // only), so the forged packet keeps the ORIGINAL packetId — a digest-consistent
  // forgery. The exact-keys audit on the decision surface is what catches it.
  const smuggled = {
    ...packet,
    decisionSurface: { ...packet.decisionSurface, autoApprove: true },
  } as never;
  assert.throws(
    () => verifyStoryShellPacket(smuggled),
    /decisionSurface shape mismatch — a field was smuggled inside the decision surface/,
  );
  // Prove the digest was unchanged (this is precisely why the shape gate is
  // load-bearing): the packetId matches the honest packet's id.
  assert.equal(
    (smuggled as unknown as typeof packet).packetId,
    packet.packetId,
  );
  // Smuggling a credential-shaped FIELD inside the surface refuses too.
  assert.throws(
    () => verifyStoryShellPacket({
      ...packet,
      decisionSurface: { ...packet.decisionSurface, apiKey: 'sk-abcdefghijklmnopqrstuvwxyz012345' },
    } as never),
    /decisionSurface shape mismatch/,
  );
  // The honest packet still verifies — the hardening refuses only smuggles.
  assert.equal(verifyStoryShellPacket(packet).ok, true);
});

test('12D-241 credential-shaped keys and content refuse (before validation, at build)', () => {
  assert.throws(
    () => buildStoryShellPacket({ ...INPUT, userPassword: 'x' } as never),
    /credential-shaped key "userPassword"/,
  );
  assert.throws(
    () => build({ headline: `approve via sk-abcdefghijklmnopqrstuvwxyz012345 now` }),
    /credential-shaped content/,
  );
  assert.throws(
    () => build({ bodyText: `-----BEGIN OPENVPN PRIVATE KEY-----` }),
    /credential-shaped content/,
  );
});

test('12D-241 malformed builds fail closed', () => {
  assert.throws(() => build({ storyId: 'short' }), /storyId must match/);
  assert.throws(() => build({ headline: 'short' }), /headline must be a string of 8\./);
  assert.throws(() => build({ bodyText: '' }), /bodyText must be a string of 1\./);
  assert.throws(() => build({ generatedAtMs: 1.5 }), /generatedAtMs/);
  assert.throws(() => buildStoryShellPacket({ ...INPUT, extra: 1 } as never), /exactly the keys/);
  // A forged avatar that was never built through 12D-239 refuses.
  assert.throws(
    () => build({
      avatar: {
        avatarId: 'a'.repeat(64), displayName: 'XIV AI', presentedAsHuman: false,
        representationScope: SCOPE, operator: 'devin', createdAtMs: T0,
        avatarDigest: 'a'.repeat(64), guardrails: XIV_OS_WIRE_GUARDRAILS as never,
      },
    }),
    /digest mismatch/,
  );
});

test('12D-241 no telemetry field exists on the packet (structural, shape-audited)', () => {
  const packet = build();
  assert.deepEqual(
    Object.keys(packet).sort(),
    ['avatar', 'bodyText', 'decisionSurface', 'generatedAtMs', 'guardrails', 'headline', 'packetId', 'policyVersion', 'schemaVersion', 'storyId'],
  );
  assert.equal(Object.keys(packet).includes('viewedAtMs'), false);
  assert.equal(Object.keys(packet).includes('analytics'), false);
  assert.equal(XIV_OS_WIRE_GUARDRAILS.collectsNothing, true);
});

test('12D-241 the packet is verifiable independently on BOTH sides of the wire', () => {
  // Simulate the two-party property: the same packet re-verifies from a deep
  // copy (as a transport would carry), and a hand-forged digest built under
  // a DIFFERENT wire domain refuses here.
  const packet = build();
  const transported = JSON.parse(JSON.stringify(packet)) as StoryShellPacket;
  assert.equal(verifyStoryShellPacket(transported).ok, true);
  const forged = { ...packet, packetId: 'f'.repeat(64) } as unknown as StoryShellPacket;
  assert.throws(() => verifyStoryShellPacket(forged), /tampered in flight/);
});

test('12D-241 the honest flags are stamped on every packet', () => {
  const packet = build();
  assert.equal(packet.guardrails.billionUsersProven, false);
  assert.equal(packet.guardrails.humanDecision, 'REQUIRED');
  assert.equal(packet.guardrails.zeroRemoteCalls, true);
  assert.equal(packet.guardrails.noTelemetryFieldOnAnyPacket, true);
  assert.equal(Object.isFrozen(packet.guardrails), true);
});

test('12D-241 distinct story inputs derive distinct packet digests (deterministic)', () => {
  const a = build();
  const b = build({ generatedAtMs: T0 + 1 });
  assert.notEqual(a.packetId, b.packetId);
  assert.equal(a.packetId, build().packetId); // same inputs → same digest
});