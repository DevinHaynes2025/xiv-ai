import { refuse } from './errors';
import {
  now,
  recordGovernanceEvent,
  requireMember,
  requireSupervisor,
  visibleTo,
  type CivilizationState,
} from './store';
import type { ActorContext, PlatformClass, RuntimeCapability, RuntimeNode, RuntimeNodeStatus } from './types';

// Applications request capabilities. They never name a chip vendor, an operating
// system or an orbit. Everything vendor-specific stays on the far side of this
// vocabulary.
export const XIV_COMPUTE_CAPABILITIES = [
  'compute.cpu.general',
  'compute.cpu.vector',
  'compute.gpu.inference',
  'compute.gpu.training',
  'compute.npu.mobile',
  'storage.hot',
  'storage.warm',
  'storage.cold',
  'storage.archival',
  'network.low_latency',
  'network.intermittent',
  'runtime.background_execution',
  'runtime.foreground_ui',
  'security.hardware_key_store',
  'security.tenant_isolated_memory',
] as const;

export type XivComputeCapability = (typeof XIV_COMPUTE_CAPABILITIES)[number];

// Everything past terrestrial infrastructure is an interface, not a deployment.
// Registering one of these is allowed so the architecture does not need
// redesigning later; using one is not.
export const BEYOND_CLOUD_PLATFORMS: readonly PlatformClass[] = ['satellite_link', 'orbital_compute', 'deep_space'];

const USABLE_STATUSES = new Set<RuntimeNodeStatus>(['available']);

export function registerRuntimeNode(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    nodeKey: string;
    platformClass: PlatformClass;
    provider?: string;
    region?: string | null;
    status?: RuntimeNodeStatus;
  },
): RuntimeNode {
  const { universe } = requireSupervisor(state, actor);

  const beyondCloud = BEYOND_CLOUD_PLATFORMS.includes(input.platformClass);
  const status: RuntimeNodeStatus = beyondCloud ? 'unconfigured_external' : (input.status ?? 'registered');

  const existing = state.runtimeNodes.find(
    (item) => item.universeId === universe.id && item.nodeKey === input.nodeKey,
  );
  if (existing) return existing;

  const node: RuntimeNode = {
    id: state.nextId(),
    universeId: universe.id,
    nodeKey: input.nodeKey,
    platformClass: input.platformClass,
    provider: input.provider ?? 'unspecified',
    region: input.region ?? null,
    status,
    isExternalUnconfigured: beyondCloud,
    createdAt: now(state),
  };
  state.runtimeNodes.push(node);

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'runtime_node_registered',
    actorUserId: actor.userId,
    detail: {
      nodeKey: node.nodeKey,
      platformClass: node.platformClass,
      status: node.status,
      isExternalUnconfigured: node.isExternalUnconfigured,
    },
  });

  return node;
}

export function declareRuntimeCapability(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    nodeId: string;
    capabilityKey: XivComputeCapability | string;
    capabilityValue?: Record<string, unknown>;
    verified?: boolean;
  },
): RuntimeCapability {
  const { universe } = requireSupervisor(state, actor);
  const node = requireRuntimeNode(state, universe.id, input.nodeId);

  const existing = state.runtimeCapabilities.find(
    (item) => item.nodeId === node.id && item.capabilityKey === input.capabilityKey,
  );

  const capability: RuntimeCapability = existing ?? {
    id: state.nextId(),
    universeId: universe.id,
    nodeId: node.id,
    capabilityKey: input.capabilityKey,
    capabilityValue: input.capabilityValue ?? {},
    verified: input.verified ?? false,
    createdAt: now(state),
  };

  if (existing) {
    existing.capabilityValue = input.capabilityValue ?? existing.capabilityValue;
    existing.verified = input.verified ?? existing.verified;
  } else {
    state.runtimeCapabilities.push(capability);
  }

  recordGovernanceEvent(state, {
    universeId: universe.id,
    eventKind: 'runtime_capability_granted',
    actorUserId: actor.userId,
    detail: { nodeKey: node.nodeKey, capabilityKey: capability.capabilityKey, verified: capability.verified },
  });

  return capability;
}

export type ComputePlacement = {
  node: RuntimeNode;
  matchedCapabilities: string[];
  unmatchedPreferred: string[];
};

// The compute abstraction layer. A caller states what the work needs; the layer
// picks a node. If the only match is a beyond-cloud provider the request is
// refused rather than silently downgraded, because those providers are
// unconfigured by design in this slice.
export function requestCompute(
  state: CivilizationState,
  actor: ActorContext,
  input: { required: readonly string[]; preferred?: readonly string[] },
): ComputePlacement {
  requireMember(state, actor);
  const nodes = visibleTo(state, actor, state.runtimeNodes);

  const candidates = nodes
    .map((node) => {
      const keys = state.runtimeCapabilities
        .filter((item) => item.nodeId === node.id && item.verified)
        .map((item) => item.capabilityKey);
      return { node, keys };
    })
    .filter((candidate) => input.required.every((key) => candidate.keys.includes(key)));

  if (candidates.length === 0) {
    refuse('runtime_capability_unavailable', input.required.join(','));
  }

  const usable = candidates.filter(
    (candidate) => USABLE_STATUSES.has(candidate.node.status) && !candidate.node.isExternalUnconfigured,
  );
  if (usable.length === 0) {
    refuse('runtime_external_unconfigured', candidates.map((candidate) => candidate.node.nodeKey).join(','));
  }

  const preferred = input.preferred ?? [];
  const ranked = [...usable].sort(
    (left, right) => countMatches(right.keys, preferred) - countMatches(left.keys, preferred),
  );
  const chosen = ranked[0];

  return {
    node: chosen.node,
    matchedCapabilities: [...input.required, ...preferred.filter((key) => chosen.keys.includes(key))],
    unmatchedPreferred: preferred.filter((key) => !chosen.keys.includes(key)),
  };
}

export function listRuntimeNodes(state: CivilizationState, actor: ActorContext): RuntimeNode[] {
  return visibleTo(state, actor, state.runtimeNodes);
}

export function requireRuntimeNode(state: CivilizationState, universeId: string, nodeId: string): RuntimeNode {
  const node = state.runtimeNodes.find((item) => item.id === nodeId);
  if (!node) refuse('runtime_capability_unavailable', nodeId);
  if (node.universeId !== universeId) refuse('tenancy_cross_universe_blocked', nodeId);
  return node;
}

function countMatches(keys: readonly string[], wanted: readonly string[]) {
  return wanted.filter((key) => keys.includes(key)).length;
}
