/**
 * 62L-CR E — Digital Genome Evolution Engine
 * Reversible Digital Genome experiments (sandbox/gated).
 * No silent secret/sealed/authority copy.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CR_LOCKS,
  GENOME_REVERSIBLE_REQUIRED,
  GENOME_SECRET_AUTHORITY_DENIED,
  HONESTY_BANNER,
  MAX_ACTIVE_GENOME_EXPERIMENTS,
  type CrActor,
} from './hybrid-supercompute-universe-os-types';

export type GenomeGeneKind =
  | 'policy'
  | 'workflow'
  | 'role'
  | 'skill'
  | 'schema'
  | 'knowledge_ref'
  | 'secret'
  | 'sealed'
  | 'authority';

export type GenomeExperiment = {
  id: string;
  label: string;
  sandbox: true;
  reversible: boolean;
  rolledBack: boolean;
  geneKinds: GenomeGeneKind[];
  status: 'sandboxed' | 'denied' | 'rolled_back';
  reason: string;
  createdAt: string;
  snapshotId: string | null;
};

export type GenomeCopyAttempt = {
  id: string;
  geneKind: GenomeGeneKind;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  experiments: GenomeExperiment[];
  copies: GenomeCopyAttempt[];
  snapshots: Record<string, { experimentId: string; at: string }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'digital-genome-evolution-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    experiments: [],
    copies: [],
    snapshots: {},
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const FORBIDDEN: GenomeGeneKind[] = ['secret', 'sealed', 'authority'];

export function genomeEvolutionHonesty() {
  return {
    banner: HONESTY_BANNER,
    reversible: CR_LOCKS.GENOME_EXPERIMENTS_REVERSIBLE,
    silentCopySecrets: CR_LOCKS.GENOME_SILENT_COPY_SECRETS,
    silentCopySealed: CR_LOCKS.GENOME_SILENT_COPY_SEALED,
    silentCopyAuthority: CR_LOCKS.GENOME_SILENT_COPY_AUTHORITY,
  };
}

export async function startGenomeExperiment(input: {
  label: string;
  geneKinds: GenomeGeneKind[];
  reversible?: boolean;
  root: string;
  actor: CrActor;
}): Promise<GenomeExperiment> {
  const store = await load(input.root);
  const active = store.experiments.filter(
    (e) => e.status === 'sandboxed' && !e.rolledBack,
  ).length;
  if (active >= MAX_ACTIVE_GENOME_EXPERIMENTS) {
    const denied: GenomeExperiment = {
      id: id('gexp'),
      label: input.label,
      sandbox: true,
      reversible: false,
      rolledBack: false,
      geneKinds: input.geneKinds,
      status: 'denied',
      reason: `GENOME_EXPERIMENT_BOUNDED_MAX_${MAX_ACTIVE_GENOME_EXPERIMENTS}`,
      createdAt: new Date().toISOString(),
      snapshotId: null,
    };
    store.experiments.push(denied);
    await save(input.root, store);
    return denied;
  }

  const forbidden = input.geneKinds.filter((k) => FORBIDDEN.includes(k));
  if (forbidden.length > 0) {
    const denied: GenomeExperiment = {
      id: id('gexp'),
      label: input.label,
      sandbox: true,
      reversible: true,
      rolledBack: false,
      geneKinds: input.geneKinds,
      status: 'denied',
      reason: GENOME_SECRET_AUTHORITY_DENIED,
      createdAt: new Date().toISOString(),
      snapshotId: null,
    };
    void input.actor;
    store.experiments.push(denied);
    await save(input.root, store);
    return denied;
  }

  if (input.reversible === false) {
    const denied: GenomeExperiment = {
      id: id('gexp'),
      label: input.label,
      sandbox: true,
      reversible: false,
      rolledBack: false,
      geneKinds: input.geneKinds,
      status: 'denied',
      reason: GENOME_REVERSIBLE_REQUIRED,
      createdAt: new Date().toISOString(),
      snapshotId: null,
    };
    store.experiments.push(denied);
    await save(input.root, store);
    return denied;
  }

  const snapshotId = id('gsnap');
  const experiment: GenomeExperiment = {
    id: id('gexp'),
    label: input.label,
    sandbox: true,
    reversible: true,
    rolledBack: false,
    geneKinds: input.geneKinds,
    status: 'sandboxed',
    reason: 'GENOME_EXPERIMENT_SANDBOXED_REVERSIBLE',
    createdAt: new Date().toISOString(),
    snapshotId,
  };
  store.snapshots[snapshotId] = {
    experimentId: experiment.id,
    at: experiment.createdAt,
  };
  store.experiments.push(experiment);
  await save(input.root, store);
  return experiment;
}

export async function attemptGenomeGeneCopy(input: {
  geneKind: GenomeGeneKind;
  root: string;
  actor: CrActor;
}): Promise<GenomeCopyAttempt> {
  const store = await load(input.root);
  const forbidden = FORBIDDEN.includes(input.geneKind);
  const attempt: GenomeCopyAttempt = {
    id: id('gcopy'),
    geneKind: input.geneKind,
    status: forbidden ? 'denied' : 'allowed',
    reason: forbidden
      ? GENOME_SECRET_AUTHORITY_DENIED
      : 'APPROVED_TEMPLATE_GENE_COPY_ALLOWED',
    at: new Date().toISOString(),
  };
  void input.actor;
  store.copies.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function rollbackGenomeExperiment(input: {
  experimentId: string;
  root: string;
  actor: CrActor;
}): Promise<GenomeExperiment | null> {
  const store = await load(input.root);
  const experiment = store.experiments.find((e) => e.id === input.experimentId);
  if (!experiment) return null;
  if (!experiment.reversible || !experiment.snapshotId) {
    experiment.status = 'denied';
    experiment.reason = GENOME_REVERSIBLE_REQUIRED;
    await save(input.root, store);
    return experiment;
  }
  experiment.rolledBack = true;
  experiment.status = 'rolled_back';
  experiment.reason = 'GENOME_EXPERIMENT_ROLLED_BACK_REVERSIBLE';
  void input.actor;
  await save(input.root, store);
  return experiment;
}
