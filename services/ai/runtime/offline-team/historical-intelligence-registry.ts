export type HistoricalProfileKind='PHILOSOPHER'|'ENTREPRENEUR'|'BUSINESS_LEADER'|'CONSUMER_ARCHETYPE'|'HUMANITY_RESEARCH'|'ANIMAL_BEHAVIOR';
export interface HistoricalSource { sourceId:string; title:string; year?:number; provenance:string; authorized:boolean; }
export interface HistoricalProfile { profileId:string; kind:HistoricalProfileKind; sourceIds:readonly string[]; synthesizedTraits:readonly string[]; confidence:number; simulationPersona:true; }
export const HISTORICAL_INTELLIGENCE_GUARDRAILS={realPersonCloneClaimAllowed:false,simulationPersonaOnly:true,sourceRequired:true,privateDocumentIngestAllowed:false,financialSecretExportAllowed:false} as const;
export function createHistoricalProfile(input:{profileId:string;kind:HistoricalProfileKind;sources:readonly HistoricalSource[];traits:readonly string[];confidence:number}):HistoricalProfile{
 if(!input.sources.length||input.sources.some(s=>!s.authorized)) throw new Error('authorized provenance required');
 return Object.freeze({profileId:input.profileId,kind:input.kind,sourceIds:Object.freeze(input.sources.map(s=>s.sourceId)),synthesizedTraits:Object.freeze([...input.traits]),confidence:Math.max(0,Math.min(1,input.confidence)),simulationPersona:true});
}
