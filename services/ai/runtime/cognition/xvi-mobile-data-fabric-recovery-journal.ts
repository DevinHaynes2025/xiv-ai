export type XviRecallState = "ACTIVE" | "RECALLED" | "REVOKED";
export type XviRecoveryJournalState = "PREPARED" | "APPLIED" | "RECOVERED" | "ABORTED";
export type XviPropagationTarget = "REPLAY_LEDGER" | "CHECKPOINT" | "COMPACTION" | "EVIDENCE_SUMMARY";

export interface XviRecallTombstoneInput {
  readonly tombstoneId: string;
  readonly tenantId: string;
  readonly deviceId: string;
  readonly replayKey: string;
  readonly eventFingerprint: string;
  readonly targetState: Exclude<XviRecallState, "ACTIVE">;
  readonly priorState: XviRecallState;
  readonly expectedVersion: number;
  readonly observedVersion: number;
  readonly reasonCode: string;
  readonly createdAt: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviRecoveryJournalInput {
  readonly journalId: string;
  readonly transactionId: string;
  readonly tenantId: string;
  readonly deviceId: string;
  readonly checkpointId: string;
  readonly priorJournalIds: readonly string[];
  readonly journalState: XviRecoveryJournalState;
  readonly queueDepthBefore: number;
  readonly queueDepthAfter: number;
  readonly replayKeyConsumed: boolean;
  readonly fingerprintReserved: boolean;
  readonly tombstoneId: string | null;
  readonly propagationTargets: readonly XviPropagationTarget[];
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviRecallTombstoneReceipt {
  readonly schemaVersion: "xvi-recall-tombstone-v1";
  readonly tombstoneId: string;
  readonly tenantId: string;
  readonly deviceId: string;
  readonly replayKey: string;
  readonly eventFingerprint: string;
  readonly targetState: Exclude<XviRecallState, "ACTIVE">;
  readonly compareAndSetSatisfied: boolean;
  readonly propagationTargets: readonly XviPropagationTarget[];
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviRecoveryJournalReceipt {
  readonly schemaVersion: "xvi-recovery-journal-v1";
  readonly journalId: string;
  readonly transactionId: string;
  readonly journalState: XviRecoveryJournalState;
  readonly idempotentReplay: boolean;
  readonly queueDelta: number;
  readonly replayKeyConsumed: boolean;
  readonly fingerprintReserved: boolean;
  readonly propagationTargets: readonly XviPropagationTarget[];
  readonly requiresFurtherRecovery: boolean;
  readonly observability: Readonly<{
    readonly replayCount: number;
    readonly recallCount: number;
    readonly recoveryCount: number;
    readonly abortedCount: number;
  }>;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const JOURNAL_STATES = new Set<XviRecoveryJournalState>(["PREPARED","APPLIED","RECOVERED","ABORTED"]);
const TARGETS = new Set<XviPropagationTarget>(["REPLAY_LEDGER","CHECKPOINT","COMPACTION","EVIDENCE_SUMMARY"]);

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v===null || typeof v!=="object" || Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const k of Object.keys(v)) {
    const d=Object.getOwnPropertyDescriptor(v,k);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}
function exact(v:Record<string,unknown>,keys:readonly string[],label:string):void{
  const a=Object.keys(v).sort(),b=[...keys].sort();
  if(a.length!==b.length||a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v:string,label:string):void{
  if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function hash(v:string,label:string):void{
  if(!/^[a-f0-9]{64}$/.test(v)) throw new Error(`${label}_INVALID`);
}
function safeInt(v:number,min:number,max:number,label:string):void{
  if(!Number.isSafeInteger(v)||v<min||v>max) throw new Error(`${label}_INVALID`);
}
function strings(v:readonly string[],max:number,label:string):void{
  if(!Array.isArray(v)||v.length>max) throw new Error(`${label}_COUNT`);
  const seen=new Set<string>();
  for(const x of v){if(typeof x!=="string"||!x.trim()||x.length>240) throw new Error(`${label}_INVALID`);if(seen.has(x)) throw new Error(`${label}_DUPLICATE`);seen.add(x);}
}

export function validateRecallTombstone(input: unknown): Readonly<XviRecallTombstoneInput> {
  plain(input,"TOMBSTONE");
  exact(input,["tombstoneId","tenantId","deviceId","replayKey","eventFingerprint","targetState","priorState","expectedVersion","observedVersion","reasonCode","createdAt","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"TOMBSTONE");
  const r=input as unknown as XviRecallTombstoneInput;
  if(!/^tombstone:/.test(r.tombstoneId)||!/^tenant:/.test(r.tenantId)||!/^device:/.test(r.deviceId)||!r.replayKey?.trim()||!r.reasonCode?.trim()) throw new Error("TOMBSTONE_IDENTITY_INVALID");
  hash(r.eventFingerprint,"EVENT_FINGERPRINT");
  if(!["RECALLED","REVOKED"].includes(r.targetState)||!["ACTIVE","RECALLED","REVOKED"].includes(r.priorState)) throw new Error("TOMBSTONE_STATE_INVALID");
  safeInt(r.expectedVersion,0,Number.MAX_SAFE_INTEGER,"EXPECTED_VERSION");
  safeInt(r.observedVersion,0,Number.MAX_SAFE_INTEGER,"OBSERVED_VERSION");
  iso(r.createdAt,"CREATED_AT");
  if(r.targetState===r.priorState) throw new Error("TOMBSTONE_NOOP_STATE_FORBIDDEN");
  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("TOMBSTONE_AUTHORITY_VIOLATION");
  return Object.freeze({...r});
}

export function issueRecallTombstoneReceipt(input: unknown): Readonly<XviRecallTombstoneReceipt> {
  const r=validateRecallTombstone(input);
  const compareAndSetSatisfied=r.expectedVersion===r.observedVersion;
  return Object.freeze({
    schemaVersion:"xvi-recall-tombstone-v1",
    tombstoneId:r.tombstoneId,
    tenantId:r.tenantId,
    deviceId:r.deviceId,
    replayKey:r.replayKey,
    eventFingerprint:r.eventFingerprint,
    targetState:r.targetState,
    compareAndSetSatisfied,
    propagationTargets:Object.freeze(["REPLAY_LEDGER","CHECKPOINT","COMPACTION","EVIDENCE_SUMMARY"] as const),
    safeReadOnly:true,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}

export function validateRecoveryJournal(input: unknown): Readonly<XviRecoveryJournalInput> {
  plain(input,"RECOVERY_JOURNAL");
  exact(input,["journalId","transactionId","tenantId","deviceId","checkpointId","priorJournalIds","journalState","queueDepthBefore","queueDepthAfter","replayKeyConsumed","fingerprintReserved","tombstoneId","propagationTargets","attempt","maxAttempts","createdAt","updatedAt","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"RECOVERY_JOURNAL");
  const r=input as unknown as XviRecoveryJournalInput;
  if(!/^journal:/.test(r.journalId)||!/^tx:/.test(r.transactionId)||!/^tenant:/.test(r.tenantId)||!/^device:/.test(r.deviceId)||!/^checkpoint:/.test(r.checkpointId)) throw new Error("RECOVERY_IDENTITY_INVALID");
  strings(r.priorJournalIds,100_000,"PRIOR_JOURNALS");
  if(!JOURNAL_STATES.has(r.journalState)) throw new Error("RECOVERY_STATE_INVALID");
  safeInt(r.queueDepthBefore,0,10_000_000,"QUEUE_DEPTH_BEFORE");
  safeInt(r.queueDepthAfter,0,10_000_000,"QUEUE_DEPTH_AFTER");
  if(Math.abs(r.queueDepthAfter-r.queueDepthBefore)>1) throw new Error("RECOVERY_QUEUE_DELTA_INVALID");
  if(typeof r.replayKeyConsumed!=="boolean"||typeof r.fingerprintReserved!=="boolean") throw new Error("RECOVERY_FLAGS_INVALID");
  if(r.tombstoneId!==null && !/^tombstone:/.test(r.tombstoneId)) throw new Error("RECOVERY_TOMBSTONE_ID_INVALID");
  strings(r.propagationTargets,4,"PROPAGATION_TARGETS");
  if(r.propagationTargets.some(t=>!TARGETS.has(t as XviPropagationTarget))) throw new Error("PROPAGATION_TARGET_INVALID");
  safeInt(r.attempt,1,100,"RECOVERY_ATTEMPT");
  safeInt(r.maxAttempts,1,100,"RECOVERY_MAX_ATTEMPTS");
  if(r.attempt>r.maxAttempts) throw new Error("RECOVERY_ATTEMPT_EXCEEDS_MAX");
  iso(r.createdAt,"CREATED_AT"); iso(r.updatedAt,"UPDATED_AT");
  if(Date.parse(r.updatedAt)<Date.parse(r.createdAt)) throw new Error("RECOVERY_TIME_ORDER_INVALID");
  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("RECOVERY_AUTHORITY_VIOLATION");
  return Object.freeze({...r,priorJournalIds:Object.freeze([...r.priorJournalIds]),propagationTargets:Object.freeze([...r.propagationTargets])});
}

export function issueRecoveryJournalReceipt(input: unknown): Readonly<XviRecoveryJournalReceipt> {
  const r=validateRecoveryJournal(input);
  const idempotentReplay=r.priorJournalIds.includes(r.journalId);
  const requiresFurtherRecovery=
    r.journalState==="PREPARED" ||
    (r.journalState==="APPLIED" && r.propagationTargets.length>0);
  return Object.freeze({
    schemaVersion:"xvi-recovery-journal-v1",
    journalId:r.journalId,
    transactionId:r.transactionId,
    journalState:r.journalState,
    idempotentReplay,
    queueDelta:r.queueDepthAfter-r.queueDepthBefore,
    replayKeyConsumed:r.replayKeyConsumed,
    fingerprintReserved:r.fingerprintReserved,
    propagationTargets:Object.freeze([...r.propagationTargets]),
    requiresFurtherRecovery,
    observability:Object.freeze({
      replayCount:idempotentReplay?1:0,
      recallCount:r.tombstoneId?1:0,
      recoveryCount:r.journalState==="RECOVERED"?1:0,
      abortedCount:r.journalState==="ABORTED"?1:0,
    }),
    safeReadOnly:true,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
