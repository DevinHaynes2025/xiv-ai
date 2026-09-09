import { refuse } from '../civilization/errors';
import { freshnessOf } from './freshness';
import { assessGate, unresolvedBlockersFor } from './ownership';
import { assessLevel, rankOf } from './levels';
import { requireMember, type EvidenceState } from './store';
import type { BriefClassification, EvidenceActor, ReadinessRow } from './types';

// Sections 57 and 58 — the deployment-readiness view, and the vocabulary the
// Founder Brief is allowed to use about it.
//
// The single most important line in section 57 is the last one: TBD is not PASS.
// So `result` here is a three-valued thing, and the only way to get PASS is for
// assessGate to have returned PASS from the evidence. There is no override.

// The ladder a brief may climb, weakest first. The ordering is what makes
// "never upgrade REPORTED to VERIFIED without evidence" checkable rather than
// aspirational: an upgrade is any move rightwards, and it is refused unless the
// evidence computes to at least the claimed rung.
const BRIEF_ORDER: readonly BriefClassification[] = [
  'UNAVAILABLE',
  'BLOCKED',
  'UNPROVEN',
  'REPORTED',
  'OBSERVED',
  'VERIFIED',
];

export const BRIEF_MEANING: Record<BriefClassification, string> = {
  VERIFIED: 'Independent evidence exists.',
  OBSERVED: 'Evidence exists but has not completed independent verification.',
  REPORTED: 'A system, person or agent reports the state but independent evidence is unavailable.',
  UNPROVEN: 'Required evidence has not been produced.',
  BLOCKED: 'Testing cannot currently be completed.',
  UNAVAILABLE: 'Provider, runtime or integration is not configured or demonstrably accessible.',
};

export function classifyForBrief(
  state: EvidenceState,
  actor: EvidenceActor,
  gateKey: string,
  commitSha: string,
): { classification: BriefClassification; because: string } {
  const assessment = assessGate(state, actor, gateKey, commitSha);
  const gate = assessment.gate;

  if (gate.unavailableReason) {
    return { classification: 'UNAVAILABLE', because: gate.unavailableReason };
  }
  if (assessment.state === 'BLOCKED') {
    return { classification: 'BLOCKED', because: assessment.reasons.join('; ') };
  }

  const records = state.records.filter(
    (record) => record.gateId === gate.id && record.code.commitSha === commitSha,
  );
  if (records.length === 0) {
    return { classification: 'UNPROVEN', because: 'no evidence has been produced at this commit' };
  }

  const usable = records.filter(
    (record) => record.status === 'pass' && freshnessOf(state, record) === 'VALID',
  );
  if (usable.length === 0) {
    return {
      classification: 'UNPROVEN',
      because: assessment.reasons.join('; ') || 'no fresh passing evidence at this commit',
    };
  }

  const independentlyVerified = usable.some((record) =>
    state.verifications.some(
      (verification) =>
        verification.evidenceId === record.id &&
        verification.verdict === 'satisfies' &&
        verification.checkedCommitSha === commitSha,
    ),
  );
  if (independentlyVerified) {
    return { classification: 'VERIFIED', because: 'an independent reviewer confirmed the artifact at this commit' };
  }

  // E0 and E1 are somebody's account of what happened. That is REPORTED, and it
  // is the rung most claims in a young system actually sit on.
  const strongestRank = usable.reduce((best, record) => {
    const achieved = assessLevel(record, {
      verifications: state.verifications.filter((v) => v.evidenceId === record.id),
      unresolvedBlockers: unresolvedBlockersFor(state, gate),
    }).achieved;
    return Math.max(best, rankOf(achieved));
  }, -1);

  if (strongestRank <= rankOf('E1')) {
    return {
      classification: 'REPORTED',
      because: 'the strongest artifact is an observation rather than a system-generated result',
    };
  }

  return {
    classification: 'OBSERVED',
    because: 'an automated artifact exists but nobody independent has confirmed it answers the criterion',
  };
}

// Section 58's prohibition, as a function that can actually be called. A brief
// generator states what it wants to say and is refused if the evidence does not
// reach it.
export function assertBriefClaim(
  claimed: BriefClassification,
  computed: BriefClassification,
  gateKey: string,
) {
  if (BRIEF_ORDER.indexOf(claimed) > BRIEF_ORDER.indexOf(computed)) {
    refuse(
      'brief_classification_overstated',
      `${gateKey} was described as ${claimed} but the evidence supports only ${computed}`,
    );
  }
}

export function readiness(state: EvidenceState, actor: EvidenceActor, commitSha: string): ReadinessRow[] {
  requireMember(state, actor);
  return state.gates
    .filter((gate) => gate.universeId === actor.universeId)
    .map((gate) => {
      const assessment = assessGate(state, actor, gate.gateKey, commitSha);
      const { classification } = classifyForBrief(state, actor, gate.gateKey, commitSha);
      const newest = state.records
        .filter((record) => record.gateId === gate.id && record.code.commitSha === commitSha)
        .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))[0];

      return {
        gateKey: gate.gateKey,
        title: gate.title,
        owner: gate.ownerRole,
        ownerAssigned: gate.assignedOwnerId,
        requiredEvidence: gate.requiredEvidenceLevel,
        achievedEvidence: assessment.achievedLevel,
        threshold: gate.threshold,
        state: assessment.state,
        // TBD != PASS. Anything that is not a computed PASS or FAIL is openly
        // undetermined rather than being rounded towards the answer we want.
        result: assessment.state === 'PASS' ? 'PASS' : assessment.state === 'FAIL' ? 'FAIL' : 'TBD',
        verifier: gate.verifierRole,
        verifierAssigned: gate.assignedVerifierId,
        freshness: newest ? freshnessOf(state, newest) : null,
        classification,
        commitSha: newest ? commitSha : null,
        reasons: assessment.reasons,
      } satisfies ReadinessRow;
    });
}

export type ReadinessSummary = {
  commitSha: string;
  total: number;
  pass: number;
  fail: number;
  tbd: number;
  releaseCriticalUnproven: string[];
  hardBlockersFailing: string[];
  unassignedReleaseCritical: string[];
  canaryEligible: boolean;
  reasons: string[];
};

// Section 56: "No release-critical criterion may enter canary as UNASSIGNED."
// Plus the hard blockers, plus the plain requirement that critical gates pass.
// The function returns false far more often than true, which is the point.
export function canaryReadiness(
  state: EvidenceState,
  actor: EvidenceActor,
  commitSha: string,
): ReadinessSummary {
  const rows = readiness(state, actor, commitSha);
  const gateByKey = new Map(state.gates.map((gate) => [gate.gateKey, gate]));

  const releaseCriticalUnproven = rows
    .filter((row) => gateByKey.get(row.gateKey)?.releaseCritical && row.result !== 'PASS')
    .map((row) => row.gateKey);
  const hardBlockersFailing = rows
    .filter((row) => gateByKey.get(row.gateKey)?.hardBlocker && row.result !== 'PASS')
    .map((row) => row.gateKey);
  const unassignedReleaseCritical = rows
    .filter((row) => gateByKey.get(row.gateKey)?.releaseCritical && row.state === 'UNASSIGNED')
    .map((row) => row.gateKey);

  const reasons: string[] = [];
  if (unassignedReleaseCritical.length > 0) {
    reasons.push(`${unassignedReleaseCritical.length} release-critical criteria are UNASSIGNED`);
  }
  if (hardBlockersFailing.length > 0) {
    reasons.push(`${hardBlockersFailing.length} hard blockers are not proven`);
  }
  if (releaseCriticalUnproven.length > 0) {
    reasons.push(`${releaseCriticalUnproven.length} release-critical gates are not PASS`);
  }

  return {
    commitSha,
    total: rows.length,
    pass: rows.filter((row) => row.result === 'PASS').length,
    fail: rows.filter((row) => row.result === 'FAIL').length,
    tbd: rows.filter((row) => row.result === 'TBD').length,
    releaseCriticalUnproven,
    hardBlockersFailing,
    unassignedReleaseCritical,
    canaryEligible: reasons.length === 0,
    reasons,
  };
}

// Section 61 — the twelve questions. A gate is only "done" when every one of
// them has an answer drawn from stored evidence, so this returns the answers
// rather than a boolean, and says UNPROVEN where it cannot.
export type DefinitionOfDoneAnswers = {
  gateKey: string;
  answered: boolean;
  answers: Record<string, string>;
};

export function answerDefinitionOfDone(
  state: EvidenceState,
  actor: EvidenceActor,
  gateKey: string,
  commitSha: string,
): DefinitionOfDoneAnswers {
  const assessment = assessGate(state, actor, gateKey, commitSha);
  const gate = assessment.gate;
  const records = state.records
    .filter((record) => record.gateId === gate.id && record.code.commitSha === commitSha)
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
  const newest = records[0];
  const verifications = newest
    ? state.verifications.filter((verification) => verification.evidenceId === newest.id)
    : [];
  const approval = state.approvals.find(
    (item) => item.gateId === gate.id && item.commitSha === commitSha,
  );
  const unknown = 'UNPROVEN';

  const answers: Record<string, string> = {
    'What exactly was tested?': newest ? `${newest.testSuite} / ${newest.testCase}` : unknown,
    'Against which commit/build?': newest
      ? `${newest.code.repository}@${newest.code.commitSha}${newest.code.buildId ? ` build ${newest.code.buildId}` : ''}`
      : unknown,
    'Where was it tested?': newest ? newest.environment : unknown,
    'Who or what executed it?': newest ? `${newest.executorType}:${newest.executorId}` : unknown,
    'What was expected?': newest ? newest.expectedResult : unknown,
    'What actually happened?': newest ? `${newest.status} — ${newest.actualResult}` : unknown,
    'Where is the evidence?': newest ? newest.evidenceLocation : unknown,
    'Has the evidence been altered?': newest
      ? newest.supersededBy
        ? `superseded by ${newest.supersededBy}`
        : `no; sha256 ${newest.evidenceHash.slice(0, 16)}`
      : unknown,
    'Who owns remediation?': gate.assignedOwnerId ?? unknown,
    'Who independently verified it?':
      verifications.find((v) => v.verdict === 'satisfies')?.verifierId ?? unknown,
    'Is the evidence still fresh?': newest ? freshnessOf(state, newest) : unknown,
    'Did a human approval become necessary?':
      gate.humanApprovalRule === 'none'
        ? 'no'
        : approval
          ? `yes — ${approval.decision} by ${approval.approverId}`
          : `yes — ${gate.humanApprovalRule}, not yet given`,
  };

  return {
    gateKey,
    answered: !Object.values(answers).includes(unknown),
    answers,
  };
}
