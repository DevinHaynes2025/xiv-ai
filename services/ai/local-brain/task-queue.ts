import { randomUUID } from 'node:crypto';

import { LocalCheckpointStore } from './checkpoint-store';
import type { LocalTask } from './types';

function now() {
  return new Date().toISOString();
}

export class LocalTaskQueue {
  constructor(private readonly store = new LocalCheckpointStore()) {}

  async enqueue(input: Pick<LocalTask, 'kind' | 'prompt'> & { maxAttempts?: number; maxModelCalls?: number }) {
    const at = now();
    const task: LocalTask = {
      id: `local_${randomUUID()}`,
      kind: input.kind,
      prompt: input.prompt,
      state: 'queued',
      createdAt: at,
      updatedAt: at,
      attempts: 0,
      maxAttempts: Math.max(1, Math.min(input.maxAttempts ?? 3, 5)),
      budget: {
        maxModelCalls: Math.max(1, Math.min(input.maxModelCalls ?? 3, 10)),
        modelCallsUsed: 0,
      },
    };
    await this.store.saveTask(task);
    await this.store.checkpoint({ taskId: task.id, at, state: task.state, attempt: 0, summary: 'Task queued locally.' });
    return task;
  }

  async next() {
    const tasks = await this.store.listTasks();
    return tasks.find((task) => task.state === 'queued' || task.state === 'waiting_local_model') ?? null;
  }

  async save(task: LocalTask) {
    task.updatedAt = now();
    await this.store.saveTask(task);
  }

  async counts() {
    const tasks = await this.store.listTasks();
    return {
      queued: tasks.filter((task) => task.state === 'queued' || task.state === 'waiting_local_model').length,
      running: tasks.filter((task) => task.state === 'running').length,
    };
  }
}
