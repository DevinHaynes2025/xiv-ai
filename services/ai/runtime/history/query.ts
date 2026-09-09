/**
 * 62L-EX15 — Offline atlas query / index (§21–23).
 * Works without network; live-data offline → WAITING_DATA.
 */

import { resolveOfflineLiveDependency } from './soft-wire.ts';
import {
  ex15Deny,
  type Ex15Denial,
  type HistoricalComputingEvent,
  type HistoricalDomain,
  type SoftWirePresence,
  type TruthState,
} from './types.ts';
import { assertTenantUniverseAccess, type AtlasStore } from './atlas.ts';
import type { FailureAtlasStore } from './failure-atlas.ts';
import { searchFailures } from './failure-atlas.ts';
import type { TimelineStore } from './timeline.ts';
import { listTimelineEdges } from './timeline.ts';
import type { AtlasScaleTelemetry } from './types.ts';
import type { RetestStore } from './retest.ts';

export type OfflineQueryInput = {
  actorTenantId: string;
  actorUniverseId: string;
  offline: boolean;
  requiresNetwork?: boolean;
  liveDependencyName?: string;
  domain?: HistoricalDomain;
  truthState?: TruthState;
  text?: string;
  eventId?: string;
};

export type OfflineQueryResult = {
  mode: 'OFFLINE_LOCAL';
  networkUsed: false;
  events: HistoricalComputingEvent[];
  liveDependency?: SoftWirePresence;
};

export function queryOfflineAtlas(
  store: AtlasStore,
  input: OfflineQueryInput,
): OfflineQueryResult | Ex15Denial {
  let liveDependency: SoftWirePresence | undefined;
  if (input.requiresNetwork) {
    liveDependency = resolveOfflineLiveDependency({
      requiresNetwork: true,
      offline: input.offline,
      dependencyName: input.liveDependencyName ?? 'historical-live-feed',
    });
    if (liveDependency.disposition === 'WAITING_DATA') {
      return {
        mode: 'OFFLINE_LOCAL',
        networkUsed: false,
        events: [],
        liveDependency,
      };
    }
  }

  const events: HistoricalComputingEvent[] = [];
  for (const event of store.events.values()) {
    const access = assertTenantUniverseAccess({
      resourceTenantId: event.tenantId,
      resourceUniverseId: event.universeId,
      actorTenantId: input.actorTenantId,
      actorUniverseId: input.actorUniverseId,
    });
    if ('denied' in access) continue;

    if (input.eventId && event.eventId !== input.eventId) continue;
    if (input.domain && event.domain !== input.domain) continue;
    if (input.truthState && event.truthState !== input.truthState) continue;
    if (input.text) {
      const hay = `${event.title} ${event.summary}`.toLowerCase();
      if (!hay.includes(input.text.toLowerCase())) continue;
    }
    events.push(event);
  }

  return {
    mode: 'OFFLINE_LOCAL',
    networkUsed: false,
    events,
    liveDependency,
  };
}

export function measureAtlasScale(input: {
  atlas: AtlasStore;
  failures: FailureAtlasStore;
  timeline: TimelineStore;
  retests: RetestStore;
}): AtlasScaleTelemetry {
  return {
    eventCount: input.atlas.events.size,
    failureCount: input.failures.failures.size,
    edgeCount: input.timeline.edges.size,
    retestCandidateCount: input.retests.candidates.size,
    measured: true,
    fabricated: false,
  };
}

export function searchAtlasIndex(
  atlas: AtlasStore,
  failures: FailureAtlasStore,
  timeline: TimelineStore,
  input: {
    actorTenantId: string;
    actorUniverseId: string;
    text: string;
  },
): {
  events: HistoricalComputingEvent[];
  failures: ReturnType<typeof searchFailures>;
  edges: ReturnType<typeof listTimelineEdges>;
} | Ex15Denial {
  if (!input.text.trim()) {
    return ex15Deny('Search text required.');
  }
  const q = queryOfflineAtlas(atlas, {
    actorTenantId: input.actorTenantId,
    actorUniverseId: input.actorUniverseId,
    offline: true,
    text: input.text,
  });
  if ('denied' in q) return q;

  const failResults = searchFailures(failures, {
    actorTenantId: input.actorTenantId,
    actorUniverseId: input.actorUniverseId,
    query: input.text,
  });
  if ('denied' in failResults) return failResults;

  return {
    events: q.events,
    failures: failResults,
    edges: listTimelineEdges(timeline),
  };
}
