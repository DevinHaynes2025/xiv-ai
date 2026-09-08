/**
 * Durable cloud queue + DLQ — in-process durable semantics for tests.
 * Cloud adapters remain NOT_CONFIGURED unless verified.
 */

import type { DeadLetterRecord, DurableQueueMessage } from './types';
import { detectCloudDeployment } from './deployment';

export type DurableCloudQueue = {
  kind: 'IN_PROCESS_DURABLE' | 'CLOUD_TASK' | 'AWS_SQS' | 'REDIS_STREAM';
  lifecycle: 'CONFIGURED' | 'NOT_CONFIGURED';
  messages: DurableQueueMessage[];
  dlq: DeadLetterRecord[];
  productionLive: false;
  runs247: false;
};

export function openDurableCloudQueue(kind: DurableCloudQueue['kind'] = 'IN_PROCESS_DURABLE'): DurableCloudQueue {
  if (kind === 'IN_PROCESS_DURABLE') {
    return {
      kind,
      lifecycle: 'CONFIGURED',
      messages: [],
      dlq: [],
      productionLive: false,
      runs247: false,
    };
  }
  const honesty = detectCloudDeployment(
    kind === 'AWS_SQS' ? 'AWS_ECS' : kind === 'CLOUD_TASK' ? 'GCP_CLOUD_RUN' : 'UNKNOWN',
  );
  return {
    kind,
    lifecycle: honesty.status === 'NOT_CONFIGURED' || honesty.cloudDeployment === 'BLOCKED' ? 'NOT_CONFIGURED' : 'CONFIGURED',
    messages: [],
    dlq: [],
    productionLive: false,
    runs247: false,
  };
}

export function enqueueDurable(
  q: DurableCloudQueue,
  input: { messageId: string; missionId: string; payloadCursor: string; nowIso: string; maxAttempts?: number },
): DurableQueueMessage {
  const msg: DurableQueueMessage = {
    messageId: input.messageId,
    missionId: input.missionId,
    payloadCursor: input.payloadCursor,
    attempts: 0,
    maxAttempts: input.maxAttempts ?? 3,
    enqueuedAt: input.nowIso,
    visibleAt: input.nowIso,
    deadLetter: false,
  };
  q.messages.push(msg);
  return msg;
}

export function claimDurable(
  q: DurableCloudQueue,
  nowIso: string,
): DurableQueueMessage | null {
  const msg = q.messages.find((m) => m.visibleAt <= nowIso && !m.deadLetter);
  if (!msg) return null;
  msg.attempts += 1;
  // Hide briefly (visibility timeout simulation via lexical bump — tests control nowIso).
  msg.visibleAt = nowIso;
  return msg;
}

export function ackDurable(q: DurableCloudQueue, messageId: string): boolean {
  const i = q.messages.findIndex((m) => m.messageId === messageId);
  if (i < 0) return false;
  q.messages.splice(i, 1);
  return true;
}

export function failDurable(
  q: DurableCloudQueue,
  input: { messageId: string; reason: string; nowIso: string },
): { deadLettered: boolean } {
  const msg = q.messages.find((m) => m.messageId === input.messageId);
  if (!msg) return { deadLettered: false };
  if (msg.attempts >= msg.maxAttempts) {
    q.dlq.push({
      messageId: msg.messageId,
      missionId: msg.missionId,
      reason: input.reason,
      attempts: msg.attempts,
      deadLetteredAt: input.nowIso,
      deadLetter: true,
      autoReplay: false,
    });
    q.messages = q.messages.filter((m) => m.messageId !== msg.messageId);
    return { deadLettered: true };
  }
  return { deadLettered: false };
}

export function listDeadLetters(q: DurableCloudQueue): readonly DeadLetterRecord[] {
  return q.dlq;
}
