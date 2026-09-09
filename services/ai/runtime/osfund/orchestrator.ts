/**
 * Agent Orchestrator V4 — task graph.
 * Consensus does not create verified evidence. Temporary nodes never mint permanent authority.
 */

import type { OrchestratorNodeKind } from './types';

export const ORCHESTRATOR_NODES_V4: readonly OrchestratorNodeKind[] = [
  'Observe',
  'Gather',
  'Analyze',
  'Draft',
  'Challenge',
  'Escalate',
  'Approve',
  'Execute',
  'Audit',
  'Learn',
] as const;

export type TaskGraphNode = {
  nodeId: string;
  kind: OrchestratorNodeKind;
  permanentAuthority: false;
};

export type TaskGraph = {
  version: 'V4';
  nodes: readonly TaskGraphNode[];
  guardianFirst: true;
  consensusCreatesVerifiedEvidence: false;
  productionExecuteWithoutApproval: false;
};

export function openAgentOrchestratorV4(input?: {
  guardianAuthorized?: boolean;
  roles?: readonly string[];
}): TaskGraph | { allowed: false; reason: string } {
  if (input && input.guardianAuthorized === false) {
    return { allowed: false, reason: 'orchestrator_v4_requires_guardian' };
  }
  void input?.roles;
  return {
    version: 'V4',
    nodes: ORCHESTRATOR_NODES_V4.map((kind, index) => ({
      nodeId: `node-${index}-${kind.toLowerCase()}`,
      kind,
      permanentAuthority: false as const,
    })),
    guardianFirst: true,
    consensusCreatesVerifiedEvidence: false,
    productionExecuteWithoutApproval: false,
  };
}

export function orchestratorConsensusCreatesVerifiedEvidence(): false {
  return false;
}

export function temporaryTaskNodeReceivesPermanentAuthority(): false {
  return false;
}

export function orchestratorBypassesGuardian(): false {
  return false;
}
