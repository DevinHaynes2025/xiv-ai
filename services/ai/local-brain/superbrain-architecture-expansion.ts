/**
 * 62L-BQ Superbrain Neural Architecture Expansion —
 * Turn successful bounded solutions into new logical pathways under growth/review rules.
 * Reuses BN growth semantics: demand-proven, reject redundant.
 * Pathway proposal does not grant permissions. Superbrain remains root (coexistence).
 */

import { randomUUID } from 'node:crypto';

import {
  BQ_BOUNDS,
  BQ_LOCKS,
  PATHWAY_NOT_PERMISSION,
} from './polyglot-coding-civilization-types';

export type ArchitecturePathwayStatus =
  | 'REJECTED_REDUNDANT'
  | 'REJECTED_NO_DEMAND'
  | 'SANDBOX_PROPOSAL'
  | 'AWAITING_REVIEW'
  | 'DENIED';

export type ArchitecturePathwayProposal = {
  id: string;
  key: string;
  label: string;
  sourceSolutionRefs: string[];
  demandProven: boolean;
  inventoryHits: string[];
  status: ArchitecturePathwayStatus;
  reason: string;
  /** Explicit non-authority fields. */
  permissionGranted: false;
  authorityEscalated: false;
  productionAuthorized: false;
  autoDeployed: false;
  swallowsSuperbrainRoot: false;
  createdAt: string;
};

const knownPathways = new Set<string>([
  'hybrid_edge_cloud',
  'semantic_internet_router',
  'executive_control_tower',
  'knowledge_lake_retrieve',
  'neural_bus',
  'neuroplasticity_route_weight',
  'org_agent_universe_synapse',
]);

const proposals: ArchitecturePathwayProposal[] = [];

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function resetArchitectureExpansion() {
  proposals.length = 0;
  // Keep baseline known pathways (inventory); do not clear coexistence root set.
}

export function searchPathwayInventory(key: string): string[] {
  const k = normalizeKey(key);
  return [...knownPathways].filter((p) => p === k || p.includes(k) || k.includes(p));
}

/**
 * Propose a logical pathway from a successful bounded solution.
 * Demand must be proven; redundant inventory hits are rejected.
 * Never grants permissions or swallows Superbrain root.
 */
export function proposeArchitecturePathway(input: {
  key: string;
  label?: string;
  sourceSolutionRefs?: string[];
  demandProven?: boolean;
  demandEvidenceRefs?: string[];
}): ArchitecturePathwayProposal {
  const key = normalizeKey(input.key);
  const demandProven =
    input.demandProven === true && (input.demandEvidenceRefs?.length ?? 0) > 0;
  const inventoryHits = searchPathwayInventory(key);
  const sourceSolutionRefs = [...(input.sourceSolutionRefs ?? [])];

  let status: ArchitecturePathwayStatus;
  let reason: string;

  if (BQ_LOCKS.AUTO_PRODUCTION_NEURAL_GROWTH) {
    status = 'DENIED';
    reason = 'LOCK_VIOLATION_AUTO_GROWTH';
  } else if (!demandProven) {
    status = 'REJECTED_NO_DEMAND';
    reason = 'GROWTH_REQUIRES_PROVEN_DEMAND';
  } else if (inventoryHits.length > 0) {
    status = 'REJECTED_REDUNDANT';
    reason = `REDUNDANT_GROWTH_REJECTED:${inventoryHits.join(',')}`;
  } else if (proposals.length >= BQ_BOUNDS.MAX_PATHWAY_PROPOSALS_PER_CYCLE) {
    status = 'DENIED';
    reason = 'PATHWAY_PROPOSAL_CYCLE_BOUND';
  } else if (sourceSolutionRefs.length === 0) {
    status = 'REJECTED_NO_DEMAND';
    reason = 'SUCCESSFUL_BOUNDED_SOLUTION_REFS_REQUIRED';
  } else {
    status = 'SANDBOX_PROPOSAL';
    reason = 'SANDBOX_PATHWAY_PROPOSAL_AWAITING_REVIEW';
  }

  const proposal: ArchitecturePathwayProposal = {
    id: randomUUID(),
    key,
    label: (input.label ?? key).trim(),
    sourceSolutionRefs,
    demandProven,
    inventoryHits,
    status,
    reason,
    permissionGranted: false,
    authorityEscalated: false,
    productionAuthorized: false,
    autoDeployed: false,
    swallowsSuperbrainRoot: false,
    createdAt: new Date().toISOString(),
  };
  proposals.push(proposal);

  // Successful sandbox proposals become known for subsequent redundancy checks
  // only after explicit review registration — not auto-inventory.
  return { ...proposal, sourceSolutionRefs: [...sourceSolutionRefs], inventoryHits: [...inventoryHits] };
}

/**
 * Review gate: register a sandbox proposal into inventory without granting permissions.
 */
export function reviewArchitecturePathway(input: {
  proposalId: string;
  approve: boolean;
}): {
  ok: boolean;
  proposal: ArchitecturePathwayProposal | null;
  permissionGranted: false;
  reason: string;
} {
  const proposal = proposals.find((p) => p.id === input.proposalId) ?? null;
  if (!proposal) {
    return {
      ok: false,
      proposal: null,
      permissionGranted: false,
      reason: 'PROPOSAL_NOT_FOUND',
    };
  }
  if (proposal.status !== 'SANDBOX_PROPOSAL' && proposal.status !== 'AWAITING_REVIEW') {
    return {
      ok: false,
      proposal: { ...proposal },
      permissionGranted: false,
      reason: 'PROPOSAL_NOT_REVIEWABLE',
    };
  }
  if (!input.approve) {
    proposal.status = 'DENIED';
    proposal.reason = 'HUMAN_REVIEW_REJECTED';
    return {
      ok: true,
      proposal: { ...proposal },
      permissionGranted: false,
      reason: PATHWAY_NOT_PERMISSION,
    };
  }
  knownPathways.add(proposal.key);
  proposal.status = 'AWAITING_REVIEW';
  proposal.reason = 'APPROVED_INVENTORY_ONLY_NOT_PERMISSION';
  return {
    ok: true,
    proposal: { ...proposal },
    permissionGranted: false,
    reason: PATHWAY_NOT_PERMISSION,
  };
}

export function listArchitectureProposals() {
  return proposals.map((p) => ({
    ...p,
    sourceSolutionRefs: [...p.sourceSolutionRefs],
    inventoryHits: [...p.inventoryHits],
  }));
}

export function architectureExpansionHonesty() {
  return {
    locks: BQ_LOCKS,
    pathwayProposalIsPermission: BQ_LOCKS.PATHWAY_PROPOSAL_IS_PERMISSION,
    autoProductionNeuralGrowth: BQ_LOCKS.AUTO_PRODUCTION_NEURAL_GROWTH,
    demandProvenRequired: true as const,
    rejectRedundant: true as const,
    superbrainRemainsRoot: BQ_LOCKS.SUPERBRAIN_REMAINS_ROOT,
    swallowSuperbrainRoot: BQ_LOCKS.SWALLOW_SUPERBRAIN_ROOT,
    productionAuthorization: false as const,
    pathwayNotPermission: PATHWAY_NOT_PERMISSION,
  };
}
