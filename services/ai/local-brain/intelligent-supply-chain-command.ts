/**
 * 62L-DY Intelligent Supply Chain Command —
 * Governed command OS soft-wired over DX→DW→DV when PRESENT.
 */

import { agentCollaborationProtocolHonesty } from './agent-collaboration-protocol-dy';
import { autonomousExperimentOptimizationLabHonesty } from './autonomous-experiment-optimization-lab';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { globalKnowledgeRetrievalCortexHonesty } from './global-knowledge-retrieval-cortex';
import { industrySolutionFactoryHonesty } from './industry-solution-factory';
import { intelligentSupplyChainCommandOsHonesty } from './intelligent-supply-chain-command-os';
import {
  DY_LOCKS,
  HONESTY_BANNER,
  LEARNING_LOOP_RULES,
  NEXT_PHASE_TITLE,
  PRODUCT_PHILOSOPHY,
  detectPredecessorLayer,
  predecessorMap,
  type DyActor,
} from './intelligent-supply-chain-command-types';
import { launchObservabilityRecoveryBrainHonesty } from './launch-observability-recovery-brain';
import { longTermMemoryGraphHonesty } from './long-term-memory-graph';
import { universalDeviceChipSchedulerHonesty } from './universal-device-chip-scheduler';

export type IntelligentSupplyChainCommand = {
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
  fullProductionIntelligentSupplyChainCommandShipped: false;
  productPhilosophy: typeof PRODUCT_PHILOSOPHY;
  learningLoopRules: typeof LEARNING_LOOP_RULES;
  createdAt: string;
};

type Store = {
  systems: IntelligentSupplyChainCommand[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'intelligent-supply-chain-command.json');
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

export function intelligentSupplyChainCommandHonesty(repoRoot?: string) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DY_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DY_LOCKS.TIP_LAND,
    productionAuthorization: DY_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DY_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DY_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionIntelligentSupplyChainCommandShipped:
      DY_LOCKS.FULL_PRODUCTION_INTELLIGENT_SUPPLY_CHAIN_COMMAND_SHIPPED,
    liveSupabaseApply: DY_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DY_LOCKS.DB_CANDIDATES_APPLIED,
    recommendEqCharge: DY_LOCKS.RECOMMENDATION_EQ_CHARGE,
    experimentCandidateEqProductionChange:
      DY_LOCKS.EXPERIMENT_CANDIDATE_EQ_PRODUCTION_CHANGE,
    quantumInspiredEqPhysicalQuantum:
      DY_LOCKS.QUANTUM_INSPIRED_EQ_PHYSICAL_QUANTUM,
    quantumSupremacyWithoutEvidence:
      DY_LOCKS.QUANTUM_SUPREMACY_WITHOUT_EVIDENCE,
    listingEqAutoGrant: DY_LOCKS.LISTING_EQ_AUTO_GRANT,
    rollbackPlanEqAutoProdRollback:
      DY_LOCKS.ROLLBACK_PLAN_EQ_AUTO_PROD_ROLLBACK,
    digitalTwinEqFounder: DY_LOCKS.DIGITAL_TWIN_EQ_FOUNDER,
    publicLaunchAuthorized: DY_LOCKS.PUBLIC_LAUNCH_AUTHORIZED,
    contractPaymentAuthorized: DY_LOCKS.CONTRACT_PAYMENT_AUTHORIZED,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    softWiredPredecessors: softWireList(repoRoot),
    predecessors: predecessorMap(repoRoot),
    subsystems: {
      commandOs: intelligentSupplyChainCommandOsHonesty(),
      retrievalCortex: globalKnowledgeRetrievalCortexHonesty(),
      experimentLab: autonomousExperimentOptimizationLabHonesty(),
      deviceScheduler: universalDeviceChipSchedulerHonesty(),
      ltmGraph: longTermMemoryGraphHonesty(),
      collaboration: agentCollaborationProtocolHonesty(),
      solutionFactory: industrySolutionFactoryHonesty(),
      observabilityRecovery: launchObservabilityRecoveryBrainHonesty(repoRoot),
    },
  };
}

export async function bootstrapIntelligentSupplyChainCommand(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DyActor;
  repoRoot?: string;
}): Promise<IntelligentSupplyChainCommand> {
  void input.actor;
  const store = await load(input.root);
  const system: IntelligentSupplyChainCommand = {
    id: id('dyisc'),
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
    fullProductionIntelligentSupplyChainCommandShipped: false,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(system);
  await save(input.root, store);
  return system;
}
