import { createHash, randomUUID } from 'node:crypto';
import { buildCollaborationPlan, type CollaboratorReceipt } from './local-model-collaboration-bus';

export const HEARTBEAT_FABRIC_POLICY = Object.freeze({
  endpoint: 'http://127.0.0.1:11434', model: 'qwen2.5-coder:7b',
  receiptTtlMs: 120_000, maxResponseBytes: 65_536, maxOutputTokens: 256,
  maxRequestsPerRound: 3, retries: 0, remoteCallsEnabled: false,
  productionMutationAllowed: false, modelWeightMutationAllowed: false,
});
export type HeartbeatRequest = (url: string, init: RequestInit) => Promise<Response>;
export interface HeartbeatOptions {
  tenantId: string;
  request?: HeartbeatRequest;
  clock?: () => number;
  timeoutMs?: number;
}
export interface AgentToolHeartbeat {
  tenantId: string;
  observedAt: string;
  status: 'OFFLINE' | 'DEGRADED' | 'VERIFIED';
  modelDiscovered: boolean;
  inferenceSucceeded: boolean;
  outputHash?: string;
  receipt?: CollaboratorReceipt;
  reason: string;
  // A responding loopback endpoint is NOT an attestation of the host's network policy.
  cloudDisabledVerified: false;
  privateDataAuthorized: false;
}
const hash = (text: string): string => createHash('sha256').update(text).digest('hex');
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
function clockMs(options: HeartbeatOptions): number {
  const value = (options.clock ?? Date.now)();
  if (!Number.isFinite(value) || !Number.isFinite(new Date(value).getTime())) throw new Error('invalid clock');
  return value;
}
function validateOptions(options: HeartbeatOptions): void {
  if (typeof options.tenantId !== 'string' || !options.tenantId.trim() || options.tenantId.length > 128) throw new Error('tenantId required');
  if (options.timeoutMs !== undefined && (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs < 1 || options.timeoutMs > 120_000)) throw new Error('timeout must be 1..120000 milliseconds');
  clockMs(options);
}
async function boundedJson(options: HeartbeatOptions, path: '/api/tags' | '/api/generate', body?: object): Promise<Record<string, unknown>> {
  const request = options.request ?? ((url, init) => fetch(url, init));
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = options.timeoutMs ?? (body ? 120_000 : 5_000);
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new Error('probe deadline exceeded')); }, timeout);
  });
  try {
    return await Promise.race([deadline, (async () => {
      const response = await request(`${HEARTBEAT_FABRIC_POLICY.endpoint}${path}`, {
        method: body ? 'POST' : 'GET', redirect: 'error', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (response.status !== 200 || response.redirected || !response.body) throw new Error('unexpected HTTP response');
      if (!(response.headers.get('content-type') ?? '').includes('application/json')) throw new Error('JSON response required');
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8', { fatal: true });
      let bytes = 0; let text = '';
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          bytes += chunk.value.byteLength;
          if (bytes > HEARTBEAT_FABRIC_POLICY.maxResponseBytes) throw new Error('response limit exceeded');
          text += decoder.decode(chunk.value, { stream: true });
        }
        text += decoder.decode();
      } finally { void reader.cancel().catch(() => {}); }
      const parsed: unknown = JSON.parse(text);
      if (!record(parsed)) throw new Error('JSON object required');
      return parsed;
    })()]);
  } finally { if (timer !== undefined) clearTimeout(timer); controller.abort(); }
}
function generationBody(prompt: string): object {
  return { model: HEARTBEAT_FABRIC_POLICY.model, prompt, stream: false,
    options: { temperature: 0, num_predict: HEARTBEAT_FABRIC_POLICY.maxOutputTokens }, keep_alive: '1m' };
}
function generatedText(value: Record<string, unknown>): string {
  if (value.model !== HEARTBEAT_FABRIC_POLICY.model || value.done !== true || typeof value.response !== 'string'
    || typeof value.eval_count !== 'number' || !Number.isSafeInteger(value.eval_count) || value.eval_count < 1
    || !value.response.trim() || value.response.length > 16_384) throw new Error('completed inference evidence required');
  return value.response.trim();
}

/** Executes only a fixed, nonsensitive synthetic probe; never pulls models or starts services. */
export async function probeOllamaHeartbeat(options: HeartbeatOptions): Promise<AgentToolHeartbeat> {
  validateOptions(options);
  let discovered = false; let reachable = false;
  try {
    const tags = await boundedJson(options, '/api/tags'); reachable = true;
    if (!Array.isArray(tags.models)) throw new Error('model list required');
    const model = tags.models.find((m: unknown) => record(m) && m.name === HEARTBEAT_FABRIC_POLICY.model);
    // Do not choose an arbitrary first model; a local server can proxy cloud models.
    if (!record(model) || !record(model.details) || model.details.format !== 'gguf'
      || model.remote_host || model.remote_model || !/^[a-f0-9]{64}$/i.test(String(model.digest ?? ''))) throw new Error('approved local GGUF model metadata required');
    discovered = true;
    const text = generatedText(await boundedJson(options, '/api/generate', generationBody('Reply exactly: XIV_OLLAMA_OK')));
    if (text !== 'XIV_OLLAMA_OK') throw new Error('probe response did not match');
    const now = clockMs(options); const observedAt = new Date(now).toISOString();
    const outputHash = hash(text);
    const receipt: CollaboratorReceipt = Object.freeze({
      collaboratorId: 'OLLAMA_LOCAL', tenantId: options.tenantId, status: 'VERIFIED',
      receiptRef: `heartbeat:${randomUUID()}`, endpoint: HEARTBEAT_FABRIC_POLICY.endpoint,
      providerId: 'ollama', modelId: HEARTBEAT_FABRIC_POLICY.model,
      verifiedAt: observedAt, expiresAt: new Date(now + HEARTBEAT_FABRIC_POLICY.receiptTtlMs).toISOString(),
      deviceLocalCli: false, modelExecutionLocal: true, productionAuthority: false, rawPrivateDataAllowed: false,
    });
    return Object.freeze({ tenantId: options.tenantId, observedAt, status: 'VERIFIED', modelDiscovered: true,
      inferenceSucceeded: true, outputHash, receipt, reason: 'synthetic inference succeeded; private-data authorization is separate',
      cloudDisabledVerified: false, privateDataAuthorized: false });
  } catch {
    // Never copy raw provider errors, credentials, or arbitrary remote text into an operational receipt.
    return Object.freeze({ tenantId: options.tenantId, observedAt: new Date(clockMs(options)).toISOString(),
      status: reachable ? 'DEGRADED' : 'OFFLINE', modelDiscovered: discovered, inferenceSucceeded: false,
      reason: reachable ? 'model, inference, or response validation failed' : 'loopback probe unavailable or invalid',
      cloudDisabledVerified: false, privateDataAuthorized: false });
  }
}

export const MASTER_PLAN_MEETING_AGENDA = [
  'Use tenant-isolated memory and least-privilege tools (Master Page 27).',
  'Separate recommendation, authorization and execution (Master Page 30).',
  'Record independent reviews and dissent; human makes consequential decisions (Master Page 52).',
  'Evaluate model output before production changes (Master Page 117).',
  'Version, evaluate and approve learning with rollback (Master Page 118).',
] as const;

/** One bounded LOCAL meeting contribution. Remote reviewers remain pending, never impersonated. */
export async function runHeartbeatMeeting(options: HeartbeatOptions & { masterPlanSha256: string }) {
  if (!/^[a-f0-9]{64}$/i.test(options.masterPlanSha256)) throw new Error('master plan SHA-256 required');
  const heartbeat = await probeOllamaHeartbeat(options);
  const meetingId = randomUUID();
  const task = { taskId: meetingId, tenantId: options.tenantId, objective: 'Review the public XIV engineering safety agenda',
    kind: 'REVIEW' as const, securityClass: 'ORDINARY' as const, evidenceRefs: [`sha256:${options.masterPlanSha256}`],
    humanApprovalRequired: true, externalReviewApproved: false };
  // This is the runtime caller missing from 12D-88. It enforces the repaired gate before generation.
  const plan = buildCollaborationPlan({ task, collaboratorReceipts: heartbeat.receipt ? [heartbeat.receipt] : [],
    nowMs: clockMs(options), networkAvailable: false });
  let memo: string | undefined; let status: 'BLOCKED' | 'FAILED' | 'AWAITING_REVIEW' = 'BLOCKED';
  if (plan.assignments.some(a => a.collaboratorId === 'OLLAMA_LOCAL' && a.enabled)) {
    try {
      memo = generatedText(await boundedJson(options, '/api/generate', generationBody(
        'You are preparing one XIV engineering review contribution. This is a synthetic, ordinary-data sandbox. '
        + 'Give a brief recommendation, one risk, one test, and one disagreement. Do not claim you executed tools, '
        + 'changed code, learned new weights, or spoke with other agents. Agenda:\n' + MASTER_PLAN_MEETING_AGENDA.join('\n'))));
      status = 'AWAITING_REVIEW';
    } catch { status = 'FAILED'; }
  }
  return Object.freeze({ schemaVersion: 1, meetingId, tenantId: options.tenantId, generatedAt: new Date(clockMs(options)).toISOString(),
    masterPlanSha256: options.masterPlanSha256, policyScope: 'cited master-plan engineering requirements, not whole-plan certification',
    status, heartbeat, plan, localContribution: memo ? { providerId: 'ollama', modelId: HEARTBEAT_FABRIC_POLICY.model,
      outputHash: hash(memo), ordinaryMemo: memo, trustedInstruction: false } : null,
    reviewRequests: [
      { tool: 'CLAUDE_CODE', status: 'PENDING', providerId: null, modelId: null },
      { tool: 'GROK_XAI', status: 'PENDING', providerId: null, modelId: null },
    ],
    remoteCallsMade: 0, allAgentsAligned: false, meetingComplete: false, learningPromoted: false,
    humanDecision: 'REQUIRED', cloudExecutionVerified: false, quantumHardwareVerified: false,
    productionMutationAllowed: false, modelWeightMutationAllowed: false });
}
