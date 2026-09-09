import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  ACADEMY_SKILL_NO_ESCALATION,
  AI_RESEARCH_CIVILIZATION_OS_CYCLE,
  CORRELATION_TO_CAUSATION_REJECTED,
  CT_LOCKS,
  HONESTY_BANNER,
  MEMORY_COMPILER_NO_AUTO_PROD,
  NEXT_PHASE_TITLE,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  QUEUE_PRODUCTION_DEPLOY_DENIED,
  SEALED_SILENT_CLOUD_TRAINING_DENIED,
  SIM_NOT_VERIFIED_DISCOVERY,
  UNCONFIGURED_ACCELERATOR_UNAVAILABLE,
  UNCONTROLLED_SELF_IMPROVEMENT_DENIED,
  UNKNOWN_RIGHTS_TRAINING_DENIED,
  predecessorMap,
  type CtActor,
} from './ai-research-civilization-os-types';
import {
  buildAiResearchCivilizationOsHealthReport,
  runAiResearchCivilizationOsCycle,
} from './ai-research-civilization-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lct-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CtActor = {
  kind: 'research_dean',
  id: 'dean-ct-1',
  orgId: 'org-ct',
  tenantId: 'tenant-ct',
  universeId: 'univ-ct',
  role: 'dean',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CT1-cycle',
    AI_RESEARCH_CIVILIZATION_OS_CYCLE.join(' → ') ===
      'honesty_locks → research_civilization_bootstrap → bounded_research_schools_labs → multi_model_training_federation_local_first → unknown_rights_training_denied → sealed_training_eval_no_silent_cloud → knowledge_memory_compiler_candidates → memory_compiler_no_auto_prod_schema → autonomous_simulation_lab_bounded → sim_output_not_verified_discovery → accelerator_quantum_grid_classical_baseline → unconfigured_accelerator_qpu_unavailable → quantum_claim_without_evidence_rejected → scientific_discovery_graph_typed → correlation_to_causation_rejected → toolchain_academy_sandbox_only → academy_skill_no_permission_escalation → uncontrolled_self_improvement_denied → queue_production_deploy_denied → evidence → learning',
    'AI Research Civilization OS cycle recorded in order.',
  );

  check(
    'US-CT-locks',
    CT_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CT_LOCKS.UNCONTROLLED_SELF_IMPROVEMENT === false &&
      CT_LOCKS.OPEN_ENDED_SELF_MODIFY === false &&
      CT_LOCKS.UNKNOWN_RIGHTS_TRAINING === false &&
      CT_LOCKS.SEALED_SILENT_CLOUD_TRAINING_EVAL === false &&
      CT_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE === false &&
      CT_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE === false &&
      CT_LOCKS.UNCONFIGURED_ACCELERATOR_AVAILABLE === false &&
      CT_LOCKS.UNCONFIGURED_QPU_AVAILABLE === false &&
      CT_LOCKS.SIM_EQ_VERIFIED_DISCOVERY === false &&
      CT_LOCKS.CORRELATION_EQ_CAUSATION === false &&
      CT_LOCKS.ACADEMY_SKILL_ESCALATES_PERMISSIONS === false &&
      CT_LOCKS.MEMORY_COMPILER_AUTO_APPLY_PROD_SCHEMA === false &&
      CT_LOCKS.QUEUE_PRODUCTION_DEPLOY === false &&
      CT_LOCKS.LIVE_SUPABASE_APPLY === false &&
      CT_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-CT-honesty-surfaces',
    researchCivilizationHonesty().l4AutonomyEnabled === false &&
      trainingFederationHonesty().unknownRightsTraining === false &&
      memoryCompilerHonesty().autoApplyProdSchema === false &&
      simulationLabHonesty().simEqVerifiedDiscovery === false &&
      acceleratorGridHonesty().quantumWithoutBaseline === false &&
      discoveryGraphHonesty().correlationEqCausation === false &&
      toolchainAcademyHonesty().uncontrolledSelfImprovement === false &&
      toolchainAcademyHonesty().queueProductionDeploy === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  await bootstrapResearchCivilization({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const school = await registerResearchSchool({
    name: 'physics-school',
    domain: 'physics',
    root,
    actor,
  });
  const lab = await openResearchLab({
    schoolId: school.id,
    name: 'lab-a',
    universeId: actor.universeId,
    root,
    actor,
  });
  check(
    'US-CT-bounded-schools-labs',
    school.bounded && lab.bounded && school.l4AutonomyEnabled === false,
    school.reason,
  );

  // Uncontrolled self-improvement / open-ended self-modify DENIED
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
  const controlled = await attemptSelfImprovement({
    mode: 'controlled_sandbox',
    root,
    actor,
  });
  check(
    'US-CT-uncontrolled-self-improvement-denied',
    uncontrolled.status === 'denied' &&
      openEnded.status === 'denied' &&
      uncontrolled.reason === UNCONTROLLED_SELF_IMPROVEMENT_DENIED &&
      openEnded.reason === UNCONTROLLED_SELF_IMPROVEMENT_DENIED &&
      controlled.status === 'allowed_sandbox',
    uncontrolled.reason,
  );

  // Training on unknown-rights data DENIED
  const unknownDs = await registerTrainingDataset({
    label: 'unknown-scrape',
    rights: 'unknown',
    root,
    actor,
  });
  const stolenDs = await registerTrainingDataset({
    label: 'stolen',
    rights: 'stolen',
    root,
    actor,
  });
  const knownDs = await registerTrainingDataset({
    label: 'licensed',
    rights: 'known_licensed',
    sealed: true,
    root,
    actor,
  });
  const unknownJob = await enqueueTrainingJob({
    modelId: 'm1',
    datasetId: unknownDs.id,
    mode: 'local',
    root,
    actor,
  });
  check(
    'US-CT-unknown-rights-training-denied',
    unknownDs.status === 'denied' &&
      stolenDs.status === 'denied' &&
      unknownDs.reason === UNKNOWN_RIGHTS_TRAINING_DENIED &&
      unknownJob.status === 'denied' &&
      knownDs.status === 'accepted',
    unknownDs.reason,
  );

  // Quantum claim without evidence/classical baseline REJECTED
  const qpuOk = await registerAcceleratorNode({
    kind: 'qpu',
    configured: true,
    verified: true,
    root,
    actor,
  });
  const quantumReject = await planOptimization({
    workload: 'vqe',
    classicalBaselinePresent: false,
    quantumClaimed: true,
    quantumEvidencePresent: false,
    targetKind: 'qpu',
    acceleratorId: qpuOk.id,
    root,
    actor,
  });
  check(
    'US-CT-quantum-without-baseline-rejected',
    quantumReject.status === 'rejected' &&
      quantumReject.reason === QUANTUM_WITHOUT_BASELINE_REJECTED,
    quantumReject.reason,
  );

  // Queue cannot production-deploy
  const deploy = await attemptQueueProductionDeploy({
    target: 'production',
    root,
    actor,
  });
  check(
    'US-CT-queue-production-deploy-denied',
    deploy.status === 'denied' &&
      deploy.fromQueue === true &&
      deploy.reason === QUEUE_PRODUCTION_DEPLOY_DENIED,
    deploy.reason,
  );

  // Sealed training/eval cannot silent-route to cloud
  const sealedTrain = await enqueueTrainingJob({
    modelId: 'm1',
    datasetId: knownDs.id,
    mode: 'sealed',
    silentCloudFallbackRequested: true,
    root,
    actor,
  });
  const sealedEval = await runLocalEval({
    modelId: 'm1',
    mode: 'sealed',
    sealed: true,
    silentCloudFallbackRequested: true,
    root,
    actor,
  });
  check(
    'US-CT-sealed-no-silent-cloud',
    sealedTrain.status === 'denied' &&
      sealedEval.status === 'denied' &&
      sealedTrain.reason === SEALED_SILENT_CLOUD_TRAINING_DENIED &&
      sealedEval.reason === SEALED_SILENT_CLOUD_TRAINING_DENIED,
    sealedTrain.reason,
  );

  // Sim output not labeled verified discovery
  const sim = await runMultiUniverseSimulation({
    labId: lab.id,
    universeIds: ['u1', 'u2'],
    root,
    actor,
  });
  const simLabel = await attemptLabelSimAsVerifiedDiscovery({
    simulationId: sim.id,
    root,
    actor,
  });
  check(
    'US-CT-sim-not-verified-discovery',
    sim.verifiedDiscovery === false &&
      sim.label === 'LABELED_SIMULATION' &&
      simLabel.status === 'rejected' &&
      simLabel.reason === SIM_NOT_VERIFIED_DISCOVERY,
    simLabel.reason,
  );

  // Academy skill does not escalate permissions
  const skill = await recordAcademySkill({
    agentId: actor.id,
    skill: 'debug-sandbox',
    permissionLevel: 0,
    requestEscalation: true,
    root,
    actor,
  });
  check(
    'US-CT-academy-skill-no-escalation',
    skill.status === 'denied' &&
      skill.permissionLevelAfter === skill.permissionLevelBefore &&
      skill.reason === ACADEMY_SKILL_NO_ESCALATION,
    skill.reason,
  );

  // Memory compiler cannot auto-apply production schema
  const pack = await compileMemoryPack({
    label: 'pack-1',
    sources: ['a', 'b'],
    root,
    actor,
  });
  const schema = await attemptAutoApplyProductionSchema({
    packId: pack.id,
    autoApplyRequested: true,
    root,
    actor,
  });
  check(
    'US-CT-memory-compiler-no-auto-prod',
    pack.candidateOnly === true &&
      pack.appliedToProduction === false &&
      schema.status === 'denied' &&
      schema.reason === MEMORY_COMPILER_NO_AUTO_PROD,
    schema.reason,
  );

  // Unconfigured accelerator/QPU → UNAVAILABLE
  const unconfigured = await registerAcceleratorNode({
    kind: 'qpu',
    configured: false,
    verified: false,
    root,
    actor,
  });
  const unavailPlan = await planOptimization({
    workload: 'anneal',
    classicalBaselinePresent: true,
    quantumClaimed: true,
    quantumEvidencePresent: true,
    targetKind: 'qpu',
    acceleratorId: unconfigured.id,
    root,
    actor,
  });
  check(
    'US-CT-unconfigured-accelerator-unavailable',
    unconfigured.status === 'unavailable' &&
      unavailPlan.status === 'unavailable' &&
      unavailPlan.reason === UNCONFIGURED_ACCELERATOR_UNAVAILABLE,
    unavailPlan.reason,
  );

  // Discovery graph rejects correlation→causation promotion without evidence
  const corr = await recordDiscoveryNode({
    label: 'corr-ab',
    kind: 'correlation',
    evidenceRefs: ['obs'],
    root,
    actor,
  });
  const promote = await attemptPromoteDiscovery({
    fromId: corr.id,
    toKind: 'causation',
    evidencePresent: false,
    root,
    actor,
  });
  check(
    'US-CT-correlation-to-causation-rejected',
    promote.status === 'rejected' &&
      promote.reason === CORRELATION_TO_CAUSATION_REJECTED,
    promote.reason,
  );

  const cycleRoot = await mkdtemp(join(tmpdir(), 'xiv-62lct-cycle-'));
  try {
    const cycle = await runAiResearchCivilizationOsCycle({
      orgId: actor.orgId,
      tenantId: actor.tenantId,
      universeId: actor.universeId,
      actor,
      root: cycleRoot,
    });
    check(
      'US-CT-cycle-runtime',
      cycle.ok === true &&
        cycle.hops.length === AI_RESEARCH_CIVILIZATION_OS_CYCLE.length &&
        cycle.l4AutonomyEnabled === false &&
        cycle.nextPhase === NEXT_PHASE_TITLE,
      `hops=${cycle.hops.length} ok=${cycle.ok}`,
    );
  } finally {
    await rm(cycleRoot, { recursive: true, force: true });
  }

  const health = await buildAiResearchCivilizationOsHealthReport({ root: repoRoot });
  check(
    'US-CT-health-report',
    health.phase === '62L-CT' &&
      health.githubSotIssue === 110 &&
      health.gitlabCoordinationIssue === 44 &&
      health.tipLand === false &&
      health.productionAuthorized === false &&
      health.documentedEqImplemented === false,
    health.honestyBanner,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CT-predecessors',
    preds.CP.tipProbe === 'PRESENT' &&
      preds.CP.report === 'PRESENT' &&
      (preds.CS.tipProbe === 'WAITING_DATA' || preds.CS.tipProbe === 'PRESENT') &&
      (preds.CR.tipProbe === 'WAITING_DATA' || preds.CR.tipProbe === 'PRESENT') &&
      (preds.CQ.tipProbe === 'WAITING_DATA' || preds.CQ.tipProbe === 'PRESENT'),
    `CS=${preds.CS.tipProbe}/${preds.CS.report}; CR=${preds.CR.tipProbe}/${preds.CR.report}; CQ=${preds.CQ.tipProbe}/${preds.CQ.report}; CP=${preds.CP.tipProbe}/${preds.CP.report}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-CT stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('PASS 62L-CT all required stories');
