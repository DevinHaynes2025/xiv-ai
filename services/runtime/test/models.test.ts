import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ManualClock } from '../src/clock';
import { generateSigningKeys } from '../src/crypto';
import { LOCAL_REFERENCE_MODEL_ID, RuntimePlane } from '../src/plane';
import type { Capability, ModelRegistryEntry, TenantRef, WorkloadClassification } from '../src/types';

const TENANT: TenantRef = { organizationId: 'org_models', universeId: 'uni_ops' };

const CAPABILITIES: readonly Capability[] = [
  'node.register',
  'node.control',
  'workload.submit',
  'workload.submit.protected',
  'model.invoke',
];

function fixture() {
  const clock = new ManualClock();
  const plane = new RuntimePlane({ clock, keys: generateSigningKeys(), env: {}, version: 'test' });
  plane.setTenantQuota({
    tenant: TENANT,
    cpuMillis: 10_000_000,
    gpuMillis: 0,
    modelCalls: 100_000,
    modelTokens: 10_000_000,
    costUsd: 1_000,
    concurrentWorkloads: 100,
  });
  const { token } = plane.principals.enroll({
    kind: 'human',
    tenant: TENANT,
    capabilities: CAPABILITIES,
    maxClassification: 'restricted',
  });
  const node = plane.onboardNode({ token, tenant: TENANT, serial: 'model-node-1' });
  return { clock, plane, token, node };
}

function spec(
  plane: RuntimePlane,
  modelId: string,
  classification: WorkloadClassification = 'internal',
): Parameters<RuntimePlane['engine']['submit']>[0]['spec'] {
  return {
    workloadId: `wl_${modelId}_${classification}`,
    tenant: TENANT,
    classification,
    requiredCapabilities:
      classification === 'restricted' ? ['workload.submit', 'workload.submit.protected'] : ['workload.submit'],
    hardware: { classIds: [plane.hostHardware.classId] },
    budget: {
      cpuMillis: 5_000,
      gpuMillis: 0,
      ramMb: 256,
      storageMb: 32,
      networkKb: 512,
      modelCalls: 2,
      modelTokens: 4_000,
      maxDurationMs: 30_000,
      maxAgents: 1,
      maxTasks: 2,
      maxCostUsd: 1,
      hardTerminationMs: 60_000,
    },
    consequential: false,
    requiresApproval: false,
    modelId,
  };
}

const localOnly: Omit<ModelRegistryEntry, 'modelId'> = {
  provider: 'xiv_local',
  displayName: 'fixture',
  approved: true,
  providerConfigured: true,
  evaluationGate: { evaluationId: 'eval', passed: true, evaluatedAt: 0, evidenceUri: 'n/a' },
  maxTokens: 1_024,
  costPerKTokenUsd: 0,
  classifications: ['public', 'internal'],
};

/**
 * Authorizing the model only at execution admits the workload and commits the
 * node's capacity first, so a request that was never allowed to run still holds
 * a runtime slot until it fails.
 */
test('a model that cannot be invoked is refused before a node is committed', () => {
  const { plane, token } = fixture();
  plane.models.register({ ...localOnly, modelId: 'unapproved', approved: false });
  plane.models.register({ ...localOnly, modelId: 'ungated', evaluationGate: undefined });
  plane.models.register({
    ...localOnly,
    modelId: 'unconfigured',
    provider: 'gemini',
    providerConfigured: false,
  });

  const cases: [string, string, WorkloadClassification][] = [
    ['does-not-exist', 'model_unregistered', 'internal'],
    ['unapproved', 'model_unapproved', 'internal'],
    ['ungated', 'model_unapproved', 'internal'],
    ['unconfigured', 'model_unavailable', 'internal'],
    // Approved and invocable, but not for this classification.
    ['internal-only', 'model_unapproved', 'restricted'],
  ];
  plane.models.register({ ...localOnly, modelId: 'internal-only' });

  for (const [modelId, expected, classification] of cases) {
    const outcome = plane.engine.submit({ token, spec: spec(plane, modelId, classification) });
    assert.equal(outcome.rejection?.code, expected, `${modelId} was refused as ${outcome.rejection?.code}`);
    assert.equal(outcome.rejection?.reason, 'model_not_invocable');
    assert.equal(outcome.record.nodeId, null, `${modelId} reserved a node it may not use`);
    assert.equal(outcome.record.state, 'rejected');
  }

  assert.equal(plane.models.allInvocations().length, 0);
});

test('an approved model within its classification is admitted and invoked', () => {
  const { plane, token } = fixture();
  const outcome = plane.engine.execute(
    { token, spec: spec(plane, LOCAL_REFERENCE_MODEL_ID, 'restricted') },
    { iterations: 100 },
  );
  assert.equal(outcome.rejection, null);
  assert.equal(outcome.record.state, 'completed');
  assert.equal(plane.models.allInvocations().length, 1);
  assert.equal(plane.models.allInvocations()[0]?.modelId, LOCAL_REFERENCE_MODEL_ID);
});

test('the refusal is recorded against the workload rather than swallowed', () => {
  const { plane, token } = fixture();
  plane.engine.submit({ token, spec: spec(plane, 'does-not-exist') });
  assert.equal(
    plane.audit.has(
      (event) => event.kind === 'model_invocation_blocked' && event.detail.state === 'unregistered',
    ),
    true,
  );
  assert.equal(plane.audit.has((event) => event.kind === 'workload_rejected'), true);
});

test('availability never optimistically defaults', () => {
  const { plane } = fixture();
  assert.equal(plane.models.availability('nope'), 'unregistered');
  plane.models.register({ ...localOnly, modelId: 'a', approved: false });
  assert.equal(plane.models.availability('a'), 'unapproved');
  plane.models.register({ ...localOnly, modelId: 'b', evaluationGate: undefined });
  assert.equal(plane.models.availability('b'), 'ungated');
  plane.models.register({ ...localOnly, modelId: 'c', providerConfigured: false });
  assert.equal(plane.models.availability('c'), 'unavailable');
  assert.equal(plane.models.availability(LOCAL_REFERENCE_MODEL_ID), 'available');
});
