/**
 * Governed ecosystem alignment contracts.
 *
 * Names identify compatibility targets only. They do not assert a partnership,
 * installed adapter, enrolled person, or production connection.
 */

export const ECOSYSTEM_TARGETS = [
  'EXPO',
  'LOVABLE',
  'GITHUB',
  'GITLAB',
  'OLLAMA',
  'ANTHROPIC_CLAUDE',
  'GOOGLE_AI',
  'AWS',
  'AMD',
  'ASUS',
  'SAMSUNG',
  'APPLE_DEVICE',
  'ANDROID',
  'IOS',
  'GENERIC_AI_TOOL',
  'GENERIC_AI_CHIP',
  'GENERIC_DIGITAL_DEVICE',
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

export const ECOSYSTEM_ALIGNMENT_PROTOCOL = {
  version: '1.0.0',
  authorityPath: ['Authenticated actor', 'Tenant + Universe', 'Guardian policy', 'Consent + terms', 'Capability evidence', 'Human approval', 'Audit receipt'],
  universalInstallationClaimed: false,
  vendorPartnershipsClaimed: false,
  chipEmbeddingClaimed: false,
  automaticAccountAccess: false,
  automaticAgentAuthority: false,
} as const;

export type EcosystemLayer = 'DEVELOPMENT' | 'SOURCE_CONTROL' | 'AI_PROVIDER' | 'DEVICE_OS' | 'OEM_HARDWARE' | 'CHIP_OR_GENERIC_TARGET';

const TARGET_LAYERS: Record<EcosystemTarget, EcosystemLayer> = {
  EXPO:'DEVELOPMENT', LOVABLE:'DEVELOPMENT', GITHUB:'SOURCE_CONTROL', GITLAB:'SOURCE_CONTROL',
  OLLAMA:'AI_PROVIDER', ANTHROPIC_CLAUDE:'AI_PROVIDER', GOOGLE_AI:'AI_PROVIDER', AWS:'AI_PROVIDER',
  ANDROID:'DEVICE_OS', IOS:'DEVICE_OS', AMD:'OEM_HARDWARE', ASUS:'OEM_HARDWARE', SAMSUNG:'OEM_HARDWARE', APPLE_DEVICE:'OEM_HARDWARE',
  GENERIC_AI_TOOL:'CHIP_OR_GENERIC_TARGET', GENERIC_AI_CHIP:'CHIP_OR_GENERIC_TARGET', GENERIC_DIGITAL_DEVICE:'CHIP_OR_GENERIC_TARGET',
};

export function ecosystemAlignmentReport() {
  return {
    protocol: ECOSYSTEM_ALIGNMENT_PROTOCOL,
    targets: ECOSYSTEM_TARGETS.map((target) => ({ target, layer: TARGET_LAYERS[target], state: 'NOT_CONFIGURED' as const, compatibilityTarget: true as const, partnershipClaimed: false as const, productionLive: false as const, installedOnDevices: false as const })),
    summary: { targetCount: ECOSYSTEM_TARGETS.length, configuredCount: 0, productionLiveCount: 0, partnershipCount: 0, universallyInstalled: false as const },
  };
}
