/**
 * 62L-EM5 soft-wire — EM4 envelope, EM3 registry, EL7 adapter,
 * EL5/EL6 AMD candidates, prior EM ONNX adapter, EL9 governor.
 *
 * Presence alone ≠ VERIFIED ≠ production authorization.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EM5_LOCKS } from './em5-honesty';
import { EM_LOCKS } from './honesty';
import { EL5_LOCKS } from './amd-gpu-capability';
import { EL6_LOCKS } from './amd-npu-capability';
import { EL7_LOCKS } from './el7-locks';
import { EL8_LOCKS } from './el8-honesty';
import { EL9_LOCKS } from './resource-governor';
import { isDetectedEqualVerified } from './capability-truth';

export type Presence = 'PRESENT' | 'ABSENT';

export type Em5SoftWireProbe = {
  em4EnvelopeTypes: Presence;
  em4EnvelopeModule: Presence;
  em3RegistryTypes: Presence;
  em3RegistryModule: Presence;
  em3Honesty: Presence;
  el5GpuModule: Presence;
  el6NpuModule: Presence;
  el7InferenceAdapter: Presence;
  el8ModelLoadEvidence: Presence;
  el8SilentFallbackHonesty: Presence;
  el9ResourceGovernor: Presence;
  emOnnxWindowsMlAdapter: Presence;
  emHonesty: Presence;
  localBrainHomeOptional: Presence;
  detectedEqualsVerified: false;
  silentFallbackEqualsAcceleratorVerified: false;
  l4AutonomyEnabled: false;
  guardianRlsTenantBoundariesIntact: true;
  universeBoundariesIntact: true;
  humanApprovalRequiredIntact: true;
  note: string;
  locks: {
    em5: typeof EM5_LOCKS;
    em: typeof EM_LOCKS;
    el5: typeof EL5_LOCKS;
    el6: typeof EL6_LOCKS;
    el7: typeof EL7_LOCKS;
    el8: typeof EL8_LOCKS;
    el9: typeof EL9_LOCKS;
  };
  pathsChecked: Record<string, string>;
};

const here = dirname(fileURLToPath(import.meta.url));

function present(rel: string): Presence {
  return existsSync(join(here, rel)) ? 'PRESENT' : 'ABSENT';
}

function presentOutside(rel: string): Presence {
  return existsSync(join(here, '..', rel)) ? 'PRESENT' : 'ABSENT';
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
 * Soft-wire predecessor modules. ABSENT is honest — EM5 remains self-governing.
 */
export function probeEm5SoftWires(): Em5SoftWireProbe {
  const em4Types = firstPresent([
    '../local-brain/em4-message-envelope-types.ts',
    './em4-message-envelope-types.ts',
  ]);
  const em4Module = firstPresent([
    '../local-brain/em4-message-envelope.ts',
    './em4-message-envelope.ts',
    './em4-cpu-gpu-npu-message-envelope.ts',
  ]);
  const em3Types = firstPresent(['./universal-compute-registry-types.ts']);
  const em3Module = firstPresent(['./universal-compute-registry.ts']);
  const em3Honesty = firstPresent(['./em3-honesty.ts']);

  return {
    em4EnvelopeTypes: em4Types.presence,
    em4EnvelopeModule: em4Module.presence,
    em3RegistryTypes: em3Types.presence,
    em3RegistryModule: em3Module.presence,
    em3Honesty: em3Honesty.presence,
    el5GpuModule: present('amd-gpu-capability.ts'),
    el6NpuModule: present('amd-npu-capability.ts'),
    el7InferenceAdapter: present('inference-adapter.ts'),
    el8ModelLoadEvidence: present('model-load-evidence.ts'),
    el8SilentFallbackHonesty: present('el8-honesty.ts'),
    el9ResourceGovernor: present('resource-governor.ts'),
    emOnnxWindowsMlAdapter: present('onnx-windows-ml-adapter.ts'),
    emHonesty: present('honesty.ts'),
    localBrainHomeOptional: presentOutside('local-brain'),
    detectedEqualsVerified: isDetectedEqualVerified(),
    silentFallbackEqualsAcceleratorVerified:
      EM5_LOCKS.SILENT_FALLBACK_EQ_ACCELERATOR_VERIFIED,
    l4AutonomyEnabled: EM5_LOCKS.L4_AUTONOMY_ENABLED,
    guardianRlsTenantBoundariesIntact:
      EM5_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT,
    universeBoundariesIntact: EM5_LOCKS.UNIVERSE_BOUNDARIES_INTACT,
    humanApprovalRequiredIntact: EM5_LOCKS.HUMAN_APPROVAL_REQUIRED_INTACT,
    note:
      'Presence soft-wire only; DETECTED/SUPPORTED≠VERIFIED; silent CPU fallback must be receipt-flagged; does not imply EM3/EM4/EL live VERIFIED or ASUS measurement.',
    locks: {
      em5: EM5_LOCKS,
      em: EM_LOCKS,
      el5: EL5_LOCKS,
      el6: EL6_LOCKS,
      el7: EL7_LOCKS,
      el8: EL8_LOCKS,
      el9: EL9_LOCKS,
    },
    pathsChecked: {
      em4EnvelopeTypes: em4Types.path,
      em4EnvelopeModule: em4Module.path,
      em3RegistryTypes: em3Types.path,
      em3RegistryModule: em3Module.path,
      em3Honesty: em3Honesty.path,
      el7: join(here, 'inference-adapter.ts'),
      el9: join(here, 'resource-governor.ts'),
      onnx: join(here, 'onnx-windows-ml-adapter.ts'),
    },
  };
}
