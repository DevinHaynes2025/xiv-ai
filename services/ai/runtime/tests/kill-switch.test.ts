import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { runBoundedKernel } from '../kernels';
import {
  APPROVED_IMAGE,
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
 * Story section 25: the control plane must be able to stop work without the
 * cooperation of the thing being stopped.
 */

const HEALTHY_SAMPLE = {
  healthState: 'healthy' as const,
  thermalState: 'nominal' as const,
  energyState: { source: 'wall' as const, batteryPercent: null, charging: true },
  networkState: 'online' as const,
  memoryAvailableMb: 65_536,
  cpuPressure: 0.1,
  gpuPressure: 0,
};

function runningFabric(meetingId?: string) {
  const fabric = newFabric();
  const op = operator();
  proveLanes(fabric, op, ['intel_x86_64']);

  const node = enroll({
    fabric,
    hardware: intelWorkstation(),
    nodeType: 'workstation',
    allowedWorkloads: ['analysis'],
  });

  const request = analysisWorkload('agent_supply', meetingId ? { meetingId } : {});
  const submitted = expectOk(fabric.submitWorkload(agentCaller('agent_supply'), request), 'submitWorkload');
  const decision = expectOk(
    fabric.scheduleWorkload(guardian(), submitted.workload.workloadId),
    'scheduleWorkload',
  ).decision;

  const runtime = nodeCaller(node.nodeId);
  expectOk(
    fabric.startAssignment(runtime, {
      assignmentId: decision.assignmentId!,
      ...proveFor(fabric, runtime, node.nodeId, node.secret, 'execute'),
    }),
    'startAssignment',
  );

  return { fabric, op, node, runtime, request, workloadId: submitted.workload.workloadId, decision };
}

describe('runtime kill switch', () => {
  it('quarantines a node and terminates its work without asking the node', () => {
    const { fabric, op, node, runtime, request, decision } = runningFabric();

    const quarantine = expectOk(
      fabric.quarantineRuntime(op, node.nodeId, 'anomalous egress detected'),
      'quarantineRuntime',
    );
    assert.deepEqual(quarantine.terminatedAssignments, [decision.assignmentId!]);
    assert.equal(quarantine.node.attestationState, 'quarantined');

    const local = runBoundedKernel(request.task);
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
    assert.ok(events.some((event) => event.kind === 'runtime_quarantined'));
    assert.ok(events.some((event) => event.kind === 'post_termination_result_rejected'));
  });

  it('tells a quarantined node to stop the next time it checks in', () => {
    const { fabric, op, node, runtime } = runningFabric();
    expectOk(fabric.quarantineRuntime(op, node.nodeId, 'operator hold'), 'quarantineRuntime');

    const heartbeat = expectOk(
      fabric.heartbeatRuntime(runtime, {
        nodeId: node.nodeId,
        ...proveFor(fabric, runtime, node.nodeId, node.secret, 'heartbeat'),
        sample: HEALTHY_SAMPLE,
      }),
      'heartbeatRuntime',
    );

    assert.equal(heartbeat.directive, 'quarantine');
    assert.equal(heartbeat.node.lifecycle, 'quarantined');
  });

  it('will not let a quarantined node attest its way back', () => {
    const { fabric, op, node, runtime } = runningFabric();
    expectOk(fabric.quarantineRuntime(op, node.nodeId, 'operator hold'), 'quarantineRuntime');

    const denial = fabric.attestRuntime(runtime, {
      nodeId: node.nodeId,
      ...proveFor(fabric, runtime, node.nodeId, node.secret, 'attest'),
      measurements: { runtime_image: APPROVED_IMAGE, boot_chain: 'measured' },
    });

    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'runtime_quarantined');
  });

  it('lets running work finish on a draining node while refusing new placements', () => {
    const { fabric, op, node, runtime, request, decision } = runningFabric();

    const drain = expectOk(fabric.drainRuntime(op, node.nodeId, 'maintenance window'), 'drainRuntime');
    assert.deepEqual(drain.terminatedAssignments, []);

    const local = runBoundedKernel(request.task);
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

    const next = expectOk(
      fabric.submitWorkload(agentCaller('agent_supply'), analysisWorkload('agent_supply')),
      'submitWorkload',
    );
    const decisionAfterDrain = expectOk(
      fabric.scheduleWorkload(guardian(), next.workload.workloadId),
      'scheduleWorkload',
    ).decision;

    assert.equal(decisionAfterDrain.outcome, 'queued');
    assert.deepEqual(
      decisionAfterDrain.candidates.map((candidate) => candidate.reason),
      ['node_draining'],
    );
  });

  it('stops a single task on operator command', () => {
    const { fabric, op, workloadId, decision } = runningFabric();

    const stopped = expectOk(fabric.stopTask(op, workloadId, 'human intervention'), 'stopTask');
    assert.deepEqual(stopped.terminated, [decision.assignmentId!]);
    assert.equal(expectOk(fabric.getWorkload(op, workloadId), 'getWorkload').workload.status, 'cancelled');
  });

  it('stops an agent and refuses further work under that identity', () => {
    const { fabric, op, decision } = runningFabric();

    const stopped = expectOk(fabric.stopAgent(op, 'agent_supply', 'guardian hold'), 'stopAgent');
    assert.deepEqual(stopped.terminated, [decision.assignmentId!]);

    const denial = fabric.submitWorkload(agentCaller('agent_supply'), analysisWorkload('agent_supply'));
    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'workload_terminated');
  });

  it('stops a meeting and everything it was running', () => {
    const { fabric, op, workloadId, decision } = runningFabric('meeting_board_review');

    const stopped = expectOk(fabric.stopMeeting(op, 'meeting_board_review', 'chair ended the session'), 'stopMeeting');
    assert.deepEqual(stopped.terminated, [decision.assignmentId!]);
    assert.equal(expectOk(fabric.getWorkload(op, workloadId), 'getWorkload').workload.status, 'cancelled');

    const denial = fabric.submitWorkload(
      agentCaller('agent_supply'),
      analysisWorkload('agent_supply', { meetingId: 'meeting_board_review' }),
    );
    assert.equal(denial.ok, false);
  });

  it('revokes a node so it can never present a proof again', () => {
    const { fabric, op, node, runtime } = runningFabric();
    const revoked = expectOk(fabric.revokeRuntime(op, node.nodeId, 'device lost'), 'revokeRuntime');

    assert.equal(revoked.node.lifecycle, 'revoked');
    assert.equal(revoked.node.trustLevel, 'untrusted');
    assert.ok(revoked.node.revokedAt);

    const challenge = fabric.issueRuntimeChallenge(runtime, { nodeId: node.nodeId, purpose: 'heartbeat' });
    assert.equal(challenge.ok, true, 'the record survives for audit');

    const heartbeat = fabric.heartbeatRuntime(runtime, {
      nodeId: node.nodeId,
      challengeId: challenge.ok ? challenge.challengeId : '',
      proof: 'anything',
      sample: HEALTHY_SAMPLE,
    });
    assert.equal(heartbeat.ok, false);
    assert.equal(heartbeat.ok === false && heartbeat.code, 'runtime_identity_unknown');
  });

  it('keeps the kill switch away from agents', () => {
    const { fabric, node, workloadId } = runningFabric();
    const agent = agentCaller('agent_supply');

    assert.equal(fabric.quarantineRuntime(agent, node.nodeId, 'let me out').ok, false);
    assert.equal(fabric.stopTask(agent, workloadId, 'let me out').ok, false);
    assert.equal(fabric.revokeRuntime(agent, node.nodeId, 'let me out').ok, false);
  });
});
