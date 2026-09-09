export type OptimizationProviderKind = 'cpu' | 'gpu' | 'nvidia' | 'distributed' | 'specialized' | 'future_quantum';

export type OptimizationProvider = {
  kind: OptimizationProviderKind;
  status: 'available_interface' | 'unavailable' | 'not_active';
  quantumProcessingActive: false;
};

export type PostQuantumReadinessState = {
  planningOnly: true;
  cryptoAgility: 'planned';
  migrated: false;
};

export function createOptimizationProvider(kind: OptimizationProviderKind): OptimizationProvider {
  if (kind === 'future_quantum') {
    return { kind, status: 'not_active', quantumProcessingActive: false };
  }
  return { kind, status: 'available_interface', quantumProcessingActive: false };
}

export function quantumProcessingActive() {
  return false;
}

export function postQuantumReadiness(): PostQuantumReadinessState {
  return { planningOnly: true, cryptoAgility: 'planned', migrated: false };
}
