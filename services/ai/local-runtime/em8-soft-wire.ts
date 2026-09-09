/**
 * 62L-EM8 soft-wire — EM4 / EL8 / EM5 / EM6 / EM7 + EM1 Home Base (presence only).
 *
 * Soft-wire ≠ VERIFIED ≠ production authorization.
 * Does not invent missing predecessors.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EM8_LOCKS } from './em8-honesty';

export type Presence = 'PRESENT' | 'ABSENT';

export type Em8SoftWireProbe = {
  em1HomeBase: Presence;
  em1HomeBasePathChecked: string;
  em4Envelope: Presence;
  el8ModelLoadEvidence: Presence;
  em5AmdWindowsMl: Presence;
  em6NvidiaCandidate: Presence;
  em7DeviceNeutralRouter: Presence;
  el9ResourceGovernor: Presence;
  em3Registry: Presence;
  l4AutonomyEnabled: false;
  note: string;
  locks: typeof EM8_LOCKS;
};

const here = dirname(fileURLToPath(import.meta.url));

function present(rel: string): Presence {
  return existsSync(join(here, rel)) ? 'PRESENT' : 'ABSENT';
}

function presentAny(rels: string[]): Presence {
  return rels.some((rel) => present(rel) === 'PRESENT') ? 'PRESENT' : 'ABSENT';
}

function presentOutside(rel: string): { presence: Presence; path: string } {
  const path = join(here, '..', rel);
  return { presence: existsSync(path) ? 'PRESENT' : 'ABSENT', path };
}

/**
 * Soft-wire predecessor modules by filesystem presence.
 * EM4/EM5/EM6/EM7 may be ABSENT on park-and-implement bases — that is honest.
 */
export function probeEm8SoftWires(): Em8SoftWireProbe {
  const em1 =
    presentOutside('local-brain/agent-home-base-contract.ts').presence ===
    'PRESENT'
      ? presentOutside('local-brain/agent-home-base-contract.ts')
      : presentOutside('local-brain/agent-home-base-types.ts');

  return {
    em1HomeBase: em1.presence,
    em1HomeBasePathChecked: em1.path,
    em4Envelope: presentAny([
      '../local-brain/em4-message-envelope.ts',
      '../local-brain/em4-message-envelope-types.ts',
      'em4-compute-envelope.ts',
      'cpu-gpu-npu-message-envelope.ts',
    ]),
    el8ModelLoadEvidence: presentAny([
      'model-load-evidence.ts',
      'el8-honesty.ts',
      'evidence-ledger.ts',
    ]),
    em5AmdWindowsMl: presentAny([
      'em5-honesty.ts',
      'em5-soft-wire.ts',
      'onnx-windows-ml-adapter.ts',
    ]),
    em6NvidiaCandidate: presentAny([
      'em6-honesty.ts',
      'em6-soft-wire.ts',
      'nvidia-runtime-adapter.ts',
    ]),
    em7DeviceNeutralRouter: presentAny([
      'em7-honesty.ts',
      'em7-soft-wire.ts',
      'device-neutral-inference-router.ts',
    ]),
    el9ResourceGovernor: present('resource-governor.ts'),
    em3Registry: presentAny([
      'universal-compute-registry.ts',
      'em3-honesty.ts',
    ]),
    l4AutonomyEnabled: EM8_LOCKS.L4_AUTONOMY_ENABLED,
    note:
      'Presence soft-wire only; requested≠actual; CPU fallback≠NPU/GPU verify; does not imply EM1/EM4/EL8/EM5/EM6/EM7 VERIFIED or production authorization.',
    locks: EM8_LOCKS,
  };
}

export function em8SoftWireSnapshot(): Em8SoftWireProbe {
  return probeEm8SoftWires();
}
