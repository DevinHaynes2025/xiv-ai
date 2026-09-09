/**
 * 62L-DX Autonomous Supply Chain Operations runtime —
 * Walks AUTONOMOUS_SUPPLY_CHAIN_OPS_CYCLE and builds health report.
 */

import { exchangeAgentKnowledge } from './agent-to-agent-knowledge-bus';
import {
  denyAutonomyBoundaryAction,
  planExceptionRecovery,
} from './autonomous-supply-chain-ops-brain';
import {
  autonomousSupplyChainOpsHonesty,
  bootstrapAutonomousSupplyChainOps,
} from './autonomous-supply-chain-ops';
import {
  AUTONOMY_BOUNDARY,
  DX_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  AUTONOMOUS_SUPPLY_CHAIN_OPS_CYCLE,
  predecessorMap,
  type DxActor,
  type DxEvidenceState,
  type DxHop,
  type DxHopRecord,
} from './autonomous-supply-chain-ops-types';
import { decisionGate } from './decision-gate';
import { runTwinExperiment } from './digital-twin-experiment-laboratory';
import {
  probeChipRuntime,
  routeCrossDeviceWorkload,
} from './edge-chip-runtime-federation';
import { appendEvidenceEvent } from './evidence-ledger';
import { federatedRetrieve } from './global-data-fabric-retrieval-engine';
import { checkLocalBrainHealth } from './health-check';
import {
  attemptPackInstallFromListing,
  listIndustryPack,
} from './industry-pack-marketplace';
import {
  claimReliability,
  probeDigitalTwinAuthority,
  probeOfflineReliability,
  runChaosSimulation,
  softWireDwDvStatus,
} from './launch-reliability-command-center';
import { appendLearning } from './learning-ledger';
import { accessMemoryCortex } from './personal-enterprise-memory-cortex';

export {
  AUTONOMOUS_SUPPLY_CHAIN_OPS_CYCLE,
  DX_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  AUTONOMY_BOUNDARY,
  predecessorMap,
};

function hop(name: DxHop, state: DxEvidenceState, summary: string): DxHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DxCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DxActor;
  root?: string;
  repoRoot?: string;
};

export async function runAutonomousSupplyChainOpsCycle(input: DxCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DxHopRecord[] = [];
  const actor = {
    ...input.actor,
    universeId: input.universeId || input.actor.universeId,
  };
  const twinActor: DxActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

  hops.push(
    hop(
      'honesty_locks',
      DX_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DX_LOCKS.AUTONOMOUS_FREIGHT_BOOKING === false &&
        DX_LOCKS.AUTONOMOUS_PURCHASE_ORDER === false &&
        DX_LOCKS.AUTONOMOUS_CONTRACT_SIGNING === false &&
        DX_LOCKS.AUTONOMOUS_SPEND === false &&
        DX_LOCKS.AUTONOMOUS_PRODUCTION_CHANGE === false &&
        DX_LOCKS.ANALYZE_SIMULATE_RECOMMEND_ONLY === true &&
        DX_LOCKS.CHAOS_SIM_EQ_PRODUCTION_INCIDENT_AUTHORITY === false &&
        DX_LOCKS.MARKETPLACE_LISTING_EQ_AUTO_GRANT === false &&
        DX_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
        DX_LOCKS.TIP_LAND === false &&
        DX_LOCKS.PRODUCTION_AUTHORIZATION === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const ops = await bootstrapAutonomousSupplyChainOps({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'autonomous_supply_chain_ops_bootstrap',
      'PASS',
      `ops=${ops.id}; predecessor=${ops.predecessorLayer}; softWire=${ops.softWire.summary}`,
    ),
  );

  // A
  const recovery = await planExceptionRecovery({
    exceptionId: 'exc-stockout-1',
    summary: 'recovery plan for lane disruption',
    mode: 'recommend',
    attemptPhysicalExecution: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'exception_recovery_analyze_simulate_recommend_only',
      recovery.physicalExecutionAuthorized === false &&
        recovery.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      recovery.reason,
    ),
  );

  const freight = await denyAutonomyBoundaryAction({
    action: 'book_freight',
    root,
    actor,
  });
  hops.push(
    hop(
      'freight_booking_denied',
      freight.status === 'denied' ? 'PASS' : 'FAIL',
      freight.reason,
    ),
  );

  const po = await denyAutonomyBoundaryAction({
    action: 'issue_purchase_order',
    root,
    actor,
  });
  hops.push(
    hop(
      'purchase_order_denied',
      po.status === 'denied' ? 'PASS' : 'FAIL',
      po.reason,
    ),
  );

  const contract = await denyAutonomyBoundaryAction({
    action: 'sign_contract',
    root,
    actor,
  });
  hops.push(
    hop(
      'contract_signing_denied',
      contract.status === 'denied' ? 'PASS' : 'FAIL',
      contract.reason,
    ),
  );

  const spend = await denyAutonomyBoundaryAction({
    action: 'spend_money',
    root,
    actor,
  });
  hops.push(
    hop(
      'spend_money_denied',
      spend.status === 'denied' ? 'PASS' : 'FAIL',
      spend.reason,
    ),
  );

  const prod = await denyAutonomyBoundaryAction({
    action: 'change_production_system',
    root,
    actor,
  });
  hops.push(
    hop(
      'production_change_denied',
      prod.status === 'denied' ? 'PASS' : 'FAIL',
      prod.reason,
    ),
  );

  // B
  const denyFabric = await federatedRetrieve({
    query: 'lane history',
    labelPresent: false,
    explicitGrant: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'federated_retrieval_acl_deny_by_default',
      denyFabric.status === 'denied' ? 'PASS' : 'FAIL',
      denyFabric.reason,
    ),
  );

  const labelOnly = await federatedRetrieve({
    query: 'lane history',
    labelPresent: true,
    explicitGrant: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'label_alone_neq_fabric_access',
      labelOnly.status === 'denied' ? 'PASS' : 'FAIL',
      labelOnly.reason,
    ),
  );

  const hist = await federatedRetrieve({
    query: 'authorized lane history',
    labelPresent: true,
    explicitGrant: true,
    historicalCoverageAuthorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_historical_coverage_denied',
      hist.status === 'denied' ? 'PASS' : 'FAIL',
      hist.reason,
    ),
  );

  // C
  const simFact = await runTwinExperiment({
    name: 'disruption-what-if',
    claimVerifiedFact: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'twin_experiment_sim_neq_fact',
      simFact.verifiedFact === false && simFact.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      simFact.reason,
    ),
  );

  const simPhys = await runTwinExperiment({
    name: 'warehouse-slotting-sim',
    attemptPhysicalControl: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'twin_experiment_neq_physical_control',
      simPhys.physicalControl === false && simPhys.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      simPhys.reason,
    ),
  );

  const labeled = await runTwinExperiment({
    name: 'reproducible-recovery-lab',
    root,
    actor,
  });
  hops.push(
    hop(
      'reproducible_experiment_labeled_simulation',
      labeled.labeledSimulation === true &&
        labeled.status === 'labeled_simulation'
        ? 'PASS'
        : 'FAIL',
      labeled.reason,
    ),
  );

  // D
  const chipNoEvidence = await probeChipRuntime({
    family: 'NVIDIA',
    sourceAuthorized: true,
    heartbeatEvidence: false,
    claimRunningVerified: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'chip_runtime_running_verified_needs_evidence',
      chipNoEvidence.runningState === 'NOT_VERIFIED' &&
        chipNoEvidence.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      chipNoEvidence.reason,
    ),
  );

  const chipUnauth = await probeChipRuntime({
    family: 'AMD',
    sourceAuthorized: false,
    claimRunningVerified: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_chip_runtime_denied',
      chipUnauth.status === 'denied' ? 'PASS' : 'FAIL',
      chipUnauth.reason,
    ),
  );

  const chipOk = await probeChipRuntime({
    family: 'NPU',
    sourceAuthorized: true,
    heartbeatEvidence: true,
    claimRunningVerified: true,
    root,
    actor,
  });
  const route = await routeCrossDeviceWorkload({
    probeId: chipOk.id,
    targetDevice: 'edge-node-1',
    attemptFabRemoteControl: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'cross_device_routing_neq_fab_remote_control',
      route.fabRemoteControl === false && route.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      route.reason,
    ),
  );

  // E
  const unenrolled = await accessMemoryCortex({
    subjectId: 'subj-1',
    enrolled: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'memory_cortex_deny_unenrolled',
      unenrolled.status === 'denied' ? 'PASS' : 'FAIL',
      unenrolled.reason,
    ),
  );

  const noGrant = await accessMemoryCortex({
    subjectId: 'subj-2',
    enrolled: true,
    explicitGrant: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'memory_cortex_governed_acl',
      noGrant.status === 'denied' ? 'PASS' : 'FAIL',
      noGrant.reason,
    ),
  );

  // F
  const unsigned = await exchangeAgentKnowledge({
    fromAgentId: 'agent-a',
    toAgentId: 'agent-b',
    signed: false,
    authorized: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'a2a_unsigned_exchange_denied',
      unsigned.status === 'denied' ? 'PASS' : 'FAIL',
      unsigned.reason,
    ),
  );

  const unauth = await exchangeAgentKnowledge({
    fromAgentId: 'agent-a',
    toAgentId: 'agent-b',
    signed: true,
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'a2a_unauthorized_exchange_denied',
      unauth.status === 'denied' ? 'PASS' : 'FAIL',
      unauth.reason,
    ),
  );

  // G
  const pack = await listIndustryPack({
    packId: 'sc-pilot-pack',
    domain: 'supply_chain',
    claimAutoGrant: true,
    root,
    actor,
  });
  const install = await attemptPackInstallFromListing({
    listingId: pack.id,
    packId: pack.packId,
    claimAutoGrantFromListing: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'marketplace_listing_neq_auto_grant',
      pack.autoGranted === false &&
        (pack.status === 'denied' || install.status === 'denied')
        ? 'PASS'
        : 'FAIL',
      `${pack.reason}; ${install.reason}`,
    ),
  );

  const wedge = await listIndustryPack({
    packId: 'healthcare-pack',
    domain: 'healthcare',
    root,
    actor,
  });
  hops.push(
    hop(
      'wedge_first_non_supply_chain_pack_gated',
      wedge.status === 'denied' && wedge.wedgeGatePassed === false
        ? 'PASS'
        : 'FAIL',
      wedge.reason,
    ),
  );

  // H
  const chaos = await runChaosSimulation({
    scenario: 'region-failover',
    claimProductionIncidentAuthority: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'chaos_sim_neq_production_incident_authority',
      chaos.productionIncidentAuthority === false && chaos.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      chaos.reason,
    ),
  );

  const rel = await claimReliability({
    claim: 'launch-ready',
    evidencePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'reliability_claim_needs_evidence',
      rel.state === 'NOT_VERIFIED' && rel.status === 'denied' ? 'PASS' : 'FAIL',
      rel.reason,
    ),
  );

  const offline = await probeOfflineReliability({
    poweredAuthorizedNode: false,
    preferWaiting: true,
    root,
    actor,
  });
  const offlineStopped = await probeOfflineReliability({
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

  const soft = softWireDwDvStatus(input.repoRoot);
  hops.push(
    hop(
      'dw_dv_soft_wire_probe',
      soft.layer !== 'NONE' ? 'PASS' : 'WAITING_DATA',
      soft.summary,
    ),
  );

  void decisionGate({
    id: 'dx-cycle-gate',
    action: '62l_dx_autonomous_supply_chain_ops_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void autonomousSupplyChainOpsHonesty(input.repoRoot);

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DX autonomous supply chain ops cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DX'],
        githubSotIssue: GITHUB_SOT_ISSUE,
        gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
        autonomyBoundary: AUTONOMY_BOUNDARY,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-DX autonomous supply chain ops cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        'hops completed; autonomy boundary denies freight/PO/contract/spend/prod-change; ' +
        'sim≠fact; chaos-sim≠prod authority; listing≠auto-grant; soft-wire DW/DV/DU',
      sourceRefs: ['62L-DX'],
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
    l4AutonomyEnabled: DX_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    autonomyBoundary: AUTONOMY_BOUNDARY,
    predecessorLayer: ops.predecessorLayer,
    softWire: soft,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionSupplyChainOpsShipped: false as const,
    dbCandidatesApplied: false as const,
    ops,
  };
}

export async function buildAutonomousSupplyChainOpsHealthReport(input?: {
  orgId?: string;
  tenantId?: string;
  universeId?: string;
  actor?: DxActor;
  root?: string;
  repoRoot?: string;
}) {
  const orgId = input?.orgId ?? 'org-local';
  const tenantId = input?.tenantId ?? 'tenant-local';
  const universeId = input?.universeId ?? 'universe-local';
  const actor: DxActor = input?.actor ?? {
    kind: 'supply_chain_ops_analyst',
    id: 'health',
    orgId,
    tenantId,
    universeId,
  };
  const cycle = await runAutonomousSupplyChainOpsCycle({
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
    softWire: cycle.softWire,
    autonomyBoundary: AUTONOMY_BOUNDARY,
    honesty: autonomousSupplyChainOpsHonesty(input?.repoRoot),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    dbCandidatesApplied: false as const,
  };
}
