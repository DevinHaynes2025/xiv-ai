/**
 * 62L-CQ Offline Agent Universe Fabric —
 * Offline agent shifts; massive isolated logical Universe namespaces
 * (not physical millions/trillions running).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CQ_LOCKS,
  HONESTY_BANNER,
  LOGICAL_UNIVERSE_CATALOG_CEILING,
  MAX_ACTIVE_OFFLINE_AGENTS,
  MAX_ACTIVE_UNIVERSE_NAMESPACES,
  OFFLINE_FRESHNESS_STALE_OR_WAITING,
  PHYSICAL_CLAIM_NOT_VERIFIED,
  TRILLION_SCALE_LOGICAL_ONLY,
  type CqActor,
  type CqEvidenceState,
} from './offline-universe-quantum-genome-types';

export type UniverseNamespace = {
  id: string;
  logicalAddress: string;
  label: string;
  isolated: true;
  physicalProcessSpawned: false;
  status: 'cataloged' | 'active' | 'dormant' | 'denied';
  createdAt: string;
};

export type OfflineAgentShift = {
  id: string;
  universeId: string;
  agentId: string;
  mode: 'offline_local_first';
  freshnessSensitive: boolean;
  freshnessState: CqEvidenceState;
  cloudFallbackRequested: boolean;
  sealedSilentCloudFallback: false;
  status: 'active' | 'stale' | 'waiting_data' | 'denied';
  reason: string;
  startedAt: string;
};

export type UniverseFabricRecord = {
  id: string;
  orgId: string;
  tenantId: string;
  logicalCatalogSize: number;
  activeNamespaceCount: number;
  activeAgentCount: number;
  physicalUniversesRunning: 0;
  physicalClaimVerified: false;
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  createdAt: string;
};

type Store = {
  fabrics: UniverseFabricRecord[];
  namespaces: UniverseNamespace[];
  shifts: OfflineAgentShift[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'offline-agent-universe-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    fabrics: [],
    namespaces: [],
    shifts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function offlineUniverseFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CQ_LOCKS.L4_AUTONOMY_ENABLED,
    trillionScaleIsLogical: CQ_LOCKS.TRILLION_SCALE_IS_LOGICAL_ADDRESS_SPACE,
    physicalTrillionProcessesClaimed: CQ_LOCKS.PHYSICAL_TRILLION_PROCESSES_CLAIMED,
    activationBounded: CQ_LOCKS.ACTIVATION_BOUNDED,
    maxActiveNamespaces: MAX_ACTIVE_UNIVERSE_NAMESPACES,
    maxActiveAgents: MAX_ACTIVE_OFFLINE_AGENTS,
    offlineAgentShifts: CQ_LOCKS.OFFLINE_AGENT_SHIFTS,
    sealedSilentCloudFallback: CQ_LOCKS.SEALED_SILENT_AWS_GCP_MODEL_FALLBACK,
  };
}

export async function bootstrapOfflineUniverseFabric(input: {
  orgId: string;
  tenantId: string;
  /** Logical catalog size — sparse address bookkeeping, not process spawn. */
  logicalCatalogSize?: number;
  root: string;
  actor: CqActor;
}): Promise<UniverseFabricRecord> {
  const store = await load(input.root);
  const catalog = Math.min(
    Math.max(0, Math.floor(input.logicalCatalogSize ?? 1_000_000)),
    LOGICAL_UNIVERSE_CATALOG_CEILING,
  );
  const record: UniverseFabricRecord = {
    id: id('ouaf'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    logicalCatalogSize: catalog,
    activeNamespaceCount: 0,
    activeAgentCount: 0,
    physicalUniversesRunning: 0,
    physicalClaimVerified: false,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.fabrics.push(record);
  await save(input.root, store);
  return record;
}

export async function catalogLogicalUniverses(input: {
  fabricId: string;
  /** How many logical addresses to index (metadata only). */
  count: number;
  root: string;
  actor: CqActor;
}): Promise<{
  accepted: true;
  cataloged: number;
  processesSpawned: 0;
  reason: string;
  physicalClaimStatus: 'NOT_VERIFIED';
}> {
  const store = await load(input.root);
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) {
    throw new Error('FABRIC_NOT_FOUND');
  }
  const n = Math.min(Math.max(0, Math.floor(input.count)), 10_000);
  for (let i = 0; i < n; i++) {
    const addr = `univ://logical/${fabric.id}/${fabric.logicalCatalogSize + i}`;
    store.namespaces.push({
      id: id('unsv'),
      logicalAddress: addr,
      label: `logical-universe-${fabric.logicalCatalogSize + i}`,
      isolated: true,
      physicalProcessSpawned: false,
      status: 'cataloged',
      createdAt: new Date().toISOString(),
    });
  }
  fabric.logicalCatalogSize += n;
  void input.actor;
  await save(input.root, store);
  return {
    accepted: true,
    cataloged: n,
    processesSpawned: 0,
    reason: TRILLION_SCALE_LOGICAL_ONLY,
    physicalClaimStatus: 'NOT_VERIFIED',
  };
}

export async function activateUniverseNamespace(input: {
  fabricId: string;
  namespaceId?: string;
  label?: string;
  root: string;
  actor: CqActor;
}): Promise<
  | { accepted: true; namespace: UniverseNamespace; reason: string }
  | { accepted: false; reason: string; status: 'DENIED' }
> {
  const store = await load(input.root);
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) {
    return { accepted: false, reason: 'FABRIC_NOT_FOUND', status: 'DENIED' };
  }
  if (fabric.activeNamespaceCount >= MAX_ACTIVE_UNIVERSE_NAMESPACES) {
    return {
      accepted: false,
      reason: `ACTIVATION_BOUNDED_MAX_${MAX_ACTIVE_UNIVERSE_NAMESPACES}`,
      status: 'DENIED',
    };
  }

  let ns = input.namespaceId
    ? store.namespaces.find((n) => n.id === input.namespaceId)
    : undefined;
  if (!ns) {
    ns = {
      id: id('unsv'),
      logicalAddress: `univ://active/${fabric.id}/${fabric.activeNamespaceCount}`,
      label: input.label?.trim() || `active-universe-${fabric.activeNamespaceCount}`,
      isolated: true,
      physicalProcessSpawned: false,
      status: 'cataloged',
      createdAt: new Date().toISOString(),
    };
    store.namespaces.push(ns);
  }
  ns.status = 'active';
  fabric.activeNamespaceCount += 1;
  void input.actor;
  await save(input.root, store);
  return {
    accepted: true,
    namespace: ns,
    reason: 'NAMESPACE_ACTIVATED_BOUNDED_LOGICAL_ISOLATION',
  };
}

export async function startOfflineAgentShift(input: {
  fabricId: string;
  universeId: string;
  agentId: string;
  freshnessSensitive?: boolean;
  /** Age of local cache in ms; used when freshnessSensitive. */
  cacheAgeMs?: number;
  freshnessTtlMs?: number;
  waitingOnUpstream?: boolean;
  cloudFallbackRequested?: boolean;
  root: string;
  actor: CqActor;
}): Promise<OfflineAgentShift> {
  const store = await load(input.root);
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) throw new Error('FABRIC_NOT_FOUND');
  if (fabric.activeAgentCount >= MAX_ACTIVE_OFFLINE_AGENTS) {
    throw new Error(`ACTIVATION_BOUNDED_MAX_AGENTS_${MAX_ACTIVE_OFFLINE_AGENTS}`);
  }

  const freshnessSensitive = input.freshnessSensitive === true;
  const ttl = input.freshnessTtlMs ?? 60_000;
  const age = input.cacheAgeMs ?? 0;
  let freshnessState: CqEvidenceState = 'PASS';
  let status: OfflineAgentShift['status'] = 'active';
  let reason = 'OFFLINE_AGENT_SHIFT_LOCAL_FIRST';

  if (input.waitingOnUpstream) {
    freshnessState = 'WAITING_DATA';
    status = 'waiting_data';
    reason = OFFLINE_FRESHNESS_STALE_OR_WAITING;
  } else if (freshnessSensitive && age > ttl) {
    freshnessState = 'STALE';
    status = 'stale';
    reason = OFFLINE_FRESHNESS_STALE_OR_WAITING;
  }

  if (input.cloudFallbackRequested && CQ_LOCKS.SEALED_SILENT_AWS_GCP_MODEL_FALLBACK === false) {
    // Offline shifts never silently fall back; cloud must be explicit+authorized elsewhere.
    reason = `${reason}|NO_SILENT_CLOUD_FALLBACK`;
  }

  const shift: OfflineAgentShift = {
    id: id('oash'),
    universeId: input.universeId,
    agentId: input.agentId,
    mode: 'offline_local_first',
    freshnessSensitive,
    freshnessState,
    cloudFallbackRequested: input.cloudFallbackRequested === true,
    sealedSilentCloudFallback: false,
    status,
    reason,
    startedAt: new Date().toISOString(),
  };
  void input.actor;
  store.shifts.push(shift);
  if (status === 'active') fabric.activeAgentCount += 1;
  await save(input.root, store);
  return shift;
}

export function evaluatePhysicalUniverseCountClaim(input: {
  claimedPhysicalCount: number;
  hardwareEvidencePresent: boolean;
}): {
  claimed: number;
  verified: false | true;
  status: 'NOT_VERIFIED' | 'VERIFIED';
  reason: string;
} {
  if (input.claimedPhysicalCount > 0 && !input.hardwareEvidencePresent) {
    return {
      claimed: input.claimedPhysicalCount,
      verified: false,
      status: 'NOT_VERIFIED',
      reason: PHYSICAL_CLAIM_NOT_VERIFIED,
    };
  }
  if (!input.hardwareEvidencePresent) {
    return {
      claimed: input.claimedPhysicalCount,
      verified: false,
      status: 'NOT_VERIFIED',
      reason: PHYSICAL_CLAIM_NOT_VERIFIED,
    };
  }
  // Even with evidence flag, this layer does not auto-assert VERIFIED without external audit.
  return {
    claimed: input.claimedPhysicalCount,
    verified: false,
    status: 'NOT_VERIFIED',
    reason: 'HARDWARE_EVIDENCE_FLAG_PRESENT_BUT_EXTERNAL_AUDIT_REQUIRED_NOT_AUTO_VERIFIED',
  };
}
