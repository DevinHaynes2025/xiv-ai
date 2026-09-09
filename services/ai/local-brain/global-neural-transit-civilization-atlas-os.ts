/**
 * 62L-DM Global Neural Transit + Civilization Atlas OS —
 * Cohesive layer over DL (preferred) / DK / DJ when PRESENT.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { civilizationKnowledgeAtlasHonesty } from './civilization-knowledge-atlas';
import { globalNeuralTransitGridHonesty } from './global-neural-transit-grid';
import { heterogeneousComputeFabricDmHonesty } from './heterogeneous-compute-fabric-dm';
import { inclusiveBusinessOsEcosystemHonesty } from './inclusive-business-os-ecosystem';
import { universalDeviceRuntimeHonesty } from './universal-device-runtime-dm';
import { verifiedAgentWorkforceHonesty } from './verified-offline-online-agent-workforce';
import {
  ADULT_MIN_AGE_YEARS,
  DM_LOCKS,
  HONESTY_BANNER,
  METAPHOR_ARCHITECTURE,
  NEXT_PHASE_TITLE,
  UNDER_18_DENIED,
  type DmActor,
} from './global-neural-transit-civilization-atlas-types';

export type GlobalNeuralTransitCivilizationAtlasOs = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: 'DL' | 'DK' | 'DJ' | 'DI' | 'DH' | 'DG' | 'DF' | 'DE' | 'DD' | 'DA' | 'NONE';
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  fullProductionDmShipped: false;
  createdAt: string;
};

export type DmOnboardingAttempt = {
  id: string;
  osId: string;
  declaredAgeYears: number | null;
  status: 'admitted' | 'denied';
  reason: string;
  adultConfirmed: boolean;
  at: string;
};

type Store = {
  systems: GlobalNeuralTransitCivilizationAtlasOs[];
  onboardings: DmOnboardingAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-neural-transit-civilization-atlas-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { systems: [], onboardings: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveBrainPath(repoRoot?: string): string {
  if (repoRoot) return join(repoRoot, 'services/ai/local-brain');
  return join(process.cwd(), 'services/ai/local-brain');
}

export function detectDmPredecessorLayer(
  repoRoot?: string,
): GlobalNeuralTransitCivilizationAtlasOs['predecessorLayer'] {
  const brain = resolveBrainPath(repoRoot);
  if (existsSync(join(brain, 'neural-transportation-os-types.ts'))) return 'DL';
  if (existsSync(join(brain, 'unified-intelligence-experience-os-types.ts'))) return 'DK';
  if (existsSync(join(brain, 'personal-intelligence-command-os-types.ts'))) return 'DJ';
  if (existsSync(join(brain, 'personalized-intelligence-companion-os-types.ts'))) return 'DI';
  if (existsSync(join(brain, 'adaptive-life-business-intelligence-os-types.ts'))) return 'DH';
  if (existsSync(join(brain, 'universal-personal-business-ai-os-types.ts'))) return 'DG';
  if (existsSync(join(brain, 'human-centered-superbrain-ux-types.ts'))) return 'DF';
  if (existsSync(join(brain, 'knowledge-exchange-gateway-marketplace-types.ts'))) return 'DE';
  if (existsSync(join(brain, 'cognitive-service-mesh-types.ts'))) return 'DD';
  if (existsSync(join(brain, 'superbrain-runtime-kernel-types.ts'))) return 'DA';
  return 'NONE';
}

export function globalNeuralTransitCivilizationAtlasOsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DM_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DM_LOCKS.TIP_LAND,
    productionAuthorization: DM_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DM_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DM_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionDmShipped: DM_LOCKS.FULL_PRODUCTION_DM_SHIPPED,
    liveSupabaseApply: DM_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DM_LOCKS.DB_CANDIDATES_APPLIED,
    inclusiveUxWithoutDemographicProfiling:
      DM_LOCKS.INCLUSIVE_UX_WITHOUT_DEMOGRAPHIC_PROFILING,
    metaphorArchitecture: METAPHOR_ARCHITECTURE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    subsystems: {
      transitGrid: globalNeuralTransitGridHonesty(),
      civilizationAtlas: civilizationKnowledgeAtlasHonesty(),
      agentWorkforce: verifiedAgentWorkforceHonesty(),
      deviceRuntime: universalDeviceRuntimeHonesty(),
      computeFabric: heterogeneousComputeFabricDmHonesty(),
      inclusiveBusinessOs: inclusiveBusinessOsEcosystemHonesty(),
    },
  };
}

export async function bootstrapGlobalNeuralTransitCivilizationAtlasOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DmActor;
  repoRoot?: string;
}): Promise<GlobalNeuralTransitCivilizationAtlasOs> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.systems.find(
    (s) =>
      s.orgId === input.orgId &&
      s.tenantId === input.tenantId &&
      s.universeId === input.universeId,
  );
  if (existing) return existing;

  const predecessorLayer = detectDmPredecessorLayer(input.repoRoot);
  const brain = resolveBrainPath(input.repoRoot);

  if (predecessorLayer === 'DK') {
    try {
      const mod = join(brain, 'unified-intelligence-experience-os.ts');
      if (existsSync(mod)) {
        const dk = await import(mod);
        if (typeof dk.bootstrapUnifiedIntelligenceExperienceOs === 'function') {
          await dk.bootstrapUnifiedIntelligenceExperienceOs({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'experience_os_curator',
              id: input.actor.id,
              orgId: input.orgId,
              tenantId: input.tenantId,
              universeId: input.universeId,
              role: input.actor.role,
              permissionLevel: input.actor.permissionLevel,
              authorityLevel: input.actor.authorityLevel,
            },
            repoRoot: input.repoRoot,
          });
        }
      }
    } catch {
      // Soft-wire optional.
    }
  } else if (predecessorLayer === 'DJ') {
    try {
      const mod = join(brain, 'personal-intelligence-command-os.ts');
      if (existsSync(mod)) {
        const dj = await import(mod);
        if (typeof dj.bootstrapPersonalIntelligenceCommandOs === 'function') {
          await dj.bootstrapPersonalIntelligenceCommandOs({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'command_os_curator',
              id: input.actor.id,
              orgId: input.orgId,
              tenantId: input.tenantId,
              universeId: input.universeId,
              role: input.actor.role,
              permissionLevel: input.actor.permissionLevel,
              authorityLevel: input.actor.authorityLevel,
            },
            repoRoot: input.repoRoot,
          });
        }
      }
    } catch {
      // Soft-wire optional.
    }
  }

  const os: GlobalNeuralTransitCivilizationAtlasOs = {
    id: id('dmos'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    fullProductionDmShipped: false,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(os);
  await save(input.root, store);
  return os;
}

export async function attemptDmAdultOnboarding(input: {
  osId: string;
  declaredAgeYears?: number;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: DmOnboardingAttempt; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'OS_NOT_FOUND', at: now };

  const age = input.declaredAgeYears;
  if (typeof age !== 'number' || !Number.isFinite(age) || age < ADULT_MIN_AGE_YEARS) {
    const attempt: DmOnboardingAttempt = {
      id: id('dmonb'),
      osId: input.osId,
      declaredAgeYears: typeof age === 'number' ? age : null,
      status: 'denied',
      reason: UNDER_18_DENIED,
      adultConfirmed: false,
      at: now,
    };
    store.onboardings.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: UNDER_18_DENIED, attempt, at: now };
  }

  const attempt: DmOnboardingAttempt = {
    id: id('dmonb'),
    osId: input.osId,
    declaredAgeYears: age,
    status: 'admitted',
    reason: 'ADULT_18_PLUS_ONBOARDING_ADMITTED',
    adultConfirmed: true,
    at: now,
  };
  store.onboardings.push(attempt);
  await save(input.root, store);
  return { accepted: true, reason: attempt.reason, attempt, at: now };
}
