/**
 * 62L-ES-HC4 — Home Base receipts for every branch execution.
 *
 * Soft-wires HC1 Hybrid Compute Home Base when present.
 * Receipts are mandatory evidence; absence blocks task-graph branch exec.
 */

import { createHash } from 'node:crypto';
import {
  HC4_LOCKS,
  type AcceleratorClass,
  type ChipVendor,
  type HardwareTruthState,
  type Hc4Actor,
  type TenantScope,
} from './types.ts';

export type HomeBaseReceipt = {
  receiptId: string;
  graphId: string;
  nodeId: string;
  branchId: string;
  scope: TenantScope;
  actorId: string;
  vendor: ChipVendor;
  acceleratorClass: AcceleratorClass;
  truthStateClaimed: HardwareTruthState;
  usedFallback: boolean;
  claimedAcceleratorVerified: false | true;
  l4AutonomyEnabled: false;
  autoCloudPurchase: false;
  crossTenantPooling: false;
  siliconModified: false;
  createdAt: string;
  summary: string;
};

export type ReceiptIssueResult =
  | { issued: true; receipt: HomeBaseReceipt }
  | {
      issued: false;
      denied: true;
      state: 'DENIED';
      reason: string;
    };

export type HomeBaseReceiptLedger = {
  issue(input: {
    actor: Hc4Actor;
    graphId: string;
    nodeId: string;
    branchId: string;
    vendor: ChipVendor;
    acceleratorClass: AcceleratorClass;
    truthStateClaimed: HardwareTruthState;
    usedFallback: boolean;
    claimedAcceleratorVerified: boolean;
    summary: string;
  }): ReceiptIssueResult;
  get(receiptId: string): HomeBaseReceipt | null;
  list(scope: TenantScope): readonly HomeBaseReceipt[];
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 20);
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createHomeBaseReceiptLedger(): HomeBaseReceiptLedger {
  const byId = new Map<string, HomeBaseReceipt>();

  return {
    issue(input) {
      if (HC4_LOCKS.L4_AUTONOMY_ENABLED) {
        return {
          issued: false,
          denied: true,
          state: 'DENIED',
          reason: 'L4_AUTONOMY_MUST_REMAIN_FALSE',
        };
      }

      // Honesty: fallback cannot claim accelerator VERIFIED.
      if (
        input.usedFallback &&
        input.claimedAcceleratorVerified &&
        !HC4_LOCKS.FALLBACK_EQ_ACCELERATOR_VERIFIED
      ) {
        return {
          issued: false,
          denied: true,
          state: 'DENIED',
          reason: 'FALLBACK_CANNOT_CLAIM_ACCELERATOR_VERIFIED_ON_RECEIPT',
        };
      }

      const scope: TenantScope = {
        orgId: input.actor.orgId,
        tenantId: input.actor.tenantId,
        universeId: input.actor.universeId,
      };

      const receiptId = `hb-rcpt-${sha256(
        `${input.graphId}:${input.nodeId}:${input.branchId}:${nowIso()}`,
      )}`;

      const receipt: HomeBaseReceipt = {
        receiptId,
        graphId: input.graphId,
        nodeId: input.nodeId,
        branchId: input.branchId,
        scope,
        actorId: input.actor.id,
        vendor: input.vendor,
        acceleratorClass: input.acceleratorClass,
        truthStateClaimed: input.truthStateClaimed,
        usedFallback: input.usedFallback,
        claimedAcceleratorVerified: input.claimedAcceleratorVerified
          ? true
          : false,
        l4AutonomyEnabled: false,
        autoCloudPurchase: false,
        crossTenantPooling: false,
        siliconModified: false,
        createdAt: nowIso(),
        summary: input.summary,
      };
      byId.set(receiptId, receipt);
      return { issued: true, receipt };
    },

    get(receiptId) {
      return byId.get(receiptId) ?? null;
    },

    list(scope) {
      return [...byId.values()].filter(
        (r) =>
          r.scope.orgId === scope.orgId &&
          r.scope.tenantId === scope.tenantId &&
          r.scope.universeId === scope.universeId,
      );
    },
  };
}
