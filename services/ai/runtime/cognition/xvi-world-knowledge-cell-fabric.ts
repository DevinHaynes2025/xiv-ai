export type XviWorldRegion = "AFRICA" | "AMERICAS" | "ASIA" | "EUROPE" | "OCEANIA";
export type XviCellState = "BOOTSTRAP" | "ACTIVE" | "DEGRADED" | "QUARANTINED" | "REVOKED";
export type XviCellCapability =
  | "ORGANIZATIONS"
  | "INFRASTRUCTURE"
  | "RESEARCH"
  | "ECONOMY"
  | "LANGUAGE"
  | "PUBLIC_RECORDS"
  | "CIVIL_SOCIETY"
  | "RELATIONSHIPS"
  | "EVIDENCE_SUMMARIES";
export type XviBridgeScope = "REGIONAL" | "CROSS_REGION" | "GLOBAL";

export interface XviKnowledgeCellSource {
  readonly sourceId: string;
  readonly licenseId: string;
  readonly allowedUse: readonly string[];
  readonly provenanceHash: string;
  readonly evidenceCount: number;
  readonly quarantined: boolean;
}

export interface XviJurisdictionKnowledgeCell {
  readonly cellId: string;
  readonly jurisdictionId: string;
  readonly region: XviWorldRegion;
  readonly state: XviCellState;
  readonly languageTags: readonly string[];
  readonly capabilities: readonly XviCellCapability[];
  readonly sourceBindings: readonly XviKnowledgeCellSource[];
  readonly organizationCount: number;
  readonly relationshipCount: number;
  readonly evidenceSummaryCount: number;
  readonly lastCheckpointAt: string | null;
  readonly localFirst: boolean;
  readonly offlineCapable: boolean;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviKnowledgeBridge {
  readonly bridgeId: string;
  readonly scope: XviBridgeScope;
  readonly fromCellId: string;
  readonly toCellId: string;
  readonly allowedCapabilities: readonly XviCellCapability[];
  readonly packetBudget: number;
  readonly requiresProvenance: true;
  readonly requiresLicenseCompatibility: true;
  readonly readOnlyExchange: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviKnowledgeCellReceipt {
  readonly schemaVersion: "xvi-world-knowledge-cell-v1";
  readonly cellId: string;
  readonly jurisdictionId: string;
  readonly region: XviWorldRegion;
  readonly state: XviCellState;
  readonly languageCount: number;
  readonly capabilityCount: number;
  readonly cleanSourceCount: number;
  readonly quarantinedSourceCount: number;
  readonly offlineCapable: boolean;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN=Object.getPrototypeOf({});
const REGIONS=new Set<XviWorldRegion>(["AFRICA","AMERICAS","ASIA","EUROPE","OCEANIA"]);
const STATES=new Set<XviCellState>(["BOOTSTRAP","ACTIVE","DEGRADED","QUARANTINED","REVOKED"]);
const CAPS=new Set<XviCellCapability>(["ORGANIZATIONS","INFRASTRUCTURE","RESEARCH","ECONOMY","LANGUAGE","PUBLIC_RECORDS","CIVIL_SOCIETY","RELATIONSHIPS","EVIDENCE_SUMMARIES"]);
const SCOPES=new Set<XviBridgeScope>(["REGIONAL","CROSS_REGION","GLOBAL"]);

function plain(v:unknown,label:string):asserts v is Record<string,unknown>{
  if(v===null||typeof v!=="object"||Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if(Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for(const k of Object.keys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||d.get||d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);}
}
function exact(v:Record<string,unknown>,keys:readonly string[],label:string):void{
  const a=Object.keys(v).sort(),b=[...keys].sort(); if(a.length!==b.length||a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function isoOrNull(v:string|null,label:string):void{ if(v===null)return; if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`); }
function safeInt(v:number,max:number,label:string):void{ if(!Number.isSafeInteger(v)||v<0||v>max) throw new Error(`${label}_INVALID`); }
function uniqueStrings(v:readonly string[],max:number,label:string,min=0):void{
  if(!Array.isArray(v)||v.length<min||v.length>max) throw new Error(`${label}_COUNT`);
  const seen=new Set<string>(); for(const x of v){if(typeof x!=="string"||!x.trim()||x.length>240) throw new Error(`${label}_INVALID`);if(seen.has(x)) throw new Error(`${label}_DUPLICATE`);seen.add(x);}
}

export function validateJurisdictionKnowledgeCell(input:unknown):Readonly<XviJurisdictionKnowledgeCell>{
  plain(input,"WORLD_CELL");
  exact(input,["cellId","jurisdictionId","region","state","languageTags","capabilities","sourceBindings","organizationCount","relationshipCount","evidenceSummaryCount","lastCheckpointAt","localFirst","offlineCapable","executionAuthority","mutationAuthority","productionAuthority"],"WORLD_CELL");
  const r=input as unknown as XviJurisdictionKnowledgeCell;
  if(!/^cell:jurisdiction:/.test(r.cellId)||!/^jurisdiction:/.test(r.jurisdictionId)||!REGIONS.has(r.region)||!STATES.has(r.state)) throw new Error("WORLD_CELL_IDENTITY_INVALID");
  uniqueStrings(r.languageTags,128,"LANGUAGE_TAGS",1);
  if(r.languageTags.some(x=>!/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(x))) throw new Error("LANGUAGE_TAG_INVALID");
  uniqueStrings(r.capabilities,16,"CAPABILITIES",1);
  if(r.capabilities.some(x=>!CAPS.has(x as XviCellCapability))) throw new Error("CAPABILITY_INVALID");
  if(!Array.isArray(r.sourceBindings)||r.sourceBindings.length>256) throw new Error("SOURCE_BINDING_COUNT");
  for(const raw of r.sourceBindings){
    plain(raw,"CELL_SOURCE"); exact(raw,["sourceId","licenseId","allowedUse","provenanceHash","evidenceCount","quarantined"],"CELL_SOURCE");
    const s=raw as unknown as XviKnowledgeCellSource;
    if(!s.sourceId?.trim()||!s.licenseId?.trim()||!/^[a-f0-9]{64}$/.test(s.provenanceHash)||typeof s.quarantined!=="boolean") throw new Error("CELL_SOURCE_INVALID");
    uniqueStrings(s.allowedUse,32,"SOURCE_ALLOWED_USE"); safeInt(s.evidenceCount,1_000_000_000,"SOURCE_EVIDENCE_COUNT");
  }
  safeInt(r.organizationCount,1_000_000_000,"ORGANIZATION_COUNT"); safeInt(r.relationshipCount,10_000_000_000,"RELATIONSHIP_COUNT"); safeInt(r.evidenceSummaryCount,10_000_000_000,"EVIDENCE_SUMMARY_COUNT");
  isoOrNull(r.lastCheckpointAt,"LAST_CHECKPOINT_AT");
  if(typeof r.localFirst!=="boolean"||typeof r.offlineCapable!=="boolean") throw new Error("CELL_MODE_FLAGS_INVALID");
  if(r.state==="ACTIVE"&&r.sourceBindings.length<1) throw new Error("ACTIVE_CELL_REQUIRES_SOURCE");
  if(r.state==="ACTIVE"&&r.sourceBindings.some(s=>s.quarantined)) throw new Error("ACTIVE_CELL_CANNOT_INCLUDE_QUARANTINED_SOURCE");
  if(r.state==="QUARANTINED"&&!r.sourceBindings.some(s=>s.quarantined)) throw new Error("QUARANTINED_CELL_REQUIRES_REASON");
  if(r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("WORLD_CELL_AUTHORITY_VIOLATION");
  return Object.freeze({...r,languageTags:Object.freeze([...r.languageTags]),capabilities:Object.freeze([...r.capabilities]),sourceBindings:Object.freeze(r.sourceBindings.map(s=>Object.freeze({...s,allowedUse:Object.freeze([...s.allowedUse])})))});
}

export function validateKnowledgeBridge(input:unknown):Readonly<XviKnowledgeBridge>{
  plain(input,"KNOWLEDGE_BRIDGE");
  exact(input,["bridgeId","scope","fromCellId","toCellId","allowedCapabilities","packetBudget","requiresProvenance","requiresLicenseCompatibility","readOnlyExchange","executionAuthority","mutationAuthority","productionAuthority"],"KNOWLEDGE_BRIDGE");
  const r=input as unknown as XviKnowledgeBridge;
  if(!/^bridge:/.test(r.bridgeId)||!/^cell:jurisdiction:/.test(r.fromCellId)||!/^cell:jurisdiction:/.test(r.toCellId)||r.fromCellId===r.toCellId||!SCOPES.has(r.scope)) throw new Error("KNOWLEDGE_BRIDGE_IDENTITY_INVALID");
  uniqueStrings(r.allowedCapabilities,16,"BRIDGE_CAPABILITIES",1);
  if(r.allowedCapabilities.some(x=>!CAPS.has(x as XviCellCapability))) throw new Error("BRIDGE_CAPABILITY_INVALID");
  safeInt(r.packetBudget,1_000_000,"PACKET_BUDGET");
  if(r.packetBudget<1) throw new Error("PACKET_BUDGET_INVALID");
  if(r.requiresProvenance!==true||r.requiresLicenseCompatibility!==true||r.readOnlyExchange!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("KNOWLEDGE_BRIDGE_AUTHORITY_VIOLATION");
  return Object.freeze({...r,allowedCapabilities:Object.freeze([...r.allowedCapabilities])});
}

export function issueKnowledgeCellReceipt(input:unknown):Readonly<XviKnowledgeCellReceipt>{
  const r=validateJurisdictionKnowledgeCell(input);
  const quarantinedSourceCount=r.sourceBindings.filter(s=>s.quarantined).length;
  return Object.freeze({
    schemaVersion:"xvi-world-knowledge-cell-v1",
    cellId:r.cellId,
    jurisdictionId:r.jurisdictionId,
    region:r.region,
    state:r.state,
    languageCount:r.languageTags.length,
    capabilityCount:r.capabilities.length,
    cleanSourceCount:r.sourceBindings.length-quarantinedSourceCount,
    quarantinedSourceCount,
    offlineCapable:r.offlineCapable,
    requiresHumanReview:r.state!=="ACTIVE"||quarantinedSourceCount>0,
    safeReadOnly:true,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
