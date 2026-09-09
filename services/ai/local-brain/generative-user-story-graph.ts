/**
 * 62L-DR Generative User Story Graph —
 * Combinatorial coverage across persona/industry/geography/device/agent/integration/
 * security/authority/pricing/offline-online/failure — capable of representing 1M+
 * combinations without creating 1M tickets. Active sprint selection stays bounded.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DR_LOCKS,
  HONESTY_BANNER,
  MAX_ACTIVE_SPRINT_STORIES,
  SPRINT_SELECTION_BOUNDED,
  STORY_DIMENSIONS,
  STORY_GRAPH_NO_1M_TICKETS,
  type DrActor,
  type StoryDimension,
} from './enterprise-nervous-revenue-command-types';

export type StoryAxisValues = Record<StoryDimension, readonly string[]>;

/** Compact default axes — combinatorial space ≥ 1M without materializing tickets. */
export const DEFAULT_STORY_AXES: StoryAxisValues = Object.freeze({
  persona: Object.freeze([
    'founder',
    'cro',
    'cfo',
    'ops',
    'engineer',
    'sdr',
    'cs',
    'partner',
  ]),
  industry: Object.freeze([
    'saas',
    'fintech',
    'health',
    'retail',
    'manufacturing',
    'logistics',
    'media',
    'education',
  ]),
  geography: Object.freeze(['na', 'latam', 'emea', 'apac', 'mena', 'af', 'anz', 'global']),
  device: Object.freeze(['desktop', 'mobile', 'tablet', 'edge', 'kiosk', 'server', 'wearable', 'tv']),
  agent: Object.freeze([
    'cro',
    'sdr',
    'ae',
    'negotiation',
    'cs',
    'cfo',
    'virtual_ceo',
    'business_law',
  ]),
  integration: Object.freeze([
    'crm',
    'erp',
    'billing',
    'email',
    'calendar',
    'slack',
    'storage',
    'analytics',
  ]),
  security: Object.freeze([
    'sealed',
    'deny_default',
    'mfa',
    'rbac',
    'audit',
    'offline',
    'zero_trust',
    'heartbeat',
  ]),
  authority: Object.freeze([
    'read',
    'draft',
    'recommend',
    'human_gate',
    'founder_gate',
    'denied',
    'sandbox',
    'advisory',
  ]),
  pricing: Object.freeze([
    'free',
    'trial',
    'seat',
    'usage',
    'enterprise',
    'partner',
    'pilot',
    'custom',
  ]),
  offline_online: Object.freeze([
    'offline_only',
    'online_only',
    'hybrid',
    'store_forward',
    'degraded',
    'reconnect',
    'airgap',
    'edge_sync',
  ]),
  failure: Object.freeze([
    'timeout',
    'denied',
    'stale_heartbeat',
    'missing_scope',
    'schema_drift',
    'offline',
    'partial',
    'conflict',
  ]),
}) as StoryAxisValues;

export type StoryCoordinate = Partial<Record<StoryDimension, string>>;

export type SprintStory = {
  id: string;
  coordinate: StoryCoordinate;
  title: string;
  ticketMaterialized: false;
};

export type UserStoryGraph = {
  id: string;
  axes: StoryAxisValues;
  logicalCombinationCount: number;
  materializedTicketCount: 0;
  activeSprint: SprintStory[];
  maxActiveSprint: typeof MAX_ACTIVE_SPRINT_STORIES;
  createdAt: string;
};

type Store = { graphs: UserStoryGraph[] };

function storePath(root: string) {
  return xivLocalPath(root, 'generative-user-story-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { graphs: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function computeLogicalCombinationCount(axes: StoryAxisValues): number {
  let n = 1;
  for (const dim of STORY_DIMENSIONS) {
    n *= axes[dim].length;
  }
  return n;
}

export function generativeUserStoryGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    millionStoryEqMillionTickets: DR_LOCKS.MILLION_STORY_EQ_MILLION_TICKETS,
    unboundedSprintSelection: DR_LOCKS.UNBOUNDED_SPRINT_SELECTION,
    maxActiveSprint: MAX_ACTIVE_SPRINT_STORIES,
    dimensions: STORY_DIMENSIONS,
  };
}

export async function bootstrapUserStoryGraph(input: {
  axes?: StoryAxisValues;
  root: string;
  actor: DrActor;
}): Promise<UserStoryGraph> {
  const store = await load(input.root);
  void input.actor;
  const axes = input.axes ?? DEFAULT_STORY_AXES;
  const logicalCombinationCount = computeLogicalCombinationCount(axes);
  const graph: UserStoryGraph = {
    id: id('usg'),
    axes,
    logicalCombinationCount,
    materializedTicketCount: 0,
    activeSprint: [],
    maxActiveSprint: MAX_ACTIVE_SPRINT_STORIES,
    createdAt: new Date().toISOString(),
  };
  store.graphs.push(graph);
  await save(input.root, store);
  return graph;
}

/** Enumerate a sample of coordinates without spawning ticket records. */
export function enumerateStorySample(
  axes: StoryAxisValues,
  limit = 16,
): Array<{ coordinate: StoryCoordinate; title: string }> {
  const samples: Array<{ coordinate: StoryCoordinate; title: string }> = [];
  const dims = STORY_DIMENSIONS;
  for (let i = 0; i < limit; i++) {
    const coordinate: StoryCoordinate = {};
    for (let d = 0; d < dims.length; d++) {
      const dim = dims[d];
      const vals = axes[dim];
      coordinate[dim] = vals[i % vals.length];
    }
    samples.push({
      coordinate,
      title: `USG/${Object.values(coordinate).join('/')}`,
    });
  }
  return samples;
}

export async function selectActiveSprint(input: {
  graphId: string;
  coordinates: StoryCoordinate[];
  root: string;
  actor: DrActor;
}): Promise<{
  status: 'bounded' | 'denied';
  reason: string;
  sprint: SprintStory[];
  graph: UserStoryGraph | null;
}> {
  const store = await load(input.root);
  void input.actor;
  const graph = store.graphs.find((g) => g.id === input.graphId) ?? null;
  if (!graph) {
    return { status: 'denied', reason: 'GRAPH_NOT_FOUND', sprint: [], graph: null };
  }

  const bounded = input.coordinates.slice(0, MAX_ACTIVE_SPRINT_STORIES);
  const overflow = input.coordinates.length > MAX_ACTIVE_SPRINT_STORIES;
  graph.activeSprint = bounded.map((coordinate) => ({
    id: id('usstory'),
    coordinate,
    title: `USG/${Object.values(coordinate).join('/')}`,
    ticketMaterialized: false as const,
  }));
  graph.materializedTicketCount = 0;
  await save(input.root, store);

  return {
    status: 'bounded',
    reason: overflow ? SPRINT_SELECTION_BOUNDED : STORY_GRAPH_NO_1M_TICKETS,
    sprint: graph.activeSprint,
    graph,
  };
}

export async function attemptSpawnMillionTickets(input: {
  graphId: string;
  root: string;
  actor: DrActor;
}): Promise<{
  status: 'denied';
  reason: string;
  materializedTicketCount: 0;
  logicalCombinationCount: number;
}> {
  const store = await load(input.root);
  void input.actor;
  const graph = store.graphs.find((g) => g.id === input.graphId);
  const logical = graph?.logicalCombinationCount ?? computeLogicalCombinationCount(DEFAULT_STORY_AXES);
  if (graph) {
    graph.materializedTicketCount = 0;
    await save(input.root, store);
  }
  return {
    status: 'denied',
    reason: STORY_GRAPH_NO_1M_TICKETS,
    materializedTicketCount: 0,
    logicalCombinationCount: logical,
  };
}
