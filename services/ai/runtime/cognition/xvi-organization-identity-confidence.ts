export type XviOperatingMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
export type XviConfidenceBand = "INSUFFICIENT" | "LOW" | "MODERATE" | "HIGH";
export type XviEscalationState = "CLEAR" | "REVIEW_REQUIRED" | "QUARANTINED";
export type XviIdentityConflictClass =
  | "NONE"
  | "SOURCE_DISAGREEMENT"
  | "LINEAGE_INCONSISTENCY"
  | "JURISDICTION_MISMATCH"
  | "STALE_EVIDENCE"
  | "INSUFFICIENT_CORROBORATION";

export interface XviIdentityConfidenceEvidence {
  readonly sourceId: string;
  readonly trustScore: number;
  readonly confidence: number;
  readonly supportsIdentity: boolean;
  readonly observedAt: string;
  readonly jurisdictionId: string;
  readonly quarantineReasons: readonly string[];
}

export interface XviIdentityConfidenceInput {
  readonly organizationId: string;
  readonly canonicalJurisdictionId: string;
  readonly mode: XviOperatingMode;
  readonly evidence: readonly XviIdentityConfidenceEvidence[];
  readonly lineageConsistent: boolean;
  readonly observedAt: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviIdentityConfidenceReceipt {
  readonly schemaVersion: "xvi-identity-confidence-v1";
  readonly organizationId: string;
  readonly confidenceBand: XviConfidenceBand;
  readonly escalationState: XviEscalationState;
  readonly conflictClasses: readonly XviIdentityConflictClass[];
  readonly supportingEvidenceCount: number;
  readonly contradictingEvidenceCount: number;
  readonly distinctSupportingSources: number;
  readonly freshestEvidenceAgeMs: number;
  readonly weightedSupport: number;
  readonly weightedContradiction: number;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly scoreIsTruth: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const MODES = new Set<XviOperatingMode>(["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"]);

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
  if (a.length !== b.length || a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v: string, label: string): void {
  if (typeof v !== "string" || !v.includes("T") || Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function score(v: number, max: number, label: string): void {
  if (!Number.isFinite(v) || v < 0 || v > max) throw new Error(`${label}_INVALID`);
}

export function validateIdentityConfidenceInput(input: unknown): Readonly<XviIdentityConfidenceInput> {
  plain(input,"CONFIDENCE_INPUT");
  exact(input,["organizationId","canonicalJurisdictionId","mode","evidence","lineageConsistent","observedAt","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"CONFIDENCE_INPUT");
  const r = input as unknown as XviIdentityConfidenceInput;
  if (!/^org:/.test(r.organizationId) || !/^jurisdiction:/.test(r.canonicalJurisdictionId) || !MODES.has(r.mode)) throw new Error("CONFIDENCE_IDENTITY_INVALID");
  if (!Array.isArray(r.evidence) || r.evidence.length < 1 || r.evidence.length > 64) throw new Error("CONFIDENCE_EVIDENCE_COUNT");
  if (typeof r.lineageConsistent !== "boolean") throw new Error("LINEAGE_FLAG_INVALID");
  iso(r.observedAt,"OBSERVED_AT");
  for (const raw of r.evidence) {
    plain(raw,"CONFIDENCE_EVIDENCE");
    exact(raw,["sourceId","trustScore","confidence","supportsIdentity","observedAt","jurisdictionId","quarantineReasons"],"CONFIDENCE_EVIDENCE");
    const e = raw as unknown as XviIdentityConfidenceEvidence;
    if (!e.sourceId?.trim() || !/^jurisdiction:/.test(e.jurisdictionId)) throw new Error("CONFIDENCE_EVIDENCE_IDENTITY_INVALID");
    score(e.trustScore,100,"TRUST_SCORE"); score(e.confidence,1,"EVIDENCE_CONFIDENCE"); iso(e.observedAt,"EVIDENCE_OBSERVED_AT");
    if (!Array.isArray(e.quarantineReasons) || e.quarantineReasons.length > 16) throw new Error("QUARANTINE_REASONS_INVALID");
  }
  if (r.safeReadOnly !== true || r.executionAuthority !== false || r.mutationAuthority !== false || r.productionAuthority !== false) throw new Error("CONFIDENCE_AUTHORITY_VIOLATION");
  return Object.freeze({...r,evidence:Object.freeze(r.evidence.map(e=>Object.freeze({...e,quarantineReasons:Object.freeze([...e.quarantineReasons])})))});
}

export function assessIdentityConfidence(
  input: unknown,
  now: string,
  staleAfterMs = 7 * 24 * 60 * 60 * 1000,
): Readonly<XviIdentityConfidenceReceipt> {
  const r = validateIdentityConfidenceInput(input);
  iso(now,"NOW");
  if (!Number.isSafeInteger(staleAfterMs) || staleAfterMs < 60_000 || staleAfterMs > 90 * 24 * 60 * 60 * 1000) throw new Error("STALE_POLICY_INVALID");

  const nowMs = Date.parse(now);
  const support = r.evidence.filter(e=>e.supportsIdentity);
  const contradict = r.evidence.filter(e=>!e.supportsIdentity);
  const quarantined = r.evidence.some(e=>e.quarantineReasons.length>0);
  const jurisdictionMismatch = r.evidence.some(e=>e.jurisdictionId !== r.canonicalJurisdictionId);
  const ages = r.evidence.map(e=>nowMs-Date.parse(e.observedAt));
  if (ages.some(a=>a<0)) throw new Error("EVIDENCE_FROM_FUTURE");
  const freshestEvidenceAgeMs = Math.min(...ages);
  const allStale = ages.every(a=>a>staleAfterMs);

  const weight = (e: XviIdentityConfidenceEvidence) => (e.trustScore/100) * e.confidence;
  const weightedSupport = support.reduce((sum,e)=>sum+weight(e),0);
  const weightedContradiction = contradict.reduce((sum,e)=>sum+weight(e),0);
  const distinctSupportingSources = new Set(support.map(e=>e.sourceId)).size;

  const conflicts: XviIdentityConflictClass[] = [];
  if (contradict.length>0) conflicts.push("SOURCE_DISAGREEMENT");
  if (!r.lineageConsistent) conflicts.push("LINEAGE_INCONSISTENCY");
  if (jurisdictionMismatch) conflicts.push("JURISDICTION_MISMATCH");
  if (allStale) conflicts.push("STALE_EVIDENCE");
  if (distinctSupportingSources < 2) conflicts.push("INSUFFICIENT_CORROBORATION");
  if (conflicts.length===0) conflicts.push("NONE");

  let confidenceBand: XviConfidenceBand;
  if (weightedSupport < 0.5 || support.length===0) confidenceBand="INSUFFICIENT";
  else if (weightedSupport < 1.25) confidenceBand="LOW";
  else if (weightedSupport < 2.25) confidenceBand="MODERATE";
  else confidenceBand="HIGH";

  let escalationState: XviEscalationState = "CLEAR";
  if (quarantined) escalationState = "QUARANTINED";
  else if (conflicts[0] !== "NONE" || confidenceBand === "INSUFFICIENT" || confidenceBand === "LOW") escalationState = "REVIEW_REQUIRED";

  return Object.freeze({
    schemaVersion:"xvi-identity-confidence-v1",
    organizationId:r.organizationId,
    confidenceBand,
    escalationState,
    conflictClasses:Object.freeze([...conflicts]),
    supportingEvidenceCount:support.length,
    contradictingEvidenceCount:contradict.length,
    distinctSupportingSources,
    freshestEvidenceAgeMs,
    weightedSupport:Number(weightedSupport.toFixed(6)),
    weightedContradiction:Number(weightedContradiction.toFixed(6)),
    requiresHumanReview:escalationState!=="CLEAR",
    safeReadOnly:true,
    scoreIsTruth:false,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
