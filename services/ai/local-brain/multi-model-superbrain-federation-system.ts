/**
 * 62L-EB Multi-Model Superbrain Federation —
 * Governed federation soft-wired over EA→DZ when PRESENT.
 */

import { agentResearchSocietyHonesty } from './agent-research-society';
import { civilizationScientificMemoryCortexHonesty } from './civilization-scientific-memory-cortex';
import { distributedAiCloudGpuExchangeHonesty } from './distributed-ai-cloud-gpu-exchange';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { globalSearchKnowledgeInfrastructureHonesty } from './global-search-knowledge-infrastructure';
import { multiModelSuperbrainFederationHonesty } from './multi-model-superbrain-federation';
import {
  AUTONOMY_BOUNDARY,
  EB_LOCKS,
  HONESTY_BANNER,
  LEARNING_LOOP_RULES,
  NEXT_PHASE_TITLE,
  PRODUCT_PHILOSOPHY,
  detectPredecessorLayer,
  predecessorMap,
  type EbActor,
} from './multi-model-superbrain-federation-types';
import { quantumOptimizationHighwayHonesty } from './quantum-optimization-highway';
import { spatialXrCommandUniverseHonesty } from './spatial-xr-command-universe';
import { universalLocalAiNodeRuntimeHonesty } from './universal-local-ai-node-runtime';

export type MultiModelSuperbrainFederationSystem = {
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
  fullProductionMultiModelSuperbrainFederationShipped: false;
  productPhilosophy: typeof PRODUCT_PHILOSOPHY;
  learningLoopRules: typeof LEARNING_LOOP_RULES;
  autonomyBoundary: typeof AUTONOMY_BOUNDARY;
  createdAt: string;
};

type Store = {
  systems: MultiModelSuperbrainFederationSystem[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-model-superbrain-federation-system.json');
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

export function multiModelSuperbrainFederationSystemHonesty(repoRoot?: string) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: EB_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: EB_LOCKS.TIP_LAND,
    productionAuthorization: EB_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: EB_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: EB_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionMultiModelSuperbrainFederationShipped:
      EB_LOCKS.FULL_PRODUCTION_MULTI_MODEL_SUPERBRAIN_FEDERATION_SHIPPED,
    liveSupabaseApply: EB_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: EB_LOCKS.DB_CANDIDATES_APPLIED,
    recommendEqCharge: EB_LOCKS.RECOMMENDATION_EQ_CHARGE,
    recommendEqAutoSpend: EB_LOCKS.RECOMMENDATION_EQ_AUTO_SPEND,
    unconfiguredProviderEqAvailable:
      EB_LOCKS.UNCONFIGURED_PROVIDER_EQ_AVAILABLE,
    quantumInspiredEqPhysicalQuantum:
      EB_LOCKS.QUANTUM_INSPIRED_EQ_PHYSICAL_QUANTUM,
    quantumSupremacyWithoutEvidence:
      EB_LOCKS.QUANTUM_SUPREMACY_WITHOUT_EVIDENCE,
    covertXrCaptureAllowed: EB_LOCKS.COVERT_XR_CAPTURE_ALLOWED,
    biometricDefaultsOn: EB_LOCKS.BIOMETRIC_DEFAULTS_ON,
    stealthInstallAllowed: EB_LOCKS.STEALTH_INSTALL_ALLOWED,
    digitalTwinEqFounder: EB_LOCKS.DIGITAL_TWIN_EQ_FOUNDER,
    publicLaunchAuthorized: EB_LOCKS.PUBLIC_LAUNCH_AUTHORIZED,
    contractPaymentAuthorized: EB_LOCKS.CONTRACT_PAYMENT_AUTHORIZED,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    autonomyBoundary: AUTONOMY_BOUNDARY,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    softWiredPredecessors: softWireList(repoRoot),
    predecessors: predecessorMap(repoRoot),
    subsystems: {
      federation: multiModelSuperbrainFederationHonesty(),
      gpuExchange: distributedAiCloudGpuExchangeHonesty(),
      quantumHighway: quantumOptimizationHighwayHonesty(),
      memoryCortex: civilizationScientificMemoryCortexHonesty(),
      localNodeRuntime: universalLocalAiNodeRuntimeHonesty(),
      researchSociety: agentResearchSocietyHonesty(),
      xrUniverse: spatialXrCommandUniverseHonesty(),
      globalSearch: globalSearchKnowledgeInfrastructureHonesty(repoRoot),
    },
  };
}

export async function bootstrapMultiModelSuperbrainFederation(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: EbActor;
  repoRoot?: string;
}): Promise<MultiModelSuperbrainFederationSystem> {
  void input.actor;
  const store = await load(input.root);
  const system: MultiModelSuperbrainFederationSystem = {
    id: id('ebmmsf'),
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
    fullProductionMultiModelSuperbrainFederationShipped: false,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    autonomyBoundary: AUTONOMY_BOUNDARY,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(system);
  await save(input.root, store);
  return system;
}
