import { createQuantumExperiment, validateQuantProblem, type QuantOptimizationProblem } from './quantum-research';
import { runClassicalQuantQuantumBridge } from './simulation-lab';
import type { QuantSignal } from './quant-logic';
import { getRuntime } from './hybrid-runtime';
import { appendLearning } from './learning-ledger';

export type QuantumLabRun = {
  experiment: ReturnType<typeof createQuantumExperiment>;
  classicalBaselineRequired: true;
  claimsQuantumAdvantage: false;
  qpuExecutionAuthorized: false;
  productionMagic: false;
  productionAuthorization: false;
  lab: 'bounded_research';
};

export function runBoundedQuantumLab(input: Parameters<typeof createQuantumExperiment>[0] & {
  problem?: QuantOptimizationProblem;
}): QuantumLabRun {
  if (input.problem) validateQuantProblem(input.problem);
  const experiment = createQuantumExperiment(input);
  const qpu = getRuntime('gcp');
  const qpuExecutionAuthorized = false as const;
  if (experiment.backend === 'quantum_qpu' && (!input.backendVerified || qpu.state !== 'AVAILABLE')) {
    experiment.state = 'UNAVAILABLE';
  }
  return {
    experiment,
    classicalBaselineRequired: true,
    claimsQuantumAdvantage: false,
    qpuExecutionAuthorized,
    productionMagic: false,
    productionAuthorization: false,
    lab: 'bounded_research',
  };
}

export async function runQuantumLabWithClassicalBridge(input: {
  tenantId: string;
  universeId: string;
  signals: QuantSignal[];
  quantum: Parameters<typeof createQuantumExperiment>[0];
  problem?: QuantOptimizationProblem;
  root?: string;
}) {
  const lab = runBoundedQuantumLab({ ...input.quantum, problem: input.problem });
  const bridge = await runClassicalQuantQuantumBridge({
    tenantId: input.tenantId,
    universeId: input.universeId,
    signals: input.signals,
    quantum: input.quantum,
    problem: input.problem,
    root: input.root,
  });
  await appendLearning({
    domain: 'science',
    subject: `quantum-lab:${lab.experiment.id}`,
    claimState: 'MODEL_INFERENCE',
    summary: `lab=${lab.lab}; quantumState=${bridge.quantumState}; advantage=false; magic=false`,
    sourceRefs: input.signals.flatMap((signal) => signal.evidenceRefs),
    evidence: [`experiment:${lab.experiment.id}`],
  }, input.root);
  return {
    lab,
    bridge,
    claimsQuantumAdvantage: false as const,
    productionMagic: false as const,
    productionAuthorization: false as const,
  };
}
