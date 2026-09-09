/**
 * Agent mesh runtime — modes, sync policy, offline state machine.
 * L4 disabled. Offline does not create authority.
 * Soft-wire Home Base continuity: same tenant/Universe, server auth, Guardian unchanged.
 */

import {
  AGENT_RUNTIME_MODES,
  OFFLINE_FORBIDDEN_ACTIONS,
  type AgentOfflineState,
  type AgentRuntimeMode,
  type AgentSyncPolicy,
  type OfflineForbiddenAction,
} from './types';

export type AgentRuntime = {
  runtimeId: string;
  tenantId: string;
  universeId: string;
  agentId: string;
  mode: AgentRuntimeMode;
  syncPolicy: AgentSyncPolicy;
  offlineState: AgentOfflineState | null;
  l4Enabled: false;
  offlineCreatesAuthority: false;
  capabilityEqualsPrivilege: false;
  productionLive: false;
};

export type AgentQueuedEvent = {
  eventId: string;
  signed: boolean;
  cloudOnly: boolean;
  payloadBytes: number;
  createdAt: number;
  expiresAt?: number;
};

export type AgentEventQueue = {
  queueId: string;
  runtimeId: string;
  signedOnly: true;
  bounded: true;
  maxEvents: number;
  maxPayloadBytes: number;
  events: readonly AgentQueuedEvent[];
};

export const DEFAULT_EVENT_QUEUE_MAX_EVENTS = 64;
export const DEFAULT_EVENT_QUEUE_MAX_PAYLOAD_BYTES = 256_000;

export type AgentCheckpoint = {
  checkpointId: string;
  runtimeId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
  version: number;
  integrityHash: string;
  lastCompletedStep: string | null;
  evidenceRefs: readonly string[];
  runtimePackageVersion: string;
  recoverable: true;
  transfersAuthority: false;
};

export type AgentHandoff = {
  handoffId: string;
  fromAgentId: string;
  toAgentId: string;
  sameTenant: boolean;
  sameUniverse: boolean;
  transfersPermissions: false;
  requiresServerAuth: true;
  serverAuthorized: true;
};

export type AgentConflict = {
  conflictId: string;
  kind: string;
  resolution: string;
  serverSideAuthorizationRequired: true;
};

export type AgentRecovery = {
  recoveryId: string;
  checkpointId: string;
  bypassesGuardian: false;
  escalatesPrivilege: false;
};

export type AgentCachePolicy = {
  policyId: string;
  allowedClasses: readonly ('ALLOWED_OFFLINE' | 'TENANT_PRIVATE')[];
  cloudOnlyBlockedOffline: true;
  secretsNeverCachedOffline: true;
};

export type AgentLocalMemory = {
  memoryId: string;
  tenantId: string;
  universeId: string;
  encrypted: true;
  scopedToTenant: true;
  scopedToUniverse: true;
  class: 'LOCAL_SCOPED';
};

export type AgentCloudMemory = {
  memoryId: string;
  class: 'CLOUD_SCOPED';
  offlineAccessible: false;
};

/** Explicit allowed-transition matrix (Slice 1 / V741). */
export const AGENT_MODE_TRANSITIONS: Readonly<
  Record<AgentRuntimeMode, readonly AgentRuntimeMode[]>
> = {
  ONLINE: [
    'ONLINE',
    'OFFLINE_LIMITED',
    'OFFLINE_READ_ONLY',
    'SYNC_PENDING',
    'REAUTH_REQUIRED',
    'BLOCKED',
  ],
  OFFLINE_LIMITED: [
    'OFFLINE_LIMITED',
    'OFFLINE_READ_ONLY',
    'SYNC_PENDING',
    'REAUTH_REQUIRED',
    'BLOCKED',
    'ONLINE',
  ],
  OFFLINE_READ_ONLY: [
    'OFFLINE_READ_ONLY',
    'OFFLINE_LIMITED',
    'SYNC_PENDING',
    'REAUTH_REQUIRED',
    'BLOCKED',
    'ONLINE',
  ],
  SYNC_PENDING: [
    'SYNC_PENDING',
    'OFFLINE_LIMITED',
    'OFFLINE_READ_ONLY',
    'REAUTH_REQUIRED',
    'BLOCKED',
    'ONLINE',
  ],
  REAUTH_REQUIRED: ['REAUTH_REQUIRED', 'ONLINE', 'BLOCKED', 'OFFLINE_LIMITED', 'OFFLINE_READ_ONLY', 'SYNC_PENDING'],
  BLOCKED: ['BLOCKED', 'REAUTH_REQUIRED', 'ONLINE'],
};

const OFFLINE_OR_SYNC: readonly AgentRuntimeMode[] = [
  'OFFLINE_LIMITED',
  'OFFLINE_READ_ONLY',
  'SYNC_PENDING',
];

function offlineStateForMode(mode: AgentRuntimeMode): AgentOfflineState | null {
  if (mode.startsWith('OFFLINE')) return 'ENCRYPTED_POCKET_ACTIVE';
  if (mode === 'REAUTH_REQUIRED') return 'AWAITING_REAUTH';
  if (mode === 'SYNC_PENDING') return 'SIGNED_EVENTS_QUEUED';
  return null;
}

function hasReconnectValidation(input: {
  reauthenticated?: boolean;
  tenantValidated?: boolean;
  universeValidated?: boolean;
}): boolean {
  return (
    input.reauthenticated === true &&
    input.tenantValidated === true &&
    input.universeValidated === true
  );
}

/** Deterministic non-crypto integrity fingerprint for checkpoint recovery (not a secret). */
export function checkpointIntegrityHash(parts: {
  checkpointId: string;
  runtimeId: string;
  tenantId: string;
  universeId: string;
  version: number;
  lastCompletedStep: string | null;
  evidenceRefs: readonly string[];
  runtimePackageVersion: string;
  createdAt: string;
}): string {
  const payload = [
    parts.checkpointId,
    parts.runtimeId,
    parts.tenantId,
    parts.universeId,
    String(parts.version),
    parts.lastCompletedStep ?? '',
    parts.evidenceRefs.join(','),
    parts.runtimePackageVersion,
    parts.createdAt,
  ].join('|');
  let h = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `cp-${(h >>> 0).toString(16).padStart(8, '0')}`;
}

export function listAgentRuntimeModes(): readonly AgentRuntimeMode[] {
  return AGENT_RUNTIME_MODES;
}

export function listOfflineForbiddenActions(): readonly OfflineForbiddenAction[] {
  return OFFLINE_FORBIDDEN_ACTIONS;
}

export function openAgentRuntime(input: {
  runtimeId: string;
  tenantId: string;
  universeId: string;
  agentId: string;
  mode?: AgentRuntimeMode;
  syncPolicy?: AgentSyncPolicy;
}): AgentRuntime {
  const mode = input.mode ?? 'ONLINE';
  return {
    runtimeId: input.runtimeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    agentId: input.agentId,
    mode,
    syncPolicy: input.syncPolicy ?? 'IMMEDIATE_ON_RECONNECT',
    offlineState: mode.startsWith('OFFLINE') ? 'ENCRYPTED_POCKET_ACTIVE' : null,
    l4Enabled: false,
    offlineCreatesAuthority: false,
    capabilityEqualsPrivilege: false,
    productionLive: false,
  };
}

export function transitionAgentMode(input: {
  runtime: AgentRuntime;
  next: AgentRuntimeMode;
  reauthenticated?: boolean;
  tenantValidated?: boolean;
  universeValidated?: boolean;
}): { allowed: true; runtime: AgentRuntime } | { allowed: false; reason: string } {
  const from = input.runtime.mode;
  const next = input.next;
  const allowedNext = AGENT_MODE_TRANSITIONS[from];
  if (!allowedNext.includes(next)) {
    return { allowed: false, reason: `transition_denied:${from}->${next}` };
  }

  // BLOCKED cannot escape into offline/sync modes (hard deny).
  if (from === 'BLOCKED' && (OFFLINE_OR_SYNC as readonly string[]).includes(next)) {
    return { allowed: false, reason: 'blocked_cannot_enter_offline_without_clearance' };
  }

  // REAUTH_REQUIRED → offline/sync requires full validation.
  if (
    from === 'REAUTH_REQUIRED' &&
    (OFFLINE_OR_SYNC as readonly string[]).includes(next) &&
    !hasReconnectValidation(input)
  ) {
    return { allowed: false, reason: 'reauth_validation_required_for_offline' };
  }

  // Any reconnect/entry to ONLINE from non-ONLINE requires reauth + tenant + Universe.
  if (next === 'ONLINE' && from !== 'ONLINE') {
    if (input.reauthenticated !== true) {
      return { allowed: false, reason: 'reauth_required' };
    }
    if (input.tenantValidated !== true) {
      return { allowed: false, reason: 'tenant_validation_required' };
    }
    if (input.universeValidated !== true) {
      return { allowed: false, reason: 'universe_validation_required' };
    }
  }

  if (next === 'BLOCKED') {
    return {
      allowed: true,
      runtime: {
        ...input.runtime,
        mode: 'BLOCKED',
        offlineState: null,
      },
    };
  }

  return {
    allowed: true,
    runtime: {
      ...input.runtime,
      mode: next,
      offlineState: offlineStateForMode(next),
    },
  };
}

export function offlineCreatesAuthority(): false {
  return false;
}

export function capabilityEqualsPrivilege(): false {
  return false;
}

export function agentMeshL4Enabled(): false {
  return false;
}

export function evaluateOfflineAction(input: {
  mode: AgentRuntimeMode;
  action: OfflineForbiddenAction | 'READ_LOCAL_CACHE' | 'QUEUE_SIGNED_EVENT' | 'BOUNDED_TOOL';
  dataClass?: 'ALLOWED_OFFLINE' | 'CLOUD_ONLY' | 'OFFLINE_PROHIBITED' | 'TENANT_PRIVATE';
}): { allowed: boolean; reason: string } {
  if (input.mode === 'BLOCKED' || input.mode === 'REAUTH_REQUIRED') {
    return { allowed: false, reason: 'runtime_blocked_or_reauth_required' };
  }
  if (input.mode === 'ONLINE') {
    return { allowed: true, reason: 'online' };
  }
  if ((OFFLINE_FORBIDDEN_ACTIONS as readonly string[]).includes(input.action)) {
    return { allowed: false, reason: 'offline_forbidden_action' };
  }
  if (input.action === 'ACCESS_CLOUD_ONLY_DATA' || input.dataClass === 'CLOUD_ONLY') {
    return { allowed: false, reason: 'cloud_only_blocked_offline' };
  }
  if (input.dataClass === 'OFFLINE_PROHIBITED') {
    return { allowed: false, reason: 'offline_prohibited_data' };
  }
  if (input.mode === 'OFFLINE_READ_ONLY' && input.action === 'BOUNDED_TOOL') {
    return { allowed: false, reason: 'offline_read_only' };
  }
  if (input.action === 'PRODUCTION_DEPLOY') {
    return { allowed: false, reason: 'no_prod_deploy_offline' };
  }
  return { allowed: true, reason: 'bounded_offline_ok' };
}

export function createEventQueue(input: {
  queueId: string;
  runtimeId: string;
  events: readonly {
    eventId: string;
    signed: boolean;
    cloudOnly: boolean;
    payloadBytes?: number;
    createdAt?: number;
    expiresAt?: number;
  }[];
  maxEvents?: number;
  maxPayloadBytes?: number;
  now?: number;
}): { allowed: true; queue: AgentEventQueue } | { allowed: false; reason: string } {
  const maxEvents = input.maxEvents ?? DEFAULT_EVENT_QUEUE_MAX_EVENTS;
  const maxPayloadBytes = input.maxPayloadBytes ?? DEFAULT_EVENT_QUEUE_MAX_PAYLOAD_BYTES;
  const now = input.now ?? Date.now();

  if (maxEvents < 1 || maxPayloadBytes < 1) {
    return { allowed: false, reason: 'invalid_queue_bounds' };
  }
  if (input.events.length > maxEvents) {
    return { allowed: false, reason: 'event_queue_overflow' };
  }

  let totalBytes = 0;
  const normalized: AgentQueuedEvent[] = [];
  for (const event of input.events) {
    if (!event.signed) {
      return { allowed: false, reason: 'unsigned_local_event_rejected' };
    }
    if (event.cloudOnly) {
      return { allowed: false, reason: 'cloud_only_event_not_queued_offline' };
    }
    const payloadBytes = event.payloadBytes ?? 0;
    if (payloadBytes < 0) {
      return { allowed: false, reason: 'invalid_payload_bytes' };
    }
    const createdAt = event.createdAt ?? now;
    if (event.expiresAt !== undefined && event.expiresAt <= now) {
      return { allowed: false, reason: 'expired_event_rejected' };
    }
    totalBytes += payloadBytes;
    if (totalBytes > maxPayloadBytes) {
      return { allowed: false, reason: 'event_queue_payload_overflow' };
    }
    normalized.push({
      eventId: event.eventId,
      signed: true,
      cloudOnly: false,
      payloadBytes,
      createdAt,
      expiresAt: event.expiresAt,
    });
  }

  return {
    allowed: true,
    queue: {
      queueId: input.queueId,
      runtimeId: input.runtimeId,
      signedOnly: true,
      bounded: true,
      maxEvents,
      maxPayloadBytes,
      events: normalized,
    },
  };
}

export function createCheckpoint(input: {
  checkpointId: string;
  runtimeId: string;
  tenantId: string;
  universeId: string;
  createdAt?: string;
  version?: number;
  lastCompletedStep?: string | null;
  evidenceRefs?: readonly string[];
  runtimePackageVersion?: string;
}): AgentCheckpoint {
  const createdAt = input.createdAt ?? new Date(0).toISOString();
  const version = input.version ?? 1;
  const lastCompletedStep = input.lastCompletedStep ?? null;
  const evidenceRefs = input.evidenceRefs ?? [];
  const runtimePackageVersion = input.runtimePackageVersion ?? 'agentmesh-2iab';
  const integrityHash = checkpointIntegrityHash({
    checkpointId: input.checkpointId,
    runtimeId: input.runtimeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    version,
    lastCompletedStep,
    evidenceRefs,
    runtimePackageVersion,
    createdAt,
  });
  return {
    checkpointId: input.checkpointId,
    runtimeId: input.runtimeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt,
    version,
    integrityHash,
    lastCompletedStep,
    evidenceRefs,
    runtimePackageVersion,
    recoverable: true,
    transfersAuthority: false,
  };
}

export function createHandoff(input: {
  handoffId: string;
  fromAgentId: string;
  toAgentId: string;
  fromTenantId: string;
  toTenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  serverAuthorized?: boolean;
}): { allowed: true; handoff: AgentHandoff } | { allowed: false; reason: string } {
  if (input.fromTenantId !== input.toTenantId) {
    return { allowed: false, reason: 'cross_tenant_handoff_denied' };
  }
  if (input.fromUniverseId !== input.toUniverseId) {
    return { allowed: false, reason: 'cross_universe_handoff_denied' };
  }
  if (input.serverAuthorized !== true) {
    return { allowed: false, reason: 'server_authorization_required' };
  }
  return {
    allowed: true,
    handoff: {
      handoffId: input.handoffId,
      fromAgentId: input.fromAgentId,
      toAgentId: input.toAgentId,
      sameTenant: true,
      sameUniverse: true,
      transfersPermissions: false,
      requiresServerAuth: true,
      serverAuthorized: true,
    },
  };
}

export function openCachePolicy(policyId: string): AgentCachePolicy {
  return {
    policyId,
    allowedClasses: ['ALLOWED_OFFLINE', 'TENANT_PRIVATE'],
    cloudOnlyBlockedOffline: true,
    secretsNeverCachedOffline: true,
  };
}

export function openLocalMemory(input: {
  memoryId: string;
  tenantId: string;
  universeId: string;
}): AgentLocalMemory {
  return {
    memoryId: input.memoryId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    encrypted: true,
    scopedToTenant: true,
    scopedToUniverse: true,
    class: 'LOCAL_SCOPED',
  };
}

export function openCloudMemory(memoryId: string): AgentCloudMemory {
  return {
    memoryId,
    class: 'CLOUD_SCOPED',
    offlineAccessible: false,
  };
}
