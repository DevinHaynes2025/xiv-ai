import { evaluateDataAccess } from '../premium/data';
import { defaultDenyUnknownHandoff } from '../security/firewall';
import type { OperationsAgentRole } from './command-types';
import { OPERATIONS_AGENT_ROLES } from './command-types';

export type AgentOrchestrator = { guardianFirst: true; consensusCreatesVerifiedEvidence: false };
export type AgentSelectionPolicy = { guardianFirst: true; defaultDeny: true };
export type AgentCapabilityMatch = { role: OperationsAgentRole; matched: boolean };
export type AgentContextPackage = { tenantId: string; universeId: string; scoped: true };
export type AgentWorkItem = { workItemId: string; role: OperationsAgentRole };
export type AgentPosition = { role: OperationsAgentRole; stance: string; verifiedFact: false };
export type AgentChallenge = { from: OperationsAgentRole; to: OperationsAgentRole };
export type AgentEvidence = { source: string; retrievedAt: string; reference: string };
export type AgentConsensus = { createsVerifiedEvidence: false };
export type AgentDisagreement = { retained: true };
export type AgentEscalation = { humanRequired: true };
export type AgentOutcomeEvaluation = { lessonMayRewritePolicy: false };

export function orchestrateProblem(input: {
  guardianAuthorized: boolean;
  roles: readonly OperationsAgentRole[];
  evidence?: AgentEvidence;
}) {
  void OPERATIONS_AGENT_ROLES;
  if (input.guardianAuthorized !== true) {
    void defaultDenyUnknownHandoff();
    return { allowed: false as const, reason: 'orchestrator_requires_guardian' };
  }
  const positions: AgentPosition[] = input.roles.map((role) => ({
    role,
    stance: 'UNKNOWN',
    verifiedFact: false,
  }));
  return {
    allowed: true as const,
    positions,
    disagreement: { retained: true as const },
    consensus: { createsVerifiedEvidence: false as const },
    verifiedByAgreement: false as const,
  };
}

export function aiConsensusCreatesVerifiedEvidence(): false {
  return false;
}

export function operationsAgentObtainsDbCredential(role: OperationsAgentRole) {
  void role;
  return evaluateDataAccess({
    agent: 'Database Security',
    tenantId: 'tenant-a',
    requestedTenantId: 'tenant-a',
    classification: 'TENANT_PRIVATE',
    destination: 'same_tenant',
    viaGateway: true,
    rawSecretRequested: true,
    destructiveMigration: false,
  });
}
