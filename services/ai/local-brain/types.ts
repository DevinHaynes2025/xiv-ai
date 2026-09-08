export type LocalBrainAvailability = 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE';

export type LocalTaskState =
  | 'queued'
  | 'running'
  | 'waiting_local_model'
  | 'waiting_data'
  | 'unavailable'
  | 'denied'
  | 'blocked'
  | 'completed'
  | 'failed';

export type LocalTaskRequirement = {
  needsInternet: boolean;
  needsCloudProvider: boolean;
  needsExternalFreshness: boolean;
  needsProductionWrite: boolean;
  needsPermissionChange: boolean;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
};

export type LocalTask = {
  id: string;
  kind: 'analysis' | 'coding' | 'testing' | 'research';
  prompt: string;
  state: LocalTaskState;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  maxAttempts: number;
  budget: {
    maxModelCalls: number;
    modelCallsUsed: number;
  };
  requirements?: LocalTaskRequirement;
  metadata?: Record<string, string>;
};

export type LocalCheckpoint = {
  taskId: string;
  at: string;
  state: LocalTaskState;
  attempt: number;
  summary: string;
  nextAction?: string;
  evidence?: string[];
};

export type LocalModelStatus = {
  provider: 'ollama';
  endpoint: string;
  model: string | null;
  availability: LocalBrainAvailability;
  reason: string;
};

export type LocalModelCompletion = {
  text: string;
  model: string;
  provider: 'ollama';
};

export type LocalBrainStatus = {
  mode: 'LOCAL_ONLY' | 'HYBRID';
  localExecutionEnabled: boolean;
  productionGitPushEnabled: false;
  productionDatabaseWriteEnabled: false;
  autoProductionDeployEnabled: false;
  model: LocalModelStatus;
  queuedTasks: number;
  runningTasks: number;
};
