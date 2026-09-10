/**
 * Energy-aware learning loop: debrief lessons → WAITING_REVIEW before global brain.
 * Never auto-rewrite AGENTS.md or promote to global truth without human review.
 */

export type LessonReviewState =
  | 'CANDIDATE'
  | 'WAITING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export type LessonCandidate = {
  lessonId: string;
  organizationId: string;
  universeId: string;
  sourceDebriefId: string;
  text: string;
  state: LessonReviewState;
  promotesToGlobalBrain: false;
  rewritesAgentsMd: false;
  rewritesGlobalTruth: false;
  createdAt: string;
};

export type LearningLoopStore = {
  candidates: LessonCandidate[];
};

export function createLearningLoopStore(): LearningLoopStore {
  return { candidates: [] };
}

export function extractLessonCandidatesFromDebrief(input: {
  debriefId: string;
  organizationId: string;
  universeId: string;
  lessons: readonly string[];
  createdAt: string;
}): LessonCandidate[] {
  return input.lessons
    .map((text) => text.trim())
    .filter((text) => text.length > 0)
    .map((text, i) => ({
      lessonId: 'lesson:' + input.debriefId + ':' + String(i),
      organizationId: input.organizationId,
      universeId: input.universeId,
      sourceDebriefId: input.debriefId,
      text,
      state: 'WAITING_REVIEW' as const,
      promotesToGlobalBrain: false as const,
      rewritesAgentsMd: false as const,
      rewritesGlobalTruth: false as const,
      createdAt: input.createdAt,
    }));
}

export function enqueueLessonCandidates(
  store: LearningLoopStore,
  candidates: readonly LessonCandidate[],
): LearningLoopStore {
  const queued = candidates.map((c) => ({
    ...c,
    state: 'WAITING_REVIEW' as const,
    promotesToGlobalBrain: false as const,
    rewritesAgentsMd: false as const,
    rewritesGlobalTruth: false as const,
  }));
  return { candidates: [...store.candidates, ...queued] };
}

export function debriefAutoPromotesToGlobalBrain(): false {
  return false;
}

export function mayAutoRewriteAgentsMd(): false {
  return false;
}

export function mayAutoRewriteGlobalTruth(): false {
  return false;
}

export function promoteLessonToGlobalBrain(
  candidate: LessonCandidate,
  approvedByHuman: boolean,
):
  | { ok: false; reason: 'waiting_review' | 'human_approval_required'; audited: true; state: LessonReviewState }
  | { ok: true; candidate: LessonCandidate; note: 'staged_only_not_applied' } {
  if (candidate.state === 'WAITING_REVIEW' || candidate.state === 'CANDIDATE') {
    if (!approvedByHuman) {
      return {
        ok: false,
        reason: 'human_approval_required',
        audited: true,
        state: 'WAITING_REVIEW',
      };
    }
  }
  if (!approvedByHuman) {
    return {
      ok: false,
      reason: 'human_approval_required',
      audited: true,
      state: candidate.state,
    };
  }
  // Even with approval, this module only stages — it never rewrites AGENTS.md / global truth.
  return {
    ok: true,
    candidate: {
      ...candidate,
      state: 'APPROVED',
      promotesToGlobalBrain: false,
      rewritesAgentsMd: false,
      rewritesGlobalTruth: false,
    },
    note: 'staged_only_not_applied',
  };
}

export function listWaitingReview(store: LearningLoopStore): LessonCandidate[] {
  return store.candidates.filter((c) => c.state === 'WAITING_REVIEW');
}
