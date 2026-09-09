import assert from 'node:assert/strict';
import test from 'node:test';

import { runBoundedKernel } from '../../runtime/kernels';
import {
  ORG_B,
  agentCaller,
  approveModel,
  enroll,
  expectOk as expectRuntimeOk,
  gpuModel,
  gpuWorkload,
  guardian as runtimeGuardian,
  intelWorkstation,
  iosPhone,
  newFabric,
  nodeCaller,
  nvidiaGpuHost,
  operator,
  proveFor,
  proveLanes,
} from '../../runtime/tests/fixtures';
import {
  captureAgentSecurityEvidence,
  captureCostEvidence,
  captureLineageEvidence,
  captureNegativeEvidence,
  captureRuntimeEvidence,
} from '../runtime-bridge';
import { COMMIT, actor, ci, expectOk, newLedger } from './fixtures';

/**
 * Sections 41, 42, 44, 51 and 52 against a real run. The point of this suite is
 * that the evidence is read out of the fabric rather than written by hand: if
 * the runtime stopped recording lineage or cost, these assertions would fail
 * even though the runtime's own tests still passed.
 */

function governedRun() {
  const fabric = newFabric();
  const op = operator();
  const router = runtimeGuardian();
  const agent = agentCaller('agent_demand_specialist');

  proveLanes(fabric, op, ['intel_x86_64', 'nvidia_cuda_amd_host', 'apple_silicon']);
  const phone = enroll({
    fabric,
    hardware: iosPhone(),
    nodeType: 'mobile_phone',
    deviceId: 'device_founder_phone',
    allowedWorkloads: ['analysis', 'sync'],
  });
  enroll({
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

  const request = gpuWorkload('agent_demand_specialist', { meetingId: 'meeting_supply_council' });
  const workloadId = expectRuntimeOk(fabric.submitWorkload(agent, request), 'submitWorkload').workload.workloadId;
  expectRuntimeOk(fabric.classifyWorkload(router, workloadId), 'classifyWorkload');
  const decision = expectRuntimeOk(fabric.scheduleWorkload(router, workloadId), 'scheduleWorkload').decision;
  const assignmentId = decision.assignmentId!;

  const runtime = nodeCaller(gpuHost.nodeId);
  expectRuntimeOk(
    fabric.startAssignment(runtime, {
      assignmentId,
      ...proveFor(fabric, runtime, gpuHost.nodeId, gpuHost.secret, 'execute'),
    }),
    'startAssignment',
  );
  const assignment = expectRuntimeOk(fabric.getAssignment(op, assignmentId), 'getAssignment').assignment;
  const local = runBoundedKernel(request.task);
  expectRuntimeOk(
    fabric.completeAssignment(runtime, {
      assignmentId,
      modelId: assignment.modelId,
      modelBinding: assignment.modelBinding,
      output: local.output,
      outputDigest: local.outputDigest,
      usage: { tokens: 3_800, gpuMillis: 8_600 },
    }),
    'completeAssignment',
  );
  expectRuntimeOk(
    fabric.recordAgentMeeting(router, {
      workloadId,
      meetingId: 'meeting_supply_council',
      participants: ['agent_demand_specialist', 'agent_logistics', 'agent_finance'],
      transcript: 'Three specialists agreed the Nordic corridor recovers within the quarter.',
    }),
    'recordAgentMeeting',
  );
  expectRuntimeOk(
    fabric.recordHumanDecision(op, {
      workloadId,
      meetingId: 'meeting_supply_council',
      decision: 'approved',
      note: 'accepted the recommendation for the chair packet',
    }),
    'recordHumanDecision',
  );

  return { fabric, op, agent, router, workloadId, assignmentId, assignment, gpuHost, phone };
}

test('section 42: runtime evidence names the hardware that actually ran the work', () => {
  const run = governedRun();
  const payload = captureRuntimeEvidence({ fabric: run.fabric, auditor: run.op }, { assignmentId: run.assignmentId });

  assert.equal(payload.kind, 'runtime');
  assert.equal(payload.nodeClass, 'cloud_gpu');
  assert.equal(payload.gpuVendor, 'nvidia');
  assert.equal(payload.attestationState, 'attested');
  assert.equal(payload.terminationState, 'completed');
  assert.equal(payload.workloadId, run.workloadId);
  assert.ok(payload.resourceConsumption.runtimeMs! > 0);
  assert.ok(payload.startedAt && payload.finishedAt);
});

test('section 51: lineage evidence reconstructs every required link', () => {
  const run = governedRun();
  const payload = captureLineageEvidence(
    { fabric: run.fabric, auditor: run.op },
    { workloadId: run.workloadId, consequential: false },
  );

  assert.deepEqual(payload.missingLinks, []);
  assert.equal(payload.reconstructionPercent, 100);
  assert.ok(payload.presentLinks.includes('human_approval'));
  assert.ok(payload.presentLinks.includes('model'));
  assert.ok(payload.presentLinks.includes('runtime'));
});

test('section 51: an incomplete run reports the gap instead of rounding up', () => {
  const fabric = newFabric();
  const op = operator();
  const agent = agentCaller('agent_demand_specialist');
  proveLanes(fabric, op, ['nvidia_cuda_amd_host']);
  enroll({ fabric, hardware: nvidiaGpuHost(), nodeType: 'cloud_gpu', deviceId: 'device_gpu', allowedWorkloads: ['inference'] });
  approveModel(fabric, op, gpuModel());

  const workloadId = expectRuntimeOk(
    fabric.submitWorkload(agent, gpuWorkload('agent_demand_specialist')),
    'submitWorkload',
  ).workload.workloadId;

  const payload = captureLineageEvidence({ fabric, auditor: op }, { workloadId });
  assert.ok(payload.reconstructionPercent < 100);
  assert.ok(payload.missingLinks.includes('human_approval'));
  assert.ok(payload.missingLinks.includes('meeting'));

  // Section 51 wants provenance gated on completeness, so partial lineage must
  // not reach PASS.
  const ledger = newLedger();
  const record = expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'provenance',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'runtime/lineage',
      testCase: 'partial run',
      testVersion: '1',
      expectedResult: 'full reconstruction',
      actualResult: `${payload.reconstructionPercent}% reconstructed`,
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      primaryOwner: 'information_logistics_owner',
      payload,
      reproducibleCommand: 'npm test --prefix services/ai',
    }),
    'recordEvidence',
  ).record;
  expectOk(
    ledger.verifyEvidence(actor('qa_verifier', { roles: ['verifier'] }), {
      evidenceId: record.evidenceId,
      verdict: 'satisfies',
      note: 'reproduced',
    }),
    'verify',
  );
  assert.equal(ledger.gateState('provenance'), 'EVIDENCE_PENDING');
});

test('section 41: agent security evidence shows what was requested and what was granted', () => {
  const run = governedRun();
  const payload = captureAgentSecurityEvidence(
    { fabric: run.fabric, auditor: run.op },
    { workloadId: run.workloadId, assignment: run.assignment, humanApprovalPresent: true },
  );

  assert.equal(payload.agentId, 'agent_demand_specialist');
  assert.equal(payload.runtimeNodeId, run.gpuHost.nodeId);
  assert.equal(payload.modelId, 'xiv-large-gpu');
  assert.deepEqual(payload.toolsGranted, [payload.requestedCapability]);
  assert.equal(payload.unauthorizedGrants, 0);
  assert.equal(payload.result, 'completed');
});

test('section 44: cost evidence carries an estimate and refuses to call it billed spend', () => {
  const run = governedRun();
  const payload = captureCostEvidence({ fabric: run.fabric, auditor: run.op }, { workloadIds: [run.workloadId] });

  assert.equal(payload.workloadCount, 1);
  assert.equal(payload.agentCount, 1);
  assert.ok(payload.estimatedCostUsd > 0);
  assert.equal(payload.costPerTaskUsd, payload.estimatedCostUsd);
  assert.equal(payload.costPerSuccessfulTaskUsd, payload.estimatedCostUsd);
  assert.ok(payload.gpuMillis > 0, 'the run went to an accelerator, so the time is attributed there');
  // Section 44: an estimate is not an invoice.
  assert.equal(payload.attributableCostUsd, null);
});

test('section 52: negative evidence records the denial code the fabric actually produced', () => {
  const run = governedRun();
  const outsider = operator(ORG_B, 'operator_beta');

  const probes = captureNegativeEvidence([
    {
      scenario: 'another Universe reads this workload',
      attempted: 'getLineage',
      expected: 'denied',
      outcome: asOutcome(run.fabric.getLineage(outsider, run.workloadId)),
    },
    {
      scenario: 'an agent names the machine it wants',
      attempted: 'submitWorkload with preferredNodeId',
      expected: 'denied',
      outcome: asOutcome(
        run.fabric.submitWorkload(run.agent, {
          ...gpuWorkload('agent_demand_specialist'),
          preferredNodeId: run.gpuHost.nodeId,
        }),
      ),
    },
    {
      scenario: 'an agent quarantines a node',
      attempted: 'quarantineRuntime',
      expected: 'denied',
      outcome: asOutcome(run.fabric.quarantineRuntime(run.agent, run.gpuHost.nodeId, 'because I said so')),
    },
  ]);

  assert.equal(probes.probes.length, 3);
  assert.ok(probes.probes.every((probe) => probe.actual === 'denied'));
  assert.deepEqual(
    probes.probes.map((probe) => probe.denialCode),
    ['workload_unknown', 'agent_node_selection_forbidden', 'caller_unauthorized'],
  );

  const ledger = newLedger();
  const record = expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'tenant_isolation',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'runtime/tests/tenancy.test.ts',
      testCase: 'refusals',
      testVersion: '1',
      expectedResult: 'every attempt is denied',
      actualResult: 'every attempt was denied',
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      primaryOwner: 'database_owner',
      payload: probes,
      reproducibleCommand: 'npm test --prefix services/ai',
    }),
    'recordEvidence',
  ).record;
  assert.equal(record.level, 'E3');
});

test('section 52: an attempt that succeeds is recorded as allowed, not quietly dropped', () => {
  const run = governedRun();
  const probes = captureNegativeEvidence([
    {
      scenario: 'the operator who owns the Universe reads its lineage',
      attempted: 'getLineage',
      expected: 'denied',
      outcome: asOutcome(run.fabric.getLineage(run.op, run.workloadId)),
    },
  ]);

  assert.equal(probes.probes[0]!.actual, 'allowed');
  assert.equal(probes.probes[0]!.denialCode, null);

  const ledger = newLedger();
  expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'tenant_isolation',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'runtime/tests/tenancy.test.ts',
      testCase: 'refusals',
      testVersion: '1',
      expectedResult: 'every attempt is denied',
      actualResult: 'one attempt was allowed',
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      primaryOwner: 'database_owner',
      payload: probes,
    }),
    'recordEvidence',
  );
  // The suite claimed a pass; the probe says otherwise, and the probe wins.
  assert.equal(ledger.gateState('tenant_isolation'), 'EVIDENCE_PENDING');
});

function asOutcome(result: { ok: boolean; code?: string }): { ok: boolean; code?: string } {
  return result.ok ? { ok: true } : { ok: false, code: result.code };
}
