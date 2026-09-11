export type FinancialCapability = 'READ_BALANCES' | 'READ_TRANSACTIONS' | 'BOOKKEEPING' | 'REPORTING' | 'PAYMENT_DRAFT';

export interface FinancialConnectionPolicy {
  tenantId: string;
  userId: string;
  provider: string;
  connectionStatus: 'TARGET' | 'SUPPORTED_API' | 'USER_AUTHORIZED' | 'REVOKED';
  capabilities: FinancialCapability[];
  consentReceiptId?: string;
  humanApprovalRequired: boolean;
}

export function canReadFinancialData(policy: FinancialConnectionPolicy): boolean {
  return policy.connectionStatus === 'USER_AUTHORIZED' && !!policy.consentReceiptId;
}

export const FINANCIAL_VAULT_GUARDRAILS = {
  unrestrictedBankAccessAllowed: false,
  autonomousMoneyMovementAllowed: false,
  openAccountsAllowed: false,
  signContractsAllowed: false,
  paymentExecutionAllowed: false,
  evidenceBackedBookkeepingOnly: true,
  humanApprovalRequiredForConsequentialActions: true,
};
