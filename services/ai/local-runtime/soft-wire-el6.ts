/**
 * 62L-EL6 — Soft-wire EL5 AMD GPU capability candidate + EL6 NPU candidate.
 *
 * Preserves Guardian / RLS / tenant boundaries and human approval posture.
 * Does not tip-land, provision cloud, or route to external models.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EL5_LOCKS } from './amd-gpu-capability';
import { EL6_LOCKS } from './amd-npu-capability';

const here = dirname(fileURLToPath(import.meta.url));

export type El6SoftWireProbe = {
  el5GpuModule: 'PRESENT' | 'ABSENT';
  el5BenchmarkModule: 'PRESENT' | 'ABSENT';
  el5EmHonestyModule: 'PRESENT' | 'ABSENT';
  el6NpuModule: 'PRESENT' | 'ABSENT';
  capabilityTruthModule: 'PRESENT' | 'ABSENT';
  npuPresenceProbeModule: 'PRESENT' | 'ABSENT';
  npuBenchmarkModule: 'PRESENT' | 'ABSENT';
  l4AutonomyEnabled: false;
  el5L4AutonomyEnabled: false;
  guardianRlsTenantBoundariesIntact: true;
  humanApprovalIntact: true;
  cloudProvisioningForbidden: true;
  externalModelRoutingForbidden: true;
  locks: {
    el5: typeof EL5_LOCKS;
    el6: typeof EL6_LOCKS;
  };
};

function present(rel: string): 'PRESENT' | 'ABSENT' {
  return existsSync(join(here, rel)) ? 'PRESENT' : 'ABSENT';
}

export function probeEl6SoftWires(): El6SoftWireProbe {
  return {
    el5GpuModule: present('amd-gpu-capability.ts'),
    el5BenchmarkModule: present('benchmark.ts'),
    el5EmHonestyModule: present('honesty.ts'),
    el6NpuModule: present('amd-npu-capability.ts'),
    capabilityTruthModule: present('capability-truth.ts'),
    npuPresenceProbeModule: present('npu-presence-probe.ts'),
    npuBenchmarkModule: present('npu-benchmark.ts'),
    l4AutonomyEnabled: EL6_LOCKS.L4_AUTONOMY_ENABLED,
    el5L4AutonomyEnabled: EL5_LOCKS.L4_AUTONOMY_ENABLED,
    guardianRlsTenantBoundariesIntact: EL6_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT,
    humanApprovalIntact: EL6_LOCKS.HUMAN_APPROVAL_REQUIRED_INTACT,
    cloudProvisioningForbidden: EL6_LOCKS.CLOUD_PROVISIONING_FORBIDDEN,
    externalModelRoutingForbidden: EL6_LOCKS.EXTERNAL_MODEL_ROUTING_FORBIDDEN,
    locks: { el5: EL5_LOCKS, el6: EL6_LOCKS },
  };
}
