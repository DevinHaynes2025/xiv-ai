export type XviGlobalEdgeType =
  | "PARENT_OF" | "SUBSIDIARY_OF" | "PARTNERS_WITH" | "LOCATED_IN" | "OPERATES_IN"
  | "USES_INFRASTRUCTURE" | "RESEARCHES" | "REGULATES" | "PROVIDES_SERVICE"
  | "SUPPORTS_CLAIM" | "CONTRADICTS_CLAIM";
export type XviEdgeDisputeState = "UNDISPUTED" | "DISPUTED" | "CONTRADICTED" | "REVOKED";

export interface XviCoverageAwareEdgeInput {
  readonly edgeId: string;
  readonly edgeType: XviGlobalEdgeType;
  readonly fromEntityId: string;
  readonly toEntityId: string;
  readonly fromIdentityResolved: boolean;
  readonly toIdentityResolved: boolean;
  readonly sourceJurisdictionId: string;
  readonly targetJurisdictionId: string;
  readonly datasetId: string;
  readonly datasetAdmitted: boolean;
  readonly datasetLineageSafe: boolean;
  readonly datasetFresh: boolean;
  readonly licenseCompatible: boolean;
  readonly independentSourceRoots: number;
  readonly relevantDomainCoverageRatio: number;
  readonly relevantDomainFreshnessRatio: number;
  readonly quarantinedEvidenceCount: number;
  readonly supportingEvidenceCount: number;
  readonly contradictingEvidenceCount: number;
  readonly disputeState: XviEdgeDisputeState;
  readonly observedAt: string;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviCoverageAwareEdgeReceipt {
  readonly schemaVersion: "xvi-global-coverage-aware-edge-v1";
  readonly edgeId: string;
  readonly edgeType: XviGlobalEdgeType;
  readonly admissible: boolean;
  readonly route: "UNIVERSE" | "NEEDS_YOU";
  readonly reasons: readonly string[];
  readonly disputeState: XviEdgeDisputeState;
  readonly supportingEvidenceCount: number;
  readonly contradictingEvidenceCount: number;
  readonly independentSourceRoots: number;
  readonly relevantDomainCoverageRatio: number;
  readonly safeReadOnly: true;
  readonly canClaimRelationship: boolean;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const TYPES = new Set<XviGlobalEdgeType>(["PARENT_OF","SUBSIDIARY_OF","PARTNERS_WITH","LOCATED_IN","OPERATES_IN","USES_INFRASTRUCTURE","RESEARCHES","REGULATES","PROVIDES_SERVICE","SUPPORTS_CLAIM","CONTRADICTS_CLAIM"]);
const DISPUTES = new Set<XviEdgeDisputeState>(["UNDISPUTED","DISPUTED","CONTRADICTED","REVOKED"]);

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v===null || typeof v!=="object" || Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const k of Object.keys(v)) {
    const d = Object.getOwnPropertyDescriptor(v,k);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}
function exact(v:Record<string,unknown>,keys:readonly string[],label:string):void{
  const a=Object.keys(v).sort(),b=[...keys].sort();
  if(a.length!==b.length||a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v:string,label:string):void{
  if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function count(v:number,label:string):void{
  if(!Number.isSafeInteger(v)||v<0||v>1_000_000_000) throw new Error(`${label}_INVALID`);
}
function ratio(v:number,label:string):void{
  if(!Number.isFinite(v)||v<0||v>1) throw new Error(`${label}_INVALID`);
}

export function validateCoverageAwareEdgeInput(input: unknown): Readonly<XviCoverageAwareEdgeInput> {
  plain(input,"GLOBAL_EDGE");
  exact(input,[
    "edgeId","edgeType","fromEntityId","toEntityId","fromIdentityResolved","toIdentityResolved",
    "sourceJurisdictionId","targetJurisdictionId","datasetId","datasetAdmitted","datasetLineageSafe",
    "datasetFresh","licenseCompatible","independentSourceRoots","relevantDomainCoverageRatio",
    "relevantDomainFreshnessRatio","quarantinedEvidenceCount","supportingEvidenceCount",
    "contradictingEvidenceCount","disputeState","observedAt","validFrom","validTo","safeReadOnly",
    "executionAuthority","mutationAuthority","productionAuthority"
  ],"GLOBAL_EDGE");
  const r=input as unknown as XviCoverageAwareEdgeInput;
  if(!/^edge:/.test(r.edgeId)||!TYPES.has(r.edgeType)||!r.fromEntityId?.trim()||!r.toEntityId?.trim()||r.fromEntityId===r.toEntityId) throw new Error("GLOBAL_EDGE_IDENTITY_INVALID");
  if(!/^jurisdiction:/.test(r.sourceJurisdictionId)||!/^jurisdiction:/.test(r.targetJurisdictionId)||!/^dataset:/.test(r.datasetId)) throw new Error("GLOBAL_EDGE_SCOPE_INVALID");
  for (const flag of [r.fromIdentityResolved,r.toIdentityResolved,r.datasetAdmitted,r.datasetLineageSafe,r.datasetFresh,r.licenseCompatible]) {
    if(typeof flag!=="boolean") throw new Error("GLOBAL_EDGE_FLAG_INVALID");
  }
  count(r.independentSourceRoots,"INDEPENDENT_SOURCE_ROOTS");
  count(r.quarantinedEvidenceCount,"QUARANTINED_EVIDENCE_COUNT");
  count(r.supportingEvidenceCount,"SUPPORTING_EVIDENCE_COUNT");
  count(r.contradictingEvidenceCount,"CONTRADICTING_EVIDENCE_COUNT");
  ratio(r.relevantDomainCoverageRatio,"DOMAIN_COVERAGE_RATIO");
  ratio(r.relevantDomainFreshnessRatio,"DOMAIN_FRESHNESS_RATIO");
  if(!DISPUTES.has(r.disputeState)) throw new Error("DISPUTE_STATE_INVALID");
  iso(r.observedAt,"OBSERVED_AT");
  if(r.validFrom!==null) iso(r.validFrom,"VALID_FROM");
  if(r.validTo!==null) iso(r.validTo,"VALID_TO");
  if(r.validFrom&&r.validTo&&Date.parse(r.validFrom)>Date.parse(r.validTo)) throw new Error("GLOBAL_EDGE_TEMPORAL_INVALID");
  if(r.disputeState==="UNDISPUTED"&&r.contradictingEvidenceCount>0) throw new Error("UNDISPUTED_CANNOT_HIDE_CONTRADICTION");
  if(r.disputeState==="CONTRADICTED"&&r.contradictingEvidenceCount<1) throw new Error("CONTRADICTED_REQUIRES_EVIDENCE");
  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("GLOBAL_EDGE_AUTHORITY_VIOLATION");
  return Object.freeze({...r});
}

export function assessCoverageAwareEdge(input: unknown): Readonly<XviCoverageAwareEdgeReceipt> {
  const r=validateCoverageAwareEdgeInput(input);
  const reasons:string[]=[];
  if(!r.fromIdentityResolved) reasons.push("Source identity unresolved");
  if(!r.toIdentityResolved) reasons.push("Target identity unresolved");
  if(!r.datasetAdmitted) reasons.push("Dataset not admitted");
  if(!r.datasetLineageSafe) reasons.push("Dataset lineage unsafe");
  if(!r.datasetFresh) reasons.push("Dataset stale");
  if(!r.licenseCompatible) reasons.push("License incompatible");
  if(r.independentSourceRoots<2) reasons.push("Insufficient independent source roots");
  if(r.relevantDomainCoverageRatio<=0) reasons.push("Relevant domain has zero coverage");
  else if(r.relevantDomainCoverageRatio<0.8) reasons.push("Relevant domain coverage weak");
  if(r.relevantDomainFreshnessRatio<0.8) reasons.push("Relevant domain freshness weak");
  if(r.quarantinedEvidenceCount>0) reasons.push("Evidence quarantined");
  if(r.supportingEvidenceCount<1) reasons.push("No supporting evidence");
  if(r.contradictingEvidenceCount>0) reasons.push("Contradictory evidence present");
  if(r.disputeState!=="UNDISPUTED") reasons.push(`Relationship state: ${r.disputeState}`);

  const admissible=reasons.length===0;
  return Object.freeze({
    schemaVersion:"xvi-global-coverage-aware-edge-v1",
    edgeId:r.edgeId,
    edgeType:r.edgeType,
    admissible,
    route:admissible?"UNIVERSE":"NEEDS_YOU",
    reasons:Object.freeze([...new Set(reasons)]),
    disputeState:r.disputeState,
    supportingEvidenceCount:r.supportingEvidenceCount,
    contradictingEvidenceCount:r.contradictingEvidenceCount,
    independentSourceRoots:r.independentSourceRoots,
    relevantDomainCoverageRatio:r.relevantDomainCoverageRatio,
    safeReadOnly:true,
    canClaimRelationship:admissible,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
