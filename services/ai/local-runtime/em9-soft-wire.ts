/**
 * 62L-EM9 soft-wire — EM3 registry, EM7 router, EM8 receipts, EL9 governor.
 *
 * Presence alone does not imply VERIFIED or production authorization.
 * EM7 / EM8 may be ABSENT on this park-and-implement base; soft-wire remains honest.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EL9_LOCKS } from './resource-governor';
import { EM3_LOCKS } from './em3-honesty';
import { EM9_LOCKS } from './em9-honesty';

const here = dirname(fileURLToPath(import.meta.url));

export type Presence = 'PRESENT' | 'ABSENT';

export type Em9SoftWireProbe = {
  em3Registry: Presence;
  em3Honesty: Presence;
  em7Router: Presence;
  em7Honesty: Presence;
  em8Receipts: Presence;
  em8Honesty: Presence;
  el9ResourceGovernor: Presence;
  classicalQuantBaseline: Presence;
  detectedEqualsVerified: false;
  simulationExecutesWorkload: false;
  l4AutonomyEnabled: false;
  guardianRlsTenantBoundariesIntact: true;
  universeBoundariesIntact: true;
  fabricateCloudPrices: false;
  autonomousPurchasing: false;
  note: string;
  locks: {
    em3: typeof EM3_LOCKS;
    el9: typeof EL9_LOCKS;
    em9: typeof EM9_LOCKS;
  };
};

function present(rel: string): Presence {
  return existsSync(join(here, rel)) ? 'PRESENT' : 'ABSENT';
}

/**
 * Soft-wire probe for EM9 predecessors.
 * EM7 device-neutral router and EM8 return receipts are optional at this tip;
 * ABSENT is reported honestly rather than inventing modules.
 */
export function probeEm9SoftWires(): Em9SoftWireProbe {
  return {
    em3Registry: present('universal-compute-registry.ts'),
    em3Honesty: present('em3-honesty.ts'),
    em7Router:
      present('device-neutral-inference-router.ts') === 'PRESENT' ||
      present('em7-device-neutral-inference-router.ts') === 'PRESENT'
        ? 'PRESENT'
        : 'ABSENT',
    em7Honesty: present('em7-honesty.ts'),
    em8Receipts:
      present('compute-return-receipt.ts') === 'PRESENT' ||
      present('em8-compute-return-receipt.ts') === 'PRESENT'
        ? 'PRESENT'
        : 'ABSENT',
    em8Honesty: present('em8-honesty.ts'),
    el9ResourceGovernor: present('resource-governor.ts'),
    classicalQuantBaseline: present('classical-quant-benchmark.ts'),
    detectedEqualsVerified: false,
    simulationExecutesWorkload: EM9_LOCKS.SIMULATION_EXECUTES_WORKLOAD,
    l4AutonomyEnabled: EM9_LOCKS.L4_AUTONOMY_ENABLED,
    guardianRlsTenantBoundariesIntact:
      EM9_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT,
    universeBoundariesIntact: EM9_LOCKS.UNIVERSE_BOUNDARIES_INTACT,
    fabricateCloudPrices: EM9_LOCKS.FABRICATE_CLOUD_PRICES,
    autonomousPurchasing: EM9_LOCKS.AUTONOMOUS_PURCHASING,
    note:
      'Presence soft-wire only; EM3+EL9 required; EM7/EM8 may be ABSENT; simulation≠execute; DETECTED≠VERIFIED; no fabricated prices; does not imply production authorization.',
    locks: {
      em3: EM3_LOCKS,
      el9: EL9_LOCKS,
      em9: EM9_LOCKS,
    },
  };
}
