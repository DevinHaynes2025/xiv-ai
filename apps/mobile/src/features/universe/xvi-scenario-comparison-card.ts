export type XviScenarioAudience = "CONSUMER" | "ENTREPRENEUR" | "EXECUTIVE";
export type XviScenarioRunMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";

export interface XviScenarioComparisonReceiptMirror {
  readonly schemaVersion: "xvi-scenario-comparison-v1";
  readonly scenarioSetId: string;
  readonly runMode: XviScenarioRunMode;
  readonly baseScenarioId: string;
  readonly upsideScenarioId: string;
  readonly downsideScenarioId: string;
  readonly upsideDeltaFromBase: number;
  readonly downsideDeltaFromBase: number;
  readonly upsideMaterialChange: boolean;
  readonly downsideMaterialChange: boolean;
  readonly highSensitivityChangeCount: number;
  readonly weakCalibrationScenarioCount: number;
  readonly disputedScenarioCount: number;
  readonly quarantinedEvidenceCount: number;
  readonly canRenderComparison: boolean;
  readonly requiresHumanReview: boolean;
  readonly route: "UNIVERSE" | "NEEDS_YOU";
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly canTakeExternalAction: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviScenarioComparisonCardInput {
  readonly audience: XviScenarioAudience;
  readonly metricLabel: string;
  readonly unitLabel: string;
  readonly horizonLabel: string;
  readonly baseProjectedValue: number;
  readonly receipt: XviScenarioComparisonReceiptMirror;
  readonly safeReadOnly: true;
  readonly canTakeExternalAction: false;
}

export interface XviScenarioComparisonCardPresentation {
  readonly schemaVersion: "xvi-scenario-comparison-card-v1";
  readonly audience: XviScenarioAudience;
  readonly eyebrow: string;
  readonly title: string;
  readonly modeLabel: string;
  readonly horizonLabel: string;
  readonly baseValue: number;
  readonly upsideValue: number;
  readonly downsideValue: number;
  readonly unitLabel: string;
  readonly materialityLabel: string;
  readonly evidenceLabel: string;
  readonly reviewState: "CLEAR" | "NEEDS_REVIEW" | "BLOCKED";
  readonly primaryAction: "Explore scenarios" | "Review assumptions" | "Review evidence";
  readonly secondaryAction: "Ask XVI";
  readonly route: "UNIVERSE" | "NEEDS_YOU";
  readonly disclaimer: "Scenario analysis, not a prediction.";
  readonly accessibilityLabel: string;
  readonly safeReadOnly: true;
  readonly canMutate: false;
  readonly canClaimExecution: false;
  readonly canClaimTruth: false;
}

const PLAIN = Object.getPrototypeOf({});
const AUDIENCES = new Set<XviScenarioAudience>(["CONSUMER","ENTREPRENEUR","EXECUTIVE"]);
const MODES = new Set<XviScenarioRunMode>(["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"]);

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v === null || typeof v !== "object" || Object.getPrototypeOf(v) !== PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const k of Object.keys(v)) {
    const d = Object.getOwnPropertyDescriptor(v, k);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}

function exact(v: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(v).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((k, i) => k !== expected[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}

function finite(v: number, label: string): void {
  if (!Number.isFinite(v)) throw new Error(`${label}_INVALID`);
}

function safeInt(v: number, label: string): void {
  if (!Number.isSafeInteger(v) || v < 0 || v > 1_000_000) throw new Error(`${label}_INVALID`);
}

function text(v: string, label: string): void {
  if (typeof v !== "string" || !v.trim() || v.length > 160) throw new Error(`${label}_INVALID`);
}

function validateReceipt(input: unknown): Readonly<XviScenarioComparisonReceiptMirror> {
  plain(input, "SCENARIO_CARD_RECEIPT");
  exact(input, [
    "schemaVersion","scenarioSetId","runMode","baseScenarioId","upsideScenarioId","downsideScenarioId",
    "upsideDeltaFromBase","downsideDeltaFromBase","upsideMaterialChange","downsideMaterialChange",
    "highSensitivityChangeCount","weakCalibrationScenarioCount","disputedScenarioCount",
    "quarantinedEvidenceCount","canRenderComparison","requiresHumanReview","route","zeroSecretContext",
    "safeReadOnly","canTakeExternalAction","executionAuthority","mutationAuthority","productionAuthority"
  ], "SCENARIO_CARD_RECEIPT");

  const r = input as unknown as XviScenarioComparisonReceiptMirror;
  if (r.schemaVersion !== "xvi-scenario-comparison-v1" || !/^scenario-set:/.test(r.scenarioSetId) || !MODES.has(r.runMode)) throw new Error("SCENARIO_CARD_RECEIPT_IDENTITY_INVALID");
  const ids = [r.baseScenarioId, r.upsideScenarioId, r.downsideScenarioId];
  if (ids.some(id => !/^scenario:/.test(id)) || new Set(ids).size !== 3) throw new Error("SCENARIO_CARD_SCENARIO_IDS_INVALID");
  finite(r.upsideDeltaFromBase, "UPSIDE_DELTA");
  finite(r.downsideDeltaFromBase, "DOWNSIDE_DELTA");
  if (typeof r.upsideMaterialChange !== "boolean" || typeof r.downsideMaterialChange !== "boolean" || typeof r.canRenderComparison !== "boolean" || typeof r.requiresHumanReview !== "boolean") throw new Error("SCENARIO_CARD_FLAGS_INVALID");
  safeInt(r.highSensitivityChangeCount, "HIGH_SENSITIVITY_CHANGE_COUNT");
  safeInt(r.weakCalibrationScenarioCount, "WEAK_CALIBRATION_SCENARIO_COUNT");
  safeInt(r.disputedScenarioCount, "DISPUTED_SCENARIO_COUNT");
  safeInt(r.quarantinedEvidenceCount, "QUARANTINED_EVIDENCE_COUNT");

  const expectedRender = r.disputedScenarioCount === 0 && r.quarantinedEvidenceCount === 0;
  const expectedReview = r.disputedScenarioCount > 0 || r.quarantinedEvidenceCount > 0 || ((r.upsideMaterialChange || r.downsideMaterialChange) && r.highSensitivityChangeCount > 0);
  const expectedRoute = expectedReview ? "NEEDS_YOU" : "UNIVERSE";
  if (r.canRenderComparison !== expectedRender) throw new Error("SCENARIO_CARD_RENDER_STATE_MISMATCH");
  if (r.requiresHumanReview !== expectedReview || r.route !== expectedRoute) throw new Error("SCENARIO_CARD_REVIEW_STATE_MISMATCH");
  if (r.zeroSecretContext !== true || r.safeReadOnly !== true || r.canTakeExternalAction !== false || r.executionAuthority !== false || r.mutationAuthority !== false || r.productionAuthority !== false) throw new Error("SCENARIO_CARD_RECEIPT_AUTHORITY_VIOLATION");
  return Object.freeze({...r});
}

export function presentScenarioComparisonCard(input: unknown): Readonly<XviScenarioComparisonCardPresentation> {
  plain(input, "SCENARIO_CARD");
  exact(input, ["audience","metricLabel","unitLabel","horizonLabel","baseProjectedValue","receipt","safeReadOnly","canTakeExternalAction"], "SCENARIO_CARD");
  const r = input as unknown as XviScenarioComparisonCardInput;
  if (!AUDIENCES.has(r.audience)) throw new Error("SCENARIO_CARD_AUDIENCE_INVALID");
  text(r.metricLabel, "METRIC_LABEL");
  text(r.unitLabel, "UNIT_LABEL");
  text(r.horizonLabel, "HORIZON_LABEL");
  finite(r.baseProjectedValue, "BASE_PROJECTED_VALUE");
  if (r.safeReadOnly !== true || r.canTakeExternalAction !== false) throw new Error("SCENARIO_CARD_AUTHORITY_VIOLATION");
  const receipt = validateReceipt(r.receipt);

  const blocked = receipt.disputedScenarioCount > 0 || receipt.quarantinedEvidenceCount > 0;
  const reviewState = blocked ? "BLOCKED" : receipt.requiresHumanReview ? "NEEDS_REVIEW" : "CLEAR";
  const primaryAction = blocked ? "Review evidence" : receipt.requiresHumanReview ? "Review assumptions" : "Explore scenarios";
  const eyebrow = r.audience === "CONSUMER" ? "For you · Scenarios" : r.audience === "ENTREPRENEUR" ? "Business scenarios" : "Executive scenarios";
  const modeLabel = receipt.runMode === "ONLINE_GOVERNED" ? "Online governed" : receipt.runMode === "OFFLINE_GOVERNED" ? "Offline governed" : "Local only";
  const materialityLabel = receipt.upsideMaterialChange || receipt.downsideMaterialChange
    ? `Material change detected · ${receipt.highSensitivityChangeCount} high-sensitivity assumption change${receipt.highSensitivityChangeCount === 1 ? "" : "s"}`
    : "No material scenario change detected";
  const evidenceLabel = blocked
    ? `${receipt.disputedScenarioCount} disputed scenario${receipt.disputedScenarioCount === 1 ? "" : "s"} · ${receipt.quarantinedEvidenceCount} quarantined evidence item${receipt.quarantinedEvidenceCount === 1 ? "" : "s"}`
    : `${receipt.weakCalibrationScenarioCount} weak-calibration scenario${receipt.weakCalibrationScenarioCount === 1 ? "" : "s"} · evidence clear for comparison`;

  const upsideValue = r.baseProjectedValue + receipt.upsideDeltaFromBase;
  const downsideValue = r.baseProjectedValue + receipt.downsideDeltaFromBase;
  finite(upsideValue, "UPSIDE_PROJECTED_VALUE");
  finite(downsideValue, "DOWNSIDE_PROJECTED_VALUE");

  return Object.freeze({
    schemaVersion: "xvi-scenario-comparison-card-v1",
    audience: r.audience,
    eyebrow,
    title: `${r.metricLabel} scenarios`,
    modeLabel,
    horizonLabel: r.horizonLabel,
    baseValue: r.baseProjectedValue,
    upsideValue,
    downsideValue,
    unitLabel: r.unitLabel,
    materialityLabel,
    evidenceLabel,
    reviewState,
    primaryAction,
    secondaryAction: "Ask XVI",
    route: receipt.route,
    disclaimer: "Scenario analysis, not a prediction.",
    accessibilityLabel: `${r.metricLabel} scenarios. ${modeLabel}. ${r.horizonLabel}. ${materialityLabel}. ${evidenceLabel}. Scenario analysis, not a prediction.`,
    safeReadOnly: true,
    canMutate: false,
    canClaimExecution: false,
    canClaimTruth: false
  });
}
