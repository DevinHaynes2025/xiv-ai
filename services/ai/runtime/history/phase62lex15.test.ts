/**
 * 62L-EX15 — Historical Quantum & Computing Atlas honesty + contract tests.
 * Script: npm run test:62lex15
 * Parent: 62L-EX / GitHub #170.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  assertEx15LocksIntact,
  EX15_DB_CANDIDATES_STATUS,
  EX15_LOCKS,
  FAILURE_CATEGORIES,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  HISTORICAL_DOMAINS,
  NEXT_PHASE_TITLE,
  QUANTUM_ADVANTAGE_VERIFIED,
  TIMELINE_EDGE_TYPES,
  TRUTH_STATES,
  ex15L4AutonomyEnabled,
  guardianRlsUnchangedByEx15,
  type SourceRef,
} from './types.ts';
import {
  ex15SoftWireSnapshot,
  resolveOfflineLiveDependency,
  summarizeSoftWires,
} from './soft-wire.ts';
import {
  annotateTemporalTruth,
  assertTenantUniverseAccess,
  buildAlgorithmEvolutionGraph,
  compareHistoricalQuantumClassical,
  correctHistoricalEvent,
  createAtlasStore,
  ingestHistoricalEvent,
  listDomains,
  promoteTooEarlyCandidate,
} from './atlas.ts';
import {
  addTimelineEdge,
  createTimelineStore,
} from './timeline.ts';
import {
  createFailureAtlasStore,
  recordFailure,
  searchFailures,
} from './failure-atlas.ts';
import {
  assertRetestRunnable,
  createRetestCandidate,
  createRetestStore,
  linkModernRetestFeedback,
} from './retest.ts';
import { measureAtlasScale, queryOfflineAtlas } from './query.ts';
import { assertPipeCoversAllHops, runHistoricalDataPipe } from './pipe.ts';

const TENANT = 'tenant-a';
const UNIVERSE = 'universe-a';

function publicSource(refId = 'src-1'): SourceRef {
  return {
    refId,
    title: 'Public computing history archive',
    publisher: 'Public Domain Archive',
    priority: 'PRIMARY_PUBLIC_RECORD',
    quality: 'HIGH',
    rightsClass: 'PUBLIC_DOMAIN',
    excerptAllowed: true,
  };
}

function baseEvent(
  overrides: Partial<Parameters<typeof ingestHistoricalEvent>[1]> = {},
) {
  return {
    eventId: 'evt-eniac',
    title: 'ENIAC operational',
    summary: 'Early electronic general-purpose computer demonstrated.',
    domain: 'COMPUTING_HISTORY' as const,
    dateStart: '1945-01-01',
    dateConfidence: 'YEAR' as const,
    people: ['Mauchly', 'Eckert'],
    orgs: ['Moore School'],
    projects: ['ENIAC'],
    hardwareFamilies: ['vacuum-tube'],
    softwareFamilies: [],
    algorithmFamilies: [],
    primarySourceRefs: [publicSource()],
    rightsClass: 'PUBLIC_DOMAIN' as const,
    sourceQuality: 'HIGH' as const,
    confidence: 0.9,
    truthState: 'FACT_SUPPORTED' as const,
    tenantId: TENANT,
    universeId: UNIVERSE,
    ...overrides,
  };
}

test('SoT #170 EX15; next EX16 docs-only; locks intact', () => {
  assert.equal(GITHUB_SOT_ISSUE, 170);
  assert.equal(GITHUB_SOT_LABEL, '62L-EX15');
  assert.match(NEXT_PHASE_TITLE, /EX16/);
  assert.equal(EX15_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(assertEx15LocksIntact(), true);
  assert.equal(QUANTUM_ADVANTAGE_VERIFIED, false);
  assert.ok(HISTORICAL_DOMAINS.length >= 20);
  assert.ok(TRUTH_STATES.includes('CLAIM_REPORTED'));
  assert.ok(TIMELINE_EDGE_TYPES.includes('FAILED_BECAUSE'));
  assert.ok(FAILURE_CATEGORIES.includes('TIMING_TOO_EARLY'));
  assert.deepEqual([...listDomains()], [...HISTORICAL_DOMAINS]);
});

test('1. supported historical fact retains source', () => {
  const store = createAtlasStore();
  const src = publicSource('src-fact');
  const event = ingestHistoricalEvent(
    store,
    baseEvent({
      eventId: 'evt-fact',
      truthState: 'FACT_SUPPORTED',
      primarySourceRefs: [src],
    }),
  );
  assert.equal('denied' in event && event.denied, false);
  if ('denied' in event) return;
  assert.equal(event.truthState, 'FACT_SUPPORTED');
  assert.equal(event.primarySourceRefs.length, 1);
  assert.equal(event.primarySourceRefs[0]!.refId, 'src-fact');
  assert.equal(event.pathwayStatus, 'DOCUMENTED');
});

test('2. reported claim remains CLAIM_REPORTED', () => {
  const store = createAtlasStore();
  const event = ingestHistoricalEvent(
    store,
    baseEvent({
      eventId: 'evt-claim',
      truthState: 'CLAIM_REPORTED',
      claimedOutcome: 'Vendor claimed 100x speedup',
    }),
  );
  assert.equal('denied' in event && event.denied, false);
  if ('denied' in event) return;
  assert.equal(event.truthState, 'CLAIM_REPORTED');

  const blocked = correctHistoricalEvent(store, {
    eventId: 'evt-claim',
    actorTenantId: TENANT,
    actorUniverseId: UNIVERSE,
    truthState: 'FACT_SUPPORTED',
    evidencePresent: false,
  });
  assert.equal('denied' in blocked && blocked.denied, true);
  assert.match(String((blocked as { reason: string }).reason), /CLAIM_REPORTED/);
});

test('3. disputed event preserves disagreement', () => {
  const store = createAtlasStore();
  const event = ingestHistoricalEvent(
    store,
    baseEvent({
      eventId: 'evt-dispute',
      truthState: 'DISPUTED',
      disputed: true,
      disputeNotes: ['Lab A claims advantage; Lab B disputes methodology'],
    }),
  );
  assert.equal('denied' in event && event.denied, false);
  if ('denied' in event) return;
  assert.equal(event.disputed, true);
  assert.equal(event.truthState, 'DISPUTED');
  assert.ok(event.disputeNotes?.some((n) => /disputes/i.test(n)));
});

test('4. restricted source DENIED/QUARANTINED', () => {
  const store = createAtlasStore();
  const leaked = ingestHistoricalEvent(
    store,
    baseEvent({
      eventId: 'evt-leak',
      rightsClass: 'LEAKED_PRIVATE_DATA',
      primarySourceRefs: [
        {
          ...publicSource('leak'),
          rightsClass: 'LEAKED_PRIVATE_DATA',
        },
      ],
    }),
  );
  assert.equal('denied' in leaked && leaked.denied, true);
  if (!('denied' in leaked)) return;
  assert.equal(leaked.state, 'QUARANTINED');

  const stolen = ingestHistoricalEvent(
    store,
    baseEvent({
      eventId: 'evt-stolen',
      rightsClass: 'PUBLIC_DOMAIN',
      primarySourceRefs: [
        {
          ...publicSource('stolen'),
          rightsClass: 'STOLEN_DATABASE',
        },
      ],
    }),
  );
  assert.equal('denied' in stolen && stolen.denied, true);
});

test('5. historical quantum result cannot become current QPU verification', () => {
  const store = createAtlasStore();
  const denied = ingestHistoricalEvent(
    store,
    baseEvent({
      eventId: 'evt-qhist',
      domain: 'QUANTUM_COMPUTING',
      attemptPromoteHistoricalToQpuVerified: true,
    }),
  );
  assert.equal('denied' in denied && denied.denied, true);

  const ok = ingestHistoricalEvent(
    store,
    baseEvent({
      eventId: 'evt-qhist-ok',
      domain: 'QUANTUM_ALGORITHMS',
      truthState: 'CLAIM_REPORTED',
      claimedOutcome: 'Historical device showed speedup on toy problem',
    }),
  );
  assert.equal('denied' in ok && ok.denied, false);
  if ('denied' in ok) return;
  assert.equal(ok.isCurrentQpuVerification, false);
  assert.equal(ok.quantumAdvantageVerified, false);

  const cmp = compareHistoricalQuantumClassical({
    historicalClaimedAdvantage: true,
  });
  assert.equal(cmp.quantumAdvantageVerified, false);
  assert.equal(cmp.isCurrentQpuVerification, false);
});

test('6. historical benchmark cannot become current benchmark automatically', () => {
  const store = createAtlasStore();
  const denied = ingestHistoricalEvent(
    store,
    baseEvent({
      eventId: 'evt-bench',
      attemptPromoteHistoricalBenchmarkToCurrent: true,
    }),
  );
  assert.equal('denied' in denied && denied.denied, true);

  const ok = ingestHistoricalEvent(
    store,
    baseEvent({ eventId: 'evt-bench-ok', domain: 'OPTIMIZATION' }),
  );
  assert.equal('denied' in ok && ok.denied, false);
  if ('denied' in ok) return;
  assert.equal(ok.isCurrentBenchmark, false);
});

test('7. too-early candidate remains HYPOTHESIS', () => {
  const store = createAtlasStore();
  const event = ingestHistoricalEvent(
    store,
    baseEvent({
      eventId: 'evt-early',
      tooEarly: true,
      truthState: 'HYPOTHESIS',
      modernRelevance: 'May be retestable on modern GPUs',
    }),
  );
  assert.equal('denied' in event && event.denied, false);
  if ('denied' in event) return;

  const candidate = promoteTooEarlyCandidate(event);
  assert.equal('denied' in candidate && candidate.denied, false);
  if ('denied' in candidate) return;
  assert.equal(candidate.status, 'HYPOTHESIS');
  assert.equal(candidate.classicalBaselineRequired, true);
  assert.equal(candidate.tooEarly, true);

  const retests = createRetestStore();
  const blocked = createRetestCandidate(retests, store, {
    candidateId: 'c-auto',
    eventId: event.eventId,
    actorTenantId: TENANT,
    actorUniverseId: UNIVERSE,
    attemptAutoValidate: true,
  });
  assert.equal('denied' in blocked && blocked.denied, true);
});

test('8. retest requires modern baseline', () => {
  const store = createAtlasStore();
  const event = ingestHistoricalEvent(
    store,
    baseEvent({ eventId: 'evt-retest', truthState: 'HYPOTHESIS' }),
  );
  assert.equal('denied' in event && event.denied, false);
  if ('denied' in event) return;

  const retests = createRetestStore();
  const skip = createRetestCandidate(retests, store, {
    candidateId: 'c-skip',
    eventId: event.eventId,
    actorTenantId: TENANT,
    actorUniverseId: UNIVERSE,
    attemptSkipClassicalBaseline: true,
  });
  assert.equal('denied' in skip && skip.denied, true);

  const candidate = createRetestCandidate(retests, store, {
    candidateId: 'c-ok',
    eventId: event.eventId,
    actorTenantId: TENANT,
    actorUniverseId: UNIVERSE,
    classicalBaselinePresent: false,
  });
  assert.equal('denied' in candidate && candidate.denied, false);
  if ('denied' in candidate) return;
  assert.equal(candidate.classicalBaselineRequired, true);
  assert.equal(candidate.status, 'HYPOTHESIS');
  const notRunnable = assertRetestRunnable(candidate);
  assert.equal('denied' in notRunnable && notRunnable.denied, true);

  const withBaseline = createRetestCandidate(retests, store, {
    candidateId: 'c-base',
    eventId: event.eventId,
    actorTenantId: TENANT,
    actorUniverseId: UNIVERSE,
    classicalBaselinePresent: true,
  });
  assert.equal('denied' in withBaseline && withBaseline.denied, false);
  if ('denied' in withBaseline) return;
  assert.equal(assertRetestRunnable(withBaseline).ok, true);
});

test('9. source correction preserves old version', () => {
  const store = createAtlasStore();
  const event = ingestHistoricalEvent(
    store,
    baseEvent({
      eventId: 'evt-ver',
      summary: 'Original summary',
      truthState: 'CLAIM_REPORTED',
    }),
  );
  assert.equal('denied' in event && event.denied, false);
  if ('denied' in event) return;
  assert.equal(event.eventVersion, 1);

  const corrected = correctHistoricalEvent(store, {
    eventId: 'evt-ver',
    actorTenantId: TENANT,
    actorUniverseId: UNIVERSE,
    summary: 'Corrected summary after source review',
    primarySourceRefs: [publicSource('src-corrected')],
  });
  assert.equal('denied' in corrected && corrected.denied, false);
  if ('denied' in corrected) return;
  assert.equal(corrected.eventVersion, 2);
  assert.equal(corrected.previousVersions?.length, 1);
  assert.equal(corrected.previousVersions![0]!.summary, 'Original summary');
  assert.equal(corrected.previousVersions![0]!.eventVersion, 1);
});

test('10. offline atlas query works without network', () => {
  const store = createAtlasStore();
  ingestHistoricalEvent(
    store,
    baseEvent({
      eventId: 'evt-offline',
      title: 'Shor algorithm published',
      domain: 'QUANTUM_ALGORITHMS',
    }),
  );
  const result = queryOfflineAtlas(store, {
    actorTenantId: TENANT,
    actorUniverseId: UNIVERSE,
    offline: true,
    text: 'Shor',
  });
  assert.equal('denied' in result && result.denied, false);
  if ('denied' in result) return;
  assert.equal(result.mode, 'OFFLINE_LOCAL');
  assert.equal(result.networkUsed, false);
  assert.equal(result.events.length, 1);
});

test('11. live-data dependency offline → WAITING_DATA', () => {
  const live = resolveOfflineLiveDependency({
    requiresNetwork: true,
    offline: true,
    dependencyName: 'arxiv-live',
  });
  assert.equal(live.disposition, 'WAITING_DATA');
  assert.equal(live.verified, false);

  const store = createAtlasStore();
  const q = queryOfflineAtlas(store, {
    actorTenantId: TENANT,
    actorUniverseId: UNIVERSE,
    offline: true,
    requiresNetwork: true,
    liveDependencyName: 'arxiv-live',
  });
  assert.equal('denied' in q && q.denied, false);
  if ('denied' in q) return;
  assert.equal(q.liveDependency?.disposition, 'WAITING_DATA');

  const pipe = runHistoricalDataPipe(store, {
    eventId: 'evt-pipe-live',
    title: 'Needs live feed',
    summary: 'Would pull remote corpus',
    domain: 'COMPUTING_HISTORY',
    truthState: 'UNKNOWN',
    primarySourceRefs: [publicSource('pipe')],
    rightsClass: 'PUBLIC_DOMAIN',
    tenantId: TENANT,
    universeId: UNIVERSE,
    offline: true,
    requiresLiveFeed: true,
  });
  assert.ok(pipe.stages.some((s) => s.status === 'WAITING_DATA'));
});

test('12. cross-tenant private historical data DENIED', () => {
  const store = createAtlasStore();
  ingestHistoricalEvent(store, baseEvent({ eventId: 'evt-tenant' }));
  const denied = assertTenantUniverseAccess({
    resourceTenantId: TENANT,
    resourceUniverseId: UNIVERSE,
    actorTenantId: 'tenant-b',
    actorUniverseId: UNIVERSE,
  });
  assert.equal('denied' in denied && denied.denied, true);

  const q = queryOfflineAtlas(store, {
    actorTenantId: 'tenant-b',
    actorUniverseId: UNIVERSE,
    offline: true,
  });
  assert.equal('denied' in q && q.denied, false);
  if ('denied' in q) return;
  assert.equal(q.events.length, 0);
});

test('13. cross-Universe access DENIED', () => {
  const denied = assertTenantUniverseAccess({
    resourceTenantId: TENANT,
    resourceUniverseId: UNIVERSE,
    actorTenantId: TENANT,
    actorUniverseId: 'universe-b',
  });
  assert.equal('denied' in denied && denied.denied, true);
  assert.match(String((denied as { reason: string }).reason), /Universe/i);
});

test('14. failure history searchable', () => {
  const store = createAtlasStore();
  const failures = createFailureAtlasStore();
  ingestHistoricalEvent(
    store,
    baseEvent({
      eventId: 'evt-fail',
      title: 'Optical computer commercial miss',
      failures: ['Market timing'],
    }),
  );
  const rec = recordFailure(failures, store, {
    failureId: 'fail-1',
    eventId: 'evt-fail',
    category: 'TIMING_TOO_EARLY',
    summary: 'Optical compute commercialized too early for market',
    actorTenantId: TENANT,
    actorUniverseId: UNIVERSE,
  });
  assert.equal('denied' in rec && rec.denied, false);

  const found = searchFailures(failures, {
    actorTenantId: TENANT,
    actorUniverseId: UNIVERSE,
    category: 'TIMING_TOO_EARLY',
    query: 'optical',
  });
  assert.equal('denied' in found && found.denied, false);
  if ('denied' in found) return;
  assert.equal(found.length, 1);
  assert.equal(found[0]!.searchable, true);
});

test('15. graph updates cannot change permissions', () => {
  const store = createAtlasStore();
  const timeline = createTimelineStore();
  ingestHistoricalEvent(store, baseEvent({ eventId: 'evt-a' }));
  ingestHistoricalEvent(
    store,
    baseEvent({ eventId: 'evt-b', title: 'Later improvement' }),
  );

  const denied = addTimelineEdge(timeline, store, {
    edgeId: 'edge-bad',
    fromEventId: 'evt-a',
    toEventId: 'evt-b',
    edgeType: 'IMPROVED',
    actorTenantId: TENANT,
    actorUniverseId: UNIVERSE,
    attemptChangePermissions: true,
  });
  assert.equal('denied' in denied && denied.denied, true);

  const edge = addTimelineEdge(timeline, store, {
    edgeId: 'edge-ok',
    fromEventId: 'evt-a',
    toEventId: 'evt-b',
    edgeType: 'PRECEDED',
    actorTenantId: TENANT,
    actorUniverseId: UNIVERSE,
  });
  assert.equal('denied' in edge && edge.denied, false);
  if ('denied' in edge) return;
  assert.equal(edge.permissionsUnchanged, true);

  const evo = buildAlgorithmEvolutionGraph({
    graphId: 'evo-1',
    tenantId: TENANT,
    universeId: UNIVERSE,
    problem: 'factoring',
    historicalAlgorithm: 'Shor',
    hardware: 'NMR demo',
    result: 'toy factoring',
    limitation: 'scale',
    laterImprovement: 'error correction research',
    modernCandidate: 'local classical simulator candidate',
    eventId: 'evt-a',
  });
  assert.equal(
    evo.nodes.every((n) => n.modernCandidateImpliesVerified === false),
    true,
  );

  const temporal = annotateTemporalTruth({
    eventId: 'evt-a',
    knownAtTheTime: ['vacuum tubes dominant'],
    knownToday: ['CMOS scaled'],
  });
  assert.equal(temporal.hindsightDistortionAvoided, true);
});

test('16. L4 remains false', () => {
  assert.equal(ex15L4AutonomyEnabled(), false);
  assert.equal(EX15_LOCKS.L4_AUTONOMY_ENABLED, false);
});

test('17. Guardian/RLS unchanged', () => {
  assert.equal(guardianRlsUnchangedByEx15(), true);
  assert.equal(EX15_LOCKS.WEAKEN_GUARDIAN_RLS, false);
  const soft = ex15SoftWireSnapshot();
  assert.equal(soft.guardian.verified, false);
  if (soft.guardian.present) {
    assert.equal(soft.guardian.disposition, 'PRESENT_UNVERIFIED');
  }
});

test('soft-wire EX1–EX14 honesty; presence ≠ VERIFIED; pipe + scale', () => {
  const soft = ex15SoftWireSnapshot();
  const summary = summarizeSoftWires(soft);
  assert.equal(summary.anyVerified, false);
  for (const key of Object.keys(soft) as (keyof typeof soft)[]) {
    assert.equal(soft[key].verified, false);
    assert.ok(
      soft[key].disposition === 'PRESENT_UNVERIFIED' ||
        soft[key].disposition === 'WAITING_DATA',
    );
  }
  // Agent mesh should be present on xiv-v2 tip; EX14 modules may be WAITING_DATA.
  assert.equal(soft.agentMesh.present, true);
  assert.equal(soft.agentMesh.disposition, 'PRESENT_UNVERIFIED');

  const store = createAtlasStore();
  const pipe = runHistoricalDataPipe(store, {
    eventId: 'evt-pipe',
    title: 'Public semiconductor node history summary',
    summary: 'Public process node announcements only',
    domain: 'SEMICONDUCTORS',
    dateRaw: 'circa 2010',
    entities: ['foundry-public'],
    truthState: 'FACT_SUPPORTED',
    primarySourceRefs: [publicSource('semi')],
    rightsClass: 'PUBLIC_DOMAIN',
    tenantId: TENANT,
    universeId: UNIVERSE,
    offline: true,
  });
  assert.equal(assertPipeCoversAllHops(pipe.stages), true);
  assert.ok(pipe.eventId);

  const copyright = ingestHistoricalEvent(
    store,
    baseEvent({
      eventId: 'evt-copyright',
      attemptCloneCopyrightedCorpus: true,
    }),
  );
  assert.equal('denied' in copyright && copyright.denied, true);

  const meshExpand = createRetestCandidate(createRetestStore(), store, {
    candidateId: 'c-mesh',
    eventId: 'evt-pipe',
    actorTenantId: TENANT,
    actorUniverseId: UNIVERSE,
    attemptExpandMeshAuthority: true,
  });
  assert.equal('denied' in meshExpand && meshExpand.denied, true);

  const feedback = linkModernRetestFeedback(
    (() => {
      const rs = createRetestStore();
      createRetestCandidate(rs, store, {
        candidateId: 'c-fb',
        eventId: 'evt-pipe',
        actorTenantId: TENANT,
        actorUniverseId: UNIVERSE,
        classicalBaselinePresent: true,
      });
      return rs;
    })(),
    store,
    {
      feedbackId: 'fb-1',
      candidateId: 'c-fb',
      modernResultSummary: 'Modern classical retest inconclusive',
      actorTenantId: TENANT,
      actorUniverseId: UNIVERSE,
    },
  );
  assert.equal('denied' in feedback && feedback.denied, false);
  if ('denied' in feedback) return;
  assert.equal(feedback.updatesHistoricalTruthAutomatically, false);

  const scale = measureAtlasScale({
    atlas: store,
    failures: createFailureAtlasStore(),
    timeline: createTimelineStore(),
    retests: createRetestStore(),
  });
  assert.equal(scale.measured, true);
  assert.equal(scale.fabricated, false);
  assert.ok(scale.eventCount >= 1);
});
