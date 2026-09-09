/**
 * 62L-EX7 — Route receipt + learning.
 * Explicit fallback chains; no silent fallback.
 * Learning may change ranking/confidence — never permissions / Guardian / RLS.
 * PREFERRED ≠ production authorization.
 * Software wormholes still pass auth (auth gates unchanged by learning).
 */

import { createHash } from 'node:crypto';
import {
  EX7_LOCKS,
  type HybridRouteDecision,
  type HybridRouteReceipt,
  type LearningState,
  type RouteClass,
  type RouteLearningUpdate,
  type RouteState,
} from './types.ts';

export function buildRouteReceipt(input: {
  decision: HybridRouteDecision;
  missionId: string;
  taskId: string;
  tenantId: string;
  universeId: string;
  requestedRouteClass: RouteClass | null;
  nowIso?: string;
}): HybridRouteReceipt {
  const now = input.nowIso ?? new Date().toISOString();
  const actual = input.decision.selectedRouteClass;
  const receiptId = createHash('sha256')
    .update(
      [
        input.decision.decisionId,
        input.decision.requestId,
        actual ?? 'none',
        now,
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 24);

  return {
    receiptId: `rr-${receiptId}`,
    decisionId: input.decision.decisionId,
    requestId: input.decision.requestId,
    missionId: input.missionId,
    taskId: input.taskId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    requestedRouteClass: input.requestedRouteClass,
    actualRouteClass: actual,
    requestedDeviceId: input.decision.selected?.device.deviceId ?? null,
    actualDeviceId: input.decision.selectedDeviceId,
    state: input.decision.state,
    score: input.decision.score,
    fallbackRequested: input.decision.fallbackRequested,
    fallbackActual: input.decision.fallbackActual,
    evidenceRefs: input.decision.evidenceRefs,
    learningState: input.decision.learningState ?? 'OBSERVED',
    permissionsUnchanged: true,
    guardianRlsUnchanged: true,
    createdAt: now,
  };
}

/**
 * Record explicit fallback: requested vs actual must both be present.
 * Silent fallback is forbidden (EX7_LOCKS.SILENT_FALLBACK=false).
 */
export function recordExplicitFallback(input: {
  requested: readonly RouteClass[];
  actual: RouteClass | null;
  silent?: boolean;
}): {
  ok: boolean;
  fallbackRequested: readonly RouteClass[];
  fallbackActual: RouteClass | null;
  fallbackRecorded: boolean;
  reason: string;
} {
  if (input.silent === true || EX7_LOCKS.SILENT_FALLBACK === true) {
    return {
      ok: false,
      fallbackRequested: input.requested,
      fallbackActual: null,
      fallbackRecorded: false,
      reason: 'SILENT_FALLBACK_FORBIDDEN',
    };
  }
  return {
    ok: true,
    fallbackRequested: input.requested,
    fallbackActual: input.actual,
    fallbackRecorded: true,
    reason: 'Fallback recorded with requested vs actual (explicit).',
  };
}

/**
 * Adaptive route learning — ranking/confidence only.
 * Cannot modify permissions, Guardian, RLS, tenant, Universe, or production auth.
 * PREFERRED ≠ production authorization.
 */
export function applyRouteLearning(input: {
  routeClass: RouteClass;
  deviceId: string;
  success: boolean;
  priorState?: LearningState;
}): RouteLearningUpdate {
  void EX7_LOCKS.ROUTE_LEARNING_MODIFIES_PERMISSIONS;
  void EX7_LOCKS.PREFERRED_EQ_PRODUCTION_AUTH;
  void EX7_LOCKS.BROADEN_PERMISSIONS;
  void EX7_LOCKS.WEAKEN_GUARDIAN_RLS;

  let learningState: LearningState = input.priorState ?? 'OBSERVED';
  if (input.success) {
    if (learningState === 'OBSERVED') learningState = 'RANKED';
    else if (learningState === 'RANKED') learningState = 'PREFERRED';
  } else if (learningState === 'PREFERRED' || learningState === 'RANKED') {
    learningState = 'DEPRECATED';
  }

  return {
    routeClass: input.routeClass,
    deviceId: input.deviceId,
    learningState,
    confidenceDelta: input.success ? 0.05 : -0.05,
    rankingDelta: input.success ? 1 : -1,
    permissionsModified: false,
    guardianRlsModified: false,
    productionAuthGranted: false,
  };
}

/** Mesh roles for hybrid routing — no billing/credential/production authority. */
export const EX7_MESH_ROLES = [
  'HybridRouterAgent',
  'ClassicalBaselineAgent',
  'SimulationAgent',
  'HardwareEvidenceAgent',
  'ReviewerAgent',
] as const;

export type Ex7MeshRole = (typeof EX7_MESH_ROLES)[number];

export function meshRoleMayModifyPermissions(_role: Ex7MeshRole): false {
  return false;
}

export function meshRoleMayGrantProductionAuth(_role: Ex7MeshRole): false {
  return false;
}

/**
 * Software wormholes still pass auth — learning/ranking never bypasses gates.
 */
export function wormholeRequiresAuth(state: RouteState): boolean {
  return (
    state !== 'ROUTE_DENIED' &&
    state !== 'EXPIRED' &&
    state !== 'REVOKED' &&
    state !== 'NO_ELIGIBLE_ROUTE'
  );
}
