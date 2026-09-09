import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  expandEnterpriseNeuralNode,
  pulseNeuralNodeHeartbeat,
  verifyNeuralNodeRunning,
} from './enterprise-neural-node-expansion';
import {
  accessSealedFounderData,
  bootstrapEnterpriseNervousSystemOs,
  enterpriseNervousRevenueCommandOsHonesty,
} from './enterprise-nervous-revenue-command-os';
import {
  BUSINESS_LAW_DISCLAIMER,
  BUSINESS_LAW_NOT_LEGAL_ADVICE,
  CFO_LIVE_MUTATION_DENIED,
  CONSEQUENTIAL_DEAL_DENIED,
  DR_LOCKS,
  ENTERPRISE_NERVOUS_REVENUE_COMMAND_CYCLE,
  HONESTY_BANNER,
  LAUNCH_NO_FULL_PROD_AUTH,
  LEGALSHIELD_UNAVAILABLE,
  MAX_ACTIVE_SPRINT_STORIES,
  NEXT_PHASE_TITLE,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  SALES_SIGN_CHARGE_DEPLOY_DENIED,
  SEALED_FOUNDER_DATA_DENIED,
  SPRINT_SELECTION_BOUNDED,
  STORY_GRAPH_NO_1M_TICKETS,
  VIRTUAL_CEO_IMPERSONATION_DENIED,
  predecessorMap,
  type DrActor,
} from './enterprise-nervous-revenue-command-types';
import {
  buildEnterpriseNervousRevenueCommandHealthReport,
  runEnterpriseNervousRevenueCommandCycle,
} from './enterprise-nervous-revenue-command-runtime';
import {
  attemptExecutiveAction,
  registerExecutiveAgent,
} from './executive-ai-suite';
import {
  attemptSpawnMillionTickets,
  bootstrapUserStoryGraph,
  computeLogicalCombinationCount,
  DEFAULT_STORY_AXES,
  selectActiveSprint,
} from './generative-user-story-graph';
import {
  attemptMarkFullOsProductionAuthorized,
  bootstrapLaunchReadinessProgram,
} from './launch-readiness-30d-program';
import {
  attemptCockpitExecute,
  openNegotiationCockpit,
} from './negotiation-cockpit';
import {
  attemptSalesCorpsAction,
  registerSalesCorpsAgent,
} from './negotiation-sales-agent-corps';
import { openRevenueCommandSurface } from './revenue-command-center';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldr-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DrActor = {
  kind: 'enterprise_nervous_curator',
  id: 'test-curator',
  orgId: 'org-dr',
  tenantId: 'tenant-dr',
  universeId: 'universe-dr',
};
const salesActor: DrActor = { ...actor, kind: 'negotiation', id: 'neg-1' };
const vceoActor: DrActor = { ...actor, kind: 'virtual_ceo', id: 'vceo-1' };
const cfoActor: DrActor = { ...actor, kind: 'cfo', id: 'cfo-1' };
const founderActor: DrActor = { ...actor, kind: 'founder', id: 'founder-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      DR_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DR_LOCKS.TIP_LAND === false &&
      DR_LOCKS.AGENTS_CAN_CHARGE === false &&
      DR_LOCKS.AGENTS_CAN_SIGN_CONTRACTS === false &&
      DR_LOCKS.AGENTS_CAN_DEPLOY_PRODUCTION === false &&
      DR_LOCKS.VIRTUAL_CEO_EQ_FOUNDER === false &&
      DR_LOCKS.BUSINESS_LAW_EQ_ATTORNEY === false &&
      DR_LOCKS.FULL_OS_PRODUCTION_AUTHORIZED_IN_30_DAYS === false &&
      DR_LOCKS.MILLION_STORY_EQ_MILLION_TICKETS === false &&
      ENTERPRISE_NERVOUS_REVENUE_COMMAND_CYCLE.includes(
        'consequential_deal_action_without_founder_approval_denied',
      ) &&
      NEXT_PHASE_TITLE.startsWith('62L-DS'),
    'locks + cycle + next title present',
  );

  const os = await bootstrapEnterpriseNervousSystemOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  const rcc = await openRevenueCommandSurface({
    dealLabel: 'enterprise-pilot',
    root,
    actor,
  });
  check(
    'bootstrap_enterprise_nervous_system',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      rcc.recommendationOnly === true &&
      rcc.executableClose === false,
    `os=${os.id}; predecessor=${os.predecessorLayer}`,
  );

  const sales = await registerSalesCorpsAgent({
    role: 'account_executive',
    root,
    actor: salesActor,
  });
  const sign = await attemptSalesCorpsAction({
    agentId: sales.id,
    action: 'sign_contract',
    founderGatePresent: false,
    root,
    actor: salesActor,
  });
  const charge = await attemptSalesCorpsAction({
    agentId: sales.id,
    action: 'charge_customer',
    founderGatePresent: false,
    root,
    actor: salesActor,
  });
  const deploy = await attemptSalesCorpsAction({
    agentId: sales.id,
    action: 'deploy_production',
    founderGatePresent: false,
    root,
    actor: salesActor,
  });
  check(
    'sales_negotiation_cannot_sign_charge_deploy_without_founder_gate',
    sign.status === 'denied' &&
      charge.status === 'denied' &&
      deploy.status === 'denied' &&
      sign.reason === SALES_SIGN_CHARGE_DEPLOY_DENIED &&
      charge.reason === SALES_SIGN_CHARGE_DEPLOY_DENIED &&
      deploy.reason === SALES_SIGN_CHARGE_DEPLOY_DENIED,
    sign.reason,
  );

  const vceo = await registerExecutiveAgent({
    role: 'virtual_ceo',
    root,
    actor: vceoActor,
  });
  const impersonate = await attemptExecutiveAction({
    agentId: vceo.id,
    action: 'impersonate_founder',
    root,
    actor: vceoActor,
  });
  const selfApprove = await attemptExecutiveAction({
    agentId: vceo.id,
    action: 'approve_consequential',
    root,
    actor: vceoActor,
  });
  check(
    'virtual_ceo_cannot_impersonate_founder_or_self_approve',
    impersonate.status === 'denied' &&
      selfApprove.status === 'denied' &&
      impersonate.reason === VIRTUAL_CEO_IMPERSONATION_DENIED &&
      selfApprove.reason === VIRTUAL_CEO_IMPERSONATION_DENIED &&
      vceo.isFounder === false,
    impersonate.reason,
  );

  const law = await registerExecutiveAgent({
    role: 'business_law',
    root,
    actor,
  });
  const legal = await attemptExecutiveAction({
    agentId: law.id,
    action: 'legal_research',
    root,
    actor: { ...actor, kind: 'business_law', id: 'law-1' },
  });
  check(
    'business_law_output_not_legal_advice',
    legal.reason === BUSINESS_LAW_NOT_LEGAL_ADVICE &&
      Boolean(legal.disclaimer?.includes('NOT LEGAL ADVICE')) &&
      legal.disclaimer === BUSINESS_LAW_DISCLAIMER &&
      law.isAttorney === false,
    legal.reason,
  );

  const shield = await attemptExecutiveAction({
    agentId: law.id,
    action: 'legalshield_probe',
    root,
    actor,
  });
  check(
    'legalshield_unconfigured_unavailable',
    shield.status === 'unavailable' && shield.reason === LEGALSHIELD_UNAVAILABLE,
    shield.reason,
  );

  const cockpit = await openNegotiationCockpit({
    dealId: 'deal-dr',
    batna: 'status-quo',
    targetRange: { low: 100, high: 150 },
    walkAway: 90,
    root,
    actor: salesActor,
  });
  const execDeal = await attemptCockpitExecute({
    sessionId: cockpit.id,
    surface: 'batna',
    founderGatePresent: false,
    root,
    actor: salesActor,
  });
  const close = await attemptSalesCorpsAction({
    agentId: sales.id,
    action: 'close_deal',
    founderGatePresent: false,
    root,
    actor: salesActor,
  });
  check(
    'consequential_deal_action_without_founder_approval_denied',
    cockpit.advisoryUntilFounderApproval === true &&
      cockpit.executable === false &&
      execDeal.status === 'denied' &&
      execDeal.reason === CONSEQUENTIAL_DEAL_DENIED &&
      close.status === 'denied' &&
      close.reason === CONSEQUENTIAL_DEAL_DENIED,
    `${execDeal.reason};${close.reason}`,
  );

  const launch = await bootstrapLaunchReadinessProgram({ root, actor });
  const fullAuth = await attemptMarkFullOsProductionAuthorized({
    programId: launch.id,
    root,
    actor: founderActor,
  });
  check(
    'launch_readiness_cannot_mark_full_os_production_authorized',
    launch.dayHorizon === 30 &&
      launch.fullOsProductionAuthorized === false &&
      launch.productionAuthorized === false &&
      fullAuth.status === 'denied' &&
      fullAuth.reason === LAUNCH_NO_FULL_PROD_AUTH,
    fullAuth.reason,
  );

  const graph = await bootstrapUserStoryGraph({ root, actor });
  const logical = computeLogicalCombinationCount(DEFAULT_STORY_AXES);
  const spawn = await attemptSpawnMillionTickets({
    graphId: graph.id,
    root,
    actor,
  });
  check(
    'user_story_graph_enumerates_without_spawning_1m_tickets',
    logical >= 1_000_000 &&
      graph.logicalCombinationCount >= 1_000_000 &&
      graph.materializedTicketCount === 0 &&
      spawn.materializedTicketCount === 0 &&
      spawn.reason === STORY_GRAPH_NO_1M_TICKETS,
    `logical=${graph.logicalCombinationCount}; tickets=${spawn.materializedTicketCount}`,
  );

  const oversized = Array.from({ length: MAX_ACTIVE_SPRINT_STORIES + 40 }, () => ({
    persona: 'cro',
    industry: 'saas',
    geography: 'na',
    device: 'desktop',
    agent: 'sdr',
    integration: 'crm',
    security: 'deny_default',
    authority: 'recommend',
    pricing: 'pilot',
    offline_online: 'hybrid',
    failure: 'timeout',
  }));
  const sprint = await selectActiveSprint({
    graphId: graph.id,
    coordinates: oversized,
    root,
    actor,
  });
  check(
    'active_sprint_selection_bounded',
    sprint.status === 'bounded' &&
      sprint.sprint.length === MAX_ACTIVE_SPRINT_STORIES &&
      sprint.sprint.every((s) => s.ticketMaterialized === false) &&
      sprint.reason === SPRINT_SELECTION_BOUNDED,
    `${sprint.reason};n=${sprint.sprint.length}`,
  );

  const cfo = await registerExecutiveAgent({ role: 'cfo', root, actor: cfoActor });
  const bank = await attemptExecutiveAction({
    agentId: cfo.id,
    action: 'bank_transfer',
    root,
    actor: cfoActor,
  });
  const liveCharge = await attemptExecutiveAction({
    agentId: cfo.id,
    action: 'live_charge',
    root,
    actor: cfoActor,
  });
  check(
    'cfo_cannot_execute_live_bank_charge_mutations',
    bank.status === 'denied' &&
      liveCharge.status === 'denied' &&
      bank.reason === CFO_LIVE_MUTATION_DENIED &&
      liveCharge.reason === CFO_LIVE_MUTATION_DENIED,
    bank.reason,
  );

  const node = await expandEnterpriseNeuralNode({
    label: 'exec-route',
    routeKind: 'executive',
    materialize: true,
    root,
    actor,
  });
  const noHb = await verifyNeuralNodeRunning({
    nodeId: node.node.id,
    root,
    actor,
  });
  await pulseNeuralNodeHeartbeat({ nodeId: node.node.id, root, actor });
  const withHb = await verifyNeuralNodeRunning({
    nodeId: node.node.id,
    root,
    actor,
  });
  check(
    'agent_without_heartbeat_not_running_verified',
    noHb.status !== 'RUNNING_VERIFIED' &&
      noHb.reason === NO_HEARTBEAT_NOT_RUNNING_VERIFIED &&
      withHb.status === 'RUNNING_VERIFIED',
    `${noHb.reason};after=${withHb.status}`,
  );

  const sealed = await accessSealedFounderData({
    label: 'founder-sealed-notes',
    claimedSealedGrant: false,
    root,
    actor: salesActor,
  });
  check(
    'sealed_founder_data_denied_to_sales_corps_by_label_alone',
    sealed.status === 'denied' && sealed.reason === SEALED_FOUNDER_DATA_DENIED,
    sealed.reason,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'predecessor_gates_dq_dp_do_present',
    preds.DQ.tipProbe === 'PRESENT' &&
      preds.DP.tipProbe === 'PRESENT' &&
      preds.DO.tipProbe === 'PRESENT' &&
      preds.DN.tipProbe === 'PRESENT',
    `DQ=${preds.DQ.tipProbe};DP=${preds.DP.tipProbe};DO=${preds.DO.tipProbe}`,
  );

  const cycle = await runEnterpriseNervousRevenueCommandCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'runtime_cycle_passes',
    cycle.passed === true && cycle.failed.length === 0,
    `hops=${cycle.hops.length}; failed=${cycle.failed.map((f) => f.hop).join(',') || 'none'}`,
  );

  const health = await buildEnterpriseNervousRevenueCommandHealthReport({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const honesty = enterpriseNervousRevenueCommandOsHonesty(repoRoot);
  check(
    'honesty_export_and_health',
    health.passed === true &&
      honesty.l4AutonomyEnabled === false &&
      honesty.tipLand === false &&
      honesty.dqSoftWired === true &&
      honesty.dpSoftWired === true,
    `health.passed=${health.passed}; dqSoftWired=${honesty.dqSoftWired}; dpSoftWired=${honesty.dpSoftWired}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL 62L-DR (${failures.length})`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DR enterprise nervous revenue command');
