/**
 * Future AWS / Redis / cloud-task queue adapters — stay NOT_CONFIGURED.
 * Never fabricate LIVE / 24/7.
 */

import type { AdapterLifecycle, AgentMissionQueueAdapterKind } from './types';
import type { AgentMissionQueue } from './queue';

export type UnconfiguredQueueAdapter = {
  kind: AgentMissionQueueAdapterKind;
  lifecycle: 'NOT_CONFIGURED';
  productionLive: false;
  runs247: false;
  reason: string;
};

export function awsTaskQueueAdapter(): UnconfiguredQueueAdapter {
  return {
    kind: 'AWS_TASK',
    lifecycle: 'NOT_CONFIGURED',
    productionLive: false,
    runs247: false,
    reason: 'aws_task_adapter_not_configured',
  };
}

export function redisQueueAdapter(): UnconfiguredQueueAdapter {
  return {
    kind: 'REDIS_QUEUE',
    lifecycle: 'NOT_CONFIGURED',
    productionLive: false,
    runs247: false,
    reason: 'redis_queue_adapter_not_configured',
  };
}

export function cloudTaskQueueAdapter(): UnconfiguredQueueAdapter {
  return {
    kind: 'CLOUD_TASK',
    lifecycle: 'NOT_CONFIGURED',
    productionLive: false,
    runs247: false,
    reason: 'cloud_task_adapter_not_configured',
  };
}

export function queueAdapterLifecycle(kind: AgentMissionQueueAdapterKind): AdapterLifecycle {
  if (kind === 'DB_BACKED') return 'CONFIGURED';
  return 'NOT_CONFIGURED';
}

export function resolveQueueAdapter(kind: AgentMissionQueueAdapterKind): {
  lifecycle: AdapterLifecycle;
  queue: AgentMissionQueue | null;
  productionLive: false;
  runs247: false;
} {
  if (kind === 'DB_BACKED') {
    return { lifecycle: 'CONFIGURED', queue: null, productionLive: false, runs247: false };
  }
  return { lifecycle: 'NOT_CONFIGURED', queue: null, productionLive: false, runs247: false };
}

export function cloudWorkforceRuns247Live(): false {
  return false;
}

export function architectureExistsMeans247Live(): false {
  return false;
}
