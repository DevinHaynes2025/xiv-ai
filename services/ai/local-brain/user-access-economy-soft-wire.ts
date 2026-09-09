/**
 * 62L-EM10 — User Access Economy soft-wire
 *
 * Soft-wire (presence only ≠ VERIFIED):
 * - EM9 compute resource market simulator (optional)
 * - EM1 agent home base contract (optional)
 * - #157 EM affordability guard / ambition≠valuation / CFO council (present on this base)
 *
 * L4_AUTONOMY_ENABLED=false.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EM10_LOCKS } from './user-access-economy-types';

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Em10SoftWireSnapshot = {
  em9MarketSimulator: SoftWirePresence;
  em1HomeBase: SoftWirePresence;
  em157AffordabilityGuard: SoftWirePresence;
  em157AmbitionTracker: SoftWirePresence;
  em157HomeBaseModule: SoftWirePresence;
  el9ResourceGovernor: SoftWirePresence;
  l4AutonomyEnabled: false;
  note: string;
};

function hereDir(): string {
  return dirname(fileURLToPath(import.meta.url));
}

function firstExisting(candidates: string[]): { present: boolean; pathChecked: string } {
  for (const p of candidates) {
    if (existsSync(p)) return { present: true, pathChecked: p };
  }
  return { present: false, pathChecked: candidates[0]! };
}

/**
 * Soft-wire predecessors when present on disk.
 * Presence does not imply EM9/EM1/#157 VERIFIED or production authorization.
 */
export function em10SoftWireSnapshot(): Em10SoftWireSnapshot {
  const brain = hereDir();
  const runtime = join(brain, '../local-runtime');

  const em9 = firstExisting([
    join(brain, 'compute-resource-market-simulator.ts'),
    join(brain, 'em9-compute-resource-market-simulator.ts'),
    join(runtime, 'compute-resource-market-simulator.ts'),
    join(runtime, 'em9-compute-resource-market-simulator.ts'),
  ]);

  const em1 = firstExisting([
    join(brain, 'agent-home-base-contract.ts'),
    join(brain, 'agent-home-base-types.ts'),
    join(runtime, 'agent-home-base-contract.ts'),
  ]);

  const em157Module = firstExisting([
    join(brain, 'agent-compute-home-base.ts'),
    join(brain, 'agent-compute-home-base-runtime.ts'),
  ]);

  const em157Afford = firstExisting([
    join(brain, 'agent-compute-home-base-runtime.ts'),
  ]);

  const em157Ambition = firstExisting([
    join(brain, 'agent-compute-home-base-types.ts'),
    join(brain, 'agent-compute-home-base-runtime.ts'),
  ]);

  const el9 = firstExisting([join(runtime, 'resource-governor.ts')]);

  return {
    em9MarketSimulator: {
      ...em9,
      note: em9.present
        ? 'EM9 market simulator present (soft-wire; not VERIFIED).'
        : 'EM9 market simulator absent — soft-wire no-op until landed.',
    },
    em1HomeBase: {
      ...em1,
      note: em1.present
        ? 'EM1 home base contract present (soft-wire; not VERIFIED).'
        : 'EM1 home base contract absent — soft-wire no-op until landed.',
    },
    em157AffordabilityGuard: {
      ...em157Afford,
      note: em157Afford.present
        ? '#157 affordabilityGuard / CFO council surface present (soft-wire).'
        : '#157 affordability guard absent — EM10 local value/cost gate still applies.',
    },
    em157AmbitionTracker: {
      ...em157Ambition,
      note: em157Ambition.present
        ? '#157 ambition≠valuation tracker types/runtime present (soft-wire).'
        : '#157 ambition tracker absent — EM10 lock AMBITION_EQ_VALUATION=false still holds.',
    },
    em157HomeBaseModule: {
      ...em157Module,
      note: em157Module.present
        ? '#157 agent-compute-home-base module present (soft-wire).'
        : '#157 home-base module absent.',
    },
    el9ResourceGovernor: {
      ...el9,
      note: el9.present
        ? 'EL9 resource governor present (ceilings apply; not live thermal VERIFIED).'
        : 'EL9 resource governor absent.',
    },
    l4AutonomyEnabled: EM10_LOCKS.L4_AUTONOMY_ENABLED,
    note:
      'Presence soft-wire only; does not imply EM9/EM1/#157/EL9 VERIFIED or production authorization. L4_AUTONOMY_ENABLED=false. recommend≠charge/sign.',
  };
}
