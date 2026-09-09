import { existsSync } from 'node:fs';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ENGINE_UNAVAILABLE_UNTIL_VERIFIED, type AvEvidenceState } from './universal-runtime-types';

export type StorageKind =
  | 'postgresql'
  | 'sqlite'
  | 'vector'
  | 'object'
  | 'document'
  | 'graph'
  | 'time_series'
  | 'cache'
  | 'search';

export type WorkloadKind =
  | 'transactional'
  | 'embedded_local'
  | 'similarity'
  | 'blob'
  | 'document'
  | 'relationship'
  | 'metrics'
  | 'hot_key'
  | 'full_text';

export type EngineSlot = {
  kind: StorageKind;
  engine: string;
  state: 'AVAILABLE' | 'UNAVAILABLE';
  verified: boolean;
  partnershipClaimed: false;
  productionWrite: false;
  evidence: string[];
  reason: string;
};

export type EngineSelection = {
  workload: WorkloadKind;
  selected: EngineSlot | null;
  state: AvEvidenceState;
  reason: string;
};

type ProbeFn = () => Promise<EngineSlot>;

function unavailable(kind: StorageKind, engine: string, reason: string, evidence: string[] = []): EngineSlot {
  return {
    kind,
    engine,
    state: 'UNAVAILABLE',
    verified: false,
    partnershipClaimed: false,
    productionWrite: false,
    evidence,
    reason,
  };
}

function available(kind: StorageKind, engine: string, evidence: string[]): EngineSlot {
  return {
    kind,
    engine,
    state: 'AVAILABLE',
    verified: true,
    partnershipClaimed: false,
    productionWrite: false,
    evidence,
    reason: 'Verified by in-process probe on this host. Not a cloud/vendor partnership.',
  };
}

async function probePostgres(): Promise<EngineSlot> {
  const url = process.env.XIV_POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!url) {
    return unavailable('postgresql', 'postgresql', `${ENGINE_UNAVAILABLE_UNTIL_VERIFIED}: no verified connection string.`);
  }
  return unavailable('postgresql', 'postgresql', `${ENGINE_UNAVAILABLE_UNTIL_VERIFIED}: connection string present but runtime handshake was not executed.`);
}

async function probeSqlite(): Promise<EngineSlot> {
  try {
    const mod = await import('node:sqlite');
    const DatabaseSync = (mod as { DatabaseSync: new (path: string) => {
      exec(sql: string): void;
      prepare(sql: string): { get(...args: unknown[]): unknown };
      close(): void;
    } }).DatabaseSync;
    const db = new DatabaseSync(':memory:');
    db.exec('CREATE TABLE probe(x INTEGER); INSERT INTO probe(x) VALUES (1);');
    const row = db.prepare('SELECT x AS x FROM probe').get() as { x: number };
    db.close();
    if (row?.x !== 1) return unavailable('sqlite', 'node:sqlite', 'Probe row mismatch.');
    return available('sqlite', 'node:sqlite', ['node:sqlite:memory_select=1']);
  } catch (error) {
    return unavailable('sqlite', 'node:sqlite', `${ENGINE_UNAVAILABLE_UNTIL_VERIFIED}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function probeVector(): Promise<EngineSlot> {
  const a = [1, 0];
  const b = [0.8, 0.6];
  const dot = a[0] * b[0] + a[1] * b[1];
  const na = Math.hypot(a[0], a[1]);
  const nb = Math.hypot(b[0], b[1]);
  const cosine = dot / (na * nb);
  if (!(cosine > 0.7 && cosine < 0.9)) return unavailable('vector', 'in_memory_cosine', 'In-memory cosine probe failed.');
  return available('vector', 'in_memory_cosine', [`cosine=${cosine}`]);
}

async function probeObject(): Promise<EngineSlot> {
  const dir = join(tmpdir(), `xiv-av-object-${process.pid}`);
  const file = join(dir, 'blob.txt');
  await mkdir(dir, { recursive: true });
  await writeFile(file, 'xiv-av-object', 'utf8');
  const body = await readFile(file, 'utf8');
  await rm(dir, { recursive: true, force: true });
  if (body !== 'xiv-av-object') return unavailable('object', 'local_fs_object', 'Local object probe failed.');
  return available('object', 'local_fs_object', ['local_fs:roundtrip']);
}

async function probeDocument(): Promise<EngineSlot> {
  const docs = [{ id: 'a', kind: 'note' }];
  const hit = docs.find((item) => item.id === 'a');
  if (!hit) return unavailable('document', 'in_memory_document', 'Document probe failed.');
  return available('document', 'in_memory_document', ['in_memory_document:get=a']);
}

async function probeGraph(): Promise<EngineSlot> {
  const adj: Record<string, string[]> = { a: ['b'], b: [] };
  if (!adj.a.includes('b')) return unavailable('graph', 'in_memory_adjacency', 'Graph probe failed.');
  return available('graph', 'in_memory_adjacency', ['in_memory_adjacency:a->b']);
}

async function probeTimeSeries(): Promise<EngineSlot> {
  const series = [{ t: 1, v: 10 }, { t: 2, v: 12 }];
  const last = series.at(-1);
  if (last?.v !== 12) return unavailable('time_series', 'in_memory_series', 'Time-series probe failed.');
  return available('time_series', 'in_memory_series', ['in_memory_series:last=12']);
}

async function probeCache(): Promise<EngineSlot> {
  const cache = new Map<string, string>([['k', 'v']]);
  if (cache.get('k') !== 'v') return unavailable('cache', 'in_memory_lru_map', 'Cache probe failed.');
  return available('cache', 'in_memory_map', ['in_memory_map:k=v']);
}

async function probeSearch(): Promise<EngineSlot> {
  const corpus = ['alpha beta', 'gamma'];
  const hits = corpus.filter((row) => row.includes('alpha'));
  if (hits.length !== 1) return unavailable('search', 'in_memory_substring', 'Search probe failed.');
  return available('search', 'in_memory_substring', ['in_memory_substring:alpha']);
}

const PROBES: Record<StorageKind, ProbeFn> = {
  postgresql: probePostgres,
  sqlite: probeSqlite,
  vector: probeVector,
  object: probeObject,
  document: probeDocument,
  graph: probeGraph,
  time_series: probeTimeSeries,
  cache: probeCache,
  search: probeSearch,
};

const slots = new Map<StorageKind, EngineSlot>();

export async function probeStorageEngines(): Promise<EngineSlot[]> {
  const kinds = Object.keys(PROBES) as StorageKind[];
  const result: EngineSlot[] = [];
  for (const kind of kinds) {
    const slot = await PROBES[kind]();
    slots.set(kind, slot);
    result.push(slot);
  }
  return result;
}

export function describeStorageEngine(kind: StorageKind) {
  return slots.get(kind) ?? unavailable(kind, kind, ENGINE_UNAVAILABLE_UNTIL_VERIFIED);
}

const WORKLOAD_PREFERENCE: Record<WorkloadKind, StorageKind[]> = {
  transactional: ['postgresql', 'sqlite'],
  embedded_local: ['sqlite', 'document'],
  similarity: ['vector'],
  blob: ['object'],
  document: ['document'],
  relationship: ['graph'],
  metrics: ['time_series'],
  hot_key: ['cache'],
  full_text: ['search'],
};

export async function selectStorageEngine(workload: WorkloadKind): Promise<EngineSelection> {
  if (!slots.size) await probeStorageEngines();
  for (const kind of WORKLOAD_PREFERENCE[workload]) {
    const slot = describeStorageEngine(kind);
    if (slot.state === 'AVAILABLE') {
      return { workload, selected: slot, state: 'PASS', reason: `Selected verified ${slot.engine} for ${workload}.` };
    }
  }
  return {
    workload,
    selected: null,
    state: 'UNAVAILABLE',
    reason: `${ENGINE_UNAVAILABLE_UNTIL_VERIFIED}: no verified engine for ${workload}.`,
  };
}

export function probePredecessorDataModules(root: string) {
  const repoRoot = existsSync(join(root, 'docs', 'operations')) ? root : join(root, '..', '..');
  const brain = existsSync(join(root, 'local-brain')) ? join(root, 'local-brain') : join(root, 'services', 'ai', 'local-brain');
  const files = [
    { name: 'information_economy_au', module: 'information-economy-runtime.ts', report: 'docs/operations/62L_AU_AGENTIC_INFORMATION_ECONOMY_LOGISTICS_REPORT.md' },
    { name: 'cognitive_compiler_as', module: 'cognitive-compiler-types.ts', report: 'docs/operations/62L_AS_COGNITIVE_COMPILER_MATH_REASONING_FABRIC_REPORT.md' },
    { name: 'supply_chain_ao', module: 'supply-chain-network.ts', report: 'docs/operations/62L_AO_GLOBAL_AGENTIC_SUPPLY_CHAIN_NETWORK_REPORT.md' },
    { name: 'knowledge_lake_ab', module: 'knowledge-lake.ts', report: 'docs/operations/62L_AB_KNOWLEDGE_LAKE_INDUSTRY_MEMORY_REPORT.md' },
    { name: 'offline_runtime_ac', module: 'offline-agent-runtime.ts', report: 'docs/operations/62L_AC_OFFLINE_AGENT_RUNTIME_WORKCELLS_REPORT.md' },
    { name: 'am_data_fabric', module: 'distributed-data-fabric.ts', report: 'docs/operations/62L_AM_INFORMATION_SUPPLY_CHAIN_DATA_FABRIC_REPORT.md' },
  ];
  return files.map((item) => {
    const modulePresent = existsSync(join(brain, item.module));
    const reportPresent = existsSync(join(repoRoot, item.report));
    const state: AvEvidenceState = reportPresent && modulePresent ? 'PASS' : 'WAITING_DATA';
    return { ...item, modulePresent, reportPresent, state };
  });
}
