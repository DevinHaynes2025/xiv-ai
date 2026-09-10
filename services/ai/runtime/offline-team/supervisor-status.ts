import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { SupervisorSnapshot } from './live-supervisor';

export const SUPERVISOR_STATUS_GUARDRAILS = {
  localOnly: true,
  secretsAllowed: false,
  productionMutationAllowed: false,
  defaultRelativePath: '.xiv-runtime/offline-supervisor-status.json',
} as const;

export async function writeSupervisorSnapshot(rootDir: string, snapshot: SupervisorSnapshot): Promise<string> {
  const target = join(rootDir, SUPERVISOR_STATUS_GUARDRAILS.defaultRelativePath);
  const temp = `${target}.tmp`;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(temp, JSON.stringify(snapshot, null, 2), { encoding: 'utf8' });
  await rename(temp, target);
  return target;
}
