export type XviOperatingMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
export type XviReconciliationKind = "SAME_ENTITY" | "RENAME" | "MERGE" | "SPLIT" | "DISTINCT_ENTITY";
export type XviReconciliationDecision = "PROPOSED" | "CONFIRMED" | "REJECTED" | "QUARANTINED";

export interface XviIdentityCandidate {
  readonly organizationId: string;
  readonly canonicalName: string;
  readonly jurisdictionId: string;
  readonly aliases: readonly string[];
  readonly identityKeys: readonly string[];
  readonly lifecycleState: "ACTIVE" | "INACTIVE" | "DISSOLVED" | "MERGED" | "RESTRUCTURED" | "UNKNOWN";
}

export interface XviReconciliationEvidence {
  readonly sourceId: string;
  readonly sourceRecordId: string;
  readonly contentHash: string;
  readonly supports: boolean;
  readonly confidence: number;
  readonly quarantineReasons: readonly string[];
}

export interface XviOrganizationIdentityReconciliation {
  readonly reconciliationId: string;
  readonly kind: XviReconciliationKind;
  readonly decision: XviReconciliationDecision;
  readonly canonicalOrganizationId: string;
  readonly candidates: readonly XviIdentityCandidate[];
  readonly evidence: readonly XviReconciliationEvidence[];
  readonly effectiveAt: string;
  readonly reviewedByHuman: boolean;
  readonly modesAllowed: readonly XviOperatingMode[];
  readonly secretsPresent: false;
  readonly executionAuthority: false;
  readonly networkAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviCanonicalIdentityReceipt {
  readonly reconciliationId: string;
  readonly kind: XviReconciliationKind;
  readonly decision: XviReconciliationDecision;
  readonly canonicalOrganizationId: string;
  readonly candidateOrganizationIds: readonly string[];
  readonly supportingEvidenceCount: number;
  readonly contradictingEvidenceCount: number;
  readonly requiresHumanReview: boolean;
  readonly displayAliasSet: readonly string[];
  readonly safeReadOnly: true;
  readonly canRewriteHistory: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const MODES = new Set<XviOperatingMode>(["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"]);
const KINDS = new Set<XviReconciliationKind>(["SAME_ENTITY","RENAME","MERGE","SPLIT","DISTINCT_ENTITY"]);
const DECISIONS = new Set<XviReconciliationDecision>(["PROPOSED","CONFIRMED","REJECTED","QUARANTINED"]);
const LIFE = new Set(["ACTIVE","INACTIVE","DISSOLVED","MERGED","RESTRUCTURED","UNKNOWN"]);

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
function strings(v: readonly string[], max: number, label: string, allowEmpty = true): void {
  if (!Array.isArray(v) || v.length > max || (!allowEmpty && v.length < 1)) throw new Error(`${label}_COUNT`);
  const seen = new Set<string>();
  for (const x of v) { if (typeof x !== "string" || !x.trim() || x.length > 240) throw new Error(`${label}_INVALID`); if (seen.has(x)) throw new Error(`${label}_DUPLICATE`); seen.add(x); }
}
function iso(v: string): boolean { return typeof v === "string" && v.includes("T") && !Number.isNaN(Date.parse(v)); }
function hash(v: string): boolean { return typeof v === "string" && /^[a-f0-9]{64}$/.test(v); }

export function validateOrganizationIdentityReconciliation(input: unknown): Readonly<XviOrganizationIdentityReconciliation> {
  plain(input, "RECONCILIATION");
  exact(input,["reconciliationId","kind","decision","canonicalOrganizationId","candidates","evidence","effectiveAt","reviewedByHuman","modesAllowed","secretsPresent","executionAuthority","networkAuthority","mutationAuthority","productionAuthority"],"RECONCILIATION");
  const r = input as unknown as XviOrganizationIdentityReconciliation;
  if (!/^reconcile:org:/.test(r.reconciliationId) || !/^org:/.test(r.canonicalOrganizationId)) throw new Error("RECONCILIATION_IDENTITY_INVALID");
  if (!KINDS.has(r.kind) || !DECISIONS.has(r.decision)) throw new Error("RECONCILIATION_STATE_INVALID");
  if (!Array.isArray(r.candidates) || r.candidates.length < 1 || r.candidates.length > 16) throw new Error("CANDIDATE_COUNT_INVALID");
  const candidateIds = new Set<string>();
  for (const raw of r.candidates) {
    plain(raw,"CANDIDATE");
    exact(raw,["organizationId","canonicalName","jurisdictionId","aliases","identityKeys","lifecycleState"],"CANDIDATE");
    const c = raw as unknown as XviIdentityCandidate;
    if (!/^org:/.test(c.organizationId) || !c.canonicalName?.trim() || !/^jurisdiction:/.test(c.jurisdictionId) || !LIFE.has(c.lifecycleState)) throw new Error("CANDIDATE_INVALID");
    if (candidateIds.has(c.organizationId)) throw new Error("CANDIDATE_DUPLICATE");
    candidateIds.add(c.organizationId);
    strings(c.aliases,64,"ALIASES"); strings(c.identityKeys,32,"IDENTITY_KEYS");
  }
  if (!candidateIds.has(r.canonicalOrganizationId)) throw new Error("CANONICAL_MUST_BE_CANDIDATE");
  if (!Array.isArray(r.evidence) || r.evidence.length < 1 || r.evidence.length > 64) throw new Error("EVIDENCE_REQUIRED");
  let support = 0, contradict = 0;
  for (const raw of r.evidence) {
    plain(raw,"EVIDENCE");
    exact(raw,["sourceId","sourceRecordId","contentHash","supports","confidence","quarantineReasons"],"EVIDENCE");
    const e = raw as unknown as XviReconciliationEvidence;
    if (!e.sourceId?.trim() || !e.sourceRecordId?.trim() || !hash(e.contentHash)) throw new Error("EVIDENCE_BINDING_INVALID");
    if (typeof e.supports !== "boolean" || !Number.isFinite(e.confidence) || e.confidence < 0 || e.confidence > 1) throw new Error("EVIDENCE_CONFIDENCE_INVALID");
    if (!Array.isArray(e.quarantineReasons) || e.quarantineReasons.length > 16) throw new Error("EVIDENCE_QUARANTINE_INVALID");
    e.supports ? support++ : contradict++;
  }
  if (!iso(r.effectiveAt)) throw new Error("EFFECTIVE_AT_INVALID");
  strings(r.modesAllowed,3,"MODES",false); if (r.modesAllowed.some(m=>!MODES.has(m))) throw new Error("MODE_INVALID");
  const destructive = r.kind === "MERGE" || r.kind === "SPLIT";
  if (destructive && !r.reviewedByHuman) throw new Error("STRUCTURAL_CHANGE_REQUIRES_HUMAN_REVIEW");
  if (r.kind === "MERGE" && r.candidates.length < 2) throw new Error("MERGE_REQUIRES_MULTIPLE_CANDIDATES");
  if (r.kind === "SPLIT" && r.candidates.length < 2) throw new Error("SPLIT_REQUIRES_MULTIPLE_CANDIDATES");
  if (r.kind === "RENAME" && r.candidates.length !== 1) throw new Error("RENAME_REQUIRES_SINGLE_CANDIDATE");
  if (r.kind === "DISTINCT_ENTITY" && r.candidates.length < 2) throw new Error("DISTINCT_REQUIRES_MULTIPLE_CANDIDATES");
  if (r.decision === "CONFIRMED") {
    if (!r.reviewedByHuman) throw new Error("CONFIRMED_REQUIRES_HUMAN_REVIEW");
    if (support < 1) throw new Error("CONFIRMED_REQUIRES_SUPPORT");
    if (contradict > 0) throw new Error("CONFIRMED_CONTRADICTION_REQUIRES_REVIEW_STATE");
    if (r.evidence.some(e=>e.quarantineReasons.length>0)) throw new Error("CONFIRMED_REQUIRES_CLEAN_EVIDENCE");
  }
  if (r.evidence.some(e=>e.quarantineReasons.length>0) && r.decision !== "QUARANTINED") throw new Error("QUARANTINED_EVIDENCE_REQUIRES_STATE");
  if (r.secretsPresent !== false || r.executionAuthority !== false || r.networkAuthority !== false || r.mutationAuthority !== false || r.productionAuthority !== false) throw new Error("AUTHORITY_OR_SECRET_VIOLATION");
  return Object.freeze({...r,candidates:Object.freeze(r.candidates.map(c=>Object.freeze({...c,aliases:Object.freeze([...c.aliases]),identityKeys:Object.freeze([...c.identityKeys])}))),evidence:Object.freeze(r.evidence.map(e=>Object.freeze({...e,quarantineReasons:Object.freeze([...e.quarantineReasons])}))),modesAllowed:Object.freeze([...r.modesAllowed])});
}

export function issueCanonicalIdentityReceipt(input: unknown): Readonly<XviCanonicalIdentityReceipt> {
  const r = validateOrganizationIdentityReconciliation(input);
  const support = r.evidence.filter(e=>e.supports).length;
  const contradict = r.evidence.length - support;
  const aliases = new Set<string>();
  for (const c of r.candidates) { aliases.add(c.canonicalName); for (const a of c.aliases) aliases.add(a); }
  return Object.freeze({
    reconciliationId:r.reconciliationId,
    kind:r.kind,
    decision:r.decision,
    canonicalOrganizationId:r.canonicalOrganizationId,
    candidateOrganizationIds:Object.freeze(r.candidates.map(c=>c.organizationId)),
    supportingEvidenceCount:support,
    contradictingEvidenceCount:contradict,
    requiresHumanReview:r.decision!=="CONFIRMED" || contradict>0 || r.evidence.some(e=>e.quarantineReasons.length>0),
    displayAliasSet:Object.freeze([...aliases].sort((a,b)=>a.localeCompare(b))),
    safeReadOnly:true,
    canRewriteHistory:false,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
