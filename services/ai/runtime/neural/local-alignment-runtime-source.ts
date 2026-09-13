import type { AlignmentRuntimeSource, RuntimeAlignmentInput } from './alignment-runtime-report';

type LiveState=NonNullable<RuntimeAlignmentInput['liveTrustAudit']>;
type CheckpointState=NonNullable<RuntimeAlignmentInput['acceptedCheckpoint']>;

export function createLocalAlignmentRuntimeSource(input:{tenantId:string;universeId:string;readEvidence:()=>RuntimeAlignmentInput['evidence'];readLiveTrustAudit:()=>LiveState;readAcceptedCheckpoint:()=>CheckpointState}):AlignmentRuntimeSource&{automaticallyActivated:false;productionProviderActivated:false}{
  return{kind:'LOCAL_REFERENCE',automaticallyActivated:false,productionProviderActivated:false,read(){const evidence=input.readEvidence(),liveTrustAudit=input.readLiveTrustAudit(),acceptedCheckpoint=input.readAcceptedCheckpoint();if(liveTrustAudit.tenantId!==input.tenantId||liveTrustAudit.universeId!==input.universeId||acceptedCheckpoint.tenantId!==input.tenantId||acceptedCheckpoint.universeId!==input.universeId)throw new Error('runtime_scope_mismatch');if(evidence.some((item)=>item.context.tenantId!==input.tenantId||item.context.universeId!==input.universeId))throw new Error('evidence_scope_mismatch');return{evidence,liveTrustAudit,acceptedCheckpoint}}};
}
