export type { BusinessDataAdapter, BusinessDataAdapterError, BusinessDataAdapterRequest, BusinessDataAdapterResponse } from './adapter';
export {
  adapterForProvider,
  createBlsAdapter,
  createCensusAdapter,
  createFredAdapter,
  createSecEdgarAdapter,
  createUnconfiguredAdapter,
  createWorldBankAdapter,
} from './adapters';
export { evaluateProviderAccess, PROVIDER_ACCESS_PIPELINE } from './security';
export {
  recordWorldBankValidatedRetrieval,
  resetWorldBankAdapterStatusForTests,
  worldBankAdapterCapabilityStatus,
  worldBankGlobalFabricIsProductionLive,
} from './world-bank-status';
export {
  recordSecValidatedRetrieval,
  resetSecAdapterStatusForTests,
  secAdapterCapabilityStatus,
  secGlobalFabricIsProductionLive,
} from './sec-status';
export {
  BLS_DESCRIPTOR,
  CENSUS_DESCRIPTOR,
  DECLARED_BUSINESS_DATA_PROVIDERS,
  FRED_DESCRIPTOR,
  SEC_EDGAR_DESCRIPTOR,
  WORLD_BANK_DESCRIPTOR,
} from './catalog';
export {
  evaluateGlobalBrainIngestion,
  globalBrainIngestionPolicy,
  sourcesUseServiceRole,
} from './policy';
export {
  canIngestFromProvider,
  getBusinessDataProvider,
  listBusinessDataProviders,
  providerRegistryDefault,
  providerStatusOf,
  registerBusinessDataProvider,
  resetSourceRegistryForTests,
  sourceAuditEvents,
} from './registry';
export type {
  BusinessDataProvider,
  BusinessDataProviderAuthorization,
  BusinessDataProviderCapability,
  BusinessDataProviderDescriptor,
  BusinessDataProviderHealth,
  BusinessDataProviderLicense,
  BusinessDataProviderRegion,
  BusinessDataProviderStatus,
  GlobalBrainAllowedCategory,
} from './types';
export { GLOBAL_BRAIN_ALLOWED_CATEGORIES, GLOBAL_BRAIN_DENIED_CATEGORIES } from './types';

import { DECLARED_BUSINESS_DATA_PROVIDERS } from './catalog';
import { registerBusinessDataProvider } from './registry';

export function seedDeclaredBusinessDataProviders() {
  for (const descriptor of DECLARED_BUSINESS_DATA_PROVIDERS) {
    registerBusinessDataProvider(descriptor);
  }
  return DECLARED_BUSINESS_DATA_PROVIDERS.map((item) => item.providerId);
}