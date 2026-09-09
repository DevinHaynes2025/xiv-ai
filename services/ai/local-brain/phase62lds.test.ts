import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  openSalesWarRoom,
  probeStoryBeforeDashboard,
} from './ai-sales-war-room';
import {
  attemptAutoRenewOrCharge,
  recordRetentionSignal,
} from './customer-growth-retention-nervous-system';
import {
  attemptAutoAcceptDeal,
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
} from './revenue-intelligence-os-types';
import {
  buildRevenueIntelligenceOsHealthReport,
  runRevenueIntelligenceOsCycle,
} from './revenue-intelligence-os-runtime';
import {
  attemptChargeFromRecommendation,
  recordRevenueSignal,
} from './revenue-intelligence-signals';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lds-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DsActor = {
  kind: 'revenue_intelligence_curator',
  id: 'test-curator',
  orgId: 'org-ds',
  tenantId: 'tenant-ds',
  universeId: 'universe-ds',
};
const agentActor: DsActor = { ...actor, kind: 'agent', id: 'agent-1' };
const founderActor: DsActor = { ...actor, kind: 'founder', id: 'founder-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      DS_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DS_LOCKS.TIP_LAND === false &&
      DS_LOCKS.RECOMMENDATION_EQ_CHARGE === false &&
      DS_LOCKS.DEAL_SIM_EQ_VERIFIED_FACT === false &&
      DS_LOCKS.LAUNCH_GO_EQ_AUTO_SHIP === false &&
      DS_LOCKS.CONSCIOUSNESS_CLAIMED === false &&
      GITHUB_SOT_ISSUE === 136 &&
      GITLAB_COORDINATION_ISSUE === 70 &&
      REVENUE_INTELLIGENCE_OS_CYCLE.includes('deal_sim_neq_verified_fact'),
    'locks + SoT refs present',
  );

  const os = await bootstrapRevenueIntelligenceOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_revenue_intelligence_os',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.privateUniverse === true &&
      os.denyByDefault === true,
    `os=${os.id}; predecessor=${os.predecessorLayer}; dp=${os.dpSoftWired}`,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'predecessor_soft_wire_probe',
    preds.DP.tipProbe === 'PRESENT' && preds.DP.report === 'PRESENT',
    `DR=${preds.DR.tipProbe}/${preds.DR.report}; DQ=${preds.DQ.tipProbe}/${preds.DQ.report}; DP=${preds.DP.tipProbe}/${preds.DP.report}`,
  );

  const signal = await recordRevenueSignal({
    metricKind: 'path_to_cash',
    label: 'cash-path',
    value: 50000,
    root,
    actor,
  });
  const charge = await attemptChargeFromRecommendation({
    signalId: signal.id,
    root,
    actor: agentActor,
  });
  check(
    'sim_neq_fact__recommend_neq_charge',
    charge.status === 'denied' && signal.recommendationOnly === true,
    charge.reason,
  );

  const war = await openSalesWarRoom({
    dealLabel: 'deal-1',
    storyTitle: 'Enterprise path',
    storyNarrative: 'Story first, evidence second, dashboard last.',
    root,
    actor,
  });
  const story = await probeStoryBeforeDashboard({ sessionId: war.id, root, actor });
  check(
    'sales_war_room_story_before_dashboard',
    story.status === 'pass' && war.theaterOnly === false,
    story.reason,
  );

  const cadence = await scheduleCadenceItem({
    title: 'Exec cadence',
    rhythm: 'weekly',
    root,
    actor,
  });
  const cadenceDeny = await attemptConsequentialCadenceDecision({
    cadenceItemId: cadence.id,
    action: 'sign',
    root,
    actor: agentActor,
  });
  check(
    'executive_cadence_human_control_founder_gates',
    cadenceDeny.status === 'denied',
    cadenceDeny.reason,
  );

  const sim = await openDealSimulation({
    dealLabel: 'deal-1',
    batna: 'walk',
    walkAway: 10,
    target: 100,
    root,
    actor,
  });
  const simFact = await claimSimulationAsVerifiedFact({
    simulationId: sim.id,
    root,
    actor,
  });
  const concDeny = await attemptConcession({
    simulationId: sim.id,
    concessionNote: 'give discount',
    root,
    actor: agentActor,
  });
  const concOk = await attemptConcession({
    simulationId: sim.id,
    concessionNote: 'give discount',
    root,
    actor: founderActor,
  });
  const autoAccept = await attemptAutoAcceptDeal({
    simulationId: sim.id,
    root,
    actor: founderActor,
  });
  check(
    'deal_sim_neq_verified_fact',
    simFact.status === 'denied' && sim.verifiedOutcome === false,
    simFact.reason,
  );
  check(
    'negotiation_concession_needs_founder_gate',
    concDeny.status === 'denied' &&
      concOk.status === 'founder_approved_advisory' &&
      autoAccept.status === 'denied',
    `${concDeny.reason}; autoAccept=${autoAccept.reason}`,
  );

  const price = await recommendPrice({
    sku: 'sku-1',
    recommendedPrice: 99,
    marginEstimate: 0.4,
    root,
    actor,
  });
  const apply = await attemptApplyPrice({
    recommendationId: price.id,
    root,
    actor: agentActor,
  });
  check(
    'recommend_neq_apply_price',
    apply.status === 'denied' && price.applied === false,
    apply.reason,
  );

  const gate = await openLaunchGate({
    releaseLabel: 'r1',
    evidence: [
      { label: 'sec', state: 'PASS' },
      { label: 'cash', state: 'PASS' },
    ],
    root,
    actor,
  });
  const ship = await attemptAutoShip({ gateId: gate.id, root, actor: founderActor });
  check(
    'go_neq_ship',
    gate.verdict === 'GO' && ship.status === 'denied' && gate.autoShip === false,
    ship.reason,
  );

  const graph = await openCoverageGraph({
    dimensionCardinalities: { persona: 100, industry: 50, geography: 20 },
    root,
    actor,
  });
  const sprint = await selectActiveSprintStories({
    graphId: graph.id,
    storyKeys: Array.from({ length: 40 }, (_, i) => `s${i}`),
    root,
    actor,
  });
  const mass = await attemptSpawnMillionTickets({
    graphId: graph.id,
    root,
    actor,
  });
  check(
    'million_story_not_mass_tickets',
    graph.ticketsCreated === 0 &&
      mass.ticketsCreated === 0 &&
      mass.status === 'denied' &&
      sprint.status === 'denied_unbounded' &&
      sprint.selectedStoryKeys.length <= 32,
    mass.reason,
  );

  const ret = await recordRetentionSignal({
    kind: 'expansion',
    customerLabel: 'c1',
    score: 0.7,
    root,
    actor,
  });
  const renew = await attemptAutoRenewOrCharge({
    signalId: ret.id,
    action: 'auto_charge',
    root,
    actor: agentActor,
  });
  check(
    'retention_neq_auto_renew_charge',
    renew.status === 'denied' && ret.autoRenew === false,
    renew.reason,
  );

  const sealed = await attemptSealedAccessByLabelAlone({
    resourceLabel: 'founder-sealed',
    root,
    actor: agentActor,
  });
  check('sealed_deny_by_label_alone', sealed.status === 'denied', sealed.reason);

  const unenrolled = await probeProviderEnrollment({
    providerId: 'stripe-like',
    enrolled: false,
    root,
    actor,
  });
  check(
    'unenrolled_unavailable',
    unenrolled.status === 'UNAVAILABLE',
    unenrolled.reason,
  );

  const offline = await probeOfflineAuthorizedNode({
    poweredAuthorizedNodePresent: false,
    root,
    actor,
  });
  check(
    'offline_waiting_node',
    offline.status === 'WAITING_NODE' || offline.status === 'OFFLINE_STOPPED',
    offline.reason,
  );

  const honesty = revenueIntelligenceOsHonesty(repoRoot);
  check(
    'honesty_surface',
    honesty.dbCandidatesApplied === false &&
      honesty.nextPhaseTitle.startsWith('62L-DT') &&
      NEXT_PHASE_TITLE === honesty.nextPhaseTitle,
    `next=${honesty.nextPhaseTitle}`,
  );

  const cycle = await runRevenueIntelligenceOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'runtime_cycle_all_hops',
    failedHops.length === 0 && cycle.hops.length === REVENUE_INTELLIGENCE_OS_CYCLE.length,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildRevenueIntelligenceOsHealthReport({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'health_report_healthy',
    health.status === 'HEALTHY' && health.dbCandidatesApplied === false,
    `status=${health.status}; hopCount=${health.hopCount}`,
  );

  // NOT_APPLIED SQL candidate exists as documentation only
  check(
    'db_candidates_not_applied',
    DS_LOCKS.DB_CANDIDATES_APPLIED === false && DS_LOCKS.LIVE_SUPABASE_APPLY === false,
    'DB candidates NOT_APPLIED; no live Supabase',
  );
} catch (error) {
  failures.push(`exception: ${(error as Error).message}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error('FAIL 62L-DS stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log(`OK 62L-DS — ${failures.length} failures`);
