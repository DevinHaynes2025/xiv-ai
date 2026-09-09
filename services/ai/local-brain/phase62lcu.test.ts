import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  evaluateLocalModelCandidate,
  humanReviewLocalModelCandidate,
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
  searchNegativeAlgorithmVariants,
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
} from './cognitive-research-cloud-types';
import {
  buildCognitiveResearchCloudHealthReport,
  runCognitiveResearchCloudCycle,
} from './cognitive-research-cloud-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcu-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CuActor = {
  kind: 'research_cloud_curator',
  id: 'curator-cu-1',
  orgId: 'org-cu',
  tenantId: 'tenant-cu',
  universeId: 'univ-cu',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-CU1-cycle',
    COGNITIVE_RESEARCH_CLOUD_CYCLE.join(' → ') ===
      'honesty_locks → cognitive_research_cloud_bootstrap → experiment_reproducibility_gate → negative_result_searchable → algorithm_variant_lineage → local_model_sandbox_until_eval_review → uncontrolled_self_improve_denied → unknown_rights_training_denied → university_federation_bounded → university_skill_no_permission → plugin_deny_by_default_missing_scope → registration_no_authority → scientific_compute_local_first → unconfigured_aws_gcp_unavailable → sealed_no_silent_cloud_compute → queue_production_deploy_denied → evidence → learning',
    'Cognitive Research Cloud cycle recorded in order.',
  );

  check(
    'US-CU-locks',
    CU_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CU_LOCKS.EXPERIMENTS_REQUIRE_REPRODUCIBILITY_METADATA &&
      CU_LOCKS.EXPERIMENT_WITHOUT_REPRO_MARKED_VERIFIED === false &&
      CU_LOCKS.NEGATIVE_RESULTS_SEARCHABLE &&
      CU_LOCKS.NEGATIVE_RESULTS_DISCARDED === false &&
      CU_LOCKS.ALGORITHM_VARIANTS_CARRY_LINEAGE &&
      CU_LOCKS.LOCAL_MODEL_IMPROVEMENT_SANDBOX_UNTIL_EVAL_REVIEW &&
      CU_LOCKS.UNCONTROLLED_SELF_IMPROVEMENT === false &&
      CU_LOCKS.UNKNOWN_RIGHTS_TRAINING === false &&
      CU_LOCKS.DENY_BY_DEFAULT_PLUGIN_PERMISSIONS &&
      CU_LOCKS.MISSING_SCOPE_ALLOWED === false &&
      CU_LOCKS.REGISTRATION_GRANTS_AUTHORITY === false &&
      CU_LOCKS.UNCONFIGURED_AWS_GCP_AVAILABLE === false &&
      CU_LOCKS.SEALED_SILENT_CLOUD_COMPUTE_FALLBACK === false &&
      CU_LOCKS.UNIVERSITY_SKILL_IS_PERMISSION === false &&
      CU_LOCKS.QUEUE_PRODUCTION_DEPLOY === false &&
      CU_LOCKS.LIVE_SUPABASE_APPLY === false &&
      CU_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-CU-honesty-surfaces',
    cognitiveResearchCloudHonesty().queueProductionDeploy === false &&
      agentUniversityFederationHonesty().universitySkillIsPermission === false &&
      continuousLocalModelAcademyHonesty().uncontrolledSelfImprovement === false &&
      distributedExperimentMemoryHonesty().withoutReproMarkedVerified === false &&
      multiCloudScientificComputeHonesty().sealedSilentCloud === false &&
      algorithmEvolutionGraphHonesty().variantsCarryLineage === true &&
      universalToolPluginRuntimeHonesty().denyByDefault === true,
    'Subsystem honesty surfaces deny-by-default / sandbox / lineage.',
  );

  check(
    'US-CU-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CV —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CU-predecessor-CT',
    preds.CT.tipProbe === 'PRESENT' && preds.CT.report === 'PRESENT',
    `CT tip=${preds.CT.tipProbe} report=${preds.CT.report}`,
  );
  check(
    'US-CU-predecessor-CR',
    preds.CR.tipProbe === 'PRESENT' && preds.CR.report === 'PRESENT',
    `CR tip=${preds.CR.tipProbe} report=${preds.CR.report}`,
  );
  check(
    'US-CU-predecessor-CQ',
    preds.CQ.tipProbe === 'PRESENT' && preds.CQ.report === 'PRESENT',
    `CQ tip=${preds.CQ.tipProbe} report=${preds.CQ.report}`,
  );
  check(
    'US-CU-predecessor-CP',
    preds.CP.tipProbe === 'PRESENT',
    `CP tip=${preds.CP.tipProbe} report=${preds.CP.report}`,
  );
  // CS may remain WAITING_DATA / MISSING — do not invent PRESENT.
  check(
    'US-CU-predecessor-CS-gate',
    preds.CS.tipProbe === 'PRESENT' ||
      preds.CS.tipProbe === 'WAITING_DATA' ||
      preds.CS.tipProbe === 'MISSING',
    `CS tip=${preds.CS.tipProbe} report=${preds.CS.report}`,
  );

  const cloud = await bootstrapCognitiveResearchCloud({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    root,
    actor,
  });
  check(
    'US-CU-cloud-bootstrap',
    cloud.l4AutonomyEnabled === false && cloud.productionAuthorized === false,
    cloud.reason,
  );

  // --- Required: experiment without repro metadata not marked VERIFIED ---
  const noRepro = await recordExperiment({
    title: 'missing-repro-run',
    outcome: 'positive',
    reproducibility: null,
    claimVerified: true,
    root,
    actor,
  });
  check(
    'US-CU-experiment-without-repro-not-verified',
    noRepro.verificationState === 'NOT_VERIFIED' &&
      noRepro.verificationState !== 'VERIFIED',
    noRepro.reason,
  );

  const withRepro = await recordExperiment({
    title: 'repro-ok-run',
    outcome: 'positive',
    reproducibility: { seed: 7, codeRef: 'cu://exp/repro', envHash: 'abc' },
    claimVerified: true,
    root,
    actor,
  });
  check(
    'US-CU-experiment-with-repro-can-verify',
    withRepro.verificationState === 'VERIFIED',
    withRepro.reason,
  );

  // --- Required: negative result remains searchable / not discarded ---
  const negative = await recordExperiment({
    title: 'failed-hypothesis-alpha',
    outcome: 'negative',
    reproducibility: { seed: 1, protocolRef: 'proto-a' },
    root,
    actor,
  });
  const discardAttempt = await discardNegativeResult({
    experimentId: negative.id,
    root,
    actor,
  });
  const negHits = await searchExperiments({
    query: 'failed-hypothesis',
    outcome: 'negative',
    includeNegative: true,
    root,
    actor,
  });
  check(
    'US-CU-negative-result-searchable',
    negative.discarded === false &&
      negative.searchable === true &&
      negative.negativeKept === true &&
      discardAttempt.status === 'denied' &&
      negHits.some((h) => h.id === negative.id),
    `${negative.reason}; hits=${negHits.length}`,
  );

  // --- Required: algorithm variant retains lineage parent link ---
  const baseline = await registerBaselineAlgorithm({
    name: 'sort-baseline',
    root,
    actor,
  });
  const variant = await spawnAlgorithmVariant({
    name: 'sort-variant-neg',
    parentId: baseline.id,
    outcome: 'negative',
    root,
    actor,
  });
  check(
    'US-CU-algorithm-variant-lineage',
    !('status' in variant) &&
      variant.parentId === baseline.id &&
      variant.lineageRootId === baseline.lineageRootId,
    !('status' in variant) ? variant.reason : variant.reason,
  );
  if (!('status' in variant)) {
    const lineage = await getAlgorithmLineage({
      algorithmId: variant.id,
      root,
      actor,
    });
    check(
      'US-CU-algorithm-parent-link-intact',
      lineage.parentLinkIntact === true,
      `edges=${lineage.edges.length}`,
    );
    const negAlgos = await searchNegativeAlgorithmVariants({
      query: 'sort-variant',
      root,
      actor,
    });
    check(
      'US-CU-algorithm-negative-searchable',
      negAlgos.some((n) => n.id === variant.id),
      `negAlgos=${negAlgos.length}`,
    );
  }

  // --- Required: local model improvement remains sandbox until eval+human review ---
  const model = await proposeLocalModelImprovement({
    name: 'local-llm-tune-v1',
    rightsKnown: true,
    root,
    actor,
  });
  const earlyPromo = await promoteLocalModelCandidate({
    candidateId: model.id,
    root,
    actor,
  });
  check(
    'US-CU-local-model-sandbox-until-eval-review',
    model.sandbox === true &&
      model.lifecycle === 'sandbox' &&
      earlyPromo.status === 'sandboxed',
    model.reason,
  );

  await evaluateLocalModelCandidate({
    candidateId: model.id,
    evalPass: true,
    root,
    actor,
  });
  const stillSandbox = await promoteLocalModelCandidate({
    candidateId: model.id,
    root,
    actor,
  });
  check(
    'US-CU-local-model-needs-human-review',
    stillSandbox.status === 'sandboxed',
    stillSandbox.reason,
  );
  await humanReviewLocalModelCandidate({
    candidateId: model.id,
    humanReviewPass: true,
    root,
    actor,
  });
  const afterGates = await promoteLocalModelCandidate({
    candidateId: model.id,
    root,
    actor,
  });
  check(
    'US-CU-local-model-gates-pass-not-production',
    afterGates.status === 'promoted' &&
      CU_LOCKS.PRODUCTION_AUTHORIZATION === false,
    afterGates.reason,
  );

  // --- Required: uncontrolled self-improve DENIED ---
  const selfImprove = await attemptUncontrolledSelfImprove({
    candidateId: model.id,
    root,
    actor,
  });
  check(
    'US-CU-uncontrolled-self-improve-denied',
    selfImprove.status === 'denied',
    selfImprove.reason,
  );

  // --- Required: unknown-rights training DENIED ---
  const unknownTrain = await attemptUnknownRightsTraining({
    datasetLabel: 'scraped-unknown-rights',
    root,
    actor,
  });
  const unknownModel = await proposeLocalModelImprovement({
    name: 'bad-rights-model',
    rightsKnown: false,
    root,
    actor,
  });
  check(
    'US-CU-unknown-rights-training-denied',
    unknownTrain.status === 'denied' && unknownModel.lifecycle === 'denied',
    unknownTrain.reason,
  );

  // --- Required: plugin missing scope DENIED (deny-by-default) ---
  const plugin = await registerRuntimePlugin({
    name: 'cu-plugin',
    scopes: ['read:memory'],
    root,
    actor,
  });
  const missing = await invokeRuntimePlugin({
    pluginId: plugin.id,
    requestedScope: 'deploy:production',
    root,
    actor,
  });
  const allowed = await invokeRuntimePlugin({
    pluginId: plugin.id,
    requestedScope: 'read:memory',
    root,
    actor,
  });
  const authProbe = await probeRegistrationAuthority({
    pluginId: plugin.id,
    root,
    actor,
  });
  check(
    'US-CU-plugin-missing-scope-denied',
    missing.status === 'denied' &&
      allowed.status === 'allowed' &&
      authProbe.status === 'denied' &&
      plugin.grantsAuthority === false,
    missing.reason,
  );

  // --- Required: unconfigured AWS/GCP compute → UNAVAILABLE ---
  const aws = await registerScientificComputeEndpoint({
    provider: 'aws',
    configured: false,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  const gcp = await registerScientificComputeEndpoint({
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
  check(
    'US-CU-unconfigured-aws-gcp-unavailable',
    aws.status === 'UNAVAILABLE' &&
      gcp.status === 'UNAVAILABLE' &&
      awsRoute.status === 'unavailable',
    aws.reason,
  );

  // --- Required: sealed workload cannot silent-route to cloud ---
  const sealed = await routeScientificCompute({
    provider: 'gcp',
    contentMode: 'sealed',
    silentFallbackRequested: true,
    root,
    actor,
  });
  const localOnly = await routeScientificCompute({
    provider: 'aws',
    contentMode: 'local_only',
    silentFallbackRequested: true,
    root,
    actor,
  });
  check(
    'US-CU-sealed-no-silent-cloud',
    sealed.status === 'denied' && localOnly.status === 'denied',
    sealed.reason,
  );

  const local = await registerScientificComputeEndpoint({
    provider: 'local',
    configured: true,
    root,
    actor,
  });
  const localRoute = await routeScientificCompute({
    provider: 'local',
    contentMode: 'sealed',
    endpointId: local.id,
    root,
    actor,
  });
  check(
    'US-CU-local-first-compute',
    local.status === 'AVAILABLE' && localRoute.status === 'allowed',
    localRoute.reason,
  );

  // --- Required: university skill ≠ permission escalation ---
  const uniA = await enrollFederatedUniversity({
    name: 'North Lab U',
    department: 'research',
    region: 'na',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    root,
    actor,
  });
  const uniB = await enrollFederatedUniversity({
    name: 'EU Lab U',
    department: 'engineering',
    region: 'eu',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    root,
    actor,
  });
  const bond = await federateUniversities({
    universityIds: [uniA.id, uniB.id],
    root,
    actor,
  });
  const skillEsc = await grantUniversitySkill({
    universityId: uniA.id,
    agentId: 'agent-cu-1',
    skillKey: 'federated-method',
    priorPermissionLevel: 1,
    claimedPermissionEscalation: true,
    root,
    actor,
  });
  const skillOk = await grantUniversitySkill({
    universityId: uniA.id,
    agentId: 'agent-cu-1',
    skillKey: 'federated-method',
    priorPermissionLevel: 1,
    claimedPermissionEscalation: false,
    root,
    actor,
  });
  check(
    'US-CU-university-skill-no-permission',
    bond.status === 'bounded' &&
      skillEsc.status === 'denied' &&
      skillEsc.permissionIncreased === false &&
      skillOk.status === 'accepted' &&
      skillOk.permissionLevel === 1 &&
      skillOk.permissionIncreased === false,
    skillEsc.reason,
  );

  const deploy = await attemptQueueProductionDeploy({
    cloudId: cloud.id,
    root,
    actor,
  });
  check(
    'US-CU-queue-deploy-denied',
    deploy.status === 'denied',
    deploy.reason,
  );

  const cycle = await runCognitiveResearchCloudCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });
  check(
    'US-CU-cycle-ok',
    cycle.ok === true && cycle.hops.length === COGNITIVE_RESEARCH_CLOUD_CYCLE.length,
    `hops=${cycle.hops.length} ok=${cycle.ok}`,
  );

  const health = await buildCognitiveResearchCloudHealthReport({ root });
  check(
    'US-CU-health-report',
    health.l4AutonomyEnabled === false &&
      health.productionAuthorized === false &&
      health.githubSoT === 111 &&
      health.gitlabCoordination === 45 &&
      health.nextPhase.startsWith('62L-CV —'),
    `cycleOk=${health.cycleOk}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\n62L-CU FAILURES (${failures.length}):`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('\n62L-CU cognitive research cloud tests passed.');
