import { CONSEQUENTIAL_ACTIONS, type ConsequentialAction, type OpsDepartment } from './enterprise-ops-types';
import type { BottleneckResult, WorkflowGraph } from './enterprise-ops-graph';

export type PlanOption = {
  id: string;
  title: string;
  summary: string;
  departments: OpsDepartment[];
  estimatedCost: number;
  estimatedDuration: number;
  risks: string[];
  executable: false;
  spendingAuthorized: false;
  deployAuthorized: false;
  customerContactAuthorized: false;
  productionChangeAuthorized: false;
};

export type ConstraintSet = {
  maxBudget: number;
  maxDuration: number;
  maxParallelByDepartment: Partial<Record<OpsDepartment, number>>;
  policyDenyActions: ConsequentialAction[];
};

export type ConstraintSolution = {
  feasible: boolean;
  violations: string[];
  spendingUsed: false;
  productionChanged: false;
  selectedOptionId: string | null;
};

export type RiskEntry = {
  id: string;
  department: OpsDepartment;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitigation: string;
  owner: 'human';
  autoMitigated: false;
};

export type RiskRegister = {
  id: string;
  tenantId: string;
  universeId: string;
  enterpriseId: string;
  entries: RiskEntry[];
  productionEffect: false;
};

export function generatePlanOptions(input: {
  need: string;
  graph: WorkflowGraph;
  bottlenecks: BottleneckResult;
}): PlanOption[] {
  const departments = [...new Set(input.graph.nodes.map((node) => node.department))];
  const duration = input.bottlenecks.criticalPathDuration;
  const bottleneckDepts = [...new Set(input.bottlenecks.bottlenecks.map((item) => item.department))];
  return [
    {
      id: 'plan_sequential_governed',
      title: 'Sequential governed plan',
      summary: `Walk ${input.graph.nodes.length} workflow nodes in dependency order for need "${input.need}". Agents recommend; humans decide.`,
      departments,
      estimatedCost: 0,
      estimatedDuration: duration,
      risks: bottleneckDepts.map((dept) => `Bottleneck in ${dept}`),
      executable: false,
      spendingAuthorized: false,
      deployAuthorized: false,
      customerContactAuthorized: false,
      productionChangeAuthorized: false,
    },
    {
      id: 'plan_parallel_prep',
      title: 'Parallel local preparation (no external effect)',
      summary: 'Prepare department workcells in parallel inside the sandbox. No spend, deploy, customer contact, or production change.',
      departments,
      estimatedCost: 0,
      estimatedDuration: Math.max(1, Math.ceil(duration / Math.max(1, departments.length))),
      risks: ['Parallel prep still cannot authorize consequential actions.'],
      executable: false,
      spendingAuthorized: false,
      deployAuthorized: false,
      customerContactAuthorized: false,
      productionChangeAuthorized: false,
    },
    {
      id: 'plan_do_nothing_until_human',
      title: 'Hold until human decision',
      summary: 'Keep the graph, risks, and evidence packet queued. Do not execute.',
      departments: ['executive'],
      estimatedCost: 0,
      estimatedDuration: 0,
      risks: ['Delay cost is a recommendation, not a spend.'],
      executable: false,
      spendingAuthorized: false,
      deployAuthorized: false,
      customerContactAuthorized: false,
      productionChangeAuthorized: false,
    },
  ];
}

export function solveConstraints(input: {
  option: PlanOption;
  constraints: ConstraintSet;
}): ConstraintSolution {
  const violations: string[] = [];
  if (input.option.estimatedCost > input.constraints.maxBudget) {
    violations.push('BUDGET_EXCEEDED_REQUIRES_HUMAN_FINANCE');
  }
  if (input.option.estimatedDuration > input.constraints.maxDuration) {
    violations.push('DURATION_EXCEEDED');
  }
  for (const action of CONSEQUENTIAL_ACTIONS) {
    if (input.constraints.policyDenyActions.includes(action) && input.option.estimatedCost > 0 && action === 'spend') {
      violations.push(`POLICY_DENIES:${action}`);
    }
  }
  if (input.option.executable) {
    violations.push('PLAN_OPTION_MUST_NOT_BE_EXECUTABLE');
  }
  return {
    feasible: violations.length === 0,
    violations,
    spendingUsed: false,
    productionChanged: false,
    selectedOptionId: violations.length === 0 ? input.option.id : null,
  };
}

export function openRiskRegister(input: {
  id: string;
  tenantId: string;
  universeId: string;
  enterpriseId: string;
  graph: WorkflowGraph;
  deadlock: boolean;
  bottlenecks: BottleneckResult;
}): RiskRegister {
  const entries: RiskEntry[] = [];
  if (input.deadlock) {
    entries.push({
      id: 'risk_deadlock',
      department: 'executive',
      title: 'Workflow deadlock',
      severity: 'CRITICAL',
      mitigation: 'Human must break the wait-for cycle. Agents must not force execution.',
      owner: 'human',
      autoMitigated: false,
    });
  }
  for (const bottleneck of input.bottlenecks.bottlenecks) {
    entries.push({
      id: `risk_bn_${bottleneck.nodeId}`,
      department: bottleneck.department,
      title: `Bottleneck ${bottleneck.nodeId}`,
      severity: bottleneck.fanIn >= 3 ? 'HIGH' : 'MEDIUM',
      mitigation: 'Re-sequence or add human-owned capacity. Do not auto-spend or auto-hire.',
      owner: 'human',
      autoMitigated: false,
    });
  }
  if (entries.length === 0) {
    entries.push({
      id: 'risk_baseline',
      department: 'executive',
      title: 'Governed plan residual risk',
      severity: 'LOW',
      mitigation: 'Keep the human gate closed for consequential actions.',
      owner: 'human',
      autoMitigated: false,
    });
  }
  return {
    id: input.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    enterpriseId: input.enterpriseId,
    entries,
    productionEffect: false,
  };
}

export function reviewCostPolicy(input: {
  option: PlanOption;
  solution: ConstraintSolution;
  requestedActions: ConsequentialAction[];
}) {
  const blocked = input.requestedActions.filter((action) => CONSEQUENTIAL_ACTIONS.includes(action));
  return {
    optionId: input.option.id,
    feasible: input.solution.feasible,
    blockedConsequentialActions: blocked,
    costCommitted: false as const,
    policyChanged: false as const,
    productionAuthorization: false as const,
    reason: blocked.length
      ? 'Cost/policy review records consequential requests as blocked until a human execution grant that is not the plan packet.'
      : 'Cost/policy review passed for a zero-cost recommendation.',
  };
}
