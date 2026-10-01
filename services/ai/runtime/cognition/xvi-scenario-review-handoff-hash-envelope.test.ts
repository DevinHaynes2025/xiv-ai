import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalizeScenarioReviewHandoff,
  evaluateScenarioReviewHandoffHashEnvelope,
  sha256HexUtf8,
} from "./xvi-scenario-review-handoff-hash-envelope";

const replayKey = "a".repeat(64);
const signatureSha = "b".repeat(64);
const now = "2026-10-01T16:20:00.000Z";

function handoff() {
  return {
    handoffId: "scenario-handoff:alpha",
    scenarioSetId: "scenario-set:alpha",
    tenantId: "tenant:alpha",
    userScopeId: "user-scope:alpha",
    runMode: "ONLINE_GOVERNED",
    destination: "UNIVERSE_SCENARIO_DETAIL",
    reason: "CLEAR_SCENARIO_EXPLORATION",
    replayKey,
    issuedAt: "2026-10-01T16:15:00.000Z",
    expiresAt: "2026-10-01T16:25:00.000Z",
    priorUses: [],
    revokedHandoffIds: [],
    zeroSecretContext: true,
    safeReadOnly: true,
    requiresUserGesture: true,
    canAutoNavigate: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
  } as const;
}

function envelope(overrides: Record<string, unknown> = {}) {
  const h = handoff();
  const digest = sha256HexUtf8(canonicalizeScenarioReviewHandoff(h));
  return {
    envelopeId: "scenario-envelope:alpha",
    handoff: h,
    payloadSha256: digest,
    signatureEvidence: {
      algorithm: "ED25519",
      publicKeyId: "public-key:test-vector-alpha",
      payloadSha256: digest,
      signatureSha256: signatureSha,
      signatureClaimVerified: true,
      verifiedAt: "2026-10-01T16:19:00.000Z",
      verifierClass: "TRUSTED_PUBLIC_KEY_VERIFIER",
    },
    zeroSecretContext: true,
    safeReadOnly: true,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
    ...overrides,
  };
}

test("pure SHA-256 matches the standard abc vector", () => {
  assert.equal(
    sha256HexUtf8("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
});

test("canonical payload is stable across set-like history ordering", () => {
  const a = {
    ...handoff(),
    priorUses: [
      { handoffId: "scenario-handoff:x", replayKey: "c".repeat(64), tenantId: "tenant:alpha", userScopeId: "user-scope:alpha", consumedAt: "2026-10-01T16:16:00.000Z" },
      { handoffId: "scenario-handoff:y", replayKey: "d".repeat(64), tenantId: "tenant:alpha", userScopeId: "user-scope:alpha", consumedAt: "2026-10-01T16:17:00.000Z" },
    ],
    revokedHandoffIds: ["scenario-handoff:z", "scenario-handoff:q"],
  };
  const b = {
    ...a,
    priorUses: [...a.priorUses].reverse(),
    revokedHandoffIds: [...a.revokedHandoffIds].reverse(),
  };
  assert.equal(canonicalizeScenarioReviewHandoff(a), canonicalizeScenarioReviewHandoff(b));
});

test("clean hash binding remains pending independent signature verification", () => {
  const receipt = evaluateScenarioReviewHandoffHashEnvelope(envelope(), now);
  assert.equal(receipt.status, "HASH_BOUND_PENDING_SIGNATURE");
  assert.equal(receipt.payloadHashMatches, true);
  assert.equal(receipt.signatureEvidencePayloadMatches, true);
  assert.equal(receipt.requiresIndependentSignatureVerification, true);
  assert.equal(receipt.canPresentDestination, false);
  assert.equal(receipt.navigationAuthority, false);
  assert.equal(receipt.executionAuthority, false);
});

test("all governed run modes preserve zero authority", () => {
  for (const runMode of ["ONLINE_GOVERNED", "OFFLINE_GOVERNED", "LOCAL_ONLY"] as const) {
    const h = { ...handoff(), runMode };
    const digest = sha256HexUtf8(canonicalizeScenarioReviewHandoff(h));
    const input = envelope({
      handoff: h,
      payloadSha256: digest,
      signatureEvidence: { ...envelope().signatureEvidence, payloadSha256: digest },
    });
    const receipt = evaluateScenarioReviewHandoffHashEnvelope(input, now);
    assert.equal(receipt.runMode, runMode);
    assert.equal(receipt.status, "HASH_BOUND_PENDING_SIGNATURE");
    assert.equal(receipt.canPresentDestination, false);
  }
});

test("tampered handoff content is quarantined by payload hash mismatch", () => {
  const original = envelope();
  const tamperedHandoff = {
    ...handoff(),
    destination: "NEEDS_YOU_SCENARIO_ASSUMPTIONS",
    reason: "ASSUMPTION_REVIEW_REQUIRED",
  } as const;
  const receipt = evaluateScenarioReviewHandoffHashEnvelope({
    ...original,
    handoff: tamperedHandoff,
  }, now);
  assert.equal(receipt.status, "QUARANTINED");
  assert.equal(receipt.payloadHashMatches, false);
});

test("signature evidence bound to another payload is quarantined", () => {
  const input = envelope();
  const receipt = evaluateScenarioReviewHandoffHashEnvelope({
    ...input,
    signatureEvidence: { ...input.signatureEvidence, payloadSha256: "c".repeat(64) },
  }, now);
  assert.equal(receipt.status, "QUARANTINED");
  assert.equal(receipt.signatureEvidencePayloadMatches, false);
});

test("unverified signature claim cannot become trusted", () => {
  const input = envelope();
  const receipt = evaluateScenarioReviewHandoffHashEnvelope({
    ...input,
    signatureEvidence: { ...input.signatureEvidence, signatureClaimVerified: false },
  }, now);
  assert.equal(receipt.status, "QUARANTINED");
  assert.equal(receipt.signatureClaimConsistent, false);
});

test("signature verification time before issuance fails closed", () => {
  const input = envelope();
  assert.throws(() => evaluateScenarioReviewHandoffHashEnvelope({
    ...input,
    signatureEvidence: { ...input.signatureEvidence, verifiedAt: "2026-10-01T16:14:59.000Z" },
  }, now), /VERIFICATION_TIME_INVALID/);
});

test("signature verification time after current time fails closed", () => {
  const input = envelope();
  assert.throws(() => evaluateScenarioReviewHandoffHashEnvelope({
    ...input,
    signatureEvidence: { ...input.signatureEvidence, verifiedAt: "2026-10-01T16:21:00.000Z" },
  }, now), /VERIFICATION_TIME_INVALID/);
});

test("expired handoff envelope is quarantined", () => {
  const receipt = evaluateScenarioReviewHandoffHashEnvelope(envelope(), "2026-10-01T16:25:00.000Z");
  assert.equal(receipt.handoffStatus, "EXPIRED");
  assert.equal(receipt.status, "QUARANTINED");
});

test("replayed handoff envelope is quarantined", () => {
  const h = {
    ...handoff(),
    priorUses: [{
      handoffId: "scenario-handoff:prior",
      replayKey,
      tenantId: "tenant:alpha",
      userScopeId: "user-scope:alpha",
      consumedAt: "2026-10-01T16:18:00.000Z",
    }],
  };
  const digest = sha256HexUtf8(canonicalizeScenarioReviewHandoff(h));
  const input = envelope({
    handoff: h,
    payloadSha256: digest,
    signatureEvidence: { ...envelope().signatureEvidence, payloadSha256: digest },
  });
  const receipt = evaluateScenarioReviewHandoffHashEnvelope(input, now);
  assert.equal(receipt.handoffStatus, "REPLAYED");
  assert.equal(receipt.status, "QUARANTINED");
});

test("revoked handoff envelope is quarantined", () => {
  const h = { ...handoff(), revokedHandoffIds: ["scenario-handoff:alpha"] };
  const digest = sha256HexUtf8(canonicalizeScenarioReviewHandoff(h));
  const input = envelope({
    handoff: h,
    payloadSha256: digest,
    signatureEvidence: { ...envelope().signatureEvidence, payloadSha256: digest },
  });
  const receipt = evaluateScenarioReviewHandoffHashEnvelope(input, now);
  assert.equal(receipt.handoffStatus, "REVOKED");
  assert.equal(receipt.status, "QUARANTINED");
});

test("envelope authority escalation is refused", () => {
  assert.throws(() => evaluateScenarioReviewHandoffHashEnvelope({
    ...envelope(),
    executionAuthority: true,
  }, now), /AUTHORITY_VIOLATION/);
});

test("accessor-bearing envelope fails without executing getter", () => {
  let hits = 0;
  const hostile: Record<string, unknown> = { ...envelope() };
  Object.defineProperty(hostile, "envelopeId", {
    enumerable: true,
    get() {
      hits += 1;
      return "scenario-envelope:alpha";
    },
  });
  assert.throws(() => evaluateScenarioReviewHandoffHashEnvelope(hostile, now), /ACCESSOR_FORBIDDEN/);
  assert.equal(hits, 0);
});

test("accessor-bearing signature evidence fails without executing getter", () => {
  let hits = 0;
  const input = envelope();
  const hostileEvidence: Record<string, unknown> = { ...input.signatureEvidence };
  Object.defineProperty(hostileEvidence, "publicKeyId", {
    enumerable: true,
    get() {
      hits += 1;
      return "public-key:test-vector-alpha";
    },
  });
  assert.throws(() => evaluateScenarioReviewHandoffHashEnvelope({
    ...input,
    signatureEvidence: hostileEvidence,
  }, now), /ACCESSOR_FORBIDDEN/);
  assert.equal(hits, 0);
});

test("extra envelope fields fail exact-schema validation", () => {
  assert.throws(() => evaluateScenarioReviewHandoffHashEnvelope({
    ...envelope(),
    debug: true,
  }, now), /SCHEMA_MISMATCH/);
});