import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createFabricLocalInferenceEnvelope,
  verifyFabricLocalInferenceEnvelope,
  XVI_LOCAL_INFERENCE_GUARDRAILS,
  type FabricLocalInferenceInput,
} from './xvi-agent-fabric-local-inference';

const SOURCE_COMMIT =
  'c7ee95f0870883305de7113b3c06a77c2b6858a2';

function input(
  overrides: Partial<FabricLocalInferenceInput> = {},
): FabricLocalInferenceInput {
  return {
    tenantId: 'tenant-a',
    missionId: 'mission-001',
    providerId: 'ollama-local',
    modelId: 'xvi-test-model',
    prompt: 'Analyze this bounded local task.',
    timeoutMs: 30_000,
    maxOutputTokens: 1_024,
    sourceCommit: SOURCE_COMMIT,
    ...overrides,
  };
}

test('local inference envelope executes nothing', () => {
  const envelope =
    createFabricLocalInferenceEnvelope(
      input(),
    );

  assert.equal(
    envelope.executesProvider,
    false,
  );

  assert.equal(
    envelope.networkAllowed,
    false,
  );

  assert.equal(
    envelope.shellAllowed,
    false,
  );

  assert.equal(
    envelope.productionAuthority,
    false,
  );

  assert.equal(
    envelope.secretMaterialIncluded,
    false,
  );

  assert.equal(
    XVI_LOCAL_INFERENCE_GUARDRAILS
      .executesProvider,
    false,
  );
});

test('source commit is bound to Gate 12 checkpoint', () => {
  const envelope =
    createFabricLocalInferenceEnvelope(
      input(),
    );

  assert.equal(
    envelope.sourceCommit,
    SOURCE_COMMIT,
  );
});

test('identical requests produce identical digests', () => {
  const first =
    createFabricLocalInferenceEnvelope(
      input(),
    );

  const second =
    createFabricLocalInferenceEnvelope(
      input(),
    );

  assert.equal(
    first.requestDigest,
    second.requestDigest,
  );

  assert.match(
    first.requestDigest,
    /^[a-f0-9]{64}$/,
  );
});

test('every admitted identity dimension changes digest', () => {
  const baseline =
    createFabricLocalInferenceEnvelope(
      input(),
    ).requestDigest;

  const variants = [
    input({ tenantId: 'tenant-b' }),
    input({ missionId: 'mission-002' }),
    input({ providerId: 'provider-b' }),
    input({ modelId: 'model-b' }),
    input({ prompt: 'Different prompt.' }),
    input({ timeoutMs: 30_001 }),
    input({ maxOutputTokens: 1_025 }),
    input({
      sourceCommit:
        'd'.repeat(40),
    }),
  ];

  for (const candidate of variants) {
    assert.notEqual(
      createFabricLocalInferenceEnvelope(
        candidate,
      ).requestDigest,
      baseline,
    );
  }
});

test('prompt byte count uses UTF-8 rather than character count', () => {
  const prompt = '∞'.repeat(100);

  const envelope =
    createFabricLocalInferenceEnvelope(
      input({ prompt }),
    );

  assert.equal(
    envelope.promptBytes,
    Buffer.byteLength(
      prompt,
      'utf8',
    ),
  );

  assert.ok(
    envelope.promptBytes >
      prompt.length,
  );
});

test('maximum prompt byte boundary is exact', () => {
  const maximum =
    XVI_LOCAL_INFERENCE_GUARDRAILS
      .maximumPromptBytes;

  const accepted =
    'a'.repeat(maximum);

  assert.equal(
    createFabricLocalInferenceEnvelope(
      input({ prompt: accepted }),
    ).promptBytes,
    maximum,
  );

  assert.throws(
    () =>
      createFabricLocalInferenceEnvelope(
        input({
          prompt:
            'a'.repeat(maximum + 1),
        }),
      ),
    /XVI_LOCAL_INFERENCE_REFUSED/,
  );
});

test('multibyte prompt cannot bypass byte limit', () => {
  const maximum =
    XVI_LOCAL_INFERENCE_GUARDRAILS
      .maximumPromptBytes;

  const prompt =
    '∞'.repeat(
      Math.floor(maximum / 3) + 1,
    );

  assert.ok(
    Buffer.byteLength(prompt, 'utf8') >
      maximum,
  );

  assert.throws(
    () =>
      createFabricLocalInferenceEnvelope(
        input({ prompt }),
      ),
    /XVI_LOCAL_INFERENCE_REFUSED/,
  );
});

test('timeout and output-token budgets are bounded safe integers', () => {
  const timeoutInvalid = [
    0,
    -1,
    1.5,
    120_001,
    Number.MAX_SAFE_INTEGER + 1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ];

  for (const timeoutMs of timeoutInvalid) {
    assert.throws(
      () =>
        createFabricLocalInferenceEnvelope(
          input({ timeoutMs }),
        ),
      /XVI_LOCAL_INFERENCE_REFUSED/,
    );
  }

  const tokenInvalid = [
    0,
    -1,
    1.5,
    8_193,
    Number.MAX_SAFE_INTEGER + 1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ];

  for (
    const maxOutputTokens of
    tokenInvalid
  ) {
    assert.throws(
      () =>
        createFabricLocalInferenceEnvelope(
          input({
            maxOutputTokens,
          }),
        ),
      /XVI_LOCAL_INFERENCE_REFUSED/,
    );
  }
});

test('malformed source commits fail closed', () => {
  const invalid = [
    '',
    'abc',
    'A'.repeat(40),
    'g'.repeat(40),
    'a'.repeat(39),
    'a'.repeat(41),
    ' a'.repeat(20),
  ];

  for (const sourceCommit of invalid) {
    assert.throws(
      () =>
        createFabricLocalInferenceEnvelope(
          input({ sourceCommit }),
        ),
      /XVI_LOCAL_INFERENCE_REFUSED/,
    );
  }
});

test('identity fields are bounded canonical identifiers', () => {
  const invalid = [
    '',
    ' tenant-a',
    'tenant-a ',
    'a'.repeat(129),
    'tenant a',
    'tenant<script>',
  ];

  for (const value of invalid) {
    for (const candidate of [
      input({ tenantId: value }),
      input({ missionId: value }),
      input({ providerId: value }),
      input({ modelId: value }),
    ]) {
      assert.throws(
        () =>
          createFabricLocalInferenceEnvelope(
            candidate,
          ),
        /XVI_LOCAL_INFERENCE_REFUSED/,
      );
    }
  }
});

test('undeclared fields fail closed', () => {
  assert.throws(
    () =>
      createFabricLocalInferenceEnvelope({
        ...input(),
        ownerSecret: 'f'.repeat(64),
      } as never),
    /XVI_LOCAL_INFERENCE_REFUSED/,
  );

  assert.throws(
    () =>
      createFabricLocalInferenceEnvelope({
        ...input(),
        productionAuthority: true,
      } as never),
    /XVI_LOCAL_INFERENCE_REFUSED/,
  );
});

test('hidden symbols fail closed', () => {
  const candidate =
    input() as FabricLocalInferenceInput &
      Record<symbol, unknown>;

  candidate[
    Symbol('authority')
  ] = true;

  assert.throws(
    () =>
      createFabricLocalInferenceEnvelope(
        candidate,
      ),
    /XVI_LOCAL_INFERENCE_REFUSED/,
  );
});

test('inherited state fails closed', () => {
  const candidate =
    Object.create({
      shellAllowed: true,
    });

  Object.assign(
    candidate,
    input(),
  );

  assert.throws(
    () =>
      createFabricLocalInferenceEnvelope(
        candidate,
      ),
    /XVI_LOCAL_INFERENCE_REFUSED/,
  );
});

test('accessors fail closed without invocation', () => {
  const candidate = input();

  let invoked = 0;

  Object.defineProperty(
    candidate,
    'prompt',
    {
      enumerable: true,
      get() {
        invoked += 1;
        return 'evil';
      },
    },
  );

  assert.throws(
    () =>
      createFabricLocalInferenceEnvelope(
        candidate,
      ),
    /XVI_LOCAL_INFERENCE_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('returned envelope is frozen and detached', () => {
  const source = input();

  const envelope =
    createFabricLocalInferenceEnvelope(
      source,
    );

  source.prompt = 'mutated';
  source.modelId = 'model-evil';
  source.timeoutMs = 1;

  assert.equal(
    envelope.prompt,
    'Analyze this bounded local task.',
  );

  assert.equal(
    envelope.modelId,
    'xvi-test-model',
  );

  assert.equal(
    envelope.timeoutMs,
    30_000,
  );

  assert.equal(
    Object.isFrozen(envelope),
    true,
  );
});

test('serialized envelope contains no controller credentials', () => {
  const serialized =
    JSON.stringify(
      createFabricLocalInferenceEnvelope(
        input(),
      ),
    );

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

test('canonical serialized envelope verifies after restoration', () => {
  const envelope =
    createFabricLocalInferenceEnvelope(
      input(),
    );

  const restored =
    JSON.parse(
      JSON.stringify(envelope),
    );

  assert.equal(
    verifyFabricLocalInferenceEnvelope(
      restored,
    ),
    'VERIFIED_FOR_PROVIDER_EVALUATION',
  );
});

test('verification refuses forged request digest', () => {
  const envelope =
    createFabricLocalInferenceEnvelope(
      input(),
    );

  assert.equal(
    verifyFabricLocalInferenceEnvelope({
      ...envelope,
      requestDigest: 'f'.repeat(64),
    }),
    'REFUSED',
  );
});

test('verification refuses altered prompt byte count', () => {
  const envelope =
    createFabricLocalInferenceEnvelope(
      input(),
    );

  assert.equal(
    verifyFabricLocalInferenceEnvelope({
      ...envelope,
      promptBytes:
        envelope.promptBytes + 1,
    }),
    'REFUSED',
  );
});

test('verification refuses changed admitted request dimensions', () => {
  const envelope =
    createFabricLocalInferenceEnvelope(
      input(),
    );

  const variants = [
    {
      ...envelope,
      tenantId: 'tenant-b',
    },
    {
      ...envelope,
      missionId: 'mission-002',
    },
    {
      ...envelope,
      providerId: 'provider-b',
    },
    {
      ...envelope,
      modelId: 'model-b',
    },
    {
      ...envelope,
      prompt: 'changed',
    },
    {
      ...envelope,
      timeoutMs:
        envelope.timeoutMs + 1,
    },
    {
      ...envelope,
      maxOutputTokens:
        envelope.maxOutputTokens + 1,
    },
    {
      ...envelope,
      sourceCommit: 'd'.repeat(40),
    },
  ];

  for (const candidate of variants) {
    assert.equal(
      verifyFabricLocalInferenceEnvelope(
        candidate,
      ),
      'REFUSED',
    );
  }
});

test('verification refuses authority escalation', () => {
  const envelope =
    createFabricLocalInferenceEnvelope(
      input(),
    );

  for (const candidate of [
    {
      ...envelope,
      executesProvider: true,
    },
    {
      ...envelope,
      networkAllowed: true,
    },
    {
      ...envelope,
      shellAllowed: true,
    },
    {
      ...envelope,
      productionAuthority: true,
    },
    {
      ...envelope,
      secretMaterialIncluded: true,
    },
  ]) {
    assert.equal(
      verifyFabricLocalInferenceEnvelope(
        candidate,
      ),
      'REFUSED',
    );
  }
});

test('verification refuses unknown hidden and inherited state', () => {
  const envelope =
    createFabricLocalInferenceEnvelope(
      input(),
    );

  assert.equal(
    verifyFabricLocalInferenceEnvelope({
      ...envelope,
      operatorOverride: true,
    }),
    'REFUSED',
  );

  const symbolCandidate = {
    ...envelope,
  } as Record<PropertyKey, unknown>;

  symbolCandidate[
    Symbol('authority')
  ] = true;

  assert.equal(
    verifyFabricLocalInferenceEnvelope(
      symbolCandidate,
    ),
    'REFUSED',
  );

  const inherited =
    Object.create({
      productionGrant: true,
    });

  Object.assign(
    inherited,
    envelope,
  );

  assert.equal(
    verifyFabricLocalInferenceEnvelope(
      inherited,
    ),
    'REFUSED',
  );
});

test('verification refuses accessors without invocation', () => {
  const envelope =
    createFabricLocalInferenceEnvelope(
      input(),
    );

  const candidate = {
    ...envelope,
  };

  let invoked = 0;

  Object.defineProperty(
    candidate,
    'requestDigest',
    {
      enumerable: true,
      get() {
        invoked += 1;
        return envelope.requestDigest;
      },
    },
  );

  assert.equal(
    verifyFabricLocalInferenceEnvelope(
      candidate,
    ),
    'REFUSED',
  );

  assert.equal(invoked, 0);
});
