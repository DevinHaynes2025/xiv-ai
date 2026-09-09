import { createHmac, randomUUID } from 'node:crypto';

import { MESH_AGENT_ROLES } from './agent-mesh';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import type { SealedActor } from './hybrid-edge-cloud-types';

export const SEALED_REDACTION = '[REDACTED_SEALED]';
export const CEO_SEALED_VAULT_FILE = 'ceo-sealed-vault.json';
export const ORDINARY_MEMORY_FILES = [
  'founder-memory-vault.json',
  'memory-cortex.json',
  'knowledge-lake.json',
  'agent-messages.json',
  'learning-ledger.json',
] as const;

export type SealedClassification = 'sealed_founder_priority';

export type SealedRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  label: string;
  integrity: string;
  sealedPayload: string;
  classification: SealedClassification;
  sealed: true;
  ordinaryMemory: false;
  productionAuthorization: false;
  createdAt: string;
};

export type SealedGrant = {
  id: string;
  recordId: string;
  tenantId: string;
  universeId: string;
  issuerKind: 'ceo_principal';
  granteeId: string;
  granteeKind: SealedActorKindGrantable;
  expiresAt: string;
  createdAt: string;
};

export type SealedActorKindGrantable = 'ordinary_agent' | 'tool';

export type SealedAuditEvent = {
  id: string;
  at: string;
  action: 'seal' | 'read' | 'grant' | 'route_redact' | 'deny';
  actorId: string;
  actorKind: SealedActor['kind'];
  recordId?: string;
  allowed: boolean;
  reason: string;
};

type VaultStore = {
  records: SealedRecord[];
  grants: SealedGrant[];
  audit: SealedAuditEvent[];
};

const MAX_RECORDS = 2_000;
const MAX_AUDIT = 10_000;
const ORDINARY_ROLES = new Set<string>(MESH_AGENT_ROLES);

function vaultPath(root: string) {
  return xivLocalPath(root, CEO_SEALED_VAULT_FILE);
}

function integrityOf(payload: string, id: string) {
  return createHmac('sha256', `xiv-ceo-sealed:${id}`).update(payload).digest('hex');
}

async function load(root: string): Promise<VaultStore> {
  const parsed = await readJsonFile<VaultStore>(vaultPath(root), { records: [], grants: [], audit: [] });
  return {
    records: Array.isArray(parsed.records) ? parsed.records : [],
    grants: Array.isArray(parsed.grants) ? parsed.grants : [],
    audit: Array.isArray(parsed.audit) ? parsed.audit : [],
  };
}

async function save(root: string, store: VaultStore) {
  await writeJsonFileAtomic(vaultPath(root), {
    records: store.records.slice(-MAX_RECORDS),
    grants: store.grants.slice(-MAX_RECORDS),
    audit: store.audit.slice(-MAX_AUDIT),
  });
}

function liveGrant(grant: SealedGrant, now: number) {
  return Date.parse(grant.expiresAt) > now;
}

function authorizedFor(store: VaultStore, actor: SealedActor, record: SealedRecord, now: number) {
  if (actor.kind === 'ceo_principal' && actor.id) return { allowed: true as const, reason: 'CEO principal sealed-vault access.' };
  if (actor.kind === 'peer' || actor.kind === 'provider' || actor.kind === 'cloud_adapter') {
    return { allowed: false as const, reason: 'Peers, providers, and cloud adapters cannot read sealed content.' };
  }
  if (actor.kind === 'ordinary_agent' && actor.role && ORDINARY_ROLES.has(actor.role)) {
    const grant = store.grants.find(
      (item) =>
        item.recordId === record.id &&
        item.granteeId === actor.id &&
        item.granteeKind === 'ordinary_agent' &&
        item.tenantId === record.tenantId &&
        item.universeId === record.universeId &&
        liveGrant(item, now),
    );
    if (!grant) return { allowed: false as const, reason: 'Ordinary agents are denied sealed access without an explicit grant.' };
    return { allowed: true as const, reason: 'Explicit time-bounded grant.' };
  }
  if (actor.kind === 'tool') {
    const grant = store.grants.find(
      (item) =>
        item.recordId === record.id &&
        item.granteeId === actor.id &&
        item.granteeKind === 'tool' &&
        liveGrant(item, now),
    );
    if (!grant) return { allowed: false as const, reason: 'Tools cannot read sealed content without an explicit grant.' };
    return { allowed: true as const, reason: 'Explicit time-bounded tool grant.' };
  }
  return { allowed: false as const, reason: 'Sealed vault denies by default.' };
}

async function audit(root: string, store: VaultStore, event: Omit<SealedAuditEvent, 'id' | 'at'>) {
  store.audit.push({
    ...event,
    id: `svaud_${randomUUID()}`,
    at: new Date().toISOString(),
  });
  await save(root, store);
  return store.audit.at(-1)!;
}

export function redactSealedFields<T extends Record<string, unknown>>(payload: T): T {
  const copy = { ...payload };
  for (const key of Object.keys(copy)) {
    if (key === 'sealedPayload' || key === 'payload' || key === 'secret' || key === 'founderPriority') {
      (copy as Record<string, unknown>)[key] = SEALED_REDACTION;
    }
  }
  return copy;
}

export function isOrdinaryMemoryFile(file: string) {
  return (ORDINARY_MEMORY_FILES as readonly string[]).includes(file);
}

export async function sealCeoRecord(input: {
  tenantId: string;
  universeId: string;
  label: string;
  payload: string;
  actor: SealedActor;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.payload.trim() || !input.label.trim()) throw new Error('SEALED_CONTENT_REQUIRED');
  const root = input.root ?? process.cwd();
  const store = await load(root);
  if (input.actor.kind !== 'ceo_principal') {
    await audit(root, store, {
      action: 'deny',
      actorId: input.actor.id,
      actorKind: input.actor.kind,
      allowed: false,
      reason: 'Only the CEO principal may write the sealed vault.',
    });
    return { accepted: false as const, reason: 'SEAL_DENIED_DEFAULT', record: null };
  }
  const id = `sealed_${randomUUID()}`;
  const record: SealedRecord = {
    id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: input.label.trim(),
    sealedPayload: input.payload.trim().slice(0, 8_000),
    integrity: integrityOf(input.payload.trim().slice(0, 8_000), id),
    classification: 'sealed_founder_priority',
    sealed: true,
    ordinaryMemory: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  store.records.push(record);
  await audit(root, store, {
    action: 'seal',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    recordId: record.id,
    allowed: true,
    reason: 'CEO principal sealed a founder-priority record.',
  });
  return { accepted: true as const, reason: 'SEALED', record: { ...record, sealedPayload: SEALED_REDACTION } };
}

export async function readCeoSealedRecord(input: {
  recordId: string;
  tenantId: string;
  universeId: string;
  actor: SealedActor;
  now?: number;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const record = store.records.find(
    (item) => item.id === input.recordId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!record) {
    await audit(root, store, {
      action: 'deny',
      actorId: input.actor.id,
      actorKind: input.actor.kind,
      recordId: input.recordId,
      allowed: false,
      reason: 'Sealed record not found in tenant/Universe scope.',
    });
    return { allowed: false as const, state: 'DENIED' as const, payload: null, reason: 'SEALED_NOT_FOUND' };
  }
  const now = input.now ?? Date.now();
  const access = authorizedFor(store, input.actor, record, now);
  if (!access.allowed) {
    await audit(root, store, {
      action: 'deny',
      actorId: input.actor.id,
      actorKind: input.actor.kind,
      recordId: record.id,
      allowed: false,
      reason: access.reason,
    });
    return { allowed: false as const, state: 'DENIED' as const, payload: null, reason: access.reason, redacted: SEALED_REDACTION };
  }
  if (record.integrity !== integrityOf(record.sealedPayload, record.id)) {
    await audit(root, store, {
      action: 'deny',
      actorId: input.actor.id,
      actorKind: input.actor.kind,
      recordId: record.id,
      allowed: false,
      reason: 'Sealed integrity mismatch.',
    });
    return { allowed: false as const, state: 'DENIED' as const, payload: null, reason: 'SEALED_INTEGRITY_MISMATCH' };
  }
  await audit(root, store, {
    action: 'read',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    recordId: record.id,
    allowed: true,
    reason: access.reason,
  });
  return { allowed: true as const, state: 'AVAILABLE' as const, payload: record.sealedPayload, reason: access.reason, record };
}

export async function grantSealedAccess(input: {
  recordId: string;
  tenantId: string;
  universeId: string;
  issuer: SealedActor;
  grantee: { id: string; kind: SealedActorKindGrantable };
  ttlMs?: number;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  if (input.issuer.kind !== 'ceo_principal') {
    await audit(root, store, {
      action: 'deny',
      actorId: input.issuer.id,
      actorKind: input.issuer.kind,
      recordId: input.recordId,
      allowed: false,
      reason: 'Only the CEO principal may grant sealed access.',
    });
    return { granted: false as const, reason: 'GRANT_DENIED_DEFAULT' };
  }
  const record = store.records.find(
    (item) => item.id === input.recordId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!record) return { granted: false as const, reason: 'SEALED_NOT_FOUND' };
  const ttlMs = Math.max(1_000, Math.min(input.ttlMs ?? 5 * 60_000, 60 * 60_000));
  const grant: SealedGrant = {
    id: `sgrant_${randomUUID()}`,
    recordId: record.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    issuerKind: 'ceo_principal',
    granteeId: input.grantee.id,
    granteeKind: input.grantee.kind,
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
    createdAt: new Date().toISOString(),
  };
  store.grants.push(grant);
  await audit(root, store, {
    action: 'grant',
    actorId: input.issuer.id,
    actorKind: input.issuer.kind,
    recordId: record.id,
    allowed: true,
    reason: `Explicit grant to ${input.grantee.kind}:${input.grantee.id}`,
  });
  return { granted: true as const, grant };
}

export async function redactSealedForRouting(input: {
  recordId: string;
  tenantId: string;
  universeId: string;
  destination: 'agent_bus' | 'cloud' | 'peer' | 'provider';
  actor: SealedActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const record = store.records.find(
    (item) => item.id === input.recordId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  const redacted = redactSealedFields({
    recordId: input.recordId,
    destination: input.destination,
    sealedPayload: record?.sealedPayload ?? '',
    label: record?.label ?? '',
  });
  await audit(root, store, {
    action: 'route_redact',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    recordId: input.recordId,
    allowed: false,
    reason: `Sealed fields redacted before ${input.destination} routing.`,
  });
  return {
    redacted,
    leaked: redacted.sealedPayload !== (record?.sealedPayload ?? '') && redacted.sealedPayload === SEALED_REDACTION,
    destination: input.destination,
  };
}

export async function listSealedAudit(input: {
  tenantId?: string;
  universeId?: string;
  deniedOnly?: boolean;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  return store.audit.filter((event) => {
    if (input.deniedOnly && event.allowed) return false;
    return true;
  });
}

export async function sealedVaultStats(root = process.cwd()) {
  const store = await load(root);
  return {
    records: store.records.length,
    grants: store.grants.length,
    audit: store.audit.length,
    denied: store.audit.filter((event) => event.action === 'deny').length,
    file: CEO_SEALED_VAULT_FILE,
    ordinaryMemorySeparated: true as const,
    denyByDefault: true as const,
    productionAuthorization: false as const,
  };
}
