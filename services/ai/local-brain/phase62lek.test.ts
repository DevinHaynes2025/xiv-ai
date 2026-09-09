import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  probeHistoricalMedicineClinicalClaim,
  registerCivilizationAtlasEntry,
} from './ethical-civilization-memory-atlas';
import {
  delegateAvatarOfflineFaq,
  probeAvatarFounderAuthority,
  registerAvatarPresence,
} from './live-avatar-identity-layer';
import {
  adjustPathwayWeight,
  registerNeuralPathway,
} from './neural-pathway-graph';
import {
  attemptCapabilityPromotion,
  denySilentAuthorityGrowth,
  guardianGate,
  registerOfflineAgentBrain,
} from './offline-agent-brain';
import {
  denyQuantumAdvantageWithoutBaselines,
  probeAsusPhysicalQpuClaim,
  registerQuantumExperiment,
} from './quantum-research-lab';
import {
  denyConversionAutoCharge,
  explicitNonClaimsSnapshot,
  registerConversionStep,
} from './traffic-conversion-engine';
import {
  probeSearchSourceAcl,
  runUniversalSearch,
} from './universal-search-bi-os';
import {
  bootstrapWindowsAmdLocalCognitiveOs,
  windowsAmdLocalCognitiveOsHonesty,
} from './windows-amd-local-cognitive-os';
import {
  buildWindowsAmdLocalCognitiveOsHealthReport,
  runWindowsAmdLocalCognitiveOsCycle,
} from './windows-amd-local-cognitive-os-runtime';
import {
  ATLAS_EVIDENCE_CLASSES,
  AUTONOMY_BOUNDARY,
  CAPABILITY_PROMOTION_PIPELINE,
  EK_LOCKS,
  EXPLICIT_NON_CLAIMS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PREFERRED_WINDOWS_AMD_STACK,
  PRODUCT_LOOP,
  PRODUCT_PHILOSOPHY,
  QUANTUM_TRUTH_STATES,
  WINDOWS_AMD_LOCAL_COGNITIVE_OS_CYCLE,
  predecessorMap,
  type EkActor,
} from './windows-amd-local-cognitive-os-types';
import {
  gateAmdWorkloadRouting,
  probeModelLoadVerified,
  runWindowsHardwareRuntimeProbe,
} from './windows-hardware-runtime-probe';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lek-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: EkActor = {
  kind: 'windows_runtime_probe_operator',
  id: 'test-curator',
  orgId: 'org-ek',
  tenantId: 'tenant-ek',
  universeId: 'universe-ek',
};
const avatarActor: EkActor = { ...actor, kind: 'avatar', id: 'avatar-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      EK_LOCKS.L4_AUTONOMY_ENABLED === false &&
      EK_LOCKS.TIP_LAND === false &&
      EK_LOCKS.AMD_ROUTING_WITHOUT_PROBE === false &&
      EK_LOCKS.AGENTS_WORKING_WHILE_DEVICE_OFF === false &&
      EK_LOCKS.SILENT_AUTHORITY_GROWTH_ALLOWED === false &&
      EK_LOCKS.AGENT_LEARNS_EQ_AUTOMATIC_POWER_INCREASE === false &&
      EK_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_BASELINES === false &&
      EK_LOCKS.ASUS_EQ_CONNECTED_QPU === false &&
      EK_LOCKS.HISTORICAL_MEDICINE_EQ_CLINICAL_AUTHORITY === false &&
      EK_LOCKS.AVATAR_IMPORSONATE_LIVE_WITHOUT_DISCLOSURE === false &&
      EK_LOCKS.CONVERSION_EQ_AUTO_CHARGE === false &&
      EK_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
      EK_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false &&
      PRODUCT_PHILOSOPHY.probeFirstBeforeAmdRouting === true &&
      PRODUCT_LOOP.includes('Search') &&
      PREFERRED_WINDOWS_AMD_STACK.includes('WINDOWS_ML') &&
      PREFERRED_WINDOWS_AMD_STACK.includes('ONNX_RUNTIME') &&
      PREFERRED_WINDOWS_AMD_STACK.includes('AMD_CPU_GPU_NPU_EP') &&
      WINDOWS_AMD_LOCAL_COGNITIVE_OS_CYCLE.includes(
        'amd_routing_gated_until_probe',
      ) &&
      NEXT_PHASE_TITLE.includes('Windows Hardware & Runtime Probe') &&
      AUTONOMY_BOUNDARY.denied.includes(
        'route_amd_workload_without_probe_evidence',
      ),
    'locks + probe-first stack + next probe deepen present',
  );

  const os = await bootstrapWindowsAmdLocalCognitiveOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_windows_amd_local_cognitive_os',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.probeFirstRequired === true &&
      os.publicLaunchAuthorized === false,
    `os=${os.id}; predecessor=${os.predecessorLayer}`,
  );

  const probe = await runWindowsHardwareRuntimeProbe({
    probeId: 'p1',
    root,
    actor,
  });
  check(
    'A_probe_defaults_unknown_false',
    probe.fields.CPU_DETECTED === 'unknown' &&
      probe.fields.GPU_DETECTED === 'unknown' &&
      probe.fields.NPU_DETECTED === 'unknown' &&
      probe.fields.WINDOWS_ML_SUPPORTED === 'unknown' &&
      probe.fields.AMD_EP_SUPPORTED === 'unknown' &&
      probe.fields.MODEL_LOAD_VERIFIED === false &&
      probe.amdRoutingAllowed === false,
    JSON.stringify(probe.fields),
  );

  const amdDenied = await gateAmdWorkloadRouting({
    probeId: 'p1',
    requestedTarget: 'amd_npu',
    probeEvidencePresent: false,
    root,
    actor,
  });
  check(
    'A_amd_routing_gated_until_probe',
    amdDenied.status === 'denied' && amdDenied.amdInferenceClaimed === false,
    amdDenied.reason,
  );

  const modelDeny = await probeModelLoadVerified({
    probeId: 'p1',
    claimVerified: true,
    evidencePresent: false,
    root,
    actor,
  });
  check(
    'A_model_load_unverified_default',
    modelDeny.status === 'denied' && modelDeny.modelLoadVerified === false,
    modelDeny.reason,
  );

  const probeWithEvidence = await runWindowsHardwareRuntimeProbe({
    probeId: 'p2',
    evidence: {
      CPU_DETECTED: true,
      AMD_EP_SUPPORTED: true,
      MODEL_LOAD_VERIFIED: false,
    },
    evidenceNotes: { CPU_DETECTED: 'test-only-simulated-evidence' },
    root,
    actor,
  });
  const amdBounded = await gateAmdWorkloadRouting({
    probeId: 'p2',
    requestedTarget: 'amd_gpu',
    probeEvidencePresent: true,
    root,
    actor,
  });
  check(
    'A_probe_evidence_allows_bounded_routing_not_inference_claim',
    probeWithEvidence.amdRoutingAllowed === true &&
      amdBounded.status === 'gated' &&
      amdBounded.amdInferenceClaimed === false,
    'bounded routing only; no AMD inference claim',
  );

  const off = await registerOfflineAgentBrain({
    nodeId: 'asus-off',
    devicePoweredOn: false,
    runtimeRunning: false,
    root,
    actor,
  });
  check(
    'B_offline_while_device_off_deny',
    off.state === 'OFFLINE_STOPPED' && off.agentsClaimedWorking === false,
    off.reason,
  );

  const waiting = await registerOfflineAgentBrain({
    nodeId: 'asus-waiting',
    devicePoweredOn: true,
    runtimeRunning: false,
    root,
    actor,
  });
  check(
    'B_waiting_node_when_runtime_not_running',
    waiting.state === 'WAITING_NODE',
    waiting.reason,
  );

  const promo = await attemptCapabilityPromotion({
    skillId: 's1',
    stagesCompleted: ['research'],
    guardianApproved: false,
    humanPolicyPromoted: false,
    root,
    actor,
  });
  check(
    'B_silent_authority_growth_deny_via_incomplete_pipeline',
    promo.status === 'denied' &&
      promo.automaticPowerIncrease === false &&
      CAPABILITY_PROMOTION_PIPELINE[0] === 'research',
    promo.reason,
  );

  const silent = await denySilentAuthorityGrowth({
    claim: 'agent learns → automatic power increase',
    root,
    actor,
  });
  check('B_silent_authority_deny', silent.status === 'denied', silent.reason);

  const guard = await guardianGate({
    action: 'promote',
    guardianApproved: false,
    root,
    actor,
  });
  check('B_guardian_gate', guard.status === 'denied', guard.reason);

  const fullPromo = await attemptCapabilityPromotion({
    skillId: 's2',
    stagesCompleted: [...CAPABILITY_PROMOTION_PIPELINE],
    guardianApproved: true,
    humanPolicyPromoted: true,
    root,
    actor,
  });
  check(
    'B_full_pipeline_bounded_use_only',
    fullPromo.status === 'ok' &&
      fullPromo.boundedUse === true &&
      fullPromo.automaticPowerIncrease === false,
    fullPromo.reason,
  );

  const path = await registerNeuralPathway({
    edgeId: 'e1',
    fromKind: 'problem',
    toKind: 'algorithm',
    weight: 0.5,
    source: 'lab',
    provenance: 'experiment-log',
    confidence: 0.8,
    owner: actor.id,
    universe: actor.universeId,
    permissions: ['read'],
    version: '1',
    root,
    actor,
  });
  check('C_neural_pathway_register', path.status === 'ok', path.reason);

  const up = await adjustPathwayWeight({
    edgeId: 'e1',
    direction: 'strengthen',
    cause: 'tests',
    previousWeight: 0.5,
    root,
    actor,
  });
  const down = await adjustPathwayWeight({
    edgeId: 'e1',
    direction: 'weaken',
    cause: 'contradicted',
    previousWeight: 0.55,
    root,
    actor,
  });
  check(
    'C_pathway_strengthen_weaken_audit',
    up.status === 'ok' && down.status === 'ok',
    `${up.reason}; ${down.reason}`,
  );

  for (const cls of ATLAS_EVIDENCE_CLASSES) {
    const entry = await registerCivilizationAtlasEntry({
      entryId: `atlas-${cls}`,
      atlas: 'mesopotamia',
      subject: 'ethics',
      evidenceClass: cls,
      provenance: 'test',
      root,
      actor,
    });
    check(
      `D_evidence_class_${cls}`,
      entry.status === 'ok' && entry.evidenceClass === cls,
      entry.reason,
    );
  }
  const noClass = await registerCivilizationAtlasEntry({
    entryId: 'atlas-missing',
    atlas: 'india',
    subject: 'medicine_history',
    evidenceClass: null,
    provenance: 'x',
    root,
    actor,
  });
  check('D_evidence_class_required', noClass.status === 'denied', noClass.reason);
  const med = await probeHistoricalMedicineClinicalClaim({
    claimModernClinicalGuidance: true,
    root,
    actor,
  });
  check(
    'D_historical_medicine_neq_clinical',
    med.status === 'denied' &&
      med.clinicalAuthority === false &&
      med.modernMedicalGuidance === false,
    med.reason,
  );

  for (const ts of QUANTUM_TRUTH_STATES) {
    const q = await registerQuantumExperiment({
      experimentId: `q-${ts}`,
      truthState: ts,
      method: 'quantum_inspired',
      claimPhysicalQpu: false,
      root,
      actor,
    });
    check(
      `E_quantum_truth_${ts}`,
      q.status === 'ok' && q.truthState === ts && q.physicalQpuClaimed === false,
      q.reason,
    );
  }
  const qadv = await denyQuantumAdvantageWithoutBaselines({
    claimAdvantage: true,
    beatsClassicalBaselines: false,
    reproducible: false,
    root,
    actor,
  });
  check(
    'E_quantum_advantage_deny_without_baselines',
    qadv.status === 'denied',
    qadv.reason,
  );
  const asusQ = await probeAsusPhysicalQpuClaim({
    claimConnectedQpu: true,
    physicalQpuVerified: false,
    root,
    actor,
  });
  check('E_asus_neq_physical_qpu', asusQ.status === 'denied', asusQ.reason);

  const search = await runUniversalSearch({
    queryId: 'otif',
    query: 'OTIF drop',
    consequential: true,
    configuredSources: ['erp'],
    requestedSources: ['erp', 'tms'],
    root,
    actor,
  });
  check(
    'F_search_authority_human_approval',
    search.authority === 'HUMAN_APPROVAL_REQUIRED' &&
      search.sourcesUnavailable.includes('tms'),
    search.authority,
  );
  const unavail = await probeSearchSourceAcl({
    source: 'inventory',
    configured: false,
    authorizedUniverse: actor.universeId,
    requestUniverse: actor.universeId,
    root,
    actor,
  });
  check(
    'F_unconfigured_source_unavailable',
    unavail.status === 'unavailable',
    unavail.reason,
  );
  const leak = await probeSearchSourceAcl({
    source: 'erp',
    configured: true,
    authorizedUniverse: 'u-a',
    requestUniverse: 'u-b',
    root,
    actor,
  });
  check('F_acl_no_cross_context_leak', leak.status === 'denied', leak.reason);

  const avOk = await registerAvatarPresence({
    avatarId: 'av1',
    universeId: actor.universeId,
    presence: 'LOCAL_ONLY',
    automationActive: true,
    automationDisclosed: true,
    root,
    actor,
  });
  check('G_avatar_presence_with_disclosure', avOk.status === 'ok', avOk.reason);

  const avBad = await delegateAvatarOfflineFaq({
    avatarId: 'av1',
    automationDisclosed: false,
    claimLiveHuman: true,
    root,
    actor,
  });
  check(
    'G_avatar_automation_disclosure_required',
    avBad.status === 'denied',
    avBad.reason,
  );

  const avFounder = await probeAvatarFounderAuthority({
    actor: avatarActor,
    claimFounderAuthority: true,
    root,
  });
  check('G_avatar_neq_founder', avFounder.status === 'denied', avFounder.reason);

  const conv = await registerConversionStep({
    stepId: 'c1',
    stage: 'account',
    root,
    actor,
  });
  check(
    'H_conversion_recommend_only',
    conv.status === 'ok' && conv.autoCharge === false,
    conv.reason,
  );
  const charge = await denyConversionAutoCharge({
    attemptAutoCharge: true,
    root,
    actor,
  });
  check('H_conversion_neq_auto_charge', charge.status === 'denied', charge.reason);
  const dark = await registerConversionStep({
    stepId: 'c2',
    stage: 'paid_ai_workforce_storage_intelligence',
    darkPattern: true,
    root,
    actor,
  });
  check('H_conversion_dark_patterns_denied', dark.status === 'denied', dark.reason);

  const nonClaims = explicitNonClaimsSnapshot();
  check(
    'H_explicit_non_claims',
    nonClaims.agentsWorkingWhileAsusOff === false &&
      nonClaims.amdGpuNpuInferenceAlreadyRun === false &&
      nonClaims.quantumComputerConnected === false &&
      nonClaims.microsoftToolsUnrestrictedAccess === false &&
      nonClaims.liveAvatarSystemProductionExistsBeyondContracts === false &&
      nonClaims.guardianRlsRuntimeVerified === false &&
      nonClaims.historicalDatabasesAlreadyPopulated === false &&
      nonClaims.productionScaleSearchInfrastructureOperating === false &&
      EXPLICIT_NON_CLAIMS.amdGpuNpuInferenceAlreadyRun === false,
    'all explicit non-claims false',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'H_ei_eg_ee_soft_wire_probe',
    preds.EI.tipProbe === 'PRESENT' ||
      preds.EG.tipProbe === 'PRESENT' ||
      preds.EE.tipProbe === 'PRESENT' ||
      preds.EJ.tipProbe === 'PRESENT' ||
      preds.EJ.tipProbe === 'WAITING_DATA',
    `EJ=${preds.EJ.tipProbe}; EI=${preds.EI.tipProbe}; EG=${preds.EG.tipProbe}; EE=${preds.EE.tipProbe}`,
  );

  const honesty = windowsAmdLocalCognitiveOsHonesty(repoRoot);
  check(
    'H_os_honesty_probe_first',
    honesty.subsystems.windowsProbe.probeFirstRequired === true &&
      honesty.amdRoutingWithoutProbe === false &&
      honesty.banner === HONESTY_BANNER,
    'probe-first confirmed in honesty surface',
  );

  const cycle = await runWindowsAmdLocalCognitiveOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'runtime_cycle',
    failedHops.length === 0 &&
      cycle.probeFirst === true &&
      cycle.tipLand === false &&
      cycle.githubSotIssue === 155 &&
      cycle.gitlabCoordinationIssue === 88,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildWindowsAmdLocalCognitiveOsHealthReport({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'health_report',
    health.status === 'HEALTHY' &&
      health.probeFirst === true &&
      health.tipLand === false &&
      health.dbCandidatesApplied === false,
    `status=${health.status}; hops=${health.hopCount}`,
  );
} catch (err) {
  failures.push(`uncaught: ${(err as Error).message}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-EK stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('PASS npm run test:62lek — all 62L-EK denial/honesty stories');
