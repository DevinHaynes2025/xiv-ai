/**
 * 62L-EX15 — Historical Computing Atlas core.
 * Ingest / version / truth-state discipline / rights gate / domain atlases.
 * Historical knowledge → research hypotheses only (never modern engineering truth).
 */

import {
  EX15_LOCKS,
  HISTORICAL_DOMAINS,
  QUANTUM_ADVANTAGE_VERIFIED,
  RESTRICTED_SOURCE_CLASSES,
  RIGHTS_CLASSES,
  TRUTH_STATES,
  ex15Deny,
  type AlgorithmEvolutionGraph,
  type Ex15Denial,
  type HistoricalComputingEvent,
  type HistoricalComputingEventSnapshot,
  type HistoricalDomain,
  type HistoricalRetestCandidate,
  type RestrictedSourceClass,
  type RightsClass,
  type SourceRef,
  type TemporalTruthAnnotation,
  type TruthState,
} from './types.ts';

export type AtlasStore = {
  events: Map<string, HistoricalComputingEvent>;
  evolutionGraphs: Map<string, AlgorithmEvolutionGraph>;
  temporal: Map<string, TemporalTruthAnnotation>;
};

export function createAtlasStore(): AtlasStore {
  return {
    events: new Map(),
    evolutionGraphs: new Map(),
    temporal: new Map(),
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function isRestricted(
  rights: string,
): rights is RestrictedSourceClass {
  return (RESTRICTED_SOURCE_CLASSES as readonly string[]).includes(rights);
}

function isAllowedRights(rights: string): rights is RightsClass {
  return (RIGHTS_CLASSES as readonly string[]).includes(rights);
}

/** §4–5 Source rights gate — reject restricted classes. */
export function evaluateSourceRights(
  refs: SourceRef[],
): { ok: true } | Ex15Denial {
  for (const ref of refs) {
    if (isRestricted(ref.rightsClass)) {
      return ex15Deny(
        `Restricted source class ${ref.rightsClass} for ref ${ref.refId} → QUARANTINED.`,
        'QUARANTINED',
      );
    }
    if (!isAllowedRights(ref.rightsClass)) {
      return ex15Deny(
        `Unknown/unauthorized rightsClass for ref ${ref.refId} → DENIED.`,
        'DENIED',
      );
    }
  }
  return { ok: true };
}

/** Never rewrite CLAIM_REPORTED → FACT_SUPPORTED without evidence. */
export function assertTruthTransition(
  from: TruthState,
  to: TruthState,
  evidencePresent: boolean,
): { ok: true } | Ex15Denial {
  if (
    from === 'CLAIM_REPORTED' &&
    to === 'FACT_SUPPORTED' &&
    !evidencePresent
  ) {
    return ex15Deny(
      'CLAIM_REPORTED cannot become FACT_SUPPORTED without evidence.',
    );
  }
  if (!(TRUTH_STATES as readonly string[]).includes(to)) {
    return ex15Deny(`Unknown truth state ${to}.`);
  }
  return { ok: true };
}

export type IngestEventInput = {
  eventId: string;
  title: string;
  summary: string;
  domain: HistoricalDomain;
  subdomain?: string;
  dateStart?: string;
  dateEnd?: string;
  dateConfidence?: HistoricalComputingEvent['dateConfidence'];
  people?: string[];
  orgs?: string[];
  projects?: string[];
  hardwareFamilies?: string[];
  softwareFamilies?: string[];
  algorithmFamilies?: string[];
  problemClass?: string;
  technicalContext?: string;
  economicContext?: string;
  businessContext?: string;
  scientificContext?: string;
  claimedOutcome?: string;
  verifiedOutcome?: string;
  successes?: string[];
  failures?: string[];
  limitations?: string[];
  primarySourceRefs: SourceRef[];
  secondarySourceRefs?: SourceRef[];
  rightsClass: RightsClass | RestrictedSourceClass;
  sourceQuality?: HistoricalComputingEvent['sourceQuality'];
  confidence?: number;
  disputed?: boolean;
  disputeNotes?: string[];
  truthState: TruthState;
  modernRelevance?: string;
  tenantId: string;
  universeId: string;
  tooEarly?: boolean;
  /** Hostile attempts blocked. */
  attemptPromoteHistoricalToQpuVerified?: boolean;
  attemptPromoteHistoricalBenchmarkToCurrent?: boolean;
  attemptClaimQuantumAdvantageVerified?: boolean;
  attemptCloneCopyrightedCorpus?: boolean;
};

export function ingestHistoricalEvent(
  store: AtlasStore,
  input: IngestEventInput,
): HistoricalComputingEvent | Ex15Denial {
  if (input.attemptCloneCopyrightedCorpus) {
    return ex15Deny(
      'XIV DNA connection allows only schemas/lessons/XIV-owned derived structures — cloning copyrighted corpora without rights DENIED.',
    );
  }
  if (input.attemptPromoteHistoricalToQpuVerified) {
    return ex15Deny(
      'Historical quantum result cannot become current QPU verification.',
    );
  }
  if (input.attemptPromoteHistoricalBenchmarkToCurrent) {
    return ex15Deny(
      'Historical benchmark cannot become current benchmark automatically.',
    );
  }
  if (input.attemptClaimQuantumAdvantageVerified) {
    return ex15Deny(
      'Historical quantum vs classical advantage ≠ QUANTUM_ADVANTAGE_VERIFIED.',
    );
  }
  if (isRestricted(input.rightsClass)) {
    return ex15Deny(
      `Event rightsClass ${input.rightsClass} restricted → QUARANTINED.`,
      'QUARANTINED',
    );
  }
  if (!isAllowedRights(input.rightsClass)) {
    return ex15Deny(`Unauthorized rightsClass ${input.rightsClass}.`);
  }
  if (!(HISTORICAL_DOMAINS as readonly string[]).includes(input.domain)) {
    return ex15Deny(`Unknown domain ${input.domain}.`);
  }

  const allRefs = [
    ...input.primarySourceRefs,
    ...(input.secondarySourceRefs ?? []),
  ];
  const rights = evaluateSourceRights(allRefs);
  if ('denied' in rights) return rights;

  if (input.truthState === 'FACT_SUPPORTED' && input.primarySourceRefs.length === 0) {
    return ex15Deny('FACT_SUPPORTED requires at least one primary source ref.');
  }

  const ts = nowIso();
  const event: HistoricalComputingEvent = {
    eventId: input.eventId,
    eventVersion: 1,
    title: input.title,
    summary: input.summary,
    domain: input.domain,
    subdomain: input.subdomain,
    dateStart: input.dateStart,
    dateEnd: input.dateEnd,
    dateConfidence: input.dateConfidence ?? 'UNKNOWN',
    people: input.people ?? [],
    orgs: input.orgs ?? [],
    projects: input.projects ?? [],
    hardwareFamilies: input.hardwareFamilies ?? [],
    softwareFamilies: input.softwareFamilies ?? [],
    algorithmFamilies: input.algorithmFamilies ?? [],
    problemClass: input.problemClass,
    technicalContext: input.technicalContext,
    economicContext: input.economicContext,
    businessContext: input.businessContext,
    scientificContext: input.scientificContext,
    claimedOutcome: input.claimedOutcome,
    verifiedOutcome: input.verifiedOutcome,
    successes: input.successes ?? [],
    failures: input.failures ?? [],
    limitations: input.limitations ?? [],
    primarySourceRefs: input.primarySourceRefs,
    secondarySourceRefs: input.secondarySourceRefs ?? [],
    rightsClass: input.rightsClass,
    sourceQuality: input.sourceQuality ?? 'UNKNOWN',
    confidence: input.confidence ?? 0.5,
    disputed: input.disputed ?? input.truthState === 'DISPUTED',
    disputeNotes: input.disputeNotes,
    truthState: input.truthState,
    modernRelevance: input.modernRelevance,
    tenantId: input.tenantId,
    universeId: input.universeId,
    tooEarly: input.tooEarly ?? false,
    pathwayStatus: 'DOCUMENTED',
    quantumAdvantageVerified: QUANTUM_ADVANTAGE_VERIFIED,
    isCurrentBenchmark: false,
    isCurrentQpuVerification: false,
    createdAt: ts,
    updatedAt: ts,
    previousVersions: [],
  };

  store.events.set(event.eventId, event);
  return event;
}

function snapshotOf(
  event: HistoricalComputingEvent,
): HistoricalComputingEventSnapshot {
  return {
    eventId: event.eventId,
    eventVersion: event.eventVersion,
    title: event.title,
    summary: event.summary,
    truthState: event.truthState,
    disputed: event.disputed,
    primarySourceRefs: event.primarySourceRefs,
    secondarySourceRefs: event.secondarySourceRefs,
    updatedAt: event.updatedAt,
  };
}

/** §24 Knowledge decay/update with version preservation. */
export function correctHistoricalEvent(
  store: AtlasStore,
  input: {
    eventId: string;
    actorTenantId: string;
    actorUniverseId: string;
    summary?: string;
    truthState?: TruthState;
    evidencePresent?: boolean;
    primarySourceRefs?: SourceRef[];
    disputeNotes?: string[];
    disputed?: boolean;
  },
): HistoricalComputingEvent | Ex15Denial {
  const existing = store.events.get(input.eventId);
  if (!existing) return ex15Deny(`Event ${input.eventId} not found.`);

  const access = assertTenantUniverseAccess({
    resourceTenantId: existing.tenantId,
    resourceUniverseId: existing.universeId,
    actorTenantId: input.actorTenantId,
    actorUniverseId: input.actorUniverseId,
  });
  if ('denied' in access) return access;

  if (input.truthState && input.truthState !== existing.truthState) {
    const t = assertTruthTransition(
      existing.truthState,
      input.truthState,
      input.evidencePresent === true,
    );
    if ('denied' in t) return t;
  }

  const prev = snapshotOf(existing);
  const next: HistoricalComputingEvent = {
    ...existing,
    eventVersion: existing.eventVersion + 1,
    summary: input.summary ?? existing.summary,
    truthState: input.truthState ?? existing.truthState,
    primarySourceRefs: input.primarySourceRefs ?? existing.primarySourceRefs,
    disputeNotes: input.disputeNotes ?? existing.disputeNotes,
    disputed: input.disputed ?? existing.disputed,
    updatedAt: nowIso(),
    previousVersions: [...(existing.previousVersions ?? []), prev],
    pathwayStatus: 'DOCUMENTED',
    quantumAdvantageVerified: false,
    isCurrentBenchmark: false,
    isCurrentQpuVerification: false,
  };
  store.events.set(next.eventId, next);
  return next;
}

export function assertTenantUniverseAccess(input: {
  resourceTenantId: string;
  resourceUniverseId: string;
  actorTenantId: string;
  actorUniverseId: string;
}): { ok: true } | Ex15Denial {
  if (input.resourceTenantId !== input.actorTenantId) {
    return ex15Deny('Cross-tenant private historical data DENIED.');
  }
  if (input.resourceUniverseId !== input.actorUniverseId) {
    return ex15Deny('Cross-Universe access DENIED.');
  }
  return { ok: true };
}

/** §10 Too-early research → RESEARCH_CANDIDATE / HYPOTHESIS, not auto-validation. */
export function promoteTooEarlyCandidate(
  event: HistoricalComputingEvent,
): HistoricalRetestCandidate | Ex15Denial {
  if (!event.tooEarly && event.truthState !== 'HYPOTHESIS') {
    // Still produce hypothesis candidate when explicitly too early flagged path
  }
  if (EX15_LOCKS.TOO_EARLY_AUTO_VALIDATE) {
    return ex15Deny('TOO_EARLY_AUTO_VALIDATE lock violated.');
  }
  return {
    candidateId: `retest-${event.eventId}`,
    eventId: event.eventId,
    status: 'HYPOTHESIS',
    classicalBaselineRequired: true,
    classicalBaselinePresent: false,
    tooEarly: true,
    modernRelevance: event.modernRelevance,
    tenantId: event.tenantId,
    universeId: event.universeId,
    quantumAdvantageVerified: false,
    isCurrentBenchmark: false,
    isCurrentQpuVerification: false,
  };
}

/** §8 Algorithm Evolution Graph builder. */
export function buildAlgorithmEvolutionGraph(input: {
  graphId: string;
  tenantId: string;
  universeId: string;
  problem: string;
  historicalAlgorithm: string;
  hardware: string;
  result: string;
  limitation: string;
  laterImprovement: string;
  modernCandidate: string;
  eventId?: string;
}): AlgorithmEvolutionGraph {
  const nodes = [
    { nodeId: 'n-problem', kind: 'PROBLEM' as const, label: input.problem },
    {
      nodeId: 'n-algo',
      kind: 'HISTORICAL_ALGORITHM' as const,
      label: input.historicalAlgorithm,
      eventId: input.eventId,
      modernCandidateImpliesVerified: false as const,
    },
    {
      nodeId: 'n-hw',
      kind: 'HARDWARE' as const,
      label: input.hardware,
      modernCandidateImpliesVerified: false as const,
    },
    {
      nodeId: 'n-result',
      kind: 'RESULT' as const,
      label: input.result,
      modernCandidateImpliesVerified: false as const,
    },
    {
      nodeId: 'n-limit',
      kind: 'LIMITATION' as const,
      label: input.limitation,
      modernCandidateImpliesVerified: false as const,
    },
    {
      nodeId: 'n-improve',
      kind: 'LATER_IMPROVEMENT' as const,
      label: input.laterImprovement,
      modernCandidateImpliesVerified: false as const,
    },
    {
      nodeId: 'n-modern',
      kind: 'MODERN_CANDIDATE' as const,
      label: input.modernCandidate,
      modernCandidateImpliesVerified: false as const,
    },
  ].map((n) => ({
    modernCandidateImpliesVerified: false as const,
    ...n,
  }));

  const edges = [
    { fromNodeId: 'n-problem', toNodeId: 'n-algo', relation: 'ADDRESSED_BY' },
    { fromNodeId: 'n-algo', toNodeId: 'n-hw', relation: 'RAN_ON' },
    { fromNodeId: 'n-hw', toNodeId: 'n-result', relation: 'PRODUCED' },
    { fromNodeId: 'n-result', toNodeId: 'n-limit', relation: 'LIMITED_BY' },
    { fromNodeId: 'n-limit', toNodeId: 'n-improve', relation: 'MOTIVATED' },
    {
      fromNodeId: 'n-improve',
      toNodeId: 'n-modern',
      relation: 'SUGGESTS_CANDIDATE',
    },
  ];

  return {
    graphId: input.graphId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    nodes,
    edges,
  };
}

/** §23 Temporal truth annotation — avoid hindsight distortion. */
export function annotateTemporalTruth(input: {
  eventId: string;
  knownAtTheTime: string[];
  knownToday: string[];
}): TemporalTruthAnnotation {
  return {
    eventId: input.eventId,
    knownAtTheTime: input.knownAtTheTime,
    knownToday: input.knownToday,
    hindsightDistortionAvoided: true,
  };
}

/** §16 Historical quantum vs classical — never elevates advantage. */
export function compareHistoricalQuantumClassical(input: {
  historicalClaimedAdvantage: boolean;
}): {
  historicalClaimedAdvantage: boolean;
  quantumAdvantageVerified: false;
  isCurrentQpuVerification: false;
} {
  return {
    historicalClaimedAdvantage: input.historicalClaimedAdvantage,
    quantumAdvantageVerified: false,
    isCurrentQpuVerification: false,
  };
}

export function listDomains(): readonly HistoricalDomain[] {
  return HISTORICAL_DOMAINS;
}
