/**
 * 62L-CG Deep Knowledge Refinery OS — integration façade.
 * Registers refinery / archive / search / storage / model-routing /
 * agent-training / edge-runtime as a coexistence layer under Superbrain.
 * Does NOT swallow unrelated ATTRIBUTION_UNSAFE mega-delta bulk.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CG_LOCKS,
  HONESTY_BANNER,
  MEGA_DELTA_SWALLOW_DENIED,
  OS_COEXISTENCE_LAYER,
  type CgActor,
} from './deep-knowledge-refinery-os-types';

export type OsSubsystemId =
  | 'refinery'
  | 'archive'
  | 'search'
  | 'storage'
  | 'model_routing'
  | 'agent_training'
  | 'edge_runtime';

export type OsSubsystemRegistration = {
  id: OsSubsystemId;
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
  subsystems: OsSubsystemRegistration[];
  megaDeltaDenials: MegaDeltaImportAttempt[];
};

const CANONICAL: Array<{ id: OsSubsystemId; label: string }> = [
  { id: 'refinery', label: 'Governed Data Refinery' },
  { id: 'archive', label: 'Historical Archive / Federation' },
  { id: 'search', label: 'Knowledge Retrieval / Search' },
  { id: 'storage', label: 'Storage / Index Compiler' },
  { id: 'model_routing', label: 'Multi-Model Reasoning Fabric' },
  { id: 'agent_training', label: 'Autonomous Research Universities' },
  { id: 'edge_runtime', label: 'Edge Superbrain Deployment' },
];

function storePath(root: string) {
  return xivLocalPath(root, 'deep-knowledge-refinery-os.json');
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

export function deepKnowledgeRefineryOsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CG_LOCKS.L4_AUTONOMY_ENABLED,
    osIsCoexistenceLayer: CG_LOCKS.OS_IS_COEXISTENCE_LAYER,
    megaPrBulkIncluded: CG_LOCKS.MEGA_PR_BULK_INCLUDED,
    swallowsUnrelatedMegaDelta: CG_LOCKS.OS_SWALLOWS_UNRELATED_MEGA_DELTA,
    learningIsPermission: CG_LOCKS.LEARNING_IS_PERMISSION,
    productionAuthorization: CG_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

/**
 * Probe whether CF/CE companion modules exist for coexistence wiring
 * (presence ≠ swallow; no bulk import).
 */
export function probeCompanionModules(root: string) {
  const brain = join(root, 'services/ai/local-brain');
  const has = (f: string) => existsSync(join(brain, f));
  return {
    cf: has('data-refinery-compression-replication-types.ts'),
    ce: has('knowledge-excavation-memory-lake-types.ts'),
    cd: has('data-root-local-llm-archive-mesh-types.ts'),
    ayRefinery: has('governed-data-refinery.ts'),
    bsUniversity: has('software-engineering-university.ts'),
    baCompiler: has('neural-database-compiler.ts'),
  };
}

export async function registerOsSubsystems(input: {
  root: string;
  actor: CgActor;
  attemptMegaDeltaSwallow?: boolean;
  megaDeltaLabel?: string;
  megaDeltaBytesHint?: number;
}): Promise<{
  registrations: OsSubsystemRegistration[];
  megaDeltaDenied: boolean;
  megaDeltaReason: string;
  coexistenceLayer: typeof OS_COEXISTENCE_LAYER;
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
      coexistenceLayer: OS_COEXISTENCE_LAYER,
    };
  }

  const now = new Date().toISOString();
  const registrations: OsSubsystemRegistration[] = CANONICAL.map((c) => ({
    id: c.id,
    label: c.label,
    layer: 'coexistence',
    megaDeltaSwallowed: false,
    status: 'registered',
    reason: OS_COEXISTENCE_LAYER,
    productionAuthorized: false,
    registeredAt: now,
  }));

  store.subsystems = registrations;
  await save(input.root, store);

  return {
    registrations,
    megaDeltaDenied: false,
    megaDeltaReason: 'NO_MEGA_DELTA_ATTEMPTED',
    coexistenceLayer: OS_COEXISTENCE_LAYER,
  };
}

export async function listRegisteredSubsystems(root: string) {
  const store = await load(root);
  return store.subsystems;
}
