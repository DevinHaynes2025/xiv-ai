/**
 * 62L-EE Data Nervous System —
 * Governed OS soft-wired over ED→EB when PRESENT.
 */

import { agentKnowledgeProductionLineHonesty } from './agent-knowledge-production-line';
import { autonomousDatabaseOperationsBrainHonesty } from './autonomous-database-operations-brain';
import { dataNervousSystemHonesty } from './data-nervous-system';
import {
  AUTONOMY_BOUNDARY,
  EE_LOCKS,
  HONESTY_BANNER,
  LEARNING_LOOP_RULES,
  NEXT_PHASE_TITLE,
  PRODUCT_PHILOSOPHY,
  detectPredecessorLayer,
  predecessorMap,
  type EeActor,
} from './data-nervous-system-types';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { edgeCloudContinuityGridHonesty } from './edge-cloud-continuity-grid';
import { historicalSupplyChainLearningCortexHonesty } from './historical-supply-chain-learning-cortex';
import { launchDataReliabilityCommandCenterHonesty } from './launch-data-reliability-command-center';
import { leanEnterpriseOptimizationEngineHonesty } from './lean-enterprise-optimization-engine';
import { universalIndustryDigitalTwinFactoryHonesty } from './universal-industry-digital-twin-factory';

export type DataNervousSystemOs = {
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
  fullProductionDataNervousSystemShipped: false;
  productPhilosophy: typeof PRODUCT_PHILOSOPHY;
  learningLoopRules: typeof LEARNING_LOOP_RULES;
  autonomyBoundary: typeof AUTONOMY_BOUNDARY;
  createdAt: string;
};

type Store = {
  systems: DataNervousSystemOs[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'data-nervous-system-os.json');
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

export function dataNervousSystemOsHonesty(repoRoot?: string) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: EE_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: EE_LOCKS.TIP_LAND,
    productionAuthorization: EE_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: EE_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: EE_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionDataNervousSystemShipped:
      EE_LOCKS.FULL_PRODUCTION_DATA_NERVOUS_SYSTEM_SHIPPED,
    liveSupabaseApply: EE_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: EE_LOCKS.DB_CANDIDATES_APPLIED,
    recommendEqAutoMigrate: EE_LOCKS.RECOMMENDATION_EQ_AUTO_MIGRATE,
    syncEqAutoMigrate: EE_LOCKS.SYNC_EQ_AUTO_MIGRATE,
    missingEvidenceEqVerified: EE_LOCKS.MISSING_EVIDENCE_EQ_VERIFIED,
    correlationEqCausation: EE_LOCKS.CORRELATION_EQ_CAUSATION,
    simEqVerifiedFact: EE_LOCKS.SIM_EQ_VERIFIED_FACT,
    twinEqPhysicalControl: EE_LOCKS.TWIN_EQ_PHYSICAL_CONTROL,
    peerReviewEqAutoGrant: EE_LOCKS.PEER_REVIEW_EQ_AUTO_PERMISSION_GRANT,
    knowledgeEqAutoPublish: EE_LOCKS.KNOWLEDGE_EQ_AUTO_PROD_PUBLISH,
    offensiveExploitAllowed: EE_LOCKS.OFFENSIVE_EXPLOIT_TOOLING_ALLOWED,
    stealthInstallAllowed: EE_LOCKS.STEALTH_INSTALL_ALLOWED,
    digitalTwinEqFounder: EE_LOCKS.DIGITAL_TWIN_EQ_FOUNDER,
    trillionsEqCurrentOwnership: EE_LOCKS.TRILLIONS_EQ_CURRENT_OWNERSHIP,
    proprietaryDbCopyAllowed: EE_LOCKS.PROPRIETARY_DB_COPY_ALLOWED,
    publicLaunchAuthorized: EE_LOCKS.PUBLIC_LAUNCH_AUTHORIZED,
    contractPaymentAuthorized: EE_LOCKS.CONTRACT_PAYMENT_AUTHORIZED,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    autonomyBoundary: AUTONOMY_BOUNDARY,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    softWiredPredecessors: softWireList(repoRoot),
    predecessors: predecessorMap(repoRoot),
    subsystems: {
      nervousSystem: dataNervousSystemHonesty(),
      dbOpsBrain: autonomousDatabaseOperationsBrainHonesty(),
      supplyLearning: historicalSupplyChainLearningCortexHonesty(),
      leanEngine: leanEnterpriseOptimizationEngineHonesty(),
      twinFactory: universalIndustryDigitalTwinFactoryHonesty(),
      knowledgeLine: agentKnowledgeProductionLineHonesty(),
      continuityGrid: edgeCloudContinuityGridHonesty(),
      launchCommand: launchDataReliabilityCommandCenterHonesty(repoRoot),
    },
  };
}

export async function bootstrapDataNervousSystem(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: EeActor;
  repoRoot?: string;
}): Promise<DataNervousSystemOs> {
  void input.actor;
  const store = await load(input.root);
  const system: DataNervousSystemOs = {
    id: id('eedns'),
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
    fullProductionDataNervousSystemShipped: false,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    autonomyBoundary: AUTONOMY_BOUNDARY,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(system);
  await save(input.root, store);
  return system;
}
