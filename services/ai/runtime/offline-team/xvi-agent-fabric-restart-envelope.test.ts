import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createFabricRestartEnvelope,
  verifyFabricRestartEnvelope,
  XVI_FABRIC_RESTART_GUARDRAILS,
  type FabricRestartInput,
} from './xvi-agent-fabric-restart-envelope';

const HEX64 = 'a'.repeat(64);
const JOURNAL64 = 'b'.repeat(64);
const COMMIT40 = 'c'.repeat(40);

function restartInput(
  overrides: Partial<FabricRestartInput> = {},
): FabricRestartInput {
  return {
    tenantId: 'tenant-a',
    missionId: 'mission-001',
    planDigest: HEX64,
    journalDigest: JOURNAL64,
    connectivity: 'OFFLINE_ONLY',
    confidentiality: 'INTERNAL',
    risk: 'LOW',
    sourceCommit: COMMIT40,
    ...overrides,
  };
}

test('restart envelope grants zero execution authority', () => {
  const envelope = createFabricRestartEnvelope(restartInput());

  assert.equal(XVI_FABRIC_RESTART_GUARDRAILS.executesNothing, true);
  assert.equal(envelope.executesNothing, true);
  assert.equal(envelope.productionAuthority, false);
  assert.equal(envelope.providerCalls, 0);
  assert.equal(envelope.processSpawns, 0);
});

test('identical restart inputs produce identical envelope digest', () => {
  const a = createFabricRestartEnvelope(restartInput());
  const b = createFabricRestartEnvelope(restartInput());

  assert.equal(a.envelopeDigest, b.envelopeDigest);
  assert.match(a.envelopeDigest, /^[0-9a-f]{64}$/);
});

test('tenant mission plan and journal identity are digest-bound', () => {
  const base = createFabricRestartEnvelope(restartInput());

  const variants = [
    restartInput({ tenantId: 'tenant-b' }),
    restartInput({ missionId: 'mission-002' }),
    restartInput({ planDigest: 'd'.repeat(64) }),
    restartInput({ journalDigest: 'e'.repeat(64) }),
  ];

  for (const input of variants) {
    assert.notEqual(
      createFabricRestartEnvelope(input).envelopeDigest,
      base.envelopeDigest,
    );
  }
});

test('restart policy dimensions are digest-bound', () => {
  const base = createFabricRestartEnvelope(restartInput());

  const variants = [
    restartInput({ connectivity: 'ONLINE_ALLOWED' }),
    restartInput({ confidentiality: 'CONFIDENTIAL' }),
    restartInput({ risk: 'CONSEQUENTIAL' }),
    restartInput({ sourceCommit: 'd'.repeat(40) }),
  ];

  for (const input of variants) {
    assert.notEqual(
      createFabricRestartEnvelope(input).envelopeDigest,
      base.envelopeDigest,
    );
  }
});

test('malformed digests and source commits fail closed', () => {
  for (const input of [
    restartInput({ planDigest: 'short' }),
    restartInput({ journalDigest: 'xyz' }),
    restartInput({ sourceCommit: 'abc' }),
  ]) {
    assert.throws(
      () => createFabricRestartEnvelope(input),
      /XVI_FABRIC_RESTART_REFUSED/,
    );
  }
});

test('unknown policy values fail closed', () => {
  assert.throws(
    () =>
      createFabricRestartEnvelope(
        restartInput({ connectivity: 'ANYWHERE' as never }),
      ),
    /XVI_FABRIC_RESTART_REFUSED/,
  );

  assert.throws(
    () =>
      createFabricRestartEnvelope(
        restartInput({ confidentiality: 'ROOT' as never }),
      ),
    /XVI_FABRIC_RESTART_REFUSED/,
  );

  assert.throws(
    () =>
      createFabricRestartEnvelope(
        restartInput({ risk: 'UNLIMITED' as never }),
      ),
    /XVI_FABRIC_RESTART_REFUSED/,
  );
});

test('undeclared hidden symbol and inherited properties fail closed', () => {
  const extra = {
    ...restartInput(),
    productionOverride: true,
  };

  assert.throws(
    () => createFabricRestartEnvelope(extra as never),
    /XVI_FABRIC_RESTART_REFUSED/,
  );

  const hidden = restartInput();
  Object.defineProperty(hidden, 'secret', {
    value: true,
    enumerable: false,
  });

  assert.throws(
    () => createFabricRestartEnvelope(hidden),
    /XVI_FABRIC_RESTART_REFUSED/,
  );

  const symbolic = restartInput();
  Object.defineProperty(symbolic, Symbol('authority'), {
    value: true,
    enumerable: true,
  });

  assert.throws(
    () => createFabricRestartEnvelope(symbolic),
    /XVI_FABRIC_RESTART_REFUSED/,
  );

  const inherited = restartInput();
  Object.setPrototypeOf(inherited, { authority: true });

  assert.throws(
    () => createFabricRestartEnvelope(inherited),
    /XVI_FABRIC_RESTART_REFUSED/,
  );
});

test('accessors fail closed without invocation', () => {
  const input = restartInput();
  let invoked = 0;

  Object.defineProperty(input, 'tenantId', {
    enumerable: true,
    get() {
      invoked += 1;
      return 'tenant-a';
    },
  });

  assert.throws(
    () => createFabricRestartEnvelope(input),
    /XVI_FABRIC_RESTART_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('restart envelope is detached and frozen', () => {
  const input = restartInput();
  const envelope = createFabricRestartEnvelope(input);

  input.tenantId = 'tenant-mutated';
  input.missionId = 'mission-mutated';
  input.planDigest = 'f'.repeat(64);

  assert.equal(envelope.tenantId, 'tenant-a');
  assert.equal(envelope.missionId, 'mission-001');
  assert.equal(envelope.planDigest, HEX64);
  assert.equal(Object.isFrozen(envelope), true);
});

test('exact restart envelope verifies only for recovery evaluation', () => {
  const expected = createFabricRestartEnvelope(restartInput());
  const observed = createFabricRestartEnvelope(restartInput());

  const result = verifyFabricRestartEnvelope(expected, observed);

  assert.equal(result, 'VERIFIED_FOR_RECOVERY_EVALUATION');
});

test('restart verification refuses every identity mismatch', () => {
  const expected = createFabricRestartEnvelope(restartInput());

  const mismatches = [
    createFabricRestartEnvelope(restartInput({ tenantId: 'tenant-b' })),
    createFabricRestartEnvelope(restartInput({ missionId: 'mission-002' })),
    createFabricRestartEnvelope(
      restartInput({ planDigest: 'd'.repeat(64) }),
    ),
    createFabricRestartEnvelope(
      restartInput({ journalDigest: 'e'.repeat(64) }),
    ),
    createFabricRestartEnvelope(
      restartInput({ connectivity: 'ONLINE_ALLOWED' }),
    ),
    createFabricRestartEnvelope(
      restartInput({ confidentiality: 'CONFIDENTIAL' }),
    ),
    createFabricRestartEnvelope(
      restartInput({ risk: 'CONSEQUENTIAL' }),
    ),
    createFabricRestartEnvelope(
      restartInput({ sourceCommit: 'd'.repeat(40) }),
    ),
  ];

  for (const observed of mismatches) {
    assert.equal(
      verifyFabricRestartEnvelope(expected, observed),
      'REFUSED',
    );
  }
});

test('verification refuses forged envelope digest', () => {
  const expected = createFabricRestartEnvelope(restartInput());
  const observed = {
    ...expected,
    envelopeDigest: 'f'.repeat(64),
  };

  assert.equal(
    verifyFabricRestartEnvelope(expected, observed),
    'REFUSED',
  );
});

test('verification refuses altered zero-authority flags', () => {
  const expected = createFabricRestartEnvelope(restartInput());

  const authority = {
    ...expected,
    productionAuthority: true,
  };

  const execution = {
    ...expected,
    executesNothing: false,
  };

  const providers = {
    ...expected,
    providerCalls: 1,
  };

  const spawns = {
    ...expected,
    processSpawns: 1,
  };

  for (const observed of [
    authority,
    execution,
    providers,
    spawns,
  ]) {
    assert.equal(
      verifyFabricRestartEnvelope(
        expected,
        observed as never,
      ),
      'REFUSED',
    );
  }
});

test('verification refuses objects with undeclared hidden symbol or inherited state', () => {
  const expected = createFabricRestartEnvelope(restartInput());

  const extra = {
    ...expected,
    authorityOverride: true,
  };

  assert.equal(
    verifyFabricRestartEnvelope(expected, extra as never),
    'REFUSED',
  );

  const hidden = { ...expected };

  Object.defineProperty(hidden, 'secret', {
    value: true,
    enumerable: false,
  });

  assert.equal(
    verifyFabricRestartEnvelope(expected, hidden as never),
    'REFUSED',
  );

  const symbolic = { ...expected };

  Object.defineProperty(symbolic, Symbol('authority'), {
    value: true,
    enumerable: true,
  });

  assert.equal(
    verifyFabricRestartEnvelope(expected, symbolic as never),
    'REFUSED',
  );

  const inherited = { ...expected };

  Object.setPrototypeOf(inherited, {
    authority: true,
  });

  assert.equal(
    verifyFabricRestartEnvelope(expected, inherited as never),
    'REFUSED',
  );
});

test('verification refuses accessors without invocation', () => {
  const expected = createFabricRestartEnvelope(restartInput());
  const observed = { ...expected };
  let invoked = 0;

  Object.defineProperty(observed, 'tenantId', {
    enumerable: true,
    get() {
      invoked += 1;
      return 'tenant-a';
    },
  });

  assert.equal(
    verifyFabricRestartEnvelope(expected, observed as never),
    'REFUSED',
  );

  assert.equal(invoked, 0);
});

test('verification refuses malformed digest shapes', () => {
  const expected = createFabricRestartEnvelope(restartInput());

  const badEnvelope = {
    ...expected,
    envelopeDigest: 'abc',
  };

  const badPlan = {
    ...expected,
    planDigest: 'short',
  };

  const badJournal = {
    ...expected,
    journalDigest: 'xyz',
  };

  for (const observed of [
    badEnvelope,
    badPlan,
    badJournal,
  ]) {
    assert.equal(
      verifyFabricRestartEnvelope(
        expected,
        observed as never,
      ),
      'REFUSED',
    );
  }
});

test('canonical serialized envelope verifies after restoration', () => {
  const expected = createFabricRestartEnvelope(restartInput());

  const observed = {
    version: 'xvi-agent-fabric-restart-v1' as const,
    tenantId: 'tenant-a',
    missionId: 'mission-001',
    planDigest: HEX64,
    journalDigest: JOURNAL64,
    connectivity: 'OFFLINE_ONLY' as const,
    confidentiality: 'INTERNAL' as const,
    risk: 'LOW' as const,
    sourceCommit: COMMIT40,
    executesNothing: true as const,
    productionAuthority: false as const,
    providerCalls: 0 as const,
    processSpawns: 0 as const,
    envelopeDigest: expected.envelopeDigest,
  };

  assert.equal(
    verifyFabricRestartEnvelope(expected, observed),
    'VERIFIED_FOR_RECOVERY_EVALUATION',
  );
});
