import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ORG_A,
  ORG_B,
  agentCaller,
  appleLaptop,
  enroll,
  expectOk,
  intelWorkstation,
  iosPhone,
  newFabric,
  operator,
  proveLanes,
} from './fixtures';

/**
 * Story sections 13, 15 and 22: physical proximity establishes nothing, an
 * agent's identity is separate from its compute process, and the Universe —
 * not the device — holds authoritative state.
 */

function fleet() {
  const fabric = newFabric();
  const op = operator();
  proveLanes(fabric, op, ['apple_silicon', 'intel_x86_64', 'qualcomm_mobile']);

  const phone = enroll({
    fabric,
    hardware: iosPhone(),
    nodeType: 'mobile_phone',
    deviceId: 'device_phone',
    allowedWorkloads: ['analysis', 'sync'],
  });
  const laptop = enroll({
    fabric,
    hardware: appleLaptop(),
    nodeType: 'laptop',
    deviceId: 'device_laptop',
    allowedWorkloads: ['analysis'],
  });

  return { fabric, op, phone, laptop };
}

describe('XIV device network', () => {
  it('opens a channel between two attested peers in the same Universe', () => {
    const { fabric, op, phone, laptop } = fleet();

    const channel = expectOk(
      fabric.openDeviceChannel(op, { fromNodeId: phone.nodeId, toNodeId: laptop.nodeId, proximity: 'remote' }),
      'openDeviceChannel',
    ).channel;

    assert.equal(channel.classificationCeiling, 'internal');
    assert.equal(channel.universeId, ORG_A.universeId);
  });

  it('refuses a channel across Universes no matter how close the devices are', () => {
    const { fabric, op, phone } = fleet();
    const opB = operator(ORG_B, 'operator_beta');
    proveLanes(fabric, opB, ['intel_x86_64']);
    const foreign = enroll({
      fabric,
      scope: ORG_B,
      caller: opB,
      hardware: intelWorkstation(ORG_B),
      nodeType: 'workstation',
      allowedWorkloads: ['analysis'],
    });

    const denial = fabric.openDeviceChannel(op, {
      fromNodeId: phone.nodeId,
      toNodeId: foreign.nodeId,
      proximity: 'same_room',
    });

    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'channel_tenant_mismatch');

    const events = expectOk(fabric.listSecurityEvents(op), 'listSecurityEvents').events;
    assert.ok(events.some((event) => event.kind === 'proximity_trust_rejected'));
  });

  it('refuses a channel to a quarantined peer', () => {
    const { fabric, op, phone, laptop } = fleet();
    expectOk(fabric.quarantineRuntime(op, laptop.nodeId, 'suspected tampering'), 'quarantineRuntime');

    const denial = fabric.openDeviceChannel(op, {
      fromNodeId: phone.nodeId,
      toNodeId: laptop.nodeId,
      proximity: 'same_network',
    });
    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'channel_peer_unauthorized');
  });
});

describe('agent mobility', () => {
  it('moves an agent identity between runtimes without moving data', () => {
    const { fabric, op, phone, laptop } = fleet();

    const placed = expectOk(
      fabric.assignAgentRuntime(op, {
        agentId: 'agent_strategy',
        nodeId: phone.nodeId,
        grantedCapabilities: ['ui.approval.tiny'],
        classificationCeiling: 'internal',
      }),
      'assignAgentRuntime',
    ).assignment;
    assert.equal(placed.nodeId, phone.nodeId);

    const moved = expectOk(
      fabric.moveAgentRuntime(op, { agentId: 'agent_strategy', toNodeId: laptop.nodeId }),
      'moveAgentRuntime',
    );

    assert.equal(moved.dataTransferred, false);
    assert.equal(moved.previousNodeId, phone.nodeId);
    assert.equal(moved.assignment.nodeId, laptop.nodeId);
    assert.deepEqual(moved.assignment.grantedCapabilities, ['ui.approval.tiny']);
  });

  it('requires the destination to qualify on its own', () => {
    const { fabric, op, phone, laptop } = fleet();

    expectOk(
      fabric.assignAgentRuntime(op, {
        agentId: 'agent_strategy',
        nodeId: laptop.nodeId,
        grantedCapabilities: ['cpu.analysis.medium'],
        classificationCeiling: 'internal',
      }),
      'assignAgentRuntime',
    );

    // The phone cannot offer `cpu.analysis.medium`, so the agent cannot land there.
    const denial = fabric.moveAgentRuntime(op, { agentId: 'agent_strategy', toNodeId: phone.nodeId });
    assert.equal(denial.ok, false);
    assert.match(denial.ok === false ? denial.message : '', /does not offer cpu.analysis.medium/);
  });

  it('does not let an agent place itself', () => {
    const { fabric, op, laptop } = fleet();
    const agent = agentCaller('agent_strategy');

    const denial = fabric.assignAgentRuntime(agent, {
      agentId: 'agent_strategy',
      nodeId: laptop.nodeId,
      grantedCapabilities: ['cpu.analysis.medium'],
      classificationCeiling: 'internal',
    });

    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'caller_unauthorized');

    const events = expectOk(fabric.listSecurityEvents(op), 'listSecurityEvents').events;
    assert.ok(events.some((event) => event.kind === 'permission_expansion_blocked'));
  });

  it('releases the agent from every runtime when an operator stops it', () => {
    const { fabric, op, laptop } = fleet();
    expectOk(
      fabric.assignAgentRuntime(op, {
        agentId: 'agent_strategy',
        nodeId: laptop.nodeId,
        grantedCapabilities: ['cpu.analysis.medium'],
        classificationCeiling: 'internal',
      }),
      'assignAgentRuntime',
    );

    expectOk(fabric.stopAgent(op, 'agent_strategy', 'guardian hold'), 'stopAgent');

    const rehome = fabric.moveAgentRuntime(op, { agentId: 'agent_strategy', toNodeId: laptop.nodeId });
    assert.equal(rehome.ok, true);
    assert.equal(rehome.ok === true && rehome.previousNodeId, null, 'the previous placement was released');
  });
});
