/**
 * 12D-06 AI Team Council Ã¢â‚¬â€ multi-agent debate + adaptive queue reprioritization.
 * LOCAL_RULES always offline; Ollama optional; unbound cloud agents = WAITING_PROVIDER.
 */
import type { AgentDebrief, StoryAgent, VirtualUserStory } from './types';
import { summarizeCouncil } from './debrief';
import { EXECUTION_GUARDRAILS, type AgentAvailability, type Assignment, assignStories } from './orchestrator';
import {
  DEBATE_SCORE_AXES,
  scoreStoryLocalRules,
  type DebateScores,
  type StoryPriorityVerdict,
} from './priority-scores';

export type CouncilProviderStatus = 'READY' | 'OPTIONAL_OFFLINE' | 'WAITING_PROVIDER';

export type CouncilAgentSeat = {
  agent: StoryAgent;
  status: CouncilProviderStatus;
  local: boolean;
  voteWeight: number;
};

export type StoryDebateBallot = {
  agent: StoryAgent;
  status: CouncilProviderStatus;
  scores: DebateScores | null;
  notes: string;
};

export type StoryCouncilDecision = {
  storyId: string;
  ballots: StoryDebateBallot[];
  blended: DebateScores;
  composite: number;
  worthExecuting: boolean;
  priorityRank: number;
  learningTags: string[];
};

export type AdaptiveQueueResult = {
  orderedStoryIds: string[];
  decisions: StoryCouncilDecision[];
  skippedNotWorth: string[];
  assignments: Assignment[];
  guardrails: typeof EXECUTION_GUARDRAILS;
  providerStatuses: CouncilAgentSeat[];
};

export type ExecutionLearningRecord = {
  storyId: string;
  predictedComposite: number;
  outcome: 'completed' | 'failed' | 'blocked';
  evidencePresent: boolean;
  lesson: string;
};

export type AdaptiveLearningState = {
  /** Running mean residual: outcomeScore - predictedComposite per domain tag. */
  biasByTag: Record<string, number>;
  samples: number;
};

export const ADAPTIVE_COUNCIL_GUARDRAILS = {
  ...EXECUTION_GUARDRAILS,
  productionAutoMerge: false as const,
  productionAutoDeploy: false as const,
  destructiveDbAutoApply: false as const,
  crossTenantDataCopyAllowed: false as const,
  agentDebriefRequired: true as const,
  evidenceBeforeDone: true as const,
  cloudAgentsDefaultWaitingIfUnbound: true as const,
} as const;

const CLOUD_AGENTS: readonly StoryAgent[] = ['GROK', 'CHATGPT', 'GEMINI'];

export function defaultCouncilSeats(availability: readonly AgentAvailability[]): CouncilAgentSeat[] {
  const byAgent = new Map(availability.map((a) => [a.agent, a]));
  const agents: StoryAgent[] = ['LOCAL_RULES', 'OLLAMA', 'GROK', 'CHATGPT', 'GEMINI'];
  return agents.map((agent) => {
    const avail = byAgent.get(agent);
    if (agent === 'LOCAL_RULES') {
      return { agent, status: 'READY', local: true, voteWeight: 1 };
    }
    if (agent === 'OLLAMA') {
      if (avail?.online) return { agent, status: 'READY', local: true, voteWeight: 0.9 };
      return { agent, status: 'OPTIONAL_OFFLINE', local: true, voteWeight: 0 };
    }
    if (CLOUD_AGENTS.includes(agent)) {
      if (avail?.online && avail.canNetwork) {
        return { agent, status: 'READY', local: false, voteWeight: 0.7 };
      }
      return { agent, status: 'WAITING_PROVIDER', local: false, voteWeight: 0 };
    }
    return { agent, status: 'WAITING_PROVIDER', local: false, voteWeight: 0 };
  });
}

function emptyScores(): DebateScores {
  return {
    customerValue: 0,
    technicalRisk: 0,
    cost: 0,
    security: 0,
    dependencies: 0,
    evidenceQuality: 0,
  };
}

function blendScores(ballots: readonly StoryDebateBallot[], seats: readonly CouncilAgentSeat[]): DebateScores {
  const weights = new Map(seats.map((s) => [s.agent, s.voteWeight]));
  const acc = emptyScores();
  let wSum = 0;
  for (const ballot of ballots) {
    if (!ballot.scores) continue;
    const w = weights.get(ballot.agent) ?? 0;
    if (w <= 0) continue;
    wSum += w;
    for (const axis of DEBATE_SCORE_AXES) {
      acc[axis] += ballot.scores[axis] * w;
    }
  }
  if (wSum <= 0) {
    // LOCAL_RULES must always contribute Ã¢â‚¬â€ caller guarantees a READY LOCAL_RULES ballot.
    return emptyScores();
  }
  for (const axis of DEBATE_SCORE_AXES) {
    acc[axis] = acc[axis] / wSum;
  }
  return acc;
}

function compositeOf(scores: DebateScores): number {
  return (
    0.25 * scores.customerValue +
    0.2 * scores.security +
    0.2 * scores.evidenceQuality +
    0.15 * scores.dependencies +
    0.1 * (1 - scores.technicalRisk) +
    0.1 * (1 - scores.cost)
  );
}

function perturbForAgent(base: DebateScores, agent: StoryAgent): DebateScores {
  const out = { ...base };
  // Lightweight deterministic Ã¢â‚¬Å“debate stanceÃ¢â‚¬Â Ã¢â‚¬â€ not a valuation claim.
  switch (agent) {
    case 'OLLAMA':
      out.cost = Math.max(0, out.cost - 0.05);
      out.evidenceQuality = Math.min(1, out.evidenceQuality + 0.03);
      break;
    case 'GROK':
      out.customerValue = Math.min(1, out.customerValue + 0.04);
      out.technicalRisk = Math.min(1, out.technicalRisk + 0.03);
      break;
    case 'CHATGPT':
      out.evidenceQuality = Math.min(1, out.evidenceQuality + 0.05);
      break;
    case 'GEMINI':
      out.security = Math.min(1, out.security + 0.03);
      out.cost = Math.min(1, out.cost + 0.02);
      break;
    default:
      break;
  }
  return out;
}

export function debateStory(
  story: VirtualUserStory,
  seats: readonly CouncilAgentSeat[],
  learning?: AdaptiveLearningState,
): StoryCouncilDecision {
  if (!ADAPTIVE_COUNCIL_GUARDRAILS.agentDebriefRequired) {
    throw new Error('agentDebriefRequired must remain true');
  }
  const local: StoryPriorityVerdict = scoreStoryLocalRules(story);
  const ballots: StoryDebateBallot[] = seats.map((seat) => {
    if (seat.agent === 'LOCAL_RULES') {
      return {
        agent: seat.agent,
        status: 'READY',
        scores: local.scores,
        notes: local.rationale.join('; '),
      };
    }
    if (seat.status === 'WAITING_PROVIDER') {
      return {
        agent: seat.agent,
        status: 'WAITING_PROVIDER',
        scores: null,
        notes: 'unbound cloud agent Ã¢â‚¬â€ WAITING_PROVIDER',
      };
    }
    if (seat.status === 'OPTIONAL_OFFLINE') {
      return {
        agent: seat.agent,
        status: 'OPTIONAL_OFFLINE',
        scores: null,
        notes: 'Ollama optional offline Ã¢â‚¬â€ LOCAL_RULES carries vote',
      };
    }
    return {
      agent: seat.agent,
      status: 'READY',
      scores: perturbForAgent(local.scores, seat.agent),
      notes: 'sandbox debate stance from LOCAL_RULES baseline',
    };
  });

  let blended = blendScores(ballots, seats);
  const tags = [`domain:${story.domain}`, `agent:${story.preferredAgent}`];
  if (learning) {
    for (const tag of tags) {
      const bias = learning.biasByTag[tag] ?? 0;
      blended = {
        ...blended,
        customerValue: Math.max(0, Math.min(1, blended.customerValue + bias * 0.25)),
        evidenceQuality: Math.max(0, Math.min(1, blended.evidenceQuality + bias * 0.25)),
      };
    }
  }
  const composite = compositeOf(blended);
  const worthExecuting = composite >= 0.45 && blended.security >= 0.4 && blended.evidenceQuality >= 0.4;
  return {
    storyId: story.id,
    ballots,
    blended,
    composite,
    worthExecuting,
    priorityRank: -1,
    learningTags: tags,
  };
}

/**
 * Reprioritize a virtual story queue using council debate scores.
 */
export function reprioritizeStoryQueue(input: {
  stories: readonly VirtualUserStory[];
  availability: readonly AgentAvailability[];
  learning?: AdaptiveLearningState;
}): AdaptiveQueueResult {
  if (ADAPTIVE_COUNCIL_GUARDRAILS.productionAutoMerge) {
    throw new Error('productionAutoMerge must remain false');
  }
  if (ADAPTIVE_COUNCIL_GUARDRAILS.productionAutoDeploy) {
    throw new Error('productionAutoDeploy must remain false');
  }
  if (ADAPTIVE_COUNCIL_GUARDRAILS.destructiveDbAutoApply) {
    throw new Error('destructiveDbAutoApply must remain false');
  }
  if (ADAPTIVE_COUNCIL_GUARDRAILS.crossTenantDataCopyAllowed) {
    throw new Error('crossTenantDataCopyAllowed must remain false');
  }

  const seats = defaultCouncilSeats(input.availability);
  const decisions = input.stories.map((s) => debateStory(s, seats, input.learning));
  decisions.sort((a, b) => b.composite - a.composite || a.storyId.localeCompare(b.storyId));
  decisions.forEach((d, i) => {
    d.priorityRank = i + 1;
  });

  const worth = decisions.filter((d) => d.worthExecuting);
  const skippedNotWorth = decisions.filter((d) => !d.worthExecuting).map((d) => d.storyId);
  const orderedStoryIds = worth.map((d) => d.storyId);
  const storyById = new Map(input.stories.map((s) => [s.id, s]));
  const orderedStories = orderedStoryIds
    .map((id) => storyById.get(id))
    .filter((s): s is VirtualUserStory => Boolean(s));

  const assignments = assignStories(orderedStories, [...input.availability]);

  return {
    orderedStoryIds,
    decisions,
    skippedNotWorth,
    assignments,
    guardrails: EXECUTION_GUARDRAILS,
    providerStatuses: seats,
  };
}

/**
 * Learn from debrief outcomes which stories were worth executing.
 * Adjusts tag bias for future prioritization (offline, local state only).
 */
export function learnFromDebriefs(
  state: AdaptiveLearningState,
  debriefs: readonly AgentDebrief[],
  priorDecisions: readonly StoryCouncilDecision[],
): AdaptiveLearningState {
  const decisionByStory = new Map(priorDecisions.map((d) => [d.storyId, d]));
  const biasByTag = { ...state.biasByTag };
  let samples = state.samples;

  for (const debrief of debriefs) {
    const apply = (storyId: string, outcomeScore: number, evidencePresent: boolean) => {
      const prior = decisionByStory.get(storyId);
      if (!prior) return;
      if (ADAPTIVE_COUNCIL_GUARDRAILS.evidenceBeforeDone && outcomeScore >= 1 && !evidencePresent) {
        // Refuse to treat DONE without evidence as positive learning.
        return;
      }
      const residual = outcomeScore - prior.composite;
      for (const tag of prior.learningTags) {
        const prev = biasByTag[tag] ?? 0;
        biasByTag[tag] = prev * 0.8 + residual * 0.2;
      }
      samples += 1;
    };

    for (const id of debrief.completed) {
      apply(id, 1, debrief.evidenceRefs.length > 0);
    }
    for (const id of debrief.failed) {
      apply(id, 0, debrief.evidenceRefs.length > 0);
    }
    for (const id of debrief.blocked) {
      apply(id, 0.25, debrief.evidenceRefs.length > 0);
    }
  }

  // Touch council summary for shared lessons visibility (no side effects).
  summarizeCouncil([...debriefs]);

  return { biasByTag, samples };
}

export function createLearningState(): AdaptiveLearningState {
  return { biasByTag: {}, samples: 0 };
}

export type { DebateScoreAxis, DebateScores, StoryPriorityVerdict };
export { rankStoriesLocalRules, scoreStoryLocalRules, DEBATE_SCORE_AXES };