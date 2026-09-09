import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  FAILED_APPROACH_RETAINED,
  BR_LOCKS,
  HONESTY_BANNER,
  type ApproachStatus,
  type BrActor,
} from './structured-code-memory-types';

export type CodeModuleNode = {
  path: string;
  kind: 'file' | 'directory';
  children?: string[];
};

export type ArchitectureDecision = {
  id: string;
  title: string;
  decision: string;
  rationale: string;
  alternativesConsidered: string[];
  provenance: string[];
  status: 'accepted' | 'superseded' | 'rejected';
  recordedAt: string;
  actorId: string;
  permissionChange: false;
  productionAuthorized: false;
};

export type FailedApproach = {
  id: string;
  title: string;
  summary: string;
  status: Extract<ApproachStatus, 'failed' | 'rejected'>;
  evidenceRefs: string[];
  provenance: string[];
  retained: true;
  discarded: false;
  recordedAt: string;
  actorId: string;
};

export type CodeMemoryStore = {
  modules: CodeModuleNode[];
  decisions: ArchitectureDecision[];
  failedApproaches: FailedApproach[];
  mappedAt?: string;
};

function storePath(root: string) {
  return xivLocalPath(root, 'structured-code-memory.json');
}

async function load(root: string): Promise<CodeMemoryStore> {
  return readJsonFile<CodeMemoryStore>(storePath(root), {
    modules: [],
    decisions: [],
    failedApproaches: [],
  });
}

async function save(root: string, store: CodeMemoryStore) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.xiv-local',
  'dist',
  'build',
  '.wt-bb',
  '.wt-bh',
  '.wt-at',
  '.wt-as',
  '.wt-ah',
  '.wt-ai',
  '.wt-y',
]);

async function walkBounded(
  absRoot: string,
  absDir: string,
  depth: number,
  maxDepth: number,
  maxNodes: number,
  out: CodeModuleNode[],
): Promise<void> {
  if (out.length >= maxNodes || depth > maxDepth) return;
  let entries;
  try {
    entries = await readdir(absDir, { withFileTypes: true });
  } catch {
    return;
  }
  const children: string[] = [];
  for (const entry of entries) {
    if (out.length >= maxNodes) break;
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const abs = join(absDir, entry.name);
    const rel = relative(absRoot, abs).replace(/\\/g, '/') || '.';
    if (entry.isDirectory()) {
      children.push(rel);
      out.push({ path: rel, kind: 'directory', children: [] });
      await walkBounded(absRoot, abs, depth + 1, maxDepth, maxNodes, out);
    } else if (entry.isFile()) {
      children.push(rel);
      out.push({ path: rel, kind: 'file' });
    }
  }
  const dirRel = relative(absRoot, absDir).replace(/\\/g, '/') || '.';
  const dirNode = out.find((n) => n.path === dirRel && n.kind === 'directory');
  if (dirNode) dirNode.children = children.slice(0, 200);
}

/**
 * Structure/map a bounded slice of the codebase for Structured Code Memory.
 * Depth/node caps keep mapping offline-safe and non-production.
 */
export async function mapCodebaseStructure(input: {
  root?: string;
  mapRoot?: string;
  maxDepth?: number;
  maxNodes?: number;
  actor: BrActor;
}) {
  const root = input.root ?? process.cwd();
  const mapRoot = input.mapRoot ?? root;
  const maxDepth = input.maxDepth ?? 3;
  const maxNodes = input.maxNodes ?? 400;
  const store = await load(root);

  let exists = true;
  try {
    const s = await stat(mapRoot);
    exists = s.isDirectory();
  } catch {
    exists = false;
  }
  if (!exists) {
    return {
      accepted: false as const,
      reason: 'MAP_ROOT_UNAVAILABLE',
      store,
    };
  }

  const modules: CodeModuleNode[] = [{ path: '.', kind: 'directory', children: [] }];
  await walkBounded(mapRoot, mapRoot, 0, maxDepth, maxNodes, modules);
  store.modules = modules;
  store.mappedAt = new Date().toISOString();
  await save(root, store);
  return {
    accepted: true as const,
    reason: 'CODEBASE_MAPPED',
    moduleCount: modules.length,
    mappedAt: store.mappedAt,
    productionAuthorized: false as const,
    l4AutonomyEnabled: BR_LOCKS.L4_AUTONOMY_ENABLED,
    store,
  };
}

export async function recordArchitectureDecision(input: {
  title: string;
  decision: string;
  rationale: string;
  alternativesConsidered?: string[];
  provenance?: string[];
  status?: ArchitectureDecision['status'];
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const entry: ArchitectureDecision = {
    id: id('adr'),
    title: input.title,
    decision: input.decision,
    rationale: input.rationale,
    alternativesConsidered: input.alternativesConsidered ?? [],
    provenance: input.provenance ?? [],
    status: input.status ?? 'accepted',
    recordedAt: new Date().toISOString(),
    actorId: input.actor.id,
    permissionChange: false,
    productionAuthorized: false,
  };
  store.decisions.push(entry);
  store.decisions = store.decisions.slice(-5_000);
  await save(root, store);
  return { accepted: true as const, decision: entry };
}

/**
 * Retain failed / rejected approaches with provenance — negative results are kept.
 */
export async function retainFailedApproach(input: {
  title: string;
  summary: string;
  status: Extract<ApproachStatus, 'failed' | 'rejected'>;
  evidenceRefs?: string[];
  provenance?: string[];
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const entry: FailedApproach = {
    id: id('fail'),
    title: input.title,
    summary: input.summary,
    status: input.status,
    evidenceRefs: input.evidenceRefs ?? [],
    provenance: input.provenance ?? [],
    retained: true,
    discarded: false,
    recordedAt: new Date().toISOString(),
    actorId: input.actor.id,
  };
  store.failedApproaches.push(entry);
  store.failedApproaches = store.failedApproaches.slice(-5_000);
  await save(root, store);
  return {
    accepted: true as const,
    approach: entry,
    reason: FAILED_APPROACH_RETAINED,
    discarded: false as const,
  };
}

export async function listFailedApproaches(root?: string) {
  const store = await load(root ?? process.cwd());
  return store.failedApproaches;
}

export async function getCodeMemoryStore(root?: string) {
  return load(root ?? process.cwd());
}

export function structuredCodeMemoryHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BR_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: BR_LOCKS.PRODUCTION_AUTHORIZATION,
    failedApproachesDiscarded: BR_LOCKS.FAILED_APPROACHES_DISCARDED,
    storeHiddenReasoningTraces: BR_LOCKS.STORE_HIDDEN_REASONING_TRACES,
  };
}
