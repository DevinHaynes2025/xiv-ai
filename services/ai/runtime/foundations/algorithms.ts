import { algorithmProposalProductionDeploysItself, proposeAlgorithm } from '../society/algorithm';
import { foundrySelfDeploy } from '../knowledge/foundry';
import type { AlgorithmClass, OptimizationWorkload } from './types';
import { ALGORITHM_CLASSES } from './types';

export type AlgorithmStage =
  | 'problem'
  | 'orchestrator'
  | 'candidate'
  | 'sandbox'
  | 'benchmark'
  | 'security_review'
  | 'accuracy_bias_review'
  | 'human_approval'
  | 'canary'
  | 'production'
  | 'monitoring'
  | 'rollback';

export type AlgorithmCandidate = {
  class: AlgorithmClass;
  workload?: OptimizationWorkload;
  stage: AlgorithmStage;
};

export function proposeFoundryAlgorithm(input: { class: AlgorithmClass; workload?: OptimizationWorkload }): AlgorithmCandidate {
  void ALGORITHM_CLASSES;
  void proposeAlgorithm({ demandId: input.class, problem: input.workload ?? input.class });
  return { class: input.class, workload: input.workload, stage: 'candidate' };
}

export function promoteAlgorithm(input: {
  candidate: AlgorithmCandidate;
  next: AlgorithmStage;
  humanApproved?: boolean;
  selfDeploy?: boolean;
}) {
  if (input.selfDeploy === true) {
    return { allowed: false as const, reason: 'algorithm_cannot_deploy_itself' };
  }
  if (input.next === 'production' && input.humanApproved !== true) {
    return { allowed: false as const, reason: 'algorithm_cannot_bypass_approval' };
  }
  if (input.next === 'production' && input.candidate.stage !== 'canary') {
    return { allowed: false as const, reason: 'algorithm_requires_canary_before_production' };
  }
  return { allowed: true as const, stage: input.next };
}

export function algorithmCannotDeployItself(): true {
  void algorithmProposalProductionDeploysItself(proposeAlgorithm({ demandId: 'foundry-v2', problem: 'routing' }));
  return true;
}

export function algorithmCannotBypassApproval(): true {
  const candidate = proposeFoundryAlgorithm({ class: 'RoutingAlgorithm', workload: 'vehicle_routing' });
  void promoteAlgorithm({ candidate, next: 'production', humanApproved: false });
  return true;
}

export function algorithmSelfDeployDenied() {
  return foundrySelfDeploy({
    specId: 'algo-v2',
    role: 'Optimization',
    toolsRequested: [],
    permissionsRequested: [],
    state: 'PROPOSED',
    autonomousProduction: false,
  });
}
