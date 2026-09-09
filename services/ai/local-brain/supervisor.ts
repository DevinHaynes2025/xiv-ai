import { LocalCheckpointStore } from './checkpoint-store';
import { completeWithLocalModel, localModelStatus } from './local-model';
import { evaluateOfflineTask } from './offline-policy';
import { LocalTaskQueue } from './task-queue';
import type { LocalBrainStatus, LocalTask, LocalTaskRequirement } from './types';

const store = new LocalCheckpointStore();
const queue = new LocalTaskQueue(store);
let stopped = false;

function now() {
  return new Date().toISOString();
}

const DEFAULT_REQUIREMENTS: LocalTaskRequirement = {
  needsInternet: false,
  needsCloudProvider: false,
  needsExternalFreshness: false,
  needsProductionWrite: false,
  needsPermissionChange: false,
  classification: 'internal',
};

export async function localBrainStatus(): Promise<LocalBrainStatus> {
  const counts = await queue.counts();
  return {
    mode: process.env.XIV_LOCAL_ONLY === 'true' ? 'LOCAL_ONLY' : 'HYBRID',
    localExecutionEnabled: process.env.XIV_LOCAL_AGENT_EXECUTION !== 'false',
    productionGitPushEnabled: false,
    productionDatabaseWriteEnabled: false,
    autoProductionDeployEnabled: false,
    model: await localModelStatus(),
    queuedTasks: counts.queued,
    runningTasks: counts.running,
  };
}

export async function enqueueLocalTask(kind: LocalTask['kind'], prompt: string, requirements?: LocalTaskRequirement) {
  if (!prompt.trim()) throw new Error('local_task_prompt_required');
  return queue.enqueue({ kind, prompt: prompt.trim(), requirements });
}

async function checkpointPolicyStop(task: LocalTask, state: 'waiting_data' | 'unavailable' | 'denied', summary: string) {
  task.state = state;
  await queue.save(task);
  await store.checkpoint({
    taskId: task.id,
    at: now(),
    state: task.state,
    attempt: task.attempts,
    summary,
    nextAction: state === 'waiting_data' ? 'Resume when approved fresh data is available.' : 'Human review or an approved capability change is required.',
  });
}

async function runOne(task: LocalTask) {
  if (task.attempts >= task.maxAttempts || task.budget.modelCallsUsed >= task.budget.maxModelCalls) {
    task.state = 'blocked';
    await queue.save(task);
    await store.checkpoint({
      taskId: task.id,
      at: now(),
      state: task.state,
      attempt: task.attempts,
      summary: 'Task stopped by the local retry or model-call budget.',
      nextAction: 'Human review required.',
    });
    return;
  }

  if (process.env.XIV_LOCAL_ONLY === 'true') {
    const decision = evaluateOfflineTask(task.requirements ?? DEFAULT_REQUIREMENTS);
    if (!decision.allowed) {
      const state = decision.state === 'WAITING_DATA' ? 'waiting_data' : decision.state === 'UNAVAILABLE' ? 'unavailable' : 'denied';
      await checkpointPolicyStop(task, state, decision.reason);
      return;
    }
  }

  const status = await localModelStatus();
  if (status.availability !== 'AVAILABLE') {
    task.state = 'waiting_local_model';
    await queue.save(task);
    await store.checkpoint({
      taskId: task.id,
      at: now(),
      state: task.state,
      attempt: task.attempts,
      summary: status.reason,
      nextAction: 'Start/install the configured local model runtime, then resume.',
    });
    return;
  }

  task.state = 'running';
  task.attempts += 1;
  task.budget.modelCallsUsed += 1;
  await queue.save(task);

  try {
    const result = await completeWithLocalModel(
      `You are a bounded XIV local ${task.kind} agent. Do not deploy production, change permissions, buy services, expose secrets, or claim actions you did not perform. Produce a concise work product and explicit next steps.\n\nTASK:\n${task.prompt}`,
    );
    task.state = 'completed';
    await queue.save(task);
    await store.checkpoint({
      taskId: task.id,
      at: now(),
      state: task.state,
      attempt: task.attempts,
      summary: result.text,
      evidence: [`provider:${result.provider}`, `model:${result.model}`],
    });
  } catch (error) {
    task.state = task.attempts >= task.maxAttempts ? 'failed' : 'queued';
    await queue.save(task);
    await store.checkpoint({
      taskId: task.id,
      at: now(),
      state: task.state,
      attempt: task.attempts,
      summary: `Local execution failed: ${(error as Error).message}`,
      nextAction: task.state === 'queued' ? 'Retry within bounded budget.' : 'Human review required.',
    });
  }
}

export async function runLocalBrainOnce() {
  if (process.env.XIV_LOCAL_AGENT_EXECUTION === 'false') return false;
  const task = await queue.next();
  if (!task) return false;
  await runOne(task);
  return true;
}

export async function runLocalBrainLoop(intervalMs = Number(process.env.XIV_LOCAL_POLL_MS ?? 5000)) {
  stopped = false;
  while (!stopped) {
    const worked = await runLocalBrainOnce();
    await new Promise((resolve) => setTimeout(resolve, worked ? 25 : Math.max(1000, intervalMs)));
  }
}

export function stopLocalBrainLoop() {
  stopped = true;
}
