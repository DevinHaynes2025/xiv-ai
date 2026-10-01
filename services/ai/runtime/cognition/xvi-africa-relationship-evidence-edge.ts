/* XVI 12D-877 — Africa Knowledge Fabric: Relationship + Evidence Edge Contract
   Prepared artifact only. No network, filesystem, secrets, providers, or production authority. */

export type XviOperatingMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
export type XviEdgeType =
  | "LOCATED_IN" | "OPERATES_IN" | "PARENT_OF" | "SUBSIDIARY_OF" | "PARTNERS_WITH"
  | "BELONGS_TO_SECTOR" | "USES_INFRASTRUCTURE" | "CONNECTS_TO" | "RESEARCHES"
  | "FUNDS" | "REGULATES" | "PROVIDES_SERVICE" | "SUPPORTS_CLAIM" | "CONTRADICTS_CLAIM";
export type XviEvidenceClass = "OFFICIAL_RECORD" | "LICENSED_DATASET" | "PEER_REVIEWED" | "PUBLIC_REFERENCE" | "COMMUNITY_REPORT" | "UNVERIFIED";
export type XviEdgeAdmissionState = "REGISTERED" | "QUARANTINED" | "REVIEWED" | "ADMITTED" | "REVOKED";
export type XviDisputeState = "UNDISPUTED" | "CONTESTED" | "CONTRADICTED" | "SUPERSEDED";

export interface XviEdgeEvidenceReceipt {
  readonly sourceId: string;
  readonly sourceRecordId: string;
  readonly evidenceClass: XviEvidenceClass;
  readonly licenseId: string;
  readonly retrievedAt: string;
  readonly contentHash: string;
  readonly supports: boolean;
  readonly confidence: number;
  readonly quarantineReasons: readonly string[];
}

export interface XviAfricaKnowledgeEdge {
  readonly edgeId: string;
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
  readonly edgeType: XviEdgeType;
  readonly jurisdictionIds: readonly string[];
  readonly evidence: readonly XviEdgeEvidenceReceipt[];
  readonly disputeState: XviDisputeState;
  readonly admissionState: XviEdgeAdmissionState;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly observedAt: string;
  readonly supersedesEdgeId: string | null;
  readonly modesAllowed: readonly XviOperatingMode[];
  readonly tenantVisibility: "PUBLIC" | "TENANT_SCOPED" | "RESTRICTED";
  readonly revoked: boolean;
  readonly secretsPresent: false;
  readonly executionAuthority: false;
  readonly networkAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviEdgeAdmissionReceipt {
  readonly edgeId: string;
  readonly binding: string;
  readonly admissionState: XviEdgeAdmissionState;
  readonly disputeState: XviDisputeState;
  readonly supportingEvidenceCount: number;
  readonly contradictingEvidenceCount: number;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const MODES = new Set<XviOperatingMode>(["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"]);
const EVIDENCE = new Set<XviEvidenceClass>(["OFFICIAL_RECORD","LICENSED_DATASET","PEER_REVIEWED","PUBLIC_REFERENCE","COMMUNITY_REPORT","UNVERIFIED"]);
const ADMISSION = new Set<XviEdgeAdmissionState>(["REGISTERED","QUARANTINED","REVIEWED","ADMITTED","REVOKED"]);
const DISPUTE = new Set<XviDisputeState>(["UNDISPUTED","CONTESTED","CONTRADICTED","SUPERSEDED"]);
const EDGE_TYPES = new Set<XviEdgeType>(["LOCATED_IN","OPERATES_IN","PARENT_OF","SUBSIDIARY_OF","PARTNERS_WITH","BELONGS_TO_SECTOR","USES_INFRASTRUCTURE","CONNECTS_TO","RESEARCHES","FUNDS","REGULATES","PROVIDES_SERVICE","SUPPORTS_CLAIM","CONTRADICTS_CLAIM"]);

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v===null || typeof v!=="object" || Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const k of Object.keys(v)) { const d=Object.getOwnPropertyDescriptor(v,k); if(!d||d.get||d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`); }
}
function exact(v: Record<string, unknown>, keys: readonly string[], label: string) {
  const a=Object.keys(v).sort(), b=[...keys].sort(); if(a.length!==b.length||a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v: string){ return typeof v==="string" && /T/.test(v) && !Number.isNaN(Date.parse(v)); }
function hash(v: string){ return typeof v==="string" && /^[a-f0-9]{64}$/.test(v); }
function uniqueStrings(v: readonly string[], max:number, label:string){
  if(!Array.isArray(v)||v.length<1||v.length>max) throw new Error(`${label}_COUNT`);
  const s=new Set<string>(); for(const x of v){ if(typeof x!=="string"||!x.trim()||x.length>220) throw new Error(`${label}_INVALID`); if(s.has(x)) throw new Error(`${label}_DUPLICATE`); s.add(x); }
}
function bind(x: string){ let h=2166136261>>>0; for(let i=0;i<x.length;i++){h^=x.charCodeAt(i);h=Math.imul(h,16777619)>>>0;} return h.toString(16).padStart(8,"0"); }

export function validateAfricaKnowledgeEdge(input: unknown): Readonly<XviAfricaKnowledgeEdge> {
  plain(input,"EDGE");
  exact(input,["edgeId","sourceEntityId","targetEntityId","edgeType","jurisdictionIds","evidence","disputeState","admissionState","validFrom","validTo","observedAt","supersedesEdgeId","modesAllowed","tenantVisibility","revoked","secretsPresent","executionAuthority","networkAuthority","mutationAuthority","productionAuthority"],"EDGE");
  const r=input as unknown as XviAfricaKnowledgeEdge;
  if(!/^edge:africa:[a-z0-9._:-]{3,180}$/.test(r.edgeId)) throw new Error("EDGE_ID_INVALID");
  if(!/^org:africa:/.test(r.sourceEntityId) || !/^(org:africa:|jurisdiction:|claim:)/.test(r.targetEntityId) || r.sourceEntityId===r.targetEntityId) throw new Error("EDGE_ENDPOINT_INVALID");
  if(!EDGE_TYPES.has(r.edgeType)) throw new Error("EDGE_TYPE_INVALID");
  uniqueStrings(r.jurisdictionIds,8,"JURISDICTIONS"); if(r.jurisdictionIds.some(x=>!/^jurisdiction:/.test(x))) throw new Error("JURISDICTION_ID_INVALID");
  if(!Array.isArray(r.evidence)||r.evidence.length<1||r.evidence.length>32) throw new Error("EVIDENCE_REQUIRED");
  for(const raw of r.evidence){ plain(raw,"EVIDENCE"); exact(raw,["sourceId","sourceRecordId","evidenceClass","licenseId","retrievedAt","contentHash","supports","confidence","quarantineReasons"],"EVIDENCE"); const e=raw as unknown as XviEdgeEvidenceReceipt;
    if(!e.sourceId?.trim()||!e.sourceRecordId?.trim()||!e.licenseId?.trim()) throw new Error("EVIDENCE_IDENTITY_REQUIRED");
    if(!EVIDENCE.has(e.evidenceClass)||!iso(e.retrievedAt)||!hash(e.contentHash)) throw new Error("EVIDENCE_BINDING_INVALID");
    if(typeof e.supports!=="boolean"||!Number.isFinite(e.confidence)||e.confidence<0||e.confidence>1) throw new Error("EVIDENCE_CONFIDENCE_INVALID");
    if(!Array.isArray(e.quarantineReasons)||e.quarantineReasons.length>16) throw new Error("EVIDENCE_QUARANTINE_INVALID");
  }
  if(!DISPUTE.has(r.disputeState)||!ADMISSION.has(r.admissionState)) throw new Error("STATE_INVALID");
  if(!iso(r.observedAt)||(r.validFrom!==null&&!iso(r.validFrom))||(r.validTo!==null&&!iso(r.validTo))) throw new Error("TEMPORAL_INVALID");
  if(r.validFrom&&r.validTo&&Date.parse(r.validFrom)>Date.parse(r.validTo)) throw new Error("TEMPORAL_RANGE_INVALID");
  uniqueStrings(r.modesAllowed,3,"MODES"); if(r.modesAllowed.some(x=>!MODES.has(x))) throw new Error("MODE_INVALID");
  if(!["PUBLIC","TENANT_SCOPED","RESTRICTED"].includes(r.tenantVisibility)) throw new Error("VISIBILITY_INVALID");
  const hasUnverified=r.evidence.some(e=>e.evidenceClass==="UNVERIFIED");
  const hasQuarantine=r.evidence.some(e=>e.quarantineReasons.length>0);
  const supports=r.evidence.filter(e=>e.supports).length, contradicts=r.evidence.length-supports;
  if((hasUnverified||hasQuarantine)&&r.admissionState!=="QUARANTINED") throw new Error("UNTRUSTED_EVIDENCE_MUST_QUARANTINE");
  if(r.admissionState==="ADMITTED" && (r.revoked||hasUnverified||hasQuarantine||supports===0)) throw new Error("ADMISSION_BLOCKED");
  if(r.disputeState==="UNDISPUTED" && contradicts>0) throw new Error("UNDISPUTED_CONTRADICTION");
  if(r.disputeState==="CONTRADICTED" && contradicts===0) throw new Error("CONTRADICTED_WITHOUT_EVIDENCE");
  if(r.revoked && r.admissionState!=="REVOKED") throw new Error("REVOKED_STATE_REQUIRED");
  if(r.secretsPresent!==false||r.executionAuthority!==false||r.networkAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("AUTHORITY_OR_SECRET_VIOLATION");
  return Object.freeze({...r,jurisdictionIds:Object.freeze([...r.jurisdictionIds]),modesAllowed:Object.freeze([...r.modesAllowed]),evidence:Object.freeze(r.evidence.map(e=>Object.freeze({...e,quarantineReasons:Object.freeze([...e.quarantineReasons])})))});
}

export function issueEdgeAdmissionReceipt(input: unknown): Readonly<XviEdgeAdmissionReceipt> {
  const r=validateAfricaKnowledgeEdge(input); const supporting=r.evidence.filter(e=>e.supports).length; const contradicting=r.evidence.length-supporting;
  const material=JSON.stringify({edgeId:r.edgeId,source:r.sourceEntityId,target:r.targetEntityId,type:r.edgeType,j:[...r.jurisdictionIds].sort(),e:r.evidence.map(x=>`${x.sourceId}:${x.sourceRecordId}:${x.contentHash}:${x.supports}`).sort(),dispute:r.disputeState,state:r.admissionState,observedAt:r.observedAt,revoked:r.revoked});
  return Object.freeze({edgeId:r.edgeId,binding:bind(material),admissionState:r.admissionState,disputeState:r.disputeState,supportingEvidenceCount:supporting,contradictingEvidenceCount:contradicting,safeReadOnly:true,executionAuthority:false,mutationAuthority:false,productionAuthority:false});
}
