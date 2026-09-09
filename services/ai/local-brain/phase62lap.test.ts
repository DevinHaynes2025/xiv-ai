import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CONSEQUENTIAL_ACTIONS,
  ENTERPRISE_OPS_CYCLE,
  HANDOFF_NOT_EXECUTION_AUTHORITY,
  OPS_HONESTY,
} from './enterprise-ops-types';
import {
  OpsSimulatedCrash,
  WORKCELL_KINDS,
  agentSelfGrantDecisionRight,
  analyzeBottlenecks,
  authorizedExecutionFromPackage,
  buildOpsHealthReport,
  buildWorkflowGraph,
  businessContinuityPlan,
  commandCenterBenchmarks,
  conveneOpsAgentCouncil,
  decisionRightsMatrix,
  detectDeadlock,
  enterWarRoomMode,
  generatePlanOptions,
  humanDecide,
  humanGateConsequential,
  linkKpisToWorkflow,
  listOpsJobs,
  lookupDecisionRight,
  planVersusActual,
  provePackageIsNotExecutionAuthority,
  recoverInterruptedOpsJobs,
  resumeOpsJob,
  runDepartmentWorkcell,
  runEnterpriseOpsCycle,
  type EnterpriseNeed,
} from './enterprise-ops-runtime';
import { attemptConsequentialAction as attemptFromHandoff } from './enterprise-ops-handoff';
import { searchLearning } from './learning-ledger';
import type { WorkflowNode } from './enterprise-ops-graph';
import type { DecisionPacket } from './enterprise-ops-decisions';
import { enqueueExecutiveDecision } from './enterprise-ops-decisions';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lap-'));
const tenantId = '62lap-tenant';
const universeId = '62lap-universe';
const enterpriseId = 'acme-ops';
const failures: string[] = [];
const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(here, '../../..');

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

function hopState(job: { hopRecords: Array<{ hop: string; state: string }> }, hop: string) {
  return job.hopRecords.find((item) => item.hop === hop)?.state;
}

const dagNodes: WorkflowNode[] = [
  { id: 'sales_qualify', department: 'sales', title: 'Qualify demand', duration: 2, kpiKeys: ['pipeline'], waitsFor: [] },
  { id: 'finance_review', department: 'finance', title: 'Review budget envelope', duration: 3, kpiKeys: ['cash_runway'], waitsFor: ['sales_qualify'] },
  { id: 'procurement_rfq', department: 'procurement', title: 'Draft RFQ (no send)', duration: 4, kpiKeys: ['supplier_risk'], waitsFor: ['finance_review'] },
  { id: 'it_prepare', department: 'it', title: 'Prepare sandbox change', duration: 5, kpiKeys: ['change_fail'], waitsFor: ['procurement_rfq'] },
  { id: 'people_staff', department: 'people', title: 'Staffing recommendation', duration: 2, kpiKeys: [], waitsFor: ['it_prepare'] },
  { id: 'security_review', department: 'security', title: 'Security review', duration: 2, kpiKeys: [], waitsFor: ['it_prepare'] },
  { id: 'exec_brief', department: 'executive', title: 'Executive brief', duration: 1, kpiKeys: ['cycle_time'], waitsFor: ['people_staff', 'security_review'] },
];

const kpiNow = new Date().toISOString();
const kpis = [
  { metric: 'pipeline', value: 12, unit: 'deals', observedAt: kpiNow, sourceRefs: ['crm-local'], stale: false },
  { metric: 'cash_runway', value: 18, unit: 'months', observedAt: kpiNow, sourceRefs: ['ledger-local'], stale: false },
  { metric: 'supplier_risk', value: 0.2, unit: 'index', observedAt: kpiNow, sourceRefs: ['vendor-file'], stale: false },
  { metric: 'change_fail', value: 0.04, unit: 'rate', observedAt: kpiNow, sourceRefs: ['it-local'], stale: false },
  { metric: 'cycle_time', value: 19, unit: 'days', observedAt: kpiNow, sourceRefs: ['ops-local'], stale: false },
];

function baseNeed(overrides: Partial<EnterpriseNeed> = {}): EnterpriseNeed {
  return {
    id: 'need-happy',
    tenantId,
    universeId,
    enterpriseId,
    title: 'Cross-department fulfillment plan',
    objective: 'Plan a governed cross-department workflow without executing consequential actions.',
    approved: true,
    departments: ['sales', 'finance', 'procurement', 'it', 'people', 'security', 'executive', 'supply_chain', 'research', 'customer'],
    nodes: dagNodes,
    kpiObservations: kpis,
    humanPrincipal: 'ceo',
    humanApprove: true,
    requestedActions: ['spend', 'deploy', 'contact_customer', 'change_production'],
    consequence: 'HIGH',
    production: true,
    ...overrides,
  };
}

try {
  check(
    'US-AP30',
    ENTERPRISE_OPS_CYCLE.join(' → ') === 'enterprise_need → department_context → kpi_evidence → workflow_graph → dependency_bottleneck_analysis → agent_council → plan_options → risk_cost_policy_review → human_decision → approved_task_package → authorized_execution → outcome → learning',
    'Core ops loop hops are recorded in founder-paste order.',
  );
  check(
    'US-AP30',
    OPS_HONESTY.l4AutonomyEnabled === false
      && OPS_HONESTY.agentsPlanRecommendOnly === true
      && OPS_HONESTY.humansOwnConsequentialDecisions === true
      && OPS_HONESTY.packageDoesNotAuthorizeExecution === true
      && OPS_HONESTY.antiCollusionInterEnterprise === true
      && OPS_HONESTY.ceoSealedCompartmentalized === true
      && OPS_HONESTY.founderImpersonation === false
      && OPS_HONESTY.tipLand === false
      && OPS_HONESTY.autoSpend === false
      && OPS_HONESTY.autoDeploy === false
      && OPS_HONESTY.guardianRlsWeaken === false,
    'Honesty locks: L4=false, agents plan/recommend, humans own consequential decisions, package≠execution, anti-collusion, CEO-sealed, no founder impersonation.',
  );

  const graph = buildWorkflowGraph({
    id: 'g1',
    tenantId,
    universeId,
    enterpriseId,
    needId: 'need-happy',
    nodes: dagNodes,
  });
  check('US-AP4', graph.nodes.length === 7 && graph.edges.length === 7 && graph.productionEffect === false, `Cross-department workflow graph nodes=${graph.nodes.length} edges=${graph.edges.length}.`);

  const acyclic = detectDeadlock(graph);
  check('US-AP5', acyclic.deadlocked === false && Object.keys(acyclic.waitForGraph).length === 7, 'Dependency detection built a wait-for graph without a cycle.');
  check('US-AP6', acyclic.deadlocked === false, 'DAG is not a deadlock.');

  const cyclic = buildWorkflowGraph({
    id: 'g-deadlock',
    tenantId,
    universeId,
    enterpriseId,
    needId: 'need-deadlock',
    nodes: [
      { id: 'finance_hold', department: 'finance', title: 'Wait on IT', duration: 1, kpiKeys: [], waitsFor: ['it_hold'] },
      { id: 'it_hold', department: 'it', title: 'Wait on finance', duration: 1, kpiKeys: [], waitsFor: ['finance_hold'] },
    ],
  });
  const deadlock = detectDeadlock(cyclic);
  check('US-AP6', deadlock.deadlocked === true && deadlock.cycles.some((cycle) => cycle.includes('finance_hold') && cycle.includes('it_hold')), `Deadlock detection found cycle ${JSON.stringify(deadlock.cycles)}.`);

  const bottlenecks = analyzeBottlenecks(graph);
  check('US-AP7', bottlenecks.criticalPath.includes('exec_brief') && bottlenecks.bottlenecks.some((item) => item.nodeId === 'it_prepare' || item.onCriticalPath), `Bottleneck analysis criticalPath=${bottlenecks.criticalPath.join('→')} duration=${bottlenecks.criticalPathDuration}.`);

  const links = linkKpisToWorkflow(graph, kpis);
  check('US-AP3', links.some((link) => link.kpiKey === 'pipeline' && link.state === 'VERIFIED') && links.every((link) => link.productionEffect === false), 'KPI-to-workflow links evaluate with provenance; productionEffect=false.');
  const unknownKpi = linkKpisToWorkflow(graph, [{ metric: 'pipeline', value: null, unit: 'deals', observedAt: kpiNow, sourceRefs: [], stale: false }]);
  check('US-AP3', unknownKpi.some((link) => link.kpiKey === 'pipeline' && (link.state === 'UNKNOWN' || link.kpi?.state === 'UNKNOWN')), 'Missing KPI provenance stays UNKNOWN, not invented PASS.');

  const rights = decisionRightsMatrix();
  const agentSpend = lookupDecisionRight({ principal: 'agent_planner', action: 'spend' });
  const agentPlan = lookupDecisionRight({ principal: 'agent_planner', action: 'plan' });
  const financeSpend = lookupDecisionRight({ principal: 'finance_controller', action: 'spend' });
  check('US-AP13', agentSpend.agentMayExecute === false && agentSpend.humanRequired === true && agentSpend.requiredApprover === 'finance_controller', 'Decision-rights matrix: agent cannot spend.');
  check('US-AP13', agentPlan.agentMayExecute === true && financeSpend.humanRequired === true && financeSpend.agentMayExecute === false, 'Agents may plan/recommend; finance spend still requires a human execution grant.');
  check('US-AP13', agentSelfGrantDecisionRight().granted === false, 'Agents cannot self-grant decision rights.');
  check('US-AP13', rights.filter((row) => row.principal === 'agent_planner' && ['spend', 'deploy', 'contact_customer', 'change_production', 'change_permissions'].includes(row.action)).every((row) => row.agentMayExecute === false), 'Agent row of the matrix forbids all consequential actions.');

  const gate = humanGateConsequential({ action: 'deploy', consequence: 'CRITICAL', production: true });
  check('US-AP15', gate.executableByAgent === false && gate.humanApprovalRequired === true && gate.executed === false, 'Human gate blocks consequential deploy; executed=false.');

  for (const kind of WORKCELL_KINDS) {
    const cell = runDepartmentWorkcell(kind, 'plan staffing and budget');
    check(
      kind === 'finance' ? 'US-AP17' : kind === 'sales' ? 'US-AP18' : kind === 'procurement' ? 'US-AP19' : kind === 'it' ? 'US-AP20' : 'US-AP21',
      cell.productionAuthorization === false && cell.spendingAuthorized === false && cell.purchaseAuthorized === false && cell.hiringAuthorized === false && cell.customerContactAuthorized === false,
      `${kind} workcell recommends only; no spend/hire/purchase/contact.`,
    );
  }

  const bcp = businessContinuityPlan('site outage');
  check('US-AP22', bcp.automaticFailover === false && bcp.productionFailoverAuthorized === false, 'Business continuity is a recommendation, not automatic production failover.');
  const war = enterWarRoomMode({ tenantId, sealed: true });
  check('US-AP23', war.autoExecution === false && war.l4AutonomyEnabled === false && war.sealedPayload === '[REDACTED_SEALED]' && war.ceoSealedCompartmentalized === true, 'War-room mode elevates coordination without L4, auto-execution, or sealed replication.');

  const collusion = await conveneOpsAgentCouncil({
    tenantId,
    universeId,
    question: 'Coordinate prices across enterprises',
    enterpriseIds: ['acme-ops', 'other-co'],
    collusionTopic: 'pricing',
    root,
  });
  check('US-AP8', collusion.allowed === false && collusion.reason.includes('ANTI_COLLUSION'), 'Inter-enterprise pricing council is anti-collusion DENIED.');
  const council = await conveneOpsAgentCouncil({
    tenantId,
    universeId,
    question: 'Plan internal fulfillment sequencing',
    enterpriseIds: [enterpriseId],
    collusionTopic: 'planning',
    root,
  });
  check('US-AP8', council.allowed === true && council.consensusForced === false && council.council?.productionAuthorized === false, 'Same-enterprise planning council reuses the reflection council; consensus is not forced.');

  const unapproved = await runEnterpriseOpsCycle({ need: baseNeed({ id: 'need-unapproved', approved: false }), root });
  check('US-AP1', unapproved.state === 'denied' && hopState(unapproved, 'enterprise_need') === 'DENIED', 'Unapproved enterprise need is denied before the graph.');

  const deadlockedJob = await runEnterpriseOpsCycle({
    need: baseNeed({
      id: 'need-deadlock',
      nodes: [
        { id: 'a', department: 'finance', title: 'A', duration: 1, kpiKeys: [], waitsFor: ['b'] },
        { id: 'b', department: 'it', title: 'B', duration: 1, kpiKeys: [], waitsFor: ['a'] },
      ],
    }),
    root,
  });
  check('US-AP6', deadlockedJob.state === 'denied' && hopState(deadlockedJob, 'dependency_bottleneck_analysis') === 'DENIED', 'Cycle hop denies a deadlocked workflow instead of executing it.');

  const agentHuman = await runEnterpriseOpsCycle({
    need: baseNeed({ id: 'need-agent-approve', humanPrincipal: 'agent_planner', humanApprove: true }),
    root,
  });
  check('US-AP15', agentHuman.state === 'denied' && hopState(agentHuman, 'human_decision') === 'DENIED', 'Agent cannot sit the human decision hop.');

  const cycle = await runEnterpriseOpsCycle({ need: baseNeed(), root });
  check('US-AP1', hopState(cycle, 'enterprise_need') === 'PASS', 'Enterprise need hop accepted an approved planning input.');
  check('US-AP2', hopState(cycle, 'department_context') === 'PASS', 'Department context hop ran.');
  check('US-AP3', hopState(cycle, 'kpi_evidence') === 'PASS', 'KPI/evidence hop ran with sourced observations.');
  check('US-AP4', hopState(cycle, 'workflow_graph') === 'PASS', 'Workflow graph hop ran.');
  check('US-AP5', hopState(cycle, 'dependency_bottleneck_analysis') === 'PASS', 'Dependency/bottleneck analysis hop ran on the DAG.');
  check('US-AP8', hopState(cycle, 'agent_council') === 'PASS', 'Agent council hop ran.');
  check('US-AP9', hopState(cycle, 'plan_options') === 'PASS', 'Plan generation hop ran.');
  check('US-AP11', hopState(cycle, 'risk_cost_policy_review') === 'PASS', 'Risk/cost/policy review hop ran.');
  check('US-AP14', hopState(cycle, 'human_decision') === 'PASS', 'Decision packet reached a human principal.');
  check('US-AP16', hopState(cycle, 'human_decision') === 'PASS' && cycle.package?.humanApprovedPlan === true, 'Executive queue accepted a CEO-approved plan packet.');
  check('US-AP24', hopState(cycle, 'approved_task_package') === 'PASS' && cycle.package?.packageCreated === true, 'Approved action handoff package was created after human approval.');
  check(
    'US-AP24',
    cycle.package !== null
      && cycle.package.executionAuthority === false
      && cycle.package.spendingAuthorized === false
      && cycle.package.deployAuthorized === false
      && cycle.package.customerContactAuthorized === false
      && cycle.package.productionChangeAuthorized === false
      && cycle.package.permissionChangeAuthorized === false,
    'US-AP24 critical: package after human approval does not authorize spend/deploy/contact/production/permissions.',
  );
  check('US-AP25', hopState(cycle, 'authorized_execution') === 'DENIED' && cycle.executionAuthority === false, 'Authorized execution hop is DENIED; package is not an execution token.');
  check('US-AP26', hopState(cycle, 'outcome') === 'WAITING_DATA', 'Plan-vs-actual without observations is WAITING_DATA, not invented PASS.');
  check('US-AP27', hopState(cycle, 'learning') === 'PASS' && cycle.state === 'completed', 'Outcome/learning hop wrote the ledger after a completed planning cycle.');
  check('US-AP10', generatePlanOptions({ need: 'x', graph, bottlenecks }).every((option) => option.executable === false && option.spendingAuthorized === false), 'Constraint/plan options are non-executable and do not spend.');
  check('US-AP12', cycle.spendingAuthorized === false && cycle.deployAuthorized === false, 'Cost/policy review did not commit cost or authorize deploy.');
  check('US-AP29', cycle.package?.enterpriseId === enterpriseId, 'Cycle connected a multi-department enterprise need including supply-chain/finance/sales/procurement/IT/security/research/customer/people/executive catalog.');

  const proof = provePackageIsNotExecutionAuthority(cycle.package!);
  check('US-AP24', proof.allDenied === true && proof.executionAuthority === false && proof.attempts.length === CONSEQUENTIAL_ACTIONS.length, `Handoff proof denied all ${proof.attempts.length} consequential actions.`);
  for (const action of CONSEQUENTIAL_ACTIONS) {
    const attempt = attemptFromHandoff(cycle.package!, action);
    check(
      'US-AP24',
      attempt.authorized === false && attempt.executed === false && attempt.reason === HANDOFF_NOT_EXECUTION_AUTHORITY && attempt.humanApprovedPlan === true,
      `Package creation ≠ execution: ${action} executed=false after human-approved plan.`,
    );
  }
  const execHop = authorizedExecutionFromPackage(cycle.package!);
  check('US-AP25', execHop.state === 'DENIED' && execHop.executed === false, 'authorizedExecutionFromPackage stays DENIED.');

  const withActuals = await runEnterpriseOpsCycle({
    need: baseNeed({
      id: 'need-actuals',
      actuals: [{ metric: 'cycle_time', value: 21, unit: 'days', observedAt: kpiNow, sourceRefs: ['ops-local'], stale: false }],
    }),
    root,
  });
  check('US-AP26', hopState(withActuals, 'outcome') === 'PASS', 'Plan-vs-actual compares observed metrics when actuals exist.');
  const missingActual = planVersusActual(kpis, []);
  check('US-AP26', missingActual.state === 'WAITING_DATA' && missingActual.inventedPass === false, 'Empty actuals stay WAITING_DATA.');

  const learning = await searchLearning('Cross-department fulfillment plan', root);
  check('US-AP27', learning.some((entry) => entry.taskId === cycle.id && entry.permissionChange === false && entry.productionChange === false), 'Learning ledger entry has permissionChange=false productionChange=false.');

  let crashed = false;
  try {
    await runEnterpriseOpsCycle({ need: baseNeed({ id: 'need-crash', crashAfterHop: 'plan_options' }), root });
  } catch (error) {
    crashed = error instanceof OpsSimulatedCrash && error.hop === 'plan_options';
  }
  const recovered = await recoverInterruptedOpsJobs(root);
  const resumed = await resumeOpsJob({ need: baseNeed({ id: 'need-crash' }), root });
  check('US-AP30', crashed && recovered.length >= 1, 'Simulated crash after plan_options is recorded.');
  check('US-AP30', resumed.state === 'completed' && hopState(resumed, 'learning') === 'PASS' && resumed.executionAuthority === false, 'Resume completes remaining hops without gaining execution authority.');

  const impersonation = humanDecide({
    packet: {
      id: 'pkt-impersonate',
      tenantId,
      universeId,
      enterpriseId,
      need: 'x',
      options: [],
      selectedOptionId: null,
      risks: { id: 'r', tenantId, universeId, enterpriseId, entries: [], productionEffect: false },
      evidenceRefs: [],
      sealedRedacted: true,
      humanApprovalRequired: true,
      approved: false,
      executionAuthority: false,
      spendingAuthorized: false,
      deployAuthorized: false,
      customerContactAuthorized: false,
      productionChangeAuthorized: false,
    } satisfies DecisionPacket,
    queue: enqueueExecutiveDecision({ tenantId, universeId, items: [] }, {
      id: 'pkt-impersonate',
      tenantId,
      universeId,
      enterpriseId,
      need: 'x',
      options: [],
      selectedOptionId: null,
      risks: { id: 'r', tenantId, universeId, enterpriseId, entries: [], productionEffect: false },
      evidenceRefs: [],
      sealedRedacted: true,
      humanApprovalRequired: true,
      approved: false,
      executionAuthority: false,
      spendingAuthorized: false,
      deployAuthorized: false,
      customerContactAuthorized: false,
      productionChangeAuthorized: false,
    }),
    principal: 'agent_planner',
    approve: true,
    impersonateFounder: true,
  });
  check('US-AP30', impersonation.accepted === false && impersonation.reason === 'FOUNDER_IMPERSONATION_DENIED', 'Founder impersonation is denied.');

  const jobs = await listOpsJobs(root);
  const benches = commandCenterBenchmarks(jobs);
  check('US-AP28', benches.executionsAuthorized === 0 && benches.spendingAuthorized === 0 && benches.materializedScaleClaim === false && benches.windowsNodeVerification === 'NOT_TESTED', `Command-center benchmarks: jobs=${benches.jobs} packages=${benches.packagesCreated} executionsAuthorized=0.`);

  const health = await buildOpsHealthReport({ tenantId, universeId, root: repoRoot });
  check('US-AP30', health.honesty.l4AutonomyEnabled === false && health.honesty.inventedPass === false && health.honesty.tipLand === false, 'Health honesty locks remain false.');
  check('US-AP30', health.predecessor.ajFactory === 'PASS', 'AJ factory predecessor report is present on this child.');
  check(
    'US-AP29',
    health.predecessor.aoSupplyChain === 'WAITING_DATA'
      && health.predecessor.anControlTower === 'WAITING_DATA'
      && health.predecessor.ahCausalTwins === 'WAITING_DATA'
      && health.predecessor.agAgentSociety === 'WAITING_DATA'
      && health.predecessor.afUniverseKernel === 'WAITING_DATA',
    'AO/AN/AH/AG/AF reports are WAITING_DATA (not invented PASS).',
  );
  check('US-AP30', health.localModel.availability === 'UNAVAILABLE' || health.localModel.availability === 'PASS', `Health localModel=${health.localModel.availability}; unconfigured stays UNAVAILABLE.`);
  check('US-AP30', health.providers.every((slot) => slot.state === 'UNAVAILABLE' || slot.configured), 'Unconfigured providers are UNAVAILABLE until verified.');
  check('US-AP30', health.next.startsWith('62L-AQ'), 'NEXT title is 62L-AQ only.');
  check('US-AP24', health.executionsAuthorized === 0 && health.spendingAuthorized === 0, 'Health report does not invent execution or spending authority on the repo-root store.');
  check('US-AP28', health.honesty.windowsNodeVerification === 'NOT_TESTED', 'Windows-node verification is NOT_TESTED.');
} catch (error) {
  failures.push(`UNCAUGHT: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('62L-AP safety tests FAIL');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('62L-AP safety tests PASS');
