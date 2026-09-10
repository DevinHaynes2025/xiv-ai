import type { PathwayEdge } from './types';

export interface PathwayResult {
  path: string[];
  totalWeight: number;
  minimumEvidence: number;
}

/**
 * Bounded Dijkstra-style pathway search for research graphs.
 * Low-evidence edges can be excluded rather than silently promoted to facts.
 */
export function findPathway(
  edges: readonly PathwayEdge[],
  start: string,
  goal: string,
  minimumEvidence = 0.5,
  maxVisited = 100_000,
): PathwayResult | null {
  if (minimumEvidence < 0 || minimumEvidence > 1) {
    throw new RangeError('minimumEvidence must be between 0 and 1');
  }

  const distances = new Map<string, number>([[start, 0]]);
  const previous = new Map<string, string>();
  const remaining = new Set<string>([start]);
  let visited = 0;

  while (remaining.size > 0 && visited < maxVisited) {
    let current: string | undefined;
    let best = Number.POSITIVE_INFINITY;
    for (const node of remaining) {
      const distance = distances.get(node) ?? Number.POSITIVE_INFINITY;
      if (distance < best) {
        best = distance;
        current = node;
      }
    }
    if (!current) break;
    remaining.delete(current);
    visited += 1;
    if (current === goal) break;

    for (const edge of edges) {
      if (edge.from !== current || edge.evidenceScore < minimumEvidence || edge.weight < 0) continue;
      const nextDistance = best + edge.weight;
      if (nextDistance < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.to, nextDistance);
        previous.set(edge.to, current);
        remaining.add(edge.to);
      }
    }
  }

  const totalWeight = distances.get(goal);
  if (totalWeight === undefined) return null;

  const path = [goal];
  while (path[0] !== start) {
    const parent = previous.get(path[0]);
    if (!parent) return null;
    path.unshift(parent);
  }

  const pathEdges = path.slice(1).map((to, index) =>
    edges.find((edge) => edge.from === path[index] && edge.to === to),
  ).filter((edge): edge is PathwayEdge => Boolean(edge));

  return {
    path,
    totalWeight,
    minimumEvidence: Math.min(...pathEdges.map((edge) => edge.evidenceScore), 1),
  };
}
