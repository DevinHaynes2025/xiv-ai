import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  probeRevenueProvider,
  recommendAcquisitionAction,
} from './ai-revenue-factory';
import {
  accessPrivateUniverse,
  discoverPartnership,
  enrollDesignPartner,
} from './customer-acquisition-partnership-brain';
import {
  applyNegotiationMemory,
  approveDeal,
  openDeal,
} from './enterprise-deal-desk';
import {
  probeDigitalTwinAuthority,
  recordDecisionOutcomeLearning,
} from './executive-performance-nervous-system';
import {
  bootstrapGrowthOperatingSystem,
  growthOperatingSystemHonesty,
} from './growth-operating-system';
import {
  BUNDLE_NEQ_AUTO_BILL,
  CORRELATION_NEQ_CAUSATION,
  COUNTDOWN_NEQ_PUBLIC_LAUNCH,
  DEAL_GATE_REQUIRED,
  DESIGN_PARTNER_AUTHORIZED_ONLY,
  DT_LOCKS,
  EXPANSION_NEQ_AUTO_CHARGE,
  GROWTH_OPERATING_SYSTEM_CYCLE,
  HEARTBEAT_REQUIRED_FOR_RUNNING,
  HONESTY_BANNER,
  NEGOTIATION_NEQ_AUTO_SIGN,
  NEURAL_GROWTH_SEALED_DENIED,
  NEXT_PHASE_TITLE,
  OFFLINE_WAITING_OR_STOPPED,
  PILOT_NEQ_AUTO_SHIP,
  PRICING_NEQ_AUTO_PRICE,
  PRIVATE_UNIVERSE_DENIED,
  PRODUCT_PHILOSOPHY,
  RECOMMEND_NEQ_CHARGE,
  RENEWAL_NEQ_AUTO_RENEW,
  TWIN_NEQ_FOUNDER,
  UNAUTHORIZED_PARTNERSHIP_DENIED,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  WEDGE_FIRST_GATED,
  predecessorMap,
  type DtActor,
} from './growth-operating-system-types';
import {
  buildGrowthOperatingSystemHealthReport,
  runGrowthOperatingSystemCycle,
} from './growth-operating-system-runtime';
import {
  createLaunchCountdown,
  probeRunningVerified,
  runPilotOps,
} from './launch-mission-control';
import {
  accessSealedGrowthNode,
  createNeuralGrowthNode,
  evaluateWedgeFirstGate,
  probeOfflineGrowthNode,
} from './neural-growth-nodes';
import { createPricingExperiment, designBundle } from './pricing-optimization-lab';
import {
  recordExpansionSignal,
  recordRenewalRisk,
} from './retention-expansion-intelligence';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldt-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DtActor = {
  kind: 'growth_os_curator',
  id: 'test-curator',
  orgId: 'org-dt',
  tenantId: 'tenant-dt',
  universeId: 'universe-dt',
};
const agentActor: DtActor = { ...actor, kind: 'agent', id: 'agent-1' };
const twinActor: DtActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      DT_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DT_LOCKS.TIP_LAND === false &&
      DT_LOCKS.RECOMMENDATION_EQ_CHARGE === false &&
      DT_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false &&
      DT_LOCKS.CONTRACT_PAYMENT_AUTHORIZED === false &&
      PRODUCT_PHILOSOPHY.wedgeFirstSupplyChainSmb === true &&
      GROWTH_OPERATING_SYSTEM_CYCLE.includes('acquisition_pipeline_recommend_neq_charge'),
    'locks + philosophy + cycle present',
  );

  const os = await bootstrapGrowthOperatingSystem({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_growth_operating_system',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.publicLaunchAuthorized === false &&
      os.predecessorLayer === 'DS',
    `os=${os.id}; predecessor=${os.predecessorLayer}`,
  );

  // A
  const rec = await recommendAcquisitionAction({
    channel: 'content',
    segment: 'smb-supply-chain',
    attemptCharge: true,
    root,
    actor,
  });
  check(
    'acquisition_pipeline_recommend_neq_charge',
    rec.chargesCustomer === false &&
      rec.deploysSpend === false &&
      rec.status === 'recommendation_only' &&
      rec.reason === RECOMMEND_NEQ_CHARGE,
    rec.reason,
  );

  const provider = await probeRevenueProvider({
    providerId: 'billing-stub',
    configured: false,
    claimAvailable: true,
    root,
    actor,
  });
  check(
    'unconfigured_revenue_provider_unavailable',
    provider.availability === 'UNAVAILABLE' &&
      provider.status === 'denied' &&
      provider.reason === UNCONFIGURED_PROVIDER_UNAVAILABLE,
    provider.reason,
  );

  // B
  const discovery = await discoverPartnership({
    partnerName: 'cold-partner',
    dataAuthorized: false,
    outreachAuthorized: true,
    root,
    actor,
  });
  check(
    'unauthorized_partnership_discovery_denied',
    discovery.status === 'denied' && discovery.reason === UNAUTHORIZED_PARTNERSHIP_DENIED,
    discovery.reason,
  );

  const design = await enrollDesignPartner({
    partnerName: 'design-x',
    dataAuthorized: false,
    root,
    actor,
  });
  check(
    'design_partner_requires_authorized_data_only',
    design.status === 'denied' && design.reason === DESIGN_PARTNER_AUTHORIZED_ONLY,
    design.reason,
  );

  const univ = await accessPrivateUniverse({
    universeId: actor.universeId,
    labelPresent: true,
    explicitGrant: false,
    root,
    actor,
  });
  check(
    'private_universe_deny_by_default',
    univ.status === 'denied' && univ.reason === PRIVATE_UNIVERSE_DENIED,
    univ.reason,
  );

  // C
  const deal = await openDeal({ counterparty: 'enterprise-co', root, actor });
  const denied = await approveDeal({
    dealId: deal.id,
    humanGatePresent: false,
    actor: agentActor,
    root,
  });
  check(
    'deal_approval_without_human_founder_gate_denied',
    denied.status === 'denied' &&
      denied.autoSigned === false &&
      denied.reason === DEAL_GATE_REQUIRED,
    denied.reason,
  );

  const neg = await applyNegotiationMemory({
    dealId: deal.id,
    memoryRef: 'term-sheet-draft',
    attemptAutoSign: true,
    root,
    actor,
  });
  check(
    'negotiation_memory_neq_auto_sign',
    neg.status === 'denied' &&
      neg.autoSigned === false &&
      neg.reason === NEGOTIATION_NEQ_AUTO_SIGN,
    neg.reason,
  );

  // D
  const price = await createPricingExperiment({
    name: 'wedge-a-b',
    hypothesis: 'lower entry SKU lifts SMB conversion',
    attemptAutoPrice: true,
    root,
    actor,
  });
  check(
    'pricing_experiment_neq_auto_price',
    price.autoPriced === false && price.reason === PRICING_NEQ_AUTO_PRICE,
    price.reason,
  );

  const bundle = await designBundle({
    name: 'ops-plus',
    components: ['inventory', 'routing'],
    attemptAutoBill: true,
    root,
    actor,
  });
  check(
    'bundle_design_neq_auto_bill',
    bundle.autoBilled === false && bundle.reason === BUNDLE_NEQ_AUTO_BILL,
    bundle.reason,
  );

  // E
  const mission = await createLaunchCountdown({
    name: '30d-pilot',
    countdownDays: 30,
    claimPublicLaunch: true,
    root,
    actor,
  });
  check(
    'launch_countdown_neq_public_launch',
    mission.publicLaunchAuthorized === false &&
      mission.reason === COUNTDOWN_NEQ_PUBLIC_LAUNCH,
    mission.reason,
  );

  const pilot = await runPilotOps({
    missionId: mission.id,
    attemptAutoShip: true,
    root,
    actor,
  });
  check(
    'pilot_ops_neq_auto_ship',
    pilot.autoShipped === false &&
      pilot.status === 'denied' &&
      pilot.reason === PILOT_NEQ_AUTO_SHIP,
    pilot.reason,
  );

  const running = await probeRunningVerified({
    missionId: mission.id,
    heartbeatFresh: false,
    runtimeEvidencePresent: true,
    root,
    actor,
  });
  check(
    'running_verified_requires_heartbeat',
    running.state === 'DENIED' && running.reason === HEARTBEAT_REQUIRED_FOR_RUNNING,
    running.reason,
  );

  // F
  const renew = await recordRenewalRisk({
    customerId: 'c1',
    riskScore: 0.8,
    proofRefs: ['usage-drop'],
    attemptAutoRenew: true,
    root,
    actor,
  });
  check(
    'renewal_risk_neq_auto_renew',
    renew.autoRenewed === false && renew.reason === RENEWAL_NEQ_AUTO_RENEW,
    renew.reason,
  );

  const expand = await recordExpansionSignal({
    customerId: 'c1',
    opportunity: 'warehouse-module',
    proofRefs: ['seat-saturation'],
    attemptAutoCharge: true,
    root,
    actor,
  });
  check(
    'expansion_signal_neq_auto_charge',
    expand.autoCharged === false && expand.reason === EXPANSION_NEQ_AUTO_CHARGE,
    expand.reason,
  );

  // G
  const learning = await recordDecisionOutcomeLearning({
    decisionId: 'd1',
    outcomeId: 'o1',
    correlationObserved: true,
    claimCausation: true,
    root,
    actor,
  });
  check(
    'decision_outcome_correlation_neq_causation',
    learning.causationGuaranteed === false &&
      learning.status === 'denied' &&
      learning.reason === CORRELATION_NEQ_CAUSATION,
    learning.reason,
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

  // H
  const node = await createNeuralGrowthNode({
    kind: 'revenue',
    universeId: actor.universeId,
    sealed: true,
    root,
    actor,
    repoRoot,
  });
  const sealed = await accessSealedGrowthNode({
    nodeId: node.id,
    explicitGrant: false,
    root,
    actor,
  });
  check(
    'neural_growth_node_sealed_deny_by_default',
    sealed.status === 'denied' &&
      node.grantsAuthority === false &&
      sealed.reason === NEURAL_GROWTH_SEALED_DENIED,
    sealed.reason,
  );

  const offline = await probeOfflineGrowthNode({
    poweredAuthorizedNode: false,
    preferWaiting: true,
    root,
    actor,
  });
  check(
    'offline_without_powered_node_waiting_or_stopped',
    offline.state === 'WAITING_NODE' && offline.reason === OFFLINE_WAITING_OR_STOPPED,
    offline.reason,
  );

  const wedge = await evaluateWedgeFirstGate({
    wedgeProofPresent: false,
    attemptBroaderNetwork: true,
    root,
    actor,
  });
  check(
    'wedge_first_broader_network_gated',
    wedge.status === 'denied' && wedge.reason === WEDGE_FIRST_GATED,
    wedge.reason,
  );

  const cycle = await runGrowthOperatingSystemCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'runtime_cycle_all_required_stories',
    failedHops.length === 0 &&
      cycle.tipLand === false &&
      cycle.productionAuthorized === false &&
      cycle.publicLaunchAuthorized === false,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildGrowthOperatingSystemHealthReport({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'health_report_healthy',
    health.status === 'HEALTHY' && health.nextPhaseTitle === NEXT_PHASE_TITLE,
    `status=${health.status}`,
  );

  const honesty = growthOperatingSystemHonesty(repoRoot);
  const preds = predecessorMap(repoRoot);
  check(
    'honesty_and_predecessor_probe',
    honesty.banner === HONESTY_BANNER &&
      honesty.l4AutonomyEnabled === false &&
      preds.DS.tipProbe === 'PRESENT' &&
      preds.DR.tipProbe === 'PRESENT' &&
      preds.DQ.tipProbe === 'PRESENT' &&
      preds.DP.tipProbe === 'PRESENT',
    `predecessor=${honesty.predecessorLayer}; DS=${preds.DS.tipProbe}; DR=${preds.DR.tipProbe}; DQ=${preds.DQ.tipProbe}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-DT stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DT Growth Operating System stories passed');
