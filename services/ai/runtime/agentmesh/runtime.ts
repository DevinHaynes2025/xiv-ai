/**
 * Agent mesh runtime — modes, sync policy, offline state machine.
 * L4 disabled. Offline does not create authority.
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

export type AgentEventQueue = {
  queueId: string;
  runtimeId: string;
  signedOnly: true;
  bounded: true;
  events: readonly { eventId: string; signed: boolean; cloudOnly: boolean }[];
};

export type AgentCheckpoint = {
  checkpointId: string;
  runtimeId: string;
  tenantId: string;
  universeId: string;
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
  if (input.next === 'ONLINE' && input.runtime.mode !== 'ONLINE') {
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
  if (input.next === 'BLOCKED') {
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
      mode: input.next,
      offlineState: input.next.startsWith('OFFLINE')
        ? 'ENCRYPTED_POCKET_ACTIVE'
        : input.next === 'REAUTH_REQUIRED'
          ? 'AWAITING_REAUTH'
          : input.next === 'SYNC_PENDING'
            ? 'SIGNED_EVENTS_QUEUED'
            : null,
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
  events: readonly { eventId: string; signed: boolean; cloudOnly: boolean }[];
}): { allowed: true; queue: AgentEventQueue } | { allowed: false; reason: string } {
  for (const event of input.events) {
    if (!event.signed) {
      return { allowed: false, reason: 'unsigned_local_event_rejected' };
    }
    if (event.cloudOnly) {
      return { allowed: false, reason: 'cloud_only_event_not_queued_offline' };
    }
  }
  return {
    allowed: true,
    queue: {
      queueId: input.queueId,
      runtimeId: input.runtimeId,
      signedOnly: true,
      bounded: true,
      events: input.events,
    },
  };
}

export function createCheckpoint(input: {
  checkpointId: string;
  runtimeId: string;
  tenantId: string;
  universeId: string;
}): AgentCheckpoint {
  return {
    checkpointId: input.checkpointId,
    runtimeId: input.runtimeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
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
}): { allowed: true; handoff: AgentHandoff } | { allowed: false; reason: string } {
  if (input.fromTenantId !== input.toTenantId) {
    return { allowed: false, reason: 'cross_tenant_handoff_denied' };
  }
  if (input.fromUniverseId !== input.toUniverseId) {
    return { allowed: false, reason: 'cross_universe_handoff_denied' };
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
  void input.tenantId;
  void input.universeId;
  return {
    memoryId: input.memoryId,
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
