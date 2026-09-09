export type ChipFamily =
  | 'cpu_x86_64'
  | 'cpu_arm64'
  | 'nvidia_cuda'
  | 'amd_rocm'
  | 'apple_metal'
  | 'samsung_npu'
  | 'quantum_simulator'
  | 'quantum_hardware';

export type ComputeState = 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE' | 'SUSPENDED';

export type ComputeNode = {
  id: string;
  family: ChipFamily;
  state: ComputeState;
  configured: boolean;
  authorized: boolean;
  locality: 'device' | 'edge' | 'cloud' | 'research';
  capabilities: string[];
  maxConcurrentTasks: number;
  productionAuthorized: false;
};

const nodes = new Map<string, ComputeNode>();

export function registerComputeNode(input: ComputeNode) {
  const node = { ...input };
  if (!node.configured || !node.authorized) node.state = 'UNAVAILABLE';
  if (node.maxConcurrentTasks < 1 || node.maxConcurrentTasks > 1024) {
    throw new Error('Compute concurrency must be bounded between 1 and 1024.');
  }
  nodes.set(node.id, node);
  return node;
}

export function getComputeNode(id: string) {
  return nodes.get(id) ?? null;
}

export function selectComputeNode(options: {
  requiredCapability: string;
  allowedFamilies?: ChipFamily[];
  locality?: ComputeNode['locality'];
}) {
  return [...nodes.values()].find((node) =>
    node.state === 'AVAILABLE' &&
    node.configured &&
    node.authorized &&
    node.capabilities.includes(options.requiredCapability) &&
    (!options.allowedFamilies || options.allowedFamilies.includes(node.family)) &&
    (!options.locality || node.locality === options.locality)
  ) ?? null;
}

export const COMPUTE_FABRIC_POLICY = Object.freeze({
  unknownHardware: 'UNAVAILABLE' as const,
  productionAuthorization: false as const,
  autoInfrastructurePurchase: false as const,
  autoProviderEnable: false as const,
  quantumAdvantageClaimed: false as const,
});
