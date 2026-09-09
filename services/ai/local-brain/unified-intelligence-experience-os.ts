/**
 * 62L-DK Unified Intelligence Experience OS —
 * Cohesive experience OS continuing over DJ command layer (soft-wire when PRESENT).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { businessMediaSupplyChainHonesty } from './business-media-supply-chain-foundation';
import { globalTechHistoryAtlasHonesty } from './global-tech-history-atlas';
import { neuralHighwayExpansionHonesty } from './neural-highway-expansion';
import { offlineAgentVerificationHonesty } from './offline-agent-verification-harness';
import { privacySecurityUniverseFabricHonesty } from './privacy-security-universe-fabric';
import {
  ADULT_MIN_AGE_YEARS,
  DK_LOCKS,
  HONESTY_BANNER,
  MAX_EXPERIENCE_SURFACES,
  METAPHOR_ARCHITECTURE,
  NEXT_PHASE_TITLE,
  type DkActor,
  type ExperienceSurfaceId,
} from './unified-intelligence-experience-os-types';

export type UnifiedIntelligenceExperienceOs = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: 'DJ' | 'DI' | 'DH' | 'DG' | 'DF' | 'DE' | 'DD' | 'DA' | 'NONE';
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  fullProductionExperienceOsShipped: false;
  createdAt: string;
};

export type ExperienceSurfaceContract = {
  id: string;
  osId: string;
  surface: ExperienceSurfaceId;
  status: 'CONTRACT_ONLY' | 'STUB' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type ExperienceOnboardingAttempt = {
  id: string;
  osId: string;
  declaredAgeYears: number | null;
  status: 'admitted' | 'denied';
  reason: string;
  adultConfirmed: boolean;
  at: string;
};

type Store = {
  systems: UnifiedIntelligenceExperienceOs[];
  surfaces: ExperienceSurfaceContract[];
  onboardings: ExperienceOnboardingAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'unified-intelligence-experience-os.json');
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
): UnifiedIntelligenceExperienceOs['predecessorLayer'] {
  const brain = resolveBrainPath(repoRoot);
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

export function unifiedIntelligenceExperienceOsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DK_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DK_LOCKS.TIP_LAND,
    productionAuthorization: DK_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DK_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DK_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionExperienceOsShipped: DK_LOCKS.FULL_PRODUCTION_EXPERIENCE_OS_SHIPPED,
    experienceOsContractsBounded: DK_LOCKS.EXPERIENCE_OS_CONTRACTS_BOUNDED,
    liveSupabaseApply: DK_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DK_LOCKS.DB_CANDIDATES_APPLIED,
    metaphorArchitecture: METAPHOR_ARCHITECTURE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    subsystems: {
      neuralHighway: neuralHighwayExpansionHonesty(),
      techHistoryAtlas: globalTechHistoryAtlasHonesty(),
      offlineAgentVerification: offlineAgentVerificationHonesty(),
      privacySecurityUniverse: privacySecurityUniverseFabricHonesty(),
      businessMediaSupplyChain: businessMediaSupplyChainHonesty(),
    },
  };
}

export async function bootstrapUnifiedIntelligenceExperienceOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DkActor;
  repoRoot?: string;
}): Promise<UnifiedIntelligenceExperienceOs> {
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

  // Soft-wire preferred DJ command layer when PRESENT; else DI → DH → DG → DF.
  if (predecessorLayer === 'DJ') {
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
  } else if (predecessorLayer === 'DF') {
    try {
      const mod = join(brain, 'human-centered-superbrain-ux-os.ts');
      if (existsSync(mod)) {
        const df = await import(mod);
        if (typeof df.bootstrapHumanCenteredSuperbrainUxOs === 'function') {
          await df.bootstrapHumanCenteredSuperbrainUxOs({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            universeKind: 'personal',
            root: input.root,
            actor: {
              kind: 'ux_curator',
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

  const os: UnifiedIntelligenceExperienceOs = {
    id: id('dkos'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    fullProductionExperienceOsShipped: false,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(os);
  await save(input.root, store);
  return os;
}

export async function registerExperienceSurface(input: {
  osId: string;
  surface: ExperienceSurfaceId;
  root: string;
  actor: DkActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  contract?: ExperienceSurfaceContract;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'OS_NOT_FOUND', at: now };
  if (store.surfaces.length >= MAX_EXPERIENCE_SURFACES) {
    return { accepted: false, reason: 'MAX_EXPERIENCE_SURFACES_REACHED', at: now };
  }
  const contract: ExperienceSurfaceContract = {
    id: id('dksurf'),
    osId: input.osId,
    surface: input.surface,
    status: 'CONTRACT_ONLY',
    reason: 'EXPERIENCE_SURFACE_CONTRACT_ONLY_NOT_FULL_PRODUCTION_SHIP',
    createdAt: now,
  };
  store.surfaces.push(contract);
  await save(input.root, store);
  return { accepted: true, reason: contract.reason, contract, at: now };
}

export async function attemptExperienceOnboarding(input: {
  osId: string;
  declaredAgeYears: number;
  root: string;
  actor: DkActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  attempt?: ExperienceOnboardingAttempt;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'OS_NOT_FOUND', at: now };

  const adult = input.declaredAgeYears >= ADULT_MIN_AGE_YEARS;
  const attempt: ExperienceOnboardingAttempt = {
    id: id('dkonb'),
    osId: input.osId,
    declaredAgeYears: input.declaredAgeYears,
    status: adult ? 'admitted' : 'denied',
    reason: adult
      ? 'ADULT_EXPERIENCE_ONBOARDING_ADMITTED'
      : 'UNDER_18_EXPERIENCE_ONBOARDING_DENIED',
    adultConfirmed: adult,
    at: now,
  };
  store.onboardings.push(attempt);
  await save(input.root, store);
  return {
    accepted: adult,
    reason: attempt.reason,
    attempt,
    at: now,
  };
}
