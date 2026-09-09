import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { runBoundedKernel } from '../kernels';
import {
  ORG_B,
  agentCaller,
  approveModel,
  enroll,
  expectOk,
  gpuModel,
  gpuWorkload,
  guardian,
  iosPhone,
  intelWorkstation,
  newFabric,
  nodeCaller,
  nvidiaGpuHost,
  operator,
  proveFor,
  proveLanes,
} from './fixtures';

/**
 * Story section 30. One controlled demonstration walks the whole chain:
 *
 *   human -> universe -> agent task force -> compute router -> authorized
 *   runtime -> CPU/GPU/edge execution -> result -> agent meeting -> human
 *   approval -> audit and lineage
 *
 * and section 29's lineage test asks that the execution be reconstructable end
 * to end.
 */

describe('62D definition of done', () => {
  it('walks a governed workload from human request to reconstructable lineage', () => {
    const fabric = newFabric();
    const op = operator();
    const router = guardian();
    const agent = agentCaller('agent_demand_specialist');

    // 1. A human proves the hardware lanes and enrolls the fleet.
    proveLanes(fabric, op, ['intel_x86_64', 'nvidia_cuda_amd_host', 'apple_silicon']);

    const phone = enroll({
      fabric,
      hardware: iosPhone(),
      nodeType: 'mobile_phone',
      deviceId: 'device_founder_phone',
      allowedWorkloads: ['analysis', 'sync'],
    });
    const workstation = enroll({
      fabric,
      hardware: intelWorkstation(),
      nodeType: 'workstation',
      deviceId: 'device_review_workstation',
      allowedWorkloads: ['analysis'],
    });
    const gpuHost = enroll({
      fabric,
      hardware: nvidiaGpuHost(),
      nodeType: 'cloud_gpu',
      deviceId: 'device_cloud_gpu',
      allowedWorkloads: ['inference', 'embedding'],
    });

    approveModel(fabric, op, gpuModel());

    // The phone is an approval surface, not a compute pool.
    const phoneRecord = expectOk(fabric.getNode(op, phone.nodeId), 'getNode').node;
    assert.ok(phoneRecord.capabilities.includes('ui.approval.tiny'));
    assert.equal(phoneRecord.securityPolicy.allowConsequentialActions, false);

    // 2. An agent asks for a capability. It never names a machine.
    const request = gpuWorkload('agent_demand_specialist', { meetingId: 'meeting_supply_council' });
    const submitted = expectOk(fabric.submitWorkload(agent, request), 'submitWorkload');
    const workloadId = submitted.workload.workloadId;

    // 3. The router classifies and places it.
    const classification = expectOk(fabric.classifyWorkload(router, workloadId), 'classifyWorkload').classification;
    assert.equal(classification.preferredPlacement, 'gpu');
    assert.equal(classification.ladder.length, 10);

    const decision = expectOk(fabric.scheduleWorkload(router, workloadId), 'scheduleWorkload').decision;
    assert.equal(decision.outcome, 'scheduled');
    assert.equal(decision.nodeId, gpuHost.nodeId);
    assert.equal(decision.modelId, 'xiv-large-gpu');
    assert.ok(decision.cost && decision.cost.monetaryUsd > 0);

    const rejected = decision.candidates.filter((candidate) => !candidate.eligible);
    assert.deepEqual(
      rejected.map((candidate) => candidate.reason).sort(),
      ['workload_kind_not_allowed', 'workload_kind_not_allowed'],
      'the phone and the workstation are answered with a reason, not silence',
    );

    // 4. The authorized runtime executes the bounded workload.
    const runtime = nodeCaller(gpuHost.nodeId);
    expectOk(
      fabric.startAssignment(runtime, {
        assignmentId: decision.assignmentId!,
        ...proveFor(fabric, runtime, gpuHost.nodeId, gpuHost.secret, 'execute'),
      }),
      'startAssignment',
    );

    const assignment = expectOk(fabric.getAssignment(op, decision.assignmentId!), 'getAssignment').assignment;
    const local = runBoundedKernel(request.task);
    const completed = expectOk(
      fabric.completeAssignment(runtime, {
        assignmentId: decision.assignmentId!,
        modelId: assignment.modelId,
        modelBinding: assignment.modelBinding,
        output: local.output,
        outputDigest: local.outputDigest,
        usage: { tokens: 3_800, gpuMillis: 8_600 },
      }),
      'completeAssignment',
    );
    assert.equal(completed.output, local.output);

    // 5. The result goes to an agent meeting and then to a human.
    expectOk(
      fabric.recordAgentMeeting(router, {
        workloadId,
        meetingId: 'meeting_supply_council',
        participants: ['agent_demand_specialist', 'agent_logistics', 'agent_finance'],
        transcript: 'Three specialists agreed the Nordic corridor recovers within the quarter.',
      }),
      'recordAgentMeeting',
    );
    expectOk(
      fabric.recordHumanDecision(op, {
        workloadId,
        meetingId: 'meeting_supply_council',
        decision: 'approved',
        note: 'accepted the recommendation for the chair packet',
      }),
      'recordHumanDecision',
    );

    // 6. The whole run reconstructs.
    const lineage = expectOk(fabric.getLineage(op, workloadId), 'getLineage').lineage;
    assert.deepEqual(
      lineage.chain.map((entry) => entry.stage),
      ['source', 'classification', 'node_ingress', 'transformation', 'node_egress', 'meeting', 'decision'],
    );

    // Which hardware processed this information?
    assert.deepEqual(
      lineage.hardware.map((entry) => `${entry.cpuVendor}/${entry.gpuVendor}/${entry.region}`),
      ['amd/nvidia/eu-north'],
    );
    // Which model processed it?
    assert.deepEqual(lineage.models, ['xiv-large-gpu']);
    // Which agent requested it?
    assert.equal(lineage.requestingAgentId, 'agent_demand_specialist');
    // Why was that runtime authorized?
    assert.ok(
      lineage.authorizationReasons.some((reason) =>
        reason.includes('security_then_correctness_then_availability_then_latency_then_cost'),
      ),
    );
    assert.ok(lineage.authorizationReasons.some((reason) => reason.includes('min_trust:verified')));
    // Cost telemetry travels with the run.
    assert.ok(lineage.cost && lineage.cost.energyWh > 0);

    // 7. None of it is visible from another Universe.
    assert.equal(fabric.getLineage(operator(ORG_B, 'operator_beta'), workloadId).ok, false);
    assert.equal(
      expectOk(fabric.listWorkloads(operator(ORG_B, 'operator_beta')), 'listWorkloads').workloads.length,
      0,
    );

    // 8. The workstation was never touched.
    const reviewNode = expectOk(fabric.getNode(op, workstation.nodeId), 'getNode').node;
    assert.equal(reviewNode.healthState, 'unknown');
  });
});
