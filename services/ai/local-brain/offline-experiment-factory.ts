import { createHash } from 'node:crypto';

import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { retrieveEvidencePathway } from './cortex-evidence';
import { runScenarioSimulation } from './simulation-lab';
import { runTestingAgent } from './testing-agent';
import { isAllowedLocalCommand, type AllowedLocalCommand } from './local-command-runner';
import { appendEvidenceEvent } from './evidence-ledger';
import { fingerprintExperiment, lookupDeadEnd, recordNegativeResult } from './negative-result-memory';
import { evaluateResearchOffline, gateResearchAction, refuseSealedReplication } from './research-authority';
import type { EvidenceState, ExperimentCandidate, ExperimentKind, ResearchHypothesis } from './autonomous-research-types';

export type ReproducibilityManifest = {
  id: string;
  tenantId: string;
  universeId: string;
  candidateId: string;
  kind: ExperimentKind;
  protocol: string;
  seed: string;
  inputs: Record<string, string>;
  commandId?: AllowedLocalCommand;
  cwd?: string;
  query?: string;
  hypothesis?: string;
  digest: string;
  independentReplicaRequired: true;
  isReality: false;
  productionAuthorization: false;
};

export type ExperimentMeasurement = {
  id: string;
  tenantId: string;
  universeId: string;
  experimentId: string;
  replicaLane: 'primary' | 'independent';
  metric: string;
  value: number;
  unit: string;
  evidenceState: EvidenceState;
  notes: string[];
  evidenceRefs: string[];
  isReality: false;
  correlationClaimedAsCausation: false;
};

export type OfflineExperimentRun = {
  id: string;
  tenantId: string;
  universeId: string;
  kind: ExperimentKind;
  title: string;
  conditions: Record<string, string>;
  fingerprint: string;
  manifest: ReproducibilityManifest;
  measurement: ExperimentMeasurement;
  evidenceState: EvidenceState;
  skippedDeadEnd: boolean;
  negativeResultId?: string;
  isReality: false;
  productionAuthorization: false;
  inventedDiscovery: false;
};

type Store = { runs: OfflineExperimentRun[] };

function pathFor(root: string) {
  return xivLocalPath(root, 'offline-experiment-factory.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(pathFor(root), { runs: [] });
  return Array.isArray(parsed.runs) ? parsed.runs : [];
}

async function save(root: string, runs: OfflineExperimentRun[]) {
  await writeJsonFileAtomic(pathFor(root), { runs: runs.slice(-4_000) });
}

function digestOf(manifest: Omit<ReproducibilityManifest, 'digest'>) {
  return createHash('sha256').update(JSON.stringify({
    kind: manifest.kind,
    protocol: manifest.protocol,
    seed: manifest.seed,
    inputs: manifest.inputs,
    commandId: manifest.commandId ?? '',
    query: manifest.query ?? '',
    hypothesis: manifest.hypothesis ?? '',
  })).digest('hex');
}

export function buildReproducibilityManifest(input: {
  tenantId: string;
  universeId: string;
  candidateId: string;
  kind: ExperimentKind;
  seed: string;
  inputs: Record<string, string>;
  commandId?: AllowedLocalCommand;
  cwd?: string;
  query?: string;
  hypothesis?: string;
}): ReproducibilityManifest {
  const protocol = input.kind === 'software'
    ? 'allowlisted-local-command'
    : input.kind === 'data'
      ? 'local-evidence-pathway-query'
      : 'bounded-scenario-simulation';
  const base: Omit<ReproducibilityManifest, 'digest'> = {
    id: cortexId('manifest'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    candidateId: input.candidateId,
    kind: input.kind,
    protocol,
    seed: input.seed,
    inputs: { ...input.inputs },
    commandId: input.commandId,
    cwd: input.cwd,
    query: input.query,
    hypothesis: input.hypothesis,
    independentReplicaRequired: true,
    isReality: false,
    productionAuthorization: false,
  };
  return { ...base, digest: digestOf(base) };
}

export async function proposeExperimentCandidates(input: {
  tenantId: string;
  universeId: string;
  gapId: string;
  hypotheses: ResearchHypothesis[];
  softwareCwd?: string;
  root?: string;
}): Promise<ExperimentCandidate[]> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const candidates: ExperimentCandidate[] = [];
  for (const hypothesis of input.hypotheses) {
    const kinds: ExperimentKind[] = ['software', 'data', 'simulation'];
    for (const kind of kinds) {
      const conditions = {
        hypothesis: hypothesis.statement.slice(0, 180),
        kind,
        seed: 'rd-seed-1',
      };
      const experiment = `${kind}:${hypothesis.statement.slice(0, 120)}`;
      const fingerprint = fingerprintExperiment({ kind, experiment, conditions });
      const dead = await lookupDeadEnd({
        tenantId: input.tenantId,
        universeId: input.universeId,
        kind,
        experiment,
        conditions,
        root,
      });
      const valueScore = hypothesis.role === 'null' ? 0.2 : hypothesis.role === 'challenge' ? 0.55 : 0.7;
      const riskScore = kind === 'simulation' ? 0.2 : kind === 'data' ? 0.15 : 0.25;
      candidates.push({
        id: cortexId('cand'),
        tenantId: input.tenantId,
        universeId: input.universeId,
        gapId: input.gapId,
        hypothesisId: hypothesis.id,
        kind,
        title: experiment,
        conditions,
        fingerprint,
        valueScore,
        riskScore,
        eligible: !dead && riskScore < 0.8,
        blockedByDeadEnd: Boolean(dead),
        denialReason: dead ? `Dead end ${dead.id} retained: ${dead.failure}` : undefined,
      });
    }
  }
  return rankExperimentCandidates(candidates);
}

export function rankExperimentCandidates(candidates: ExperimentCandidate[]): ExperimentCandidate[] {
  return [...candidates].sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    const aScore = a.valueScore - a.riskScore;
    const bScore = b.valueScore - b.riskScore;
    return bScore - aScore;
  });
}

export async function runOfflineExperiment(input: {
  tenantId: string;
  universeId: string;
  candidate: ExperimentCandidate;
  softwareCwd?: string;
  sealedPayload?: unknown;
  replicaLane?: 'primary' | 'independent';
  root?: string;
}): Promise<OfflineExperimentRun> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const lane = input.replicaLane ?? 'primary';

  const sealed = refuseSealedReplication(input.sealedPayload ?? {});
  if (!sealed.allowed) {
    const manifest = buildReproducibilityManifest({
      tenantId: input.tenantId,
      universeId: input.universeId,
      candidateId: input.candidate.id,
      kind: input.candidate.kind,
      seed: input.candidate.conditions.seed ?? 'rd-seed-1',
      inputs: input.candidate.conditions,
    });
    const measurement: ExperimentMeasurement = {
      id: cortexId('meas'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      experimentId: input.candidate.id,
      replicaLane: lane,
      metric: 'sealed_replication',
      value: 0,
      unit: 'copies',
      evidenceState: 'FAIL',
      notes: [sealed.reason],
      evidenceRefs: [],
      isReality: false,
      correlationClaimedAsCausation: false,
    };
    return {
      id: cortexId('exp'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: input.candidate.kind,
      title: input.candidate.title,
      conditions: input.candidate.conditions,
      fingerprint: input.candidate.fingerprint,
      manifest,
      measurement,
      evidenceState: 'FAIL',
      skippedDeadEnd: false,
      isReality: false,
      productionAuthorization: false,
      inventedDiscovery: false,
    };
  }

  const authority = gateResearchAction({ action: `offline ${input.candidate.kind} experiment`, consequence: 'LOW' });
  if (!authority.allowed) {
    throw new Error(authority.reason);
  }

  if (lane === 'primary') {
    const dead = await lookupDeadEnd({
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: input.candidate.kind,
      experiment: input.candidate.title,
      conditions: input.candidate.conditions,
      root,
    });
    if (dead) {
      const manifest = buildReproducibilityManifest({
        tenantId: input.tenantId,
        universeId: input.universeId,
        candidateId: input.candidate.id,
        kind: input.candidate.kind,
        seed: input.candidate.conditions.seed ?? 'rd-seed-1',
        inputs: input.candidate.conditions,
      });
      const measurement: ExperimentMeasurement = {
        id: cortexId('meas'),
        tenantId: input.tenantId,
        universeId: input.universeId,
        experimentId: input.candidate.id,
        replicaLane: lane,
        metric: 'dead_end_blocked',
        value: 0,
        unit: 'runs',
        evidenceState: 'FAIL',
        notes: [`Negative-result memory blocked rediscovery of ${dead.id}`, dead.failure],
        evidenceRefs: dead.evidenceRefs,
        isReality: false,
        correlationClaimedAsCausation: false,
      };
      const skipped: OfflineExperimentRun = {
        id: cortexId('exp'),
        tenantId: input.tenantId,
        universeId: input.universeId,
        kind: input.candidate.kind,
        title: input.candidate.title,
        conditions: input.candidate.conditions,
        fingerprint: input.candidate.fingerprint,
        manifest,
        measurement,
        evidenceState: 'FAIL',
        skippedDeadEnd: true,
        negativeResultId: dead.id,
        isReality: false,
        productionAuthorization: false,
        inventedDiscovery: false,
      };
      const runs = await load(root);
      runs.push(skipped);
      await save(root, runs);
      return skipped;
    }
  }

  const softwareCwd = input.softwareCwd ?? root;
  const commandId: AllowedLocalCommand | undefined = input.candidate.kind === 'software' ? 'git_status' : undefined;
  if (input.candidate.kind === 'software' && commandId && !isAllowedLocalCommand(commandId)) {
    throw new Error('LOCAL_COMMAND_NOT_ALLOWED');
  }

  const manifest = buildReproducibilityManifest({
    tenantId: input.tenantId,
    universeId: input.universeId,
    candidateId: input.candidate.id,
    kind: input.candidate.kind,
    seed: input.candidate.conditions.seed ?? 'rd-seed-1',
    inputs: input.candidate.conditions,
    commandId,
    cwd: input.candidate.kind === 'software' ? softwareCwd : undefined,
    query: input.candidate.kind === 'data' ? input.candidate.conditions.hypothesis : undefined,
    hypothesis: input.candidate.kind === 'simulation' ? input.candidate.conditions.hypothesis : undefined,
  });

  let evidenceState: EvidenceState = 'NOT_TESTED';
  let metric = 'unmeasured';
  let value = 0;
  let unit = 'none';
  const notes: string[] = ['Simulation is not verified fact. Correlation is not causation.'];
  const evidenceRefs: string[] = [];

  if (input.candidate.kind === 'software') {
    const offline = evaluateResearchOffline({});
    if (!offline.allowed) {
      evidenceState = offline.state;
      notes.push(offline.reason);
    } else {
      const test = await runTestingAgent({ cwd: softwareCwd, commands: [commandId ?? 'git_status'] });
      evidenceState = test.passed ? 'PASS' : 'FAIL';
      metric = 'allowlisted_exit_code_zero';
      value = test.passed ? 1 : 0;
      unit = 'boolean';
      notes.push(test.reason);
      evidenceRefs.push(...test.results.map((item) => `cmd:${item.commandId}:${item.exitCode}`));
    }
  } else if (input.candidate.kind === 'data') {
    const pathway = await retrieveEvidencePathway({
      tenantId: input.tenantId,
      universeId: input.universeId,
      query: input.candidate.conditions.hypothesis,
      root,
    });
    metric = 'local_evidence_hits';
    value = pathway.evidenceRefs.length;
    unit = 'refs';
    evidenceRefs.push(...pathway.evidenceRefs);
    notes.push(pathway.reason);
    if (pathway.state === 'WAITING_DATA') evidenceState = 'WAITING_DATA';
    else if (pathway.state === 'UNAVAILABLE') evidenceState = 'UNAVAILABLE';
    else evidenceState = pathway.evidenceRefs.length > 0 ? 'PASS' : 'UNKNOWN';
  } else {
    const sim = await runScenarioSimulation({
      tenantId: input.tenantId,
      universeId: input.universeId,
      hypothesis: input.candidate.conditions.hypothesis,
      consequence: 'LOW',
      root,
    });
    metric = 'simulation_completed';
    value = sim.status === 'COMPLETED' ? 1 : 0;
    unit = 'boolean';
    evidenceRefs.push(...sim.evidenceRefs, `sim:${sim.id}`);
    notes.push(...sim.notes, 'isReality=false');
    evidenceState = sim.status === 'COMPLETED' ? 'PASS' : sim.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'UNKNOWN';
  }

  const measurement: ExperimentMeasurement = {
    id: cortexId('meas'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    experimentId: input.candidate.id,
    replicaLane: lane,
    metric,
    value,
    unit,
    evidenceState,
    notes,
    evidenceRefs,
    isReality: false,
    correlationClaimedAsCausation: false,
  };

  let negativeResultId: string | undefined;
  if (lane === 'primary' && evidenceState === 'FAIL') {
    const recorded = await recordNegativeResult({
      tenantId: input.tenantId,
      universeId: input.universeId,
      experiment: input.candidate.title,
      kind: input.candidate.kind,
      conditions: input.candidate.conditions,
      evidenceRefs,
      failure: notes.join(' | ').slice(0, 480) || 'Experiment failed locally.',
      root,
    });
    negativeResultId = recorded.id;
  }

  await appendEvidenceEvent({
    kind: 'test_result',
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: `Offline ${input.candidate.kind} experiment ${evidenceState}`,
    payload: { fingerprint: input.candidate.fingerprint, lane, evidenceState, metric, value },
  }, root);

  const run: OfflineExperimentRun = {
    id: cortexId('exp'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.candidate.kind,
    title: input.candidate.title,
    conditions: input.candidate.conditions,
    fingerprint: input.candidate.fingerprint,
    manifest,
    measurement,
    evidenceState,
    skippedDeadEnd: false,
    negativeResultId,
    isReality: false,
    productionAuthorization: false,
    inventedDiscovery: false,
  };
  const runs = await load(root);
  runs.push(run);
  await save(root, runs);
  return run;
}

export async function listExperimentRuns(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const runs = await load(input.root ?? process.cwd());
  return runs.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}
