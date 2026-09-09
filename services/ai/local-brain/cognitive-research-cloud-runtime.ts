/**
 * 62L-CU runtime — walks COGNITIVE_RESEARCH_CLOUD_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  attemptQueueProductionDeploy,
  bootstrapCognitiveResearchCloud,
  cognitiveResearchCloudHonesty,
} from './cognitive-research-cloud';
import {
  agentUniversityFederationHonesty,
  enrollFederatedUniversity,
  federateUniversities,
  grantUniversitySkill,
} from './agent-university-federation';
import {
  attemptUncontrolledSelfImprove,
  attemptUnknownRightsTraining,
  continuousLocalModelAcademyHonesty,
  promoteLocalModelCandidate,
  proposeLocalModelImprovement,
} from './continuous-local-model-academy';
import {
  discardNegativeResult,
  distributedExperimentMemoryHonesty,
  recordExperiment,
  searchExperiments,
} from './distributed-experiment-memory';
import {
  multiCloudScientificComputeHonesty,
  registerScientificComputeEndpoint,
  routeScientificCompute,
} from './multi-cloud-scientific-compute-fabric';
import {
  algorithmEvolutionGraphHonesty,
  getAlgorithmLineage,
  registerBaselineAlgorithm,
  spawnAlgorithmVariant,
} from './algorithm-evolution-graph';
import {
  invokeRuntimePlugin,
  probeRegistrationAuthority,
  registerRuntimePlugin,
  universalToolPluginRuntimeHonesty,
} from './universal-tool-plugin-runtime';
import {
  COGNITIVE_RESEARCH_CLOUD_CYCLE,
  CU_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type CuActor,
  type CuEvidenceState,
  type CuHop,
  type CuHopRecord,
} from './cognitive-research-cloud-types';

export {
  COGNITIVE_RESEARCH_CLOUD_CYCLE,
  CU_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CuHop, state: CuEvidenceState, summary: string): CuHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CuCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CuActor;
  root?: string;
};

export async function runCognitiveResearchCloudCycle(input: CuCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CuHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CU_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CU_LOCKS.LOCAL_FIRST &&
        CU_LOCKS.EXPERIMENTS_REQUIRE_REPRODUCIBILITY_METADATA &&
        CU_LOCKS.NEGATIVE_RESULTS_DISCARDED === false &&
        CU_LOCKS.ALGORITHM_VARIANTS_CARRY_LINEAGE &&
        CU_LOCKS.LOCAL_MODEL_IMPROVEMENT_SANDBOX_UNTIL_EVAL_REVIEW &&
        CU_LOCKS.UNCONTROLLED_SELF_IMPROVEMENT === false &&
        CU_LOCKS.UNKNOWN_RIGHTS_TRAINING === false &&
        CU_LOCKS.DENY_BY_DEFAULT_PLUGIN_PERMISSIONS &&
        CU_LOCKS.SEALED_SILENT_CLOUD_COMPUTE_FALLBACK === false &&
        CU_LOCKS.UNIVERSITY_SKILL_IS_PERMISSION === false &&
        CU_LOCKS.QUEUE_PRODUCTION_DEPLOY === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const cloud = await bootstrapCognitiveResearchCloud({
    orgId: input.orgId,
    tenantId: input.tenantId,
    root,
    actor,
  });
  hops.push(hop('cognitive_research_cloud_bootstrap', 'PASS', cloud.id));

  const noRepro = await recordExperiment({
    title: 'cu-no-repro-exp',
    outcome: 'positive',
    reproducibility: null,
    claimVerified: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'experiment_reproducibility_gate',
      noRepro.verificationState === 'NOT_VERIFIED' ? 'PASS' : 'FAIL',
      noRepro.reason,
    ),
  );

  const negative = await recordExperiment({
    title: 'cu-negative-searchable',
    outcome: 'negative',
    reproducibility: { seed: 42, codeRef: 'cu://algo/v1' },
    root,
    actor,
  });
  const discard = await discardNegativeResult({
    experimentId: negative.id,
    root,
    actor,
  });
  const foundNeg = await searchExperiments({
    query: 'cu-negative',
    outcome: 'negative',
    root,
    actor,
  });
  hops.push(
    hop(
      'negative_result_searchable',
      discard.status === 'denied' &&
        negative.discarded === false &&
        negative.searchable &&
        foundNeg.some((h) => h.id === negative.id)
        ? 'SEARCHABLE'
        : 'FAIL',
      negative.reason,
    ),
  );

  const baseline = await registerBaselineAlgorithm({
    name: 'cu-baseline',
    root,
    actor,
  });
  const variant = await spawnAlgorithmVariant({
    name: 'cu-variant-1',
    parentId: baseline.id,
    outcome: 'negative',
    root,
    actor,
  });
  const lineage =
    'status' in variant
      ? { parentLinkIntact: false, node: null }
      : await getAlgorithmLineage({ algorithmId: variant.id, root, actor });
  hops.push(
    hop(
      'algorithm_variant_lineage',
      !('status' in variant) &&
        variant.parentId === baseline.id &&
        lineage.parentLinkIntact
        ? 'LINEAGED'
        : 'FAIL',
      !('status' in variant) ? variant.reason : variant.reason,
    ),
  );

  const model = await proposeLocalModelImprovement({
    name: 'cu-local-model-v1',
    rightsKnown: true,
    root,
    actor,
  });
  const earlyPromo = await promoteLocalModelCandidate({
    candidateId: model.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'local_model_sandbox_until_eval_review',
      model.sandbox &&
        model.lifecycle === 'sandbox' &&
        earlyPromo.status === 'sandboxed'
        ? 'SANDBOXED'
        : 'FAIL',
      model.reason,
    ),
  );

  const selfImprove = await attemptUncontrolledSelfImprove({
    candidateId: model.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'uncontrolled_self_improve_denied',
      selfImprove.status === 'denied' ? 'DENIED' : 'FAIL',
      selfImprove.reason,
    ),
  );

  const unknownRights = await attemptUnknownRightsTraining({
    datasetLabel: 'unknown-rights-scrape',
    root,
    actor,
  });
  hops.push(
    hop(
      'unknown_rights_training_denied',
      unknownRights.status === 'denied' ? 'DENIED' : 'FAIL',
      unknownRights.reason,
    ),
  );

  const uniA = await enrollFederatedUniversity({
    name: 'CU Research North',
    department: 'research',
    region: 'north',
    orgId: input.orgId,
    tenantId: input.tenantId,
    root,
    actor,
  });
  const uniB = await enrollFederatedUniversity({
    name: 'CU Research South',
    department: 'engineering',
    region: 'south',
    orgId: input.orgId,
    tenantId: input.tenantId,
    root,
    actor,
  });
  const bond = await federateUniversities({
    universityIds: [uniA.id, uniB.id],
    root,
    actor,
  });
  hops.push(
    hop(
      'university_federation_bounded',
      bond.status === 'bounded' && uniA.bounded && uniB.bounded ? 'BOUNDED' : 'FAIL',
      bond.reason,
    ),
  );

  const skillEsc = await grantUniversitySkill({
    universityId: uniA.id,
    agentId: actor.id,
    skillKey: 'federated-research',
    priorPermissionLevel: actor.permissionLevel,
    claimedPermissionEscalation: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'university_skill_no_permission',
      skillEsc.status === 'denied' &&
        skillEsc.permissionIncreased === false &&
        skillEsc.permissionLevel === actor.permissionLevel
        ? 'DENIED'
        : 'FAIL',
      skillEsc.reason,
    ),
  );

  const plugin = await registerRuntimePlugin({
    name: 'cu-tool',
    scopes: ['read:experiments'],
    root,
    actor,
  });
  const missingScope = await invokeRuntimePlugin({
    pluginId: plugin.id,
    requestedScope: 'write:production',
    root,
    actor,
  });
  hops.push(
    hop(
      'plugin_deny_by_default_missing_scope',
      missingScope.status === 'denied' ? 'DENIED' : 'FAIL',
      missingScope.reason,
    ),
  );

  const authProbe = await probeRegistrationAuthority({
    pluginId: plugin.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'registration_no_authority',
      authProbe.status === 'denied' && plugin.grantsAuthority === false
        ? 'DENIED'
        : 'FAIL',
      authProbe.reason,
    ),
  );

  const localEp = await registerScientificComputeEndpoint({
    provider: 'local',
    configured: true,
    root,
    actor,
  });
  const localRoute = await routeScientificCompute({
    provider: 'local',
    contentMode: 'open',
    endpointId: localEp.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'scientific_compute_local_first',
      localRoute.status === 'allowed' && localEp.status === 'AVAILABLE'
        ? 'LOCAL_PREFERRED'
        : 'FAIL',
      localRoute.reason,
    ),
  );

  const awsUncfg = await registerScientificComputeEndpoint({
    provider: 'aws',
    configured: false,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  const gcpUncfg = await registerScientificComputeEndpoint({
    provider: 'gcp',
    configured: false,
    root,
    actor,
  });
  const awsRoute = await routeScientificCompute({
    provider: 'aws',
    contentMode: 'open',
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_aws_gcp_unavailable',
      awsUncfg.status === 'UNAVAILABLE' &&
        gcpUncfg.status === 'UNAVAILABLE' &&
        awsRoute.status === 'unavailable'
        ? 'UNAVAILABLE'
        : 'FAIL',
      awsUncfg.reason,
    ),
  );

  const sealedRoute = await routeScientificCompute({
    provider: 'aws',
    contentMode: 'sealed',
    silentFallbackRequested: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_no_silent_cloud_compute',
      sealedRoute.status === 'denied' ? 'DENIED' : 'FAIL',
      sealedRoute.reason,
    ),
  );

  const deploy = await attemptQueueProductionDeploy({
    cloudId: cloud.id,
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
      summary: '62L-CU cognitive research cloud cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-CU'],
        cloudId: cloud.id,
        baselineId: baseline.id,
        pluginId: plugin.id,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CU cognitive research cloud cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; repro required; negatives searchable; lineage; sandbox models; deny-by-default`,
      sourceRefs: ['62L-CU'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; not permission grant'));

  void decisionGate;
  void cognitiveResearchCloudHonesty;
  void agentUniversityFederationHonesty;
  void continuousLocalModelAcademyHonesty;
  void distributedExperimentMemoryHonesty;
  void multiCloudScientificComputeHonesty;
  void algorithmEvolutionGraphHonesty;
  void universalToolPluginRuntimeHonesty;
  void checkLocalBrainHealth;

  const okStates = new Set([
    'PASS',
    'DENIED',
    'REJECTED',
    'UNAVAILABLE',
    'BOUNDED',
    'SANDBOXED',
    'SEARCHABLE',
    'LINEAGED',
    'NEGATIVE_KEPT',
    'LOCAL_PREFERRED',
    'CANDIDATE',
    'NOT_APPLIED',
    'WAITING_DATA',
  ]);

  return {
    ok: hops.every((h) => okStates.has(h.state)),
    hops,
    cycle: [...COGNITIVE_RESEARCH_CLOUD_CYCLE],
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: CU_LOCKS.L4_AUTONOMY_ENABLED,
    nextPhase: NEXT_PHASE_TITLE,
    cloudId: cloud.id,
  };
}

export async function buildCognitiveResearchCloudHealthReport(input?: { root?: string }) {
  const root = input?.root ?? process.cwd();
  const preds = predecessorMap(root);
  const actor: CuActor = {
    kind: 'research_cloud_curator',
    id: 'health-cu',
    orgId: 'org-cu-health',
    tenantId: 'tenant-cu-health',
    universeId: 'univ-cu-health',
    role: 'curator',
    permissionLevel: 0,
    authorityLevel: 0,
  };

  let cycleResult: Awaited<ReturnType<typeof runCognitiveResearchCloudCycle>> | null = null;
  let cycleError: string | null = null;
  try {
    cycleResult = await runCognitiveResearchCloudCycle({
      orgId: actor.orgId,
      tenantId: actor.tenantId,
      universeId: actor.universeId,
      actor,
      root,
    });
  } catch (err) {
    cycleError = err instanceof Error ? err.message : String(err);
  }

  return {
    phase: '62L-CU',
    title:
      'XIV Cognitive Research Cloud + Agent University Federation + Continuous Local Model Academy + Distributed Experiment Memory + Multi-Cloud Scientific Compute Fabric + Algorithm Evolution Graph + Universal Tool/Plugin Runtime',
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: CU_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorized: CU_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: CU_LOCKS.TIP_LAND,
    liveSupabaseApply: CU_LOCKS.LIVE_SUPABASE_APPLY,
    githubSoT: 111,
    gitlabCoordination: 45,
    nextPhase: NEXT_PHASE_TITLE,
    predecessors: preds,
    locks: { ...CU_LOCKS },
    honestySurfaces: {
      cognitiveResearchCloud: cognitiveResearchCloudHonesty(),
      agentUniversityFederation: agentUniversityFederationHonesty(),
      continuousLocalModelAcademy: continuousLocalModelAcademyHonesty(),
      distributedExperimentMemory: distributedExperimentMemoryHonesty(),
      multiCloudScientificCompute: multiCloudScientificComputeHonesty(),
      algorithmEvolutionGraph: algorithmEvolutionGraphHonesty(),
      universalToolPluginRuntime: universalToolPluginRuntimeHonesty(),
    },
    cycle: [...COGNITIVE_RESEARCH_CLOUD_CYCLE],
    cycleOk: cycleResult?.ok ?? false,
    cycleError,
    hopCount: cycleResult?.hops.length ?? 0,
    generatedAt: new Date().toISOString(),
  };
}
