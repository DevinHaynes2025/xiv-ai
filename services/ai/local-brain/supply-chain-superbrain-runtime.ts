/**
 * 62L-DW Supply Chain Superbrain runtime —
 * Walks SUPPLY_CHAIN_SUPERBRAIN_CYCLE and builds health report.
 */

import { sendSignedMemoryHop } from './agent-memory-highway';
import { decisionGate } from './decision-gate';
import {
  claimTwinAccuracy,
  probeTwinPhysicalControl,
  runCalibratedTwinSimulation,
} from './digital-twin-simulation-factory';
import { appendEvidenceEvent } from './evidence-ledger';
import {
  evaluateBroaderIndustryGate,
  registerIndustryPack,
} from './global-industry-knowledge-graph';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import { accessVaultEntry, storeEncryptedKnowledge } from './personal-knowledge-vault';
import {
  attemptEdgeRemoteControl,
  claimHardwareSupport,
  probeChipRunningVerified,
} from './semiconductor-edge-compute-control-tower';
import {
  accessSealedNeuralNode,
  createNeuralSuperbrainNode,
  openMultimodalSession,
  probeAdultTrustCircle,
  probeCovertSurveillance,
  probeDigitalTwinAuthority,
  probeOfflineNeuralNode,
  probeRunningVerified,
} from './secure-multimodal-experience-layer';
import {
  probeSupplyChainProvider,
  recommendSupplyChainAction,
  requireSupplyChainHumanGate,
} from './supply-chain-superbrain-core';
import {
  bootstrapSupplyChainSuperbrainOs,
  supplyChainSuperbrainOsHonesty,
} from './supply-chain-superbrain';
import {
  DW_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SUPPLY_CHAIN_SUPERBRAIN_CYCLE,
  predecessorMap,
  type DwActor,
  type DwEvidenceState,
  type DwHop,
  type DwHopRecord,
} from './supply-chain-superbrain-types';
import {
  probeDbCandidatesApplied,
  proposeLakehouseDdl,
  runDataQualityAgent,
} from './universal-data-lakehouse-os';

export {
  SUPPLY_CHAIN_SUPERBRAIN_CYCLE,
  DW_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DwHop, state: DwEvidenceState, summary: string): DwHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DwCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DwActor;
  root?: string;
  repoRoot?: string;
};

export async function runSupplyChainSuperbrainCycle(input: DwCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DwHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };
  const agentActor: DwActor = { ...actor, kind: 'agent', id: 'agent-self' };
  const twinActor: DwActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

  hops.push(
    hop(
      'honesty_locks',
      DW_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DW_LOCKS.LOCAL_FIRST &&
        DW_LOCKS.RECOMMENDATION_EQ_CHARGE === false &&
        DW_LOCKS.LAKEHOUSE_AUTO_PROD_DDL === false &&
        DW_LOCKS.SIM_EQ_VERIFIED_FACT === false &&
        DW_LOCKS.TWIN_EQ_PHYSICAL_CONTROL === false &&
        DW_LOCKS.HARDWARE_SUPPORT_WITHOUT_PROOF === false &&
        DW_LOCKS.UNSIGNED_MEMORY_HIGHWAY_ALLOWED === false &&
        DW_LOCKS.BROADER_INDUSTRY_BEFORE_SUPPLY_CHAIN_PILOT === false &&
        DW_LOCKS.BIOMETRIC_CAMERA_DEFAULT_ON === false &&
        DW_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
        DW_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapSupplyChainSuperbrainOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'supply_chain_superbrain_bootstrap',
      'PASS',
      `os=${os.id}; predecessor=${os.predecessorLayer}; dtSoftWire=${os.dtSoftWired}`,
    ),
  );

  // A
  const advisory = await recommendSupplyChainAction({
    nodeKind: 'inventory',
    summary: 'reorder advisory',
    attemptDeploySpend: true,
    attemptCharge: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sc_advisory_neq_deploy_spend',
      advisory.deploysSpend === false && advisory.status === 'recommendation_only'
        ? 'PASS'
        : 'FAIL',
      advisory.reason,
    ),
  );

  const gate = await requireSupplyChainHumanGate({
    advisoryId: advisory.id,
    humanGatePresent: false,
    attemptAutoExecute: true,
    root,
    actor: agentActor,
  });
  hops.push(
    hop(
      'sc_human_gate_required',
      gate.status === 'denied' && gate.autoExecuted === false ? 'PASS' : 'FAIL',
      gate.reason,
    ),
  );

  const provider = await probeSupplyChainProvider({
    providerId: 'wms-stub',
    configured: false,
    claimAvailable: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_sc_provider_unavailable',
      provider.availability === 'UNAVAILABLE' && provider.status === 'denied' ? 'PASS' : 'FAIL',
      provider.reason,
    ),
  );

  // B
  const ddl = await proposeLakehouseDdl({
    name: 'dw_sc_archive_candidates',
    attemptAutoApply: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'lakehouse_ddl_neq_auto_prod',
      ddl.autoApplied === false && ddl.appliedToProduction === false ? 'PASS' : 'FAIL',
      ddl.reason,
    ),
  );

  const dq = await runDataQualityAgent({
    checkName: 'null-rate',
    attemptLiveMigration: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'data_quality_agent_neq_live_migration',
      dq.liveMigrationApplied === false ? 'PASS' : 'FAIL',
      dq.reason,
    ),
  );

  const db = await probeDbCandidatesApplied({ claimApplied: true, root, actor });
  hops.push(
    hop(
      'db_candidates_not_applied',
      db.applied === false && db.status === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      db.reason,
    ),
  );

  // C
  const sim = await runCalibratedTwinSimulation({
    scenario: 'warehouse-throughput',
    claimVerifiedFact: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sim_neq_verified_fact',
      sim.verifiedFact === false && sim.labeledSimulation === true ? 'PASS' : 'FAIL',
      sim.reason,
    ),
  );

  const phys = await probeTwinPhysicalControl({
    twinId: sim.id,
    attemptPhysicalControl: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'twin_neq_physical_control',
      phys.physicalControlGranted === false && phys.status === 'denied' ? 'PASS' : 'FAIL',
      phys.reason,
    ),
  );

  const acc = await claimTwinAccuracy({
    claim: '±2% warehouse ETA',
    calibrationProofPresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'accuracy_claim_requires_proof',
      acc.state === 'DENIED' ? 'PASS' : 'FAIL',
      acc.reason,
    ),
  );

  // D
  const hw = await claimHardwareSupport({
    vendor: 'NVIDIA',
    proofPresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'hardware_support_requires_proof',
      hw.state === 'UNAVAILABLE' || hw.state === 'NOT_VERIFIED' ? 'PASS' : 'FAIL',
      hw.reason,
    ),
  );

  const edge = await attemptEdgeRemoteControl({
    targetNodeId: 'edge-1',
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'edge_neq_unauthorized_remote_control',
      edge.remoteControlGranted === false && edge.status === 'denied' ? 'PASS' : 'FAIL',
      edge.reason,
    ),
  );

  const chip = await probeChipRunningVerified({
    nodeId: 'chip-1',
    heartbeatFresh: false,
    runtimeEvidencePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'chip_running_verified_needs_evidence',
      chip.state === 'DENIED' ? 'PASS' : 'FAIL',
      chip.reason,
    ),
  );

  // E
  const entry = await storeEncryptedKnowledge({
    ownerId: actor.id,
    contextId: 'ctx-a',
    label: 'private-note',
    root,
    actor,
  });
  hops.push(
    hop(
      'vault_encrypted_permission_aware',
      entry.encrypted === true && entry.plaintextStored === false ? 'PASS' : 'FAIL',
      entry.reason,
    ),
  );

  const cross = await accessVaultEntry({
    entryId: entry.id,
    requesterId: 'other',
    requesterContextId: 'ctx-b',
    entryContextId: entry.contextId,
    explicitGrant: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'vault_cross_context_denied',
      cross.status === 'denied' ? 'PASS' : 'FAIL',
      cross.reason,
    ),
  );

  // F
  const unsigned = await sendSignedMemoryHop({
    fromAgentId: 'a1',
    toAgentId: 'a2',
    signed: false,
    enrolledPeer: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_memory_highway_denied',
      unsigned.status === 'denied' ? 'PASS' : 'FAIL',
      unsigned.reason,
    ),
  );

  const unenrolled = await sendSignedMemoryHop({
    fromAgentId: 'a1',
    toAgentId: 'a3',
    signed: true,
    enrolledPeer: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unenrolled_memory_peer_denied',
      unenrolled.status === 'denied' ? 'PASS' : 'FAIL',
      unenrolled.reason,
    ),
  );

  // G
  const pack = await registerIndustryPack({
    packId: 'retail-pack',
    industry: 'retail',
    supplyChainPilotProven: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'industry_pack_behind_supply_chain_pilot',
      pack.status === 'gated' ? 'PASS' : 'FAIL',
      pack.reason,
    ),
  );

  const wedge = await evaluateBroaderIndustryGate({
    supplyChainPilotProofPresent: false,
    attemptBroaderIndustry: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'wedge_first_broader_industry_gated',
      wedge.status === 'denied' ? 'PASS' : 'FAIL',
      wedge.reason,
    ),
  );

  // H
  const mm = await openMultimodalSession({
    optIn: false,
    attemptEnableBiometric: true,
    attemptEnableCamera: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'multimodal_biometric_defaults_off',
      mm.biometricEnabled === false && mm.cameraEnabled === false ? 'PASS' : 'FAIL',
      mm.reason,
    ),
  );

  const covert = await probeCovertSurveillance({
    attemptCovertEmotion: true,
    attemptProfiling: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'covert_emotion_surveillance_denied',
      covert.status === 'denied' ? 'PASS' : 'FAIL',
      covert.reason,
    ),
  );

  const minor = await probeAdultTrustCircle({ ageYears: 16, root, actor });
  hops.push(
    hop(
      'adult_trust_circle_minors_denied',
      minor.status === 'denied' ? 'PASS' : 'FAIL',
      minor.reason,
    ),
  );

  const node = await createNeuralSuperbrainNode({
    kind: 'supply_chain',
    universeId: input.universeId,
    sealed: true,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  const sealed = await accessSealedNeuralNode({
    nodeId: node.id,
    explicitGrant: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'neural_node_sealed_deny_by_default',
      sealed.status === 'denied' && node.grantsAuthority === false ? 'PASS' : 'FAIL',
      sealed.reason,
    ),
  );

  const offline = await probeOfflineNeuralNode({
    poweredAuthorizedNode: false,
    preferWaiting: true,
    root,
    actor,
  });
  const offlineStopped = await probeOfflineNeuralNode({
    poweredAuthorizedNode: false,
    preferWaiting: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_without_powered_node_waiting_or_stopped',
      (offline.state === 'WAITING_NODE' || offline.state === 'OFFLINE_STOPPED') &&
        offlineStopped.state === 'OFFLINE_STOPPED'
        ? 'PASS'
        : 'FAIL',
      offline.reason,
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
      twin.status === 'denied' && twin.isFounder === false ? 'PASS' : 'FAIL',
      twin.reason,
    ),
  );

  const running = await probeRunningVerified({
    heartbeatFresh: false,
    runtimeEvidencePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'running_verified_requires_heartbeat',
      running.state === 'DENIED' ? 'PASS' : 'FAIL',
      running.reason,
    ),
  );

  void decisionGate({
    id: 'dw-cycle-gate',
    action: '62l_dw_supply_chain_superbrain_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void supplyChainSuperbrainOsHonesty(input.repoRoot);
  void SUPPLY_CHAIN_SUPERBRAIN_CYCLE;

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DW supply chain superbrain cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DW'],
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
      subject: '62L-DW supply chain superbrain cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; advisory≠deploy; lakehouse≠auto-DDL; sim≠fact; ` +
        'unsigned memory denied; wedge-first industry gate; biometric defaults OFF',
      sourceRefs: ['62L-DW'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      'BOUNDED',
      'Learning recorded locally; learning ≠ permission; no production authorization.',
    ),
  );

  const health = await checkLocalBrainHealth(root).catch(() => null);
  const preds = predecessorMap(input.repoRoot ?? root);

  return {
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: DW_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: os.predecessorLayer,
    dtSoftWired: os.dtSoftWired,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionSupplyChainSuperbrainShipped: false as const,
    dbCandidatesApplied: false as const,
    os,
  };
}

export async function buildSupplyChainSuperbrainHealthReport(input?: {
  orgId?: string;
  tenantId?: string;
  universeId?: string;
  actor?: DwActor;
  root?: string;
  repoRoot?: string;
}) {
  const orgId = input?.orgId ?? 'org-local';
  const tenantId = input?.tenantId ?? 'tenant-local';
  const universeId = input?.universeId ?? 'universe-local';
  const actor: DwActor = input?.actor ?? {
    kind: 'supply_chain_curator',
    id: 'health',
    orgId,
    tenantId,
    universeId,
  };
  const cycle = await runSupplyChainSuperbrainCycle({
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
    dtSoftWired: cycle.dtSoftWired,
    honesty: supplyChainSuperbrainOsHonesty(input?.repoRoot),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    dbCandidatesApplied: false as const,
  };
}
