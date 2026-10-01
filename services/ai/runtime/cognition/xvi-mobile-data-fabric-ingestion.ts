export type XviOperatingMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
export type XviMobilePrivacyClass = "PUBLIC" | "BUSINESS" | "PERSONAL_MINIMIZED" | "RESTRICTED";
export type XviMobileDataClass = "EVENT" | "SENSOR_SUMMARY" | "USER_ACTION" | "CONTENT_METADATA" | "MODEL_TELEMETRY" | "SYNC_STATE";

export interface XviMobileDataEvent {
  readonly eventId: string;
  readonly dataClass: XviMobileDataClass;
  readonly occurredAt: string;
  readonly payloadHash: string;
  readonly payloadBytes: number;
  readonly privacyClass: XviMobilePrivacyClass;
  readonly consentBasis: "USER_OPT_IN" | "BUSINESS_AUTHORIZED" | "PUBLIC_DATA" | "SYSTEM_OPERATION";
  readonly containsSecrets: false;
}

export interface XviMobileIngestionBatch {
  readonly schemaVersion: "xvi-mobile-ingestion-v1";
  readonly tenantId: string;
  readonly deviceNodeId: string;
  readonly jurisdictionId: string;
  readonly mode: XviOperatingMode;
  readonly sequenceStart: number;
  readonly sequenceEnd: number;
  readonly offlineCheckpointId: string | null;
  readonly previousBatchHash: string | null;
  readonly batchHash: string;
  readonly replayKey: string;
  readonly createdAt: string;
  readonly events: readonly XviMobileDataEvent[];
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviMobileIngestionReceipt {
  readonly schemaVersion: "xvi-mobile-ingestion-receipt-v1";
  readonly tenantId: string;
  readonly deviceNodeId: string;
  readonly mode: XviOperatingMode;
  readonly eventCount: number;
  readonly totalPayloadBytes: number;
  readonly sequenceStart: number;
  readonly sequenceEnd: number;
  readonly batchHash: string;
  readonly offlineCheckpointId: string | null;
  readonly requiresQuarantine: boolean;
  readonly quarantineReasons: readonly string[];
  readonly safeReadOnly: true;
  readonly feedCoreEligible: boolean;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const MODES = new Set<XviOperatingMode>(["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"]);
const DATA_CLASSES = new Set<XviMobileDataClass>(["EVENT","SENSOR_SUMMARY","USER_ACTION","CONTENT_METADATA","MODEL_TELEMETRY","SYNC_STATE"]);
const PRIVACY = new Set<XviMobilePrivacyClass>(["PUBLIC","BUSINESS","PERSONAL_MINIMIZED","RESTRICTED"]);
const MAX_EVENTS_PER_BATCH = 10_000;
const MAX_EVENT_BYTES = 256 * 1024;
const MAX_BATCH_BYTES = 64 * 1024 * 1024;

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v === null || typeof v !== "object" || Object.getPrototypeOf(v) !== PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const k of Object.keys(v)) {
    const d = Object.getOwnPropertyDescriptor(v,k);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}
function exact(v: Record<string, unknown>, keys: readonly string[], label: string): void {
  const a=Object.keys(v).sort(), b=[...keys].sort();
  if(a.length!==b.length || a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v: string, label: string): void {
  if(typeof v!=="string" || !v.includes("T") || Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function hash(v: string | null, allowNull=false): void {
  if(v===null && allowNull) return;
  if(typeof v!=="string" || !/^[a-f0-9]{64}$/.test(v)) throw new Error("HASH_INVALID");
}

export function validateMobileIngestionBatch(input: unknown): Readonly<XviMobileIngestionBatch> {
  plain(input,"MOBILE_BATCH");
  exact(input,["schemaVersion","tenantId","deviceNodeId","jurisdictionId","mode","sequenceStart","sequenceEnd","offlineCheckpointId","previousBatchHash","batchHash","replayKey","createdAt","events","executionAuthority","mutationAuthority","productionAuthority"],"MOBILE_BATCH");
  const r=input as unknown as XviMobileIngestionBatch;
  if(r.schemaVersion!=="xvi-mobile-ingestion-v1") throw new Error("SCHEMA_VERSION_INVALID");
  if(!/^tenant:/.test(r.tenantId) || !/^device:/.test(r.deviceNodeId) || !/^jurisdiction:/.test(r.jurisdictionId) || !MODES.has(r.mode)) throw new Error("BATCH_IDENTITY_INVALID");
  if(!Number.isSafeInteger(r.sequenceStart) || !Number.isSafeInteger(r.sequenceEnd) || r.sequenceStart<0 || r.sequenceEnd<r.sequenceStart) throw new Error("SEQUENCE_INVALID");
  if(r.offlineCheckpointId!==null && !/^checkpoint:/.test(r.offlineCheckpointId)) throw new Error("CHECKPOINT_INVALID");
  hash(r.previousBatchHash,true); hash(r.batchHash,false);
  if(!/^replay:[a-z0-9._:-]{8,200}$/.test(r.replayKey)) throw new Error("REPLAY_KEY_INVALID");
  iso(r.createdAt,"CREATED_AT");
  if(!Array.isArray(r.events) || r.events.length<1 || r.events.length>MAX_EVENTS_PER_BATCH) throw new Error("EVENT_COUNT_CEILING");
  if(r.sequenceEnd-r.sequenceStart+1!==r.events.length) throw new Error("SEQUENCE_EVENT_COUNT_MISMATCH");

  let total=0;
  const ids=new Set<string>();
  for(const raw of r.events){
    plain(raw,"MOBILE_EVENT");
    exact(raw,["eventId","dataClass","occurredAt","payloadHash","payloadBytes","privacyClass","consentBasis","containsSecrets"],"MOBILE_EVENT");
    const e=raw as unknown as XviMobileDataEvent;
    if(!/^event:/.test(e.eventId) || ids.has(e.eventId)) throw new Error("EVENT_ID_INVALID_OR_DUPLICATE");
    ids.add(e.eventId);
    if(!DATA_CLASSES.has(e.dataClass) || !PRIVACY.has(e.privacyClass)) throw new Error("EVENT_CLASS_INVALID");
    iso(e.occurredAt,"EVENT_OCCURRED_AT"); hash(e.payloadHash,false);
    if(!Number.isSafeInteger(e.payloadBytes) || e.payloadBytes<0 || e.payloadBytes>MAX_EVENT_BYTES) throw new Error("EVENT_SIZE_INVALID");
    total += e.payloadBytes;
    if(total>MAX_BATCH_BYTES) throw new Error("BATCH_SIZE_CEILING");
    if(!["USER_OPT_IN","BUSINESS_AUTHORIZED","PUBLIC_DATA","SYSTEM_OPERATION"].includes(e.consentBasis)) throw new Error("CONSENT_BASIS_INVALID");
    if(e.containsSecrets!==false) throw new Error("SECRET_BEARING_EVENT_FORBIDDEN");
    if(e.privacyClass==="RESTRICTED" && e.consentBasis==="PUBLIC_DATA") throw new Error("RESTRICTED_PUBLIC_BASIS_FORBIDDEN");
  }
  if(r.mode==="OFFLINE_GOVERNED" && r.offlineCheckpointId===null) throw new Error("OFFLINE_GOVERNED_REQUIRES_CHECKPOINT");
  if(r.mode==="LOCAL_ONLY" && r.previousBatchHash===null && r.sequenceStart!==0) throw new Error("LOCAL_ONLY_CHAIN_REQUIRED");
  if(r.executionAuthority!==false || r.mutationAuthority!==false || r.productionAuthority!==false) throw new Error("BATCH_AUTHORITY_VIOLATION");
  return Object.freeze({...r,events:Object.freeze(r.events.map(e=>Object.freeze({...e})))});
}

export function issueMobileIngestionReceipt(input: unknown): Readonly<XviMobileIngestionReceipt> {
  const r=validateMobileIngestionBatch(input);
  const reasons:string[]=[];
  if(r.events.some(e=>e.privacyClass==="RESTRICTED")) reasons.push("RESTRICTED_DATA");
  if(r.events.some(e=>e.consentBasis==="SYSTEM_OPERATION" && e.privacyClass==="PERSONAL_MINIMIZED")) reasons.push("PERSONAL_SYSTEM_DATA_REVIEW");
  const total=r.events.reduce((sum,e)=>sum+e.payloadBytes,0);
  const requiresQuarantine=reasons.length>0;
  return Object.freeze({
    schemaVersion:"xvi-mobile-ingestion-receipt-v1",
    tenantId:r.tenantId,
    deviceNodeId:r.deviceNodeId,
    mode:r.mode,
    eventCount:r.events.length,
    totalPayloadBytes:total,
    sequenceStart:r.sequenceStart,
    sequenceEnd:r.sequenceEnd,
    batchHash:r.batchHash,
    offlineCheckpointId:r.offlineCheckpointId,
    requiresQuarantine,
    quarantineReasons:Object.freeze(reasons),
    safeReadOnly:true,
    feedCoreEligible:!requiresQuarantine,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
