export const DISTRIBUTED_MESH_CYCLE = [
  'founder_approved_story',
  'local_xiv_node',
  'capability_policy_check',
  'local_execution_first',
  'authorized_peer_only_when_needed',
  'distributed_agent_workcell',
  'evidence_result',
  'durable_checkpoint',
  'network_partition_queue',
  'reconnect',
  'reconciliation',
  'learning_ledger',
  'neural_pathway_update',
  'founder_distributed_brain_brief',
] as const;

export type DistributedMeshHop = (typeof DISTRIBUTED_MESH_CYCLE)[number];

export type MeshEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED';

export type MeshNodeKind = 'computer' | 'model' | 'chip' | 'node' | 'edge';

export type MeshNodeLifecycle =
  | 'detected'
  | 'configured'
  | 'authorized'
  | 'verified'
  | 'quarantined'
  | 'revoked';

export type MeshCapabilityKind =
  | 'cpu'
  | 'local_model'
  | 'accelerator'
  | 'chip'
  | 'coding'
  | 'research'
  | 'quant'
  | 'knowledge_pack'
  | 'edge';

export type MeshCapability = {
  kind: MeshCapabilityKind;
  label: string;
  availability: 'AVAILABLE' | 'UNAVAILABLE' | 'STALE';
  evidenceRefs: string[];
  observedAt: string;
  ttlMs: number;
};

export const DEFAULT_CAPABILITY_TTL_MS = 5 * 60_000;

export const MESH_HONESTY = Object.freeze({
  l4AutonomyEnabled: false as const,
  productionAuthorization: false as const,
  autoTrustRegisteredNode: false as const,
  founderImpersonation: false as const,
  physicalSatelliteControl: false as const,
  physicalDeviceControl: false as const,
  tipLand: false as const,
  inventedPass: false as const,
});
