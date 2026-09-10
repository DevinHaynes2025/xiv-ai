import type { StoryAgent, VirtualUserStory } from './types';

export interface AgentAvailability {
  agent: StoryAgent;
  online: boolean;
  local: boolean;
  canNetwork: boolean;
  maxConcurrent: number;
}

export interface Assignment {
  storyId: string;
  agent: StoryAgent;
  mode: 'LOCAL' | 'CLOUD_SANDBOX' | 'GENERATE_ONLY';
}

export function assignStories(stories: VirtualUserStory[], availability: AgentAvailability[]): Assignment[] {
  const capacity = new Map(availability.map((a) => [a.agent, a.maxConcurrent]));
  const out: Assignment[] = [];
  for (const story of stories) {
    const preferred = availability.find((a) => a.agent === story.preferredAgent && a.online && (capacity.get(a.agent) ?? 0) > 0);
    const fallback = availability.find((a) => a.online && (capacity.get(a.agent) ?? 0) > 0);
    const selected = preferred ?? fallback;
    if (!selected) continue;
    capacity.set(selected.agent, (capacity.get(selected.agent) ?? 1) - 1);
    out.push({
      storyId: story.id,
      agent: selected.agent,
      mode: selected.local ? 'LOCAL' : selected.canNetwork ? 'CLOUD_SANDBOX' : 'GENERATE_ONLY',
    });
  }
  return out;
}

export const EXECUTION_GUARDRAILS = {
  productionAutoMerge: false,
  productionAutoDeploy: false,
  destructiveDbAutoApply: false,
  secretExfiltrationAllowed: false,
  crossTenantDataCopyAllowed: false,
  agentDebriefRequired: true,
  evidenceBeforeDone: true,
} as const;
