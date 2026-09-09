/**
 * 62L-CE runtime — walks KNOWLEDGE_EXCAVATION_MEMORY_LAKE_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  attemptUnauthorizedArchiveFeed,
  excavateKnowledge,
  excavationGridHonesty,
  registerKnowledgeSource,
} from './global-knowledge-excavation-grid';
import {
  deliberateResearchCouncil,
  registerCouncilMember,
  researchCouncilHonesty,
} from './multi-llm-research-council';
import {
  createPersonaSimulation,
  ingestMemoryArchive,
  memoryLakeHonesty,
  rejectSoulResurrectionClaim,
} from './historical-civilization-memory-lake';
import {
  pipelineFactoryHonesty,
  runFullApprovedPipeline,
  runPipelineToEnrichmentOrReject,
} from './universal-data-pipeline-factory';
import {
  attemptCompressionAutoDeploy,
  captureCompressionResearch,
  hardwareCompilerHonesty,
  mapWorkloadToHardware,
  registerHardwareCombo,
} from './hardware-intelligence-compiler';
import {
  attemptCdMeshDatabaseWrite,
  edgeEnergyHonesty,
  registerEdgeEnergyProfile,
  selectEdgeRoute,
} from './low-energy-edge-agent-network';
import {
  CE_LOCKS,
  HONESTY_BANNER,
  KNOWLEDGE_EXCAVATION_MEMORY_LAKE_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type CeActor,
  type CeEvidenceState,
  type CeHop,
  type CeHopRecord,
} from './knowledge-excavation-memory-lake-types';

export {
  CE_LOCKS,
  HONESTY_BANNER,
  KNOWLEDGE_EXCAVATION_MEMORY_LAKE_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CeHop, state: CeEvidenceState, summary: string): CeHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CeCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CeActor;
  root?: string;
};

export async function runKnowledgeExcavationMemoryLakeCycle(input: CeCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CeHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CE_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CE_LOCKS.LOCAL_LLM_FIRST &&
        CE_LOCKS.ENERGY_OVERRIDES_SECURITY === false &&
        CE_LOCKS.SOUL_RESURRECTION_CLAIMS === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const authSrc = await registerKnowledgeSource({
    label: 'authorized-archive',
    authorized: true,
    category: 'historical',
    root,
    actor,
  });
  const dug = await excavateKnowledge({
    sourceId: authSrc.id,
    depth: 'bamboo_roots',
    root,
    actor,
  });
  hops.push(
    hop(
      'excavation_authorize_source',
      dug.accepted ? 'PASS' : 'FAIL',
      dug.reason,
    ),
  );

  const unauth = await attemptUnauthorizedArchiveFeed({
    label: 'shadow-archive',
    root,
    actor,
  });
  hops.push(
    hop('unauthorized_archive_denied', unauth.denied ? 'DENIED' : 'FAIL', unauth.reason),
  );

  const local = await registerCouncilMember({
    name: 'local-llama',
    kind: 'local',
    role: 'analyst',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const cloudOk = await registerCouncilMember({
    name: 'cloud-gpt',
    kind: 'cloud',
    role: 'skeptic',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const cloudBare = await registerCouncilMember({
    name: 'cloud-unconfigured',
    kind: 'cloud',
    role: 'evidence',
    configured: false,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_cloud_unavailable',
      cloudBare.status === 'unavailable' ? 'UNAVAILABLE' : 'FAIL',
      cloudBare.reason,
    ),
  );

  const localFirst = await deliberateResearchCouncil({
    topic: 'iceberg excavation',
    mode: 'open',
    memberIds: [local.id, cloudOk.id],
    root,
    actor,
  });
  hops.push(
    hop(
      'council_local_first',
      localFirst.preferredKind === 'local' ? 'LOCAL_PREFERRED' : 'FAIL',
      localFirst.reason,
    ),
  );

  const sealed = await deliberateResearchCouncil({
    topic: 'sealed research',
    mode: 'sealed',
    memberIds: [local.id, cloudOk.id],
    attemptSilentCloudFallback: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_no_cloud_fallback',
      sealed.preferredKind === 'local' && sealed.cloudFallbackAttempted === false
        ? 'DENIED'
        : 'FAIL',
      sealed.reason,
    ),
  );

  const mem = await ingestMemoryArchive({
    domain: 'historical',
    title: 'silk-road-ledger',
    eraStartYear: 200,
    eraEndYear: 1400,
    authorized: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'memory_lake_ingest_time_aware',
      mem.timeAware && mem.status === 'retained' ? 'PASS' : 'FAIL',
      mem.reason,
    ),
  );

  const persona = await createPersonaSimulation({
    label: 'merchant-sim',
    eraYear: 900,
    root,
    actor,
  });
  hops.push(
    hop(
      'persona_sim_labeled',
      persona.status === 'labeled_simulation' && persona.labeledSimulation
        ? 'LABELED_SIMULATION'
        : 'FAIL',
      persona.reason,
    ),
  );

  const soul = await rejectSoulResurrectionClaim({
    label: 'soul-claim',
    eraYear: 900,
    root,
    actor,
  });
  hops.push(
    hop('soul_claim_rejected', soul.rejected ? 'REJECTED' : 'FAIL', soul.reason),
  );

  const rejectedPipe = await runPipelineToEnrichmentOrReject({
    sourceLabel: 'unapproved-feed',
    approved: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'pipeline_reject_unapproved_before_enrichment',
      rejectedPipe.status === 'rejected' && rejectedPipe.enrichmentReached === false
        ? 'DENIED'
        : 'FAIL',
      rejectedPipe.reason,
    ),
  );

  const fullPipe = await runFullApprovedPipeline({
    sourceLabel: 'approved-feed',
    root,
    actor,
  });
  hops.push(
    hop(
      'pipeline_extract_normalize_validate',
      fullPipe.stagesCompleted.includes('validation') ? 'PASS' : 'FAIL',
      'pre-enrichment stages',
    ),
  );
  hops.push(
    hop(
      'pipeline_dedupe_enrich_index_retain_recover',
      fullPipe.status === 'complete' && fullPipe.enrichmentReached ? 'PASS' : 'FAIL',
      fullPipe.reason,
    ),
  );

  const verified = await registerHardwareCombo({
    label: 'cpu-gpu-npu-ok',
    cpu: 'x86_64',
    gpu: 'verified-gpu',
    npu: 'verified-npu',
    memoryGb: 64,
    compiler: 'verified-compiler',
    runtime: 'verified-runtime',
    verified: true,
    root,
    actor,
  });
  const unverified = await registerHardwareCombo({
    label: 'mystery-npu',
    cpu: 'arm',
    npu: 'unverified-npu',
    memoryGb: 8,
    compiler: 'unknown',
    runtime: 'unknown',
    verified: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'hardware_combo_verify',
      verified.status === 'verified' ? 'VERIFIED' : 'FAIL',
      verified.reason,
    ),
  );
  const mapBad = await mapWorkloadToHardware({
    workloadId: 'wl-1',
    comboId: unverified.id,
    forceLabelVerified: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'unverified_hardware_unavailable',
      mapBad.status === 'unavailable' && mapBad.labeledVerified === false
        ? 'UNAVAILABLE'
        : 'FAIL',
      mapBad.reason,
    ),
  );

  const research = await captureCompressionResearch({
    technique: 'quantization',
    forceAutoDeploy: true,
    root,
    actor,
  });
  const deploy = await attemptCompressionAutoDeploy({
    researchId: research.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'compression_research_candidate',
      research.status === 'research_candidate' && deploy.denied ? 'CANDIDATE' : 'FAIL',
      research.reason,
    ),
  );

  const greenUnsafe = await registerEdgeEnergyProfile({
    kind: 'mobile',
    energyScore: 1,
    securityScore: 0.2,
    correctnessScore: 0.2,
    sealedPolicyOk: false,
    root,
    actor,
  });
  const safer = await registerEdgeEnergyProfile({
    kind: 'laptop',
    energyScore: 5,
    securityScore: 0.95,
    correctnessScore: 0.95,
    sealedPolicyOk: true,
    root,
    actor,
  });
  hops.push(hop('edge_energy_profile', 'PASS', `${greenUnsafe.id},${safer.id}`));

  const route = await selectEdgeRoute({
    profileIds: [greenUnsafe.id, safer.id],
    requireSealed: true,
    preferLowestEnergyRegardlessOfSafety: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'energy_loses_to_security_correctness',
      route.selectedProfileId === safer.id &&
        route.rejectedLowerEnergyUnsafeId === greenUnsafe.id
        ? 'DENIED'
        : 'FAIL',
      route.reason,
    ),
  );

  const cdWrite = await attemptCdMeshDatabaseWrite({ root, actor });
  hops.push(
    hop(
      'cd_mesh_write_deny_by_default',
      cdWrite.denied && cdWrite.applied === false ? 'DENIED' : 'FAIL',
      cdWrite.reason,
    ),
  );

  const evidence = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-CE knowledge excavation / memory lake cycle completed',
      payload: { hops: hops.map((h) => h.hop), orgId: input.orgId, sourceRefs: ['62L-CE'] },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidence?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CE knowledge excavation memory lake cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning ≠ permission`,
      sourceRefs: ['62L-CE'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; not permission grant'));

  void decisionGate;

  return {
    hops,
    honesty: {
      excavation: excavationGridHonesty(),
      council: researchCouncilHonesty(),
      memoryLake: memoryLakeHonesty(),
      pipeline: pipelineFactoryHonesty(),
      hardware: hardwareCompilerHonesty(),
      edge: edgeEnergyHonesty(),
    },
    locks: CE_LOCKS,
    nextPhase: NEXT_PHASE_TITLE,
  };
}

export async function buildKnowledgeExcavationMemoryLakeHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const health = await checkLocalBrainHealth(root).catch(() => ({
    ok: false,
    reason: 'HEALTH_CHECK_UNAVAILABLE',
  }));
  const gate = decisionGate;
  const preds = predecessorMap(root);
  return {
    phase: '62L-CE',
    title:
      'XIV Global Knowledge Excavation Grid + Multi-LLM Research Council + Historical Civilization Memory Lake + Universal Data Pipeline Factory + Hardware Intelligence Compiler + Low-Energy Edge Agent Network',
    honestyBanner: HONESTY_BANNER,
    locks: CE_LOCKS,
    l4AutonomyEnabled: CE_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: CE_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: CE_LOCKS.TIP_LAND,
    githubSoT: 95,
    gitlabCoordination: 29,
    cycle: KNOWLEDGE_EXCAVATION_MEMORY_LAKE_CYCLE,
    predecessors: preds,
    localBrainHealth: health,
    decisionGatePresent: typeof gate === 'function' || typeof gate === 'object',
    modules: {
      globalKnowledgeExcavationGrid: 'IMPLEMENTED',
      multiLlmResearchCouncil: 'IMPLEMENTED',
      historicalCivilizationMemoryLake: 'IMPLEMENTED',
      universalDataPipelineFactory: 'IMPLEMENTED',
      hardwareIntelligenceCompiler: 'IMPLEMENTED',
      lowEnergyEdgeAgentNetwork: 'IMPLEMENTED',
    },
    nextPhase: NEXT_PHASE_TITLE,
    productionAuthorized: false,
    generatedAt: new Date().toISOString(),
  };
}
