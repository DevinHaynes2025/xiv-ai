export type XviSourceAuthority =
  | 'OFFICIAL_GOVERNMENT'
  | 'INTERGOVERNMENTAL'
  | 'PUBLIC_COMPANY'
  | 'OPEN_SOURCE'
  | 'LICENSED_PROVIDER'
  | 'EXPLICITLY_AUTHORIZED';

export type XviSourceSensitivity =
  | 'PUBLIC'
  | 'PUBLIC_AGGREGATE'
  | 'RESTRICTED'
  | 'PROHIBITED';

export type XviBrainTarget =
  | 'MACRO'
  | 'FINANCIAL'
  | 'COMPANY'
  | 'HEALTH'
  | 'MENTAL_HEALTH'
  | 'GOVERNMENT'
  | 'CODE'
  | 'SCIENCE'
  | 'SUPPLY_CHAIN'
  | 'GEOSPATIAL'
  | 'TECHNOLOGY'
  | 'GOVERNANCE';

export interface XviSourceManifest {
  version: 'xvi-source-manifest-v1';

  sourceId: string;
  sourceName: string;

  authority: XviSourceAuthority;
  sensitivity: XviSourceSensitivity;

  brainTargets: readonly XviBrainTarget[];

  canonicalOrigin: string;

  retrievalAllowed: boolean;
  trainingAllowed: boolean;
  commercialUseAllowed: boolean;
  attributionRequired: boolean;

  containsPersonalData: boolean;

  providerAuthenticationRequired: boolean;
  authorizationVerified: boolean;

  executesFetch: false;
  networkAuthority: false;
  productionAuthority: false;
}

export const XVI_SOURCE_GUARDRAILS =
  Object.freeze({
    executesFetch: false,
    networkAuthority: false,
    productionAuthority: false,

    bypassAuthentication: false,
    bypassRateLimits: false,
    bypassRobotsRules: false,

    privateBankDataAllowed: false,
    patientRecordExtractionAllowed: false,
    credentialExtractionAllowed: false,

    unknownLicenseFailsClosed: true,
    unknownAuthorizationFailsClosed: true,
  });
