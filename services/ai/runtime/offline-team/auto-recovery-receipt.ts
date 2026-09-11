import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';

export type RecoveryReceipt = {
  tenantId: string;
  jobId: string;
  outcome: 'RESUMED' | 'RETRIED' | 'PAUSED_REVIEW' | 'ABORTED';
  checkpointId?: string;
  observedAt: string;
  evidenceRefs: string[];
  humanApprovalRequired: boolean;
  hash: string;
};

export async function writeRecoveryReceipt(input: Omit<RecoveryReceipt, 'hash'>): Promise<RecoveryReceipt> {
  const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const receipt: RecoveryReceipt = { ...input, hash };
  const file = resolve(process.cwd(), '.xiv-runtime', 'receipts', 'recovery', `${input.jobId}.json`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(receipt, null, 2), 'utf8');
  return receipt;
}

export const recoveryReceiptPolicy = {
  checkpointPreferred: true,
  evidenceRequired: true,
  automaticProductionMutationAllowed: false,
  humanReviewAfterRetryExhaustion: true,
};
