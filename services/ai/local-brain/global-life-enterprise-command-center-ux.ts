/**
 * 62L-DG Global Life & Enterprise Command Center UX —
 * Command Center; universal search/evidence; mobile-first contracts extending DF.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DG_LOCKS,
  HONESTY_BANNER,
  MAX_COMMAND_CENTER_SURFACES,
  type CommandCenterSurfaceId,
  type DgActor,
  type OsMode,
} from './universal-personal-business-ai-os-types';

export type CommandCenter = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  mode: OsMode;
  mobileFirst: true;
  createdAt: string;
};

export type CommandCenterSurface = {
  id: string;
  centerId: string;
  surface: CommandCenterSurfaceId;
  locale: string;
  status: 'CONTRACT_ONLY' | 'STUB' | 'DENIED';
  reason: string;
  extendsDfUx: true;
  createdAt: string;
};

export type UniversalSearchQuery = {
  id: string;
  centerId: string;
  query: string;
  evidenceRequired: true;
  status: 'QUEUED' | 'BOUNDED' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  centers: CommandCenter[];
  surfaces: CommandCenterSurface[];
  searches: UniversalSearchQuery[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-life-enterprise-command-center-ux.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    centers: [],
    surfaces: [],
    searches: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function globalLifeEnterpriseCommandCenterHonesty() {
  return {
    banner: HONESTY_BANNER,
    fullProductionUxShipped: DG_LOCKS.FULL_PRODUCTION_UX_SHIPPED,
    uxContractsBounded: DG_LOCKS.UX_CONTRACTS_BOUNDED_TYPESCRIPT_DOCS,
    mobileFirst: true as const,
    extendsDfUx: true as const,
  };
}

export async function bootstrapGlobalLifeEnterpriseCommandCenter(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  mode?: OsMode;
  root: string;
  actor: DgActor;
}): Promise<CommandCenter> {
  void input.actor;
  const store = await load(input.root);
  const mode = input.mode ?? 'personal';
  const existing = store.centers.find(
    (c) =>
      c.orgId === input.orgId &&
      c.tenantId === input.tenantId &&
      c.universeId === input.universeId &&
      c.mode === mode,
  );
  if (existing) return existing;
  const center: CommandCenter = {
    id: id('dgcc'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    mode,
    mobileFirst: true,
    createdAt: new Date().toISOString(),
  };
  store.centers.push(center);
  await save(input.root, store);
  return center;
}

export async function registerCommandCenterSurface(input: {
  centerId: string;
  surface: CommandCenterSurfaceId;
  locale?: string;
  root: string;
  actor: DgActor;
}): Promise<{ accepted: boolean; reason: string; surface?: CommandCenterSurface }> {
  void input.actor;
  const store = await load(input.root);
  if (store.surfaces.filter((s) => s.centerId === input.centerId).length >= MAX_COMMAND_CENTER_SURFACES) {
    return { accepted: false, reason: 'MAX_COMMAND_CENTER_SURFACES' };
  }
  const surface: CommandCenterSurface = {
    id: id('dgccs'),
    centerId: input.centerId,
    surface: input.surface,
    locale: input.locale ?? 'en',
    status: 'CONTRACT_ONLY',
    reason: 'BOUNDED_UX_CONTRACT_EXTENDING_DF',
    extendsDfUx: true,
    createdAt: new Date().toISOString(),
  };
  store.surfaces.push(surface);
  await save(input.root, store);
  return { accepted: true, reason: surface.reason, surface };
}

export async function runUniversalSearchWithEvidence(input: {
  centerId: string;
  query: string;
  root: string;
  actor: DgActor;
}): Promise<UniversalSearchQuery> {
  void input.actor;
  const store = await load(input.root);
  const search: UniversalSearchQuery = {
    id: id('dgsearch'),
    centerId: input.centerId,
    query: input.query,
    evidenceRequired: true,
    status: input.query.trim() ? 'BOUNDED' : 'DENIED',
    reason: input.query.trim()
      ? 'UNIVERSAL_SEARCH_EVIDENCE_BOUNDED_CONTRACT'
      : 'EMPTY_QUERY_DENIED',
    at: new Date().toISOString(),
  };
  store.searches.push(search);
  await save(input.root, store);
  return search;
}
