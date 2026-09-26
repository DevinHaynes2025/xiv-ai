import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createXviUniverseIntent,
} from './xvi-universe-intent';

function input() {
  return {
    userId:
      'user-001',

    twinDigest:
      'a'.repeat(64),

    humanityContextDigest:
      'b'.repeat(64),

    utterance:
      'Build a global logistics company.',

    domain:
      'BUSINESS' as const,

    mode:
      'BUILD' as const,

    transformerIds: [
      'COMPANY_TRANSFORMER',
      'FINANCIAL_TRANSFORMER',
      'SUPPLY_CHAIN_TRANSFORMER',
      'TECHNOLOGY_TRANSFORMER',
      'GOVERNANCE_TRANSFORMER',
    ] as const,

    createdAtMs:
      1_000_000,
  };
}

test('human request becomes structured universe intent', () => {
  const intent =
    createXviUniverseIntent(
      input(),
    );

  assert.equal(
    intent.domain,
    'BUSINESS',
  );

  assert.equal(
    intent.mode,
    'BUILD',
  );

  assert.match(
    intent.intentDigest,
    /^[a-f0-9]{64}$/,
  );
});

test('identical intent is deterministic', () => {
  const first =
    createXviUniverseIntent(
      input(),
    );

  const second =
    createXviUniverseIntent(
      input(),
    );

  assert.equal(
    first.intentDigest,
    second.intentDigest,
  );
});

test('utterance changes intent identity', () => {
  const first =
    createXviUniverseIntent(
      input(),
    );

  const second =
    createXviUniverseIntent({
      ...input(),

      utterance:
        'Build a healthcare company.',
    });

  assert.notEqual(
    first.intentDigest,
    second.intentDigest,
  );
});

test('digital twin context changes intent identity', () => {
  const first =
    createXviUniverseIntent(
      input(),
    );

  const second =
    createXviUniverseIntent({
      ...input(),

      twinDigest:
        'c'.repeat(64),
    });

  assert.notEqual(
    first.intentDigest,
    second.intentDigest,
  );
});

test('duplicate transformers fail closed', () => {
  assert.throws(
    () =>
      createXviUniverseIntent({
        ...input(),

        transformerIds: [
          'COMPANY_TRANSFORMER',
          'COMPANY_TRANSFORMER',
        ],
      }),
    /XVI_UNIVERSE_INTENT_REFUSED/,
  );
});

test('unknown transformer fails closed', () => {
  assert.throws(
    () =>
      createXviUniverseIntent({
        ...input(),

        transformerIds: [
          'UNKNOWN_TRANSFORMER',
        ],
      } as never),
    /XVI_UNIVERSE_INTENT_REFUSED/,
  );
});

test('malformed twin identity fails closed', () => {
  assert.throws(
    () =>
      createXviUniverseIntent({
        ...input(),

        twinDigest:
          'bad',
      }),
    /XVI_UNIVERSE_INTENT_REFUSED/,
  );
});

test('intent can plan but cannot execute externally', () => {
  const intent =
    createXviUniverseIntent(
      input(),
    );

  assert.equal(intent.mayPlan, true);
  assert.equal(intent.maySimulate, true);

  assert.equal(
    intent.executesExternalAction,
    false,
  );

  assert.equal(
    intent.spendsMoney,
    false,
  );

  assert.equal(
    intent.signsAgreement,
    false,
  );

  assert.equal(
    intent.sendsCommunication,
    false,
  );

  assert.equal(
    intent.modifiesProduction,
    false,
  );

  assert.equal(
    intent.requiresApprovalForExternalAction,
    true,
  );
});

test('undeclared execution authority fails closed', () => {
  assert.throws(
    () =>
      createXviUniverseIntent({
        ...input(),

        executesExternalAction:
          true,
      } as never),
    /XVI_UNIVERSE_INTENT_REFUSED/,
  );
});

test('intent receipt and transformer routing are frozen', () => {
  const intent =
    createXviUniverseIntent(
      input(),
    );

  assert.equal(
    Object.isFrozen(intent),
    true,
  );

  assert.equal(
    Object.isFrozen(
      intent.transformerIds,
    ),
    true,
  );
});
