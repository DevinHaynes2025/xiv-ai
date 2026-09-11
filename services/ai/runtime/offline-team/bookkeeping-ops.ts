export type LedgerSide = 'DEBIT' | 'CREDIT';
export interface BookkeepingEntry {
  entryId: string;
  tenantId: string;
  account: string;
  amountCents: number;
  currency: string;
  side: LedgerSide;
  occurredAt: string;
  evidenceRef: string;
  approved: boolean;
}

export class BookkeepingOps {
  private entries: BookkeepingEntry[] = [];

  post(entry: BookkeepingEntry) {
    if (!entry.tenantId || !entry.account || !entry.evidenceRef) throw new Error('tenant/account/evidence required');
    if (!Number.isInteger(entry.amountCents) || entry.amountCents < 0) throw new Error('amount must be nonnegative integer cents');
    if (!entry.approved) throw new Error('bookkeeping entry requires approval');
    this.entries.push(entry);
  }

  balance(tenantId: string, account: string) {
    return this.entries.filter(e => e.tenantId === tenantId && e.account === account)
      .reduce((sum, e) => sum + (e.side === 'DEBIT' ? e.amountCents : -e.amountCents), 0);
  }
}

export const BOOKKEEPING_GUARDRAILS = {
  canMoveMoney: false,
  canOpenAccounts: false,
  canSignContracts: false,
  humanApprovalRequired: true,
};
