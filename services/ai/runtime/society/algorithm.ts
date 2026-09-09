import { learningMayRewriteSecurityOrProductionPolicy } from '../knowledge/loop';
import { foundrySelfDeploy } from '../knowledge/foundry';
import { guardianIsNotCodeWriter } from '../diagnostics';

export type AlgorithmDemand = { demandId: string; problem: string };
export type AlgorithmProposal = { proposalId: string; autonomousProduction: false };
export type AlgorithmExperiment = { experimentId: string; sandboxed: true };
export type AlgorithmDataset = { datasetId: string; licensed: boolean };
export type AlgorithmBenchmark = { name: string; claimedScale: false };
export type AlgorithmAccuracyEvaluation = { score: number | null; certainty: false };
export type AlgorithmBiasEvaluation = { measured: true; zeroBiasClaimed: false };
export type AlgorithmSecurityEvaluation = { guardianUnchanged: true };
export type AlgorithmCostEvaluation = { estimated: true };
export type AlgorithmVersion = { version: string; production: false };
export type AlgorithmApproval = { humanApproved: boolean };
export type AlgorithmCanary = { enabled: boolean; productionRewrite: false };
export type AlgorithmDeployment = { production: boolean };
export type AlgorithmRollback = { available: true };

export function proposeAlgorithm(demand: AlgorithmDemand): AlgorithmProposal {
  return { proposalId: `algo:${demand.demandId}`, autonomousProduction: false };
}

export function algorithmProposalProductionDeploysItself(proposal: AlgorithmProposal): boolean {
  void proposal;
  return foundrySelfDeploy({
    specId: 'algo',
    role: 'Algorithm Research',
    toolsRequested: [],
    permissionsRequested: [],
    state: 'PROPOSED',
    autonomousProduction: false,
  }).allowed;
}

export function algorithmModifiesGuardian(): boolean {
  void guardianIsNotCodeWriter();
  return learningMayRewriteSecurityOrProductionPolicy();
}

export function algorithmModifiesTenantIsolation(): boolean {
  return learningMayRewriteSecurityOrProductionPolicy();
}

export function biasEvaluationClaimsZeroBias(_evaluation: AlgorithmBiasEvaluation): false {
  return false;
}

export function measuredBiasEvaluation(): AlgorithmBiasEvaluation {
  return { measured: true, zeroBiasClaimed: false };
}

export function improvementMayChangeGuardian(): false {
  return false;
}

export function improvementMayChangeTenantPolicy(): false {
  return false;
}

export function improvementMayChangeOwnPermissions(): false {
  return false;
}

export function improvementMayDisableSecurity(): false {
  return false;
}

export function improvementMayProductionDeploy(): false {
  return false;
}

export function improvementMayRemoveHumanApproval(): false {
  return false;
}
