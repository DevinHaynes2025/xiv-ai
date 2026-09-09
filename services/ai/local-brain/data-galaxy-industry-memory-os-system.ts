/**
 * 62L-ED Data Galaxy & Industry Memory OS —
 * Governed system soft-wired over EC→EB→EA when PRESENT.
 */

import { dataGalaxyIndustryMemoryOsHonesty } from './data-galaxy-industry-memory-os';
import {
  AUTONOMY_BOUNDARY,
  ED_LOCKS,
  HONESTY_BANNER,
  LEARNING_LOOP_RULES,
  NEXT_PHASE_TITLE,
  PRODUCT_PHILOSOPHY,
  detectPredecessorLayer,
  predecessorMap,
  type EdActor,
} from './data-galaxy-industry-memory-os-types';
import { dataGalaxySoftwireHonesty } from './data-galaxy-softwire-gates';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { edgeCloudAiRuntimeEdHonesty } from './edge-cloud-ai-runtime-ed';
import { enterpriseConnectorFederationHonesty } from './enterprise-connector-federation';
import { federatedDatabaseGenomeHonesty } from './federated-database-genome';
import { leanSupplyChainIntelligenceFactoryHonesty } from './lean-supply-chain-intelligence-factory';
import { personalBusinessKnowledgeControlTowerHonesty } from './personal-business-knowledge-control-tower';
import { simulationUniversesHonesty } from './simulation-universes-ed';

export type DataGalaxyIndustryMemoryOsSystem = {
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
  fullProductionDataGalaxyIndustryMemoryOsShipped: false;
  productPhilosophy: typeof PRODUCT_PHILOSOPHY;
  learningLoopRules: typeof LEARNING_LOOP_RULES;
  autonomyBoundary: typeof AUTONOMY_BOUNDARY;
  createdAt: string;
};

type Store = {
  systems: DataGalaxyIndustryMemoryOsSystem[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'data-galaxy-industry-memory-os-system.json');
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

export function dataGalaxyIndustryMemoryOsSystemHonesty(repoRoot?: string) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: ED_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: ED_LOCKS.TIP_LAND,
    productionAuthorization: ED_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: ED_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: ED_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionDataGalaxyIndustryMemoryOsShipped:
      ED_LOCKS.FULL_PRODUCTION_DATA_GALAXY_INDUSTRY_MEMORY_OS_SHIPPED,
    liveSupabaseApply: ED_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: ED_LOCKS.DB_CANDIDATES_APPLIED,
    trillionsEqCurrentOwnedCorpus:
      ED_LOCKS.TRILLIONS_EQ_CURRENT_OWNED_CORPUS,
    scaleTargetEqOwnedVerifiedCorpus:
      ED_LOCKS.SCALE_TARGET_EQ_OWNED_VERIFIED_CORPUS,
    proprietaryDbCopyAllowed: ED_LOCKS.PROPRIETARY_DB_COPY_ALLOWED,
    oracleReverseCopyAllowed: ED_LOCKS.ORACLE_REVERSE_COPY_ALLOWED,
    genomeEqCopiedProprietarySource:
      ED_LOCKS.GENOME_EQ_COPIED_PROPRIETARY_SOURCE,
    syntheticEqRealCustomerOwnership:
      ED_LOCKS.SYNTHETIC_EQ_REAL_CUSTOMER_OWNERSHIP,
    simEqVerifiedFact: ED_LOCKS.SIM_EQ_VERIFIED_FACT,
    industryTwinEqPhysicalControl:
      ED_LOCKS.INDUSTRY_TWIN_EQ_PHYSICAL_CONTROL,
    unconfiguredConnectorEqAvailable:
      ED_LOCKS.UNCONFIGURED_CONNECTOR_EQ_AVAILABLE,
    stealthInstallAllowed: ED_LOCKS.STEALTH_INSTALL_ALLOWED,
    digitalTwinEqFounder: ED_LOCKS.DIGITAL_TWIN_EQ_FOUNDER,
    publicLaunchAuthorized: ED_LOCKS.PUBLIC_LAUNCH_AUTHORIZED,
    contractPaymentAuthorized: ED_LOCKS.CONTRACT_PAYMENT_AUTHORIZED,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    autonomyBoundary: AUTONOMY_BOUNDARY,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    softWiredPredecessors: softWireList(repoRoot),
    predecessors: predecessorMap(repoRoot),
    subsystems: {
      dataGalaxy: dataGalaxyIndustryMemoryOsHonesty(),
      genome: federatedDatabaseGenomeHonesty(),
      leanFactory: leanSupplyChainIntelligenceFactoryHonesty(),
      connectors: enterpriseConnectorFederationHonesty(),
      simulationUniverses: simulationUniversesHonesty(),
      edgeCloudRuntime: edgeCloudAiRuntimeEdHonesty(),
      knowledgeTower: personalBusinessKnowledgeControlTowerHonesty(),
      softwire: dataGalaxySoftwireHonesty(repoRoot),
    },
  };
}

export async function bootstrapDataGalaxyIndustryMemoryOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: EdActor;
  repoRoot?: string;
}): Promise<DataGalaxyIndustryMemoryOsSystem> {
  void input.actor;
  const store = await load(input.root);
  const system: DataGalaxyIndustryMemoryOsSystem = {
    id: id('eddgimo'),
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
    fullProductionDataGalaxyIndustryMemoryOsShipped: false,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    autonomyBoundary: AUTONOMY_BOUNDARY,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(system);
  await save(input.root, store);
  return system;
}
