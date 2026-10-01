export type XviAudience = "CONSUMER" | "ENTREPRENEUR" | "EXECUTIVE";
export type XviInvestigationState = "ACTIVE" | "PAUSED" | "NEEDS_REVIEW" | "ARCHIVED";

export interface XviInvestigationItem {
  readonly itemId: string;
  readonly type: "STORY" | "VISUALIZATION" | "QUESTION" | "EVIDENCE";
  readonly refId: string;
  readonly label: string;
}

export interface XviInvestigationWorkspaceInput {
  readonly workspaceId: string;
  readonly audience: XviAudience;
  readonly title: string;
  readonly state: XviInvestigationState;
  readonly items: readonly XviInvestigationItem[];
  readonly unresolvedQuestionCount: number;
  readonly disputedItemCount: number;
  readonly lastUpdatedAt: string;
  readonly safeReadOnly: true;
  readonly canMutate: false;
  readonly canClaimExecution: false;
}

export interface XviInvestigationWorkspacePresentation {
  readonly schemaVersion: "xvi-investigation-workspace-v1";
  readonly workspaceId: string;
  readonly audience: XviAudience;
  readonly title: string;
  readonly state: XviInvestigationState;
  readonly itemCount: number;
  readonly unresolvedQuestionCount: number;
  readonly disputedItemCount: number;
  readonly attentionRoute: "UNIVERSE" | "NEEDS_YOU";
  readonly primaryAction: "Continue investigation" | "Review disputed evidence" | "Open archive";
  readonly secondaryAction: "Ask XVI";
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
function iso(v:string,label:string):void{if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);}

export function presentInvestigationWorkspace(input:unknown):Readonly<XviInvestigationWorkspacePresentation>{
  plain(input,"INVESTIGATION");
  const r=input as unknown as XviInvestigationWorkspaceInput;
  if(!/^workspace:/.test(r.workspaceId)||!["CONSUMER","ENTREPRENEUR","EXECUTIVE"].includes(r.audience)||!r.title?.trim()||!["ACTIVE","PAUSED","NEEDS_REVIEW","ARCHIVED"].includes(r.state)||!Array.isArray(r.items)||r.items.length>500) throw new Error("INVESTIGATION_INVALID");
  const ids=new Set<string>();
  for(const item of r.items){plain(item,"INVESTIGATION_ITEM");if(!item.itemId?.trim()||ids.has(item.itemId)||!["STORY","VISUALIZATION","QUESTION","EVIDENCE"].includes(item.type)||!item.refId?.trim()||!item.label?.trim()) throw new Error("INVESTIGATION_ITEM_INVALID");ids.add(item.itemId);}
  if(!Number.isSafeInteger(r.unresolvedQuestionCount)||r.unresolvedQuestionCount<0||!Number.isSafeInteger(r.disputedItemCount)||r.disputedItemCount<0) throw new Error("INVESTIGATION_COUNTS_INVALID");
  iso(r.lastUpdatedAt,"LAST_UPDATED_AT");
  if(r.safeReadOnly!==true||r.canMutate!==false||r.canClaimExecution!==false) throw new Error("INVESTIGATION_AUTHORITY_VIOLATION");
  const needsReview=r.disputedItemCount>0||r.state==="NEEDS_REVIEW";
  return Object.freeze({
    schemaVersion:"xvi-investigation-workspace-v1",
    workspaceId:r.workspaceId,
    audience:r.audience,
    title:r.title,
    state:r.state,
    itemCount:r.items.length,
    unresolvedQuestionCount:r.unresolvedQuestionCount,
    disputedItemCount:r.disputedItemCount,
    attentionRoute:needsReview?"NEEDS_YOU":"UNIVERSE",
    primaryAction:r.state==="ARCHIVED"?"Open archive":needsReview?"Review disputed evidence":"Continue investigation",
    secondaryAction:"Ask XVI",
    safeReadOnly:true,
    canMutate:false,
    canClaimExecution:false,
  });
}
