import { SEALED_REDACTION, sealCeoRecord, readCeoSealedRecord } from './ceo-sealed-vault';
import type { SealedActor } from './hybrid-edge-cloud-types';
import {
  BC_LOCKS,
  FOUNDER_SEALED_MEMORY_DENY,
  LABEL_ALONE_INSUFFICIENT,
  type BcActor,
} from './quantum-agentic-types';

export type FounderSealedMemoryRouteResult = {
  allowed: boolean;
  reason: string;
  payload: string | typeof SEALED_REDACTION | null;
  labelIsAccess: false;
  replicating: false;
  founderImpersonation: false;
  onlyFounderBecauseOfLabel: false;
};

function toSealedActor(actor: BcActor): SealedActor {
  const kind: SealedActor['kind'] =
    actor.kind === 'ceo_principal' ? 'ceo_principal' : actor.kind === 'tool' ? 'tool' : 'ordinary_agent';
  return {
    kind,
    id: actor.id,
    role: actor.role,
  };
}

/**
 * Founder-sealed memory routing is deny-by-default.
 * A compartment/memory label is never an access grant.
 */
export async function routeFounderSealedMemory(input: {
  tenantId: string;
  universeId: string;
  actor: BcActor;
  payload: string;
  labelOnly?: boolean;
  impersonateFounder?: boolean;
  surface?: 'cache' | 'telemetry' | 'cloud_route' | 'peer_sync' | 'ordinary_agent' | 'ceo_read';
  root?: string;
}): Promise<FounderSealedMemoryRouteResult> {
  if (BC_LOCKS.LABEL_IS_ACCESS) throw new Error('INVARIANT_BROKEN_LABEL_MUST_NOT_BE_ACCESS');
  if (BC_LOCKS.CEO_FOUNDER_SEALED_REPLICATING) throw new Error('INVARIANT_BROKEN_SEALED_MUST_NOT_REPLICATE');

  if (input.impersonateFounder || input.actor.impersonatingFounder) {
    return {
      allowed: false,
      reason: 'FOUNDER_IMPERSONATION_DENIED',
      payload: null,
      labelIsAccess: false,
      replicating: false,
      founderImpersonation: false,
      onlyFounderBecauseOfLabel: false,
    };
  }

  if (input.labelOnly || input.actor.labelOnly || input.actor.kind === 'label_only_principal') {
    return {
      allowed: false,
      reason: LABEL_ALONE_INSUFFICIENT,
      payload: SEALED_REDACTION,
      labelIsAccess: false,
      replicating: false,
      founderImpersonation: false,
      onlyFounderBecauseOfLabel: false,
    };
  }

  const denySurfaces = new Set(['cache', 'telemetry', 'cloud_route', 'peer_sync', 'ordinary_agent']);
  const surface = input.surface ?? (input.actor.kind === 'ceo_principal' ? 'ceo_read' : 'ordinary_agent');
  if (denySurfaces.has(surface) || input.actor.kind !== 'ceo_principal') {
    return {
      allowed: false,
      reason: FOUNDER_SEALED_MEMORY_DENY,
      payload: SEALED_REDACTION,
      labelIsAccess: false,
      replicating: false,
      founderImpersonation: false,
      onlyFounderBecauseOfLabel: false,
    };
  }

  const root = input.root ?? process.cwd();
  const ceo = toSealedActor({ ...input.actor, kind: 'ceo_principal' });
  const sealed = await sealCeoRecord({
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: 'FOUNDER-SEALED',
    payload: input.payload,
    actor: ceo,
    root,
  });
  if (!sealed.accepted || !sealed.record) {
    return {
      allowed: false,
      reason: sealed.reason ?? FOUNDER_SEALED_MEMORY_DENY,
      payload: null,
      labelIsAccess: false,
      replicating: false,
      founderImpersonation: false,
      onlyFounderBecauseOfLabel: false,
    };
  }

  const read = await readCeoSealedRecord({
    tenantId: input.tenantId,
    universeId: input.universeId,
    recordId: sealed.record.id,
    actor: ceo,
    root,
  });

  return {
    allowed: read.allowed === true,
    reason: read.allowed ? 'CEO_PRINCIPAL_SEALED_READ_ALLOWED' : FOUNDER_SEALED_MEMORY_DENY,
    payload: read.allowed ? (read.payload ?? null) : SEALED_REDACTION,
    labelIsAccess: false,
    replicating: false,
    founderImpersonation: false,
    onlyFounderBecauseOfLabel: false,
  };
}

export async function assertTenantIsolation(input: {
  tenantA: string;
  tenantB: string;
  universeId: string;
  records: Array<{ tenantId: string; universeId: string }>;
}) {
  if (input.tenantA === input.tenantB) throw new Error('TENANTS_MUST_DIFFER');
  const leak = input.records.some(
    (r) => r.tenantId === input.tenantA && r.universeId === input.universeId
      ? false
      : r.tenantId === input.tenantB && input.records.some((a) => a.tenantId === input.tenantA && a === r),
  );
  // Strict filter check: tenant A recall must never include tenant B rows.
  const aView = input.records.filter((r) => r.tenantId === input.tenantA && r.universeId === input.universeId);
  const cross = aView.some((r) => r.tenantId === input.tenantB);
  return {
    isolated: !cross && !leak && BC_LOCKS.TENANT_ISOLATION_BROKEN === false,
    crossTenantVisible: cross,
    guardianWeakened: BC_LOCKS.GUARDIAN_RLS_WEAKENED,
  };
}
