import { refuse } from './errors';
import { oversightForProfession } from './directory';
import {
  now,
  organizationOf,
  recordGovernanceEvent,
  requireAgent,
  requireMember,
  requireSupervisor,
  visibleTo,
  type CivilizationState,
} from './store';
import type {
  ActorContext,
  AgentReputation,
  EligibilityTier,
  ImpactLevel,
  MeetingOutcome,
} from './types';

// Agent reputation.
//
// One rule shapes this whole file: reputation narrows authority and never widens
// it. A high composite score does not hand an agent a capability, a tool or a
// clearance — those stay with the supervisor. What the score decides is whether
// the agent remains *eligible* for higher-impact assignments. Deteriorating
// performance can therefore take work away automatically, which is safe, but
// improving performance can never grant anything, which is the direction that
// would not be.

export const REPUTATION_WEIGHTS = {
  accuracy: 0.2,
  evidenceQuality: 0.15,
  calibration: 0.15,
  taskSuccess: 0.15,
  securityCompliance: 0.1,
  costEfficiency: 0.08,
  latencyScore: 0.05,
  collaborationQuality: 0.07,
  hallucinationRate: 0.03,
  humanCorrectionRate: 0.02,
} as const;

// Below these, an agent is restricted no matter how good the rest of the numbers
// look. A model that is accurate and cheap but leaks across a tenant boundary is
// not a good agent having an off day.
const SECURITY_COMPLIANCE_FLOOR = 0.9;
const HALLUCINATION_CEILING = 0.2;
const MIN_SAMPLE_FOR_TRUST = 5;

const IMPACT_ORDER: ImpactLevel[] = ['none', 'low', 'medium', 'high'];

const TIER_CEILING: Record<EligibilityTier, ImpactLevel> = {
  trusted: 'high',
  standard: 'medium',
  probationary: 'low',
  restricted: 'none',
};

export type ReputationSignals = Partial<{
  accuracy: number;
  evidenceQuality: number;
  calibration: number;
  taskSuccess: number;
  humanCorrectionRate: number;
  securityCompliance: number;
  hallucinationRate: number;
  costEfficiency: number;
  latencyScore: number;
  collaborationQuality: number;
}>;

export function ensureReputation(
  state: CivilizationState,
  actor: ActorContext,
  agentId: string,
): AgentReputation {
  const existing = state.reputations.find((item) => item.agentId === agentId);
  if (existing) return existing;

  const agent = requireAgent(state, actor.universeId, agentId);
  const record: AgentReputation = {
    id: state.nextId(),
    universeId: agent.universeId,
    organizationId: organizationOf(state, agent.universeId),
    agentId: agent.id,
    accuracy: 0.5,
    evidenceQuality: 0.5,
    calibration: 0.5,
    taskSuccess: 0.5,
    humanCorrectionRate: 0,
    securityCompliance: 1,
    hallucinationRate: 0,
    costEfficiency: 0.5,
    latencyScore: 0.5,
    collaborationQuality: 0.5,
    sampleSize: 0,
    composite: 0.5,
    eligibilityTier: 'probationary',
    maxImpactLevel: 'low',
    lastEvaluatedAt: null,
    provenance: { createdBy: actor.userId, slice: '2I-AI-62B' },
    securityClassification: 'internal',
    retentionPolicy: 'retain-2y',
    auditEventId: null,
    createdAt: now(state),
    updatedAt: now(state),
  };
  state.reputations.push(record);
  derive(record);
  return record;
}

// The composite and the ceiling are always recomputed from the measurements, so
// writing a flattering tier straight onto the record has no effect. The database
// enforces the same thing in xiv_derive_reputation_ceiling.
function derive(record: AgentReputation) {
  const weighted =
    record.accuracy * REPUTATION_WEIGHTS.accuracy +
    record.evidenceQuality * REPUTATION_WEIGHTS.evidenceQuality +
    record.calibration * REPUTATION_WEIGHTS.calibration +
    record.taskSuccess * REPUTATION_WEIGHTS.taskSuccess +
    record.securityCompliance * REPUTATION_WEIGHTS.securityCompliance +
    record.costEfficiency * REPUTATION_WEIGHTS.costEfficiency +
    record.latencyScore * REPUTATION_WEIGHTS.latencyScore +
    record.collaborationQuality * REPUTATION_WEIGHTS.collaborationQuality +
    (1 - record.hallucinationRate) * REPUTATION_WEIGHTS.hallucinationRate +
    (1 - record.humanCorrectionRate) * REPUTATION_WEIGHTS.humanCorrectionRate;

  record.composite = Number(weighted.toFixed(4));

  record.eligibilityTier =
    record.securityCompliance < SECURITY_COMPLIANCE_FLOOR || record.hallucinationRate > HALLUCINATION_CEILING
      ? 'restricted'
      : record.sampleSize < MIN_SAMPLE_FOR_TRUST
        ? 'probationary'
        : record.composite >= 0.85
          ? 'trusted'
          : record.composite >= 0.65
            ? 'standard'
            : record.composite >= 0.45
              ? 'probationary'
              : 'restricted';

  record.maxImpactLevel = TIER_CEILING[record.eligibilityTier];
  return record;
}

export function recordSignals(
  state: CivilizationState,
  actor: ActorContext,
  input: { agentId: string; signals: ReputationSignals; samples?: number; note?: string },
): AgentReputation {
  requireSupervisor(state, actor);
  const record = ensureReputation(state, actor, input.agentId);

  // Signals move the running average rather than replacing it, so one good
  // quarter does not erase a bad year and one bad day does not erase a good one.
  const weight = input.samples ?? 1;
  const total = record.sampleSize + weight;

  for (const [key, value] of Object.entries(input.signals) as [keyof ReputationSignals, number][]) {
    if (typeof value !== 'number') continue;
    const bounded = Math.min(1, Math.max(0, value));
    const current = record[key] as number;
    (record as unknown as Record<string, number>)[key] = Number(
      ((current * record.sampleSize + bounded * weight) / total).toFixed(4),
    );
  }

  record.sampleSize = total;
  record.lastEvaluatedAt = now(state);
  record.updatedAt = now(state);
  derive(record);

  recordGovernanceEvent(state, {
    universeId: record.universeId,
    eventKind: 'agent_reputation_updated',
    actorUserId: actor.userId,
    subjectAgentId: record.agentId,
    decision: record.eligibilityTier,
    detail: {
      composite: record.composite,
      maxImpactLevel: record.maxImpactLevel,
      sampleSize: record.sampleSize,
      note: input.note ?? null,
    },
  });

  return record;
}

// Outcome-based learning. The agent learns from what its recommendation actually
// produced, measured at a horizon, rather than from every interaction it ever
// had. Nothing here can grant a capability; the only thing an outcome moves is
// the eligibility ceiling.
export function learnFromOutcome(
  state: CivilizationState,
  actor: ActorContext,
  input: { outcomeId: string },
): AgentReputation[] {
  requireSupervisor(state, actor);

  const outcome = state.meetingOutcomes.find((item) => item.id === input.outcomeId);
  if (!outcome) refuse('outcome_requires_measurement', input.outcomeId);
  if (outcome.universeId !== actor.universeId) refuse('tenancy_cross_universe_blocked', input.outcomeId);

  const contributors = contributingAgents(state, outcome);
  const accuracy = gradeToScore(outcome.outcomeGrade);
  const calibration = outcome.calibrationError === null ? 0.5 : 1 - outcome.calibrationError;

  return contributors.map((agentId) =>
    recordSignals(state, actor, {
      agentId,
      signals: { accuracy, calibration, taskSuccess: accuracy },
      note: `outcome ${outcome.id} graded ${outcome.outcomeGrade} at ${outcome.horizonDays} days`,
    }),
  );
}

// The agents whose evidence the selected option actually rested on. An agent that
// sat in the room and said nothing does not earn credit for the result.
function contributingAgents(state: CivilizationState, outcome: MeetingOutcome): string[] {
  const decision = state.meetingDecisions.find((item) => item.id === outcome.decisionId);
  const proposal = decision?.selectedProposalId
    ? state.meetingProposals.find((item) => item.id === decision.selectedProposalId)
    : undefined;

  const agents = new Set<string>();
  if (proposal?.proposedByAgentId) agents.add(proposal.proposedByAgentId);
  for (const evidenceId of proposal?.evidenceIds ?? []) {
    const evidence = state.meetingEvidence.find((item) => item.id === evidenceId);
    if (evidence?.submittedByAgentId) agents.add(evidence.submittedByAgentId);
  }
  return [...agents].sort();
}

function gradeToScore(grade: MeetingOutcome['outcomeGrade']) {
  switch (grade) {
    case 'successful':
      return 1;
    case 'partial':
      return 0.6;
    case 'unsuccessful':
      return 0;
    default:
      return 0.5;
  }
}

export function readReputation(state: CivilizationState, actor: ActorContext, agentId: string): AgentReputation {
  requireMember(state, actor);
  const record = state.reputations.find((item) => item.agentId === agentId);
  if (!record) refuse('reputation_unknown', agentId);
  if (record.universeId !== actor.universeId) refuse('tenancy_cross_universe_blocked', agentId);
  return record;
}

export function listReputations(state: CivilizationState, actor: ActorContext): AgentReputation[] {
  return visibleTo(state, actor, state.reputations);
}

export type EligibilityCheck = {
  eligible: boolean;
  tier: EligibilityTier;
  ceiling: ImpactLevel;
  requested: ImpactLevel;
  requiresHumanApproval: boolean;
  reason: string;
};

// Eligibility is a gate on assignment, not a grant of authority. A trusted agent
// still holds exactly the capabilities its supervisor gave it; all this decides
// is whether it may be handed work of a given impact.
export function assignmentEligibility(
  state: CivilizationState,
  actor: ActorContext,
  input: { agentId: string; impactLevel: ImpactLevel },
): EligibilityCheck {
  requireMember(state, actor);
  const agent = requireAgent(state, actor.universeId, input.agentId);
  const record = state.reputations.find((item) => item.agentId === input.agentId);
  const tier: EligibilityTier = record?.eligibilityTier ?? 'probationary';
  const ceiling: ImpactLevel = record?.maxImpactLevel ?? 'low';

  const eligible = IMPACT_ORDER.indexOf(input.impactLevel) <= IMPACT_ORDER.indexOf(ceiling);
  const highStakes = oversightForProfession(state, actor.universeId, agent.profession) !== 'standard';

  return {
    eligible,
    tier,
    ceiling,
    requested: input.impactLevel,
    // Oversight is independent of reputation. A trusted legal research agent
    // still needs a person, because the requirement comes from the profession.
    requiresHumanApproval: highStakes || input.impactLevel === 'high',
    reason: eligible
      ? `${agent.agentKey} is ${tier} and may take ${input.impactLevel}-impact work`
      : `${agent.agentKey} is ${tier}, whose ceiling is ${ceiling}`,
  };
}

export function assertAssignable(
  state: CivilizationState,
  actor: ActorContext,
  input: { agentId: string; impactLevel: ImpactLevel },
): EligibilityCheck {
  const check = assignmentEligibility(state, actor, input);
  if (!check.eligible) refuse('reputation_impact_not_eligible', check.reason);
  return check;
}
