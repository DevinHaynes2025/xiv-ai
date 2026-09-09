import {
  COMPUTE_FABRIC_POLICY,
  getComputeNode,
  registerComputeNode,
  selectComputeNode,
  type ChipFamily,
  type ComputeNode,
} from './compute-fabric';
import { InfrastructurePathwayGraph, type InfrastructureNode } from './infrastructure-pathways';
import { PHYSICS_HONESTY } from './physics-domains';

export type ChipComputeGraphSnapshot = {
  nodes: ComputeNode[];
  infrastructure: ReturnType<InfrastructurePathwayGraph['snapshot']>;
  selected: ComputeNode | null;
  honesty: {
    darkMatterChipFamily: false;
    darkEnergyChipFamily: false;
    quantumAdvantageClaimed: false;
    autoInfrastructurePurchase: false;
    productionAuthorization: false;
  };
};

const graphs = new Map<string, InfrastructurePathwayGraph>();

function scopeKey(tenantId: string, universeId: string) {
  return `${tenantId}::${universeId}`;
}

function graphFor(tenantId: string, universeId: string) {
  const key = scopeKey(tenantId, universeId);
  const existing = graphs.get(key);
  if (existing) return existing;
  const created = new InfrastructurePathwayGraph();
  graphs.set(key, created);
  return created;
}

export function registerChipComputeNode(input: ComputeNode & {
  tenantId: string;
  universeId: string;
  label: string;
  provenanceRefs: string[];
  country?: string;
}) {
  if (input.family === 'quantum_hardware' && (!input.configured || !input.authorized)) {
    input = { ...input, state: 'UNAVAILABLE' };
  }
  const node = registerComputeNode({
    ...input,
    productionAuthorized: false,
  });
  const graph = graphFor(input.tenantId, input.universeId);
  const infra: InfrastructureNode = {
    id: node.id,
    kind: node.family.startsWith('quantum') ? 'research_lab' : 'data_center',
    label: input.label,
    country: input.country,
    classification: 'internal',
    provenanceRefs: [...input.provenanceRefs],
    state: node.state === 'AVAILABLE' ? 'KNOWN' : 'UNAVAILABLE',
  };
  graph.addNode(infra);
  return node;
}

export function connectChipCompute(input: {
  tenantId: string;
  universeId: string;
  from: string;
  to: string;
  relation?: 'connects' | 'depends_on' | 'exchanges_data_with' | 'hosts';
  provenanceRefs: string[];
}) {
  const graph = graphFor(input.tenantId, input.universeId);
  graph.addEdge({
    id: `${input.from}->${input.to}`,
    from: input.from,
    to: input.to,
    relation: input.relation ?? 'connects',
    provenanceRefs: [...input.provenanceRefs],
  });
}

export function snapshotChipComputeGraph(input: {
  tenantId: string;
  universeId: string;
  requiredCapability?: string;
  allowedFamilies?: ChipFamily[];
}): ChipComputeGraphSnapshot {
  const graph = graphFor(input.tenantId, input.universeId);
  const infra = graph.snapshot();
  const nodes = infra.nodes
    .map((node) => getComputeNode(node.id))
    .filter((node): node is ComputeNode => node !== null);
  const selected = input.requiredCapability
    ? selectComputeNode({
      requiredCapability: input.requiredCapability,
      allowedFamilies: input.allowedFamilies,
    })
    : null;
  return {
    nodes,
    infrastructure: infra,
    selected,
    honesty: {
      darkMatterChipFamily: false,
      darkEnergyChipFamily: false,
      quantumAdvantageClaimed: COMPUTE_FABRIC_POLICY.quantumAdvantageClaimed,
      autoInfrastructurePurchase: COMPUTE_FABRIC_POLICY.autoInfrastructurePurchase,
      productionAuthorization: false,
    },
  };
}

export const CHIP_COMPUTE_HONESTY = Object.freeze({
  ...PHYSICS_HONESTY,
  darkMatterChipFamily: false as const,
  darkEnergyChipFamily: false as const,
});
