/**
 * 62L-BN Offline/Cloud Intelligence Metabolism.
 * Tracks CPU/RAM/storage/local models/cloud capacity/model calls/queues/network/cost.
 * Routes workloads local ↔ cloud under privacy/security-first policy.
 * Faster/cheaper unsafe routes lose to sealed/trust constraints.
 * Unconfigured cloud capacity → UNAVAILABLE.
 */

import { cloudPeerSlots, describeCloudPeer, type CloudPeerSlot } from './cloud-peer-adapters';
import type { CloudPeerId } from './hybrid-edge-cloud-types';
import {
  BN_LOCKS,
  type CapacityKind,
  type MetabolismLocality,
} from './superbrain-neural-growth-types';

export type CapacitySnapshot = {
  kind: CapacityKind;
  locality: MetabolismLocality;
  configured: boolean;
  verified: boolean;
  availableUnits: number | null;
  state: 'AVAILABLE' | 'UNAVAILABLE' | 'DEGRADED';
  notes: string;
};

export type MetabolismRouteRequest = {
  tenantId: string;
  universeId: string;
  workloadId: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted' | 'sealed_founder_priority';
  preferCheaper?: boolean;
  preferFaster?: boolean;
  preferCloud?: boolean;
  cloudPeer?: CloudPeerId;
  localVerified?: boolean;
  privacySealed?: boolean;
};

export type MetabolismRouteDecision = {
  routedTo: MetabolismLocality | 'none';
  accepted: boolean;
  state: 'ROUTED' | 'DENIED' | 'UNAVAILABLE';
  reason: string;
  cheaperFasterBypassAttempted: boolean;
  privacyOverSpeedOrPrice: true;
  productionAuthorization: false;
  cloudSlot?: CloudPeerSlot;
  capacities: CapacitySnapshot[];
};

const defaultLocal: CapacitySnapshot[] = [
  {
    kind: 'cpu',
    locality: 'local',
    configured: true,
    verified: true,
    availableUnits: 4,
    state: 'AVAILABLE',
    notes: 'Local CPU observed for routing decisions only.',
  },
  {
    kind: 'ram',
    locality: 'local',
    configured: true,
    verified: true,
    availableUnits: 8,
    state: 'AVAILABLE',
    notes: 'Local RAM observed for routing decisions only.',
  },
  {
    kind: 'storage',
    locality: 'local',
    configured: true,
    verified: true,
    availableUnits: 64,
    state: 'AVAILABLE',
    notes: 'Local storage observed for routing decisions only.',
  },
  {
    kind: 'local_model',
    locality: 'local',
    configured: true,
    verified: true,
    availableUnits: 1,
    state: 'AVAILABLE',
    notes: 'Local model slot — still subject to offline policy.',
  },
  {
    kind: 'model_calls',
    locality: 'local',
    configured: true,
    verified: true,
    availableUnits: 100,
    state: 'AVAILABLE',
    notes: 'Local model-call budget (logical).',
  },
  {
    kind: 'queue',
    locality: 'local',
    configured: true,
    verified: true,
    availableUnits: 32,
    state: 'AVAILABLE',
    notes: 'Local queue depth budget.',
  },
  {
    kind: 'network',
    locality: 'local',
    configured: true,
    verified: true,
    availableUnits: 1,
    state: 'AVAILABLE',
    notes: 'Local/offline network plane.',
  },
  {
    kind: 'cost',
    locality: 'local',
    configured: true,
    verified: true,
    availableUnits: 0,
    state: 'AVAILABLE',
    notes: 'Local cost treated as zero cloud spend.',
  },
];

let capacityOverrides: CapacitySnapshot[] = [];

export function resetIntelligenceMetabolism() {
  capacityOverrides = [];
}

export function observeCapacity(snapshot: CapacitySnapshot) {
  capacityOverrides = capacityOverrides.filter(
    (c) => !(c.kind === snapshot.kind && c.locality === snapshot.locality),
  );
  capacityOverrides.push(snapshot);
  return snapshot;
}

export function listCapacities(): CapacitySnapshot[] {
  const cloudPeers = cloudPeerSlots();
  const cloudConfigured = cloudPeers.some((p) => p.configured && p.verified && p.state === 'AVAILABLE');
  const cloudCapacity: CapacitySnapshot = {
    kind: 'cloud_capacity',
    locality: 'cloud',
    configured: cloudConfigured,
    verified: cloudConfigured,
    availableUnits: cloudConfigured ? 1 : null,
    state: cloudConfigured ? 'AVAILABLE' : 'UNAVAILABLE',
    notes: cloudConfigured
      ? 'Verified cloud peer capacity present.'
      : 'Unconfigured cloud capacity remains UNAVAILABLE.',
  };

  const merged = new Map<string, CapacitySnapshot>();
  for (const c of defaultLocal) merged.set(`${c.locality}:${c.kind}`, c);
  merged.set('cloud:cloud_capacity', cloudCapacity);
  for (const c of capacityOverrides) merged.set(`${c.locality}:${c.kind}`, c);
  return [...merged.values()];
}

export function routeIntelligenceWorkload(input: MetabolismRouteRequest): MetabolismRouteDecision {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const capacities = listCapacities();
  const cheaperFasterBypassAttempted =
    (input.preferCheaper === true || input.preferFaster === true) &&
    (input.preferCloud === true ||
      input.classification === 'sealed_founder_priority' ||
      input.privacySealed === true);

  // Privacy/security constraints always beat cheaper/faster.
  if (
    (input.classification === 'sealed_founder_priority' || input.privacySealed === true) &&
    input.preferCloud === true
  ) {
    return {
      routedTo: 'local',
      accepted: false,
      state: 'DENIED',
      reason: 'SEALED_OR_PRIVACY_DENY_BEATS_CHEAPER_FASTER_CLOUD',
      cheaperFasterBypassAttempted,
      privacyOverSpeedOrPrice: true,
      productionAuthorization: false,
      capacities,
    };
  }

  if (BN_LOCKS.CHEAPER_FASTER_BYPASSES_SEALED) {
    return {
      routedTo: 'none',
      accepted: false,
      state: 'DENIED',
      reason: 'LOCK_VIOLATION_CHEAPER_FASTER_BYPASS',
      cheaperFasterBypassAttempted,
      privacyOverSpeedOrPrice: true,
      productionAuthorization: false,
      capacities,
    };
  }

  const localVerified = input.localVerified !== false;
  const peer = input.cloudPeer ?? 'aws';
  const slot = describeCloudPeer(peer);

  if (input.preferCloud === true) {
    if (!slot.configured || !slot.verified || slot.state === 'UNAVAILABLE') {
      return {
        routedTo: 'none',
        accepted: false,
        state: 'UNAVAILABLE',
        reason: 'UNCONFIGURED_CLOUD_CAPACITY_UNAVAILABLE',
        cheaperFasterBypassAttempted,
        privacyOverSpeedOrPrice: true,
        productionAuthorization: false,
        cloudSlot: slot,
        capacities,
      };
    }
    if (localVerified && !slot.verified) {
      return {
        routedTo: 'local',
        accepted: false,
        state: 'DENIED',
        reason: 'REFUSES_UNVERIFIED_CLOUD_WHEN_ONLY_LOCAL_VERIFIED',
        cheaperFasterBypassAttempted,
        privacyOverSpeedOrPrice: true,
        productionAuthorization: false,
        cloudSlot: slot,
        capacities,
      };
    }
    // Verified cloud still subject to privacy-first — confidential+ stays local by default.
    if (input.classification === 'confidential' || input.classification === 'restricted') {
      return {
        routedTo: 'local',
        accepted: false,
        state: 'DENIED',
        reason: 'PRIVACY_FIRST_CONFIDENTIAL_STAYS_LOCAL',
        cheaperFasterBypassAttempted,
        privacyOverSpeedOrPrice: true,
        productionAuthorization: false,
        cloudSlot: slot,
        capacities,
      };
    }
    return {
      routedTo: 'cloud',
      accepted: true,
      state: 'ROUTED',
      reason: 'VERIFIED_CLOUD_ROUTE_ALLOWED_UNDER_POLICY',
      cheaperFasterBypassAttempted,
      privacyOverSpeedOrPrice: true,
      productionAuthorization: false,
      cloudSlot: slot,
      capacities,
    };
  }

  // Prefer local when verified.
  if (localVerified) {
    return {
      routedTo: 'local',
      accepted: true,
      state: 'ROUTED',
      reason: 'LOCAL_VERIFIED_ROUTE',
      cheaperFasterBypassAttempted,
      privacyOverSpeedOrPrice: true,
      productionAuthorization: false,
      capacities,
    };
  }

  return {
    routedTo: 'none',
    accepted: false,
    state: 'UNAVAILABLE',
    reason: 'NO_VERIFIED_LOCAL_OR_CLOUD_CAPACITY',
    cheaperFasterBypassAttempted,
    privacyOverSpeedOrPrice: true,
    productionAuthorization: false,
    capacities,
  };
}

/**
 * Explicit helper for the required test: refuse unverified cloud when only local is verified.
 */
export function refuseUnverifiedCloudWhenLocalVerified(input: {
  tenantId: string;
  universeId: string;
  workloadId: string;
  cloudPeer?: CloudPeerId;
}): MetabolismRouteDecision {
  const peer = input.cloudPeer ?? 'aws';
  // Ensure peer is treated as unverified/unconfigured unless explicitly observed otherwise.
  const slot = describeCloudPeer(peer);
  const capacities = listCapacities();
  if (slot.verified && slot.configured && slot.state === 'AVAILABLE') {
    return {
      routedTo: 'cloud',
      accepted: true,
      state: 'ROUTED',
      reason: 'CLOUD_VERIFIED_EXCEPTION',
      cheaperFasterBypassAttempted: false,
      privacyOverSpeedOrPrice: true,
      productionAuthorization: false,
      cloudSlot: slot,
      capacities,
    };
  }
  return {
    routedTo: 'local',
    accepted: false,
    state: 'DENIED',
    reason: 'REFUSES_UNVERIFIED_CLOUD_WHEN_ONLY_LOCAL_VERIFIED',
    cheaperFasterBypassAttempted: false,
    privacyOverSpeedOrPrice: true,
    productionAuthorization: false,
    cloudSlot: slot,
    capacities,
  };
}

export function intelligenceMetabolismHonesty() {
  return {
    locks: BN_LOCKS,
    cheaperFasterBypassesSealed: BN_LOCKS.CHEAPER_FASTER_BYPASSES_SEALED,
    privacyOverSpeedOrPrice: BN_LOCKS.PRIVACY_OVER_SPEED_OR_PRICE,
    l4AutonomyEnabled: BN_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: false as const,
    unconfiguredCloud: 'UNAVAILABLE' as const,
  };
}
