import test from 'node:test';
import assert from 'node:assert/strict';

import {
  admitXviSource,
} from './xvi-source-validator';

import type {
  XviSourceManifest,
} from './xvi-source-manifest';

function manifest(
  overrides: Partial<XviSourceManifest> = {},
): XviSourceManifest {
  return {
    version: 'xvi-source-manifest-v1',

    sourceId: 'world-bank-public',
    sourceName: 'World Bank Public Data',

    authority: 'INTERGOVERNMENTAL',
    sensitivity: 'PUBLIC_AGGREGATE',

    brainTargets: [
      'MACRO',
      'FINANCIAL',
      'GOVERNANCE',
    ],

    canonicalOrigin:
      'https://api.worldbank.org/',

    retrievalAllowed: true,
    trainingAllowed: false,
    commercialUseAllowed: false,
    attributionRequired: true,

    containsPersonalData: false,

    providerAuthenticationRequired: false,
    authorizationVerified: true,

    executesFetch: false,
    networkAuthority: false,
    productionAuthority: false,

    ...overrides,
  };
}

test('public aggregate source is admitted for retrieval only', () => {
  const result =
    admitXviSource(manifest());

  assert.equal(
    result.admittedForRetrieval,
    true,
  );

  assert.equal(
    result.executesFetch,
    false,
  );

  assert.equal(
    result.executesTraining,
    false,
  );

  assert.equal(
    result.networkAuthority,
    false,
  );

  assert.match(
    result.manifestDigest,
    /^[a-f0-9]{64}$/,
  );
});

test('identical manifests produce identical digests', () => {
  const first =
    admitXviSource(manifest());

  const second =
    admitXviSource(manifest());

  assert.equal(
    first.manifestDigest,
    second.manifestDigest,
  );
});

test('source identity changes provenance digest', () => {
  const first =
    admitXviSource(manifest());

  const second =
    admitXviSource(
      manifest({
        sourceId:
          'world-bank-public-v2',
      }),
    );

  assert.notEqual(
    first.manifestDigest,
    second.manifestDigest,
  );
});

test('prohibited data fails closed', () => {
  assert.throws(
    () =>
      admitXviSource(
        manifest({
          sensitivity: 'PROHIBITED',
        }),
      ),
    /XVI_SOURCE_ADMISSION_REFUSED/,
  );
});

test('personal data fails closed', () => {
  assert.throws(
    () =>
      admitXviSource(
        manifest({
          containsPersonalData: true,
        }),
      ),
    /XVI_SOURCE_ADMISSION_REFUSED/,
  );
});

test('authentication-required source requires verified authorization', () => {
  assert.throws(
    () =>
      admitXviSource(
        manifest({
          providerAuthenticationRequired:
            true,

          authorizationVerified:
            false,
        }),
      ),
    /XVI_SOURCE_ADMISSION_REFUSED/,
  );
});

test('retrieval permission does not imply training permission', () => {
  const result =
    admitXviSource(manifest());

  assert.equal(
    result.manifest.retrievalAllowed,
    true,
  );

  assert.equal(
    result.manifest.trainingAllowed,
    false,
  );

  assert.equal(
    result.executesTraining,
    false,
  );
});

test('aggregate source cannot silently enable training', () => {
  assert.throws(
    () =>
      admitXviSource(
        manifest({
          trainingAllowed: true,
        }),
      ),
    /XVI_SOURCE_ADMISSION_REFUSED/,
  );
});

test('http origins fail closed', () => {
  assert.throws(
    () =>
      admitXviSource(
        manifest({
          canonicalOrigin:
            'http://example.com',
        }),
      ),
    /XVI_SOURCE_ADMISSION_REFUSED/,
  );
});

test('credential-bearing origins fail closed', () => {
  assert.throws(
    () =>
      admitXviSource(
        manifest({
          canonicalOrigin:
            'https://user:password@example.com/',
        }),
      ),
    /XVI_SOURCE_ADMISSION_REFUSED/,
  );
});

test('duplicate brain targets fail closed', () => {
  assert.throws(
    () =>
      admitXviSource(
        manifest({
          brainTargets: [
            'MACRO',
            'MACRO',
          ],
        }),
      ),
    /XVI_SOURCE_ADMISSION_REFUSED/,
  );
});

test('undeclared fields fail closed', () => {
  assert.throws(
    () =>
      admitXviSource({
        ...manifest(),
        bypassAuthorization: true,
      } as never),
    /XVI_SOURCE_ADMISSION_REFUSED/,
  );
});

test('hidden symbols fail closed', () => {
  const candidate =
    manifest() as
      XviSourceManifest &
      Record<symbol, unknown>;

  candidate[
    Symbol('authority')
  ] = true;

  assert.throws(
    () =>
      admitXviSource(candidate),
    /XVI_SOURCE_ADMISSION_REFUSED/,
  );
});

test('inherited state fails closed', () => {
  const candidate =
    Object.create({
      networkAuthority: true,
    });

  Object.assign(
    candidate,
    manifest(),
  );

  assert.throws(
    () =>
      admitXviSource(candidate),
    /XVI_SOURCE_ADMISSION_REFUSED/,
  );
});

test('accessors fail closed without invocation', () => {
  const candidate =
    manifest();

  let invoked = 0;

  Object.defineProperty(
    candidate,
    'canonicalOrigin',
    {
      enumerable: true,

      get() {
        invoked += 1;

        return 'https://example.com/';
      },
    },
  );

  assert.throws(
    () =>
      admitXviSource(candidate),
    /XVI_SOURCE_ADMISSION_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('admitted source is detached from caller mutation', () => {
  const source =
    manifest();

  const result =
    admitXviSource(source);

  source.sourceName =
    'MUTATED';

  assert.equal(
    result.manifest.sourceName,
    'World Bank Public Data',
  );

  assert.equal(
    Object.isFrozen(
      result.manifest,
    ),
    true,
  );

  assert.equal(
    Object.isFrozen(
      result.manifest.brainTargets,
    ),
    true,
  );
});
