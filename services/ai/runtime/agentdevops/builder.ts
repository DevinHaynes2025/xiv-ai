/**
 * Continuous Builder pipeline — sandbox → tests → debate → RC → canary.
 * Production gate requires human/policy approval. L4 disabled.
 * Creative capability ≠ production privilege.
 */

export type ContinuousBuilderStage =
  | 'IDEA'
  | 'PLAN'
  | 'SANDBOX_BUILD'
  | 'UNIT_TEST'
  | 'INTEGRATION_TEST'
  | 'SECURITY_SCAN'
  | 'MULTI_AGENT_DEBATE'
  | 'RELEASE_CANDIDATE'
  | 'HUMAN_POLICY_GATE'
  | 'CANARY'
  | 'PRODUCTION'
  | 'MONITOR'
  | 'ROLLBACK';

export const CONTINUOUS_BUILDER_STAGES = [
  'IDEA',
  'PLAN',
  'SANDBOX_BUILD',
  'UNIT_TEST',
  'INTEGRATION_TEST',
  'SECURITY_SCAN',
  'MULTI_AGENT_DEBATE',
  'RELEASE_CANDIDATE',
  'HUMAN_POLICY_GATE',
  'CANARY',
  'PRODUCTION',
  'MONITOR',
  'ROLLBACK',
] as const satisfies readonly ContinuousBuilderStage[];

export type ContinuousBuilderRun = {
  runId: string;
  stage: ContinuousBuilderStage;
  sandbox: boolean;
  humanPolicyGatePassed: boolean;
  productionDeployed: boolean;
  l4Enabled: false;
};

export type ContinuousBuilder = {
  stages: readonly ContinuousBuilderStage[];
  prodGateRequiresHumanPolicy: true;
  silentProdDeployAllowed: false;
  l4Enabled: false;
  productionLive: false;
  creativeCapabilityEqualsPrivilege: false;
};

export type ContinuousBuilderProdGate = {
  allowed: boolean;
  reason: string;
  requiresHumanPolicyGate: boolean;
  l4Enabled: false;
};

export function listContinuousBuilderStages(): readonly ContinuousBuilderStage[] {
  return CONTINUOUS_BUILDER_STAGES;
}

export function openContinuousBuilder(): ContinuousBuilder {
  return {
    stages: CONTINUOUS_BUILDER_STAGES,
    prodGateRequiresHumanPolicy: true,
    silentProdDeployAllowed: false,
    l4Enabled: false,
    productionLive: false,
    creativeCapabilityEqualsPrivilege: false,
  };
}

export function openContinuousBuilderRun(input: { runId: string }): ContinuousBuilderRun {
  return {
    runId: input.runId,
    stage: 'IDEA',
    sandbox: true,
    humanPolicyGatePassed: false,
    productionDeployed: false,
    l4Enabled: false,
  };
}

export function advanceContinuousBuilderStage(
  run: ContinuousBuilderRun,
): ContinuousBuilderRun | { allowed: false; reason: string } {
  const idx = CONTINUOUS_BUILDER_STAGES.indexOf(run.stage);
  if (idx < 0 || idx >= CONTINUOUS_BUILDER_STAGES.length - 1) {
    return { allowed: false, reason: 'builder_stage_terminal_or_unknown' };
  }
  const next = CONTINUOUS_BUILDER_STAGES[idx + 1]!;
  if ((next === 'CANARY' || next === 'PRODUCTION') && !run.humanPolicyGatePassed) {
    return { allowed: false, reason: 'human_policy_gate_required_before_prod_path' };
  }
  return {
    ...run,
    stage: next,
    sandbox: next !== 'CANARY' && next !== 'PRODUCTION' && next !== 'MONITOR',
  };
}

export function passContinuousBuilderHumanGate(run: ContinuousBuilderRun): ContinuousBuilderRun {
  if (run.stage !== 'HUMAN_POLICY_GATE' && run.stage !== 'RELEASE_CANDIDATE') {
    return run;
  }
  return { ...run, humanPolicyGatePassed: true, stage: 'HUMAN_POLICY_GATE' };
}

export function evaluateContinuousBuilderProdGate(
  run: ContinuousBuilderRun,
): ContinuousBuilderProdGate {
  if (!run.humanPolicyGatePassed) {
    return {
      allowed: false,
      reason: 'independent_human_or_policy_gate_required',
      requiresHumanPolicyGate: true,
      l4Enabled: false,
    };
  }
  if (run.stage !== 'HUMAN_POLICY_GATE' && run.stage !== 'CANARY' && run.stage !== 'PRODUCTION') {
    return {
      allowed: false,
      reason: 'not_at_deployable_stage',
      requiresHumanPolicyGate: true,
      l4Enabled: false,
    };
  }
  return {
    allowed: true,
    reason: 'human_policy_gate_passed',
    requiresHumanPolicyGate: false,
    l4Enabled: false,
  };
}

export function continuousBuilderMaySilentProdDeploy(): false {
  return false;
}

export function continuousBuilderL4Enabled(): false {
  return false;
}
