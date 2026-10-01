export type XviOperatingMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
export type XviOrganizationLifecycleState = "ACTIVE" | "INACTIVE" | "DISSOLVED" | "MERGED" | "RESTRUCTURED" | "UNKNOWN";
export type XviOrganizationIdentityState = "UNRESOLVED" | "CANDIDATE" | "RESOLVED" | "CONFLICTED" | "REVOKED";

export interface XviOrganizationIdentityKey {
  readonly namespace: string;
  readonly value: string;
  readonly issuerJurisdictionId: string | null;
}

export interface XviOrganizationIdentityEvidence {
  readonly sourceId: string;
  readonly sourceRecordId: string;
  readonly contentHash: string;
  readonly observedAt: string;
  readonly confidence: number;
  readonly supportsIdentity: boolean;
  readonly quarantineReasons: readonly string[];
}

export interface XviOrganizationLifecycleRecord {
  readonly organizationId: string;
  readonly canonicalName: string;
  readonly jurisdictionId: string;
  readonly identityState: XviOrganizationIdentityState;
  readonly lifecycleState: XviOrganizationLifecycleState;
  readonly identityKeys: readonly XviOrganizationIdentityKey[];
  readonly aliases: readonly string[];
  readonly predecessorIds: readonly string[];
  readonly successorIds: readonly string[];
  readonly evidence: readonly XviOrganizationIdentityEvidence[];
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
  readonly observedAt: string;
  readonly modesAllowed: readonly XviOperatingMode[];
  readonly secretsPresent: false;
  readonly executionAuthority: false;
  readonly networkAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviOrganizationLifecycleReceipt {
  readonly organizationId: string;
  readonly identityState: XviOrganizationIdentityState;
  readonly lifecycleState: XviOrganizationLifecycleState;
  readonly identityKeyCount: number;
  readonly supportingEvidenceCount: number;
  readonly contradictingEvidenceCount: number;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const MODES = new Set<XviOperatingMode>(["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"]);
const IDENTITY_STATES = new Set<XviOrganizationIdentityState>(["UNRESOLVED","CANDIDATE","RESOLVED","CONFLICTED","REVOKED"]);
const LIFE_STATES = new Set<XviOrganizationLifecycleState>(["ACTIVE","INACTIVE","DISSOLVED","MERGED","RESTRUCTURED","UNKNOWN"]);

function assertPlain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v === null || typeof v !== "object" || Object.getPrototypeOf(v) !== PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const k of Object.keys(v)) {
    const d = Object.getOwnPropertyDescriptor(v, k);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}

function assertExact(v: Record<string, unknown>, keys: readonly string[], label: string): void {
  const a = Object.keys(v).sort();
  const b = [...keys].sort();
  if (a.length !== b.length || a.some((k, i) => k !== b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}

function assertIso(v: string, label: string): void {
  if (typeof v !== "string" || !/T/.test(v) || Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}

function assertHash(v: string): void {
  if (!/^[a-f0-9]{64}$/.test(v)) throw new Error("CONTENT_HASH_INVALID");
}

function assertUniqueStrings(v: readonly string[], max: number, label: string): void {
  if (!Array.isArray(v) || v.length > max) throw new Error(`${label}_COUNT`);
  const seen = new Set<string>();
  for (const x of v) {
    if (typeof x !== "string" || !x.trim() || x.length > 240) throw new Error(`${label}_INVALID`);
    if (seen.has(x)) throw new Error(`${label}_DUPLICATE`);
    seen.add(x);
  }
}

export function validateOrganizationLifecycleRecord(input: unknown): Readonly<XviOrganizationLifecycleRecord> {
  assertPlain(input, "ORG_LIFECYCLE");
  assertExact(input,["organizationId","canonicalName","jurisdictionId","identityState","lifecycleState","identityKeys","aliases","predecessorIds","successorIds","evidence","effectiveFrom","effectiveTo","observedAt","modesAllowed","secretsPresent","executionAuthority","networkAuthority","mutationAuthority","productionAuthority"],"ORG_LIFECYCLE");
  const r = input as unknown as XviOrganizationLifecycleRecord;
  if (!/^org:/.test(r.organizationId) || !r.canonicalName?.trim() || !/^jurisdiction:/.test(r.jurisdictionId)) throw new Error("ORG_IDENTITY_INVALID");
  if (!IDENTITY_STATES.has(r.identityState) || !LIFE_STATES.has(r.lifecycleState)) throw new Error("ORG_STATE_INVALID");
  assertUniqueStrings(r.aliases, 64, "ALIASES");
  assertUniqueStrings(r.predecessorIds, 32, "PREDECESSORS");
  assertUniqueStrings(r.successorIds, 32, "SUCCESSORS");
  if (r.predecessorIds.includes(r.organizationId) || r.successorIds.includes(r.organizationId)) throw new Error("SELF_LINEAGE_FORBIDDEN");
  if (!Array.isArray(r.identityKeys) || r.identityKeys.length > 32) throw new Error("IDENTITY_KEY_COUNT");
  const keySeen = new Set<string>();
  for (const raw of r.identityKeys) {
    assertPlain(raw, "IDENTITY_KEY");
    assertExact(raw,["namespace","value","issuerJurisdictionId"],"IDENTITY_KEY");
    const k = raw as unknown as XviOrganizationIdentityKey;
    if (!k.namespace?.trim() || !k.value?.trim()) throw new Error("IDENTITY_KEY_INVALID");
    if (k.issuerJurisdictionId !== null && !/^jurisdiction:/.test(k.issuerJurisdictionId)) throw new Error("IDENTITY_KEY_JURISDICTION_INVALID");
    const composite = `${k.namespace}\u0000${k.value}`;
    if (keySeen.has(composite)) throw new Error("IDENTITY_KEY_DUPLICATE");
    keySeen.add(composite);
  }
  if (!Array.isArray(r.evidence) || r.evidence.length < 1 || r.evidence.length > 64) throw new Error("IDENTITY_EVIDENCE_REQUIRED");
  let support = 0, contradict = 0;
  for (const raw of r.evidence) {
    assertPlain(raw, "IDENTITY_EVIDENCE");
    assertExact(raw,["sourceId","sourceRecordId","contentHash","observedAt","confidence","supportsIdentity","quarantineReasons"],"IDENTITY_EVIDENCE");
    const e = raw as unknown as XviOrganizationIdentityEvidence;
    if (!e.sourceId?.trim() || !e.sourceRecordId?.trim()) throw new Error("IDENTITY_EVIDENCE_ID_INVALID");
    assertHash(e.contentHash); assertIso(e.observedAt, "IDENTITY_EVIDENCE_TIME");
    if (!Number.isFinite(e.confidence) || e.confidence < 0 || e.confidence > 1) throw new Error("IDENTITY_EVIDENCE_CONFIDENCE_INVALID");
    if (!Array.isArray(e.quarantineReasons) || e.quarantineReasons.length > 16) throw new Error("IDENTITY_EVIDENCE_QUARANTINE_INVALID");
    e.supportsIdentity ? support++ : contradict++;
  }
  if (r.identityState === "RESOLVED") {
    if (r.identityKeys.length < 1) throw new Error("RESOLVED_REQUIRES_IDENTITY_KEY");
    if (support < 1) throw new Error("RESOLVED_REQUIRES_SUPPORT");
    if (r.evidence.some(e => e.quarantineReasons.length > 0)) throw new Error("RESOLVED_REQUIRES_CLEAN_EVIDENCE");
    if (contradict > 0) throw new Error("RESOLVED_CONTRADICTION_REQUIRES_CONFLICT");
  }
  if (r.identityState === "CONFLICTED" && contradict < 1) throw new Error("CONFLICTED_REQUIRES_CONTRADICTION");
  if ((r.lifecycleState === "MERGED" || r.lifecycleState === "DISSOLVED") && r.effectiveTo === null) throw new Error("TERMINAL_LIFECYCLE_REQUIRES_END");
  if (r.lifecycleState === "MERGED" && r.successorIds.length < 1) throw new Error("MERGED_REQUIRES_SUCCESSOR");
  if (r.lifecycleState === "ACTIVE" && r.effectiveTo !== null) throw new Error("ACTIVE_CANNOT_HAVE_END");
  if (r.effectiveFrom !== null) assertIso(r.effectiveFrom, "EFFECTIVE_FROM");
  if (r.effectiveTo !== null) assertIso(r.effectiveTo, "EFFECTIVE_TO");
  if (r.effectiveFrom && r.effectiveTo && Date.parse(r.effectiveFrom) > Date.parse(r.effectiveTo)) throw new Error("LIFECYCLE_RANGE_INVALID");
  assertIso(r.observedAt, "OBSERVED_AT");
  assertUniqueStrings(r.modesAllowed, 3, "MODES");
  if (r.modesAllowed.length < 1 || r.modesAllowed.some(m => !MODES.has(m))) throw new Error("MODE_INVALID");
  if (r.secretsPresent !== false || r.executionAuthority !== false || r.networkAuthority !== false || r.mutationAuthority !== false || r.productionAuthority !== false) throw new Error("AUTHORITY_OR_SECRET_VIOLATION");
  return Object.freeze({...r,identityKeys:Object.freeze(r.identityKeys.map(k=>Object.freeze({...k}))),aliases:Object.freeze([...r.aliases]),predecessorIds:Object.freeze([...r.predecessorIds]),successorIds:Object.freeze([...r.successorIds]),evidence:Object.freeze(r.evidence.map(e=>Object.freeze({...e,quarantineReasons:Object.freeze([...e.quarantineReasons])}))),modesAllowed:Object.freeze([...r.modesAllowed])});
}

export function issueOrganizationLifecycleReceipt(input: unknown): Readonly<XviOrganizationLifecycleReceipt> {
  const r = validateOrganizationLifecycleRecord(input);
  const support = r.evidence.filter(e=>e.supportsIdentity).length;
  const contradict = r.evidence.length - support;
  return Object.freeze({
    organizationId:r.organizationId,
    identityState:r.identityState,
    lifecycleState:r.lifecycleState,
    identityKeyCount:r.identityKeys.length,
    supportingEvidenceCount:support,
    contradictingEvidenceCount:contradict,
    requiresHumanReview:r.identityState!=="RESOLVED" || contradict>0 || r.evidence.some(e=>e.quarantineReasons.length>0),
    safeReadOnly:true,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
