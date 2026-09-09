/**
 * 62L-EX13 — Plasticity bridge to EX12 pathway graph (soft-wire).
 * Bounded weight updates from lifecycle/application evidence.
 * PREFERRED affects routing only, never authority.
 * Fallback honesty: requested NPU ≠ strengthen NPU if actual=CPU.
 * Does NOT create a second agent system — extends pathway preference only.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EX13_LOCKS,
  type ComputeDevice,
  type PathwayPlasticityState,
  type PathwayUpdateResult,
  type XivFeedbackEvent,
} from './types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

export type PlasticPathway = {
  pathwayId: string;
  routeId: string;
  device: ComputeDevice;
  state: PathwayPlasticityState;
  weight: number;
  preferred: boolean;
  evidenceIds: string[];
  tenantId: string;
  universeId: string;
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

const MAX_DELTA = 0.15;

export function createPlasticPathway(input: {
  pathwayId: string;
  routeId: string;
  device: ComputeDevice;
  tenantId: string;
  universeId: string;
  state?: PathwayPlasticityState;
  weight?: number;
}): PlasticPathway {
  return {
    pathwayId: input.pathwayId,
    routeId: input.routeId,
    device: input.device,
    state: input.state ?? 'NEW_PATH',
    weight: clamp01(input.weight ?? 0.5),
    preferred: false,
    evidenceIds: [],
    tenantId: input.tenantId,
    universeId: input.universeId,
  };
}

/** Soft-wire probe for EX12 pathway-weight module. */
export function ex12PathwayWeightPresent(): boolean {
  const candidates = [
    join(HERE, '..', 'quantum', 'pathway-weight.ts'),
    '/tmp/62l-ex12-work/services/ai/runtime/quantum/pathway-weight.ts',
    '/workspace/.wt-ex12/services/ai/runtime/quantum/pathway-weight.ts',
  ];
  return candidates.some((p) => existsSync(p));
}

export function applyPositiveLoop(
  pathway: PlasticPathway,
  event: XivFeedbackEvent,
): PathwayUpdateResult & { pathway: PlasticPathway } {
  if (event.evidenceRejected || event.evidenceRevoked || !event.evidenceAccepted) {
    return {
      allowed: false,
      pathwayId: pathway.pathwayId,
      priorState: pathway.state,
      nextState: pathway.state === 'REJECTED' ? 'REJECTED' : pathway.state,
      weightDelta: 0,
      preferred: pathway.preferred,
      meansAuthority: false,
      reason: 'REJECTED_OR_UNACCEPTED_EVIDENCE_CANNOT_STRENGTHEN',
      actualDeviceEvidence: event.actualDevice ?? null,
      pathway,
    };
  }
  if (EX13_LOCKS.REJECTED_EVIDENCE_STRENGTHENS) {
    return deny(pathway, event, 'LOCK_VIOLATION');
  }

  // Fallback honesty: strengthen actual device pathway only
  const actual = event.actualDevice ?? pathway.device;
  const requested = event.requestedDevice;
  if (requested && actual && requested !== actual) {
    if (EX13_LOCKS.STRENGTHEN_REQUESTED_DEVICE_WHEN_ACTUAL_DIFFERS) {
      return deny(pathway, event, 'LOCK_VIOLATION');
    }
    // If this pathway is for requested device but actual differs — do not strengthen
    if (pathway.device === requested && pathway.device !== actual) {
      return {
        allowed: false,
        pathwayId: pathway.pathwayId,
        priorState: pathway.state,
        nextState: 'RETEST_REQUIRED',
        weightDelta: 0,
        preferred: false,
        meansAuthority: false,
        reason: `FALLBACK_HONESTY_REQUESTED_${requested}_ACTUAL_${actual}_NO_STRENGTHEN_REQUESTED`,
        actualDeviceEvidence: actual,
        pathway: { ...pathway, state: 'RETEST_REQUIRED' },
      };
    }
  }

  if (pathway.state === 'REJECTED' || pathway.state === 'REVOKED') {
    return {
      allowed: false,
      pathwayId: pathway.pathwayId,
      priorState: pathway.state,
      nextState: pathway.state,
      weightDelta: 0,
      preferred: false,
      meansAuthority: false,
      reason: 'REJECTED_EVIDENCE_CANNOT_STRENGTHEN_PATHWAY',
      actualDeviceEvidence: actual,
      pathway,
    };
  }

  const delta = Math.min(MAX_DELTA, 0.1);
  const weight = clamp01(pathway.weight + delta);
  const preferred = weight >= 0.75;
  const next: PlasticPathway = {
    ...pathway,
    weight,
    preferred,
    state: preferred ? 'PREFERRED' : 'STRENGTHENING',
    evidenceIds: [...new Set([...pathway.evidenceIds, ...event.evidenceIds])],
    device: actual,
  };

  if (EX13_LOCKS.PREFERRED_EQ_AUTHORITY) {
    return deny(pathway, event, 'LOCK_VIOLATION');
  }

  return {
    allowed: true,
    pathwayId: pathway.pathwayId,
    priorState: pathway.state,
    nextState: next.state,
    weightDelta: delta,
    preferred: next.preferred,
    meansAuthority: false,
    reason: preferred
      ? 'STRENGTHENED_TO_PREFERRED_ROUTING_ONLY_NOT_AUTHORITY'
      : 'STRENGTHENED_MEASURED_ROUTE',
    actualDeviceEvidence: actual,
    pathway: next,
  };
}

export function applyNegativeLoop(
  pathway: PlasticPathway,
  event: XivFeedbackEvent,
  targetDevice?: ComputeDevice,
): PathwayUpdateResult & { pathway: PlasticPathway } {
  // Failed GPU route weakens only that route/device
  if (targetDevice && pathway.device !== targetDevice) {
    return {
      allowed: false,
      pathwayId: pathway.pathwayId,
      priorState: pathway.state,
      nextState: pathway.state,
      weightDelta: 0,
      preferred: pathway.preferred,
      meansAuthority: false,
      reason: 'NEGATIVE_UPDATE_SCOPED_TO_FAILED_DEVICE_ROUTE_ONLY',
      actualDeviceEvidence: event.actualDevice ?? null,
      pathway,
    };
  }

  const delta = -Math.min(MAX_DELTA, 0.12);
  const weight = clamp01(pathway.weight + delta);
  const next: PlasticPathway = {
    ...pathway,
    weight,
    preferred: false,
    state: weight < 0.25 ? 'REGRESSED' : 'DEGRADING',
    evidenceIds: [...new Set([...pathway.evidenceIds, ...event.evidenceIds])],
  };

  return {
    allowed: true,
    pathwayId: pathway.pathwayId,
    priorState: pathway.state,
    nextState: next.state,
    weightDelta: delta,
    preferred: false,
    meansAuthority: false,
    reason: `WEAKENED_FAILED_${pathway.device}_ROUTE_ONLY`,
    actualDeviceEvidence: event.actualDevice ?? pathway.device,
    pathway: next,
  };
}

/** CPU fallback updates CPU evidence pathway — not the failed requested device. */
export function recordCpuFallbackEvidence(
  cpuPathway: PlasticPathway,
  event: XivFeedbackEvent,
): PathwayUpdateResult & { pathway: PlasticPathway } {
  if (cpuPathway.device !== 'CPU') {
    return deny(cpuPathway, event, 'CPU_FALLBACK_REQUIRES_CPU_PATHWAY');
  }
  const enriched: XivFeedbackEvent = {
    ...event,
    actualDevice: 'CPU',
    requestedDevice: event.requestedDevice,
    evidenceAccepted: true,
    outcome: event.outcome === 'FAIL' ? 'RECOVERED' : event.outcome,
  };
  return applyPositiveLoop(cpuPathway, enriched);
}

export function rejectedCannotStrengthen(
  pathway: PlasticPathway,
  event: XivFeedbackEvent,
): PathwayUpdateResult & { pathway: PlasticPathway } {
  const rejected: PlasticPathway = { ...pathway, state: 'REJECTED' };
  const blocked = applyPositiveLoop(rejected, {
    ...event,
    evidenceRejected: true,
    evidenceAccepted: false,
  });
  return blocked;
}

function deny(
  pathway: PlasticPathway,
  event: XivFeedbackEvent,
  reason: string,
): PathwayUpdateResult & { pathway: PlasticPathway } {
  return {
    allowed: false,
    pathwayId: pathway.pathwayId,
    priorState: pathway.state,
    nextState: pathway.state,
    weightDelta: 0,
    preferred: pathway.preferred,
    meansAuthority: false,
    reason,
    actualDeviceEvidence: event.actualDevice ?? null,
    pathway,
  };
}

/** Routing change candidate from PREFERRED — never authority/permissions. */
export function routingChangeCandidate(pathway: PlasticPathway): {
  candidate: boolean;
  meansAuthority: false;
  meansProductionPermission: false;
  reason: string;
} {
  if (!pathway.preferred || pathway.state !== 'PREFERRED') {
    return {
      candidate: false,
      meansAuthority: false,
      meansProductionPermission: false,
      reason: 'NOT_PREFERRED',
    };
  }
  return {
    candidate: true,
    meansAuthority: false,
    meansProductionPermission: false,
    reason: 'PREFERRED_ROUTING_CANDIDATE_REQUIRES_RETEST_BEFORE_VERIFIED_LESSON',
  };
}

export type VirtualChipPrep = {
  kind: 'XIV_VIRTUAL_CHIP';
  softwareDefined: true;
  physicalRebuild: false;
  productionAuthorized: false;
  eyFollowOnIssue: 173;
};

export function xivVirtualChipFeedbackPrep(): VirtualChipPrep {
  return {
    kind: 'XIV_VIRTUAL_CHIP',
    softwareDefined: true,
    physicalRebuild: false,
    productionAuthorized: false,
    eyFollowOnIssue: 173,
  };
}

export type AgentHouseRoute = {
  houseId: string;
  viaGovernedRouterOnly: true;
  secondAgentSystem: false;
};

export function agentHouseExecutionHome(houseId: string): AgentHouseRoute {
  return {
    houseId,
    viaGovernedRouterOnly: true,
    secondAgentSystem: false,
  };
}
