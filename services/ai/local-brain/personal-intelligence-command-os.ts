/**
 * 62L-DJ Personal Intelligence Command OS —
 * Cohesive command system UX (not disconnected dashboards).
 * Bounded contracts/stubs — not full production Command OS shipped.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ADULT_MIN_AGE_YEARS,
  DJ_LOCKS,
  HONESTY_BANNER,
  MAX_COMMAND_SURFACES,
  NEXT_PHASE_TITLE,
  SILENT_PERMISSION_INHERITANCE_DENIED,
  type CommandSurfaceId,
  type DjActor,
} from './personal-intelligence-command-os-types';
import { predictiveStorylineEngineHonesty } from './predictive-storyline-engine';
import { historicalPatternMemoryCortexHonesty } from './historical-pattern-memory-cortex';
import { decisionScenarioControlTowerHonesty } from './decision-scenario-control-tower';
import { agentTeamOperatingMarketplaceHonesty } from './agent-team-operating-marketplace';
import { globalCollaborationKnowledgeRoomsHonesty } from './global-collaboration-knowledge-rooms';
import { continuousProductExperienceLearningFabricHonesty } from './continuous-product-experience-learning-fabric';

export type PersonalIntelligenceCommandOs = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: 'DI' | 'DH' | 'DG' | 'DF' | 'DE' | 'DD' | 'DA' | 'NONE';
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  fullProductionCommandOsShipped: false;
  cohesiveCommandUx: true;
  createdAt: string;
};

export type CommandSurfaceContract = {
  id: string;
  osId: string;
  surface: CommandSurfaceId;
  status: 'CONTRACT_ONLY' | 'STUB' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type PermissionGrantAttempt = {
  id: string;
  osId: string;
  actorId: string;
  inheritedFrom: string | null;
  silentInheritanceAttempted: boolean;
  explicitGrant: boolean;
  status: 'GRANTED' | 'DENIED';
  reason: string;
  at: string;
};

export type OvernightWorkAttempt = {
  id: string;
  osId: string;
  poweredNodePresent: boolean;
  authorizedPoweredNode: boolean;
  status: 'WAITING_NODE' | 'OFFLINE_STOPPED' | 'SCHEDULED' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  systems: PersonalIntelligenceCommandOs[];
  surfaces: CommandSurfaceContract[];
  permissions: PermissionGrantAttempt[];
  overnight: OvernightWorkAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'personal-intelligence-command-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    systems: [],
    surfaces: [],
    permissions: [],
    overnight: [],
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
): PersonalIntelligenceCommandOs['predecessorLayer'] {
  const brain = resolveBrainPath(repoRoot);
  if (existsSync(join(brain, 'personalized-intelligence-companion-os-types.ts'))) return 'DI';
  if (
    existsSync(join(brain, 'unified-intelligence-companion-os-types.ts')) ||
    existsSync(join(brain, 'adaptive-life-business-intelligence-os-types.ts'))
  )
    return 'DH';
  if (existsSync(join(brain, 'universal-personal-business-ai-os-types.ts'))) return 'DG';
  if (existsSync(join(brain, 'human-centered-superbrain-ux-types.ts'))) return 'DF';
  if (existsSync(join(brain, 'knowledge-exchange-gateway-marketplace-types.ts'))) return 'DE';
  if (existsSync(join(brain, 'cognitive-service-mesh-types.ts'))) return 'DD';
  if (existsSync(join(brain, 'superbrain-runtime-kernel-types.ts'))) return 'DA';
  return 'NONE';
}

export function personalIntelligenceCommandOsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DJ_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DJ_LOCKS.TIP_LAND,
    productionAuthorization: DJ_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DJ_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DJ_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionCommandOsShipped: DJ_LOCKS.FULL_PRODUCTION_COMMAND_OS_SHIPPED,
    silentPermissionInheritance: DJ_LOCKS.SILENT_PERMISSION_INHERITANCE,
    fabricatedRuntimeState: DJ_LOCKS.FABRICATED_RUNTIME_STATE,
    adult18PlusRequired: DJ_LOCKS.ADULT_18_PLUS_REQUIRED,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    subsystems: {
      storyline: predictiveStorylineEngineHonesty(),
      patternMemory: historicalPatternMemoryCortexHonesty(),
      controlTower: decisionScenarioControlTowerHonesty(),
      marketplace: agentTeamOperatingMarketplaceHonesty(),
      collaboration: globalCollaborationKnowledgeRoomsHonesty(),
      uxLearning: continuousProductExperienceLearningFabricHonesty(),
    },
  };
}

export async function bootstrapPersonalIntelligenceCommandOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DjActor;
  repoRoot?: string;
}): Promise<PersonalIntelligenceCommandOs> {
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

  // Soft-wire preferred predecessors when PRESENT (optional coexistence).
  const softWireCandidates: Array<{ layer: string; file: string; fn: string }> = [
    {
      layer: 'DI',
      file: 'personalized-intelligence-companion-os.ts',
      fn: 'bootstrapPersonalizedIntelligenceCompanionOs',
    },
    {
      layer: 'DH',
      file: 'unified-intelligence-companion-os.ts',
      fn: 'bootstrapUnifiedIntelligenceCompanionOs',
    },
    {
      layer: 'DG',
      file: 'universal-personal-business-ai-os.ts',
      fn: 'bootstrapUniversalPersonalBusinessAiOs',
    },
    {
      layer: 'DF',
      file: 'human-centered-superbrain-ux-os.ts',
      fn: 'bootstrapHumanCenteredSuperbrainUxOs',
    },
  ];

  for (const cand of softWireCandidates) {
    if (predecessorLayer !== cand.layer && predecessorLayer !== 'DI') {
      // Prefer highest available; soft-wire only the detected layer.
      if (cand.layer !== predecessorLayer) continue;
    }
    if (cand.layer !== predecessorLayer) continue;
    try {
      const modPath = join(brain, cand.file);
      if (existsSync(modPath)) {
        const mod = await import(modPath);
        if (typeof mod[cand.fn] === 'function') {
          await mod[cand.fn]({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: input.actor,
            repoRoot: input.repoRoot,
          });
        }
      }
    } catch {
      // Soft-wire optional.
    }
  }

  const system: PersonalIntelligenceCommandOs = {
    id: id('djcmd'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    fullProductionCommandOsShipped: false,
    cohesiveCommandUx: true,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(system);
  await save(input.root, store);
  return system;
}

export async function registerCommandSurface(input: {
  osId: string;
  surface: CommandSurfaceId;
  root: string;
  actor: DjActor;
}): Promise<{ accepted: boolean; reason: string; contract?: CommandSurfaceContract; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'COMMAND_OS_NOT_FOUND', at: now };
  if (store.surfaces.length >= MAX_COMMAND_SURFACES) {
    return { accepted: false, reason: 'MAX_COMMAND_SURFACES_BOUNDED', at: now };
  }
  const contract: CommandSurfaceContract = {
    id: id('djsurf'),
    osId: os.id,
    surface: input.surface,
    status: 'CONTRACT_ONLY',
    reason: 'BOUNDED_COMMAND_SURFACE_CONTRACT',
    createdAt: now,
  };
  store.surfaces.push(contract);
  await save(input.root, store);
  return { accepted: true, reason: 'COMMAND_SURFACE_REGISTERED', contract, at: now };
}

export async function attemptPermissionGrant(input: {
  osId: string;
  actorId: string;
  inheritedFrom?: string;
  silentInheritance?: boolean;
  explicitGrant?: boolean;
  root: string;
  actor: DjActor;
}): Promise<{ accepted: boolean; reason: string; grant?: PermissionGrantAttempt; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'COMMAND_OS_NOT_FOUND', at: now };

  const silent = input.silentInheritance === true;
  const explicit = input.explicitGrant === true;

  if (silent || (input.inheritedFrom && !explicit)) {
    const grant: PermissionGrantAttempt = {
      id: id('djperm'),
      osId: os.id,
      actorId: input.actorId,
      inheritedFrom: input.inheritedFrom ?? null,
      silentInheritanceAttempted: true,
      explicitGrant: false,
      status: 'DENIED',
      reason: SILENT_PERMISSION_INHERITANCE_DENIED,
      at: now,
    };
    store.permissions.push(grant);
    await save(input.root, store);
    return { accepted: false, reason: SILENT_PERMISSION_INHERITANCE_DENIED, grant, at: now };
  }

  if (!explicit) {
    const grant: PermissionGrantAttempt = {
      id: id('djperm'),
      osId: os.id,
      actorId: input.actorId,
      inheritedFrom: null,
      silentInheritanceAttempted: false,
      explicitGrant: false,
      status: 'DENIED',
      reason: SILENT_PERMISSION_INHERITANCE_DENIED,
      at: now,
    };
    store.permissions.push(grant);
    await save(input.root, store);
    return { accepted: false, reason: SILENT_PERMISSION_INHERITANCE_DENIED, grant, at: now };
  }

  const grant: PermissionGrantAttempt = {
    id: id('djperm'),
    osId: os.id,
    actorId: input.actorId,
    inheritedFrom: null,
    silentInheritanceAttempted: false,
    explicitGrant: true,
    status: 'GRANTED',
    reason: 'EXPLICIT_PERMISSION_GRANT_RECORDED',
    at: now,
  };
  store.permissions.push(grant);
  await save(input.root, store);
  return { accepted: true, reason: 'EXPLICIT_PERMISSION_GRANT_RECORDED', grant, at: now };
}

export async function scheduleOvernightWork(input: {
  osId: string;
  poweredNodePresent?: boolean;
  authorizedPoweredNode?: boolean;
  root: string;
  actor: DjActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  attempt?: OvernightWorkAttempt;
  status: OvernightWorkAttempt['status'];
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) {
    return {
      accepted: false,
      reason: 'COMMAND_OS_NOT_FOUND',
      status: 'DENIED',
      at: now,
    };
  }

  const powered = input.poweredNodePresent === true && input.authorizedPoweredNode === true;
  if (!powered) {
    const status: OvernightWorkAttempt['status'] =
      input.poweredNodePresent === false ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    const attempt: OvernightWorkAttempt = {
      id: id('djnight'),
      osId: os.id,
      poweredNodePresent: input.poweredNodePresent === true,
      authorizedPoweredNode: input.authorizedPoweredNode === true,
      status,
      reason: 'OVERNIGHT_WITHOUT_POWERED_NODE_WAITING_NODE_OR_OFFLINE_STOPPED',
      at: now,
    };
    store.overnight.push(attempt);
    await save(input.root, store);
    return {
      accepted: false,
      reason: attempt.reason,
      attempt,
      status,
      at: now,
    };
  }

  const attempt: OvernightWorkAttempt = {
    id: id('djnight'),
    osId: os.id,
    poweredNodePresent: true,
    authorizedPoweredNode: true,
    status: 'SCHEDULED',
    reason: 'OVERNIGHT_AUTHORIZED_POWERED_NODE_SCHEDULED',
    at: now,
  };
  store.overnight.push(attempt);
  await save(input.root, store);
  return {
    accepted: true,
    reason: attempt.reason,
    attempt,
    status: 'SCHEDULED',
    at: now,
  };
}

export async function attemptAdultGate(input: {
  declaredAgeYears: number | null;
}): Promise<{ accepted: boolean; reason: string }> {
  if (
    input.declaredAgeYears == null ||
    !Number.isFinite(input.declaredAgeYears) ||
    input.declaredAgeYears < ADULT_MIN_AGE_YEARS
  ) {
    return { accepted: false, reason: 'UNDER_18_OR_UNKNOWN_AGE_DENIED' };
  }
  return { accepted: true, reason: 'ADULT_18_PLUS_ADMITTED' };
}
