/**
 * 62L-BY Semiconductor Innovation Laboratory — research sandboxes for
 * semiconductor ideas/experiments; gated candidates only.
 * Lab output ≠ production chip/deploy authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BY_LOCKS,
  HONESTY_BANNER,
  HIDDEN_REASONING_TRACE_REJECTED,
  LAB_SANDBOXED_NOT_PRODUCTION,
  containsForbiddenPrivateFields,
  type ByActor,
  type ConfidenceLabel,
} from './hardware-cortex-synapse-compiler-types';

export type LabExperiment = {
  id: string;
  title: string;
  hypothesis: string;
  sandboxId: string;
  status: 'sandboxed' | 'candidate' | 'denied';
  productionAuthorized: false;
  chipDeployAuthority: false;
  labeledVerified: false;
  provenanceRefs: string[];
  confidence: ConfidenceLabel;
  createdAt: string;
  actorId: string;
  reason: typeof LAB_SANDBOXED_NOT_PRODUCTION;
};

type Store = { experiments: LabExperiment[] };

function storePath(root: string) {
  return xivLocalPath(root, 'semiconductor-innovation-laboratory.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { experiments: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function semiconductorLabHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4: BY_LOCKS.L4_AUTONOMY_ENABLED,
    labSandboxOnly: BY_LOCKS.LAB_SANDBOX_ONLY,
    productionChipDeploy: BY_LOCKS.PRODUCTION_CHIP_DEPLOY_AUTHORITY,
    labIsProduction: BY_LOCKS.LAB_OUTPUT_IS_PRODUCTION,
  };
}

/**
 * Run a sandboxed semiconductor experiment. Output remains SANDBOXED /
 * CANDIDATE — never production-authorized.
 */
export async function runSemiconductorLabExperiment(input: {
  title: string;
  hypothesis: string;
  sandboxId?: string;
  provenanceRefs?: string[];
  requestProductionAuthorize?: boolean;
  requestChipDeploy?: boolean;
  payload?: Record<string, unknown>;
  actor: ByActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (containsForbiddenPrivateFields(input.payload)) {
    return {
      accepted: false as const,
      status: 'denied' as const,
      productionAuthorized: false as const,
      reason: HIDDEN_REASONING_TRACE_REJECTED,
      experiment: null,
    };
  }

  if (input.requestProductionAuthorize || input.requestChipDeploy) {
    return {
      accepted: false as const,
      status: 'denied' as const,
      productionAuthorized: false as const,
      reason: LAB_SANDBOXED_NOT_PRODUCTION,
      experiment: null,
    };
  }

  const experiment: LabExperiment = {
    id: id('lab'),
    title: input.title.trim(),
    hypothesis: input.hypothesis.trim(),
    sandboxId: input.sandboxId ?? `sandbox_${input.actor.orgId}`,
    status: 'sandboxed',
    productionAuthorized: false,
    chipDeployAuthority: false,
    labeledVerified: false,
    provenanceRefs: input.provenanceRefs ?? [],
    confidence: 'unverified',
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
    reason: LAB_SANDBOXED_NOT_PRODUCTION,
  };

  const store = await load(root);
  store.experiments.push(experiment);
  await save(root, store);

  return {
    accepted: true as const,
    status: 'sandboxed' as const,
    productionAuthorized: false as const,
    chipDeployAuthority: false as const,
    reason: LAB_SANDBOXED_NOT_PRODUCTION,
    experiment,
  };
}

/**
 * Attempt to promote lab output to production — always DENIED without founder gate
 * (gate not implemented as auto-pass here).
 */
export async function attemptLabProductionAuthorize(input: {
  experimentId: string;
  actor: ByActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const experiment = store.experiments.find((e) => e.id === input.experimentId) ?? null;
  return {
    accepted: false as const,
    status: 'denied' as const,
    productionAuthorized: false as const,
    reason: LAB_SANDBOXED_NOT_PRODUCTION,
    experiment,
  };
}

export async function listLabExperiments(root = process.cwd()) {
  return (await load(root)).experiments;
}
