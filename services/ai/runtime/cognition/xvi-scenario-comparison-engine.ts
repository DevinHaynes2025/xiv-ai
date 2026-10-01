export type XviScenarioKind = "BASE" | "UPSIDE" | "DOWNSIDE";
export type XviRunMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
export type XviCalibrationState = "UNTESTED" | "CALIBRATED" | "UNDERPERFORMING" | "DISPUTED";
export type XviSensitivity = "LOW" | "MEDIUM" | "HIGH";

export interface XviScenarioAssumption {
  readonly assumptionId: string;
  readonly label: string;
  readonly normalizedValue: number;
  readonly unitLabel: string;
  readonly sensitivity: XviSensitivity;
}

export interface XviScenarioCandidate {
  readonly scenarioId: string;
  readonly kind: XviScenarioKind;
  readonly projectedValue: number;
  readonly lower: number;
  readonly upper: number;
  readonly assumptions: readonly XviScenarioAssumption[];
  readonly provenanceRootHashes: readonly string[];
  readonly quarantinedEvidenceCount: number;
  readonly calibrationState: XviCalibrationState;
}

export interface XviScenarioComparisonInput {
  readonly scenarioSetId: string;
  readonly tenantId: string;
  readonly userScopeId: string;
  readonly runMode: XviRunMode;
  readonly sourceStoryId: string;
  readonly sourceVisualizationId: string;
  readonly metricId: string;
  readonly unitLabel: string;
  readonly horizonLabel: string;
  readonly materialityThresholdRatio: number;
  readonly scenarios: readonly XviScenarioCandidate[];
  readonly observedAt: string;
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviScenarioComparisonReceipt {
  readonly schemaVersion: "xvi-scenario-comparison-v1";
  readonly scenarioSetId: string;
  readonly runMode: XviRunMode;
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

const PLAIN = Object.getPrototypeOf({});
const MODES = new Set<XviRunMode>(["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"]);
const KINDS = new Set<XviScenarioKind>(["BASE","UPSIDE","DOWNSIDE"]);
const CAL = new Set<XviCalibrationState>(["UNTESTED","CALIBRATED","UNDERPERFORMING","DISPUTED"]);
const SENS = new Set<XviSensitivity>(["LOW","MEDIUM","HIGH"]);

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v === null || typeof v !== "object" || Object.getPrototypeOf(v) !== PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const k of Object.keys(v)) {
    const d = Object.getOwnPropertyDescriptor(v, k);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}
function exact(v: Record<string, unknown>, keys: readonly string[], label: string): void {
  const a = Object.keys(v).sort(), b = [...keys].sort();
  if (a.length !== b.length || a.some((k,i) => k !== b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function finite(v: number, label: string): void { if (!Number.isFinite(v)) throw new Error(`${label}_INVALID`); }
function safeInt(v: number, min: number, max: number, label: string): void { if (!Number.isSafeInteger(v) || v < min || v > max) throw new Error(`${label}_INVALID`); }
function iso(v: string, label: string): void { if (typeof v !== "string" || !v.includes("T") || Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`); }
function hash(v: string, label: string): void { if (!/^[a-f0-9]{64}$/.test(v)) throw new Error(`${label}_INVALID`); }

export function validateScenarioComparisonInput(input: unknown): Readonly<XviScenarioComparisonInput> {
  plain(input, "SCENARIO_COMPARISON");
  exact(input, ["scenarioSetId","tenantId","userScopeId","runMode","sourceStoryId","sourceVisualizationId","metricId","unitLabel","horizonLabel","materialityThresholdRatio","scenarios","observedAt","zeroSecretContext","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"], "SCENARIO_COMPARISON");
  const r = input as unknown as XviScenarioComparisonInput;
  if (!/^scenario-set:/.test(r.scenarioSetId) || !/^tenant:/.test(r.tenantId) || !/^user-scope:/.test(r.userScopeId) || !MODES.has(r.runMode) || !/^story:/.test(r.sourceStoryId) || !/^viz:/.test(r.sourceVisualizationId) || !r.metricId?.trim() || !r.unitLabel?.trim() || !r.horizonLabel?.trim()) throw new Error("SCENARIO_COMPARISON_IDENTITY_INVALID");
  finite(r.materialityThresholdRatio, "MATERIALITY_THRESHOLD");
  if (r.materialityThresholdRatio <= 0 || r.materialityThresholdRatio > 1) throw new Error("MATERIALITY_THRESHOLD_RANGE_INVALID");
  if (!Array.isArray(r.scenarios) || r.scenarios.length !== 3) throw new Error("SCENARIO_COUNT_INVALID");

  const kinds = new Set<XviScenarioKind>(), scenarioIds = new Set<string>();
  let expectedAssumptions: string[] | null = null;
  for (const raw of r.scenarios) {
    plain(raw, "SCENARIO");
    exact(raw, ["scenarioId","kind","projectedValue","lower","upper","assumptions","provenanceRootHashes","quarantinedEvidenceCount","calibrationState"], "SCENARIO");
    const s = raw as unknown as XviScenarioCandidate;
    if (!/^scenario:/.test(s.scenarioId) || scenarioIds.has(s.scenarioId) || !KINDS.has(s.kind) || kinds.has(s.kind) || !CAL.has(s.calibrationState)) throw new Error("SCENARIO_IDENTITY_INVALID");
    scenarioIds.add(s.scenarioId); kinds.add(s.kind);
    finite(s.projectedValue, "SCENARIO_VALUE"); finite(s.lower, "SCENARIO_LOWER"); finite(s.upper, "SCENARIO_UPPER");
    if (s.lower > s.upper || s.projectedValue < s.lower || s.projectedValue > s.upper) throw new Error("SCENARIO_INTERVAL_INVALID");
    safeInt(s.quarantinedEvidenceCount, 0, 1_000_000, "QUARANTINED_EVIDENCE_COUNT");

    if (!Array.isArray(s.provenanceRootHashes) || s.provenanceRootHashes.length < 2 || s.provenanceRootHashes.length > 64) throw new Error("PROVENANCE_ROOT_COUNT_INVALID");
    const roots = new Set<string>();
    for (const h of s.provenanceRootHashes) { hash(h, "PROVENANCE_ROOT_HASH"); if (roots.has(h)) throw new Error("PROVENANCE_ROOT_DUPLICATE"); roots.add(h); }

    if (!Array.isArray(s.assumptions) || s.assumptions.length < 1 || s.assumptions.length > 64) throw new Error("ASSUMPTION_COUNT_INVALID");
    const ids = new Set<string>();
    for (const rawA of s.assumptions) {
      plain(rawA, "ASSUMPTION");
      exact(rawA, ["assumptionId","label","normalizedValue","unitLabel","sensitivity"], "ASSUMPTION");
      const a = rawA as unknown as XviScenarioAssumption;
      if (!a.assumptionId?.trim() || ids.has(a.assumptionId) || !a.label?.trim() || !a.unitLabel?.trim() || !SENS.has(a.sensitivity)) throw new Error("ASSUMPTION_INVALID");
      ids.add(a.assumptionId); finite(a.normalizedValue, "ASSUMPTION_VALUE");
    }
    const current = [...ids].sort();
    if (expectedAssumptions === null) expectedAssumptions = current;
    else if (current.length !== expectedAssumptions.length || current.some((x,i) => x !== expectedAssumptions![i])) throw new Error("ASSUMPTION_SET_MISMATCH");
  }
  iso(r.observedAt, "OBSERVED_AT");
  if (r.zeroSecretContext !== true || r.safeReadOnly !== true || r.executionAuthority !== false || r.mutationAuthority !== false || r.productionAuthority !== false) throw new Error("SCENARIO_COMPARISON_AUTHORITY_VIOLATION");
  return Object.freeze({...r});
}

function relative(delta: number, base: number): number { return Math.abs(delta) / Math.max(Math.abs(base), 1e-9); }

export function compareScenarios(input: unknown): Readonly<XviScenarioComparisonReceipt> {
  const r = validateScenarioComparisonInput(input);
  const base = r.scenarios.find(s => s.kind === "BASE")!;
  const upside = r.scenarios.find(s => s.kind === "UPSIDE")!;
  const downside = r.scenarios.find(s => s.kind === "DOWNSIDE")!;
  const byId = (s: XviScenarioCandidate) => new Map(s.assumptions.map(a => [a.assumptionId, a]));
  const bm = byId(base), um = byId(upside), dm = byId(downside);
  let highSensitivityChangeCount = 0;
  for (const id of [...bm.keys()].sort()) {
    const b = bm.get(id)!, u = um.get(id)!, d = dm.get(id)!;
    if (b.label !== u.label || b.label !== d.label || b.unitLabel !== u.unitLabel || b.unitLabel !== d.unitLabel || b.sensitivity !== u.sensitivity || b.sensitivity !== d.sensitivity) throw new Error("ASSUMPTION_METADATA_MISMATCH");
    if (b.sensitivity === "HIGH" && (b.normalizedValue !== u.normalizedValue || b.normalizedValue !== d.normalizedValue)) highSensitivityChangeCount++;
  }
  const upsideDeltaFromBase = upside.projectedValue - base.projectedValue;
  const downsideDeltaFromBase = downside.projectedValue - base.projectedValue;
  const upsideMaterialChange = relative(upsideDeltaFromBase, base.projectedValue) >= r.materialityThresholdRatio;
  const downsideMaterialChange = relative(downsideDeltaFromBase, base.projectedValue) >= r.materialityThresholdRatio;
  const weakCalibrationScenarioCount = r.scenarios.filter(s => s.calibrationState === "UNTESTED" || s.calibrationState === "UNDERPERFORMING").length;
  const disputedScenarioCount = r.scenarios.filter(s => s.calibrationState === "DISPUTED").length;
  const quarantinedEvidenceCount = r.scenarios.reduce((n,s) => n + s.quarantinedEvidenceCount, 0);
  const canRenderComparison = disputedScenarioCount === 0 && quarantinedEvidenceCount === 0;
  const requiresHumanReview = disputedScenarioCount > 0 || quarantinedEvidenceCount > 0 || ((upsideMaterialChange || downsideMaterialChange) && highSensitivityChangeCount > 0);

  return Object.freeze({
    schemaVersion: "xvi-scenario-comparison-v1",
    scenarioSetId: r.scenarioSetId,
    runMode: r.runMode,
    baseScenarioId: base.scenarioId,
    upsideScenarioId: upside.scenarioId,
    downsideScenarioId: downside.scenarioId,
    upsideDeltaFromBase,
    downsideDeltaFromBase,
    upsideMaterialChange,
    downsideMaterialChange,
    highSensitivityChangeCount,
    weakCalibrationScenarioCount,
    disputedScenarioCount,
    quarantinedEvidenceCount,
    canRenderComparison,
    requiresHumanReview,
    route: requiresHumanReview ? "NEEDS_YOU" : "UNIVERSE",
    zeroSecretContext: true,
    safeReadOnly: true,
    canTakeExternalAction: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false
  });
}
