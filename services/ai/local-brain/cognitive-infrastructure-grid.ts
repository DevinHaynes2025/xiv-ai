/**
 * 62L-CK Cognitive Infrastructure Grid — integration façade.
 * Coordinates mini cells, federation, history mining, agent companies, device fabric.
 * Does NOT swallow unrelated ATTRIBUTION_UNSAFE mega-delta bulk.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CK_LOCKS,
  GRID_COEXISTENCE_LAYER,
  HONESTY_BANNER,
  MEGA_DELTA_SWALLOW_DENIED,
  type CkActor,
} from './cognitive-infra-mini-cloud-history-types';

export type GridSubsystemId =
  | 'mini_cloud_cells'
  | 'server_db_federation'
  | 'historical_pathway_mining'
  | 'agent_operating_companies'
  | 'device_intelligence_fabric'
  | 'cognitive_routing'
  | 'sealed_local_gateway';

export type GridSubsystemRegistration = {
  id: GridSubsystemId;
  label: string;
  layer: 'coexistence';
  megaDeltaSwallowed: false;
  status: 'registered' | 'denied';
  reason: string;
  productionAuthorized: false;
  registeredAt: string;
};

export type MegaDeltaImportAttempt = {
  id: string;
  label: string;
  bytesHint: number;
  attributionUnsafe: boolean;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  subsystems: GridSubsystemRegistration[];
  megaDeltaDenials: MegaDeltaImportAttempt[];
};

const CANONICAL: Array<{ id: GridSubsystemId; label: string }> = [
  { id: 'mini_cloud_cells', label: 'Mini Cloud Server Cells' },
  { id: 'server_db_federation', label: 'Authorized Server/Database Federation' },
  { id: 'historical_pathway_mining', label: 'Global Historical Pathway Mining' },
  { id: 'agent_operating_companies', label: 'Agent Operating Companies' },
  { id: 'device_intelligence_fabric', label: 'Distributed Device Intelligence Fabric' },
  { id: 'cognitive_routing', label: 'Cognitive Routing / Coordination' },
  { id: 'sealed_local_gateway', label: 'Sealed Local-First Gateway' },
];

function storePath(root: string) {
  return xivLocalPath(root, 'cognitive-infrastructure-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { subsystems: [], megaDeltaDenials: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function cognitiveInfraGridHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CK_LOCKS.L4_AUTONOMY_ENABLED,
    gridIsCoexistenceLayer: CK_LOCKS.GRID_IS_COEXISTENCE_LAYER,
    megaPrBulkIncluded: CK_LOCKS.MEGA_PR_BULK_INCLUDED,
    swallowsUnrelatedMegaDelta: CK_LOCKS.GRID_SWALLOWS_UNRELATED_MEGA_DELTA,
    learningIsPermission: CK_LOCKS.LEARNING_IS_PERMISSION,
    productionAuthorization: CK_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export function probeCompanionModules(root: string) {
  const brain = join(root, 'services/ai/local-brain');
  const has = (f: string) => existsSync(join(brain, f));
  return {
    cj: has('intelligence-resource-grid-apprenticeship-types.ts'),
    ci: has('persistent-intelligence-economy-types.ts'),
    ch: has('knowledge-civilization-dept-universities-types.ts'),
    cg: has('deep-knowledge-refinery-os-types.ts'),
    cf: has('data-refinery-compression-replication-types.ts'),
    ce: has('knowledge-excavation-memory-lake-types.ts'),
    cd: has('data-root-local-llm-archive-mesh-types.ts'),
    cdDbMesh: has('authorized-database-connector-mesh.ts'),
  };
}

export async function registerGridSubsystems(input: {
  root: string;
  actor: CkActor;
  attemptMegaDeltaSwallow?: boolean;
  megaDeltaLabel?: string;
  megaDeltaBytesHint?: number;
}): Promise<{
  registrations: GridSubsystemRegistration[];
  megaDeltaDenied: boolean;
  megaDeltaReason: string;
  coexistenceLayer: typeof GRID_COEXISTENCE_LAYER;
}> {
  const store = await load(input.root);

  if (input.attemptMegaDeltaSwallow) {
    const denial: MegaDeltaImportAttempt = {
      id: id('megadeny'),
      label: input.megaDeltaLabel ?? 'ATTRIBUTION_UNSAFE_MEGA_DELTA',
      bytesHint: input.megaDeltaBytesHint ?? 191_000,
      attributionUnsafe: true,
      status: 'denied',
      reason: MEGA_DELTA_SWALLOW_DENIED,
      at: new Date().toISOString(),
    };
    store.megaDeltaDenials.push(denial);
    await save(input.root, store);
    return {
      registrations: store.subsystems,
      megaDeltaDenied: true,
      megaDeltaReason: MEGA_DELTA_SWALLOW_DENIED,
      coexistenceLayer: GRID_COEXISTENCE_LAYER,
    };
  }

  const now = new Date().toISOString();
  const registrations: GridSubsystemRegistration[] = CANONICAL.map((c) => ({
    id: c.id,
    label: c.label,
    layer: 'coexistence',
    megaDeltaSwallowed: false,
    status: 'registered',
    reason: GRID_COEXISTENCE_LAYER,
    productionAuthorized: false,
    registeredAt: now,
  }));

  store.subsystems = registrations;
  await save(input.root, store);

  return {
    registrations,
    megaDeltaDenied: false,
    megaDeltaReason: 'NO_MEGA_DELTA_ATTEMPTED',
    coexistenceLayer: GRID_COEXISTENCE_LAYER,
  };
}

export async function listRegisteredGridSubsystems(root: string) {
  const store = await load(root);
  return store.subsystems;
}
