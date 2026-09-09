import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  COMPRESSION_RESEARCH_CANDIDATE,
  ENERGY_LOSES_TO_SECURITY,
  HONESTY_BANNER,
  KNOWLEDGE_EXCAVATION_MEMORY_LAKE_CYCLE,
  LOCAL_PREFERRED_OVER_CLOUD,
  NEXT_PHASE_TITLE,
  PERSONA_LABELED_SIMULATION,
  PIPELINE_UNAPPROVED_REJECTED,
  SEALED_NO_CLOUD_FALLBACK,
  SOUL_CLAIM_REJECTED,
  UNAUTHORIZED_ARCHIVE_DENIED,
  UNCONFIGURED_CLOUD_COUNCIL_UNAVAILABLE,
  UNVERIFIED_HARDWARE_UNAVAILABLE,
  predecessorMap,
  type CeActor,
} from './knowledge-excavation-memory-lake-types';
import {
  buildKnowledgeExcavationMemoryLakeHealthReport,
  runKnowledgeExcavationMemoryLakeCycle,
} from './knowledge-excavation-memory-lake-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lce-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CeActor = {
  kind: 'research_council_chair',
  id: 'council-ce-1',
  orgId: 'org-ce',
  tenantId: 'tenant-ce',
  universeId: 'univ-ce',
  role: 'chair',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CE1-cycle',
    KNOWLEDGE_EXCAVATION_MEMORY_LAKE_CYCLE.join(' → ') ===
      'honesty_locks → excavation_authorize_source → unauthorized_archive_denied → council_local_first → unconfigured_cloud_unavailable → sealed_no_cloud_fallback → memory_lake_ingest_time_aware → persona_sim_labeled → soul_claim_rejected → pipeline_extract_normalize_validate → pipeline_reject_unapproved_before_enrichment → pipeline_dedupe_enrich_index_retain_recover → hardware_combo_verify → unverified_hardware_unavailable → compression_research_candidate → edge_energy_profile → energy_loses_to_security_correctness → cd_mesh_write_deny_by_default → evidence → learning',
    'Knowledge excavation / memory lake cycle recorded in order.',
  );

  check(
    'US-CE-locks',
    CE_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CE_LOCKS.LOCAL_LLM_FIRST === true &&
      CE_LOCKS.SEALED_SILENT_CLOUD_FALLBACK === false &&
      CE_LOCKS.UNAUTHORIZED_ARCHIVE_MINING === false &&
      CE_LOCKS.PIPELINE_UNAPPROVED_ENRICHMENT === false &&
      CE_LOCKS.SOUL_RESURRECTION_CLAIMS === false &&
      CE_LOCKS.PERSONA_MUST_BE_LABELED_SIMULATION === true &&
      CE_LOCKS.UNVERIFIED_HARDWARE_LABELED_VERIFIED === false &&
      CE_LOCKS.COMPRESSION_AUTO_PRODUCTION_DEPLOY === false &&
      CE_LOCKS.ENERGY_OVERRIDES_SECURITY === false &&
      CE_LOCKS.ENERGY_OVERRIDES_CORRECTNESS === false &&
      CE_LOCKS.CD_MESH_WRITE_DENY_BY_DEFAULT === true &&
      CE_LOCKS.LEARNING_IS_PERMISSION === false &&
      CE_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      CE_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      CE_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, local-first, no soul claims, energy loses to security.',
  );

  check(
    'US-CE-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CF — Global Data Refinery Civilization'),
    'Next queue title is 62L-CF only (title).',
  );

  check(
    'US-CE-honesty-modules',
    excavationGridHonesty().l4AutonomyEnabled === false &&
      researchCouncilHonesty().localLlmFirst === true &&
      memoryLakeHonesty().soulResurrectionClaims === false &&
      pipelineFactoryHonesty().pipelineApprovedOnly === true &&
      hardwareCompilerHonesty().compressionAutoDeploy === false &&
      edgeEnergyHonesty().energyOverridesSecurity === false,
    'Subsystem honesty helpers expose locks.',
  );

  // --- Local preferred over cloud when both available ---
  const local = await registerCouncilMember({
    name: 'local-mistral',
    kind: 'local',
    role: 'analyst',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const cloud = await registerCouncilMember({
    name: 'cloud-opus',
    kind: 'cloud',
    role: 'skeptic',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const open = await deliberateResearchCouncil({
    topic: 'bamboo roots',
    mode: 'open',
    memberIds: [local.id, cloud.id],
    preferCloudWhenLocalAvailable: true,
    root,
    actor,
  });
  check(
    'US-CE-local-preferred',
    open.preferredKind === 'local' &&
      open.selectedMemberIds.includes(local.id) &&
      !open.selectedMemberIds.includes(cloud.id) &&
      open.reason === LOCAL_PREFERRED_OVER_CLOUD,
    'Local preferred over cloud when both available.',
  );

  // --- Unconfigured cloud council member → UNAVAILABLE ---
  const bareCloud = await registerCouncilMember({
    name: 'cloud-missing-creds',
    kind: 'cloud',
    role: 'evidence',
    configured: false,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  check(
    'US-CE-unconfigured-cloud',
    bareCloud.status === 'unavailable' &&
      bareCloud.reason === UNCONFIGURED_CLOUD_COUNCIL_UNAVAILABLE,
    'Unconfigured cloud council member → UNAVAILABLE.',
  );

  // --- Sealed/local-only never silently falls back to cloud ---
  const sealedOnlyCloud = await deliberateResearchCouncil({
    topic: 'sealed topic',
    mode: 'sealed',
    memberIds: [cloud.id],
    attemptSilentCloudFallback: true,
    root,
    actor,
  });
  const sealedWithLocal = await deliberateResearchCouncil({
    topic: 'sealed with local',
    mode: 'local_only',
    memberIds: [local.id, cloud.id],
    attemptSilentCloudFallback: true,
    root,
    actor,
  });
  check(
    'US-CE-sealed-no-cloud-fallback',
    sealedOnlyCloud.status === 'denied' &&
      sealedOnlyCloud.reason === SEALED_NO_CLOUD_FALLBACK &&
      sealedOnlyCloud.cloudFallbackAttempted === false &&
      sealedWithLocal.preferredKind === 'local' &&
      !sealedWithLocal.selectedMemberIds.includes(cloud.id),
    'Sealed/local-only never silently falls back to cloud.',
  );

  // --- Unauthorized archive feed DENIED ---
  const unauth = await attemptUnauthorizedArchiveFeed({
    label: 'pirate-archive',
    root,
    actor,
  });
  const auth = await registerKnowledgeSource({
    label: 'public-museum',
    authorized: true,
    category: 'cultural',
    root,
    actor,
  });
  const dug = await excavateKnowledge({
    sourceId: auth.id,
    depth: 'iceberg',
    root,
    actor,
  });
  check(
    'US-CE-unauthorized-archive',
    unauth.denied === true &&
      unauth.reason === UNAUTHORIZED_ARCHIVE_DENIED &&
      dug.accepted === true,
    'Unauthorized archive feed DENIED; authorized excavates.',
  );

  // --- Pipeline rejects unapproved source before enrichment ---
  const rejected = await runPipelineToEnrichmentOrReject({
    sourceLabel: 'shadow-feed',
    approved: false,
    root,
    actor,
  });
  const approved = await runFullApprovedPipeline({
    sourceLabel: 'cleared-feed',
    root,
    actor,
  });
  check(
    'US-CE-pipeline-unapproved',
    rejected.status === 'rejected' &&
      rejected.enrichmentReached === false &&
      rejected.reason === PIPELINE_UNAPPROVED_REJECTED &&
      !rejected.stagesCompleted.includes('enrichment') &&
      approved.status === 'complete' &&
      approved.enrichmentReached === true,
    'Pipeline rejects unapproved source before enrichment.',
  );

  // --- Unverified hardware combo → UNAVAILABLE (not VERIFIED) ---
  const badHw = await registerHardwareCombo({
    label: 'unverified-stack',
    cpu: 'unknown',
    gpu: 'mystery',
    memoryGb: 4,
    compiler: 'none',
    runtime: 'none',
    verified: false,
    root,
    actor,
  });
  const mapped = await mapWorkloadToHardware({
    workloadId: 'wl-unverified',
    comboId: badHw.id,
    forceLabelVerified: true,
    root,
    actor,
  });
  const goodHw = await registerHardwareCombo({
    label: 'verified-stack',
    cpu: 'x86_64',
    gpu: 'verified-gpu',
    npu: 'verified-npu',
    memoryGb: 128,
    compiler: 'verified-cc',
    runtime: 'verified-rt',
    verified: true,
    root,
    actor,
  });
  const goodMap = await mapWorkloadToHardware({
    workloadId: 'wl-ok',
    comboId: goodHw.id,
    root,
    actor,
  });
  check(
    'US-CE-unverified-hardware',
    badHw.status === 'unavailable' &&
      mapped.status === 'unavailable' &&
      mapped.labeledVerified === false &&
      mapped.reason === UNVERIFIED_HARDWARE_UNAVAILABLE &&
      goodHw.status === 'verified' &&
      goodMap.status === 'mapped',
    'Unverified hardware combo → UNAVAILABLE (not VERIFIED).',
  );

  // --- Lower-energy unsafe route loses to security/correctness ---
  const greenUnsafe = await registerEdgeEnergyProfile({
    kind: 'mobile',
    energyScore: 1,
    securityScore: 0.1,
    correctnessScore: 0.1,
    sealedPolicyOk: false,
    root,
    actor,
  });
  const saferHigherEnergy = await registerEdgeEnergyProfile({
    kind: 'edge_node',
    energyScore: 8,
    securityScore: 0.99,
    correctnessScore: 0.99,
    sealedPolicyOk: true,
    root,
    actor,
  });
  const route = await selectEdgeRoute({
    profileIds: [greenUnsafe.id, saferHigherEnergy.id],
    requireSealed: true,
    preferLowestEnergyRegardlessOfSafety: true,
    root,
    actor,
  });
  check(
    'US-CE-energy-loses',
    route.selectedProfileId === saferHigherEnergy.id &&
      route.rejectedLowerEnergyUnsafeId === greenUnsafe.id &&
      route.reason === ENERGY_LOSES_TO_SECURITY &&
      route.energyOverrideSecurity === false,
    'Lower-energy unsafe route loses to security/correctness policy.',
  );

  // --- Memory lake persona labeled simulation; soul claim REJECTED ---
  const persona = await createPersonaSimulation({
    label: 'historian-sim',
    eraYear: 1200,
    root,
    actor,
  });
  const soul = await rejectSoulResurrectionClaim({
    label: 'resurrect-claim',
    eraYear: 1200,
    root,
    actor,
  });
  const mem = await ingestMemoryArchive({
    domain: 'legal',
    title: 'code-of-hammurabi-notes',
    eraStartYear: -1750,
    eraEndYear: -1750,
    authorized: true,
    root,
    actor,
  });
  check(
    'US-CE-persona-sim',
    persona.labeledSimulation === true &&
      persona.status === 'labeled_simulation' &&
      persona.reason === PERSONA_LABELED_SIMULATION &&
      persona.soulResurrectionClaim === false &&
      mem.timeAware === true,
    'Memory lake persona remains labeled simulation.',
  );
  check(
    'US-CE-soul-rejected',
    soul.rejected === true &&
      soul.reason === SOUL_CLAIM_REJECTED &&
      soul.persona.status === 'rejected',
    'Soul-resurrection claim REJECTED.',
  );

  // --- Compression research remains candidate (not auto-deploy) ---
  const research = await captureCompressionResearch({
    technique: 'compression',
    forceAutoDeploy: true,
    root,
    actor,
  });
  const deploy = await attemptCompressionAutoDeploy({
    researchId: research.id,
    root,
    actor,
  });
  check(
    'US-CE-compression-candidate',
    research.status === 'research_candidate' &&
      research.autoDeploy === false &&
      research.productionAuthorized === false &&
      deploy.denied === true &&
      deploy.reason === COMPRESSION_RESEARCH_CANDIDATE,
    'Compression research output remains candidate (not auto-deploy).',
  );

  // --- CD mesh write deny-by-default ---
  const cdWrite = await attemptCdMeshDatabaseWrite({ root, actor });
  check(
    'US-CE-cd-mesh-write-denied',
    cdWrite.denied === true && cdWrite.applied === false,
    'CD mesh write-to-DB deny-by-default.',
  );

  // --- Full cycle + health ---
  const cycle = await runKnowledgeExcavationMemoryLakeCycle({
    orgId: 'org-ce',
    tenantId: 'tenant-ce',
    universeId: 'univ-ce',
    actor,
    root,
  });
  check(
    'US-CE-cycle-run',
    cycle.hops.length === KNOWLEDGE_EXCAVATION_MEMORY_LAKE_CYCLE.length &&
      cycle.hops.every((h) => h.state !== 'FAIL') &&
      cycle.nextPhase === NEXT_PHASE_TITLE,
    'Full CE cycle walks all hops without FAIL.',
  );

  const health = await buildKnowledgeExcavationMemoryLakeHealthReport({ root: repoRoot });
  const preds = predecessorMap(repoRoot);
  check(
    'US-CE-health-report',
    health.phase === '62L-CE' &&
      health.githubSoT === 95 &&
      health.gitlabCoordination === 29 &&
      health.l4AutonomyEnabled === false &&
      health.productionAuthorized === false &&
      health.modules.globalKnowledgeExcavationGrid === 'IMPLEMENTED',
    'Health report cites GitHub #95 / GitLab #29; modules IMPLEMENTED.',
  );
  check(
    'US-CE-pred-map',
    preds.BZ.tipProbe === 'PRESENT' &&
      preds.BZ.report === 'PRESENT' &&
      preds.CD.tipProbe === 'WAITING_DATA',
    `Predecessor map: CD=${preds.CD.tipProbe}/report=${preds.CD.report}, BZ=${preds.BZ.tipProbe}/report=${preds.BZ.report}, BY=${preds.BY.tipProbe}.`,
  );
} catch (error) {
  failures.push(`EXCEPTION: ${(error as Error).stack ?? String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} CE checks:`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK phase62lce — all required CE stories passed.');
