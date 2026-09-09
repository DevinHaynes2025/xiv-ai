import { evaluateOfflineTask, type OfflineTaskRequirement } from './offline-policy';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import {
  capabilityFreshness,
  getMeshNode,
  isRoutingEligible,
  listMeshNodes,
  type MeshNodeRecord,
} from './mesh-node-registry';
import { listMeshPartitions, nodesPartitioned } from './partition-safe-bus';
import { type MeshCapabilityKind, type MeshEvidenceState } from './distributed-mesh-types';

export type RouteDecision = {
  targetNodeId: string | null;
  mode: 'local' | 'authorized_peer' | 'none';
  state: MeshEvidenceState;
  reason: string;
  localFirst: true;
  productionAuthorization: false;
};

function hasFreshCapability(node: MeshNodeRecord, kind: MeshCapabilityKind, now: number) {
  return node.capabilities.some((capability) =>
    capability.kind === kind && capabilityFreshness(capability, now) === 'AVAILABLE',
  );
}

export async function routeLocalFirst(input: {
  localNodeId: string;
  tenantId: string;
  universeId: string;
  requiredCapability: MeshCapabilityKind;
  consequence?: ConsequenceClass;
  production?: boolean;
  permissionChange?: boolean;
  requirement?: Partial<OfflineTaskRequirement>;
  root?: string;
  now?: number;
}): Promise<RouteDecision> {
  const now = input.now ?? Date.now();
  const local = await getMeshNode(input.localNodeId, input.tenantId, input.universeId, input.root);
  if (!local) {
    return {
      targetNodeId: null,
      mode: 'none',
      state: 'FAIL',
      reason: 'Local XIV node is not in the registry.',
      localFirst: true,
      productionAuthorization: false,
    };
  }

  const gate = decisionGate({
    id: `mesh-route-${input.localNodeId}`,
    action: `route:${input.requiredCapability}`,
    consequence: input.consequence ?? 'LOW',
    production: input.production === true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: input.permissionChange === true,
    externalPublication: false,
  });
  if (!gate.executableByAgent) {
    return {
      targetNodeId: null,
      mode: 'none',
      state: 'WAITING_DATA',
      reason: gate.reason,
      localFirst: true,
      productionAuthorization: false,
    };
  }

  const offline = evaluateOfflineTask({
    needsInternet: input.requirement?.needsInternet === true,
    needsCloudProvider: input.requirement?.needsCloudProvider === true,
    needsExternalFreshness: input.requirement?.needsExternalFreshness === true,
    needsProductionWrite: input.requirement?.needsProductionWrite === true,
    needsPermissionChange: input.requirement?.needsPermissionChange === true,
    classification: input.requirement?.classification ?? 'internal',
  });
  if (!offline.allowed) {
    return {
      targetNodeId: null,
      mode: 'none',
      state: offline.state === 'DENIED' ? 'FAIL' : offline.state,
      reason: offline.reason,
      localFirst: true,
      productionAuthorization: false,
    };
  }

  if (local.lifecycle !== 'verified' || !local.authorized || !local.configured) {
    return {
      targetNodeId: null,
      mode: 'none',
      state: 'UNAVAILABLE',
      reason: 'Requesting local node is not configured, authorized, and verified; registered nodes are not automatically trusted.',
      localFirst: true,
      productionAuthorization: false,
    };
  }

  if (isRoutingEligible(local, now) && hasFreshCapability(local, input.requiredCapability, now)) {
    return {
      targetNodeId: local.id,
      mode: 'local',
      state: 'PASS',
      reason: 'Local node is verified and has a fresh capability; execute locally first.',
      localFirst: true,
      productionAuthorization: false,
    };
  }

  const localStale = local.lifecycle === 'verified' && local.capabilities.some((capability) =>
    capability.kind === input.requiredCapability && capabilityFreshness(capability, now) === 'STALE',
  );

  const partitions = await listMeshPartitions(input.root);
  const peers = (await listMeshNodes({ tenantId: input.tenantId, universeId: input.universeId, root: input.root }))
    .filter((node) => node.id !== local.id)
    .filter((node) => isRoutingEligible(node, now))
    .filter((node) => hasFreshCapability(node, input.requiredCapability, now))
    .filter((node) => !nodesPartitioned(partitions, local.id, node.id));

  if (peers.length > 0) {
    return {
      targetNodeId: peers[0].id,
      mode: 'authorized_peer',
      state: 'PASS',
      reason: localStale
        ? 'Local capabilities are stale; routing to an authorized verified peer with fresh capabilities.'
        : 'Local node cannot execute; routing to an authorized, verified, non-partitioned peer.',
      localFirst: true,
      productionAuthorization: false,
    };
  }

  if (localStale) {
    return {
      targetNodeId: null,
      mode: 'none',
      state: 'UNAVAILABLE',
      reason: 'Local capabilities are stale and no authorized verified peer has a fresh capability.',
      localFirst: true,
      productionAuthorization: false,
    };
  }

  const unverifiedPeer = (await listMeshNodes({ tenantId: input.tenantId, universeId: input.universeId, root: input.root }))
    .some((node) => node.id !== local.id && node.lifecycle !== 'verified');
  return {
    targetNodeId: null,
    mode: 'none',
    state: 'UNAVAILABLE',
    reason: unverifiedPeer
      ? 'No authorized verified peer is eligible; registered nodes are not automatically trusted.'
      : 'No local or authorized peer can execute this capability.',
    localFirst: true,
    productionAuthorization: false,
  };
}
