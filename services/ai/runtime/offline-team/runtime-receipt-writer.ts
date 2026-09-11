import { writeRuntimeJson } from './runtime-disk-writer';
import type { LocalHealthReceipt } from './local-health-endpoint';

export interface RuntimeReceipt {
  tenantId: string;
  branch: string;
  commit?: string;
  health: LocalHealthReceipt;
  evidenceRefs: string[];
  verifiedAt: string;
}

export async function writeRuntimeReceipt(receipt: RuntimeReceipt): Promise<string> {
  return writeRuntimeJson('receipts/runtime-health.json', {
    tenantId: receipt.tenantId,
    classification: 'CONFIDENTIAL',
    createdAt: receipt.verifiedAt,
    payload: receipt,
  });
}

export const receiptPolicy = {
  staleAfterMinutes: 15,
  healthyRequiresFreshReceipt: true,
  detectedIsNotVerified: true,
  supportedIsNotOptimized: true,
};
