import { createHash } from 'node:crypto';
import { OfflineWorkQueue } from './work-queue';
import { RecoveryJournal } from './recovery-journal';

export interface OllamaGenerateResponse {
  response?: string;
  done?: boolean;
  model?: string;
}

export interface OllamaJobExecutionResult {
  jobId: string;
  model: string;
  ok: boolean;
  output: string;
  evidence: readonly string[];
  outputHash: string;
}

export const OLLAMA_EXECUTOR_GUARDRAILS = {
  endpoint: 'http://127.0.0.1:11434',
  defaultModel: 'qwen2.5-coder:7b',
  maxJobsPerTick: 1,
  productionMutationAllowed: false,
  destructiveDatabaseActionAllowed: false,
  autonomousDeployAllowed: false,
  networkRequired: false,
} as const;

function hashOutput(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export async function executeOneOllamaJob(input: {
  queue: OfflineWorkQueue;
  journal: RecoveryJournal;
  model?: string;
  endpoint?: string;
  now?: Date;
  fetchImpl?: (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; json(): Promise<unknown> }>;
}): Promise<OllamaJobExecutionResult | null> {
  const now = input.now ?? new Date();
  const model = input.model ?? OLLAMA_EXECUTOR_GUARDRAILS.defaultModel;
  const endpoint = input.endpoint ?? OLLAMA_EXECUTOR_GUARDRAILS.endpoint;
  const owner = `OLLAMA_BUILDER:${model}`;
  const leased = input.queue.lease(owner, now, 5 * 60_000, OLLAMA_EXECUTOR_GUARDRAILS.maxJobsPerTick);
  const job = leased[0];
  if (!job) return null;

  input.journal.append({
    eventId: `leased:${job.id}:${now.toISOString()}`,
    workItemId: job.id,
    kind: 'LEASED',
    actor: owner,
    at: now.toISOString(),
    evidence: `MODEL:${model}`,
  });

  if (!input.fetchImpl) {
    input.queue.fail(job.id, owner, now);
    input.journal.append({
      eventId: `failed:${job.id}:${now.toISOString()}`,
      workItemId: job.id,
      kind: 'FAILED',
      actor: owner,
      at: now.toISOString(),
      evidence: 'NO_FETCH_IMPLEMENTATION',
    });
    return { jobId: job.id, model, ok: false, output: '', evidence: Object.freeze(['NO_FETCH_IMPLEMENTATION']), outputHash: hashOutput('') };
  }

  const prompt = [
    'You are XIV Local Coder, an offline bounded coding worker.',
    'Do not deploy, do not modify production databases, do not claim tests passed unless executed.',
    `Story: ${job.storyId}`,
    `Objective: ${job.objective}`,
    'Return a concise implementation plan or code patch proposal plus tests to run.',
  ].join('\n');

  try {
    const response = await input.fetchImpl(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
    });
    if (!response.ok) throw new Error('OLLAMA_GENERATE_NON_OK');
    const body = await response.json() as OllamaGenerateResponse;
    const output = typeof body.response === 'string' ? body.response : '';
    if (!output.trim()) throw new Error('OLLAMA_EMPTY_RESPONSE');
    const outputHash = hashOutput(output);
    input.queue.complete(job.id, owner, now);
    const evidence = Object.freeze([`MODEL:${model}`, `OUTPUT_SHA256:${outputHash}`, 'OLLAMA_LOCAL_GENERATE']);
    input.journal.append({
      eventId: `completed:${job.id}:${now.toISOString()}`,
      workItemId: job.id,
      kind: 'COMPLETED',
      actor: owner,
      at: now.toISOString(),
      evidence: evidence.join('|'),
    });
    return Object.freeze({ jobId: job.id, model, ok: true, output, evidence, outputHash });
  } catch (error) {
    input.queue.fail(job.id, owner, now);
    const reason = error instanceof Error ? error.message : 'UNKNOWN_OLLAMA_FAILURE';
    input.journal.append({
      eventId: `failed:${job.id}:${now.toISOString()}`,
      workItemId: job.id,
      kind: 'FAILED',
      actor: owner,
      at: now.toISOString(),
      evidence: reason,
    });
    return Object.freeze({ jobId: job.id, model, ok: false, output: '', evidence: Object.freeze([reason]), outputHash: hashOutput('') });
  }
}
