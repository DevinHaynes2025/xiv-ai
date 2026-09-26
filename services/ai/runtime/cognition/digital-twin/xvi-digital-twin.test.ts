import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createXviDigitalTwin,
} from './xvi-digital-twin';

function input() {
  return {
    userId:
      'user-001',

    twinId:
      'twin-001',

    displayName:
      'My XVI Twin',

    createdAtMs:
      1_000_000,

    personalizationEnabled:
      true,

    memoryEnabled:
      true,

    simulationEnabled:
      true,
  };
}

test('user receives distinct digital twin identity', () => {
  const twin =
    createXviDigitalTwin(
      input(),
    );

  assert.equal(
    twin.userId,
    'user-001',
  );

  assert.equal(
    twin.twinId,
    'twin-001',
  );

  assert.match(
    twin.twinDigest,
    /^[a-f0-9]{64}$/,
  );
});

test('digital twin identity is deterministic', () => {
  const first =
    createXviDigitalTwin(
      input(),
    );

  const second =
    createXviDigitalTwin(
      input(),
    );

  assert.equal(
    first.twinDigest,
    second.twinDigest,
  );
});

test('personalization state changes twin identity', () => {
  const first =
    createXviDigitalTwin(
      input(),
    );

  const second =
    createXviDigitalTwin({
      ...input(),

      memoryEnabled:
        false,
    });

  assert.notEqual(
    first.twinDigest,
    second.twinDigest,
  );
});

test('twin cannot reuse human identity', () => {
  assert.throws(
    () =>
      createXviDigitalTwin({
        ...input(),

        twinId:
          'user-001',
      }),
    /XVI_DIGITAL_TWIN_REFUSED/,
  );
});

test('digital twin cannot impersonate human', () => {
  const twin =
    createXviDigitalTwin(
      input(),
    );

  assert.equal(
    twin.representsHuman,
    true,
  );

  assert.equal(
    twin.isHuman,
    false,
  );

  assert.equal(
    twin.claimsHumanConsciousness,
    false,
  );

  assert.equal(
    twin.canImpersonateUser,
    false,
  );
});

test('digital twin cannot inherit human authority', () => {
  const twin =
    createXviDigitalTwin(
      input(),
    );

  assert.equal(
    twin.canAuthorizeForUser,
    false,
  );

  assert.equal(
    twin.canCopyUserCredentials,
    false,
  );

  assert.equal(
    twin.externalActionsRequireApproval,
    true,
  );

  assert.equal(
    twin.productionAuthority,
    false,
  );
});

test('undeclared authority fails closed', () => {
  assert.throws(
    () =>
      createXviDigitalTwin({
        ...input(),

        canAuthorizeForUser:
          true,
      } as never),
    /XVI_DIGITAL_TWIN_REFUSED/,
  );
});

test('accessors fail closed without invocation', () => {
  const candidate =
    input() as Record<
      string,
      unknown
    >;

  let invoked = 0;

  Object.defineProperty(
    candidate,
    'displayName',
    {
      enumerable: true,

      get() {
        invoked += 1;
        return 'Forged Twin';
      },
    },
  );

  assert.throws(
    () =>
      createXviDigitalTwin(
        candidate as never,
      ),
    /XVI_DIGITAL_TWIN_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('digital twin receipt is immutable', () => {
  const twin =
    createXviDigitalTwin(
      input(),
    );

  assert.equal(
    Object.isFrozen(twin),
    true,
  );
});
