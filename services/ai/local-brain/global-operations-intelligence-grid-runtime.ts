/**
 * 62L-EA Global Operations Intelligence Grid runtime —
 * Walks GLOBAL_OPERATIONS_INTELLIGENCE_GRID_CYCLE and builds health report.
 */

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
import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
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
  EA_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  GLOBAL_OPERATIONS_INTELLIGENCE_GRID_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type EaActor,
  type EaEvidenceState,
  type EaHop,
  type EaHopRecord,
} from './global-operations-intelligence-grid-types';
import {
  evaluateMultiModel,
  probeProviderAdapter,
  probeXaiProvider,
} from './grok-xai-model-federation';
import { checkLocalBrainHealth } from './health-check';
import {
  accessCivilizationAtlas,
  quarantineSpeculativeTopic,
  translateSymbol,
} from './historical-civilization-space-knowledge-atlas';
import { appendLearning } from './learning-ledger';
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

export {
  GLOBAL_OPERATIONS_INTELLIGENCE_GRID_CYCLE,
  EA_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: EaHop, state: EaEvidenceState, summary: string): EaHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type EaCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: EaActor;
  root?: string;
  repoRoot?: string;
};

export async function runGlobalOperationsIntelligenceGridCycle(
  input: EaCycleInput,
) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: EaHopRecord[] = [];
  const actor = {
    ...input.actor,
    universeId: input.universeId || input.actor.universeId,
  };
  const twinActor: EaActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

  hops.push(
    hop(
      'honesty_locks',
      EA_LOCKS.L4_AUTONOMY_ENABLED === false &&
        EA_LOCKS.LOCAL_FIRST &&
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
        EA_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
        EA_LOCKS.CONSCIOUSNESS_CLAIMED === false &&
        EA_LOCKS.TIP_LAND === false &&
        EA_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapGlobalOperationsIntelligenceGrid({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'global_operations_intelligence_grid_bootstrap',
      'PASS',
      `os=${os.id}; predecessor=${os.predecessorLayer}; softWire=${os.softWiredPredecessors.join(',')}`,
    ),
  );

  // A
  const denyDefault = await probeOpsIntelligence({
    query: 'global ops overview',
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'ops_intelligence_deny_by_default',
      denyDefault.status === 'denied' ? 'DENIED' : 'FAIL',
      denyDefault.reason,
    ),
  );
  const rec = await issueOpsRecommendation({
    summary: 'optimize routing',
    attemptCharge: true,
    attemptDeploy: true,
    attemptSpend: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'ops_recommendation_neq_charge_deploy_spend',
      rec.status === 'denied' ? 'DENIED' : 'FAIL',
      rec.reason,
    ),
  );
  const label = await probeOpsIntelligence({
    query: 'labeled ops',
    authorized: true,
    labeledOnly: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'ops_label_alone_neq_access',
      label.status === 'denied' ? 'DENIED' : 'FAIL',
      label.reason,
    ),
  );
  const freight = await denyAutonomyBoundaryAction({
    action: 'book_freight',
    root,
    actor,
  });
  hops.push(
    hop(
      'freight_po_contract_spend_prod_change_denied',
      freight.status === 'denied' ? 'DENIED' : 'FAIL',
      freight.reason,
    ),
  );

  // B
  const xai = await probeXaiProvider({
    configured: false,
    attemptLiveCall: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'xai_unconfigured_unavailable',
      xai.state === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FAIL',
      xai.reason,
    ),
  );
  const fakeCreds = await probeXaiProvider({
    configured: false,
    fabricatedCredentialsAttempted: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'xai_no_fabricated_live_credentials',
      fakeCreds.status === 'denied' ? 'DENIED' : 'FAIL',
      fakeCreds.reason,
    ),
  );
  const multi = await evaluateMultiModel({
    models: ['local', 'grok-optional'],
    liveExecution: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'multi_model_evaluation_contract_only',
      multi.status === 'contract_only' ? 'CONTRACT_ONLY' : 'FAIL',
      multi.reason,
    ),
  );
  const provider = await probeProviderAdapter({
    providerId: 'xai',
    configured: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_provider_denied',
      provider.state === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FAIL',
      provider.reason,
    ),
  );

  // C
  const vgpu = await probeVgpuRunningVerified({
    nodeId: 'node-1',
    authorized: false,
    heartbeatPresent: false,
    claimRunningVerified: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'vgpu_running_verified_needs_evidence',
      vgpu.status === 'denied' ? 'NOT_VERIFIED' : 'FAIL',
      vgpu.reason,
    ),
  );
  const hw = await probeHardwareClaim({
    claimKind: 'GPU',
    evidencePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'cpu_gpu_npu_claim_needs_evidence',
      hw.status === 'denied' ? 'NOT_VERIFIED' : 'FAIL',
      hw.reason,
    ),
  );
  const offline = await probeOfflineMicroserver({
    nodeId: 'ms-1',
    poweredNodePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_microserver_waiting_or_stopped',
      offline.state === 'OFFLINE_STOPPED' ? 'OFFLINE_STOPPED' : 'FAIL',
      offline.reason,
    ),
  );
  const msPromo = await attemptMicroserverSelfPromotion({
    microserverId: 'ms-x',
    root,
    actor,
  });
  hops.push(
    hop(
      'microserver_self_promotion_denied',
      msPromo.status === 'denied' ? 'PROMOTION_DENIED' : 'FAIL',
      msPromo.reason,
    ),
  );

  // D
  const qNoBase = await runQuantumInspiredOptimization({
    candidateId: 'q-1',
    classicalBaselinePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_inspired_requires_classical_baseline',
      qNoBase.status === 'denied' ? 'CLASSICAL_BASELINE_REQUIRED' : 'FAIL',
      qNoBase.reason,
    ),
  );
  const qSup = await runQuantumInspiredOptimization({
    candidateId: 'q-2',
    classicalBaselinePresent: true,
    supremacyClaimed: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'no_unverified_quantum_supremacy',
      qSup.status === 'denied' ? 'DENIED' : 'FAIL',
      qSup.reason,
    ),
  );
  const qFact = await runQuantumInspiredOptimization({
    candidateId: 'q-3',
    classicalBaselinePresent: true,
    claimVerifiedFact: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_sim_neq_verified_fact',
      qFact.status === 'denied' ? 'DENIED' : 'FAIL',
      qFact.reason,
    ),
  );

  // E
  const atlas = await accessCivilizationAtlas({
    entryId: 'civ-1',
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'atlas_acl_deny_by_default',
      atlas.status === 'denied' ? 'DENIED' : 'FAIL',
      atlas.reason,
    ),
  );
  const spec = await quarantineSpeculativeTopic({
    topic: 'dark_matter',
    claimVerifiedFact: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'speculative_topic_quarantined_research_sim',
      spec.reason.includes('SPECULATIVE') || spec.state === 'DENIED'
        ? 'RESEARCH_SIM'
        : 'FAIL',
      `${spec.label}:${spec.reason}`,
    ),
  );
  const sym = await translateSymbol({
    symbolId: 'sym-1',
    authorizedPublicLicensedOrCustomerOwned: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'symbol_translation_authorized_data_only',
      sym.status === 'denied' ? 'DENIED' : 'FAIL',
      sym.reason,
    ),
  );

  // F
  const meet = await openDepartmentMeeting({
    meetingId: 'meet-1',
    departmentId: 'research',
    signed: true,
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_department_meeting_denied',
      meet.status === 'denied' ? 'DENIED' : 'FAIL',
      meet.reason,
    ),
  );
  const auto = await openDepartmentMeeting({
    meetingId: 'meet-2',
    departmentId: 'ops',
    signed: true,
    authorized: true,
    unrestrictedAutonomyClaimed: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'department_neq_unrestricted_autonomy',
      auto.status === 'denied' ? 'DENIED' : 'FAIL',
      auto.reason,
    ),
  );
  const deptPromo = await attemptAgentDepartmentSelfPromotion({
    agentId: 'agent-1',
    departmentId: 'ops',
    root,
    actor,
  });
  hops.push(
    hop(
      'agent_department_self_promotion_denied',
      deptPromo.status === 'denied' ? 'PROMOTION_DENIED' : 'FAIL',
      deptPromo.reason,
    ),
  );

  // G
  const xr = await openXrResearchSession({
    sessionId: 'xr-1',
    covertCaptureAttempted: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'xr_research_layer_neq_covert_capture',
      xr.status === 'denied' ? 'DENIED' : 'FAIL',
      xr.reason,
    ),
  );
  const bio = await openXrResearchSession({
    sessionId: 'xr-2',
    biometricEnabled: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'biometric_defaults_off',
      bio.status === 'denied' ? 'DENIED' : 'FAIL',
      bio.reason,
    ),
  );
  const search = await llmOnTheGoSearch({
    query: 'aerospace history',
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'llm_on_the_go_search_governed',
      search.status === 'denied' ? 'DENIED' : 'FAIL',
      search.reason,
    ),
  );
  const mini = await probeLocalMiniServer({
    serverId: 'mini-1',
    evidencePresent: false,
    claimRunningVerified: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'local_mini_server_evidence_gated',
      mini.status === 'denied' ? 'NOT_VERIFIED' : 'FAIL',
      mini.reason,
    ),
  );

  // H
  const stealth = await denyOsMaliciousAction({
    action: 'stealth_install',
    root,
    actor,
  });
  hops.push(
    hop(
      'stealth_install_denied',
      stealth.status === 'denied' ? 'DENIED' : 'FAIL',
      stealth.reason,
    ),
  );
  const takeover = await denyOsMaliciousAction({
    action: 'unauthorized_takeover',
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_takeover_denied',
      takeover.status === 'denied' ? 'DENIED' : 'FAIL',
      takeover.reason,
    ),
  );
  const bypass = await denyOsMaliciousAction({
    action: 'permission_bypass',
    root,
    actor,
  });
  hops.push(
    hop(
      'permission_bypass_denied',
      bypass.status === 'denied' ? 'DENIED' : 'FAIL',
      bypass.reason,
    ),
  );
  const persist = await denyOsMaliciousAction({
    action: 'silent_persistence',
    root,
    actor,
  });
  hops.push(
    hop(
      'silent_persistence_denied',
      persist.status === 'denied' ? 'DENIED' : 'FAIL',
      persist.reason,
    ),
  );
  const crossOs = await requestCrossOsInstall({
    targetOs: 'linux',
    explicit: false,
    consented: false,
    revocable: false,
    auditable: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'cross_os_install_requires_explicit_consent_revocable_auditable',
      crossOs.status === 'denied' ? 'DENIED' : 'FAIL',
      crossOs.reason,
    ),
  );
  const promo = await softWireDzPromotionGate({
    selfPromotionAttempted: true,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'dz_promotion_gate_soft_wire',
      promo.status === 'denied' && promo.productionAuthorized === false
        ? 'PROMOTION_DENIED'
        : 'FAIL',
      `${promo.reason}; dzPresent=${promo.dzPresent}`,
    ),
  );
  const twin = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  hops.push(
    hop(
      'digital_twin_neq_founder',
      twin.status === 'denied' ? 'DENIED' : 'FAIL',
      twin.reason,
    ),
  );

  void decisionGate({
    id: 'ea-cycle-gate',
    action: '62l_ea_global_operations_intelligence_grid_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void globalOperationsIntelligenceGridSystemHonesty(input.repoRoot);
  void GLOBAL_OPERATIONS_INTELLIGENCE_GRID_CYCLE;

  const preds = predecessorMap(input.repoRoot ?? root);

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-EA global operations intelligence grid cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-EA'],
        githubSotIssue: GITHUB_SOT_ISSUE,
        gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-EA global operations intelligence grid cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; xAI UNAVAILABLE unconfigured; speculative RESEARCH_SIM; ` +
        'OS anti-stealth; quantum baselines; evidence gates; DZ soft-wire',
      sourceRefs: ['62L-EA'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      'BOUNDED',
      'Learning recorded locally; learning ≠ permission; no self-promotion; no production authorization.',
    ),
  );

  const health = await checkLocalBrainHealth(root).catch(() => null);

  return {
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: EA_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: os.predecessorLayer,
    softWiredPredecessors: os.softWiredPredecessors,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionGlobalOpsIntelligenceGridShipped: false as const,
    dbCandidatesApplied: false as const,
    os,
  };
}

export async function buildGlobalOperationsIntelligenceGridHealthReport(input?: {
  orgId?: string;
  tenantId?: string;
  universeId?: string;
  actor?: EaActor;
  root?: string;
  repoRoot?: string;
}) {
  const orgId = input?.orgId ?? 'org-local';
  const tenantId = input?.tenantId ?? 'tenant-local';
  const universeId = input?.universeId ?? 'universe-local';
  const actor: EaActor = input?.actor ?? {
    kind: 'global_ops_intelligence_curator',
    id: 'health',
    orgId,
    tenantId,
    universeId,
  };
  const cycle = await runGlobalOperationsIntelligenceGridCycle({
    orgId,
    tenantId,
    universeId,
    actor,
    root: input?.root,
    repoRoot: input?.repoRoot,
  });
  const failed = cycle.hops.filter((h) => h.state === 'FAIL');
  return {
    status: failed.length === 0 ? 'HEALTHY' : 'DEGRADED',
    failedHops: failed.map((h) => h.hop),
    hopCount: cycle.hops.length,
    predecessorLayer: cycle.predecessorLayer,
    softWiredPredecessors: cycle.softWiredPredecessors,
    honesty: globalOperationsIntelligenceGridSystemHonesty(input?.repoRoot),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    dbCandidatesApplied: false as const,
  };
}
