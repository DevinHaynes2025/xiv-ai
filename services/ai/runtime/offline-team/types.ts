export type OfflineAgentId = 'OLLAMA_BUILDER' | 'LOCAL_RULES' | 'REVIEWER' | 'LEARNING_RECORDER';
export type AgentRunState = 'READY' | 'RUNNING' | 'PAUSED' | 'WAITING_PROVIDER' | 'FAILED';

export interface OfflineAgentSeat {
  id: OfflineAgentId;
  enabled: boolean;
  maxConcurrentJobs: number;
  requiresOllama: boolean;
  mayWriteProduction: false;
}

export interface OfflineCheckpoint {
  checkpointId: string;
  runId: string;
  storyId: string;
  agent: OfflineAgentId;
  createdAt: string;
  state: AgentRunState;
  evidenceRefs: readonly string[];
  lessons: readonly string[];
  productionMutation: false;
}

export interface OfflineTeamStatus {
  ollamaReachable: boolean;
  grokConfigured: boolean;
  grokReachable: boolean;
  enabledOfflineSeats: number;
  runningSeats: number;
  pendingStories: number;
  lastCheckpointAt: string | null;
}

export const OFFLINE_TEAM_GUARDRAILS = {
  offlineFirst: true,
  resumeAfterRestart: true,
  pretendRunsDuringPowerOff: false,
  autonomousProductionDDL: false,
  autonomousProductionDML: false,
  autonomousDeploy: false,
  destructiveDbAutoApply: false,
  secretsInRepository: false,
  learningMayRecordLessons: true,
  learningMayMutateModelWeights: false,
  learningMayRewriteAgentCode: false,
} as const;
