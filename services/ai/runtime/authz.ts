import { SECURITY_LOCK } from './flags';
import type { ActorType, CallerContext, Denied, RuntimePermission, TenantScope } from './types';
import { deny } from './types';

/**
 * Authorization sits beneath every runtime service contract (story section 28).
 * The contracts in `control-plane.ts` never trust a caller-supplied scope: they
 * pass the caller here first and the check is scope-equality, not role
 * seniority. Guardian governs the fabric but is still bound to one Universe, so
 * no actor type can read across tenants.
 */

const PERMISSIONS: Readonly<Record<ActorType, readonly RuntimePermission[]>> = Object.freeze({
  guardian: [
    'hardware.validate',
    'runtime.register',
    'runtime.read',
    'runtime.lifecycle',
    'workload.submit',
    'workload.schedule',
    'workload.cancel',
    'agent.assign',
    'model.register',
    'model.revoke',
    'offline.create',
    'offline.sync',
    'budget.write',
    'audit.read',
  ],
  human_operator: [
    'hardware.validate',
    'runtime.register',
    'runtime.read',
    'runtime.lifecycle',
    'workload.submit',
    'workload.schedule',
    'workload.cancel',
    'agent.assign',
    'model.register',
    'model.revoke',
    'offline.create',
    'offline.sync',
    'budget.write',
    'audit.read',
  ],
  // Agents request capabilities. They cannot enroll hardware, move themselves
  // between runtimes, change budgets or approve models.
  agent: ['workload.submit', 'runtime.read'],
  runtime_node: ['runtime.attest', 'runtime.heartbeat', 'workload.execute', 'offline.sync'],
  observer: ['runtime.read', 'audit.read'],
});

export function hasPermission(actorType: ActorType, permission: RuntimePermission): boolean {
  return PERMISSIONS[actorType].includes(permission);
}

export function sameScope(a: TenantScope, b: TenantScope): boolean {
  return a.organizationId === b.organizationId && a.universeId === b.universeId;
}

export function authorize(
  caller: CallerContext,
  permission: RuntimePermission,
  target?: TenantScope,
): Denied | null {
  if (!hasPermission(caller.actorType, permission)) {
    return deny(
      'caller_unauthorized',
      `${caller.actorType} ${caller.actorId} does not hold ${permission}`,
    );
  }
  if (target && !sameScope(caller.scope, target)) {
    return deny(
      'caller_tenant_mismatch',
      `caller universe ${caller.scope.universeId} cannot act on universe ${target.universeId}`,
    );
  }
  return null;
}

/**
 * Section 32: no agent may grant itself infrastructure and nothing in the
 * fabric may widen its own authority while the security lock holds.
 */
export function authorizePermissionExpansion(caller: CallerContext): Denied | null {
  if (!SECURITY_LOCK.AUTO_PERMISSION_EXPANSION) {
    return deny(
      'permission_expansion_forbidden',
      `AUTO_PERMISSION_EXPANSION=false blocks ${caller.actorType} ${caller.actorId} from widening runtime authority`,
    );
  }
  return null;
}
