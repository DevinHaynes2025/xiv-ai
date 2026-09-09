/**
 * 62L-EM3 soft-wire — EL5–EL9 + prior EM local-model truth rules.
 *
 * Presence alone does not imply VERIFIED or production authorization.
 * Soft-wires: DETECTED≠VERIFIED; silent fallback≠accelerator verify.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EM_LOCKS } from './honesty';
import { EL5_LOCKS } from './amd-gpu-capability';
import { EL6_LOCKS } from './amd-npu-capability';
import { EL7_LOCKS } from './el7-locks';
import { EL8_LOCKS } from './el8-honesty';
import { EL9_LOCKS } from './resource-governor';
import { EM3_LOCKS } from './em3-honesty';
import { isDetectedEqualVerified } from './capability-truth';

const here = dirname(fileURLToPath(import.meta.url));

export type Presence = 'PRESENT' | 'ABSENT';

export type Em3SoftWireProbe = {
  el5GpuModule: Presence;
  el6NpuModule: Presence;
  el7InferenceAdapter: Presence;
  el7SoftWire: Presence;
  el8ModelLoadEvidence: Presence;
  el9ResourceGovernor: Presence;
  emHonesty: Presence;
  emModelVerification: Presence;
  capabilityTruth: Presence;
  localBrainHomeOptional: Presence;
  detectedEqualsVerified: false;
  silentFallbackEqualsAcceleratorVerified: false;
  l4AutonomyEnabled: false;
  guardianRlsTenantBoundariesIntact: true;
  universeBoundariesIntact: true;
  note: string;
  locks: {
    el5: typeof EL5_LOCKS;
    el6: typeof EL6_LOCKS;
    el7: typeof EL7_LOCKS;
    el8: typeof EL8_LOCKS;
    el9: typeof EL9_LOCKS;
    em: typeof EM_LOCKS;
    em3: typeof EM3_LOCKS;
  };
};

function present(rel: string): Presence {
  return existsSync(join(here, rel)) ? 'PRESENT' : 'ABSENT';
}

function presentOutside(rel: string): Presence {
  return existsSync(join(here, '..', rel)) ? 'PRESENT' : 'ABSENT';
}

export function probeEm3SoftWires(): Em3SoftWireProbe {
  return {
    el5GpuModule: present('amd-gpu-capability.ts'),
    el6NpuModule: present('amd-npu-capability.ts'),
    el7InferenceAdapter: present('inference-adapter.ts'),
    el7SoftWire: present('el7-soft-wire.ts'),
    el8ModelLoadEvidence: present('model-load-evidence.ts'),
    el9ResourceGovernor: present('resource-governor.ts'),
    emHonesty: present('honesty.ts'),
    emModelVerification: present('model-verification.ts'),
    capabilityTruth: present('capability-truth.ts'),
    localBrainHomeOptional: presentOutside('local-brain'),
    detectedEqualsVerified: isDetectedEqualVerified(),
    silentFallbackEqualsAcceleratorVerified:
      EM3_LOCKS.SILENT_FALLBACK_EQ_ACCELERATOR_VERIFIED,
    l4AutonomyEnabled: EM3_LOCKS.L4_AUTONOMY_ENABLED,
    guardianRlsTenantBoundariesIntact:
      EM3_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT,
    universeBoundariesIntact: EM3_LOCKS.UNIVERSE_BOUNDARIES_INTACT,
    note:
      'Presence soft-wire only; DETECTED≠VERIFIED; silent fallback≠accelerator verify; does not imply EL/EM VERIFIED or production authorization.',
    locks: {
      el5: EL5_LOCKS,
      el6: EL6_LOCKS,
      el7: EL7_LOCKS,
      el8: EL8_LOCKS,
      el9: EL9_LOCKS,
      em: EM_LOCKS,
      em3: EM3_LOCKS,
    },
  };
}
