export type XviOperatingMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
export type XviIdentityRoute = "UNIVERSE" | "NEEDS_YOU";
export type XviIdentityState = "UNRESOLVED" | "CANDIDATE" | "RESOLVED" | "CONFLICTED" | "REVOKED";
export type XviLifecycleState = "ACTIVE" | "INACTIVE" | "DISSOLVED" | "MERGED" | "RESTRUCTURED" | "UNKNOWN";
export type XviReconciliationKind = "SAME_ENTITY" | "RENAME" | "MERGE" | "SPLIT" | "DISTINCT_ENTITY";
export type XviReconciliationDecision = "PROPOSED" | "CONFIRMED" | "REJECTED" | "QUARANTINED";
export type XviIdentityReviewReason =
  | "IDENTITY_UNRESOLVED"
  | "IDENTITY_CONFLICTED"
  | "IDENTITY_REVOKED"
  | "RECONCILIATION_PENDING"
  | "RECONCILIATION_QUARANTINED"
  | "STRUCTURAL_CHANGE_REVIEW"
  | "CONTRADICTORY_EVIDENCE"
  | "STALE_EVIDENCE";

export interface XviCanonicalIdentityBridgeInput {
  readonly organizationId: string;
  readonly canonicalName: string;
  readonly mode: XviOperatingMode;
  readonly identityState: XviIdentityState;
  readonly lifecycleState: XviLifecycleState;
  readonly identityKeyCount: number;
  readonly supportingEvidenceCount: number;
  readonly contradictingEvidenceCount: number;
  readonly observedAt: string;
  readonly reconciliationKind: XviReconciliationKind | null;
  readonly reconciliationDecision: XviReconciliationDecision | null;
  readonly reconciliationRequiresHumanReview: boolean;
  readonly evidenceQuarantined: boolean;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviCanonicalIdentityBridgeOutput {
  readonly schemaVersion: "xvi-canonical-identity-bridge-v1";
  readonly organizationId: string;
  readonly canonicalName: string;
  readonly mode: XviOperatingMode;
  readonly identityState: XviIdentityState;
  readonly lifecycleState: XviLifecycleState;
  readonly identityKeyCount: number;
  readonly supportingEvidenceCount: number;
  readonly contradictingEvidenceCount: number;
  readonly observedAt: string;
  readonly route: XviIdentityRoute;
  readonly reviewReasons: readonly XviIdentityReviewReason[];
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const MODES = new Set<XviOperatingMode>(["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"]);
const IDENTITIES = new Set<XviIdentityState>(["UNRESOLVED","CANDIDATE","RESOLVED","CONFLICTED","REVOKED"]);
const LIFECYCLES = new Set<XviLifecycleState>(["ACTIVE","INACTIVE","DISSOLVED","MERGED","RESTRUCTURED","UNKNOWN"]);
const KINDS = new Set<XviReconciliationKind>(["SAME_ENTITY","RENAME","MERGE","SPLIT","DISTINCT_ENTITY"]);
const DECISIONS = new Set<XviReconciliationDecision>(["PROPOSED","CONFIRMED","REJECTED","QUARANTINED"]);

function plain(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(value).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const key of Object.keys(value)) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}

function exact(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, i) => key !== expected[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}

function count(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1_000_000) throw new Error(`${label}_INVALID`);
}

function iso(value: string, label: string): void {
  if (typeof value !== "string" || !value.includes("T") || Number.isNaN(Date.parse(value))) throw new Error(`${label}_INVALID`);
}

export function validateCanonicalIdentityBridgeInput(input: unknown): Readonly<XviCanonicalIdentityBridgeInput> {
  plain(input, "IDENTITY_BRIDGE");
  exact(input,[
    "organizationId","canonicalName","mode","identityState","lifecycleState","identityKeyCount",
    "supportingEvidenceCount","contradictingEvidenceCount","observedAt","reconciliationKind",
    "reconciliationDecision","reconciliationRequiresHumanReview","evidenceQuarantined",
    "safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"
  ],"IDENTITY_BRIDGE");
  const r = input as unknown as XviCanonicalIdentityBridgeInput;
  if (!/^org:/.test(r.organizationId) || !r.canonicalName?.trim() || r.canonicalName.length > 240) throw new Error("IDENTITY_BRIDGE_IDENTITY_INVALID");
  if (!MODES.has(r.mode) || !IDENTITIES.has(r.identityState) || !LIFECYCLES.has(r.lifecycleState)) throw new Error("IDENTITY_BRIDGE_STATE_INVALID");
  count(r.identityKeyCount,"IDENTITY_KEY_COUNT");
  count(r.supportingEvidenceCount,"SUPPORTING_EVIDENCE_COUNT");
  count(r.contradictingEvidenceCount,"CONTRADICTING_EVIDENCE_COUNT");
  iso(r.observedAt,"OBSERVED_AT");
  if ((r.reconciliationKind === null) !== (r.reconciliationDecision === null)) throw new Error("RECONCILIATION_PAIR_REQUIRED");
  if (r.reconciliationKind !== null && !KINDS.has(r.reconciliationKind)) throw new Error("RECONCILIATION_KIND_INVALID");
  if (r.reconciliationDecision !== null && !DECISIONS.has(r.reconciliationDecision)) throw new Error("RECONCILIATION_DECISION_INVALID");
  if (typeof r.reconciliationRequiresHumanReview !== "boolean" || typeof r.evidenceQuarantined !== "boolean") throw new Error("IDENTITY_BRIDGE_FLAG_INVALID");
  if (r.identityState === "RESOLVED" && r.identityKeyCount < 1) throw new Error("RESOLVED_REQUIRES_IDENTITY_KEY");
  if (r.identityState === "RESOLVED" && r.contradictingEvidenceCount > 0) throw new Error("RESOLVED_CANNOT_HIDE_CONTRADICTION");
  if (r.identityState === "CONFLICTED" && r.contradictingEvidenceCount < 1) throw new Error("CONFLICTED_REQUIRES_CONTRADICTION");
  if (r.evidenceQuarantined && r.reconciliationDecision === "CONFIRMED") throw new Error("QUARANTINED_EVIDENCE_CANNOT_CONFIRM");
  if (r.safeReadOnly !== true || r.executionAuthority !== false || r.mutationAuthority !== false || r.productionAuthority !== false) throw new Error("IDENTITY_BRIDGE_AUTHORITY_VIOLATION");
  return Object.freeze({...r});
}

export function compileCanonicalIdentityBridge(
  input: unknown,
  now: string,
  staleAfterMs = 7 * 24 * 60 * 60 * 1000,
): Readonly<XviCanonicalIdentityBridgeOutput> {
  const r = validateCanonicalIdentityBridgeInput(input);
  iso(now,"NOW");
  if (!Number.isSafeInteger(staleAfterMs) || staleAfterMs < 60_000 || staleAfterMs > 90 * 24 * 60 * 60 * 1000) throw new Error("STALE_POLICY_INVALID");
  const ageMs = Date.parse(now) - Date.parse(r.observedAt);
  if (ageMs < 0) throw new Error("OBSERVATION_FROM_FUTURE");

  const reasons: XviIdentityReviewReason[] = [];
  if (r.identityState === "UNRESOLVED" || r.identityState === "CANDIDATE") reasons.push("IDENTITY_UNRESOLVED");
  if (r.identityState === "CONFLICTED") reasons.push("IDENTITY_CONFLICTED");
  if (r.identityState === "REVOKED") reasons.push("IDENTITY_REVOKED");
  if (r.reconciliationDecision === "PROPOSED") reasons.push("RECONCILIATION_PENDING");
  if (r.reconciliationDecision === "QUARANTINED" || r.evidenceQuarantined) reasons.push("RECONCILIATION_QUARANTINED");
  if ((r.reconciliationKind === "MERGE" || r.reconciliationKind === "SPLIT") && r.reconciliationDecision !== "CONFIRMED") reasons.push("STRUCTURAL_CHANGE_REVIEW");
  if (r.contradictingEvidenceCount > 0) reasons.push("CONTRADICTORY_EVIDENCE");
  if (ageMs > staleAfterMs) reasons.push("STALE_EVIDENCE");
  if (r.reconciliationRequiresHumanReview && reasons.length === 0) reasons.push("RECONCILIATION_PENDING");

  const uniqueReasons = Object.freeze([...new Set(reasons)]);
  const requiresHumanReview = uniqueReasons.length > 0;
  return Object.freeze({
    schemaVersion:"xvi-canonical-identity-bridge-v1",
    organizationId:r.organizationId,
    canonicalName:r.canonicalName,
    mode:r.mode,
    identityState:r.identityState,
    lifecycleState:r.lifecycleState,
    identityKeyCount:r.identityKeyCount,
    supportingEvidenceCount:r.supportingEvidenceCount,
    contradictingEvidenceCount:r.contradictingEvidenceCount,
    observedAt:r.observedAt,
    route:requiresHumanReview ? "NEEDS_YOU" : "UNIVERSE",
    reviewReasons:uniqueReasons,
    requiresHumanReview,
    safeReadOnly:true,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
