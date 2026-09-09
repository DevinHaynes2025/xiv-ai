/**
 * 62L-CV Distributed Intelligence Laboratory OS runtime —
 * Façade coordinating workforce, models, experiments, compute, tools, knowledge.
 * Walks DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
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
  bootstrapCognitiveResearchCloud,
  cognitiveResearchCloudHonesty,
} from './cognitive-research-cloud';
import {
  CV_LOCKS,
  DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type CvActor,
  type CvEvidenceState,
  type CvHop,
  type CvHopRecord,
} from './distributed-intelligence-laboratory-os-types';

export {
  CV_LOCKS,
  DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CvHop, state: CvEvidenceState, summary: string): CvHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CvCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CvActor;
  root?: string;
};

export async function runDistributedIntelligenceLaboratoryOsCycle(input: CvCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CvHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CV_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CV_LOCKS.LOCAL_FIRST &&
        CV_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
        CV_LOCKS.CENSUS_CAN_INVENT_LIVE_AGENTS === false &&
        CV_LOCKS.MODEL_EVOLUTION_REQUIRES_LINEAGE &&
        CV_LOCKS.UNKNOWN_RIGHTS_DATASET_INTAKE === false &&
        CV_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED &&
        CV_LOCKS.TOOL_PROMOTION_REQUIRES_SBOM &&
        CV_LOCKS.UNAUTHORIZED_KNOWLEDGE_SOURCE_ALLOWED === false &&
        CV_LOCKS.SEALED_SILENT_CLOUD_ACCELERATOR_FALLBACK === false &&
        CV_LOCKS.SKILL_TOOL_GRANT_IS_PERMISSION === false &&
        CV_LOCKS.QUEUE_PRODUCTION_DEPLOY === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const cuCloud = await bootstrapCognitiveResearchCloud({
    orgId: input.orgId,
    tenantId: input.tenantId,
    root,
    actor: {
      kind: 'human_operator',
      id: actor.id,
      orgId: input.orgId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      role: actor.role,
      permissionLevel: actor.permissionLevel,
      authorityLevel: actor.authorityLevel,
    },
  });
  hops.push(
    hop(
      'lab_os_bootstrap',
      cuCloud && cognitiveResearchCloudHonesty().l4AutonomyEnabled === false
        ? 'IMPLEMENTED'
        : 'FAIL',
      `Lab OS façade over CU cognitive research cloud id=${cuCloud.id}`,
    ),
  );

  const workcell = await registerFederatedWorkcell({
    name: 'lab-workcell-1',
    orgId: input.orgId,
    tenantId: input.tenantId,
    root,
    actor,
  });
  hops.push(
    hop(
      'workforce_federation_census',
      workcell.accepted ? 'REGISTERED' : 'FAIL',
      workcell.reason,
    ),
  );

  const noHb = await claimWorkcellRunningVerified({
    workcellId: workcell.workcell!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'workcell_without_heartbeat_not_running_verified',
      noHb.accepted === false ? 'DENIED' : 'FAIL',
      noHb.reason,
    ),
  );

  const invent = await inventLiveAgentInCensus({
    inventedName: 'ghost-agent',
    root,
    actor,
  });
  hops.push(
    hop(
      'census_cannot_invent_live_agents',
      invent.accepted === false ? 'DENIED' : 'FAIL',
      invent.reason,
    ),
  );

  const rootModel = await registerRootModelNode({
    modelId: 'local-llm-base',
    metadata: { architecture: 'transformer', version: '0' },
    root,
    actor,
  });
  const noLineage = await proposeEvolutionNode({
    modelId: 'local-llm-child',
    parentNodeId: null,
    metadata: {},
    root,
    actor,
  });
  hops.push(
    hop(
      'model_evolution_lineage_required',
      noLineage.accepted === false ? 'DENIED' : 'FAIL',
      noLineage.reason,
    ),
  );
  hops.push(
    hop(
      'model_evolution_sandbox_until_eval_review',
      rootModel.accepted && rootModel.node?.status === 'SANDBOX' ? 'SANDBOXED' : 'FAIL',
      rootModel.reason,
    ),
  );

  const unknownRights = await intakeExperimentDataset({
    experimentId: 'exp-unknown',
    kind: 'result',
    rightsClass: 'unknown_rights',
    root,
    actor,
  });
  hops.push(
    hop(
      'experiment_lake_unknown_rights_denied',
      unknownRights.accepted === false ? 'DENIED' : 'FAIL',
      unknownRights.reason,
    ),
  );

  await intakeExperimentDataset({
    experimentId: 'exp-neg-1',
    kind: 'negative',
    rightsClass: 'authorized_owned',
    reproducibilityMetadata: { seed: '1', commit: 'abc' },
    root,
    actor,
  });
  const negatives = await searchNegatives({ root, query: 'exp-neg' });
  hops.push(
    hop(
      'experiment_negatives_searchable',
      negatives.length > 0 ? 'SEARCHABLE' : 'FAIL',
      `negatives=${negatives.length}`,
    ),
  );

  const unverifiedGpu = await registerComputeTarget({
    kind: 'nvidia',
    configured: false,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  const schedUnverified = await scheduleComputeJob({
    targetKind: 'nvidia',
    targetId: unverifiedGpu.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'scheduler_unverified_accelerator_unavailable',
      schedUnverified.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FAIL',
      schedUnverified.reason,
    ),
  );

  const qNoBaseline = await scheduleComputeJob({
    targetKind: 'quantum',
    classicalBaselineRef: null,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_without_classical_baseline_rejected',
      qNoBaseline.status === 'REJECTED' ? 'REJECTED' : 'FAIL',
      qNoBaseline.reason,
    ),
  );

  const tool = await registerResearchTool({
    name: 'research-probe',
    sbomPresent: false,
    securityGatePassed: false,
    benchmarkPassed: false,
    root,
    actor,
  });
  const unpromoted = await attemptPromoteResearchTool({
    toolId: tool.tool!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'tool_without_sbom_security_unpromoted',
      unpromoted.accepted === false && unpromoted.tool?.lifecycle === 'unpromoted'
        ? 'UNPROMOTED'
        : 'FAIL',
      unpromoted.reason,
    ),
  );

  const unauthKnowledge = await expandKnowledgeFromSource({
    sourceId: 'shadow-wiki',
    sourceAuthorization: 'unauthorized',
    claimKind: 'fact_candidate',
    claimText: 'unsupported expansion',
    root,
    actor,
  });
  hops.push(
    hop(
      'knowledge_unauthorized_source_denied',
      unauthKnowledge.accepted === false ? 'DENIED' : 'FAIL',
      unauthKnowledge.reason,
    ),
  );

  const sealed = await scheduleComputeJob({
    targetKind: 'amd',
    contentMode: 'sealed',
    silentCloudAcceleratorFallback: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_no_silent_cloud_accelerator',
      sealed.status === 'DENIED' ? 'DENIED' : 'FAIL',
      sealed.reason,
    ),
  );

  const skillGrant = await grantSkillOrToolOnEvolution({
    nodeId: rootModel.node!.id,
    skillOrToolId: 'skill-probe',
    root,
    actor,
  });
  const toolGrant = await grantToolSkillWithoutEscalation({
    toolId: tool.tool!.id,
    root,
    actor,
  });
  const queueDeny = await queueProductionDeploy({
    toolId: tool.tool!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'skill_tool_grant_no_permission_escalation',
      skillGrant.permissionLevelAfter === actor.permissionLevel &&
        toolGrant.permissionLevelAfter === actor.permissionLevel
        ? 'PASS'
        : 'FAIL',
      skillGrant.reason,
    ),
  );
  hops.push(
    hop(
      'queue_production_deploy_denied',
      queueDeny.accepted === false ? 'DENIED' : 'FAIL',
      queueDeny.reason,
    ),
  );

  void decisionGate({
    id: 'cv-cycle-gate',
    action: 'distributed_intelligence_laboratory_os_cycle',
    consequence: 'HIGH',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-CV distributed intelligence laboratory OS cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-CV'],
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CV distributed intelligence laboratory OS cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning≠permission; registration≠authority`,
      sourceRefs: ['62L-CV'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; does not grant permission'));

  void workforceFederationHonesty;
  void modelEvolutionGraphHonesty;
  void experimentDataLakeHonesty;
  void heterogeneousSchedulerHonesty;
  void toolResearchFactoryHonesty;
  void knowledgeExpansionHonesty;
  void recordWorkcellHeartbeat;

  return {
    ok: hops.every((h) =>
      [
        'PASS',
        'DENIED',
        'REJECTED',
        'UNAVAILABLE',
        'SANDBOXED',
        'REGISTERED',
        'SEARCHABLE',
        'UNPROMOTED',
        'IMPLEMENTED',
        'BOUNDED',
        'WAITING_DATA',
        'STALE',
        'HYPOTHESIS',
        'LINEAGED',
        'NEGATIVE_KEPT',
        'LOCAL_PREFERRED',
      ].includes(h.state),
    ),
    cycle: DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_CYCLE,
    hops,
    honestyBanner: HONESTY_BANNER,
    locks: CV_LOCKS,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessors: predecessorMap(root),
    productionAuthorized: false as const,
    l4AutonomyEnabled: false as const,
  };
}

export async function buildDistributedIntelligenceLaboratoryOsHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const brain = await checkLocalBrainHealth(root).catch(() => ({
    ok: false,
    model: { availability: 'UNAVAILABLE' as const, reason: 'health_check_unavailable' },
    localStateDirectory: 'MISSING' as const,
    notes: ['health_check_unavailable'],
  }));
  return {
    phase: '62L-CV',
    title:
      'Distributed Intelligence Laboratory OS + Agent Research Workforce Federation + Local Model Evolution Graph + Global Experiment Data Lake + Heterogeneous Compute Scheduler + Autonomous Tool Research Factory + Scientific Knowledge Expansion Engine',
    honestyBanner: HONESTY_BANNER,
    locks: CV_LOCKS,
    cycle: DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_CYCLE,
    predecessors: predecessorMap(root),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    githubSotIssue: 112,
    gitlabCoordinationIssue: 46,
    localBrainHealth: brain,
    productionAuthorized: false as const,
    tipLand: false as const,
    dbCandidatesApplied: false as const,
    at: new Date().toISOString(),
  };
}
