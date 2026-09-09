import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { digest } from '../crypto';
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
import type { WorkloadRequest } from '../types';

/**
 * Story sections 26 and 29: a node failure recovers retriable computation
 * without ever replaying a consequential external action.
 */

function twoNodeFabric() {
  const fabric = newFabric();
  const op = operator();
  proveLanes(fabric, op, ['intel_x86_64', 'amd_x86_64']);

  const primary = enroll({
    fabric,
    hardware: intelWorkstation(undefined, { runtimeNode: 'intel-primary' }),
    nodeType: 'workstation',
    deviceId: 'device_primary',
    allowedWorkloads: ['analysis'],
    securityPolicy: { allowConsequentialActions: true },
  });
  const standby = enroll({
    fabric,
    hardware: intelWorkstation(undefined, { runtimeNode: 'intel-standby' }),
    nodeType: 'workstation',
    deviceId: 'device_standby',
    allowedWorkloads: ['analysis'],
    securityPolicy: { allowConsequentialActions: true },
  });

  return { fabric, op, primary, standby };
}

function startWork(
  fabric: ReturnType<typeof twoNodeFabric>['fabric'],
  nodes: { nodeId: string; secret: string }[],
  request: WorkloadRequest,
) {
  const submitted = expectOk(fabric.submitWorkload(agentCaller(request.agentId), request), 'submitWorkload');
  const decision = expectOk(
    fabric.scheduleWorkload(guardian(), submitted.workload.workloadId),
    'scheduleWorkload',
  ).decision;

  const node = nodes.find((candidate) => candidate.nodeId === decision.nodeId)!;
  const runtime = nodeCaller(node.nodeId);
  expectOk(
    fabric.startAssignment(runtime, {
      assignmentId: decision.assignmentId!,
      ...proveFor(fabric, runtime, node.nodeId, node.secret, 'execute'),
    }),
    'startAssignment',
  );

  return { workloadId: submitted.workload.workloadId, decision, node, runtime };
}

describe('runtime failure recovery', () => {
  it('resumes retriable computation on another authorized node', () => {
    const { fabric, op, primary, standby } = twoNodeFabric();
    const request = analysisWorkload('agent_supply');
    const started = startWork(fabric, [primary, standby], request);

    expectOk(
      fabric.recordCheckpoint(started.runtime, {
        assignmentId: started.decision.assignmentId!,
        progress: 0.5,
        stateDigest: digest({ partial: 'half the reduction' }),
      }),
      'recordCheckpoint',
    );

    const recovery = expectOk(
      fabric.reportNodeFailure(op, { nodeId: started.node.nodeId, detail: 'power loss' }),
      'reportNodeFailure',
    );

    assert.equal(recovery.heldForHumanReview.length, 0);
    assert.equal(recovery.rescheduled.length, 1);
    assert.equal(recovery.rescheduled[0]!.mode, 'resume');
    assert.notEqual(recovery.rescheduled[0]!.nodeId, started.node.nodeId);

    const workload = expectOk(fabric.getWorkload(op, started.workloadId), 'getWorkload').workload;
    assert.equal(workload.status, 'scheduled');
    assert.equal(workload.attempts, 2);
  });

  it('restarts rather than resumes when there is no valid checkpoint', () => {
    const { fabric, op, primary, standby } = twoNodeFabric();
    const started = startWork(fabric, [primary, standby], analysisWorkload('agent_supply'));

    const recovery = expectOk(
      fabric.reportNodeFailure(op, { nodeId: started.node.nodeId, detail: 'kernel panic' }),
      'reportNodeFailure',
    );

    assert.equal(recovery.rescheduled[0]!.mode, 'restart');
  });

  it('never replays a consequential action after a node failure', () => {
    const { fabric, op, primary, standby } = twoNodeFabric();
    const started = startWork(
      fabric,
      [primary, standby],
      analysisWorkload('agent_supply', { consequential: true, sourceLabel: 'supplier reallocation commit' }),
    );

    const recovery = expectOk(
      fabric.reportNodeFailure(op, { nodeId: started.node.nodeId, detail: 'network partition' }),
      'reportNodeFailure',
    );

    assert.equal(recovery.rescheduled.length, 0);
    assert.deepEqual(recovery.heldForHumanReview, [
      { workloadId: started.workloadId, reason: 'external_action_outcome_unknown' },
    ]);

    const workload = expectOk(fabric.getWorkload(op, started.workloadId), 'getWorkload').workload;
    assert.equal(workload.status, 'held_for_human_review');

    const events = expectOk(fabric.listSecurityEvents(op), 'listSecurityEvents').events;
    assert.ok(events.some((event) => event.kind === 'consequential_replay_blocked'));
  });

  it('refuses a second commit of an external action that already succeeded', () => {
    const { fabric, op, primary, standby } = twoNodeFabric();
    const request = analysisWorkload('agent_supply', {
      consequential: true,
      sourceLabel: 'supplier reallocation commit',
    });
    const started = startWork(fabric, [primary, standby], request);

    const local = runBoundedKernel(request.task);
    expectOk(
      fabric.completeAssignment(started.runtime, {
        assignmentId: started.decision.assignmentId!,
        modelId: null,
        modelBinding: null,
        output: local.output,
        outputDigest: local.outputDigest,
        consequentialActionKey: 'supplier_order_4471',
      }),
      'completeAssignment',
    );

    const replayDecision = expectOk(fabric.scheduleWorkload(op, started.workloadId), 'scheduleWorkload').decision;
    const replayNode = [primary, standby].find((candidate) => candidate.nodeId === replayDecision.nodeId)!;
    const replayRuntime = nodeCaller(replayNode.nodeId);
    expectOk(
      fabric.startAssignment(replayRuntime, {
        assignmentId: replayDecision.assignmentId!,
        ...proveFor(fabric, replayRuntime, replayNode.nodeId, replayNode.secret, 'execute'),
      }),
      'startAssignment',
    );

    const replay = fabric.completeAssignment(replayRuntime, {
      assignmentId: replayDecision.assignmentId!,
      modelId: null,
      modelBinding: null,
      output: local.output,
      outputDigest: local.outputDigest,
      consequentialActionKey: 'supplier_order_4471',
    });

    assert.equal(replay.ok, false);
    assert.equal(replay.ok === false && replay.code, 'consequential_replay_blocked');
  });

  it('will not reschedule held work until a human releases it', () => {
    const { fabric, op, primary, standby } = twoNodeFabric();
    const started = startWork(
      fabric,
      [primary, standby],
      analysisWorkload('agent_supply', { consequential: true, sourceLabel: 'supplier reallocation commit' }),
    );
    expectOk(fabric.reportNodeFailure(op, { nodeId: started.node.nodeId, detail: 'rack lost' }), 'reportNodeFailure');

    const blocked = fabric.scheduleWorkload(op, started.workloadId);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.ok === false && blocked.code, 'consequential_replay_blocked');

    const unsigned = fabric.releaseHeldWorkload(op, {
      workloadId: started.workloadId,
      decision: 'reauthorize',
      note: '   ',
    });
    assert.equal(unsigned.ok, false);
    assert.equal(unsigned.ok === false && unsigned.code, 'validation_evidence_missing');

    const released = expectOk(
      fabric.releaseHeldWorkload(op, {
        workloadId: started.workloadId,
        decision: 'reauthorize',
        note: 'confirmed with the supplier that no order was placed',
      }),
      'releaseHeldWorkload',
    );
    assert.equal(released.workload.status, 'queued');
    assert.equal(expectOk(fabric.scheduleWorkload(op, started.workloadId), 'scheduleWorkload').decision.outcome, 'scheduled');

    const lineage = expectOk(fabric.getLineage(op, started.workloadId), 'getLineage').lineage;
    assert.ok(
      lineage.chain.some(
        (entry) => entry.stage === 'decision' && entry.authorizationReason.includes('reauthorize'),
      ),
    );
  });

  it('lets a human discard held work instead of rerunning it', () => {
    const { fabric, op, primary, standby } = twoNodeFabric();
    const started = startWork(
      fabric,
      [primary, standby],
      analysisWorkload('agent_supply', { consequential: true, sourceLabel: 'supplier reallocation commit' }),
    );
    expectOk(fabric.reportNodeFailure(op, { nodeId: started.node.nodeId, detail: 'rack lost' }), 'reportNodeFailure');

    const discarded = expectOk(
      fabric.releaseHeldWorkload(op, {
        workloadId: started.workloadId,
        decision: 'discard',
        note: 'the supplier confirmed the order landed; no rerun',
      }),
      'releaseHeldWorkload',
    );
    assert.equal(discarded.workload.status, 'cancelled');
    assert.equal(fabric.scheduleWorkload(op, started.workloadId).ok, false);
  });

  it('queues the workload when no alternate runtime qualifies', () => {
    const fabric = newFabric();
    const op = operator();
    proveLanes(fabric, op, ['intel_x86_64']);
    const only = enroll({
      fabric,
      hardware: intelWorkstation(),
      nodeType: 'workstation',
      allowedWorkloads: ['analysis'],
    });

    const started = startWork(fabric, [only], analysisWorkload('agent_supply'));
    const recovery = expectOk(
      fabric.reportNodeFailure(op, { nodeId: only.nodeId, detail: 'disk failure' }),
      'reportNodeFailure',
    );

    assert.deepEqual(recovery.queued, [started.workloadId]);
    assert.equal(expectOk(fabric.getWorkload(op, started.workloadId), 'getWorkload').workload.status, 'queued');
  });
});
