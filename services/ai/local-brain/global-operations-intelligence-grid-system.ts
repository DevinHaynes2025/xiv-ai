/**
 * 62L-EA Global Operations Intelligence Grid —
 * Governed grid soft-wired over DZ→DY when PRESENT.
 */

import { agentDepartmentNetworkHonesty } from './agent-department-network';
import { cloudMicroserverVirtualGpuFabricHonesty } from './cloud-microserver-virtual-gpu-fabric';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { globalOperationsIntelligenceGridHonesty } from './global-operations-intelligence-grid';
import {
  EA_LOCKS,
  HONESTY_BANNER,
  LEARNING_LOOP_RULES,
  NEXT_PHASE_TITLE,
  PRODUCT_PHILOSOPHY,
  PROMOTION_GATE,
  detectPredecessorLayer,
  predecessorMap,
  type EaActor,
} from './global-operations-intelligence-grid-types';
import { grokXaiModelFederationHonesty } from './grok-xai-model-federation';
import { historicalCivilizationSpaceKnowledgeAtlasHonesty } from './historical-civilization-space-knowledge-atlas';
import { quantumInspiredComputeBrainHonesty } from './quantum-inspired-compute-brain';
import { secureOsIntegrationFoundationHonesty } from './secure-os-integration-foundation';
import { xrHolographicResearchLayerHonesty } from './xr-holographic-research-layer';

export type GlobalOperationsIntelligenceGridSystem = {
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
  fullProductionGlobalOpsIntelligenceGridShipped: false;
  productPhilosophy: typeof PRODUCT_PHILOSOPHY;
  learningLoopRules: typeof LEARNING_LOOP_RULES;
  promotionGate: typeof PROMOTION_GATE;
  createdAt: string;
};

type Store = {
  systems: GlobalOperationsIntelligenceGridSystem[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-operations-intelligence-grid-system.json');
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

export function globalOperationsIntelligenceGridSystemHonesty(
  repoRoot?: string,
) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: EA_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: EA_LOCKS.TIP_LAND,
    productionAuthorization: EA_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: EA_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: EA_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionGlobalOpsIntelligenceGridShipped:
      EA_LOCKS.FULL_PRODUCTION_GLOBAL_OPS_INTELLIGENCE_GRID_SHIPPED,
    liveSupabaseApply: EA_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: EA_LOCKS.DB_CANDIDATES_APPLIED,
    recommendEqCharge: EA_LOCKS.RECOMMENDATION_EQ_CHARGE,
    xaiFabricatedLiveCalls: EA_LOCKS.XAI_FABRICATED_LIVE_CALLS,
    unconfiguredProviderEqAvailable:
      EA_LOCKS.UNCONFIGURED_PROVIDER_EQ_AVAILABLE,
    quantumInspiredEqPhysicalQuantum:
      EA_LOCKS.QUANTUM_INSPIRED_EQ_PHYSICAL_QUANTUM,
    quantumSupremacyWithoutEvidence:
      EA_LOCKS.QUANTUM_SUPREMACY_WITHOUT_EVIDENCE,
    classicalBaselineOptional: EA_LOCKS.CLASSICAL_BASELINE_OPTIONAL,
    speculativeEqVerifiedFact: EA_LOCKS.SPECULATIVE_EQ_VERIFIED_FACT,
    stealthOsInstallAllowed: EA_LOCKS.STEALTH_OS_INSTALL_ALLOWED,
    unauthorizedOsTakeoverAllowed: EA_LOCKS.UNAUTHORIZED_OS_TAKEOVER_ALLOWED,
    osPermissionBypassAllowed: EA_LOCKS.OS_PERMISSION_BYPASS_ALLOWED,
    silentPersistenceAllowed: EA_LOCKS.SILENT_PERSISTENCE_ALLOWED,
    xrEqCovertCapture: EA_LOCKS.XR_EQ_COVERT_CAPTURE,
    biometricDefaultsOn: EA_LOCKS.BIOMETRIC_DEFAULTS_ON,
    promotionWithoutExplicitAuth: EA_LOCKS.PROMOTION_WITHOUT_EXPLICIT_AUTH,
    digitalTwinEqFounder: EA_LOCKS.DIGITAL_TWIN_EQ_FOUNDER,
    consciousnessClaimed: EA_LOCKS.CONSCIOUSNESS_CLAIMED,
    publicLaunchAuthorized: EA_LOCKS.PUBLIC_LAUNCH_AUTHORIZED,
    contractPaymentAuthorized: EA_LOCKS.CONTRACT_PAYMENT_AUTHORIZED,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    promotionGate: PROMOTION_GATE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    softWiredPredecessors: softWireList(repoRoot),
    predecessors: predecessorMap(repoRoot),
    subsystems: {
      opsGrid: globalOperationsIntelligenceGridHonesty(),
      xaiFederation: grokXaiModelFederationHonesty(),
      microserverFabric: cloudMicroserverVirtualGpuFabricHonesty(),
      quantumBrain: quantumInspiredComputeBrainHonesty(),
      civilizationAtlas: historicalCivilizationSpaceKnowledgeAtlasHonesty(),
      agentDepartments: agentDepartmentNetworkHonesty(),
      xrResearch: xrHolographicResearchLayerHonesty(),
      secureOs: secureOsIntegrationFoundationHonesty(repoRoot),
    },
  };
}

export async function bootstrapGlobalOperationsIntelligenceGrid(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: EaActor;
  repoRoot?: string;
}): Promise<GlobalOperationsIntelligenceGridSystem> {
  void input.actor;
  const store = await load(input.root);
  const system: GlobalOperationsIntelligenceGridSystem = {
    id: id('eagoig'),
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
    fullProductionGlobalOpsIntelligenceGridShipped: false,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    promotionGate: PROMOTION_GATE,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(system);
  await save(input.root, store);
  return system;
}
