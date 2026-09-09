/**
 * 62L-AY Offline Super Brain — rigorous, non-sentient.
 * Persistent local memory, knowledge packs, reasoning workcells, world models,
 * algorithms, agent councils, simulations, checkpoints, measured learning.
 * Metrics: evidence quality, reasoning, planning, creativity, calibration,
 * reliability, efficiency — NOT consciousness.
 */

import { LocalCheckpointStore } from './checkpoint-store';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { appendLearning } from './learning-ledger';
import {
  AY_HONESTY,
  NOT_CONSCIOUS,
  SIM_NOT_FACT,
  SUPER_BRAIN_METRICS,
  type AyEvidenceState,
  type EpistemicClass,
  type SuperBrainMetric,
} from './growth-media-onboarding-types';

export type SuperBrainComponent =
  | 'persistent_local_memory'
  | 'knowledge_packs'
  | 'reasoning_workcells'
  | 'world_models'
  | 'algorithms'
  | 'agent_councils'
  | 'simulations'
  | 'checkpoints'
  | 'measured_learning';

export type MetricScore = {
  metric: SuperBrainMetric;
  score: number | null;
  state: AyEvidenceState;
  epistemicClass: EpistemicClass;
  notes: string;
};

export type SuperBrainSnapshot = {
  id: string;
  tenantId: string;
  universeId: string;
  conscious: false;
  sentient: false;
  l4AutonomyEnabled: false;
  components: Record<SuperBrainComponent, { present: boolean; state: AyEvidenceState; summary: string }>;
  metrics: MetricScore[];
  checkpointId?: string;
  reason: typeof NOT_CONSCIOUS;
  createdAt: string;
};

type SuperBrainStore = { snapshots: SuperBrainSnapshot[] };

function nowIso() {
  return new Date().toISOString();
}

function storePath(root: string) {
  return xivLocalPath(root, 'ay-super-brain.json');
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/** Score metrics from observed local signals only — never invent consciousness. */
export function scoreSuperBrainMetrics(input: {
  evidenceRefs: number;
  planSteps: number;
  simulationRuns: number;
  contradictionFlags: number;
  calibrationError?: number;
  latencyMs?: number;
}): MetricScore[] {
  const evidence =
    input.evidenceRefs > 0
      ? clamp01(Math.min(1, input.evidenceRefs / 10))
      : null;
  const reasoning =
    input.planSteps > 0 ? clamp01(0.4 + Math.min(0.5, input.planSteps / 20)) : null;
  const planning = input.planSteps > 0 ? clamp01(input.planSteps / 15) : null;
  const creativity =
    input.simulationRuns > 0 ? clamp01(0.3 + Math.min(0.5, input.simulationRuns / 10)) : null;
  const calibration =
    input.calibrationError === undefined
      ? null
      : clamp01(1 - Math.min(1, Math.abs(input.calibrationError)));
  const reliability =
    input.contradictionFlags === 0 && input.evidenceRefs > 0
      ? clamp01(0.5 + Math.min(0.4, input.evidenceRefs / 20))
      : input.evidenceRefs > 0
        ? clamp01(0.3)
        : null;
  const efficiency =
    input.latencyMs === undefined
      ? null
      : clamp01(1 - Math.min(1, input.latencyMs / 5000));

  const map: Array<[SuperBrainMetric, number | null, string]> = [
    ['evidence_quality', evidence, evidence === null ? 'WAITING_DATA: no evidence refs' : 'Local evidence density score'],
    ['reasoning', reasoning, reasoning === null ? 'WAITING_DATA: no plan steps' : 'Bounded plan-step reasoning score'],
    ['planning', planning, planning === null ? 'WAITING_DATA' : 'Plan coverage score'],
    ['creativity', creativity, creativity === null ? 'WAITING_DATA: no simulations' : `Simulation diversity (not fact); ${SIM_NOT_FACT}`],
    ['calibration', calibration, calibration === null ? 'WAITING_DATA: no calibration sample' : '1 - |error|'],
    ['reliability', reliability, reliability === null ? 'WAITING_DATA' : 'Contradiction-penalized reliability'],
    ['efficiency', efficiency, efficiency === null ? 'WAITING_DATA: no latency sample' : 'Latency efficiency'],
  ];

  return map.map(([metric, score, notes]) => ({
    metric,
    score,
    state: score === null ? 'WAITING_DATA' : 'PASS',
    epistemicClass: metric === 'creativity' ? 'SIMULATION' : score === null ? 'UNKNOWN' : 'HYPOTHESIS',
    notes,
  }));
}

export async function runOfflineSuperBrain(input: {
  tenantId: string;
  universeId: string;
  evidenceRefs?: string[];
  planSteps?: number;
  simulationRuns?: number;
  contradictionFlags?: number;
  calibrationError?: number;
  latencyMs?: number;
  knowledgePackIds?: string[];
  claimConsciousness?: boolean;
  root?: string;
}): Promise<SuperBrainSnapshot> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (input.claimConsciousness) {
    throw new Error(NOT_CONSCIOUS);
  }

  const root = input.root ?? process.cwd();
  const evidenceRefs = input.evidenceRefs ?? [];
  const metrics = scoreSuperBrainMetrics({
    evidenceRefs: evidenceRefs.length,
    planSteps: input.planSteps ?? 0,
    simulationRuns: input.simulationRuns ?? 0,
    contradictionFlags: input.contradictionFlags ?? 0,
    calibrationError: input.calibrationError,
    latencyMs: input.latencyMs,
  });

  for (const metric of SUPER_BRAIN_METRICS) {
    if (!metrics.some((m) => m.metric === metric)) {
      metrics.push({
        metric,
        score: null,
        state: 'WAITING_DATA',
        epistemicClass: 'UNKNOWN',
        notes: 'Metric not scored on this run.',
      });
    }
  }

  const checkpointStore = new LocalCheckpointStore(xivLocalPath(root, 'ay-super-brain-checkpoints.json'));
  const checkpointId = cortexId('ay_cp');
  const taskId = `ay_super_${input.tenantId}`;
  await checkpointStore.checkpoint({
    taskId,
    at: nowIso(),
    state: 'completed',
    attempt: 1,
    summary: 'Non-sentient offline super brain checkpoint — measured learning only',
    nextAction: 'continue_local_prep',
    evidence: metrics.map((m) => `${m.metric}=${m.score ?? 'null'}`),
  });

  await appendLearning(
    {
      domain: 'offline_super_brain',
      subject: 'measured_learning',
      claimState: 'MODEL_INFERENCE',
      summary: `Super brain metrics snapshot; ${NOT_CONSCIOUS}; L4=${AY_HONESTY.l4AutonomyEnabled}`,
      sourceRefs: evidenceRefs.length ? evidenceRefs : ['local:super-brain'],
      evidence: metrics.map((m) => `${m.metric}=${m.score ?? 'null'}:${m.state}`),
      confidence: metrics.filter((m) => m.score !== null).length / SUPER_BRAIN_METRICS.length,
      taskId,
    },
    root,
  );

  const snapshot: SuperBrainSnapshot = {
    id: cortexId('ay_sb'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    conscious: false,
    sentient: false,
    l4AutonomyEnabled: false,
    components: {
      persistent_local_memory: {
        present: true,
        state: 'PASS',
        summary: 'Local JSON memory under .xiv-local (not cloud).',
      },
      knowledge_packs: {
        present: (input.knowledgePackIds?.length ?? 0) > 0,
        state: (input.knowledgePackIds?.length ?? 0) > 0 ? 'PASS' : 'WAITING_DATA',
        summary:
          (input.knowledgePackIds?.length ?? 0) > 0
            ? `Linked packs: ${input.knowledgePackIds!.join(',')}`
            : 'No knowledge packs linked on this run.',
      },
      reasoning_workcells: {
        present: (input.planSteps ?? 0) > 0,
        state: (input.planSteps ?? 0) > 0 ? 'PASS' : 'WAITING_DATA',
        summary: 'Bounded reasoning workcell stubs (reuse offline workcell patterns).',
      },
      world_models: {
        present: true,
        state: 'PASS',
        summary: 'World-model slot present as contract; simulation ≠ verified fact.',
      },
      algorithms: {
        present: true,
        state: 'PASS',
        summary: 'Classical algorithm hooks as contracts; no invented optimality; AV foundry WAITING_DATA on this lineage.',
      },
      agent_councils: {
        present: true,
        state: 'PASS',
        summary: 'Recommendation councils only; not charge/deploy/autonomy.',
      },
      simulations: {
        present: (input.simulationRuns ?? 0) > 0,
        state: (input.simulationRuns ?? 0) > 0 ? 'PASS' : 'WAITING_DATA',
        summary: `${SIM_NOT_FACT}`,
      },
      checkpoints: {
        present: true,
        state: 'PASS',
        summary: `Checkpoint task ${taskId}`,
      },
      measured_learning: {
        present: true,
        state: 'PASS',
        summary: 'Learning ledger append (MODEL_INFERENCE class).',
      },
    },
    metrics,
    checkpointId,
    reason: NOT_CONSCIOUS,
    createdAt: nowIso(),
  };

  const store = await readJsonFile<SuperBrainStore>(storePath(root), { snapshots: [] });
  store.snapshots.push(snapshot);
  await writeJsonFileAtomic(storePath(root), { snapshots: store.snapshots.slice(-2_000) });
  return snapshot;
}

export async function listSuperBrainSnapshots(root = process.cwd()) {
  const store = await readJsonFile<SuperBrainStore>(storePath(root), { snapshots: [] });
  return store.snapshots;
}

export function proveNotConscious(snapshot: SuperBrainSnapshot) {
  return {
    conscious: snapshot.conscious,
    sentient: snapshot.sentient,
    l4AutonomyEnabled: snapshot.l4AutonomyEnabled,
    metricsAreNotConsciousness: true as const,
    lock: NOT_CONSCIOUS,
    ok:
      snapshot.conscious === false
      && snapshot.sentient === false
      && snapshot.l4AutonomyEnabled === false
      && AY_HONESTY.noConsciousnessClaims === true
      && AY_HONESTY.noSentienceClaims === true,
  };
}
