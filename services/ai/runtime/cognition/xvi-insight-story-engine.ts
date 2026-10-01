export type XviAudience = "CONSUMER" | "ENTREPRENEUR" | "EXECUTIVE";
export type XviInsightKind = "ISSUE" | "OPPORTUNITY" | "PROJECTION" | "CHART" | "GRAPH" | "STORY" | "QUESTION";
export type XviVisualKind = "BAR" | "LINE" | "PIE" | "SCATTER" | "NETWORK" | "TIMELINE" | "NONE";
export type XviConfidencePosture = "LOW" | "MODERATE" | "HIGH" | "DISPUTED";

export interface XviInsightEvidenceRef {
  readonly sourceId: string;
  readonly provenanceHash: string;
  readonly datasetId: string | null;
  readonly independentRootId: string;
  readonly freshnessAt: string;
  readonly licensed: boolean;
  readonly quarantined: boolean;
}

export interface XviProjectionAssumption {
  readonly assumptionId: string;
  readonly label: string;
  readonly value: string;
  readonly sensitivity: "LOW" | "MEDIUM" | "HIGH";
}

export interface XviInsightStoryInput {
  readonly storyId: string;
  readonly audience: XviAudience;
  readonly kind: XviInsightKind;
  readonly title: string;
  readonly summary: string;
  readonly evidence: readonly XviInsightEvidenceRef[];
  readonly assumptions: readonly XviProjectionAssumption[];
  readonly visualKind: XviVisualKind;
  readonly horizonLabel: string | null;
  readonly uncertaintyLow: number | null;
  readonly uncertaintyHigh: number | null;
  readonly projectedValue: number | null;
  readonly unitLabel: string | null;
  readonly nextQuestion: string;
  readonly observedAt: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviInsightStoryReceipt {
  readonly schemaVersion: "xvi-insight-story-v1";
  readonly storyId: string;
  readonly audience: XviAudience;
  readonly kind: XviInsightKind;
  readonly visualKind: XviVisualKind;
  readonly confidencePosture: XviConfidencePosture;
  readonly independentEvidenceRoots: number;
  readonly quarantinedEvidenceCount: number;
  readonly licensedEvidenceCount: number;
  readonly hasProjection: boolean;
  readonly assumptionsCount: number;
  readonly uncertaintyBounded: boolean;
  readonly canRenderVisual: boolean;
  readonly canClaimFact: boolean;
  readonly nextQuestion: string;
  readonly safeReadOnly: true;
  readonly canTakeExternalAction: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const AUDIENCES = new Set<XviAudience>(["CONSUMER","ENTREPRENEUR","EXECUTIVE"]);
const KINDS = new Set<XviInsightKind>(["ISSUE","OPPORTUNITY","PROJECTION","CHART","GRAPH","STORY","QUESTION"]);
const VISUALS = new Set<XviVisualKind>(["BAR","LINE","PIE","SCATTER","NETWORK","TIMELINE","NONE"]);

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v === null || typeof v !== "object" || Object.getPrototypeOf(v) !== PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const k of Object.keys(v)) {
    const d = Object.getOwnPropertyDescriptor(v, k);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}
function exact(v: Record<string, unknown>, keys: readonly string[], label: string): void {
  const a = Object.keys(v).sort(), b = [...keys].sort();
  if (a.length !== b.length || a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v:string,label:string):void {
  if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function hash(v:string,label:string):void {
  if(!/^[a-f0-9]{64}$/.test(v)) throw new Error(`${label}_INVALID`);
}

export function validateInsightStoryInput(input: unknown): Readonly<XviInsightStoryInput> {
  plain(input,"INSIGHT_STORY");
  exact(input,["storyId","audience","kind","title","summary","evidence","assumptions","visualKind","horizonLabel","uncertaintyLow","uncertaintyHigh","projectedValue","unitLabel","nextQuestion","observedAt","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"INSIGHT_STORY");
  const r = input as unknown as XviInsightStoryInput;
  if(!/^story:/.test(r.storyId)||!AUDIENCES.has(r.audience)||!KINDS.has(r.kind)||!VISUALS.has(r.visualKind)||!r.title?.trim()||!r.summary?.trim()||!r.nextQuestion?.trim()) throw new Error("INSIGHT_STORY_IDENTITY_INVALID");
  if(!Array.isArray(r.evidence)||r.evidence.length<1||r.evidence.length>128) throw new Error("INSIGHT_EVIDENCE_COUNT_INVALID");
  const evidenceIds = new Set<string>();
  for(const raw of r.evidence){
    plain(raw,"INSIGHT_EVIDENCE");
    exact(raw,["sourceId","provenanceHash","datasetId","independentRootId","freshnessAt","licensed","quarantined"],"INSIGHT_EVIDENCE");
    const e = raw as unknown as XviInsightEvidenceRef;
    if(!e.sourceId?.trim()||evidenceIds.has(e.sourceId)||!e.independentRootId?.trim()||typeof e.licensed!=="boolean"||typeof e.quarantined!=="boolean") throw new Error("INSIGHT_EVIDENCE_INVALID");
    evidenceIds.add(e.sourceId);
    hash(e.provenanceHash,"PROVENANCE_HASH");
    if(e.datasetId!==null&&!/^dataset:/.test(e.datasetId)) throw new Error("DATASET_ID_INVALID");
    iso(e.freshnessAt,"EVIDENCE_FRESHNESS_AT");
  }
  if(!Array.isArray(r.assumptions)||r.assumptions.length>32) throw new Error("ASSUMPTION_COUNT_INVALID");
  const assumptionIds = new Set<string>();
  for(const raw of r.assumptions){
    plain(raw,"PROJECTION_ASSUMPTION");
    exact(raw,["assumptionId","label","value","sensitivity"],"PROJECTION_ASSUMPTION");
    const a = raw as unknown as XviProjectionAssumption;
    if(!a.assumptionId?.trim()||assumptionIds.has(a.assumptionId)||!a.label?.trim()||!a.value?.trim()||!["LOW","MEDIUM","HIGH"].includes(a.sensitivity)) throw new Error("PROJECTION_ASSUMPTION_INVALID");
    assumptionIds.add(a.assumptionId);
  }
  const hasProjection = r.kind==="PROJECTION" || r.projectedValue!==null || r.horizonLabel!==null;
  if(hasProjection){
    if(r.projectedValue===null||r.horizonLabel===null||r.uncertaintyLow===null||r.uncertaintyHigh===null||r.unitLabel===null||r.assumptions.length<1) throw new Error("PROJECTION_FIELDS_REQUIRED");
    if(!Number.isFinite(r.projectedValue)||!Number.isFinite(r.uncertaintyLow)||!Number.isFinite(r.uncertaintyHigh)||r.uncertaintyLow>r.uncertaintyHigh) throw new Error("PROJECTION_RANGE_INVALID");
  } else if(r.uncertaintyLow!==null||r.uncertaintyHigh!==null||r.unitLabel!==null) throw new Error("NON_PROJECTION_FIELDS_FORBIDDEN");
  iso(r.observedAt,"OBSERVED_AT");
  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("INSIGHT_STORY_AUTHORITY_VIOLATION");
  return Object.freeze({...r,evidence:Object.freeze(r.evidence.map(e=>Object.freeze({...e}))),assumptions:Object.freeze(r.assumptions.map(a=>Object.freeze({...a})))});
}

export function compileInsightStory(input: unknown): Readonly<XviInsightStoryReceipt> {
  const r = validateInsightStoryInput(input);
  const roots = new Set(r.evidence.filter(e=>!e.quarantined).map(e=>e.independentRootId));
  const quarantinedEvidenceCount = r.evidence.filter(e=>e.quarantined).length;
  const licensedEvidenceCount = r.evidence.filter(e=>e.licensed&&!e.quarantined).length;
  const unlicensedClean = r.evidence.filter(e=>!e.licensed&&!e.quarantined).length;
  const hasProjection = r.projectedValue!==null;
  const uncertaintyBounded = !hasProjection || (r.uncertaintyLow!==null&&r.uncertaintyHigh!==null);
  let confidencePosture:XviConfidencePosture = "LOW";
  if(quarantinedEvidenceCount>0||unlicensedClean>0) confidencePosture="DISPUTED";
  else if(roots.size>=3) confidencePosture="HIGH";
  else if(roots.size===2) confidencePosture="MODERATE";
  const canClaimFact = !hasProjection && confidencePosture!=="DISPUTED" && roots.size>=2;
  const canRenderVisual = r.visualKind!=="NONE" && quarantinedEvidenceCount===0 && licensedEvidenceCount>0 && uncertaintyBounded;
  return Object.freeze({
    schemaVersion:"xvi-insight-story-v1",
    storyId:r.storyId,
    audience:r.audience,
    kind:r.kind,
    visualKind:r.visualKind,
    confidencePosture,
    independentEvidenceRoots:roots.size,
    quarantinedEvidenceCount,
    licensedEvidenceCount,
    hasProjection,
    assumptionsCount:r.assumptions.length,
    uncertaintyBounded,
    canRenderVisual,
    canClaimFact,
    nextQuestion:r.nextQuestion,
    safeReadOnly:true,
    canTakeExternalAction:false,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
