/**
 * Phase 2I-Y Autonomous Research, Night Shift & Intelligence Task Force Fabric.
 * Governed contracts only. No silent production deploy. No self-grant authority.
 * Quantum/network providers stay NOT_CONFIGURED without proof.
 * Does not implement 2I-U mature communities. L4 stays disabled. GDF production-live=false.
 */

export type CapabilityLifecycle = 'NOT_CONFIGURED' | 'CONFIGURED' | 'PROVEN' | 'LIVE';

export type ClassificationLadder =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED'
  | 'SECRET';

/** Company/private lanes — never auto-merge into global/public intelligence. */
export type IntelligenceLane = 'COMPANY_PRIVATE' | 'GLOBAL_PUBLIC' | 'LICENSED_PUBLIC';

export type NightShiftJobKind =
  | 'RESEARCH'
  | 'QA'
  | 'DATA_QUALITY'
  | 'SANDBOX_PATCH'
  | 'FOUNDER_BRIEF';

export type ComputeBackendV4 =
  | 'CPU'
  | 'GPU'
  | 'NPU'
  | 'DISTRIBUTED'
  | 'SIMULATION'
  | 'QUANTUM_FUTURE';

export type NetworkFabricMode =
  | 'AUTHORIZED_CONNECTIVITY'
  | 'SANDBOX'
  | 'OFFLINE';

export type OutreachChannel = 'EMAIL' | 'SMS' | 'POSTAL' | 'IN_APP';

export type PatentWorkspaceStage =
  | 'PRIOR_ART_INTAKE'
  | 'COUNSEL_WORKSPACE'
  | 'HUMAN_REVIEW';

export type DataTaskForceRole =
  | 'DataSteward'
  | 'QualityAnalyst'
  | 'SchemaReviewer'
  | 'IngestionGuard'
  | 'ClassificationOfficer'
  | 'AuditLiaison'
  | 'SyncCoordinator'
  | 'ResearchLibrarian';

export type IntelligenceTaskForceKind =
  | 'MARKET_RESEARCH'
  | 'SECURITY_REVIEW'
  | 'DATA_QUALITY'
  | 'PRIOR_ART'
  | 'OUTREACH_PREP'
  | 'NIGHT_QA';

export const CLASSIFICATION_LADDER: readonly ClassificationLadder[] = [
  'PUBLIC',
  'INTERNAL',
  'CONFIDENTIAL',
  'RESTRICTED',
  'SECRET',
] as const;

export const COMPUTE_BACKENDS_V4: readonly ComputeBackendV4[] = [
  'CPU',
  'GPU',
  'NPU',
  'DISTRIBUTED',
  'SIMULATION',
  'QUANTUM_FUTURE',
] as const;

export const DATA_TASK_FORCE_ROLES: readonly DataTaskForceRole[] = [
  'DataSteward',
  'QualityAnalyst',
  'SchemaReviewer',
  'IngestionGuard',
  'ClassificationOfficer',
  'AuditLiaison',
  'SyncCoordinator',
  'ResearchLibrarian',
] as const;

export const NIGHT_SHIFT_JOB_KINDS: readonly NightShiftJobKind[] = [
  'RESEARCH',
  'QA',
  'DATA_QUALITY',
  'SANDBOX_PATCH',
  'FOUNDER_BRIEF',
] as const;

/** Virtual Neural Address Space — logical addressing, not literal agent counts. */
export type VirtualNeuralAddress = {
  namespace: string;
  nodeId: string;
  literalTrillionAgents: false;
};
