import { runBoundedQuantumLab, runQuantumLabWithClassicalBridge } from './quantum-research-lab';
import { assertPhysicsNotInfrastructure, FUNDAMENTAL_PHYSICS_DOMAINS, PHYSICS_HONESTY } from './physics-domains';
import type { QuantSignal } from './quant-logic';

export function runExecutiveQuantumResearch(input: Parameters<typeof runBoundedQuantumLab>[0]) {
  const lab = runBoundedQuantumLab(input);
  return {
    ...lab,
    simulatorIsNotQpu: lab.experiment.backend !== 'quantum_qpu',
    claimsQuantumAdvantage: false as const,
    productionAuthorization: false as const,
  };
}

export async function runClassicalThenQuantum(input: {
  tenantId: string;
  universeId: string;
  signals: QuantSignal[];
  quantum: Parameters<typeof runQuantumLabWithClassicalBridge>[0]['quantum'];
  root?: string;
}) {
  return runQuantumLabWithClassicalBridge(input);
}

export function inspectPhysicsResearchDomain(id: string) {
  const domain = FUNDAMENTAL_PHYSICS_DOMAINS.find((item) => item.id === id) ?? null;
  const honesty = assertPhysicsNotInfrastructure(id);
  return {
    domain,
    honesty,
    ...PHYSICS_HONESTY,
    researchOnly: true as const,
    productionAuthorization: false as const,
  };
}
