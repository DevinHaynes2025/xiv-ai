/**
 * 62L-EX15 — Failure Atlas (§9).
 * Categories searchable; TIMING_TOO_EARLY → research candidate path.
 */

import {
  FAILURE_CATEGORIES,
  ex15Deny,
  type Ex15Denial,
  type FailureCategory,
  type FailureRecord,
} from './types.ts';
import { assertTenantUniverseAccess, type AtlasStore } from './atlas.ts';

export type FailureAtlasStore = {
  failures: Map<string, FailureRecord>;
};

export function createFailureAtlasStore(): FailureAtlasStore {
  return { failures: new Map() };
}

export function recordFailure(
  store: FailureAtlasStore,
  atlas: AtlasStore,
  input: {
    failureId: string;
    eventId: string;
    category: FailureCategory;
    summary: string;
    actorTenantId: string;
    actorUniverseId: string;
  },
): FailureRecord | Ex15Denial {
  if (!(FAILURE_CATEGORIES as readonly string[]).includes(input.category)) {
    return ex15Deny(`Unknown failure category ${input.category}.`);
  }
  const event = atlas.events.get(input.eventId);
  if (!event) return ex15Deny(`Event ${input.eventId} not found for failure.`);

  const access = assertTenantUniverseAccess({
    resourceTenantId: event.tenantId,
    resourceUniverseId: event.universeId,
    actorTenantId: input.actorTenantId,
    actorUniverseId: input.actorUniverseId,
  });
  if ('denied' in access) return access;

  const record: FailureRecord = {
    failureId: input.failureId,
    eventId: input.eventId,
    category: input.category,
    summary: input.summary,
    tenantId: event.tenantId,
    universeId: event.universeId,
    searchable: true,
  };
  store.failures.set(record.failureId, record);
  return record;
}

export function searchFailures(
  store: FailureAtlasStore,
  input: {
    actorTenantId: string;
    actorUniverseId: string;
    category?: FailureCategory;
    query?: string;
  },
): FailureRecord[] | Ex15Denial {
  const results: FailureRecord[] = [];
  for (const f of store.failures.values()) {
    if (f.tenantId !== input.actorTenantId) continue;
    if (f.universeId !== input.actorUniverseId) continue;
    if (input.category && f.category !== input.category) continue;
    if (
      input.query &&
      !f.summary.toLowerCase().includes(input.query.toLowerCase()) &&
      !f.eventId.toLowerCase().includes(input.query.toLowerCase())
    ) {
      continue;
    }
    results.push(f);
  }
  return results;
}

export function listFailureCategories(): readonly FailureCategory[] {
  return FAILURE_CATEGORIES;
}
