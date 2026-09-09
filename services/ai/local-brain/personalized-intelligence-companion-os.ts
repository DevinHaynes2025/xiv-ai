/**
 * 62L-DI Personalized Intelligence Companion OS —
 * Companion ≠ founder impersonation; recommendation ≠ charge/deploy/publish.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ADULT_MIN_AGE_YEARS, COMPANION_FOUNDER_IMPERSONATION_DENIED, DI_LOCKS, HONESTY_BANNER,
  MAX_COMPANION_SURFACES, NEXT_PHASE_TITLE, UNDER_18_DENIED,
  type CompanionActionKind, type CompanionSurfaceId, type DiActor,
} from './personalized-intelligence-companion-os-types';
import { globalDataStorytellingHonesty } from './global-data-storytelling-engine';
import { historicalForecastMemoryHonesty } from './historical-forecast-memory-network';
import { decisionCopilotStudioHonesty } from './decision-copilot-studio';
import { agentWorkforceMarketplaceHonesty } from './agent-workforce-marketplace';
import { realtimeCollaborationUniverseHonesty } from './realtime-collaboration-universe';
import { adaptiveUiUxIntelligenceGraphHonesty } from './adaptive-ui-ux-intelligence-graph';

export type PersonalizedIntelligenceCompanionOs = {
  id: string; orgId: string; tenantId: string; universeId: string;
  predecessorLayer: 'DH' | 'DG' | 'DF' | 'DE' | 'DD' | 'DA' | 'CY' | 'NONE';
  l4AutonomyEnabled: false; productionAuthorized: false; tipLand: false;
  fullProductionCompanionShipped: false; createdAt: string;
};
export type CompanionSurfaceContract = {
  id: string; osId: string; surface: CompanionSurfaceId; locale: string;
  status: 'CONTRACT_ONLY' | 'STUB' | 'DENIED'; reason: string; createdAt: string;
};
export type CompanionActionAttempt = {
  id: string; osId: string; action: CompanionActionKind; status: 'ALLOWED' | 'DENIED';
  reason: string; recommendationOnly: boolean; at: string;
};
export type CompanionOnboardingAttempt = {
  id: string; osId: string; declaredAgeYears: number | null; status: 'admitted' | 'denied';
  reason: string; adultConfirmed: boolean; at: string;
};
type Store = {
  systems: PersonalizedIntelligenceCompanionOs[]; surfaces: CompanionSurfaceContract[];
  actions: CompanionActionAttempt[]; onboardings: CompanionOnboardingAttempt[];
};

function storePath(root: string) { return xivLocalPath(root, 'personalized-intelligence-companion-os.json'); }
async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { systems: [], surfaces: [], actions: [], onboardings: [] });
}
async function save(root: string, store: Store) { await writeJsonFileAtomic(storePath(root), store); }
function id(prefix: string) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
function resolveBrainPath(repoRoot?: string): string {
  if (repoRoot) return join(repoRoot, 'services/ai/local-brain');
  return join(process.cwd(), 'services/ai/local-brain');
}

export function detectPredecessorLayer(repoRoot?: string): PersonalizedIntelligenceCompanionOs['predecessorLayer'] {
  const brain = resolveBrainPath(repoRoot);
  if (existsSync(join(brain, 'adaptive-life-business-intelligence-os-types.ts'))) return 'DH';
  if (existsSync(join(brain, 'universal-personal-business-ai-os-types.ts'))) return 'DG';
  if (existsSync(join(brain, 'human-centered-superbrain-ux-types.ts'))) return 'DF';
  if (existsSync(join(brain, 'knowledge-exchange-gateway-marketplace-types.ts'))) return 'DE';
  if (existsSync(join(brain, 'cognitive-service-mesh-types.ts'))) return 'DD';
  if (existsSync(join(brain, 'superbrain-runtime-kernel-types.ts'))) return 'DA';
  if (existsSync(join(brain, 'knowledge-colony-operating-system-types.ts'))) return 'CY';
  return 'NONE';
}

export function personalizedIntelligenceCompanionHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DI_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DI_LOCKS.TIP_LAND,
    productionAuthorization: DI_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DI_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DI_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionCompanionShipped: DI_LOCKS.FULL_PRODUCTION_COMPANION_SHIPPED,
    companionContractsBounded: DI_LOCKS.COMPANION_CONTRACTS_BOUNDED_TYPESCRIPT_DOCS,
    companionImpersonatesFounder: DI_LOCKS.COMPANION_IMPERSONATES_FOUNDER,
    companionApprovesSpendAlone: DI_LOCKS.COMPANION_APPROVES_SPEND_ALONE,
    companionApprovesDeployAlone: DI_LOCKS.COMPANION_APPROVES_DEPLOY_ALONE,
    recommendationEqCharge: DI_LOCKS.RECOMMENDATION_EQ_CHARGE,
    adult18PlusRequired: DI_LOCKS.ADULT_18_PLUS_REQUIRED,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    subsystems: {
      storytelling: globalDataStorytellingHonesty(),
      forecastMemory: historicalForecastMemoryHonesty(),
      decisionCopilot: decisionCopilotStudioHonesty(),
      marketplace: agentWorkforceMarketplaceHonesty(),
      collaboration: realtimeCollaborationUniverseHonesty(),
      uxGraph: adaptiveUiUxIntelligenceGraphHonesty(),
    },
  };
}

export async function bootstrapPersonalizedIntelligenceCompanionOs(input: {
  orgId: string; tenantId: string; universeId: string; root: string; actor: DiActor; repoRoot?: string;
}): Promise<PersonalizedIntelligenceCompanionOs> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.systems.find((s) => s.orgId === input.orgId && s.tenantId === input.tenantId && s.universeId === input.universeId);
  if (existing) return existing;
  const predecessorLayer = detectPredecessorLayer(input.repoRoot);
  const brain = resolveBrainPath(input.repoRoot);

  async function soft(modFile: string, fn: string, actorPatch?: Record<string, unknown>) {
    try {
      const mod = join(brain, modFile);
      if (!existsSync(mod)) return;
      const m = await import(mod);
      if (typeof m[fn] === 'function') {
        await m[fn]({
          orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId,
          root: input.root, actor: actorPatch ?? input.actor, repoRoot: input.repoRoot,
          universeKind: 'personal',
        });
      }
    } catch { /* soft-wire optional */ }
  }

  if (predecessorLayer === 'DH') await soft('adaptive-life-business-intelligence-os.ts', 'bootstrapAdaptiveLifeBusinessIntelligenceOs');
  else if (predecessorLayer === 'DG') await soft('universal-personal-business-ai-os.ts', 'bootstrapUniversalPersonalBusinessAiOs');
  else if (predecessorLayer === 'DF') {
    await soft('human-centered-superbrain-ux-os.ts', 'bootstrapHumanCenteredSuperbrainUxOs', {
      kind: 'ux_os_curator', id: input.actor.id, orgId: input.orgId, tenantId: input.tenantId,
      universeId: input.universeId, role: input.actor.role, permissionLevel: input.actor.permissionLevel,
      authorityLevel: input.actor.authorityLevel,
    });
  }

  const system: PersonalizedIntelligenceCompanionOs = {
    id: id('dicos'), orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId,
    predecessorLayer, l4AutonomyEnabled: false, productionAuthorized: false, tipLand: false,
    fullProductionCompanionShipped: false, createdAt: new Date().toISOString(),
  };
  store.systems.push(system); await save(input.root, store); return system;
}

export async function registerCompanionSurfaceContract(input: {
  osId: string; surface: CompanionSurfaceId; locale?: string; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; contract?: CompanionSurfaceContract }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'COMPANION_OS_NOT_FOUND' };
  if (store.surfaces.length >= MAX_COMPANION_SURFACES) return { accepted: false, reason: 'MAX_COMPANION_SURFACES_BOUNDED' };
  const contract: CompanionSurfaceContract = {
    id: id('disurf'), osId: os.id, surface: input.surface, locale: input.locale ?? 'en',
    status: 'CONTRACT_ONLY', reason: 'BOUNDED_COMPANION_SURFACE_CONTRACT', createdAt: now,
  };
  store.surfaces.push(contract); await save(input.root, store);
  return { accepted: true, reason: 'COMPANION_SURFACE_REGISTERED', contract };
}

export async function attemptCompanionOnboarding(input: {
  osId: string; declaredAgeYears: number | null; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: CompanionOnboardingAttempt }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'COMPANION_OS_NOT_FOUND' };
  const age = input.declaredAgeYears;
  const adult = typeof age === 'number' && Number.isFinite(age) && age >= ADULT_MIN_AGE_YEARS;
  if (!adult) {
    const attempt: CompanionOnboardingAttempt = { id: id('dionb'), osId: os.id, declaredAgeYears: age, status: 'denied', reason: UNDER_18_DENIED, adultConfirmed: false, at: now };
    store.onboardings.push(attempt); await save(input.root, store);
    return { accepted: false, reason: UNDER_18_DENIED, attempt };
  }
  const attempt: CompanionOnboardingAttempt = { id: id('dionb'), osId: os.id, declaredAgeYears: age, status: 'admitted', reason: 'ADULT_18_PLUS_CONFIRMED', adultConfirmed: true, at: now };
  store.onboardings.push(attempt); await save(input.root, store);
  return { accepted: true, reason: 'COMPANION_ONBOARDING_ADMITTED', attempt };
}

export async function attemptCompanionAction(input: {
  osId: string; action: CompanionActionKind; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: CompanionActionAttempt }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'COMPANION_OS_NOT_FOUND' };
  const privileged: CompanionActionKind[] = ['impersonate_founder', 'approve_spend', 'approve_deploy', 'publish', 'charge'];
  if (privileged.includes(input.action)) {
    const attempt: CompanionActionAttempt = { id: id('diact'), osId: os.id, action: input.action, status: 'DENIED', reason: COMPANION_FOUNDER_IMPERSONATION_DENIED, recommendationOnly: true, at: now };
    store.actions.push(attempt); await save(input.root, store);
    return { accepted: false, reason: COMPANION_FOUNDER_IMPERSONATION_DENIED, attempt };
  }
  const attempt: CompanionActionAttempt = { id: id('diact'), osId: os.id, action: input.action, status: 'ALLOWED', reason: 'RECOMMENDATION_ONLY_BOUNDED', recommendationOnly: true, at: now };
  store.actions.push(attempt); await save(input.root, store);
  return { accepted: true, reason: 'COMPANION_RECOMMENDATION_RECORDED', attempt };
}
