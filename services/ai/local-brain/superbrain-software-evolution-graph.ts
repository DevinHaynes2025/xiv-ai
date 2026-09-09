import { randomUUID } from 'node:crypto';

import { rememberCortexTrace } from './memory-cortex';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BT_LOCKS,
  HIDDEN_REASONING_TRACE_REJECTED,
  type EvolutionNodeKind,
  type ProvenanceKind,
} from './apprenticeship-experiment-evolution-types';

/**
 * Superbrain Software Evolution Graph — tracks code, APIs, tests, bugs, fixes,
 * tools, skills, experiments, architecture changes over time with provenance
 * linking to Engineering Memory Cortex. Rejects hidden_reasoning_trace.
 */

export const EVOLUTION_GRAPH_STORE = 'superbrain-software-evolution-graph.json';

export type EvolutionProvenance = {
  kind: ProvenanceKind;
  ref: string;
  summary: string;
};

export type EvolutionNode = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  kind: EvolutionNodeKind;
  label: string;
  summary: string;
  provenance: EvolutionProvenance[];
  cortexTraceId?: string;
  createdAt: string;
  productionAuthorized: false;
  hiddenReasoningTrace: false;
};

export type EvolutionEdge = {
  id: string;
  fromId: string;
  toId: string;
  relation: 'caused' | 'fixed' | 'derived_from' | 'tested_by' | 'evolved_into' | 'blocked_by' | 'linked_memory';
  at: string;
};

type EvolutionStore = {
  nodes: EvolutionNode[];
  edges: EvolutionEdge[];
  denials: Array<{ id: string; at: string; reason: string }>;
};

const MAX_NODES = 20_000;
const MAX_EDGES = 40_000;
const MAX_DENIALS = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, EVOLUTION_GRAPH_STORE);
}

async function load(root: string): Promise<EvolutionStore> {
  const parsed = await readJsonFile<EvolutionStore>(storePath(root), {
    nodes: [],
    edges: [],
    denials: [],
  });
  return {
    nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
    edges: Array.isArray(parsed.edges) ? parsed.edges : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: EvolutionStore) {
  await writeJsonFileAtomic(storePath(root), {
    nodes: store.nodes.slice(-MAX_NODES),
    edges: store.edges.slice(-MAX_EDGES),
    denials: store.denials.slice(-MAX_DENIALS),
  });
}

export type RecordEvolutionInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  kind: EvolutionNodeKind;
  label: string;
  summary: string;
  provenance?: EvolutionProvenance[];
  linkToCortex?: boolean;
  /** Hard-deny: attempt to store private hidden reasoning. */
  includeHiddenReasoningTrace?: boolean;
  hiddenReasoningTrace?: string;
  fromNodeId?: string;
  relation?: EvolutionEdge['relation'];
  root?: string;
};

export type RecordEvolutionResult = {
  accepted: boolean;
  reason: string;
  node: EvolutionNode | null;
  edge: EvolutionEdge | null;
  cortexTraceId?: string;
};

export async function recordSoftwareEvolution(
  input: RecordEvolutionInput,
): Promise<RecordEvolutionResult> {
  const root = input.root ?? process.cwd();
  const deny = async (reason: string): Promise<RecordEvolutionResult> => {
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
      node: null,
      edge: null,
    };
  };

  if (!input.orgId || !input.tenantId || !input.universeId || !input.label.trim()) {
    return deny('EVOLUTION_NODE_REQUIRES_ORG_TENANT_UNIVERSE_LABEL');
  }

  if (
    input.includeHiddenReasoningTrace === true ||
    (typeof input.hiddenReasoningTrace === 'string' && input.hiddenReasoningTrace.length > 0) ||
    BT_LOCKS.HIDDEN_REASONING_TRACES_ALLOWED === true ||
    BT_LOCKS.AUDITABLE_ARTIFACTS_ONLY === false
  ) {
    return deny(HIDDEN_REASONING_TRACE_REJECTED);
  }

  const provenance = [...(input.provenance ?? [])];
  if (provenance.length === 0) {
    return deny('EVOLUTION_NODE_REQUIRES_PROVENANCE_LINKS');
  }

  let cortexTraceId: string | undefined;
  if (input.linkToCortex !== false) {
    const trace = await rememberCortexTrace({
      partition: 'company',
      kind: 'lesson',
      label: input.label.trim(),
      summary: input.summary.trim() || input.label.trim(),
      claimState: 'MODEL_INFERENCE',
      retentionClass: 'durable',
      tenantId: input.tenantId,
      universeId: input.universeId,
      sourceRefs: provenance.map((p) => p.ref),
      evidenceRefs: provenance.map((p) => p.ref),
      root,
    });
    cortexTraceId = trace.id;
    provenance.push({
      kind: 'cortex_trace',
      ref: trace.id,
      summary: 'Linked to Engineering Memory Cortex / memory-cortex trace',
    });
  }

  const node: EvolutionNode = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    label: input.label.trim(),
    summary: input.summary.trim(),
    provenance,
    cortexTraceId,
    createdAt: new Date().toISOString(),
    productionAuthorized: false,
    hiddenReasoningTrace: false,
  };

  const store = await load(root);
  store.nodes.push(node);

  let edge: EvolutionEdge | null = null;
  if (input.fromNodeId) {
    const from = store.nodes.find((n) => n.id === input.fromNodeId);
    if (!from) {
      store.denials.push({
        id: randomUUID(),
        at: new Date().toISOString(),
        reason: 'EVOLUTION_EDGE_FROM_NODE_NOT_FOUND',
      });
      await save(root, store);
      return {
        accepted: false,
        reason: 'EVOLUTION_EDGE_FROM_NODE_NOT_FOUND',
        node: null,
        edge: null,
      };
    }
    edge = {
      id: randomUUID(),
      fromId: from.id,
      toId: node.id,
      relation: input.relation ?? 'derived_from',
      at: new Date().toISOString(),
    };
    store.edges.push(edge);
  }

  await save(root, store);
  return {
    accepted: true,
    reason: 'Evolution node recorded with auditable provenance; cortex link optional/applied.',
    node,
    edge,
    cortexTraceId,
  };
}

export async function listEvolutionNodes(input: {
  orgId: string;
  universeId: string;
  kind?: EvolutionNodeKind;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  return store.nodes.filter(
    (n) =>
      n.orgId === input.orgId &&
      n.universeId === input.universeId &&
      (input.kind ? n.kind === input.kind : true),
  );
}

export function evolutionGraphHonesty() {
  return {
    hiddenReasoningTracesAllowed: BT_LOCKS.HIDDEN_REASONING_TRACES_ALLOWED,
    auditableArtifactsOnly: BT_LOCKS.AUDITABLE_ARTIFACTS_ONLY,
    l4AutonomyEnabled: BT_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: BT_LOCKS.PRODUCTION_AUTHORIZATION,
    megaPrBulkIncluded: BT_LOCKS.MEGA_PR_BULK_INCLUDED,
  };
}
