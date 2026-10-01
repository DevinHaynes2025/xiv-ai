export type XviDecisionRoute = "UNIVERSE" | "NEEDS_YOU";
export type XviDecisionSeverity = "INFO" | "REVIEW" | "BLOCKED";

export interface XviLifecycleSummary {
  readonly organizationId: string;
  readonly identityState: "UNRESOLVED" | "CANDIDATE" | "RESOLVED" | "CONFLICTED" | "REVOKED";
  readonly lifecycleState: "ACTIVE" | "INACTIVE" | "DISSOLVED" | "MERGED" | "RESTRUCTURED" | "UNKNOWN";
  readonly supportingEvidenceCount: number;
  readonly contradictingEvidenceCount: number;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviReconciliationSummary {
  readonly reconciliationId: string;
  readonly kind: "SAME_ENTITY" | "RENAME" | "MERGE" | "SPLIT" | "DISTINCT_ENTITY";
  readonly decision: "PROPOSED" | "CONFIRMED" | "REJECTED" | "QUARANTINED";
  readonly canonicalOrganizationId: string;
  readonly supportingEvidenceCount: number;
  readonly contradictingEvidenceCount: number;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly canRewriteHistory: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviConfidenceSummary {
  readonly organizationId: string;
  readonly confidenceBand: "INSUFFICIENT" | "LOW" | "MODERATE" | "HIGH";
  readonly escalationState: "CLEAR" | "REVIEW_REQUIRED" | "QUARANTINED";
  readonly conflictClasses: readonly string[];
  readonly distinctSupportingSources: number;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly scoreIsTruth: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviIndependenceSummary {
  readonly organizationId: string;
  readonly independentGroupCount: number;
  readonly independentSupportingGroupCount: number;
  readonly dependentEvidenceCount: number;
  readonly duplicateContentHashCount: number;
  readonly quarantinedEvidenceCount: number;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly independenceIsTruth: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviCombinedIdentityDecisionInput {
  readonly lifecycle: XviLifecycleSummary;
  readonly reconciliation: XviReconciliationSummary | null;
  readonly confidence: XviConfidenceSummary;
  readonly independence: XviIndependenceSummary;
  readonly observedAt: string;
}

export interface XviCombinedIdentityDecision {
  readonly schemaVersion: "xvi-combined-identity-decision-v1";
  readonly organizationId: string;
  readonly route: XviDecisionRoute;
  readonly severity: XviDecisionSeverity;
  readonly headline: string;
  readonly reasons: readonly string[];
  readonly confidenceBand: XviConfidenceSummary["confidenceBand"];
  readonly independentSupportingGroups: number;
  readonly canDisplayCanonicalIdentity: boolean;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly canMutate: false;
  readonly canClaimTruth: false;
  readonly canClaimExecution: false;
}

const PLAIN = Object.getPrototypeOf({});

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v === null || typeof v !== "object" || Object.getPrototypeOf(v) !== PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const key of Object.keys(v)) {
    const d = Object.getOwnPropertyDescriptor(v,key);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}
function iso(v: string, label: string): void {
  if (typeof v !== "string" || !v.includes("T") || Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function assertZeroAuthority(v: Record<string, unknown>, label: string): void {
  if (v.safeReadOnly !== true || v.executionAuthority !== false || v.mutationAuthority !== false || v.productionAuthority !== false) throw new Error(`${label}_AUTHORITY_VIOLATION`);
}

export function compileCombinedIdentityDecision(input: unknown): Readonly<XviCombinedIdentityDecision> {
  plain(input,"COMBINED_INPUT");
  const keys=["lifecycle","reconciliation","confidence","independence","observedAt"].sort();
  const actual=Object.keys(input).sort();
  if (actual.length!==keys.length || actual.some((k,i)=>k!==keys[i])) throw new Error("COMBINED_INPUT_SCHEMA_MISMATCH");
  const r=input as unknown as XviCombinedIdentityDecisionInput;
  iso(r.observedAt,"OBSERVED_AT");

  plain(r.lifecycle,"LIFECYCLE");
  plain(r.confidence,"CONFIDENCE");
  plain(r.independence,"INDEPENDENCE");
  assertZeroAuthority(r.lifecycle as unknown as Record<string,unknown>,"LIFECYCLE");
  assertZeroAuthority(r.confidence as unknown as Record<string,unknown>,"CONFIDENCE");
  assertZeroAuthority(r.independence as unknown as Record<string,unknown>,"INDEPENDENCE");

  if (r.confidence.scoreIsTruth !== false) throw new Error("CONFIDENCE_TRUTH_CLAIM_FORBIDDEN");
  if (r.independence.independenceIsTruth !== false) throw new Error("INDEPENDENCE_TRUTH_CLAIM_FORBIDDEN");

  const orgId=r.lifecycle.organizationId;
  if (!/^org:/.test(orgId) || r.confidence.organizationId!==orgId || r.independence.organizationId!==orgId) throw new Error("ORGANIZATION_ID_MISMATCH");

  if (r.reconciliation!==null) {
    plain(r.reconciliation,"RECONCILIATION");
    assertZeroAuthority(r.reconciliation as unknown as Record<string,unknown>,"RECONCILIATION");
    if (r.reconciliation.canRewriteHistory!==false) throw new Error("HISTORY_REWRITE_FORBIDDEN");
    if (r.reconciliation.canonicalOrganizationId!==orgId) throw new Error("RECONCILIATION_CANONICAL_MISMATCH");
  }

  const reasons:string[]=[];
  let severity:XviDecisionSeverity="INFO";

  if (r.lifecycle.identityState==="CONFLICTED") reasons.push("Identity evidence conflicts");
  if (r.lifecycle.identityState==="REVOKED") reasons.push("Identity is revoked");
  if (r.lifecycle.identityState==="UNRESOLVED" || r.lifecycle.identityState==="CANDIDATE") reasons.push("Identity is not fully resolved");
  if (r.lifecycle.contradictingEvidenceCount>0) reasons.push("Contradictory lifecycle evidence exists");

  if (r.reconciliation) {
    if (r.reconciliation.decision==="PROPOSED") reasons.push("Identity reconciliation is pending");
    if (r.reconciliation.decision==="QUARANTINED") reasons.push("Identity reconciliation is quarantined");
    if ((r.reconciliation.kind==="MERGE" || r.reconciliation.kind==="SPLIT") && r.reconciliation.decision!=="CONFIRMED") reasons.push("Structural organization change needs review");
    if (r.reconciliation.contradictingEvidenceCount>0) reasons.push("Reconciliation evidence conflicts");
  }

  if (r.confidence.escalationState==="QUARANTINED") reasons.push("Confidence evidence is quarantined");
  if (r.confidence.escalationState==="REVIEW_REQUIRED") reasons.push("Confidence posture requires review");
  for (const c of r.confidence.conflictClasses) {
    if (c!=="NONE") reasons.push(`Confidence conflict: ${c}`);
  }

  if (r.independence.independentSupportingGroupCount<2) reasons.push("Insufficient independent corroboration");
  if (r.independence.duplicateContentHashCount>0) reasons.push("Duplicate evidence content detected");
  if (r.independence.quarantinedEvidenceCount>0) reasons.push("Independent evidence contains quarantined records");

  const quarantined =
    r.confidence.escalationState==="QUARANTINED" ||
    r.independence.quarantinedEvidenceCount>0 ||
    r.reconciliation?.decision==="QUARANTINED";
  if (quarantined || r.lifecycle.identityState==="REVOKED") severity="BLOCKED";
  else if (reasons.length>0 || r.lifecycle.requiresHumanReview || r.confidence.requiresHumanReview || r.independence.requiresHumanReview || r.reconciliation?.requiresHumanReview) severity="REVIEW";

  const uniqueReasons=Object.freeze([...new Set(reasons)]);
  const requiresHumanReview=severity!=="INFO";
  const canDisplayCanonicalIdentity=
    severity==="INFO" &&
    r.lifecycle.identityState==="RESOLVED" &&
    r.confidence.confidenceBand!=="INSUFFICIENT" &&
    r.independence.independentSupportingGroupCount>=2 &&
    (!r.reconciliation || r.reconciliation.decision==="CONFIRMED");

  const headline = severity==="INFO"
    ? "Identity verified for Universe"
    : severity==="BLOCKED"
      ? "Identity blocked pending governed review"
      : "Identity needs review";

  return Object.freeze({
    schemaVersion:"xvi-combined-identity-decision-v1",
    organizationId:orgId,
    route:requiresHumanReview ? "NEEDS_YOU" : "UNIVERSE",
    severity,
    headline,
    reasons:uniqueReasons,
    confidenceBand:r.confidence.confidenceBand,
    independentSupportingGroups:r.independence.independentSupportingGroupCount,
    canDisplayCanonicalIdentity,
    requiresHumanReview,
    safeReadOnly:true,
    canMutate:false,
    canClaimTruth:false,
    canClaimExecution:false,
  });
}
