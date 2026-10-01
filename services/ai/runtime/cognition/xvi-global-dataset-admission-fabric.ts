export type XviDatasetClass =
  | "PUBLIC_RECORDS" | "RESEARCH" | "ECONOMIC" | "INFRASTRUCTURE" | "ORGANIZATION"
  | "LANGUAGE" | "CIVIL_SOCIETY" | "ENVIRONMENT" | "HEALTH" | "EDUCATION"
  | "LOGISTICS" | "ENERGY" | "TELECOM" | "OTHER";
export type XviDatasetAdmissionState = "REGISTERED" | "QUARANTINED" | "VALIDATED" | "ADMITTED" | "REVOKED";
export type XviDatasetPromotionStage = "RAW" | "NORMALIZED" | "CELL_READY" | "EVIDENCE_SUMMARY" | "CORE_READY";

export interface XviDatasetShardDescriptor {
  readonly shardId: string;
  readonly partitionKey: string;
  readonly rowCount: number;
  readonly byteSize: number;
  readonly contentHash: string;
  readonly schemaHash: string;
  readonly observedAt: string;
}

export interface XviGlobalDatasetDescriptor {
  readonly datasetId: string;
  readonly datasetClass: XviDatasetClass;
  readonly providerId: string;
  readonly sourceUrlHash: string;
  readonly licenseId: string;
  readonly allowedUse: readonly string[];
  readonly jurisdictionIds: readonly string[];
  readonly languageTags: readonly string[];
  readonly schemaVersion: string;
  readonly schemaHash: string;
  readonly datasetContentHash: string;
  readonly shards: readonly XviDatasetShardDescriptor[];
  readonly retrievedAt: string;
  readonly expiresAt: string | null;
  readonly refreshPolicy: "STATIC" | "DAILY" | "WEEKLY" | "MONTHLY" | "ON_CHANGE";
  readonly personalDataClass: "NONE" | "AGGREGATED" | "PUBLIC_PROFESSIONAL" | "RESTRICTED";
  readonly quarantineReasons: readonly string[];
  readonly admissionState: XviDatasetAdmissionState;
  readonly promotionStage: XviDatasetPromotionStage;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviDatasetAdmissionReceipt {
  readonly schemaVersion: "xvi-global-dataset-admission-v1";
  readonly datasetId: string;
  readonly admissionState: XviDatasetAdmissionState;
  readonly promotionStage: XviDatasetPromotionStage;
  readonly shardCount: number;
  readonly totalRows: number;
  readonly totalBytes: number;
  readonly jurisdictionCount: number;
  readonly languageCount: number;
  readonly freshnessState: "FRESH" | "STALE" | "NO_EXPIRY";
  readonly duplicateShardHashCount: number;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly canFeedCountryCell: boolean;
  readonly canFeedCore: boolean;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const CLASSES = new Set<XviDatasetClass>(["PUBLIC_RECORDS","RESEARCH","ECONOMIC","INFRASTRUCTURE","ORGANIZATION","LANGUAGE","CIVIL_SOCIETY","ENVIRONMENT","HEALTH","EDUCATION","LOGISTICS","ENERGY","TELECOM","OTHER"]);
const STATES = new Set<XviDatasetAdmissionState>(["REGISTERED","QUARANTINED","VALIDATED","ADMITTED","REVOKED"]);
const STAGES = new Set<XviDatasetPromotionStage>(["RAW","NORMALIZED","CELL_READY","EVIDENCE_SUMMARY","CORE_READY"]);

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if(v===null||typeof v!=="object"||Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if(Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for(const k of Object.keys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||d.get||d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);}
}
function exact(v:Record<string,unknown>,keys:readonly string[],label:string):void{
  const a=Object.keys(v).sort(),b=[...keys].sort(); if(a.length!==b.length||a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v:string,label:string):void{ if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`); }
function hash(v:string,label:string):void{ if(!/^[a-f0-9]{64}$/.test(v)) throw new Error(`${label}_INVALID`); }
function safeInt(v:number,min:number,max:number,label:string):void{ if(!Number.isSafeInteger(v)||v<min||v>max) throw new Error(`${label}_INVALID`); }
function uniqueStrings(v:readonly string[],max:number,label:string,min=0):void{
  if(!Array.isArray(v)||v.length<min||v.length>max) throw new Error(`${label}_COUNT`);
  const seen=new Set<string>(); for(const x of v){if(typeof x!=="string"||!x.trim()||x.length>240) throw new Error(`${label}_INVALID`);if(seen.has(x)) throw new Error(`${label}_DUPLICATE`);seen.add(x);}
}

export function validateGlobalDatasetDescriptor(input: unknown): Readonly<XviGlobalDatasetDescriptor> {
  plain(input,"DATASET");
  exact(input,["datasetId","datasetClass","providerId","sourceUrlHash","licenseId","allowedUse","jurisdictionIds","languageTags","schemaVersion","schemaHash","datasetContentHash","shards","retrievedAt","expiresAt","refreshPolicy","personalDataClass","quarantineReasons","admissionState","promotionStage","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"DATASET");
  const r=input as unknown as XviGlobalDatasetDescriptor;
  if(!/^dataset:/.test(r.datasetId)||!CLASSES.has(r.datasetClass)||!r.providerId?.trim()||!r.licenseId?.trim()||!r.schemaVersion?.trim()) throw new Error("DATASET_IDENTITY_INVALID");
  hash(r.sourceUrlHash,"SOURCE_URL_HASH"); hash(r.schemaHash,"SCHEMA_HASH"); hash(r.datasetContentHash,"DATASET_CONTENT_HASH");
  uniqueStrings(r.allowedUse,64,"ALLOWED_USE",1);
  uniqueStrings(r.jurisdictionIds,196,"JURISDICTIONS",1);
  if(r.jurisdictionIds.some(j=>!/^jurisdiction:/.test(j))) throw new Error("JURISDICTION_INVALID");
  uniqueStrings(r.languageTags,128,"LANGUAGE_TAGS",1);
  if(r.languageTags.some(x=>!/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(x))) throw new Error("LANGUAGE_TAG_INVALID");
  if(!Array.isArray(r.shards)||r.shards.length<1||r.shards.length>100_000) throw new Error("SHARD_COUNT_INVALID");
  const shardIds=new Set<string>();
  for(const raw of r.shards){
    plain(raw,"SHARD"); exact(raw,["shardId","partitionKey","rowCount","byteSize","contentHash","schemaHash","observedAt"],"SHARD");
    const s=raw as unknown as XviDatasetShardDescriptor;
    if(!/^shard:/.test(s.shardId)||shardIds.has(s.shardId)||!s.partitionKey?.trim()) throw new Error("SHARD_IDENTITY_INVALID");
    shardIds.add(s.shardId);
    safeInt(s.rowCount,0,1_000_000_000,"SHARD_ROW_COUNT"); safeInt(s.byteSize,1,4_000_000_000,"SHARD_BYTE_SIZE");
    hash(s.contentHash,"SHARD_CONTENT_HASH"); hash(s.schemaHash,"SHARD_SCHEMA_HASH"); iso(s.observedAt,"SHARD_OBSERVED_AT");
    if(s.schemaHash!==r.schemaHash) throw new Error("SHARD_SCHEMA_MISMATCH");
  }
  iso(r.retrievedAt,"RETRIEVED_AT");
  if(r.expiresAt!==null){iso(r.expiresAt,"EXPIRES_AT");if(Date.parse(r.expiresAt)<=Date.parse(r.retrievedAt)) throw new Error("EXPIRY_ORDER_INVALID");}
  if(!["STATIC","DAILY","WEEKLY","MONTHLY","ON_CHANGE"].includes(r.refreshPolicy)) throw new Error("REFRESH_POLICY_INVALID");
  if(!["NONE","AGGREGATED","PUBLIC_PROFESSIONAL","RESTRICTED"].includes(r.personalDataClass)||!STATES.has(r.admissionState)||!STAGES.has(r.promotionStage)) throw new Error("DATASET_STATE_INVALID");
  uniqueStrings(r.quarantineReasons,64,"QUARANTINE_REASONS");
  if(r.personalDataClass==="RESTRICTED"&&r.admissionState==="ADMITTED") throw new Error("RESTRICTED_DATASET_NOT_ADMITTED");
  if(r.quarantineReasons.length>0&&r.admissionState==="ADMITTED") throw new Error("QUARANTINED_DATASET_NOT_ADMITTED");
  if(r.admissionState==="QUARANTINED"&&r.quarantineReasons.length<1) throw new Error("QUARANTINED_DATASET_REQUIRES_REASON");
  if(r.promotionStage==="CORE_READY"&&r.admissionState!=="ADMITTED") throw new Error("CORE_READY_REQUIRES_ADMITTED");
  if(r.promotionStage==="CORE_READY"&&r.personalDataClass==="RESTRICTED") throw new Error("CORE_READY_RESTRICTED_FORBIDDEN");
  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("DATASET_AUTHORITY_VIOLATION");
  return Object.freeze({...r,allowedUse:Object.freeze([...r.allowedUse]),jurisdictionIds:Object.freeze([...r.jurisdictionIds]),languageTags:Object.freeze([...r.languageTags]),quarantineReasons:Object.freeze([...r.quarantineReasons]),shards:Object.freeze(r.shards.map(s=>Object.freeze({...s})))});
}

export function issueDatasetAdmissionReceipt(input: unknown, now: string): Readonly<XviDatasetAdmissionReceipt> {
  const r=validateGlobalDatasetDescriptor(input);
  iso(now,"NOW");
  if(Date.parse(now)<Date.parse(r.retrievedAt)) throw new Error("NOW_BEFORE_RETRIEVAL");
  const hashCounts=new Map<string,number>();
  let totalRows=0,totalBytes=0;
  for(const s of r.shards){totalRows+=s.rowCount;totalBytes+=s.byteSize;hashCounts.set(s.contentHash,(hashCounts.get(s.contentHash)??0)+1);}
  const duplicateShardHashCount=[...hashCounts.values()].filter(n=>n>1).reduce((sum,n)=>sum+n-1,0);
  const freshnessState=r.expiresAt===null?"NO_EXPIRY":Date.parse(now)>Date.parse(r.expiresAt)?"STALE":"FRESH";
  const canFeedCountryCell=r.admissionState==="ADMITTED"&&["CELL_READY","EVIDENCE_SUMMARY","CORE_READY"].includes(r.promotionStage)&&freshnessState!=="STALE"&&duplicateShardHashCount===0;
  const canFeedCore=r.admissionState==="ADMITTED"&&r.promotionStage==="CORE_READY"&&freshnessState!=="STALE"&&duplicateShardHashCount===0&&r.personalDataClass!=="RESTRICTED";
  return Object.freeze({
    schemaVersion:"xvi-global-dataset-admission-v1",
    datasetId:r.datasetId,
    admissionState:r.admissionState,
    promotionStage:r.promotionStage,
    shardCount:r.shards.length,
    totalRows,
    totalBytes,
    jurisdictionCount:r.jurisdictionIds.length,
    languageCount:r.languageTags.length,
    freshnessState,
    duplicateShardHashCount,
    requiresHumanReview:!canFeedCountryCell||r.quarantineReasons.length>0,
    safeReadOnly:true,
    canFeedCountryCell,
    canFeedCore,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
