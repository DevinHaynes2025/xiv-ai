export type StoryAgent = 'GROK' | 'OLLAMA' | 'CHATGPT' | 'GEMINI' | 'LOCAL_RULES';
export type StoryState = 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'BLOCKED' | 'REVIEW' | 'DONE' | 'DEBRIEFED';
export type StoryDomain = 'DATABASE' | 'AI_RUNTIME' | 'MOBILE' | 'SECURITY' | 'CLOUD' | 'SIMULATION' | 'KNOWLEDGE' | 'SUPPLY_CHAIN' | 'XR' | 'PLATFORM';

export interface VirtualUserStory {
  id: string;
  ordinal: number;
  domain: StoryDomain;
  title: string;
  objective: string;
  acceptanceCriteria: string[];
  evidenceRequired: string[];
  preferredAgent: StoryAgent;
  state: StoryState;
  dependsOn: string[];
}

export interface StoryBatch {
  batchId: string;
  startOrdinal: number;
  count: number;
  stories: VirtualUserStory[];
  generatedAt: string;
}

export interface AgentDebrief {
  debriefId: string;
  agent: StoryAgent;
  storyIds: string[];
  completed: string[];
  failed: string[];
  blocked: string[];
  lessons: string[];
  assumptions: string[];
  evidenceRefs: string[];
  nextActions: string[];
  createdAt: string;
}
