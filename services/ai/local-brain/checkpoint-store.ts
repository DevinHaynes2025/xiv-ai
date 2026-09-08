import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { LocalCheckpoint, LocalTask } from './types';

type LocalBrainState = {
  version: 1;
  tasks: LocalTask[];
  checkpoints: LocalCheckpoint[];
};

const EMPTY_STATE: LocalBrainState = { version: 1, tasks: [], checkpoints: [] };

export class LocalCheckpointStore {
  constructor(private readonly filePath = join(process.cwd(), '.xiv-local', 'brain-state.json')) {}

  private async readState(): Promise<LocalBrainState> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, 'utf8')) as LocalBrainState;
      if (parsed.version !== 1 || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.checkpoints)) {
        return structuredClone(EMPTY_STATE);
      }
      return parsed;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return structuredClone(EMPTY_STATE);
      throw error;
    }
  }

  private async writeState(state: LocalBrainState) {
    await mkdir(dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    await rename(tempPath, this.filePath);
  }

  async listTasks() {
    return (await this.readState()).tasks;
  }

  async saveTask(task: LocalTask) {
    const state = await this.readState();
    const index = state.tasks.findIndex((item) => item.id === task.id);
    if (index >= 0) state.tasks[index] = task;
    else state.tasks.push(task);
    await this.writeState(state);
  }

  async checkpoint(entry: LocalCheckpoint) {
    const state = await this.readState();
    state.checkpoints.push(entry);
    if (state.checkpoints.length > 5000) state.checkpoints = state.checkpoints.slice(-5000);
    await this.writeState(state);
  }

  async checkpointsFor(taskId: string) {
    return (await this.readState()).checkpoints.filter((entry) => entry.taskId === taskId);
  }
}
