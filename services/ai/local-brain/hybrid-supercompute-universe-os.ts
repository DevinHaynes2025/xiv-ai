/**
 * 62L-CR A — Hybrid Supercompute Universe OS
 * Organizes offline-agent + virtual-Universe foundation into one hybrid compute OS layer.
 * Truthful scale: logical catalog ≠ materialized ≠ running.
 * Extends 62L-CQ offline-agent-universe-fabric when present.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  bootstrapOfflineUniverseFabric,
  offlineUniverseFabricHonesty,
} from './offline-agent-universe-fabric';
import {
  CR_LOCKS,
  HONESTY_BANNER,
  LOGICAL_UNIVERSE_CATALOG_CEILING,
  MAX_ACTIVE_UNIVERSE_NAMESPACES,
  SCALE_LOGICAL_ONLY,
  type CrActor,
} from './hybrid-supercompute-universe-os-types';
import type { CqActor } from './offline-universe-quantum-genome-types';

export type ScaleReport = {
  logicalUniverses: number;
  materializedUniverses: number;
  runningUniverses: number;
  logicalQubits: number;
  materializedQubits: number;
  runningQubits: number;
  logicalNeurons: number;
  materializedNeurons: number;
  runningNeurons: number;
  logicalPathways: number;
  materializedPathways: number;
  runningPathways: number;
  note: string;
};

export type HybridOsNamespace = {
  id: string;
  label: string;
  mode: 'offline_agent' | 'virtual_universe' | 'hybrid';
  materialized: boolean;
  running: boolean;
  sealed: boolean;
  createdAt: string;
};

export type HybridOsBootstrap = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  coexistenceWithOfflineAgents: true;
  coexistenceWithVirtualUniverses: true;
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  scale: ScaleReport;
  namespaces: HybridOsNamespace[];
  reason: string;
  createdAt: string;
};

type Store = {
  boots: HybridOsBootstrap[];
  namespaces: HybridOsNamespace[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'hybrid-supercompute-universe-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { boots: [], namespaces: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function hybridOsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CR_LOCKS.L4_AUTONOMY_ENABLED,
    truthfulScaleReporting: CR_LOCKS.TRUTHFUL_SCALE_REPORTING,
    logicalNeMaterialized: CR_LOCKS.LOGICAL_NE_MATERIALIZED,
    logicalNeRunning: CR_LOCKS.LOGICAL_NE_RUNNING,
    physicalClaimWithoutEvidence: CR_LOCKS.PHYSICAL_CLAIM_WITHOUT_RUNTIME_EVIDENCE,
    unboundedSpawn: CR_LOCKS.UNBOUNDED_PROCESS_SPAWN,
    cqOfflineFabric: offlineUniverseFabricHonesty(),
  };
}

export function buildScaleReport(input?: {
  logicalUniverses?: number;
  materializedUniverses?: number;
  runningUniverses?: number;
  logicalQubits?: number;
  materializedQubits?: number;
  runningQubits?: number;
  logicalNeurons?: number;
  materializedNeurons?: number;
  runningNeurons?: number;
  logicalPathways?: number;
  materializedPathways?: number;
  runningPathways?: number;
}): ScaleReport {
  const logicalUniverses = Math.min(
    Math.max(0, input?.logicalUniverses ?? LOGICAL_UNIVERSE_CATALOG_CEILING),
    LOGICAL_UNIVERSE_CATALOG_CEILING,
  );
  const materializedUniverses = Math.min(
    Math.max(0, input?.materializedUniverses ?? 0),
    MAX_ACTIVE_UNIVERSE_NAMESPACES,
  );
  const runningUniverses = Math.min(
    Math.max(0, input?.runningUniverses ?? 0),
    materializedUniverses,
  );
  return {
    logicalUniverses,
    materializedUniverses,
    runningUniverses,
    logicalQubits: Math.max(0, input?.logicalQubits ?? 0),
    materializedQubits: Math.max(0, input?.materializedQubits ?? 0),
    runningQubits: Math.max(0, input?.runningQubits ?? 0),
    logicalNeurons: Math.max(0, input?.logicalNeurons ?? 0),
    materializedNeurons: Math.max(0, input?.materializedNeurons ?? 0),
    runningNeurons: Math.max(0, input?.runningNeurons ?? 0),
    logicalPathways: Math.max(0, input?.logicalPathways ?? 0),
    materializedPathways: Math.max(0, input?.materializedPathways ?? 0),
    runningPathways: Math.max(0, input?.runningPathways ?? 0),
    note: SCALE_LOGICAL_ONLY,
  };
}

export function scaleReportDistinguishesLogical(
  report: ScaleReport,
): boolean {
  return (
    report.logicalUniverses !== report.materializedUniverses ||
    report.materializedUniverses !== report.runningUniverses ||
    report.note === SCALE_LOGICAL_ONLY
  );
}

export async function bootstrapHybridSupercomputeOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: CrActor;
  scale?: Parameters<typeof buildScaleReport>[0];
}): Promise<HybridOsBootstrap> {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const store = await load(input.root);
  const scale = buildScaleReport(input.scale);

  // Compose with CQ offline-agent universe fabric (coexistence layer).
  const cqActor: CqActor = {
    kind: 'offline_shift_curator',
    id: input.actor.id,
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    role: input.actor.role,
    permissionLevel: input.actor.permissionLevel,
    authorityLevel: input.actor.authorityLevel,
  };
  await bootstrapOfflineUniverseFabric({
    orgId: input.orgId,
    tenantId: input.tenantId,
    root: input.root,
    actor: cqActor,
  });

  const boot: HybridOsBootstrap = {
    id: id('hybrid-os'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    coexistenceWithOfflineAgents: true,
    coexistenceWithVirtualUniverses: true,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    scale,
    namespaces: [],
    reason: 'HYBRID_SUPERCOMPUTE_UNIVERSE_OS_BOOTSTRAPPED_WITH_CQ_FABRIC',
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.boots.push(boot);
  await save(input.root, store);
  return boot;
}

export async function activateUniverseNamespace(input: {
  label: string;
  mode: HybridOsNamespace['mode'];
  sealed?: boolean;
  root: string;
  actor: CrActor;
}): Promise<{ status: 'activated' | 'denied'; namespace?: HybridOsNamespace; reason: string }> {
  const store = await load(input.root);
  const active = store.namespaces.filter((n) => n.running).length;
  if (active >= MAX_ACTIVE_UNIVERSE_NAMESPACES) {
    return {
      status: 'denied',
      reason: `ACTIVATION_BOUNDED_MAX_${MAX_ACTIVE_UNIVERSE_NAMESPACES}`,
    };
  }
  const ns: HybridOsNamespace = {
    id: id('univ-ns'),
    label: input.label,
    mode: input.mode,
    materialized: true,
    running: true,
    sealed: input.sealed === true,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.namespaces.push(ns);
  await save(input.root, store);
  return { status: 'activated', namespace: ns, reason: 'NAMESPACE_ACTIVATED_BOUNDED' };
}
