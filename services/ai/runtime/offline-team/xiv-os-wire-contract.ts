// 12D-241 — XIV OS Wire Contract v1: the fail-closed packet shapes shared by
// the web FRONT END (Next.js/React per the Master Plan prototype blueprint)
// and the BACKEND (FastAPI contract scaffolds). This is the ONLY sanctioned
// way a XIV OS surface presents a story, an avatar, or a decision surface.
//
// Why a wire contract: the Master Plan's prototype chapter calls for mobile +
// web experiences sharing "a brand and trust layer but different permissions,
// privacy expectations and interface design" (12D-239 carries the trust
// layer). This contract is that trust layer AT THE WIRE: every packet is
// digest-bound, exact-shaped, honest-flagged, and verifiable INDEPENDENTLY on
// either side of the boundary — the UI re-derives, the backend re-derives,
// and a tampered packet refuses BOTH ways. The front end never trusts a
// packet it did not verify; the backend never emits one it cannot re-derive.
//
// Fail-closed by construction:
//   * The exact-shape gate (hasExactKeys) runs FIRST on every verify.
//   * An embedded avatar is REQUIRED to be a verified 12D-239 identity —
//     the wire re-runs the avatar's own digest derivation (domain-tagged);
//     an impersonated or tampered avatar refuses the whole packet.
//   * `humanDecision: 'REQUIRED'` is a pinned field on every packet — a
//     surface that hides it is malformed by definition.
//   * Secrets never enter: credential-shaped KEYS refuse before validation;
//     credential-shaped TEXT (headline, body) refuses as well.
//   * The contract carries statements; it does not GENERATE them. The story
//     engine's language generation remains a future, separately reviewed
//     story (the 12D-239 residual carries over) — `modelCalls: 0` by
//     construction here.
//   * LOCAL plane only: `remoteCalls: 0`. This file is the wire SHAPE — it
//     performs no transport, no fetch, no socket, ever.
//
// The 2,000,000 rows/database remains the ONLY measured ceiling; nothing in
// this contract asserts scale, quantum capability, or hardware compatibility
// (those live in 12D-240's honest DECLARED-not-proven registry).

import { createHash } from 'crypto';
import {
  verifyAvatarIdentity, type AvatarIdentity,
} from './xiv-avatar';

export const XIV_OS_WIRE_POLICY = Object.freeze({
  policyVersion: '12d-241-v1',
  wireVersion: 1 as const,
  maxHeadlineChars: 256,
  maxBodyChars: 8192,
  maxStoryIdChars: 96,
});

export const XIV_OS_WIRE_GUARDRAILS = Object.freeze({
  frontEndNeverTrustsUnverifiedPackets: true,
  backendNeverEmitsUnreDerivablePackets: true,
  humanDecisionPinnedRequired: true,
  noTelemetryFieldOnAnyPacket: true,
  collectsNothing: true, // mental-health-second pillar, AT the wire
  avatarMustBeAVerifiedIdentity: true,
  secretsNeverEnter: true,
  statementsAreOperatorAuthored: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const WIRE_DOMAIN = 'XIV_OS_STORY_SHELL_WIRE';

const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

const hasExactKeys = (obj: unknown, keys: readonly string[]): boolean =>
  typeof obj === 'object' && obj !== null
  && JSON.stringify(Object.keys(obj).sort()) === JSON.stringify([...keys].sort());

const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

const STORY_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{7,95}$/;
const SECRET_KEY_RE = /(secret|password|passwd|token|credential|passphrase|privatekey|apikey|api-key|signature)/i;
const SECRET_CONTENT_RE = /(-----BEGIN [A-Z ]+PRIVATE KEY-----|sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16})/;

const textOk = (v: unknown, min: number, max: number): v is string =>
  typeof v === 'string' && v.length >= min && v.length <= max;

export interface StoryShellPacket {
  readonly schemaVersion: 1;
  readonly policyVersion: string;
  /** sha256 over the canonical packet — re-derived by verifyStoryShellPacket. */
  readonly packetId: string;
  readonly storyId: string;
  readonly headline: string;
  /** Operator-authored story text, presented verbatim — never generated here. */
  readonly bodyText: string;
  readonly generatedAtMs: number;
  /** The avatar presenting this story, when one is on the surface. */
  readonly avatar: Readonly<AvatarIdentity> | null;
  readonly decisionSurface: Readonly<{
    readonly kind: 'APPROVAL_REQUIRED';
    readonly humanDecision: 'REQUIRED';
    /** What the human is deciding over — operator-authored scope text. */
    readonly decidingOver: string;
  }>;
  readonly guardrails: typeof XIV_OS_WIRE_GUARDRAILS;
}

const PACKET_INPUT_KEYS = [
  'storyId', 'headline', 'bodyText', 'generatedAtMs', 'avatar', 'decidingOver',
] as const;
const VERIFIED_PACKET_KEYS = [
  'schemaVersion', 'policyVersion', 'packetId', 'storyId', 'headline',
  'bodyText', 'generatedAtMs', 'avatar', 'decisionSurface', 'guardrails',
] as const;

/** The packet digest covers EVERY declared input, in a fixed key order. */
const derivePacketDigest = (input: Readonly<{
  storyId: string; headline: string; bodyText: string;
  generatedAtMs: number; avatar: Readonly<AvatarIdentity> | null; decidingOver: string;
}>): string => sha256(JSON.stringify({
  domain: WIRE_DOMAIN,
  wireVersion: 1,
  storyId: input.storyId,
  headline: input.headline,
  bodyText: input.bodyText,
  generatedAtMs: input.generatedAtMs,
  avatarId: input.avatar === null ? null : input.avatar.avatarId,
  decidingOver: input.decidingOver,
}));

const validateContentSecrets = (label: string, value: string): void => {
  if (SECRET_CONTENT_RE.test(value))
    throw new Error(`the ${label} carries credential-shaped content; the wire never carries secrets; fail closed`);
};

/**
 * Build one story-shell packet. The avatar (when present) is VERIFIED under
 * the 12D-239 contract before the packet digest is derived — an impersonated
 * avatar never reaches the wire.
 */
export function buildStoryShellPacket(input: Readonly<{
  storyId: string;
  headline: string;
  bodyText: string;
  generatedAtMs: number;
  avatar: Readonly<AvatarIdentity> | null;
  decidingOver: string;
}>): Readonly<StoryShellPacket> {
  for (const key of Object.keys(input)) {
    if (SECRET_KEY_RE.test(key))
      throw new Error(`credential-shaped key ${JSON.stringify(key)} is refused; the wire never carries secrets; fail closed`);
  }
  if (!hasExactKeys(input, PACKET_INPUT_KEYS))
    throw new Error(`a story-shell packet must have exactly the keys ${PACKET_INPUT_KEYS.join(', ')}; fail closed`);
  if (typeof input.storyId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{7,95}$/.test(input.storyId))
    throw new Error('storyId must match ^[A-Za-z0-9][A-Za-z0-9_.:-]{7,95}$; fail closed');
  if (!textOk(input.headline, 8, XIV_OS_WIRE_POLICY.maxHeadlineChars))
    throw new Error(`headline must be a string of 8..${XIV_OS_WIRE_POLICY.maxHeadlineChars} chars; fail closed`);
  validateContentSecrets('headline', input.headline);
  if (!textOk(input.bodyText, 1, XIV_OS_WIRE_POLICY.maxBodyChars))
    throw new Error(`bodyText must be a string of 1..${XIV_OS_WIRE_POLICY.maxBodyChars} chars; fail closed`);
  validateContentSecrets('bodyText', input.bodyText);
  if (!textOk(input.decidingOver, 8, 512))
    throw new Error('decidingOver must be a string of 8..512 chars; fail closed');
  validateContentSecrets('decidingOver', input.decidingOver);
  if (!safeInt(input.generatedAtMs))
    throw new Error('generatedAtMs must be a safe integer; fail closed');
  if (input.avatar !== null) verifyAvatarIdentity(input.avatar);

  const packetId = sha256(JSON.stringify({
    domain: WIRE_DOMAIN,
    wireVersion: 1,
    storyId: input.storyId,
    headline: input.headline,
    bodyText: input.bodyText,
    generatedAtMs: input.generatedAtMs,
    avatarId: input.avatar === null ? null : input.avatar.avatarId,
    decidingOver: input.decidingOver,
  }));

  return Object.freeze({
    schemaVersion: 1 as const,
    policyVersion: XIV_OS_WIRE_POLICY.policyVersion,
    packetId,
    storyId: input.storyId,
    headline: input.headline,
    bodyText: input.bodyText,
    generatedAtMs: input.generatedAtMs,
    avatar: input.avatar === null ? null : Object.freeze(input.avatar),
    decisionSurface: Object.freeze({
      kind: 'APPROVAL_REQUIRED' as const,
      humanDecision: 'REQUIRED' as const,
      decidingOver: input.decidingOver,
    }),
    guardrails: XIV_OS_WIRE_GUARDRAILS,
  });
}

/**
 * Verify a packet received over the wire (either direction). The digest
 * re-derives from the packet's OWN declared fields; any tamper — a headline,
 * body, avatar id, or decision surface edited in flight — refuses.
 */
export function verifyStoryShellPacket(
  packet: Readonly<StoryShellPacket>,
): Readonly<{ ok: boolean; packetId: string }> {
  if (!hasExactKeys(packet, VERIFIED_PACKET_KEYS))
    throw new Error('story-shell packet shape mismatch; fail closed');
  if (packet.schemaVersion !== 1 || packet.policyVersion !== XIV_OS_WIRE_POLICY.policyVersion)
    throw new Error('unknown story-shell wire version; fail closed');
  // Guardrails are compared BY VALUE, not reference: a packet arriving over a
  // real transport is a fresh object (JSON round-trip) and MUST still verify —
  // the "verifiable independently on BOTH sides" property is structural.
  for (const key of Object.keys(XIV_OS_WIRE_GUARDRAILS) as (keyof typeof XIV_OS_WIRE_GUARDRAILS)[]) {
    if (packet.guardrails[key] !== XIV_OS_WIRE_GUARDRAILS[key])
      throw new Error(`story-shell packet guardrails mismatch at ${key}; fail closed`);
  }
  if (packet.decisionSurface.humanDecision !== 'REQUIRED' || packet.decisionSurface.kind !== 'APPROVAL_REQUIRED')
    throw new Error("the decision surface is pinned to humanDecision 'REQUIRED' over APPROVAL_REQUIRED; fail closed");
  if (packet.avatar !== null) verifyAvatarIdentity(packet.avatar);
  const rederived = sha256(JSON.stringify({
    domain: WIRE_DOMAIN,
    wireVersion: 1,
    storyId: packet.storyId,
    headline: packet.headline,
    bodyText: packet.bodyText,
    generatedAtMs: packet.generatedAtMs,
    avatarId: packet.avatar === null ? null : packet.avatar.avatarId,
    decidingOver: packet.decisionSurface.decidingOver,
  }));
  if (rederived !== packet.packetId)
    throw new Error('story-shell packet digest mismatch — tampered in flight; fail closed');
  return Object.freeze({ ok: true, packetId: packet.packetId });
}