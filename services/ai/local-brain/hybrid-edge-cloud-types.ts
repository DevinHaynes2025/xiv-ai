export const HYBRID_EDGE_CLOUD_ARCHITECTURE = [
  'ceo_intent',
  'ceo_sealed_vault_or_executive_memory',
  'approved_story',
  'local_device_node',
  'offline_llm_agent_workcell',
  'knowledge_memory_retrieval',
  'secure_agent_conversation',
  'local_result',
  'classification_policy_gate',
  'optional_peer_aws_azure_cisco_route',
  'evidence',
  'checkpoint',
  'learning_ledger',
  'universe_graph_update',
  'debrief',
  'next_story',
] as const;

export type HybridArchitectureHop = (typeof HYBRID_EDGE_CLOUD_ARCHITECTURE)[number];

export const HYBRID_EDGE_CLOUD_LOCKS = {
  L4_AUTONOMY_ENABLED: false,
  AUTO_PRODUCTION_DEPLOY: false,
  PRODUCTION_DATABASE_WRITE: false,
  PRODUCTION_GIT_PUSH: false,
  AUTO_PERMISSION_EXPANSION: false,
  PRODUCTION_AUTHORIZATION: false,
  FOUNDER_IMPERSONATION: false,
  PHYSICAL_SATELLITE_CONTROL: false,
  PHYSICAL_DEVICE_CONTROL: false,
  TIP_LAND: false,
} as const;

export type EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED';

export type OsClass = 'linux' | 'windows' | 'macos' | 'android' | 'ios';
export type DeviceClass = 'laptop' | 'android_class' | 'ios_class';
export type CloudPeerId = 'aws' | 'azure' | 'cisco';
export type NodeLocality = 'device' | 'edge' | 'cloud';

export type SealedActorKind =
  | 'ceo_principal'
  | 'ordinary_agent'
  | 'tool'
  | 'peer'
  | 'provider'
  | 'cloud_adapter';

export type SealedActor = {
  kind: SealedActorKind;
  id: string;
  role?: string;
};

export function hostOsClass(platform = process.platform): OsClass {
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'macos';
  return 'linux';
}
