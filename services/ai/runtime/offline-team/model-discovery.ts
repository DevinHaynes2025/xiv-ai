export interface OllamaModelInfo {
  name: string;
  sizeBytes?: number;
  modifiedAt?: string;
}

export interface OllamaDiscoveryResult {
  reachable: boolean;
  endpoint: string;
  models: readonly OllamaModelInfo[];
  evidence: readonly string[];
}

export const MODEL_DISCOVERY_GUARDRAILS = {
  endpoint: 'http://127.0.0.1:11434',
  networkRequired: false,
  productionMutationAllowed: false,
  discoveredDoesNotMeanRunning: true,
} as const;

export async function discoverOllamaModels(input?: {
  endpoint?: string;
  fetchImpl?: (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;
}): Promise<OllamaDiscoveryResult> {
  const endpoint = input?.endpoint ?? MODEL_DISCOVERY_GUARDRAILS.endpoint;
  if (!input?.fetchImpl) {
    return Object.freeze({ reachable: false, endpoint, models: Object.freeze([]), evidence: Object.freeze(['NO_FETCH_IMPLEMENTATION']) });
  }

  try {
    const response = await input.fetchImpl(`${endpoint}/api/tags`);
    if (!response.ok) {
      return Object.freeze({ reachable: false, endpoint, models: Object.freeze([]), evidence: Object.freeze(['OLLAMA_TAGS_NON_OK']) });
    }
    const body = await response.json() as { models?: Array<{ name?: string; size?: number; modified_at?: string }> };
    const models = (body.models ?? [])
      .filter((model) => typeof model.name === 'string' && model.name.trim().length > 0)
      .map((model) => Object.freeze({ name: model.name as string, sizeBytes: model.size, modifiedAt: model.modified_at }));
    return Object.freeze({ reachable: true, endpoint, models: Object.freeze(models), evidence: Object.freeze([`OLLAMA_TAGS:${models.length}`]) });
  } catch {
    return Object.freeze({ reachable: false, endpoint, models: Object.freeze([]), evidence: Object.freeze(['OLLAMA_TAGS_UNREACHABLE']) });
  }
}

export function selectCodingModel(models: readonly OllamaModelInfo[]): OllamaModelInfo | null {
  const preferred = ['qwen2.5-coder:7b', 'gpt-oss:20b'];
  for (const name of preferred) {
    const found = models.find((model) => model.name === name);
    if (found) return found;
  }
  return models.find((model) => /coder|code/i.test(model.name)) ?? models[0] ?? null;
}
