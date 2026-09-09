/**
 * 62L-EM7 soft-wire — EM3 registry, EM4 envelope, EM5 AMD, EM6 NVIDIA,
 * EL9 governor, EM1 home base (presence only).
 *
 * Presence alone ≠ VERIFIED ≠ production authorization.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EM7_LOCKS } from './em7-honesty';
import { EL9_LOCKS } from './resource-governor';
import { EM_LOCKS } from './honesty';
import { isDetectedEqualVerified } from './capability-truth';

const here = dirname(fileURLToPath(import.meta.url));

export type Presence = 'PRESENT' | 'ABSENT';

export type Em7SoftWireProbe = {
  em3Registry: Presence;
  em3Honesty: Presence;
  em4Envelope: Presence;
  em5AmdWindowsMl: Presence;
  em6NvidiaRuntime: Presence;
  el9ResourceGovernor: Presence;
  em1HomeBase: Presence;
  emHonesty: Presence;
  capabilityTruth: Presence;
  workloadRouter: Presence;
  inferencePolicy: Presence;
  detectedEqualsVerified: false;
  l4AutonomyEnabled: false;
  silentPrivacyDowngrade: false;
  automaticCapacityPurchase: false;
  crossTenantDataMoveForFasterCompute: false;
  guardianRlsTenantBoundariesIntact: true;
  universeBoundariesIntact: true;
  note: string;
  locks: {
    em7: typeof EM7_LOCKS;
    el9: typeof EL9_LOCKS;
    em: typeof EM_LOCKS;
  };
  pathsChecked: Record<string, string>;
};

function present(rel: string): Presence {
  return existsSync(join(here, rel)) ? 'PRESENT' : 'ABSENT';
}

function firstPresent(rels: string[]): { presence: Presence; path: string } {
  for (const rel of rels) {
    const abs = rel.startsWith('../') ? join(here, rel) : join(here, rel);
    if (existsSync(abs)) return { presence: 'PRESENT', path: abs };
  }
  const fallback = rels[0].startsWith('../') ? join(here, rels[0]) : join(here, rels[0]);
  return { presence: 'ABSENT', path: fallback };
}

/**
 * Soft-wire predecessors by filesystem presence.
 * ABSENT is honest on park-and-implement bases (EM3–EM6 may still be landing).
 */
export function probeEm7SoftWires(): Em7SoftWireProbe {
  const em3 = firstPresent([
    './universal-compute-registry.ts',
    './em3-universal-compute-registry.ts',
  ]);
  const em3Honesty = firstPresent(['./em3-honesty.ts']);
  const em4 = firstPresent([
    '../local-brain/em4-message-envelope.ts',
    '../local-brain/em4-message-envelope-types.ts',
    './em4-message-envelope.ts',
    './em4-cpu-gpu-npu-message-envelope.ts',
  ]);
  const em5 = firstPresent([
    './em5-amd-windows-ml-path.ts',
    './em5-honesty.ts',
    './onnx-windows-ml-adapter.ts',
    './amd-gpu-capability.ts',
  ]);
  const em6 = firstPresent([
    './nvidia-runtime-adapter.ts',
    './em6-nvidia-runtime-path.ts',
    './em6-honesty.ts',
    './em6-soft-wire.ts',
  ]);
  const em1 = firstPresent([
    '../local-brain/agent-home-base-contract.ts',
    '../local-brain/agent-home-base-types.ts',
    './agent-home-base-contract.ts',
  ]);

  return {
    em3Registry: em3.presence,
    em3Honesty: em3Honesty.presence,
    em4Envelope: em4.presence,
    em5AmdWindowsMl: em5.presence,
    em6NvidiaRuntime: em6.presence,
    el9ResourceGovernor: present('resource-governor.ts'),
    em1HomeBase: em1.presence,
    emHonesty: present('honesty.ts'),
    capabilityTruth: present('capability-truth.ts'),
    workloadRouter: present('workload-router.ts'),
    inferencePolicy: present('inference-policy.ts'),
    detectedEqualsVerified: isDetectedEqualVerified(),
    l4AutonomyEnabled: EM7_LOCKS.L4_AUTONOMY_ENABLED,
    silentPrivacyDowngrade: EM7_LOCKS.SILENT_PRIVACY_DOWNGRADE,
    automaticCapacityPurchase: EM7_LOCKS.AUTOMATIC_CAPACITY_PURCHASE,
    crossTenantDataMoveForFasterCompute:
      EM7_LOCKS.CROSS_TENANT_DATA_MOVE_FOR_FASTER_COMPUTE,
    guardianRlsTenantBoundariesIntact:
      EM7_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT,
    universeBoundariesIntact: EM7_LOCKS.UNIVERSE_BOUNDARIES_INTACT,
    note:
      'Presence soft-wire only; EM3/EM4/EM5/EM6/EM1 may be ABSENT on EL9 base; does not imply VERIFIED or production authorization; EM8 owns return-receipt acceptance.',
    locks: {
      em7: EM7_LOCKS,
      el9: EL9_LOCKS,
      em: EM_LOCKS,
    },
    pathsChecked: {
      em3Registry: em3.path,
      em3Honesty: em3Honesty.path,
      em4Envelope: em4.path,
      em5AmdWindowsMl: em5.path,
      em6NvidiaRuntime: em6.path,
      el9: join(here, 'resource-governor.ts'),
      em1HomeBase: em1.path,
    },
  };
}
