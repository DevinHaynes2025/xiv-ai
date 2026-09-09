/**
 * 62L-BN Superbrain Neural Growth Engine.
 * Grow only when demand proves need. Search existing inventory first.
 * Reject redundant growth. Weaken/hibernate low-value pathways.
 * Proposals only — never auto production deploy.
 */

import { listAgentInstances } from './agent-population';
import { BUSINESS_DEPARTMENTS } from './business-structure';
import { cortexId } from './cortex-store';
import {
  BN_LOCKS,
  type GrowthKind,
  type GrowthProposalStatus,
  type PathwayHealth,
} from './superbrain-neural-growth-types';

export type InventoryHit = {
  kind: GrowthKind;
  key: string;
  label: string;
  source: string;
};

export type PathwayRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  key: string;
  label: string;
  activationWeight: number;
  health: PathwayHealth;
  valueScore: number;
  createdAt: string;
  updatedAt: string;
};

export type GrowthProposal = {
  id: string;
  tenantId: string;
  universeId: string;
  kind: GrowthKind;
  key: string;
  label: string;
  demandProven: boolean;
  status: GrowthProposalStatus;
  inventoryHits: InventoryHit[];
  orgReal: false;
  productionAuthorization: false;
  autoDeployed: false;
  reason: string;
  createdAt: string;
};

const pathways = new Map<string, PathwayRecord>();
const proposals: GrowthProposal[] = [];

/** Known routes/tools/knowledge keys present in the local-brain surface. */
const KNOWN_ROUTES = [
  'hybrid_edge_cloud',
  'semantic_internet_router',
  'executive_control_tower',
  'knowledge_lake_retrieve',
  'neural_bus',
] as const;

const KNOWN_TOOLS = [
  'coding_agent',
  'testing_agent',
  'security_verifier',
  'evidence_ledger',
  'decision_gate',
] as const;

const KNOWN_KNOWLEDGE = [
  'knowledge_lake',
  'memory_cortex',
  'industry_memory_federation',
  'offline_intelligence_index',
] as const;

function nowIso() {
  return new Date().toISOString();
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function resetNeuralGrowthEngine() {
  pathways.clear();
  proposals.length = 0;
}

export function searchExistingInventory(input: {
  tenantId: string;
  universeId: string;
  kind: GrowthKind;
  key: string;
}): InventoryHit[] {
  const key = normalizeKey(input.key);
  const hits: InventoryHit[] = [];

  if (input.kind === 'agent_template' || input.kind === 'neuron') {
    for (const agent of listAgentInstances()) {
      if (
        agent.tenantId === input.tenantId &&
        agent.universeId === input.universeId &&
        (normalizeKey(agent.role) === key || agent.role.includes(key))
      ) {
        hits.push({
          kind: 'agent_template',
          key: agent.role,
          label: `Existing agent instance ${agent.id}`,
          source: 'agent-population',
        });
      }
    }
    // Role catalog equivalence: treat mesh role string as existing template.
    const roleCatalog = [
      'operations_analyst',
      'business_analyst',
      'researcher',
      'coder',
      'tester',
      'architect',
      'security',
      'evidence_verifier',
      'workflow_planner',
      'decision_strategist',
      'executive_secretary',
      'executive_synthesizer',
      'finance_analyst',
      'supply_chain_analyst',
      'knowledge_curator',
      'memory_librarian',
      'culture_historian',
      'skeptic',
    ];
    if (roleCatalog.includes(key as (typeof roleCatalog)[number])) {
      hits.push({
        kind: 'agent_template',
        key,
        label: `Catalog agent template ${key}`,
        source: 'agent-mesh-role-catalog',
      });
    }
  }

  if (input.kind === 'department') {
    const dept = BUSINESS_DEPARTMENTS.find((d) => d.key === key || normalizeKey(d.name) === key);
    if (dept) {
      hits.push({
        kind: 'department',
        key: dept.key,
        label: dept.name,
        source: 'business-structure',
      });
    }
  }

  if (input.kind === 'route') {
    for (const route of KNOWN_ROUTES) {
      if (route === key || route.includes(key) || key.includes(route)) {
        hits.push({ kind: 'route', key: route, label: route, source: 'known-routes' });
      }
    }
  }

  if (input.kind === 'tool') {
    for (const tool of KNOWN_TOOLS) {
      if (tool === key || tool.includes(key) || key.includes(tool)) {
        hits.push({ kind: 'tool', key: tool, label: tool, source: 'known-tools' });
      }
    }
  }

  if (input.kind === 'knowledge_node') {
    for (const node of KNOWN_KNOWLEDGE) {
      if (node === key || node.includes(key) || key.includes(node)) {
        hits.push({
          kind: 'knowledge_node',
          key: node,
          label: node,
          source: 'known-knowledge',
        });
      }
    }
  }

  if (input.kind === 'pathway' || input.kind === 'neuron') {
    for (const pathway of pathways.values()) {
      if (
        pathway.tenantId === input.tenantId &&
        pathway.universeId === input.universeId &&
        pathway.key === key &&
        pathway.health !== 'retired'
      ) {
        hits.push({
          kind: 'pathway',
          key: pathway.key,
          label: pathway.label,
          source: 'neural-growth-pathways',
        });
      }
    }
  }

  return hits;
}

export function proposeNeuralGrowth(input: {
  tenantId: string;
  universeId: string;
  kind: GrowthKind;
  key: string;
  label?: string;
  demandProven?: boolean;
  demandEvidenceRefs?: string[];
}): GrowthProposal {
  if (!input.tenantId || !input.universeId) {
    throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  }
  const key = normalizeKey(input.key);
  const label = (input.label ?? key).trim();
  const demandProven =
    input.demandProven === true && (input.demandEvidenceRefs?.length ?? 0) > 0;

  const inventoryHits = searchExistingInventory({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    key,
  });

  let status: GrowthProposalStatus;
  let reason: string;

  if (!demandProven) {
    status = 'REJECTED_NO_DEMAND';
    reason = 'GROWTH_REQUIRES_PROVEN_DEMAND';
  } else if (inventoryHits.length > 0) {
    status = 'REJECTED_REDUNDANT';
    reason = `REDUNDANT_GROWTH_REJECTED:${inventoryHits.map((h) => h.key).join(',')}`;
  } else if (!BN_LOCKS.SEARCH_EXISTING_BEFORE_GROWTH) {
    status = 'DENIED';
    reason = 'SEARCH_EXISTING_LOCK_VIOLATED';
  } else {
    status = 'SANDBOX_PROPOSAL';
    reason = 'SANDBOX_PROPOSAL_AWAITING_HUMAN_APPROVAL';
  }

  const proposal: GrowthProposal = {
    id: cortexId('bn_growth'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    key,
    label,
    demandProven,
    status,
    inventoryHits,
    orgReal: false,
    productionAuthorization: false,
    autoDeployed: false,
    reason,
    createdAt: nowIso(),
  };
  proposals.push(proposal);
  return proposal;
}

export function registerPathway(input: {
  tenantId: string;
  universeId: string;
  key: string;
  label?: string;
  activationWeight?: number;
  valueScore?: number;
}): PathwayRecord {
  const key = normalizeKey(input.key);
  const id = cortexId('bn_pathway');
  const record: PathwayRecord = {
    id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    key,
    label: input.label ?? key,
    activationWeight: input.activationWeight ?? 1,
    health: 'active',
    valueScore: input.valueScore ?? 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  pathways.set(id, record);
  return record;
}

export function listPathways(tenantId?: string, universeId?: string) {
  return [...pathways.values()].filter((p) => {
    if (tenantId && p.tenantId !== tenantId) return false;
    if (universeId && p.universeId !== universeId) return false;
    return true;
  });
}

export function listGrowthProposals() {
  return [...proposals];
}

/**
 * Low-value pathways are weakened/hibernated — not endlessly accumulated.
 * Activation weight is reduced; health moves toward hibernating.
 */
export function hibernateLowValuePathway(input: {
  pathwayId: string;
  valueThreshold?: number;
}): {
  ok: boolean;
  pathway: PathwayRecord | null;
  previousWeight: number;
  reason: string;
} {
  const pathway = pathways.get(input.pathwayId) ?? null;
  if (!pathway) {
    return { ok: false, pathway: null, previousWeight: 0, reason: 'PATHWAY_NOT_FOUND' };
  }
  const threshold = input.valueThreshold ?? 0.35;
  const previousWeight = pathway.activationWeight;
  if (pathway.valueScore >= threshold && pathway.health === 'active') {
    return {
      ok: false,
      pathway,
      previousWeight,
      reason: 'PATHWAY_VALUE_ABOVE_THRESHOLD',
    };
  }
  pathway.activationWeight = Math.max(0.05, previousWeight * 0.25);
  pathway.health = pathway.activationWeight <= 0.1 ? 'hibernating' : 'weakened';
  pathway.updatedAt = nowIso();
  pathways.set(pathway.id, pathway);
  return {
    ok: true,
    pathway,
    previousWeight,
    reason:
      pathway.health === 'hibernating'
        ? 'LOW_VALUE_PATHWAY_HIBERNATED'
        : 'LOW_VALUE_PATHWAY_WEAKENED',
  };
}

export function neuralGrowthHonesty() {
  return {
    locks: BN_LOCKS,
    l4AutonomyEnabled: BN_LOCKS.L4_AUTONOMY_ENABLED,
    autoProductionOrgDeploy: BN_LOCKS.AUTO_PRODUCTION_ORG_DEPLOY,
    proposalIsAuthority: BN_LOCKS.PROPOSAL_IS_AUTHORITY,
    searchExistingBeforeGrowth: BN_LOCKS.SEARCH_EXISTING_BEFORE_GROWTH,
    megaPrBulkIncluded: BN_LOCKS.MEGA_PR_BULK_INCLUDED,
    productionAuthorization: false as const,
  };
}
