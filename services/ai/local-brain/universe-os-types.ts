export const UNIVERSE_OS_KERNEL_CYCLE = [
  'ceo_policy',
  'universe_kernel',
  'service_registry',
  'offline_scheduler',
  'memory_data_router',
  'agent_workcells',
  'local_llm_tools',
  'evidence',
  'checkpoint',
  'distributed_memory_journal',
  'learning',
  'health',
  'next_story',
] as const;

export type UniverseOsHop = (typeof UNIVERSE_OS_KERNEL_CYCLE)[number];

export const UNIVERSE_OS_LOCKS = {
  L4_AUTONOMY_ENABLED: false,
  AUTO_PRODUCTION_DEPLOY: false,
  PRODUCTION_DATABASE_WRITE: false,
  PRODUCTION_GIT_PUSH: false,
  AUTO_PERMISSION_EXPANSION: false,
  PRODUCTION_AUTHORIZATION: false,
  FOUNDER_IMPERSONATION: false,
  PHYSICAL_SATELLITE_CONTROL: false,
  PHYSICAL_DEVICE_CONTROL: false,
  PHYSICAL_ALTERNATE_UNIVERSE: false,
  TIP_LAND: false,
  CLOUD_REQUIRED_FOR_BOOT: false,
  CEO_SEALED_AUTO_REPLICATE: false,
} as const;

export type EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED';

export type UniverseLifecycle = 'created' | 'booted' | 'running' | 'paused' | 'archived' | 'quarantined' | 'safe_mode';

export type KernelProfileKind = 'desktop' | 'mobile_microkernel';

export type KernelServiceName =
  | 'ceo_policy'
  | 'service_registry'
  | 'offline_supervisor'
  | 'offline_scheduler'
  | 'job_allocator'
  | 'memory_router'
  | 'local_model'
  | 'secure_ipc'
  | 'journal'
  | 'snapshot'
  | 'quarantine';

export type MemoryReplicationClass =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'sealed_founder_priority';

export const DEFAULT_REPLICATION_POLICY: Record<MemoryReplicationClass, 'replicate' | 'hold' | 'never'> = {
  public: 'replicate',
  internal: 'replicate',
  confidential: 'hold',
  restricted: 'hold',
  sealed_founder_priority: 'never',
};
