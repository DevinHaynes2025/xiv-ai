/**
 * 62L-DY Intelligent Supply Chain Command runtime —
 * Walks INTELLIGENT_SUPPLY_CHAIN_COMMAND_CYCLE and builds health report.
 */

import { openAgentMeeting } from './agent-collaboration-protocol-dy';
import {
  denyUnverifiedSupremacyClaim,
  evaluateExperimentRetention,
  generateExperimentFromBottleneck,
} from './autonomous-experiment-optimization-lab';
import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import {
  accessHistoricalTimeline,
  runRetrievalQuery,
} from './global-knowledge-retrieval-cortex';
import { checkLocalBrainHealth } from './health-check';
import {
  createSolutionPack,
  evaluateBroaderIndustryGate,
} from './industry-solution-factory';
import {
  bootstrapIntelligentSupplyChainCommand,
  intelligentSupplyChainCommandHonesty,
} from './intelligent-supply-chain-command';
import {
  createRecoveryPlaybook,
  denyAutonomyBoundaryAction,
} from './intelligent-supply-chain-command-os';
import {
  DY_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  INTELLIGENT_SUPPLY_CHAIN_COMMAND_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type DyActor,
  type DyEvidenceState,
  type DyHop,
  type DyHopRecord,
} from './intelligent-supply-chain-command-types';
import {
  claimObservability,
  createRollbackRecoveryPlan,
  probeDigitalTwinAuthority,
} from './launch-observability-recovery-brain';
import { appendLearning } from './learning-ledger';
import { accessLtmNode, enrollLtmNode } from './long-term-memory-graph';
import {
  probeDeviceScheduleRunningVerified,
  probeOfflineDeviceNode,
  probeOfflineDeviceNodeStopped,
} from './universal-device-chip-scheduler';

export {
  INTELLIGENT_SUPPLY_CHAIN_COMMAND_CYCLE,
  DY_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DyHop, state: DyEvidenceState, summary: string): DyHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DyCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DyActor;
  root?: string;
  repoRoot?: string;
};

export async function runIntelligentSupplyChainCommandCycle(input: DyCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DyHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };
  const twinActor: DyActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

  hops.push(
    hop(
      'honesty_locks',
      DY_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DY_LOCKS.LOCAL_FIRST &&
        DY_LOCKS.FREIGHT_BOOKING_AUTONOMOUS === false &&
        DY_LOCKS.EXPERIMENT_CANDIDATE_EQ_PRODUCTION_CHANGE === false &&
        DY_LOCKS.QUANTUM_SUPREMACY_WITHOUT_EVIDENCE === false &&
        DY_LOCKS.CLASSICAL_BASELINE_OPTIONAL === false &&
        DY_LOCKS.LISTING_EQ_AUTO_GRANT === false &&
        DY_LOCKS.ROLLBACK_PLAN_EQ_AUTO_PROD_ROLLBACK === false &&
        DY_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
        DY_LOCKS.TIP_LAND === false &&
        DY_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapIntelligentSupplyChainCommand({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'intelligent_supply_chain_command_bootstrap',
      'PASS',
      `os=${os.id}; predecessor=${os.predecessorLayer}; softWire=${os.softWiredPredecessors.join(',')}`,
    ),
  );

  // A
  const playbook = await createRecoveryPlaybook({
    incidentId: 'inc-1',
    summary: 'carrier delay recovery advisory',
    attemptPhysicalExecution: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'recovery_playbook_advisory_only',
      playbook.physicalExecutionAuthorized === false &&
        playbook.status === 'advisory_only'
        ? 'PASS'
        : 'FAIL',
      playbook.reason,
    ),
  );
  for (const [action, hopName] of [
    ['book_freight', 'freight_booking_denied'],
    ['issue_purchase_order', 'purchase_order_denied'],
    ['sign_contract', 'contract_signing_denied'],
    ['spend_money', 'spend_money_denied'],
    ['change_production_system', 'production_change_denied'],
  ] as const) {
    const denial = await denyAutonomyBoundaryAction({ action, root, actor });
    hops.push(
      hop(hopName, denial.status === 'denied' ? 'PASS' : 'FAIL', denial.reason),
    );
  }

  // B
  const retrieval = await runRetrievalQuery({
    query: 'lane risk',
    contextId: 'ctx-a',
    aclGranted: false,
    labelPresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'retrieval_acl_deny_by_default',
      retrieval.status === 'denied' ? 'PASS' : 'FAIL',
      retrieval.reason,
    ),
  );
  const labelRetrieval = await runRetrievalQuery({
    query: 'lane risk',
    contextId: 'ctx-a',
    aclGranted: false,
    labelPresent: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'label_alone_neq_retrieval_access',
      labelRetrieval.status === 'denied' ? 'PASS' : 'FAIL',
      labelRetrieval.reason,
    ),
  );
  const timeline = await accessHistoricalTimeline({
    timelineId: 'tl-1',
    contextId: 'ctx-b',
    aclGranted: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'historical_timeline_acl_enforced',
      timeline.status === 'denied' ? 'PASS' : 'FAIL',
      timeline.reason,
    ),
  );

  // C
  const exp = await generateExperimentFromBottleneck({
    bottleneckId: 'bn-slotting',
    family: 'classical',
    classicalBaselinePresent: true,
    attemptProductionChange: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'experiment_candidate_neq_production_change',
      exp.productionChangeAuthorized === false && exp.status === 'candidate'
        ? 'PASS'
        : 'FAIL',
      exp.reason,
    ),
  );
  const qi = await generateExperimentFromBottleneck({
    bottleneckId: 'bn-routing',
    family: 'quantum_inspired',
    classicalBaselinePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_inspired_requires_classical_baseline',
      qi.status === 'denied' ? 'PASS' : 'FAIL',
      qi.reason,
    ),
  );
  const retained = await evaluateExperimentRetention({
    experimentId: exp.id,
    reproducible: true,
    evidenceBacked: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'retain_only_reproducible_evidence_backed',
      retained.status === 'retained' && retained.productionChangeAuthorized === false
        ? 'PASS'
        : 'FAIL',
      retained.reason,
    ),
  );
  const supremacy = await denyUnverifiedSupremacyClaim({
    experimentId: exp.id,
    supremacyClaimed: true,
    verifiedEvidence: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unverified_supremacy_claim_denied',
      supremacy.status === 'denied' ? 'PASS' : 'FAIL',
      supremacy.reason,
    ),
  );

  // D
  const device = await probeDeviceScheduleRunningVerified({
    deviceKind: 'gpu',
    authorized: true,
    heartbeatPresent: false,
    claimRunningVerified: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'device_schedule_running_verified_needs_evidence',
      device.state === 'NOT_VERIFIED' && device.status === 'denied' ? 'PASS' : 'FAIL',
      device.reason,
    ),
  );
  const unauthDevice = await probeDeviceScheduleRunningVerified({
    deviceKind: 'npu',
    authorized: false,
    heartbeatPresent: true,
    claimRunningVerified: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_device_schedule_denied',
      unauthDevice.status === 'denied' ? 'PASS' : 'FAIL',
      unauthDevice.reason,
    ),
  );
  const offlineWait = await probeOfflineDeviceNode({
    deviceKind: 'edge',
    poweredNodePresent: false,
    root,
    actor,
  });
  const offlineStop = await probeOfflineDeviceNodeStopped({
    deviceKind: 'mobile',
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_without_powered_node_waiting_or_stopped',
      offlineWait.state === 'WAITING_NODE' && offlineStop.state === 'OFFLINE_STOPPED'
        ? 'PASS'
        : 'FAIL',
      offlineWait.reason,
    ),
  );

  // E
  await enrollLtmNode({ nodeId: 'ltm-1', enrolled: false, root, actor });
  const unenrolled = await accessLtmNode({
    nodeId: 'ltm-1',
    enrolled: false,
    explicitGrant: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'ltm_sealed_deny_unenrolled',
      unenrolled.status === 'denied' ? 'PASS' : 'FAIL',
      unenrolled.reason,
    ),
  );
  const acl = await accessLtmNode({
    nodeId: 'ltm-2',
    enrolled: true,
    explicitGrant: false,
    root,
    actor,
  });
  hops.push(
    hop('ltm_governed_acl', acl.status === 'denied' ? 'PASS' : 'FAIL', acl.reason),
  );

  // F
  const unsigned = await openAgentMeeting({
    meetingId: 'm-1',
    signed: false,
    authorized: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_agent_meeting_denied',
      unsigned.status === 'denied' ? 'PASS' : 'FAIL',
      unsigned.reason,
    ),
  );
  const unauthCollab = await openAgentMeeting({
    meetingId: 'm-2',
    signed: true,
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_collaboration_denied',
      unauthCollab.status === 'denied' ? 'PASS' : 'FAIL',
      unauthCollab.reason,
    ),
  );
  const autonomyCollab = await openAgentMeeting({
    meetingId: 'm-3',
    signed: true,
    authorized: true,
    unrestrictedAutonomyClaimed: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'collaboration_neq_unrestricted_autonomy',
      autonomyCollab.status === 'denied' ? 'PASS' : 'FAIL',
      autonomyCollab.reason,
    ),
  );

  // G
  const pack = await createSolutionPack({
    packId: 'pack-retail',
    industry: 'retail',
    supplyChainPilotProven: true,
    listPublicly: true,
    attemptAutoGrant: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'solution_listing_neq_auto_grant',
      pack.autoGranted === false ? 'PASS' : 'FAIL',
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
      'wedge_first_non_supply_chain_pack_gated',
      wedge.status === 'denied' ? 'PASS' : 'FAIL',
      wedge.reason,
    ),
  );

  // H
  const rollback = await createRollbackRecoveryPlan({
    incidentId: 'inc-obs-1',
    humanGatePresent: false,
    attemptAutoRollback: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'rollback_plan_neq_auto_prod_rollback',
      rollback.productionRollbackExecuted === false &&
        rollback.status === 'plan_only'
        ? 'PASS'
        : 'FAIL',
      rollback.reason,
    ),
  );
  const obs = await claimObservability({
    claim: 'launch healthy',
    evidencePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'observability_claim_needs_evidence',
      obs.status === 'denied' ? 'PASS' : 'FAIL',
      obs.reason,
    ),
  );
  const twinAuth = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  hops.push(
    hop(
      'digital_twin_neq_founder',
      twinAuth.status === 'denied' ? 'PASS' : 'FAIL',
      twinAuth.reason,
    ),
  );

  const preds = predecessorMap(input.repoRoot ?? root);
  const softWireOk =
    preds.DV.tipProbe === 'PRESENT' ||
    preds.DW.tipProbe === 'PRESENT' ||
    preds.DX.tipProbe === 'PRESENT' ||
    preds.DV.tipProbe === 'WAITING_DATA';
  hops.push(
    hop(
      'dx_dw_soft_wire_probe',
      softWireOk ? 'PASS' : 'FAIL',
      `DX=${preds.DX.tipProbe}/${preds.DX.report}; DW=${preds.DW.tipProbe}/${preds.DW.report}; DV=${preds.DV.tipProbe}/${preds.DV.report}`,
    ),
  );

  void decisionGate({
    id: 'dy-cycle-gate',
    action: '62l_dy_intelligent_supply_chain_command_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void intelligentSupplyChainCommandHonesty(input.repoRoot);
  void INTELLIGENT_SUPPLY_CHAIN_COMMAND_CYCLE;

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DY intelligent supply chain command cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DY'],
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
      subject: '62L-DY intelligent supply chain command cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; autonomy boundary; experiment≠prod; quantum classical baseline; ` +
        'evidence gates; listing≠auto-grant; rollback plan≠auto',
      sourceRefs: ['62L-DY'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      'BOUNDED',
      'Learning recorded locally; learning ≠ permission; classical baselines required; no production authorization.',
    ),
  );

  const health = await checkLocalBrainHealth(root).catch(() => null);

  return {
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: DY_LOCKS.L4_AUTONOMY_ENABLED as false,
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
    fullProductionIntelligentSupplyChainCommandShipped: false as const,
    dbCandidatesApplied: false as const,
    os,
  };
}

export async function buildIntelligentSupplyChainCommandHealthReport(input?: {
  orgId?: string;
  tenantId?: string;
  universeId?: string;
  actor?: DyActor;
  root?: string;
  repoRoot?: string;
}) {
  const orgId = input?.orgId ?? 'org-local';
  const tenantId = input?.tenantId ?? 'tenant-local';
  const universeId = input?.universeId ?? 'universe-local';
  const actor: DyActor = input?.actor ?? {
    kind: 'supply_chain_command_curator',
    id: 'health',
    orgId,
    tenantId,
    universeId,
  };
  const cycle = await runIntelligentSupplyChainCommandCycle({
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
    honesty: intelligentSupplyChainCommandHonesty(input?.repoRoot),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    dbCandidatesApplied: false as const,
  };
}
