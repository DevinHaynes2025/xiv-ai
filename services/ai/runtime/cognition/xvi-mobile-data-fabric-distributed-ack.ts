export type XviAckTarget = "REPLAY_LEDGER" | "CHECKPOINT" | "COMPACTION" | "EVIDENCE_SUMMARY";
export type XviAckStatus = "PENDING" | "ACKNOWLEDGED" | "FAILED" | "NOT_APPLICABLE";
export type XviCausalRelation = "BEFORE" | "AFTER" | "EQUAL" | "CONCURRENT";

export interface XviVectorClock {
  readonly counters: Readonly<Record<string, number>>;
}

export interface XviDistributedAck {
  readonly target: XviAckTarget;
  readonly status: XviAckStatus;
  readonly deviceId: string;
  readonly vectorClock: XviVectorClock;
  readonly acknowledgedAt: string | null;
  readonly failureCode: string | null;
}

export interface XviDistributedRecallInput {
  readonly recallId: string;
  readonly tombstoneId: string;
  readonly tenantId: string;
  readonly sourceDeviceId: string;
  readonly recallClock: XviVectorClock;
  readonly acknowledgements: readonly XviDistributedAck[];
  readonly timeoutAt: string;
  readonly observedAt: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviDistributedRecallReceipt {
  readonly schemaVersion: "xvi-distributed-recall-v1";
  readonly recallId: string;
  readonly tombstoneId: string;
  readonly causalConflicts: readonly Readonly<{
    readonly target: XviAckTarget;
    readonly relation: XviCausalRelation;
    readonly deviceId: string;
  }>[];
  readonly acknowledgedTargets: readonly XviAckTarget[];
  readonly pendingTargets: readonly XviAckTarget[];
  readonly failedTargets: readonly XviAckTarget[];
  readonly timedOut: boolean;
  readonly completed: boolean;
  readonly conflictPreserved: boolean;
  readonly canClaimCompletion: boolean;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const TARGETS = new Set<XviAckTarget>(["REPLAY_LEDGER","CHECKPOINT","COMPACTION","EVIDENCE_SUMMARY"]);
const STATUSES = new Set<XviAckStatus>(["PENDING","ACKNOWLEDGED","FAILED","NOT_APPLICABLE"]);

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v===null || typeof v!=="object" || Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const k of Object.keys(v)) {
    const d = Object.getOwnPropertyDescriptor(v,k);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}
function exact(v:Record<string,unknown>, keys:readonly string[], label:string):void{
  const a=Object.keys(v).sort(), b=[...keys].sort();
  if(a.length!==b.length || a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v:string,label:string):void{
  if(typeof v!=="string" || !v.includes("T") || Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function safeInt(v:number,label:string):void{
  if(!Number.isSafeInteger(v) || v<0 || v>Number.MAX_SAFE_INTEGER) throw new Error(`${label}_INVALID`);
}
function validateClock(input: unknown, label: string): Readonly<XviVectorClock> {
  plain(input,label);
  exact(input,["counters"],label);
  const c = input as unknown as XviVectorClock;
  plain(c.counters, `${label}_COUNTERS`);
  const keys = Object.keys(c.counters);
  if (keys.length<1 || keys.length>128) throw new Error(`${label}_COUNTER_COUNT_INVALID`);
  for (const [deviceId,n] of Object.entries(c.counters)) {
    if (!/^device:/.test(deviceId)) throw new Error(`${label}_DEVICE_ID_INVALID`);
    safeInt(n,`${label}_COUNTER`);
  }
  return Object.freeze({counters:Object.freeze({...c.counters})});
}

export function compareVectorClocks(aInput: unknown, bInput: unknown): XviCausalRelation {
  const a=validateClock(aInput,"CLOCK_A");
  const b=validateClock(bInput,"CLOCK_B");
  const ids=new Set([...Object.keys(a.counters),...Object.keys(b.counters)]);
  let aLess=false, aGreater=false;
  for (const id of ids) {
    const av=a.counters[id]??0, bv=b.counters[id]??0;
    if (av<bv) aLess=true;
    if (av>bv) aGreater=true;
  }
  if (!aLess && !aGreater) return "EQUAL";
  if (aLess && !aGreater) return "BEFORE";
  if (!aLess && aGreater) return "AFTER";
  return "CONCURRENT";
}

export function validateDistributedRecallInput(input: unknown): Readonly<XviDistributedRecallInput> {
  plain(input,"DISTRIBUTED_RECALL");
  exact(input,["recallId","tombstoneId","tenantId","sourceDeviceId","recallClock","acknowledgements","timeoutAt","observedAt","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"DISTRIBUTED_RECALL");
  const r=input as unknown as XviDistributedRecallInput;
  if(!/^recall:/.test(r.recallId)||!/^tombstone:/.test(r.tombstoneId)||!/^tenant:/.test(r.tenantId)||!/^device:/.test(r.sourceDeviceId)) throw new Error("DISTRIBUTED_RECALL_IDENTITY_INVALID");
  const recallClock=validateClock(r.recallClock,"RECALL_CLOCK");
  if(!(r.sourceDeviceId in recallClock.counters)) throw new Error("SOURCE_DEVICE_MISSING_FROM_CLOCK");
  if(!Array.isArray(r.acknowledgements)||r.acknowledgements.length<1||r.acknowledgements.length>4) throw new Error("ACK_COUNT_INVALID");
  const seen=new Set<XviAckTarget>();
  const acks=r.acknowledgements.map(raw=>{
    plain(raw,"ACK");
    exact(raw,["target","status","deviceId","vectorClock","acknowledgedAt","failureCode"],"ACK");
    const a=raw as unknown as XviDistributedAck;
    if(!TARGETS.has(a.target)||seen.has(a.target)||!STATUSES.has(a.status)||!/^device:/.test(a.deviceId)) throw new Error("ACK_INVALID");
    seen.add(a.target);
    const clock=validateClock(a.vectorClock,"ACK_CLOCK");
    if(a.acknowledgedAt!==null) iso(a.acknowledgedAt,"ACKNOWLEDGED_AT");
    if(a.status==="ACKNOWLEDGED"&&a.acknowledgedAt===null) throw new Error("ACK_TIMESTAMP_REQUIRED");
    if(a.status==="FAILED"&&!a.failureCode?.trim()) throw new Error("FAILED_ACK_REQUIRES_CODE");
    if(a.status!=="FAILED"&&a.failureCode!==null) throw new Error("FAILURE_CODE_WITHOUT_FAILURE");
    return Object.freeze({...a,vectorClock:clock});
  });
  iso(r.timeoutAt,"TIMEOUT_AT"); iso(r.observedAt,"OBSERVED_AT");
  if(Date.parse(r.timeoutAt)<=Date.parse(r.observedAt)) throw new Error("TIMEOUT_ORDER_INVALID");
  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("DISTRIBUTED_RECALL_AUTHORITY_VIOLATION");
  return Object.freeze({...r,recallClock,acknowledgements:Object.freeze(acks)});
}

export function evaluateDistributedRecall(input: unknown, now: string): Readonly<XviDistributedRecallReceipt> {
  const r=validateDistributedRecallInput(input);
  iso(now,"NOW");
  const nowMs=Date.parse(now);
  if(nowMs<Date.parse(r.observedAt)) throw new Error("NOW_BEFORE_OBSERVATION");
  const conflicts:{target:XviAckTarget;relation:XviCausalRelation;deviceId:string}[]=[];
  const acknowledged:XviAckTarget[]=[],pending:XviAckTarget[]=[],failed:XviAckTarget[]=[];
  for (const a of r.acknowledgements) {
    if(a.status==="ACKNOWLEDGED") acknowledged.push(a.target);
    else if(a.status==="PENDING") pending.push(a.target);
    else if(a.status==="FAILED") failed.push(a.target);
    const relation=compareVectorClocks(a.vectorClock,r.recallClock);
    if(relation==="BEFORE"||relation==="CONCURRENT") conflicts.push({target:a.target,relation,deviceId:a.deviceId});
  }
  const timedOut=nowMs>Date.parse(r.timeoutAt) && (pending.length>0||failed.length>0);
  const terminal=r.acknowledgements.every(a=>a.status==="ACKNOWLEDGED"||a.status==="NOT_APPLICABLE");
  const completed=terminal && conflicts.length===0;
  const requiresHumanReview=conflicts.length>0 || timedOut || failed.length>0;
  return Object.freeze({
    schemaVersion:"xvi-distributed-recall-v1",
    recallId:r.recallId,
    tombstoneId:r.tombstoneId,
    causalConflicts:Object.freeze(conflicts.map(c=>Object.freeze({...c}))),
    acknowledgedTargets:Object.freeze([...acknowledged]),
    pendingTargets:Object.freeze([...pending]),
    failedTargets:Object.freeze([...failed]),
    timedOut,
    completed,
    conflictPreserved:conflicts.length>0,
    canClaimCompletion:completed,
    requiresHumanReview,
    safeReadOnly:true,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
