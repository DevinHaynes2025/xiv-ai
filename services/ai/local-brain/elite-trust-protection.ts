import { createHash, randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { SEALED_REDACTION } from './ceo-sealed-vault';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  denyFounderSealedSurface,
  type FabricActor,
} from './sovereign-sealed-fabric';
import {
  AUTHORITY_NON_TRANSFER,
  BL_LOCKS,
  IMPERSONATION_DENIED,
  SEALED_NON_LEAK,
  SEALED_ROUTE_DENIED,
  type BlActor,
} from './org-agent-universe-types';

export const TRUST_PROTECTION_FILE = 'elite-trust-protection.json';

export type TrustAuditEvent = {
  id: string;
  at: string;
  action:
    | 'identity_check'
    | 'impersonation_deny'
    | 'sealed_deny'
    | 'secret_redact'
    | 'leak_monitor'
    | 'least_privilege'
    | 'global_ops_synapse'
    | 'authority_probe';
  actorId: string;
  actorKind: BlActor['kind'];
  orgId: string;
  allowed: boolean;
  reason: string;
  /** Tamper-evident chain hash over prior event. */
  prevHash: string;
  hash: string;
};

type TrustStore = {
  audit: TrustAuditEvent[];
  redactions: Array<{ id: string; at: string; field: string; redacted: typeof SEALED_REDACTION }>;
  leakMonitors: Array<{
    id: string;
    at: string;
    defensiveOnly: true;
    offensive: false;
    tokenPresentOutsideAllowlist: boolean;
    files: string[];
  }>;
};

const MAX_AUDIT = 20_000;

function storePath(root: string) {
  return xivLocalPath(root, TRUST_PROTECTION_FILE);
}

async function load(root: string): Promise<TrustStore> {
  const parsed = await readJsonFile<TrustStore>(storePath(root), {
    audit: [],
    redactions: [],
    leakMonitors: [],
  });
  return {
    audit: Array.isArray(parsed.audit) ? parsed.audit : [],
    redactions: Array.isArray(parsed.redactions) ? parsed.redactions : [],
    leakMonitors: Array.isArray(parsed.leakMonitors) ? parsed.leakMonitors : [],
  };
}

async function save(root: string, store: TrustStore) {
  await writeJsonFileAtomic(storePath(root), {
    audit: store.audit.slice(-MAX_AUDIT),
    redactions: store.redactions.slice(-MAX_AUDIT),
    leakMonitors: store.leakMonitors.slice(-MAX_AUDIT),
  });
}

function hashEvent(prevHash: string, payload: Omit<TrustAuditEvent, 'hash' | 'prevHash'>) {
  return createHash('sha256')
    .update(`${prevHash}:${payload.id}:${payload.at}:${payload.action}:${payload.allowed}:${payload.reason}`)
    .digest('hex');
}

async function appendAudit(
  root: string,
  event: Omit<TrustAuditEvent, 'id' | 'at' | 'prevHash' | 'hash'> & { at?: string },
) {
  const store = await load(root);
  const prevHash = store.audit.length ? store.audit[store.audit.length - 1].hash : 'GENESIS';
  const base = {
    id: `audit_${randomUUID()}`,
    at: event.at ?? new Date().toISOString(),
    action: event.action,
    actorId: event.actorId,
    actorKind: event.actorKind,
    orgId: event.orgId,
    allowed: event.allowed,
    reason: event.reason,
  };
  const full: TrustAuditEvent = {
    ...base,
    prevHash,
    hash: hashEvent(prevHash, base),
  };
  store.audit.push(full);
  await save(root, store);
  return full;
}

/**
 * Zero-trust identity check — no implicit trust from labels or claimed roles.
 */
export async function zeroTrustIdentityCheck(input: {
  actor: BlActor;
  requiredOrgId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const ok =
    input.actor.orgId === input.requiredOrgId &&
    input.actor.kind !== 'impersonator' &&
    !!input.actor.id &&
    !!input.actor.tenantId;

  const audit = await appendAudit(root, {
    action: 'identity_check',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    orgId: input.requiredOrgId,
    allowed: ok,
    reason: ok ? 'ZERO_TRUST_IDENTITY_OK' : 'ZERO_TRUST_IDENTITY_DENIED',
  });

  return {
    allowed: ok,
    reason: audit.reason,
    audit,
    leastPrivilege: true as const,
    productionAuthorization: false as const,
  };
}

/**
 * Impersonation protection — claimed principal never grants access.
 */
export async function denyImpersonation(input: {
  actor: BlActor;
  targetPrincipalId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const attempting =
    input.actor.kind === 'impersonator' ||
    (input.actor.claimedPrincipalId != null &&
      input.actor.claimedPrincipalId === input.targetPrincipalId &&
      input.actor.id !== input.targetPrincipalId);

  const audit = await appendAudit(root, {
    action: 'impersonation_deny',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    orgId: input.actor.orgId,
    allowed: false,
    reason: IMPERSONATION_DENIED,
  });

  return {
    allowed: false as const,
    reason: IMPERSONATION_DENIED,
    attempting: attempting === true,
    claimedPrincipalId: input.actor.claimedPrincipalId ?? null,
    targetPrincipalId: input.targetPrincipalId,
    audit,
    locks: { /* impersonation never elevates */ },
  };
}

/**
 * Sealed-route denial from ordinary org Universe / cloud / peer / telemetry.
 */
export async function denySealedRouteAccess(input: {
  actor: BlActor;
  surface: 'ordinary_org' | 'cloud' | 'peer' | 'telemetry';
  payload?: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const fabricActor: FabricActor = {
    kind:
      input.actor.kind === 'ceo_principal'
        ? 'ceo_principal'
        : input.surface === 'cloud'
          ? 'cloud_route'
          : input.surface === 'peer'
            ? 'peer_sync'
            : input.surface === 'telemetry'
              ? 'telemetry'
              : 'ordinary_agent',
    id: input.actor.id,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    role: input.actor.role,
  };

  if (input.payload) {
    await denyFounderSealedSurface({
      actor: fabricActor,
      surface:
        input.surface === 'cloud'
          ? 'cloud_route'
          : input.surface === 'peer'
            ? 'peer_sync'
            : input.surface === 'telemetry'
              ? 'telemetry'
              : 'ordinary_cache',
      payload: input.payload,
      root,
    });
  }

  const audit = await appendAudit(root, {
    action: 'sealed_deny',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    orgId: input.actor.orgId,
    allowed: false,
    reason: SEALED_ROUTE_DENIED,
  });

  return {
    allowed: false as const,
    reason: SEALED_ROUTE_DENIED,
    payloadWritten: false as const,
    redacted: SEALED_REDACTION,
    audit,
    locks: { FOUNDER_SEALED_DENY_BY_DEFAULT: BL_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT },
  };
}

/**
 * Secret redaction before any cloud/peer/telemetry egress.
 */
export async function redactSecretsForEgress(input: {
  actor: BlActor;
  payload: Record<string, unknown>;
  sealedFields?: string[];
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const sealedFields = input.sealedFields ?? ['secret', 'token', 'founderSealed', 'password', 'apiKey'];
  const out: Record<string, unknown> = { ...input.payload };
  const store = await load(root);

  for (const field of sealedFields) {
    if (field in out && out[field] != null) {
      out[field] = SEALED_REDACTION;
      store.redactions.push({
        id: `redact_${randomUUID()}`,
        at: new Date().toISOString(),
        field,
        redacted: SEALED_REDACTION,
      });
    }
  }
  await save(root, store);
  await appendAudit(root, {
    action: 'secret_redact',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    orgId: input.actor.orgId,
    allowed: true,
    reason: 'SECRETS_REDACTED_FOR_EGRESS',
  });

  return {
    payload: out,
    redacted: true as const,
    productionAuthorization: false as const,
  };
}

/**
 * Defensive leakage monitoring only — never offensive tools.
 */
export async function monitorDefensiveLeakage(input: {
  actor: BlActor;
  token: string;
  allowFiles?: string[];
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const allow = new Set(input.allowFiles ?? ['ceo-sealed-vault.json', TRUST_PROTECTION_FILE]);
  const hits: string[] = [];
  const base = join(root, '.xiv-local');

  try {
    const files = await readdir(base);
    for (const file of files) {
      if (allow.has(file)) continue;
      try {
        const body = await readFile(join(base, file), 'utf8');
        if (body.includes(input.token)) hits.push(file);
      } catch {
        // skip unreadable
      }
    }
  } catch {
    // no .xiv-local yet
  }

  const store = await load(root);
  const monitor = {
    id: `leak_${randomUUID()}`,
    at: new Date().toISOString(),
    defensiveOnly: true as const,
    offensive: false as const,
    tokenPresentOutsideAllowlist: hits.length > 0,
    files: hits,
  };
  store.leakMonitors.push(monitor);
  await save(root, store);
  await appendAudit(root, {
    action: 'leak_monitor',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    orgId: input.actor.orgId,
    allowed: hits.length === 0,
    reason: hits.length ? 'DEFENSIVE_LEAK_DETECTED' : SEALED_NON_LEAK,
  });

  return {
    leaked: hits.length > 0,
    files: hits,
    defensiveOnly: true as const,
    offensive: false as const,
    locks: { OFFENSIVE_LEAKAGE_TOOLS: BL_LOCKS.OFFENSIVE_LEAKAGE_TOOLS },
  };
}

/**
 * Governed synapse to Global Operations Brain / Superbrain.
 * Connect ≠ swallow; connect ≠ leak sealed data; does not transfer org authority.
 */
export async function synapseToGlobalOpsBrain(input: {
  actor: BlActor;
  orgId: string;
  message: string;
  sealedFounderPayload?: string;
  attemptAuthorityTransfer?: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();

  if (input.attemptAuthorityTransfer) {
    const audit = await appendAudit(root, {
      action: 'authority_probe',
      actorId: input.actor.id,
      actorKind: input.actor.kind,
      orgId: input.orgId,
      allowed: false,
      reason: AUTHORITY_NON_TRANSFER,
    });
    return {
      connected: false as const,
      authorityTransferred: false as const,
      sealedLeaked: false as const,
      reason: AUTHORITY_NON_TRANSFER,
      audit,
      locks: {
        SYNAPSE_TRANSFERS_ORG_AUTHORITY: BL_LOCKS.SYNAPSE_TRANSFERS_ORG_AUTHORITY,
        CONNECT_EQUALS_SWALLOW: BL_LOCKS.CONNECT_EQUALS_SWALLOW,
      },
    };
  }

  if (input.sealedFounderPayload) {
    await denySealedRouteAccess({
      actor: input.actor,
      surface: 'ordinary_org',
      payload: input.sealedFounderPayload,
      root,
    });
    const audit = await appendAudit(root, {
      action: 'global_ops_synapse',
      actorId: input.actor.id,
      actorKind: input.actor.kind,
      orgId: input.orgId,
      allowed: false,
      reason: SEALED_NON_LEAK,
    });
    return {
      connected: false as const,
      authorityTransferred: false as const,
      sealedLeaked: false as const,
      reason: SEALED_NON_LEAK,
      redacted: SEALED_REDACTION,
      audit,
      locks: {
        CONNECT_EQUALS_LEAK_SEALED: BL_LOCKS.CONNECT_EQUALS_LEAK_SEALED,
        SYNAPSE_TRANSFERS_ORG_AUTHORITY: BL_LOCKS.SYNAPSE_TRANSFERS_ORG_AUTHORITY,
      },
    };
  }

  // Safe governed synapse: metadata/status only — no authority, no sealed payload.
  const redacted = await redactSecretsForEgress({
    actor: input.actor,
    payload: { message: input.message.slice(0, 2_000), orgId: input.orgId },
    root,
  });

  const audit = await appendAudit(root, {
    action: 'global_ops_synapse',
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    orgId: input.orgId,
    allowed: true,
    reason: 'GOVERNED_GLOBAL_OPS_SYNAPSE_METADATA_ONLY',
  });

  return {
    connected: true as const,
    authorityTransferred: false as const,
    sealedLeaked: false as const,
    payload: redacted.payload,
    reason: 'Governed synapse connected without authority transfer or sealed leak.',
    audit,
    locks: {
      SYNAPSE_TRANSFERS_ORG_AUTHORITY: BL_LOCKS.SYNAPSE_TRANSFERS_ORG_AUTHORITY,
      CONNECT_EQUALS_SWALLOW: BL_LOCKS.CONNECT_EQUALS_SWALLOW,
      CONNECT_EQUALS_LEAK_SEALED: BL_LOCKS.CONNECT_EQUALS_LEAK_SEALED,
    },
  };
}

export async function listTrustAudit(root = process.cwd()) {
  return (await load(root)).audit;
}

export function verifyAuditChain(events: TrustAuditEvent[]) {
  let prev = 'GENESIS';
  for (const event of events) {
    if (event.prevHash !== prev) return { intact: false as const, brokenAt: event.id };
    const expected = hashEvent(event.prevHash, {
      id: event.id,
      at: event.at,
      action: event.action,
      actorId: event.actorId,
      actorKind: event.actorKind,
      orgId: event.orgId,
      allowed: event.allowed,
      reason: event.reason,
    });
    if (expected !== event.hash) return { intact: false as const, brokenAt: event.id };
    prev = event.hash;
  }
  return { intact: true as const };
}

export function eliteTrustHonesty() {
  return {
    zeroTrust: true as const,
    leastPrivilege: true as const,
    sealedRouteDenyByDefault: true as const,
    impersonationProtection: true as const,
    tamperEvidentAuditing: true as const,
    secretRedaction: true as const,
    defensiveLeakageMonitoringOnly: true as const,
    offensiveLeakageTools: false as const,
    productionAuthorization: false as const,
    locks: BL_LOCKS,
  };
}
