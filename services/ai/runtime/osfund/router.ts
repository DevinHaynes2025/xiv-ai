/**
 * Event router + database router by purpose.
 * Events stay tenant/Universe scoped. Purpose selects store kind.
 */

import { PROVIDER_PURPOSE_MAP, type DatabaseProviderKind, type DatabasePurpose } from './types';

export type RoutedEvent = {
  eventId: string;
  tenantId: string;
  universeId: string;
  classification: 'PUBLIC' | 'TENANT_PRIVATE';
};

export function routeOsEvent(input: {
  event: RoutedEvent;
  consumerTenantId: string;
  consumerUniverseId: string;
}) {
  if (input.event.tenantId !== input.consumerTenantId) {
    return { allowed: false as const, reason: 'event_router_cannot_cross_tenant' };
  }
  if (input.event.universeId !== input.consumerUniverseId) {
    return { allowed: false as const, reason: 'event_router_honors_universe' };
  }
  return { allowed: true as const, routed: true as const };
}

export function routeDatabaseByPurpose(input: {
  purpose: DatabasePurpose;
  requestedProvider?: DatabaseProviderKind;
  guardianApproved: boolean;
}) {
  if (input.guardianApproved !== true) {
    return { allowed: false as const, reason: 'database_router_requires_guardian' };
  }
  if (input.requestedProvider) {
    const expected = PROVIDER_PURPOSE_MAP[input.requestedProvider];
    if (expected !== input.purpose) {
      return { allowed: false as const, reason: 'database_provider_purpose_mismatch' };
    }
    return {
      allowed: true as const,
      provider: input.requestedProvider,
      purpose: input.purpose,
      credentialsReturned: false as const,
    };
  }
  const provider = (Object.entries(PROVIDER_PURPOSE_MAP).find(([, purpose]) => purpose === input.purpose)?.[0] ??
    'POSTGRES') as DatabaseProviderKind;
  return {
    allowed: true as const,
    provider,
    purpose: input.purpose,
    credentialsReturned: false as const,
  };
}

export function eventRouterGrantsAuthority(): false {
  return false;
}

export function databaseRouterReturnsCredentials(): false {
  return false;
}
