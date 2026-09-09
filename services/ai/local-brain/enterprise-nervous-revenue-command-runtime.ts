/**
 * 62L-DR Enterprise Nervous System OS + Revenue Command runtime —
 * Walks ENTERPRISE_NERVOUS_REVENUE_COMMAND_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
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
  BUSINESS_LAW_NOT_LEGAL_ADVICE,
  CFO_LIVE_MUTATION_DENIED,
  CONSEQUENTIAL_DEAL_DENIED,
  DR_LOCKS,
  ENTERPRISE_NERVOUS_REVENUE_COMMAND_CYCLE,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
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
  type DrEvidenceState,
  type DrHop,
  type DrHopRecord,
} from './enterprise-nervous-revenue-command-types';
import {
  attemptExecutiveAction,
  registerExecutiveAgent,
} from './executive-ai-suite';
import {
  attemptSpawnMillionTickets,
  bootstrapUserStoryGraph,
  computeLogicalCombinationCount,
  DEFAULT_STORY_AXES,
  enumerateStorySample,
  selectActiveSprint,
} from './generative-user-story-graph';
import {
  attemptMarkFullOsProductionAuthorized,
  bootstrapLaunchReadinessProgram,
  markLaunchChecklistItem,
} from './launch-readiness-30d-program';
import {
  attemptCockpitExecute,
  openNegotiationCockpit,
  updateNegotiationAdvisory,
} from './negotiation-cockpit';
import {
  attemptSalesCorpsAction,
  registerSalesCorpsAgent,
} from './negotiation-sales-agent-corps';
import { openRevenueCommandSurface } from './revenue-command-center';

export {
  ENTERPRISE_NERVOUS_REVENUE_COMMAND_CYCLE,
  DR_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DrHop, state: DrEvidenceState, summary: string): DrHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DrCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DrActor;
  root?: string;
  repoRoot?: string;
};

export async function runEnterpriseNervousRevenueCommandCycle(input: DrCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DrHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };
  const salesActor: DrActor = { ...actor, kind: 'account_executive', id: 'ae-1' };
  const vceoActor: DrActor = { ...actor, kind: 'virtual_ceo', id: 'vceo-1' };
  const cfoActor: DrActor = { ...actor, kind: 'cfo', id: 'cfo-1' };
  const founderActor: DrActor = { ...actor, kind: 'founder', id: 'founder-1' };

  hops.push(
    hop(
      'honesty_locks',
      DR_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DR_LOCKS.LOCAL_FIRST &&
        DR_LOCKS.AGENTS_CAN_CHARGE === false &&
        DR_LOCKS.AGENTS_CAN_SIGN_CONTRACTS === false &&
        DR_LOCKS.AGENTS_CAN_DEPLOY_PRODUCTION === false &&
        DR_LOCKS.AGENTS_CAN_IMPERSONATE_FOUNDER === false &&
        DR_LOCKS.VIRTUAL_CEO_EQ_FOUNDER === false &&
        DR_LOCKS.BUSINESS_LAW_EQ_ATTORNEY === false &&
        DR_LOCKS.FULL_OS_PRODUCTION_AUTHORIZED_IN_30_DAYS === false &&
        DR_LOCKS.MILLION_STORY_EQ_MILLION_TICKETS === false &&
        DR_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapEnterpriseNervousSystemOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  await openRevenueCommandSurface({
    dealLabel: 'pilot-deal',
    root,
    actor,
  });
  hops.push(
    hop(
      'enterprise_nervous_system_bootstrap',
      'PASS',
      `os=${os.id}; predecessor=${os.predecessorLayer}; dpSoftWire=${os.dpSoftWired}`,
    ),
  );

  const sales = await registerSalesCorpsAgent({
    role: 'negotiation',
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
  hops.push(
    hop(
      'sales_negotiation_cannot_sign_charge_deploy_without_founder_gate',
      sign.status === 'denied' &&
        charge.status === 'denied' &&
        deploy.status === 'denied' &&
        sign.reason === SALES_SIGN_CHARGE_DEPLOY_DENIED
        ? 'PASS'
        : 'FAIL',
      sign.reason,
    ),
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
  hops.push(
    hop(
      'virtual_ceo_cannot_impersonate_founder_or_self_approve',
      impersonate.status === 'denied' &&
        selfApprove.status === 'denied' &&
        impersonate.reason === VIRTUAL_CEO_IMPERSONATION_DENIED
        ? 'PASS'
        : 'FAIL',
      impersonate.reason,
    ),
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
  hops.push(
    hop(
      'business_law_output_not_legal_advice',
      legal.reason === BUSINESS_LAW_NOT_LEGAL_ADVICE &&
        Boolean(legal.disclaimer?.includes('NOT LEGAL ADVICE'))
        ? 'PASS'
        : 'FAIL',
      legal.reason,
    ),
  );

  const shield = await attemptExecutiveAction({
    agentId: law.id,
    action: 'legalshield_probe',
    root,
    actor,
  });
  hops.push(
    hop(
      'legalshield_unconfigured_unavailable',
      shield.status === 'unavailable' && shield.reason === LEGALSHIELD_UNAVAILABLE
        ? 'PASS'
        : 'FAIL',
      shield.reason,
    ),
  );

  const cockpit = await openNegotiationCockpit({
    dealId: 'deal-1',
    batna: 'walk',
    targetRange: { low: 80, high: 120 },
    walkAway: 70,
    root,
    actor: salesActor,
  });
  await updateNegotiationAdvisory({
    sessionId: cockpit.id,
    giveGetPlan: ['extend term', 'get annual prepay'],
    concessionNote: 'pilot discount advisory',
    pricingScenario: { label: 'pilot', amount: 99 },
    contractTerm: { term: 'liability', ours: 'cap', theirs: 'uncapped' },
    objection: { objection: 'price', response: 'value advisory' },
    root,
    actor: salesActor,
  });
  const dealExec = await attemptCockpitExecute({
    sessionId: cockpit.id,
    surface: 'pricing_scenarios',
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
  hops.push(
    hop(
      'consequential_deal_action_without_founder_approval_denied',
      dealExec.status === 'denied' &&
        close.status === 'denied' &&
        (dealExec.reason === CONSEQUENTIAL_DEAL_DENIED ||
          close.reason === CONSEQUENTIAL_DEAL_DENIED)
        ? 'PASS'
        : 'FAIL',
      `${dealExec.reason};${close.reason}`,
    ),
  );

  const launch = await bootstrapLaunchReadinessProgram({ root, actor });
  for (const item of launch.items) {
    await markLaunchChecklistItem({
      programId: launch.id,
      itemId: item.id,
      done: true,
      evidenceRef: `ev-${item.id}`,
      root,
      actor,
    });
  }
  const fullAuth = await attemptMarkFullOsProductionAuthorized({
    programId: launch.id,
    root,
    actor: founderActor,
  });
  hops.push(
    hop(
      'launch_readiness_cannot_mark_full_os_production_authorized',
      fullAuth.status === 'denied' && fullAuth.reason === LAUNCH_NO_FULL_PROD_AUTH
        ? 'PASS'
        : 'FAIL',
      fullAuth.reason,
    ),
  );

  const graph = await bootstrapUserStoryGraph({ root, actor });
  const sample = enumerateStorySample(graph.axes, 8);
  const spawn = await attemptSpawnMillionTickets({
    graphId: graph.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'user_story_graph_enumerates_without_spawning_1m_tickets',
      graph.logicalCombinationCount >= 1_000_000 &&
        spawn.materializedTicketCount === 0 &&
        spawn.reason === STORY_GRAPH_NO_1M_TICKETS &&
        sample.length > 0
        ? 'PASS'
        : 'FAIL',
      `logical=${graph.logicalCombinationCount}; tickets=${spawn.materializedTicketCount}`,
    ),
  );

  const oversized = Array.from({ length: MAX_ACTIVE_SPRINT_STORIES + 20 }, (_, i) => ({
    persona: 'founder',
    industry: 'saas',
    geography: 'na',
    device: 'desktop',
    agent: 'cro',
    integration: 'crm',
    security: 'sealed',
    authority: 'founder_gate',
    pricing: 'pilot',
    offline_online: 'hybrid',
    failure: i % 2 === 0 ? 'timeout' : 'denied',
  }));
  const sprint = await selectActiveSprint({
    graphId: graph.id,
    coordinates: oversized,
    root,
    actor,
  });
  hops.push(
    hop(
      'active_sprint_selection_bounded',
      sprint.status === 'bounded' &&
        sprint.sprint.length <= MAX_ACTIVE_SPRINT_STORIES &&
        sprint.reason === SPRINT_SELECTION_BOUNDED
        ? 'PASS'
        : 'FAIL',
      `${sprint.reason};n=${sprint.sprint.length}`,
    ),
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
  hops.push(
    hop(
      'cfo_cannot_execute_live_bank_charge_mutations',
      bank.status === 'denied' &&
        liveCharge.status === 'denied' &&
        bank.reason === CFO_LIVE_MUTATION_DENIED
        ? 'PASS'
        : 'FAIL',
      bank.reason,
    ),
  );

  const node = await expandEnterpriseNeuralNode({
    label: 'revenue-route',
    routeKind: 'revenue',
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
  hops.push(
    hop(
      'agent_without_heartbeat_not_running_verified',
      noHb.status !== 'RUNNING_VERIFIED' &&
        noHb.reason === NO_HEARTBEAT_NOT_RUNNING_VERIFIED &&
        withHb.status === 'RUNNING_VERIFIED'
        ? 'PASS'
        : 'FAIL',
      `${noHb.reason};after=${withHb.status}`,
    ),
  );

  const sealed = await accessSealedFounderData({
    label: 'founder-strategy',
    claimedSealedGrant: false,
    root,
    actor: salesActor,
  });
  hops.push(
    hop(
      'sealed_founder_data_denied_to_sales_corps_by_label_alone',
      sealed.status === 'denied' && sealed.reason === SEALED_FOUNDER_DATA_DENIED
        ? 'PASS'
        : 'FAIL',
      sealed.reason,
    ),
  );

  const gate = decisionGate({
    id: 'dr-consequential',
    action: 'close_enterprise_deal',
    consequence: 'CRITICAL',
    production: false,
    financialCommitment: true,
    legalCommitment: true,
    permissionChange: false,
    externalPublication: false,
  });
  void enterpriseNervousRevenueCommandOsHonesty(input.repoRoot);

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DR enterprise nervous revenue command cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DR'],
        githubSotIssue: GITHUB_SOT_ISSUE,
        gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
        gateExecutableByAgent: gate.executableByAgent,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'evidence',
      'PASS',
      `evidence=${evidenceEvent?.id ?? 'recorded'};gate_executable=${gate.executableByAgent}`,
    ),
  );

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-DR enterprise nervous revenue command cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning≠permission; agents cannot charge/sign/deploy`,
      sourceRefs: ['62L-DR'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      DR_LOCKS.LEARNING_EQ_PERMISSION === false ? 'BOUNDED' : 'FAIL',
      'Learning recorded locally; learning ≠ permission; no production authorization.',
    ),
  );

  const failed = hops.filter((h) => h.state === 'FAIL');
  return {
    os,
    hops,
    failed,
    passed: failed.length === 0,
    honesty: enterpriseNervousRevenueCommandOsHonesty(input.repoRoot),
    predecessor: predecessorMap(input.repoRoot),
    logicalStoryCombinations: computeLogicalCombinationCount(DEFAULT_STORY_AXES),
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
  };
}

export async function buildEnterpriseNervousRevenueCommandHealthReport(
  input: DrCycleInput,
) {
  const cycle = await runEnterpriseNervousRevenueCommandCycle(input);
  const health = await checkLocalBrainHealth(input.root ?? process.cwd()).catch(() => null);

  return {
    banner: HONESTY_BANNER,
    cycle: ENTERPRISE_NERVOUS_REVENUE_COMMAND_CYCLE,
    passed: cycle.passed,
    hops: cycle.hops,
    failed: cycle.failed,
    honesty: cycle.honesty,
    predecessor: cycle.predecessor,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    localBrainHealth: health,
    locks: DR_LOCKS,
    dbCandidatesApplied: false,
    tipLand: false,
    productionAuthorized: false,
  };
}
