export type ContractState = 'DRAFT' | 'LEGAL_REVIEW' | 'SIGNED' | 'SUSPENDED' | 'TERMINATED';
export type PaymentState = 'NOT_DUE' | 'INVOICED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'REFUNDED';

export interface DeveloperCommercialStatus {
  developerId: string;
  tenantId: string;
  contractState: ContractState;
  contractReceiptRef?: string;
  invoiceRefs: string[];
  paymentReceiptRefs: string[];
  paymentState: PaymentState;
  collectedAmountMinor: number;
  currency: string;
}

export function commercialAccessAllowed(status: DeveloperCommercialStatus): boolean {
  return status.contractState === 'SIGNED'
    && Boolean(status.contractReceiptRef)
    && status.paymentState !== 'OVERDUE'
    && status.collectedAmountMinor >= 0;
}

export const COMPANY_VAULT_LEDGER_POLICY = {
  recordsEvidenceBackedAmountsOnly: true,
  canMoveMoney: false,
  canOpenAccounts: false,
  canSignContracts: false,
  paymentProcessorReceiptRequiredForPaidState: true,
} as const;
