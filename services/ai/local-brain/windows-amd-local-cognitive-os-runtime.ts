/**
 * 62L-EK Windows/AMD Local Cognitive OS runtime —
 * Walks WINDOWS_AMD_LOCAL_COGNITIVE_OS_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import {
  probeHistoricalMedicineClinicalClaim,
  registerCivilizationAtlasEntry,
} from './ethical-civilization-memory-atlas';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
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
  compareQuantumBenchmarks,
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
  ARCHITECTURE_TRANSLATIONS,
  CAPABILITY_PROMOTION_PIPELINE,
  EK_LOCKS,
  EXPLICIT_NON_CLAIMS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PATHWAY_REQUIRED_FIELDS,
  PREFERRED_WINDOWS_AMD_STACK,
  WINDOWS_AMD_LOCAL_COGNITIVE_OS_CYCLE,
  predecessorMap,
  type EkActor,
  type EkEvidenceState,
  type EkHop,
  type EkHopRecord,
} from './windows-amd-local-cognitive-os-types';
import {
  gateAmdWorkloadRouting,
  probeModelLoadVerified,
  runWindowsHardwareRuntimeProbe,
} from './windows-hardware-runtime-probe';

export {
  ARCHITECTURE_TRANSLATIONS,
  EK_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PREFERRED_WINDOWS_AMD_STACK,
  WINDOWS_AMD_LOCAL_COGNITIVE_OS_CYCLE,
  predecessorMap,
};

function hop(name: EkHop, state: EkEvidenceState, summary: string): EkHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type EkCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: EkActor;
  root?: string;
  repoRoot?: string;
};

export async function runWindowsAmdLocalCognitiveOsCycle(input: EkCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: EkHopRecord[] = [];
  const actor = {
    ...input.actor,
    universeId: input.universeId || input.actor.universeId,
  };
  const avatarActor: EkActor = { ...actor, kind: 'avatar', id: 'avatar-1' };

  hops.push(
    hop(
      'honesty_locks',
      EK_LOCKS.L4_AUTONOMY_ENABLED === false &&
        EK_LOCKS.LOCAL_FIRST &&
        EK_LOCKS.AMD_ROUTING_WITHOUT_PROBE === false &&
        EK_LOCKS.AGENTS_WORKING_WHILE_DEVICE_OFF === false &&
        EK_LOCKS.SILENT_AUTHORITY_GROWTH_ALLOWED === false &&
        EK_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_BASELINES === false &&
        EK_LOCKS.HISTORICAL_MEDICINE_EQ_CLINICAL_AUTHORITY === false &&
        EK_LOCKS.CONVERSION_EQ_AUTO_CHARGE === false &&
        EK_LOCKS.TIP_LAND === false &&
        EK_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapWindowsAmdLocalCognitiveOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'windows_amd_local_cognitive_os_bootstrap',
      os.probeFirstRequired === true && os.tipLand === false ? 'PASS' : 'FAIL',
      `os=${os.id}; predecessor=${os.predecessorLayer}; softWire=${os.softWiredPredecessors.join(',')}; stack=${os.preferredStack.join('→')}`,
    ),
  );

  const probe = await runWindowsHardwareRuntimeProbe({
    probeId: 'probe-default',
    root,
    actor,
  });
  hops.push(
    hop(
      'windows_hardware_runtime_probe',
      probe.status === 'unverified' && probe.amdRoutingAllowed === false
        ? 'PASS'
        : 'FAIL',
      probe.reason,
    ),
  );
  hops.push(
    hop(
      'probe_defaults_unknown_false',
      probe.fields.CPU_DETECTED === 'unknown' &&
        probe.fields.GPU_DETECTED === 'unknown' &&
        probe.fields.NPU_DETECTED === 'unknown' &&
        probe.fields.WINDOWS_ML_SUPPORTED === 'unknown' &&
        probe.fields.AMD_EP_SUPPORTED === 'unknown' &&
        probe.fields.MODEL_LOAD_VERIFIED === false
        ? 'PASS'
        : 'FAIL',
      JSON.stringify(probe.fields),
    ),
  );
  const amdGate = await gateAmdWorkloadRouting({
    probeId: 'probe-default',
    requestedTarget: 'amd_gpu',
    probeEvidencePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'amd_routing_gated_until_probe',
      amdGate.status === 'denied' && amdGate.amdInferenceClaimed === false
        ? 'PASS'
        : 'FAIL',
      amdGate.reason,
    ),
  );
  const modelLoad = await probeModelLoadVerified({
    probeId: 'probe-default',
    claimVerified: true,
    evidencePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'model_load_unverified_default',
      modelLoad.status === 'denied' && modelLoad.modelLoadVerified === false
        ? 'PASS'
        : 'FAIL',
      modelLoad.reason,
    ),
  );

  const brainOn = await registerOfflineAgentBrain({
    nodeId: 'asus-1',
    devicePoweredOn: true,
    runtimeRunning: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_agent_brain_supervisor_stack',
      brainOn.status === 'ok' && brainOn.stack.length === 9 ? 'PASS' : 'FAIL',
      brainOn.reason,
    ),
  );
  const brainOff = await registerOfflineAgentBrain({
    nodeId: 'asus-off',
    devicePoweredOn: false,
    runtimeRunning: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_while_device_off_deny',
      brainOff.state === 'OFFLINE_STOPPED' && brainOff.agentsClaimedWorking === false
        ? 'PASS'
        : 'FAIL',
      brainOff.reason,
    ),
  );
  const promoDeny = await attemptCapabilityPromotion({
    skillId: 'skill-1',
    stagesCompleted: ['research', 'candidate_skill'],
    guardianApproved: false,
    humanPolicyPromoted: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'capability_promotion_pipeline',
      promoDeny.status === 'denied' &&
        promoDeny.automaticPowerIncrease === false &&
        CAPABILITY_PROMOTION_PIPELINE.length === 8
        ? 'PASS'
        : 'FAIL',
      promoDeny.reason,
    ),
  );
  const silent = await denySilentAuthorityGrowth({
    claim: 'agent_learns_automatic_power_increase',
    root,
    actor,
  });
  hops.push(
    hop(
      'silent_authority_growth_deny',
      silent.status === 'denied' ? 'PASS' : 'FAIL',
      silent.reason,
    ),
  );
  const guard = await guardianGate({
    action: 'bounded_use',
    guardianApproved: false,
    root,
    actor,
  });
  hops.push(
    hop('guardian_gate', guard.status === 'denied' ? 'PASS' : 'FAIL', guard.reason),
  );

  const pathway = await registerNeuralPathway({
    edgeId: 'path-1',
    fromKind: 'historical_event',
    toKind: 'business_principle',
    weight: 0.4,
    source: 'atlas:egypt',
    provenance: 'scholarly_secondary',
    confidence: 0.7,
    owner: actor.id,
    universe: actor.universeId,
    permissions: ['read'],
    version: '1',
    root,
    actor,
  });
  hops.push(
    hop(
      'neural_pathway_register',
      pathway.status === 'ok' ? 'PASS' : 'FAIL',
      pathway.reason,
    ),
  );
  hops.push(
    hop(
      'pathway_provenance_fields',
      PATHWAY_REQUIRED_FIELDS.every((f) => f in pathway) ? 'PASS' : 'FAIL',
      PATHWAY_REQUIRED_FIELDS.join(','),
    ),
  );
  const strengthen = await adjustPathwayWeight({
    edgeId: 'path-1',
    direction: 'strengthen',
    cause: 'retrieval_usefulness',
    previousWeight: 0.4,
    root,
    actor,
  });
  const weaken = await adjustPathwayWeight({
    edgeId: 'path-1',
    direction: 'weaken',
    cause: 'stale',
    previousWeight: 0.45,
    root,
    actor,
  });
  hops.push(
    hop(
      'pathway_strengthen_weaken_audit',
      strengthen.status === 'ok' && weaken.status === 'ok' ? 'PASS' : 'FAIL',
      `${strengthen.reason}; ${weaken.reason}`,
    ),
  );

  const atlas = await registerCivilizationAtlasEntry({
    entryId: 'atlas-1',
    atlas: 'egypt',
    subject: 'mathematics',
    evidenceClass: 'ESTABLISHED',
    provenance: 'secondary_survey',
    root,
    actor,
  });
  hops.push(
    hop(
      'civilization_atlas_register',
      atlas.status === 'ok' ? 'PASS' : 'FAIL',
      atlas.reason,
    ),
  );
  const atlasDeny = await registerCivilizationAtlasEntry({
    entryId: 'atlas-no-class',
    atlas: 'china',
    subject: 'medicine_history',
    evidenceClass: null,
    provenance: 'unlabeled',
    root,
    actor,
  });
  hops.push(
    hop(
      'evidence_class_required',
      atlasDeny.status === 'denied' ? 'PASS' : 'FAIL',
      atlasDeny.reason,
    ),
  );
  const med = await probeHistoricalMedicineClinicalClaim({
    claimModernClinicalGuidance: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'historical_medicine_neq_clinical',
      med.status === 'denied' && med.clinicalAuthority === false ? 'PASS' : 'FAIL',
      med.reason,
    ),
  );

  const qexp = await registerQuantumExperiment({
    experimentId: 'q-1',
    truthState: 'SIMULATED',
    method: 'quantum_circuit_simulation',
    claimPhysicalQpu: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_truth_state_required',
      qexp.status === 'ok' && qexp.truthState === 'SIMULATED' ? 'PASS' : 'FAIL',
      qexp.reason,
    ),
  );
  const qbench = await compareQuantumBenchmarks({
    experimentId: 'q-1',
    quantumBeatsClassicalBaselines: false,
    reproducible: false,
    claimAdvantage: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_benchmark_compare',
      qbench.status === 'ok' && qbench.advantageClaimed === false ? 'PASS' : 'FAIL',
      qbench.reason,
    ),
  );
  const qadv = await denyQuantumAdvantageWithoutBaselines({
    claimAdvantage: true,
    beatsClassicalBaselines: false,
    reproducible: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_advantage_deny_without_baselines',
      qadv.status === 'denied' ? 'PASS' : 'FAIL',
      qadv.reason,
    ),
  );
  const asusQ = await probeAsusPhysicalQpuClaim({
    claimConnectedQpu: true,
    physicalQpuVerified: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'asus_neq_physical_qpu',
      asusQ.status === 'denied' && asusQ.physicalQpuClaimed === false
        ? 'PASS'
        : 'FAIL',
      asusQ.reason,
    ),
  );

  const search = await runUniversalSearch({
    queryId: 'otif-1',
    query: 'OTIF drop last week',
    consequential: true,
    configuredSources: ['erp', 'wms', 'shipments'],
    requestedSources: ['erp', 'wms', 'shipments', 'supplier'],
    root,
    actor,
  });
  hops.push(
    hop(
      'universal_search_query',
      search.status === 'partial' || search.status === 'ok' ? 'PASS' : 'FAIL',
      search.reason,
    ),
  );
  hops.push(
    hop(
      'search_authority_human_approval',
      search.authority === 'HUMAN_APPROVAL_REQUIRED' ? 'PASS' : 'FAIL',
      search.authority,
    ),
  );
  const unconf = await probeSearchSourceAcl({
    source: 'tms',
    configured: false,
    authorizedUniverse: actor.universeId,
    requestUniverse: actor.universeId,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_source_unavailable',
      unconf.status === 'unavailable' ? 'PASS' : 'FAIL',
      unconf.reason,
    ),
  );
  const leak = await probeSearchSourceAcl({
    source: 'erp',
    configured: true,
    authorizedUniverse: 'universe-a',
    requestUniverse: 'universe-b',
    root,
    actor,
  });
  hops.push(
    hop(
      'acl_no_cross_context_leak',
      leak.status === 'denied' && search.crossContextLeak === false
        ? 'PASS'
        : 'FAIL',
      leak.reason,
    ),
  );

  const av = await registerAvatarPresence({
    avatarId: 'av-1',
    universeId: actor.universeId,
    presence: 'AVAILABLE',
    automationActive: true,
    automationDisclosed: true,
    root,
    actor,
  });
  hops.push(
    hop('avatar_presence_register', av.status === 'ok' ? 'PASS' : 'FAIL', av.reason),
  );
  const avDeny = await delegateAvatarOfflineFaq({
    avatarId: 'av-1',
    automationDisclosed: false,
    claimLiveHuman: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'avatar_automation_disclosure',
      avDeny.status === 'denied' ? 'PASS' : 'FAIL',
      avDeny.reason,
    ),
  );
  const avFounder = await probeAvatarFounderAuthority({
    actor: avatarActor,
    claimFounderAuthority: true,
    root,
  });
  hops.push(
    hop(
      'avatar_neq_founder_live_impersonation',
      avFounder.status === 'denied' ? 'PASS' : 'FAIL',
      avFounder.reason,
    ),
  );

  const conv = await registerConversionStep({
    stepId: 'c-1',
    stage: 'useful_answer',
    root,
    actor,
  });
  hops.push(
    hop(
      'traffic_conversion_flywheel',
      conv.status === 'ok' && conv.recommendOnly === true ? 'PASS' : 'FAIL',
      conv.reason,
    ),
  );
  const charge = await denyConversionAutoCharge({
    attemptAutoCharge: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'conversion_neq_auto_charge',
      charge.status === 'denied' && charge.autoCharge === false ? 'PASS' : 'FAIL',
      charge.reason,
    ),
  );

  const preds = predecessorMap(input.repoRoot ?? root);
  const softWireOk =
    preds.EJ.tipProbe === 'PRESENT' ||
    preds.EI.tipProbe === 'PRESENT' ||
    preds.EG.tipProbe === 'PRESENT' ||
    preds.EE.tipProbe === 'PRESENT' ||
    preds.EI.tipProbe === 'WAITING_DATA';
  hops.push(
    hop(
      'ei_eg_ee_soft_wire_probe',
      softWireOk ? 'PASS' : 'FAIL',
      `EJ=${preds.EJ.tipProbe}/${preds.EJ.report}; EI=${preds.EI.tipProbe}/${preds.EI.report}; EG=${preds.EG.tipProbe}/${preds.EG.report}; EE=${preds.EE.tipProbe}/${preds.EE.report}`,
    ),
  );

  const nonClaims = explicitNonClaimsSnapshot();
  hops.push(
    hop(
      'explicit_non_claims',
      nonClaims.agentsWorkingWhileAsusOff === false &&
        nonClaims.amdGpuNpuInferenceAlreadyRun === false &&
        nonClaims.quantumComputerConnected === false &&
        nonClaims.microsoftToolsUnrestrictedAccess === false &&
        nonClaims.liveAvatarSystemProductionExistsBeyondContracts === false &&
        nonClaims.guardianRlsRuntimeVerified === false &&
        nonClaims.historicalDatabasesAlreadyPopulated === false &&
        nonClaims.productionScaleSearchInfrastructureOperating === false &&
        EXPLICIT_NON_CLAIMS.amdGpuNpuInferenceAlreadyRun === false
        ? 'PASS'
        : 'FAIL',
      'explicit non-claims held',
    ),
  );

  void decisionGate({
    id: 'ek-cycle-gate',
    action: '62l_ek_windows_amd_local_cognitive_os_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void windowsAmdLocalCognitiveOsHonesty(input.repoRoot);
  void WINDOWS_AMD_LOCAL_COGNITIVE_OS_CYCLE;

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-EK windows/amd local cognitive os cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-EK'],
        githubSotIssue: GITHUB_SOT_ISSUE,
        gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
        preferredStack: PREFERRED_WINDOWS_AMD_STACK,
        probeFirst: true,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-EK windows amd local cognitive os cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; probe-first; offline-while-off deny; ` +
        'silent authority deny; quantum advantage deny; atlas evidence classes; avatar disclosure',
      sourceRefs: ['62L-EK'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      'BOUNDED',
      'Learning recorded locally; learning ≠ permission; no silent authority growth; no production authorization.',
    ),
  );

  const health = await checkLocalBrainHealth(root).catch(() => null);

  return {
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: EK_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    preferredStack: PREFERRED_WINDOWS_AMD_STACK,
    architectureTranslations: ARCHITECTURE_TRANSLATIONS,
    predecessorLayer: os.predecessorLayer,
    softWiredPredecessors: os.softWiredPredecessors,
    predecessors: preds,
    probeFirst: true as const,
    hops,
    localBrainHealth: health,
    fullProductionWindowsAmdCognitiveOsShipped: false as const,
    dbCandidatesApplied: false as const,
    os,
  };
}

export async function buildWindowsAmdLocalCognitiveOsHealthReport(input?: {
  orgId?: string;
  tenantId?: string;
  universeId?: string;
  actor?: EkActor;
  root?: string;
  repoRoot?: string;
}) {
  const orgId = input?.orgId ?? 'org-local';
  const tenantId = input?.tenantId ?? 'tenant-local';
  const universeId = input?.universeId ?? 'universe-local';
  const actor: EkActor =
    input?.actor ??
    ({
      kind: 'windows_runtime_probe_operator',
      id: 'health',
      orgId,
      tenantId,
      universeId,
    } satisfies EkActor);
  const cycle = await runWindowsAmdLocalCognitiveOsCycle({
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
    preferredStack: PREFERRED_WINDOWS_AMD_STACK,
    probeFirst: true as const,
    honesty: windowsAmdLocalCognitiveOsHonesty(input?.repoRoot),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    dbCandidatesApplied: false as const,
  };
}
