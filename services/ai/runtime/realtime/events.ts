import { nowIso } from '../actions';
import type { BusinessEvent, LicenseUseStatus } from './types';

const DEFAULT_LICENSE: LicenseUseStatus = {
  licenseStatus: 'not_configured',
  attributionRequired: 'unknown',
  redistributionAllowed: 'unknown',
  retentionLimit: null,
};

export function createBusinessEvent(
  input: Omit<BusinessEvent, 'eventId' | 'retrievedAt' | 'freshness' | 'license'> & {
    eventId?: string;
    retrievedAt?: string;
    freshness?: BusinessEvent['freshness'];
    license?: LicenseUseStatus;
  },
): BusinessEvent | { allowed: false; reason: string } {
  if (!input.source || !input.sourceId) {
    return { allowed: false, reason: 'Real-time business event requires source and sourceId provenance: DENY' };
  }
  return {
    ...input,
    eventId: input.eventId ?? `evt_${input.sourceId}`,
    retrievedAt: input.retrievedAt ?? nowIso(),
    freshness: input.freshness ?? 'unknown',
    license: input.license ?? DEFAULT_LICENSE,
  };
}

export function labelStaleEvent(event: BusinessEvent, now = Date.now(), staleAfterMs = 24 * 60 * 60 * 1000): BusinessEvent {
  const retrieved = Date.parse(event.retrievedAt);
  const aging = Number.isFinite(retrieved) && now - retrieved > staleAfterMs;
  return {
    ...event,
    freshness: aging ? 'stale' : event.freshness,
  };
}

export function eventRequiresProvenance(event: Pick<BusinessEvent, 'source' | 'sourceId'>) {
  return Boolean(event.source && event.sourceId);
}

export function webDataMayBeRepublishedCommercially() {
  return false;
}
