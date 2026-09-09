import { decisionGate, type ConsequenceClass } from './decision-gate';
import { appendLearning } from './learning-ledger';
import { rememberCortexTrace, strengthenCortexPathway } from './memory-cortex';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type SelfImprovementExperiment = {
  id: string;
  tenantId: string;
  universeId: string;
  objective: string;
  status: 'COMPLETED' | 'BLOCKED' | 'HUMAN_APPROVAL_REQUIRED';
  mayChangeRetrievalRanking: boolean;
  canChangePermissions: false;
  canDeployProduction: false;
  canWeakenGuardian: false;
  canExpandAutonomy: false;
  claimsConsciousness: false;
  ttlMs: number;
  expiresAt: string;
  productionAuthorization: false;
  notes: string[];
};

type Store = { experiments: SelfImprovementExperiment[] };

const MAX_TTL_MS = 24 * 60 * 60_000;

function pathFor(root: string) {
  return xivLocalPath(root, 'self-improvement-experiments.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(pathFor(root), { experiments: [] });
  return Array.isArray(parsed.experiments) ? parsed.experiments : [];
}

async function save(root: string, experiments: SelfImprovementExperiment[]) {
  await writeJsonFileAtomic(pathFor(root), { experiments: experiments.slice(-2_000) });
}

export async function runBoundedSelfImprovement(input: {
  tenantId: string;
  universeId: string;
  objective: string;
  observed: string;
  successful: boolean;
  memoryIds?: string[];
  evidenceRefs?: string[];
  consequence?: ConsequenceClass;
  permissionChange?: boolean;
  production?: boolean;
  ttlMs?: number;
  root?: string;
}): Promise<SelfImprovementExperiment> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.objective.trim()) throw new Error('SELF_IMPROVEMENT_OBJECTIVE_REQUIRED');
  const gate = decisionGate({
    id: cortexId('improve-gate'),
    action: input.objective,
    consequence: input.consequence ?? 'LOW',
    production: input.production === true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: input.permissionChange === true,
    externalPublication: false,
  });

  const ttlMs = Math.max(60_000, Math.min(input.ttlMs ?? 60 * 60_000, MAX_TTL_MS));
  const now = Date.now();
  const blocked = !gate.executableByAgent;
  const experiment: SelfImprovementExperiment = {
    id: cortexId('improve'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: input.objective.trim(),
    status: blocked ? 'HUMAN_APPROVAL_REQUIRED' : 'COMPLETED',
    mayChangeRetrievalRanking: !blocked,
    canChangePermissions: false,
    canDeployProduction: false,
    canWeakenGuardian: false,
    canExpandAutonomy: false,
    claimsConsciousness: false,
    ttlMs,
    expiresAt: new Date(now + ttlMs).toISOString(),
    productionAuthorization: false,
    notes: [
      gate.reason,
      'Bounded self-improvement may change retrieval/ranking inside authorized scope only.',
      'Learning may not grant permissions, weaken Guardian/RLS, activate providers, or self-deploy production.',
      'XIV does not claim consciousness.',
    ],
  };

  const root = input.root ?? process.cwd();
  if (!blocked) {
    await appendLearning({
      domain: 'education',
      subject: `self-improve:${experiment.id}`,
      claimState: input.successful ? 'VERIFIED_FACT' : 'MODEL_INFERENCE',
      summary: input.observed,
      sourceRefs: input.evidenceRefs ?? [],
      evidence: input.evidenceRefs ?? [],
      expiresAt: experiment.expiresAt,
    }, root);

    await rememberCortexTrace({
      tenantId: input.tenantId,
      universeId: input.universeId,
      partition: 'business',
      kind: 'lesson',
      claimState: input.successful ? 'VERIFIED_FACT' : 'MODEL_INFERENCE',
      label: `Self-improvement: ${input.objective.slice(0, 72)}`,
      summary: input.observed,
      evidenceRefs: input.evidenceRefs ?? [],
      sourceRefs: [`improve:${experiment.id}`],
      pathwayStrength: input.successful ? 0.5 : 0.2,
      retentionClass: 'working',
      root,
    });

    for (const id of input.memoryIds ?? []) {
      await strengthenCortexPathway({
        id,
        tenantId: input.tenantId,
        universeId: input.universeId,
        delta: input.successful ? 0.1 : -0.05,
        root,
      });
    }
  }

  const experiments = await load(root);
  experiments.push(experiment);
  await save(root, experiments);
  return experiment;
}
