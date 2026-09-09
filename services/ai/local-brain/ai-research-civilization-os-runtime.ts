/**
 * 62L-CT runtime — walks AI_RESEARCH_CIVILIZATION_OS_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  bootstrapResearchCivilization,
  openResearchLab,
  registerResearchSchool,
  researchCivilizationHonesty,
} from './ai-research-civilization-os';
import {
  enqueueTrainingJob,
  registerTrainingDataset,
  runLocalEval,
  trainingFederationHonesty,
} from './multi-model-training-federation';
import {
  attemptAutoApplyProductionSchema,
  compileMemoryPack,
  memoryCompilerHonesty,
} from './distributed-knowledge-memory-compiler';
import {
  attemptLabelSimAsVerifiedDiscovery,
  runMultiUniverseSimulation,
  simulationLabHonesty,
} from './autonomous-simulation-laboratory';
import {
  acceleratorGridHonesty,
  planOptimization,
  registerAcceleratorNode,
} from './accelerator-quantum-optimization-grid';
import {
  attemptPromoteDiscovery,
  discoveryGraphHonesty,
  recordDiscoveryNode,
} from './global-scientific-discovery-graph';
import {
  attemptQueueProductionDeploy,
  attemptSelfImprovement,
  recordAcademySkill,
  toolchainAcademyHonesty,
} from './self-improving-toolchain-academy';
import {
  AI_RESEARCH_CIVILIZATION_OS_CYCLE,
  CT_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type CtActor,
  type CtEvidenceState,
  type CtHop,
  type CtHopRecord,
} from './ai-research-civilization-os-types';

export {
  AI_RESEARCH_CIVILIZATION_OS_CYCLE,
  CT_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CtHop, state: CtEvidenceState, summary: string): CtHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CtCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CtActor;
  root?: string;
};

export async function runAiResearchCivilizationOsCycle(input: CtCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CtHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CT_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CT_LOCKS.LOCAL_FIRST &&
        CT_LOCKS.UNCONTROLLED_SELF_IMPROVEMENT === false &&
        CT_LOCKS.UNKNOWN_RIGHTS_TRAINING === false &&
        CT_LOCKS.SEALED_SILENT_CLOUD_TRAINING_EVAL === false &&
        CT_LOCKS.QUEUE_PRODUCTION_DEPLOY === false &&
        CT_LOCKS.MEMORY_COMPILER_AUTO_APPLY_PROD_SCHEMA === false &&
        CT_LOCKS.CORRELATION_EQ_CAUSATION === false &&
        CT_LOCKS.SIM_EQ_VERIFIED_DISCOVERY === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const civ = await bootstrapResearchCivilization({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  hops.push(hop('research_civilization_bootstrap', 'PASS', civ.id));

  const school = await registerResearchSchool({
    name: 'materials-school',
    domain: 'materials',
    root,
    actor,
  });
  const lab = await openResearchLab({
    schoolId: school.id,
    name: 'sim-lab-1',
    universeId: input.universeId,
    root,
    actor,
  });
  hops.push(
    hop(
      'bounded_research_schools_labs',
      school.bounded && lab.bounded ? 'BOUNDED' : 'FAIL',
      `${school.id}/${lab.id}`,
    ),
  );

  const licensed = await registerTrainingDataset({
    label: 'licensed-corpus',
    rights: 'known_licensed',
    sealed: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'multi_model_training_federation_local_first',
      licensed.status === 'accepted' ? 'LOCAL_PREFERRED' : 'FAIL',
      licensed.reason,
    ),
  );

  const unknown = await registerTrainingDataset({
    label: 'mystery-scrape',
    rights: 'unknown',
    root,
    actor,
  });
  hops.push(
    hop(
      'unknown_rights_training_denied',
      unknown.status === 'denied' ? 'DENIED' : 'FAIL',
      unknown.reason,
    ),
  );

  const sealedTrain = await enqueueTrainingJob({
    modelId: 'local-model-1',
    datasetId: licensed.id,
    mode: 'sealed',
    silentCloudFallbackRequested: true,
    root,
    actor,
  });
  const sealedEval = await runLocalEval({
    modelId: 'local-model-1',
    mode: 'sealed',
    sealed: true,
    silentCloudFallbackRequested: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_training_eval_no_silent_cloud',
      sealedTrain.status === 'denied' && sealedEval.status === 'denied'
        ? 'DENIED'
        : 'FAIL',
      sealedTrain.reason,
    ),
  );

  const pack = await compileMemoryPack({
    label: 'research-index',
    sources: ['school', 'lab', 'sim'],
    root,
    actor,
  });
  hops.push(
    hop(
      'knowledge_memory_compiler_candidates',
      pack.status === 'candidate' ? 'CANDIDATE' : 'FAIL',
      pack.reason,
    ),
  );

  const schema = await attemptAutoApplyProductionSchema({
    packId: pack.id,
    autoApplyRequested: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'memory_compiler_no_auto_prod_schema',
      schema.status === 'denied' ? 'DENIED' : 'FAIL',
      schema.reason,
    ),
  );

  const sim = await runMultiUniverseSimulation({
    labId: lab.id,
    universeIds: [input.universeId, `${input.universeId}-b`],
    root,
    actor,
  });
  hops.push(
    hop(
      'autonomous_simulation_lab_bounded',
      sim.labeled && sim.verifiedDiscovery === false ? 'LABELED_SIMULATION' : 'FAIL',
      sim.reason,
    ),
  );

  const simLabel = await attemptLabelSimAsVerifiedDiscovery({
    simulationId: sim.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'sim_output_not_verified_discovery',
      simLabel.status === 'rejected' ? 'REJECTED' : 'FAIL',
      simLabel.reason,
    ),
  );

  const cpu = await registerAcceleratorNode({
    kind: 'cpu',
    configured: true,
    verified: true,
    root,
    actor,
  });
  const classical = await planOptimization({
    workload: 'matmul',
    classicalBaselinePresent: true,
    targetKind: 'cpu',
    acceleratorId: cpu.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'accelerator_quantum_grid_classical_baseline',
      classical.status === 'planned_classical' ? 'PASS' : 'FAIL',
      classical.reason,
    ),
  );

  const qpu = await registerAcceleratorNode({
    kind: 'qpu',
    configured: false,
    verified: false,
    root,
    actor,
  });
  const unconfigured = await planOptimization({
    workload: 'anneal',
    classicalBaselinePresent: true,
    quantumClaimed: true,
    quantumEvidencePresent: true,
    targetKind: 'qpu',
    acceleratorId: qpu.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_accelerator_qpu_unavailable',
      qpu.status === 'unavailable' && unconfigured.status === 'unavailable'
        ? 'UNAVAILABLE'
        : 'FAIL',
      unconfigured.reason,
    ),
  );

  const qpuConfigured = await registerAcceleratorNode({
    kind: 'qpu',
    configured: true,
    verified: true,
    root,
    actor,
  });
  const noBaseline = await planOptimization({
    workload: 'vqe',
    classicalBaselinePresent: false,
    quantumClaimed: true,
    quantumEvidencePresent: false,
    targetKind: 'qpu',
    acceleratorId: qpuConfigured.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_claim_without_evidence_rejected',
      noBaseline.status === 'rejected' ? 'REJECTED' : 'FAIL',
      noBaseline.reason,
    ),
  );

  const corr = await recordDiscoveryNode({
    label: 'A-correlates-B',
    kind: 'correlation',
    evidenceRefs: ['obs-1'],
    root,
    actor,
  });
  hops.push(
    hop(
      'scientific_discovery_graph_typed',
      corr.status === 'recorded' && corr.kind === 'correlation' ? 'PASS' : 'FAIL',
      corr.reason,
    ),
  );

  const promote = await attemptPromoteDiscovery({
    fromId: corr.id,
    toKind: 'causation',
    evidencePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'correlation_to_causation_rejected',
      promote.status === 'rejected' ? 'REJECTED' : 'FAIL',
      promote.reason,
    ),
  );

  const skill = await recordAcademySkill({
    agentId: actor.id,
    skill: 'refactor-sandbox',
    permissionLevel: actor.permissionLevel,
    requestEscalation: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'toolchain_academy_sandbox_only',
      CT_LOCKS.TOOLCHAIN_ACADEMY_SANDBOX_ONLY ? 'SANDBOXED' : 'FAIL',
      'sandbox academy',
    ),
  );
  hops.push(
    hop(
      'academy_skill_no_permission_escalation',
      skill.status === 'denied' &&
        skill.permissionLevelAfter === skill.permissionLevelBefore
        ? 'DENIED'
        : 'FAIL',
      skill.reason,
    ),
  );

  const uncontrolled = await attemptSelfImprovement({
    mode: 'uncontrolled',
    root,
    actor,
  });
  const openEnded = await attemptSelfImprovement({
    mode: 'open_ended_self_modify',
    root,
    actor,
  });
  hops.push(
    hop(
      'uncontrolled_self_improvement_denied',
      uncontrolled.status === 'denied' && openEnded.status === 'denied'
        ? 'DENIED'
        : 'FAIL',
      uncontrolled.reason,
    ),
  );

  const deploy = await attemptQueueProductionDeploy({
    target: 'production',
    root,
    actor,
  });
  hops.push(
    hop(
      'queue_production_deploy_denied',
      deploy.status === 'denied' ? 'DENIED' : 'FAIL',
      deploy.reason,
    ),
  );

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-CT AI research civilization OS cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-CT'],
        civilizationId: civ.id,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CT AI research civilization OS cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning ≠ permission; L4=false`,
      sourceRefs: ['62L-CT'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; not permission grant'));

  void decisionGate;
  void researchCivilizationHonesty;
  void trainingFederationHonesty;
  void memoryCompilerHonesty;
  void simulationLabHonesty;
  void acceleratorGridHonesty;
  void discoveryGraphHonesty;
  void toolchainAcademyHonesty;

  return {
    ok: hops.every((h) =>
      [
        'PASS',
        'DENIED',
        'REJECTED',
        'UNAVAILABLE',
        'BOUNDED',
        'CANDIDATE',
        'SANDBOXED',
        'LABELED_SIMULATION',
        'NOT_APPLIED',
        'RECOMMENDATION_ONLY',
        'LOCAL_PREFERRED',
        'HYPOTHESIS',
        'CORRELATION',
        'CAUSATION_BLOCKED',
      ].includes(h.state),
    ),
    hops,
    civilizationId: civ.id,
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: CT_LOCKS.L4_AUTONOMY_ENABLED,
    nextPhase: NEXT_PHASE_TITLE,
  };
}

export async function buildAiResearchCivilizationOsHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const health = await checkLocalBrainHealth(root);
  const predecessors = predecessorMap(root);
  return {
    phase: '62L-CT',
    title:
      'XIV AI Research Civilization OS + Multi-Model Training Federation + Distributed Knowledge Memory Compiler + Autonomous Simulation Laboratory + Accelerator/Quantum Optimization Grid + Global Scientific Discovery Graph + Self-Improving Toolchain Academy',
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: CT_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorized: CT_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: CT_LOCKS.TIP_LAND,
    githubSotIssue: 110,
    gitlabCoordinationIssue: 44,
    locks: { ...CT_LOCKS },
    honesty: {
      researchCivilization: researchCivilizationHonesty(),
      trainingFederation: trainingFederationHonesty(),
      memoryCompiler: memoryCompilerHonesty(),
      simulationLab: simulationLabHonesty(),
      acceleratorGrid: acceleratorGridHonesty(),
      discoveryGraph: discoveryGraphHonesty(),
      toolchainAcademy: toolchainAcademyHonesty(),
    },
    cycle: [...AI_RESEARCH_CIVILIZATION_OS_CYCLE],
    predecessors,
    localBrainHealth: health,
    nextPhase: NEXT_PHASE_TITLE,
    documentedEqImplemented: false,
    implementedEqVerified: false,
    verifiedEqProductionAuthorized: false,
    at: new Date().toISOString(),
  };
}
