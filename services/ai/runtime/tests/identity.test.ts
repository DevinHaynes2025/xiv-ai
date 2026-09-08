import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { signRuntimeProof } from '../control-plane';
import {
  APPROVED_IMAGE,
  enroll,
  expectOk,
  intelWorkstation,
  newFabric,
  nodeCaller,
  operator,
  proveFor,
} from './fixtures';

/**
 * Story sections 9, 16 and 29: an unregistered node cannot impersonate an
 * approved node, and registering does not by itself grant anything.
 */

const HEALTHY_SAMPLE = {
  healthState: 'healthy' as const,
  thermalState: 'nominal' as const,
  energyState: { source: 'wall' as const, batteryPercent: null, charging: true },
  networkState: 'online' as const,
  memoryAvailableMb: 65_536,
  cpuPressure: 0.2,
  gpuPressure: 0,
};

describe('runtime node identity', () => {
  it('grants nothing at registration time', () => {
    const fabric = newFabric();
    const op = operator();
    const registration = expectOk(
      fabric.registerRuntime(op, {
        deviceId: 'device_ws_1',
        nodeType: 'workstation',
        hardware: intelWorkstation({ organizationId: 'org_alpha', universeId: 'universe_alpha' }),
        allowedWorkloads: ['analysis'],
      }),
      'registerRuntime',
    );

    assert.equal(registration.node.trustLevel, 'untrusted');
    assert.equal(registration.node.attestationState, 'registered');
    assert.equal(registration.node.revokedAt, null);
    assert.deepEqual(registration.node.allowedWorkloads, ['analysis']);
  });

  it('rejects a proof for a node that was never registered', () => {
    const fabric = newFabric();
    const op = operator();

    const challenge = fabric.issueRuntimeChallenge(op, { nodeId: 'node_imaginary', purpose: 'attest' });
    assert.equal(challenge.ok, false);
    assert.equal(challenge.ok === false && challenge.code, 'runtime_identity_unknown');

    const attestation = fabric.attestRuntime(nodeCaller('node_imaginary'), {
      nodeId: 'node_imaginary',
      challengeId: 'chal_invented',
      proof: 'deadbeef',
      measurements: { runtime_image: APPROVED_IMAGE },
    });
    assert.equal(attestation.ok, false);
    assert.equal(attestation.ok === false && attestation.code, 'runtime_identity_unknown');

    const events = expectOk(fabric.listSecurityEvents(op), 'listSecurityEvents').events;
    assert.equal(events.filter((event) => event.kind === 'runtime_identity_rejected').length, 2);
  });

  it('rejects a valid node id presented with the wrong secret', () => {
    const fabric = newFabric();
    const { nodeId } = enroll({
      fabric,
      hardware: intelWorkstation(),
      nodeType: 'workstation',
      allowedWorkloads: ['analysis'],
    });

    const runtime = nodeCaller(nodeId);
    const challenge = expectOk(
      fabric.issueRuntimeChallenge(runtime, { nodeId, purpose: 'heartbeat' }),
      'issueRuntimeChallenge',
    );
    const forged = signRuntimeProof('an-attacker-guess', {
      nodeId,
      nonce: challenge.nonce,
      purpose: 'heartbeat',
    });

    const denial = fabric.heartbeatRuntime(runtime, {
      nodeId,
      challengeId: challenge.challengeId,
      proof: forged,
      sample: HEALTHY_SAMPLE,
    });

    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'runtime_identity_rejected');
  });

  it('burns a challenge after one use and refuses a replayed proof', () => {
    const fabric = newFabric();
    const { nodeId, secret } = enroll({
      fabric,
      hardware: intelWorkstation(),
      nodeType: 'workstation',
      allowedWorkloads: ['analysis'],
    });

    const runtime = nodeCaller(nodeId);
    const proof = proveFor(fabric, runtime, nodeId, secret, 'heartbeat');
    expectOk(fabric.heartbeatRuntime(runtime, { nodeId, ...proof, sample: HEALTHY_SAMPLE }), 'heartbeatRuntime');

    const replay = fabric.heartbeatRuntime(runtime, { nodeId, ...proof, sample: HEALTHY_SAMPLE });
    assert.equal(replay.ok, false);
    assert.equal(replay.ok === false && replay.code, 'runtime_challenge_unknown');
  });

  it('will not let a challenge issued for one purpose be spent on another', () => {
    const fabric = newFabric();
    const { nodeId, secret } = enroll({
      fabric,
      hardware: intelWorkstation(),
      nodeType: 'workstation',
      allowedWorkloads: ['analysis'],
    });

    const runtime = nodeCaller(nodeId);
    const challenge = expectOk(
      fabric.issueRuntimeChallenge(runtime, { nodeId, purpose: 'heartbeat' }),
      'issueRuntimeChallenge',
    );
    const proof = signRuntimeProof(secret, { nodeId, nonce: challenge.nonce, purpose: 'attest' });

    const denial = fabric.attestRuntime(runtime, {
      nodeId,
      challengeId: challenge.challengeId,
      proof,
      measurements: { runtime_image: APPROVED_IMAGE },
    });
    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'runtime_challenge_unknown');
  });

  it('holds a node at degraded when it runs an unapproved runtime image', () => {
    const fabric = newFabric();
    const { nodeId } = enroll({
      fabric,
      hardware: intelWorkstation(),
      nodeType: 'workstation',
      allowedWorkloads: ['analysis'],
      runtimeImage: 'community-build:unverified',
    });

    const node = expectOk(fabric.getNode(operator(), nodeId), 'getNode').node;
    assert.equal(node.attestationState, 'degraded');
    assert.equal(node.trustLevel, 'untrusted');
  });

  it('requires an operator grant and a justification to reach protected trust', () => {
    const fabric = newFabric();
    const op = operator();
    const { nodeId } = enroll({
      fabric,
      hardware: intelWorkstation(),
      nodeType: 'workstation',
      allowedWorkloads: ['analysis'],
    });

    const blank = fabric.grantTrustLevel(op, { nodeId, trustLevel: 'protected', justification: '  ' });
    assert.equal(blank.ok, false);
    assert.equal(blank.ok === false && blank.code, 'validation_evidence_missing');

    const granted = expectOk(
      fabric.grantTrustLevel(op, {
        nodeId,
        trustLevel: 'protected',
        justification: 'dedicated enclave signed off by the security owner',
      }),
      'grantTrustLevel',
    );
    assert.equal(granted.node.trustLevel, 'protected');
  });

  it('stops accepting proofs from a revoked node', () => {
    const fabric = newFabric();
    const op = operator();
    const { nodeId, secret } = enroll({
      fabric,
      hardware: intelWorkstation(),
      nodeType: 'workstation',
      allowedWorkloads: ['analysis'],
    });

    const runtime = nodeCaller(nodeId);
    const proof = proveFor(fabric, runtime, nodeId, secret, 'heartbeat');
    expectOk(fabric.revokeRuntime(op, nodeId, 'decommissioned'), 'revokeRuntime');

    const denial = fabric.heartbeatRuntime(runtime, { nodeId, ...proof, sample: HEALTHY_SAMPLE });
    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'runtime_identity_unknown');
  });
});
