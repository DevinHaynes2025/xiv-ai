import test from "node:test";
import assert from "node:assert/strict";
import { planScenarioNavigation } from "./xvi-scenario-comparison-navigation";

const baseCard = {
  schemaVersion: "xvi-scenario-comparison-card-v1",
  modeLabel: "Online governed",
  reviewState: "CLEAR",
  primaryAction: "Explore scenarios",
  secondaryAction: "Ask XVI",
  route: "UNIVERSE",
  disclaimer: "Scenario analysis, not a prediction.",
  safeReadOnly: true,
  canMutate: false,
  canClaimExecution: false,
  canClaimTruth: false,
} as const;

function request(card: unknown) {
  return {
    card,
    safeReadOnly: true,
    canAutoNavigate: false,
    requiresUserGesture: true,
  } as const;
}

test("ONLINE_GOVERNED clear scenarios route to Universe detail", () => {
  const result = planScenarioNavigation(request(baseCard));
  assert.equal(result.runMode, "ONLINE_GOVERNED");
  assert.equal(result.destination, "UNIVERSE_SCENARIO_DETAIL");
  assert.equal(result.route, "UNIVERSE");
});

test("OFFLINE_GOVERNED clear scenarios stay locally navigable", () => {
  const result = planScenarioNavigation(request({ ...baseCard, modeLabel: "Offline governed" }));
  assert.equal(result.runMode, "OFFLINE_GOVERNED");
  assert.equal(result.destination, "UNIVERSE_SCENARIO_DETAIL");
});

test("LOCAL_ONLY clear scenarios stay locally navigable", () => {
  const result = planScenarioNavigation(request({ ...baseCard, modeLabel: "Local only" }));
  assert.equal(result.runMode, "LOCAL_ONLY");
  assert.equal(result.destination, "UNIVERSE_SCENARIO_DETAIL");
});

test("material assumption review routes to Needs You assumptions", () => {
  const result = planScenarioNavigation(request({
    ...baseCard,
    reviewState: "NEEDS_REVIEW",
    primaryAction: "Review assumptions",
    route: "NEEDS_YOU",
  }));
  assert.equal(result.destination, "NEEDS_YOU_SCENARIO_ASSUMPTIONS");
  assert.equal(result.reason, "ASSUMPTION_REVIEW_REQUIRED");
});

test("blocked evidence routes to Needs You evidence", () => {
  const result = planScenarioNavigation(request({
    ...baseCard,
    reviewState: "BLOCKED",
    primaryAction: "Review evidence",
    route: "NEEDS_YOU",
  }));
  assert.equal(result.destination, "NEEDS_YOU_SCENARIO_EVIDENCE");
  assert.equal(result.reason, "EVIDENCE_REVIEW_REQUIRED");
});

test("clear state cannot forge Needs You route", () => {
  assert.throws(() => planScenarioNavigation(request({ ...baseCard, route: "NEEDS_YOU" })), /CLEAR_ROUTE_MISMATCH/);
});

test("review state cannot forge Universe route", () => {
  assert.throws(() => planScenarioNavigation(request({
    ...baseCard,
    reviewState: "NEEDS_REVIEW",
    primaryAction: "Review assumptions",
  })), /REVIEW_ROUTE_MISMATCH/);
});

test("blocked state cannot use assumption action", () => {
  assert.throws(() => planScenarioNavigation(request({
    ...baseCard,
    reviewState: "BLOCKED",
    primaryAction: "Review assumptions",
    route: "NEEDS_YOU",
  })), /BLOCKED_ROUTE_MISMATCH/);
});

test("navigation never gains automatic authority", () => {
  const result = planScenarioNavigation(request(baseCard));
  assert.equal(result.requiresUserGesture, true);
  assert.equal(result.canAutoNavigate, false);
  assert.equal(result.navigationAuthority, false);
  assert.equal(result.executionAuthority, false);
  assert.equal(result.mutationAuthority, false);
  assert.equal(result.productionAuthority, false);
});

test("truth claim or mutation authority is refused", () => {
  assert.throws(() => planScenarioNavigation(request({ ...baseCard, canClaimTruth: true })), /CARD_AUTHORITY_VIOLATION/);
  assert.throws(() => planScenarioNavigation(request({ ...baseCard, canMutate: true })), /CARD_AUTHORITY_VIOLATION/);
});

test("prediction-like disclaimer replacement is refused", () => {
  assert.throws(() => planScenarioNavigation(request({ ...baseCard, disclaimer: "Prediction ready." })), /DISCLAIMER_INVALID/);
});

test("unknown mode label fails closed", () => {
  assert.throws(() => planScenarioNavigation(request({ ...baseCard, modeLabel: "Online unrestricted" })), /MODE_INVALID/);
});

test("outer automatic navigation authority is refused", () => {
  assert.throws(() => planScenarioNavigation({
    card: baseCard,
    safeReadOnly: true,
    canAutoNavigate: true,
    requiresUserGesture: true,
  }), /AUTHORITY_VIOLATION/);
});

test("accessor-bearing card fails without executing getter", () => {
  let hits = 0;
  const hostile: Record<string, unknown> = { ...baseCard };
  Object.defineProperty(hostile, "route", {
    enumerable: true,
    get() {
      hits += 1;
      return "UNIVERSE";
    },
  });
  assert.throws(() => planScenarioNavigation(request(hostile)), /ACCESSOR_FORBIDDEN/);
  assert.equal(hits, 0);
});
