/**
 * Governed ecosystem alignment contracts.
 *
 * Names identify compatibility targets only. They do not assert a partnership,
 * installed adapter, enrolled person, or production connection.
 */

export const ECOSYSTEM_TARGETS = [
  'OLLAMA',
  'ANTHROPIC_CLAUDE',
  'GOOGLE_AI',
  'AWS',
  'AMD',
  'ASUS',
  'ANDROID',
  'IOS',
] as const;

export type EcosystemTarget = (typeof ECOSYSTEM_TARGETS)[number];
export type AlignmentState = 'NOT_CONFIGURED' | 'REVIEW_REQUIRED' | 'CONFIGURED';

export type AlignmentRequest = {
  tenantId: string;
  universeId: string;
  target: EcosystemTarget;
  actorAuthorized: boolean;
  humanApproved: boolean;
  participantOptIn: boolean;
  organizationAuthorized: boolean;
  termsAccepted: boolean;
  dataPolicyApproved: boolean;
  capabilityEvidenceVerified: boolean;
};

export type AlignmentDecision = {
  target: EcosystemTarget;
  state: AlignmentState;
  allowed: boolean;
  reason: string;
  productionLive: false;
  partnershipClaimed: false;
  grantsAuthority: false;
};

export const LOGICAL_PATHWAY_TARGET = {
  label: '4,000,000 trillion pathways',
  decimal: '4000000000000000000',
  materialization: 'SPARSE_ON_DEMAND',
  claimedAchieved: false,
  measuredCapacity: false,
} as const;

function deny(target: EcosystemTarget, reason: string): AlignmentDecision {
  return {
    target,
    state: 'NOT_CONFIGURED',
    allowed: false,
    reason,
    productionLive: false,
    partnershipClaimed: false,
    grantsAuthority: false,
  };
}

export function evaluateEcosystemAlignment(request: AlignmentRequest): AlignmentDecision {
  if (!request.tenantId || !request.universeId) return deny(request.target, 'tenant_and_universe_required');
  if (!request.actorAuthorized) return deny(request.target, 'actor_not_authorized');
  if (!request.participantOptIn) return deny(request.target, 'participant_opt_in_required');
  if (!request.organizationAuthorized) return deny(request.target, 'organization_authority_required');
  if (!request.termsAccepted) return deny(request.target, 'terms_or_license_required');
  if (!request.dataPolicyApproved) return deny(request.target, 'data_policy_review_required');
  if (!request.capabilityEvidenceVerified) return deny(request.target, 'capability_evidence_required');
  if (!request.humanApproved) {
    return {
      ...deny(request.target, 'human_approval_required'),
      state: 'REVIEW_REQUIRED',
    };
  }

  return {
    target: request.target,
    state: 'CONFIGURED',
    allowed: true,
    reason: 'configured_for_bounded_use',
    productionLive: false,
    partnershipClaimed: false,
    grantsAuthority: false,
  };
}

export function defaultEcosystemAlignment(target: EcosystemTarget): AlignmentDecision {
  return deny(target, 'not_configured');
}

export function pathwayTargetIsCurrentCapacity(): false {
  return false;
}

