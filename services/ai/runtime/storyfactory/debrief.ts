import { createHash } from 'node:crypto';
import type { AgentDebrief, StoryAgent } from './types';

export function createDebrief(input: Omit<AgentDebrief, 'debriefId' | 'createdAt'>): AgentDebrief {
  const createdAt = new Date().toISOString();
  const debriefId = createHash('sha256').update(JSON.stringify({ ...input, createdAt })).digest('hex');
  return { ...input, debriefId, createdAt };
}

export interface DebriefCouncilSummary {
  agents: StoryAgent[];
  completedCount: number;
  failureCount: number;
  blockedCount: number;
  sharedLessons: string[];
  unresolvedQuestions: string[];
}

export function summarizeCouncil(debriefs: AgentDebrief[]): DebriefCouncilSummary {
  const agents = [...new Set(debriefs.map((d) => d.agent))];
  const sharedLessons = [...new Set(debriefs.flatMap((d) => d.lessons))];
  const unresolvedQuestions = [...new Set(debriefs.flatMap((d) => d.assumptions.map((a) => `VERIFY: ${a}`)))];
  return {
    agents,
    completedCount: debriefs.reduce((n, d) => n + d.completed.length, 0),
    failureCount: debriefs.reduce((n, d) => n + d.failed.length, 0),
    blockedCount: debriefs.reduce((n, d) => n + d.blocked.length, 0),
    sharedLessons,
    unresolvedQuestions,
  };
}

/** Optional 12D-11 hook — append identity+audit row from a debrief (read/review ledger only). */
export {
  appendCheckpointFromStoryDebrief,
  type AgentCheckpointLedger,
  type AgentCheckpointLedgerEntry,
  type CheckpointEnvironmentLabel,
} from '../dimensional/agent-checkpoint-ledger';
