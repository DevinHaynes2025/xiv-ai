/**
 * Software knowledge graph pathway + plasticity.
 * Plasticity may change: retrieval ranking / routing preference /
 * retest priority / recommendation confidence.
 * Plasticity may NOT change: permissions, Guardian, RLS, tenant boundaries,
 * production/billing/contract authority.
 */

import { createHash } from 'node:crypto';
import {
  GOB_LOCKS,
  KG_NODE_KINDS,
  KG_NODE_STATES,
  type KgNodeKind,
  type KgNodeState,
  type TenantScope,
} from './types.ts';

export type KgNode = {
  nodeId: string;
  kind: KgNodeKind;
  label: string;
  state: KgNodeState;
  tenantId: string;
  universeId: string;
  confidence: number;
  freshness: string;
  evidenceRefs: readonly string[];
  version: string;
  rollbackVersion: string | null;
};

export type KgEdge = {
  edgeId: string;
  fromId: string;
  toId: string;
  relation: string;
  provenance: string;
  rights: string;
  confidence: number;
  freshness: string;
  tenantId: string;
  universeId: string;
  evidenceRefs: readonly string[];
  version: string;
  rollbackVersion: string | null;
};

export type PlasticityAdjustment = {
  targetId: string;
  kind: 'retrieval_ranking' | 'routing_preference' | 'retest_priority' | 'recommendation_confidence';
  delta: number;
  reason: string;
};

export type NeuralKg = {
  addNode(input: {
    kind: KgNodeKind;
    label: string;
    state: KgNodeState;
    scope: TenantScope;
    confidence?: number;
    freshness?: string;
    evidenceRefs?: readonly string[];
    version?: string;
  }): KgNode;
  addEdge(input: {
    fromId: string;
    toId: string;
    relation: string;
    provenance: string;
    rights: string;
    scope: TenantScope;
    confidence?: number;
    freshness?: string;
    evidenceRefs?: readonly string[];
    version?: string;
  }):
    | { ok: true; edge: KgEdge }
    | { ok: false; denied: true; reason: string };
  applyPlasticity(input: {
    scope: TenantScope;
    adjustment: PlasticityAdjustment;
    /** Forbidden authority changes — always denied. */
    attemptPermissionChange?: boolean;
    attemptGuardianBypass?: boolean;
    attemptRlsChange?: boolean;
    attemptTenantBoundaryChange?: boolean;
    attemptProductionBillingChange?: boolean;
  }):
    | { applied: true; adjustment: PlasticityAdjustment }
    | { applied: false; denied: true; reason: string };
  markContradiction(nodeId: string, scope: TenantScope, note: string): boolean;
  listNodes(scope: TenantScope): readonly KgNode[];
  listEdges(scope: TenantScope): readonly KgEdge[];
  listContradictions(scope: TenantScope): readonly string[];
};

const PATHWAY_ORDER = KG_NODE_KINDS;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export function createNeuralKg(): NeuralKg {
  const nodes = new Map<string, KgNode>();
  const edges = new Map<string, KgEdge>();
  const contradictions: { scopeKey: string; note: string }[] = [];
  const plasticityLog: PlasticityAdjustment[] = [];

  return {
    addNode(input) {
      const nodeId = `kg-${sha256(`${input.kind}:${input.label}:${input.scope.tenantId}`)}`;
      const node: KgNode = {
        nodeId,
        kind: input.kind,
        label: input.label,
        state: input.state,
        tenantId: input.scope.tenantId,
        universeId: input.scope.universeId,
        confidence: input.confidence ?? 0.5,
        freshness: input.freshness ?? new Date().toISOString(),
        evidenceRefs: input.evidenceRefs ?? [],
        version: input.version ?? '1',
        rollbackVersion: null,
      };
      nodes.set(nodeId, node);
      return node;
    },

    addEdge(input) {
      const from = nodes.get(input.fromId);
      const to = nodes.get(input.toId);
      if (!from || !to) {
        return { ok: false, denied: true, reason: 'NODE_NOT_FOUND' };
      }
      if (
        from.tenantId !== input.scope.tenantId ||
        to.tenantId !== input.scope.tenantId ||
        from.universeId !== input.scope.universeId ||
        to.universeId !== input.scope.universeId
      ) {
        return {
          ok: false,
          denied: true,
          reason: 'EDGE_TENANT_UNIVERSE_MISMATCH',
        };
      }
      const edgeId = `edge-${sha256(`${input.fromId}:${input.toId}:${input.relation}`)}`;
      const edge: KgEdge = {
        edgeId,
        fromId: input.fromId,
        toId: input.toId,
        relation: input.relation,
        provenance: input.provenance,
        rights: input.rights,
        confidence: input.confidence ?? 0.5,
        freshness: input.freshness ?? new Date().toISOString(),
        tenantId: input.scope.tenantId,
        universeId: input.scope.universeId,
        evidenceRefs: input.evidenceRefs ?? [],
        version: input.version ?? '1',
        rollbackVersion: null,
      };
      edges.set(edgeId, edge);
      return { ok: true, edge };
    },

    applyPlasticity(input) {
      if (
        input.attemptPermissionChange ||
        GOB_LOCKS.PLASTICITY_MAY_CHANGE_PERMISSIONS
      ) {
        return {
          applied: false,
          denied: true,
          reason: 'PLASTICITY_CANNOT_CHANGE_PERMISSIONS',
        };
      }
      if (
        input.attemptGuardianBypass ||
        GOB_LOCKS.PLASTICITY_MAY_BYPASS_GUARDIAN
      ) {
        return {
          applied: false,
          denied: true,
          reason: 'PLASTICITY_CANNOT_BYPASS_GUARDIAN',
        };
      }
      if (input.attemptRlsChange || GOB_LOCKS.PLASTICITY_MAY_CHANGE_RLS) {
        return {
          applied: false,
          denied: true,
          reason: 'PLASTICITY_CANNOT_CHANGE_RLS',
        };
      }
      if (
        input.attemptTenantBoundaryChange ||
        GOB_LOCKS.PLASTICITY_MAY_CHANGE_TENANT_BOUNDARIES
      ) {
        return {
          applied: false,
          denied: true,
          reason: 'PLASTICITY_CANNOT_CHANGE_TENANT_BOUNDARIES',
        };
      }
      if (
        input.attemptProductionBillingChange ||
        GOB_LOCKS.PLASTICITY_MAY_CHANGE_PRODUCTION_BILLING_CONTRACT
      ) {
        return {
          applied: false,
          denied: true,
          reason: 'PLASTICITY_CANNOT_CHANGE_PRODUCTION_BILLING_CONTRACT',
        };
      }
      const allowed = [
        'retrieval_ranking',
        'routing_preference',
        'retest_priority',
        'recommendation_confidence',
      ];
      if (!allowed.includes(input.adjustment.kind)) {
        return {
          applied: false,
          denied: true,
          reason: 'PLASTICITY_KIND_NOT_ALLOWED',
        };
      }
      plasticityLog.push(input.adjustment);
      const node = nodes.get(input.adjustment.targetId);
      if (node && node.tenantId === input.scope.tenantId) {
        if (input.adjustment.kind === 'recommendation_confidence') {
          node.confidence = Math.max(
            0,
            Math.min(1, node.confidence + input.adjustment.delta),
          );
        }
      }
      return { applied: true, adjustment: input.adjustment };
    },

    markContradiction(nodeId, scope, note) {
      const node = nodes.get(nodeId);
      if (!node) return false;
      if (
        node.tenantId !== scope.tenantId ||
        node.universeId !== scope.universeId
      ) {
        return false;
      }
      node.state = 'CONTRADICTED';
      contradictions.push({
        scopeKey: `${scope.tenantId}:${scope.universeId}`,
        note: `${nodeId}:${note}`,
      });
      return true;
    },

    listNodes(scope) {
      return [...nodes.values()].filter(
        (n) =>
          n.tenantId === scope.tenantId && n.universeId === scope.universeId,
      );
    },

    listEdges(scope) {
      return [...edges.values()].filter(
        (e) =>
          e.tenantId === scope.tenantId && e.universeId === scope.universeId,
      );
    },

    listContradictions(scope) {
      const key = `${scope.tenantId}:${scope.universeId}`;
      return contradictions.filter((c) => c.scopeKey === key).map((c) => c.note);
    },
  };
}

export { PATHWAY_ORDER, KG_NODE_KINDS, KG_NODE_STATES };
