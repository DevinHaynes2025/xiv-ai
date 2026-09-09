/**
 * 62L-CL Global Knowledge Server Constellation — small regional cloud service
 * cells under Superbrain coexistence. Enrolled/isolated only.
 * No arbitrary server discovery. Coverage labeled by enrolled/verified only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ALL_WORLD_COVERAGE_REJECTED,
  ARBITRARY_SERVER_DISCOVERY_DENIED,
  CL_LOCKS,
  COVERAGE_LABEL_ENROLLED_ONLY,
  HONESTY_BANNER,
  UNENROLLED_REGIONAL_CELL_UNAVAILABLE,
  type ClActor,
  type CoverageClaimScope,
} from './global-knowledge-server-constellation-types';
import { enrollMiniCloudCell } from './mini-cloud-server-cells';
import type { CkActor } from './cognitive-infra-mini-cloud-history-types';

export type RegionalCellStatus = 'available' | 'unavailable' | 'denied' | 'isolated';

export type RegionalCloudServiceCell = {
  id: string;
  regionCode: string;
  label: string;
  enrolled: boolean;
  isolated: boolean;
  verified: boolean;
  buildsOnMiniCell: boolean;
  miniCellId: string | null;
  status: RegionalCellStatus;
  reason: string;
  createdAt: string;
};

export type ConstellationRecord = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  name: string;
  coexistenceWithSuperbrain: true;
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  cellIds: string[];
  createdAt: string;
};

export type CoverageClaim = {
  id: string;
  scope: CoverageClaimScope;
  regionCodes: string[];
  sourceIds: string[];
  status: 'labeled' | 'rejected' | 'not_verified';
  reason: string;
  verified: false | true;
  at: string;
};

export type DiscoveryAttempt = {
  id: string;
  target: string;
  mode: 'arbitrary' | 'enrolled_lookup';
  status: 'denied' | 'allowed';
  reason: string;
  at: string;
};

type Store = {
  constellations: ConstellationRecord[];
  cells: RegionalCloudServiceCell[];
  coverageClaims: CoverageClaim[];
  discoveries: DiscoveryAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-knowledge-server-constellation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    constellations: [],
    cells: [],
    coverageClaims: [],
    discoveries: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function constellationHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CL_LOCKS.L4_AUTONOMY_ENABLED,
    arbitraryServerDiscovery: CL_LOCKS.ARBITRARY_SERVER_DISCOVERY,
    allWorldWithoutEvidence: CL_LOCKS.ALL_WORLD_COVERAGE_WITHOUT_EVIDENCE,
    unenrolledCellAllowed: CL_LOCKS.UNENROLLED_CELL_ALLOWED,
    cellsRequireEnrollment: CL_LOCKS.REGIONAL_CELLS_REQUIRE_ENROLLMENT,
    cellsIsolatedByDefault: CL_LOCKS.REGIONAL_CELLS_ISOLATED_BY_DEFAULT,
    coexistenceLayer: CL_LOCKS.OS_IS_COEXISTENCE_LAYER,
  };
}

export async function bootstrapKnowledgeServerConstellation(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  name?: string;
  root: string;
  actor: ClActor;
}): Promise<ConstellationRecord> {
  const store = await load(input.root);
  const record: ConstellationRecord = {
    id: id('gksc'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    name: input.name?.trim() || 'XIV Global Knowledge Server Constellation',
    coexistenceWithSuperbrain: true,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    cellIds: [],
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.constellations.push(record);
  await save(input.root, store);
  return record;
}

export async function enrollRegionalCloudServiceCell(input: {
  constellationId: string;
  regionCode: string;
  label: string;
  enroll?: boolean;
  verified?: boolean;
  buildsOnMiniCell?: boolean;
  root: string;
  actor: ClActor;
}): Promise<RegionalCloudServiceCell> {
  const store = await load(input.root);
  const constellation = store.constellations.find((c) => c.id === input.constellationId);
  const enrolled = input.enroll === true;
  let miniCellId: string | null = null;
  if (input.buildsOnMiniCell === true && enrolled) {
    const ckActor: CkActor = {
      kind: 'human_operator',
      id: input.actor.id,
      orgId: input.actor.orgId,
      tenantId: input.actor.tenantId,
      universeId: input.actor.universeId,
      role: input.actor.role,
      permissionLevel: input.actor.permissionLevel,
      authorityLevel: input.actor.authorityLevel,
    };
    const mini = await enrollMiniCloudCell({
      label: `${input.label}-mini`,
      kind: 'knowledge_store',
      enrolled: true,
      configured: true,
      root: input.root,
      actor: ckActor,
    });
    miniCellId = mini.id;
  }
  const cell: RegionalCloudServiceCell = {
    id: id('rcell'),
    regionCode: input.regionCode,
    label: input.label,
    enrolled,
    isolated: CL_LOCKS.REGIONAL_CELLS_ISOLATED_BY_DEFAULT,
    verified: enrolled && input.verified === true,
    buildsOnMiniCell: input.buildsOnMiniCell === true,
    miniCellId,
    status: enrolled ? 'available' : 'unavailable',
    reason: enrolled
      ? miniCellId
        ? 'REGIONAL_CELL_ENROLLED_ISOLATED_ON_CK_MINI_CELL'
        : 'REGIONAL_CELL_ENROLLED_ISOLATED'
      : UNENROLLED_REGIONAL_CELL_UNAVAILABLE,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.cells.push(cell);
  if (constellation) {
    constellation.cellIds.push(cell.id);
  }
  await save(input.root, store);
  return cell;
}

export async function requestRegionalCellService(input: {
  cellId: string;
  action: 'serve' | 'sync' | 'query';
  root: string;
  actor: ClActor;
}): Promise<{
  status: 'allowed' | 'denied' | 'unavailable';
  reason: string;
  cell: RegionalCloudServiceCell | null;
}> {
  const store = await load(input.root);
  const cell = store.cells.find((c) => c.id === input.cellId) ?? null;
  void input.actor;
  void input.action;
  if (!cell || !cell.enrolled) {
    return {
      status: cell ? 'denied' : 'unavailable',
      reason: UNENROLLED_REGIONAL_CELL_UNAVAILABLE,
      cell,
    };
  }
  return {
    status: 'allowed',
    reason: 'REGIONAL_CELL_SERVICE_BOUNDED',
    cell,
  };
}

export async function attemptArbitraryServerDiscovery(input: {
  target: string;
  root: string;
  actor: ClActor;
}): Promise<DiscoveryAttempt> {
  const store = await load(input.root);
  const attempt: DiscoveryAttempt = {
    id: id('disc'),
    target: input.target,
    mode: 'arbitrary',
    status: 'denied',
    reason: ARBITRARY_SERVER_DISCOVERY_DENIED,
    at: new Date().toISOString(),
  };
  void input.actor;
  store.discoveries.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function claimCoverage(input: {
  scope: CoverageClaimScope;
  regionCodes?: string[];
  sourceIds?: string[];
  root: string;
  actor: ClActor;
}): Promise<CoverageClaim> {
  const store = await load(input.root);
  const enrolledVerified = store.cells.filter((c) => c.enrolled && c.verified);
  const regions = input.regionCodes ?? [];
  const sources = input.sourceIds ?? [];
  void input.actor;

  if (input.scope === 'all_world' || input.scope === 'unspecified') {
    const claim: CoverageClaim = {
      id: id('cov'),
      scope: input.scope,
      regionCodes: regions,
      sourceIds: sources,
      status: 'rejected',
      reason: ALL_WORLD_COVERAGE_REJECTED,
      verified: false,
      at: new Date().toISOString(),
    };
    store.coverageClaims.push(claim);
    await save(input.root, store);
    return claim;
  }

  const enrolledCodes = new Set(enrolledVerified.map((c) => c.regionCode));
  const allEnrolled =
    regions.length > 0 && regions.every((r) => enrolledCodes.has(r));
  const hasEvidence =
    (input.scope === 'enrolled_regions' && allEnrolled) ||
    (input.scope === 'verified_sources' && sources.length > 0);

  if (!hasEvidence) {
    const claim: CoverageClaim = {
      id: id('cov'),
      scope: input.scope,
      regionCodes: regions,
      sourceIds: sources,
      status: 'not_verified',
      reason: ALL_WORLD_COVERAGE_REJECTED,
      verified: false,
      at: new Date().toISOString(),
    };
    store.coverageClaims.push(claim);
    await save(input.root, store);
    return claim;
  }

  const claim: CoverageClaim = {
    id: id('cov'),
    scope: input.scope,
    regionCodes: regions,
    sourceIds: sources,
    status: 'labeled',
    reason: COVERAGE_LABEL_ENROLLED_ONLY,
    verified: false, // labeled ≠ VERIFIED production claim
    at: new Date().toISOString(),
  };
  store.coverageClaims.push(claim);
  await save(input.root, store);
  return claim;
}
