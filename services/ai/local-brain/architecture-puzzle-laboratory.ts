import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BT_LOCKS,
  DEFAULT_PUZZLE_MAX_DEPTH,
  DEFAULT_PUZZLE_MAX_HOPS,
  PUZZLE_BOUNDS_EXCEEDED,
} from './apprenticeship-experiment-evolution-types';

/**
 * Architecture Puzzle Laboratory — bounded architecture puzzle decomposition.
 * Not infinite split; hop/depth bounds enforced.
 */

export const PUZZLE_LAB_STORE = 'architecture-puzzle-laboratory.json';

export type PuzzleNode = {
  id: string;
  label: string;
  depth: number;
  hopIndex: number;
  parentId: string | null;
};

export type PuzzleDecompositionRecord = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  rootLabel: string;
  maxDepth: number;
  maxHops: number;
  nodes: PuzzleNode[];
  hopsUsed: number;
  maxDepthReached: number;
  bounded: true;
  truncated: boolean;
  createdAt: string;
  productionAuthorized: false;
};

type PuzzleStore = {
  puzzles: PuzzleDecompositionRecord[];
  denials: Array<{ id: string; at: string; reason: string; puzzleId?: string }>;
};

const MAX_PUZZLES = 2_000;
const MAX_DENIALS = 5_000;

function storePath(root: string) {
  return xivLocalPath(root, PUZZLE_LAB_STORE);
}

async function load(root: string): Promise<PuzzleStore> {
  const parsed = await readJsonFile<PuzzleStore>(storePath(root), {
    puzzles: [],
    denials: [],
  });
  return {
    puzzles: Array.isArray(parsed.puzzles) ? parsed.puzzles : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: PuzzleStore) {
  await writeJsonFileAtomic(storePath(root), {
    puzzles: store.puzzles.slice(-MAX_PUZZLES),
    denials: store.denials.slice(-MAX_DENIALS),
  });
}

export type DecomposePuzzleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  rootLabel: string;
  /** Child labels proposed for decomposition (breadth-first by depth). */
  proposedChildren?: string[];
  maxDepth?: number;
  maxHops?: number;
  /** Hard-deny probe: request unbounded / over-limit decomposition. */
  attemptExceedBounds?: boolean;
  /** Probe: requested depth beyond default. */
  requestedDepth?: number;
  requestedHops?: number;
  root?: string;
};

export type DecomposePuzzleResult = {
  accepted: boolean;
  reason: string;
  puzzle: PuzzleDecompositionRecord | null;
  boundsRespected: boolean;
  hopsUsed: number;
  maxDepthReached: number;
};

export async function decomposeArchitecturePuzzle(
  input: DecomposePuzzleInput,
): Promise<DecomposePuzzleResult> {
  const root = input.root ?? process.cwd();
  const maxDepth = Math.min(
    DEFAULT_PUZZLE_MAX_DEPTH,
    Math.max(1, input.maxDepth ?? DEFAULT_PUZZLE_MAX_DEPTH),
  );
  const maxHops = Math.min(
    DEFAULT_PUZZLE_MAX_HOPS,
    Math.max(1, input.maxHops ?? DEFAULT_PUZZLE_MAX_HOPS),
  );

  const deny = async (reason: string): Promise<DecomposePuzzleResult> => {
    const store = await load(root);
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason,
    });
    await save(root, store);
    return {
      accepted: false,
      reason,
      puzzle: null,
      boundsRespected: false,
      hopsUsed: 0,
      maxDepthReached: 0,
    };
  };

  if (!input.orgId || !input.tenantId || !input.universeId || !input.rootLabel.trim()) {
    return deny('PUZZLE_REQUIRES_ORG_TENANT_UNIVERSE_ROOT');
  }

  if (
    input.attemptExceedBounds === true ||
    (input.requestedDepth != null && input.requestedDepth > DEFAULT_PUZZLE_MAX_DEPTH) ||
    (input.requestedHops != null && input.requestedHops > DEFAULT_PUZZLE_MAX_HOPS) ||
    BT_LOCKS.PUZZLE_DECOMPOSITION_BOUNDED === false
  ) {
    return deny(PUZZLE_BOUNDS_EXCEEDED);
  }

  const children = (input.proposedChildren ?? []).map((c) => c.trim()).filter(Boolean);
  const nodes: PuzzleNode[] = [
    {
      id: randomUUID(),
      label: input.rootLabel.trim(),
      depth: 0,
      hopIndex: 0,
      parentId: null,
    },
  ];

  let hopsUsed = 0;
  let maxDepthReached = 0;
  let truncated = false;
  const frontier: PuzzleNode[] = [nodes[0]];

  while (frontier.length > 0 && hopsUsed < maxHops) {
    const parent = frontier.shift()!;
    if (parent.depth >= maxDepth) {
      truncated = truncated || children.length > 0;
      continue;
    }
    const childBudget = Math.min(children.length, maxHops - hopsUsed);
    for (let i = 0; i < childBudget; i += 1) {
      if (hopsUsed >= maxHops) {
        truncated = true;
        break;
      }
      hopsUsed += 1;
      const child: PuzzleNode = {
        id: randomUUID(),
        label: children[i] ?? `part-${hopsUsed}`,
        depth: parent.depth + 1,
        hopIndex: hopsUsed,
        parentId: parent.id,
      };
      maxDepthReached = Math.max(maxDepthReached, child.depth);
      nodes.push(child);
      if (child.depth < maxDepth) {
        frontier.push(child);
      }
    }
    // Only expand from root with provided children once to keep decomposition finite.
    break;
  }

  if (children.length > hopsUsed) {
    truncated = true;
  }

  const puzzle: PuzzleDecompositionRecord = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    rootLabel: input.rootLabel.trim(),
    maxDepth,
    maxHops,
    nodes,
    hopsUsed,
    maxDepthReached,
    bounded: true,
    truncated,
    createdAt: new Date().toISOString(),
    productionAuthorized: false,
  };

  const store = await load(root);
  store.puzzles.push(puzzle);
  await save(root, store);

  return {
    accepted: true,
    reason: truncated
      ? 'Bounded puzzle decomposition recorded; excess children truncated at hop/depth limits.'
      : 'Bounded architecture puzzle decomposition recorded.',
    puzzle,
    boundsRespected: hopsUsed <= maxHops && maxDepthReached <= maxDepth,
    hopsUsed,
    maxDepthReached,
  };
}

export function puzzleLabHonesty() {
  return {
    puzzleDecompositionBounded: BT_LOCKS.PUZZLE_DECOMPOSITION_BOUNDED,
    defaultMaxDepth: DEFAULT_PUZZLE_MAX_DEPTH,
    defaultMaxHops: DEFAULT_PUZZLE_MAX_HOPS,
    l4AutonomyEnabled: BT_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: BT_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}
