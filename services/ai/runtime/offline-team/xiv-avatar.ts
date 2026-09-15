// 12D-239 — XIV AI Avatar Representative: the ONLY representation layer permitted
// to present "XIV AI" to an end user, fail-closed by construction. The avatar is
// the END-USER-FIRST face of the platform (per the CEO's direction: the OS serves
// the end user first, then organizations) and carries the master plan's pillars
// verbatim — SECURITY FIRST, MENTAL HEALTH SECOND (wellbeing without
// surveillance), COMMUNITY, WEALTH.
//
// What this contract guarantees, as frozen structural flags (never claims):
//   * NEVER IMPERSONATES A HUMAN: `presentedAsHuman` is pinned to false and is
//     not an accepted input — every speech packet is stamped
//     `spokenBy: 'XIV_AI_AVATAR'`.
//   * STATEMENTS ARE OPERATOR-AUTHORED: the avatar does NOT generate language
//     in this story. A statement is operator-authored text presented verbatim,
//     and requires an explicit operator consent reference for EVERY appearance.
//     Language generation is a FUTURE, separately reviewed story (disclosed
//     residual). Nothing here calls a model — `modelCalls: 0` by construction.
//   * WELLBEING WITHOUT SURVEILLANCE: the avatar layer collects nothing — no
//     analytics, no telemetry, no viewer state. `collectsNothing: true`.
//   * SECRETS NEVER ENTER: the exact-shape gate refuses any key that looks like
//     a credential before anything else, and credential-shaped statement
//     content is refused as well.
//   * LOCAL plane only: `remoteCalls: 0` — the avatar renders and speaks from
//     the local runtime; it calls nothing remote, ever.
//
// The avatar's visual is DETERMINISTIC: derived from the identity digest (same
// identity → same visual; a different identity is visibly a different avatar).
// No randomness, no generation, no fetch.

import { createHash } from 'crypto';

export const XIV_AVATAR_POLICY = Object.freeze({
  policyVersion: '12d-239-v1',
  displayName: 'XIV AI' as const,
  maxStatementChars: 2048,
  minConsentRefChars: 8,
  maxScopeChars: 256,
});

export const XIV_AVATAR_GUARDRAILS = Object.freeze({
  neverImpersonatesAHuman: true,
  presentedAsHuman: false, // pinned; not an accepted input
  statementsAreOperatorAuthored: true,
  consentRequiredForEveryStatement: true,
  wellbeingWithoutSurveillance: true,
  collectsNothing: true,
  avatarNeverCarriesSecrets: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const AVATAR_DOMAIN = 'XIV_AVATAR_REPRESENTATIVE';

/** Credential-shaped keys are refused BEFORE any other validation. */
const SECRET_KEY_RE = /(secret|password|passwd|token|credential|passphrase|privatekey|apikey|api-key|signature)/i;
/** Secret-shaped content inside a statement is refused too (fail closed). */
const SECRET_CONTENT_RE = /(-----BEGIN [A-Z ]+PRIVATE KEY-----|sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16})/;

const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

const hasExactKeys = (obj: unknown, keys: readonly string[]): boolean =>
  typeof obj === 'object' && obj !== null
  && JSON.stringify(Object.keys(obj).sort()) === JSON.stringify([...keys].sort());

const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

export interface AvatarIdentity {
  /** sha256 over the canonical identity — re-derived by verifyAvatarIdentity. */
  readonly avatarId: string;
  readonly displayName: 'XIV AI';
  readonly presentedAsHuman: false;
  readonly representationScope: string;
  readonly operator: string;
  readonly createdAtMs: number;
  readonly avatarDigest: string;
  readonly guardrails: typeof XIV_AVATAR_GUARDRAILS;
}

const IDENTITY_KEYS = ['representationScope', 'operator', 'createdAtMs'] as const;
const VERIFIED_IDENTITY_KEYS = [
  'avatarId', 'displayName', 'presentedAsHuman', 'representationScope',
  'operator', 'createdAtMs', 'avatarDigest', 'guardrails',
] as const;

/** The avatar digest covers EVERY declared input, in a fixed key order. */
const deriveAvatarIdentityDigest = (
  input: Readonly<{ representationScope: string; operator: string; createdAtMs: number }>,
): string => sha256(JSON.stringify({
  domain: AVATAR_DOMAIN,
  displayName: XIV_AVATAR_POLICY.displayName,
  representationScope: input.representationScope,
  operator: input.operator,
  createdAtMs: input.createdAtMs,
}));

/**
 * Create the XIV AI avatar identity. The exact-shape gate runs FIRST; any
 * credential-shaped key is refused outright (the avatar never carries secrets).
 */
export function createAvatarIdentity(
  input: Readonly<{ representationScope: string; operator: string; createdAtMs: number }>,
): Readonly<AvatarIdentity> {
  for (const key of Object.keys(input)) {
    if (SECRET_KEY_RE.test(key)) throw new Error(`credential-shaped key ${JSON.stringify(key)} is refused; the avatar never carries secrets; fail closed`);
  }
  if (!hasExactKeys(input, IDENTITY_KEYS))
    throw new Error(`avatar identity must have exactly the keys ${IDENTITY_KEYS.join(', ')}; fail closed`);
  if (typeof input.representationScope !== 'string'
    || input.representationScope.length < 8
    || input.representationScope.length > XIV_AVATAR_POLICY.maxScopeChars)
    throw new Error(`representationScope must be a string of 8..${XIV_AVATAR_POLICY.maxScopeChars} chars; fail closed`);
  if (typeof input.operator !== 'string' || input.operator.length < 1 || input.operator.length > 128)
    throw new Error('operator must be a string of 1..128 chars; fail closed');
  if (!safeInt(input.createdAtMs))
    throw new Error('createdAtMs must be a safe integer; fail closed');

  const avatarDigest = deriveAvatarIdentityDigest(input);
  return Object.freeze({
    avatarId: avatarDigest, // the id IS the digest — re-derived, never invented
    displayName: XIV_AVATAR_POLICY.displayName,
    presentedAsHuman: false as const,
    representationScope: input.representationScope,
    operator: input.operator,
    createdAtMs: input.createdAtMs,
    avatarDigest,
    guardrails: XIV_AVATAR_GUARDRAILS,
  });
}

/** Read-only verification: the digest re-derives from the declared inputs. */
export function verifyAvatarIdentity(
  identity: Readonly<AvatarIdentity>,
): Readonly<{ ok: boolean; avatarId: string }> {
  if (!hasExactKeys(identity, VERIFIED_IDENTITY_KEYS))
    throw new Error('avatar identity shape mismatch; fail closed');
  if (identity.displayName !== XIV_AVATAR_POLICY.displayName)
    throw new Error(`the avatar is presented as ${JSON.stringify(XIV_AVATAR_POLICY.displayName)}; impersonation refused; fail closed`);
  if (identity.presentedAsHuman !== false)
    throw new Error('the XIV AI avatar is never presented as a human; fail closed');
  const rederived = deriveAvatarIdentityDigest({
    representationScope: identity.representationScope,
    operator: identity.operator,
    createdAtMs: identity.createdAtMs,
  });
  if (rederived !== identity.avatarDigest || identity.avatarId !== identity.avatarDigest)
    throw new Error('avatar identity digest mismatch — the identity has been tampered with; fail closed');
  return Object.freeze({ ok: true, avatarId: identity.avatarId });
}

export interface AvatarSpeechPacket {
  readonly schemaVersion: 1;
  readonly policyVersion: string;
  /** Pinned — the avatar never speaks under a human's name. */
  readonly spokenBy: 'XIV_AI_AVATAR';
  readonly avatarId: string;
  /** Operator-authored text, presented verbatim (no generation in this story). */
  readonly statement: string;
  /** The operator consent reference that authorized THIS statement. */
  readonly consentRef: string;
  readonly atMs: number;
  readonly guardrails: typeof XIV_AVATAR_GUARDRAILS;
}

const CONSENT_REF_RE = /^[A-Za-z0-9][A-Za-z0-9_.:@/-]{7,127}$/;

/**
 * Present one operator-authored statement under the avatar identity. Fail-closed:
 * a verified identity, a well-formed operator consent reference, and a
 * secret-free statement are all REQUIRED — a refused statement never renders.
 */
export function speakAsAvatar(input: Readonly<{
  identity: Readonly<AvatarIdentity>;
  consentRef: string;
  statement: string;
  atMs: number;
}>): Readonly<AvatarSpeechPacket> {
  for (const key of Object.keys(input)) {
    if (SECRET_KEY_RE.test(key)) throw new Error(`credential-shaped key ${JSON.stringify(key)} is refused; the avatar never carries secrets; fail closed`);
  }
  if (!hasExactKeys(input, ['identity', 'consentRef', 'statement', 'atMs']))
    throw new Error('avatar speech must have exactly the keys identity, consentRef, statement, atMs; fail closed');
  verifyAvatarIdentity(input.identity);
  if (typeof input.consentRef !== 'string' || input.consentRef.length < XIV_AVATAR_POLICY.minConsentRefChars)
    throw new Error(`consentRef must be a string of at least ${XIV_AVATAR_POLICY.minConsentRefChars} chars — the avatar speaks only with operator consent; fail closed`);
  if (!CONSENT_REF_RE.test(input.consentRef))
    throw new Error('consentRef is malformed; fail closed');
  if (typeof input.statement !== 'string' || input.statement.length < 1 || input.statement.length > XIV_AVATAR_POLICY.maxStatementChars)
    throw new Error(`statement must be a string of 1..${XIV_AVATAR_POLICY.maxStatementChars} chars; fail closed`);
  if (SECRET_CONTENT_RE.test(input.statement))
    throw new Error('the statement carries credential-shaped content; the avatar never carries secrets; fail closed');
  if (!safeInt(input.atMs))
    throw new Error('atMs must be a safe integer; fail closed');

  return Object.freeze({
    schemaVersion: 1 as const,
    policyVersion: XIV_AVATAR_POLICY.policyVersion,
    spokenBy: 'XIV_AI_AVATAR' as const,
    avatarId: input.identity.avatarId,
    statement: input.statement,
    consentRef: input.consentRef,
    atMs: input.atMs,
    guardrails: XIV_AVATAR_GUARDRAILS,
  });
}

/**
 * The avatar's visual — a DETERMINISTIC local render from the identity digest
 * (same identity → same image; no randomness, no generation, no fetch).
 */
export function renderAvatarCard(identity: Readonly<AvatarIdentity>): string {
  verifyAvatarIdentity(identity);
  const hue = parseInt(identity.avatarId.slice(0, 4), 16) % 360;
  const hue2 = (hue + 48) % 360;
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" role="img" aria-label="XIV AI avatar">',
    '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">',
    `<stop offset="0" stop-color="hsl(${hue} 72% 22%)"/><stop offset="1" stop-color="hsl(${hue2} 68% 12%)"/>`,
    '</linearGradient></defs>',
    '<rect width="96" height="96" rx="20" fill="url(#g)"/>',
    `<path d="M48 18 L74 28 V50 C74 66 62 76 48 82 C34 76 22 66 22 50 V28 Z" fill="none" stroke="hsl(${hue} 90% 70%)" stroke-width="3"/>`,
    `<circle cx="48" cy="47" r="12" fill="hsl(${hue2} 85% 62%)"/>`,
    `<circle cx="48" cy="47" r="5" fill="hsl(${hue} 30% 10%)"/>`,
    `<text x="48" y="76" text-anchor="middle" font-family="system-ui" font-size="9" fill="hsl(${hue} 90% 88%)">XIV AI</text>`,
    '</svg>',
  ].join('');
}