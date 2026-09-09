import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  claimWorkcellRunningVerified,
  inventLiveAgentInCensus,
  recordWorkcellHeartbeat,
  registerFederatedWorkcell,
  workforceFederationHonesty,
} from './agent-research-workforce-federation';
import {
  grantSkillOrToolOnEvolution,
  modelEvolutionGraphHonesty,
  proposeEvolutionNode,
  registerRootModelNode,
} from './local-model-evolution-graph';
import {
  experimentDataLakeHonesty,
  intakeExperimentDataset,
  searchNegatives,
} from './global-experiment-data-lake';
import {
  heterogeneousSchedulerHonesty,
  registerComputeTarget,
  scheduleComputeJob,
} from './heterogeneous-compute-scheduler';
import {
  attemptPromoteResearchTool,
  grantToolSkillWithoutEscalation,
  queueProductionDeploy,
  registerResearchTool,
  toolResearchFactoryHonesty,
} from './autonomous-tool-research-factory';
import {
  expandKnowledgeFromSource,
  knowledgeExpansionHonesty,
} from './scientific-knowledge-expansion-engine';
import {
  CV_LOCKS,
  DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  CENSUS_INVENT_LIVE_DENIED,
  MODEL_LINEAGE_REQUIRED,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  SEALED_SILENT_CLOUD_ACCELERATOR_DENIED,
  SKILL_TOOL_NO_PERMISSION_ESCALATION,
  TOOL_UNPROMOTED_WITHOUT_GATES,
  UNAUTHORIZED_KNOWLEDGE_DENIED,
  UNKNOWN_RIGHTS_INTAKE_DENIED,
  UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  predecessorMap,
  type CvActor,
} from './distributed-intelligence-laboratory-os-types';
import {
  buildDistributedIntelligenceLaboratoryOsHealthReport,
  runDistributedIntelligenceLaboratoryOsCycle,
} from './distributed-intelligence-laboratory-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcv-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CvActor = {
  kind: 'lab_os_curator',
  id: 'curator-cv-1',
  orgId: 'org-cv',
  tenantId: 'tenant-cv',
  universeId: 'univ-cv',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-CV1-cycle',
    DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_CYCLE.join(' → ') ===
      'honesty_locks → lab_os_bootstrap → workforce_federation_census → workcell_without_heartbeat_not_running_verified → census_cannot_invent_live_agents → model_evolution_lineage_required → model_evolution_sandbox_until_eval_review → experiment_lake_unknown_rights_denied → experiment_negatives_searchable → scheduler_unverified_accelerator_unavailable → quantum_without_classical_baseline_rejected → tool_without_sbom_security_unpromoted → knowledge_unauthorized_source_denied → sealed_no_silent_cloud_accelerator → skill_tool_grant_no_permission_escalation → queue_production_deploy_denied → evidence → learning',
    'Distributed Intelligence Laboratory OS cycle recorded in order.',
  );

  check(
    'US-CV-locks',
    CV_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CV_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
      CV_LOCKS.CENSUS_CAN_INVENT_LIVE_AGENTS === false &&
      CV_LOCKS.MODEL_EVOLUTION_REQUIRES_LINEAGE &&
      CV_LOCKS.UNKNOWN_RIGHTS_DATASET_INTAKE === false &&
      CV_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE === false &&
      CV_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED &&
      CV_LOCKS.TOOL_PROMOTION_REQUIRES_SBOM &&
      CV_LOCKS.UNAUTHORIZED_KNOWLEDGE_SOURCE_ALLOWED === false &&
      CV_LOCKS.SEALED_SILENT_CLOUD_ACCELERATOR_FALLBACK === false &&
      CV_LOCKS.SKILL_TOOL_GRANT_IS_PERMISSION === false &&
      CV_LOCKS.QUEUE_PRODUCTION_DEPLOY === false &&
      CV_LOCKS.LIVE_SUPABASE_APPLY === false &&
      CV_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-CV-honesty-surfaces',
    workforceFederationHonesty().runningVerifiedWithoutHeartbeat === false &&
      modelEvolutionGraphHonesty().requiresLineage === true &&
      experimentDataLakeHonesty().unknownRightsIntake === false &&
      heterogeneousSchedulerHonesty().quantumClassicalBaselineRequired === true &&
      toolResearchFactoryHonesty().requiresSbom === true &&
      knowledgeExpansionHonesty().unauthorizedAllowed === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-CV-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CW —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CV-predecessor-CQ',
    preds.CQ.tipProbe === 'PRESENT' && preds.CQ.report === 'PRESENT',
    `CQ tip=${preds.CQ.tipProbe} report=${preds.CQ.report}; CU=${preds.CU.tipProbe}/${preds.CU.report}`,
  );

  // Workcell without heartbeat not RUNNING_VERIFIED
  const wc = await registerFederatedWorkcell({
    name: 'wc-no-hb',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    root,
    actor,
  });
  const claimNoHb = await claimWorkcellRunningVerified({
    workcellId: wc.workcell!.id,
    root,
    actor,
  });
  check(
    'US-CV-workcell-no-heartbeat',
    claimNoHb.accepted === false &&
      claimNoHb.reason === NO_HEARTBEAT_NOT_RUNNING_VERIFIED &&
      claimNoHb.workcell?.status !== 'RUNNING_VERIFIED',
    claimNoHb.reason,
  );

  // With heartbeat → RUNNING_VERIFIED
  const hb = await recordWorkcellHeartbeat({
    workcellId: wc.workcell!.id,
    runtimeEvidence: 'pid=1;runtime=local-shift',
    root,
    actor,
  });
  check(
    'US-CV-workcell-with-heartbeat',
    hb.accepted === true && hb.workcell?.status === 'RUNNING_VERIFIED',
    hb.reason,
  );

  // Census cannot invent live agents
  const invent = await inventLiveAgentInCensus({
    inventedName: 'fake-live',
    root,
    actor,
  });
  check(
    'US-CV-census-no-invent',
    invent.accepted === false && invent.reason === CENSUS_INVENT_LIVE_DENIED,
    invent.reason,
  );

  // Model evolution node requires lineage parent/metadata
  const missingLineage = await proposeEvolutionNode({
    modelId: 'orphan-model',
    parentNodeId: null,
    metadata: {},
    root,
    actor,
  });
  check(
    'US-CV-model-lineage-required',
    missingLineage.accepted === false && missingLineage.reason === MODEL_LINEAGE_REQUIRED,
    missingLineage.reason,
  );

  const rootNode = await registerRootModelNode({
    modelId: 'base-local',
    metadata: { arch: 'llama', rev: '1' },
    root,
    actor,
  });
  const child = await proposeEvolutionNode({
    modelId: 'child-local',
    parentNodeId: rootNode.node!.id,
    metadata: { delta: 'lora-v1' },
    root,
    actor,
  });
  check(
    'US-CV-model-lineage-ok-sandbox',
    child.accepted === true && child.node?.status === 'SANDBOX',
    child.reason,
  );

  // Unknown-rights dataset intake DENIED
  const unknownRights = await intakeExperimentDataset({
    experimentId: 'exp-ur',
    kind: 'result',
    rightsClass: 'unknown_rights',
    root,
    actor,
  });
  check(
    'US-CV-unknown-rights-denied',
    unknownRights.accepted === false && unknownRights.reason === UNKNOWN_RIGHTS_INTAKE_DENIED,
    unknownRights.reason,
  );

  await intakeExperimentDataset({
    experimentId: 'exp-neg-cv',
    kind: 'negative',
    rightsClass: 'authorized_owned',
    reproducibilityMetadata: { seed: '42' },
    root,
    actor,
  });
  const negs = await searchNegatives({ root, query: 'exp-neg' });
  check('US-CV-negatives-searchable', negs.length >= 1, `count=${negs.length}`);

  // Scheduler refuses unverified accelerator/QPU (UNAVAILABLE)
  const unverified = await registerComputeTarget({
    kind: 'amd',
    configured: false,
    root,
    actor,
  });
  const schedFail = await scheduleComputeJob({
    targetKind: 'amd',
    targetId: unverified.id,
    root,
    actor,
  });
  check(
    'US-CV-unverified-accelerator-unavailable',
    schedFail.status === 'UNAVAILABLE' &&
      schedFail.reason === UNVERIFIED_ACCELERATOR_UNAVAILABLE,
    schedFail.reason,
  );

  const unverifiedQpu = await registerComputeTarget({
    kind: 'quantum',
    configured: true,
    authorized: true,
    verified: false,
    root,
    actor,
  });
  const qpuFail = await scheduleComputeJob({
    targetKind: 'quantum',
    targetId: unverifiedQpu.id,
    classicalBaselineRef: 'cpu-baseline-1',
    root,
    actor,
  });
  check(
    'US-CV-unverified-qpu-unavailable',
    qpuFail.status === 'UNAVAILABLE',
    qpuFail.reason,
  );

  // Quantum schedule without classical baseline REJECTED
  const qNoBase = await scheduleComputeJob({
    targetKind: 'quantum',
    classicalBaselineRef: null,
    root,
    actor,
  });
  check(
    'US-CV-quantum-no-baseline-rejected',
    qNoBase.status === 'REJECTED' && qNoBase.reason === QUANTUM_WITHOUT_BASELINE_REJECTED,
    qNoBase.reason,
  );

  // Tool without SBOM/security gate remains unpromoted
  const tool = await registerResearchTool({
    name: 'ungated-tool',
    sbomPresent: false,
    securityGatePassed: false,
    benchmarkPassed: true,
    root,
    actor,
  });
  const promote = await attemptPromoteResearchTool({
    toolId: tool.tool!.id,
    root,
    actor,
  });
  check(
    'US-CV-tool-unpromoted-without-gates',
    promote.accepted === false &&
      promote.tool?.lifecycle === 'unpromoted' &&
      promote.reason === TOOL_UNPROMOTED_WITHOUT_GATES,
    promote.reason,
  );

  // Knowledge expansion from unauthorized source DENIED
  const unauth = await expandKnowledgeFromSource({
    sourceId: 'rogue-corpus',
    sourceAuthorization: 'unauthorized',
    claimKind: 'fact_candidate',
    claimText: 'should deny',
    root,
    actor,
  });
  check(
    'US-CV-unauthorized-knowledge-denied',
    unauth.accepted === false && unauth.reason === UNAUTHORIZED_KNOWLEDGE_DENIED,
    unauth.reason,
  );

  // Sealed job cannot silent-route to cloud accelerator gateway
  const sealed = await scheduleComputeJob({
    targetKind: 'nvidia',
    contentMode: 'sealed',
    silentCloudAcceleratorFallback: true,
    root,
    actor,
  });
  check(
    'US-CV-sealed-no-silent-cloud',
    sealed.status === 'DENIED' && sealed.reason === SEALED_SILENT_CLOUD_ACCELERATOR_DENIED,
    sealed.reason,
  );

  // Skill/tool grant ≠ permission escalation
  const skillGrant = await grantSkillOrToolOnEvolution({
    nodeId: rootNode.node!.id,
    skillOrToolId: 'skill-x',
    root,
    actor,
  });
  const toolGrant = await grantToolSkillWithoutEscalation({
    toolId: tool.tool!.id,
    root,
    actor,
  });
  check(
    'US-CV-skill-tool-no-escalation',
    skillGrant.permissionLevelAfter === actor.permissionLevel &&
      toolGrant.permissionLevelAfter === actor.permissionLevel &&
      skillGrant.reason === SKILL_TOOL_NO_PERMISSION_ESCALATION,
    `permAfter skill=${skillGrant.permissionLevelAfter} tool=${toolGrant.permissionLevelAfter}`,
  );

  const queueDeny = await queueProductionDeploy({
    toolId: tool.tool!.id,
    root,
    actor,
  });
  check('US-CV-queue-deploy-denied', queueDeny.accepted === false, queueDeny.reason);

  // Verified CPU schedule succeeds
  const cpu = await registerComputeTarget({
    kind: 'cpu',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const cpuJob = await scheduleComputeJob({
    targetKind: 'cpu',
    targetId: cpu.id,
    root,
    actor,
  });
  check('US-CV-verified-cpu-scheduled', cpuJob.status === 'SCHEDULED', cpuJob.reason);

  const cycle = await runDistributedIntelligenceLaboratoryOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });
  check('US-CV-cycle-ok', cycle.ok === true, `hops=${cycle.hops.length}`);

  const health = await buildDistributedIntelligenceLaboratoryOsHealthReport({ root: repoRoot });
  check(
    'US-CV-health-report',
    health.phase === '62L-CV' && health.productionAuthorized === false,
    health.honestyBanner,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL 62L-CV (${failures.length})`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-CV distributed intelligence laboratory OS tests passed');
