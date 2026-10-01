export type XviDatasetLineageRelation = "ORIGINAL" | "MIRROR" | "SYNDICATED" | "DERIVED" | "AGGREGATED";
export type XviTransformClass = "NONE" | "FILTER" | "NORMALIZE" | "JOIN" | "AGGREGATE" | "EMBED" | "SUMMARIZE";

export interface XviDatasetLineageNode {
  readonly datasetId: string;
  readonly relation: XviDatasetLineageRelation;
  readonly parentDatasetIds: readonly string[];
  readonly transformClass: XviTransformClass;
  readonly transformHash: string | null;
  readonly datasetContentHash: string;
  readonly schemaHash: string;
  readonly licenseId: string;
  readonly allowedUse: readonly string[];
  readonly jurisdictionIds: readonly string[];
  readonly observedAt: string;
  readonly quarantined: boolean;
}

export interface XviDatasetLineageGraphInput {
  readonly graphId: string;
  readonly nodes: readonly XviDatasetLineageNode[];
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviDatasetLineageReceipt {
  readonly schemaVersion: "xvi-dataset-lineage-v1";
  readonly graphId: string;
  readonly datasetCount: number;
  readonly originalRootCount: number;
  readonly independentRootCount: number;
  readonly duplicateContentGroupCount: number;
  readonly quarantinedDatasetCount: number;
  readonly incompatibleDerivedLicenseCount: number;
  readonly cyclic: boolean;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const RELATIONS = new Set<XviDatasetLineageRelation>(["ORIGINAL","MIRROR","SYNDICATED","DERIVED","AGGREGATED"]);
const TRANSFORMS = new Set<XviTransformClass>(["NONE","FILTER","NORMALIZE","JOIN","AGGREGATE","EMBED","SUMMARIZE"]);

function plain(v:unknown,label:string):asserts v is Record<string,unknown>{
  if(v===null||typeof v!=="object"||Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if(Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for(const k of Object.keys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||d.get||d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);}
}
function exact(v:Record<string,unknown>,keys:readonly string[],label:string):void{
  const a=Object.keys(v).sort(),b=[...keys].sort(); if(a.length!==b.length||a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function hash(v:string,label:string):void{ if(!/^[a-f0-9]{64}$/.test(v)) throw new Error(`${label}_INVALID`); }
function iso(v:string,label:string):void{ if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`); }
function uniqueStrings(v:readonly string[],max:number,label:string,min=0):void{
  if(!Array.isArray(v)||v.length<min||v.length>max) throw new Error(`${label}_COUNT`);
  const seen=new Set<string>(); for(const x of v){if(typeof x!=="string"||!x.trim()||x.length>240) throw new Error(`${label}_INVALID`);if(seen.has(x)) throw new Error(`${label}_DUPLICATE`);seen.add(x);}
}

export function validateDatasetLineageGraph(input:unknown):Readonly<XviDatasetLineageGraphInput>{
  plain(input,"LINEAGE_GRAPH");
  exact(input,["graphId","nodes","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"LINEAGE_GRAPH");
  const g=input as unknown as XviDatasetLineageGraphInput;
  if(!/^lineage:/.test(g.graphId)||!Array.isArray(g.nodes)||g.nodes.length<1||g.nodes.length>100000) throw new Error("LINEAGE_GRAPH_INVALID");
  const ids=new Set<string>();
  for(const raw of g.nodes){
    plain(raw,"LINEAGE_NODE");
    exact(raw,["datasetId","relation","parentDatasetIds","transformClass","transformHash","datasetContentHash","schemaHash","licenseId","allowedUse","jurisdictionIds","observedAt","quarantined"],"LINEAGE_NODE");
    const n=raw as unknown as XviDatasetLineageNode;
    if(!/^dataset:/.test(n.datasetId)||ids.has(n.datasetId)||!RELATIONS.has(n.relation)||!TRANSFORMS.has(n.transformClass)||!n.licenseId?.trim()) throw new Error("LINEAGE_NODE_IDENTITY_INVALID");
    ids.add(n.datasetId);
    uniqueStrings(n.parentDatasetIds,64,"PARENT_DATASETS");
    uniqueStrings(n.allowedUse,64,"ALLOWED_USE",1);
    uniqueStrings(n.jurisdictionIds,196,"JURISDICTIONS",1);
    hash(n.datasetContentHash,"DATASET_CONTENT_HASH"); hash(n.schemaHash,"SCHEMA_HASH"); iso(n.observedAt,"OBSERVED_AT");
    if(n.transformHash!==null) hash(n.transformHash,"TRANSFORM_HASH");
    if(n.relation==="ORIGINAL" && n.parentDatasetIds.length>0) throw new Error("ORIGINAL_CANNOT_HAVE_PARENT");
    if(n.relation!=="ORIGINAL" && n.parentDatasetIds.length<1) throw new Error("NON_ORIGINAL_REQUIRES_PARENT");
    if(n.relation==="ORIGINAL" && n.transformClass!=="NONE") throw new Error("ORIGINAL_TRANSFORM_FORBIDDEN");
    if(n.relation!=="ORIGINAL" && n.transformClass==="NONE") throw new Error("DERIVED_TRANSFORM_REQUIRED");
    if((n.transformClass==="NONE") !== (n.transformHash===null)) throw new Error("TRANSFORM_HASH_STATE_MISMATCH");
    if(typeof n.quarantined!=="boolean") throw new Error("LINEAGE_QUARANTINE_FLAG_INVALID");
  }
  for(const n of g.nodes){
    for(const p of n.parentDatasetIds){
      if(!ids.has(p)) throw new Error("UNKNOWN_PARENT_DATASET");
      if(p===n.datasetId) throw new Error("SELF_PARENT_FORBIDDEN");
    }
  }
  if(g.safeReadOnly!==true||g.executionAuthority!==false||g.mutationAuthority!==false||g.productionAuthority!==false) throw new Error("LINEAGE_AUTHORITY_VIOLATION");
  return Object.freeze({...g,nodes:Object.freeze(g.nodes.map(n=>Object.freeze({...n,parentDatasetIds:Object.freeze([...n.parentDatasetIds]),allowedUse:Object.freeze([...n.allowedUse]),jurisdictionIds:Object.freeze([...n.jurisdictionIds])})))});
}

function hasCycle(nodes:readonly XviDatasetLineageNode[]):boolean{
  const byId=new Map(nodes.map(n=>[n.datasetId,n] as const));
  const temp=new Set<string>(), perm=new Set<string>();
  function visit(id:string):boolean{
    if(perm.has(id)) return false;
    if(temp.has(id)) return true;
    temp.add(id);
    const node=byId.get(id);
    if(node) for(const p of node.parentDatasetIds) if(visit(p)) return true;
    temp.delete(id); perm.add(id); return false;
  }
  return nodes.some(n=>visit(n.datasetId));
}

function rootSet(id:string,byId:Map<string,XviDatasetLineageNode>,memo:Map<string,Set<string>>):Set<string>{
  const cached=memo.get(id); if(cached) return cached;
  const n=byId.get(id); if(!n) return new Set();
  if(n.relation==="ORIGINAL"){const s=new Set([id]);memo.set(id,s);return s;}
  const out=new Set<string>();
  for(const p of n.parentDatasetIds) for(const r of rootSet(p,byId,memo)) out.add(r);
  memo.set(id,out); return out;
}

export function issueDatasetLineageReceipt(input:unknown):Readonly<XviDatasetLineageReceipt>{
  const g=validateDatasetLineageGraph(input);
  const cyclic=hasCycle(g.nodes);
  if(cyclic){
    return Object.freeze({
      schemaVersion:"xvi-dataset-lineage-v1",graphId:g.graphId,datasetCount:g.nodes.length,originalRootCount:g.nodes.filter(n=>n.relation==="ORIGINAL").length,
      independentRootCount:0,duplicateContentGroupCount:0,quarantinedDatasetCount:g.nodes.filter(n=>n.quarantined).length,incompatibleDerivedLicenseCount:0,cyclic:true,requiresHumanReview:true,
      safeReadOnly:true,executionAuthority:false,mutationAuthority:false,productionAuthority:false
    });
  }
  const byId=new Map(g.nodes.map(n=>[n.datasetId,n] as const));
  const memo=new Map<string,Set<string>>();
  const independentRoots=new Set<string>();
  for(const n of g.nodes) for(const r of rootSet(n.datasetId,byId,memo)) independentRoots.add(r);

  const contentGroups=new Map<string,number>();
  for(const n of g.nodes) contentGroups.set(n.datasetContentHash,(contentGroups.get(n.datasetContentHash)??0)+1);
  const duplicateContentGroupCount=[...contentGroups.values()].filter(n=>n>1).length;

  let incompatibleDerivedLicenseCount=0;
  for(const n of g.nodes){
    if(n.relation==="ORIGINAL") continue;
    const parents=n.parentDatasetIds.map(id=>byId.get(id)!);
    const parentAllowedIntersection=parents.map(p=>new Set(p.allowedUse)).reduce((a,b)=>new Set([...a].filter(x=>b.has(x))));
    if(n.allowedUse.some(x=>!parentAllowedIntersection.has(x))) incompatibleDerivedLicenseCount++;
  }

  const quarantinedDatasetCount=g.nodes.filter(n=>n.quarantined).length;
  return Object.freeze({
    schemaVersion:"xvi-dataset-lineage-v1",
    graphId:g.graphId,
    datasetCount:g.nodes.length,
    originalRootCount:g.nodes.filter(n=>n.relation==="ORIGINAL").length,
    independentRootCount:independentRoots.size,
    duplicateContentGroupCount,
    quarantinedDatasetCount,
    incompatibleDerivedLicenseCount,
    cyclic:false,
    requiresHumanReview:duplicateContentGroupCount>0||quarantinedDatasetCount>0||incompatibleDerivedLicenseCount>0,
    safeReadOnly:true,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
