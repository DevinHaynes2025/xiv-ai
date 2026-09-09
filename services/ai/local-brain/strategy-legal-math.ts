import { evaluateQuantSignals, type QuantSignal } from './quant-logic';
import { createQuantumExperiment, validateQuantProblem } from './quantum-research';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import type { EnsEvidenceState } from './enterprise-nervous-types';

export const CSI_COMPETITIVE_FIELDS = [
  'price',
  'bid',
  'customer_list',
  'market_allocation',
  'cover_bid',
  'margin',
] as const;

export const COLLUSION_PATTERNS = ['coordinated_pricing', 'bid_rigging', 'market_allocation', 'csi_exchange'] as const;

export type LegalConstraint =
  | 'antitrust'
  | 'privacy'
  | 'export_control'
  | 'retention'
  | 'classification'
  | 'human_gate';

export function lawfulCompetitiveStrategy(input: {
  tenantId: string;
  universeId: string;
  objective: string;
  fields?: string[];
  collusionPattern?: (typeof COLLUSION_PATTERNS)[number];
  competitorIds?: string[];
}): { allowed: boolean; state: EnsEvidenceState; reason: string; recommendationOnly: true } {
  void input.universeId;
  if (!input.tenantId) return { allowed: false, state: 'FAIL', reason: 'TENANT_REQUIRED', recommendationOnly: true };
  if (input.collusionPattern) {
    return {
      allowed: false,
      state: 'FAIL',
      reason: `COLLUSION_PATTERN_DENIED:${input.collusionPattern}`,
      recommendationOnly: true,
    };
  }
  const csi = (input.fields ?? []).filter((field) =>
    (CSI_COMPETITIVE_FIELDS as readonly string[]).includes(field.toLowerCase()),
  );
  if (csi.length) {
    return {
      allowed: false,
      state: 'FAIL',
      reason: `CSI_FIELD_DENIED:${csi.join(',')}`,
      recommendationOnly: true,
    };
  }
  if ((input.competitorIds ?? []).length > 1 && /price|bid|allocate/i.test(input.objective)) {
    return {
      allowed: false,
      state: 'FAIL',
      reason: 'MULTI_COMPETITOR_PRICING_STRATEGY_DENIED',
      recommendationOnly: true,
    };
  }
  return {
    allowed: true,
    state: 'PASS',
    reason: 'LAWFUL_RECOMMENDATION_ONLY',
    recommendationOnly: true,
  };
}

export function applyLegalPolicyConstraints(input: {
  action: string;
  constraints: LegalConstraint[];
  consequence?: ConsequenceClass;
  production?: boolean;
  legalCommitment?: boolean;
}): { allowed: boolean; state: EnsEvidenceState; humanApprovalRequired: boolean; reason: string } {
  const gate = decisionGate({
    id: 'ens-legal',
    action: input.action,
    consequence: input.consequence ?? 'HIGH',
    production: input.production === true,
    financialCommitment: false,
    legalCommitment: input.legalCommitment !== false,
    permissionChange: false,
    externalPublication: false,
  });
  if (input.constraints.includes('antitrust') && /collud|rig bid|allocate market/i.test(input.action)) {
    return { allowed: false, state: 'FAIL', humanApprovalRequired: true, reason: 'ANTITRUST_CONSTRAINT' };
  }
  if (input.constraints.includes('privacy') && /export pii|raw pool/i.test(input.action)) {
    return { allowed: false, state: 'FAIL', humanApprovalRequired: true, reason: 'PRIVACY_CONSTRAINT' };
  }
  return {
    allowed: gate.executableByAgent,
    state: gate.executableByAgent ? 'PASS' : 'FAIL',
    humanApprovalRequired: gate.humanApprovalRequired,
    reason: gate.reason,
  };
}

export function advancedMathematicsStatistics(input: {
  samples: number[];
  provenanceRefs: string[];
}): {
  state: EnsEvidenceState;
  n: number;
  mean?: number;
  variance?: number;
  zScores?: number[];
  classical: true;
  inventedSignificance: false;
  reason: string;
} {
  if (!input.provenanceRefs.length) {
    return { state: 'FAIL', n: 0, classical: true, inventedSignificance: false, reason: 'PROVENANCE_REQUIRED' };
  }
  if (!input.samples.length) {
    return { state: 'WAITING_DATA', n: 0, classical: true, inventedSignificance: false, reason: 'NO_SAMPLES' };
  }
  const n = input.samples.length;
  const mean = input.samples.reduce((sum, value) => sum + value, 0) / n;
  const variance = input.samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const zScores = std === 0 ? input.samples.map(() => 0) : input.samples.map((value) => (value - mean) / std);
  return {
    state: 'PASS',
    n,
    mean,
    variance,
    zScores,
    classical: true,
    inventedSignificance: false,
    reason: 'CLASSICAL_DESCRIPTIVE_STATS_ONLY',
  };
}

export function quantResearchSupport(signals: QuantSignal[]) {
  const decision = evaluateQuantSignals(signals);
  return {
    ...decision,
    tradingAuthorized: false as const,
    productionAuthorization: false as const,
  };
}

export function quantumResearchComparison(input: {
  objective: string;
  qubitCount: number;
  classicalSignals: QuantSignal[];
  backendVerified?: boolean;
}) {
  const classical = evaluateQuantSignals(input.classicalSignals);
  const experiment = createQuantumExperiment({
    id: `ens-q-${input.objective.slice(0, 24)}`,
    objective: input.objective,
    algorithm: 'qaoa',
    backend: 'quantum_simulator',
    qubitCount: input.qubitCount,
    backendVerified: input.backendVerified === true,
  });
  const provenanceRefs = input.classicalSignals.flatMap((signal) => signal.evidenceRefs);
  const problem =
    provenanceRefs.length === 0
      ? { valid: false as const, classicalBaselineRequired: true as const, quantumExecutionAuthorized: false as const }
      : validateQuantProblem({
          id: 'ens-quant-problem',
          variables: Math.max(1, input.classicalSignals.length),
          objective: 'balance_risk_return',
          constraints: ['classical_baseline_required'],
          provenanceRefs,
        });
  return {
    classical,
    experiment,
    problem,
    claimsQuantumAdvantage: false as const,
    classicalBaselineRequired: true as const,
    quantumExecutionAuthorized: false as const,
    state: experiment.state === 'UNAVAILABLE' ? ('UNAVAILABLE' as const) : ('PASS' as const),
  };
}
