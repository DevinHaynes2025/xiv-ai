import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export const SEALED_REDACTION = '[REDACTED_SEALED]';
export const SOCIETY_COMPARTMENT_FILE = 'society-privacy-compartments.json';

export type EvidenceState = 'PASS' | 'FAIL' | 'UNAVAILABLE' | 'WAITING_DATA' | 'UNKNOWN' | 'NOT_TESTED';

export type CompartmentActorKind = 'ceo_principal' | 'simulated_founder' | 'ordinary_agent' | 'council' | 'tool';

export type CompartmentActor = {
  id: string;
  kind: CompartmentActorKind;
  role?: string;
};

export type FounderPriorityRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  label: string;
  authorizedStoryTags: string[];
  classification: 'sealed_founder_priority';
  sealedPayload: string;
  sealed: true;
  ordinaryMemory: false;
  productionAuthorization: false;
  createdAt: string;
};

export type CompartmentGrant = {
  id: string;
  recordId: string;
  tenantId: string;
  universeId: string;
  granteeId: string;
  expiresAt: string;
  createdAt: string;
};

export type CompartmentAudit = {
  id: string;
  at: string;
  action: 'seal' | 'read' | 'grant' | 'rewrite_denied' | 'route_redact' | 'gate';
  actorId: string;
  actorKind: CompartmentActorKind;
  recordId?: string;
  allowed: boolean;
  reason: string;
};

type Store = {
  priorities: FounderPriorityRecord[];
  grants: CompartmentGrant[];
  audit: CompartmentAudit[];
};

const MAX_RECORDS = 2_000;

function pathFor(root: string) {
  return xivLocalPath(root, SOCIETY_COMPARTMENT_FILE);
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(pathFor(root), { priorities: [], grants: [], audit: [] });
  return {
    priorities: Array.isArray(parsed.priorities) ? parsed.priorities : [],
    grants: Array.isArray(parsed.grants) ? parsed.grants : [],
    audit: Array.isArray(parsed.audit) ? parsed.audit : [],
  };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(pathFor(root), {
    priorities: store.priorities.slice(-MAX_RECORDS),
    grants: store.grants.slice(-MAX_RECORDS),
    audit: store.audit.slice(-MAX_RECORDS),
  });
}

function liveGrant(grant: CompartmentGrant, now: number) {
  return Date.parse(grant.expiresAt) > now;
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

export function councilMinimumContext(input: {
  topic: string;
  evidenceRefs: string[];
  priority?: FounderPriorityRecord | null;
  authorized: boolean;
}) {
  return {
    topic: input.topic,
    evidenceRefs: input.evidenceRefs.slice(0, 8),
    priorityLabel: input.priority ? input.priority.label : null,
    authorizedStoryTags: input.priority && input.authorized ? input.priority.authorizedStoryTags : [],
    founderPriority: input.authorized && input.priority ? input.priority.label : SEALED_REDACTION,
    sealedPayload: SEALED_REDACTION,
    minimumNecessary: true as const,
  };
}

export async function probeCeoSealedVaultModule(): Promise<{
  state: EvidenceState;
  modulePresent: boolean;
  reason: string;
}> {
  const file = join(dirname(fileURLToPath(import.meta.url)), 'ceo-sealed-vault.ts');
  try {
    await access(file);
    return {
      state: 'WAITING_DATA',
      modulePresent: true,
      reason: 'ceo-sealed-vault.ts is present locally but 62L-AE operations report is not the parent of this child; AG uses society compartments and does not treat sibling WIP as PASS.',
    };
  } catch {
    return {
      state: 'WAITING_DATA',
      modulePresent: false,
      reason: '62L-AE CEO Sealed Vault is not on this AC parent. Society privacy compartments enforce redaction locally.',
    };
  }
}

function mayRead(store: Store, actor: CompartmentActor, record: FounderPriorityRecord, now: number) {
  if (actor.kind === 'ceo_principal') return { allowed: true as const, reason: 'CEO principal sealed-compartment access.' };
  if (actor.kind === 'simulated_founder') {
    return { allowed: false as const, reason: 'Simulated founder agents cannot read or rewrite actual founder priorities.' };
  }
  const grant = store.grants.find(
    (item) =>
      item.recordId === record.id &&
      item.granteeId === actor.id &&
      item.tenantId === record.tenantId &&
      item.universeId === record.universeId &&
      liveGrant(item, now),
  );
  if (!grant) return { allowed: false as const, reason: 'Sealed founder priority is denied without an explicit grant.' };
  return { allowed: true as const, reason: 'Explicit time-bounded grant for minimum necessary context.' };
}

export async function sealFounderPriority(input: {
  tenantId: string;
  universeId: string;
  label: string;
  payload: string;
  authorizedStoryTags: string[];
  actor: CompartmentActor;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const store = await load(root);
  if (input.actor.kind !== 'ceo_principal') {
    store.audit.push({
      id: cortexId('cmpaud'),
      at: new Date().toISOString(),
      action: 'rewrite_denied',
      actorId: input.actor.id,
      actorKind: input.actor.kind,
      allowed: false,
      reason: input.actor.kind === 'simulated_founder'
        ? 'Simulated founder agents cannot write actual founder priorities.'
        : 'Only the CEO principal may seal founder priorities.',
    });
    await save(root, store);
    return {
      accepted: false as const,
      reason: input.actor.kind === 'simulated_founder' ? 'SIMULATED_FOUNDER_CANNOT_REWRITE_PRIORITIES' : 'SEAL_DENIED_DEFAULT',
      record: null,
    };
  }
  const record: FounderPriorityRecord = {
    id: cortexId('priority'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: input.label.trim(),
    authorizedStoryTags: [...new Set(input.authorizedStoryTags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 16),
    classification: 'sealed_founder_priority',
    sealedPayload: input.payload.trim().slice(0, 8_000),
    sealed: true,
    ordinaryMemory: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  store.priorities.push(record);
  store.audit.push({
    id: cortexId('cmpaud'),
    at: new Date().toISOString(),
    action: 'seal',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    recordId: record.id,
    allowed: true,
    reason: 'CEO principal sealed a founder-priority record for society gating.',
  });
  await save(root, store);
  return { accepted: true as const, reason: 'SEALED', record: redactSealedFields({ ...record }) };
}

export async function rewriteFounderPriority(input: {
  recordId: string;
  tenantId: string;
  universeId: string;
  payload: string;
  actor: CompartmentActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const record = store.priorities.find(
    (item) => item.id === input.recordId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!record) return { accepted: false as const, reason: 'PRIORITY_NOT_FOUND' };
  if (input.actor.kind !== 'ceo_principal') {
    store.audit.push({
      id: cortexId('cmpaud'),
      at: new Date().toISOString(),
      action: 'rewrite_denied',
      actorId: input.actor.id,
      actorKind: input.actor.kind,
      recordId: record.id,
      allowed: false,
      reason: 'Simulated founder agents cannot rewrite actual founder priorities.',
    });
    await save(root, store);
    return { accepted: false as const, reason: 'SIMULATED_FOUNDER_CANNOT_REWRITE_PRIORITIES' };
  }
  record.sealedPayload = input.payload.trim().slice(0, 8_000);
  await save(root, store);
  return { accepted: true as const, reason: 'REWRITTEN_BY_CEO_PRINCIPAL', record: redactSealedFields({ ...record }) };
}

export async function grantSealedAccess(input: {
  recordId: string;
  tenantId: string;
  universeId: string;
  granteeId: string;
  actor: CompartmentActor;
  ttlMs?: number;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  if (input.actor.kind !== 'ceo_principal') {
    return { accepted: false as const, reason: 'GRANT_DENIED_DEFAULT' };
  }
  const record = store.priorities.find(
    (item) => item.id === input.recordId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!record) return { accepted: false as const, reason: 'PRIORITY_NOT_FOUND' };
  const grant: CompartmentGrant = {
    id: cortexId('grant'),
    recordId: record.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    granteeId: input.granteeId,
    expiresAt: new Date(Date.now() + Math.max(60_000, Math.min(input.ttlMs ?? 3_600_000, 24 * 60 * 60_000))).toISOString(),
    createdAt: new Date().toISOString(),
  };
  store.grants.push(grant);
  store.audit.push({
    id: cortexId('cmpaud'),
    at: grant.createdAt,
    action: 'grant',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    recordId: record.id,
    allowed: true,
    reason: 'CEO principal issued a time-bounded sealed-access grant.',
  });
  await save(root, store);
  return { accepted: true as const, grant };
}

export async function readFounderPriority(input: {
  recordId: string;
  tenantId: string;
  universeId: string;
  actor: CompartmentActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const record = store.priorities.find(
    (item) => item.id === input.recordId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!record) return { allowed: false as const, reason: 'PRIORITY_NOT_FOUND', record: null, context: null };
  const accessDecision = mayRead(store, input.actor, record, Date.now());
  store.audit.push({
    id: cortexId('cmpaud'),
    at: new Date().toISOString(),
    action: accessDecision.allowed ? 'read' : 'route_redact',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    recordId: record.id,
    allowed: accessDecision.allowed,
    reason: accessDecision.reason,
  });
  await save(root, store);
  if (!accessDecision.allowed) {
    return {
      allowed: false as const,
      reason: accessDecision.reason,
      record: redactSealedFields({ ...record }),
      context: councilMinimumContext({
        topic: record.label,
        evidenceRefs: [],
        priority: record,
        authorized: false,
      }),
    };
  }
  return {
    allowed: true as const,
    reason: accessDecision.reason,
    record: {
      ...redactSealedFields({ ...record }),
      authorizedStoryTags: record.authorizedStoryTags,
    },
    context: councilMinimumContext({
      topic: record.label,
      evidenceRefs: [],
      priority: record,
      authorized: true,
    }),
  };
}

export async function gateStoryAgainstCeoPriorities(input: {
  tenantId: string;
  universeId: string;
  storyTag?: string;
  approved: boolean;
  consequence?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actor: CompartmentActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const scoped = store.priorities.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!input.approved) {
    return { allowed: false as const, state: 'DENIED' as const, reason: 'Unapproved stories cannot enter the society cycle.' };
  }
  if (!scoped.length) {
    return {
      allowed: true as const,
      state: 'PASS' as const,
      reason: 'No sealed founder priorities stored; low-consequence sandbox stories may proceed under existing decision-gate locks.',
    };
  }
  const tag = input.storyTag?.trim();
  const match = scoped.find((item) => tag && item.authorizedStoryTags.includes(tag));
  if (match) {
    store.audit.push({
      id: cortexId('cmpaud'),
      at: new Date().toISOString(),
      action: 'gate',
      actorId: input.actor.id,
      actorKind: input.actor.kind,
      recordId: match.id,
      allowed: true,
      reason: 'Story tag matches a sealed authorized tag.',
    });
    await save(root, store);
    return { allowed: true as const, state: 'PASS' as const, reason: 'Story tag is authorized by a sealed founder priority.' };
  }
  if ((input.consequence ?? 'LOW') === 'LOW' && !tag) {
    return {
      allowed: true as const,
      state: 'PASS' as const,
      reason: 'Low-consequence untagged sandbox work is gated only by the decision gate, not by sealed tags.',
    };
  }
  store.audit.push({
    id: cortexId('cmpaud'),
    at: new Date().toISOString(),
    action: 'gate',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    allowed: false,
    reason: 'Story tag is not authorized by sealed founder priorities.',
  });
  await save(root, store);
  return { allowed: false as const, state: 'DENIED' as const, reason: 'CEO-priority gate denied an unauthorized story tag.' };
}

export async function listSealedPriorities(tenantId: string, universeId: string, root = process.cwd()) {
  const store = await load(root);
  return store.priorities
    .filter((item) => item.tenantId === tenantId && item.universeId === universeId)
    .map((item) => redactSealedFields({ ...item }));
}

export async function compartmentAudit(tenantId: string, universeId: string, root = process.cwd()) {
  const store = await load(root);
  const ids = new Set(store.priorities.filter((item) => item.tenantId === tenantId && item.universeId === universeId).map((item) => item.id));
  return store.audit.filter((item) => !item.recordId || ids.has(item.recordId));
}
