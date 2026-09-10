export const OPENAI_LOCAL_GUARDRAILS = {
  chatgptProductOfflineClaimAllowed: false,
  openWeightLocalInferenceAllowed: true,
  productionMutationAllowed: false,
  networkRequired: false,
} as const;

export interface OpenAiLocalConfig {
  endpoint: string;
  model: string;
  provider: 'OLLAMA';
  offline: true;
}

export const DEFAULT_OPENAI_LOCAL: OpenAiLocalConfig = {
  endpoint: 'http://127.0.0.1:11434',
  model: 'gpt-oss:20b',
  provider: 'OLLAMA',
  offline: true,
};

export interface LocalModelProbe {
  reachable: boolean;
  modelConfigured: string;
  chatgptProduct: false;
  openWeightModel: true;
}

export async function probeOpenAiLocal(input?: {
  config?: OpenAiLocalConfig;
  fetchImpl?: (url: string, init?: { method?: string }) => Promise<{ ok: boolean }>;
}): Promise<LocalModelProbe> {
  const config = input?.config ?? DEFAULT_OPENAI_LOCAL;
  if (!input?.fetchImpl) {
    return { reachable: false, modelConfigured: config.model, chatgptProduct: false, openWeightModel: true };
  }
  try {
    const result = await input.fetchImpl(`${config.endpoint}/api/tags`, { method: 'GET' });
    return { reachable: result.ok, modelConfigured: config.model, chatgptProduct: false, openWeightModel: true };
  } catch {
    return { reachable: false, modelConfigured: config.model, chatgptProduct: false, openWeightModel: true };
  }
}
