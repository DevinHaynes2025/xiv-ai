/* XVI 12D-876 — Africa Knowledge Fabric: Organization + Society Registry
   Prepared artifact only. No network, filesystem, secrets, providers, or production authority. */

export type XviOperatingMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
export type XviOrgClass =
  | "COMPANY" | "STARTUP" | "UNIVERSITY" | "RESEARCH_INSTITUTE"
  | "PUBLIC_INSTITUTION" | "NONPROFIT" | "CIVIL_SOCIETY"
  | "PORT" | "AIRPORT" | "LOGISTICS_NODE" | "FINANCIAL_INSTITUTION"
  | "HEALTH_INSTITUTION" | "ENERGY_OPERATOR" | "TELECOM_OPERATOR"
  | "INDUSTRY_ASSOCIATION" | "CULTURAL_INSTITUTION" | "OTHER";
export type XviEvidenceClass = "OFFICIAL_RECORD" | "LICENSED_DATASET" | "PEER_REVIEWED" | "PUBLIC_REFERENCE" | "COMMUNITY_REPORT" | "UNVERIFIED";
export type XviResolutionState = "UNRESOLVED" | "CANDIDATE" | "RESOLVED" | "CONFLICTED";
export type XviAdmissionState = "REGISTERED" | "QUARANTINED" | "REVIEWED" | "ADMITTED" | "REVOKED";

export interface XviJurisdictionRef {
  readonly jurisdictionId: string;
  readonly isoAlpha2: string;
  readonly auMember: true;
}

export interface XviProvenanceReceipt {
  readonly sourceId: string;
  readonly sourceRecordId: string;
  readonly evidenceClass: XviEvidenceClass;
  readonly licenseId: string;
  readonly allowedUse: readonly string[];
  readonly retrievedAt: string;
  readonly contentHash: string;
  readonly sourceTrustScore: number;
  readonly quarantineReasons: readonly string[];
}

export interface XviEntityResolutionReceipt {
  readonly resolutionState: XviResolutionState;
  readonly canonicalNameBasis: readonly string[];
  readonly aliasBasis: readonly string[];
  readonly externalIds: Readonly<Record<string, string>>;
  readonly duplicateCandidateIds: readonly string[];
  readonly confidence: number;
  readonly reviewed: boolean;
}

export interface XviAfricaOrganizationRecord {
  readonly entityId: string;
  readonly canonicalName: string;
  readonly aliases: readonly string[];
  readonly organizationClass: XviOrgClass;
  readonly jurisdiction: XviJurisdictionRef;
  readonly subnationalRegion: string | null;
  readonly locality: string | null;
  readonly sectors: readonly string[];
  readonly languages: readonly string[];
  readonly websiteDomain: string | null;
  readonly provenance: readonly XviProvenanceReceipt[];
  readonly resolution: XviEntityResolutionReceipt;
  readonly admissionState: XviAdmissionState;
  readonly modesAllowed: readonly XviOperatingMode[];
  readonly observedAt: string;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly supersedesEntityId: string | null;
  readonly personalDataClass: "NONE" | "AGGREGATED" | "PUBLIC_PROFESSIONAL" | "RESTRICTED";
  readonly secretsPresent: false;
  readonly executionAuthority: false;
  readonly networkAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviOrganizationAdmissionReceipt {
  readonly entityId: string;
  readonly jurisdictionId: string;
  readonly admissionState: XviAdmissionState;
  readonly reasons: readonly string[];
  readonly evidenceCount: number;
  readonly resolutionState: XviResolutionState;
  readonly contentBinding: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
function assertPlainObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== PLAIN) throw new Error(`${label}_PLAIN_OBJECT_REQUIRED`);
  if (Object.getOwnPropertySymbols(value).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const key of Object.keys(value)) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (!d || typeof d.get === "function" || typeof d.set === "function") throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}

function assertExactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const keys = Object.keys(value).sort();
  const expected = [...allowed].sort();
  if (keys.length !== expected.length || keys.some((k,i)=>k!==expected[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}

function isIsoDateTime(v: string): boolean { return !Number.isNaN(Date.parse(v)) && /T/.test(v); }
function isHash(v: string): boolean { return /^[a-f0-9]{64}$/.test(v); }
function boundedStrings(values: readonly string[], max: number, label: string): void {
  if (!Array.isArray(values) || values.length > max) throw new Error(`${label}_CEILING`);
  const seen = new Set<string>();
  for (const v of values) {
    if (typeof v !== "string" || !v.trim() || v.length > 256) throw new Error(`${label}_INVALID`);
    if (seen.has(v)) throw new Error(`${label}_DUPLICATE`);
    seen.add(v);
  }
}

function stableBindingMaterial(r: XviAfricaOrganizationRecord): string {
  return JSON.stringify({
    entityId:r.entityId, canonicalName:r.canonicalName, organizationClass:r.organizationClass,
    jurisdictionId:r.jurisdiction.jurisdictionId, sectors:[...r.sectors].sort(),
    sourceBindings:r.provenance.map(p=>`${p.sourceId}:${p.sourceRecordId}:${p.contentHash}`).sort(),
    resolution:r.resolution.resolutionState, observedAt:r.observedAt, admissionState:r.admissionState
  });
}

function deterministicBinding(input: string): string {
  let h1 = 0x811c9dc5, h2 = 0x9e3779b9;
  for (let i=0;i<input.length;i++) {
    const c = input.charCodeAt(i);
    h1 ^= c; h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= (c + i); h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8,"0")}${h2.toString(16).padStart(8,"0")}`;
}

export function validateAfricaOrganizationRecord(input: unknown): Readonly<XviAfricaOrganizationRecord> {
  assertPlainObject(input, "ENTITY");
  const keys = ["entityId","canonicalName","aliases","organizationClass","jurisdiction","subnationalRegion","locality","sectors","languages","websiteDomain","provenance","resolution","admissionState","modesAllowed","observedAt","validFrom","validTo","supersedesEntityId","personalDataClass","secretsPresent","executionAuthority","networkAuthority","mutationAuthority","productionAuthority"] as const;
  assertExactKeys(input, keys, "ENTITY");
  const r = input as unknown as XviAfricaOrganizationRecord;
  if (!/^org:africa:[a-z0-9._:-]{3,180}$/.test(r.entityId)) throw new Error("ENTITY_ID_INVALID");
  if (!r.canonicalName?.trim() || r.canonicalName.length > 240) throw new Error("CANONICAL_NAME_INVALID");
  boundedStrings(r.aliases, 32, "ALIASES"); boundedStrings(r.sectors, 32, "SECTORS"); boundedStrings(r.languages, 32, "LANGUAGES");
  if (!r.jurisdiction || r.jurisdiction.auMember !== true || !/^jurisdiction:/.test(r.jurisdiction.jurisdictionId) || !/^[A-Z]{2}$/.test(r.jurisdiction.isoAlpha2)) throw new Error("AU_JURISDICTION_REQUIRED");
  if (r.websiteDomain !== null && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(r.websiteDomain)) throw new Error("WEBSITE_DOMAIN_INVALID");
  if (!Array.isArray(r.provenance) || r.provenance.length < 1 || r.provenance.length > 32) throw new Error("PROVENANCE_REQUIRED");
  for (const rawP of r.provenance) {
    assertPlainObject(rawP, "PROVENANCE");
    assertExactKeys(rawP,["sourceId","sourceRecordId","evidenceClass","licenseId","allowedUse","retrievedAt","contentHash","sourceTrustScore","quarantineReasons"],"PROVENANCE");
    const p = rawP as unknown as XviProvenanceReceipt;
    if (typeof p.sourceId !== "string" || !p.sourceId.trim() || typeof p.sourceRecordId !== "string" || !p.sourceRecordId.trim() || typeof p.licenseId !== "string" || !p.licenseId.trim()) throw new Error("PROVENANCE_IDENTITY_REQUIRED");
    if (typeof p.retrievedAt !== "string" || typeof p.contentHash !== "string" || !isIsoDateTime(p.retrievedAt) || !isHash(p.contentHash)) throw new Error("PROVENANCE_BINDING_INVALID");
    if (!Number.isFinite(p.sourceTrustScore) || p.sourceTrustScore < 0 || p.sourceTrustScore > 100) throw new Error("SOURCE_TRUST_SCORE_INVALID");
    boundedStrings(p.allowedUse, 16, "ALLOWED_USE"); boundedStrings(p.quarantineReasons, 16, "QUARANTINE_REASONS");
  }
  assertPlainObject(r.resolution, "RESOLUTION");
  assertExactKeys(r.resolution,["resolutionState","canonicalNameBasis","aliasBasis","externalIds","duplicateCandidateIds","confidence","reviewed"],"RESOLUTION");
  boundedStrings(r.resolution.canonicalNameBasis, 16, "CANONICAL_BASIS"); boundedStrings(r.resolution.aliasBasis, 32, "ALIAS_BASIS"); boundedStrings(r.resolution.duplicateCandidateIds, 32, "DUPLICATE_CANDIDATES");
  assertPlainObject(r.resolution.externalIds, "EXTERNAL_IDS");
  if (Object.keys(r.resolution.externalIds).length > 32) throw new Error("EXTERNAL_ID_CEILING");
  if (!Number.isFinite(r.resolution.confidence) || r.resolution.confidence < 0 || r.resolution.confidence > 1) throw new Error("RESOLUTION_CONFIDENCE_INVALID");
  if (r.resolution.resolutionState === "RESOLVED" && (!r.resolution.reviewed || r.resolution.confidence < 0.8)) throw new Error("RESOLVED_REQUIRES_REVIEW");
  if (r.admissionState === "ADMITTED") {
    if (r.personalDataClass === "RESTRICTED") throw new Error("RESTRICTED_NOT_ADMITTED");
    if (r.resolution.resolutionState !== "RESOLVED") throw new Error("ADMISSION_REQUIRES_RESOLUTION");
    if (r.provenance.some(p=>p.evidenceClass === "UNVERIFIED" || p.quarantineReasons.length > 0)) throw new Error("ADMISSION_REQUIRES_CLEAN_PROVENANCE");
  }
  if (r.provenance.some(p=>p.evidenceClass === "UNVERIFIED") && r.admissionState !== "QUARANTINED") throw new Error("UNVERIFIED_MUST_QUARANTINE");
  if (r.provenance.some(p=>p.quarantineReasons.length > 0) && r.admissionState === "ADMITTED") throw new Error("QUARANTINE_REASON_BLOCKS_ADMISSION");
  if (!Array.isArray(r.modesAllowed) || r.modesAllowed.length < 1 || r.modesAllowed.length > 3) throw new Error("MODE_REQUIRED");
  if (new Set(r.modesAllowed).size !== r.modesAllowed.length) throw new Error("MODE_DUPLICATE");
  if (!isIsoDateTime(r.observedAt)) throw new Error("OBSERVED_AT_INVALID");
  if (r.validFrom !== null && !isIsoDateTime(r.validFrom)) throw new Error("VALID_FROM_INVALID");
  if (r.validTo !== null && !isIsoDateTime(r.validTo)) throw new Error("VALID_TO_INVALID");
  if (r.validFrom && r.validTo && Date.parse(r.validFrom) > Date.parse(r.validTo)) throw new Error("TEMPORAL_RANGE_INVALID");
  if (r.secretsPresent !== false || r.executionAuthority !== false || r.networkAuthority !== false || r.mutationAuthority !== false || r.productionAuthority !== false) throw new Error("AUTHORITY_OR_SECRET_VIOLATION");
  return Object.freeze({...r, aliases:Object.freeze([...r.aliases]), sectors:Object.freeze([...r.sectors]), languages:Object.freeze([...r.languages]), modesAllowed:Object.freeze([...r.modesAllowed]), provenance:Object.freeze(r.provenance.map(p=>Object.freeze({...p,allowedUse:Object.freeze([...p.allowedUse]),quarantineReasons:Object.freeze([...p.quarantineReasons])}))), resolution:Object.freeze({...r.resolution,canonicalNameBasis:Object.freeze([...r.resolution.canonicalNameBasis]),aliasBasis:Object.freeze([...r.resolution.aliasBasis]),duplicateCandidateIds:Object.freeze([...r.resolution.duplicateCandidateIds]),externalIds:Object.freeze({...r.resolution.externalIds})}), jurisdiction:Object.freeze({...r.jurisdiction})});
}

export function issueOrganizationAdmissionReceipt(input: unknown): Readonly<XviOrganizationAdmissionReceipt> {
  const r = validateAfricaOrganizationRecord(input);
  const reasons: string[] = [];
  if (r.admissionState !== "ADMITTED") reasons.push(`STATE_${r.admissionState}`);
  if (r.resolution.resolutionState !== "RESOLVED") reasons.push(`RESOLUTION_${r.resolution.resolutionState}`);
  if (r.provenance.some(p=>p.quarantineReasons.length)) reasons.push("PROVENANCE_QUARANTINED");
  const receipt: XviOrganizationAdmissionReceipt = {
    entityId:r.entityId, jurisdictionId:r.jurisdiction.jurisdictionId, admissionState:r.admissionState,
    reasons:Object.freeze(reasons), evidenceCount:r.provenance.length, resolutionState:r.resolution.resolutionState,
    contentBinding:deterministicBinding(stableBindingMaterial(r)), safeReadOnly:true,
    executionAuthority:false, mutationAuthority:false, productionAuthority:false
  };
  return Object.freeze(receipt);
}
