import { cloudFailureFallback, cloudPeerSlots, describeCloudPeer, routeToCloudPeer } from './cloud-peer-adapters';
import { getRuntime } from './hybrid-runtime';
import { providerSlots } from './provider-fabric';
import type { RelayId } from './distributed-app-network-types';

export type RelayObservation = {
  relay: RelayId;
  detected: boolean;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  evidenceRefs: string[];
  notes: string;
  state: 'AVAILABLE' | 'UNAVAILABLE';
  optional: true;
};

const gcpDefault: RelayObservation = {
  relay: 'gcp',
  detected: false,
  configured: false,
  authorized: false,
  verified: false,
  evidenceRefs: [],
  notes: 'GCP remains UNAVAILABLE until detected, configured, authorized, and verified. Cloud is an optional relay, not a required control plane.',
  state: 'UNAVAILABLE',
  optional: true,
};

let gcp = { ...gcpDefault };

export function observeGcpRelay(input: Omit<RelayObservation, 'relay' | 'optional' | 'state'>) {
  const ready =
    input.detected && input.configured && input.authorized && input.verified && input.evidenceRefs.length > 0;
  gcp = {
    relay: 'gcp',
    ...input,
    evidenceRefs: [...input.evidenceRefs],
    state: ready ? 'AVAILABLE' : 'UNAVAILABLE',
    optional: true,
  };
  return describeRelay('gcp');
}

export function resetCloudRelays() {
  gcp = { ...gcpDefault };
}

export function describeRelay(relay: RelayId): RelayObservation {
  if (relay === 'gcp') return { ...gcp, evidenceRefs: [...gcp.evidenceRefs] };
  const peer = describeCloudPeer(relay);
  return {
    relay,
    detected: peer.detected,
    configured: peer.configured,
    authorized: peer.authorized,
    verified: peer.verified,
    evidenceRefs: [...peer.evidenceRefs],
    notes: peer.notes,
    state: peer.state,
    optional: true,
  };
}

export function relaySlots(): RelayObservation[] {
  return (['aws', 'azure', 'gcp', 'cisco'] as const).map(describeRelay);
}

export function routeToOptionalRelay(input: {
  relay: RelayId;
  classification: 'public' | 'internal' | 'confidential' | 'restricted' | 'sealed_founder_priority';
  sealedRedacted: boolean;
  isolation: boolean;
}) {
  if (input.isolation) {
    return { routed: false as const, state: 'UNAVAILABLE' as const, reason: 'Emergency isolation blocks optional cloud relays.' };
  }
  if (input.classification === 'sealed_founder_priority') {
    return { routed: false as const, state: 'DENIED' as const, reason: 'Sealed founder-priority content cannot use AWS/Azure/GCP/Cisco relays.' };
  }
  if (input.relay === 'gcp') {
    const slot = describeRelay('gcp');
    if (slot.state !== 'AVAILABLE') {
      return { routed: false as const, state: 'UNAVAILABLE' as const, reason: slot.notes, relay: slot };
    }
    if (!input.sealedRedacted) {
      return { routed: false as const, state: 'DENIED' as const, reason: 'Unredacted sealed fields cannot leave the local node.' };
    }
    return { routed: true as const, state: 'AVAILABLE' as const, reason: 'GCP relay is optional and currently verified.', relay: slot };
  }
  const routed = routeToCloudPeer({
    peer: input.relay,
    classification: input.classification,
    sealedRedacted: input.sealedRedacted,
    isolation: input.isolation,
  });
  return { ...routed, relay: describeRelay(input.relay) };
}

export function relayFailureFallback(relay: RelayId) {
  if (relay === 'gcp') {
    const slot = describeRelay('gcp');
    return {
      continueLocal: true as const,
      relayState: slot.state,
      reason: 'Unconfigured or failed GCP relay; eligible local intelligence continues offline-first.',
    };
  }
  const fallback = cloudFailureFallback(relay);
  return { continueLocal: true as const, relayState: fallback.peerState, reason: fallback.reason };
}

export function unconfiguredRelaysHonesty() {
  const runtimeGcp = getRuntime('gcp');
  return {
    aws: describeRelay('aws').state,
    azure: describeRelay('azure').state,
    gcp: runtimeGcp.configured && runtimeGcp.authorized && gcp.state === 'AVAILABLE' ? gcp.state : 'UNAVAILABLE',
    cisco: describeRelay('cisco').state,
    aePeers: cloudPeerSlots().map((slot) => ({ peer: slot.peer, state: slot.state })),
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE',
    })),
    cloudRequired: false as const,
  };
}
