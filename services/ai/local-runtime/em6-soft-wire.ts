/**
 * 62L-EM6 soft-wire — EM3 / EM4 / EL8 / EM5 / EL9 / local-brain home-base (presence only).
 *
 * Soft-wire does not invent missing predecessors or claim them VERIFIED.
 * CPU fallback honesty soft-wires EM4/EL8/EM5 patterns when present.
 * Resource governor soft-wires EL9 when present.
 * Post-EM3-rebase: universal compute registry soft-wire when present.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EM6_LOCKS } from './em6-honesty';
import { EL8_LOCKS } from './el8-honesty';
import { EL9_LOCKS } from './resource-governor';
import { isDetectedEqualVerified } from './capability-truth';

const here = dirname(fileURLToPath(import.meta.url));

export type Presence = 'PRESENT' | 'ABSENT';

export type Em6SoftWireProbe = {
  el8ModelLoadEvidence: Presence;
  el8Honesty: Presence;
  el9ResourceGovernor: Presence;
  em3UniversalRegistry: Presence;
  em4EnvelopeCandidate: Presence;
  em5AmdWindowsMlCandidate: Presence;
  localBrainHomeOptional: Presence;
  capabilityTruth: Presence;
  nvidiaAdapter: Presence;
  detectedEqualsVerified: false;
  silentFallbackEqualsNvidiaVerified: false;
  cpuFallbackEqualsNvidiaVerified: false;
  l4AutonomyEnabled: false;
  guardianRlsTenantBoundariesIntact: true;
  universeBoundariesIntact: true;
  note: string;
  locks: {
    em6: typeof EM6_LOCKS;
    el8: typeof EL8_LOCKS;
    el9: typeof EL9_LOCKS;
  };
};

function present(rel: string): Presence {
  return existsSync(join(here, rel)) ? 'PRESENT' : 'ABSENT';
}

function presentOutside(rel: string): Presence {
  return existsSync(join(here, '..', rel)) ? 'PRESENT' : 'ABSENT';
}

function presentAny(rels: string[]): Presence {
  return rels.some((rel) => present(rel) === 'PRESENT') ? 'PRESENT' : 'ABSENT';
}

/**
 * Soft-wire predecessor modules by filesystem presence.
 * EM4 / EM5 may be ABSENT when only EM3 tip is available — that is honest.
 */
export function probeEm6SoftWires(): Em6SoftWireProbe {
  return {
    el8ModelLoadEvidence: present('model-load-evidence.ts'),
    el8Honesty: present('el8-honesty.ts'),
    el9ResourceGovernor: present('resource-governor.ts'),
    em3UniversalRegistry: presentAny([
      'universal-compute-registry.ts',
      'em3-honesty.ts',
      'em3-soft-wire.ts',
    ]),
    em4EnvelopeCandidate: presentAny([
      'em4-compute-envelope.ts',
      'cpu-gpu-npu-message-envelope.ts',
      'agent-compute-envelope.ts',
    ]) === 'PRESENT'
      ? 'PRESENT'
      : presentOutside('local-brain/em4-message-envelope.ts') === 'PRESENT' ||
          presentOutside('local-brain/em4-message-envelope-types.ts') === 'PRESENT'
        ? 'PRESENT'
        : 'ABSENT',
    em5AmdWindowsMlCandidate: presentAny([
      'em5-amd-windows-ml-path.ts',
      'em5-honesty.ts',
      'amd-windows-ml-runtime.ts',
      'amd-windows-ml-adapter-path.ts',
      'onnx-windows-ml-adapter.ts',
    ]),
    localBrainHomeOptional: presentOutside('local-brain'),
    capabilityTruth: present('capability-truth.ts'),
    nvidiaAdapter: present('nvidia-runtime-adapter.ts'),
    detectedEqualsVerified: isDetectedEqualVerified(),
    silentFallbackEqualsNvidiaVerified:
      EM6_LOCKS.SILENT_FALLBACK_EQ_NVIDIA_VERIFIED,
    cpuFallbackEqualsNvidiaVerified: EM6_LOCKS.CPU_FALLBACK_EQ_NVIDIA_VERIFIED,
    l4AutonomyEnabled: EM6_LOCKS.L4_AUTONOMY_ENABLED,
    guardianRlsTenantBoundariesIntact:
      EM6_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT,
    universeBoundariesIntact: EM6_LOCKS.UNIVERSE_BOUNDARIES_INTACT,
    note:
      'Presence soft-wire only; DETECTED≠VERIFIED; CPU/silent fallback≠NVIDIA verify; does not imply EM3/EM4/EM5/EL8/EL9 VERIFIED or production authorization.',
    locks: {
      em6: EM6_LOCKS,
      el8: EL8_LOCKS,
      el9: EL9_LOCKS,
    },
  };
}
