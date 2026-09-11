export type LedgerKind = 'INVOICE' | 'PAYMENT_RECEIVED' | 'CREDIT' | 'REFUND_RECORDED' | 'USAGE_CHARGE';

export interface BillingLedgerEntry {
  id: string;
  tenantId: string;
  developerId?: string;
  kind: LedgerKind;
  amountCents: number;
  currency: string;
  evidenceRefs: string[];
  approved: boolean;
  createdAt: string;
}

export function validateLedgerEntry(entry: BillingLedgerEntry): boolean {
  return Number.isInteger(entry.amountCents) && entry.amountCents >= 0 && entry.currency.length === 3 && entry.evidenceRefs.length > 0;
}

export function verifiedCollectedRevenue(entries: BillingLedgerEntry[]): number {
  return entries
    .filter((e) => e.kind === 'PAYMENT_RECEIVED' && e.approved && validateLedgerEntry(e))
    .reduce((sum, e) => sum + e.amountCents, 0);
}

export const vaultLedgerPolicy = {
  evidenceBackedAccountingOnly: true,
  canMoveMoney: false,
  canOpenAccounts: false,
  canSignContracts: false,
  topSecretValuesInLogsAllowed: false,
  humanApprovalForRefundsAndAdjustments: true,
};
