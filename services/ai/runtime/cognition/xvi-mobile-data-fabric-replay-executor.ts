export type XviReplayDecision = "ACCEPT" | "DUPLICATE" | "DEFER" | "QUARANTINE" | "DROP";
export type XviQueueMutation = "ENQUEUE" | "NOOP" | "DEFERRED" | "QUARANTINED" | "DROPPED";
export type XviRecallState = "ACTIVE" | "RECALLED" | "REVOKED";

export interface XviReplayExecutorInput {
  readonly tenantId: string;
  readonly deviceId: string;
  readonly checkpointId: string;
  readonly replayKey: string;
  readonly eventFingerprint: string;
  readonly decision: XviReplayDecision;
  readonly currentQueueDepth: number;
  readonly queueCapacity: number;
  readonly replayKeyAlreadyConsumed: boolean;
  readonly fingerprintReserved: boolean;
  readonly recallState: XviRecallState;
  readonly transactionId: string;
  readonly priorTransactionIds: readonly string[];
  readonly observedAt: string;
  readonly safeReadOnlyDecision: true;
  readonly executionAuthority: false;
  readonly productionAuthority: false;
}

export interface XviReplayExecutorReceipt {
  readonly schemaVersion: "xvi-replay-executor-v1";
  readonly transactionId: string;
  readonly tenantId: string;
  readonly deviceId: string;
  readonly checkpointId: string;
  readonly mutation: XviQueueMutation;
  readonly replayKeyConsumed: boolean;
  readonly fingerprintReserved: boolean;
  readonly queueDepthBefore: number;
  readonly queueDepthAfter: number;
  readonly idempotentReplay: boolean;
  readonly recallState: XviRecallState;
  readonly requiresPropagation: boolean;
  readonly safeReadOnlyReceipt: true;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const DECISIONS = new Set<XviReplayDecision>(["ACCEPT","DUPLICATE","DEFER","QUARANTINE","DROP"]);
const RECALL = new Set<XviRecallState>(["ACTIVE","RECALLED","REVOKED"]);

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v === null || typeof v !== "object" || Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const k of Object.keys(v)) {
    const d = Object.getOwnPropertyDescriptor(v,k);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}
function exact(v:Record<string,unknown>,keys:readonly string[],label:string):void{
  const a=Object.keys(v).sort(),b=[...keys].sort();
  if(a.length!==b.length||a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function safeInt(v:number,min:number,max:number,label:string):void{
  if(!Number.isSafeInteger(v)||v<min||v>max) throw new Error(`${label}_INVALID`);
}
function iso(v:string,label:string):void{
  if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function strings(v:readonly string[],max:number,label:string):void{
  if(!Array.isArray(v)||v.length>max) throw new Error(`${label}_COUNT`);
  const seen=new Set<string>();
  for(const x of v){if(typeof x!=="string"||!x.trim()||x.length>240) throw new Error(`${label}_INVALID`);if(seen.has(x)) throw new Error(`${label}_DUPLICATE`);seen.add(x);}
}

export function validateReplayExecutorInput(input: unknown): Readonly<XviReplayExecutorInput> {
  plain(input,"EXECUTOR_INPUT");
  exact(input,["tenantId","deviceId","checkpointId","replayKey","eventFingerprint","decision","currentQueueDepth","queueCapacity","replayKeyAlreadyConsumed","fingerprintReserved","recallState","transactionId","priorTransactionIds","observedAt","safeReadOnlyDecision","executionAuthority","productionAuthority"],"EXECUTOR_INPUT");
  const r=input as unknown as XviReplayExecutorInput;
  if(!/^tenant:/.test(r.tenantId)||!/^device:/.test(r.deviceId)||!/^checkpoint:/.test(r.checkpointId)||!r.replayKey?.trim()||!/^tx:/.test(r.transactionId)) throw new Error("EXECUTOR_IDENTITY_INVALID");
  if(!/^[a-f0-9]{64}$/.test(r.eventFingerprint)||!DECISIONS.has(r.decision)||!RECALL.has(r.recallState)) throw new Error("EXECUTOR_STATE_INVALID");
  safeInt(r.currentQueueDepth,0,10_000_000,"QUEUE_DEPTH");
  safeInt(r.queueCapacity,1,10_000_000,"QUEUE_CAPACITY");
  if(r.currentQueueDepth>r.queueCapacity) throw new Error("QUEUE_DEPTH_EXCEEDS_CAPACITY");
  if(typeof r.replayKeyAlreadyConsumed!=="boolean"||typeof r.fingerprintReserved!=="boolean") throw new Error("EXECUTOR_FLAGS_INVALID");
  strings(r.priorTransactionIds,100_000,"PRIOR_TRANSACTIONS");
  iso(r.observedAt,"OBSERVED_AT");
  if(r.safeReadOnlyDecision!==true||r.executionAuthority!==false||r.productionAuthority!==false) throw new Error("EXECUTOR_AUTHORITY_VIOLATION");
  return Object.freeze({...r,priorTransactionIds:Object.freeze([...r.priorTransactionIds])});
}

export function executeReplayDecision(input: unknown): Readonly<XviReplayExecutorReceipt> {
  const r=validateReplayExecutorInput(input);
  const idempotentReplay=r.priorTransactionIds.includes(r.transactionId);
  if(idempotentReplay){
    return Object.freeze({
      schemaVersion:"xvi-replay-executor-v1",
      transactionId:r.transactionId,tenantId:r.tenantId,deviceId:r.deviceId,checkpointId:r.checkpointId,
      mutation:"NOOP",replayKeyConsumed:r.replayKeyAlreadyConsumed,fingerprintReserved:r.fingerprintReserved,
      queueDepthBefore:r.currentQueueDepth,queueDepthAfter:r.currentQueueDepth,idempotentReplay:true,
      recallState:r.recallState,requiresPropagation:r.recallState!=="ACTIVE",safeReadOnlyReceipt:true,productionAuthority:false
    });
  }

  let mutation:XviQueueMutation="NOOP";
  let replayKeyConsumed=r.replayKeyAlreadyConsumed;
  let fingerprintReserved=r.fingerprintReserved;
  let queueDepthAfter=r.currentQueueDepth;

  if(r.recallState!=="ACTIVE"){
    mutation="NOOP";
  } else if(r.decision==="ACCEPT"){
    if(r.replayKeyAlreadyConsumed||r.fingerprintReserved) throw new Error("ACCEPT_REPLAY_STATE_CONFLICT");
    if(r.currentQueueDepth>=r.queueCapacity) throw new Error("ACCEPT_QUEUE_CAPACITY_EXCEEDED");
    mutation="ENQUEUE"; replayKeyConsumed=true; fingerprintReserved=true; queueDepthAfter=r.currentQueueDepth+1;
  } else if(r.decision==="DEFER"){
    mutation="DEFERRED";
  } else if(r.decision==="QUARANTINE"){
    mutation="QUARANTINED"; replayKeyConsumed=true; fingerprintReserved=true;
  } else if(r.decision==="DROP"){
    mutation="DROPPED"; replayKeyConsumed=true; fingerprintReserved=true;
  } else {
    mutation="NOOP";
  }

  return Object.freeze({
    schemaVersion:"xvi-replay-executor-v1",
    transactionId:r.transactionId,tenantId:r.tenantId,deviceId:r.deviceId,checkpointId:r.checkpointId,
    mutation,replayKeyConsumed,fingerprintReserved,queueDepthBefore:r.currentQueueDepth,queueDepthAfter,
    idempotentReplay:false,recallState:r.recallState,requiresPropagation:r.recallState!=="ACTIVE",
    safeReadOnlyReceipt:true,productionAuthority:false
  });
}
