/**
 * 62L-DZ Supply Chain Intelligence Fabric —
 * Governed fabric soft-wired over DY→DX→DW when PRESENT.
 */

import { algorithmDiscoveryBenchmarkFactoryHonesty } from './algorithm-discovery-benchmark-factory';
import { agentSocietyCoordinationLayerHonesty } from './agent-society-coordination-layer';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { globalHistoricalDataMemoryEngineHonesty } from './global-historical-data-memory-engine';
import { industryAppComposerHonesty } from './industry-app-composer';
import { launchResilienceTrustControlTowerHonesty } from './launch-resilience-trust-control-tower';
import { personalEnterpriseKnowledgeGraphHonesty } from './personal-enterprise-knowledge-graph-firewall';
import {
  DZ_LOCKS,
  HONESTY_BANNER,
  LEARNING_LOOP_RULES,
  NEXT_PHASE_TITLE,
  PRODUCT_PHILOSOPHY,
  PROMOTION_GATE,
  detectPredecessorLayer,
  predecessorMap,
  type DzActor,
} from './supply-chain-intelligence-fabric-types';
import { supplyChainIntelligenceFabricHonesty } from './supply-chain-intelligence-fabric';
import { universalEdgeAiRuntimeHonesty } from './universal-edge-ai-runtime';

export type SupplyChainIntelligenceFabricSystem = {
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
  fullProductionSupplyChainIntelligenceFabricShipped: false;
  productPhilosophy: typeof PRODUCT_PHILOSOPHY;
  learningLoopRules: typeof LEARNING_LOOP_RULES;
  promotionGate: typeof PROMOTION_GATE;
  createdAt: string;
};

type Store = {
  systems: SupplyChainIntelligenceFabricSystem[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'supply-chain-intelligence-fabric-system.json');
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
  const preds = predecessorMap(repoRoot);
  return Object.entries(preds)
    .filter(([, v]) => v.tipProbe === 'PRESENT')
    .map(([k]) => k);
}

export function supplyChainIntelligenceFabricSystemHonesty(repoRoot?: string) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DZ_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DZ_LOCKS.TIP_LAND,
    productionAuthorization: DZ_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DZ_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DZ_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionSupplyChainIntelligenceFabricShipped:
      DZ_LOCKS.FULL_PRODUCTION_SUPPLY_CHAIN_INTELLIGENCE_FABRIC_SHIPPED,
    liveSupabaseApply: DZ_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DZ_LOCKS.DB_CANDIDATES_APPLIED,
    recommendEqCharge: DZ_LOCKS.RECOMMENDATION_EQ_CHARGE,
    pathwayEqVerifiedCausation: DZ_LOCKS.PATHWAY_EQ_VERIFIED_CAUSATION,
    discoveryCandidateEqProductionAlgorithm:
      DZ_LOCKS.DISCOVERY_CANDIDATE_EQ_PRODUCTION_ALGORITHM,
    algorithmSelfPromotionAllowed: DZ_LOCKS.ALGORITHM_SELF_PROMOTION_ALLOWED,
    deviceSelfPromotionAllowed: DZ_LOCKS.DEVICE_SELF_PROMOTION_ALLOWED,
    agentSelfPromotionAllowed: DZ_LOCKS.AGENT_SELF_PROMOTION_ALLOWED,
    appPackSelfPromotionAllowed: DZ_LOCKS.APP_PACK_SELF_PROMOTION_ALLOWED,
    sandboxCompositionEqProdDeploy:
      DZ_LOCKS.SANDBOX_COMPOSITION_EQ_PROD_DEPLOY,
    quantumInspiredEqPhysicalQuantum:
      DZ_LOCKS.QUANTUM_INSPIRED_EQ_PHYSICAL_QUANTUM,
    quantumSupremacyWithoutEvidence:
      DZ_LOCKS.QUANTUM_SUPREMACY_WITHOUT_EVIDENCE,
    promotionWithoutExplicitAuth: DZ_LOCKS.PROMOTION_WITHOUT_EXPLICIT_AUTH,
    digitalTwinEqFounder: DZ_LOCKS.DIGITAL_TWIN_EQ_FOUNDER,
    publicLaunchAuthorized: DZ_LOCKS.PUBLIC_LAUNCH_AUTHORIZED,
    contractPaymentAuthorized: DZ_LOCKS.CONTRACT_PAYMENT_AUTHORIZED,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    promotionGate: PROMOTION_GATE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    softWiredPredecessors: softWireList(repoRoot),
    predecessors: predecessorMap(repoRoot),
    subsystems: {
      fabric: supplyChainIntelligenceFabricHonesty(),
      historicalMemory: globalHistoricalDataMemoryEngineHonesty(),
      algorithmFactory: algorithmDiscoveryBenchmarkFactoryHonesty(),
      edgeRuntime: universalEdgeAiRuntimeHonesty(),
      agentSociety: agentSocietyCoordinationLayerHonesty(),
      knowledgeFirewall: personalEnterpriseKnowledgeGraphHonesty(),
      appComposer: industryAppComposerHonesty(),
      trustTower: launchResilienceTrustControlTowerHonesty(repoRoot),
    },
  };
}

export async function bootstrapSupplyChainIntelligenceFabric(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DzActor;
  repoRoot?: string;
}): Promise<SupplyChainIntelligenceFabricSystem> {
  void input.actor;
  const store = await load(input.root);
  const system: SupplyChainIntelligenceFabricSystem = {
    id: id('dzscif'),
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
    fullProductionSupplyChainIntelligenceFabricShipped: false,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    promotionGate: PROMOTION_GATE,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(system);
  await save(input.root, store);
  return system;
}
