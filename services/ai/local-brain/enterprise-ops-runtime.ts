import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { LocalCheckpointStore } from './checkpoint-store';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { localModelStatus } from './local-model';
import { providerSlots } from './provider-fabric';
import { evaluateKpi, type KpiObservation } from './kpi-engine';
import type { ConsequenceClass } from './decision-gate';
import {
  ENTERPRISE_OPS_CYCLE,
  OPS_HONESTY,
  OpsSimulatedCrash,
  type ConsequentialAction,
  type OpsDepartment,
  type OpsEvidenceState,
  type OpsHop,
  type OpsHopRecord,
  type OpsJobState,
} from './enterprise-ops-types';
import {
  analyzeBottlenecks,
  buildWorkflowGraph,
  detectDeadlock,
  detectDependencies,
  linkKpisToWorkflow,
  type WorkflowNode,
} from './enterprise-ops-graph';
import { generatePlanOptions, openRiskRegister, reviewCostPolicy, solveConstraints, type ConstraintSet } from './enterprise-ops-planning';
import {
  buildDecisionPacket,
  enqueueExecutiveDecision,
  humanDecide,
  humanGateConsequential,
  type DecisionPrincipal,
  type ExecutiveQueue,
} from './enterprise-ops-decisions';
import {
  businessContinuityPlan,
  conveneOpsAgentCouncil,
  departmentContext,
  enterWarRoomMode,
  probePredecessorConnectors,
  runDepartmentWorkcell,
  type WorkcellKind,
} from './enterprise-ops-workcells';
import { authorizedExecutionFromPackage, createApprovedActionHandoff, type HandoffPackage } from './enterprise-ops-handoff';

export { ENTERPRISE_OPS_CYCLE, OPS_HONESTY, OpsSimulatedCrash };

export type EnterpriseNeed = {
  id: string;
  tenantId: string;
  universeId: string;
  enterpriseId: string;
  title: string;
  objective: string;
  approved: boolean;
  departments: OpsDepartment[];
  nodes: WorkflowNode[];
  kpiObservations?: KpiObservation[];
  constraints?: ConstraintSet;
  requestedActions?: ConsequentialAction[];
  consequence?: ConsequenceClass;
  production?: boolean;
  humanPrincipal?: DecisionPrincipal;
  humanApprove?: boolean;
  collusionEnterpriseIds?: string[];
  collusionTopic?: 'pricing' | 'bids' | 'customer_targeting' | 'planning';
  warRoom?: boolean;
  crashAfterHop?: OpsHop;
  actuals?: KpiObservation[];
};

export type OpsJob = {
  id: string;
  needId: string;
  tenantId: string;
  universeId: string;
  enterpriseId: string;
  title: string;
  state: OpsJobState;
  completedHops: OpsHop[];
  hopRecords: OpsHopRecord[];
  package: HandoffPackage | null;
  planApproved: boolean;
  executionAuthority: false;
  spendingAuthorized: false;
  deployAuthorized: false;
  customerContactAuthorized: false;
  productionChangeAuthorized: false;
  crashAfterHop?: OpsHop;
  createdAt: string;
  updatedAt: string;
};

type OpsStore = { jobs: OpsJob[]; queue: ExecutiveQueue };

function emptyStore(tenantId: string, universeId: string): OpsStore {
  return { jobs: [], queue: { tenantId, universeId, items: [] } };
}

function storePath(root: string) {
  return xivLocalPath(root, 'enterprise-ops.json');
}

function nowIso() {
  return new Date().toISOString();
}

function record(hop: OpsHop, state: OpsEvidenceState, summary: string): OpsHopRecord {
  return { hop, state, summary, at: nowIso() };
}

export async function enqueueEnterpriseNeed(need: EnterpriseNeed, root = process.cwd()) {
  const state = await readJsonFile(storePath(root), emptyStore(need.tenantId, need.universeId));
  const job: OpsJob = {
    id: cortexId('ops'),
    needId: need.id,
    tenantId: need.tenantId,
    universeId: need.universeId,
    enterpriseId: need.enterpriseId,
    title: need.title,
    state: need.approved ? 'queued' : 'denied',
    completedHops: [],
    hopRecords: need.approved
      ? []
      : [record('enterprise_need', 'DENIED', 'Unapproved enterprise need is not an ops-planner input.')],
    package: null,
    planApproved: false,
    executionAuthority: false,
    spendingAuthorized: false,
    deployAuthorized: false,
    customerContactAuthorized: false,
    productionChangeAuthorized: false,
    crashAfterHop: need.crashAfterHop,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  state.jobs.push(job);
  await writeJsonFileAtomic(storePath(root), state);
  return job;
}

export async function listOpsJobs(root = process.cwd()) {
  const store = await readJsonFile(storePath(root), emptyStore('local-tenant', 'local-universe'));
  return store.jobs;
}

async function loadStore(root: string, tenantId: string, universeId: string) {
  return readJsonFile(storePath(root), emptyStore(tenantId, universeId));
}

async function saveJob(job: OpsJob, root: string, queue?: ExecutiveQueue) {
  const state = await loadStore(root, job.tenantId, job.universeId);
  const index = state.jobs.findIndex((item) => item.id === job.id);
  job.updatedAt = nowIso();
  if (index >= 0) state.jobs[index] = job;
  else state.jobs.push(job);
  if (queue) state.queue = queue;
  await writeJsonFileAtomic(storePath(root), state);
  return job;
}

export async function recoverInterruptedOpsJobs(root = process.cwd()) {
  const state = await readJsonFile(storePath(root), emptyStore('local-tenant', 'local-universe'));
  const recovered: OpsJob[] = [];
  for (const job of state.jobs) {
    if (job.state === 'running') {
      job.state = 'queued';
      job.updatedAt = nowIso();
      recovered.push(job);
    }
  }
  await writeJsonFileAtomic(storePath(root), state);
  return recovered;
}

const DEFAULT_CONSTRAINTS: ConstraintSet = {
  maxBudget: 0,
  maxDuration: 10_000,
  maxParallelByDepartment: {},
  policyDenyActions: ['spend', 'deploy', 'contact_customer', 'change_production', 'change_permissions'],
};

export async function runEnterpriseOpsCycle(input: {
  need: EnterpriseNeed;
  root: string;
  resume?: OpsJob;
}) {
  const root = input.root;
  const need = input.need;
  const job = input.resume ?? await enqueueEnterpriseNeed(need, root);
  if (job.state === 'denied' && job.completedHops.length === 0 && job.hopRecords.some((item) => item.state === 'DENIED')) {
    return job;
  }

  const done = new Set(job.completedHops);
  job.state = 'running';
  await saveJob(job, root);

  const finishHop = async (hop: OpsHop, state: OpsEvidenceState, summary: string) => {
    job.hopRecords.push(record(hop, state, summary));
    if (state === 'PASS' || state === 'DENIED' || state === 'UNAVAILABLE' || state === 'WAITING_DATA') {
      job.completedHops.push(hop);
    }
    await saveJob(job, root);
    if (need.crashAfterHop === hop && !input.resume?.completedHops.includes(hop)) {
      throw new OpsSimulatedCrash(hop);
    }
  };

  const skip = (hop: OpsHop) => done.has(hop);
  let queue: ExecutiveQueue = (await loadStore(root, need.tenantId, need.universeId)).queue;
  let handoff: HandoffPackage | null = job.package;

  try {
    if (!skip('enterprise_need')) {
      if (!need.approved) {
        job.state = 'denied';
        await finishHop('enterprise_need', 'DENIED', 'Unapproved enterprise need.');
        return job;
      }
      await finishHop('enterprise_need', 'PASS', `Need ${need.id} accepted as a planning input. Not an execution grant.`);
    }

    if (!skip('department_context')) {
      const contexts = need.departments.map((dept) => departmentContext(dept));
      await finishHop('department_context', 'PASS', `Department contexts: ${contexts.map((item) => item.department).join(',')}.`);
    }

    if (!skip('kpi_evidence')) {
      const observations = need.kpiObservations ?? [];
      const evaluated = observations.map((item) => evaluateKpi(item));
      const unknown = evaluated.filter((item) => item.state === 'UNKNOWN').length;
      const state: OpsEvidenceState = observations.length === 0 ? 'UNKNOWN' : unknown === evaluated.length ? 'UNKNOWN' : 'PASS';
      await finishHop('kpi_evidence', state, `KPI observations=${observations.length}; unknown=${unknown}; productionEffect=false.`);
    }

    const graph = buildWorkflowGraph({
      id: `graph_${need.id}`,
      tenantId: need.tenantId,
      universeId: need.universeId,
      enterpriseId: need.enterpriseId,
      needId: need.id,
      nodes: need.nodes,
    });
    const deps = detectDependencies(graph);
    const deadlock = detectDeadlock(graph);
    const bottlenecks = analyzeBottlenecks(graph);
    const kpiLinks = linkKpisToWorkflow(graph, need.kpiObservations ?? []);

    if (!skip('workflow_graph')) {
      await finishHop('workflow_graph', 'PASS', `Workflow graph nodes=${graph.nodes.length} edges=${deps.edges.length}.`);
    }

    if (!skip('dependency_bottleneck_analysis')) {
      if (deadlock.deadlocked) {
        job.state = 'denied';
        await finishHop('dependency_bottleneck_analysis', 'DENIED', `Deadlock detected: ${deadlock.cycles.map((cycle) => cycle.join('→')).join('; ')}`);
        return job;
      }
      await finishHop(
        'dependency_bottleneck_analysis',
        'PASS',
        `No deadlock. Critical path duration=${bottlenecks.criticalPathDuration}; bottlenecks=${bottlenecks.bottlenecks.length}; kpiLinks=${kpiLinks.length}.`,
      );
    }

    if (!skip('agent_council')) {
      const council = await conveneOpsAgentCouncil({
        tenantId: need.tenantId,
        universeId: need.universeId,
        question: need.objective,
        enterpriseIds: need.collusionEnterpriseIds ?? [need.enterpriseId],
        collusionTopic: need.collusionTopic ?? 'planning',
        root,
      });
      if (!council.allowed) {
        job.state = 'denied';
        await finishHop('agent_council', 'DENIED', council.reason);
        return job;
      }
      await finishHop('agent_council', 'PASS', `Council ${council.council?.id ?? 'local'} consensusForced=false.`);
    }

    const options = generatePlanOptions({ need: need.title, graph, bottlenecks });
    const constraints = need.constraints ?? DEFAULT_CONSTRAINTS;
    const solutions = options.map((option) => solveConstraints({ option, constraints }));
    const selected = solutions.find((item) => item.feasible)?.selectedOptionId ?? options[2]?.id ?? null;
    const selectedOption = options.find((item) => item.id === selected) ?? options[0];
    const selectedSolution = solutions.find((item) => item.selectedOptionId === selected) ?? solutions[0];
    const risks = openRiskRegister({
      id: `risk_${need.id}`,
      tenantId: need.tenantId,
      universeId: need.universeId,
      enterpriseId: need.enterpriseId,
      graph,
      deadlock: deadlock.deadlocked,
      bottlenecks,
    });
    const costPolicy = reviewCostPolicy({
      option: selectedOption,
      solution: selectedSolution,
      requestedActions: need.requestedActions ?? [],
    });

    if (!skip('plan_options')) {
      await finishHop('plan_options', 'PASS', `Generated ${options.length} non-executable plan options; selected=${selected}.`);
    }

    if (!skip('risk_cost_policy_review')) {
      await finishHop(
        'risk_cost_policy_review',
        'PASS',
        `Risks=${risks.entries.length}; feasible=${selectedSolution.feasible}; spendingUsed=false; blocked=${costPolicy.blockedConsequentialActions.join(',') || 'none'}.`,
      );
    }

    let packet = buildDecisionPacket({
      id: `pkt_${need.id}`,
      tenantId: need.tenantId,
      universeId: need.universeId,
      enterpriseId: need.enterpriseId,
      need: need.title,
      options,
      selectedOptionId: selected,
      risks,
      evidenceRefs: [job.id, graph.id],
      consequence: need.consequence ?? 'HIGH',
      production: need.production ?? false,
    });
    queue = enqueueExecutiveDecision(queue, packet);

    if (!skip('human_decision')) {
      const principal = need.humanPrincipal ?? 'ceo';
      const decided = humanDecide({
        packet,
        queue,
        principal,
        approve: need.humanApprove ?? false,
      });
      packet = decided.packet;
      queue = decided.queue;
      job.planApproved = packet.approved;
      if (!decided.accepted || !packet.approved) {
        job.state = 'denied';
        await finishHop('human_decision', 'DENIED', decided.reason);
        await saveJob(job, root, queue);
        return job;
      }
      await finishHop('human_decision', 'PASS', `${decided.reason} executionAuthority=false.`);
    } else if (job.planApproved) {
      packet = { ...packet, approved: true };
    }

    if (!skip('approved_task_package')) {
      if (!packet.approved) {
        job.state = 'denied';
        await finishHop('approved_task_package', 'DENIED', 'Package requires a human-approved plan.');
        return job;
      }
      const created = createApprovedActionHandoff({
        id: `pkg_${need.id}`,
        packet,
        requestedActions: need.requestedActions ?? ['spend', 'deploy', 'contact_customer', 'change_production'],
      });
      if (!created.accepted) {
        job.state = 'denied';
        await finishHop('approved_task_package', 'DENIED', created.reason);
        return job;
      }
      handoff = created.package;
      job.package = handoff;
      await finishHop(
        'approved_task_package',
        'PASS',
        `Handoff package ${handoff.id} created after human approval. executionAuthority=${handoff.executionAuthority}.`,
      );
    }

    if (!skip('authorized_execution')) {
      if (!handoff) {
        job.state = 'denied';
        await finishHop('authorized_execution', 'DENIED', 'No handoff package.');
        return job;
      }
      const execution = authorizedExecutionFromPackage(handoff);
      const gate = humanGateConsequential({
        action: 'spend',
        consequence: 'CRITICAL',
        production: true,
        financialCommitment: true,
      });
      job.executionAuthority = false;
      job.spendingAuthorized = false;
      job.deployAuthorized = false;
      job.customerContactAuthorized = false;
      job.productionChangeAuthorized = false;
      await finishHop(
        'authorized_execution',
        'DENIED',
        `${execution.reason}; humanGate.executed=${gate.executed}; package≠execution.`,
      );
    }

    if (!skip('outcome')) {
      const actuals = need.actuals ?? [];
      const planned = need.kpiObservations ?? [];
      if (actuals.length === 0) {
        await finishHop('outcome', 'WAITING_DATA', 'Plan-vs-actual: no observed actuals. WAITING_DATA; not invented PASS.');
      } else {
        const compared = actuals.map((actual) => {
          const plan = planned.find((item) => item.metric === actual.metric);
          const actualKpi = evaluateKpi(actual);
          const planKpi = plan ? evaluateKpi(plan) : null;
          return { metric: actual.metric, actual: actualKpi.state, plan: planKpi?.state ?? 'UNKNOWN' };
        });
        await finishHop('outcome', 'PASS', `Plan-vs-actual compared ${compared.length} metrics without promoting plans to facts.`);
      }
    }

    if (!skip('learning')) {
      await appendEvidenceEvent({
        kind: 'evidence',
        storyId: need.id,
        tenantId: need.tenantId,
        universeId: need.universeId,
        summary: `Enterprise ops job ${job.id} packaged without execution authority.`,
        payload: {
          executionAuthority: false,
          packageId: handoff?.id ?? null,
          hops: job.hopRecords.map((item) => `${item.hop}:${item.state}`),
        },
      }, root);
      await appendLearning({
        domain: 'business',
        subject: need.title,
        claimState: 'MODEL_INFERENCE',
        summary: `Ops job ${job.id} ended with packageCreated=${Boolean(handoff)} executionAuthority=false.`,
        sourceRefs: [job.id],
        evidence: job.hopRecords.map((item) => `${item.hop}:${item.state}`),
        taskId: job.id,
      }, root);
      const checkpoints = new LocalCheckpointStore(join(root, '.xiv-local', 'brain-state.json'));
      await checkpoints.checkpoint({
        taskId: job.id,
        at: nowIso(),
        state: 'completed',
        attempt: 1,
        summary: 'Enterprise ops planning checkpoint. Package is not execution authority.',
        nextAction: 'Human owns consequential execution. Do not spend, deploy, or contact customers from this package.',
        evidence: job.hopRecords.map((item) => `${item.hop}:${item.state}`),
      });
      await finishHop('learning', 'PASS', 'Learning ledger and checkpoint written. permissionChange=false productionChange=false.');
    }

    const bcp = businessContinuityPlan(need.title);
    if (need.warRoom) enterWarRoomMode({ tenantId: need.tenantId, sealed: true });
    void bcp;

    job.state = 'completed';
    await saveJob(job, root, queue);
    return job;
  } catch (error) {
    if (error instanceof OpsSimulatedCrash) {
      job.state = 'running';
      await saveJob(job, root, queue);
      throw error;
    }
    job.state = 'failed';
    await saveJob(job, root, queue);
    throw error;
  }
}

export async function resumeOpsJob(input: { need: EnterpriseNeed; root: string }) {
  await recoverInterruptedOpsJobs(input.root);
  const jobs = await listOpsJobs(input.root);
  const job = jobs.find((item) => item.needId === input.need.id);
  if (!job) throw new Error('OPS_JOB_NOT_FOUND');
  return runEnterpriseOpsCycle({ need: input.need, root: input.root, resume: job });
}

export function planVersusActual(planned: KpiObservation[], actuals: KpiObservation[]) {
  if (actuals.length === 0) {
    return { state: 'WAITING_DATA' as const, compared: 0, inventedPass: false as const };
  }
  const compared = actuals.map((actual) => ({
    metric: actual.metric,
    actual: evaluateKpi(actual),
    plan: planned.find((item) => item.metric === actual.metric) ? evaluateKpi(planned.find((item) => item.metric === actual.metric)!) : null,
  }));
  return { state: 'PASS' as const, compared: compared.length, inventedPass: false as const, rows: compared };
}

export function commandCenterBenchmarks(jobs: OpsJob[]) {
  return {
    jobs: jobs.length,
    completed: jobs.filter((item) => item.state === 'completed').length,
    packagesCreated: jobs.filter((item) => item.package?.packageCreated).length,
    executionsAuthorized: jobs.filter((item) => item.executionAuthority).length,
    spendingAuthorized: jobs.filter((item) => item.spendingAuthorized).length,
    materializedScaleClaim: false as const,
    windowsNodeVerification: 'NOT_TESTED' as const,
  };
}

export async function buildOpsHealthReport(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const jobs = await listOpsJobs(root);
  const model = await localModelStatus();
  const repoRoot = existsSync(join(root, 'docs', 'operations')) ? root : join(root, '..', '..');
  const predecessorFile = (relative: string): OpsEvidenceState =>
    existsSync(join(repoRoot, relative)) ? 'PASS' : 'WAITING_DATA';
  const connectors = probePredecessorConnectors(repoRoot);
  const benches = commandCenterBenchmarks(jobs);

  return {
    generatedAt: new Date().toISOString(),
    tenantId: input.tenantId,
    universeId: input.universeId,
    cycle: ENTERPRISE_OPS_CYCLE,
    jobs: jobs.length,
    completed: benches.completed,
    packagesCreated: benches.packagesCreated,
    executionsAuthorized: benches.executionsAuthorized,
    spendingAuthorized: benches.spendingAuthorized,
    localModel: {
      availability: model.availability === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE',
      reason: model.reason,
    },
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.state === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE',
      configured: slot.configured,
    })),
    predecessor: {
      aoSupplyChain: predecessorFile('docs/operations/62L_AO_GLOBAL_AGENTIC_SUPPLY_CHAIN_NETWORK_REPORT.md'),
      anControlTower: predecessorFile('docs/operations/62L_AN_INFORMATION_CONTROL_TOWER_REPORT.md'),
      amDataFabric: predecessorFile('docs/operations/62L_AM_INFORMATION_SUPPLY_CHAIN_DATA_FABRIC_REPORT.md'),
      alAppNetwork: predecessorFile('docs/operations/62L_AL_DISTRIBUTED_APP_NETWORK_EDGE_SYNC_REPORT.md'),
      akMarketplace: predecessorFile('docs/operations/62L_AK_OFFLINE_DEVELOPER_PLATFORM_MARKETPLACE_REPORT.md'),
      ajFactory: predecessorFile('docs/operations/62L_AJ_OFFLINE_SOFTWARE_FACTORY_PLUGINS_REPORT.md'),
      ahCausalTwins: predecessorFile('docs/operations/62L_AH_CAUSAL_WORLD_MODEL_DIGITAL_TWINS_REPORT.md'),
      agAgentSociety: predecessorFile('docs/operations/62L_AG_PERSISTENT_OFFLINE_AGENT_SOCIETY_REPORT.md'),
      afUniverseKernel: predecessorFile('docs/operations/62L_AF_UNIVERSE_OS_KERNEL_MEMORY_REPLICATION_REPORT.md'),
    },
    connectors,
    honesty: {
      ...OPS_HONESTY,
      windowsNodeVerification: 'NOT_TESTED' as const,
    },
    next: '62L-AQ — Enterprise Event Nervous System + Real-Time Exception Mesh + Predictive Operations Intelligence',
  };
}

export { analyzeBottlenecks, buildWorkflowGraph, detectDeadlock, detectDependencies, linkKpisToWorkflow } from './enterprise-ops-graph';
export { generatePlanOptions, openRiskRegister, reviewCostPolicy, solveConstraints } from './enterprise-ops-planning';
export {
  agentSelfGrantDecisionRight,
  buildDecisionPacket,
  decisionRightsMatrix,
  enqueueExecutiveDecision,
  humanDecide,
  humanGateConsequential,
  lookupDecisionRight,
} from './enterprise-ops-decisions';
export {
  businessContinuityPlan,
  conveneOpsAgentCouncil,
  departmentContext,
  enterWarRoomMode,
  probePredecessorConnectors,
  runDepartmentWorkcell,
} from './enterprise-ops-workcells';
export {
  authorizedExecutionFromPackage,
  createApprovedActionHandoff,
  provePackageIsNotExecutionAuthority,
} from './enterprise-ops-handoff';

export const WORKCELL_KINDS: WorkcellKind[] = ['finance', 'sales', 'procurement', 'it', 'people'];
