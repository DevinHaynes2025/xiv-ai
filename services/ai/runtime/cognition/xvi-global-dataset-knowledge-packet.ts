export type XviKnowledgePacketStage = "CELL_READY" | "EVIDENCE_SUMMARY" | "CORE_READY";
export type XviPacketScope = "INTRA_REGION" | "CROSS_REGION" | "GLOBAL";

export interface XviDatasetKnowledgePacket {
  readonly packetId: string;
  readonly datasetId: string;
  readonly sourceCellId: string;
  readonly destinationCellId: string;
  readonly sourceJurisdictionId: string;
  readonly destinationJurisdictionId: string;
  readonly scope: XviPacketScope;
  readonly promotionStage: XviKnowledgePacketStage;
  readonly licenseId: string;
  readonly allowedUse: readonly string[];
  readonly schemaHash: string;
  readonly datasetContentHash: string;
  readonly shardContentHashes: readonly string[];
  readonly provenanceRootHash: string;
  readonly rowCount: number;
  readonly byteSize: number;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly restrictedPersonalData: false;
  readonly quarantineReasons: readonly string[];
  readonly readOnlyExchange: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviDatasetKnowledgePacketReceipt {
  readonly schemaVersion: "xvi-dataset-knowledge-packet-v1";
  readonly packetId: string;
  readonly datasetId: string;
  readonly sourceCellId: string;
  readonly destinationCellId: string;
  readonly promotionStage: XviKnowledgePacketStage;
  readonly rowCount: number;
  readonly byteSize: number;
  readonly shardCount: number;
  readonly freshnessState: "FRESH" | "STALE" | "NO_EXPIRY";
  readonly canExchange: boolean;
  readonly canPromoteToCore: boolean;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN=Object.getPrototypeOf({});
const SCOPES=new Set<XviPacketScope>(["INTRA_REGION","CROSS_REGION","GLOBAL"]);
const STAGES=new Set<XviKnowledgePacketStage>(["CELL_READY","EVIDENCE_SUMMARY","CORE_READY"]);

function plain(v:unknown,label:string):asserts v is Record<string,unknown>{
  if(v===null||typeof v!=="object"||Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if(Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for(const k of Object.keys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||d.get||d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);}
}
function exact(v:Record<string,unknown>,keys:readonly string[],label:string):void{
  const a=Object.keys(v).sort(),b=[...keys].sort(); if(a.length!==b.length||a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v:string,label:string):void{if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);}
function hash(v:string,label:string):void{if(!/^[a-f0-9]{64}$/.test(v)) throw new Error(`${label}_INVALID`);}
function safeInt(v:number,min:number,max:number,label:string):void{if(!Number.isSafeInteger(v)||v<min||v>max) throw new Error(`${label}_INVALID`);}
function uniqueStrings(v:readonly string[],max:number,label:string,min=0):void{
  if(!Array.isArray(v)||v.length<min||v.length>max) throw new Error(`${label}_COUNT`);
  const seen=new Set<string>(); for(const x of v){if(typeof x!=="string"||!x.trim()||x.length>240) throw new Error(`${label}_INVALID`);if(seen.has(x)) throw new Error(`${label}_DUPLICATE`);seen.add(x);}
}

export function validateDatasetKnowledgePacket(input:unknown):Readonly<XviDatasetKnowledgePacket>{
  plain(input,"KNOWLEDGE_PACKET");
  exact(input,["packetId","datasetId","sourceCellId","destinationCellId","sourceJurisdictionId","destinationJurisdictionId","scope","promotionStage","licenseId","allowedUse","schemaHash","datasetContentHash","shardContentHashes","provenanceRootHash","rowCount","byteSize","createdAt","expiresAt","restrictedPersonalData","quarantineReasons","readOnlyExchange","executionAuthority","mutationAuthority","productionAuthority"],"KNOWLEDGE_PACKET");
  const r=input as unknown as XviDatasetKnowledgePacket;
  if(!/^packet:/.test(r.packetId)||!/^dataset:/.test(r.datasetId)||!/^cell:jurisdiction:/.test(r.sourceCellId)||!/^cell:jurisdiction:/.test(r.destinationCellId)||r.sourceCellId===r.destinationCellId) throw new Error("PACKET_IDENTITY_INVALID");
  if(!/^jurisdiction:/.test(r.sourceJurisdictionId)||!/^jurisdiction:/.test(r.destinationJurisdictionId)||r.sourceJurisdictionId===r.destinationJurisdictionId) throw new Error("PACKET_JURISDICTION_INVALID");
  if(!SCOPES.has(r.scope)||!STAGES.has(r.promotionStage)||!r.licenseId?.trim()) throw new Error("PACKET_STATE_INVALID");
  uniqueStrings(r.allowedUse,64,"ALLOWED_USE",1);
  hash(r.schemaHash,"SCHEMA_HASH"); hash(r.datasetContentHash,"DATASET_CONTENT_HASH"); hash(r.provenanceRootHash,"PROVENANCE_ROOT_HASH");
  uniqueStrings(r.shardContentHashes,100000,"SHARD_HASHES",1);
  for(const h of r.shardContentHashes) hash(h,"SHARD_HASH");
  safeInt(r.rowCount,0,1_000_000_000_000,"ROW_COUNT");
  safeInt(r.byteSize,1,9_000_000_000_000_000,"BYTE_SIZE");
  iso(r.createdAt,"CREATED_AT");
  if(r.expiresAt!==null){iso(r.expiresAt,"EXPIRES_AT");if(Date.parse(r.expiresAt)<=Date.parse(r.createdAt)) throw new Error("PACKET_EXPIRY_ORDER_INVALID");}
  uniqueStrings(r.quarantineReasons,64,"QUARANTINE_REASONS");
  if(r.restrictedPersonalData!==false) throw new Error("RESTRICTED_PACKET_FORBIDDEN");
  if(r.quarantineReasons.length>0 && r.promotionStage==="CORE_READY") throw new Error("QUARANTINED_PACKET_NOT_CORE_READY");
  if(r.readOnlyExchange!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("PACKET_AUTHORITY_VIOLATION");
  return Object.freeze({...r,allowedUse:Object.freeze([...r.allowedUse]),shardContentHashes:Object.freeze([...r.shardContentHashes]),quarantineReasons:Object.freeze([...r.quarantineReasons])});
}

export function issueDatasetKnowledgePacketReceipt(input:unknown,now:string):Readonly<XviDatasetKnowledgePacketReceipt>{
  const r=validateDatasetKnowledgePacket(input); iso(now,"NOW");
  if(Date.parse(now)<Date.parse(r.createdAt)) throw new Error("NOW_BEFORE_PACKET_CREATION");
  const freshnessState=r.expiresAt===null?"NO_EXPIRY":Date.parse(now)>Date.parse(r.expiresAt)?"STALE":"FRESH";
  const canExchange=freshnessState!=="STALE"&&r.quarantineReasons.length===0&&r.allowedUse.length>0;
  const canPromoteToCore=canExchange&&r.promotionStage==="CORE_READY";
  return Object.freeze({
    schemaVersion:"xvi-dataset-knowledge-packet-v1",
    packetId:r.packetId,datasetId:r.datasetId,sourceCellId:r.sourceCellId,destinationCellId:r.destinationCellId,
    promotionStage:r.promotionStage,rowCount:r.rowCount,byteSize:r.byteSize,shardCount:r.shardContentHashes.length,
    freshnessState,canExchange,canPromoteToCore,
    requiresHumanReview:!canExchange||r.quarantineReasons.length>0,
    safeReadOnly:true,executionAuthority:false,mutationAuthority:false,productionAuthority:false,
  });
}
