/**
 * 12D-06 Adaptive Story Prioritization — score dimensions + LOCAL_RULES offline scorer.
 * Deterministic; no valuation theater; business-bar aligned.
 */
import type { VirtualUserStory } from './types';
import { EXECUTION_GUARDRAILS } from './orchestrator';

export type DebateScoreAxis =
  | 'customerValue'
  | 'technicalRisk'
  | 'cost'
  | 'security'
  | 'dependencies'
  | 'evidenceQuality';

export const DEBATE_SCORE_AXES: readonly DebateScoreAxis[] = Object.freeze([
  'customerValue',
  'technicalRisk',
  'cost',
  'security',
  'dependencies',
  'evidenceQuality',
]);

/** Each axis in [0, 1]. Higher is better except technicalRisk and cost (inverted in composite). */
export type DebateScores = Record<DebateScoreAxis, number>;

export type StoryPriorityVerdict = {
  storyId: string;
  scores: DebateScores;
  composite: number;
  worthExecuting: boolean;
  rationale: string[];
  scorer: 'LOCAL_RULES';
  offline: true;
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function domainBase(story: VirtualUserStory): DebateScores {
  // Deterministic domain priors — measurable product/ops value, not valuation theater.
  switch (story.domain) {
    case 'SECURITY':
      return { customerValue: 0.7, technicalRisk: 0.55, cost: 0.45, security: 0.95, dependencies: 0.5, evidenceQuality: 0.7 };
    case 'DATABASE':
      return { customerValue: 0.65, technicalRisk: 0.5, cost: 0.5, security: 0.7, dependencies: 0.55, evidenceQuality: 0.65 };
    case 'AI_RUNTIME':
      return { customerValue: 0.75, technicalRisk: 0.6, cost: 0.55, security: 0.65, dependencies: 0.5, evidenceQuality: 0.6 };
    case 'MOBILE':
      return { customerValue: 0.8, technicalRisk: 0.45, cost: 0.5, security: 0.6, dependencies: 0.45, evidenceQuality: 0.55 };
    case 'CLOUD':
      return { customerValue: 0.6, technicalRisk: 0.55, cost: 0.6, security: 0.7, dependencies: 0.6, evidenceQuality: 0.6 };
    case 'SIMULATION':
      return { customerValue: 0.55, technicalRisk: 0.4, cost: 0.35, security: 0.5, dependencies: 0.4, evidenceQuality: 0.7 };
    case 'KNOWLEDGE':
      return { customerValue: 0.7, technicalRisk: 0.35, cost: 0.35, security: 0.55, dependencies: 0.4, evidenceQuality: 0.75 };
    case 'SUPPLY_CHAIN':
      return { customerValue: 0.75, technicalRisk: 0.5, cost: 0.5, security: 0.6, dependencies: 0.65, evidenceQuality: 0.6 };
    case 'XR':
      return { customerValue: 0.5, technicalRisk: 0.65, cost: 0.6, security: 0.45, dependencies: 0.5, evidenceQuality: 0.45 };
    case 'PLATFORM':
    default:
      return { customerValue: 0.65, technicalRisk: 0.5, cost: 0.5, security: 0.65, dependencies: 0.55, evidenceQuality: 0.6 };
  }
}

export function compositeFromScores(scores: DebateScores): number {
  // Higher customerValue/security/evidenceQuality/dependencies readiness is good.
  // technicalRisk and cost are penalties.
  const readiness = 1 - clamp01(scores.dependencies); // fewer unmet deps → higher readiness later; here deps score = readiness of dep graph
  const value =
    0.25 * clamp01(scores.customerValue) +
    0.2 * clamp01(scores.security) +
    0.2 * clamp01(scores.evidenceQuality) +
    0.15 * clamp01(scores.dependencies) +
    0.1 * (1 - clamp01(scores.technicalRisk)) +
    0.1 * (1 - clamp01(scores.cost));
  return clamp01(value + 0 * readiness);
}

/**
 * Deterministic LOCAL_RULES scorer — always works offline.
 */
export function scoreStoryLocalRules(story: VirtualUserStory): StoryPriorityVerdict {
  if (!EXECUTION_GUARDRAILS.evidenceBeforeDone) {
    throw new Error('evidenceBeforeDone must remain true');
  }
  const scores = { ...domainBase(story) };
  const rationale: string[] = [`domain prior for ${story.domain}`];

  // Acceptance / evidence richness boosts evidenceQuality.
  const evidenceBoost = Math.min(0.2, story.evidenceRequired.length * 0.04);
  scores.evidenceQuality = clamp01(scores.evidenceQuality + evidenceBoost);
  rationale.push(`evidenceRequired=${story.evidenceRequired.length}`);

  const criteriaBoost = Math.min(0.15, story.acceptanceCriteria.length * 0.03);
  scores.customerValue = clamp01(scores.customerValue + criteriaBoost * 0.5);
  scores.evidenceQuality = clamp01(scores.evidenceQuality + criteriaBoost * 0.5);
  rationale.push(`acceptanceCriteria=${story.acceptanceCriteria.length}`);

  // Dependency load increases technical risk / dep friction.
  const depPenalty = Math.min(0.35, story.dependsOn.length * 0.08);
  scores.dependencies = clamp01(scores.dependencies - depPenalty);
  scores.technicalRisk = clamp01(scores.technicalRisk + depPenalty * 0.5);
  rationale.push(`dependsOn=${story.dependsOn.length}`);

  // Prefer local agents slightly on cost for offline-first slices.
  if (story.preferredAgent === 'LOCAL_RULES' || story.preferredAgent === 'OLLAMA') {
    scores.cost = clamp01(scores.cost - 0.1);
    rationale.push('local-preferred agent cost bias');
  }

  const composite = compositeFromScores(scores);
  const worthExecuting = composite >= 0.45 && scores.security >= 0.4 && scores.evidenceQuality >= 0.4;
  if (!worthExecuting) rationale.push('below worthExecuting threshold');

  return {
    storyId: story.id,
    scores,
    composite,
    worthExecuting,
    rationale,
    scorer: 'LOCAL_RULES',
    offline: true,
  };
}

export function rankStoriesLocalRules(stories: readonly VirtualUserStory[]): StoryPriorityVerdict[] {
  return [...stories]
    .map((s) => scoreStoryLocalRules(s))
    .sort((a, b) => b.composite - a.composite || a.storyId.localeCompare(b.storyId));
}