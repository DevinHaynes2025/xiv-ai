/**
 * 62L-DF Human-Centered Superbrain UX OS —
 * Mobile-first personal/business Universes; onboarding; Home/Today; Agent Workforce;
 * Overnight Brief; Evidence Drawer; predictive-scenario screens; community/expert;
 * localization; Agent Team Room — as contracts/stubs (not full production UX shipped).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ADULT_MIN_AGE_YEARS,
  DF_LOCKS,
  HONESTY_BANNER,
  MAX_UX_SCREENS,
  NEXT_PHASE_TITLE,
  UNDER_18_ONBOARDING_DENIED,
  WORMHOLE_BYPASS_DENIED,
  type DfActor,
  type UniverseKind,
  type UxScreenId,
} from './human-centered-superbrain-ux-types';
import { globalPersonalAgentWorkforceHonesty } from './global-personal-agent-workforce';
import { historicalAtlasQuantHonesty } from './historical-data-atlas-predictive-quant-engine';
import { ethicalSecurityDiscoveryLabHonesty } from './ethical-security-discovery-lab';
import { neuralGrowthLedgerHonesty } from './neural-growth-ledger';
import { agentMeetingCommunicationFabricHonesty } from './agent-meeting-communication-fabric';

export type HumanCenteredSuperbrainUxOs = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  universeKind: UniverseKind;
  predecessorLayer: 'DE' | 'DD' | 'DC' | 'DB' | 'DA' | 'CZ' | 'CY' | 'NONE';
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  fullProductionUxShipped: false;
  createdAt: string;
};

export type UxScreenContract = {
  id: string;
  osId: string;
  screen: UxScreenId;
  locale: string;
  mobileFirst: true;
  status: 'CONTRACT_ONLY' | 'STUB' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type OnboardingAttempt = {
  id: string;
  osId: string;
  declaredAgeYears: number | null;
  status: 'admitted' | 'denied';
  reason: string;
  adultConfirmed: boolean;
  at: string;
};

export type WormholePathAttempt = {
  id: string;
  osId: string;
  pathId: string;
  authorized: boolean;
  bypassSealedAttempted: boolean;
  bypassAuthAttempted: boolean;
  status: 'ALLOWED' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  systems: HumanCenteredSuperbrainUxOs[];
  screens: UxScreenContract[];
  onboardings: OnboardingAttempt[];
  wormholes: WormholePathAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'human-centered-superbrain-ux-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    systems: [],
    screens: [],
    onboardings: [],
    wormholes: [],
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
): HumanCenteredSuperbrainUxOs['predecessorLayer'] {
  const brain = resolveBrainPath(repoRoot);
  if (existsSync(join(brain, 'knowledge-exchange-gateway-marketplace-types.ts'))) return 'DE';
  if (existsSync(join(brain, 'cognitive-service-mesh-types.ts'))) return 'DD';
  if (existsSync(join(brain, 'superbrain-service-fabric-types.ts'))) return 'DC';
  if (existsSync(join(brain, 'superbrain-control-plane-types.ts'))) return 'DB';
  if (existsSync(join(brain, 'superbrain-runtime-kernel-types.ts'))) return 'DA';
  if (existsSync(join(brain, 'intelligence-civilization-kernel-types.ts'))) return 'CZ';
  if (existsSync(join(brain, 'knowledge-colony-operating-system-types.ts'))) return 'CY';
  return 'NONE';
}

export function humanCenteredSuperbrainUxHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DF_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DF_LOCKS.TIP_LAND,
    productionAuthorization: DF_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DF_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DF_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionUxShipped: DF_LOCKS.FULL_PRODUCTION_UX_SHIPPED,
    uxContractsBounded: DF_LOCKS.UX_CONTRACTS_BOUNDED_TYPESCRIPT_DOCS,
    adult18PlusRequired: DF_LOCKS.ADULT_18_PLUS_REQUIRED,
    wormholeBypassSealedAuth: DF_LOCKS.WORMHOLE_BYPASS_SEALED_AUTH,
    sealedSilentCloudFallback: DF_LOCKS.SEALED_SILENT_CLOUD_FALLBACK,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    subsystems: {
      workforce: globalPersonalAgentWorkforceHonesty(),
      atlasQuant: historicalAtlasQuantHonesty(),
      ethicalSecurity: ethicalSecurityDiscoveryLabHonesty(),
      neuralGrowth: neuralGrowthLedgerHonesty(),
      meetingFabric: agentMeetingCommunicationFabricHonesty(),
    },
  };
}

export async function bootstrapHumanCenteredSuperbrainUxOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  universeKind?: UniverseKind;
  root: string;
  actor: DfActor;
  repoRoot?: string;
}): Promise<HumanCenteredSuperbrainUxOs> {
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

  if (predecessorLayer === 'DE') {
    try {
      const deMod = join(brain, 'knowledge-exchange-gateway-marketplace.ts');
      if (existsSync(deMod)) {
        const de = await import(deMod);
        if (typeof de.bootstrapKnowledgeExchangeGatewayMarketplace === 'function') {
          await de.bootstrapKnowledgeExchangeGatewayMarketplace({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'knowledge_exchange_curator',
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
  } else if (predecessorLayer === 'DD') {
    try {
      const ddMod = join(brain, 'cognitive-service-mesh.ts');
      if (existsSync(ddMod)) {
        const dd = await import(ddMod);
        if (typeof dd.bootstrapCognitiveServiceMesh === 'function') {
          await dd.bootstrapCognitiveServiceMesh({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'mesh_curator',
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
  } else if (predecessorLayer === 'CY') {
    try {
      const cyMod = join(brain, 'knowledge-colony-operating-system.ts');
      if (existsSync(cyMod)) {
        const cy = await import(cyMod);
        if (typeof cy.bootstrapKnowledgeColonyOperatingSystem === 'function') {
          await cy.bootstrapKnowledgeColonyOperatingSystem({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'colony_os_curator',
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

  const system: HumanCenteredSuperbrainUxOs = {
    id: id('dfux'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    universeKind: input.universeKind ?? 'personal',
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

export async function registerUxScreenContract(input: {
  osId: string;
  screen: UxScreenId;
  locale?: string;
  root: string;
  actor: DfActor;
}): Promise<{ accepted: boolean; reason: string; contract?: UxScreenContract; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'UX_OS_NOT_FOUND', at: now };
  if (store.screens.length >= MAX_UX_SCREENS) {
    return { accepted: false, reason: 'MAX_UX_SCREENS_BOUNDED', at: now };
  }
  const contract: UxScreenContract = {
    id: id('dfsc'),
    osId: os.id,
    screen: input.screen,
    locale: (input.locale ?? 'en').trim() || 'en',
    mobileFirst: true,
    status: 'CONTRACT_ONLY',
    reason: 'UX_SCREEN_CONTRACT_STUB_NOT_FULL_PRODUCTION_UX',
    createdAt: now,
  };
  store.screens.push(contract);
  await save(input.root, store);
  return { accepted: true, reason: contract.reason, contract, at: now };
}

export async function attemptPersonalOnboarding(input: {
  osId: string;
  declaredAgeYears?: number | null;
  root: string;
  actor: DfActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: OnboardingAttempt; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'UX_OS_NOT_FOUND', at: now };

  const age =
    typeof input.declaredAgeYears === 'number'
      ? input.declaredAgeYears
      : typeof input.actor.declaredAgeYears === 'number'
        ? input.actor.declaredAgeYears
        : null;

  if (age === null || !Number.isFinite(age) || age < ADULT_MIN_AGE_YEARS) {
    const attempt: OnboardingAttempt = {
      id: id('dfon'),
      osId: os.id,
      declaredAgeYears: age,
      status: 'denied',
      reason: UNDER_18_ONBOARDING_DENIED,
      adultConfirmed: false,
      at: now,
    };
    store.onboardings.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt, at: now };
  }

  const attempt: OnboardingAttempt = {
    id: id('dfon'),
    osId: os.id,
    declaredAgeYears: age,
    status: 'admitted',
    reason: 'ADULT_18_PLUS_ONBOARDING_CONTRACT_ADMITTED',
    adultConfirmed: true,
    at: now,
  };
  store.onboardings.push(attempt);
  await save(input.root, store);
  return { accepted: true, reason: attempt.reason, attempt, at: now };
}

export async function invokeWormholeFastPath(input: {
  osId: string;
  pathId: string;
  authorized?: boolean;
  bypassSealed?: boolean;
  bypassAuth?: boolean;
  root: string;
  actor: DfActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: WormholePathAttempt; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'UX_OS_NOT_FOUND', at: now };

  const bypassSealed = input.bypassSealed === true;
  const bypassAuth = input.bypassAuth === true;
  const authorized = input.authorized === true;

  if (bypassSealed || bypassAuth || DF_LOCKS.WORMHOLE_BYPASS_SEALED_AUTH || !authorized) {
    const attempt: WormholePathAttempt = {
      id: id('dfwh'),
      osId: os.id,
      pathId: (input.pathId ?? '').trim() || 'unnamed-path',
      authorized,
      bypassSealedAttempted: bypassSealed,
      bypassAuthAttempted: bypassAuth,
      status: 'DENIED',
      reason: WORMHOLE_BYPASS_DENIED,
      at: now,
    };
    store.wormholes.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt, at: now };
  }

  const attempt: WormholePathAttempt = {
    id: id('dfwh'),
    osId: os.id,
    pathId: (input.pathId ?? '').trim() || 'unnamed-path',
    authorized: true,
    bypassSealedAttempted: false,
    bypassAuthAttempted: false,
    status: 'ALLOWED',
    reason: 'AUTHORIZED_WORMHOLE_FAST_PATH_WITHIN_SEALED_AUTH_SCOPE',
    at: now,
  };
  store.wormholes.push(attempt);
  await save(input.root, store);
  return { accepted: true, reason: attempt.reason, attempt, at: now };
}
