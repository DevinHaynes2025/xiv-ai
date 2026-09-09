import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  bindTemporalGraphNode,
  dataRootFabricHonesty,
  registerGovernedPipeline,
} from './data-root-intelligence-fabric';
import {
  localLlmSocietyHonesty,
  routePromptLocalFirst,
  startLocalAgentShift,
} from './local-llm-agent-society';
import {
  configureGoogleAiStudio,
  getGoogleAiStudioSlot,
  googleAiStudioHonesty,
  invokeGoogleAiStudio,
} from './google-ai-studio-adapter';
import {
  archiveGovernanceHonesty,
  claimSoulOrAfterlifeCapability,
  createArchivePersonaSimulation,
  evaluateConsentGate,
  mineHistoricalArchive,
} from './historical-archive-governance-cortex';
import {
  attemptDbConnect,
  dbConnectorMeshHonesty,
  enrollDbConnector,
  revokeDbConnector,
} from './authorized-database-connector-mesh';
import {
  emitMiniXivCompatibilityProfile,
  hardwareEdgeHonesty,
  registerHardwareEdgeProfile,
} from './hardware-edge-intelligence-profiles';
import {
  ARCHIVE_PERSONA_SIMULATION_LABEL,
  CD_LOCKS,
  DATA_ROOT_LOCAL_LLM_ARCHIVE_MESH_CYCLE,
  DB_WRITE_DENIED_DEFAULT,
  GOOGLE_AI_STUDIO_UNAVAILABLE,
  HONESTY_BANNER,
  MINI_XIV_NO_STEALTH,
  NEXT_PHASE_TITLE,
  SEALED_CLOUD_FALLBACK_DENIED,
  SOUL_AFTERLIFE_REJECTED,
  UNAUTHORIZED_ARCHIVE_DENIED,
  UNAUTHORIZED_DB_DENIED,
  UNENROLLED_CONNECTOR_UNAVAILABLE,
  UNKNOWN_CONSENT_DENIED,
  ARBITRARY_DB_SCAN_DENIED,
  predecessorMap,
  type CdActor,
} from './data-root-local-llm-archive-mesh-types';
import {
  buildDataRootLocalLlmArchiveMeshHealthReport,
  runDataRootLocalLlmArchiveMeshCycle,
} from './data-root-local-llm-archive-mesh-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcd-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CdActor = {
  kind: 'data_root_curator',
  id: 'curator-cd-1',
  orgId: 'org-cd',
  tenantId: 'tenant-cd',
  universeId: 'univ-cd',
  role: 'curator',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CD1-cycle',
    DATA_ROOT_LOCAL_LLM_ARCHIVE_MESH_CYCLE.join(' → ') ===
      'honesty_locks → data_root_pipeline_govern → temporal_knowledge_graph_bound → local_llm_agent_shift → sealed_local_never_cloud_fallback → google_ai_studio_unconfigured_unavailable → archive_source_authorize → unauthorized_archive_mining_denied → archive_persona_label_simulation → soul_afterlife_claim_rejected → governance_knowledge_pack_load → unknown_consent_denied_or_waiting → db_connector_enroll → unenrolled_connector_unavailable → unauthorized_db_connect_denied → db_write_default_denied → db_revocation_provenance → hardware_edge_profile_plan → mini_xiv_no_stealth_install → evidence → learning',
    'Data-root / local-llm / archive / mesh cycle recorded in order.',
  );

  check(
    'US-CD-locks',
    CD_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CD_LOCKS.SEALED_SILENT_CLOUD_FALLBACK === false &&
      CD_LOCKS.LOCAL_ONLY_SILENT_CLOUD_FALLBACK === false &&
      CD_LOCKS.LOCAL_FIRST_ROUTING === true &&
      CD_LOCKS.GOOGLE_AI_STUDIO_AVAILABLE_WHEN_UNCONFIGURED === false &&
      CD_LOCKS.DB_WRITE_DENIED_BY_DEFAULT === true &&
      CD_LOCKS.DB_WRITE_DEFAULT === false &&
      CD_LOCKS.ARBITRARY_DB_SCAN === false &&
      CD_LOCKS.CONNECT_EVERY_DATABASE === false &&
      CD_LOCKS.SOUL_RESURRECTION_CAPABILITY === false &&
      CD_LOCKS.AFTERLIFE_COMMUNICATION_CAPABILITY === false &&
      CD_LOCKS.ARCHIVE_PERSONA_MUST_LABEL_SIMULATION === true &&
      CD_LOCKS.MINI_XIV_STEALTH_INSTALL === false &&
      CD_LOCKS.MINI_XIV_IS_COMPATIBILITY_PROFILE_ONLY === true &&
      CD_LOCKS.UNKNOWN_CONSENT_SILENT_PASS === false &&
      CD_LOCKS.LEARNING_IS_PERMISSION === false &&
      CD_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      CD_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      CD_LOCKS.LIVE_SUPABASE_APPLY === false &&
      CD_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, local-first, no soul claims, DB write deny-by-default.',
  );

  check(
    'US-CD-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CE — XIV Global Knowledge Excavation Grid'),
    'Next queue title is 62L-CE only (title).',
  );

  check(
    'US-CD-honesty-modules',
    dataRootFabricHonesty().megaUndifferentiatedDump === false &&
      localLlmSocietyHonesty().sealedSilentCloudFallback === false &&
      googleAiStudioHonesty().availableWhenUnconfigured === false &&
      archiveGovernanceHonesty().soulResurrectionCapability === false &&
      dbConnectorMeshHonesty().writeDeniedByDefault === true &&
      hardwareEdgeHonesty().miniXivStealthInstall === false,
    'Subsystem honesty helpers expose locks.',
  );

  // --- Sealed/local-only cannot silently route to cloud / Google AI Studio ---
  const sealed = await routePromptLocalFirst({
    promptId: 'p-sealed',
    sensitivity: 'sealed',
    requestedTarget: 'google_ai_studio',
    forceCloudFallback: true,
    cloudConfiguredAuthorizedVerified: true,
    root,
    actor,
  });
  const localOnly = await routePromptLocalFirst({
    promptId: 'p-local',
    sensitivity: 'local_only',
    requestedTarget: 'aws',
    forceCloudFallback: true,
    cloudConfiguredAuthorizedVerified: true,
    root,
    actor,
  });
  const gasSealed = await invokeGoogleAiStudio({
    promptSensitivity: 'sealed',
    allowSilentFallback: true,
    root,
    actor,
  });
  check(
    'US-CD-sealed-no-cloud-fallback',
    sealed.status === 'denied' &&
      sealed.silentCloudFallback === false &&
      sealed.reason === SEALED_CLOUD_FALLBACK_DENIED &&
      sealed.selectedTarget === 'local_llm' &&
      localOnly.status === 'denied' &&
      localOnly.reason === SEALED_CLOUD_FALLBACK_DENIED &&
      gasSealed.status === 'denied' &&
      gasSealed.silentFallback === false,
    'Sealed/local-only never silently routes to cloud/Google AI Studio.',
  );

  // --- Google AI Studio unconfigured → UNAVAILABLE ---
  const slot = await getGoogleAiStudioSlot(root);
  const gasPublic = await invokeGoogleAiStudio({
    promptSensitivity: 'public',
    root,
    actor,
  });
  check(
    'US-CD-google-ai-studio-unavailable',
    slot.state === 'UNAVAILABLE' &&
      slot.configured === false &&
      gasPublic.status === 'unavailable' &&
      gasPublic.reason === GOOGLE_AI_STUDIO_UNAVAILABLE,
    'Google AI Studio unconfigured → UNAVAILABLE.',
  );

  // Even after partial configure without verify, stays UNAVAILABLE
  const partial = await configureGoogleAiStudio({
    configured: true,
    authorized: true,
    verified: false,
    evidenceRefs: [],
    root,
    actor,
  });
  const gasPartial = await invokeGoogleAiStudio({
    promptSensitivity: 'public',
    root,
    actor,
  });
  check(
    'US-CD-google-ai-studio-needs-verify',
    partial.state === 'UNAVAILABLE' && gasPartial.status === 'unavailable',
    'Google AI Studio needs configured+authorized+verified.',
  );

  // --- Unauthorized DB connect DENIED; write-by-default DENIED ---
  const badDb = await enrollDbConnector({
    name: 'unauth-db',
    kind: 'sql',
    enrolled: true,
    authorized: false,
    configured: true,
    consentGranted: false,
    root,
    actor,
  });
  const badConnect = await attemptDbConnect({
    connectorId: badDb.id,
    operation: 'read',
    root,
    actor,
  });
  const goodDb = await enrollDbConnector({
    name: 'auth-sql',
    kind: 'sql',
    enrolled: true,
    authorized: true,
    configured: true,
    consentGranted: true,
    scopes: ['read'],
    writeAllowed: false,
    provenanceRefs: ['p1'],
    root,
    actor,
  });
  const writeDenied = await attemptDbConnect({
    connectorId: goodDb.id,
    operation: 'write',
    root,
    actor,
  });
  const readOk = await attemptDbConnect({
    connectorId: goodDb.id,
    operation: 'read',
    root,
    actor,
  });
  check(
    'US-CD-unauthorized-db-denied',
    badConnect.status === 'denied' &&
      badConnect.reason === UNAUTHORIZED_DB_DENIED &&
      badDb.status === 'denied',
    'Unauthorized DB connect DENIED.',
  );
  check(
    'US-CD-db-write-default-denied',
    writeDenied.status === 'denied' &&
      writeDenied.reason === DB_WRITE_DENIED_DEFAULT &&
      goodDb.writeAllowed === false &&
      readOk.accepted === true,
    'Write-by-default DENIED; authorized read ok.',
  );

  // --- Unenrolled connector → UNAVAILABLE ---
  const unenrolledAttempt = await attemptDbConnect({
    connectorId: null,
    operation: 'read',
    root,
    actor,
  });
  const bare = await enrollDbConnector({
    name: 'not-enrolled',
    kind: 'vector',
    enrolled: false,
    authorized: true,
    configured: false,
    consentGranted: true,
    root,
    actor,
  });
  const bareAttempt = await attemptDbConnect({
    connectorId: bare.id,
    operation: 'read',
    root,
    actor,
  });
  check(
    'US-CD-unenrolled-unavailable',
    unenrolledAttempt.status === 'unavailable' &&
      unenrolledAttempt.reason === UNENROLLED_CONNECTOR_UNAVAILABLE &&
      bare.status === 'unavailable' &&
      bareAttempt.status === 'unavailable',
    'Unenrolled connector → UNAVAILABLE.',
  );

  const scan = await attemptDbConnect({
    operation: 'scan',
    root,
    actor,
  });
  const connectAll = await attemptDbConnect({
    operation: 'connect_all',
    root,
    actor,
  });
  check(
    'US-CD-no-arbitrary-db-scan',
    scan.status === 'denied' &&
      scan.reason === ARBITRARY_DB_SCAN_DENIED &&
      connectAll.status === 'denied',
    'Arbitrary DB scan / connect-every-db DENIED.',
  );

  await revokeDbConnector({ connectorId: goodDb.id, root, actor });
  const revokedRead = await attemptDbConnect({
    connectorId: goodDb.id,
    operation: 'read',
    root,
    actor,
  });
  check(
    'US-CD-db-revocation',
    revokedRead.status === 'denied' && revokedRead.reason === UNAUTHORIZED_DB_DENIED,
    'Revoked connector cannot connect.',
  );

  // --- Archive persona labeled simulation; soul/afterlife REJECTED ---
  const persona = await createArchivePersonaSimulation({
    label: 'Ada Lovelace simulation',
    root,
    actor,
  });
  const soulPersona = await createArchivePersonaSimulation({
    label: 'soul claim',
    claimSoulResurrection: true,
    root,
    actor,
  });
  const afterlife = await claimSoulOrAfterlifeCapability({
    claim: 'communicate with the deceased',
    root,
    actor,
  });
  check(
    'US-CD-archive-persona-labeled',
    persona.status === 'labeled_simulation' &&
      persona.simulation === true &&
      persona.soulResurrection === false &&
      persona.afterlifeCommunication === false &&
      persona.reason === ARCHIVE_PERSONA_SIMULATION_LABEL &&
      persona.disclaimer.toLowerCase().includes('simulation'),
    'Archive persona clearly labeled simulation.',
  );
  check(
    'US-CD-soul-afterlife-rejected',
    soulPersona.status === 'rejected' &&
      soulPersona.reason === SOUL_AFTERLIFE_REJECTED &&
      afterlife.status === 'rejected' &&
      afterlife.reason === SOUL_AFTERLIFE_REJECTED,
    'Soul/afterlife capability claims REJECTED.',
  );

  // --- Unknown consent → DENIED/WAITING_DATA ---
  const unknownConsent = await mineHistoricalArchive({
    sourceId: 's-unknown',
    sourceKind: 'healthcare_history',
    authorized: true,
    consentKnown: false,
    licenseKnown: true,
    jurisdictionKnown: true,
    root,
    actor,
  });
  const waitingGate = await evaluateConsentGate({
    consentKnown: 'unknown',
    licenseKnown: true,
    jurisdictionKnown: true,
  });
  check(
    'US-CD-unknown-consent',
    (unknownConsent.status === 'denied' || unknownConsent.status === 'waiting_data') &&
      unknownConsent.reason === UNKNOWN_CONSENT_DENIED &&
      waitingGate.status === 'waiting_data' &&
      waitingGate.silentPass === false,
    'Unknown consent → DENIED or WAITING_DATA (never silent pass).',
  );

  // --- Mini-XIV profile does not stealth-install ---
  const miniOk = await emitMiniXivCompatibilityProfile({
    targetDeviceId: 'npu-1',
    root,
    actor,
  });
  const miniForce = await emitMiniXivCompatibilityProfile({
    targetDeviceId: 'npu-1',
    forceStealthInstall: true,
    root,
    actor,
  });
  check(
    'US-CD-mini-xiv-no-stealth',
    miniOk.status === 'compatibility_profile' &&
      miniOk.compatibilityProfileOnly === true &&
      miniOk.stealthInstall === false &&
      miniOk.installedOnDevice === false &&
      miniOk.reason === MINI_XIV_NO_STEALTH &&
      miniForce.status === 'denied' &&
      miniForce.installedOnDevice === false &&
      miniForce.reason === MINI_XIV_NO_STEALTH,
    'Mini-XIV is compatibility profile only; no stealth install.',
  );

  // --- Historical mining of unauthorized source DENIED ---
  const unauthMine = await mineHistoricalArchive({
    sourceId: 'pirate-dump',
    sourceKind: 'historical_people_cultures',
    authorized: false,
    consentKnown: true,
    licenseKnown: true,
    jurisdictionKnown: true,
    root,
    actor,
  });
  check(
    'US-CD-unauthorized-archive-denied',
    unauthMine.status === 'denied' && unauthMine.reason === UNAUTHORIZED_ARCHIVE_DENIED,
    'Unauthorized historical archive mining DENIED.',
  );

  // --- Data-root fabric + local shift smoke ---
  const pipe = await registerGovernedPipeline({
    name: 'supply-chain-root',
    domain: 'supply_chain_history',
    consentKnown: true,
    licenseKnown: true,
    jurisdictionKnown: true,
    provenanceRefs: ['auth-src'],
    root,
    actor,
  });
  const tg = await bindTemporalGraphNode({
    pipelineId: pipe.pipeline.id,
    label: 'shipment-epoch',
    validFrom: '2019-01-01',
    root,
    actor,
  });
  const shift = await startLocalAgentShift({
    agentId: 'agent-a',
    role: 'local_llm_agent',
    root,
    actor,
  });
  const hw = await registerHardwareEdgeProfile({
    label: 'pc-gpu',
    accelerators: ['cpu', 'gpu'],
    formFactor: 'pc',
    verified: true,
    root,
    actor,
  });
  check(
    'US-CD-data-root-and-edge',
    pipe.accepted &&
      pipe.pipeline.megaDump === false &&
      tg.denied === false &&
      shift.localFirst === true &&
      hw.status === 'plan' &&
      hw.productionAuthorized === false,
    'Data-root governed pipelines + edge profile plan-only.',
  );

  // --- Full cycle + health ---
  const cycle = await runDataRootLocalLlmArchiveMeshCycle({
    orgId: 'org-cd',
    tenantId: 'tenant-cd',
    universeId: 'univ-cd',
    actor,
    root,
  });
  check(
    'US-CD-cycle-run',
    cycle.hops.length === DATA_ROOT_LOCAL_LLM_ARCHIVE_MESH_CYCLE.length &&
      cycle.hops.every((h) => h.state !== 'FAIL') &&
      cycle.nextPhase === NEXT_PHASE_TITLE,
    'Full CD cycle walks all hops without FAIL.',
  );

  const health = await buildDataRootLocalLlmArchiveMeshHealthReport({ root: repoRoot });
  const preds = predecessorMap(repoRoot);
  check(
    'US-CD-health-report',
    health.phase === '62L-CD' &&
      health.githubSoT === 94 &&
      health.gitlabCoordination === 28 &&
      health.l4AutonomyEnabled === false &&
      health.productionAuthorized === false &&
      health.ethics.soulResurrectionCapability === false &&
      health.modules.dataRootIntelligenceFabric === 'IMPLEMENTED' &&
      health.modules.googleAiStudioAdapter === 'IMPLEMENTED',
    'Health report cites GitHub #94 / GitLab #28; modules IMPLEMENTED; no soul claims.',
  );
  check(
    'US-CD-pred-map',
    preds.BZ.tipProbe === 'PRESENT' &&
      preds.BZ.report === 'PRESENT' &&
      preds.CA.tipProbe === 'WAITING_DATA' &&
      preds.CB.tipProbe === 'WAITING_DATA' &&
      preds.CC.tipProbe === 'WAITING_DATA',
    `Predecessor map: BZ=${preds.BZ.tipProbe}/${preds.BZ.report}, CA=${preds.CA.tipProbe}, CB=${preds.CB.tipProbe}, CC=${preds.CC.tipProbe}.`,
  );
} catch (error) {
  failures.push(`EXCEPTION: ${(error as Error).stack ?? String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} CD checks:`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK phase62lcd — all required CD stories passed.');
