/**
 * Resumable mission checkpoints — progress, steps, context/memory/repo/db refs.
 * Checkpoints never transfer authority.
 */

import { createHash } from 'node:crypto';
import type { AgentCheckpoint } from './types';

function signCheckpoint(parts: readonly string[]): string {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);
}

export function createCheckpoint(input: {
  checkpointId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  workerId: string;
  progressCursor: string;
  completedSteps?: readonly string[];
  pendingSteps?: readonly string[];
  contextRefs?: readonly string[];
  memoryRefs?: readonly string[];
  repoStateRef?: string | null;
  dbStateRef?: string | null;
  lastHeartbeatAt: string;
  attemptCount: number;
  createdAt: string;
}): AgentCheckpoint {
  const completedSteps = input.completedSteps ?? [];
  const pendingSteps = input.pendingSteps ?? [];
  const contextRefs = input.contextRefs ?? [];
  const memoryRefs = input.memoryRefs ?? [];
  const repoStateRef = input.repoStateRef ?? null;
  const dbStateRef = input.dbStateRef ?? null;
  const signature = signCheckpoint([
    input.checkpointId,
    input.missionId,
    input.tenantId,
    input.universeId,
    input.workerId,
    input.progressCursor,
    ...completedSteps,
    ...pendingSteps,
    ...contextRefs,
    ...memoryRefs,
    repoStateRef ?? '',
    dbStateRef ?? '',
    String(input.attemptCount),
  ]);
  return {
    checkpointId: input.checkpointId,
    missionId: input.missionId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    workerId: input.workerId,
    progressCursor: input.progressCursor,
    completedSteps,
    pendingSteps,
    contextRefs,
    memoryRefs,
    repoStateRef,
    dbStateRef,
    lastHeartbeatAt: input.lastHeartbeatAt,
    attemptCount: input.attemptCount,
    signature,
    tampered: false,
    transfersAuthority: false,
    createdAt: input.createdAt,
  };
}

export function resumeFromCheckpoint(checkpoint: AgentCheckpoint): {
  missionId: string;
  progressCursor: string;
  completedSteps: readonly string[];
  pendingSteps: readonly string[];
  contextRefs: readonly string[];
  memoryRefs: readonly string[];
  repoStateRef: string | null;
  dbStateRef: string | null;
  transfersAuthority: false;
  tampered: false;
} {
  return {
    missionId: checkpoint.missionId,
    progressCursor: checkpoint.progressCursor,
    completedSteps: checkpoint.completedSteps,
    pendingSteps: checkpoint.pendingSteps,
    contextRefs: checkpoint.contextRefs,
    memoryRefs: checkpoint.memoryRefs,
    repoStateRef: checkpoint.repoStateRef,
    dbStateRef: checkpoint.dbStateRef,
    transfersAuthority: false,
    tampered: false,
  };
}

export function verifyCheckpointSignature(checkpoint: AgentCheckpoint): boolean {
  const expected = signCheckpoint([
    checkpoint.checkpointId,
    checkpoint.missionId,
    checkpoint.tenantId,
    checkpoint.universeId,
    checkpoint.workerId,
    checkpoint.progressCursor,
    ...checkpoint.completedSteps,
    ...checkpoint.pendingSteps,
    ...checkpoint.contextRefs,
    ...checkpoint.memoryRefs,
    checkpoint.repoStateRef ?? '',
    checkpoint.dbStateRef ?? '',
    String(checkpoint.attemptCount),
  ]);
  return expected === checkpoint.signature && checkpoint.tampered === false;
}

export function checkpointTransfersAuthority(_checkpoint: AgentCheckpoint): false {
  return false;
}
