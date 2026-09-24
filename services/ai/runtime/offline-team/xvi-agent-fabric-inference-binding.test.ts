import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createFabricLocalInferenceEnvelope,
} from './xvi-agent-fabric-local-inference';

import {
  bindFabricInferenceToLease,
  XVI_INFERENCE_BINDING_GUARDRAILS,
} from './xvi-agent-fabric-inference-binding';

const SOURCE_COMMIT =
  'c7ee95f0870883305de7113b3c06a77c2b6858a2';

function inference() {
  return createFabricLocalInferenceEnvelope({
    tenantId: 'tenant-a',
    missionId: 'mission-001',
    providerId: 'ollama-local',
    modelId: 'xvi-test-model',
    prompt: 'Bound local inference.',
    timeoutMs: 30_000,
    maxOutputTokens: 1_024,
    sourceCommit: SOURCE_COMMIT,
  });
}

function lease(
  overrides: Record<string, unknown> = {},
) {
  return {
    tenantId: 'tenant-a',
    holderInstanceId: 'asus-worker-01',
    lane: 'HOMEBASE',
    workId: 'mission-001',
    providerId: 'ollama-local',
    modelId: 'xvi-test-model',
    presenceEvidenceRef:
      'presence:local-model',
    sourceCommit: SOURCE_COMMIT,
    ...overrides,
  };
}

test('verified inference binds to matching lease identity', () => {
  const receipt =
    bindFabricInferenceToLease({
      inference: inference(),
      lease: lease(),
    });

  assert.equal(
    receipt.decision,
    'BOUND_FOR_PROVIDER_EVALUATION',
  );

  assert.equal(receipt.requestVerified, true);
  assert.equal(receipt.identityBound, true);

  assert.equal(receipt.executesProvider, false);
  assert.equal(receipt.networkAllowed, false);
  assert.equal(receipt.shellAllowed, false);
  assert.equal(
    receipt.productionAuthority,
    false,
  );
});

test('tenant mismatch fails closed', () => {
  assert.throws(
    () =>
      bindFabricInferenceToLease({
        inference: inference(),
        lease: lease({
          tenantId: 'tenant-b',
        }),
      }),
    /XVI_INFERENCE_BINDING_REFUSED/,
  );
});

test('mission and work identity mismatch fails closed', () => {
  assert.throws(
    () =>
      bindFabricInferenceToLease({
        inference: inference(),
        lease: lease({
          workId: 'mission-002',
        }),
      }),
    /XVI_INFERENCE_BINDING_REFUSED/,
  );
});

test('provider mismatch fails closed', () => {
  assert.throws(
    () =>
      bindFabricInferenceToLease({
        inference: inference(),
        lease: lease({
          providerId: 'provider-b',
        }),
      }),
    /XVI_INFERENCE_BINDING_REFUSED/,
  );
});

test('model mismatch fails closed', () => {
  assert.throws(
    () =>
      bindFabricInferenceToLease({
        inference: inference(),
        lease: lease({
          modelId: 'model-b',
        }),
      }),
    /XVI_INFERENCE_BINDING_REFUSED/,
  );
});

test('source checkpoint mismatch fails closed', () => {
  assert.throws(
    () =>
      bindFabricInferenceToLease({
        inference: inference(),
        lease: lease({
          sourceCommit: 'd'.repeat(40),
        }),
      }),
    /XVI_INFERENCE_BINDING_REFUSED/,
  );
});

test('forged inference digest fails closed', () => {
  const valid = inference();

  const forged = {
    ...valid,
    requestDigest: 'f'.repeat(64),
  };

  assert.throws(
    () =>
      bindFabricInferenceToLease({
        inference: forged,
        lease: lease(),
      }),
    /XVI_INFERENCE_BINDING_REFUSED/,
  );
});

test('lease extra authority fields fail closed', () => {
  assert.throws(
    () =>
      bindFabricInferenceToLease({
        inference: inference(),
        lease: lease({
          productionAuthority: true,
        }),
      } as never),
    /XVI_INFERENCE_BINDING_REFUSED/,
  );
});

test('lease accessors fail closed without invocation', () => {
  const candidate = lease();

  let invoked = 0;

  Object.defineProperty(
    candidate,
    'providerId',
    {
      enumerable: true,
      get() {
        invoked += 1;
        return 'ollama-local';
      },
    },
  );

  assert.throws(
    () =>
      bindFabricInferenceToLease({
        inference: inference(),
        lease: candidate as never,
      }),
    /XVI_INFERENCE_BINDING_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('binding receipt exposes no controller secret', () => {
  const receipt =
    bindFabricInferenceToLease({
      inference: inference(),
      lease: lease(),
    });

  const serialized =
    JSON.stringify(receipt);

  for (const forbidden of [
    'ownerSecret',
    'leaseId',
    'handle',
    'presenceEvidenceRef',
  ]) {
    assert.equal(
      serialized.includes(forbidden),
      false,
    );
  }
});

test('binding guardrails carry zero execution authority', () => {
  assert.equal(
    XVI_INFERENCE_BINDING_GUARDRAILS
      .executesProvider,
    false,
  );

  assert.equal(
    XVI_INFERENCE_BINDING_GUARDRAILS
      .networkAllowed,
    false,
  );

  assert.equal(
    XVI_INFERENCE_BINDING_GUARDRAILS
      .shellAllowed,
    false,
  );

  assert.equal(
    XVI_INFERENCE_BINDING_GUARDRAILS
      .productionAuthority,
    false,
  );

  assert.equal(
    XVI_INFERENCE_BINDING_GUARDRAILS
      .ownerSecretIncluded,
    false,
  );
});
