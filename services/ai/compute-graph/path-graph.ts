/**
 * Path graph: workload → runtime → chip path → eligibility.
 * Tenant/Universe isolation on all queries. Fallback ≠ accelerator VERIFIED.
 */

import {
  HC3_LOCKS,
  scopesMatch,
  type AcceleratorClass,
  type ChipVendor,
  type HardwareTruthState,
  type PathEdgeKind,
  type TenantScope,
} from './types.ts';
import type { HardwareMatrixEntry, HardwareTruthMatrix } from './registry.ts';

export type PathNodeKind =
  | 'workload'
  | 'runtime'
  | 'chip'
  | 'eligibility'
  | 'fallback';

export type PathNode = {
  nodeId: string;
  kind: PathNodeKind;
  label: string;
  vendor?: ChipVendor;
  acceleratorClass?: AcceleratorClass;
  truthState?: HardwareTruthState;
  matrixEntryId?: string;
  scope: TenantScope;
};

export type PathEdge = {
  edgeId: string;
  kind: PathEdgeKind;
  fromNodeId: string;
  toNodeId: string;
  scope: TenantScope;
};

export type ChipPath = {
  pathId: string;
  workloadId: string;
  runtimeId: string;
  chipNodeId: string;
  eligibility: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'WAITING_DATA' | 'FALLBACK_ONLY';
  usesFallback: boolean;
  /** Claimed accelerator verification — never implied by fallback alone. */
  acceleratorVerified: boolean;
  matrixEntryId: string | null;
  scope: TenantScope;
  nodeIds: readonly string[];
  edgeIds: readonly string[];
};

export type BuildPathInput = {
  pathId: string;
  workloadId: string;
  workloadLabel: string;
  runtimeId: string;
  runtimeLabel: string;
  matrixEntry: HardwareMatrixEntry;
  preferFallback?: boolean;
  fallbackMatrixEntry?: HardwareMatrixEntry | null;
  scope: TenantScope;
};

export class ChipPathGraph {
  private readonly nodes = new Map<string, PathNode>();
  private readonly edges = new Map<string, PathEdge>();
  private readonly paths = new Map<string, ChipPath>();

  private putNode(node: PathNode): PathNode {
    if (!scopesMatch(node.scope, node.scope)) {
      /* noop — scopesMatch self always true; isolation enforced on read */
    }
    this.nodes.set(node.nodeId, node);
    return node;
  }

  private putEdge(edge: PathEdge): PathEdge {
    this.edges.set(edge.edgeId, edge);
    return edge;
  }

  getNode(nodeId: string, scope: TenantScope): PathNode | null {
    const node = this.nodes.get(nodeId);
    if (!node || !scopesMatch(node.scope, scope)) return null;
    return node;
  }

  getPath(pathId: string, scope: TenantScope): ChipPath | null {
    const path = this.paths.get(pathId);
    if (!path || !scopesMatch(path.scope, scope)) return null;
    return path;
  }

  /**
   * Build workload → runtime → chip → eligibility (+ optional fallback).
   * Fallback path does not mark accelerator as VERIFIED.
   */
  buildPath(input: BuildPathInput): ChipPath {
    if (!scopesMatch(input.scope, input.matrixEntry.scope)) {
      const denied: ChipPath = {
        pathId: input.pathId,
        workloadId: input.workloadId,
        runtimeId: input.runtimeId,
        chipNodeId: '',
        eligibility: 'NOT_ELIGIBLE',
        usesFallback: false,
        acceleratorVerified: false,
        matrixEntryId: null,
        scope: input.scope,
        nodeIds: [],
        edgeIds: [],
      };
      this.paths.set(denied.pathId, denied);
      return denied;
    }

    const useFallback =
      Boolean(input.preferFallback && input.fallbackMatrixEntry) ||
      input.matrixEntry.truthState === 'UNAVAILABLE' ||
      input.matrixEntry.truthState === 'NOT_TESTED' ||
      input.matrixEntry.truthState === 'STALE' ||
      input.matrixEntry.truthState === 'REVOKED';

    const activeEntry =
      useFallback && input.fallbackMatrixEntry
        ? input.fallbackMatrixEntry
        : input.matrixEntry;

    const workloadNode = this.putNode({
      nodeId: `wl:${input.workloadId}:${input.scope.tenantId}`,
      kind: 'workload',
      label: input.workloadLabel,
      scope: input.scope,
    });
    const runtimeNode = this.putNode({
      nodeId: `rt:${input.runtimeId}:${input.scope.tenantId}`,
      kind: 'runtime',
      label: input.runtimeLabel,
      scope: input.scope,
    });
    const chipNode = this.putNode({
      nodeId: `chip:${activeEntry.entryId}:${input.scope.tenantId}`,
      kind: useFallback ? 'fallback' : 'chip',
      label: activeEntry.deviceLabel,
      vendor: activeEntry.vendor,
      acceleratorClass: activeEntry.acceleratorClass,
      truthState: activeEntry.truthState,
      matrixEntryId: activeEntry.entryId,
      scope: input.scope,
    });

    const acceleratorVerified =
      !useFallback &&
      activeEntry.truthState === 'VERIFIED' &&
      !activeEntry.isFallbackPath &&
      !activeEntry.stale;

    // Explicit honesty: fallback never yields accelerator VERIFIED claim.
    const verifiedClaim =
      useFallback && !HC3_LOCKS.FALLBACK_EQ_ACCELERATOR_VERIFIED
        ? false
        : acceleratorVerified;

    let eligibility: ChipPath['eligibility'];
    if (verifiedClaim || activeEntry.truthState === 'SUPPORTED') {
      eligibility = useFallback ? 'FALLBACK_ONLY' : 'ELIGIBLE';
    } else if (
      activeEntry.truthState === 'WAITING_DATA' ||
      activeEntry.truthState === 'WAITING_NODE' ||
      activeEntry.truthState === 'NOT_TESTED' ||
      activeEntry.truthState === 'DOCUMENTED' ||
      activeEntry.truthState === 'DETECTED'
    ) {
      eligibility = useFallback ? 'FALLBACK_ONLY' : 'WAITING_DATA';
    } else {
      eligibility = useFallback ? 'FALLBACK_ONLY' : 'NOT_ELIGIBLE';
    }

    const eligibilityNode = this.putNode({
      nodeId: `elig:${input.pathId}`,
      kind: 'eligibility',
      label: eligibility,
      truthState: activeEntry.truthState,
      scope: input.scope,
    });

    const e1 = this.putEdge({
      edgeId: `e:${workloadNode.nodeId}->${runtimeNode.nodeId}`,
      kind: 'runtime',
      fromNodeId: workloadNode.nodeId,
      toNodeId: runtimeNode.nodeId,
      scope: input.scope,
    });
    const e2 = this.putEdge({
      edgeId: `e:${runtimeNode.nodeId}->${chipNode.nodeId}`,
      kind: useFallback ? 'fallback' : 'architecture',
      fromNodeId: runtimeNode.nodeId,
      toNodeId: chipNode.nodeId,
      scope: input.scope,
    });
    const e3 = this.putEdge({
      edgeId: `e:${chipNode.nodeId}->${eligibilityNode.nodeId}`,
      kind: 'eligibility',
      fromNodeId: chipNode.nodeId,
      toNodeId: eligibilityNode.nodeId,
      scope: input.scope,
    });

    const path: ChipPath = {
      pathId: input.pathId,
      workloadId: input.workloadId,
      runtimeId: input.runtimeId,
      chipNodeId: chipNode.nodeId,
      eligibility,
      usesFallback: useFallback,
      acceleratorVerified: verifiedClaim,
      matrixEntryId: activeEntry.entryId,
      scope: input.scope,
      nodeIds: [
        workloadNode.nodeId,
        runtimeNode.nodeId,
        chipNode.nodeId,
        eligibilityNode.nodeId,
      ],
      edgeIds: [e1.edgeId, e2.edgeId, e3.edgeId],
    };
    this.paths.set(path.pathId, path);
    return path;
  }

  /**
   * Query paths for a tenant/universe only — no cross-tenant reuse.
   */
  queryPaths(
    scope: TenantScope,
    filter?: { workloadId?: string; vendor?: ChipVendor },
  ): readonly ChipPath[] {
    const out: ChipPath[] = [];
    for (const path of this.paths.values()) {
      if (!scopesMatch(path.scope, scope)) continue;
      if (filter?.workloadId && path.workloadId !== filter.workloadId) continue;
      if (filter?.vendor) {
        const chip = this.getNode(path.chipNodeId, scope);
        if (!chip || chip.vendor !== filter.vendor) continue;
      }
      out.push(path);
    }
    return out;
  }

  /**
   * Attempt to reuse a path from another tenant — always denied.
   */
  attemptCrossTenantPathReuse(input: {
    pathId: string;
    fromScope: TenantScope;
    toScope: TenantScope;
  }): {
    denied: true;
    reason: string;
    path: null;
  } {
    const existing = this.paths.get(input.pathId);
    if (existing && scopesMatch(existing.scope, input.fromScope)) {
      if (!scopesMatch(input.fromScope, input.toScope)) {
        return {
          denied: true,
          reason: 'CROSS_TENANT_PATH_REUSE_DENIED',
          path: null,
        };
      }
    }
    return {
      denied: true,
      reason: 'CROSS_TENANT_PATH_REUSE_DENIED',
      path: null,
    };
  }
}

export function createChipPathGraph(): ChipPathGraph {
  return new ChipPathGraph();
}

export function resolveEligibilityFromMatrix(
  matrix: HardwareTruthMatrix,
  entryId: string,
  scope: TenantScope,
): ChipPath['eligibility'] {
  const entry = matrix.get(entryId, scope);
  if (!entry) return 'NOT_ELIGIBLE';
  if (entry.truthState === 'VERIFIED' || entry.truthState === 'SUPPORTED') {
    return 'ELIGIBLE';
  }
  if (
    entry.truthState === 'DOCUMENTED' ||
    entry.truthState === 'DETECTED' ||
    entry.truthState === 'NOT_TESTED' ||
    entry.truthState === 'WAITING_DATA' ||
    entry.truthState === 'WAITING_NODE'
  ) {
    return 'WAITING_DATA';
  }
  return 'NOT_ELIGIBLE';
}
