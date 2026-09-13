type LiveTrustAuditState={tenantId:string;universeId:string;storeVersion:number;eventCount:number;chainHead:string|null;auditComplete:boolean};
type AcceptedCheckpointState={tenantId:string;universeId:string;configured:boolean;storeVersion:number|null;eventCount:number;chainHead:string|null};

const result=(state:'VERIFIED'|'FRESH_CHECKPOINT_REQUIRED'|'REVIEW_REQUIRED'|'QUARANTINED',reason:string|null)=>({state,reason,alignmentEvidenceUsable:state==='VERIFIED',freshCheckpointRequired:state==='FRESH_CHECKPOINT_REQUIRED',quarantineRequired:state==='QUARANTINED',trustStoreModified:false as const,checkpointModified:false as const,productionWritePerformed:false as const,providerActivated:false as const});

export function reconcileAlignmentCheckpoint(live:LiveTrustAuditState,accepted:AcceptedCheckpointState){
  if(live.tenantId!==accepted.tenantId||live.universeId!==accepted.universeId)return result('QUARANTINED','scope_mismatch');
  if(!live.auditComplete||live.eventCount<1||!live.chainHead)return result('QUARANTINED','live_audit_incomplete');
  if(!accepted.configured)return result('REVIEW_REQUIRED','accepted_checkpoint_missing');
  if(accepted.storeVersion===null||accepted.eventCount<1||!accepted.chainHead)return result('QUARANTINED','checkpoint_state_invalid');
  if(live.storeVersion<accepted.storeVersion||live.eventCount<accepted.eventCount)return result('QUARANTINED','trust_state_regressed');
  if(live.storeVersion===accepted.storeVersion&&live.eventCount===accepted.eventCount)return live.chainHead===accepted.chainHead?result('VERIFIED',null):result('QUARANTINED','chain_head_mismatch');
  if(live.storeVersion===accepted.storeVersion||live.eventCount===accepted.eventCount)return result('QUARANTINED','non_monotonic_audit_state');
  return result('FRESH_CHECKPOINT_REQUIRED','trust_state_advanced');
}
