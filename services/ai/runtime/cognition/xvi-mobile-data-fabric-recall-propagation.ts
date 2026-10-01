export type XviPropagationTarget = "REPLAY_LEDGER" | "CHECKPOINT" | "COMPACTION" | "EVIDENCE_SUMMARY";
export type XviTargetAckState = "PENDING" | "ACKNOWLEDGED" | "FAILED" | "NOT_APPLICABLE";
export type XviRecallConflictState = "CLEAR" | "STALE_WRITER" | "CONCURRENT_UPDATE" | "VERSION_GAP" | "PARTIAL_FAILURE";

export interface XviPropagationTargetAck {
  readonly target: XviPropagationTarget;
  readonly state: XviTargetAckState;
  readonly version: number;
  readonly acknowledgedAt: string | null;
  readonly failureCode: string | null;
}

export interface XviRecallPropagationInput {
  readonly recallId: string;
  readonly tombstoneId: string;
  readonly tenantId: string;
  readonly sourceDeviceId: string;
  readonly currentVersion: number;
  readonly incomingVersion: number;
  readonly sourceDeviceVersion: number;
  readonly peerDeviceVersions: Readonly<Record<string, number>>;
  readonly targetAcks: readonly XviPropagationTargetAck[];
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly observedAt: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviRecallPropagationReceipt {
  readonly schemaVersion: "xvi-recall-propagation-v1";
  readonly recallId: string;
  readonly tombstoneId: string;
  readonly conflictState: XviRecallConflictState;
  readonly staleWriterRejected: boolean;
  readonly completed: boolean;
  readonly pendingTargets: readonly XviPropagationTarget[];
  readonly failedTargets: readonly XviPropagationTarget[];
  readonly acknowledgedTargets: readonly XviPropagationTarget[];
  readonly effectiveVersion: number;
  readonly requiresHumanReview: boolean;
  readonly requiresRetry: boolean;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly propagationLagMs: number | null;
  readonly safeReadOnly: true;
  readonly canClaimCompletion: boolean;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const TARGETS = new Set<XviPropagationTarget>(["REPLAY_LEDGER","CHECKPOINT","COMPACTION","EVIDENCE_SUMMARY"]);
const ACK_STATES = new Set<XviTargetAckState>(["PENDING","ACKNOWLEDGED","FAILED","NOT_APPLICABLE"]);

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v===null || typeof v!=="object" || Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const k of Object.keys(v)) {
    const d=Object.getOwnPropertyDescriptor(v,k);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}
function exact(v:Record<string,unknown>, keys:readonly string[], label:string):void{
  const a=Object.keys(v).sort(), b=[...keys].sort();
  if(a.length!==b.length || a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function safeInt(v:number,min:number,max:number,label:string):void{
  if(!Number.isSafeInteger(v)||v<min||v>max) throw new Error(`${label}_INVALID`);
}
function iso(v:string,label:string):void{
  if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}

export function validateRecallPropagationInput(input: unknown): Readonly<XviRecallPropagationInput> {
  plain(input,"PROPAGATION");
  exact(input,["recallId","tombstoneId","tenantId","sourceDeviceId","currentVersion","incomingVersion","sourceDeviceVersion","peerDeviceVersions","targetAcks","retryCount","maxRetries","observedAt","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"PROPAGATION");
  const r=input as unknown as XviRecallPropagationInput;
  if(!/^recall:/.test(r.recallId)||!/^tombstone:/.test(r.tombstoneId)||!/^tenant:/.test(r.tenantId)||!/^device:/.test(r.sourceDeviceId)) throw new Error("PROPAGATION_IDENTITY_INVALID");
  safeInt(r.currentVersion,0,Number.MAX_SAFE_INTEGER,"CURRENT_VERSION");
  safeInt(r.incomingVersion,0,Number.MAX_SAFE_INTEGER,"INCOMING_VERSION");
  safeInt(r.sourceDeviceVersion,0,Number.MAX_SAFE_INTEGER,"SOURCE_DEVICE_VERSION");
  safeInt(r.retryCount,0,100,"RETRY_COUNT");
  safeInt(r.maxRetries,0,100,"MAX_RETRIES");
  if(r.retryCount>r.maxRetries) throw new Error("RETRY_COUNT_EXCEEDS_MAX");
  iso(r.observedAt,"OBSERVED_AT");

  plain(r.peerDeviceVersions,"PEER_DEVICE_VERSIONS");
  for(const [deviceId,version] of Object.entries(r.peerDeviceVersions)){
    if(!/^device:/.test(deviceId)) throw new Error("PEER_DEVICE_ID_INVALID");
    safeInt(version,0,Number.MAX_SAFE_INTEGER,"PEER_DEVICE_VERSION");
  }

  if(!Array.isArray(r.targetAcks)||r.targetAcks.length<1||r.targetAcks.length>4) throw new Error("TARGET_ACK_COUNT_INVALID");
  const seen=new Set<XviPropagationTarget>();
  for(const raw of r.targetAcks){
    plain(raw,"TARGET_ACK");
    exact(raw,["target","state","version","acknowledgedAt","failureCode"],"TARGET_ACK");
    const a=raw as unknown as XviPropagationTargetAck;
    if(!TARGETS.has(a.target)||seen.has(a.target)||!ACK_STATES.has(a.state)) throw new Error("TARGET_ACK_INVALID");
    seen.add(a.target);
    safeInt(a.version,0,Number.MAX_SAFE_INTEGER,"TARGET_ACK_VERSION");
    if(a.acknowledgedAt!==null) iso(a.acknowledgedAt,"ACKNOWLEDGED_AT");
    if(a.state==="ACKNOWLEDGED" && a.acknowledgedAt===null) throw new Error("ACK_TIMESTAMP_REQUIRED");
    if(a.state==="FAILED" && !a.failureCode?.trim()) throw new Error("FAILED_ACK_REQUIRES_CODE");
    if(a.state!=="FAILED" && a.failureCode!==null) throw new Error("FAILURE_CODE_WITHOUT_FAILURE");
  }

  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("PROPAGATION_AUTHORITY_VIOLATION");
  return Object.freeze({
    ...r,
    peerDeviceVersions:Object.freeze({...r.peerDeviceVersions}),
    targetAcks:Object.freeze(r.targetAcks.map(a=>Object.freeze({...a}))),
  });
}

export function evaluateRecallPropagation(input: unknown, now: string): Readonly<XviRecallPropagationReceipt> {
  const r=validateRecallPropagationInput(input);
  iso(now,"NOW");
  const nowMs=Date.parse(now);
  if(Date.parse(r.observedAt)>nowMs) throw new Error("OBSERVATION_FROM_FUTURE");

  const allDeviceVersions=[r.sourceDeviceVersion,...Object.values(r.peerDeviceVersions)];
  const maxObservedDeviceVersion=Math.max(...allDeviceVersions,0);

  let conflictState:XviRecallConflictState="CLEAR";
  let staleWriterRejected=false;

  if(r.incomingVersion<r.currentVersion || r.incomingVersion<maxObservedDeviceVersion){
    conflictState="STALE_WRITER";
    staleWriterRejected=true;
  } else if(r.incomingVersion>r.currentVersion+1){
    conflictState="VERSION_GAP";
  } else {
    const sameVersionPeers=Object.values(r.peerDeviceVersions).filter(v=>v===r.incomingVersion).length;
    const aheadPeers=Object.values(r.peerDeviceVersions).filter(v=>v>r.currentVersion).length;
    if(sameVersionPeers>0 && r.incomingVersion===r.currentVersion && aheadPeers===0){
      conflictState="CONCURRENT_UPDATE";
    }
  }

  const pending=r.targetAcks.filter(a=>a.state==="PENDING").map(a=>a.target);
  const failed=r.targetAcks.filter(a=>a.state==="FAILED").map(a=>a.target);
  const acknowledged=r.targetAcks.filter(a=>a.state==="ACKNOWLEDGED").map(a=>a.target);

  if(conflictState==="CLEAR" && failed.length>0) conflictState="PARTIAL_FAILURE";

  const terminalTargets=r.targetAcks.every(a=>a.state==="ACKNOWLEDGED"||a.state==="NOT_APPLICABLE");
  const completed=conflictState==="CLEAR" && terminalTargets;
  const exhausted=r.retryCount>=r.maxRetries && r.maxRetries>0;
  const requiresRetry=!completed && !staleWriterRejected && (pending.length>0 || failed.length>0) && !exhausted;
  const requiresHumanReview=
    staleWriterRejected ||
    conflictState==="CONCURRENT_UPDATE" ||
    conflictState==="VERSION_GAP" ||
    (failed.length>0 && exhausted);

  const ackTimes=r.targetAcks
    .filter(a=>a.state==="ACKNOWLEDGED" && a.acknowledgedAt!==null)
    .map(a=>Date.parse(a.acknowledgedAt as string));
  const propagationLagMs=ackTimes.length===0 ? null : Math.max(...ackTimes)-Date.parse(r.observedAt);
  if(propagationLagMs!==null && propagationLagMs<0) throw new Error("PROPAGATION_ACK_BEFORE_OBSERVATION");

  const effectiveVersion=staleWriterRejected ? r.currentVersion : Math.max(r.currentVersion,r.incomingVersion);

  return Object.freeze({
    schemaVersion:"xvi-recall-propagation-v1",
    recallId:r.recallId,
    tombstoneId:r.tombstoneId,
    conflictState,
    staleWriterRejected,
    completed,
    pendingTargets:Object.freeze([...pending]),
    failedTargets:Object.freeze([...failed]),
    acknowledgedTargets:Object.freeze([...acknowledged]),
    effectiveVersion,
    requiresHumanReview,
    requiresRetry,
    retryCount:r.retryCount,
    maxRetries:r.maxRetries,
    propagationLagMs,
    safeReadOnly:true,
    canClaimCompletion:completed,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
