import { createHmac, randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  CEO_SEALED_VAULT_FILE,
  SEALED_REDACTION,
  readCeoSealedRecord,
  redactSealedForRouting,
  sealCeoRecord,
} from './ceo-sealed-vault';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import type { SealedActor } from './hybrid-edge-cloud-types';
import {
  ACCESS_PREREQUISITES,
  AX_LOCKS,
  COMPARTMENT_TYPES,
  FOUNDER_IMPERSONATION_DENIED,
  FOUNDER_SEALED_DENY_DEFAULT,
  LABEL_ALONE_INSUFFICIENT,
  SEALED_NON_REPLICATING,
  type AccessPrerequisite,
  type AxEvidenceState,
  type CompartmentType,
} from './sovereign-sealed-types';

export const FABRIC_FILE = 'sovereign-sealed-fabric.json';
export const PRIVATE_AGENT_MEMORY_FILE = 'private-agent-memory.json';
export const ORDINARY_CACHE_FILE = 'ordinary-cache.json';
export const TELEMETRY_FILE = 'ordinary-telemetry.json';

export type AccessPrerequisiteState = Record<AccessPrerequisite, boolean>;

export type FabricActorKind =
  | SealedActor['kind']
  | 'other_user'
  | 'ordinary_cache'
  | 'telemetry'
  | 'cloud_route'
  | 'peer_sync'
  | 'label_only_principal';

export type FabricActor = {
  kind: FabricActorKind;
  id: string;
  tenantId: string;
  universeId: string;
  role?: string;
  impersonatingFounder?: boolean;
  labelOnly?: boolean;
};

export type CompartmentRecord = {
  id: string;
  type: CompartmentType;
  tenantId: string;
  universeId: string;
  label: string;
  dedicatedKeyId: string;
  dedicatedStorageId: string;
  dedicatedNetworkId: string;
  customerControlledKeys: boolean;
  highAssurance: boolean;
  replicating: false;
  vaultRecordId?: string;
  payloadStoredInVault: boolean;
  createdAt: string;
};

export type FabricAuditEvent = {
  id: string;
  at: string;
  action: 'declare' | 'access' | 'deny' | 'replicate' | 'cache' | 'telemetry' | 'cloud' | 'peer' | 'label_claim';
  actorId: string;
  actorKind: FabricActorKind;
  compartmentId?: string;
  allowed: boolean;
  reason: string;
  prerequisites?: AccessPrerequisiteState;
};

type FabricStore = {
  compartments: CompartmentRecord[];
  audit: FabricAuditEvent[];
};

const emptyStore = (): FabricStore => ({ compartments: [], audit: [] });

function missingPrerequisites(state: AccessPrerequisiteState): AccessPrerequisite[] {
  return ACCESS_PREREQUISITES.filter((key) => state[key] !== true);
}

export function emptyPrerequisites(): AccessPrerequisiteState {
  return {
    identity_controls: false,
    strong_authentication: false,
    cryptographic_key_policy: false,
    device_trust: false,
    audit_evidence: false,
  };
}

export function completePrerequisites(): AccessPrerequisiteState {
  return {
    identity_controls: true,
    strong_authentication: true,
    cryptographic_key_policy: true,
    device_trust: true,
    audit_evidence: true,
  };
}

export function labelAloneClaim(compartmentType: CompartmentType): {
  allowed: false;
  state: 'DENIED';
  reason: typeof LABEL_ALONE_INSUFFICIENT;
  onlyFounderBecauseOfLabel: false;
} {
  return {
    allowed: false,
    state: 'DENIED',
    reason: LABEL_ALONE_INSUFFICIENT,
    onlyFounderBecauseOfLabel: AX_LOCKS.ONLY_FOUNDER_BECAUSE_OF_LABEL,
  };
}

function dedicatedIds(type: CompartmentType, tenantId: string, universeId: string) {
  const scope = `${type}:${tenantId}:${universeId}`;
  return {
    dedicatedKeyId: `key_${createHmac('sha256', 'xiv-ax-key').update(scope).digest('hex').slice(0, 16)}`,
    dedicatedStorageId: `store_${createHmac('sha256', 'xiv-ax-store').update(scope).digest('hex').slice(0, 16)}`,
    dedicatedNetworkId: `net_${createHmac('sha256', 'xiv-ax-net').update(scope).digest('hex').slice(0, 16)}`,
  };
}

async function load(root: string): Promise<FabricStore> {
  const parsed = await readJsonFile<FabricStore>(xivLocalPath(root, FABRIC_FILE), emptyStore());
  return {
    compartments: Array.isArray(parsed.compartments) ? parsed.compartments : [],
    audit: Array.isArray(parsed.audit) ? parsed.audit : [],
  };
}

async function save(root: string, store: FabricStore) {
  await writeJsonFileAtomic(xivLocalPath(root, FABRIC_FILE), {
    compartments: store.compartments.slice(-2_000),
    audit: store.audit.slice(-10_000),
    sharedControls: true,
    isolatedData: true,
    replicating: false,
    productionAuthorization: false,
  });
}

async function audit(root: string, store: FabricStore, event: Omit<FabricAuditEvent, 'id' | 'at'>) {
  store.audit.push({
    ...event,
    id: `axaud_${randomUUID()}`,
    at: new Date().toISOString(),
  });
  await save(root, store);
  return store.audit.at(-1)!;
}

export function listCompartmentTypes(): readonly CompartmentType[] {
  return COMPARTMENT_TYPES;
}

function highAssurance(type: CompartmentType) {
  return type === 'FOUNDER-SEALED' || type === 'GOVERNMENT/REGULATED-SEALED' || type === 'CUSTOMER-MANAGED';
}

export async function declareCompartment(input: {
  type: CompartmentType;
  tenantId: string;
  universeId: string;
  label: string;
  actor: FabricActor;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const ids = dedicatedIds(input.type, input.tenantId, input.universeId);
  const record: CompartmentRecord = {
    id: `cmp_${randomUUID()}`,
    type: input.type,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: input.label,
    ...ids,
    customerControlledKeys: input.type === 'CUSTOMER-MANAGED',
    highAssurance: highAssurance(input.type),
    replicating: false,
    payloadStoredInVault: input.type === 'FOUNDER-SEALED',
    createdAt: new Date().toISOString(),
  };
  store.compartments.push(record);
  await audit(root, store, {
    action: 'declare',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    compartmentId: record.id,
    allowed: true,
    reason: `Declared ${input.type} compartment with isolated keys/storage/network ids.`,
  });
  return record;
}

function sealedActor(actor: FabricActor): SealedActor {
  const kind: SealedActor['kind'] =
    actor.kind === 'ceo_principal' ||
    actor.kind === 'ordinary_agent' ||
    actor.kind === 'tool' ||
    actor.kind === 'peer' ||
    actor.kind === 'provider' ||
    actor.kind === 'cloud_adapter'
      ? actor.kind
      : 'ordinary_agent';
  return { kind, id: actor.id, role: actor.role };
}

export function evaluateAccessPrerequisites(input: {
  actor: FabricActor;
  compartment: Pick<CompartmentRecord, 'type' | 'tenantId' | 'universeId'>;
  prerequisites: AccessPrerequisiteState;
}): {
  allowed: boolean;
  state: AxEvidenceState;
  reason: string;
  missing: AccessPrerequisite[];
  onlyFounderBecauseOfLabel: false;
} {
  if (input.actor.impersonatingFounder) {
    return {
      allowed: false,
      state: 'DENIED',
      reason: FOUNDER_IMPERSONATION_DENIED,
      missing: missingPrerequisites(input.prerequisites),
      onlyFounderBecauseOfLabel: false,
    };
  }
  if (input.actor.tenantId !== input.compartment.tenantId || input.actor.universeId !== input.compartment.universeId) {
    return {
      allowed: false,
      state: 'DENIED',
      reason: 'Cross-Universe sealed access denied (isolated data).',
      missing: missingPrerequisites(input.prerequisites),
      onlyFounderBecauseOfLabel: false,
    };
  }
  if (input.actor.labelOnly || input.actor.kind === 'label_only_principal') {
    const claim = labelAloneClaim(input.compartment.type);
    return {
      allowed: false,
      state: 'DENIED',
      reason: claim.reason,
      missing: ACCESS_PREREQUISITES.slice(),
      onlyFounderBecauseOfLabel: false,
    };
  }
  const missing = missingPrerequisites(input.prerequisites);
  if (missing.length) {
    return {
      allowed: false,
      state: 'DENIED',
      reason: LABEL_ALONE_INSUFFICIENT,
      missing,
      onlyFounderBecauseOfLabel: false,
    };
  }
  if (input.compartment.type === 'GOVERNMENT/REGULATED-SEALED') {
    return {
      allowed: false,
      state: 'DENIED',
      reason: 'GOVERNMENT_REGULATED_ACCESS_NOT_TESTED',
      missing,
      onlyFounderBecauseOfLabel: false,
    };
  }
  if (input.compartment.type === 'FOUNDER-SEALED') {
    const deniedKinds: FabricActorKind[] = [
      'ordinary_agent',
      'tool',
      'peer',
      'provider',
      'cloud_adapter',
      'other_user',
      'ordinary_cache',
      'telemetry',
      'cloud_route',
      'peer_sync',
    ];
    if (deniedKinds.includes(input.actor.kind) || input.actor.kind !== 'ceo_principal') {
      return {
        allowed: false,
        state: 'DENIED',
        reason: FOUNDER_SEALED_DENY_DEFAULT,
        missing,
        onlyFounderBecauseOfLabel: false,
      };
    }
  }
  return {
    allowed: true,
    state: 'PASS',
    reason: 'Identity, authentication, key policy, device trust, and audit evidence are bound.',
    missing,
    onlyFounderBecauseOfLabel: false,
  };
}

export async function accessCompartment(input: {
  compartmentId: string;
  actor: FabricActor;
  prerequisites: AccessPrerequisiteState;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const compartment = store.compartments.find((item) => item.id === input.compartmentId);
  if (!compartment) {
    await audit(root, store, {
      action: 'deny',
      actorId: input.actor.id,
      actorKind: input.actor.kind,
      compartmentId: input.compartmentId,
      allowed: false,
      reason: 'Compartment not found in tenant/Universe fabric.',
      prerequisites: input.prerequisites,
    });
    return { allowed: false as const, state: 'DENIED' as const, payload: null, reason: 'COMPARTMENT_NOT_FOUND' };
  }
  const decision = evaluateAccessPrerequisites({
    actor: input.actor,
    compartment,
    prerequisites: input.prerequisites,
  });
  if (!decision.allowed) {
    await audit(root, store, {
      action: decision.reason === LABEL_ALONE_INSUFFICIENT ? 'label_claim' : 'deny',
      actorId: input.actor.id,
      actorKind: input.actor.kind,
      compartmentId: compartment.id,
      allowed: false,
      reason: decision.reason,
      prerequisites: input.prerequisites,
    });
    return {
      allowed: false as const,
      state: 'DENIED' as const,
      payload: null,
      reason: decision.reason,
      missing: decision.missing,
      redacted: SEALED_REDACTION,
      onlyFounderBecauseOfLabel: false as const,
    };
  }
  let payload: string | null = null;
  if (compartment.type === 'FOUNDER-SEALED' && compartment.vaultRecordId) {
    const vault = await readCeoSealedRecord({
      recordId: compartment.vaultRecordId,
      tenantId: compartment.tenantId,
      universeId: compartment.universeId,
      actor: sealedActor(input.actor),
      root,
    });
    if (!vault.allowed) {
      await audit(root, store, {
        action: 'deny',
        actorId: input.actor.id,
        actorKind: input.actor.kind,
        compartmentId: compartment.id,
        allowed: false,
        reason: vault.reason,
        prerequisites: input.prerequisites,
      });
      return {
        allowed: false as const,
        state: 'DENIED' as const,
        payload: null,
        reason: vault.reason,
        redacted: SEALED_REDACTION,
        onlyFounderBecauseOfLabel: false as const,
      };
    }
    payload = vault.payload;
  }
  await audit(root, store, {
    action: 'access',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    compartmentId: compartment.id,
    allowed: true,
    reason: decision.reason,
    prerequisites: input.prerequisites,
  });
  return {
    allowed: true as const,
    state: 'PASS' as const,
    payload,
    reason: decision.reason,
    compartment,
    onlyFounderBecauseOfLabel: false as const,
  };
}

export async function sealFounderCompartment(input: {
  tenantId: string;
  universeId: string;
  label: string;
  payload: string;
  actor: FabricActor;
  prerequisites: AccessPrerequisiteState;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const declared = await declareCompartment({
    type: 'FOUNDER-SEALED',
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: input.label,
    actor: input.actor,
    root,
  });
  const gate = evaluateAccessPrerequisites({
    actor: input.actor,
    compartment: declared,
    prerequisites: input.prerequisites,
  });
  if (!gate.allowed) {
    const store = await load(root);
    await audit(root, store, {
      action: 'deny',
      actorId: input.actor.id,
      actorKind: input.actor.kind,
      compartmentId: declared.id,
      allowed: false,
      reason: gate.reason,
      prerequisites: input.prerequisites,
    });
    return { accepted: false as const, reason: gate.reason, compartment: declared, record: null };
  }
  const sealed = await sealCeoRecord({
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: input.label,
    payload: input.payload,
    actor: sealedActor(input.actor),
    root,
  });
  if (!sealed.accepted || !sealed.record) {
    return { accepted: false as const, reason: sealed.reason, compartment: declared, record: null };
  }
  const store = await load(root);
  const live = store.compartments.find((item) => item.id === declared.id);
  if (live) live.vaultRecordId = sealed.record.id;
  await save(root, store);
  return { accepted: true as const, reason: 'SEALED', compartment: { ...declared, vaultRecordId: sealed.record.id }, record: sealed.record };
}

export async function denyFounderSealedSurface(input: {
  actor: FabricActor;
  surface: 'ordinary_cache' | 'telemetry' | 'cloud_route' | 'peer_sync' | 'replication';
  payload: string;
  compartmentId?: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const action =
    input.surface === 'ordinary_cache'
      ? 'cache'
      : input.surface === 'telemetry'
        ? 'telemetry'
        : input.surface === 'cloud_route'
          ? 'cloud'
          : input.surface === 'peer_sync'
            ? 'peer'
            : 'replicate';
  await audit(root, store, {
    action,
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    compartmentId: input.compartmentId,
    allowed: false,
    reason: input.surface === 'replication' ? SEALED_NON_REPLICATING : FOUNDER_SEALED_DENY_DEFAULT,
  });
  if (input.surface === 'cloud_route' && input.compartmentId) {
    const compartment = store.compartments.find((item) => item.id === input.compartmentId);
    if (compartment?.vaultRecordId) {
      await redactSealedForRouting({
        recordId: compartment.vaultRecordId,
        tenantId: compartment.tenantId,
        universeId: compartment.universeId,
        destination: 'cloud',
        actor: sealedActor(input.actor),
        root,
      });
    }
  }
  return {
    allowed: false as const,
    state: 'DENIED' as const,
    reason: input.surface === 'replication' ? SEALED_NON_REPLICATING : FOUNDER_SEALED_DENY_DEFAULT,
    leaked: false as const,
    payloadWritten: false as const,
    redacted: SEALED_REDACTION,
  };
}

export async function writePrivateAgentMemory(input: {
  tenantId: string;
  universeId: string;
  agentId: string;
  note: string;
  sealedPayload?: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (input.sealedPayload) {
    return { accepted: false as const, reason: FOUNDER_SEALED_DENY_DEFAULT, file: PRIVATE_AGENT_MEMORY_FILE };
  }
  const path = xivLocalPath(root, PRIVATE_AGENT_MEMORY_FILE);
  const current = await readJsonFile<{ notes: { tenantId: string; universeId: string; agentId: string; note: string }[] }>(path, {
    notes: [],
  });
  current.notes.push({
    tenantId: input.tenantId,
    universeId: input.universeId,
    agentId: input.agentId,
    note: input.note.slice(0, 2_000),
  });
  await writeJsonFileAtomic(path, current);
  return { accepted: true as const, reason: 'PRIVATE_AGENT_MEMORY', file: PRIVATE_AGENT_MEMORY_FILE };
}

export async function scanXivLocalForToken(input: {
  root: string;
  token: string;
  allowFiles?: string[];
}) {
  const dir = xivLocalPath(input.root, '');
  const allow = new Set(input.allowFiles ?? [CEO_SEALED_VAULT_FILE]);
  let files: string[] = [];
  try {
    files = await readdir(dir);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return { scanned: 0, leaks: [] as { file: string }[], leaked: false as const };
    throw error;
  }
  const leaks: { file: string }[] = [];
  for (const file of files) {
    if (file.endsWith('.tmp')) continue;
    const text = await readFile(join(dir, file), 'utf8');
    if (allow.has(file)) continue;
    if (text.includes(input.token)) leaks.push({ file });
  }
  return { scanned: files.length, leaks, leaked: leaks.length > 0 };
}

export async function fabricAudit(root = process.cwd()) {
  const store = await load(root);
  return {
    compartments: store.compartments.length,
    types: [...new Set(store.compartments.map((item) => item.type))],
    denied: store.audit.filter((event) => !event.allowed).length,
    labelAloneDenials: store.audit.filter((event) => event.reason === LABEL_ALONE_INSUFFICIENT).length,
    founderSealedDenials: store.audit.filter((event) => event.reason === FOUNDER_SEALED_DENY_DEFAULT).length,
    audit: store.audit,
    denyByDefault: true as const,
    replicating: false as const,
  };
}
