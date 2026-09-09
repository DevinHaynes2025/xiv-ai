import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { runBoundedKernel } from '../kernels';
import { mintModelBinding } from '../models';
import {
  agentCaller,
  approveModel,
  enroll,
  expectOk,
  gpuModel,
  gpuWorkload,
  guardian,
  newFabric,
  nodeCaller,
  nvidiaGpuHost,
  operator,
  proveFor,
  proveLanes,
} from './fixtures';

/**
 * Story sections 20, 21 and 29: unproven models remain unavailable, and a
 * runtime cannot silently replace an approved model.
 */

function gpuFabric(options: { approve?: boolean } = {}) {
  const fabric = newFabric();
  const op = operator();
  proveLanes(fabric, op, ['nvidia_cuda_amd_host']);

  const node = enroll({
    fabric,
    hardware: nvidiaGpuHost(),
    nodeType: 'cloud_gpu',
    allowedWorkloads: ['inference', 'embedding'],
  });

  if (options.approve !== false) approveModel(fabric, op, gpuModel());
  return { fabric, op, node };
}

function scheduleGpuWork(fabric: ReturnType<typeof gpuFabric>['fabric']) {
  const request = gpuWorkload('agent_demand');
  const submitted = expectOk(fabric.submitWorkload(agentCaller('agent_demand'), request), 'submitWorkload');
  const decision = expectOk(
    fabric.scheduleWorkload(guardian(), submitted.workload.workloadId),
    'scheduleWorkload',
  ).decision;
  return { request, workloadId: submitted.workload.workloadId, decision };
}

describe('model registry and routing', () => {
  it('keeps a registered but unevaluated model unavailable', () => {
    const { fabric, op } = gpuFabric({ approve: false });
    const registered = expectOk(fabric.registerModel(op, gpuModel()), 'registerModel');

    assert.equal(registered.model.evaluationState, 'unevaluated');
    assert.equal(registered.model.availability, 'unavailable');

    const { decision } = scheduleGpuWork(fabric);
    assert.equal(decision.outcome, 'escalated');
    assert.match(decision.reason, /no_authorized_model/);
    assert.match(decision.reason, /model_unavailable/);
  });

  it('routes to an evaluated model and binds it to the assignment', () => {
    const { fabric, op } = gpuFabric();
    const { decision } = scheduleGpuWork(fabric);

    assert.equal(decision.modelId, 'xiv-large-gpu');
    const assignment = expectOk(fabric.getAssignment(op, decision.assignmentId!), 'getAssignment').assignment;
    assert.ok(assignment.modelBinding);
  });

  it('detects a runtime that swaps the approved model and quarantines the node', () => {
    const { fabric, op, node } = gpuFabric();
    approveModel(fabric, op, gpuModel(undefined, { modelId: 'xiv-rogue-gpu', fingerprint: 'sha256:rogue' }));

    const { request, decision } = scheduleGpuWork(fabric);
    const runtime = nodeCaller(node.nodeId);
    expectOk(
      fabric.startAssignment(runtime, {
        assignmentId: decision.assignmentId!,
        ...proveFor(fabric, runtime, node.nodeId, node.secret, 'execute'),
      }),
      'startAssignment',
    );

    const assignment = expectOk(fabric.getAssignment(op, decision.assignmentId!), 'getAssignment').assignment;
    const local = runBoundedKernel(request.task);
    const substituted = fabric.completeAssignment(runtime, {
      assignmentId: decision.assignmentId!,
      modelId: 'xiv-rogue-gpu',
      modelBinding: assignment.modelBinding,
      output: local.output,
      outputDigest: local.outputDigest,
    });

    assert.equal(substituted.ok, false);
    assert.equal(substituted.ok === false && substituted.code, 'model_substitution_detected');

    const quarantined = expectOk(fabric.getNode(op, node.nodeId), 'getNode').node;
    assert.equal(quarantined.lifecycle, 'quarantined');
    assert.equal(
      expectOk(fabric.getAssignment(op, decision.assignmentId!), 'getAssignment').assignment.status,
      'terminated',
    );

    const events = expectOk(fabric.listSecurityEvents(op), 'listSecurityEvents').events;
    assert.ok(events.some((event) => event.kind === 'model_substitution_detected'));
  });

  it('rejects a model binding that the control plane did not mint', () => {
    const { fabric, op, node } = gpuFabric();
    const { request, decision } = scheduleGpuWork(fabric);
    const runtime = nodeCaller(node.nodeId);
    expectOk(
      fabric.startAssignment(runtime, {
        assignmentId: decision.assignmentId!,
        ...proveFor(fabric, runtime, node.nodeId, node.secret, 'execute'),
      }),
      'startAssignment',
    );

    const local = runBoundedKernel(request.task);
    const forged = fabric.completeAssignment(runtime, {
      assignmentId: decision.assignmentId!,
      modelId: 'xiv-large-gpu',
      modelBinding: mintModelBinding('a-key-the-node-invented', {
        assignmentId: decision.assignmentId!,
        modelId: 'xiv-large-gpu',
        fingerprint: 'sha256:gpu-weights-v1',
      }),
      output: local.output,
      outputDigest: local.outputDigest,
    });

    assert.equal(forged.ok, false);
    assert.equal(forged.ok === false && forged.code, 'model_substitution_detected');
    assert.equal(expectOk(fabric.getNode(op, node.nodeId), 'getNode').node.lifecycle, 'quarantined');
  });

  it('rejects a result that does not match the bounded kernel contract', () => {
    const { fabric, op, node } = gpuFabric();
    const { decision } = scheduleGpuWork(fabric);
    const runtime = nodeCaller(node.nodeId);
    expectOk(
      fabric.startAssignment(runtime, {
        assignmentId: decision.assignmentId!,
        ...proveFor(fabric, runtime, node.nodeId, node.secret, 'execute'),
      }),
      'startAssignment',
    );

    const assignment = expectOk(fabric.getAssignment(op, decision.assignmentId!), 'getAssignment').assignment;
    const invented = fabric.completeAssignment(runtime, {
      assignmentId: decision.assignmentId!,
      modelId: assignment.modelId,
      modelBinding: assignment.modelBinding,
      output: 999_999,
      outputDigest: 'sha256:not-a-real-digest',
    });

    assert.equal(invented.ok, false);
    assert.equal(invented.ok === false && invented.code, 'result_validation_failed');
  });

  it('stops in-flight work when a model is revoked', () => {
    const { fabric, op, node } = gpuFabric();
    const { decision } = scheduleGpuWork(fabric);
    const runtime = nodeCaller(node.nodeId);
    expectOk(
      fabric.startAssignment(runtime, {
        assignmentId: decision.assignmentId!,
        ...proveFor(fabric, runtime, node.nodeId, node.secret, 'execute'),
      }),
      'startAssignment',
    );

    expectOk(fabric.revokeModel(op, { modelId: 'xiv-large-gpu', reason: 'evaluation regression' }), 'revokeModel');

    const assignment = expectOk(fabric.getAssignment(op, decision.assignmentId!), 'getAssignment').assignment;
    assert.equal(assignment.status, 'terminated');
    assert.match(assignment.terminationReason ?? '', /model_revoked/);
  });
});
