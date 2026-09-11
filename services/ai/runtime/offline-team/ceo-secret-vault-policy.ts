export type SecretClassification = 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
export type VaultRole = 'CEO' | 'DELEGATE' | 'AUDITOR' | 'AGENT';

export interface VaultAccessRequest {
  tenantId: string;
  secretId: string;
  classification: SecretClassification;
  requesterRole: VaultRole;
  delegatedByCeo: boolean;
  purpose: string;
  humanApproved: boolean;
}

export function canAccessVaultSecret(req: VaultAccessRequest): boolean {
  if (!req.tenantId || !req.secretId || !req.purpose) return false;
  if (req.classification === 'TOP_SECRET') {
    return req.requesterRole === 'CEO' || (req.requesterRole === 'DELEGATE' && req.delegatedByCeo && req.humanApproved);
  }
  if (req.requesterRole === 'AGENT') return false;
  return req.requesterRole === 'CEO' || req.delegatedByCeo;
}

export const VAULT_GUARDRAILS = {
  plaintextSecretLoggingAllowed: false,
  topSecretEmbeddingAllowed: false,
  topSecretExternalPluginAllowed: false,
  agentDirectTopSecretAccessAllowed: false,
  ceoCanDelegateWithAuditReceipt: true,
} as const;
