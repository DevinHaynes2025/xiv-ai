/**
 * Dead letter queue — never infinite-retry broken missions.
 */

import type { AgentCheckpoint, AgentMission } from '../cloudworkforce/types';
import type { DeadLetterRecord } from './types';

export type AgentDeadLetterMission = {
  record: DeadLetterRecord;
  mission: AgentMission;
  failureReason: string;
  lastCheckpoint: AgentCheckpoint | null;
  workerHistory: readonly string[];
  toolFailures: readonly string[];
  securityEvents: readonly string[];
  status: 'QUARANTINED';
  nextStep: 'ANALYZE' | 'HUMAN_OR_AGENT_REVIEW';
  autoReplay: false;
  infiniteRetry: false;
};

export class AgentDeadLetterQueue {
  private items = new Map<string, AgentDeadLetterMission>();

  deadLetter(input: {
    messageId: string;
    mission: AgentMission;
    failureReason: string;
    attempts: number;
    lastCheckpoint: AgentCheckpoint | null;
    workerHistory: readonly string[];
    toolFailures?: readonly string[];
    securityEvents?: readonly string[];
    nowIso: string;
  }): AgentDeadLetterMission {
    const record: DeadLetterRecord = {
      messageId: input.messageId,
      missionId: input.mission.missionId,
      reason: input.failureReason,
      attempts: input.attempts,
      deadLetteredAt: input.nowIso,
      deadLetter: true,
      autoReplay: false,
    };
    const item: AgentDeadLetterMission = {
      record,
      mission: { ...input.mission, status: 'QUARANTINED' },
      failureReason: input.failureReason,
      lastCheckpoint: input.lastCheckpoint,
      workerHistory: input.workerHistory,
      toolFailures: input.toolFailures ?? [],
      securityEvents: input.securityEvents ?? [],
      status: 'QUARANTINED',
      nextStep: 'ANALYZE',
      autoReplay: false,
      infiniteRetry: false,
    };
    this.items.set(input.mission.missionId, item);
    return item;
  }

  get(missionId: string): AgentDeadLetterMission | null {
    return this.items.get(missionId) ?? null;
  }

  list(): readonly AgentDeadLetterMission[] {
    return [...this.items.values()];
  }

  markForReview(missionId: string): AgentDeadLetterMission | null {
    const item = this.items.get(missionId);
    if (!item) return null;
    const next = { ...item, nextStep: 'HUMAN_OR_AGENT_REVIEW' as const };
    this.items.set(missionId, next);
    return next;
  }
}

export function openAgentDeadLetterQueue(): AgentDeadLetterQueue {
  return new AgentDeadLetterQueue();
}
