export const DISTRIBUTED_APP_NETWORK_ARCHITECTURE = [
  'xiv_universe',
  'local_brain',
  'agent_workcells',
  'packages_knowledge',
  'secure_transfer',
  'authorized_peer_node',
  'integrity_verification',
  'local_activation',
  'evidence',
  'synchronization',
  'learning',
] as const;

export type AppNetworkHop = (typeof DISTRIBUTED_APP_NETWORK_ARCHITECTURE)[number];

export const DISTRIBUTED_APP_NETWORK_LOCKS = {
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
  INSTALLATION_GRANTS_AUTHORITY: false,
  SYNC_GRANTS_AUTHORITY: false,
  CEO_SEALED_VAULT_IN_ORDINARY_SYNC: false,
} as const;

export type EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED';

export type RelayId = 'aws' | 'azure' | 'gcp' | 'cisco';
export type NodeProfile = 'mobile' | 'desktop';
export type PackageKind = 'app_package' | 'knowledge_pack' | 'agent_skill';
export type TransferState =
  | 'queued'
  | 'in_flight'
  | 'held_offline'
  | 'resumed'
  | 'integrity_verified'
  | 'activated'
  | 'denied'
  | 'failed'
  | 'deduplicated';

export type AppNetworkClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'sealed_founder_priority';
