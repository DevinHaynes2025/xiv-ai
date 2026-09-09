/**
 * 62L-DO Adaptive Offline/Cloud Workload Brain —
 * Local-first; unconfigured cloud → UNAVAILABLE; offline fallback does not
 * invent live cloud availability.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DO_LOCKS,
  HONESTY_BANNER,
  MAX_WORKLOAD_PLANS,
  OFFLINE_NO_INVENTED_CLOUD,
  type DoActor,
} from './distributed-cognitive-runtime-plugin-mesh-types';

export type WorkloadPlan = {
  id: string;
  taskId: string;
  preferLocal: true;
  cloudConfigured: boolean;
  requestedTarget: 'local' | 'cloud' | 'hybrid';
  resolvedTarget: 'local' | 'UNAVAILABLE';
  status: 'planned' | 'denied';
  reason: string;
  createdAt: string;
};

type Store = {
  plans: WorkloadPlan[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'adaptive-offline-cloud-workload-brain.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { plans: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function adaptiveOfflineCloudWorkloadBrainHonesty() {
  return {
    banner: HONESTY_BANNER,
    localFirst: DO_LOCKS.LOCAL_FIRST,
    unconfiguredCloudUnavailable: DO_LOCKS.UNCONFIGURED_CLOUD_UNAVAILABLE,
    offlineInventsCloud: DO_LOCKS.OFFLINE_FALLBACK_INVENTS_CLOUD_AVAILABILITY,
  };
}

export async function planWorkload(input: {
  taskId: string;
  requestedTarget: 'local' | 'cloud' | 'hybrid';
  cloudConfigured?: boolean;
  root: string;
  actor: DoActor;
}): Promise<WorkloadPlan> {
  const store = await load(input.root);
  void input.actor;
  if (store.plans.length >= MAX_WORKLOAD_PLANS) {
    throw new Error('MAX_WORKLOAD_PLANS_REACHED');
  }

  const cloudConfigured = input.cloudConfigured === true;
  const wantsCloud =
    input.requestedTarget === 'cloud' || input.requestedTarget === 'hybrid';

  if (wantsCloud && !cloudConfigured) {
    const denied: WorkloadPlan = {
      id: id('dowork'),
      taskId: input.taskId,
      preferLocal: true,
      cloudConfigured: false,
      requestedTarget: input.requestedTarget,
      resolvedTarget: 'UNAVAILABLE',
      status: 'denied',
      reason: OFFLINE_NO_INVENTED_CLOUD,
      createdAt: new Date().toISOString(),
    };
    store.plans.push(denied);
    await save(input.root, store);
    return denied;
  }

  const plan: WorkloadPlan = {
    id: id('dowork'),
    taskId: input.taskId,
    preferLocal: true,
    cloudConfigured,
    requestedTarget: input.requestedTarget,
    resolvedTarget: 'local',
    status: 'planned',
    reason: cloudConfigured
      ? 'WORKLOAD_LOCAL_FIRST_CLOUD_CONFIGURED_BUT_LOCAL_PREFERRED'
      : 'WORKLOAD_LOCAL_FIRST',
    createdAt: new Date().toISOString(),
  };
  store.plans.push(plan);
  await save(input.root, store);
  return plan;
}
