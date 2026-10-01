export type XviAudience = "CONSUMER" | "ENTREPRENEUR" | "EXECUTIVE";
export type XviConfidencePosture = "LOW" | "MODERATE" | "HIGH" | "DISPUTED";

export interface XviInsightCardInput {
  readonly audience: XviAudience;
  readonly title: string;
  readonly summary: string;
  readonly confidencePosture: XviConfidencePosture;
  readonly independentEvidenceRoots: number;
  readonly hasProjection: boolean;
  readonly uncertaintyLabel: string | null;
  readonly visualAvailable: boolean;
  readonly nextQuestion: string;
  readonly safeReadOnly: true;
  readonly canTakeExternalAction: false;
  readonly canClaimFact: boolean;
}

export interface XviInsightCardPresentation {
  readonly schemaVersion: "xvi-insight-card-v1";
  readonly audience: XviAudience;
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly evidenceLabel: string;
  readonly uncertaintyLabel: string | null;
  readonly primaryAction: "Explore data" | "View projection" | "Review evidence";
  readonly secondaryAction: "Ask XVI";
  readonly nextQuestion: string;
  readonly safeReadOnly: true;
  readonly canMutate: false;
  readonly canClaimExecution: false;
}

const PLAIN=Object.getPrototypeOf({});
function plain(v:unknown,label:string):asserts v is Record<string,unknown>{
  if(v===null||typeof v!=="object"||Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if(Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for(const k of Object.keys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||d.get||d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);}
}

export function presentInsightCard(input:unknown):Readonly<XviInsightCardPresentation>{
  plain(input,"INSIGHT_CARD");
  const r=input as unknown as XviInsightCardInput;
  if(!["CONSUMER","ENTREPRENEUR","EXECUTIVE"].includes(r.audience)||!r.title?.trim()||!r.summary?.trim()||!["LOW","MODERATE","HIGH","DISPUTED"].includes(r.confidencePosture)||!Number.isSafeInteger(r.independentEvidenceRoots)||r.independentEvidenceRoots<0||!r.nextQuestion?.trim()) throw new Error("INSIGHT_CARD_INVALID");
  if(typeof r.hasProjection!=="boolean"||typeof r.visualAvailable!=="boolean"||typeof r.canClaimFact!=="boolean") throw new Error("INSIGHT_CARD_FLAGS_INVALID");
  if(r.hasProjection&&r.uncertaintyLabel===null) throw new Error("PROJECTION_UNCERTAINTY_LABEL_REQUIRED");
  if(r.safeReadOnly!==true||r.canTakeExternalAction!==false) throw new Error("INSIGHT_CARD_AUTHORITY_VIOLATION");
  const eyebrow=r.audience==="CONSUMER"?"For you":r.audience==="ENTREPRENEUR"?"Business insight":"Executive intelligence";
  const primaryAction=r.confidencePosture==="DISPUTED"?"Review evidence":r.hasProjection?"View projection":"Explore data";
  return Object.freeze({
    schemaVersion:"xvi-insight-card-v1",
    audience:r.audience,
    eyebrow,
    title:r.title,
    summary:r.summary,
    evidenceLabel:`${r.independentEvidenceRoots} independent evidence root${r.independentEvidenceRoots===1?"":"s"} • ${r.confidencePosture.toLowerCase()} posture`,
    uncertaintyLabel:r.uncertaintyLabel,
    primaryAction,
    secondaryAction:"Ask XVI",
    nextQuestion:r.nextQuestion,
    safeReadOnly:true,
    canMutate:false,
    canClaimExecution:false,
  });
}
