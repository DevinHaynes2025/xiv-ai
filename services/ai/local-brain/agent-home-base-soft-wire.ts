/**
 * 62L-EM1 soft-wire — local-runtime heartbeat / EL9 governor + optional #157 EM home base.
 *
 * Presence checks only. Soft-wire ≠ VERIFIED ≠ production authorization.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type Em1SoftWireSnapshot = {
  localRuntimeHeartbeatApiPresent: boolean;
  localRuntimeHeartbeatPathChecked: string;
  localRuntimeResourceGovernorPresent: boolean;
  localRuntimeGovernorPathChecked: string;
  /** #157 EM agent compute home base module — soft-wire if landed on disk. */
  em157HomeBasePresent: boolean;
  em157HomeBasePathChecked: string;
  note: string;
};

function hereDir(): string {
  return dirname(fileURLToPath(import.meta.url));
}

/**
 * Soft-wire local-runtime heartbeat + resource governor.
 * Soft-wire sealed #157 EM agent compute home base (`agent-compute-home-base.ts`).
 */
export function em1SoftWireSnapshot(): Em1SoftWireSnapshot {
  const localRuntimeRoot = join(hereDir(), '../local-runtime');
  const heartbeatPath = join(localRuntimeRoot, 'heartbeat-api.ts');
  const governorPath = join(localRuntimeRoot, 'resource-governor.ts');

  // Canonical #157 path first (sealed on cursor/62l-em-agent-compute-home-base-4059 @ b1040f41).
  const em157Candidates = [
    join(hereDir(), 'agent-compute-home-base.ts'),
    join(hereDir(), 'agent-compute-home-base-runtime.ts'),
    join(hereDir(), 'agent-compute-home-base-types.ts'),
    join(hereDir(), 'em-agent-compute-home-base.ts'),
    join(localRuntimeRoot, 'em-agent-compute-home-base.ts'),
    join(localRuntimeRoot, 'agent-compute-home-base.ts'),
  ];
  const em157Hit = em157Candidates.find((p) => existsSync(p)) ?? em157Candidates[0];

  return {
    localRuntimeHeartbeatApiPresent: existsSync(heartbeatPath),
    localRuntimeHeartbeatPathChecked: heartbeatPath,
    localRuntimeResourceGovernorPresent: existsSync(governorPath),
    localRuntimeGovernorPathChecked: governorPath,
    em157HomeBasePresent: existsSync(em157Hit),
    em157HomeBasePathChecked: em157Hit,
    note:
      'Presence soft-wire only; #157 sealed tip b1040f41 soft-wired when agent-compute-home-base.ts present. Does not imply VERIFIED or production authorization. L4_AUTONOMY_ENABLED=false.',
  };
}
