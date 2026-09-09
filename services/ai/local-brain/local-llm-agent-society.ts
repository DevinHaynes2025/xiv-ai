/**
 * 62L-CD Local LLM Agent Society — local-LLM agent shifts with local-first
 * routing. Cloud adapters only when allowed and verified.
 * Sealed/local-only information must NEVER silently fall back to a cloud model.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CD_LOCKS,
  HONESTY_BANNER,
  SEALED_CLOUD_FALLBACK_DENIED,
  type CdActor,
} from './data-root-local-llm-archive-mesh-types';

export type PromptSensitivity = 'public' | 'local_only' | 'sealed';
export type RouteTarget =
  | 'local_llm'
  | 'google_ai_studio'
  | 'aws'
  | 'azure'
  | 'gcp'
  | 'cloud_generic';

export type AgentShift = {
  id: string;
  agentId: string;
  role: string;
  localFirst: true;
  status: 'active' | 'denied';
  reason: string;
  createdAt: string;
};

export type RouteDecision = {
  id: string;
  promptId: string;
  sensitivity: PromptSensitivity;
  requestedTarget: RouteTarget;
  selectedTarget: RouteTarget | null;
  status: 'routed_local' | 'denied' | 'unavailable';
  silentCloudFallback: false;
  reason: string;
  at: string;
};

type Store = {
  shifts: AgentShift[];
  routes: RouteDecision[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'local-llm-agent-society.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { shifts: [], routes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function localLlmSocietyHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CD_LOCKS.L4_AUTONOMY_ENABLED,
    localFirstRouting: CD_LOCKS.LOCAL_FIRST_ROUTING,
    sealedSilentCloudFallback: CD_LOCKS.SEALED_SILENT_CLOUD_FALLBACK,
    localOnlySilentCloudFallback: CD_LOCKS.LOCAL_ONLY_SILENT_CLOUD_FALLBACK,
    learningIsPermission: CD_LOCKS.LEARNING_IS_PERMISSION,
  };
}

export async function startLocalAgentShift(input: {
  agentId: string;
  role: string;
  root: string;
  actor: CdActor;
}): Promise<AgentShift> {
  const store = await load(input.root);
  const shift: AgentShift = {
    id: id('llshift'),
    agentId: input.agentId,
    role: input.role,
    localFirst: true,
    status: 'active',
    reason: 'LOCAL_LLM_AGENT_SHIFT_STARTED',
    createdAt: new Date().toISOString(),
  };
  store.shifts.push(shift);
  await save(input.root, store);
  return shift;
}

/**
 * Route a prompt. Sealed/local-only never silently falls back to cloud /
 * Google AI Studio — even if cloud is requested or "forceCloudFallback" is set.
 */
export async function routePromptLocalFirst(input: {
  promptId: string;
  sensitivity: PromptSensitivity;
  requestedTarget?: RouteTarget;
  forceCloudFallback?: boolean;
  cloudConfiguredAuthorizedVerified?: boolean;
  root: string;
  actor: CdActor;
}): Promise<RouteDecision> {
  const store = await load(input.root);
  const requested = input.requestedTarget ?? 'local_llm';
  const cloudish: RouteTarget[] = [
    'google_ai_studio',
    'aws',
    'azure',
    'gcp',
    'cloud_generic',
  ];
  const wantsCloud = cloudish.includes(requested) || input.forceCloudFallback === true;
  const sealedOrLocal =
    input.sensitivity === 'sealed' || input.sensitivity === 'local_only';

  let decision: RouteDecision;

  if (sealedOrLocal && wantsCloud) {
    decision = {
      id: id('llroute'),
      promptId: input.promptId,
      sensitivity: input.sensitivity,
      requestedTarget: requested,
      selectedTarget: 'local_llm',
      status: 'denied',
      silentCloudFallback: false,
      reason: SEALED_CLOUD_FALLBACK_DENIED,
      at: new Date().toISOString(),
    };
  } else if (wantsCloud && input.cloudConfiguredAuthorizedVerified !== true) {
    decision = {
      id: id('llroute'),
      promptId: input.promptId,
      sensitivity: input.sensitivity,
      requestedTarget: requested,
      selectedTarget: null,
      status: 'unavailable',
      silentCloudFallback: false,
      reason: 'CLOUD_ADAPTER_UNAVAILABLE_UNTIL_CONFIGURED_AUTHORIZED_VERIFIED',
      at: new Date().toISOString(),
    };
  } else if (wantsCloud && input.sensitivity === 'public') {
    decision = {
      id: id('llroute'),
      promptId: input.promptId,
      sensitivity: input.sensitivity,
      requestedTarget: requested,
      selectedTarget: requested,
      status: 'routed_local',
      silentCloudFallback: false,
      reason: 'PUBLIC_PROMPT_CLOUD_ROUTE_EXPLICIT_AND_VERIFIED',
      at: new Date().toISOString(),
    };
    // Note: status name kept for ledger compatibility; selectedTarget is cloud when verified.
    decision = { ...decision, status: 'routed_local' };
  } else {
    decision = {
      id: id('llroute'),
      promptId: input.promptId,
      sensitivity: input.sensitivity,
      requestedTarget: requested,
      selectedTarget: 'local_llm',
      status: 'routed_local',
      silentCloudFallback: false,
      reason: 'LOCAL_FIRST_ROUTE_SELECTED',
      at: new Date().toISOString(),
    };
  }

  store.routes.push(decision);
  await save(input.root, store);
  return decision;
}
