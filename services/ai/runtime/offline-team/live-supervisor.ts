import type { OfflineAgentId } from './types';
import type { OfflineMission, MissionTask } from './mission-scheduler';
import { decomposeMission } from './mission-scheduler';
import type { OllamaDiscoveryResult, OllamaModelInfo } from './model-discovery';
import { selectCodingModel } from './model-discovery';

export type SupervisorWorkerState = 'READY' | 'RUNNING' | 'WAITING_MODEL' | 'FAILED' | 'STOPPED';

export interface SupervisorWorker {
  workerId: string;
  agent: OfflineAgentId;
  role: MissionTask['role'];
  model?: string;
  state: SupervisorWorkerState;
  restartCount: number;
  lastHeartbeatAt: string | null;
  evidence: readonly string[];
}

export interface SupervisorSnapshot {
  generatedAt: string;
  ollamaReachable: boolean;
  selectedCodingModel: string | null;
  workers: readonly SupervisorWorker[];
  productionMutationAllowed: false;
}

export const LIVE_SUPERVISOR_GUARDRAILS = {
  offlineFirst: true,
  maxWorkers: 8,
  maxAutomaticRestartsPerWorker: 3,
  productionMutationAllowed: false,
  autonomousDeployAllowed: false,
  destructiveDatabaseActionAllowed: false,
  requiresEvidenceForHealthyState: true,
} as const;

function roleToAgent(role: MissionTask['role']): OfflineAgentId {
  switch (role) {
    case 'CODER': return 'OLLAMA_BUILDER';
    case 'LEARNING_RECORDER': return 'LEARNING_RECORDER';
    case 'QA':
    case 'SECURITY_REVIEWER': return 'REVIEWER';
    default: return 'LOCAL_RULES';
  }
}

export function buildSupervisorWorkers(input: {
  mission: OfflineMission;
  discovery: OllamaDiscoveryResult;
  now?: Date;
}): readonly SupervisorWorker[] {
  const tasks = decomposeMission(input.mission).slice(0, LIVE_SUPERVISOR_GUARDRAILS.maxWorkers);
  const codingModel = selectCodingModel(input.discovery.models);
  const now = (input.now ?? new Date()).toISOString();

  return Object.freeze(tasks.map((task) => {
    const agent = roleToAgent(task.role);
    const needsModel = agent === 'OLLAMA_BUILDER';
    const model = needsModel ? codingModel?.name : undefined;
    const modelReady = !needsModel || (input.discovery.reachable && Boolean(model));
    return Object.freeze({
      workerId: `${input.mission.missionId}:${task.role.toLowerCase()}`,
      agent,
      role: task.role,
      model,
      state: modelReady ? 'READY' as const : 'WAITING_MODEL' as const,
      restartCount: 0,
      lastHeartbeatAt: modelReady ? now : null,
      evidence: Object.freeze(modelReady ? [`MODEL_READY:${model ?? 'LOCAL_RULES'}`] : ['MODEL_UNAVAILABLE']),
    });
  }));
}

export function restartWorker(worker: SupervisorWorker, now = new Date()): SupervisorWorker {
  if (worker.restartCount >= LIVE_SUPERVISOR_GUARDRAILS.maxAutomaticRestartsPerWorker) {
    return Object.freeze({ ...worker, state: 'STOPPED', evidence: Object.freeze([...worker.evidence, 'RESTART_LIMIT_REACHED']) });
  }
  return Object.freeze({
    ...worker,
    state: 'READY',
    restartCount: worker.restartCount + 1,
    lastHeartbeatAt: now.toISOString(),
    evidence: Object.freeze([...worker.evidence, `RESTARTED:${worker.restartCount + 1}`]),
  });
}

export function buildSupervisorSnapshot(input: {
  discovery: OllamaDiscoveryResult;
  workers: readonly SupervisorWorker[];
  now?: Date;
}): SupervisorSnapshot {
  const selected: OllamaModelInfo | null = selectCodingModel(input.discovery.models);
  return Object.freeze({
    generatedAt: (input.now ?? new Date()).toISOString(),
    ollamaReachable: input.discovery.reachable,
    selectedCodingModel: selected?.name ?? null,
    workers: Object.freeze([...input.workers]),
    productionMutationAllowed: false,
  });
}
