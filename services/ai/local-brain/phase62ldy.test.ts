import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { openAgentMeeting } from './agent-collaboration-protocol-dy';
import {
  denyUnverifiedSupremacyClaim,
  evaluateExperimentRetention,
  generateExperimentFromBottleneck,
} from './autonomous-experiment-optimization-lab';
import {
  accessHistoricalTimeline,
  runRetrievalQuery,
} from './global-knowledge-retrieval-cortex';
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
  COLLAB_NEQ_AUTONOMY,
  CONTRACT_SIGNING_DENIED,
  DEVICE_EVIDENCE_REQUIRED,
  DY_LOCKS,
  EXPERIMENT_NEQ_PROD,
  FREIGHT_BOOKING_DENIED,
  HISTORICAL_TIMELINE_ACL,
  HONESTY_BANNER,
  INTELLIGENT_SUPPLY_CHAIN_COMMAND_CYCLE,
  LABEL_NEQ_RETRIEVAL_ACCESS,
  LEARNING_LOOP_RULES,
  LISTING_NEQ_AUTO_GRANT,
  LTM_ACL_DENIED,
  LTM_UNENROLLED_DENIED,
  NEXT_PHASE_TITLE,
  OBSERVABILITY_EVIDENCE_REQUIRED,
  OFFLINE_WAITING_OR_STOPPED,
  PRODUCT_PHILOSOPHY,
  PRODUCTION_CHANGE_DENIED,
  PURCHASE_ORDER_DENIED,
  QUANTUM_NEEDS_CLASSICAL,
  RECOVERY_PLAYBOOK_ADVISORY_ONLY,
  RETAIN_REPRODUCIBLE_ONLY,
  RETRIEVAL_ACL_DENIED,
  ROLLBACK_PLAN_NEQ_AUTO,
  SPEND_MONEY_DENIED,
  SUPREMACY_DENIED,
  TWIN_NEQ_FOUNDER,
  UNAUTHORIZED_COLLAB_DENIED,
  UNAUTHORIZED_DEVICE_SCHEDULE,
  UNSIGNED_MEETING_DENIED,
  WEDGE_FIRST_GATED,
  predecessorMap,
  type DyActor,
} from './intelligent-supply-chain-command-types';
import {
  buildIntelligentSupplyChainCommandHealthReport,
  runIntelligentSupplyChainCommandCycle,
} from './intelligent-supply-chain-command-runtime';
import {
  claimObservability,
  createRollbackRecoveryPlan,
  probeDigitalTwinAuthority,
} from './launch-observability-recovery-brain';
import { accessLtmNode, enrollLtmNode } from './long-term-memory-graph';
import {
  probeDeviceScheduleRunningVerified,
  probeOfflineDeviceNode,
  probeOfflineDeviceNodeStopped,
} from './universal-device-chip-scheduler';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldy-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DyActor = {
  kind: 'supply_chain_command_curator',
  id: 'test-curator',
  orgId: 'org-dy',
  tenantId: 'tenant-dy',
  universeId: 'universe-dy',
};
const twinActor: DyActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      DY_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DY_LOCKS.TIP_LAND === false &&
      DY_LOCKS.FREIGHT_BOOKING_AUTONOMOUS === false &&
      DY_LOCKS.EXPERIMENT_CANDIDATE_EQ_PRODUCTION_CHANGE === false &&
      DY_LOCKS.QUANTUM_SUPREMACY_WITHOUT_EVIDENCE === false &&
      DY_LOCKS.CLASSICAL_BASELINE_OPTIONAL === false &&
      DY_LOCKS.LISTING_EQ_AUTO_GRANT === false &&
      DY_LOCKS.ROLLBACK_PLAN_EQ_AUTO_PROD_ROLLBACK === false &&
      DY_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false &&
      PRODUCT_PHILOSOPHY.classicalBaselineRequiredForQuantumInspired === true &&
      LEARNING_LOOP_RULES.retainOnlyReproducibleEvidenceBackedImprovements ===
        true &&
      INTELLIGENT_SUPPLY_CHAIN_COMMAND_CYCLE.includes(
        'quantum_inspired_requires_classical_baseline',
      ),
    'locks + philosophy + learning-loop + cycle present',
  );

  const os = await bootstrapIntelligentSupplyChainCommand({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_intelligent_supply_chain_command',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.publicLaunchAuthorized === false &&
      (os.predecessorLayer === 'DX' ||
        os.predecessorLayer === 'DW' ||
        os.predecessorLayer === 'DV') &&
      (os.softWiredPredecessors.includes('DV') ||
        os.softWiredPredecessors.includes('DW') ||
        os.softWiredPredecessors.includes('DX')),
    `os=${os.id}; predecessor=${os.predecessorLayer}; soft=${os.softWiredPredecessors.join(',')}`,
  );

  // A — autonomy boundary + recovery playbooks
  const playbook = await createRecoveryPlaybook({
    incidentId: 'inc-test',
    summary: 'port congestion advisory',
    attemptPhysicalExecution: true,
    root,
    actor,
  });
  check(
    'recovery_playbook_advisory_only',
    playbook.physicalExecutionAuthorized === false &&
      playbook.status === 'advisory_only' &&
      playbook.reason === RECOVERY_PLAYBOOK_ADVISORY_ONLY,
    playbook.reason,
  );

  const freight = await denyAutonomyBoundaryAction({
    action: 'book_freight',
    root,
    actor,
  });
  check(
    'freight_booking_denied',
    freight.status === 'denied' && freight.reason === FREIGHT_BOOKING_DENIED,
    freight.reason,
  );
  const po = await denyAutonomyBoundaryAction({
    action: 'issue_purchase_order',
    root,
    actor,
  });
  check(
    'purchase_order_denied',
    po.status === 'denied' && po.reason === PURCHASE_ORDER_DENIED,
    po.reason,
  );
  const contract = await denyAutonomyBoundaryAction({
    action: 'sign_contract',
    root,
    actor,
  });
  check(
    'contract_signing_denied',
    contract.status === 'denied' && contract.reason === CONTRACT_SIGNING_DENIED,
    contract.reason,
  );
  const spend = await denyAutonomyBoundaryAction({
    action: 'spend_money',
    root,
    actor,
  });
  check(
    'spend_money_denied',
    spend.status === 'denied' && spend.reason === SPEND_MONEY_DENIED,
    spend.reason,
  );
  const prod = await denyAutonomyBoundaryAction({
    action: 'change_production_system',
    root,
    actor,
  });
  check(
    'production_change_denied',
    prod.status === 'denied' && prod.reason === PRODUCTION_CHANGE_DENIED,
    prod.reason,
  );

  // B
  const retrieval = await runRetrievalQuery({
    query: 'supplier risk',
    contextId: 'ctx-a',
    aclGranted: false,
    root,
    actor,
  });
  check(
    'retrieval_acl_deny_by_default',
    retrieval.status === 'denied' && retrieval.reason === RETRIEVAL_ACL_DENIED,
    retrieval.reason,
  );
  const label = await runRetrievalQuery({
    query: 'supplier risk',
    contextId: 'ctx-a',
    aclGranted: false,
    labelPresent: true,
    root,
    actor,
  });
  check(
    'label_alone_neq_retrieval_access',
    label.status === 'denied' && label.reason === LABEL_NEQ_RETRIEVAL_ACCESS,
    label.reason,
  );
  const timeline = await accessHistoricalTimeline({
    timelineId: 'tl-hist',
    contextId: 'ctx-b',
    aclGranted: false,
    root,
    actor,
  });
  check(
    'historical_timeline_acl_enforced',
    timeline.status === 'denied' && timeline.reason === HISTORICAL_TIMELINE_ACL,
    timeline.reason,
  );

  // C — experiment ≠ prod; quantum classical baseline; retain reproducible only
  const exp = await generateExperimentFromBottleneck({
    bottleneckId: 'bn-dock',
    family: 'ml',
    classicalBaselinePresent: true,
    attemptProductionChange: true,
    root,
    actor,
  });
  check(
    'experiment_candidate_neq_production_change',
    exp.productionChangeAuthorized === false &&
      exp.status === 'candidate' &&
      exp.reason === EXPERIMENT_NEQ_PROD,
    exp.reason,
  );
  const qi = await generateExperimentFromBottleneck({
    bottleneckId: 'bn-route',
    family: 'quantum_inspired',
    classicalBaselinePresent: false,
    root,
    actor,
  });
  check(
    'quantum_inspired_requires_classical_baseline',
    qi.status === 'denied' && qi.reason === QUANTUM_NEEDS_CLASSICAL,
    qi.reason,
  );
  const qiOk = await generateExperimentFromBottleneck({
    bottleneckId: 'bn-route-2',
    family: 'quantum_inspired',
    classicalBaselinePresent: true,
    root,
    actor,
  });
  check(
    'quantum_inspired_with_classical_baseline_candidate',
    qiOk.status === 'candidate' && qiOk.classicalBaselinePresent === true,
    qiOk.reason,
  );
  const retained = await evaluateExperimentRetention({
    experimentId: exp.id,
    reproducible: true,
    evidenceBacked: true,
    root,
    actor,
  });
  check(
    'retain_only_reproducible_evidence_backed',
    retained.status === 'retained' &&
      retained.productionChangeAuthorized === false &&
      retained.reason === RETAIN_REPRODUCIBLE_ONLY,
    retained.reason,
  );
  const rejected = await evaluateExperimentRetention({
    experimentId: qiOk.id,
    reproducible: false,
    evidenceBacked: false,
    root,
    actor,
  });
  check(
    'non_reproducible_experiment_rejected',
    rejected.status === 'rejected',
    rejected.reason,
  );
  const supremacy = await denyUnverifiedSupremacyClaim({
    experimentId: exp.id,
    supremacyClaimed: true,
    verifiedEvidence: false,
    root,
    actor,
  });
  check(
    'unverified_supremacy_claim_denied',
    supremacy.status === 'denied' && supremacy.reason === SUPREMACY_DENIED,
    supremacy.reason,
  );

  // D — evidence gates + offline
  const device = await probeDeviceScheduleRunningVerified({
    deviceKind: 'cpu',
    authorized: true,
    heartbeatPresent: false,
    claimRunningVerified: true,
    root,
    actor,
  });
  check(
    'device_schedule_running_verified_needs_evidence',
    device.state === 'NOT_VERIFIED' &&
      device.status === 'denied' &&
      device.reason === DEVICE_EVIDENCE_REQUIRED,
    device.reason,
  );
  const unauth = await probeDeviceScheduleRunningVerified({
    deviceKind: 'gpu',
    authorized: false,
    heartbeatPresent: true,
    claimRunningVerified: true,
    root,
    actor,
  });
  check(
    'unauthorized_device_schedule_denied',
    unauth.status === 'denied' && unauth.reason === UNAUTHORIZED_DEVICE_SCHEDULE,
    unauth.reason,
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
  check(
    'offline_without_powered_node_waiting_or_stopped',
    offlineWait.state === 'WAITING_NODE' &&
      offlineStop.state === 'OFFLINE_STOPPED' &&
      offlineWait.reason === OFFLINE_WAITING_OR_STOPPED,
    `${offlineWait.state}/${offlineStop.state}`,
  );

  // E
  await enrollLtmNode({ nodeId: 'ltm-x', enrolled: false, root, actor });
  const unenrolled = await accessLtmNode({
    nodeId: 'ltm-x',
    enrolled: false,
    explicitGrant: true,
    root,
    actor,
  });
  check(
    'ltm_sealed_deny_unenrolled',
    unenrolled.status === 'denied' &&
      unenrolled.reason === LTM_UNENROLLED_DENIED,
    unenrolled.reason,
  );
  const ltmAcl = await accessLtmNode({
    nodeId: 'ltm-y',
    enrolled: true,
    explicitGrant: false,
    root,
    actor,
  });
  check(
    'ltm_governed_acl',
    ltmAcl.status === 'denied' && ltmAcl.reason === LTM_ACL_DENIED,
    ltmAcl.reason,
  );

  // F
  const unsigned = await openAgentMeeting({
    meetingId: 'meet-1',
    signed: false,
    authorized: true,
    root,
    actor,
  });
  check(
    'unsigned_agent_meeting_denied',
    unsigned.status === 'denied' && unsigned.reason === UNSIGNED_MEETING_DENIED,
    unsigned.reason,
  );
  const unauthCollab = await openAgentMeeting({
    meetingId: 'meet-2',
    signed: true,
    authorized: false,
    root,
    actor,
  });
  check(
    'unauthorized_collaboration_denied',
    unauthCollab.status === 'denied' &&
      unauthCollab.reason === UNAUTHORIZED_COLLAB_DENIED,
    unauthCollab.reason,
  );
  const autonomy = await openAgentMeeting({
    meetingId: 'meet-3',
    signed: true,
    authorized: true,
    unrestrictedAutonomyClaimed: true,
    root,
    actor,
  });
  check(
    'collaboration_neq_unrestricted_autonomy',
    autonomy.status === 'denied' && autonomy.reason === COLLAB_NEQ_AUTONOMY,
    autonomy.reason,
  );

  // G
  const pack = await createSolutionPack({
    packId: 'pack-pharma',
    industry: 'pharma',
    supplyChainPilotProven: true,
    listPublicly: true,
    attemptAutoGrant: true,
    root,
    actor,
  });
  check(
    'solution_listing_neq_auto_grant',
    pack.autoGranted === false && pack.reason === LISTING_NEQ_AUTO_GRANT,
    pack.reason,
  );
  const wedge = await evaluateBroaderIndustryGate({
    supplyChainPilotProofPresent: false,
    attemptBroaderIndustry: true,
    root,
    actor,
  });
  check(
    'wedge_first_non_supply_chain_pack_gated',
    wedge.status === 'denied' && wedge.reason === WEDGE_FIRST_GATED,
    wedge.reason,
  );

  // H
  const rollback = await createRollbackRecoveryPlan({
    incidentId: 'obs-1',
    humanGatePresent: false,
    attemptAutoRollback: true,
    root,
    actor,
  });
  check(
    'rollback_plan_neq_auto_prod_rollback',
    rollback.productionRollbackExecuted === false &&
      rollback.status === 'plan_only' &&
      rollback.reason === ROLLBACK_PLAN_NEQ_AUTO,
    rollback.reason,
  );
  const obs = await claimObservability({
    claim: 'p99 healthy',
    evidencePresent: false,
    root,
    actor,
  });
  check(
    'observability_claim_needs_evidence',
    obs.status === 'denied' && obs.reason === OBSERVABILITY_EVIDENCE_REQUIRED,
    obs.reason,
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
    'dx_dw_soft_wire_probe',
    preds.DV.tipProbe === 'PRESENT' && preds.DV.report === 'PRESENT',
    `DX=${preds.DX.tipProbe}/${preds.DX.report}; DW=${preds.DW.tipProbe}/${preds.DW.report}; DV=${preds.DV.tipProbe}/${preds.DV.report}`,
  );

  check(
    'next_phase_title_documented_only',
    NEXT_PHASE_TITLE.startsWith('62L-DZ') &&
      NEXT_PHASE_TITLE.includes('Supply Chain Intelligence Fabric'),
    NEXT_PHASE_TITLE,
  );

  const cycle = await runIntelligentSupplyChainCommandCycle({
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
      cycle.githubSotIssue === 142 &&
      cycle.gitlabCoordinationIssue === 76,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',')}`,
  );

  const health = await buildIntelligentSupplyChainCommandHealthReport({
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

  const honesty = intelligentSupplyChainCommandHonesty(repoRoot);
  check(
    'honesty_aggregate',
    honesty.l4AutonomyEnabled === false &&
      honesty.learningLoopRules.classicalBaselineRequired === true &&
      honesty.experimentCandidateEqProductionChange === false &&
      honesty.quantumSupremacyWithoutEvidence === false,
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

console.log('PASS npm run test:62ldy — all denial/honesty stories');
