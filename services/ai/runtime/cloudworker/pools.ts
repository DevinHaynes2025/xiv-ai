/**
 * Worker pools — architecturally separable; may share infra initially.
 * Horizontal scale foundation only — autoScaleLive = false.
 */

import type { SpecialtyWorkerRole, WorkerPool } from './types';

export const WORKER_POOL_IDS = [
  'EngineeringWorkerPool',
  'ResearchWorkerPool',
  'QAWorkerPool',
  'SecurityWorkerPool',
  'DatabaseWorkerPool',
  'KnowledgeWorkerPool',
] as const;

export type WorkerPoolId = (typeof WORKER_POOL_IDS)[number] | (string & {});

const DEFAULT_POOL_ROLES: Record<(typeof WORKER_POOL_IDS)[number], readonly SpecialtyWorkerRole[]> = {
  EngineeringWorkerPool: ['ENGINEERING'],
  ResearchWorkerPool: ['RESEARCH'],
  QAWorkerPool: ['QA'],
  SecurityWorkerPool: ['SECURITY'],
  DatabaseWorkerPool: ['DATABASE'],
  KnowledgeWorkerPool: ['KNOWLEDGE'],
};

export function openWorkerPool(input: {
  poolId: string;
  roles?: readonly SpecialtyWorkerRole[];
  desiredSize?: number;
  currentSize?: number;
  maxSize?: number;
}): WorkerPool {
  const named = input.poolId as (typeof WORKER_POOL_IDS)[number];
  const roles =
    input.roles ??
    (named in DEFAULT_POOL_ROLES ? DEFAULT_POOL_ROLES[named] : (['KNOWLEDGE'] as const));
  return {
    poolId: input.poolId,
    roles,
    desiredSize: input.desiredSize ?? 1,
    currentSize: input.currentSize ?? 0,
    maxSize: input.maxSize ?? 4,
    horizontalScaleEnabled: true,
    autoScaleLive: false,
    defaultPermissions: 'NONE',
    l4Enabled: false,
  };
}

export function listWorkerPools(): readonly WorkerPool[] {
  return WORKER_POOL_IDS.map((poolId) => openWorkerPool({ poolId }));
}

export function poolForRole(role: SpecialtyWorkerRole): string {
  const entry = (Object.entries(DEFAULT_POOL_ROLES) as [string, readonly SpecialtyWorkerRole[]][]).find(
    ([, roles]) => roles.includes(role),
  );
  return entry?.[0] ?? 'KnowledgeWorkerPool';
}

export function markPoolWorkerStarted(pool: WorkerPool): WorkerPool {
  return {
    ...pool,
    currentSize: Math.min(pool.maxSize, pool.currentSize + 1),
    autoScaleLive: false,
  };
}

export function scalePool(
  pool: WorkerPool,
  desired: number,
): { ok: true; pool: WorkerPool } | { ok: false; reason: string; pool: WorkerPool } {
  if (desired < 0) return { ok: false, reason: 'desired_negative', pool };
  if (desired > pool.maxSize) return { ok: false, reason: 'desired_above_max', pool };
  return {
    ok: true,
    pool: {
      ...pool,
      desiredSize: desired,
      autoScaleLive: false,
    },
  };
}

export function poolAutoScaleIsLive(pool: WorkerPool): false {
  return pool.autoScaleLive;
}
