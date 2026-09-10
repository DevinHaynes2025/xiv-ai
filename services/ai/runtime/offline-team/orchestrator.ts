import type { OfflineAgentSeat, OfflineCheckpoint, OfflineTeamStatus } from './types';
import { OFFLINE_TEAM_GUARDRAILS } from './types';

export const DEFAULT_OFFLINE_TEAM: readonly OfflineAgentSeat[] = Object.freeze([
  { id: 'OLLAMA_BUILDER', enabled: true, maxConcurrentJobs: 2, requiresOllama: true, mayWriteProduction: false },
  { id: 'LOCAL_RULES', enabled: true, maxConcurrentJobs: 2, requiresOllama: false, mayWriteProduction: false },
  { id: 'REVIEWER', enabled: true, maxConcurrentJobs: 1, requiresOllama: false, mayWriteProduction: false },
  { id: 'LEARNING_RECORDER', enabled: true, maxConcurrentJobs: 1, requiresOllama: false, mayWriteProduction: false },
]);

export function buildOfflineTeamStatus(input: {
  ollamaReachable: boolean;
  grokConfigured: boolean;
  grokReachable: boolean;
  runningSeatIds?: readonly string[];
  pendingStories?: number;
  checkpoints?: readonly OfflineCheckpoint[];
}): OfflineTeamStatus {
  const running = new Set(input.runningSeatIds ?? []);
  const checkpoints = [...(input.checkpoints ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return {
    ollamaReachable: input.ollamaReachable,
    grokConfigured: input.grokConfigured,
    grokReachable: input.grokReachable,
    enabledOfflineSeats: DEFAULT_OFFLINE_TEAM.filter((seat) => seat.enabled).length,
    runningSeats: DEFAULT_OFFLINE_TEAM.filter((seat) => running.has(seat.id)).length,
    pendingStories: Math.max(0, input.pendingStories ?? 0),
    lastCheckpointAt: checkpoints.at(-1)?.createdAt ?? null,
  };
}

export function eligibleOfflineSeats(ollamaReachable: boolean): readonly OfflineAgentSeat[] {
  return DEFAULT_OFFLINE_TEAM.filter((seat) => seat.enabled && (!seat.requiresOllama || ollamaReachable));
}

export function assertOfflineTeamGuardrails(): void {
  if (OFFLINE_TEAM_GUARDRAILS.autonomousProductionDDL || OFFLINE_TEAM_GUARDRAILS.autonomousProductionDML) {
    throw new Error('offline agents must not mutate production databases autonomously');
  }
  if (OFFLINE_TEAM_GUARDRAILS.autonomousDeploy || OFFLINE_TEAM_GUARDRAILS.destructiveDbAutoApply) {
    throw new Error('offline agents must not deploy or destructively migrate production autonomously');
  }
  if (OFFLINE_TEAM_GUARDRAILS.pretendRunsDuringPowerOff) {
    throw new Error('runtime must never claim work continued while host power was unavailable');
  }
}
