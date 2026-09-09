import { appendLearning } from './learning-ledger';
import { rememberCortexTrace } from './memory-cortex';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { getSimulationRun } from './causal-simulation';
import type { EpistemicClass } from './causal-world-types';

export type CalibrationRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  simulationId: string;
  estimateClass: 'SIMULATION' | 'FORECAST';
  observedClass: 'VERIFIED_FACT' | 'UNKNOWN';
  estimate: number;
  observed: number | null;
  residual: number | null;
  simulationPromotedToFact: false;
  productionAuthorization: false;
  status: 'CALIBRATED' | 'WAITING_DATA' | 'UNKNOWN';
  notes: string[];
  createdAt: string;
};

type Store = { records: CalibrationRecord[] };

function storePath(root: string) {
  return xivLocalPath(root, 'outcome-calibration.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { records: [] });
  return { records: Array.isArray(parsed.records) ? parsed.records : [] };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), { records: store.records.slice(-2_000) });
}

export async function calibrateOutcome(input: {
  tenantId: string;
  universeId: string;
  simulationId: string;
  observed?: number;
  observedVerified?: boolean;
  evidenceRefs?: string[];
  root?: string;
}): Promise<CalibrationRecord> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const run = await getSimulationRun(input.simulationId, input.tenantId, input.universeId, root);
  if (!run) throw new Error('SIMULATION_RUN_NOT_FOUND');
  const estimate = typeof run.results.mean === 'number'
    ? run.results.mean
    : (Object.values(run.results).find((value) => typeof value === 'number') as number | undefined) ?? 0;

  const hasObservation = typeof input.observed === 'number';
  const observedClass: 'VERIFIED_FACT' | 'UNKNOWN' = hasObservation && input.observedVerified === true ? 'VERIFIED_FACT' : 'UNKNOWN';
  const residual = hasObservation ? input.observed! - estimate : null;
  const status: CalibrationRecord['status'] = !hasObservation
    ? 'WAITING_DATA'
    : observedClass === 'UNKNOWN'
      ? 'UNKNOWN'
      : 'CALIBRATED';

  const record: CalibrationRecord = {
    id: cortexId('cal'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    simulationId: run.id,
    estimateClass: 'SIMULATION',
    observedClass,
    estimate,
    observed: hasObservation ? input.observed! : null,
    residual,
    simulationPromotedToFact: false,
    productionAuthorization: false,
    status,
    notes: [
      'Calibration compares an observed result to a simulation estimate without rewriting the simulation as a fact.',
      `estimateClass=SIMULATION; observedClass=${observedClass}; promoted=${false}`,
    ],
    createdAt: new Date().toISOString(),
  };

  const store = await load(root);
  store.records.push(record);
  await save(root, store);

  await appendLearning({
    domain: 'science',
    subject: `calibration:${run.id}`,
    claimState: observedClass === 'VERIFIED_FACT' ? 'VERIFIED_FACT' : 'MODEL_INFERENCE',
    summary: `status=${status}; estimate=${estimate}; observed=${record.observed}; residual=${residual}; simulationPromotedToFact=false`,
    sourceRefs: [`sim:${run.id}`, ...(input.evidenceRefs ?? [])],
    evidence: input.evidenceRefs ?? [],
    taskId: run.id,
  }, root);

  await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    kind: 'outcome',
    claimState: observedClass === 'VERIFIED_FACT' ? 'VERIFIED_FACT' : 'MODEL_INFERENCE',
    label: `Calibration ${run.id}`,
    summary: record.notes[0],
    evidenceRefs: [`cal:${record.id}`, ...(input.evidenceRefs ?? [])],
    sourceRefs: [`sim:${run.id}`],
    retentionClass: 'durable',
    root,
  });

  return record;
}

export function classesRemainSeparate(estimate: EpistemicClass, observed: EpistemicClass) {
  if (estimate === 'SIMULATION' || estimate === 'FORECAST' || estimate === 'HYPOTHESIS') {
    return observed === 'VERIFIED_FACT' || observed === 'UNKNOWN';
  }
  return estimate !== observed || estimate === 'VERIFIED_FACT';
}
