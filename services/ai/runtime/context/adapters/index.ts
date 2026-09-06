export {
  adapterIsReadOnly,
  provenanceIsComplete,
  type AdapterCapabilities,
  type AdapterDataset,
  type BusinessDataAdapter,
  type DataDomainCapability,
  type DataScope,
  type DataProvenance,
  type LiveSourceStatus,
  type SourceMetadata,
} from './types';
export { createHttpHealthAdapter, resolveConfiguredHealthUrl } from './http-health';
export { createLiveContextProvider } from './live-provider';
export { readAuthorizedCompanyData } from './authorized-read';
export { authorizeDataScope, scopeFromRelationship } from './scope';
export { classifyFreshness, freshnessLabel } from './freshness';
export { createCompositeBusinessAdapter } from './composite';
export { createSessionRecordAdapter, emptyDomainCapabilities } from './session-records';
export type { AuthorizedSessionRecord, SessionRecordReader } from './session-records';
