import { createHash } from 'node:crypto';
export const PRIMARY_RESEARCH_ORIGINS = Object.freeze([
  'https://docs.ollama.com','https://code.claude.com','https://cheatsheetseries.owasp.org',
  'https://nodejs.org','https://www.sqlite.org',
]);
export interface ResearchNoteInput {
  url:string; title:string; summary:string; retrievedAt:string;
  tenantId:string; rights:'REFERENCE_ONLY'|'REUSE_REVIEW_REQUIRED';
}
/** Stores an original summary as untrusted reference material, not raw scraped pages or executable instructions. */
export function quarantineResearchNote(input:ResearchNoteInput) {
  if(!input || typeof input.url!=='string'||input.url.length>1024) throw new Error('invalid source URL');
  const u=new URL(input.url);
  if(!PRIMARY_RESEARCH_ORIGINS.includes(u.origin)||u.username||u.password||u.search||u.hash||u.port
    ||u.protocol!=='https:') throw new Error('source outside exact primary-source allowlist');
  if(typeof input.title!=='string'||!input.title.trim()||input.title.length>200
    ||typeof input.summary!=='string'||!input.summary.trim()||input.summary.length>2500
    ||typeof input.tenantId!=='string'||!/^[a-zA-Z0-9_.:-]{1,128}$/.test(input.tenantId)
    ||typeof input.retrievedAt!=='string'||!Number.isFinite(Date.parse(input.retrievedAt))
    ||new Date(input.retrievedAt).toISOString()!==input.retrievedAt
    ||!['REFERENCE_ONLY','REUSE_REVIEW_REQUIRED'].includes(input.rights)) throw new Error('invalid bounded reference note');
  const body={url:u.href,title:input.title.trim(),summary:input.summary.trim(),tenantId:input.tenantId,
    retrievedAt:input.retrievedAt,rights:input.rights};
  const summarySha256=createHash('sha256').update(JSON.stringify(body)).digest('hex');
  return Object.freeze({...body,summarySha256,
    hashScope:'THIS_SUMMARY_NOT_THE_REMOTE_PAGE',status:'QUARANTINED_REFERENCE',
    trustedInstruction:false,rawPageStored:false,sourceClaimsIndependentlyVerified:false,
    retrievalPromotionAllowed:false,modelWeightMutationAllowed:false,networkRequestsMade:0});
}
