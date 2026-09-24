import test from 'node:test';
import assert from 'node:assert/strict';

import {
  bindXviResponseToQuarantine,
} from './xvi-response-quarantine-binding';

function response() {
  return {
    version:
      'xvi-supervised-response-v1' as const,

    sourceId:
      'world-bank-public',

    manifestDigest:
      'a'.repeat(64),

    requestDigest:
      'b'.repeat(64),

    statusCode:
      200 as const,

    contentType:
      'application/json' as const,

    payloadBytes:
      1024,

    contentDigest:
      'c'.repeat(64),

    eligibleForQuarantine:
      true as const,

    networkAuthority:
      false as const,

    executesContent:
      false as const,

    executesTraining:
      false as const,

    productionAuthority:
      false as const,
  };
}

function quarantine() {
  return {
    version:
      'xvi-quarantine-v1' as const,

    sourceId:
      'world-bank-public',

    manifestDigest:
      'a'.repeat(64),

    contentDigest:
      'c'.repeat(64),

    provenanceDigest:
      'd'.repeat(64),

    decision:
      'CLEAN' as const,

    safeForMemoryAdmission:
      true,

    executesContent:
      false as const,

    executesFetch:
      false as const,

    executesTraining:
      false as const,

    networkAuthority:
      false as const,

    productionAuthority:
      false as const,
  };
}

test('matching clean response binds to quarantine', () => {
  const receipt =
    bindXviResponseToQuarantine({
      response: response(),
      quarantine: quarantine(),
    });

  assert.equal(
    receipt.quarantineVerified,
    true,
  );

  assert.equal(
    receipt.eligibleForProvenance,
    true,
  );

  assert.equal(
    receipt.contentTrustedAsInstructions,
    false,
  );
});

test('content digest mismatch fails closed', () => {
  assert.throws(
    () =>
      bindXviResponseToQuarantine({
        response: response(),

        quarantine: {
          ...quarantine(),

          contentDigest:
            'e'.repeat(64),
        },
      }),
    /XVI_RESPONSE_QUARANTINE_BINDING_REFUSED/,
  );
});

test('source mismatch fails closed', () => {
  assert.throws(
    () =>
      bindXviResponseToQuarantine({
        response: response(),

        quarantine: {
          ...quarantine(),

          sourceId:
            'different-source',
        },
      }),
    /XVI_RESPONSE_QUARANTINE_BINDING_REFUSED/,
  );
});

test('manifest mismatch fails closed', () => {
  assert.throws(
    () =>
      bindXviResponseToQuarantine({
        response: response(),

        quarantine: {
          ...quarantine(),

          manifestDigest:
            'e'.repeat(64),
        },
      }),
    /XVI_RESPONSE_QUARANTINE_BINDING_REFUSED/,
  );
});

test('review-required quarantine fails closed', () => {
  assert.throws(
    () =>
      bindXviResponseToQuarantine({
        response: response(),

        quarantine: {
          ...quarantine(),

          decision:
            'REVIEW_REQUIRED',

          safeForMemoryAdmission:
            false,
        },
      }),
    /XVI_RESPONSE_QUARANTINE_BINDING_REFUSED/,
  );
});

test('response authority escalation fails closed', () => {
  assert.throws(
    () =>
      bindXviResponseToQuarantine({
        response: {
          ...response(),

          executesContent:
            true,
        } as never,

        quarantine:
          quarantine(),
      }),
    /XVI_RESPONSE_QUARANTINE_BINDING_REFUSED/,
  );
});

test('quarantine authority escalation fails closed', () => {
  assert.throws(
    () =>
      bindXviResponseToQuarantine({
        response:
          response(),

        quarantine: {
          ...quarantine(),

          networkAuthority:
            true,
        } as never,
      }),
    /XVI_RESPONSE_QUARANTINE_BINDING_REFUSED/,
  );
});

test('input accessors fail closed without invocation', () => {
  const candidate = {
    response: response(),
    quarantine: quarantine(),
  } as Record<string, unknown>;

  let invoked = 0;

  Object.defineProperty(
    candidate,
    'response',
    {
      enumerable: true,

      get() {
        invoked += 1;
        return response();
      },
    },
  );

  assert.throws(
    () =>
      bindXviResponseToQuarantine(
        candidate as never,
      ),
    /XVI_RESPONSE_QUARANTINE_BINDING_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('binding preserves zero authority', () => {
  const receipt =
    bindXviResponseToQuarantine({
      response: response(),
      quarantine: quarantine(),
    });

  assert.equal(
    receipt.executesContent,
    false,
  );

  assert.equal(
    receipt.executesFetch,
    false,
  );

  assert.equal(
    receipt.executesTraining,
    false,
  );

  assert.equal(
    receipt.networkAuthority,
    false,
  );

  assert.equal(
    receipt.productionAuthority,
    false,
  );

  assert.equal(
    Object.isFrozen(receipt),
    true,
  );
});
