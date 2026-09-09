import { foundrySelfDeploy } from '../knowledge/foundry';
import { pipelineAgentProductionDeploy } from '../planetary/foundry';
import { learningMayRewriteSecurityOrProductionPolicy } from '../knowledge/loop';

export type NightShiftAgent = { role: string; autonomousProduction: false };
export type NightShiftEvidence = { source: string; retrievedAt: string; reference: string };
export type NightShiftFinding = { text: string; confirmedIncident: boolean };
export type NightShiftProposal = { text: string; deployed: false };
export type FounderMorningBrief = {
  security: string;
  platform: string;
  intelligence: string;
  recommendations: readonly string[];
};

export type NightShiftJob = {
  jobId: string;
  mayDeployAgents: false;
  mayDeployPipelines: false;
  mayChangeSecurityPolicy: false;
  mayRecommend: true;
};

export function startNightShift(): NightShiftJob {
  return {
    jobId: 'night-shift',
    mayDeployAgents: false,
    mayDeployPipelines: false,
    mayChangeSecurityPolicy: false,
    mayRecommend: true,
  };
}

export function nightShiftDeploysProductionAgents(): boolean {
  return foundrySelfDeploy({
    specId: 'night-agent',
    role: 'Night Shift',
    toolsRequested: [],
    permissionsRequested: [],
    state: 'PROPOSED',
    autonomousProduction: false,
  }).allowed;
}

export function nightShiftDeploysProductionPipelines(): boolean {
  return pipelineAgentProductionDeploy('VALIDATING').allowed;
}

export function nightShiftChangesSecurityPolicy(): boolean {
  return learningMayRewriteSecurityOrProductionPolicy();
}

export function nightShiftMayProduceRecommendations(job: NightShiftJob): boolean {
  return job.mayRecommend === true;
}

export function composeFounderMorningBrief(): FounderMorningBrief {
  return {
    security: 'Anomalies reviewed. Confirmed incidents require human verification.',
    platform: 'Health checks are on-demand, not continuous monitoring.',
    intelligence: 'New evidence stays unverified until promotion.',
    recommendations: ['Review Night Shift proposals. No autonomous production deploy.'],
  };
}
