import { evaluateQuantSignals, type QuantSignal } from './quant-logic';
import { validateQuantProblem } from './quantum-research';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import { runScenarioSimulation } from './simulation-lab';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { getIndustryTwin } from './industry-digital-twins';
import { CAUSAL_WORLD_LOCKS } from './causal-world-types';

export type OptimizationWorkcell = {
  id: string;
  tenantId: string;
  universeId: string;
  twinId: string;
  objective: string;
  epistemicClass: 'SIMULATION';
  isReality: false;
  tradingAuthorized: false;
  productionAuthorization: false;
  classical: ReturnType<typeof evaluateQuantSignals>;
  gate: ReturnType<typeof decisionGate>;
  status: 'COMPLETED' | 'HUMAN_APPROVAL_REQUIRED' | 'UNAVAILABLE';
  claimsQuantumAdvantage: false;
  createdAt: string;
};

type Store = { cells: OptimizationWorkcell[] };

function storePath(root: string) {
  return xivLocalPath(root, 'optimization-workcells.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { cells: [] });
  return { cells: Array.isArray(parsed.cells) ? parsed.cells : [] };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), { cells: store.cells.slice(-2_000) });
}

export async function runOptimizationWorkcell(input: {
  tenantId: string;
  universeId: string;
  twinId: string;
  objective: string;
  signals?: QuantSignal[];
  consequence?: ConsequenceClass;
  production?: boolean;
  root?: string;
}): Promise<OptimizationWorkcell> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.objective.trim()) throw new Error('OPTIMIZATION_OBJECTIVE_REQUIRED');
  const root = input.root ?? process.cwd();
  const twin = await getIndustryTwin(input.twinId, input.tenantId, input.universeId, root);
  if (!twin) throw new Error('DIGITAL_TWIN_NOT_FOUND');

  validateQuantProblem({
    id: cortexId('qopt'),
    variables: Math.max(1, twin.variables.length),
    objective: 'minimize_cost',
    constraints: ['classical baseline required', 'no production actuation'],
    provenanceRefs: [`twin:${twin.id}`],
  });

  const signals =
    input.signals ??
    twin.variables.map((variable, index) => ({
      id: `${twin.id}:${variable.name}`,
      weight: 1,
      confidence: 0.4,
      direction: (variable.value >= 0 ? 1 : -1) as -1 | 0 | 1,
      evidenceRefs: [`twin:${twin.id}:${index}`],
    }));
  const classical = evaluateQuantSignals(signals);
  const gate = decisionGate({
    id: cortexId('opt-gate'),
    action: `Optimize twin ${twin.kind}: ${input.objective}`,
    consequence: input.consequence ?? 'LOW',
    production: input.production === true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  await runScenarioSimulation({
    tenantId: input.tenantId,
    universeId: input.universeId,
    hypothesis: `Optimization workcell (simulation): ${input.objective}`,
    consequence: input.consequence ?? 'LOW',
    production: input.production === true,
    root,
  });

  const cell: OptimizationWorkcell = {
    id: cortexId('optcell'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    twinId: twin.id,
    objective: input.objective.trim(),
    epistemicClass: 'SIMULATION',
    isReality: false,
    tradingAuthorized: false,
    productionAuthorization: false,
    classical,
    gate,
    status: !gate.executableByAgent ? 'HUMAN_APPROVAL_REQUIRED' : 'COMPLETED',
    claimsQuantumAdvantage: false,
    createdAt: new Date().toISOString(),
  };
  const store = await load(root);
  store.cells.push(cell);
  await save(root, store);
  return cell;
}

export function optimizationHonesty(cell: OptimizationWorkcell) {
  return {
    epistemicClass: cell.epistemicClass,
    tradingAuthorized: cell.tradingAuthorized,
    claimsQuantumAdvantage: cell.claimsQuantumAdvantage,
    locks: CAUSAL_WORLD_LOCKS,
  };
}
