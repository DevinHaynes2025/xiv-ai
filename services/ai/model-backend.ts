import { ServiceError } from './auth';
import {
  completeGeminiStructured,
  isGeminiKeyConfigured,
  type GeminiTurnInput,
} from './gemini-provider';
import { parseStructuredOutput } from './schema';
import type { ModelProviderId, StructuredAgentOutput } from './types';

export type ModelBackendId = 'gemini' | 'openai' | 'ollama';

const OLLAMA_TIMEOUT_MS = 60_000;

const SYSTEM_INSTRUCTION = [
  'You are XIV Executive Agent, a business decision-support assistant.',
  'You may analyze and recommend. You may not execute consequential actions automatically.',
  'Never move money, change payroll, terminate accounts, alter enterprise permissions, execute large purchases, or change production systems.',
  'If the user asks for those, set riskLevel to high or critical, requiresApproval to true, and do not treat the action as executed.',
  'Use only the provided mock or approved business context. Do not invent live ledger, payroll, or production-system facts.',
  'Return only a JSON object with keys: summary, recommendation, riskLevel, requiresApproval, evidence (string array), optional proposedAction {type, description}.',
  'Do not wrap the JSON in markdown.',
].join(' ');

function envFlag(name: string) {
  const v = process.env[name]?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export function configuredModelBackend(): 'auto' | ModelBackendId {
  const raw = (process.env.MODEL_BACKEND?.trim().toLowerCase() || 'auto') as string;
  if (raw === 'gemini' || raw === 'openai' || raw === 'ollama' || raw === 'auto') return raw;
  return 'auto';
}

function ollamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434').replace(/\/$/, '');
}

function ollamaModel() {
  return process.env.OLLAMA_MODEL?.trim() || 'qwen2.5-coder:7b';
}

function openaiKey() {
  return process.env.OPENAI_API_KEY?.trim() || '';
}

function openaiModel() {
  return process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
}

export async function isOllamaReachable(baseUrl = ollamaBaseUrl()): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(2_000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Resolve which backend to call. Does not fabricate availability. */
export async function resolveModelBackend(): Promise<ModelBackendId> {
  const mode = configuredModelBackend();
  if (mode !== 'auto') return mode;

  const preferLocal = envFlag('OFFLINE_PREFER_LOCAL');
  if (preferLocal) {
    if (await isOllamaReachable()) return 'ollama';
    if (isGeminiKeyConfigured()) return 'gemini';
    if (openaiKey()) return 'openai';
    throw new ServiceError(
      'waiting_provider',
      503,
      'WAITING_PROVIDER: no local or cloud model backend is available.',
    );
  }

  if (isGeminiKeyConfigured()) return 'gemini';
  if (await isOllamaReachable()) return 'ollama';
  if (openaiKey()) return 'openai';
  throw new ServiceError('waiting_provider', 503, 'WAITING_PROVIDER: no model backend is available.');
}

export async function completeStructuredTurn(input: GeminiTurnInput): Promise<{
  output: StructuredAgentOutput;
  backend: ModelBackendId;
  providerLabel: ModelProviderId;
}> {
  const backend = await resolveModelBackend();
  if (backend === 'gemini') {
    if (!isGeminiKeyConfigured()) {
      throw new ServiceError('waiting_provider', 503, 'WAITING_PROVIDER: Gemini is not configured.');
    }
    return {
      output: await completeGeminiStructured(input),
      backend,
      providerLabel: 'gemini',
    };
  }
  if (backend === 'openai') {
    return {
      output: await completeOpenAiStructured(input),
      backend,
      providerLabel: 'openai',
    };
  }
  return {
    output: await completeOllamaStructured(input),
    backend,
    providerLabel: 'ollama',
  };
}

async function completeOpenAiStructured(input: GeminiTurnInput): Promise<StructuredAgentOutput> {
  const key = openaiKey();
  if (!key) {
    throw new ServiceError('waiting_provider', 503, 'WAITING_PROVIDER: OpenAI is not configured.');
  }

  const userPayload = {
    message: input.userMessage,
    role: input.role,
    organizationContext: input.organizationContext ?? null,
    approvedDataContext: input.approvedDataContext ?? null,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: openaiModel(),
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          {
            role: 'user',
            content: `User request and optional mock business context:\n${JSON.stringify(userPayload)}`,
          },
        ],
      }),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new ServiceError('not_configured', 503, 'The AI service is not configured.');
      }
      throw new ServiceError('unavailable', 503, 'WAITING_PROVIDER: OpenAI is unavailable.');
    }
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content ?? '';
    return parseJsonStructured(text);
  } catch (caught) {
    if (caught instanceof ServiceError) throw caught;
    throw new ServiceError('unavailable', 503, 'WAITING_PROVIDER: OpenAI is unavailable.');
  } finally {
    clearTimeout(timer);
  }
}

async function completeOllamaStructured(input: GeminiTurnInput): Promise<StructuredAgentOutput> {
  const base = ollamaBaseUrl();
  if (!(await isOllamaReachable(base))) {
    throw new ServiceError(
      'waiting_provider',
      503,
      'WAITING_PROVIDER: Ollama is not reachable on the local machine.',
    );
  }

  const userPayload = {
    message: input.userMessage,
    role: input.role,
    organizationContext: input.organizationContext ?? null,
    approvedDataContext: input.approvedDataContext ?? null,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  try {
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel(),
        stream: false,
        format: 'json',
        options: { temperature: 0.3 },
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          {
            role: 'user',
            content: `User request and optional mock business context:\n${JSON.stringify(userPayload)}`,
          },
        ],
      }),
    });
    if (!response.ok) {
      throw new ServiceError('unavailable', 503, 'WAITING_PROVIDER: Ollama returned an error.');
    }
    const payload = (await response.json()) as { message?: { content?: string } };
    const text = payload.message?.content ?? '';
    return parseJsonStructured(text);
  } catch (caught) {
    if (caught instanceof ServiceError) throw caught;
    throw new ServiceError('unavailable', 503, 'WAITING_PROVIDER: Ollama is unavailable.');
  } finally {
    clearTimeout(timer);
  }
}

function parseJsonStructured(text: string): StructuredAgentOutput {
  if (!text.trim()) {
    throw new ServiceError('malformed', 422, 'The assistant returned an unusable response. Try again.');
  }
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    throw new ServiceError('malformed', 422, 'The assistant returned an unusable response. Try again.');
  }
  return parseStructuredOutput(parsed);
}
