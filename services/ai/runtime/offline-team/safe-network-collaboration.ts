export type NetworkPeerKind = 'LOCAL_LLM' | 'APPROVED_LLM_API' | 'GITHUB' | 'OPEN_SOURCE_SERVICE' | 'PARTNER_API';
export type NetworkDecision = 'ALLOW_LOCAL' | 'ALLOW_MINIMIZED_EXTERNAL' | 'REVIEW' | 'DENY';

export interface NetworkCollaborationRequest {
  tenantId: string;
  peerKind: NetworkPeerKind;
  dataClass: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  purpose: string;
  consentRef?: string;
  approvalRef?: string;
  minimized: boolean;
}

export function decideNetworkCollaboration(req: NetworkCollaborationRequest): NetworkDecision {
  if (req.dataClass === 'TOP_SECRET' && req.peerKind !== 'LOCAL_LLM') return 'DENY';
  if (req.peerKind === 'LOCAL_LLM') return req.approvalRef ? 'ALLOW_LOCAL' : 'REVIEW';
  if (!req.minimized || !req.consentRef || !req.approvalRef) return 'REVIEW';
  if (req.dataClass === 'CONFIDENTIAL') return 'REVIEW';
  return 'ALLOW_MINIMIZED_EXTERNAL';
}

export const safeNetworkCollaborationPolicy = {
  defaultDeny: true,
  secretsNeverInPrompts: true,
  externalOutputsRequireEvaluation: true,
  partnerStatusMustBeVerifiedBeforePrivateDataExchange: true,
};
