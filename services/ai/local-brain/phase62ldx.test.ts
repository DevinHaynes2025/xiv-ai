import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { exchangeAgentKnowledge } from './agent-to-agent-knowledge-bus';
import {
  denyAutonomyBoundaryAction,
  planExceptionRecovery,
} from './autonomous-supply-chain-ops-brain';
import {
  bootstrapAutonomousSupplyChainOps,
  autonomousSupplyChainOpsHonesty,
} from './autonomous-supply-chain-ops';
import {
  AUTONOMY_BOUNDARY,
  AUTONOMOUS_SUPPLY_CHAIN_OPS_CYCLE,
  CHAOS_NEQ_PROD_AUTHORITY,
  CHIP_EVIDENCE_REQUIRED,
  CHIP_NEQ_FAB_CONTROL,
  CONTRACT_SIGNING_DENIED,
  DX_LOCKS,
  EXCEPTION_RECOVERY_ADVISORY_ONLY,
  FABRIC_ACL_DENIED,
  FREIGHT_BOOKING_DENIED,
  HONESTY_BANNER,
  LABEL_NEQ_FABRIC_ACCESS,
  LISTING_NEQ_AUTO_GRANT,
  MEMORY_ACL_DENIED,
  MEMORY_UNENROLLED_DENIED,
  NEXT_PHASE_TITLE,
  OFFLINE_WAITING_OR_STOPPED,
  PRODUCT_PHILOSOPHY,
  PRODUCTION_CHANGE_DENIED,
  PURCHASE_ORDER_DENIED,
  RELIABILITY_EVIDENCE_REQUIRED,
  SPEND_MONEY_DENIED,
  TWIN_LABELED_SIM,
  TWIN_NEQ_FOUNDER,
  TWIN_NEQ_PHYSICAL,
  TWIN_SIM_NEQ_FACT,
  UNAUTHORIZED_CHIP_RUNTIME,
  UNAUTHORIZED_HISTORICAL,
  A2A_UNAUTHORIZED_DENIED,
  A2A_UNSIGNED_DENIED,
  WEDGE_FIRST_GATED,
  predecessorMap,
  type DxActor,
} from './autonomous-supply-chain-ops-types';
import {
  buildAutonomousSupplyChainOpsHealthReport,
  runAutonomousSupplyChainOpsCycle,
} from './autonomous-supply-chain-ops-runtime';
import { runTwinExperiment } from './digital-twin-experiment-laboratory';
import {
  probeChipRuntime,
  routeCrossDeviceWorkload,
} from './edge-chip-runtime-federation';
import { federatedRetrieve } from './global-data-fabric-retrieval-engine';
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
import { accessMemoryCortex } from './personal-enterprise-memory-cortex';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldx-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DxActor = {
  kind: 'supply_chain_ops_analyst',
  id: 'test-analyst',
  orgId: 'org-dx',
  tenantId: 'tenant-dx',
  universeId: 'universe-dx',
};
const twinActor: DxActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      DX_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DX_LOCKS.TIP_LAND === false &&
      DX_LOCKS.AUTONOMOUS_FREIGHT_BOOKING === false &&
      DX_LOCKS.AUTONOMOUS_PURCHASE_ORDER === false &&
      DX_LOCKS.AUTONOMOUS_CONTRACT_SIGNING === false &&
      DX_LOCKS.AUTONOMOUS_SPEND === false &&
      DX_LOCKS.AUTONOMOUS_PRODUCTION_CHANGE === false &&
      DX_LOCKS.ANALYZE_SIMULATE_RECOMMEND_ONLY === true &&
      DX_LOCKS.CHAOS_SIM_EQ_PRODUCTION_INCIDENT_AUTHORITY === false &&
      DX_LOCKS.MARKETPLACE_LISTING_EQ_AUTO_GRANT === false &&
      PRODUCT_PHILOSOPHY.denyByDefaultAutonomyBoundary === true &&
      AUTONOMY_BOUNDARY.denied.includes('book_freight') &&
      AUTONOMOUS_SUPPLY_CHAIN_OPS_CYCLE.includes('freight_booking_denied'),
    'locks + autonomy boundary + cycle present',
  );

  const ops = await bootstrapAutonomousSupplyChainOps({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_autonomous_supply_chain_ops',
    Boolean(ops.id) &&
      ops.l4AutonomyEnabled === false &&
      ops.tipLand === false &&
      ops.predecessorLayer === 'DW' &&
      ops.autonomyBoundary.denyByDefault === true,
    `ops=${ops.id}; predecessor=${ops.predecessorLayer}`,
  );

  // A
  const recovery = await planExceptionRecovery({
    exceptionId: 'exc-1',
    summary: 'recovery',
    attemptPhysicalExecution: true,
    root,
    actor,
  });
  check(
    'exception_recovery_analyze_simulate_recommend_only',
    recovery.physicalExecutionAuthorized === false &&
      recovery.status === 'denied' &&
      recovery.reason === EXCEPTION_RECOVERY_ADVISORY_ONLY,
    recovery.reason,
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
    contract.status === 'denied' &&
      contract.reason === CONTRACT_SIGNING_DENIED,
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
  const fabric = await federatedRetrieve({
    query: 'q',
    explicitGrant: false,
    root,
    actor,
  });
  check(
    'federated_retrieval_acl_deny_by_default',
    fabric.status === 'denied' && fabric.reason === FABRIC_ACL_DENIED,
    fabric.reason,
  );

  const label = await federatedRetrieve({
    query: 'q',
    labelPresent: true,
    explicitGrant: false,
    root,
    actor,
  });
  check(
    'label_alone_neq_fabric_access',
    label.status === 'denied' && label.reason === LABEL_NEQ_FABRIC_ACCESS,
    label.reason,
  );

  const hist = await federatedRetrieve({
    query: 'q',
    explicitGrant: true,
    historicalCoverageAuthorized: false,
    root,
    actor,
  });
  check(
    'unauthorized_historical_coverage_denied',
    hist.status === 'denied' && hist.reason === UNAUTHORIZED_HISTORICAL,
    hist.reason,
  );

  // C
  const simFact = await runTwinExperiment({
    name: 'sim',
    claimVerifiedFact: true,
    root,
    actor,
  });
  check(
    'twin_experiment_sim_neq_fact',
    simFact.verifiedFact === false &&
      simFact.status === 'denied' &&
      simFact.reason === TWIN_SIM_NEQ_FACT,
    simFact.reason,
  );

  const simPhys = await runTwinExperiment({
    name: 'phys',
    attemptPhysicalControl: true,
    root,
    actor,
  });
  check(
    'twin_experiment_neq_physical_control',
    simPhys.physicalControl === false &&
      simPhys.status === 'denied' &&
      simPhys.reason === TWIN_NEQ_PHYSICAL,
    simPhys.reason,
  );

  const labeled = await runTwinExperiment({ name: 'lab', root, actor });
  check(
    'reproducible_experiment_labeled_simulation',
    labeled.labeledSimulation === true &&
      labeled.reason === TWIN_LABELED_SIM &&
      labeled.status === 'labeled_simulation',
    labeled.reason,
  );

  // D
  const chipEv = await probeChipRuntime({
    family: 'NVIDIA',
    sourceAuthorized: true,
    heartbeatEvidence: false,
    claimRunningVerified: true,
    root,
    actor,
  });
  check(
    'chip_runtime_running_verified_needs_evidence',
    chipEv.runningState === 'NOT_VERIFIED' &&
      chipEv.status === 'denied' &&
      chipEv.reason === CHIP_EVIDENCE_REQUIRED,
    chipEv.reason,
  );

  const chipUnauth = await probeChipRuntime({
    family: 'AMD',
    sourceAuthorized: false,
    root,
    actor,
  });
  check(
    'unauthorized_chip_runtime_denied',
    chipUnauth.status === 'denied' &&
      chipUnauth.reason === UNAUTHORIZED_CHIP_RUNTIME,
    chipUnauth.reason,
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
    targetDevice: 'edge-1',
    attemptFabRemoteControl: true,
    root,
    actor,
  });
  check(
    'cross_device_routing_neq_fab_remote_control',
    route.fabRemoteControl === false &&
      route.status === 'denied' &&
      route.reason === CHIP_NEQ_FAB_CONTROL,
    route.reason,
  );

  // E
  const unenrolled = await accessMemoryCortex({
    subjectId: 's1',
    enrolled: false,
    root,
    actor,
  });
  check(
    'memory_cortex_deny_unenrolled',
    unenrolled.status === 'denied' &&
      unenrolled.reason === MEMORY_UNENROLLED_DENIED,
    unenrolled.reason,
  );

  const acl = await accessMemoryCortex({
    subjectId: 's2',
    enrolled: true,
    explicitGrant: false,
    root,
    actor,
  });
  check(
    'memory_cortex_governed_acl',
    acl.status === 'denied' && acl.reason === MEMORY_ACL_DENIED,
    acl.reason,
  );

  // F
  const unsigned = await exchangeAgentKnowledge({
    fromAgentId: 'a',
    toAgentId: 'b',
    signed: false,
    authorized: true,
    root,
    actor,
  });
  check(
    'a2a_unsigned_exchange_denied',
    unsigned.status === 'denied' && unsigned.reason === A2A_UNSIGNED_DENIED,
    unsigned.reason,
  );

  const unauth = await exchangeAgentKnowledge({
    fromAgentId: 'a',
    toAgentId: 'b',
    signed: true,
    authorized: false,
    root,
    actor,
  });
  check(
    'a2a_unauthorized_exchange_denied',
    unauth.status === 'denied' && unauth.reason === A2A_UNAUTHORIZED_DENIED,
    unauth.reason,
  );

  // G
  const listing = await listIndustryPack({
    packId: 'sc',
    domain: 'supply_chain',
    claimAutoGrant: true,
    root,
    actor,
  });
  const install = await attemptPackInstallFromListing({
    listingId: listing.id,
    packId: 'sc',
    claimAutoGrantFromListing: true,
    root,
    actor,
  });
  check(
    'marketplace_listing_neq_auto_grant',
    listing.autoGranted === false &&
      listing.trustAuthority === false &&
      (listing.status === 'denied' || install.status === 'denied') &&
      (listing.reason === LISTING_NEQ_AUTO_GRANT ||
        install.reason === LISTING_NEQ_AUTO_GRANT),
    `${listing.reason}; ${install.reason}`,
  );

  const wedge = await listIndustryPack({
    packId: 'hc',
    domain: 'healthcare',
    root,
    actor,
  });
  check(
    'wedge_first_non_supply_chain_pack_gated',
    wedge.status === 'denied' &&
      wedge.wedgeGatePassed === false &&
      wedge.reason === WEDGE_FIRST_GATED,
    wedge.reason,
  );

  // H
  const chaos = await runChaosSimulation({
    scenario: 'failover',
    claimProductionIncidentAuthority: true,
    root,
    actor,
  });
  check(
    'chaos_sim_neq_production_incident_authority',
    chaos.productionIncidentAuthority === false &&
      chaos.status === 'denied' &&
      chaos.reason === CHAOS_NEQ_PROD_AUTHORITY,
    chaos.reason,
  );

  const rel = await claimReliability({
    claim: 'ready',
    evidencePresent: false,
    root,
    actor,
  });
  check(
    'reliability_claim_needs_evidence',
    rel.state === 'NOT_VERIFIED' &&
      rel.status === 'denied' &&
      rel.reason === RELIABILITY_EVIDENCE_REQUIRED,
    rel.reason,
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
  check(
    'offline_without_powered_node_waiting_or_stopped',
    offline.state === 'WAITING_NODE' &&
      offlineStopped.state === 'OFFLINE_STOPPED' &&
      offline.reason === OFFLINE_WAITING_OR_STOPPED,
    offline.reason,
  );

  const twin = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  check(
    'digital_twin_neq_founder',
    twin.status === 'denied' &&
      twin.isFounder === false &&
      twin.reason === TWIN_NEQ_FOUNDER,
    twin.reason,
  );

  const soft = softWireDwDvStatus(repoRoot);
  const preds = predecessorMap(repoRoot);
  check(
    'dw_dv_soft_wire_probe',
    soft.layer === 'DW' &&
      preds.DW.tipProbe === 'PRESENT' &&
      preds.DW.report === 'PRESENT' &&
      preds.DV.tipProbe === 'PRESENT' &&
      preds.DV.report === 'PRESENT' &&
      preds.DU.tipProbe === 'PRESENT' &&
      preds.DU.report === 'PRESENT',
    soft.summary,
  );

  check(
    'next_phase_title_documented_only',
    NEXT_PHASE_TITLE.startsWith('62L-DY') &&
      !NEXT_PHASE_TITLE.includes('IMPLEMENTED'),
    NEXT_PHASE_TITLE,
  );

  const cycle = await runAutonomousSupplyChainOpsCycle({
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
      cycle.dbCandidatesApplied === false &&
      cycle.autonomyBoundary.denied.length === 5,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildAutonomousSupplyChainOpsHealthReport({
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

  const honesty = autonomousSupplyChainOpsHonesty(repoRoot);
  check(
    'honesty_facade',
    honesty.autonomousFreightBooking === false &&
      honesty.autonomousPurchaseOrder === false &&
      honesty.autonomousContractSigning === false &&
      honesty.autonomousSpend === false &&
      honesty.autonomousProductionChange === false &&
      honesty.chaosSimEqProductionIncidentAuthority === false &&
      honesty.marketplaceListingEqAutoGrant === false,
    'facade autonomy + honesty locks',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} stories:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DX autonomous supply chain ops — all denial/honesty stories passed');
