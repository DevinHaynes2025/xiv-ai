/**
 * Backend Intelligence Layer gateways and engines.
 * Capability expansion does not expand authority. Guardian remains mandatory.
 */

import { BACKEND_ENGINES, type BackendEngineKind } from './types';

export type TaskOrchestrator = {
  kind: 'TASK_ORCHESTRATOR';
  bypassGuardian: false;
  grantTools: false;
  l4Enabled: false;
};

export type InferenceGateway = {
  kind: 'INFERENCE_GATEWAY';
  providersLiveWithoutProof: false;
  bypassGuardian: false;
};

export type DataAccessGateway = {
  kind: 'DATA_ACCESS_GATEWAY';
  crossTenantAllowed: false;
  rawSecretsExposed: false;
};

export type ToolGateway = {
  kind: 'TOOL_GATEWAY';
  modelMayGrantTools: false;
  guardianRequired: true;
};

export type LocationGatewayHandle = {
  kind: 'LOCATION_GATEWAY';
  gpsAutoAvailableToEveryAgent: false;
  covertTracking: false;
};

export type ConnectorGateway = {
  kind: 'CONNECTOR_GATEWAY';
  productionCredentialsEnabled: false;
  state: 'NOT_CONFIGURED';
};

export type PolicyEngine = {
  kind: 'POLICY_ENGINE';
  moreCapabilityMeansMoreAuthority: false;
  l4Enabled: false;
};

export type EvidenceEngine = { kind: 'EVIDENCE_ENGINE'; requiresEvidence: true };
export type DecisionEngine = { kind: 'DECISION_ENGINE'; autonomousExecution: false; humanApprovalRequired: true };
export type OutcomeEngine = { kind: 'OUTCOME_ENGINE'; mutatesModelAutomatically: false };
export type AuditEngine = { kind: 'AUDIT_ENGINE'; bypassable: false };

export type BackendIntelligenceLayer = {
  engines: readonly BackendEngineKind[];
  taskOrchestrator: TaskOrchestrator;
  inferenceGateway: InferenceGateway;
  dataAccessGateway: DataAccessGateway;
  toolGateway: ToolGateway;
  locationGateway: LocationGatewayHandle;
  connectorGateway: ConnectorGateway;
  policyEngine: PolicyEngine;
  evidenceEngine: EvidenceEngine;
  decisionEngine: DecisionEngine;
  outcomeEngine: OutcomeEngine;
  auditEngine: AuditEngine;
  productionLive: false;
};

export function openBackendIntelligenceLayer(): BackendIntelligenceLayer {
  return {
    engines: BACKEND_ENGINES,
    taskOrchestrator: {
      kind: 'TASK_ORCHESTRATOR',
      bypassGuardian: false,
      grantTools: false,
      l4Enabled: false,
    },
    inferenceGateway: {
      kind: 'INFERENCE_GATEWAY',
      providersLiveWithoutProof: false,
      bypassGuardian: false,
    },
    dataAccessGateway: {
      kind: 'DATA_ACCESS_GATEWAY',
      crossTenantAllowed: false,
      rawSecretsExposed: false,
    },
    toolGateway: {
      kind: 'TOOL_GATEWAY',
      modelMayGrantTools: false,
      guardianRequired: true,
    },
    locationGateway: {
      kind: 'LOCATION_GATEWAY',
      gpsAutoAvailableToEveryAgent: false,
      covertTracking: false,
    },
    connectorGateway: {
      kind: 'CONNECTOR_GATEWAY',
      productionCredentialsEnabled: false,
      state: 'NOT_CONFIGURED',
    },
    policyEngine: {
      kind: 'POLICY_ENGINE',
      moreCapabilityMeansMoreAuthority: false,
      l4Enabled: false,
    },
    evidenceEngine: { kind: 'EVIDENCE_ENGINE', requiresEvidence: true },
    decisionEngine: {
      kind: 'DECISION_ENGINE',
      autonomousExecution: false,
      humanApprovalRequired: true,
    },
    outcomeEngine: { kind: 'OUTCOME_ENGINE', mutatesModelAutomatically: false },
    auditEngine: { kind: 'AUDIT_ENGINE', bypassable: false },
    productionLive: false,
  };
}

export function listBackendEngines(): readonly BackendEngineKind[] {
  return BACKEND_ENGINES;
}

export function routeInference(input: {
  guardianApproved: boolean;
  modelQuarantined?: boolean;
  enableL4?: boolean;
  grantTools?: boolean;
}) {
  if (input.modelQuarantined) {
    return { allowed: false as const, reason: 'quarantined_model_cannot_run' };
  }
  if (!input.guardianApproved) {
    return { allowed: false as const, reason: 'guardian_required' };
  }
  if (input.enableL4 === true) {
    return { allowed: false as const, reason: 'l4_remains_disabled' };
  }
  if (input.grantTools === true) {
    return { allowed: false as const, reason: 'model_cannot_grant_tools' };
  }
  return { allowed: true as const, authorityGain: false as const };
}

export function routeToolCall(input: {
  guardianApproved: boolean;
  modelGrantedTool?: boolean;
  unsafe?: boolean;
}) {
  if (input.modelGrantedTool === true) {
    return { allowed: false as const, reason: 'model_cannot_grant_tools' };
  }
  if (!input.guardianApproved) {
    return { allowed: false as const, reason: 'guardian_required' };
  }
  if (input.unsafe === true) {
    return { allowed: false as const, reason: 'unsafe_tool_call_detected' };
  }
  return { allowed: true as const };
}
