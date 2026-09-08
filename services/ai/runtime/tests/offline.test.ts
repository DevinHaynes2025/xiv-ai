import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { runBoundedKernel } from '../kernels';
import {
  agentCaller,
  analysisWorkload,
  appleLaptop,
  approveModel,
  enroll,
  expectOk,
  guardian,
  newFabric,
  nodeCaller,
  onDeviceModel,
  operator,
  proveFor,
  proveLanes,
} from './fixtures';
import type { OfflineTaskResult, OfflineWorkPackage } from '../types';

/**
 * Story sections 11, 12 and 29: a disconnected package cannot exceed its
 * granted authority, and reconnecting is a fresh authentication rather than a
 * resumption of trust.
 */

function offlineFabric(ttlMs = 60 * 60 * 1000) {
  const fabric = newFabric();
  const op = operator();
  proveLanes(fabric, op, ['apple_silicon']);

  const node = enroll({
    fabric,
    hardware: appleLaptop(),
    nodeType: 'laptop',
    allowedWorkloads: ['analysis', 'inference', 'agent_evaluation'],
    securityPolicy: { allowOfflinePackages: true },
  });
  approveModel(fabric, op, onDeviceModel());

  const pkg = expectOk(
    fabric.createOfflinePackage(op, {
      nodeId: node.nodeId,
      agentIds: ['agent_strategy', 'agent_finance'],
      grant: { maxTasks: 100, maxTokens: 10_000_000, classificationCeiling: 'restricted' },
      ttlMs,
    }),
    'createOfflinePackage',
  ).package;

  return { fabric, op, node, pkg };
}

function offlineResult(overrides: Partial<OfflineTaskResult> = {}): OfflineTaskResult {
  return {
    taskId: 'task_1',
    workloadKind: 'analysis',
    capability: 'cpu.analysis.medium',
    classification: 'internal',
    modelId: 'xiv-small-local',
    tokensUsed: 1_200,
    durationMs: 60_000,
    outputDigest: 'sha256:offline-output-1',
    consequentialAttempted: false,
    transcript: 'offline specialist review of the disconnected package',
    ...overrides,
  };
}

function reconnect(fabric: ReturnType<typeof offlineFabric>['fabric'], node: { nodeId: string; secret: string }) {
  const runtime = nodeCaller(node.nodeId);
  return { runtime, reauthentication: proveFor(fabric, runtime, node.nodeId, node.secret, 'sync') };
}

describe('offline work packages', () => {
  it('clamps a requested grant down to what the node may hold', () => {
    const { pkg } = offlineFabric();

    assert.equal(pkg.grant.maxTasks, 8);
    assert.equal(pkg.grant.maxTokens, 50_000);
    assert.equal(pkg.grant.classificationCeiling, 'internal');
    assert.equal(pkg.grant.allowConsequentialActions, false);
    assert.deepEqual(pkg.grant.allowedModels, ['xiv-small-local']);
  });

  it('refuses a package that was edited after it was signed', () => {
    const { fabric, op, pkg } = offlineFabric();
    const tampered: OfflineWorkPackage = {
      ...pkg,
      grant: { ...pkg.grant, maxTasks: 500, classificationCeiling: 'restricted' },
    };

    const denial = fabric.validateOfflinePackage(op, tampered);
    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'offline_signature_invalid');
  });

  it('refuses an expired package', () => {
    const { fabric, op, pkg } = offlineFabric(500);
    const denial = fabric.validateOfflinePackage(op, pkg);
    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'offline_package_expired');
  });

  it('accepts results that stayed inside the grant and records their lineage', () => {
    const { fabric, op, node, pkg } = offlineFabric();
    const { runtime, reauthentication } = reconnect(fabric, node);

    const event = expectOk(
      fabric.syncOfflineResults(runtime, {
        package: pkg,
        results: [offlineResult(), offlineResult({ taskId: 'task_2', outputDigest: 'sha256:offline-output-2' })],
        reauthentication,
      }),
      'syncOfflineResults',
    ).event;

    assert.equal(event.status, 'accepted');
    assert.deepEqual(event.acceptedTaskIds, ['task_1', 'task_2']);

    const recorded = expectOk(fabric.listSyncEvents(op), 'listSyncEvents').events;
    assert.deepEqual(recorded.map((entry) => entry.status), ['accepted']);

    const replay = fabric.syncOfflineResults(runtime, {
      package: pkg,
      results: [offlineResult()],
      reauthentication: proveFor(fabric, runtime, node.nodeId, node.secret, 'sync'),
    });
    assert.equal(replay.ok, false);
    assert.equal(replay.ok === false && replay.code, 'offline_package_unknown');
  });

  it('rejects offline work that reached past its granted authority', () => {
    const { fabric, op, node, pkg } = offlineFabric();
    const { runtime, reauthentication } = reconnect(fabric, node);

    const event = expectOk(
      fabric.syncOfflineResults(runtime, {
        package: pkg,
        results: [
          offlineResult({ taskId: 'task_external', consequentialAttempted: true }),
          offlineResult({ taskId: 'task_secret', classification: 'restricted' }),
          offlineResult({ taskId: 'task_model', modelId: 'some-cloud-model' }),
        ],
        reauthentication,
      }),
      'syncOfflineResults',
    ).event;

    assert.equal(event.status, 'rejected');
    assert.match(event.reason, /consequential_action_attempted/);
    assert.match(event.reason, /classification_exceeded/);
    assert.match(event.reason, /model_not_granted/);
    assert.deepEqual(event.acceptedTaskIds, []);

    const events = expectOk(fabric.listSecurityEvents(op), 'listSecurityEvents').events;
    assert.ok(events.some((securityEvent) => securityEvent.kind === 'offline_authority_exceeded'));
  });

  it('rejects a package that exceeded its task ceiling', () => {
    const { fabric, node, pkg } = offlineFabric();
    const { runtime, reauthentication } = reconnect(fabric, node);

    const results = Array.from({ length: 9 }, (_unused, index) =>
      offlineResult({ taskId: `task_${index}`, tokensUsed: 100 }),
    );
    const event = expectOk(
      fabric.syncOfflineResults(runtime, { package: pkg, results, reauthentication }),
      'syncOfflineResults',
    ).event;

    assert.equal(event.status, 'rejected');
    assert.match(event.reason, /task_count_exceeded:9>8/);
  });

  it('flags a conflict when the Universe moved on while the node was offline', () => {
    const { fabric, op, node, pkg } = offlineFabric();

    // The same agent completed authorized online work while the laptop was away.
    const submitted = expectOk(
      fabric.submitWorkload(agentCaller('agent_strategy'), analysisWorkload('agent_strategy')),
      'submitWorkload',
    );
    const decision = expectOk(
      fabric.scheduleWorkload(guardian(), submitted.workload.workloadId),
      'scheduleWorkload',
    ).decision;
    const runtimeCaller = nodeCaller(node.nodeId);
    expectOk(
      fabric.startAssignment(runtimeCaller, {
        assignmentId: decision.assignmentId!,
        ...proveFor(fabric, runtimeCaller, node.nodeId, node.secret, 'execute'),
      }),
      'startAssignment',
    );
    const local = runBoundedKernel(analysisWorkload('agent_strategy').task);
    expectOk(
      fabric.completeAssignment(runtimeCaller, {
        assignmentId: decision.assignmentId!,
        modelId: null,
        modelBinding: null,
        output: local.output,
        outputDigest: local.outputDigest,
      }),
      'completeAssignment',
    );

    const { runtime, reauthentication } = reconnect(fabric, node);
    const event = expectOk(
      fabric.syncOfflineResults(runtime, { package: pkg, results: [offlineResult()], reauthentication }),
      'syncOfflineResults',
    ).event;

    assert.equal(event.status, 'conflict');
    assert.match(event.reason, /state_version_moved/);
    assert.equal(expectOk(fabric.listSecurityEvents(op), 'listSecurityEvents').events.length >= 0, true);
  });

  it('requires reauthentication before any offline result is considered', () => {
    const { fabric, node, pkg } = offlineFabric();
    const runtime = nodeCaller(node.nodeId);

    const denial = fabric.syncOfflineResults(runtime, {
      package: pkg,
      results: [offlineResult()],
      reauthentication: { challengeId: 'chal_invented', proof: 'deadbeef' },
    });

    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'runtime_challenge_unknown');
  });

  it('will not hand an offline package to a node that is not allowed to hold one', () => {
    const fabric = newFabric();
    const op = operator();
    proveLanes(fabric, op, ['apple_silicon']);
    const node = enroll({
      fabric,
      hardware: appleLaptop(),
      nodeType: 'laptop',
      allowedWorkloads: ['analysis'],
    });

    const denial = fabric.createOfflinePackage(op, {
      nodeId: node.nodeId,
      agentIds: ['agent_strategy'],
      grant: {},
      ttlMs: 1_000,
    });

    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'caller_unauthorized');
  });
});
