import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BS_LOCKS,
  DRIFT_NO_AUTO_DEPLOY,
  REFACTOR_REMAINS_CANDIDATE,
} from './engineering-university-memory-cortex-types';

/**
 * Code Architecture Evolution — architecture-drift detection, safer refactor
 * candidates, evolution proposals under review gates.
 * Candidates ≠ auto-merge/deploy. Drift signal ≠ auto-deploy.
 */

export const ARCH_EVOLUTION_STORE = 'code-architecture-evolution.json';

export type ArchitectureBaseline = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  modulePath: string;
  expectedContracts: string[];
  recordedAt: string;
};

export type DriftSignal = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  modulePath: string;
  missingContracts: string[];
  unexpectedContracts: string[];
  evidenceLabel: 'architecture_drift_suspected';
  autoDeploy: false;
  productionAuthorized: false;
  at: string;
};

export type RefactorCandidate = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  title: string;
  summary: string;
  targetPaths: string[];
  status: 'candidate';
  applied: false;
  merged: false;
  deployed: false;
  productionAuthorized: false;
  reviewGate: 'required';
  createdAt: string;
};

export type EvolutionProposal = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  title: string;
  rationale: string;
  status: 'proposal_under_review';
  autoMerged: false;
  autoDeployed: false;
  productionAuthorized: false;
  createdAt: string;
};

type ArchStore = {
  baselines: ArchitectureBaseline[];
  drifts: DriftSignal[];
  refactorCandidates: RefactorCandidate[];
  proposals: EvolutionProposal[];
  denials: Array<{ id: string; at: string; reason: string }>;
};

const MAX = 5_000;

function storePath(root: string) {
  return xivLocalPath(root, ARCH_EVOLUTION_STORE);
}

async function load(root: string): Promise<ArchStore> {
  const parsed = await readJsonFile<ArchStore>(storePath(root), {
    baselines: [],
    drifts: [],
    refactorCandidates: [],
    proposals: [],
    denials: [],
  });
  return {
    baselines: Array.isArray(parsed.baselines) ? parsed.baselines : [],
    drifts: Array.isArray(parsed.drifts) ? parsed.drifts : [],
    refactorCandidates: Array.isArray(parsed.refactorCandidates)
      ? parsed.refactorCandidates
      : [],
    proposals: Array.isArray(parsed.proposals) ? parsed.proposals : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: ArchStore) {
  await writeJsonFileAtomic(storePath(root), {
    baselines: store.baselines.slice(-MAX),
    drifts: store.drifts.slice(-MAX),
    refactorCandidates: store.refactorCandidates.slice(-MAX),
    proposals: store.proposals.slice(-MAX),
    denials: store.denials.slice(-MAX),
  });
}

export async function recordArchitectureBaseline(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  modulePath: string;
  expectedContracts: string[];
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (!input.orgId || !input.tenantId || !input.universeId || !input.modulePath) {
    return { accepted: false as const, reason: 'ORG_TENANT_UNIVERSE_MODULE_REQUIRED', baseline: null };
  }
  const store = await load(root);
  const baseline: ArchitectureBaseline = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    modulePath: input.modulePath,
    expectedContracts: [...input.expectedContracts],
    recordedAt: new Date().toISOString(),
  };
  store.baselines.push(baseline);
  await save(root, store);
  return { accepted: true as const, reason: 'ARCHITECTURE_BASELINE_RECORDED', baseline };
}

export async function detectArchitectureDrift(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  modulePath: string;
  observedContracts: string[];
  /** Hard-deny probe: auto-deploy on drift. */
  attemptAutoDeploy?: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  if (input.attemptAutoDeploy) {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason: DRIFT_NO_AUTO_DEPLOY,
    });
    await save(root, store);
    return {
      accepted: false as const,
      reason: DRIFT_NO_AUTO_DEPLOY,
      drift: null,
      autoDeploy: false as const,
      productionAuthorized: false as const,
    };
  }

  const baseline = [...store.baselines]
    .reverse()
    .find(
      (b) =>
        b.orgId === input.orgId &&
        b.universeId === input.universeId &&
        b.modulePath === input.modulePath,
    );
  if (!baseline) {
    return { accepted: false as const, reason: 'ARCHITECTURE_BASELINE_MISSING', drift: null };
  }

  const expected = new Set(baseline.expectedContracts);
  const observed = new Set(input.observedContracts);
  const missingContracts = [...expected].filter((c) => !observed.has(c));
  const unexpectedContracts = [...observed].filter((c) => !expected.has(c));

  const drift: DriftSignal = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    modulePath: input.modulePath,
    missingContracts,
    unexpectedContracts,
    evidenceLabel: 'architecture_drift_suspected',
    autoDeploy: false,
    productionAuthorized: false,
    at: new Date().toISOString(),
  };
  store.drifts.push(drift);
  await save(root, store);

  return {
    accepted: true as const,
    reason:
      missingContracts.length || unexpectedContracts.length
        ? 'ARCHITECTURE_DRIFT_SIGNAL_RECORDED_NO_AUTO_DEPLOY'
        : 'NO_ARCHITECTURE_DRIFT_DETECTED',
    drift,
    autoDeploy: false as const,
    productionAuthorized: false as const,
  };
}

export async function proposeRefactorCandidate(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  title: string;
  summary: string;
  targetPaths: string[];
  /** Hard-deny probe: apply/merge/deploy candidate immediately. */
  attemptApply?: boolean;
  attemptMerge?: boolean;
  attemptDeploy?: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  if (input.attemptApply || input.attemptMerge || input.attemptDeploy) {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason: REFACTOR_REMAINS_CANDIDATE,
    });
    await save(root, store);
    return {
      accepted: false as const,
      reason: REFACTOR_REMAINS_CANDIDATE,
      candidate: null,
      applied: false as const,
      merged: false as const,
      deployed: false as const,
    };
  }

  const candidate: RefactorCandidate = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    title: input.title.trim(),
    summary: input.summary.trim(),
    targetPaths: [...input.targetPaths],
    status: 'candidate',
    applied: false,
    merged: false,
    deployed: false,
    productionAuthorized: false,
    reviewGate: 'required',
    createdAt: new Date().toISOString(),
  };
  store.refactorCandidates.push(candidate);
  await save(root, store);

  return {
    accepted: true as const,
    reason: REFACTOR_REMAINS_CANDIDATE,
    candidate,
    applied: false as const,
    merged: false as const,
    deployed: false as const,
  };
}

export async function proposeArchitectureEvolution(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  title: string;
  rationale: string;
  attemptAutoMerge?: boolean;
  attemptAutoDeploy?: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  if (input.attemptAutoMerge || input.attemptAutoDeploy) {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason: DRIFT_NO_AUTO_DEPLOY,
    });
    await save(root, store);
    return {
      accepted: false as const,
      reason: DRIFT_NO_AUTO_DEPLOY,
      proposal: null,
      autoMerged: false as const,
      autoDeployed: false as const,
    };
  }

  const proposal: EvolutionProposal = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    title: input.title.trim(),
    rationale: input.rationale.trim(),
    status: 'proposal_under_review',
    autoMerged: false,
    autoDeployed: false,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.proposals.push(proposal);
  await save(root, store);

  return {
    accepted: true as const,
    reason: 'EVOLUTION_PROPOSAL_UNDER_REVIEW_GATE',
    proposal,
    autoMerged: false as const,
    autoDeployed: false as const,
  };
}

export function architectureEvolutionHonesty() {
  return {
    locks: BS_LOCKS,
    refactorCandidateAutoApply: BS_LOCKS.REFACTOR_CANDIDATE_AUTO_APPLY,
    architectureDriftAutoDeploy: BS_LOCKS.ARCHITECTURE_DRIFT_AUTO_DEPLOY,
    productionAuthorization: false as const,
  };
}
