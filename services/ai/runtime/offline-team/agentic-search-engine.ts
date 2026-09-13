import { createHash } from 'node:crypto';
export type SearchSource='COMPANY_BRAIN'|'COMMUNITY'|'APPROVED_PUBLIC'|'HISTORICAL_GRAPH';
export interface AgenticSearchQuery{tenantId:string;text:string;sources:SearchSource[];allowOnline:boolean;classification:'PUBLIC'|'INTERNAL'|'CONFIDENTIAL'|'TOP_SECRET';}
export interface SearchEvidence{source:SearchSource;ref:string;summary:string;confidence:number;tenantId?:string;}
export function planAgenticSearch(q:AgenticSearchQuery,e:SearchEvidence[]){if(!q.tenantId.trim()||!q.text.trim())throw new Error('tenant/query required');if(q.classification==='TOP_SECRET'&&q.allowOnline)throw new Error('TOP_SECRET search must remain local');if(e.some(x=>x.tenantId&&x.tenantId!==q.tenantId))throw new Error('cross-tenant search evidence blocked');return{queryHash:createHash('sha256').update(JSON.stringify(q)).digest('hex'),answerMode:q.allowOnline?'HYBRID':'LOCAL_ONLY',evidence:e,requiresHumanReview:e.some(x=>x.confidence<.65)};}
export const AGENTIC_SEARCH_GUARDRAILS= Object.freeze({ humanDecision: 'REQUIRED' as const, correlationIsCausation:false,evidenceRequired:true,tenantIsolation:true,topSecretOnlineAllowed:false,provenanceRequired:true} );
