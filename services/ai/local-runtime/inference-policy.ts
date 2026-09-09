/**
 * 62L-EL7 — Soft-wire policy gate before local inference.
 *
 * Deny-hooks only: never bypass auth.ts, Guardian, RLS, tenant, or Universe.
 * Soft-wires existing policies.canAutoExecute (always false) and approval posture.
 */

import { canAutoExecute, authorizeTool } from '../policies';
import { getAgentTool } from '../tools';
import { EL7_LOCKS } from './el7-locks';

export type LocalInferencePolicyInput = {
  taskId: string;
  modelId: string;
  tenantId?: string;
  universeScope?: string;
  dataClass?: string;
  /** Explicit human/system authorization for this inference attempt. */
  authorized?: boolean;
  /** Soft signal that auth.ts verification already succeeded upstream. */
  authVerified?: boolean;
  /** Soft signal that Guardian evaluation already passed upstream. */
  guardianAllow?: boolean;
  /** Soft signal that RLS/tenant row access is in scope. */
  rlsTenantInScope?: boolean;
  /** Soft signal that Universe boundary is respected. */
  universeBoundaryOk?: boolean;
  /** Request wants automatic model download. */
  authorizeModelDownload?: boolean;
  /** Request wants automatic driver/runtime install. */
  authorizeDriverOrRuntimeInstall?: boolean;
};

export type LocalInferenceFailureClass =
  | 'POLICY_DENIED'
  | 'AUTH_REQUIRED'
  | 'GUARDIAN_DENIED'
  | 'RLS_TENANT_DENIED'
  | 'UNIVERSE_BOUNDARY_DENIED'
  | 'GOVERNOR_REJECTED'
  | 'AUTO_DOWNLOAD_DENIED'
  | 'AUTO_INSTALL_DENIED'
  | 'PROVIDER_UNAVAILABLE'
  | 'MODEL_NOT_LOADED'
  | 'TIMEOUT'
  | 'NOT_TESTED'
  | null;

export type LocalInferencePolicyDecision = {
  allowed: boolean;
  failureClass: LocalInferenceFailureClass;
  reason: string;
  l4AutonomyEnabled: false;
  locks: typeof EL7_LOCKS;
  softWire: {
    canAutoExecute: false;
    sampleAuthorizeRequiresApprovalOrBlocked: boolean;
    authBypass: false;
    guardianBypass: false;
    rlsBypass: false;
    tenantBypass: false;
    universeBypass: false;
  };
};

/**
 * Soft-wire policy check. Missing boundary signals → deny (never invent allow).
 */
export function checkLocalInferencePolicy(
  input: LocalInferencePolicyInput,
): LocalInferencePolicyDecision {
  const sampleTool = getAgentTool('simulate_supplier_reallocation');
  const sampleAuth = authorizeTool({
    agentType: 'executive_agent',
    toolId: 'simulate_supplier_reallocation',
    approved: false,
  });

  const softWire = {
    canAutoExecute: false as const,
    sampleAuthorizeRequiresApprovalOrBlocked:
      canAutoExecute(sampleTool) === false &&
      (sampleAuth.requiresApproval === true || sampleAuth.allowed === false),
    authBypass: EL7_LOCKS.AUTH_BYPASS,
    guardianBypass: EL7_LOCKS.GUARDIAN_BYPASS,
    rlsBypass: EL7_LOCKS.RLS_BYPASS,
    tenantBypass: EL7_LOCKS.TENANT_BYPASS,
    universeBypass: EL7_LOCKS.UNIVERSE_BYPASS,
  };

  const base = {
    l4AutonomyEnabled: EL7_LOCKS.L4_AUTONOMY_ENABLED,
    locks: EL7_LOCKS,
    softWire,
  };

  if (input.authorizeModelDownload === true && EL7_LOCKS.AUTO_MODEL_DOWNLOAD === false) {
    return {
      allowed: false,
      failureClass: 'AUTO_DOWNLOAD_DENIED',
      reason: 'Automatic model download is denied without explicit separate authorization channel.',
      ...base,
    };
  }

  if (
    input.authorizeDriverOrRuntimeInstall === true &&
    EL7_LOCKS.AUTO_DRIVER_OR_RUNTIME_INSTALL === false
  ) {
    return {
      allowed: false,
      failureClass: 'AUTO_INSTALL_DENIED',
      reason: 'Automatic driver/runtime install is denied.',
      ...base,
    };
  }

  // Soft deny-hooks: absent or false boundary signals block inference.
  if (input.authVerified !== true) {
    return {
      allowed: false,
      failureClass: 'AUTH_REQUIRED',
      reason: 'auth.ts verification soft-wire required; EL7 never bypasses auth.',
      ...base,
    };
  }

  if (input.guardianAllow !== true) {
    return {
      allowed: false,
      failureClass: 'GUARDIAN_DENIED',
      reason: 'Guardian soft-wire deny — inference blocked until Guardian allows.',
      ...base,
    };
  }

  if (!input.tenantId || input.rlsTenantInScope !== true) {
    return {
      allowed: false,
      failureClass: 'RLS_TENANT_DENIED',
      reason: 'tenantId + RLS/tenant soft-wire required; EL7 never bypasses tenant/RLS.',
      ...base,
    };
  }

  if (!input.universeScope || input.universeBoundaryOk !== true) {
    return {
      allowed: false,
      failureClass: 'UNIVERSE_BOUNDARY_DENIED',
      reason: 'Universe scope soft-wire required; EL7 never bypasses Universe boundaries.',
      ...base,
    };
  }

  if (input.authorized !== true) {
    return {
      allowed: false,
      failureClass: 'POLICY_DENIED',
      reason: 'Local inference requires explicit authorization; canAutoExecute remains false.',
      ...base,
    };
  }

  if (!input.taskId || !input.modelId) {
    return {
      allowed: false,
      failureClass: 'POLICY_DENIED',
      reason: 'taskId and modelId are required.',
      ...base,
    };
  }

  return {
    allowed: true,
    failureClass: null,
    reason: 'POLICY_SOFT_WIRE_PASS',
    ...base,
  };
}
