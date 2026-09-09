import { decisionGate, type ConsequenceClass, type DecisionRequest } from './decision-gate';
import { BJ_LOCKS } from './global-operations-brain-types';

/**
 * Executive Decision Cortex — bounded options → human authority.
 * Digital Twin ≠ founder; recommendation ≠ charge/deploy.
 */

export type ExecutiveOption = {
  id: string;
  label: string;
  summary: string;
  consequence: ConsequenceClass;
  estimatedImpact?: string;
  forecastOnly?: boolean;
};

export type ExecutiveDeliberationInput = {
  tenantId: string;
  universeId: string;
  decisionId: string;
  objective: string;
  options: ExecutiveOption[];
  actorKind: 'human_founder' | 'human_executive' | 'digital_twin' | 'specialized_agent';
  production?: boolean;
  financialCommitment?: boolean;
  legalCommitment?: boolean;
  permissionChange?: boolean;
  externalPublication?: boolean;
  twinClaimsFounderAuthority?: boolean;
};

export type ExecutiveDeliberationResult = {
  accepted: boolean;
  humanAuthorityRequired: true;
  executableByAgent: false;
  productionAuthorization: false;
  twinIsFounder: false;
  recommendationIsDeploy: false;
  forecastIsFact: false;
  selectedOptionId: string | null;
  rankedOptions: Array<ExecutiveOption & { rank: number; gateReason: string }>;
  recommendation: string;
  reason: string;
  locks: typeof BJ_LOCKS;
};

export function deliberateExecutiveDecision(input: ExecutiveDeliberationInput): ExecutiveDeliberationResult {
  if (!input.tenantId || !input.universeId) {
    return {
      accepted: false,
      humanAuthorityRequired: true,
      executableByAgent: false,
      productionAuthorization: false,
      twinIsFounder: false,
      recommendationIsDeploy: false,
      forecastIsFact: false,
      selectedOptionId: null,
      rankedOptions: [],
      recommendation: 'Tenant and Universe are required before deliberation.',
      reason: 'TENANT_AND_UNIVERSE_REQUIRED',
      locks: BJ_LOCKS,
    };
  }

  if (input.twinClaimsFounderAuthority || input.actorKind === 'digital_twin') {
    // Twin may rank options only; never assert founder authority.
  }

  if (!input.options.length) {
    return {
      accepted: false,
      humanAuthorityRequired: true,
      executableByAgent: false,
      productionAuthorization: false,
      twinIsFounder: false,
      recommendationIsDeploy: false,
      forecastIsFact: false,
      selectedOptionId: null,
      rankedOptions: [],
      recommendation: 'No options supplied; human must frame the decision.',
      reason: 'NO_OPTIONS',
      locks: BJ_LOCKS,
    };
  }

  const severity: Record<ConsequenceClass, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  };

  const ranked = [...input.options]
    .sort((a, b) => severity[a.consequence] - severity[b.consequence])
    .map((opt, index) => {
      const request: DecisionRequest = {
        id: `${input.decisionId}:${opt.id}`,
        action: opt.label,
        consequence: opt.consequence,
        production: Boolean(input.production) || opt.consequence === 'CRITICAL',
        financialCommitment: Boolean(input.financialCommitment),
        legalCommitment: Boolean(input.legalCommitment),
        permissionChange: Boolean(input.permissionChange),
        externalPublication: Boolean(input.externalPublication),
      };
      const gate = decisionGate(request);
      return {
        ...opt,
        rank: index + 1,
        gateReason: gate.reason,
        forecastOnly: opt.forecastOnly ?? opt.consequence !== 'LOW',
      };
    });

  const preferred = ranked[0];
  const twinBlocked = Boolean(input.twinClaimsFounderAuthority);

  return {
    accepted: !twinBlocked,
    humanAuthorityRequired: true,
    executableByAgent: false,
    productionAuthorization: false,
    twinIsFounder: false,
    recommendationIsDeploy: false,
    forecastIsFact: false,
    selectedOptionId: null, // human selects; cortex only ranks
    rankedOptions: ranked,
    recommendation: twinBlocked
      ? 'DENIED: Digital Twin cannot claim founder authority. Ranking retained as recommendation-only.'
      : `Recommend option "${preferred.label}" for human review only. Forecast ≠ fact; recommendation ≠ deploy/charge.`,
    reason: twinBlocked ? 'DIGITAL_TWIN_IS_NOT_FOUNDER' : 'BOUNDED_OPTIONS_AWAIT_HUMAN_AUTHORITY',
    locks: BJ_LOCKS,
  };
}

export function executiveCortexHonesty() {
  return {
    L4_AUTONOMY_ENABLED: BJ_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: false as const,
    digitalTwinIsFounder: BJ_LOCKS.DIGITAL_TWIN_IS_FOUNDER,
    recommendationIsChargeOrDeploy: BJ_LOCKS.RECOMMENDATION_IS_CHARGE_OR_DEPLOY,
    forecastIsFact: BJ_LOCKS.FORECAST_IS_FACT,
  };
}
