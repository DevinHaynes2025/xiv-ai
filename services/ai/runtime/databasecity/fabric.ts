import type { CloudProvider, DatabaseNode, MemoryTier, ReplicationPolicy } from './types';

export const CLOUD_ADAPTERS: Record<CloudProvider, { runtime: string[]; data: string[]; ai: string[] }> = {
  LOCAL: {
    runtime: ['Ollama', 'containers', 'native-process'],
    data: ['SQLite', 'PostgreSQL', 'local-vector', 'local-graph'],
    ai: ['Ollama', 'local-rules'],
  },
  GOOGLE_CLOUD: {
    runtime: ['Cloud Run', 'GKE'],
    data: ['AlloyDB', 'Cloud SQL', 'Cloud Storage', 'BigQuery'],
    ai: ['Vertex AI', 'Gemini'],
  },
  AZURE: {
    runtime: ['Container Apps', 'AKS'],
    data: ['Azure Database for PostgreSQL', 'Azure AI Search', 'Cosmos DB', 'Blob Storage'],
    ai: ['Microsoft Foundry', 'Azure OpenAI'],
  },
};

export function memoryTierForAge(ageHours: number): MemoryTier {
  if (ageHours <= 1) return 'HOT';
  if (ageHours <= 24 * 7) return 'WARM';
  if (ageHours <= 24 * 365) return 'COLD';
  return 'ARCHIVE';
}

export function buildBrainHierarchy(device: DatabaseNode, company: DatabaseNode, regional: DatabaseNode, global: DatabaseNode): DatabaseNode[] {
  const nodes = [device, company, regional, global];
  const levels = nodes.map((n) => n.level);
  const expected = ['DEVICE', 'COMPANY', 'REGIONAL', 'GLOBAL'];
  if (levels.some((level, i) => level !== expected[i])) throw new Error('invalid brain hierarchy');
  if (nodes.some((node) => !node.encrypted)) throw new Error('all brain nodes must be encrypted');
  return nodes;
}

export function replicationPlan(nodes: DatabaseNode[]): ReplicationPolicy[] {
  const policies: ReplicationPolicy[] = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    policies.push({
      sourceNodeId: nodes[i].id,
      targetNodeId: nodes[i + 1].id,
      mode: i === 0 ? 'CHECKPOINT' : 'EVENTUAL',
      encrypted: true,
      productionAutoApply: false,
    });
  }
  return policies;
}

export const DATABASE_CITY_GUARDRAILS = {
  autonomousProductionReplication: false,
  autonomousCrossTenantReplication: false,
  autonomousCloudCreation: false,
  destructiveSchemaEvolution: false,
  providerLockInRequired: false,
  offlineFirstSupported: true,
  multiCloudPlanningSupported: true,
} as const;
