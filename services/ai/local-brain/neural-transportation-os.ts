/**
 * 62L-DL Neural Transportation OS —
 * Cohesive transport OS extending DK Unified Intelligence Neural Highway layer.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { businessMediaSocialGraphHonesty } from './business-media-social-graph';
import { distributedEdgeMicroserverFabricHonesty } from './distributed-edge-microserver-fabric';
import { historicalTechnologyMemoryLakeHonesty } from './historical-technology-memory-lake';
import { neuralHighwayTransportGovernorHonesty } from './neural-highway-transport-governor';
import {
  ADULT_MIN_AGE_YEARS,
  DL_LOCKS,
  HONESTY_BANNER,
  MAX_TRANSPORT_OS_SURFACES,
  NEXT_PHASE_TITLE,
  type DlActor,
  type TransportSurfaceId,
} from './neural-transportation-os-types';
import { supplyChainIntelligenceHighwayHonesty } from './supply-chain-intelligence-highway';
import { verifiedAlwaysOnAgentShiftNetworkHonesty } from './verified-always-on-agent-shift-network';
import { zeroTrustPrivacyUniverseGatewayHonesty } from './zero-trust-privacy-universe-gateway';

export type NeuralTransportationOs = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: 'DK' | 'DJ' | 'DI' | 'DH' | 'DG' | 'DF' | 'DE' | 'DD' | 'DA' | 'NONE';
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  fullProductionTransportOsShipped: false;
  createdAt: string;
};

export type TransportOsSurfaceContract = {
  id: string;
  osId: string;
  surface: TransportSurfaceId;
  status: 'CONTRACT_ONLY' | 'STUB' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type TransportOsOnboardingAttempt = {
  id: string;
  osId: string;
  declaredAgeYears: number | null;
  status: 'admitted' | 'denied';
  reason: string;
  adultConfirmed: boolean;
  at: string;
};

type Store = {
  systems: NeuralTransportationOs[];
  surfaces: TransportOsSurfaceContract[];
  onboardings: TransportOsOnboardingAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'neural-transportation-os.json');
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

function detectPredecessor(repoRoot: string): NeuralTransportationOs['predecessorLayer'] {
  const lb = join(repoRoot, 'services/ai/local-brain');
  const ops = join(repoRoot, 'docs/operations');
  const has = (dir: string, file: string) => existsSync(join(dir, file));
  if (
    has(lb, 'unified-intelligence-experience-os-types.ts') ||
    has(ops, '62L_DK_UNIFIED_INTELLIGENCE_NEURAL_HIGHWAY_REPORT.md')
  ) {
    return 'DK';
  }
  if (has(lb, 'personal-intelligence-command-os-types.ts')) return 'DJ';
  if (has(lb, 'personalized-intelligence-companion-os-types.ts')) return 'DI';
  if (has(lb, 'adaptive-life-business-intelligence-os-types.ts')) return 'DH';
  if (has(lb, 'universal-personal-business-ai-os-types.ts')) return 'DG';
  if (has(lb, 'human-centered-superbrain-ux-types.ts')) return 'DF';
  if (has(lb, 'knowledge-exchange-gateway-marketplace-types.ts')) return 'DE';
  if (has(lb, 'cognitive-service-mesh-types.ts')) return 'DD';
  if (has(lb, 'superbrain-runtime-kernel-types.ts')) return 'DA';
  return 'NONE';
}

export function neuralTransportationOsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DL_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DL_LOCKS.TIP_LAND,
    productionAuthorization: DL_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DL_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DL_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    learningEqPermission: DL_LOCKS.LEARNING_EQ_PERMISSION,
    fullProductionTransportOsShipped: DL_LOCKS.FULL_PRODUCTION_TRANSPORT_OS_SHIPPED,
    liveSupabaseApply: DL_LOCKS.LIVE_SUPABASE_APPLY,
    megaPrBulkIncluded: DL_LOCKS.MEGA_PR_BULK_INCLUDED,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    transportGovernor: neuralHighwayTransportGovernorHonesty(),
    techLake: historicalTechnologyMemoryLakeHonesty(),
    shiftNetwork: verifiedAlwaysOnAgentShiftNetworkHonesty(),
    edgeFabric: distributedEdgeMicroserverFabricHonesty(),
    privacyGateway: zeroTrustPrivacyUniverseGatewayHonesty(),
    businessMediaGraph: businessMediaSocialGraphHonesty(),
    supplyHighway: supplyChainIntelligenceHighwayHonesty(),
  };
}

export async function bootstrapNeuralTransportationOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DlActor;
  repoRoot?: string;
}): Promise<NeuralTransportationOs> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.systems.find(
    (s) =>
      s.orgId === input.orgId &&
      s.tenantId === input.tenantId &&
      s.universeId === input.universeId,
  );
  if (existing) return existing;
  const os: NeuralTransportationOs = {
    id: id('dltos'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer: detectPredecessor(input.repoRoot ?? input.root),
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    fullProductionTransportOsShipped: false,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(os);
  await save(input.root, store);
  return os;
}

export async function registerTransportOsSurface(input: {
  osId: string;
  surface: TransportSurfaceId;
  root: string;
  actor: DlActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  surface?: TransportOsSurfaceContract;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'OS_NOT_FOUND', at: now };
  if (store.surfaces.length >= MAX_TRANSPORT_OS_SURFACES) {
    return { accepted: false, reason: 'MAX_TRANSPORT_OS_SURFACES_REACHED', at: now };
  }
  const surface: TransportOsSurfaceContract = {
    id: id('dlsurf'),
    osId: input.osId,
    surface: input.surface,
    status: 'CONTRACT_ONLY',
    reason: 'TRANSPORT_OS_SURFACE_CONTRACT_ONLY_NOT_FULL_PRODUCTION_SHIP',
    createdAt: now,
  };
  store.surfaces.push(surface);
  await save(input.root, store);
  return { accepted: true, reason: surface.reason, surface, at: now };
}

export async function attemptTransportOsAdultOnboarding(input: {
  osId: string;
  declaredAgeYears?: number | null;
  root: string;
  actor: DlActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  attempt?: TransportOsOnboardingAttempt;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const os = store.systems.find((s) => s.id === input.osId);
  if (!os) return { accepted: false, reason: 'OS_NOT_FOUND', at: now };
  const age =
    input.declaredAgeYears === undefined
      ? (input.actor.declaredAgeYears ?? null)
      : input.declaredAgeYears;
  const adult = typeof age === 'number' && age >= ADULT_MIN_AGE_YEARS;
  const attempt: TransportOsOnboardingAttempt = {
    id: id('dlonb'),
    osId: input.osId,
    declaredAgeYears: age,
    status: adult ? 'admitted' : 'denied',
    reason: adult
      ? 'ADULT_ONBOARDING_ADMITTED'
      : 'UNDER_18_OR_UNDECLARED_AGE_DENIED_WHERE_APPLICABLE',
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
