export type XviTemporalEdgeState = "CURRENT" | "HISTORICAL" | "SUPERSEDED" | "EXPIRED" | "REVOKED";
export type XviTemporalConflictState = "CLEAR" | "OVERLAP" | "GAP" | "VERSION_CONFLICT";

export interface XviTemporalEdgeVersion {
  readonly edgeVersionId: string;
  readonly edgeId: string;
  readonly version: number;
  readonly evidenceBundleId: string;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly observedAt: string;
  readonly state: XviTemporalEdgeState;
  readonly supersedesEdgeVersionId: string | null;
  readonly revokedReason: string | null;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviTemporalEdgeHistoryInput {
  readonly edgeId: string;
  readonly versions: readonly XviTemporalEdgeVersion[];
  readonly observedAt: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviTemporalEdgeHistoryReceipt {
  readonly schemaVersion: "xvi-temporal-edge-history-v1";
  readonly edgeId: string;
  readonly versionCount: number;
  readonly currentVersionId: string | null;
  readonly historicalVersionIds: readonly string[];
  readonly revokedVersionIds: readonly string[];
  readonly supersededVersionIds: readonly string[];
  readonly expiredVersionIds: readonly string[];
  readonly temporalConflictState: XviTemporalConflictState;
  readonly overlappingVersionPairs: readonly Readonly<{
    readonly a: string;
    readonly b: string;
  }>[];
  readonly gaps: readonly Readonly<{
    readonly from: string;
    readonly to: string;
  }>[];
  readonly route: "UNIVERSE" | "NEEDS_YOU";
  readonly canClaimCurrentRelationship: boolean;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const STATES = new Set<XviTemporalEdgeState>(["CURRENT","HISTORICAL","SUPERSEDED","EXPIRED","REVOKED"]);

function plain(v:unknown,label:string):asserts v is Record<string,unknown>{
  if(v===null||typeof v!=="object"||Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if(Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for(const k of Object.keys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||d.get||d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);}
}
function exact(v:Record<string,unknown>,keys:readonly string[],label:string):void{
  const a=Object.keys(v).sort(),b=[...keys].sort(); if(a.length!==b.length||a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v:string,label:string):void{
  if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function safeInt(v:number,min:number,max:number,label:string):void{
  if(!Number.isSafeInteger(v)||v<min||v>max) throw new Error(`${label}_INVALID`);
}
function range(v:XviTemporalEdgeVersion):[number,number]{
  return [Date.parse(v.effectiveFrom),v.effectiveTo?Date.parse(v.effectiveTo):Number.POSITIVE_INFINITY];
}

export function validateTemporalEdgeHistory(input:unknown):Readonly<XviTemporalEdgeHistoryInput>{
  plain(input,"TEMPORAL_HISTORY");
  exact(input,["edgeId","versions","observedAt","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"TEMPORAL_HISTORY");
  const r=input as unknown as XviTemporalEdgeHistoryInput;
  if(!/^edge:/.test(r.edgeId)||!Array.isArray(r.versions)||r.versions.length<1||r.versions.length>10000) throw new Error("TEMPORAL_HISTORY_IDENTITY_INVALID");
  const ids=new Set<string>(),versionNums=new Set<number>();
  for(const raw of r.versions){
    plain(raw,"EDGE_VERSION");
    exact(raw,["edgeVersionId","edgeId","version","evidenceBundleId","effectiveFrom","effectiveTo","observedAt","state","supersedesEdgeVersionId","revokedReason","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"EDGE_VERSION");
    const v=raw as unknown as XviTemporalEdgeVersion;
    if(!/^edge-version:/.test(v.edgeVersionId)||ids.has(v.edgeVersionId)||v.edgeId!==r.edgeId||!/^bundle:/.test(v.evidenceBundleId)||!STATES.has(v.state)) throw new Error("EDGE_VERSION_IDENTITY_INVALID");
    ids.add(v.edgeVersionId);
    safeInt(v.version,1,Number.MAX_SAFE_INTEGER,"EDGE_VERSION_NUMBER");
    if(versionNums.has(v.version)) throw new Error("EDGE_VERSION_NUMBER_DUPLICATE");
    versionNums.add(v.version);
    iso(v.effectiveFrom,"EFFECTIVE_FROM"); iso(v.observedAt,"EDGE_OBSERVED_AT");
    if(v.effectiveTo!==null){iso(v.effectiveTo,"EFFECTIVE_TO");if(Date.parse(v.effectiveFrom)>=Date.parse(v.effectiveTo)) throw new Error("EDGE_EFFECTIVE_RANGE_INVALID");}
    if(v.supersedesEdgeVersionId!==null && (!/^edge-version:/.test(v.supersedesEdgeVersionId)||v.supersedesEdgeVersionId===v.edgeVersionId)) throw new Error("EDGE_SUPERSESSION_INVALID");
    if(v.state==="REVOKED" && !v.revokedReason?.trim()) throw new Error("REVOKED_REASON_REQUIRED");
    if(v.state!=="REVOKED" && v.revokedReason!==null) throw new Error("REVOKED_REASON_WITHOUT_STATE");
    if(v.safeReadOnly!==true||v.executionAuthority!==false||v.mutationAuthority!==false||v.productionAuthority!==false) throw new Error("EDGE_VERSION_AUTHORITY_VIOLATION");
  }
  for(const v of r.versions){
    if(v.supersedesEdgeVersionId!==null && !ids.has(v.supersedesEdgeVersionId)) throw new Error("UNKNOWN_SUPERSEDED_VERSION");
  }
  iso(r.observedAt,"OBSERVED_AT");
  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("TEMPORAL_HISTORY_AUTHORITY_VIOLATION");
  return Object.freeze({...r,versions:Object.freeze(r.versions.map(v=>Object.freeze({...v})))});
}

export function issueTemporalEdgeHistoryReceipt(input:unknown):Readonly<XviTemporalEdgeHistoryReceipt>{
  const r=validateTemporalEdgeHistory(input);
  const sorted=[...r.versions].sort((a,b)=>a.version-b.version);
  const currents=sorted.filter(v=>v.state==="CURRENT");
  const overlapping:{a:string;b:string}[]=[];
  const gaps:{from:string;to:string}[]=[];

  for(let i=0;i<sorted.length;i++){
    const [af,at]=range(sorted[i]);
    for(let j=i+1;j<sorted.length;j++){
      const [bf,bt]=range(sorted[j]);
      if(Math.max(af,bf)<Math.min(at,bt)) overlapping.push({a:sorted[i].edgeVersionId,b:sorted[j].edgeVersionId});
    }
  }

  const activeTimeline=sorted.filter(v=>v.state!=="REVOKED");
  for(let i=0;i<activeTimeline.length-1;i++){
    const a=activeTimeline[i],b=activeTimeline[i+1];
    if(a.effectiveTo!==null && Date.parse(a.effectiveTo)<Date.parse(b.effectiveFrom)){
      gaps.push({from:a.effectiveTo,to:b.effectiveFrom});
    }
  }

  let temporalConflictState:XviTemporalConflictState="CLEAR";
  if(currents.length>1) temporalConflictState="VERSION_CONFLICT";
  else if(overlapping.length>0) temporalConflictState="OVERLAP";
  else if(gaps.length>0) temporalConflictState="GAP";

  const currentVersionId=currents.length===1?currents[0].edgeVersionId:null;
  const canClaimCurrentRelationship=currentVersionId!==null&&temporalConflictState==="CLEAR";
  return Object.freeze({
    schemaVersion:"xvi-temporal-edge-history-v1",
    edgeId:r.edgeId,
    versionCount:sorted.length,
    currentVersionId,
    historicalVersionIds:Object.freeze(sorted.filter(v=>v.state==="HISTORICAL").map(v=>v.edgeVersionId)),
    revokedVersionIds:Object.freeze(sorted.filter(v=>v.state==="REVOKED").map(v=>v.edgeVersionId)),
    supersededVersionIds:Object.freeze(sorted.filter(v=>v.state==="SUPERSEDED").map(v=>v.edgeVersionId)),
    expiredVersionIds:Object.freeze(sorted.filter(v=>v.state==="EXPIRED").map(v=>v.edgeVersionId)),
    temporalConflictState,
    overlappingVersionPairs:Object.freeze(overlapping.map(x=>Object.freeze({...x}))),
    gaps:Object.freeze(gaps.map(x=>Object.freeze({...x}))),
    route:canClaimCurrentRelationship?"UNIVERSE":"NEEDS_YOU",
    canClaimCurrentRelationship,
    safeReadOnly:true,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
