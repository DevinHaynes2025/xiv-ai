import { getRuntime, type RuntimeProvider } from './hybrid-runtime';
import type { CloudPeerId } from './hybrid-edge-cloud-types';
import { providerSlots, type ProviderId } from './provider-fabric';

export type CloudPeerObservation = {
  peer: CloudPeerId;
  detected: boolean;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  evidenceRefs: string[];
  notes: string;
};

export type CloudPeerSlot = CloudPeerObservation & {
  state: 'AVAILABLE' | 'UNAVAILABLE';
  capabilities: string[];
};

const DEFAULT_NOTES: Record<CloudPeerId, string> = {
  aws: 'AWS remains UNAVAILABLE until detected, configured, authorized, and verified.',
  azure: 'Azure remains UNAVAILABLE until detected, configured, authorized, and verified.',
  cisco: 'Cisco remains UNAVAILABLE until detected, configured, authorized, and verified. No physical network control.',
};

const observations = new Map<CloudPeerId, CloudPeerObservation>([
  ['aws', { peer: 'aws', detected: false, configured: false, authorized: false, verified: false, evidenceRefs: [], notes: DEFAULT_NOTES.aws }],
  ['azure', { peer: 'azure', detected: false, configured: false, authorized: false, verified: false, evidenceRefs: [], notes: DEFAULT_NOTES.azure }],
  ['cisco', { peer: 'cisco', detected: false, configured: false, authorized: false, verified: false, evidenceRefs: [], notes: DEFAULT_NOTES.cisco }],
]);

export function peerAvailability(observation: CloudPeerObservation): 'AVAILABLE' | 'UNAVAILABLE' {
  if (observation.detected && observation.configured && observation.authorized && observation.verified && observation.evidenceRefs.length > 0) {
    return 'AVAILABLE';
  }
  return 'UNAVAILABLE';
}

function capabilitiesFor(peer: CloudPeerId) {
  if (peer === 'cisco') return ['network_fabric_sim'];
  return ['compute', 'object_storage', 'database'];
}

export function observeCloudPeer(input: CloudPeerObservation) {
  observations.set(input.peer, {
    ...input,
    evidenceRefs: [...input.evidenceRefs],
    notes: input.notes || DEFAULT_NOTES[input.peer],
  });
  return describeCloudPeer(input.peer);
}

export function describeCloudPeer(peer: CloudPeerId): CloudPeerSlot {
  const observation = observations.get(peer)!;
  return {
    ...observation,
    evidenceRefs: [...observation.evidenceRefs],
    capabilities: capabilitiesFor(peer),
    state: peerAvailability(observation),
  };
}

export function cloudPeerSlots(): CloudPeerSlot[] {
  return (['aws', 'azure', 'cisco'] as const).map(describeCloudPeer);
}

export function routeToCloudPeer(input: {
  peer: CloudPeerId;
  classification: 'public' | 'internal' | 'confidential' | 'restricted' | 'sealed_founder_priority';
  sealedRedacted: boolean;
  isolation: boolean;
}) {
  if (input.isolation) {
    return { routed: false as const, state: 'UNAVAILABLE' as const, reason: 'Emergency isolation blocks cloud/peer routing.' };
  }
  if (input.classification === 'sealed_founder_priority') {
    return { routed: false as const, state: 'DENIED' as const, reason: 'Sealed founder-priority content cannot be routed to cloud peers.' };
  }
  if (!input.sealedRedacted && input.classification !== 'public') {
    return { routed: false as const, state: 'DENIED' as const, reason: 'Unredacted sealed fields cannot leave the local node.' };
  }
  const slot = describeCloudPeer(input.peer);
  if (slot.state !== 'AVAILABLE') {
    return { routed: false as const, state: 'UNAVAILABLE' as const, reason: slot.notes, peer: slot };
  }
  return { routed: true as const, state: 'AVAILABLE' as const, reason: 'Peer is detected, configured, authorized, and verified.', peer: slot };
}

export function cloudFailureFallback(peer: CloudPeerId) {
  const slot = describeCloudPeer(peer);
  if (slot.state === 'AVAILABLE') {
    return { continueLocal: true as const, peerState: slot.state, reason: 'Peer available; local-first still preferred.' };
  }
  return {
    continueLocal: true as const,
    peerState: 'UNAVAILABLE' as const,
    reason: 'Cloud/peer failure or unconfigured slot; local/offline work continues.',
  };
}

export function providerFabricHonesty() {
  const slots = providerSlots();
  const runtimes = (['aws', 'azure', 'gcp'] as const).map((provider: RuntimeProvider) => {
    const runtime = getRuntime(provider);
    return { provider, state: runtime.configured && runtime.authorized ? runtime.state : 'UNAVAILABLE' as const };
  });
  return {
    providers: slots.map((slot) => ({
      provider: slot.provider as ProviderId,
      state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE' as const,
    })),
    runtimes,
    ciscoInProviderFabric: false as const,
  };
}

export function resetCloudPeerAdapters() {
  for (const peer of ['aws', 'azure', 'cisco'] as const) {
    observations.set(peer, {
      peer,
      detected: false,
      configured: false,
      authorized: false,
      verified: false,
      evidenceRefs: [],
      notes: DEFAULT_NOTES[peer],
    });
  }
}
