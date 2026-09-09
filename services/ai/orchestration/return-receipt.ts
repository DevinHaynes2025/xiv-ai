/**
 * Home Base return receipts — every completed local branch must return evidence.
 */

import { createHash } from 'node:crypto';
import {
  GOB_LOCKS,
  type AgentReturnPayload,
  type TenantScope,
} from './types.ts';

export type ReturnReceipt = {
  receiptId: string;
  agentId: string;
  missionId: string;
  taskId: string;
  tenantId: string;
  homeUniverseId: string;
  returnPath: string;
  payload: AgentReturnPayload;
  offlineMode: boolean;
  l4AutonomyEnabled: false;
  hiddenCotPersisted: false;
  createdAt: string;
  hash: string;
};

export type ReturnReceiptLedger = {
  submit(input: {
    agentId: string;
    missionId: string;
    taskId: string;
    scope: TenantScope;
    returnPath: string;
    payload: AgentReturnPayload;
    offlineMode: boolean;
  }):
    | { accepted: true; receipt: ReturnReceipt }
    | { accepted: false; denied: true; reason: string };
  get(receiptId: string, scope: TenantScope): ReturnReceipt | null;
  list(scope: TenantScope): readonly ReturnReceipt[];
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function createReturnReceiptLedger(): ReturnReceiptLedger {
  const byId = new Map<string, ReturnReceipt>();

  return {
    submit(input) {
      if (GOB_LOCKS.L4_AUTONOMY_ENABLED) {
        return {
          accepted: false,
          denied: true,
          reason: 'L4_AUTONOMY_MUST_BE_FALSE',
        };
      }
      if (GOB_LOCKS.HIDDEN_COT_PERSISTENCE) {
        return {
          accepted: false,
          denied: true,
          reason: 'HIDDEN_COT_LOCK_VIOLATION',
        };
      }
      // Structural check: payload must not smuggle CoT keys.
      const raw = JSON.stringify(input.payload);
      if (
        raw.includes('"hiddenCot"') ||
        raw.includes('"chainOfThought"') ||
        raw.includes('"privateCoT"')
      ) {
        return {
          accepted: false,
          denied: true,
          reason: 'HIDDEN_COT_IN_PAYLOAD_FORBIDDEN',
        };
      }

      const createdAt = new Date().toISOString();
      const body = JSON.stringify({
        agentId: input.agentId,
        missionId: input.missionId,
        taskId: input.taskId,
        tenantId: input.scope.tenantId,
        universeId: input.scope.universeId,
        payload: input.payload,
        createdAt,
      });
      const hash = sha256(body);
      const receipt: ReturnReceipt = {
        receiptId: `rcpt-${hash.slice(0, 20)}`,
        agentId: input.agentId,
        missionId: input.missionId,
        taskId: input.taskId,
        tenantId: input.scope.tenantId,
        homeUniverseId: input.scope.universeId,
        returnPath: input.returnPath,
        payload: input.payload,
        offlineMode: input.offlineMode,
        l4AutonomyEnabled: false,
        hiddenCotPersisted: false,
        createdAt,
        hash,
      };
      byId.set(receipt.receiptId, receipt);
      return { accepted: true, receipt };
    },

    get(receiptId, scope) {
      const r = byId.get(receiptId);
      if (!r) return null;
      if (
        r.tenantId !== scope.tenantId ||
        r.homeUniverseId !== scope.universeId
      ) {
        return null;
      }
      return r;
    },

    list(scope) {
      return [...byId.values()].filter(
        (r) =>
          r.tenantId === scope.tenantId &&
          r.homeUniverseId === scope.universeId,
      );
    },
  };
}
