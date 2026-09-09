import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { runBoundedKernel } from '../kernels';
import {
  agentCaller,
  analysisWorkload,
  enroll,
  expectOk,
  guardian,
  intelWorkstation,
  newFabric,
  nodeCaller,
  operator,
  proveFor,
  proveLanes,
} from './fixtures';

/**
 * Story sections 17, 18 and 29: every runtime carries limits and a workload
 * stops when a resource limit is reached.
 */

function budgetedFabric(limitOverrides: Parameters<typeof enroll>[0]['resourceBudget']) {
  const fabric = newFabric();
  const op = operator();
  proveLanes(fabric, op, ['intel_x86_64']);
  const node = enroll({
    fabric,
    hardware: intelWorkstation(),
    nodeType: 'workstation',
    allowedWorkloads: ['analysis'],
    resourceBudget: limitOverrides,
  });
  return { fabric, op, node };
}

function submitAndSchedule(fabric: ReturnType<typeof budgetedFabric>['fabric']) {
  const submitted = expectOk(
    fabric.submitWorkload(agentCaller('agent_supply'), analysisWorkload('agent_supply')),
    'submitWorkload',
  );
  return expectOk(fabric.scheduleWorkload(guardian(), submitted.workload.workloadId), 'scheduleWorkload').decision;
}

describe('resource governor', () => {
  it('reserves against the node budget and refuses the next workload when it is spent', () => {
    const { fabric, op, node } = budgetedFabric({ taskCount: 1 });

    const first = submitAndSchedule(fabric);
    assert.equal(first.outcome, 'scheduled');

    const second = submitAndSchedule(fabric);
    assert.equal(second.outcome, 'queued');
    assert.deepEqual(
      second.candidates.map((candidate) => candidate.reason),
      ['budget_exhausted'],
    );

    const budget = expectOk(fabric.getBudget(op, { kind: 'node', id: node.nodeId }), 'getBudget').budget;
    assert.equal(budget.used.taskCount, 1);
  });

  it('returns the reservation when an assignment is cancelled', () => {
    const { fabric, op, node } = budgetedFabric({ taskCount: 1 });

    const first = submitAndSchedule(fabric);
    expectOk(fabric.cancelWorkload(op, first.workloadId, 'operator changed their mind'), 'cancelWorkload');

    const budget = expectOk(fabric.getBudget(op, { kind: 'node', id: node.nodeId }), 'getBudget').budget;
    assert.equal(budget.used.taskCount, 0);

    const second = submitAndSchedule(fabric);
    assert.equal(second.outcome, 'scheduled');
  });

  it('stops a running task the moment a limit is crossed', () => {
    const { fabric, op, node } = budgetedFabric({ tokens: 1_000 });
    const decision = submitAndSchedule(fabric);
    const runtime = nodeCaller(node.nodeId);

    expectOk(
      fabric.startAssignment(runtime, {
        assignmentId: decision.assignmentId!,
        ...proveFor(fabric, runtime, node.nodeId, node.secret, 'execute'),
      }),
      'startAssignment',
    );

    const withinBudget = expectOk(
      fabric.reportUsage(runtime, { assignmentId: decision.assignmentId!, usage: { tokens: 400 } }),
      'reportUsage',
    );
    assert.equal(withinBudget.directive, 'continue');

    const overBudget = expectOk(
      fabric.reportUsage(runtime, { assignmentId: decision.assignmentId!, usage: { tokens: 900 } }),
      'reportUsage',
    );
    assert.equal(overBudget.directive, 'stop');
    assert.deepEqual(overBudget.breaches, ['tokens']);

    const assignment = expectOk(fabric.getAssignment(op, decision.assignmentId!), 'getAssignment').assignment;
    assert.equal(assignment.status, 'terminated');
    assert.match(assignment.terminationReason ?? '', /budget_limit_reached/);

    const events = expectOk(fabric.listSecurityEvents(op), 'listSecurityEvents').events;
    assert.ok(events.some((event) => event.kind === 'budget_limit_reached'));
  });

  it('refuses a result produced after the governor stopped the task', () => {
    const { fabric, op, node } = budgetedFabric({ tokens: 100 });
    const decision = submitAndSchedule(fabric);
    const runtime = nodeCaller(node.nodeId);

    expectOk(
      fabric.startAssignment(runtime, {
        assignmentId: decision.assignmentId!,
        ...proveFor(fabric, runtime, node.nodeId, node.secret, 'execute'),
      }),
      'startAssignment',
    );
    expectOk(
      fabric.reportUsage(runtime, { assignmentId: decision.assignmentId!, usage: { tokens: 500 } }),
      'reportUsage',
    );

    const local = runBoundedKernel(analysisWorkload('agent_supply').task);
    const late = fabric.completeAssignment(runtime, {
      assignmentId: decision.assignmentId!,
      modelId: null,
      modelBinding: null,
      output: local.output,
      outputDigest: local.outputDigest,
    });

    assert.equal(late.ok, false);
    assert.equal(late.ok === false && late.code, 'assignment_terminated');

    const events = expectOk(fabric.listSecurityEvents(op), 'listSecurityEvents').events;
    assert.ok(events.some((event) => event.kind === 'post_termination_result_rejected'));
  });

  it('reports a cost estimate for every scheduled workload', () => {
    const { fabric } = budgetedFabric({});
    const decision = submitAndSchedule(fabric);

    assert.ok(decision.cost);
    assert.ok(decision.cost!.monetaryUsd > 0);
    assert.ok(decision.cost!.energyWh > 0);
    assert.equal(decision.cost!.runtimeMs, 2_000);
  });
});
