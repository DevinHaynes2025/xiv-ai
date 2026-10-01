export type XviAudienceExperience = "CONSUMER" | "ENTREPRENEUR" | "EXECUTIVE";
export type XviExperienceModule =
  | "FOR_YOU" | "COMMUNITIES" | "WELLNESS" | "LEARNING" | "REVIEWS"
  | "OPPORTUNITIES" | "PROJECTS" | "AUTOMATION" | "AGENTS" | "ANALYTICS"
  | "FINANCE" | "SECURITY" | "SUPPLY_CHAIN" | "CUSTOMERS" | "GLOBAL_EXPANSION";

export interface XviAudienceExperienceInput {
  readonly audience: XviAudienceExperience;
  readonly personalAgentAvailable: boolean;
  readonly organizationConnected: boolean;
  readonly communityEnabled: boolean;
  readonly requestedModules: readonly XviExperienceModule[];
  readonly safeReadOnly: true;
  readonly canMutate: false;
  readonly canClaimExecution: false;
}

export interface XviAudienceExperiencePresentation {
  readonly schemaVersion: "xvi-audience-experience-v1";
  readonly audience: XviAudienceExperience;
  readonly headline: string;
  readonly primaryModules: readonly XviExperienceModule[];
  readonly secondaryModules: readonly XviExperienceModule[];
  readonly personalAgentLabel: string;
  readonly coreLabel: "CORE ♾️";
  readonly sharedIntelligence: true;
  readonly safeReadOnly: true;
  readonly canMutate: false;
  readonly canClaimExecution: false;
}

const PLAIN=Object.getPrototypeOf({});
const AUDIENCES=new Set<XviAudienceExperience>(["CONSUMER","ENTREPRENEUR","EXECUTIVE"]);
const MODULES=new Set<XviExperienceModule>(["FOR_YOU","COMMUNITIES","WELLNESS","LEARNING","REVIEWS","OPPORTUNITIES","PROJECTS","AUTOMATION","AGENTS","ANALYTICS","FINANCE","SECURITY","SUPPLY_CHAIN","CUSTOMERS","GLOBAL_EXPANSION"]);

function plain(v:unknown,label:string):asserts v is Record<string,unknown>{
  if(v===null||typeof v!=="object"||Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if(Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for(const k of Object.keys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||d.get||d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);}
}

export function presentAudienceExperience(input:unknown):Readonly<XviAudienceExperiencePresentation>{
  plain(input,"AUDIENCE_EXPERIENCE");
  const r=input as unknown as XviAudienceExperienceInput;
  if(!AUDIENCES.has(r.audience)||!Array.isArray(r.requestedModules)||r.requestedModules.some(x=>!MODULES.has(x))) throw new Error("AUDIENCE_EXPERIENCE_INVALID");
  if(r.safeReadOnly!==true||r.canMutate!==false||r.canClaimExecution!==false) throw new Error("AUDIENCE_EXPERIENCE_AUTHORITY_VIOLATION");
  const consumer:XviExperienceModule[]=["FOR_YOU","COMMUNITIES","WELLNESS","LEARNING","REVIEWS","OPPORTUNITIES"];
  const entrepreneur:XviExperienceModule[]=["OPPORTUNITIES","PROJECTS","AUTOMATION","AGENTS","ANALYTICS","FINANCE","CUSTOMERS","GLOBAL_EXPANSION"];
  const executive:XviExperienceModule[]=["ANALYTICS","AGENTS","AUTOMATION","FINANCE","SECURITY","SUPPLY_CHAIN","CUSTOMERS","GLOBAL_EXPANSION"];
  const defaults=r.audience==="CONSUMER"?consumer:r.audience==="ENTREPRENEUR"?entrepreneur:executive;
  const primary=[...new Set([...defaults,...r.requestedModules])].slice(0,8);
  const secondary=[...MODULES].filter(x=>!primary.includes(x)).slice(0,8);
  const headline=r.audience==="CONSUMER"?"Your world, brought to life":r.audience==="ENTREPRENEUR"?"Build, understand, and grow":"See the business. See what comes next.";
  return Object.freeze({
    schemaVersion:"xvi-audience-experience-v1",
    audience:r.audience,
    headline,
    primaryModules:Object.freeze(primary),
    secondaryModules:Object.freeze(secondary),
    personalAgentLabel:r.personalAgentAvailable?"Your Personal AGI Dataset Agent":"Connect data to activate your Personal AGI Dataset Agent",
    coreLabel:"CORE ♾️",
    sharedIntelligence:true,
    safeReadOnly:true,
    canMutate:false,
    canClaimExecution:false,
  });
}
