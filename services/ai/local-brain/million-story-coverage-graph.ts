/**
 * 62L-DS Million-Story Coverage Graph —
 * Combinatorial User Story Graph; not mass ticket spam / not 1M tickets created.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DS_LOCKS,
  HONESTY_BANNER,
  MAX_ACTIVE_SPRINT_STORIES,
  MAX_STORY_ENUMERATION_SAMPLE,
  MILLION_STORY_GRAPH_NOT_MASS_TICKETS,
  STORY_DIMENSIONS,
  type DsActor,
  type StoryDimension,
} from './revenue-intelligence-os-types';

export type CoverageGraph = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  dimensions: StoryDimension[];
  combinatorialEstimate: number;
  ticketsCreated: number;
  enumerationSampleSize: number;
  massTicketSpam: false;
  createdAt: string;
};

export type SprintSelection = {
  id: string;
  graphId: string;
  selectedStoryKeys: string[];
  bounded: true;
  maxActive: number;
  status: 'bounded' | 'denied_unbounded';
  reason: string;
  at: string;
};

type Store = { graphs: CoverageGraph[]; sprints: SprintSelection[] };

function storePath(root: string) {
  return xivLocalPath(root, 'million-story-coverage-graph.json');
}
async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { graphs: [], sprints: [] });
}
async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}
function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function estimateCombinatorialCoverage(
  dimensionCardinalities: Record<string, number>,
): number {
  const values = Object.values(dimensionCardinalities);
  if (values.length === 0) return 0;
  return values.reduce((acc, n) => acc * Math.max(1, n), 1);
}

export function millionStoryCoverageGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    millionStoryEqMillionTickets: DS_LOCKS.MILLION_STORY_EQ_MILLION_TICKETS,
    storyDimensions: STORY_DIMENSIONS,
    maxActiveSprintStories: MAX_ACTIVE_SPRINT_STORIES,
    maxEnumerationSample: MAX_STORY_ENUMERATION_SAMPLE,
  };
}

export async function openCoverageGraph(input: {
  dimensionCardinalities: Partial<Record<StoryDimension, number>>;
  root: string;
  actor: DsActor;
}): Promise<CoverageGraph> {
  const store = await load(input.root);
  const dims = STORY_DIMENSIONS.filter((d) => input.dimensionCardinalities[d] != null);
  const estimate = estimateCombinatorialCoverage(
    Object.fromEntries(dims.map((d) => [d, input.dimensionCardinalities[d] ?? 1])),
  );
  const sampleSize = Math.min(MAX_STORY_ENUMERATION_SAMPLE, estimate);
  const graph: CoverageGraph = {
    id: id('mscg'),
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    dimensions: dims.length > 0 ? dims : [...STORY_DIMENSIONS],
    combinatorialEstimate: estimate,
    ticketsCreated: 0,
    enumerationSampleSize: sampleSize,
    massTicketSpam: false,
    createdAt: new Date().toISOString(),
  };
  store.graphs.push(graph);
  await save(input.root, store);
  return graph;
}

export async function selectActiveSprintStories(input: {
  graphId: string;
  storyKeys: string[];
  root: string;
  actor: DsActor;
}): Promise<SprintSelection> {
  const store = await load(input.root);
  void input.actor;
  const bounded = input.storyKeys.length <= MAX_ACTIVE_SPRINT_STORIES;
  const selection: SprintSelection = {
    id: id('sprint'),
    graphId: input.graphId,
    selectedStoryKeys: bounded
      ? input.storyKeys
      : input.storyKeys.slice(0, MAX_ACTIVE_SPRINT_STORIES),
    bounded: true,
    maxActive: MAX_ACTIVE_SPRINT_STORIES,
    status: bounded ? 'bounded' : 'denied_unbounded',
    reason: bounded
      ? MILLION_STORY_GRAPH_NOT_MASS_TICKETS
      : 'UNBOUNDED_SPRINT_SELECTION_DENIED_CLIPPED',
    at: new Date().toISOString(),
  };
  store.sprints.push(selection);
  await save(input.root, store);
  return selection;
}

export async function attemptSpawnMillionTickets(input: {
  graphId: string;
  root: string;
  actor: DsActor;
}): Promise<{ status: 'denied'; ticketsCreated: 0; reason: string }> {
  void input;
  return {
    status: 'denied',
    ticketsCreated: 0,
    reason: MILLION_STORY_GRAPH_NOT_MASS_TICKETS,
  };
}
