export type XviAudience = "CONSUMER" | "ENTREPRENEUR" | "EXECUTIVE";
export type XviAgentRunMode = "LOCAL_ONLY" | "OFFLINE_GOVERNED" | "ONLINE_GOVERNED";
export type XviInsightKind = "ISSUE" | "OPPORTUNITY" | "PROJECTION" | "CHART" | "GRAPH" | "STORY" | "QUESTION";
export type XviDataSensitivity = "PUBLIC" | "PERSONAL" | "BUSINESS_CONFIDENTIAL" | "RESTRICTED";
export type XviLearningDisposition = "LEARN" | "DEFER" | "QUARANTINE" | "REJECT";

export interface XviPersonalDatasetSource {
  readonly sourceId: string;
  readonly sourceType: "MOBILE" | "BUSINESS_SYSTEM" | "PUBLIC_DATASET" | "USER_UPLOAD" | "RESEARCH";
  readonly consented: boolean;
  readonly licensed: boolean;
  readonly provenanceHash: string;
  readonly sensitivity: XviDataSensitivity;
  readonly rowEstimate: number;
  readonly freshnessAt: string;
  readonly quarantineReasons: readonly string[];
}

export interface XviPersonalDatasetAgentInput {
  readonly agentId: string;
  readonly audience: XviAudience;
  readonly tenantId: string;
  readonly userScopeId: string;
  readonly runMode: XviAgentRunMode;
  readonly sources: readonly XviPersonalDatasetSource[];
  readonly requestedInsights: readonly XviInsightKind[];
  readonly maxSourceRowsPerRun: number;
  readonly maxOutputItems: number;
  readonly allowProjection: boolean;
  readonly allowPersonalization: boolean;
  readonly observedAt: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviPersonalDatasetAgentReceipt {
  readonly schemaVersion: "xvi-personal-dataset-agent-v1";
  readonly agentId: string;
  readonly audience: XviAudience;
  readonly eligibleSourceCount: number;
  readonly deferredSourceCount: number;
  readonly quarantinedSourceCount: number;
  readonly rejectedSourceCount: number;
  readonly eligibleRowEstimate: number;
  readonly insightPlan: readonly XviInsightKind[];
  readonly learningDisposition: XviLearningDisposition;
  readonly canProject: boolean;
  readonly canPersonalize: boolean;
  readonly requiresHumanReview: boolean;
  readonly scaleClaim: "BOUNDED_PARTITIONS_ONLY";
  readonly safeReadOnly: true;
  readonly canLearnAutonomouslyWithinPolicy: boolean;
  readonly canTakeExternalAction: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN=Object.getPrototypeOf({});
const AUDIENCES=new Set<XviAudience>(["CONSUMER","ENTREPRENEUR","EXECUTIVE"]);
const MODES=new Set<XviAgentRunMode>(["LOCAL_ONLY","OFFLINE_GOVERNED","ONLINE_GOVERNED"]);
const INSIGHTS=new Set<XviInsightKind>(["ISSUE","OPPORTUNITY","PROJECTION","CHART","GRAPH","STORY","QUESTION"]);
const SENSITIVITY=new Set<XviDataSensitivity>(["PUBLIC","PERSONAL","BUSINESS_CONFIDENTIAL","RESTRICTED"]);

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

export function validatePersonalDatasetAgentInput(input:unknown):Readonly<XviPersonalDatasetAgentInput>{
  plain(input,"PERSONAL_AGENT");
  exact(input,["agentId","audience","tenantId","userScopeId","runMode","sources","requestedInsights","maxSourceRowsPerRun","maxOutputItems","allowProjection","allowPersonalization","observedAt","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"PERSONAL_AGENT");
  const r=input as unknown as XviPersonalDatasetAgentInput;
  if(!/^agent:/.test(r.agentId)||!AUDIENCES.has(r.audience)||!/^tenant:/.test(r.tenantId)||!/^user-scope:/.test(r.userScopeId)||!MODES.has(r.runMode)) throw new Error("PERSONAL_AGENT_IDENTITY_INVALID");
  if(!Array.isArray(r.sources)||r.sources.length<1||r.sources.length>512) throw new Error("PERSONAL_AGENT_SOURCE_COUNT_INVALID");
  const sourceIds=new Set<string>();
  for(const raw of r.sources){
    plain(raw,"PERSONAL_AGENT_SOURCE");
    exact(raw,["sourceId","sourceType","consented","licensed","provenanceHash","sensitivity","rowEstimate","freshnessAt","quarantineReasons"],"PERSONAL_AGENT_SOURCE");
    const s=raw as unknown as XviPersonalDatasetSource;
    if(!s.sourceId?.trim()||sourceIds.has(s.sourceId)||!["MOBILE","BUSINESS_SYSTEM","PUBLIC_DATASET","USER_UPLOAD","RESEARCH"].includes(s.sourceType)||!SENSITIVITY.has(s.sensitivity)) throw new Error("PERSONAL_AGENT_SOURCE_INVALID");
    sourceIds.add(s.sourceId);
    if(typeof s.consented!=="boolean"||typeof s.licensed!=="boolean") throw new Error("PERSONAL_AGENT_SOURCE_FLAGS_INVALID");
    hash(s.provenanceHash,"SOURCE_PROVENANCE_HASH");
    safeInt(s.rowEstimate,0,1_000_000_000_000,"SOURCE_ROW_ESTIMATE");
    iso(s.freshnessAt,"SOURCE_FRESHNESS_AT");
    uniqueStrings(s.quarantineReasons,64,"SOURCE_QUARANTINE_REASONS");
  }
  uniqueStrings(r.requestedInsights,INSIGHTS.size,"REQUESTED_INSIGHTS",1);
  if(r.requestedInsights.some(x=>!INSIGHTS.has(x as XviInsightKind))) throw new Error("REQUESTED_INSIGHT_INVALID");
  safeInt(r.maxSourceRowsPerRun,1,100_000_000,"MAX_SOURCE_ROWS_PER_RUN");
  safeInt(r.maxOutputItems,1,1000,"MAX_OUTPUT_ITEMS");
  if(typeof r.allowProjection!=="boolean"||typeof r.allowPersonalization!=="boolean") throw new Error("PERSONAL_AGENT_FEATURE_FLAG_INVALID");
  iso(r.observedAt,"OBSERVED_AT");
  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("PERSONAL_AGENT_AUTHORITY_VIOLATION");
  return Object.freeze({...r,sources:Object.freeze(r.sources.map(s=>Object.freeze({...s,quarantineReasons:Object.freeze([...s.quarantineReasons])}))),requestedInsights:Object.freeze([...r.requestedInsights])});
}

export function planPersonalDatasetAgent(input:unknown):Readonly<XviPersonalDatasetAgentReceipt>{
  const r=validatePersonalDatasetAgentInput(input);
  let eligible=0,deferred=0,quarantined=0,rejected=0,eligibleRowEstimate=0;
  for(const s of r.sources){
    if(s.quarantineReasons.length>0){quarantined++;continue;}
    if(s.sensitivity==="RESTRICTED"){rejected++;continue;}
    if(s.sourceType==="PUBLIC_DATASET"||s.sourceType==="RESEARCH"){
      if(!s.licensed){rejected++;continue;}
    } else if(!s.consented){deferred++;continue;}
    eligible++;
    eligibleRowEstimate=Math.min(Number.MAX_SAFE_INTEGER,eligibleRowEstimate+s.rowEstimate);
  }
  eligibleRowEstimate=Math.min(eligibleRowEstimate,r.maxSourceRowsPerRun);
  const insightPlan=r.requestedInsights.filter(x=>x!=="PROJECTION"||r.allowProjection).slice(0,r.maxOutputItems);
  const requiresHumanReview=quarantined>0||deferred>0||rejected>0;
  const learningDisposition:XviLearningDisposition =
    quarantined>0 ? "QUARANTINE" :
    eligible===0 && rejected>0 ? "REJECT" :
    eligible===0 || deferred>0 ? "DEFER" : "LEARN";
  return Object.freeze({
    schemaVersion:"xvi-personal-dataset-agent-v1",
    agentId:r.agentId,
    audience:r.audience,
    eligibleSourceCount:eligible,
    deferredSourceCount:deferred,
    quarantinedSourceCount:quarantined,
    rejectedSourceCount:rejected,
    eligibleRowEstimate,
    insightPlan:Object.freeze([...insightPlan]),
    learningDisposition,
    canProject:r.allowProjection&&eligible>0,
    canPersonalize:r.allowPersonalization&&eligible>0,
    requiresHumanReview,
    scaleClaim:"BOUNDED_PARTITIONS_ONLY",
    safeReadOnly:true,
    canLearnAutonomouslyWithinPolicy:learningDisposition==="LEARN"&&eligible>0,
    canTakeExternalAction:false,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
