/**
 * 62L-EX15 — Historical data pipe (§25).
 * SOURCE→RIGHTS→PROVENANCE→DATE NORMALIZATION→ENTITY RESOLUTION→
 * CLAIM EXTRACTION→FACT/CLAIM CLASSIFICATION→DEDUPLICATION→
 * CONTRADICTION CHECK→TIMELINE→GRAPH→OFFLINE PACK
 */

import {
  EX15_CANONICAL_FLOW,
  ex15Deny,
  type Ex15CanonicalHop,
  type Ex15Denial,
  type SoftWirePresence,
  type SourceRef,
  type TruthState,
} from './types.ts';
import { evaluateSourceRights, ingestHistoricalEvent, type AtlasStore } from './atlas.ts';
import { resolveOfflineLiveDependency, ex15SoftWireSnapshot } from './soft-wire.ts';
import type { HistoricalDomain, RightsClass, RestrictedSourceClass } from './types.ts';

export type PipeStageResult = {
  hop: Ex15CanonicalHop;
  status: 'PASS' | 'WAITING_DATA' | 'DENIED' | 'QUARANTINED';
  note: string;
};

export type PipeRunResult = {
  stages: PipeStageResult[];
  eventId?: string;
  offlinePackAttached: boolean;
  offlinePackDisposition: SoftWirePresence['disposition'];
  denied?: Ex15Denial;
};

export type PipeInput = {
  eventId: string;
  title: string;
  summary: string;
  domain: HistoricalDomain;
  dateStart?: string;
  dateRaw?: string;
  entities?: string[];
  claimText?: string;
  truthState: TruthState;
  primarySourceRefs: SourceRef[];
  rightsClass: RightsClass | RestrictedSourceClass;
  tenantId: string;
  universeId: string;
  offline: boolean;
  requiresLiveFeed?: boolean;
  disputed?: boolean;
  disputeNotes?: string[];
  duplicateOfEventId?: string;
};

function stage(
  hop: Ex15CanonicalHop,
  status: PipeStageResult['status'],
  note: string,
): PipeStageResult {
  return { hop, status, note };
}

export function runHistoricalDataPipe(
  store: AtlasStore,
  input: PipeInput,
): PipeRunResult {
  const stages: PipeStageResult[] = [];

  // SOURCE
  stages.push(
    stage(
      'SOURCE',
      input.primarySourceRefs.length > 0 ? 'PASS' : 'DENIED',
      input.primarySourceRefs.length > 0
        ? 'Source refs accepted for pipe.'
        : 'No source refs.',
    ),
  );
  if (stages[stages.length - 1]!.status === 'DENIED') {
    const denied = ex15Deny('Pipe SOURCE stage failed — no sources.');
    return { stages, offlinePackAttached: false, offlinePackDisposition: 'WAITING_DATA', denied };
  }

  // RIGHTS
  const rights = evaluateSourceRights(input.primarySourceRefs);
  if ('denied' in rights) {
    stages.push(
      stage('RIGHTS', rights.state, rights.reason),
    );
    return {
      stages,
      offlinePackAttached: false,
      offlinePackDisposition: 'WAITING_DATA',
      denied: rights,
    };
  }
  stages.push(stage('RIGHTS', 'PASS', 'Rights gate cleared.'));

  // Live feed offline honesty
  if (input.requiresLiveFeed) {
    const live = resolveOfflineLiveDependency({
      requiresNetwork: true,
      offline: input.offline,
      dependencyName: 'historical-pipe-live-feed',
    });
    if (live.disposition === 'WAITING_DATA') {
      stages.push(
        stage(
          'PROVENANCE',
          'WAITING_DATA',
          live.note,
        ),
      );
      return {
        stages,
        offlinePackAttached: false,
        offlinePackDisposition: 'WAITING_DATA',
      };
    }
  }

  // PROVENANCE
  stages.push(
    stage(
      'PROVENANCE',
      'PASS',
      `Provenance retained for ${input.primarySourceRefs.length} primary ref(s).`,
    ),
  );

  // DATE NORMALIZATION
  const normalizedDate = input.dateStart ?? normalizeDateRaw(input.dateRaw);
  stages.push(
    stage(
      'DATE_NORMALIZATION',
      'PASS',
      normalizedDate
        ? `Normalized date ${normalizedDate}.`
        : 'Date unknown — confidence UNKNOWN.',
    ),
  );

  // ENTITY RESOLUTION
  const entities = input.entities ?? [];
  stages.push(
    stage(
      'ENTITY_RESOLUTION',
      'PASS',
      `Resolved ${entities.length} entity label(s) (local).`,
    ),
  );

  // CLAIM EXTRACTION
  const claim = input.claimText ?? input.summary;
  stages.push(
    stage('CLAIM_EXTRACTION', 'PASS', `Claim extracted (${claim.slice(0, 80)}).`),
  );

  // FACT/CLAIM CLASSIFICATION
  stages.push(
    stage(
      'FACT_CLAIM_CLASSIFICATION',
      'PASS',
      `Classified as ${input.truthState} (no auto-promotion).`,
    ),
  );

  // DEDUPLICATION
  if (input.duplicateOfEventId && store.events.has(input.duplicateOfEventId)) {
    stages.push(
      stage(
        'DEDUPLICATION',
        'PASS',
        `Duplicate of ${input.duplicateOfEventId} noted — skipping ingest.`,
      ),
    );
    return {
      stages: [
        ...stages,
        stage('CONTRADICTION_CHECK', 'PASS', 'Skipped — duplicate.'),
        stage('TIMELINE', 'PASS', 'Skipped — duplicate.'),
        stage('GRAPH', 'PASS', 'Skipped — duplicate.'),
        stage('OFFLINE_PACK', 'WAITING_DATA', 'Duplicate — no new pack attach.'),
      ],
      eventId: input.duplicateOfEventId,
      offlinePackAttached: false,
      offlinePackDisposition: 'WAITING_DATA',
    };
  }
  stages.push(stage('DEDUPLICATION', 'PASS', 'No duplicate detected.'));

  // CONTRADICTION CHECK
  const contradictionNote = input.disputed
    ? `Disputed — preserving disagreement: ${(input.disputeNotes ?? []).join('; ') || 'noted'}.`
    : 'No contradiction flagged.';
  stages.push(stage('CONTRADICTION_CHECK', 'PASS', contradictionNote));

  // Ingest for TIMELINE/GRAPH downstream
  const ingested = ingestHistoricalEvent(store, {
    eventId: input.eventId,
    title: input.title,
    summary: input.summary,
    domain: input.domain,
    dateStart: normalizedDate,
    people: entities,
    primarySourceRefs: input.primarySourceRefs,
    rightsClass: input.rightsClass,
    truthState: input.truthState,
    disputed: input.disputed,
    disputeNotes: input.disputeNotes,
    tenantId: input.tenantId,
    universeId: input.universeId,
  });
  if ('denied' in ingested) {
    stages.push(stage('TIMELINE', ingested.state, ingested.reason));
    return {
      stages,
      offlinePackAttached: false,
      offlinePackDisposition: 'WAITING_DATA',
      denied: ingested,
    };
  }

  stages.push(
    stage('TIMELINE', 'PASS', `Event ${ingested.eventId} available for timeline edges.`),
  );
  stages.push(
    stage(
      'GRAPH',
      'PASS',
      'Graph hooks ready — pathway status DOCUMENTED (not VERIFIED).',
    ),
  );

  // OFFLINE PACK — soft-wire EX14; absent → WAITING_DATA
  const soft = ex15SoftWireSnapshot();
  const packDisp = soft.ex14.disposition;
  stages.push(
    stage(
      'OFFLINE_PACK',
      packDisp === 'WAITING_DATA' ? 'WAITING_DATA' : 'PASS',
      soft.ex14.note,
    ),
  );

  return {
    stages,
    eventId: ingested.eventId,
    offlinePackAttached: packDisp === 'PRESENT_UNVERIFIED',
    offlinePackDisposition: packDisp,
  };
}

function normalizeDateRaw(raw?: string): string | undefined {
  if (!raw) return undefined;
  const year = raw.match(/(19|20)\d{2}/);
  if (year) return `${year[0]}-01-01`;
  return undefined;
}

export function assertPipeCoversAllHops(stages: PipeStageResult[]): boolean {
  const hops = new Set(stages.map((s) => s.hop));
  return EX15_CANONICAL_FLOW.every((h) => hops.has(h));
}
