import { reconcileAlignmentCheckpoint } from './alignment-checkpoint-reconciliation';
import { buildAuthenticatedAlignmentReport, type AuthenticatedAlignmentEvidence } from './authenticated-alignment-report';

type LiveState={tenantId:string;universeId:string;storeVersion:number;eventCount:number;chainHead:string|null;auditComplete:boolean};
type CheckpointState={tenantId:string;universeId:string;configured:boolean;storeVersion:number|null;eventCount:number;chainHead:string|null};

export function buildReconciledAlignmentReport(input:{evidence:readonly AuthenticatedAlignmentEvidence[];liveTrustAudit?:LiveState;acceptedCheckpoint?:CheckpointState}){
  if(!input.liveTrustAudit&&!input.acceptedCheckpoint)return buildAuthenticatedAlignmentReport(input.evidence);
  if(!input.liveTrustAudit||!input.acceptedCheckpoint)return buildAuthenticatedAlignmentReport(input.evidence,{reconciliationState:'REVIEW_REQUIRED',alignmentEvidenceUsable:false});
  const reconciliation=reconcileAlignmentCheckpoint(input.liveTrustAudit,input.acceptedCheckpoint);
  return buildAuthenticatedAlignmentReport(input.evidence,{reconciliationState:reconciliation.state,alignmentEvidenceUsable:reconciliation.alignmentEvidenceUsable});
}
