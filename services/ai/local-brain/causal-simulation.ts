import { createQuantumExperiment } from './quantum-research';
import { getRuntime } from './hybrid-runtime';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { getIndustryTwin, type IndustryDigitalTwin } from './industry-digital-twins';
import { CAUSAL_WORLD_LOCKS, CORRELATION_IS_NOT_CAUSATION, type EpistemicClass } from './causal-world-types';

export type SimulationKind = 'counterfactual' | 'monte_carlo' | 'sensitivity';

export type SimulationRun = {
  id: string;
  tenantId: string;
  universeId: string;
  twinId: string;
  kind: SimulationKind;
  hypothesisIds: string[];
  epistemicClass: 'SIMULATION';
  isReality: false;
  isForecast: false;
  isVerifiedFact: false;
  classicalBaseline: Record<string, number>;
  intervention: Record<string, number>;
  results: Record<string, number>;
  samples?: number[];
  sensitivity?: Array<{ parameter: string; delta: number; outputDelta: number }>;
  quantumState: 'NOT_REQUESTED' | 'UNAVAILABLE';
  claimsQuantumAdvantage: false;
  correlationNote: typeof CORRELATION_IS_NOT_CAUSATION;
  notes: string[];
  createdAt: string;
};

type Store = { runs: SimulationRun[] };

function storePath(root: string) {
  return xivLocalPath(root, 'causal-simulations.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { runs: [] });
  return { runs: Array.isArray(parsed.runs) ? parsed.runs : [] };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), { runs: store.runs.slice(-2_000) });
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function applyIntervention(baseline: Record<string, number>, intervention: Record<string, number>) {
  const next = { ...baseline };
  for (const [key, value] of Object.entries(intervention)) {
    if (typeof next[key] === 'number') next[key] = value;
  }
  return next;
}

function primaryMetric(twin: IndustryDigitalTwin, state: Record<string, number>) {
  const name = twin.variables[0]?.name;
  return name ? state[name] ?? 0 : 0;
}

async function requireTwin(twinId: string, tenantId: string, universeId: string, root: string) {
  const twin = await getIndustryTwin(twinId, tenantId, universeId, root);
  if (!twin) throw new Error('DIGITAL_TWIN_NOT_FOUND');
  return twin;
}

function quantumHonesty(requestQuantum: boolean | undefined): Pick<SimulationRun, 'quantumState' | 'claimsQuantumAdvantage'> {
  if (!requestQuantum) {
    return { quantumState: 'NOT_REQUESTED', claimsQuantumAdvantage: false };
  }
  const experiment = createQuantumExperiment({
    id: cortexId('qsim'),
    objective: 'Bounded classical-compared research probe for a digital-twin simulation.',
    algorithm: 'qaoa',
    backend: 'quantum_qpu',
    qubitCount: 4,
    backendVerified: false,
  });
  const cloud = getRuntime('gcp');
  const quantumState =
    experiment.state === 'UNAVAILABLE' || cloud.state !== 'AVAILABLE' ? 'UNAVAILABLE' : 'UNAVAILABLE';
  return { quantumState, claimsQuantumAdvantage: false };
}

async function persist(root: string, run: SimulationRun) {
  const store = await load(root);
  store.runs.push(run);
  await save(root, store);
  return run;
}

export async function runCounterfactual(input: {
  tenantId: string;
  universeId: string;
  twinId: string;
  hypothesisIds: string[];
  intervention: Record<string, number>;
  requestQuantum?: boolean;
  root?: string;
}): Promise<SimulationRun> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const twin = await requireTwin(input.twinId, input.tenantId, input.universeId, root);
  const baseline = Object.fromEntries(twin.variables.map((variable) => [variable.name, variable.value]));
  const results = applyIntervention(baseline, input.intervention);
  const run: SimulationRun = {
    id: cortexId('csim'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    twinId: twin.id,
    kind: 'counterfactual',
    hypothesisIds: [...input.hypothesisIds],
    epistemicClass: 'SIMULATION',
    isReality: false,
    isForecast: false,
    isVerifiedFact: false,
    classicalBaseline: baseline,
    intervention: { ...input.intervention },
    results,
    ...quantumHonesty(input.requestQuantum),
    correlationNote: CORRELATION_IS_NOT_CAUSATION,
    notes: [
      'Counterfactual output is a simulation, not an observed result and not a verified fact.',
      `twinKind=${twin.kind}; isReality=false`,
    ],
    createdAt: new Date().toISOString(),
  };
  return persist(root, run);
}

export async function runMonteCarlo(input: {
  tenantId: string;
  universeId: string;
  twinId: string;
  hypothesisIds: string[];
  seed?: number;
  draws?: number;
  noise?: number;
  requestQuantum?: boolean;
  root?: string;
}): Promise<SimulationRun> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const twin = await requireTwin(input.twinId, input.tenantId, input.universeId, root);
  const baseline = Object.fromEntries(twin.variables.map((variable) => [variable.name, variable.value]));
  const draws = Math.max(8, Math.min(input.draws ?? 64, 2_048));
  const rng = mulberry32(input.seed ?? 62_108);
  const noise = input.noise ?? 0.08;
  const metricName = twin.variables[0]?.name ?? 'metric';
  const center = baseline[metricName] ?? 0;
  const samples: number[] = [];
  for (let i = 0; i < draws; i += 1) {
    const u1 = Math.max(1e-12, rng());
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    samples.push(center * (1 + noise * z));
  }
  samples.sort((a, b) => a - b);
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const p50 = samples[Math.floor(samples.length * 0.5)] ?? mean;
  const p90 = samples[Math.floor(samples.length * 0.9)] ?? mean;
  const run: SimulationRun = {
    id: cortexId('mc'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    twinId: twin.id,
    kind: 'monte_carlo',
    hypothesisIds: [...input.hypothesisIds],
    epistemicClass: 'SIMULATION',
    isReality: false,
    isForecast: false,
    isVerifiedFact: false,
    classicalBaseline: baseline,
    intervention: {},
    results: { mean, p50, p90, draws },
    samples,
    ...quantumHonesty(input.requestQuantum),
    correlationNote: CORRELATION_IS_NOT_CAUSATION,
    notes: [
      'Monte Carlo output is a classical simulation distribution, not a verified fact.',
      'Quantum-adjacent requests keep a classical baseline and do not claim advantage.',
    ],
    createdAt: new Date().toISOString(),
  };
  return persist(root, run);
}

export async function runSensitivity(input: {
  tenantId: string;
  universeId: string;
  twinId: string;
  hypothesisIds: string[];
  percent?: number;
  root?: string;
}): Promise<SimulationRun> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const twin = await requireTwin(input.twinId, input.tenantId, input.universeId, root);
  const baseline = Object.fromEntries(twin.variables.map((variable) => [variable.name, variable.value]));
  const percent = input.percent ?? 0.1;
  const baseMetric = primaryMetric(twin, baseline);
  const sensitivity = twin.variables.map((variable) => {
    const bumped = { ...baseline, [variable.name]: variable.value * (1 + percent) };
    const outputDelta = primaryMetric(twin, bumped) - baseMetric;
    return { parameter: variable.name, delta: percent, outputDelta };
  });
  const run: SimulationRun = {
    id: cortexId('sens'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    twinId: twin.id,
    kind: 'sensitivity',
    hypothesisIds: [...input.hypothesisIds],
    epistemicClass: 'SIMULATION',
    isReality: false,
    isForecast: false,
    isVerifiedFact: false,
    classicalBaseline: baseline,
    intervention: { percent },
    results: { baseMetric, parameters: sensitivity.length },
    sensitivity,
    quantumState: 'NOT_REQUESTED',
    claimsQuantumAdvantage: false,
    correlationNote: CORRELATION_IS_NOT_CAUSATION,
    notes: ['Sensitivity analysis is a simulation ranking of local parameter influence, not causation proof.'],
    createdAt: new Date().toISOString(),
  };
  return persist(root, run);
}

export async function getSimulationRun(id: string, tenantId: string, universeId: string, root?: string) {
  const store = await load(root ?? process.cwd());
  return store.runs.find((run) => run.id === id && run.tenantId === tenantId && run.universeId === universeId) ?? null;
}

export function simulationIsNotFact(run: SimulationRun): boolean {
  return (
    run.epistemicClass === 'SIMULATION' &&
    run.isVerifiedFact === false &&
    run.isReality === false &&
    CAUSAL_WORLD_LOCKS.simulationIsReality === false
  );
}

export function forecastClass(): Extract<EpistemicClass, 'FORECAST'> {
  return 'FORECAST';
}
