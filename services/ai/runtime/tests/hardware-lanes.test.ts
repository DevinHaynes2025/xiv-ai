import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { runBoundedKernel } from '../kernels';
import {
  amdWorkstation,
  analysisWorkload,
  agentCaller,
  approveModel,
  enroll,
  expectOk,
  gpuModel,
  gpuWorkload,
  guardian,
  intelWorkstation,
  newFabric,
  nodeCaller,
  nvidiaGpuHost,
  operator,
  proveFor,
  proveLanes,
} from './fixtures';
import type { BoundedTask, WorkloadRequest } from '../types';

/**
 * Story section 29: the Intel, AMD and NVIDIA runtime tests. The bounded kernel
 * contract is hardware independent, so the three lanes must agree exactly.
 */

type LaneRun = {
  output: number;
  placement: string | null;
  modelId: string | null;
  nodeId: string;
};

function runBoundedWorkloadOnLane(input: {
  laneId: string;
  hardwareFactory: () => ReturnType<typeof intelWorkstation>;
  nodeType: Parameters<typeof enroll>[0]['nodeType'];
  request: WorkloadRequest;
  withGpuModel?: boolean;
}): LaneRun {
  const fabric = newFabric();
  const op = operator();
  const router = guardian();

  proveLanes(fabric, op, [input.laneId]);

  const { nodeId, secret } = enroll({
    fabric,
    hardware: input.hardwareFactory(),
    nodeType: input.nodeType,
    allowedWorkloads: ['analysis', 'inference', 'embedding'],
  });

  if (input.withGpuModel) approveModel(fabric, op, gpuModel());

  const submitted = expectOk(
    fabric.submitWorkload(agentCaller(input.request.agentId), input.request),
    'submitWorkload',
  );
  expectOk(fabric.classifyWorkload(router, submitted.workload.workloadId), 'classifyWorkload');
  const scheduled = expectOk(fabric.scheduleWorkload(router, submitted.workload.workloadId), 'scheduleWorkload');

  assert.equal(scheduled.decision.outcome, 'scheduled', JSON.stringify(scheduled.decision.candidates));
  assert.equal(scheduled.decision.nodeId, nodeId);

  const assignmentId = scheduled.decision.assignmentId!;
  const runtime = nodeCaller(nodeId);
  expectOk(
    fabric.startAssignment(runtime, {
      assignmentId,
      ...proveFor(fabric, runtime, nodeId, secret, 'execute'),
    }),
    'startAssignment',
  );

  const assignment = expectOk(fabric.getAssignment(op, assignmentId), 'getAssignment').assignment;
  const local = runBoundedKernel(input.request.task as BoundedTask);
  const completed = expectOk(
    fabric.completeAssignment(runtime, {
      assignmentId,
      modelId: assignment.modelId,
      modelBinding: assignment.modelBinding,
      output: local.output,
      outputDigest: local.outputDigest,
    }),
    'completeAssignment',
  );

  return {
    output: completed.output,
    placement: scheduled.decision.placement,
    modelId: assignment.modelId,
    nodeId,
  };
}

describe('XHAL hardware lanes', () => {
  it('treats every vendor lane as unproven until it is individually validated', () => {
    const fabric = newFabric();
    const op = operator();

    const matrix = expectOk(fabric.getHardwareSupportMatrix(op), 'getHardwareSupportMatrix');
    assert.ok(matrix.lanes.length > 0);
    assert.ok(matrix.lanes.every((lane) => lane.support === 'unproven'));

    enroll({ fabric, hardware: intelWorkstation(), nodeType: 'workstation', allowedWorkloads: ['analysis'] });

    const submitted = expectOk(
      fabric.submitWorkload(agentCaller('agent_supply'), analysisWorkload('agent_supply')),
      'submitWorkload',
    );
    const decision = expectOk(
      fabric.scheduleWorkload(guardian(), submitted.workload.workloadId),
      'scheduleWorkload',
    ).decision;

    assert.equal(decision.outcome, 'queued');
    assert.ok(decision.candidates.every((candidate) => candidate.reason === 'vendor_unproven'));
  });

  it('refuses to mark a lane proven without validation evidence', () => {
    const fabric = newFabric();
    const denial = fabric.recordVendorValidation(operator(), {
      laneId: 'intel_x86_64',
      support: 'proven',
      evidence: [],
    });
    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'validation_evidence_missing');
  });

  it('runs a bounded workload on an authorized Intel node', () => {
    const run = runBoundedWorkloadOnLane({
      laneId: 'intel_x86_64',
      hardwareFactory: () => intelWorkstation(),
      nodeType: 'workstation',
      request: analysisWorkload('agent_supply'),
    });
    assert.equal(run.placement, 'cpu');
    assert.equal(run.output, runBoundedKernel(analysisWorkload('agent_supply').task).output);
  });

  it('honours the same contract on an authorized AMD node', () => {
    const intel = runBoundedWorkloadOnLane({
      laneId: 'intel_x86_64',
      hardwareFactory: () => intelWorkstation(),
      nodeType: 'workstation',
      request: analysisWorkload('agent_supply'),
    });
    const amd = runBoundedWorkloadOnLane({
      laneId: 'amd_x86_64',
      hardwareFactory: () => amdWorkstation(),
      nodeType: 'workstation',
      request: analysisWorkload('agent_supply'),
    });

    assert.equal(amd.placement, 'cpu');
    assert.equal(amd.output, intel.output);
  });

  it('routes an approved GPU workload to an authorized NVIDIA node with an evaluated model', () => {
    const request = gpuWorkload('agent_demand');
    const run = runBoundedWorkloadOnLane({
      laneId: 'nvidia_cuda_amd_host',
      hardwareFactory: () => nvidiaGpuHost(),
      nodeType: 'cloud_gpu',
      request,
      withGpuModel: true,
    });

    assert.equal(run.placement, 'gpu');
    assert.equal(run.modelId, 'xiv-large-gpu');
    assert.equal(run.output, runBoundedKernel(request.task).output);
  });
});
