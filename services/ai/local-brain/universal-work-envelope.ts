import {
  CODING_MESH_ENVIRONMENTS,
  ENV_UNAVAILABLE_UNTIL_CAV,
  BK_LOCKS,
  type CodingMeshEnvironmentId,
  type EnvironmentAvailability,
  type EnvironmentProbe,
} from './superbrain-coexistence-types';

export type EnvironmentConfigInput = {
  id: CodingMeshEnvironmentId;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
};

export type UniversalWorkEnvelope = {
  id: string;
  tenantId: string;
  universeId: string;
  goalId: string;
  objective: string;
  founderApproved: boolean;
  requestedEnvironments: CodingMeshEnvironmentId[];
  requestedFiles: string[];
  requestedAgentIds: string[];
  productionAuthorized: false;
  permissionExpansionAuthorized: false;
  liveSupabaseApply: false;
  dbCandidateApplied: false;
  classification: 'public' | 'internal' | 'confidential' | 'restricted' | 'founder_sealed';
  consequence: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
};

export type WorkEnvelopeValidation =
  | {
      accepted: true;
      state: 'AVAILABLE';
      reason: string;
      envelope: UniversalWorkEnvelope;
    }
  | {
      accepted: false;
      state: 'DENIED' | 'UNAVAILABLE' | 'WAITING_DATA';
      reason: string;
      envelope: UniversalWorkEnvelope;
    };

function requireFalseFlags(envelope: UniversalWorkEnvelope): string | null {
  if (envelope.productionAuthorized !== false) return 'productionAuthorized must be false';
  if (envelope.permissionExpansionAuthorized !== false) {
    return 'permissionExpansionAuthorized must be false';
  }
  if (envelope.liveSupabaseApply !== false) return 'liveSupabaseApply must be false';
  if (envelope.dbCandidateApplied !== false) return 'dbCandidateApplied must be false (NOT_APPLIED)';
  return null;
}

/**
 * Universal Work Envelope: governs branching of work into environments only when
 * configured / authorized / verified. Does not grant production deploy or charges.
 */
export function createUniversalWorkEnvelope(input: {
  id: string;
  tenantId: string;
  universeId: string;
  goalId: string;
  objective: string;
  founderApproved: boolean;
  requestedEnvironments?: CodingMeshEnvironmentId[];
  requestedFiles?: string[];
  requestedAgentIds?: string[];
  classification?: UniversalWorkEnvelope['classification'];
  consequence?: UniversalWorkEnvelope['consequence'];
}): UniversalWorkEnvelope {
  return {
    id: input.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    goalId: input.goalId,
    objective: input.objective,
    founderApproved: input.founderApproved === true,
    requestedEnvironments: input.requestedEnvironments?.length
      ? [...input.requestedEnvironments]
      : ['cursor_local_workcell'],
    requestedFiles: input.requestedFiles ? [...input.requestedFiles] : [],
    requestedAgentIds: input.requestedAgentIds ? [...input.requestedAgentIds] : [],
    productionAuthorized: false,
    permissionExpansionAuthorized: false,
    liveSupabaseApply: false,
    dbCandidateApplied: false,
    classification: input.classification ?? 'internal',
    consequence: input.consequence ?? 'LOW',
  };
}

export function validateUniversalWorkEnvelope(
  envelope: UniversalWorkEnvelope,
): WorkEnvelopeValidation {
  if (!envelope.id || !envelope.tenantId || !envelope.universeId || !envelope.objective.trim()) {
    return {
      accepted: false,
      state: 'DENIED',
      reason: 'INVALID_WORK_ENVELOPE',
      envelope,
    };
  }
  const flagErr = requireFalseFlags(envelope);
  if (flagErr) {
    return { accepted: false, state: 'DENIED', reason: flagErr, envelope };
  }
  if (envelope.classification === 'founder_sealed' && BK_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT) {
    // Envelope may exist for planning; sealed dispatch still deny-by-default elsewhere.
  }
  if (!envelope.founderApproved) {
    return {
      accepted: false,
      state: 'DENIED',
      reason: 'NON_FOUNDER_APPROVED_GOAL_DENIED',
      envelope,
    };
  }
  if (envelope.consequence === 'HIGH' || envelope.consequence === 'CRITICAL') {
    return {
      accepted: false,
      state: 'DENIED',
      reason: 'High/critical consequence envelopes require explicit human gate beyond fabric.',
      envelope,
    };
  }
  if (envelope.requestedEnvironments.length === 0) {
    return {
      accepted: false,
      state: 'UNAVAILABLE',
      reason: 'At least one coding-mesh environment must be requested.',
      envelope,
    };
  }
  return {
    accepted: true,
    state: 'AVAILABLE',
    reason: 'Envelope eligible for bounded multi-environment coding mesh routing.',
    envelope,
  };
}

/**
 * Multi-Environment Coding Mesh probe.
 * Environments are AVAILABLE only when configured AND authorized AND verified.
 * Unconfigured → UNAVAILABLE (real contract, not invented PASS).
 */
export function probeCodingMeshEnvironment(input: EnvironmentConfigInput): EnvironmentProbe {
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  if (!configured || !authorized || !verified) {
    return {
      id: input.id,
      configured,
      authorized,
      verified,
      state: 'UNAVAILABLE',
      reason: ENV_UNAVAILABLE_UNTIL_CAV,
    };
  }
  return {
    id: input.id,
    configured: true,
    authorized: true,
    verified: true,
    state: 'AVAILABLE',
    reason: 'Environment configured, authorized, and verified.',
  };
}

export function defaultUnconfiguredMesh(): EnvironmentProbe[] {
  return CODING_MESH_ENVIRONMENTS.map((id) =>
    probeCodingMeshEnvironment({
      id,
      configured: false,
      authorized: false,
      verified: false,
    }),
  );
}

export function selectMeshTargets(
  requested: CodingMeshEnvironmentId[],
  probes: EnvironmentProbe[],
): Array<{ id: CodingMeshEnvironmentId; state: EnvironmentAvailability; reason: string }> {
  const byId = new Map(probes.map((p) => [p.id, p]));
  return requested.map((id) => {
    const probe = byId.get(id);
    if (!probe) {
      return {
        id,
        state: 'UNAVAILABLE' as const,
        reason: ENV_UNAVAILABLE_UNTIL_CAV,
      };
    }
    return { id, state: probe.state, reason: probe.reason };
  });
}

export function meshHonesty() {
  return {
    unconfiguredIsUnavailable: BK_LOCKS.UNCONFIGURED_ENV_IS_UNAVAILABLE,
    branchIsNotProductionDeploy: BK_LOCKS.BRANCH_IS_NOT_PRODUCTION_DEPLOY,
    workcellIsNotProductionDeploy: BK_LOCKS.WORKCELL_IS_NOT_PRODUCTION_DEPLOY,
    recommendationIsNotCharge: BK_LOCKS.RECOMMENDATION_IS_NOT_CHARGE,
    liveSupabaseApply: BK_LOCKS.LIVE_SUPABASE_APPLY,
    environments: [...CODING_MESH_ENVIRONMENTS],
  };
}
