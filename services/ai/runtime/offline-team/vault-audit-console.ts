export type VaultAuditDecision = 'ALLOW' | 'DENY' | 'REVIEW';

export interface VaultAuditEvent {
  eventId: string;
  tenantId: string;
  actorId: string;
  role: string;
  vaultRef: string;
  classification: 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  requestedAction: 'READ' | 'WRITE' | 'ROTATE' | 'DELEGATE';
  evidenceRefs: string[];
  humanApproved: boolean;
}

export function decideVaultAccess(event: VaultAuditEvent): VaultAuditDecision {
  if (!event.tenantId || !event.actorId || !event.vaultRef) return 'DENY';
  if (event.classification === 'TOP_SECRET' && event.role !== 'CEO' && !event.humanApproved) return 'DENY';
  if (event.requestedAction === 'DELEGATE' || event.requestedAction === 'ROTATE') return event.humanApproved ? 'ALLOW' : 'REVIEW';
  return event.classification === 'TOP_SECRET' && !event.humanApproved ? 'REVIEW' : 'ALLOW';
}

export const vaultAuditGuardrails = {
  immutableAuditRequired: true,
  secretValuesInLogsAllowed: false,
  agentDirectTopSecretReadAllowed: false,
  delegatedAccessMustBeRevocable: true,
};
