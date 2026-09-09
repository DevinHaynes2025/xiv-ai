/**
 * Soft-wire EL7 `runLocalInference` when present.
 * Absence is honest — does not invent an inference runtime.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export type El7SoftWireResult = {
  present: boolean;
  modulePathChecked: string;
  exportName: 'runLocalInference';
  callable: boolean;
  note: string;
};

const CANDIDATE_RELATIVE_PATHS = [
  './inference-adapter.ts',
  './el7-windows-local-runtime-adapter.ts',
  './windows-local-runtime-adapter.ts',
  './run-local-inference.ts',
  '../local-brain/run-local-inference.ts',
] as const;

/**
 * Probe for EL7 runLocalInference without requiring it.
 * Never auto-downloads models or elevates privileges.
 */
export function softWireRunLocalInference(): El7SoftWireResult {
  const here = dirname(fileURLToPath(import.meta.url));

  for (const rel of CANDIDATE_RELATIVE_PATHS) {
    const modulePathChecked = join(here, rel);
    if (!existsSync(modulePathChecked)) continue;

    try {
      const require = createRequire(import.meta.url);
      // tsx/node may resolve .ts; treat presence of export as soft-wire success.
      const mod = require(modulePathChecked) as { runLocalInference?: unknown };
      const callable = typeof mod.runLocalInference === 'function';
      return {
        present: true,
        modulePathChecked,
        exportName: 'runLocalInference',
        callable,
        note: callable
          ? 'EL7 runLocalInference soft-wired (callable).'
          : 'EL7 module present but runLocalInference export missing/not callable.',
      };
    } catch {
      return {
        present: true,
        modulePathChecked,
        exportName: 'runLocalInference',
        callable: false,
        note: 'EL7 candidate module exists but could not be loaded in this environment.',
      };
    }
  }

  return {
    present: false,
    modulePathChecked: join(here, CANDIDATE_RELATIVE_PATHS[0]),
    exportName: 'runLocalInference',
    callable: false,
    note: 'EL7 runLocalInference not present — soft-wire no-op; EL8 evidence gate remains authoritative.',
  };
}
