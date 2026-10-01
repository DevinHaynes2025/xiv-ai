export type XviEvidencePolarity = "SUPPORT" | "CONTRADICT" | "UNKNOWN";
export type XviEdgeResolutionState = "SUPPORTED" | "DISPUTED" | "CONTRADICTED" | "INSUFFICIENT";

export interface XviRelationshipEvidenceItem {
  readonly evidenceId: string;
  readonly provenanceRootId: string;
  readonly datasetId: string;
  readonly polarity: XviEvidencePolarity;
  readonly confidence: number;
  readonly observedAt: string;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly quarantined: boolean;
}

export interface XviRelationshipEvidenceBundleInput {
  readonly bundleId: string;
  readonly edgeId: string;
  readonly evidence: readonly XviRelationshipEvidenceItem[];
  readonly supersedesBundleId: string | null;
  readonly observedAt: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviRelationshipEvidenceBundleReceipt {
  readonly schemaVersion: "xvi-relationship-evidence-bundle-v1";
  readonly bundleId: string;
  readonly edgeId: string;
  readonly resolutionState: XviEdgeResolutionState;
  readonly independentSupportRoots: number;
  readonly independentContradictionRoots: number;
  readonly unknownRoots: number;
  readonly quarantinedEvidenceCount: number;
  readonly temporalConflictCount: number;
  readonly supersedesBundleId: string | null;
  readonly requiresHumanReview: boolean;
  readonly truthScore: null;
  readonly safeReadOnly: true;
  readonly canClaimResolvedRelationship: boolean;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const POLARITIES = new Set<XviEvidencePolarity>(["SUPPORT","CONTRADICT","UNKNOWN"]);

function plain(v:unknown,label:string):asserts v is Record<string,unknown>{
  if(v===null||typeof v!=="object"||Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if(Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for(const k of Object.keys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||d.get||d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);}
}
function exact(v:Record<string,unknown>,keys:readonly string[],label:string):void{
  const a=Object.keys(v).sort(),b=[...keys].sort(); if(a.length!==b.length||a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v:string,label:string):void{if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);}
function ratio(v:number,label:string):void{if(!Number.isFinite(v)||v<0||v>1) throw new Error(`${label}_INVALID`);}
function overlap(aFrom:string|null,aTo:string|null,bFrom:string|null,bTo:string|null):boolean{
  const af=aFrom?Date.parse(aFrom):Number.NEGATIVE_INFINITY;
  const at=aTo?Date.parse(aTo):Number.POSITIVE_INFINITY;
  const bf=bFrom?Date.parse(bFrom):Number.NEGATIVE_INFINITY;
  const bt=bTo?Date.parse(bTo):Number.POSITIVE_INFINITY;
  return af<=bt && bf<=at;
}

export function validateRelationshipEvidenceBundle(input:unknown):Readonly<XviRelationshipEvidenceBundleInput>{
  plain(input,"EVIDENCE_BUNDLE");
  exact(input,["bundleId","edgeId","evidence","supersedesBundleId","observedAt","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"EVIDENCE_BUNDLE");
  const r=input as unknown as XviRelationshipEvidenceBundleInput;
  if(!/^bundle:/.test(r.bundleId)||!/^edge:/.test(r.edgeId)||!Array.isArray(r.evidence)||r.evidence.length<1||r.evidence.length>256) throw new Error("EVIDENCE_BUNDLE_IDENTITY_INVALID");
  if(r.supersedesBundleId!==null && (!/^bundle:/.test(r.supersedesBundleId)||r.supersedesBundleId===r.bundleId)) throw new Error("SUPERSESSION_INVALID");
  const ids=new Set<string>();
  for(const raw of r.evidence){
    plain(raw,"EVIDENCE_ITEM");
    exact(raw,["evidenceId","provenanceRootId","datasetId","polarity","confidence","observedAt","validFrom","validTo","quarantined"],"EVIDENCE_ITEM");
    const e=raw as unknown as XviRelationshipEvidenceItem;
    if(!/^evidence:/.test(e.evidenceId)||ids.has(e.evidenceId)||!e.provenanceRootId?.trim()||!/^dataset:/.test(e.datasetId)||!POLARITIES.has(e.polarity)) throw new Error("EVIDENCE_ITEM_IDENTITY_INVALID");
    ids.add(e.evidenceId);
    ratio(e.confidence,"EVIDENCE_CONFIDENCE");
    iso(e.observedAt,"EVIDENCE_OBSERVED_AT");
    if(e.validFrom!==null) iso(e.validFrom,"VALID_FROM");
    if(e.validTo!==null) iso(e.validTo,"VALID_TO");
    if(e.validFrom&&e.validTo&&Date.parse(e.validFrom)>Date.parse(e.validTo)) throw new Error("EVIDENCE_TEMPORAL_INVALID");
    if(typeof e.quarantined!=="boolean") throw new Error("EVIDENCE_QUARANTINE_FLAG_INVALID");
  }
  iso(r.observedAt,"OBSERVED_AT");
  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("EVIDENCE_BUNDLE_AUTHORITY_VIOLATION");
  return Object.freeze({...r,evidence:Object.freeze(r.evidence.map(e=>Object.freeze({...e})))});
}

export function resolveRelationshipEvidenceBundle(input:unknown):Readonly<XviRelationshipEvidenceBundleReceipt>{
  const r=validateRelationshipEvidenceBundle(input);
  const supportRoots=new Set(r.evidence.filter(e=>e.polarity==="SUPPORT"&&!e.quarantined).map(e=>e.provenanceRootId));
  const contradictionRoots=new Set(r.evidence.filter(e=>e.polarity==="CONTRADICT"&&!e.quarantined).map(e=>e.provenanceRootId));
  const unknownRoots=new Set(r.evidence.filter(e=>e.polarity==="UNKNOWN"&&!e.quarantined).map(e=>e.provenanceRootId));
  const quarantinedEvidenceCount=r.evidence.filter(e=>e.quarantined).length;

  let temporalConflictCount=0;
  const supports=r.evidence.filter(e=>e.polarity==="SUPPORT"&&!e.quarantined);
  const contradicts=r.evidence.filter(e=>e.polarity==="CONTRADICT"&&!e.quarantined);
  for(const s of supports) for(const c of contradicts) if(overlap(s.validFrom,s.validTo,c.validFrom,c.validTo)) temporalConflictCount++;

  let resolutionState:XviEdgeResolutionState="INSUFFICIENT";
  if(contradictionRoots.size>0 && supportRoots.size>0) resolutionState="DISPUTED";
  else if(contradictionRoots.size>0) resolutionState="CONTRADICTED";
  else if(supportRoots.size>=2) resolutionState="SUPPORTED";

  const requiresHumanReview=
    resolutionState!=="SUPPORTED" ||
    quarantinedEvidenceCount>0 ||
    temporalConflictCount>0;

  return Object.freeze({
    schemaVersion:"xvi-relationship-evidence-bundle-v1",
    bundleId:r.bundleId,
    edgeId:r.edgeId,
    resolutionState,
    independentSupportRoots:supportRoots.size,
    independentContradictionRoots:contradictionRoots.size,
    unknownRoots:unknownRoots.size,
    quarantinedEvidenceCount,
    temporalConflictCount,
    supersedesBundleId:r.supersedesBundleId,
    requiresHumanReview,
    truthScore:null,
    safeReadOnly:true,
    canClaimResolvedRelationship:resolutionState==="SUPPORTED"&&!requiresHumanReview,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
