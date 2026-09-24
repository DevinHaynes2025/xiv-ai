import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  SharedHostLeaseStore,
} from './shared-host-lease-store';

import {
  createFabricLocalInferenceEnvelope,
} from './xvi-agent-fabric-local-inference';

import {
  bindFabricInferenceToLease,
} from './xvi-agent-fabric-inference-binding';

import {
  verifyFabricInferenceOwnership,
  XVI_INFERENCE_OWNERSHIP_GUARDRAILS,
} from './xvi-agent-fabric-inference-ownership';

const SOURCE_COMMIT =
  'c7ee95f0870883305de7113b3c06a77c2b6858a2';

function binding() {
  return {
    tenantId: 'tenant-a',
    holderInstanceId: 'asus-worker-01',
    lane: 'HOMEBASE' as const,
    workId: 'mission-001',
    providerId: 'ollama-local',
    modelId: 'xvi-test-model',
    presenceEvidenceRef:
      'presence:local-model',
    sourceCommit: SOURCE_COMMIT,
  };
}

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

test('real live lease authenticates inference ownership', () => {
  const directory =
    mkdtempSync(
      join(
        tmpdir(),
        'xvi-inference-ownership-',
      ),
    );

  const ledger =
    join(
      directory,
      'ownership.sqlite',
    );

  const hostScopeId =
    'd'.repeat(32);

  let now = 5_000_000;

  SharedHostLeaseStore.initialize(
    ledger,
    hostScopeId,
  );

  const store =
    new SharedHostLeaseStore(
      ledger,
      hostScopeId,
      () => now,
    );

  try {
    const acquired =
      store.acquire({
        ...binding(),
        ttlMs: 10_000,
      });

    assert.equal(
      acquired.status,
      'RESERVED_NOT_STARTED',
    );

    assert.ok(acquired.handle);

    const receipt =
      bindFabricInferenceToLease({
        inference: inference(),
        lease: binding(),
      });

    const ownership =
      verifyFabricInferenceOwnership(
        store,
        {
          receipt,
          handle: acquired.handle,
          lane: 'HOMEBASE',
          presenceEvidenceRef:
            'presence:local-model',
        },
      );

    assert.equal(
      ownership.decision,
      'ACTIVE_OWNERSHIP_VERIFIED_FOR_PROVIDER_EVALUATION',
    );

    assert.equal(
      ownership.activeOwnershipVerified,
      true,
    );

    assert.equal(
      ownership.executesProvider,
      false,
    );

    assert.equal(
      ownership.productionAuthority,
      false,
    );
  } finally {
    store.close();

    rmSync(
      directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test('stale lease revision fails live ownership verification', () => {
  const directory =
    mkdtempSync(
      join(
        tmpdir(),
        'xvi-inference-stale-',
      ),
    );

  const ledger =
    join(directory, 'stale.sqlite');

  const hostScopeId =
    'e'.repeat(32);

  let now = 6_000_000;

  SharedHostLeaseStore.initialize(
    ledger,
    hostScopeId,
  );

  const store =
    new SharedHostLeaseStore(
      ledger,
      hostScopeId,
      () => now,
    );

  try {
    const acquired =
      store.acquire({
        ...binding(),
        ttlMs: 10_000,
      });

    assert.ok(acquired.handle);

    const stale = acquired.handle;

    now += 1_000;

    const renewed =
      store.renew(
        acquired.handle,
        10_000,
      ) as typeof acquired.handle;

    assert.ok(renewed);

    const receipt =
      bindFabricInferenceToLease({
        inference: inference(),
        lease: binding(),
      });

    assert.throws(
      () =>
        verifyFabricInferenceOwnership(
          store,
          {
            receipt,
            handle: stale,
            lane: 'HOMEBASE',
            presenceEvidenceRef:
              'presence:local-model',
          },
        ),
      /XVI_INFERENCE_OWNERSHIP_REFUSED/,
    );
  } finally {
    store.close();

    rmSync(
      directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test('wrong owner secret fails live ownership verification', () => {
  const directory =
    mkdtempSync(
      join(
        tmpdir(),
        'xvi-inference-secret-',
      ),
    );

  const ledger =
    join(directory, 'secret.sqlite');

  const hostScopeId =
    'f'.repeat(32);

  SharedHostLeaseStore.initialize(
    ledger,
    hostScopeId,
  );

  const store =
    new SharedHostLeaseStore(
      ledger,
      hostScopeId,
      () => 7_000_000,
    );

  try {
    const acquired =
      store.acquire({
        ...binding(),
        ttlMs: 10_000,
      });

    assert.ok(acquired.handle);

    const forged = {
      ...acquired.handle,
      ownerSecret: '0'.repeat(64),
    };

    const receipt =
      bindFabricInferenceToLease({
        inference: inference(),
        lease: binding(),
      });

    assert.throws(
      () =>
        verifyFabricInferenceOwnership(
          store,
          {
            receipt,
            handle: forged,
            lane: 'HOMEBASE',
            presenceEvidenceRef:
              'presence:local-model',
          },
        ),
      /XVI_INFERENCE_OWNERSHIP_REFUSED/,
    );
  } finally {
    store.close();

    rmSync(
      directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test('wrong live provider model or commit binding fails', () => {
  const variants = [
    {
      providerId: 'provider-b',
    },
    {
      modelId: 'model-b',
    },
    {
      sourceCommit:
        'd'.repeat(40),
    },
  ];

  for (const variant of variants) {
    const directory =
      mkdtempSync(
        join(
          tmpdir(),
          'xvi-inference-binding-',
        ),
      );

    const ledger =
      join(
        directory,
        'binding.sqlite',
      );

    const hostScopeId =
      'a'.repeat(32);

    SharedHostLeaseStore.initialize(
      ledger,
      hostScopeId,
    );

    const store =
      new SharedHostLeaseStore(
        ledger,
        hostScopeId,
        () => 8_000_000,
      );

    try {
      const acquired =
        store.acquire({
          ...binding(),
          ...variant,
          ttlMs: 10_000,
        });

      assert.ok(acquired.handle);

      const receipt =
        bindFabricInferenceToLease({
          inference: inference(),
          lease: binding(),
        });

      assert.throws(
        () =>
          verifyFabricInferenceOwnership(
            store,
            {
              receipt,
              handle: acquired.handle,
              lane: 'HOMEBASE',
              presenceEvidenceRef:
                'presence:local-model',
            },
          ),
        /XVI_INFERENCE_OWNERSHIP_REFUSED/,
      );
    } finally {
      store.close();

      rmSync(
        directory,
        {
          recursive: true,
          force: true,
        },
      );
    }
  }
});

test('ownership receipt exposes no private lease material', () => {
  const directory =
    mkdtempSync(
      join(
        tmpdir(),
        'xvi-inference-output-',
      ),
    );

  const ledger =
    join(directory, 'output.sqlite');

  const hostScopeId =
    'b'.repeat(32);

  SharedHostLeaseStore.initialize(
    ledger,
    hostScopeId,
  );

  const store =
    new SharedHostLeaseStore(
      ledger,
      hostScopeId,
      () => 9_000_000,
    );

  try {
    const acquired =
      store.acquire({
        ...binding(),
        ttlMs: 10_000,
      });

    assert.ok(acquired.handle);

    const receipt =
      bindFabricInferenceToLease({
        inference: inference(),
        lease: binding(),
      });

    const ownership =
      verifyFabricInferenceOwnership(
        store,
        {
          receipt,
          handle: acquired.handle,
          lane: 'HOMEBASE',
          presenceEvidenceRef:
            'presence:local-model',
        },
      );

    const serialized =
      JSON.stringify(ownership);

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

    assert.equal(
      XVI_INFERENCE_OWNERSHIP_GUARDRAILS
        .exposesOwnerSecret,
      false,
    );

    assert.equal(
      XVI_INFERENCE_OWNERSHIP_GUARDRAILS
        .exposesLeaseHandle,
      false,
    );
  } finally {
    store.close();

    rmSync(
      directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test('ownership input accessors fail closed without invocation', () => {
  let invoked = 0;

  const candidate = {
    handle: {},
    lane: 'HOMEBASE',
    presenceEvidenceRef:
      'presence:local-model',
  } as Record<string, unknown>;

  Object.defineProperty(
    candidate,
    'receipt',
    {
      enumerable: true,
      get() {
        invoked += 1;
        return {};
      },
    },
  );

  const store = {
    assertBinding() {
      throw new Error(
        'must not reach store',
      );
    },
  };

  assert.throws(
    () =>
      verifyFabricInferenceOwnership(
        store,
        candidate as never,
      ),
    /XVI_INFERENCE_OWNERSHIP_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('ownership input hidden symbol and extra fields fail closed', () => {
  const store = {
    assertBinding() {
      throw new Error(
        'must not reach store',
      );
    },
  };

  const base = {
    receipt: {},
    handle: {},
    lane: 'HOMEBASE',
    presenceEvidenceRef:
      'presence:local-model',
  };

  assert.throws(
    () =>
      verifyFabricInferenceOwnership(
        store,
        {
          ...base,
          operatorOverride: true,
        } as never,
      ),
    /XVI_INFERENCE_OWNERSHIP_REFUSED/,
  );

  const symbolCandidate = {
    ...base,
  } as Record<PropertyKey, unknown>;

  symbolCandidate[
    Symbol('authority')
  ] = true;

  assert.throws(
    () =>
      verifyFabricInferenceOwnership(
        store,
        symbolCandidate as never,
      ),
    /XVI_INFERENCE_OWNERSHIP_REFUSED/,
  );
});

test('ownership input inherited state fails closed', () => {
  const candidate =
    Object.create({
      productionAuthority: true,
    });

  Object.assign(
    candidate,
    {
      receipt: {},
      handle: {},
      lane: 'HOMEBASE',
      presenceEvidenceRef:
        'presence:local-model',
    },
  );

  const store = {
    assertBinding() {
      throw new Error(
        'must not reach store',
      );
    },
  };

  assert.throws(
    () =>
      verifyFabricInferenceOwnership(
        store,
        candidate,
      ),
    /XVI_INFERENCE_OWNERSHIP_REFUSED/,
  );
});

test('stopped confirmed lease cannot authorize inference ownership', () => {
  const directory =
    mkdtempSync(
      join(
        tmpdir(),
        'xvi-inference-stopped-',
      ),
    );

  const ledger =
    join(directory, 'stopped.sqlite');

  const hostScopeId =
    'c'.repeat(32);

  let now = 10_000_000;

  SharedHostLeaseStore.initialize(
    ledger,
    hostScopeId,
  );

  const store =
    new SharedHostLeaseStore(
      ledger,
      hostScopeId,
      () => now,
    );

  try {
    const acquired =
      store.acquire({
        ...binding(),
        ttlMs: 10_000,
      });

    assert.ok(acquired.handle);

    now += 1_000;

    const stopped =
      store.markStopped(
        acquired.handle,
        true,
        'stop:provider-confirmed',
      );

    const receipt =
      bindFabricInferenceToLease({
        inference: inference(),
        lease: binding(),
      });

    assert.throws(
      () =>
        verifyFabricInferenceOwnership(
          store,
          {
            receipt,
            handle: stopped,
            lane: 'HOMEBASE',
            presenceEvidenceRef:
              'presence:local-model',
          },
        ),
      /XVI_INFERENCE_OWNERSHIP_REFUSED/,
    );
  } finally {
    store.close();

    rmSync(
      directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test('released lease cannot authorize inference ownership', () => {
  const directory =
    mkdtempSync(
      join(
        tmpdir(),
        'xvi-inference-released-',
      ),
    );

  const ledger =
    join(directory, 'released.sqlite');

  const hostScopeId =
    '9'.repeat(32);

  let now = 11_000_000;

  SharedHostLeaseStore.initialize(
    ledger,
    hostScopeId,
  );

  const store =
    new SharedHostLeaseStore(
      ledger,
      hostScopeId,
      () => now,
    );

  try {
    const acquired =
      store.acquire({
        ...binding(),
        ttlMs: 10_000,
      });

    assert.ok(acquired.handle);

    now += 1_000;

    const stopped =
      store.markStopped(
        acquired.handle,
        true,
        'stop:provider-confirmed',
      );

    now += 1_000;

    const released =
      store.release(
        stopped,
        'release:confirmed',
      );

    const receipt =
      bindFabricInferenceToLease({
        inference: inference(),
        lease: binding(),
      });

    assert.throws(
      () =>
        verifyFabricInferenceOwnership(
          store,
          {
            receipt,
            handle: released,
            lane: 'HOMEBASE',
            presenceEvidenceRef:
              'presence:local-model',
          },
        ),
      /XVI_INFERENCE_OWNERSHIP_REFUSED/,
    );
  } finally {
    store.close();

    rmSync(
      directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test('expired active lease cannot authorize inference ownership', () => {
  const directory =
    mkdtempSync(
      join(
        tmpdir(),
        'xvi-inference-expired-',
      ),
    );

  const ledger =
    join(directory, 'expired.sqlite');

  const hostScopeId =
    '8'.repeat(32);

  let now = 12_000_000;

  SharedHostLeaseStore.initialize(
    ledger,
    hostScopeId,
  );

  const store =
    new SharedHostLeaseStore(
      ledger,
      hostScopeId,
      () => now,
    );

  try {
    const acquired =
      store.acquire({
        ...binding(),
        ttlMs: 10_000,
      });

    assert.ok(acquired.handle);

    const receipt =
      bindFabricInferenceToLease({
        inference: inference(),
        lease: binding(),
      });

    /*
     * Acquisition occurred at 12,000,000 with
     * ttl 10,000, so equality with expiresAtMs
     * must already count as expired.
     */
    now = 12_010_000;

    assert.throws(
      () =>
        verifyFabricInferenceOwnership(
          store,
          {
            receipt,
            handle: acquired.handle,
            lane: 'HOMEBASE',
            presenceEvidenceRef:
              'presence:local-model',
          },
        ),
      /XVI_INFERENCE_OWNERSHIP_REFUSED/,
    );
  } finally {
    store.close();

    rmSync(
      directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});
