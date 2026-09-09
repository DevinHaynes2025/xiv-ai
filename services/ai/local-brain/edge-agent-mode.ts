import { getMeshNode, isRoutingEligible } from './mesh-node-registry';

export type EdgeAgentSession = {
  nodeId: string;
  tenantId: string;
  universeId: string;
  mode: 'edge';
  localOnly: true;
  peerRouting: false;
  physicalDeviceControl: false;
  satelliteControl: false;
  productionAuthorization: false;
  l4AutonomyEnabled: false;
  eligible: boolean;
  reason: string;
};

export async function enterEdgeAgentMode(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  root?: string;
  now?: number;
}): Promise<EdgeAgentSession> {
  const node = await getMeshNode(input.nodeId, input.tenantId, input.universeId, input.root);
  if (!node) throw new Error('MESH_NODE_NOT_FOUND');
  const eligible = isRoutingEligible(node, input.now ?? Date.now()) && (node.kind === 'edge' || node.kind === 'computer' || node.kind === 'node');
  return {
    nodeId: node.id,
    tenantId: node.tenantId,
    universeId: node.universeId,
    mode: 'edge',
    localOnly: true,
    peerRouting: false,
    physicalDeviceControl: false,
    satelliteControl: false,
    productionAuthorization: false,
    l4AutonomyEnabled: false,
    eligible,
    reason: eligible
      ? 'Edge-agent mode is local-only; authorized peers are not used.'
      : 'Edge-agent mode requires a verified node; this node is not routing-eligible.',
  };
}
