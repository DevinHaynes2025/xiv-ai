/**
 * 62L-DN Universal Agent Runtime OS —
 * Cohesive coexistence runtime layer over DM/DL/DK when PRESENT.
 * Unifies device, civilization-history, plugin, agent-workforce, compute —
 * coexistence, not unsafe mega-merge.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { civilizationMemoryGraphHonesty } from './civilization-memory-graph';
import { crossPlatformDeviceFabricHonesty } from './cross-platform-device-fabric';
import { globalCulturalIntelligenceHonesty } from './global-cultural-intelligence-layer';
import { heterogeneousComputeOptimizationHonesty } from './heterogeneous-compute-optimization-brain';
import { pluginIntelligenceExchangeHonesty } from './plugin-intelligence-exchange';
import { sovereignPrivacySecurityKernelHonesty } from './sovereign-privacy-security-kernel';
import { verifiedAutonomousShiftSchedulerHonesty } from './verified-autonomous-shift-scheduler';
import {
  ADULT_MIN_AGE_YEARS,
  DN_LOCKS,
  HONESTY_BANNER,
  MAX_RUNTIME_SURFACES,
  METAPHOR_ARCHITECTURE,
  NEXT_PHASE_TITLE,
  UNDER_18_DENIED,
  type DnActor,
  type RuntimeSurfaceId,
} from './universal-agent-runtime-os-types';

export type UniversalAgentRuntimeOs = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: 'DM' | 'DL' | 'DK' | 'DJ' | 'DI' | 'DH' | 'DG' | 'DF' | 'DE' | 'DD' | 'DA' | 'NONE';
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  fullProductionDnShipped: false;
  coexistenceNotMegaMerge: true;
  createdAt: string;
};

export type RuntimeSurfaceContract = {
  id: string;
  osId: string;
  surface: RuntimeSurfaceId;
  status: 'CONTRACT_ONLY' | 'STUB' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type RuntimeOnboardingAttempt = {
  id: string;
  osId: string;
  declaredAgeYears: number | null;
  status: 'admitted' | 'denied';
  reason: string;
  adultConfirmed: boolean;
  at: string;
};

type Store = {
  systems: UniversalAgentRuntimeOs[];
  surfaces: RuntimeSurfaceContract[];
  onboardings: RuntimeOnboardingAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-agent-runtime-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    systems: [],
    surfaces: [],
    onboardings: [],
  });
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

export function detectPredecessorLayer(
  repoRoot?: string,
): UniversalAgentRuntimeOs['predecessorLayer'] {
  const brain = resolveBrainPath(repoRoot);
  if (existsSync(join(brain, 'global-neural-transit-civilization-atlas-types.ts'))) return 'DM';
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

export function universalAgentRuntimeOsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DN_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DN_LOCKS.TIP_LAND,
    productionAuthorization: DN_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DN_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DN_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionDnShipped: DN_LOCKS.FULL_PRODUCTION_DN_SHIPPED,
    coexistenceNotMegaMerge: DN_LOCKS.DN_IS_COEXISTENCE_LAYER,
    unsafeMegaMerge: DN_LOCKS.UNSAFE_MEGA_MERGE,
    liveSupabaseApply: DN_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DN_LOCKS.DB_CANDIDATES_APPLIED,
    metaphorArchitecture: METAPHOR_ARCHITECTURE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    subsystems: {
      deviceFabric: crossPlatformDeviceFabricHonesty(),
      civilizationMemory: civilizationMemoryGraphHonesty(),
      culturalIntelligence: globalCulturalIntelligenceHonesty(),
      shiftScheduler: verifiedAutonomousShiftSchedulerHonesty(),
      pluginExchange: pluginIntelligenceExchangeHonesty(),
      computeOptimization: heterogeneousComputeOptimizationHonesty(),
      sovereignPrivacy: sovereignPrivacySecurityKernelHonesty(),
    },
  };
}

export async function bootstrapUniversalAgentRuntimeOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DnActor;
  repoRoot?: string;
}): Promise<UniversalAgentRuntimeOs> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.systems.find(
    (s) =>
      s.orgId === input.orgId &&
      s.tenantId === input.tenantId &&
      s.universeId === input.universeId,
  );
  if (existing) return existing;
  const system: UniversalAgentRuntimeOs = {
    id: id('dnruntime'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer: detectPredecessorLayer(input.repoRoot),
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    fullProductionDnShipped: false,
    coexistenceNotMegaMerge: true,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(system);
  await save(input.root, store);
  return system;
}

export async function registerRuntimeSurface(input: {
  osId: string;
  surface: RuntimeSurfaceId;
  root: string;
  actor: DnActor;
}): Promise<{ accepted: boolean; reason: string; surface?: RuntimeSurfaceContract }> {
  void input.actor;
  const store = await load(input.root);
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'RUNTIME_OS_NOT_FOUND' };
  if (store.surfaces.length >= MAX_RUNTIME_SURFACES) {
    return { accepted: false, reason: 'MAX_RUNTIME_SURFACES_REACHED' };
  }
  const surface: RuntimeSurfaceContract = {
    id: id('dnsurf'),
    osId: input.osId,
    surface: input.surface,
    status: 'CONTRACT_ONLY',
    reason: 'RUNTIME_SURFACE_CONTRACT_ONLY_NOT_PRODUCTION',
    createdAt: new Date().toISOString(),
  };
  store.surfaces.push(surface);
  await save(input.root, store);
  return { accepted: true, reason: surface.reason, surface };
}

export async function attemptRuntimeOnboarding(input: {
  osId: string;
  declaredAgeYears: number | null;
  root: string;
  actor: DnActor;
}): Promise<{ accepted: boolean; reason: string; attempt: RuntimeOnboardingAttempt }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) {
    const attempt: RuntimeOnboardingAttempt = {
      id: id('dnonb'),
      osId: input.osId,
      declaredAgeYears: input.declaredAgeYears,
      status: 'denied',
      reason: 'RUNTIME_OS_NOT_FOUND',
      adultConfirmed: false,
      at: now,
    };
    store.onboardings.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt };
  }

  const age = input.declaredAgeYears;
  if (age == null || !Number.isFinite(age) || age < ADULT_MIN_AGE_YEARS) {
    const attempt: RuntimeOnboardingAttempt = {
      id: id('dnonb'),
      osId: input.osId,
      declaredAgeYears: age,
      status: 'denied',
      reason: UNDER_18_DENIED,
      adultConfirmed: false,
      at: now,
    };
    store.onboardings.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt };
  }

  const attempt: RuntimeOnboardingAttempt = {
    id: id('dnonb'),
    osId: input.osId,
    declaredAgeYears: age,
    status: 'admitted',
    reason: 'ADULT_18_PLUS_CONFIRMED_CONTRACT_ONLY',
    adultConfirmed: true,
    at: now,
  };
  store.onboardings.push(attempt);
  await save(input.root, store);
  return { accepted: true, reason: attempt.reason, attempt };
}
