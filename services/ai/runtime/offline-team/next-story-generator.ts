import type { AtomicLearningCell } from './executive-neuron-learning';

export type GeneratedStory = {
  storyId: string;
  tenantId: string;
  objective: string;
  sourceCellIds: string[];
  requiresHumanReview: boolean;
  productionAuthority: false;
};

const DOMAIN_MAP: Array<[RegExp, string]> = [
  [/security|secret|tenant|auth/i, 'Strengthen security evidence and tenant isolation'],
  [/data|database|document|knowledge/i, 'Expand governed private data brain ingestion and provenance'],
  [/ollama|model|llm|agent|ai/i, 'Improve offline Ollama agent evaluation and routing'],
  [/cost|revenue|finance|pricing/i, 'Improve finance scenario evidence and unit economics'],
  [/deploy|devops|runtime|test/i, 'Improve offline DevOps validation and recovery'],
];

export function generateNextStories(cells: AtomicLearningCell[], maxStories = 8): GeneratedStory[] {
  const capped = Math.max(0, Math.min(maxStories, 8));
  const grouped = new Map<string, AtomicLearningCell[]>();
  for (const cell of cells) {
    const objective = DOMAIN_MAP.find(([pattern]) => pattern.test(cell.content))?.[1] ?? 'Review approved executive lesson and define a measurable improvement';
    const group = grouped.get(objective) ?? [];
    group.push(cell);
    grouped.set(objective, group);
  }
  return [...grouped.entries()].slice(0, capped).map(([objective, source], index) => ({
    storyId: `12D-37-AUTO-${String(index + 1).padStart(2, '0')}`,
    tenantId: source[0].tenantId,
    objective,
    sourceCellIds: source.map(s => s.cellId),
    requiresHumanReview: true,
    productionAuthority: false,
  }));
}
