/**
 * 62L-EX15 — Historical retest engine (§19) + feedback loop (§26).
 * HistoricalRetestCandidate: classicalBaselineRequired=true, status=HYPOTHESIS.
 * Parallel research branches via existing Agent Mesh only — no authority expansion.
 */

import {
  EX15_LOCKS,
  ex15Deny,
  type Ex15Denial,
  type HistoricalRetestCandidate,
} from './types.ts';
import {
  assertTenantUniverseAccess,
  type AtlasStore,
} from './atlas.ts';

export type RetestStore = {
  candidates: Map<string, HistoricalRetestCandidate>;
  feedback: Map<string, RetestFeedback>;
};

export type RetestFeedback = {
  feedbackId: string;
  eventId: string;
  candidateId: string;
  modernResultSummary: string;
  updatesHistoricalTruthAutomatically: false;
  linkedAt: string;
};

export function createRetestStore(): RetestStore {
  return { candidates: new Map(), feedback: new Map() };
}

export function createRetestCandidate(
  store: RetestStore,
  atlas: AtlasStore,
  input: {
    candidateId: string;
    eventId: string;
    actorTenantId: string;
    actorUniverseId: string;
    classicalBaselinePresent?: boolean;
    attemptSkipClassicalBaseline?: boolean;
    attemptAutoValidate?: boolean;
    attemptExpandMeshAuthority?: boolean;
  },
): HistoricalRetestCandidate | Ex15Denial {
  if (input.attemptExpandMeshAuthority) {
    return ex15Deny(
      'Parallel research branches use existing Agent Mesh only — authority expansion DENIED.',
    );
  }
  if (input.attemptAutoValidate) {
    return ex15Deny(
      'Too-early / historical retest cannot auto-validate — remains HYPOTHESIS.',
    );
  }
  if (input.attemptSkipClassicalBaseline) {
    return ex15Deny('Retest requires modern classical baseline.');
  }
  if (EX15_LOCKS.RETEST_WITHOUT_CLASSICAL_BASELINE) {
    return ex15Deny('RETEST_WITHOUT_CLASSICAL_BASELINE lock violated.');
  }

  const event = atlas.events.get(input.eventId);
  if (!event) return ex15Deny(`Event ${input.eventId} not found.`);

  const access = assertTenantUniverseAccess({
    resourceTenantId: event.tenantId,
    resourceUniverseId: event.universeId,
    actorTenantId: input.actorTenantId,
    actorUniverseId: input.actorUniverseId,
  });
  if ('denied' in access) return access;

  const candidate: HistoricalRetestCandidate = {
    candidateId: input.candidateId,
    eventId: input.eventId,
    status: 'HYPOTHESIS',
    classicalBaselineRequired: true,
    classicalBaselinePresent: input.classicalBaselinePresent === true,
    tooEarly: event.tooEarly === true,
    modernRelevance: event.modernRelevance,
    tenantId: event.tenantId,
    universeId: event.universeId,
    quantumAdvantageVerified: false,
    isCurrentBenchmark: false,
    isCurrentQpuVerification: false,
  };

  if (!candidate.classicalBaselinePresent) {
    // Still record as hypothesis candidate; execution blocked until baseline present.
    store.candidates.set(candidate.candidateId, candidate);
    return candidate;
  }

  store.candidates.set(candidate.candidateId, candidate);
  return candidate;
}

/** Require classical baseline before marking retest runnable. */
export function assertRetestRunnable(
  candidate: HistoricalRetestCandidate,
): { ok: true } | Ex15Denial {
  if (!candidate.classicalBaselineRequired) {
    return ex15Deny('classicalBaselineRequired must be true.');
  }
  if (!candidate.classicalBaselinePresent) {
    return ex15Deny('Retest requires modern classical baseline.');
  }
  if (candidate.status !== 'HYPOTHESIS') {
    return ex15Deny('Retest candidate must remain HYPOTHESIS until reviewed.');
  }
  return { ok: true };
}

/** §26 Feedback loop — modern results link back; do not auto-rewrite history. */
export function linkModernRetestFeedback(
  store: RetestStore,
  atlas: AtlasStore,
  input: {
    feedbackId: string;
    candidateId: string;
    modernResultSummary: string;
    actorTenantId: string;
    actorUniverseId: string;
    attemptAutoRewriteHistoricalTruth?: boolean;
  },
): RetestFeedback | Ex15Denial {
  const candidate = store.candidates.get(input.candidateId);
  if (!candidate) return ex15Deny(`Candidate ${input.candidateId} not found.`);

  const access = assertTenantUniverseAccess({
    resourceTenantId: candidate.tenantId,
    resourceUniverseId: candidate.universeId,
    actorTenantId: input.actorTenantId,
    actorUniverseId: input.actorUniverseId,
  });
  if ('denied' in access) return access;

  if (input.attemptAutoRewriteHistoricalTruth) {
    return ex15Deny(
      'Modern retest feedback cannot automatically rewrite historical truth state.',
    );
  }

  // Soft presence check that event still exists.
  if (!atlas.events.has(candidate.eventId)) {
    return ex15Deny('Feedback requires linked historical event.');
  }

  const feedback: RetestFeedback = {
    feedbackId: input.feedbackId,
    eventId: candidate.eventId,
    candidateId: candidate.candidateId,
    modernResultSummary: input.modernResultSummary,
    updatesHistoricalTruthAutomatically: false,
    linkedAt: new Date().toISOString(),
  };
  store.feedback.set(feedback.feedbackId, feedback);
  return feedback;
}
