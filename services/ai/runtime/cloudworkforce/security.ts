/**
 * Cloud workforce security denials — fail closed, audited.
 * DEFAULT PERMISSIONS = NONE. No forged workers. No cross-tenant/universe.
 * No L4. No silent production deploy. Capability ≠ privilege.
 */

import type { AgentMission, AgentWorker, SecurityAuditResult } from './types';

export type SecurityAction =
  | 'CLAIM_MISSION'
  | 'CHECKPOINT'
  | 'COMPLETE'
  | 'FAIL'
  | 'HANDOFF'
  | 'READ_CROSS_TENANT'
  | 'READ_CROSS_UNIVERSE'
  | 'SELF_GRANT_PERMISSION'
  | 'ESCALATE_AUTHORITY'
  | 'ENABLE_L4'
  | 'SILENT_PRODUCTION_DEPLOY'
  | 'ALL_TOOLS_UNLOCK'
  | 'BYPASS_GUARDIAN'
  | 'FORGE_WORKER';

export function deny(reason: string): SecurityAuditResult {
  return { decision: 'DENIED', reason, audited: true };
}

export function allow(reason = 'allowed'): SecurityAuditResult {
  return { decision: 'ALLOWED', reason, audited: true };
}

export function evaluateSecurity(input: {
  action: SecurityAction;
  worker?: AgentWorker | null;
  mission?: AgentMission | null;
  targetTenantId?: string;
  targetUniverseId?: string;
}): SecurityAuditResult {
  const { action, worker, mission } = input;

  if (action === 'ENABLE_L4' || action === 'SILENT_PRODUCTION_DEPLOY' || action === 'BYPASS_GUARDIAN') {
    return deny(`security_denied_${action.toLowerCase()}`);
  }
  if (action === 'SELF_GRANT_PERMISSION' || action === 'ALL_TOOLS_UNLOCK' || action === 'ESCALATE_AUTHORITY') {
    return deny(`security_denied_${action.toLowerCase()}`);
  }
  if (action === 'FORGE_WORKER') {
    return deny('forged_worker_denied');
  }

  if (worker?.forged) {
    return deny('forged_worker_denied');
  }

  if (worker && worker.defaultPermissions !== 'NONE') {
    return deny('non_none_default_permissions_denied');
  }
  if (worker && worker.allTools) {
    return deny('all_tools_denied');
  }
  if (worker && worker.l4Enabled) {
    return deny('l4_denied');
  }

  if (action === 'READ_CROSS_TENANT') {
    if (
      worker &&
      input.targetTenantId &&
      worker.tenantId !== input.targetTenantId
    ) {
      return deny('cross_tenant_denied');
    }
    if (mission && worker && worker.tenantId !== mission.tenantId) {
      return deny('cross_tenant_denied');
    }
  }

  if (action === 'READ_CROSS_UNIVERSE') {
    if (
      worker &&
      input.targetUniverseId &&
      worker.universeId !== input.targetUniverseId
    ) {
      return deny('cross_universe_denied');
    }
    if (mission && worker && worker.universeId !== mission.universeId) {
      return deny('cross_universe_denied');
    }
  }

  if (mission && worker) {
    if (worker.tenantId !== mission.tenantId) {
      return deny('cross_tenant_denied');
    }
    if (worker.universeId !== mission.universeId) {
      return deny('cross_universe_denied');
    }
  }

  if (mission?.l4Enabled) {
    return deny('mission_l4_denied');
  }
  if (mission?.selfExpandableAuthority) {
    return deny('self_expandable_authority_denied');
  }

  return allow();
}

export function defaultPermissionsAreNone(): true {
  return true;
}

export function capabilityEqualsPrivilege(): false {
  return false;
}

export function cloudWorkforceL4Enabled(): false {
  return false;
}

export function agentsMaySilentProductionDeploy(): false {
  return false;
}

export function agentsMaySelfGrantPermissions(): false {
  return false;
}
