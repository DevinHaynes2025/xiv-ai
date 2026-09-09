import { INFORMATION_CONTROL_TOWER_LOCKS, INFORMATION_ROUTING_LOOP } from './information-control-tower-types';
import { brainRegistryHonesty, describeGlobalOperationsBrain, getBrainSubsystem } from './global-operations-brain';
import { executiveCortexHonesty } from './executive-decision-cortex';
import { workforceSchedulerHonesty } from './global-agent-workforce-scheduler';
import { businessWorldHonesty } from './business-world-simulation';
import { decisionOutcomeHonesty } from './decision-outcome-learning';
import { BJ_LOCKS, HONESTY_BANNER, type BjEvidenceState } from './global-operations-brain-types';

/**
 * Unified Executive Control Tower API — contracts only; reuses AN control-tower patterns.
 * Does not invent live provider availability or production authority.
 */

export type ControlTowerApiRequest = {
  tenantId: string;
  universeId: string;
  method:
    | 'getBrainRegistry'
    | 'getSubsystem'
    | 'getHonestyLocks'
    | 'getRoutingLoop'
    | 'getExecutiveSnapshot';
  subsystemId?: Parameters<typeof getBrainSubsystem>[0];
};

export type ControlTowerApiResponse = {
  ok: boolean;
  status: BjEvidenceState;
  method: ControlTowerApiRequest['method'];
  body: unknown;
  productionAuthorization: false;
  tipLand: false;
  l4AutonomyEnabled: false;
};

export function invokeExecutiveControlTower(req: ControlTowerApiRequest): ControlTowerApiResponse {
  const base = {
    productionAuthorization: false as const,
    tipLand: false as const,
    l4AutonomyEnabled: false as const,
  };

  if (!req.tenantId || !req.universeId) {
    return {
      ok: false,
      status: 'FAIL',
      method: req.method,
      body: { reason: 'TENANT_AND_UNIVERSE_REQUIRED' },
      ...base,
    };
  }

  switch (req.method) {
    case 'getBrainRegistry':
      return {
        ok: true,
        status: 'IMPLEMENTED',
        method: req.method,
        body: describeGlobalOperationsBrain(),
        ...base,
      };
    case 'getSubsystem': {
      if (!req.subsystemId) {
        return {
          ok: false,
          status: 'FAIL',
          method: req.method,
          body: { reason: 'SUBSYSTEM_ID_REQUIRED' },
          ...base,
        };
      }
      const sub = getBrainSubsystem(req.subsystemId);
      return {
        ok: Boolean(sub),
        status: sub ? (sub.binding === 'waiting_data' ? 'WAITING_DATA' : 'IMPLEMENTED') : 'FAIL',
        method: req.method,
        body: sub,
        ...base,
      };
    }
    case 'getHonestyLocks':
      return {
        ok: true,
        status: 'IMPLEMENTED',
        method: req.method,
        body: {
          banner: HONESTY_BANNER,
          bj: BJ_LOCKS,
          an: INFORMATION_CONTROL_TOWER_LOCKS,
          brain: brainRegistryHonesty(),
          executive: executiveCortexHonesty(),
          workforce: workforceSchedulerHonesty(),
          world: businessWorldHonesty(),
          learning: decisionOutcomeHonesty(),
        },
        ...base,
      };
    case 'getRoutingLoop':
      return {
        ok: true,
        status: 'IMPLEMENTED',
        method: req.method,
        body: {
          reusedFrom: '62L-AN Information Control Tower',
          loop: INFORMATION_ROUTING_LOOP,
          note: 'Executive Control Tower reuses AN routing loop contracts; does not weaken Guardian/RLS.',
        },
        ...base,
      };
    case 'getExecutiveSnapshot':
      return {
        ok: true,
        status: 'IMPLEMENTED',
        method: req.method,
        body: {
          tenantId: req.tenantId,
          universeId: req.universeId,
          brain: brainRegistryHonesty(),
          executive: executiveCortexHonesty(),
          workforce: workforceSchedulerHonesty(),
          world: businessWorldHonesty(),
          learning: decisionOutcomeHonesty(),
          recommendation: 'Human authority required for consequential actions.',
        },
        ...base,
      };
    default:
      return {
        ok: false,
        status: 'DENIED',
        method: req.method,
        body: { reason: 'UNKNOWN_METHOD' },
        ...base,
      };
  }
}

export function executiveControlTowerHonesty() {
  return {
    locks: BJ_LOCKS,
    reusesAnControlTower: true as const,
    productionAuthorization: false as const,
  };
}
