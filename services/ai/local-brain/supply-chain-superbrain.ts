/**
 * 62L-DW Supply Chain Superbrain OS —
 * Governed supply-chain/lakehouse/twin/edge/vault/memory/industry/multimodal
 * soft-wired over DV→DU→DT→DS when PRESENT.
 */

import { agentMemoryHighwayHonesty } from './agent-memory-highway';
import { digitalTwinSimulationFactoryHonesty } from './digital-twin-simulation-factory';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { globalIndustryKnowledgeGraphHonesty } from './global-industry-knowledge-graph';
import { personalKnowledgeVaultHonesty } from './personal-knowledge-vault';
import { semiconductorEdgeComputeControlTowerHonesty } from './semiconductor-edge-compute-control-tower';
import {
  detectDtSoftWire,
  secureMultimodalExperienceLayerHonesty,
} from './secure-multimodal-experience-layer';
import { supplyChainSuperbrainHonesty } from './supply-chain-superbrain-core';
import {
  DW_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PRODUCT_PHILOSOPHY,
  detectPredecessorLayer,
  type DwActor,
} from './supply-chain-superbrain-types';
import { universalDataLakehouseOsHonesty } from './universal-data-lakehouse-os';

export type SupplyChainSuperbrainOs = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: ReturnType<typeof detectPredecessorLayer>;
  dtSoftWired: boolean;
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  publicLaunchAuthorized: false;
  contractPaymentAuthorized: false;
  fullProductionSupplyChainSuperbrainShipped: false;
  productPhilosophy: typeof PRODUCT_PHILOSOPHY;
  createdAt: string;
};

type Store = {
  systems: SupplyChainSuperbrainOs[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'supply-chain-superbrain-os.json');
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

export function supplyChainSuperbrainOsHonesty(repoRoot?: string) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DW_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DW_LOCKS.TIP_LAND,
    productionAuthorization: DW_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DW_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DW_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionSupplyChainSuperbrainShipped:
      DW_LOCKS.FULL_PRODUCTION_SUPPLY_CHAIN_SUPERBRAIN_SHIPPED,
    liveSupabaseApply: DW_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DW_LOCKS.DB_CANDIDATES_APPLIED,
    recommendEqCharge: DW_LOCKS.RECOMMENDATION_EQ_CHARGE,
    lakehouseAutoProdDdl: DW_LOCKS.LAKEHOUSE_AUTO_PROD_DDL,
    simEqVerifiedFact: DW_LOCKS.SIM_EQ_VERIFIED_FACT,
    twinEqPhysicalControl: DW_LOCKS.TWIN_EQ_PHYSICAL_CONTROL,
    hardwareSupportWithoutProof: DW_LOCKS.HARDWARE_SUPPORT_WITHOUT_PROOF,
    unsignedMemoryHighwayAllowed: DW_LOCKS.UNSIGNED_MEMORY_HIGHWAY_ALLOWED,
    broaderIndustryBeforeSupplyChainPilot:
      DW_LOCKS.BROADER_INDUSTRY_BEFORE_SUPPLY_CHAIN_PILOT,
    biometricCameraDefaultOn: DW_LOCKS.BIOMETRIC_CAMERA_DEFAULT_ON,
    digitalTwinEqFounder: DW_LOCKS.DIGITAL_TWIN_EQ_FOUNDER,
    publicLaunchAuthorized: DW_LOCKS.PUBLIC_LAUNCH_AUTHORIZED,
    contractPaymentAuthorized: DW_LOCKS.CONTRACT_PAYMENT_AUTHORIZED,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    dtSoftWired: detectDtSoftWire(repoRoot),
    subsystems: {
      supplyChain: supplyChainSuperbrainHonesty(),
      lakehouse: universalDataLakehouseOsHonesty(),
      twinFactory: digitalTwinSimulationFactoryHonesty(),
      edgeTower: semiconductorEdgeComputeControlTowerHonesty(),
      knowledgeVault: personalKnowledgeVaultHonesty(),
      memoryHighway: agentMemoryHighwayHonesty(),
      industryGraph: globalIndustryKnowledgeGraphHonesty(),
      multimodal: secureMultimodalExperienceLayerHonesty(repoRoot),
    },
  };
}

export async function bootstrapSupplyChainSuperbrainOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DwActor;
  repoRoot?: string;
}): Promise<SupplyChainSuperbrainOs> {
  const store = await load(input.root);
  void input.actor;
  const os: SupplyChainSuperbrainOs = {
    id: id('dwscos'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer: detectPredecessorLayer(input.repoRoot),
    dtSoftWired: detectDtSoftWire(input.repoRoot),
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    publicLaunchAuthorized: false,
    contractPaymentAuthorized: false,
    fullProductionSupplyChainSuperbrainShipped: false,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(os);
  await save(input.root, store);
  return os;
}
