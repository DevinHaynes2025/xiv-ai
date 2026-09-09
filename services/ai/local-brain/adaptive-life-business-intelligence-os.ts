/**
 * 62L-DH Adaptive Life & Business Intelligence OS —
 * Deepens adaptive personal/business command centers over DG/DF.
 * Isolation boundaries held by default; adult 18+ where applicable.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ADULT_MIN_AGE_YEARS,
  CROSS_PERSONAL_BUSINESS_LEAK_DENIED,
  DH_LOCKS,
  HONESTY_BANNER,
  MAX_COMMAND_CENTERS,
  NEXT_PHASE_TITLE,
  UNDER_18_DENIED,
  type DhActor,
  type IntelligenceMode,
  type IsolationBoundary,
} from './adaptive-life-business-intelligence-os-types';
import { personalizedAiChiefOfStaffHonesty } from './personalized-ai-chief-of-staff-network';
import { globalHistoricalKnowledgeEngineHonesty } from './global-historical-knowledge-engine';
import { decisionSimulationStudioHonesty } from './decision-simulation-studio';
import { autonomousResearchWorkforcePlannerHonesty } from './autonomous-research-workforce-planner';
import { communityCollaborationGraphHonesty } from './community-collaboration-graph';
import { continuousUxLearningAgentEvolutionHonesty } from './continuous-ux-learning-agent-evolution-fabric';

export type AdaptiveLifeBusinessIntelligenceOs = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  mode: IntelligenceMode;
  predecessorLayer: 'DG' | 'DF' | 'DE' | 'DD' | 'DC' | 'DB' | 'DA' | 'NONE';
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  fullProductionUxShipped: false;
  createdAt: string;
};

export type CommandCenterSurface = {
  id: string;
  osId: string;
  mode: IntelligenceMode;
  surface: 'life_command' | 'business_command' | 'adaptive_brief' | 'evidence_drawer';
  status: 'CONTRACT_ONLY' | 'STUB' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type IsolationAttempt = {
  id: string;
  osId: string;
  fromBoundary: IsolationBoundary;
  toBoundary: IsolationBoundary;
  status: 'DENIED' | 'ALLOWED';
  reason: string;
  at: string;
};

export type AgeGateAttempt = {
  id: string;
  osId: string;
  declaredAgeYears: number | null;
  status: 'admitted' | 'denied';
  reason: string;
  adultConfirmed: boolean;
  at: string;
};

type Store = {
  systems: AdaptiveLifeBusinessIntelligenceOs[];
  surfaces: CommandCenterSurface[];
  isolationAttempts: IsolationAttempt[];
  ageGates: AgeGateAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'adaptive-life-business-intelligence-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    systems: [],
    surfaces: [],
    isolationAttempts: [],
    ageGates: [],
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
): AdaptiveLifeBusinessIntelligenceOs['predecessorLayer'] {
  const brain = resolveBrainPath(repoRoot);
  if (existsSync(join(brain, 'universal-personal-business-ai-os-types.ts'))) return 'DG';
  if (existsSync(join(brain, 'human-centered-superbrain-ux-types.ts'))) return 'DF';
  if (existsSync(join(brain, 'knowledge-exchange-gateway-marketplace-types.ts'))) return 'DE';
  if (existsSync(join(brain, 'cognitive-service-mesh-types.ts'))) return 'DD';
  if (existsSync(join(brain, 'superbrain-service-fabric-types.ts'))) return 'DC';
  if (existsSync(join(brain, 'superbrain-control-plane-types.ts'))) return 'DB';
  if (existsSync(join(brain, 'superbrain-runtime-kernel-types.ts'))) return 'DA';
  return 'NONE';
}

export function adaptiveLifeBusinessIntelligenceOsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DH_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DH_LOCKS.TIP_LAND,
    productionAuthorization: DH_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DH_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DH_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    personalBusinessIsolationDefault: DH_LOCKS.PERSONAL_BUSINESS_ISOLATION_DEFAULT,
    adult18PlusRequired: DH_LOCKS.ADULT_18_PLUS_REQUIRED,
    chiefOfStaffRecommendationOnly: DH_LOCKS.CHIEF_OF_STAFF_RECOMMENDATION_ONLY,
    digitalTwinEqFounder: DH_LOCKS.DIGITAL_TWIN_EQ_FOUNDER,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    subsystems: {
      chiefOfStaff: personalizedAiChiefOfStaffHonesty(),
      historicalKnowledge: globalHistoricalKnowledgeEngineHonesty(),
      decisionSim: decisionSimulationStudioHonesty(),
      researchPlanner: autonomousResearchWorkforcePlannerHonesty(),
      communityGraph: communityCollaborationGraphHonesty(),
      uxEvolution: continuousUxLearningAgentEvolutionHonesty(),
    },
  };
}

export async function bootstrapAdaptiveLifeBusinessIntelligenceOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  mode?: IntelligenceMode;
  root: string;
  actor: DhActor;
  repoRoot?: string;
}): Promise<AdaptiveLifeBusinessIntelligenceOs> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.systems.find(
    (s) =>
      s.orgId === input.orgId &&
      s.tenantId === input.tenantId &&
      s.universeId === input.universeId,
  );
  if (existing) return existing;

  const predecessorLayer = detectPredecessorLayer(input.repoRoot);
  const brain = resolveBrainPath(input.repoRoot);

  if (predecessorLayer === 'DG') {
    try {
      const dgMod = join(brain, 'universal-personal-business-ai-os.ts');
      if (existsSync(dgMod)) {
        const dg = await import(dgMod);
        if (typeof dg.bootstrapUniversalPersonalBusinessAiOs === 'function') {
          await dg.bootstrapUniversalPersonalBusinessAiOs({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'universal_os_curator',
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
  } else if (predecessorLayer === 'DF') {
    try {
      const dfMod = join(brain, 'human-centered-superbrain-ux-os.ts');
      if (existsSync(dfMod)) {
        const df = await import(dfMod);
        if (typeof df.bootstrapHumanCenteredSuperbrainUxOs === 'function') {
          await df.bootstrapHumanCenteredSuperbrainUxOs({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'ux_os_curator',
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

  const system: AdaptiveLifeBusinessIntelligenceOs = {
    id: id('dhos'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    mode: input.mode ?? 'personal',
    predecessorLayer,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    fullProductionUxShipped: false,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(system);
  await save(input.root, store);
  return system;
}

export async function registerCommandCenterSurface(input: {
  osId: string;
  mode?: IntelligenceMode;
  surface: CommandCenterSurface['surface'];
  root: string;
  actor: DhActor;
}): Promise<{ accepted: boolean; reason: string; surface?: CommandCenterSurface; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'ADAPTIVE_OS_NOT_FOUND', at: now };
  if (store.surfaces.length >= MAX_COMMAND_CENTERS) {
    return { accepted: false, reason: 'MAX_COMMAND_CENTERS_BOUNDED', at: now };
  }
  const surface: CommandCenterSurface = {
    id: id('dhcc'),
    osId: os.id,
    mode: input.mode ?? os.mode,
    surface: input.surface,
    status: 'CONTRACT_ONLY',
    reason: 'COMMAND_CENTER_SURFACE_CONTRACT_STUB_NOT_FULL_PRODUCTION_UX',
    createdAt: now,
  };
  store.surfaces.push(surface);
  await save(input.root, store);
  return { accepted: true, reason: surface.reason, surface, at: now };
}

export async function attemptCrossModePrivateAccess(input: {
  osId: string;
  fromBoundary: IsolationBoundary;
  toBoundary: IsolationBoundary;
  explicitSharedPolicy?: boolean;
  root: string;
  actor: DhActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: IsolationAttempt; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'ADAPTIVE_OS_NOT_FOUND', at: now };

  const crossPrivate =
    (input.fromBoundary === 'personal_private' && input.toBoundary === 'business_private') ||
    (input.fromBoundary === 'business_private' && input.toBoundary === 'personal_private');

  if (
    crossPrivate &&
    (DH_LOCKS.CROSS_PERSONAL_BUSINESS_PRIVATE_LEAK === false ||
      input.explicitSharedPolicy !== true)
  ) {
    const attempt: IsolationAttempt = {
      id: id('dhiso'),
      osId: os.id,
      fromBoundary: input.fromBoundary,
      toBoundary: input.toBoundary,
      status: 'DENIED',
      reason: CROSS_PERSONAL_BUSINESS_LEAK_DENIED,
      at: now,
    };
    store.isolationAttempts.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt, at: now };
  }

  const attempt: IsolationAttempt = {
    id: id('dhiso'),
    osId: os.id,
    fromBoundary: input.fromBoundary,
    toBoundary: input.toBoundary,
    status: 'ALLOWED',
    reason: 'EXPLICIT_SHARED_POLICY_ACCESS_WITHIN_ISOLATION_CONTRACT',
    at: now,
  };
  store.isolationAttempts.push(attempt);
  await save(input.root, store);
  return { accepted: true, reason: attempt.reason, attempt, at: now };
}

export async function attemptAgeGatedActivation(input: {
  osId: string;
  declaredAgeYears?: number | null;
  root: string;
  actor: DhActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: AgeGateAttempt; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'ADAPTIVE_OS_NOT_FOUND', at: now };

  const age =
    typeof input.declaredAgeYears === 'number'
      ? input.declaredAgeYears
      : typeof input.actor.declaredAgeYears === 'number'
        ? input.actor.declaredAgeYears
        : null;

  if (age === null || !Number.isFinite(age) || age < ADULT_MIN_AGE_YEARS) {
    const attempt: AgeGateAttempt = {
      id: id('dhage'),
      osId: os.id,
      declaredAgeYears: age,
      status: 'denied',
      reason: UNDER_18_DENIED,
      adultConfirmed: false,
      at: now,
    };
    store.ageGates.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt, at: now };
  }

  const attempt: AgeGateAttempt = {
    id: id('dhage'),
    osId: os.id,
    declaredAgeYears: age,
    status: 'admitted',
    reason: 'ADULT_18_PLUS_ACTIVATION_CONTRACT_ADMITTED',
    adultConfirmed: true,
    at: now,
  };
  store.ageGates.push(attempt);
  await save(input.root, store);
  return { accepted: true, reason: attempt.reason, attempt, at: now };
}
