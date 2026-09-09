/**
 * 62L-DS Revenue Intelligence OS —
 * Governed commercial execution OS soft-wired to DR → DQ → DP mesh when PRESENT.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { aiSalesWarRoomHonesty } from './ai-sales-war-room';
import { customerGrowthRetentionHonesty } from './customer-growth-retention-nervous-system';
import { dealSimulationNegotiationHonesty } from './deal-simulation-negotiation-engine';
import { executiveOperatingCadenceHonesty } from './executive-operating-cadence';
import { financialCommandBrainHonesty } from './financial-command-brain';
import { launchControlTowerHonesty } from './launch-control-tower';
import { millionStoryCoverageGraphHonesty } from './million-story-coverage-graph';
import { revenueIntelligenceSignalsHonesty } from './revenue-intelligence-signals';
import {
  DS_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  OFFLINE_STOPPED,
  OFFLINE_WAITING_NODE,
  SEALED_FOUNDER_DATA_DENIED_BY_LABEL,
  UNENROLLED_PROVIDER_UNAVAILABLE,
  detectPredecessorLayer,
  type DsActor,
} from './revenue-intelligence-os-types';

export type RevenueIntelligenceOs = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: ReturnType<typeof detectPredecessorLayer>;
  drSoftWired: boolean;
  dqSoftWired: boolean;
  dpSoftWired: boolean;
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  fullProductionRevenueIntelligenceShipped: false;
  privateUniverse: true;
  denyByDefault: true;
  createdAt: string;
};

export type SealedAccessAttempt = {
  id: string;
  resourceLabel: string;
  claimedByLabelAlone: boolean;
  status: 'denied' | 'allowed';
  reason: string;
  at: string;
};

export type ProviderEnrollmentProbe = {
  id: string;
  providerId: string;
  enrolled: boolean;
  configured: boolean;
  status: 'UNAVAILABLE' | 'AVAILABLE_ADVISORY';
  reason: string;
  at: string;
};

export type OfflineNodeProbe = {
  id: string;
  poweredAuthorizedNodePresent: boolean;
  status: 'WAITING_NODE' | 'OFFLINE_STOPPED' | 'LOCAL_PREFERRED';
  reason: string;
  at: string;
};

type Store = {
  systems: RevenueIntelligenceOs[];
  sealed: SealedAccessAttempt[];
  providers: ProviderEnrollmentProbe[];
  offline: OfflineNodeProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'revenue-intelligence-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    systems: [],
    sealed: [],
    providers: [],
    offline: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function brainDir(repoRoot?: string): string {
  return repoRoot
    ? join(repoRoot, 'services/ai/local-brain')
    : join(process.cwd(), 'services/ai/local-brain');
}

export function detectDrSoftWire(repoRoot?: string): boolean {
  const brain = brainDir(repoRoot);
  return (
    existsSync(join(brain, 'enterprise-nervous-revenue-command-types.ts')) ||
    existsSync(join(brain, 'revenue-command-center.ts'))
  );
}

export function detectDqSoftWire(repoRoot?: string): boolean {
  const brain = brainDir(repoRoot);
  return existsSync(join(brain, 'universal-integration-brain-types.ts'));
}

export function detectDpSoftWire(repoRoot?: string): boolean {
  const brain = brainDir(repoRoot);
  return (
    existsSync(join(brain, 'plugin-civilization-os-types.ts')) ||
    existsSync(join(brain, 'plugin-intelligence-mesh.ts'))
  );
}

export function revenueIntelligenceOsHonesty(repoRoot?: string) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DS_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DS_LOCKS.TIP_LAND,
    productionAuthorization: DS_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DS_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DS_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionRevenueIntelligenceShipped:
      DS_LOCKS.FULL_PRODUCTION_REVENUE_INTELLIGENCE_SHIPPED,
    liveSupabaseApply: DS_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DS_LOCKS.DB_CANDIDATES_APPLIED,
    recommendationEqCharge: DS_LOCKS.RECOMMENDATION_EQ_CHARGE,
    dealSimEqVerifiedFact: DS_LOCKS.DEAL_SIM_EQ_VERIFIED_FACT,
    launchGoEqAutoShip: DS_LOCKS.LAUNCH_GO_EQ_AUTO_SHIP,
    retentionAutoCharge: DS_LOCKS.RETENTION_AUTO_CHARGE,
    consciousnessClaimed: DS_LOCKS.CONSCIOUSNESS_CLAIMED,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    drSoftWired: detectDrSoftWire(repoRoot),
    dqSoftWired: detectDqSoftWire(repoRoot),
    dpSoftWired: detectDpSoftWire(repoRoot),
    subsystems: {
      revenueSignals: revenueIntelligenceSignalsHonesty(),
      salesWarRoom: aiSalesWarRoomHonesty(),
      executiveCadence: executiveOperatingCadenceHonesty(),
      dealSimulation: dealSimulationNegotiationHonesty(),
      financialCommand: financialCommandBrainHonesty(),
      launchControl: launchControlTowerHonesty(),
      coverageGraph: millionStoryCoverageGraphHonesty(),
      retentionNervous: customerGrowthRetentionHonesty(),
    },
  };
}

export async function bootstrapRevenueIntelligenceOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DsActor;
  repoRoot?: string;
}): Promise<RevenueIntelligenceOs> {
  const store = await load(input.root);
  void input.actor;
  const os: RevenueIntelligenceOs = {
    id: id('dsrios'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer: detectPredecessorLayer(input.repoRoot),
    drSoftWired: detectDrSoftWire(input.repoRoot),
    dqSoftWired: detectDqSoftWire(input.repoRoot),
    dpSoftWired: detectDpSoftWire(input.repoRoot),
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    fullProductionRevenueIntelligenceShipped: false,
    privateUniverse: true,
    denyByDefault: true,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(os);
  await save(input.root, store);
  return os;
}

export async function attemptSealedAccessByLabelAlone(input: {
  resourceLabel: string;
  root: string;
  actor: DsActor;
}): Promise<SealedAccessAttempt> {
  const store = await load(input.root);
  void input.actor;
  const attempt: SealedAccessAttempt = {
    id: id('dssealed'),
    resourceLabel: input.resourceLabel,
    claimedByLabelAlone: true,
    status: 'denied',
    reason: SEALED_FOUNDER_DATA_DENIED_BY_LABEL,
    at: new Date().toISOString(),
  };
  store.sealed.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function probeProviderEnrollment(input: {
  providerId: string;
  enrolled: boolean;
  configured?: boolean;
  root: string;
  actor: DsActor;
}): Promise<ProviderEnrollmentProbe> {
  const store = await load(input.root);
  void input.actor;
  const enrolled = input.enrolled === true;
  const configured = input.configured === true;
  const probe: ProviderEnrollmentProbe = {
    id: id('dsprov'),
    providerId: input.providerId,
    enrolled,
    configured,
    status: enrolled && configured ? 'AVAILABLE_ADVISORY' : 'UNAVAILABLE',
    reason:
      enrolled && configured
        ? 'PROVIDER_ENROLLED_ADVISORY_NOT_PRODUCTION_AUTHORIZED'
        : UNENROLLED_PROVIDER_UNAVAILABLE,
    at: new Date().toISOString(),
  };
  store.providers.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeOfflineAuthorizedNode(input: {
  poweredAuthorizedNodePresent: boolean;
  root: string;
  actor: DsActor;
}): Promise<OfflineNodeProbe> {
  const store = await load(input.root);
  void input.actor;
  const present = input.poweredAuthorizedNodePresent === true;
  const probe: OfflineNodeProbe = {
    id: id('dsoff'),
    poweredAuthorizedNodePresent: present,
    status: present ? 'LOCAL_PREFERRED' : 'WAITING_NODE',
    reason: present ? 'LOCAL_PREFERRED_AUTHORIZED_NODE' : OFFLINE_WAITING_NODE,
    at: new Date().toISOString(),
  };
  if (!present) {
    // Also record honest offline stop semantics when no powered node.
    probe.status = 'OFFLINE_STOPPED';
    probe.reason = `${OFFLINE_WAITING_NODE}/${OFFLINE_STOPPED}`;
  }
  store.offline.push(probe);
  await save(input.root, store);
  return probe;
}
