export interface StoryExplanationRequest {
  tenantId: string;
  objective: string;
  evidenceRefs: string[];
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
}

export interface StoryExplanationPrompt {
  provider: 'OLLAMA';
  model: string;
  prompt: string;
  networkAllowed: boolean;
}

export function buildOllamaStoryPrompt(request: StoryExplanationRequest, model = 'qwen2.5-coder:7b'): StoryExplanationPrompt {
  if (!request.tenantId || !request.evidenceRefs.length) throw new Error('tenant and evidence required');
  return {
    provider: 'OLLAMA',
    model,
    networkAllowed: false,
    prompt: [
      'You are an XIV offline Story Engine agent.',
      `Tenant: ${request.tenantId}`,
      `Objective: ${request.objective}`,
      `Evidence refs: ${request.evidenceRefs.join(', ')}`,
      'Explain: what changed, why it matters, risks, options, and what evidence would change the recommendation.',
      'Do not invent facts. Preserve uncertainty. Do not expose secrets. Do not execute production actions.'
    ].join('\n'),
  };
}

export const OLLAMA_STORY_GUARDRAILS = {
  offlineOnly: true,
  evidenceRequired: true,
  secretsInPromptAllowed: false,
  productionAuthority: false,
};
