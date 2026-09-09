import type { LocalModelCompletion, LocalModelStatus } from './types';

const DEFAULT_ENDPOINT = 'http://127.0.0.1:11434';

function endpoint() {
  return (process.env.XIV_LOCAL_MODEL_URL ?? DEFAULT_ENDPOINT).replace(/\/$/, '');
}

function configuredModel() {
  const value = process.env.XIV_LOCAL_MODEL?.trim();
  return value || null;
}

async function withTimeout<T>(work: (signal: AbortSignal) => Promise<T>, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await work(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

export async function localModelStatus(): Promise<LocalModelStatus> {
  const model = configuredModel();
  if (!model) {
    return {
      provider: 'ollama',
      endpoint: endpoint(),
      model: null,
      availability: 'UNAVAILABLE',
      reason: 'XIV_LOCAL_MODEL is not configured.',
    };
  }

  try {
    const response = await withTimeout((signal) => fetch(`${endpoint()}/api/tags`, { signal }));
    if (!response.ok) throw new Error(`status_${response.status}`);
    const body = (await response.json()) as { models?: Array<{ name?: string; model?: string }> };
    const available = body.models?.some((item) => item.name === model || item.model === model) ?? false;
    return {
      provider: 'ollama',
      endpoint: endpoint(),
      model,
      availability: available ? 'AVAILABLE' : 'UNAVAILABLE',
      reason: available ? 'Local model is installed and reachable.' : 'Configured local model is not installed.',
    };
  } catch {
    return {
      provider: 'ollama',
      endpoint: endpoint(),
      model,
      availability: 'UNAVAILABLE',
      reason: 'Local model runtime is not reachable.',
    };
  }
}

export async function completeWithLocalModel(prompt: string): Promise<LocalModelCompletion> {
  const status = await localModelStatus();
  if (status.availability !== 'AVAILABLE' || !status.model) {
    throw new Error(`local_model_unavailable:${status.reason}`);
  }

  const response = await withTimeout(
    (signal) => fetch(`${status.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: status.model, prompt, stream: false }),
      signal,
    }),
    Number(process.env.XIV_LOCAL_MODEL_TIMEOUT_MS ?? 120_000),
  );
  if (!response.ok) throw new Error(`local_model_http_${response.status}`);
  const body = (await response.json()) as { response?: unknown };
  if (typeof body.response !== 'string') throw new Error('local_model_malformed_response');
  return { text: body.response, model: status.model, provider: 'ollama' };
}
