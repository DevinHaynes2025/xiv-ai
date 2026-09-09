import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attemptAgentDepartmentSelfPromotion,
  openDepartmentMeeting,
} from './agent-department-network';
import {
  attemptMicroserverSelfPromotion,
  probeHardwareClaim,
  probeOfflineMicroserver,
  probeVgpuRunningVerified,
} from './cloud-microserver-virtual-gpu-fabric';
import {
  denyAutonomyBoundaryAction,
  issueOpsRecommendation,
  probeOpsIntelligence,
} from './global-operations-intelligence-grid';
import {
  bootstrapGlobalOperationsIntelligenceGrid,
  globalOperationsIntelligenceGridSystemHonesty,
} from './global-operations-intelligence-grid-system';
import {
  AGENT_DEPT_SELF_PROMOTION_DENIED,
  ATLAS_ACL_DENIED,
  BIOMETRIC_DEFAULTS_OFF,
  CONTRACT_SIGNING_DENIED,
  CROSS_OS_CONSENT_REQUIRED,
  DEPT_NEQ_AUTONOMY,
  DZ_PROMOTION_GATE_SOFT_WIRE,
  EA_LOCKS,
  FREIGHT_BOOKING_DENIED,
  GLOBAL_OPERATIONS_INTELLIGENCE_GRID_CYCLE,
  HARDWARE_EVIDENCE_REQUIRED,
  HONESTY_BANNER,
  LEARNING_LOOP_RULES,
  LLM_SEARCH_GOVERNED,
  MICROSERVER_SELF_PROMOTION_DENIED,
  MINI_SERVER_EVIDENCE_GATED,
  MULTI_MODEL_CONTRACT_ONLY,
  NEXT_PHASE_TITLE,
  OFFLINE_WAITING_OR_STOPPED,
  OPS_DENY_BY_DEFAULT,
  OPS_LABEL_NEQ_ACCESS,
  OPS_RECOMMENDATION_NEQ_ACTION,
  PERMISSION_BYPASS_DENIED,
  PRODUCT_PHILOSOPHY,
  PRODUCTION_CHANGE_DENIED,
  PROMOTION_GATE,
  PURCHASE_ORDER_DENIED,
  QUANTUM_NEEDS_CLASSICAL,
  QUANTUM_NO_SUPREMACY,
  QUANTUM_SIM_NEQ_FACT,
  SILENT_PERSISTENCE_DENIED,
  SPECULATIVE_QUARANTINE,
  SPEND_MONEY_DENIED,
  STEALTH_INSTALL_DENIED,
  SYMBOL_AUTHORIZED_DATA_ONLY,
  TWIN_NEQ_FOUNDER,
  UNAUTHORIZED_DEPT_MEETING,
  UNAUTHORIZED_TAKEOVER_DENIED,
  UNCONFIGURED_PROVIDER_DENIED,
  VGPU_EVIDENCE_REQUIRED,
  XAI_NO_FABRICATED_CREDS,
  XAI_UNAVAILABLE,
  XR_NEQ_COVERT,
  predecessorMap,
  type EaActor,
} from './global-operations-intelligence-grid-types';
import {
  buildGlobalOperationsIntelligenceGridHealthReport,
  runGlobalOperationsIntelligenceGridCycle,
} from './global-operations-intelligence-grid-runtime';
import {
  evaluateMultiModel,
  probeProviderAdapter,
  probeXaiProvider,
} from './grok-xai-model-federation';
import {
  accessCivilizationAtlas,
  quarantineSpeculativeTopic,
  translateSymbol,
} from './historical-civilization-space-knowledge-atlas';
import { runQuantumInspiredOptimization } from './quantum-inspired-compute-brain';
import {
  denyOsMaliciousAction,
  probeDigitalTwinAuthority,
  requestCrossOsInstall,
  softWireDzPromotionGate,
} from './secure-os-integration-foundation';
import {
  llmOnTheGoSearch,
  openXrResearchSession,
  probeLocalMiniServer,
} from './xr-holographic-research-layer';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lea-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: EaActor = {
  kind: 'global_ops_intelligence_curator',
  id: 'test-curator',
  orgId: 'org-ea',
  tenantId: 'tenant-ea',
  universeId: 'universe-ea',
};
const twinActor: EaActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      EA_LOCKS.L4_AUTONOMY_ENABLED === false &&
      EA_LOCKS.TIP_LAND === false &&
      EA_LOCKS.XAI_FABRICATED_LIVE_CALLS === false &&
      EA_LOCKS.UNCONFIGURED_PROVIDER_EQ_AVAILABLE === false &&
      EA_LOCKS.CLASSICAL_BASELINE_OPTIONAL === false &&
      EA_LOCKS.QUANTUM_SUPREMACY_WITHOUT_EVIDENCE === false &&
      EA_LOCKS.SPECULATIVE_EQ_VERIFIED_FACT === false &&
      EA_LOCKS.STEALTH_OS_INSTALL_ALLOWED === false &&
      EA_LOCKS.UNAUTHORIZED_OS_TAKEOVER_ALLOWED === false &&
      EA_LOCKS.OS_PERMISSION_BYPASS_ALLOWED === false &&
      EA_LOCKS.SILENT_PERSISTENCE_ALLOWED === false &&
      EA_LOCKS.XR_EQ_COVERT_CAPTURE === false &&
      EA_LOCKS.BIOMETRIC_DEFAULTS_ON === false &&
      EA_LOCKS.CONSCIOUSNESS_CLAIMED === false &&
      EA_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false &&
      PRODUCT_PHILOSOPHY.xaiOptionalProviderUnconfiguredUnavailable === true &&
      PRODUCT_PHILOSOPHY.secureOsAntiMalwareHardRules === true &&
      LEARNING_LOOP_RULES.noSelfPromotionToProduction === true &&
      PROMOTION_GATE.softWireDzPromotionGate === true &&
      GLOBAL_OPERATIONS_INTELLIGENCE_GRID_CYCLE.includes(
        'xai_unconfigured_unavailable',
      ) &&
      GLOBAL_OPERATIONS_INTELLIGENCE_GRID_CYCLE.includes(
        'stealth_install_denied',
      ),
    'locks + philosophy + cycle present',
  );

  const os = await bootstrapGlobalOperationsIntelligenceGrid({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_global_operations_intelligence_grid',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.publicLaunchAuthorized === false &&
      (os.predecessorLayer === 'DZ' || os.predecessorLayer === 'DY') &&
      (os.softWiredPredecessors.includes('DZ') ||
        os.softWiredPredecessors.includes('DY')),
    `os=${os.id}; predecessor=${os.predecessorLayer}; soft=${os.softWiredPredecessors.join(',')}`,
  );

  // A
  const denyDefault = await probeOpsIntelligence({
    query: 'ops',
    authorized: false,
    root,
    actor,
  });
  check(
    'ops_intelligence_deny_by_default',
    denyDefault.status === 'denied' &&
      denyDefault.reason === OPS_DENY_BY_DEFAULT,
    denyDefault.reason,
  );
  const rec = await issueOpsRecommendation({
    summary: 'route',
    attemptCharge: true,
    attemptDeploy: true,
    attemptSpend: true,
    attemptSign: true,
    attemptPublish: true,
    root,
    actor,
  });
  check(
    'ops_recommendation_neq_charge_deploy_spend',
    rec.status === 'denied' && rec.reason === OPS_RECOMMENDATION_NEQ_ACTION,
    rec.reason,
  );
  const label = await probeOpsIntelligence({
    query: 'labeled',
    authorized: true,
    labeledOnly: true,
    root,
    actor,
  });
  check(
    'ops_label_alone_neq_access',
    label.status === 'denied' && label.reason === OPS_LABEL_NEQ_ACCESS,
    label.reason,
  );
  for (const [action, reason] of [
    ['book_freight', FREIGHT_BOOKING_DENIED],
    ['issue_purchase_order', PURCHASE_ORDER_DENIED],
    ['sign_contract', CONTRACT_SIGNING_DENIED],
    ['spend_money', SPEND_MONEY_DENIED],
    ['change_production_system', PRODUCTION_CHANGE_DENIED],
  ] as const) {
    const d = await denyAutonomyBoundaryAction({
      action,
      root,
      actor,
    });
    check(
      `autonomy_${action}_denied`,
      d.status === 'denied' && d.reason === reason,
      d.reason,
    );
  }

  // B — xAI
  const xai = await probeXaiProvider({
    configured: false,
    attemptLiveCall: true,
    root,
    actor,
  });
  check(
    'xai_unconfigured_unavailable',
    xai.status === 'unavailable' &&
      xai.state === 'UNAVAILABLE' &&
      xai.reason === XAI_UNAVAILABLE,
    xai.reason,
  );
  const fake = await probeXaiProvider({
    configured: true,
    fabricatedCredentialsAttempted: true,
    root,
    actor,
  });
  check(
    'xai_no_fabricated_live_credentials',
    fake.status === 'denied' && fake.reason === XAI_NO_FABRICATED_CREDS,
    fake.reason,
  );
  const multi = await evaluateMultiModel({
    models: ['local', 'grok'],
    liveExecution: false,
    root,
    actor,
  });
  check(
    'multi_model_evaluation_contract_only',
    multi.status === 'contract_only' &&
      multi.reason === MULTI_MODEL_CONTRACT_ONLY,
    multi.reason,
  );
  const provider = await probeProviderAdapter({
    providerId: 'xai',
    configured: false,
    root,
    actor,
  });
  check(
    'unconfigured_provider_denied',
    provider.state === 'UNAVAILABLE' &&
      provider.reason === UNCONFIGURED_PROVIDER_DENIED,
    provider.reason,
  );

  // C
  const vgpu = await probeVgpuRunningVerified({
    nodeId: 'n1',
    authorized: false,
    heartbeatPresent: false,
    claimRunningVerified: true,
    root,
    actor,
  });
  check(
    'vgpu_running_verified_needs_evidence',
    vgpu.status === 'denied' && vgpu.reason === VGPU_EVIDENCE_REQUIRED,
    vgpu.reason,
  );
  const hw = await probeHardwareClaim({
    claimKind: 'NPU',
    evidencePresent: false,
    root,
    actor,
  });
  check(
    'cpu_gpu_npu_claim_needs_evidence',
    hw.status === 'denied' && hw.reason === HARDWARE_EVIDENCE_REQUIRED,
    hw.reason,
  );
  const offline = await probeOfflineMicroserver({
    nodeId: 'ms1',
    poweredNodePresent: false,
    root,
    actor,
  });
  check(
    'offline_microserver_waiting_or_stopped',
    offline.state === 'OFFLINE_STOPPED' &&
      offline.reason === OFFLINE_WAITING_OR_STOPPED,
    offline.reason,
  );
  const msPromo = await attemptMicroserverSelfPromotion({
    microserverId: 'ms-x',
    root,
    actor,
  });
  check(
    'microserver_self_promotion_denied',
    msPromo.status === 'denied' &&
      msPromo.reason === MICROSERVER_SELF_PROMOTION_DENIED,
    msPromo.reason,
  );

  // D
  const qBase = await runQuantumInspiredOptimization({
    candidateId: 'q1',
    classicalBaselinePresent: false,
    root,
    actor,
  });
  check(
    'quantum_inspired_requires_classical_baseline',
    qBase.status === 'denied' && qBase.reason === QUANTUM_NEEDS_CLASSICAL,
    qBase.reason,
  );
  const qSup = await runQuantumInspiredOptimization({
    candidateId: 'q2',
    classicalBaselinePresent: true,
    supremacyClaimed: true,
    root,
    actor,
  });
  check(
    'no_unverified_quantum_supremacy',
    qSup.status === 'denied' && qSup.reason === QUANTUM_NO_SUPREMACY,
    qSup.reason,
  );
  const qFact = await runQuantumInspiredOptimization({
    candidateId: 'q3',
    classicalBaselinePresent: true,
    claimVerifiedFact: true,
    root,
    actor,
  });
  check(
    'quantum_sim_neq_verified_fact',
    qFact.status === 'denied' && qFact.reason === QUANTUM_SIM_NEQ_FACT,
    qFact.reason,
  );

  // E
  const atlas = await accessCivilizationAtlas({
    entryId: 'e1',
    authorized: false,
    root,
    actor,
  });
  check(
    'atlas_acl_deny_by_default',
    atlas.status === 'denied' && atlas.reason === ATLAS_ACL_DENIED,
    atlas.reason,
  );
  const spec = await quarantineSpeculativeTopic({
    topic: 'extraterrestrial_technology',
    claimVerifiedFact: true,
    root,
    actor,
  });
  check(
    'speculative_topic_quarantined_research_sim',
    spec.label === 'RESEARCH_SIM' &&
      spec.reason === SPECULATIVE_QUARANTINE &&
      (spec.status === 'denied' || spec.status === 'quarantined'),
    `${spec.label}:${spec.reason}`,
  );
  const sym = await translateSymbol({
    symbolId: 's1',
    authorizedPublicLicensedOrCustomerOwned: false,
    root,
    actor,
  });
  check(
    'symbol_translation_authorized_data_only',
    sym.status === 'denied' && sym.reason === SYMBOL_AUTHORIZED_DATA_ONLY,
    sym.reason,
  );

  // F
  const meet = await openDepartmentMeeting({
    meetingId: 'm1',
    departmentId: 'research',
    signed: true,
    authorized: false,
    root,
    actor,
  });
  check(
    'unauthorized_department_meeting_denied',
    meet.status === 'denied' && meet.reason === UNAUTHORIZED_DEPT_MEETING,
    meet.reason,
  );
  const auto = await openDepartmentMeeting({
    meetingId: 'm2',
    departmentId: 'ops',
    signed: true,
    authorized: true,
    unrestrictedAutonomyClaimed: true,
    root,
    actor,
  });
  check(
    'department_neq_unrestricted_autonomy',
    auto.status === 'denied' && auto.reason === DEPT_NEQ_AUTONOMY,
    auto.reason,
  );
  const deptPromo = await attemptAgentDepartmentSelfPromotion({
    agentId: 'a1',
    departmentId: 'ops',
    root,
    actor,
  });
  check(
    'agent_department_self_promotion_denied',
    deptPromo.status === 'denied' &&
      deptPromo.reason === AGENT_DEPT_SELF_PROMOTION_DENIED,
    deptPromo.reason,
  );

  // G
  const xr = await openXrResearchSession({
    sessionId: 'xr1',
    covertCaptureAttempted: true,
    root,
    actor,
  });
  check(
    'xr_research_layer_neq_covert_capture',
    xr.status === 'denied' && xr.reason === XR_NEQ_COVERT,
    xr.reason,
  );
  const bio = await openXrResearchSession({
    sessionId: 'xr2',
    biometricEnabled: true,
    root,
    actor,
  });
  check(
    'biometric_defaults_off',
    bio.status === 'denied' && bio.reason === BIOMETRIC_DEFAULTS_OFF,
    bio.reason,
  );
  const search = await llmOnTheGoSearch({
    query: 'space',
    authorized: false,
    root,
    actor,
  });
  check(
    'llm_on_the_go_search_governed',
    search.status === 'denied' && search.reason === LLM_SEARCH_GOVERNED,
    search.reason,
  );
  const mini = await probeLocalMiniServer({
    serverId: 'mini1',
    evidencePresent: false,
    claimRunningVerified: true,
    root,
    actor,
  });
  check(
    'local_mini_server_evidence_gated',
    mini.status === 'denied' && mini.reason === MINI_SERVER_EVIDENCE_GATED,
    mini.reason,
  );

  // H — Secure OS
  for (const [action, reason] of [
    ['stealth_install', STEALTH_INSTALL_DENIED],
    ['unauthorized_takeover', UNAUTHORIZED_TAKEOVER_DENIED],
    ['permission_bypass', PERMISSION_BYPASS_DENIED],
    ['silent_persistence', SILENT_PERSISTENCE_DENIED],
  ] as const) {
    const d = await denyOsMaliciousAction({ action, root, actor });
    check(
      `${action}_denied`,
      d.status === 'denied' && d.reason === reason,
      d.reason,
    );
  }
  const crossOs = await requestCrossOsInstall({
    targetOs: 'windows',
    explicit: false,
    consented: false,
    revocable: false,
    auditable: false,
    root,
    actor,
  });
  check(
    'cross_os_install_requires_explicit_consent_revocable_auditable',
    crossOs.status === 'denied' && crossOs.reason === CROSS_OS_CONSENT_REQUIRED,
    crossOs.reason,
  );
  const crossOsOk = await requestCrossOsInstall({
    targetOs: 'linux',
    explicit: true,
    consented: true,
    revocable: true,
    auditable: true,
    root,
    actor,
  });
  check(
    'cross_os_install_ok_when_explicit_consented_revocable_auditable',
    crossOsOk.status === 'ok',
    crossOsOk.reason,
  );
  const promo = await softWireDzPromotionGate({
    selfPromotionAttempted: true,
    root,
    actor,
    repoRoot,
  });
  check(
    'dz_promotion_gate_soft_wire',
    promo.status === 'denied' &&
      promo.productionAuthorized === false &&
      promo.reason === DZ_PROMOTION_GATE_SOFT_WIRE &&
      promo.dzPresent === true,
    `${promo.reason}; dzPresent=${promo.dzPresent}`,
  );
  const twin = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  check(
    'digital_twin_neq_founder',
    twin.status === 'denied' && twin.reason === TWIN_NEQ_FOUNDER,
    twin.reason,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'dz_dy_soft_wire_probe',
    preds.DZ.tipProbe === 'PRESENT' && preds.DZ.report === 'PRESENT',
    `DZ=${preds.DZ.tipProbe}/${preds.DZ.report}; DY=${preds.DY.tipProbe}/${preds.DY.report}`,
  );

  check(
    'next_phase_title_documented_only',
    NEXT_PHASE_TITLE.startsWith('62L-EB') &&
      NEXT_PHASE_TITLE.includes('Multi-Model Superbrain Federation'),
    NEXT_PHASE_TITLE,
  );

  const cycle = await runGlobalOperationsIntelligenceGridCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'runtime_cycle_no_fail_hops',
    failedHops.length === 0 &&
      cycle.l4AutonomyEnabled === false &&
      cycle.productionAuthorized === false &&
      cycle.dbCandidatesApplied === false &&
      cycle.githubSotIssue === 145 &&
      cycle.gitlabCoordinationIssue === 79,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',')}`,
  );

  const health = await buildGlobalOperationsIntelligenceGridHealthReport({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'health_report_healthy',
    health.status === 'HEALTHY' &&
      health.productionAuthorized === false &&
      health.tipLand === false &&
      health.dbCandidatesApplied === false,
    `status=${health.status}; hops=${health.hopCount}`,
  );

  const honesty = globalOperationsIntelligenceGridSystemHonesty(repoRoot);
  check(
    'honesty_aggregate',
    honesty.l4AutonomyEnabled === false &&
      honesty.xaiFabricatedLiveCalls === false &&
      honesty.stealthOsInstallAllowed === false &&
      honesty.speculativeEqVerifiedFact === false &&
      honesty.learningLoopRules.noSelfPromotionToProduction === true &&
      honesty.subsystems.xaiFederation.unconfiguredUnavailable === true,
    'honesty aggregate locks hold',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} stories:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('PASS npm run test:62lea — all denial/honesty stories');
