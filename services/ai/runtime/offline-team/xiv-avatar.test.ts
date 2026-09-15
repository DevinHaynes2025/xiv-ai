// 12D-239 tests — adversarial coverage for the XIV AI avatar representative.
// Under test: the never-impersonation pin, operator-authored statements under
// per-statement consent, the no-secrets gate (keys AND content), digest
// re-derivation (tamper refuses), deterministic visuals, and the honest flags.
// Nothing here calls a network or a model.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  XIV_AVATAR_POLICY,
  XIV_AVATAR_GUARDRAILS,
  createAvatarIdentity,
  verifyAvatarIdentity,
  speakAsAvatar,
  renderAvatarCard,
  type AvatarIdentity,
} from './xiv-avatar';

const T0 = 1_000_000_000;
const SCOPE = 'presents governed XIV AI orientation and platform honesty flags to end users';
const CONSENT = 'consent-ref-001';

const make = (overrides?: Partial<{ representationScope: string; operator: string; createdAtMs: number }>) =>
  createAvatarIdentity({
    representationScope: SCOPE,
    operator: 'devin',
    createdAtMs: T0,
    ...overrides,
  });

test('12D-239 policy and guardrails match the charter and are frozen', () => {
  assert.equal(XIV_AVATAR_POLICY.policyVersion, '12d-239-v1');
  assert.equal(XIV_AVATAR_POLICY.displayName, 'XIV AI');
  assert.equal(XIV_AVATAR_GUARDRAILS.neverImpersonatesAHuman, true);
  assert.equal(XIV_AVATAR_GUARDRAILS.presentedAsHuman, false);
  assert.equal(XIV_AVATAR_GUARDRAILS.statementsAreOperatorAuthored, true);
  assert.equal(XIV_AVATAR_GUARDRAILS.consentRequiredForEveryStatement, true);
  assert.equal(XIV_AVATAR_GUARDRAILS.wellbeingWithoutSurveillance, true);
  assert.equal(XIV_AVATAR_GUARDRAILS.collectsNothing, true);
  assert.equal(XIV_AVATAR_GUARDRAILS.avatarNeverCarriesSecrets, true);
  assert.equal(XIV_AVATAR_GUARDRAILS.zeroModelCalls, true);
  assert.equal(XIV_AVATAR_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(XIV_AVATAR_GUARDRAILS.automaticRecovery, false);
  assert.equal(XIV_AVATAR_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(Object.isFrozen(XIV_AVATAR_POLICY), true);
  assert.equal(Object.isFrozen(XIV_AVATAR_GUARDRAILS), true);
});

test('12D-239 the identity pins presentedAsHuman:false and the digest id re-derives', () => {
  const identity = make();
  assert.equal(identity.displayName, 'XIV AI');
  assert.equal(identity.presentedAsHuman, false);
  assert.match(identity.avatarId, /^[0-9a-f]{64}$/);
  assert.equal(identity.avatarId, identity.avatarDigest);
  assert.equal(Object.isFrozen(identity), true);
  const verdict = verifyAvatarIdentity(identity);
  assert.equal(verdict.ok, true);
  assert.equal(verdict.avatarId, identity.avatarId);
});

test('12D-239 distinct identities derive distinct digests (deterministic, no randomness)', () => {
  const a = make();
  const b = make({ createdAtMs: T0 + 1 });
  assert.notEqual(a.avatarId, b.avatarId);
  // Same inputs → same digest (the derivation is pure).
  assert.equal(a.avatarId, make().avatarId);
});

test('12D-239 a tampered identity refuses verification', () => {
  const identity = make();
  const forged = { ...identity, representationScope: SCOPE.replace('end users', 'everyone') };
  assert.throws(() => verifyAvatarIdentity(forged as AvatarIdentity), /digest mismatch.*tampered/);
  // A forged avatarId/digest pair refuses too.
  const forged2 = { ...identity, avatarId: 'f'.repeat(64) } as unknown as AvatarIdentity;
  assert.throws(() => verifyAvatarIdentity(forged2), /digest mismatch/);
});

test('12D-239 impersonation is refused: no human name, no presentedAsHuman override', () => {
  const identity = make();
  const forged = { ...identity, displayName: 'Devin Haynes' };
  assert.throws(() => verifyAvatarIdentity(forged as AvatarIdentity), /impersonation refused/);
  const forged2 = { ...identity, presentedAsHuman: true };
  assert.throws(() => verifyAvatarIdentity(forged2 as AvatarIdentity), /never presented as a human/);
  // And the shape gate refuses an identity that ADDS a human-name field.
  assert.throws(
    () => verifyAvatarIdentity({ ...identity, humanName: 'Devin' } as unknown as AvatarIdentity),
    /shape mismatch/,
  );
});

test('12D-239 credential-shaped keys refuse before anything else', () => {
  assert.throws(
    () => createAvatarIdentity({ representationScope: SCOPE, operator: 'devin', createdAtMs: T0, apiKey: 'x' } as never),
    /credential-shaped key "apiKey".*never carries secrets/,
  );
  assert.throws(
    () => speakAsAvatar({ identity: make(), consentRef: CONSENT_REF(), statement: 'hi', atMs: T0, password: 'x' } as never),
    /credential-shaped key "password"/,
  );
});

const CONSENT_REF = () => 'consent/2026-09-15/001';

test('12D-239 speakAsAvatar produces an honest packet under operator consent', () => {
  const identity = make();
  const packet = speakAsAvatar({
    identity,
    consentRef: CONSENT_REF(),
    statement: 'Hello — I am the XIV AI representative. I present, I do not decide.',
    atMs: T0 + 100,
  });
  assert.equal(packet.spokenBy, 'XIV_AI_AVATAR'); // never a human's name
  assert.equal(packet.avatarId, identity.avatarId);
  assert.equal(packet.consentRef, CONSENT_REF());
  assert.equal(packet.schemaVersion, 1);
  assert.equal(packet.policyVersion, '12d-239-v1');
  assert.equal(packet.guardrails.zeroRemoteCalls, true);
  assert.equal(Object.isFrozen(packet), true);
});

test('12D-239 the avatar speaks ONLY with operator consent (every appearance)', () => {
  const identity = make();
  const statement = 'A statement that still needs consent.';
  assert.throws(
    () => speakAsAvatar({ identity, consentRef: '', statement, atMs: T0 }),
    /speaks only with operator consent/,
  );
  assert.throws(
    () => speakAsAvatar({ identity, consentRef: 'short', statement, atMs: T0 }),
    /speaks only with operator consent/,
  );
  assert.throws(
    () => speakAsAvatar({ identity, consentRef: 'bad ref with spaces!', statement, atMs: T0 }),
    /consentRef is malformed/,
  );
});

test('12D-239 the statement is operator-authored: no generation surface exists', () => {
  // The avatar presents verbatim text; an empty statement refuses, and an
  // oversized one refuses. There is no "generate" op anywhere in the contract.
  const identity = make();
  assert.throws(() => speakAsAvatar({ identity, consentRef: CONSENT_REF(), statement: '', atMs: T0 }), /1\.\.2048/);
  assert.throws(
    () => speakAsAvatar({ identity, consentRef: CONSENT_REF(), statement: 'x'.repeat(XIV_AVATAR_POLICY.maxStatementChars + 1), atMs: T0 }),
    /1\.\.2048/,
  );
});

test('12D-239 credential-shaped statement content refuses (fail closed)', () => {
  const identity = make();
  assert.throws(
    () => speakAsAvatar({
      identity, consentRef: CONSENT_REF(),
      statement: `use this key sk-abcdefghijklmnopqrstuvwxyz012345 ok`, atMs: T0,
    }),
    /credential-shaped content/,
  );
  assert.throws(
    () => speakAsAvatar({
      identity, consentRef: CONSENT_REF(),
      statement: `-----BEGIN OPENVPN PRIVATE KEY-----`, atMs: T0,
    }),
    /credential-shaped content/,
  );
});

test('12D-239 malformed calls fail closed', () => {
  assert.throws(
    () => createAvatarIdentity({ operator: 'devin', createdAtMs: T0 } as never),
    /exactly the keys/,
  );
  assert.throws(
    () => createAvatarIdentity({ representationScope: 'short', operator: 'devin', createdAtMs: T0 }),
    /representationScope/,
  );
  assert.throws(
    () => createAvatarIdentity({ representationScope: SCOPE, operator: 'devin', createdAtMs: 1.5 }),
    /createdAtMs/,
  );
  assert.throws(
    () => speakAsAvatar({ identity: make(), consentRef: CONSENT_REF(), statement: 'ok', atMs: T0, extra: 1 } as never),
    /exactly the keys/,
  );
  // A fabricated identity (never created by createAvatarIdentity) refuses.
  assert.throws(
    () => speakAsAvatar({
      identity: {
        avatarId: 'a'.repeat(64), displayName: 'XIV AI', presentedAsHuman: false,
        representationScope: SCOPE, operator: 'devin', createdAtMs: T0,
        avatarDigest: 'a'.repeat(64), guardrails: XIV_AVATAR_GUARDRAILS,
      },
      consentRef: CONSENT_REF(), statement: 'ok', atMs: T0,
    }),
    /digest mismatch/,
  );
});

test('12D-239 the visual is deterministic from the digest and differs across identities', () => {
  const a = make();
  const svg1 = renderAvatarCard(a);
  const svg2 = renderAvatarCard(make());
  assert.equal(svg1, svg2); // same identity → same image
  const svg3 = renderAvatarCard(make({ createdAtMs: T0 + 7 }));
  assert.notEqual(svg1, svg3); // a different identity is visibly a different avatar
  assert.match(svg1, /XIV AI/);
  assert.match(svg1, /<svg /);
  // The render is read-only: verification still passes afterwards.
  assert.equal(verifyAvatarIdentity(a).ok, true);
});

test('12D-239 end-to-end: consent-gated speech over a file-persisted identity chain', () => {
  // The avatar composes with the custody stack's honesty: a consent reference
  // the operator produced out of band is CARRIED, never invented here.
  const identity = make();
  const packet = speakAsAvatar({
    identity,
    consentRef: 'consent/2026-09-15/daily-001',
    statement: 'XIV AI serves the end user first; a human decides.',
    atMs: T0 + 100,
  });
  assert.equal(packet.guardrails.collectsNothing, true);
  assert.equal(packet.guardrails.wellbeingWithoutSurveillance, true);
  assert.equal(verifyAvatarIdentity(identity).ok, true);
  // CollectsNothing is structural: the packet shape has NO telemetry field.
  assert.deepEqual(
    Object.keys(packet).sort(),
    ['atMs', 'avatarId', 'consentRef', 'guardrails', 'policyVersion', 'schemaVersion', 'spokenBy', 'statement'],
  );
});