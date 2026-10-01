import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateScenarioReviewHandoff,
  validateScenarioReviewHandoffInput,
} from "./xvi-scenario-review-handoff-receipt";

const replayKey = "a".repeat(64);
const now = "2026-10-01T16:20:00.000Z";

function baseInput() {
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

test("valid governed handoff remains non-authoritative", () => {
  const receipt = evaluateScenarioReviewHandoff(baseInput(), now);
  assert.equal(receipt.status, "VALID");
  assert.equal(receipt.canPresentDestination, true);
  assert.equal(receipt.canAutoNavigate, false);
  assert.equal(receipt.navigationAuthority, false);
  assert.equal(receipt.executionAuthority, false);
  assert.equal(receipt.mutationAuthority, false);
  assert.equal(receipt.productionAuthority, false);
});

test("all governed run modes are accepted", () => {
  for (const runMode of ["ONLINE_GOVERNED", "OFFLINE_GOVERNED", "LOCAL_ONLY"] as const) {
    const receipt = evaluateScenarioReviewHandoff({ ...baseInput(), runMode }, now);
    assert.equal(receipt.runMode, runMode);
    assert.equal(receipt.status, "VALID");
  }
});

test("assumption review binds to Needs You assumptions", () => {
  const receipt = evaluateScenarioReviewHandoff({
    ...baseInput(),
    destination: "NEEDS_YOU_SCENARIO_ASSUMPTIONS",
    reason: "ASSUMPTION_REVIEW_REQUIRED",
  }, now);
  assert.equal(receipt.requiresHumanReview, true);
  assert.equal(receipt.canPresentDestination, true);
});

test("evidence review binds to Needs You evidence", () => {
  const receipt = evaluateScenarioReviewHandoff({
    ...baseInput(),
    destination: "NEEDS_YOU_SCENARIO_EVIDENCE",
    reason: "EVIDENCE_REVIEW_REQUIRED",
  }, now);
  assert.equal(receipt.requiresHumanReview, true);
});

test("destination and reason mismatch fails closed", () => {
  assert.throws(() => validateScenarioReviewHandoffInput({
    ...baseInput(),
    destination: "NEEDS_YOU_SCENARIO_EVIDENCE",
  }), /DESTINATION_REASON_MISMATCH/);
});

test("TTL above fifteen minutes is refused", () => {
  assert.throws(() => validateScenarioReviewHandoffInput({
    ...baseInput(),
    expiresAt: "2026-10-01T16:31:00.000Z",
  }), /TTL_INVALID/);
});

test("expired handoff cannot present destination and requires renewal", () => {
  const receipt = evaluateScenarioReviewHandoff(baseInput(), "2026-10-01T16:25:00.000Z");
  assert.equal(receipt.status, "EXPIRED");
  assert.equal(receipt.canPresentDestination, false);
  assert.equal(receipt.requiresRenewal, true);
});

test("same-scope replay key is detected and quarantined", () => {
  const receipt = evaluateScenarioReviewHandoff({
    ...baseInput(),
    priorUses: [{
      handoffId: "scenario-handoff:prior",
      replayKey,
      tenantId: "tenant:alpha",
      userScopeId: "user-scope:alpha",
      consumedAt: "2026-10-01T16:18:00.000Z",
    }],
  }, now);
  assert.equal(receipt.status, "REPLAYED");
  assert.equal(receipt.replayDetected, true);
  assert.equal(receipt.quarantineHandoff, true);
  assert.equal(receipt.canPresentDestination, false);
});

test("same replay key in another tenant does not contaminate current scope", () => {
  const receipt = evaluateScenarioReviewHandoff({
    ...baseInput(),
    priorUses: [{
      handoffId: "scenario-handoff:other-tenant",
      replayKey,
      tenantId: "tenant:beta",
      userScopeId: "user-scope:alpha",
      consumedAt: "2026-10-01T16:18:00.000Z",
    }],
  }, now);
  assert.equal(receipt.status, "VALID");
  assert.equal(receipt.replayDetected, false);
});

test("same replay key in another user scope does not contaminate current user", () => {
  const receipt = evaluateScenarioReviewHandoff({
    ...baseInput(),
    priorUses: [{
      handoffId: "scenario-handoff:other-user",
      replayKey,
      tenantId: "tenant:alpha",
      userScopeId: "user-scope:beta",
      consumedAt: "2026-10-01T16:18:00.000Z",
    }],
  }, now);
  assert.equal(receipt.status, "VALID");
  assert.equal(receipt.replayDetected, false);
});

test("handoff ID scope collision fails closed", () => {
  assert.throws(() => validateScenarioReviewHandoffInput({
    ...baseInput(),
    priorUses: [{
      handoffId: "scenario-handoff:alpha",
      replayKey: "b".repeat(64),
      tenantId: "tenant:beta",
      userScopeId: "user-scope:alpha",
      consumedAt: "2026-10-01T16:18:00.000Z",
    }],
  }), /SCOPE_COLLISION/);
});

test("revocation dominates valid lease", () => {
  const receipt = evaluateScenarioReviewHandoff({
    ...baseInput(),
    revokedHandoffIds: ["scenario-handoff:alpha"],
  }, now);
  assert.equal(receipt.status, "REVOKED");
  assert.equal(receipt.revoked, true);
  assert.equal(receipt.quarantineHandoff, true);
  assert.equal(receipt.canPresentDestination, false);
});

test("future-issued handoff fails closed", () => {
  assert.throws(() => evaluateScenarioReviewHandoff({
    ...baseInput(),
    issuedAt: "2026-10-01T16:21:00.000Z",
    expiresAt: "2026-10-01T16:25:00.000Z",
  }, now), /ISSUED_IN_FUTURE/);
});

test("authority escalation is refused", () => {
  assert.throws(() => validateScenarioReviewHandoffInput({
    ...baseInput(),
    canAutoNavigate: true,
  }), /AUTHORITY_VIOLATION/);
  assert.throws(() => validateScenarioReviewHandoffInput({
    ...baseInput(),
    executionAuthority: true,
  }), /AUTHORITY_VIOLATION/);
});

test("accessor-bearing input fails without executing getter", () => {
  let hits = 0;
  const hostile: Record<string, unknown> = { ...baseInput() };
  Object.defineProperty(hostile, "tenantId", {
    enumerable: true,
    get() {
      hits += 1;
      return "tenant:alpha";
    },
  });
  assert.throws(() => validateScenarioReviewHandoffInput(hostile), /ACCESSOR_FORBIDDEN/);
  assert.equal(hits, 0);
});
