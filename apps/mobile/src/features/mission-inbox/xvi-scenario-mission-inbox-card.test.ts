import test from "node:test";
import assert from "node:assert/strict";
import { presentScenarioMissionInboxCard } from "./xvi-scenario-mission-inbox-card_v203";

function navigation(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "xvi-scenario-navigation-v1",
    runMode: "ONLINE_GOVERNED",
    sourceSurface: "SCENARIO_COMPARISON_CARD",
    destination: "NEEDS_YOU_SCENARIO_ASSUMPTIONS",
    route: "NEEDS_YOU",
    userAction: "Review assumptions",
    secondaryAction: "Ask XVI",
    reason: "ASSUMPTION_REVIEW_REQUIRED",
    safeReadOnly: true,
    requiresUserGesture: true,
    canAutoNavigate: false,
    navigationAuthority: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
    ...overrides,
  };
}

function input(overrides: Record<string, unknown> = {}) {
  return {
    scenarioSetId: "scenario-set:alpha",
    navigation: navigation(),
    safeReadOnly: true,
    canAutoOpen: false,
    canClaimExecution: false,
    ...overrides,
  };
}

test("assumption review becomes a Needs You Mission Inbox card", () => {
  const card = presentScenarioMissionInboxCard(input());
  assert.equal(card.reviewKind, "ASSUMPTIONS");
  assert.equal(card.primaryAction, "Review assumptions");
  assert.equal(card.destination, "NEEDS_YOU_SCENARIO_ASSUMPTIONS");
  assert.equal(card.statusLabel, "Needs you");
});

test("evidence review becomes a blocked-evidence Mission Inbox card", () => {
  const card = presentScenarioMissionInboxCard(input({
    navigation: navigation({
      destination: "NEEDS_YOU_SCENARIO_EVIDENCE",
      userAction: "Review evidence",
      reason: "EVIDENCE_REVIEW_REQUIRED",
    }),
  }));
  assert.equal(card.reviewKind, "EVIDENCE");
  assert.equal(card.primaryAction, "Review evidence");
  assert.equal(card.destination, "NEEDS_YOU_SCENARIO_EVIDENCE");
});

test("OFFLINE_GOVERNED is preserved without implying execution", () => {
  const card = presentScenarioMissionInboxCard(input({
    navigation: navigation({ runMode: "OFFLINE_GOVERNED" }),
  }));
  assert.equal(card.runMode, "OFFLINE_GOVERNED");
  assert.match(card.body, /Offline governed/);
  assert.equal(card.executionAuthority, false);
});

test("LOCAL_ONLY is preserved without implying execution", () => {
  const card = presentScenarioMissionInboxCard(input({
    navigation: navigation({ runMode: "LOCAL_ONLY" }),
  }));
  assert.equal(card.runMode, "LOCAL_ONLY");
  assert.match(card.accessibilityLabel, /Local only/);
  assert.equal(card.navigationAuthority, false);
});

test("clear Universe navigation is not promoted into Mission Inbox", () => {
  assert.throws(() => presentScenarioMissionInboxCard(input({
    navigation: navigation({
      destination: "UNIVERSE_SCENARIO_DETAIL",
      route: "UNIVERSE",
      userAction: "Explore scenarios",
      reason: "CLEAR_SCENARIO_EXPLORATION",
    }),
  })), /REVIEW_ITEM_REQUIRED/);
});

test("assumption destination must preserve assumption action and reason", () => {
  assert.throws(() => presentScenarioMissionInboxCard(input({
    navigation: navigation({ userAction: "Review evidence" }),
  })), /ASSUMPTION_ROUTE_MISMATCH/);
});

test("evidence destination must preserve evidence action and reason", () => {
  assert.throws(() => presentScenarioMissionInboxCard(input({
    navigation: navigation({
      destination: "NEEDS_YOU_SCENARIO_EVIDENCE",
      userAction: "Review assumptions",
      reason: "EVIDENCE_REVIEW_REQUIRED",
    }),
  })), /EVIDENCE_ROUTE_MISMATCH/);
});

test("Ask XVI remains the secondary action", () => {
  const card = presentScenarioMissionInboxCard(input());
  assert.equal(card.secondaryAction, "Ask XVI");
});

test("card never auto-opens or auto-navigates", () => {
  const card = presentScenarioMissionInboxCard(input());
  assert.equal(card.requiresUserGesture, true);
  assert.equal(card.canAutoOpen, false);
  assert.equal(card.canAutoNavigate, false);
  assert.equal(card.navigationAuthority, false);
});

test("outer authority escalation is refused", () => {
  assert.throws(() => presentScenarioMissionInboxCard(input({ canAutoOpen: true })), /AUTHORITY_VIOLATION/);
  assert.throws(() => presentScenarioMissionInboxCard(input({ canClaimExecution: true })), /AUTHORITY_VIOLATION/);
});

test("navigation authority escalation is refused", () => {
  assert.throws(() => presentScenarioMissionInboxCard(input({
    navigation: navigation({ navigationAuthority: true }),
  })), /NAVIGATION_AUTHORITY_VIOLATION/);
});

test("unknown run mode fails closed", () => {
  assert.throws(() => presentScenarioMissionInboxCard(input({
    navigation: navigation({ runMode: "ONLINE_UNRESTRICTED" }),
  })), /MODE_INVALID/);
});

test("invalid scenario set identifier fails closed", () => {
  assert.throws(() => presentScenarioMissionInboxCard(input({ scenarioSetId: "alpha" })), /SCENARIO_SET_ID_INVALID/);
});

test("accessor-bearing navigation fails without executing getter", () => {
  let hits = 0;
  const hostile: Record<string, unknown> = navigation();
  Object.defineProperty(hostile, "route", {
    enumerable: true,
    get() {
      hits += 1;
      return "NEEDS_YOU";
    },
  });
  assert.throws(() => presentScenarioMissionInboxCard(input({ navigation: hostile })), /ACCESSOR_FORBIDDEN/);
  assert.equal(hits, 0);
});

test("exact schema rejects hidden extra fields", () => {
  assert.throws(() => presentScenarioMissionInboxCard({ ...input(), hiddenAuthority: true }), /SCHEMA_MISMATCH/);
});