import { stat } from 'node:fs/promises';
import { join } from 'node:path';

import { localModelStatus } from './local-model';

export type LocalBrainHealth = {
  ok: boolean;
  model: Awaited<ReturnType<typeof localModelStatus>>;
  localStateDirectory: 'AVAILABLE' | 'MISSING';
  notes: string[];
};

export async function checkLocalBrainHealth(root = process.cwd()): Promise<LocalBrainHealth> {
  const model = await localModelStatus();
  let localStateDirectory: LocalBrainHealth['localStateDirectory'] = 'MISSING';
  try {
    await stat(join(root, '.xiv-local'));
    localStateDirectory = 'AVAILABLE';
  } catch {
    localStateDirectory = 'MISSING';
  }

  const notes: string[] = [];
  if (model.availability !== 'AVAILABLE') notes.push(`Local model ${model.availability}: ${model.reason}`);
  if (localStateDirectory === 'MISSING') notes.push('Local state directory has not been created yet; it is created when local tasks/checkpoints/learning are written.');

  return {
    ok: model.availability === 'AVAILABLE',
    model,
    localStateDirectory,
    notes,
  };
}
