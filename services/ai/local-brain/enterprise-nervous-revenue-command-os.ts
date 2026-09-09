/**
 * 62L-DR Enterprise Nervous System OS —
 * Façade coordinating revenue/executive agents + sealed founder data deny-by-default.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { enterpriseNeuralNodeExpansionHonesty } from './enterprise-neural-node-expansion';
import {
  DR_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SEALED_FOUNDER_DATA_DENIED,
  detectPredecessorLayer,
  isFounderOrHumanApprover,
  isSalesCorpsRole,
  type DrActor,
} from './enterprise-nervous-revenue-command-types';
import { executiveAiSuiteHonesty } from './executive-ai-suite';
import { generativeUserStoryGraphHonesty } from './generative-user-story-graph';
import { launchReadiness30dHonesty } from './launch-readiness-30d-program';
import { negotiationCockpitHonesty } from './negotiation-cockpit';
import { negotiationSalesAgentCorpsHonesty } from './negotiation-sales-agent-corps';
import { revenueCommandCenterHonesty } from './revenue-command-center';

export type EnterpriseNervousSystemOs = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: ReturnType<typeof detectPredecessorLayer>;
  dqSoftWired: boolean;
  dpSoftWired: boolean;
  doSoftWired: boolean;
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  fullOsProductionAuthorized: false;
  createdAt: string;
};

export type SealedAccessAttempt = {
  id: string;
  label: string;
  dataClass: 'founder_sealed';
  actorKind: string;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  systems: EnterpriseNervousSystemOs[];
  sealedAttempts: SealedAccessAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'enterprise-nervous-revenue-command-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { systems: [], sealedAttempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function detectDq(repoRoot?: string): boolean {
  const brain = repoRoot
    ? join(repoRoot, 'services/ai/local-brain')
    : join(process.cwd(), 'services/ai/local-brain');
  return (
    existsSync(join(brain, 'universal-integration-brain-types.ts')) ||
    existsSync(join(brain, 'universal-integration-brain.ts'))
  );
}

function detectDp(repoRoot?: string): boolean {
  const brain = repoRoot
    ? join(repoRoot, 'services/ai/local-brain')
    : join(process.cwd(), 'services/ai/local-brain');
  return (
    existsSync(join(brain, 'plugin-civilization-os-types.ts')) ||
    existsSync(join(brain, 'plugin-civilization-os.ts'))
  );
}

function detectDo(repoRoot?: string): boolean {
  const brain = repoRoot
    ? join(repoRoot, 'services/ai/local-brain')
    : join(process.cwd(), 'services/ai/local-brain');
  return (
    existsSync(join(brain, 'plugin-intelligence-mesh.ts')) ||
    existsSync(join(brain, 'distributed-cognitive-runtime-plugin-mesh-types.ts'))
  );
}

export function enterpriseNervousRevenueCommandOsHonesty(repoRoot?: string) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DR_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DR_LOCKS.TIP_LAND,
    productionAuthorization: DR_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DR_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DR_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullOsProductionAuthorizedIn30Days: DR_LOCKS.FULL_OS_PRODUCTION_AUTHORIZED_IN_30_DAYS,
    liveSupabaseApply: DR_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DR_LOCKS.DB_CANDIDATES_APPLIED,
    agentsCanCharge: DR_LOCKS.AGENTS_CAN_CHARGE,
    agentsCanSignContracts: DR_LOCKS.AGENTS_CAN_SIGN_CONTRACTS,
    agentsCanDeployProduction: DR_LOCKS.AGENTS_CAN_DEPLOY_PRODUCTION,
    agentsCanImpersonateFounder: DR_LOCKS.AGENTS_CAN_IMPERSONATE_FOUNDER,
    learningEqPermission: DR_LOCKS.LEARNING_EQ_PERMISSION,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    dqSoftWired: detectDq(repoRoot),
    dpSoftWired: detectDp(repoRoot),
    doSoftWired: detectDo(repoRoot),
    subsystems: {
      revenueCommand: revenueCommandCenterHonesty(),
      salesCorps: negotiationSalesAgentCorpsHonesty(),
      executiveSuite: executiveAiSuiteHonesty(),
      negotiationCockpit: negotiationCockpitHonesty(),
      neuralNodes: enterpriseNeuralNodeExpansionHonesty(),
      launchReadiness: launchReadiness30dHonesty(),
      userStoryGraph: generativeUserStoryGraphHonesty(),
    },
  };
}

export async function bootstrapEnterpriseNervousSystemOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DrActor;
  repoRoot?: string;
}): Promise<EnterpriseNervousSystemOs> {
  const store = await load(input.root);
  void input.actor;
  const os: EnterpriseNervousSystemOs = {
    id: id('ensos'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer: detectPredecessorLayer(input.repoRoot),
    dqSoftWired: detectDq(input.repoRoot),
    dpSoftWired: detectDp(input.repoRoot),
    doSoftWired: detectDo(input.repoRoot),
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    fullOsProductionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(os);
  await save(input.root, store);
  return os;
}

/**
 * Sealed founder data is deny-by-default.
 * Sales corps cannot access by label alone.
 */
export async function accessSealedFounderData(input: {
  label: string;
  claimedSealedGrant?: boolean;
  root: string;
  actor: DrActor;
}): Promise<SealedAccessAttempt> {
  const store = await load(input.root);
  const sales = isSalesCorpsRole(input.actor.kind) || input.actor.kind === 'agent';
  const founder = isFounderOrHumanApprover(input.actor);

  let status: SealedAccessAttempt['status'] = 'denied';
  let reason = SEALED_FOUNDER_DATA_DENIED;

  if (sales || !founder || !input.claimedSealedGrant) {
    status = 'denied';
    reason = SEALED_FOUNDER_DATA_DENIED;
  } else if (founder && input.claimedSealedGrant) {
    status = 'allowed';
    reason = 'FOUNDER_EXPLICIT_SEALED_GRANT';
  }

  const attempt: SealedAccessAttempt = {
    id: id('sealed'),
    label: input.label,
    dataClass: 'founder_sealed',
    actorKind: input.actor.kind,
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.sealedAttempts.push(attempt);
  await save(input.root, store);
  return attempt;
}
