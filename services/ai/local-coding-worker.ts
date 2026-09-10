/**
 * Provider-neutral local coding worker: heartbeat + bounded task receipt.
 * Story 62L-EZ / GitHub #175.
 *
 * OFFLINE_AGENT_VERIFIED is never hard-coded true. It is computed from live
 * heartbeat checks plus a successful smoke receipt recorded in-process.
 */

import os from 'node:os';

export type TruthState =
  | 'UNKNOWN'
  | 'DOCUMENTED'
  | 'DETECTED'
  | 'SUPPORTED'
  | 'VERIFIED'
  | 'NOT_TESTED'
  | 'DEGRADED'
  | 'UNAVAILABLE';

export type LocalTaskReceipt = {
  timestamp: string;
  model: string;
  runtime: 'ollama';
  latencyMs: number;
  memory: {
    totalBytes: number;
    freeBytes: number;
  } | null;
  result: 'ok' | 'error' | 'unavailable';
  promptPreview: string;
  responsePreview: string;
  evalCount: number | null;
  error: string | null;
  requestedDevice: string;
  actualDevice: string;
  actualDeviceState: TruthState;
};

export type LocalWorkerHeartbeat = {
  timestamp: string;
  connectivity: 'online' | 'offline';
  provider: 'ollama';
  baseUrl: string;
  ollamaVersion: string | null;
  ollamaVersionState: TruthState;
  tagsReachable: boolean;
  tagsState: TruthState;
  modelId: string;
  modelPresent: boolean;
  modelState: TruthState;
  availableModels: string[];
  requestedDevice: string;
  actualDevice: string;
  actualDeviceState: TruthState;
  memory: {
    totalBytes: number;
    freeBytes: number;
  };
  lastSmoke: LocalTaskReceipt | null;
  /** Computed from live checks + successful smoke — never a static true constant. */
  offlineAgentVerified: boolean;
  offlineAgentVerifiedReason: string;
};

export type LocalWorkerSmokeResponse = {
  heartbeat: LocalWorkerHeartbeat;
  receipt: LocalTaskReceipt;
  offlineAgentVerified: boolean;
  offlineAgentVerifiedReason: string;
};

const DEFAULT_BASE = 'http://127.0.0.1:11434';
const DEFAULT_MODEL = 'qwen2.5-coder:7b';
const TAGS_TIMEOUT_MS = 3_000;
const VERSION_TIMEOUT_MS = 3_000;
const SMOKE_TIMEOUT_MS = 90_000;
const SMOKE_PROMPT = 'Reply with exactly: OK';
const MAX_PREVIEW = 240;

/** In-process last successful/attempted smoke; not persisted across restarts. */
let lastSmokeReceipt: LocalTaskReceipt | null = null;

function ollamaBaseUrl(): string {
  return (process.env.OLLAMA_BASE_URL?.trim() || DEFAULT_BASE).replace(/\/$/, '');
}

function configuredModel(): string {
  return process.env.OLLAMA_MODEL?.trim() || DEFAULT_MODEL;
}

function requestedDevice(): string {
  return (
    process.env.XIV_REQUESTED_DEVICE?.trim() ||
    process.env.OLLAMA_GPU_DEVICE?.trim() ||
    'auto'
  );
}

/**
 * Honest device reporting: Node/Ollama HTTP does not prove Vulkan/DirectML/GPU.
 * Without an explicit host probe env, actual device stays UNKNOWN / NOT_TESTED.
 */
function resolveActualDevice(): { actualDevice: string; actualDeviceState: TruthState } {
  const probed = process.env.XIV_ACTUAL_DEVICE?.trim();
  const probedState = process.env.XIV_ACTUAL_DEVICE_STATE?.trim().toUpperCase();
  if (probed && probedState) {
    const allowed: TruthState[] = [
      'UNKNOWN',
      'DOCUMENTED',
      'DETECTED',
      'SUPPORTED',
      'VERIFIED',
      'NOT_TESTED',
      'DEGRADED',
      'UNAVAILABLE',
    ];
    if ((allowed as string[]).includes(probedState)) {
      return { actualDevice: probed, actualDeviceState: probedState as TruthState };
    }
  }
  if (probed) {
    return { actualDevice: probed, actualDeviceState: 'DOCUMENTED' };
  }
  return { actualDevice: 'UNKNOWN', actualDeviceState: 'NOT_TESTED' };
}

function preview(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= MAX_PREVIEW) return t;
  return `${t.slice(0, MAX_PREVIEW)}...`;
}

function memorySnapshot() {
  return { totalBytes: os.totalmem(), freeBytes: os.freemem() };
}

async function fetchJson<T>(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<{
  ok: boolean;
  status: number;
  body: T | null;
  error: string | null;
}> {
  const timeoutMs = init?.timeoutMs ?? TAGS_TIMEOUT_MS;
  const { timeoutMs: _t, ...rest } = init ?? {};
  try {
    const res = await fetch(url, {
      ...rest,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      return { ok: false, status: res.status, body: null, error: `http_${res.status}` };
    }
    const body = (await res.json()) as T;
    return { ok: true, status: res.status, body, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'fetch_failed';
    return { ok: false, status: 0, body: null, error: msg };
  }
}

async function fetchText(url: string, timeoutMs: number): Promise<{
  ok: boolean;
  text: string | null;
  error: string | null;
}> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return { ok: false, text: null, error: `http_${res.status}` };
    const text = (await res.text()).trim();
    return { ok: true, text, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'fetch_failed';
    return { ok: false, text: null, error: msg };
  }
}

function computeVerified(args: {
  tagsReachable: boolean;
  modelPresent: boolean;
  smoke: LocalTaskReceipt | null;
}): { verified: boolean; reason: string } {
  if (!args.tagsReachable) {
    return { verified: false, reason: 'Ollama /api/tags not reachable' };
  }
  if (!args.modelPresent) {
    return { verified: false, reason: `Configured model not listed in /api/tags: ${configuredModel()}` };
  }
  if (!args.smoke) {
    return {
      verified: false,
      reason: 'No smoke receipt in this process yet; POST /v1/local-worker/smoke required',
    };
  }
  if (args.smoke.result !== 'ok') {
    return {
      verified: false,
      reason: `Last smoke result=${args.smoke.result}${args.smoke.error ? `: ${args.smoke.error}` : ''}`,
    };
  }
  return {
    verified: true,
    reason: `Heartbeat tags+model ok and smoke ok at ${args.smoke.timestamp} (latencyMs=${args.smoke.latencyMs})`,
  };
}

export async function collectLocalWorkerHeartbeat(): Promise<LocalWorkerHeartbeat> {
  const baseUrl = ollamaBaseUrl();
  const modelId = configuredModel();
  const { actualDevice, actualDeviceState } = resolveActualDevice();
  const reqDevice = requestedDevice();

  const versionHit = await fetchText(`${baseUrl}/api/version`, VERSION_TIMEOUT_MS);
  let ollamaVersion: string | null = null;
  let ollamaVersionState: TruthState = 'UNAVAILABLE';
  if (versionHit.ok && versionHit.text) {
    try {
      const parsed = JSON.parse(versionHit.text) as { version?: string };
      ollamaVersion = parsed.version ?? versionHit.text;
    } catch {
      ollamaVersion = versionHit.text;
    }
    ollamaVersionState = 'DETECTED';
  } else {
    ollamaVersionState = 'UNKNOWN';
  }

  const tagsHit = await fetchJson<{ models?: { name?: string }[] }>(`${baseUrl}/api/tags`, {
    timeoutMs: TAGS_TIMEOUT_MS,
  });
  const tagsReachable = tagsHit.ok;
  const availableModels = (tagsHit.body?.models ?? [])
    .map((m) => m.name ?? '')
    .filter(Boolean);
  const modelPresent = availableModels.some(
    (name) =>
      name === modelId || name.startsWith(`${modelId}:`) || modelId.startsWith(`${name}:`),
  );

  const { verified, reason } = computeVerified({
    tagsReachable,
    modelPresent,
    smoke: lastSmokeReceipt,
  });

  return {
    timestamp: new Date().toISOString(),
    connectivity: tagsReachable ? 'online' : 'offline',
    provider: 'ollama',
    baseUrl,
    ollamaVersion,
    ollamaVersionState:
      tagsReachable && ollamaVersionState === 'UNKNOWN' ? 'DETECTED' : ollamaVersionState,
    tagsReachable,
    tagsState: tagsReachable ? 'DETECTED' : 'UNAVAILABLE',
    modelId,
    modelPresent,
    modelState: !tagsReachable ? 'UNAVAILABLE' : modelPresent ? 'DETECTED' : 'UNAVAILABLE',
    availableModels,
    requestedDevice: reqDevice,
    actualDevice,
    actualDeviceState,
    memory: memorySnapshot(),
    lastSmoke: lastSmokeReceipt,
    offlineAgentVerified: verified,
    offlineAgentVerifiedReason: reason,
  };
}

export async function runLocalWorkerSmoke(prompt = SMOKE_PROMPT): Promise<LocalWorkerSmokeResponse> {
  const baseUrl = ollamaBaseUrl();
  const model = configuredModel();
  const { actualDevice, actualDeviceState } = resolveActualDevice();
  const reqDevice = requestedDevice();
  const started = Date.now();
  const mem = memorySnapshot();

  const generate = await fetchJson<{
    response?: string;
    eval_count?: number;
    error?: string;
  }>(`${baseUrl}/api/generate`, {
    method: 'POST',
    timeoutMs: SMOKE_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0, num_predict: 16 },
    }),
  });

  const latencyMs = Date.now() - started;
  let receipt: LocalTaskReceipt;

  if (!generate.ok || !generate.body) {
    receipt = {
      timestamp: new Date().toISOString(),
      model,
      runtime: 'ollama',
      latencyMs,
      memory: mem,
      result: generate.status === 0 ? 'unavailable' : 'error',
      promptPreview: preview(prompt),
      responsePreview: '',
      evalCount: null,
      error: generate.error ?? 'generate_failed',
      requestedDevice: reqDevice,
      actualDevice,
      actualDeviceState,
    };
  } else {
    const responseText = (generate.body.response ?? '').trim();
    const okish = responseText.length > 0;
    receipt = {
      timestamp: new Date().toISOString(),
      model,
      runtime: 'ollama',
      latencyMs,
      memory: mem,
      result: okish ? 'ok' : 'error',
      promptPreview: preview(prompt),
      responsePreview: preview(responseText),
      evalCount: typeof generate.body.eval_count === 'number' ? generate.body.eval_count : null,
      error: okish ? null : generate.body.error ?? 'empty_response',
      requestedDevice: reqDevice,
      actualDevice,
      actualDeviceState,
    };
  }

  lastSmokeReceipt = receipt;
  const heartbeat = await collectLocalWorkerHeartbeat();
  return {
    heartbeat,
    receipt,
    offlineAgentVerified: heartbeat.offlineAgentVerified,
    offlineAgentVerifiedReason: heartbeat.offlineAgentVerifiedReason,
  };
}

/** Test helper — clear in-process smoke state. */
export function resetLocalWorkerSmokeStateForTests() {
  lastSmokeReceipt = null;
}