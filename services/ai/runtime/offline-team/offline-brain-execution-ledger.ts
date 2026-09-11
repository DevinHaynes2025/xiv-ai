import { createHash } from 'node:crypto';
import type { BrainAgentRole, BrainSecurityClass, OfflineBrainCouncilPlan } from './offline-brain-agent-council';

export interface AgentExecutionReceipt {
  receiptId: string;
  missionId: string;
  tenantId: string;
  role: BrainAgentRole;
  securityClass: BrainSecurityClass;
  outputHash: string;
  evidenceRefs: readonly string[];
  localExecution: boolean;
  createdAt: string;
}

export interface ExecutionLedgerEntry {
  sequence: number;
  previousHash: string;
  entryHash: string;
  receipt: AgentExecutionReceipt;
}

export interface CouncilExecutionSummary {
  missionId: string;
  tenantId: string;
  complete: boolean;
  enabledSeatCount: number;
  receiptCount: number;
  missingRoles: readonly BrainAgentRole[];
  productionMutationAllowed: false;
  rawOutputsPersisted: false;
}

export const OFFLINE_BRAIN_EXECUTION_GUARDRAILS = {
  appendOnly: true,
  rawOutputsPersisted: false,
  crossTenantReceiptsAllowed: false,
  topSecretExternalExecutionAllowed: false,
  productionMutationAllowed: false,
  autonomousDeployAllowed: false,
} as const;

function canonicalReceipt(receipt: AgentExecutionReceipt): string {
  return JSON.stringify({
    receiptId: receipt.receiptId,
    missionId: receipt.missionId,
    tenantId: receipt.tenantId,
    role: receipt.role,
    securityClass: receipt.securityClass,
    outputHash: receipt.outputHash,
    evidenceRefs: [...receipt.evidenceRefs],
    localExecution: receipt.localExecution,
    createdAt: receipt.createdAt,
  });
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export class OfflineBrainExecutionLedger {
  private readonly tenantId: string;
  private readonly missionId: string;
  private readonly entries: ExecutionLedgerEntry[] = [];

  constructor(input: { tenantId: string; missionId: string }) {
    if (!input.tenantId || !input.missionId) throw new Error('ledger identity required');
    this.tenantId = input.tenantId;
    this.missionId = input.missionId;
  }

  append(receipt: AgentExecutionReceipt): ExecutionLedgerEntry {
    if (receipt.tenantId !== this.tenantId) throw new Error('cross-tenant execution receipt rejected');
    if (receipt.missionId !== this.missionId) throw new Error('cross-mission execution receipt rejected');
    if (!receipt.receiptId || !receipt.outputHash || receipt.evidenceRefs.length === 0) throw new Error('receipt evidence required');
    if ((receipt.role === 'ILM_REVIEWER' || receipt.role === 'CLAUDE_REVIEWER') && receipt.securityClass === 'TOP_SECRET') {
      throw new Error('TOP_SECRET external reviewer receipt rejected');
    }
    if (receipt.role !== 'ILM_REVIEWER' && receipt.role !== 'CLAUDE_REVIEWER' && !receipt.localExecution) {
      throw new Error('local council role must execute locally');
    }

    const previousHash = this.entries.at(-1)?.entryHash ?? 'GENESIS';
    const sequence = this.entries.length + 1;
    const entryHash = digest(`${sequence}|${previousHash}|${canonicalReceipt(receipt)}`);
    const entry = Object.freeze({ sequence, previousHash, entryHash, receipt: Object.freeze({ ...receipt, evidenceRefs: Object.freeze([...receipt.evidenceRefs]) }) });
    this.entries.push(entry);
    return entry;
  }

  snapshot(): readonly ExecutionLedgerEntry[] {
    return Object.freeze([...this.entries]);
  }

  verify(): boolean {
    let previousHash = 'GENESIS';
    for (let index = 0; index < this.entries.length; index += 1) {
      const entry = this.entries[index];
      const expectedSequence = index + 1;
      const expectedHash = digest(`${expectedSequence}|${previousHash}|${canonicalReceipt(entry.receipt)}`);
      if (entry.sequence !== expectedSequence || entry.previousHash !== previousHash || entry.entryHash !== expectedHash) return false;
      previousHash = entry.entryHash;
    }
    return true;
  }
}

export function summarizeCouncilExecution(plan: OfflineBrainCouncilPlan, receipts: readonly AgentExecutionReceipt[]): CouncilExecutionSummary {
  const enabledRoles = plan.seats.filter((seat) => seat.enabled).map((seat) => seat.role);
  const receiptRoles = new Set(receipts.filter((receipt) => receipt.tenantId === plan.tenantId && receipt.missionId === plan.missionId).map((receipt) => receipt.role));
  const missingRoles = enabledRoles.filter((role) => !receiptRoles.has(role));
  return Object.freeze({
    missionId: plan.missionId,
    tenantId: plan.tenantId,
    complete: missingRoles.length === 0,
    enabledSeatCount: enabledRoles.length,
    receiptCount: receipts.length,
    missingRoles: Object.freeze(missingRoles),
    productionMutationAllowed: false,
    rawOutputsPersisted: false,
  });
}
