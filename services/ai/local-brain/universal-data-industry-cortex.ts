/**
 * 62L-DV Universal Data & Industry Cortex —
 * Governed data/industry cortex soft-wired over DU→DT→DS when PRESENT.
 */

import { adultTrustCircleHonesty } from './adult-trust-circle-social-fabric';
import { cortexFoundationHonesty } from './cortex-foundation';
import {
  crossDeviceAgentSuperhighwayHonesty,
} from './cross-device-agent-superhighway';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { historicalSimulationHonesty } from './historical-simulation-engine';
import { multimodalCommandCenterHonesty } from './multimodal-command-center';
import { personalDataVaultSearchHonesty } from './personal-data-vault-search-os';
import { semiconductorIntelligenceHonesty } from './semiconductor-intelligence-brain';
import { supplyChainDigitalTwinHonesty } from './supply-chain-digital-twin-network';
import {
  DV_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PRODUCT_PHILOSOPHY,
  detectPredecessorLayer,
  type DvActor,
} from './universal-data-industry-cortex-types';

export type UniversalDataIndustryCortex = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: ReturnType<typeof detectPredecessorLayer>;
  softWiredPredecessors: string[];
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  publicLaunchAuthorized: false;
  contractPaymentAuthorized: false;
  fullProductionDataIndustryCortexShipped: false;
  productPhilosophy: typeof PRODUCT_PHILOSOPHY;
  createdAt: string;
};

type Store = {
  systems: UniversalDataIndustryCortex[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-data-industry-cortex.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { systems: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function softWireList(repoRoot?: string): string[] {
  const layer = detectPredecessorLayer(repoRoot);
  // Prefer reported soft-wires from honesty of Module H map
  const honesty = crossDeviceAgentSuperhighwayHonesty(repoRoot);
  return honesty.softWiredPredecessors.length
    ? honesty.softWiredPredecessors
    : layer === 'NONE'
      ? []
      : [layer];
}

export function universalDataIndustryCortexHonesty(repoRoot?: string) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DV_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DV_LOCKS.TIP_LAND,
    productionAuthorization: DV_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DV_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DV_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionDataIndustryCortexShipped:
      DV_LOCKS.FULL_PRODUCTION_DATA_INDUSTRY_CORTEX_SHIPPED,
    liveSupabaseApply: DV_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DV_LOCKS.DB_CANDIDATES_APPLIED,
    recommendEqCharge: DV_LOCKS.RECOMMENDATION_EQ_CHARGE,
    twinEqPhysicalControl: DV_LOCKS.TWIN_EQ_PHYSICAL_CONTROL,
    simEqVerifiedFact: DV_LOCKS.SIM_EQ_VERIFIED_FACT,
    vaultCrossContextLeakage: DV_LOCKS.VAULT_CROSS_CONTEXT_LEAKAGE,
    covertCaptureAllowed: DV_LOCKS.COVERT_CAPTURE_ALLOWED,
    minorsInTrustCircle: DV_LOCKS.MINORS_IN_TRUST_CIRCLE,
    unenrolledPeerHandoffAllowed: DV_LOCKS.UNENROLLED_PEER_HANDOFF_ALLOWED,
    digitalTwinEqFounder: DV_LOCKS.DIGITAL_TWIN_EQ_FOUNDER,
    publicLaunchAuthorized: DV_LOCKS.PUBLIC_LAUNCH_AUTHORIZED,
    contractPaymentAuthorized: DV_LOCKS.CONTRACT_PAYMENT_AUTHORIZED,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    softWiredPredecessors: softWireList(repoRoot),
    subsystems: {
      cortexFoundation: cortexFoundationHonesty(),
      personalDataVaultSearch: personalDataVaultSearchHonesty(),
      supplyChainDigitalTwin: supplyChainDigitalTwinHonesty(),
      semiconductorIntelligence: semiconductorIntelligenceHonesty(),
      historicalSimulation: historicalSimulationHonesty(),
      multimodalCommandCenter: multimodalCommandCenterHonesty(),
      adultTrustCircle: adultTrustCircleHonesty(),
      crossDeviceAgentSuperhighway: crossDeviceAgentSuperhighwayHonesty(repoRoot),
    },
  };
}

export async function bootstrapUniversalDataIndustryCortex(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DvActor;
  repoRoot?: string;
}): Promise<UniversalDataIndustryCortex> {
  const store = await load(input.root);
  void input.actor;
  const os: UniversalDataIndustryCortex = {
    id: id('dvcortexos'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer: detectPredecessorLayer(input.repoRoot),
    softWiredPredecessors: softWireList(input.repoRoot),
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    publicLaunchAuthorized: false,
    contractPaymentAuthorized: false,
    fullProductionDataIndustryCortexShipped: false,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(os);
  await save(input.root, store);
  return os;
}
