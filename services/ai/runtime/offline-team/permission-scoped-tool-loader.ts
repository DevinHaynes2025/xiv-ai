export interface ToolPermissionReceipt {
  toolId: string;
  tenantId: string;
  userId: string;
  capabilities: string[];
  consentRef: string;
  networkAllowed: boolean;
  classificationCeiling: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
}

export function loadPermittedTools(receipts: ToolPermissionReceipt[]) {
  return receipts.filter(r => r.toolId && r.tenantId && r.userId && r.consentRef && r.capabilities.length > 0);
}

export const TOOL_LOADER_GUARDRAILS = {
  explicitConsentRequired: true,
  topSecretToolRoutingAllowed: false,
  productionAuthorityGrantedByToolReceipt: false,
  tenantIsolationRequired: true,
};
