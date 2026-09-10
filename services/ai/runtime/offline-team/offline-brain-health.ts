export type BrainComponent = 'COMPANY_BRAIN' | 'AVATAR_BRAIN' | 'OLLAMA' | 'AGENT_QUEUE' | 'STORAGE' | 'NEURAL_PATHWAYS' | 'EVIDENCE_CELLS' | 'CPU' | 'GPU' | 'OFFLINE_CACHE' | 'CONSENT' | 'SECURITY';
export type HealthState = 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED';

export interface BrainHealthSignal {
  component: BrainComponent;
  state: HealthState;
  checkedAt: string;
  evidenceRefs: string[];
  detail?: string;
}

export interface BrainHealthReceipt {
  receiptVersion: '12D-56';
  checkedAt: string;
  overall: HealthState;
  signals: BrainHealthSignal[];
  verifiedCount: number;
  unverifiedCount: number;
  productionMutationAllowed: false;
}

const rank: Record<HealthState, number> = { HEALTHY: 0, DEGRADED: 1, OFFLINE: 2, UNVERIFIED: 3 };

export function buildBrainHealthReceipt(signals: BrainHealthSignal[]): BrainHealthReceipt {
  if (!signals.length) throw new Error('health signals required');
  const overall = signals.reduce<HealthState>((worst, s) => rank[s.state] > rank[worst] ? s.state : worst, 'HEALTHY');
  return {
    receiptVersion: '12D-56',
    checkedAt: new Date().toISOString(),
    overall,
    signals,
    verifiedCount: signals.filter(s => s.evidenceRefs.length > 0 && s.state !== 'UNVERIFIED').length,
    unverifiedCount: signals.filter(s => !s.evidenceRefs.length || s.state === 'UNVERIFIED').length,
    productionMutationAllowed: false,
  };
}

export const OFFLINE_BRAIN_HEALTH_GUARDRAILS = {
  healthRequiresEvidence: true,
  detectedIsNotVerified: true,
  staleReceiptsMustBeLabeled: true,
  productionMutationAllowed: false,
};
