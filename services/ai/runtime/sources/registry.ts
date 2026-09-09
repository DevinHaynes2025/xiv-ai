import { nowIso } from '../actions';
import type {
  BusinessDataProviderAuditEvent,
  BusinessDataProviderDescriptor,
  BusinessDataProviderStatus,
} from './types';

const providers = new Map<string, BusinessDataProviderDescriptor>();
const audit: BusinessDataProviderAuditEvent[] = [];

function record(providerId: string, action: BusinessDataProviderAuditEvent['action'], reason: string) {
  audit.push({
    eventId: `src_${audit.length + 1}`,
    providerId,
    action,
    reason,
    createdAt: nowIso(),
    secretsLogged: false,
  });
}

export function registerBusinessDataProvider(descriptor: BusinessDataProviderDescriptor) {
  if (descriptor.secretInClient || descriptor.usesServiceRole || descriptor.bulkScraping) {
    record(descriptor.providerId, 'deny_ingest', 'Provider violates client-secret, service_role, or scraping rules.');
    return { allowed: false as const, reason: 'Illegal provider configuration denied.' };
  }
  providers.set(descriptor.providerId, descriptor);
  record(descriptor.providerId, 'register', `Registered with status ${descriptor.status}.`);
  return { allowed: true as const, providerId: descriptor.providerId };
}

export function getBusinessDataProvider(providerId: string) {
  return providers.get(providerId) ?? null;
}

export function listBusinessDataProviders() {
  return [...providers.values()];
}

export function providerRegistryDefault() {
  return { allowIngest: false as const, reason: 'Source registry defaults deny.' };
}

export function canIngestFromProvider(providerId: string) {
  const provider = providers.get(providerId);
  if (!provider) {
    record(providerId, 'deny_ingest', 'Unknown source.');
    return { allowed: false as const, reason: 'Unknown source. Default deny.' };
  }
  if (provider.status === 'not_configured' || !provider.authorization.configured) {
    record(providerId, 'deny_ingest', 'Unconfigured provider cannot ingest.');
    return { allowed: false as const, reason: 'Unconfigured provider cannot ingest.' };
  }
  if (provider.status === 'disabled' || provider.status === 'unavailable') {
    return { allowed: false as const, reason: `Provider is ${provider.status}.` };
  }
  if (!provider.authorization.authorized) {
    record(providerId, 'deny_ingest', 'Unauthorized provider cannot ingest.');
    return { allowed: false as const, reason: 'Unauthorized provider cannot ingest.' };
  }
  if (!provider.authorization.usageRightsKnown || !provider.license.known) {
    return { allowed: false as const, reason: 'Unknown license rejected.' };
  }
  if (!provider.authorization.provenanceEnabled) {
    return { allowed: false as const, reason: 'Missing provenance rejected.' };
  }
  if (!provider.authorization.classificationKnown || provider.classification === 'unknown') {
    return { allowed: false as const, reason: 'Unknown source classification denied.' };
  }
  record(providerId, 'allow_ingest', 'Provider passed ingest policy.');
  return { allowed: true as const, provider };
}

export function sourceAuditEvents() {
  return [...audit];
}

export function resetSourceRegistryForTests() {
  providers.clear();
  audit.length = 0;
}

export function providerStatusOf(providerId: string): BusinessDataProviderStatus {
  return providers.get(providerId)?.status ?? 'not_configured';
}
