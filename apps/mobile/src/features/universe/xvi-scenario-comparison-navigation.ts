export type XviScenarioNavigationRunMode =
  | "ONLINE_GOVERNED"
  | "OFFLINE_GOVERNED"
  | "LOCAL_ONLY";

export type XviScenarioNavigationRoute = "UNIVERSE" | "NEEDS_YOU";
export type XviScenarioReviewState = "CLEAR" | "NEEDS_REVIEW" | "BLOCKED";

export interface XviScenarioCardNavigationMirror {
  readonly schemaVersion: "xvi-scenario-comparison-card-v1";
  readonly modeLabel: "Online governed" | "Offline governed" | "Local only";
  readonly reviewState: XviScenarioReviewState;
  readonly primaryAction: "Explore scenarios" | "Review assumptions" | "Review evidence";
  readonly secondaryAction: "Ask XVI";
  readonly route: XviScenarioNavigationRoute;
  readonly disclaimer: "Scenario analysis, not a prediction.";
  readonly safeReadOnly: true;
  readonly canMutate: false;
  readonly canClaimExecution: false;
  readonly canClaimTruth: false;
}

export interface XviScenarioNavigationInput {
  readonly card: XviScenarioCardNavigationMirror;
  readonly safeReadOnly: true;
  readonly canAutoNavigate: false;
  readonly requiresUserGesture: true;
}

export interface XviScenarioNavigationPlan {
  readonly schemaVersion: "xvi-scenario-navigation-v1";
  readonly runMode: XviScenarioNavigationRunMode;
  readonly sourceSurface: "SCENARIO_COMPARISON_CARD";
  readonly destination:
    | "UNIVERSE_SCENARIO_DETAIL"
    | "NEEDS_YOU_SCENARIO_ASSUMPTIONS"
    | "NEEDS_YOU_SCENARIO_EVIDENCE";
  readonly route: XviScenarioNavigationRoute;
  readonly userAction:
    | "Explore scenarios"
    | "Review assumptions"
    | "Review evidence";
  readonly secondaryAction: "Ask XVI";
  readonly reason:
    | "CLEAR_SCENARIO_EXPLORATION"
    | "ASSUMPTION_REVIEW_REQUIRED"
    | "EVIDENCE_REVIEW_REQUIRED";
  readonly safeReadOnly: true;
  readonly requiresUserGesture: true;
  readonly canAutoNavigate: false;
  readonly navigationAuthority: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});

function plain(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== PLAIN) {
    throw new Error(`${label}_PLAIN_REQUIRED`);
  }
  if (Object.getOwnPropertySymbols(value).length) {
    throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  }
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) {
      throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
    }
  }
}

function exact(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label}_SCHEMA_MISMATCH`);
  }
}

function runModeFromLabel(
  label: XviScenarioCardNavigationMirror["modeLabel"]
): XviScenarioNavigationRunMode {
  switch (label) {
    case "Online governed":
      return "ONLINE_GOVERNED";
    case "Offline governed":
      return "OFFLINE_GOVERNED";
    case "Local only":
      return "LOCAL_ONLY";
    default:
      throw new Error("SCENARIO_NAVIGATION_MODE_INVALID");
  }
}

export function planScenarioNavigation(
  input: unknown
): Readonly<XviScenarioNavigationPlan> {
  plain(input, "SCENARIO_NAVIGATION");
  exact(
    input,
    ["card", "safeReadOnly", "canAutoNavigate", "requiresUserGesture"],
    "SCENARIO_NAVIGATION"
  );

  const request = input as unknown as XviScenarioNavigationInput;
  if (
    request.safeReadOnly !== true ||
    request.canAutoNavigate !== false ||
    request.requiresUserGesture !== true
  ) {
    throw new Error("SCENARIO_NAVIGATION_AUTHORITY_VIOLATION");
  }

  plain(request.card, "SCENARIO_NAVIGATION_CARD");
  exact(
    request.card,
    [
      "schemaVersion",
      "modeLabel",
      "reviewState",
      "primaryAction",
      "secondaryAction",
      "route",
      "disclaimer",
      "safeReadOnly",
      "canMutate",
      "canClaimExecution",
      "canClaimTruth",
    ],
    "SCENARIO_NAVIGATION_CARD"
  );

  const card = request.card;
  if (card.schemaVersion !== "xvi-scenario-comparison-card-v1") {
    throw new Error("SCENARIO_NAVIGATION_CARD_SCHEMA_INVALID");
  }
  if (
    card.safeReadOnly !== true ||
    card.canMutate !== false ||
    card.canClaimExecution !== false ||
    card.canClaimTruth !== false
  ) {
    throw new Error("SCENARIO_NAVIGATION_CARD_AUTHORITY_VIOLATION");
  }
  if (card.secondaryAction !== "Ask XVI") {
    throw new Error("SCENARIO_NAVIGATION_SECONDARY_ACTION_INVALID");
  }
  if (card.disclaimer !== "Scenario analysis, not a prediction.") {
    throw new Error("SCENARIO_NAVIGATION_DISCLAIMER_INVALID");
  }

  const runMode = runModeFromLabel(card.modeLabel);

  if (card.reviewState === "CLEAR") {
    if (card.route !== "UNIVERSE" || card.primaryAction !== "Explore scenarios") {
      throw new Error("SCENARIO_NAVIGATION_CLEAR_ROUTE_MISMATCH");
    }
    return Object.freeze({
      schemaVersion: "xvi-scenario-navigation-v1",
      runMode,
      sourceSurface: "SCENARIO_COMPARISON_CARD",
      destination: "UNIVERSE_SCENARIO_DETAIL",
      route: "UNIVERSE",
      userAction: "Explore scenarios",
      secondaryAction: "Ask XVI",
      reason: "CLEAR_SCENARIO_EXPLORATION",
      safeReadOnly: true,
      requiresUserGesture: true,
      canAutoNavigate: false,
      navigationAuthority: false,
      executionAuthority: false,
      mutationAuthority: false,
      productionAuthority: false,
    });
  }

  if (card.reviewState === "NEEDS_REVIEW") {
    if (card.route !== "NEEDS_YOU" || card.primaryAction !== "Review assumptions") {
      throw new Error("SCENARIO_NAVIGATION_REVIEW_ROUTE_MISMATCH");
    }
    return Object.freeze({
      schemaVersion: "xvi-scenario-navigation-v1",
      runMode,
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
    });
  }

  if (card.reviewState === "BLOCKED") {
    if (card.route !== "NEEDS_YOU" || card.primaryAction !== "Review evidence") {
      throw new Error("SCENARIO_NAVIGATION_BLOCKED_ROUTE_MISMATCH");
    }
    return Object.freeze({
      schemaVersion: "xvi-scenario-navigation-v1",
      runMode,
      sourceSurface: "SCENARIO_COMPARISON_CARD",
      destination: "NEEDS_YOU_SCENARIO_EVIDENCE",
      route: "NEEDS_YOU",
      userAction: "Review evidence",
      secondaryAction: "Ask XVI",
      reason: "EVIDENCE_REVIEW_REQUIRED",
      safeReadOnly: true,
      requiresUserGesture: true,
      canAutoNavigate: false,
      navigationAuthority: false,
      executionAuthority: false,
      mutationAuthority: false,
      productionAuthority: false,
    });
  }

  throw new Error("SCENARIO_NAVIGATION_REVIEW_STATE_INVALID");
}
