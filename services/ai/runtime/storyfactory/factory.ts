import { createHash } from 'node:crypto';
import type { StoryAgent, StoryBatch, StoryDomain, VirtualUserStory } from './types';

export const VIRTUAL_STORY_CAPACITY = 10_000_000;
export const DEFAULT_BATCH_SIZE = 100;
const DOMAINS: StoryDomain[] = ['DATABASE','AI_RUNTIME','MOBILE','SECURITY','CLOUD','SIMULATION','KNOWLEDGE','SUPPLY_CHAIN','XR','PLATFORM'];
const AGENTS: StoryAgent[] = ['GROK','OLLAMA','CHATGPT','GEMINI','LOCAL_RULES'];

function storyId(ordinal: number): string {
  return `XIV-US-${String(ordinal).padStart(8, '0')}`;
}

function pick<T>(items: readonly T[], ordinal: number): T {
  return items[(ordinal - 1) % items.length];
}

export function generateStory(ordinal: number): VirtualUserStory {
  if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > VIRTUAL_STORY_CAPACITY) throw new Error('story ordinal out of range');
  const domain = pick(DOMAINS, ordinal);
  const preferredAgent = pick(AGENTS, ordinal);
  const id = storyId(ordinal);
  return {
    id,
    ordinal,
    domain,
    title: `${domain} capability increment ${ordinal}`,
    objective: `Advance XIV ${domain.toLowerCase()} capability with a small, testable, reversible increment.`,
    acceptanceCriteria: [
      'Change is isolated to a feature branch or sandbox.',
      'At least one automated or reproducible validation exists.',
      'No destructive production action is performed automatically.',
      'Observed facts, assumptions, and simulations remain distinguishable.',
    ],
    evidenceRequired: ['diff-or-artifact', 'test-or-proof', 'risk-note', 'rollback-plan'],
    preferredAgent,
    state: 'QUEUED',
    dependsOn: ordinal > 1 ? [storyId(ordinal - 1)] : [],
  };
}

export function generateBatch(startOrdinal: number, count = DEFAULT_BATCH_SIZE): StoryBatch {
  if (count < 1 || count > 1000) throw new Error('batch size must be 1..1000');
  const end = startOrdinal + count - 1;
  if (end > VIRTUAL_STORY_CAPACITY) throw new Error('batch exceeds virtual story capacity');
  const stories = Array.from({ length: count }, (_, i) => generateStory(startOrdinal + i));
  const batchId = createHash('sha256').update(`${startOrdinal}:${count}:${stories[0].id}:${stories.at(-1)?.id}`).digest('hex');
  return { batchId, startOrdinal, count, stories, generatedAt: new Date().toISOString() };
}
