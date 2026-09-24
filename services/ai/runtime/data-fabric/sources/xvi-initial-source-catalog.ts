import type {
  XviSourceManifest,
} from '../xvi-source-manifest';

export const XVI_INITIAL_SOURCE_CATALOG:
  readonly Readonly<XviSourceManifest>[] =
  Object.freeze([

    Object.freeze({
      version:
        'xvi-source-manifest-v1',

      sourceId:
        'world-bank-public',

      sourceName:
        'World Bank Public Data',

      authority:
        'INTERGOVERNMENTAL',

      sensitivity:
        'PUBLIC_AGGREGATE',

      brainTargets:
        Object.freeze([
          'MACRO',
          'FINANCIAL',
          'GOVERNMENT',
          'SUPPLY_CHAIN',
          'GOVERNANCE',
        ]),

      canonicalOrigin:
        'https://api.worldbank.org',

      retrievalAllowed: true,
      trainingAllowed: false,
      commercialUseAllowed: false,
      attributionRequired: true,

      containsPersonalData: false,

      providerAuthenticationRequired:
        false,

      authorizationVerified:
        true,

      executesFetch: false,
      networkAuthority: false,
      productionAuthority: false,
    }),

    Object.freeze({
      version:
        'xvi-source-manifest-v1',

      sourceId:
        'github-public',

      sourceName:
        'GitHub Public Repositories',

      authority:
        'OPEN_SOURCE',

      sensitivity:
        'PUBLIC',

      brainTargets:
        Object.freeze([
          'CODE',
          'TECHNOLOGY',
          'SCIENCE',
          'GOVERNANCE',
        ]),

      canonicalOrigin:
        'https://api.github.com',

      retrievalAllowed: true,
      trainingAllowed: false,
      commercialUseAllowed: false,
      attributionRequired: true,

      containsPersonalData: false,

      providerAuthenticationRequired:
        false,

      authorizationVerified:
        true,

      executesFetch: false,
      networkAuthority: false,
      productionAuthority: false,
    }),

    Object.freeze({
      version:
        'xvi-source-manifest-v1',

      sourceId:
        'who-public-health',

      sourceName:
        'WHO Public Health Data',

      authority:
        'INTERGOVERNMENTAL',

      sensitivity:
        'PUBLIC_AGGREGATE',

      brainTargets:
        Object.freeze([
          'HEALTH',
          'MENTAL_HEALTH',
          'SCIENCE',
          'GOVERNMENT',
          'GOVERNANCE',
        ]),

      canonicalOrigin:
        'https://www.who.int',

      retrievalAllowed: true,
      trainingAllowed: false,
      commercialUseAllowed: false,
      attributionRequired: true,

      containsPersonalData: false,

      providerAuthenticationRequired:
        false,

      authorizationVerified:
        true,

      executesFetch: false,
      networkAuthority: false,
      productionAuthority: false,
    }),
  ]);
