export type DataClass='PUBLIC'|'INTERNAL'|'CONFIDENTIAL'|'TOP_SECRET';
export interface PrivateDataRecord { id:string; tenantId:string; classification:DataClass; sourceRef:string; contentHash:string; indexed:boolean; derived:boolean; }
export function canIndex(record:PrivateDataRecord){ return record.classification!=='TOP_SECRET' && !!record.sourceRef && !!record.contentHash; }
export function assertTenant(record:PrivateDataRecord, tenantId:string){ if(record.tenantId!==tenantId) throw new Error('cross-tenant access blocked'); }
export const PRIVATE_DATA_GUARDRAILS=Object.freeze({topSecretEmbedding:false,crossTenantQuery:false,rawSecretStorage:false,provenanceRequired:true});
