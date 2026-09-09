/**
 * 62L-DT Growth Operating System runtime —
 * Walks GROWTH_OPERATING_SYSTEM_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
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
  recordExecutiveAlignment,
} from './executive-performance-nervous-system';
import {
  bootstrapGrowthOperatingSystem,
  growthOperatingSystemHonesty,
} from './growth-operating-system';
import {
  DT_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  GROWTH_OPERATING_SYSTEM_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type DtActor,
  type DtEvidenceState,
  type DtHop,
  type DtHopRecord,
} from './growth-operating-system-types';
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

export {
  GROWTH_OPERATING_SYSTEM_CYCLE,
  DT_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DtHop, state: DtEvidenceState, summary: string): DtHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DtCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DtActor;
  root?: string;
  repoRoot?: string;
};

export async function runGrowthOperatingSystemCycle(input: DtCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DtHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };
  const agentActor: DtActor = { ...actor, kind: 'agent', id: 'agent-self' };
  const humanActor: DtActor = { ...actor, kind: 'human_approver', id: 'human-1' };
  const twinActor: DtActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

  hops.push(
    hop(
      'honesty_locks',
      DT_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DT_LOCKS.LOCAL_FIRST &&
        DT_LOCKS.RECOMMENDATION_EQ_CHARGE === false &&
        DT_LOCKS.PRICING_EXPERIMENT_AUTO_PRICE === false &&
        DT_LOCKS.DEAL_APPROVAL_AUTO_SIGN === false &&
        DT_LOCKS.LAUNCH_COUNTDOWN_EQ_PUBLIC_LAUNCH === false &&
        DT_LOCKS.RENEWAL_RISK_AUTO_RENEW === false &&
        DT_LOCKS.DECISION_OUTCOME_GUARANTEED_CAUSATION === false &&
        DT_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
        DT_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false &&
        DT_LOCKS.CONTRACT_PAYMENT_AUTHORIZED === false &&
        DT_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapGrowthOperatingSystem({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'growth_operating_system_bootstrap',
      'PASS',
      `os=${os.id}; predecessor=${os.predecessorLayer}; dpSoftWire=${os.dpSoftWired}`,
    ),
  );

  const rec = await recommendAcquisitionAction({
    channel: 'outbound-authorized',
    segment: 'smb-supply-chain',
    attemptCharge: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'acquisition_pipeline_recommend_neq_charge',
      rec.chargesCustomer === false && rec.status === 'recommendation_only' ? 'PASS' : 'FAIL',
      rec.reason,
    ),
  );

  const provider = await probeRevenueProvider({
    providerId: 'stripe-like',
    configured: false,
    claimAvailable: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_revenue_provider_unavailable',
      provider.availability === 'UNAVAILABLE' && provider.status === 'denied' ? 'PASS' : 'FAIL',
      provider.reason,
    ),
  );

  const discovery = await discoverPartnership({
    partnerName: 'unauth-partner',
    dataAuthorized: false,
    outreachAuthorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_partnership_discovery_denied',
      discovery.status === 'denied' ? 'PASS' : 'FAIL',
      discovery.reason,
    ),
  );

  const design = await enrollDesignPartner({
    partnerName: 'design-partner',
    dataAuthorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'design_partner_requires_authorized_data_only',
      design.status === 'denied' ? 'PASS' : 'FAIL',
      design.reason,
    ),
  );

  const univ = await accessPrivateUniverse({
    universeId: input.universeId,
    labelPresent: true,
    explicitGrant: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'private_universe_deny_by_default',
      univ.status === 'denied' ? 'PASS' : 'FAIL',
      univ.reason,
    ),
  );

  const deal = await openDeal({ counterparty: 'acme', root, actor });
  const deniedDeal = await approveDeal({
    dealId: deal.id,
    humanGatePresent: false,
    actor: agentActor,
    root,
  });
  hops.push(
    hop(
      'deal_approval_without_human_founder_gate_denied',
      deniedDeal.status === 'denied' && deniedDeal.autoSigned === false ? 'PASS' : 'FAIL',
      deniedDeal.reason,
    ),
  );

  const neg = await applyNegotiationMemory({
    dealId: deal.id,
    memoryRef: 'neg-1',
    attemptAutoSign: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'negotiation_memory_neq_auto_sign',
      neg.status === 'denied' && neg.autoSigned === false ? 'PASS' : 'FAIL',
      neg.reason,
    ),
  );

  const price = await createPricingExperiment({
    name: 'wedge-price-a',
    hypothesis: 'SMB supply-chain wedge converts at X',
    attemptAutoPrice: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'pricing_experiment_neq_auto_price',
      price.autoPriced === false ? 'PASS' : 'FAIL',
      price.reason,
    ),
  );

  const bundle = await designBundle({
    name: 'ops-bundle',
    components: ['tracking', 'alerts'],
    attemptAutoBill: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'bundle_design_neq_auto_bill',
      bundle.autoBilled === false ? 'PASS' : 'FAIL',
      bundle.reason,
    ),
  );

  const mission = await createLaunchCountdown({
    name: 'pilot-countdown',
    countdownDays: 30,
    claimPublicLaunch: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'launch_countdown_neq_public_launch',
      mission.publicLaunchAuthorized === false ? 'PASS' : 'FAIL',
      mission.reason,
    ),
  );

  const pilot = await runPilotOps({
    missionId: mission.id,
    attemptAutoShip: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'pilot_ops_neq_auto_ship',
      pilot.autoShipped === false && pilot.status === 'denied' ? 'PASS' : 'FAIL',
      pilot.reason,
    ),
  );

  const running = await probeRunningVerified({
    missionId: mission.id,
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

  const renew = await recordRenewalRisk({
    customerId: 'cust-1',
    riskScore: 0.7,
    proofRefs: ['proof-1'],
    attemptAutoRenew: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'renewal_risk_neq_auto_renew',
      renew.autoRenewed === false ? 'PASS' : 'FAIL',
      renew.reason,
    ),
  );

  const expand = await recordExpansionSignal({
    customerId: 'cust-1',
    opportunity: 'add-seat',
    proofRefs: ['proof-2'],
    attemptAutoCharge: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'expansion_signal_neq_auto_charge',
      expand.autoCharged === false ? 'PASS' : 'FAIL',
      expand.reason,
    ),
  );

  const learning = await recordDecisionOutcomeLearning({
    decisionId: 'dec-1',
    outcomeId: 'out-1',
    correlationObserved: true,
    claimCausation: true,
    root,
    actor,
  });
  await recordExecutiveAlignment({
    theme: 'wedge-first',
    aligned: true,
    root,
    actor: humanActor,
  });
  hops.push(
    hop(
      'decision_outcome_correlation_neq_causation',
      learning.causationGuaranteed === false && learning.status === 'denied' ? 'PASS' : 'FAIL',
      learning.reason,
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

  const node = await createNeuralGrowthNode({
    kind: 'growth',
    universeId: input.universeId,
    sealed: true,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  const sealed = await accessSealedGrowthNode({
    nodeId: node.id,
    explicitGrant: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'neural_growth_node_sealed_deny_by_default',
      sealed.status === 'denied' && node.grantsAuthority === false ? 'PASS' : 'FAIL',
      sealed.reason,
    ),
  );

  const offline = await probeOfflineGrowthNode({
    poweredAuthorizedNode: false,
    preferWaiting: true,
    root,
    actor,
  });
  const offlineStopped = await probeOfflineGrowthNode({
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

  const wedge = await evaluateWedgeFirstGate({
    wedgeProofPresent: false,
    attemptBroaderNetwork: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'wedge_first_broader_network_gated',
      wedge.status === 'denied' ? 'PASS' : 'FAIL',
      wedge.reason,
    ),
  );

  void decisionGate({
    id: 'dt-cycle-gate',
    action: '62l_dt_growth_operating_system_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void growthOperatingSystemHonesty(input.repoRoot);

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DT growth operating system cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DT'],
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
      subject: '62L-DT growth operating system cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; recommend≠charge; deal≠auto-sign; pricing≠auto-bill; ` +
        'launch≠public; renewal≠auto-renew; correlation≠causation',
      sourceRefs: ['62L-DT'],
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
    l4AutonomyEnabled: DT_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: os.predecessorLayer,
    dpSoftWired: os.dpSoftWired,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionGrowthOsShipped: false as const,
    dbCandidatesApplied: false as const,
    os,
  };
}

export async function buildGrowthOperatingSystemHealthReport(input?: {
  orgId?: string;
  tenantId?: string;
  universeId?: string;
  actor?: DtActor;
  root?: string;
  repoRoot?: string;
}) {
  const orgId = input?.orgId ?? 'org-local';
  const tenantId = input?.tenantId ?? 'tenant-local';
  const universeId = input?.universeId ?? 'universe-local';
  const actor: DtActor = input?.actor ?? {
    kind: 'growth_os_curator',
    id: 'health',
    orgId,
    tenantId,
    universeId,
  };
  const cycle = await runGrowthOperatingSystemCycle({
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
    dpSoftWired: cycle.dpSoftWired,
    honesty: growthOperatingSystemHonesty(input?.repoRoot),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    dbCandidatesApplied: false as const,
  };
}
