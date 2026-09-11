import type { BookkeepingEntry } from './bookkeeping-ops';
import type { UsageEvent } from './usage-analytics-ledger';

export interface UsageMaterializedView {
  tenantId: string;
  measuredAt: string;
  views: number;
  uniqueUsers: number;
  sessions: number;
  featureUses: number;
  viewsBySurface: Record<string, number>;
  usesByFeature: Record<string, number>;
}

export interface AccountBalanceView {
  account: string;
  debitCents: number;
  creditCents: number;
  netCents: number;
  evidenceRefs: string[];
}

export interface BookkeepingMaterializedView {
  tenantId: string;
  measuredAt: string;
  approvedEntries: number;
  pendingApprovalEntries: number;
  approvedDebitCents: number;
  approvedCreditCents: number;
  accounts: AccountBalanceView[];
}

function increment(target: Record<string, number>, key?: string) {
  if (!key) return;
  target[key] = (target[key] ?? 0) + 1;
}

export function buildUsageMaterializedView(tenantId: string, events: UsageEvent[]): UsageMaterializedView {
  const rows = events.filter(event => event.tenantId === tenantId);
  const viewsBySurface: Record<string, number> = {};
  const usesByFeature: Record<string, number> = {};

  for (const event of rows) {
    if (event.type === 'VIEW') increment(viewsBySurface, event.surface ?? 'UNKNOWN');
    if (event.type === 'FEATURE_USE') increment(usesByFeature, event.feature ?? 'UNKNOWN');
  }

  return {
    tenantId,
    measuredAt: new Date().toISOString(),
    views: rows.filter(event => event.type === 'VIEW').length,
    uniqueUsers: new Set(rows.map(event => event.actorHash)).size,
    sessions: rows.filter(event => event.type === 'SESSION_START').length,
    featureUses: rows.filter(event => event.type === 'FEATURE_USE').length,
    viewsBySurface,
    usesByFeature,
  };
}

export function buildBookkeepingMaterializedView(tenantId: string, entries: BookkeepingEntry[]): BookkeepingMaterializedView {
  const rows = entries.filter(entry => entry.tenantId === tenantId);
  const approved = rows.filter(entry => entry.approved && !!entry.evidenceRef);
  const pendingApprovalEntries = rows.length - approved.length;
  const accountMap = new Map<string, AccountBalanceView>();

  for (const entry of approved) {
    const account = accountMap.get(entry.account) ?? {
      account: entry.account,
      debitCents: 0,
      creditCents: 0,
      netCents: 0,
      evidenceRefs: [],
    };
    if (entry.side === 'DEBIT') account.debitCents += entry.amountCents;
    else account.creditCents += entry.amountCents;
    account.netCents = account.debitCents - account.creditCents;
    if (!account.evidenceRefs.includes(entry.evidenceRef)) account.evidenceRefs.push(entry.evidenceRef);
    accountMap.set(entry.account, account);
  }

  return {
    tenantId,
    measuredAt: new Date().toISOString(),
    approvedEntries: approved.length,
    pendingApprovalEntries,
    approvedDebitCents: approved.filter(entry => entry.side === 'DEBIT').reduce((sum, entry) => sum + entry.amountCents, 0),
    approvedCreditCents: approved.filter(entry => entry.side === 'CREDIT').reduce((sum, entry) => sum + entry.amountCents, 0),
    accounts: [...accountMap.values()].sort((a, b) => a.account.localeCompare(b.account)),
  };
}

export const OPERATIONS_VIEW_GUARDRAILS = {
  usageCountsMustComeFromMeasuredEvents: true,
  bookkeepingRequiresEvidence: true,
  unapprovedBookkeepingExcludedFromApprovedTotals: true,
  canMoveMoney: false,
  canOpenAccounts: false,
  canSignContracts: false,
};
