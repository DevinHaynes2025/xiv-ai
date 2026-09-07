import type { PipelineState } from './types';

export type PipelineDemand = { demandId: string; reason: string };
export type PipelineProposal = { proposalId: string; state: PipelineState; autonomousProduction: false };
export type PipelineSource = { sourceId: string; licenseKnown: boolean };
export type PipelineLicenseReview = { approved: boolean; reviewer: 'human' | 'pending' };
export type PipelineSecurityReview = { approved: boolean; reviewer: 'human' | 'pending' };
export type PipelineSchema = { mapped: boolean };
export type PipelineTransform = { sandboxed: true };
export type PipelineQualityTest = { passed: boolean; productionGate: false };
export type PipelineSandbox = { isolated: true };
export type PipelineApproval = { humanApproved: boolean };
export type PipelineDeployment = { production: boolean };
export type PipelineMonitoring = { watching: true };

export type ConnectorDemand = { demandId: string };
export type ConnectorSpecification = { specId: string; credentialsGenerated: false };
export type ConnectorAuthenticationModel = { clientExposedSecrets: false };
export type ConnectorPermissionModel = { leastPrivilege: true };
export type ConnectorSchema = { mapped: boolean };
export type ConnectorTest = { sandboxed: true };
export type ConnectorSecurityReview = { approved: boolean };
export type ConnectorApproval = { humanApproved: boolean };

export const PIPELINE_STATES: readonly PipelineState[] = [
  'PROPOSED',
  'ACCESS_REVIEW',
  'LICENSE_REVIEW',
  'SECURITY_REVIEW',
  'SANDBOXED',
  'VALIDATING',
  'HUMAN_APPROVAL',
  'APPROVED',
  'DEPLOYED',
  'DEGRADED',
  'SUSPENDED',
  'RETIRED',
];

export function proposePipeline(demand: PipelineDemand): PipelineProposal {
  return { proposalId: `pipe:${demand.demandId}`, state: 'PROPOSED', autonomousProduction: false };
}

export function pipelineAgentProductionDeploy(state: PipelineState = 'PROPOSED'): { allowed: false; reason: string } {
  void state;
  return { allowed: false, reason: 'pipeline_agent_cannot_production_deploy_pipeline' };
}

export function connectorAgentCreateProductionCredentials(): { allowed: false; reason: string } {
  return { allowed: false, reason: 'connector_agent_cannot_create_production_credentials' };
}

export function pipelineAgentMayCopyInternetDatabaseAutonomously(): false {
  return false;
}

export function qualityAutomationMaySkipHumanApproval(): false {
  return false;
}
