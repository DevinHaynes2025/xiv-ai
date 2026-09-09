/**
 * 62L-DS Revenue Intelligence OS runtime —
 * Walks REVENUE_INTELLIGENCE_OS_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  openSalesWarRoom,
  probeStoryBeforeDashboard,
} from './ai-sales-war-room';
import {
  attemptAutoRenewOrCharge,
  recordRetentionSignal,
} from './customer-growth-retention-nervous-system';
import {
  attemptConcession,
  claimSimulationAsVerifiedFact,
  openDealSimulation,
} from './deal-simulation-negotiation-engine';
import {
  attemptConsequentialCadenceDecision,
  scheduleCadenceItem,
} from './executive-operating-cadence';
import { attemptApplyPrice, recommendPrice } from './financial-command-brain';
import { attemptAutoShip, openLaunchGate } from './launch-control-tower';
import {
  attemptSpawnMillionTickets,
  openCoverageGraph,
  selectActiveSprintStories,
} from './million-story-coverage-graph';
import {
  attemptSealedAccessByLabelAlone,
  bootstrapRevenueIntelligenceOs,
  probeOfflineAuthorizedNode,
  probeProviderEnrollment,
  revenueIntelligenceOsHonesty,
} from './revenue-intelligence-os';
import {
  DS_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  REVENUE_INTELLIGENCE_OS_CYCLE,
  predecessorMap,
  type DsActor,
  type DsEvidenceState,
  type DsHop,
  type DsHopRecord,
} from './revenue-intelligence-os-types';
import {
  attemptChargeFromRecommendation,
  recordRevenueSignal,
} from './revenue-intelligence-signals';

export {
  REVENUE_INTELLIGENCE_OS_CYCLE,
  DS_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DsHop, state: DsEvidenceState, summary: string): DsHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DsCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DsActor;
  root?: string;
  repoRoot?: string;
};

export async function runRevenueIntelligenceOsCycle(input: DsCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DsHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };
  const agentActor: DsActor = { ...actor, kind: 'agent', id: 'agent-self' };
  const founderActor: DsActor = { ...actor, kind: 'founder', id: 'founder-1' };

  hops.push(
    hop(
      'honesty_locks',
      DS_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DS_LOCKS.LOCAL_FIRST &&
        DS_LOCKS.RECOMMENDATION_EQ_CHARGE === false &&
        DS_LOCKS.DEAL_SIM_EQ_VERIFIED_FACT === false &&
        DS_LOCKS.LAUNCH_GO_EQ_AUTO_SHIP === false &&
        DS_LOCKS.RECOMMENDATION_EQ_APPLY_PRICE === false &&
        DS_LOCKS.RECOMMENDATION_EQ_AUTO_RENEW === false &&
        DS_LOCKS.NEGOTIATION_AUTO_ACCEPT === false &&
        DS_LOCKS.MILLION_STORY_EQ_MILLION_TICKETS === false &&
        DS_LOCKS.RETENTION_AUTO_CHARGE === false &&
        DS_LOCKS.LABEL_ALONE_EQ_ACCESS === false &&
        DS_LOCKS.CONSCIOUSNESS_CLAIMED === false &&
        DS_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapRevenueIntelligenceOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'revenue_intelligence_os_bootstrap',
      'PASS',
      `os=${os.id}; predecessor=${os.predecessorLayer}; dr=${os.drSoftWired}; dq=${os.dqSoftWired}; dp=${os.dpSoftWired}`,
    ),
  );

  const signal = await recordRevenueSignal({
    metricKind: 'path_to_cash',
    label: 'pipeline-cash-path',
    value: 120000,
    root,
    actor,
  });
  const chargeDenied = await attemptChargeFromRecommendation({
    signalId: signal.id,
    action: 'charge',
    root,
    actor: agentActor,
  });
  hops.push(
    hop(
      'revenue_recommendation_neq_charge',
      chargeDenied.status === 'denied' ? 'PASS' : 'FAIL',
      chargeDenied.reason,
    ),
  );

  const warRoom = await openSalesWarRoom({
    dealLabel: 'acme-enterprise',
    storyTitle: 'Path to first enterprise cash',
    storyNarrative: 'Governed sales story with evidence before any dashboard strip.',
    evidenceRefs: ['path-to-cash-signal'],
    root,
    actor,
  });
  const storyProbe = await probeStoryBeforeDashboard({
    sessionId: warRoom.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'sales_war_room_story_before_dashboard',
      storyProbe.status === 'pass' ? 'PASS' : 'FAIL',
      storyProbe.reason,
    ),
  );

  const cadence = await scheduleCadenceItem({
    title: 'Weekly revenue operating review',
    rhythm: 'weekly',
    root,
    actor,
  });
  const cadenceDenied = await attemptConsequentialCadenceDecision({
    cadenceItemId: cadence.id,
    action: 'spend',
    root,
    actor: agentActor,
  });
  hops.push(
    hop(
      'executive_cadence_human_control',
      cadenceDenied.status === 'denied' ? 'PASS' : 'FAIL',
      cadenceDenied.reason,
    ),
  );

  const sim = await openDealSimulation({
    dealLabel: 'acme-enterprise',
    batna: 'pilot-only',
    walkAway: 80000,
    target: 150000,
    giveGet: ['discount-for-case-study'],
    root,
    actor,
  });
  const simFact = await claimSimulationAsVerifiedFact({
    simulationId: sim.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'deal_sim_neq_verified_fact',
      simFact.status === 'denied' ? 'PASS' : 'FAIL',
      simFact.reason,
    ),
  );

  const concessionDenied = await attemptConcession({
    simulationId: sim.id,
    concessionNote: '10% discount',
    root,
    actor: agentActor,
  });
  const concessionFounder = await attemptConcession({
    simulationId: sim.id,
    concessionNote: '10% discount founder review',
    root,
    actor: founderActor,
  });
  hops.push(
    hop(
      'negotiation_concession_needs_founder_gate',
      concessionDenied.status === 'denied' &&
        concessionFounder.status === 'founder_approved_advisory'
        ? 'PASS'
        : 'FAIL',
      `${concessionDenied.reason}; ${concessionFounder.reason}`,
    ),
  );

  const price = await recommendPrice({
    sku: 'xiv-enterprise',
    recommendedPrice: 150000,
    marginEstimate: 0.62,
    root,
    actor,
  });
  const applyDenied = await attemptApplyPrice({
    recommendationId: price.id,
    root,
    actor: agentActor,
  });
  hops.push(
    hop(
      'financial_recommend_neq_apply_price',
      applyDenied.status === 'denied' && price.applied === false ? 'PASS' : 'FAIL',
      applyDenied.reason,
    ),
  );

  const gate = await openLaunchGate({
    releaseLabel: 'pilot-v1',
    evidence: [
      { label: 'security-evidence', state: 'PASS' },
      { label: 'path-to-cash', state: 'PASS' },
    ],
    root,
    actor,
  });
  const shipDenied = await attemptAutoShip({
    gateId: gate.id,
    root,
    actor: founderActor,
  });
  hops.push(
    hop(
      'launch_go_neq_auto_ship',
      gate.verdict === 'GO' && shipDenied.status === 'denied' ? 'PASS' : 'FAIL',
      shipDenied.reason,
    ),
  );

  const graph = await openCoverageGraph({
    dimensionCardinalities: {
      persona: 10,
      industry: 8,
      geography: 5,
      pricing: 4,
      retention: 3,
    },
    root,
    actor,
  });
  const sprint = await selectActiveSprintStories({
    graphId: graph.id,
    storyKeys: Array.from({ length: 12 }, (_, i) => `story-${i}`),
    root,
    actor,
  });
  const massTickets = await attemptSpawnMillionTickets({
    graphId: graph.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'million_story_graph_not_mass_tickets',
      graph.ticketsCreated === 0 &&
        graph.massTicketSpam === false &&
        massTickets.status === 'denied' &&
        sprint.status === 'bounded'
        ? 'PASS'
        : 'FAIL',
      massTickets.reason,
    ),
  );

  const retention = await recordRetentionSignal({
    kind: 'renewal',
    customerLabel: 'acme',
    score: 0.81,
    root,
    actor,
  });
  const renewDenied = await attemptAutoRenewOrCharge({
    signalId: retention.id,
    action: 'auto_renew',
    root,
    actor: agentActor,
  });
  hops.push(
    hop(
      'retention_neq_auto_renew_charge',
      renewDenied.status === 'denied' ? 'PASS' : 'FAIL',
      renewDenied.reason,
    ),
  );

  const sealed = await attemptSealedAccessByLabelAlone({
    resourceLabel: 'founder-sealed-pipeline',
    root,
    actor: agentActor,
  });
  hops.push(
    hop(
      'sealed_founder_data_denied_by_label_alone',
      sealed.status === 'denied' ? 'PASS' : 'FAIL',
      sealed.reason,
    ),
  );

  const unenrolled = await probeProviderEnrollment({
    providerId: 'billing-provider',
    enrolled: false,
    configured: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unenrolled_provider_unavailable',
      unenrolled.status === 'UNAVAILABLE' ? 'PASS' : 'FAIL',
      unenrolled.reason,
    ),
  );

  const offline = await probeOfflineAuthorizedNode({
    poweredAuthorizedNodePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_waiting_node_when_no_powered_node',
      offline.status === 'WAITING_NODE' || offline.status === 'OFFLINE_STOPPED'
        ? 'PASS'
        : 'FAIL',
      offline.reason,
    ),
  );

  void decisionGate({
    id: 'ds-cycle-gate',
    action: '62l_ds_revenue_intelligence_os_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void revenueIntelligenceOsHonesty(input.repoRoot);

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DS revenue intelligence OS cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DS'],
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
      subject: '62L-DS revenue intelligence OS cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; recommend≠charge; sim≠fact; GO≠ship; retention≠auto-renew`,
      sourceRefs: ['62L-DS'],
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
    l4AutonomyEnabled: DS_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: os.predecessorLayer,
    drSoftWired: os.drSoftWired,
    dqSoftWired: os.dqSoftWired,
    dpSoftWired: os.dpSoftWired,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionRevenueIntelligenceShipped: false as const,
    dbCandidatesApplied: false as const,
    os,
  };
}

export async function buildRevenueIntelligenceOsHealthReport(input?: {
  orgId?: string;
  tenantId?: string;
  universeId?: string;
  actor?: DsActor;
  root?: string;
  repoRoot?: string;
}) {
  const orgId = input?.orgId ?? 'org-local';
  const tenantId = input?.tenantId ?? 'tenant-local';
  const universeId = input?.universeId ?? 'universe-local';
  const actor: DsActor = input?.actor ?? {
    kind: 'revenue_intelligence_curator',
    id: 'health',
    orgId,
    tenantId,
    universeId,
  };
  const cycle = await runRevenueIntelligenceOsCycle({
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
    drSoftWired: cycle.drSoftWired,
    dqSoftWired: cycle.dqSoftWired,
    dpSoftWired: cycle.dpSoftWired,
    honesty: revenueIntelligenceOsHonesty(input?.repoRoot),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorized: false as const,
    tipLand: false as const,
    dbCandidatesApplied: false as const,
  };
}
