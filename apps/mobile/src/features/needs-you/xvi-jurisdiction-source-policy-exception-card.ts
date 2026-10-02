export type XviSourcePolicyCardRunMode="ONLINE_GOVERNED"|"OFFLINE_GOVERNED"|"LOCAL_ONLY";
export type XviSourcePolicyReason="LICENSE_MISSING"|"PERMISSION_MISSING"|"PROVENANCE_INVALID"|"LANGUAGE_SCOPE_MISMATCH"|"DATASET_SCOPE_MISMATCH"|"RESTRICTED_PERSONAL_DATA"|"DEDUP_COLLISION"|"RESOURCE_CEILING"|"RETRY_EXHAUSTED";
export type XviSourcePolicyDisposition="DEFERRED"|"NEEDS_REVIEW"|"QUARANTINED"|"REJECTED";

export interface XviSourcePolicyExceptionReceiptMirror{
  readonly exceptionId:string;readonly tenantId:string;readonly jurisdictionId:string;readonly sourceId:string;
  readonly dedupKey:string;readonly reason:XviSourcePolicyReason;readonly disposition:XviSourcePolicyDisposition;
  readonly evidenceHash:string;readonly evidenceBindingHash:string;readonly replayKey:string;readonly exceptionDigest:string;
  readonly attemptCount:number;readonly maxRetries:number;readonly canRetry:boolean;readonly requiresHumanReview:boolean;
  readonly firstObservedAt:string;readonly lastObservedAt:string;readonly safeReadOnly:true;readonly canFetchExternalData:false;
  readonly canFeedCountryCell:false;readonly canFeedCore:false;readonly executionAuthority:false;readonly mutationAuthority:false;readonly productionAuthority:false;
}
export interface XviSourcePolicyExceptionBatchReceiptMirror{
  readonly schemaVersion:"xvi-jurisdiction-source-policy-exception-v1";readonly batchId:string;readonly scheduleId:string;
  readonly globalFeedPlanId:string;readonly tenantId:string;readonly jurisdictionId:string;readonly runMode:XviSourcePolicyCardRunMode;
  readonly observedAt:string;readonly exceptionCount:number;readonly deferredCount:number;readonly needsReviewCount:number;
  readonly quarantinedCount:number;readonly rejectedCount:number;readonly exceptions:readonly XviSourcePolicyExceptionReceiptMirror[];
  readonly replayScope:"BATCH_ONLY";readonly requiresDurableReplayLedger:true;readonly zeroSecretContext:true;readonly safeReadOnly:true;
  readonly canFetchExternalData:false;readonly canFeedCountryCell:false;readonly canFeedCore:false;
  readonly executionAuthority:false;readonly mutationAuthority:false;readonly productionAuthority:false;
}
export interface XviJurisdictionSourcePolicyExceptionCardInput{
  readonly receipt:XviSourcePolicyExceptionBatchReceiptMirror;readonly safeReadOnly:true;readonly requiresUserGesture:true;
  readonly canAutoNavigate:false;readonly canFetchExternalData:false;readonly canFeedCore:false;readonly canMutate:false;readonly canClaimIngestion:false;
}
export interface XviJurisdictionSourcePolicyExceptionCardPresentation{
  readonly schemaVersion:"xvi-jurisdiction-source-policy-exception-card-v1";readonly batchId:string;readonly scheduleId:string;
  readonly tenantId:string;readonly jurisdictionId:string;readonly runMode:XviSourcePolicyCardRunMode;
  readonly modeLabel:"Online governed"|"Offline governed"|"Local only";readonly lane:"UNIVERSE"|"NEEDS_YOU";
  readonly reviewState:XviSourcePolicyDisposition;readonly statusLabel:"Deferred"|"Needs review"|"Quarantined"|"Rejected";
  readonly headline:"Source work is deferred"|"Source policy needs review"|"Source evidence is quarantined"|"Source access was rejected";
  readonly body:string;readonly exceptionCount:number;readonly deferredCount:number;readonly needsReviewCount:number;
  readonly quarantinedCount:number;readonly rejectedCount:number;readonly reasonSummary:readonly Readonly<{readonly reason:XviSourcePolicyReason;readonly count:number}>[];
  readonly retryableCount:number;readonly exhaustedRetryCount:number;readonly evidenceBoundCount:number;
  readonly replayProtectionLabel:"Batch-local replay protection; durable replay ledger still required";
  readonly primaryAction:"View deferred sources"|"Review source policy"|"Review quarantined evidence"|"Review rejection";
  readonly secondaryAction:"Ask XVI";readonly askXviContext:"Explain deferred sources"|"Explain source policy"|"Explain quarantine"|"Explain rejection";
  readonly accessibilityLabel:string;readonly safeReadOnly:true;readonly requiresUserGesture:true;readonly canAutoNavigate:false;
  readonly navigationAuthority:false;readonly canFetchExternalData:false;readonly canFeedCountryCell:false;readonly canFeedCore:false;
  readonly canMutate:false;readonly canClaimIngestion:false;readonly executionAuthority:false;readonly mutationAuthority:false;readonly productionAuthority:false;
}

const PLAIN=Object.getPrototypeOf({}),MAX=128,MAX_RETRIES=3;
const MODES=new Set<XviSourcePolicyCardRunMode>(["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"]);
const REASONS=new Set<XviSourcePolicyReason>(["LICENSE_MISSING","PERMISSION_MISSING","PROVENANCE_INVALID","LANGUAGE_SCOPE_MISMATCH","DATASET_SCOPE_MISMATCH","RESTRICTED_PERSONAL_DATA","DEDUP_COLLISION","RESOURCE_CEILING","RETRY_EXHAUSTED"]);
const ITEM_KEYS=["exceptionId","tenantId","jurisdictionId","sourceId","dedupKey","reason","disposition","evidenceHash","evidenceBindingHash","replayKey","exceptionDigest","attemptCount","maxRetries","canRetry","requiresHumanReview","firstObservedAt","lastObservedAt","safeReadOnly","canFetchExternalData","canFeedCountryCell","canFeedCore","executionAuthority","mutationAuthority","productionAuthority"] as const;
const BATCH_KEYS=["schemaVersion","batchId","scheduleId","globalFeedPlanId","tenantId","jurisdictionId","runMode","observedAt","exceptionCount","deferredCount","needsReviewCount","quarantinedCount","rejectedCount","exceptions","replayScope","requiresDurableReplayLedger","zeroSecretContext","safeReadOnly","canFetchExternalData","canFeedCountryCell","canFeedCore","executionAuthority","mutationAuthority","productionAuthority"] as const;
const CARD_KEYS=["receipt","safeReadOnly","requiresUserGesture","canAutoNavigate","canFetchExternalData","canFeedCore","canMutate","canClaimIngestion"] as const;

function plain(v:unknown,label:string):asserts v is Record<string,unknown>{
  if(v===null||typeof v!=="object"||Object.getPrototypeOf(v)!==PLAIN)throw new Error(`${label}_PLAIN_REQUIRED`);
  if(Object.getOwnPropertySymbols(v).length)throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for(const k of Object.keys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||d.get||d.set)throw new Error(`${label}_ACCESSOR_FORBIDDEN`);}
}
function exact(v:Record<string,unknown>,keys:readonly string[],label:string){const a=Object.keys(v).sort(),b=[...keys].sort();if(a.length!==b.length||a.some((k,i)=>k!==b[i]))throw new Error(`${label}_SCHEMA_MISMATCH`);}
function id(v:string,p:string,l:string){if(typeof v!=="string"||!v.startsWith(p)||v.length>240)throw new Error(`${l}_INVALID`);}
function hash(v:string,l:string){if(!/^[a-f0-9]{64}$/.test(v))throw new Error(`${l}_INVALID`);}
function iso(v:string,l:string){if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v)))throw new Error(`${l}_INVALID`);}
function count(v:number,min:number,max:number,l:string){if(!Number.isSafeInteger(v)||v<min||v>max)throw new Error(`${l}_INVALID`);}
function disposition(r:XviSourcePolicyReason):XviSourcePolicyDisposition{
  if(r==="RESOURCE_CEILING")return"DEFERRED";
  if(r==="PROVENANCE_INVALID"||r==="DEDUP_COLLISION")return"QUARANTINED";
  if(r==="RESTRICTED_PERSONAL_DATA")return"REJECTED";
  return"NEEDS_REVIEW";
}
function validateItem(input:unknown,b:XviSourcePolicyExceptionBatchReceiptMirror):Readonly<XviSourcePolicyExceptionReceiptMirror>{
  plain(input,"SOURCE_POLICY_CARD_EXCEPTION");exact(input,ITEM_KEYS,"SOURCE_POLICY_CARD_EXCEPTION");
  const x=input as unknown as XviSourcePolicyExceptionReceiptMirror;
  id(x.exceptionId,"source-policy-exception:","SOURCE_POLICY_CARD_EXCEPTION_ID");id(x.tenantId,"tenant:","SOURCE_POLICY_CARD_TENANT");
  id(x.jurisdictionId,"jurisdiction:","SOURCE_POLICY_CARD_JURISDICTION");id(x.sourceId,"source:","SOURCE_POLICY_CARD_SOURCE");
  hash(x.dedupKey,"SOURCE_POLICY_CARD_DEDUP");hash(x.evidenceHash,"SOURCE_POLICY_CARD_EVIDENCE");hash(x.evidenceBindingHash,"SOURCE_POLICY_CARD_EVIDENCE_BINDING");
  hash(x.replayKey,"SOURCE_POLICY_CARD_REPLAY");hash(x.exceptionDigest,"SOURCE_POLICY_CARD_DIGEST");
  if(!REASONS.has(x.reason))throw new Error("SOURCE_POLICY_CARD_REASON_INVALID");
  count(x.attemptCount,0,MAX_RETRIES,"SOURCE_POLICY_CARD_ATTEMPT_COUNT");count(x.maxRetries,0,MAX_RETRIES,"SOURCE_POLICY_CARD_MAX_RETRIES");
  iso(x.firstObservedAt,"SOURCE_POLICY_CARD_FIRST_OBSERVED_AT");iso(x.lastObservedAt,"SOURCE_POLICY_CARD_LAST_OBSERVED_AT");
  if(x.tenantId!==b.tenantId)throw new Error("SOURCE_POLICY_CARD_TENANT_SCOPE_MISMATCH");
  if(x.jurisdictionId!==b.jurisdictionId)throw new Error("SOURCE_POLICY_CARD_JURISDICTION_SCOPE_MISMATCH");
  if(Date.parse(x.lastObservedAt)<Date.parse(x.firstObservedAt))throw new Error("SOURCE_POLICY_CARD_OBSERVED_ORDER_INVALID");
  if(Date.parse(x.lastObservedAt)>Date.parse(b.observedAt))throw new Error("SOURCE_POLICY_CARD_FROM_FUTURE");
  const d=disposition(x.reason),retry=x.reason==="RESOURCE_CEILING";
  if(x.disposition!==d)throw new Error("SOURCE_POLICY_CARD_DISPOSITION_MISMATCH");
  if(x.canRetry!==retry)throw new Error("SOURCE_POLICY_CARD_RETRY_STATE_MISMATCH");
  if(x.requiresHumanReview!==(d!=="DEFERRED"))throw new Error("SOURCE_POLICY_CARD_REVIEW_STATE_MISMATCH");
  if(x.safeReadOnly!==true||x.canFetchExternalData!==false||x.canFeedCountryCell!==false||x.canFeedCore!==false||x.executionAuthority!==false||x.mutationAuthority!==false||x.productionAuthority!==false)throw new Error("SOURCE_POLICY_CARD_EXCEPTION_AUTHORITY_VIOLATION");
  return Object.freeze({...x});
}
function validateBatch(input:unknown):Readonly<XviSourcePolicyExceptionBatchReceiptMirror>{
  plain(input,"SOURCE_POLICY_CARD_BATCH");exact(input,BATCH_KEYS,"SOURCE_POLICY_CARD_BATCH");
  const b=input as unknown as XviSourcePolicyExceptionBatchReceiptMirror;
  if(b.schemaVersion!=="xvi-jurisdiction-source-policy-exception-v1")throw new Error("SOURCE_POLICY_CARD_SCHEMA_INVALID");
  id(b.batchId,"source-policy-exception-batch:","SOURCE_POLICY_CARD_BATCH_ID");id(b.scheduleId,"jurisdiction-schedule:","SOURCE_POLICY_CARD_SCHEDULE_ID");
  id(b.globalFeedPlanId,"global-feed:","SOURCE_POLICY_CARD_GLOBAL_FEED_ID");id(b.tenantId,"tenant:","SOURCE_POLICY_CARD_BATCH_TENANT");id(b.jurisdictionId,"jurisdiction:","SOURCE_POLICY_CARD_BATCH_JURISDICTION");
  if(!MODES.has(b.runMode))throw new Error("SOURCE_POLICY_CARD_MODE_INVALID");iso(b.observedAt,"SOURCE_POLICY_CARD_OBSERVED_AT");
  count(b.exceptionCount,1,MAX,"SOURCE_POLICY_CARD_EXCEPTION_COUNT");for(const [v,l] of [[b.deferredCount,"DEFERRED"],[b.needsReviewCount,"NEEDS_REVIEW"],[b.quarantinedCount,"QUARANTINED"],[b.rejectedCount,"REJECTED"]] as const)count(v,0,MAX,`SOURCE_POLICY_CARD_${l}_COUNT`);
  if(!Array.isArray(b.exceptions)||b.exceptions.length!==b.exceptionCount)throw new Error("SOURCE_POLICY_CARD_EXCEPTION_ARRAY_MISMATCH");
  if(b.replayScope!=="BATCH_ONLY"||b.requiresDurableReplayLedger!==true||b.zeroSecretContext!==true||b.safeReadOnly!==true||b.canFetchExternalData!==false||b.canFeedCountryCell!==false||b.canFeedCore!==false||b.executionAuthority!==false||b.mutationAuthority!==false||b.productionAuthority!==false)throw new Error("SOURCE_POLICY_CARD_BATCH_AUTHORITY_VIOLATION");
  const ids=new Set<string>(),replays=new Set<string>();let deferred=0,review=0,quarantine=0,rejected=0;
  for(const raw of b.exceptions){const x=validateItem(raw,b);if(ids.has(x.exceptionId))throw new Error("SOURCE_POLICY_CARD_EXCEPTION_ID_DUPLICATE");if(replays.has(x.replayKey))throw new Error("SOURCE_POLICY_CARD_REPLAY_DUPLICATE");ids.add(x.exceptionId);replays.add(x.replayKey);if(x.disposition==="DEFERRED")deferred++;else if(x.disposition==="NEEDS_REVIEW")review++;else if(x.disposition==="QUARANTINED")quarantine++;else rejected++;}
  if(deferred!==b.deferredCount||review!==b.needsReviewCount||quarantine!==b.quarantinedCount||rejected!==b.rejectedCount||deferred+review+quarantine+rejected!==b.exceptionCount)throw new Error("SOURCE_POLICY_CARD_SUMMARY_COUNT_MISMATCH");
  return Object.freeze({...b});
}
function modeLabel(m:XviSourcePolicyCardRunMode):"Online governed"|"Offline governed"|"Local only"{return m==="ONLINE_GOVERNED"?"Online governed":m==="OFFLINE_GOVERNED"?"Offline governed":"Local only";}
function state(b:XviSourcePolicyExceptionBatchReceiptMirror):XviSourcePolicyDisposition{return b.rejectedCount?"REJECTED":b.quarantinedCount?"QUARANTINED":b.needsReviewCount?"NEEDS_REVIEW":"DEFERRED";}
function copy(s:XviSourcePolicyDisposition){
  if(s==="REJECTED")return{statusLabel:"Rejected",headline:"Source access was rejected",primaryAction:"Review rejection",askXviContext:"Explain rejection"} as const;
  if(s==="QUARANTINED")return{statusLabel:"Quarantined",headline:"Source evidence is quarantined",primaryAction:"Review quarantined evidence",askXviContext:"Explain quarantine"} as const;
  if(s==="NEEDS_REVIEW")return{statusLabel:"Needs review",headline:"Source policy needs review",primaryAction:"Review source policy",askXviContext:"Explain source policy"} as const;
  return{statusLabel:"Deferred",headline:"Source work is deferred",primaryAction:"View deferred sources",askXviContext:"Explain deferred sources"} as const;
}

export function presentJurisdictionSourcePolicyExceptionCard(input:unknown):Readonly<XviJurisdictionSourcePolicyExceptionCardPresentation>{
  plain(input,"SOURCE_POLICY_CARD");exact(input,CARD_KEYS,"SOURCE_POLICY_CARD");
  const r=input as unknown as XviJurisdictionSourcePolicyExceptionCardInput;
  if(r.safeReadOnly!==true||r.requiresUserGesture!==true||r.canAutoNavigate!==false||r.canFetchExternalData!==false||r.canFeedCore!==false||r.canMutate!==false||r.canClaimIngestion!==false)throw new Error("SOURCE_POLICY_CARD_AUTHORITY_VIOLATION");
  const b=validateBatch(r.receipt),s=state(b),c=copy(s),reasonCounts=new Map<XviSourcePolicyReason,number>();let retryable=0,exhausted=0,evidenceBound=0;
  for(const x of b.exceptions){reasonCounts.set(x.reason,(reasonCounts.get(x.reason)??0)+1);if(x.canRetry)retryable++;if(x.reason==="RETRY_EXHAUSTED")exhausted++;if(x.evidenceBindingHash.length===64&&x.exceptionDigest.length===64)evidenceBound++;}
  const reasonSummary=[...REASONS].filter(x=>(reasonCounts.get(x)??0)>0).map(reason=>Object.freeze({reason,count:reasonCounts.get(reason)??0}));
  const mode=modeLabel(b.runMode),reviewCount=b.exceptionCount-b.deferredCount;
  return Object.freeze({
    schemaVersion:"xvi-jurisdiction-source-policy-exception-card-v1",batchId:b.batchId,scheduleId:b.scheduleId,tenantId:b.tenantId,jurisdictionId:b.jurisdictionId,runMode:b.runMode,modeLabel:mode,
    lane:s==="DEFERRED"?"UNIVERSE":"NEEDS_YOU",reviewState:s,statusLabel:c.statusLabel,headline:c.headline,
    body:s==="DEFERRED"?`${b.deferredCount} source exception${b.deferredCount===1?"":"s"} remain bounded by governed resource ceilings. Nothing is retrieved automatically.`:`${reviewCount} source policy exception${reviewCount===1?"":"s"} require governed review. Nothing opens or changes automatically.`,
    exceptionCount:b.exceptionCount,deferredCount:b.deferredCount,needsReviewCount:b.needsReviewCount,quarantinedCount:b.quarantinedCount,rejectedCount:b.rejectedCount,reasonSummary:Object.freeze(reasonSummary),
    retryableCount:retryable,exhaustedRetryCount:exhausted,evidenceBoundCount:evidenceBound,replayProtectionLabel:"Batch-local replay protection; durable replay ledger still required",
    primaryAction:c.primaryAction,secondaryAction:"Ask XVI",askXviContext:c.askXviContext,
    accessibilityLabel:`${c.statusLabel}. ${c.headline}. ${mode}. ${b.jurisdictionId.replace(/^jurisdiction:/,"")}. ${b.exceptionCount} source policy exception${b.exceptionCount===1?"":"s"}. ${b.deferredCount} deferred, ${b.needsReviewCount} need review, ${b.quarantinedCount} quarantined, ${b.rejectedCount} rejected. Batch-local replay protection only; durable replay ledger still required. No retrieval, ingestion, country-cell promotion, or CORE feed is authorized.`,
    safeReadOnly:true,requiresUserGesture:true,canAutoNavigate:false,navigationAuthority:false,canFetchExternalData:false,canFeedCountryCell:false,canFeedCore:false,canMutate:false,canClaimIngestion:false,executionAuthority:false,mutationAuthority:false,productionAuthority:false,
  });
}
