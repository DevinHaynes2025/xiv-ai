import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  agentCaller,
  analysisWorkload,
  androidPhone,
  enroll,
  expectOk,
  guardian,
  iosPhone,
  newFabric,
  operator,
  proveLanes,
} from './fixtures';
import type { WorkloadRequest } from '../types';

/**
 * Story section 29, mobile test: iOS and Android clients maintain authorization
 * boundaries. Sections 3, 4 and 19 say a phone must never quietly become
 * unrestricted infrastructure, and must not be scheduled into the ground.
 */

const APPROVAL_WORK: Partial<WorkloadRequest> = {
  kind: 'analysis',
  requestedCapability: 'ui.approval.tiny',
  classification: 'internal',
  latencyBudgetMs: 2_000,
  estimate: { computeUnits: 1, memoryMb: 64, storageMb: 1, tokens: 0, bandwidthMb: 1, runtimeMs: 200 },
  task: { kernel: 'vector_sum', input: [1, 2, 3] },
  sourceLabel: 'human approval prompt',
};

function mobileFabric(hardwareFactory: typeof iosPhone, overrides: Parameters<typeof iosPhone>[1] = {}) {
  const fabric = newFabric();
  const op = operator();
  proveLanes(fabric, op, ['apple_silicon', 'qualcomm_mobile']);
  const enrolled = enroll({
    fabric,
    hardware: hardwareFactory(undefined, overrides),
    nodeType: 'mobile_phone',
    allowedWorkloads: ['analysis', 'sync'],
  });
  return { fabric, op, ...enrolled };
}

describe('mobile runtime boundaries', () => {
  it('keeps private device information out of the capability record', () => {
    const fabric = newFabric();
    const registration = expectOk(
      fabric.registerRuntime(operator(), {
        deviceId: 'device_ios_1',
        nodeType: 'mobile_phone',
        hardware: {
          ...iosPhone(),
          serialNumber: 'F2LX9QJ0Q1GC',
          userName: 'a.founder',
          installedApps: ['mail', 'banking'],
        },
        allowedWorkloads: ['analysis'],
      }),
      'registerRuntime',
    );

    assert.deepEqual(registration.droppedFields.sort(), ['installedApps', 'serialNumber', 'userName']);
    assert.equal('serialNumber' in registration.node.hardware, false);
    assert.equal('userName' in registration.node.hardware, false);
  });

  it('does not turn an iPhone into unrestricted infrastructure once XIV is installed', () => {
    const { fabric, op, nodeId } = mobileFabric(iosPhone);

    const node = expectOk(fabric.getNode(op, nodeId), 'getNode').node;
    assert.equal(node.attestationState, 'attested');
    assert.equal(node.trustLevel, 'verified');
    assert.equal(node.securityPolicy.maxClassification, 'internal');
    assert.equal(node.securityPolicy.allowConsequentialActions, false);
    assert.equal(node.securityPolicy.allowOfflinePackages, false);

    const confidential = expectOk(
      fabric.submitWorkload(
        agentCaller('agent_exec'),
        analysisWorkload('agent_exec', {
          ...APPROVAL_WORK,
          classification: 'confidential',
        } as Partial<WorkloadRequest>),
      ),
      'submitWorkload',
    );
    const decision = expectOk(
      fabric.scheduleWorkload(guardian(), confidential.workload.workloadId),
      'scheduleWorkload',
    ).decision;

    assert.equal(decision.outcome, 'escalated');
    assert.deepEqual(
      decision.candidates.map((candidate) => candidate.reason),
      ['insufficient_trust'],
    );
  });

  it('accepts a tiny approval workload on the device tier', () => {
    const { fabric, nodeId } = mobileFabric(iosPhone);

    const submitted = expectOk(
      fabric.submitWorkload(agentCaller('agent_exec'), analysisWorkload('agent_exec', APPROVAL_WORK)),
      'submitWorkload',
    );
    const decision = expectOk(
      fabric.scheduleWorkload(guardian(), submitted.workload.workloadId),
      'scheduleWorkload',
    ).decision;

    assert.equal(decision.outcome, 'scheduled');
    assert.equal(decision.placement, 'device');
    assert.equal(decision.nodeId, nodeId);
  });

  it('refuses to drain a battery for work the phone did not have to do', () => {
    const { fabric } = mobileFabric(iosPhone, {
      energyState: { source: 'battery', batteryPercent: 11, charging: false },
    });

    const onBatteryWork = analysisWorkload('agent_exec', {
      requestedCapability: 'cpu.analysis.small',
      estimate: { computeUnits: 24, memoryMb: 512, storageMb: 4, tokens: 0, bandwidthMb: 2, runtimeMs: 4_000 },
    });
    const submitted = expectOk(fabric.submitWorkload(agentCaller('agent_exec'), onBatteryWork), 'submitWorkload');
    const decision = expectOk(
      fabric.scheduleWorkload(guardian(), submitted.workload.workloadId),
      'scheduleWorkload',
    ).decision;

    assert.equal(decision.outcome, 'queued');
    assert.deepEqual(
      decision.candidates.map((candidate) => candidate.reason),
      ['energy_pressure'],
    );
  });

  it('stops scheduling onto a thermally stressed handset', () => {
    const { fabric } = mobileFabric(androidPhone, { thermalState: 'critical' });

    const submitted = expectOk(
      fabric.submitWorkload(agentCaller('agent_exec'), analysisWorkload('agent_exec', APPROVAL_WORK)),
      'submitWorkload',
    );
    const decision = expectOk(
      fabric.scheduleWorkload(guardian(), submitted.workload.workloadId),
      'scheduleWorkload',
    ).decision;

    assert.equal(decision.outcome, 'queued');
    assert.deepEqual(
      decision.candidates.map((candidate) => candidate.reason),
      ['thermal_pressure'],
    );
  });

  it('applies the same boundary to Android as to iOS', () => {
    const ios = mobileFabric(iosPhone);
    const android = mobileFabric(androidPhone);

    for (const { fabric, nodeId } of [ios, android]) {
      const submitted = expectOk(
        fabric.submitWorkload(agentCaller('agent_exec'), analysisWorkload('agent_exec', APPROVAL_WORK)),
        'submitWorkload',
      );
      const decision = expectOk(
        fabric.scheduleWorkload(guardian(), submitted.workload.workloadId),
        'scheduleWorkload',
      ).decision;
      assert.equal(decision.outcome, 'scheduled');
      assert.equal(decision.nodeId, nodeId);
      assert.equal(decision.placement, 'device');
    }
  });

  it('never lets an agent on a device enroll hardware or widen its own authority', () => {
    const { fabric, nodeId } = mobileFabric(iosPhone);
    const agent = agentCaller('agent_exec');

    const enrollment = fabric.registerRuntime(agent, {
      deviceId: 'device_rogue',
      nodeType: 'mobile_phone',
      hardware: iosPhone(),
      allowedWorkloads: ['analysis'],
    });
    assert.equal(enrollment.ok, false);
    assert.equal(enrollment.ok === false && enrollment.code, 'caller_unauthorized');

    const grab = fabric.grantTrustLevel(agent, {
      nodeId,
      trustLevel: 'protected',
      justification: 'because I would like it',
    });
    assert.equal(grab.ok, false);

    const scaleUp = fabric.requestResourceIncrease(agent, {
      owner: { kind: 'agent', id: 'agent_exec' },
      additional: { gpuMillis: 10_000_000 },
      justification: 'more throughput',
    });
    assert.equal(scaleUp.ok, false);
    assert.equal(scaleUp.ok === false && scaleUp.code, 'permission_expansion_forbidden');

    const events = expectOk(fabric.listSecurityEvents(operator()), 'listSecurityEvents').events;
    assert.ok(events.some((event) => event.kind === 'permission_expansion_blocked'));
  });
});
