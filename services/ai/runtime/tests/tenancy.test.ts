import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { classifyWorkload } from '../classify';
import { defaultNodeBudget, zeroUsage } from '../budgets';
import { evaluateCandidate } from '../eligibility';
import { runBoundedKernel } from '../kernels';
import {
  ORG_A,
  ORG_B,
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
 * Story sections 24 and 29: a shared physical fabric must not collapse Universe
 * isolation, and Organization A must never retrieve Organization B data.
 */

function twoTenantFabric() {
  const fabric = newFabric();
  const opA = operator(ORG_A, 'operator_alpha');
  const opB = operator(ORG_B, 'operator_beta');

  proveLanes(fabric, opA, ['intel_x86_64']);

  const alpha = enroll({
    fabric,
    scope: ORG_A,
    hardware: intelWorkstation(ORG_A),
    nodeType: 'workstation',
    allowedWorkloads: ['analysis'],
  });
  const beta = enroll({
    fabric,
    scope: ORG_B,
    caller: opB,
    hardware: intelWorkstation(ORG_B, { runtimeNode: 'beta-workstation' }),
    nodeType: 'workstation',
    allowedWorkloads: ['analysis'],
  });

  return { fabric, opA, opB, alpha, beta };
}

describe('cross-tenant compute isolation', () => {
  it('never schedules one universe onto another universe hardware', () => {
    const { fabric, alpha } = twoTenantFabric();

    const submitted = expectOk(
      fabric.submitWorkload(agentCaller('agent_alpha', ORG_A), analysisWorkload('agent_alpha')),
      'submitWorkload',
    );
    const decision = expectOk(
      fabric.scheduleWorkload(guardian(ORG_A), submitted.workload.workloadId),
      'scheduleWorkload',
    ).decision;

    assert.equal(decision.nodeId, alpha.nodeId);
    assert.equal(decision.candidates.length, 1, 'only in-scope nodes may appear in a decision');
  });

  it('hides another universe rows from reads and records the attempt', () => {
    const { fabric, opB, alpha } = twoTenantFabric();

    const submitted = expectOk(
      fabric.submitWorkload(agentCaller('agent_alpha', ORG_A), analysisWorkload('agent_alpha')),
      'submitWorkload',
    );
    const workloadId = submitted.workload.workloadId;
    expectOk(fabric.scheduleWorkload(guardian(ORG_A), workloadId), 'scheduleWorkload');

    const stolenWorkload = fabric.getWorkload(opB, workloadId);
    assert.equal(stolenWorkload.ok, false);
    assert.equal(stolenWorkload.ok === false && stolenWorkload.code, 'workload_unknown');

    const stolenLineage = fabric.getLineage(opB, workloadId);
    assert.equal(stolenLineage.ok, false);

    const stolenNode = fabric.getNode(opB, alpha.nodeId);
    assert.equal(stolenNode.ok, false);

    const betaEvents = expectOk(fabric.listSecurityEvents(opB), 'listSecurityEvents').events;
    assert.ok(betaEvents.some((event) => event.kind === 'cross_tenant_read_blocked'));

    const alphaWorkloads = expectOk(fabric.listWorkloads(operator(ORG_A, 'operator_alpha')), 'listWorkloads');
    assert.equal(alphaWorkloads.workloads.length, 1);
    const betaWorkloads = expectOk(fabric.listWorkloads(opB), 'listWorkloads');
    assert.equal(betaWorkloads.workloads.length, 0);
  });

  it('shows each universe only its own capability inventory', () => {
    const { fabric, opA, opB, alpha, beta } = twoTenantFabric();

    const alphaView = expectOk(fabric.getRuntimeCapabilities(opA), 'getRuntimeCapabilities');
    const betaView = expectOk(fabric.getRuntimeCapabilities(opB), 'getRuntimeCapabilities');

    assert.deepEqual(alphaView.nodes?.map((node) => node.nodeId), [alpha.nodeId]);
    assert.deepEqual(betaView.nodes?.map((node) => node.nodeId), [beta.nodeId]);
  });

  it('gives agents capability answers rather than a machine inventory', () => {
    const { fabric } = twoTenantFabric();

    const view = expectOk(
      fabric.getRuntimeCapabilities(agentCaller('agent_alpha', ORG_A), { capability: 'cpu.analysis.medium' }),
      'getRuntimeCapabilities',
    );

    assert.equal(view.view, 'capability');
    assert.equal(view.nodes, undefined);
    assert.ok(view.capabilities.length > 0);
  });

  it('refuses a workload request that names infrastructure directly', () => {
    const { fabric, alpha } = twoTenantFabric();

    const denial = fabric.submitWorkload(
      agentCaller('agent_alpha', ORG_A),
      analysisWorkload('agent_alpha', { preferredNodeId: alpha.nodeId }),
    );

    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'agent_node_selection_forbidden');

    const events = expectOk(fabric.listSecurityEvents(operator(ORG_A, 'operator_alpha')), 'listSecurityEvents').events;
    assert.ok(events.some((event) => event.kind === 'agent_node_selection_blocked'));
  });

  it('keeps a completed result readable only inside its own universe', () => {
    const { fabric, opA, opB, alpha } = twoTenantFabric();

    const submitted = expectOk(
      fabric.submitWorkload(agentCaller('agent_alpha', ORG_A), analysisWorkload('agent_alpha')),
      'submitWorkload',
    );
    const workloadId = submitted.workload.workloadId;
    const decision = expectOk(fabric.scheduleWorkload(guardian(ORG_A), workloadId), 'scheduleWorkload').decision;
    const runtime = nodeCaller(alpha.nodeId, ORG_A);

    expectOk(
      fabric.startAssignment(runtime, {
        assignmentId: decision.assignmentId!,
        ...proveFor(fabric, runtime, alpha.nodeId, alpha.secret, 'execute'),
      }),
      'startAssignment',
    );
    const local = runBoundedKernel(analysisWorkload('agent_alpha').task);
    expectOk(
      fabric.completeAssignment(runtime, {
        assignmentId: decision.assignmentId!,
        modelId: null,
        modelBinding: null,
        output: local.output,
        outputDigest: local.outputDigest,
      }),
      'completeAssignment',
    );

    assert.equal(expectOk(fabric.getLineage(opA, workloadId), 'getLineage').lineage.chain.length > 0, true);
    assert.equal(fabric.getAssignment(opB, decision.assignmentId!).ok, false);
  });

  it('scopes an agent stop to the Universe that issued it', () => {
    const { fabric, opA, opB } = twoTenantFabric();
    const opBFull = operator(ORG_B, 'operator_beta');

    // Both Universes happen to name an agent `agent_supply`.
    expectOk(fabric.stopAgent(opA, 'agent_supply', 'alpha guardian hold'), 'stopAgent');

    const alphaDenial = fabric.submitWorkload(agentCaller('agent_supply', ORG_A), analysisWorkload('agent_supply'));
    assert.equal(alphaDenial.ok, false);

    const betaSubmission = fabric.submitWorkload(
      agentCaller('agent_supply', ORG_B),
      analysisWorkload('agent_supply'),
    );
    assert.equal(betaSubmission.ok, true, 'a stop in one Universe must not reach into another');
    assert.equal(opB.scope.universeId, opBFull.scope.universeId);
  });

  it('rejects a foreign node at the eligibility layer as defence in depth', () => {
    const { fabric, opB, beta } = twoTenantFabric();
    const foreignNode = expectOk(fabric.getNode(opB, beta.nodeId), 'getNode').node;

    const workload = expectOk(
      fabric.submitWorkload(agentCaller('agent_alpha', ORG_A), analysisWorkload('agent_alpha')),
      'submitWorkload',
    ).workload;

    const evaluation = evaluateCandidate({
      node: foreignNode,
      workload,
      classification: classifyWorkload(workload),
      scope: ORG_A,
      laneSupport: 'proven',
      budgetLimit: defaultNodeBudget(),
      budgetUsed: zeroUsage(),
      charge: zeroUsage(),
    });

    assert.equal(evaluation.eligible, false);
    assert.equal(evaluation.reason, 'tenant_mismatch');
  });
});
