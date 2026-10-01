export type XviScenarioInboxRunMode =
  | "ONLINE_GOVERNED"
  | "OFFLINE_GOVERNED"
  | "LOCAL_ONLY";

export type XviScenarioInboxDestination =
  | "NEEDS_YOU_SCENARIO_ASSUMPTIONS"
  | "NEEDS_YOU_SCENARIO_EVIDENCE";

export type XviScenarioInboxReason =
  | "ASSUMPTION_REVIEW_REQUIRED"
  | "EVIDENCE_REVIEW_REQUIRED";

export interface XviScenarioNavigationPlanMirror {
  readonly schemaVersion: "xvi-scenario-navigation-v1";
  readonly runMode: XviScenarioInboxRunMode;
  readonly sourceSurface: "SCENARIO_COMPARISON_CARD";
  readonly destination:
    | "UNIVERSE_SCENARIO_DETAIL"
    | XviScenarioInboxDestination;
  readonly route: "UNIVERSE" | "NEEDS_YOU";
  readonly userAction:
    | "Explore scenarios"
    | "Review assumptions"
    | "Review evidence";
  readonly secondaryAction: "Ask XVI";
  readonly reason:
    | "CLEAR_SCENARIO_EXPLORATION"
    | XviScenarioInboxReason;
  readonly safeReadOnly: true;
  readonly requiresUserGesture: true;
  readonly canAutoNavigate: false;
  readonly navigationAuthority: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviScenarioMissionInboxInput {
  readonly scenarioSetId: string;
  readonly navigation: XviScenarioNavigationPlanMirror;
  readonly safeReadOnly: true;
  readonly canAutoOpen: false;
  readonly canClaimExecution: false;
}

export interface XviScenarioMissionInboxCard {
  readonly schemaVersion: "xvi-scenario-mission-inbox-card-v1";
  readonly scenarioSetId: string;
  readonly runMode: XviScenarioInboxRunMode;
  readonly lane: "NEEDS_YOU";
  readonly priority: "ATTENTION_REQUIRED";
  readonly reviewKind: "ASSUMPTIONS" | "EVIDENCE";
  readonly headline: "Scenario assumptions need review" | "Scenario evidence needs review";
  readonly body: string;
  readonly statusLabel: "Needs you";
  readonly primaryAction: "Review assumptions" | "Review evidence";
  readonly secondaryAction: "Ask XVI";
  readonly destination: XviScenarioInboxDestination;
  readonly reason: XviScenarioInboxReason;
  readonly accessibilityLabel: string;
  readonly safeReadOnly: true;
  readonly requiresUserGesture: true;
  readonly canAutoOpen: false;
  readonly canAutoNavigate: false;
  readonly navigationAuthority: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
  readonly canClaimSuccess: false;
}

const PLAIN = Object.getPrototypeOf({});
const MODES = new Set<XviScenarioInboxRunMode>([
  "ONLINE_GOVERNED",
  "OFFLINE_GOVERNED",
  "LOCAL_ONLY",
]);

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

function scenarioSetId(value: string): void {
  if (typeof value !== "string" || !value.startsWith("scenario-set:") || value.length > 240) {
    throw new Error("SCENARIO_INBOX_SCENARIO_SET_ID_INVALID");
  }
}

function validateNavigation(value: unknown): Readonly<XviScenarioNavigationPlanMirror> {
  plain(value, "SCENARIO_INBOX_NAVIGATION");
  exact(
    value,
    [
      "schemaVersion",
      "runMode",
      "sourceSurface",
      "destination",
      "route",
      "userAction",
      "secondaryAction",
      "reason",
      "safeReadOnly",
      "requiresUserGesture",
      "canAutoNavigate",
      "navigationAuthority",
      "executionAuthority",
      "mutationAuthority",
      "productionAuthority",
    ],
    "SCENARIO_INBOX_NAVIGATION"
  );

  const navigation = value as unknown as XviScenarioNavigationPlanMirror;
  if (navigation.schemaVersion !== "xvi-scenario-navigation-v1") {
    throw new Error("SCENARIO_INBOX_NAVIGATION_SCHEMA_INVALID");
  }
  if (!MODES.has(navigation.runMode)) {
    throw new Error("SCENARIO_INBOX_MODE_INVALID");
  }
  if (navigation.sourceSurface !== "SCENARIO_COMPARISON_CARD") {
    throw new Error("SCENARIO_INBOX_SOURCE_SURFACE_INVALID");
  }
  if (navigation.secondaryAction !== "Ask XVI") {
    throw new Error("SCENARIO_INBOX_SECONDARY_ACTION_INVALID");
  }
  if (
    navigation.safeReadOnly !== true ||
    navigation.requiresUserGesture !== true ||
    navigation.canAutoNavigate !== false ||
    navigation.navigationAuthority !== false ||
    navigation.executionAuthority !== false ||
    navigation.mutationAuthority !== false ||
    navigation.productionAuthority !== false
  ) {
    throw new Error("SCENARIO_INBOX_NAVIGATION_AUTHORITY_VIOLATION");
  }

  if (navigation.route !== "NEEDS_YOU") {
    throw new Error("SCENARIO_INBOX_REVIEW_ITEM_REQUIRED");
  }

  if (navigation.destination === "NEEDS_YOU_SCENARIO_ASSUMPTIONS") {
    if (
      navigation.userAction !== "Review assumptions" ||
      navigation.reason !== "ASSUMPTION_REVIEW_REQUIRED"
    ) {
      throw new Error("SCENARIO_INBOX_ASSUMPTION_ROUTE_MISMATCH");
    }
    return navigation;
  }

  if (navigation.destination === "NEEDS_YOU_SCENARIO_EVIDENCE") {
    if (
      navigation.userAction !== "Review evidence" ||
      navigation.reason !== "EVIDENCE_REVIEW_REQUIRED"
    ) {
      throw new Error("SCENARIO_INBOX_EVIDENCE_ROUTE_MISMATCH");
    }
    return navigation;
  }

  throw new Error("SCENARIO_INBOX_DESTINATION_INVALID");
}

function modeLabel(mode: XviScenarioInboxRunMode): string {
  if (mode === "ONLINE_GOVERNED") return "Online governed";
  if (mode === "OFFLINE_GOVERNED") return "Offline governed";
  return "Local only";
}

export function presentScenarioMissionInboxCard(
  input: unknown
): Readonly<XviScenarioMissionInboxCard> {
  plain(input, "SCENARIO_INBOX");
  exact(
    input,
    ["scenarioSetId", "navigation", "safeReadOnly", "canAutoOpen", "canClaimExecution"],
    "SCENARIO_INBOX"
  );

  const request = input as unknown as XviScenarioMissionInboxInput;
  scenarioSetId(request.scenarioSetId);
  if (
    request.safeReadOnly !== true ||
    request.canAutoOpen !== false ||
    request.canClaimExecution !== false
  ) {
    throw new Error("SCENARIO_INBOX_AUTHORITY_VIOLATION");
  }

  const navigation = validateNavigation(request.navigation);
  const assumptions = navigation.destination === "NEEDS_YOU_SCENARIO_ASSUMPTIONS";
  const currentMode = modeLabel(navigation.runMode);

  return Object.freeze({
    schemaVersion: "xvi-scenario-mission-inbox-card-v1",
    scenarioSetId: request.scenarioSetId,
    runMode: navigation.runMode,
    lane: "NEEDS_YOU",
    priority: "ATTENTION_REQUIRED",
    reviewKind: assumptions ? "ASSUMPTIONS" : "EVIDENCE",
    headline: assumptions
      ? "Scenario assumptions need review"
      : "Scenario evidence needs review",
    body: assumptions
      ? `Review the changed assumptions before continuing. ${currentMode}. Nothing opens or changes automatically.`
      : `Review the governed evidence before continuing. ${currentMode}. Nothing opens or changes automatically.`,
    statusLabel: "Needs you",
    primaryAction: assumptions ? "Review assumptions" : "Review evidence",
    secondaryAction: "Ask XVI",
    destination: navigation.destination as XviScenarioInboxDestination,
    reason: navigation.reason as XviScenarioInboxReason,
    accessibilityLabel: assumptions
      ? `Needs you. Scenario assumptions require review. ${currentMode}. Nothing opens or changes automatically.`
      : `Needs you. Scenario evidence requires review. ${currentMode}. Nothing opens or changes automatically.`,
    safeReadOnly: true,
    requiresUserGesture: true,
    canAutoOpen: false,
    canAutoNavigate: false,
    navigationAuthority: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
    canClaimSuccess: false,
  });
}