export type XviOperatingMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
export type XviReplayDecision = "ACCEPT" | "DUPLICATE" | "DEFER" | "QUARANTINE" | "DROP";
export type XviQueuePressure = "NORMAL" | "ELEVATED" | "BACKPRESSURE" | "SATURATED";
export type XviRetryDisposition = "NONE" | "RETRY_LATER" | "NO_RETRY" | "MANUAL_REVIEW";
export type XviRecallState = "ACTIVE" | "RECALLED" | "REVOKED";

export interface XviReplayLedgerEntry {
  readonly replayKey: string;
  readonly eventFingerprint: string;
  readonly checkpointId: string;
  readonly tenantId: string;
  readonly deviceId: string;
  readonly firstSeenAt: string;
  readonly recallState: XviRecallState;
}

export interface XviReplayBudgetInput {
  readonly tenantId: string;
  readonly deviceId: string;
  readonly mode: XviOperatingMode;
  readonly checkpointId: string;
  readonly replayKey: string;
  readonly eventFingerprint: string;
  readonly priorLedgerEntries: readonly XviReplayLedgerEntry[];
  readonly currentQueueDepth: number;
  readonly queueCapacity: number;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly retryAfterAt: string | null;
  readonly quarantineReasons: readonly string[];
  readonly observedAt: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviReplayBudgetReceipt {
  readonly schemaVersion: "xvi-replay-budget-v1";
  readonly tenantId: string;
  readonly deviceId: string;
  readonly checkpointId: string;
  readonly decision: XviReplayDecision;
  readonly queuePressure: XviQueuePressure;
  readonly retryDisposition: XviRetryDisposition;
  readonly duplicateByReplayKey: boolean;
  readonly duplicateByFingerprint: boolean;
  readonly matchingLedgerEntryCount: number;
  readonly effectiveQueueDepth: number;
  readonly remainingCapacity: number;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly retryAfterAt: string | null;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly canConsumeReplayKey: false;
  readonly canMutateQueue: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const MODES = new Set<XviOperatingMode>(["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"]);
const RECALL = new Set<XviRecallState>(["ACTIVE","RECALLED","REVOKED"]);

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
  if (a.length!==b.length || a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v: string, label: string): void {
  if (typeof v !== "string" || !v.includes("T") || Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function hash(v: string, label: string): void {
  if (!/^[a-f0-9]{64}$/.test(v)) throw new Error(`${label}_INVALID`);
}
function safeInt(v:number,min:number,max:number,label:string):void{
  if(!Number.isSafeInteger(v)||v<min||v>max) throw new Error(`${label}_INVALID`);
}
function strings(v:readonly string[],max:number,label:string):void{
  if(!Array.isArray(v)||v.length>max) throw new Error(`${label}_COUNT`);
  const seen=new Set<string>();
  for(const x of v){if(typeof x!=="string"||!x.trim()||x.length>240) throw new Error(`${label}_INVALID`);if(seen.has(x)) throw new Error(`${label}_DUPLICATE`);seen.add(x);}
}

export function validateReplayBudgetInput(input: unknown): Readonly<XviReplayBudgetInput> {
  plain(input,"REPLAY_INPUT");
  exact(input,["tenantId","deviceId","mode","checkpointId","replayKey","eventFingerprint","priorLedgerEntries","currentQueueDepth","queueCapacity","retryCount","maxRetries","retryAfterAt","quarantineReasons","observedAt","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"REPLAY_INPUT");
  const r=input as unknown as XviReplayBudgetInput;
  if(!/^tenant:/.test(r.tenantId)||!/^device:/.test(r.deviceId)||!/^checkpoint:/.test(r.checkpointId)||!r.replayKey?.trim()) throw new Error("REPLAY_IDENTITY_INVALID");
  if(!MODES.has(r.mode)) throw new Error("REPLAY_MODE_INVALID");
  hash(r.eventFingerprint,"EVENT_FINGERPRINT");
  safeInt(r.currentQueueDepth,0,10_000_000,"QUEUE_DEPTH");
  safeInt(r.queueCapacity,1,10_000_000,"QUEUE_CAPACITY");
  if(r.currentQueueDepth>r.queueCapacity) throw new Error("QUEUE_DEPTH_EXCEEDS_CAPACITY");
  safeInt(r.retryCount,0,100,"RETRY_COUNT");
  safeInt(r.maxRetries,0,100,"MAX_RETRIES");
  if(r.retryCount>r.maxRetries) throw new Error("RETRY_COUNT_EXCEEDS_MAX");
  if(r.retryAfterAt!==null) iso(r.retryAfterAt,"RETRY_AFTER_AT");
  iso(r.observedAt,"OBSERVED_AT");
  strings(r.quarantineReasons,64,"QUARANTINE_REASONS");
  if(!Array.isArray(r.priorLedgerEntries)||r.priorLedgerEntries.length>100_000) throw new Error("LEDGER_ENTRY_COUNT");
  const replaySeen=new Set<string>();
  for(const raw of r.priorLedgerEntries){
    plain(raw,"LEDGER_ENTRY");
    exact(raw,["replayKey","eventFingerprint","checkpointId","tenantId","deviceId","firstSeenAt","recallState"],"LEDGER_ENTRY");
    const e=raw as unknown as XviReplayLedgerEntry;
    if(!e.replayKey?.trim()||replaySeen.has(e.replayKey)||!/^checkpoint:/.test(e.checkpointId)||!/^tenant:/.test(e.tenantId)||!/^device:/.test(e.deviceId)) throw new Error("LEDGER_ENTRY_IDENTITY_INVALID");
    replaySeen.add(e.replayKey);
    hash(e.eventFingerprint,"LEDGER_FINGERPRINT");
    iso(e.firstSeenAt,"LEDGER_FIRST_SEEN_AT");
    if(!RECALL.has(e.recallState)) throw new Error("LEDGER_RECALL_STATE_INVALID");
  }
  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("REPLAY_AUTHORITY_VIOLATION");
  return Object.freeze({...r,priorLedgerEntries:Object.freeze(r.priorLedgerEntries.map(e=>Object.freeze({...e}))),quarantineReasons:Object.freeze([...r.quarantineReasons])});
}

export function evaluateReplayBudget(input: unknown, now: string): Readonly<XviReplayBudgetReceipt> {
  const r=validateReplayBudgetInput(input);
  iso(now,"NOW");
  const nowMs=Date.parse(now);
  if(Date.parse(r.observedAt)>nowMs) throw new Error("OBSERVATION_FROM_FUTURE");
  if(r.retryAfterAt!==null && Date.parse(r.retryAfterAt)<Date.parse(r.observedAt)) throw new Error("RETRY_WINDOW_BEFORE_OBSERVATION");

  const activeEntries=r.priorLedgerEntries.filter(e=>e.recallState==="ACTIVE");
  const duplicateByReplayKey=activeEntries.some(e=>e.replayKey===r.replayKey && e.tenantId===r.tenantId && e.deviceId===r.deviceId);
  const fingerprintMatches=activeEntries.filter(e=>e.eventFingerprint===r.eventFingerprint && e.tenantId===r.tenantId);
  const duplicateByFingerprint=fingerprintMatches.length>0;
  const matchingLedgerEntryCount=activeEntries.filter(e=>e.replayKey===r.replayKey || e.eventFingerprint===r.eventFingerprint).length;

  const ratio=r.currentQueueDepth/r.queueCapacity;
  let queuePressure:XviQueuePressure="NORMAL";
  if(ratio>=1) queuePressure="SATURATED";
  else if(ratio>=0.9) queuePressure="BACKPRESSURE";
  else if(ratio>=0.75) queuePressure="ELEVATED";

  const retryBlocked=r.retryAfterAt!==null && Date.parse(r.retryAfterAt)>nowMs;
  const exhausted=r.retryCount>=r.maxRetries && r.maxRetries>0;

  let decision:XviReplayDecision="ACCEPT";
  let retryDisposition:XviRetryDisposition="NONE";

  if(r.quarantineReasons.length>0){
    decision="QUARANTINE"; retryDisposition="MANUAL_REVIEW";
  } else if(duplicateByReplayKey || duplicateByFingerprint){
    decision="DUPLICATE"; retryDisposition="NO_RETRY";
  } else if(queuePressure==="SATURATED"){
    decision=exhausted ? "DROP" : "DEFER";
    retryDisposition=exhausted ? "NO_RETRY" : "RETRY_LATER";
  } else if(retryBlocked){
    decision="DEFER"; retryDisposition="RETRY_LATER";
  } else if(exhausted){
    decision="DROP"; retryDisposition="NO_RETRY";
  }

  const effectiveQueueDepth=decision==="ACCEPT" ? r.currentQueueDepth+1 : r.currentQueueDepth;
  if(effectiveQueueDepth>r.queueCapacity) throw new Error("ACCEPT_WOULD_EXCEED_CAPACITY");

  return Object.freeze({
    schemaVersion:"xvi-replay-budget-v1",
    tenantId:r.tenantId,
    deviceId:r.deviceId,
    checkpointId:r.checkpointId,
    decision,
    queuePressure,
    retryDisposition,
    duplicateByReplayKey,
    duplicateByFingerprint,
    matchingLedgerEntryCount,
    effectiveQueueDepth,
    remainingCapacity:r.queueCapacity-effectiveQueueDepth,
    retryCount:r.retryCount,
    maxRetries:r.maxRetries,
    retryAfterAt:r.retryAfterAt,
    requiresHumanReview:decision==="QUARANTINE",
    safeReadOnly:true,
    canConsumeReplayKey:false,
    canMutateQueue:false,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
