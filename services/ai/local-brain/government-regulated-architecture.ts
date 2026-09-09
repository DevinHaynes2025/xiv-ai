import {
  AX_LOCKS,
  GOVERNMENT_CERTIFICATION_UNAVAILABLE,
  type AxEvidenceState,
} from './sovereign-sealed-types';

export const SOVEREIGN_DEPLOYMENT_PROFILES = [
  'air_gapped',
  'on_prem',
  'customer_managed_keys',
  'regulated_enclave',
] as const;

export type SovereignDeploymentProfile = (typeof SOVEREIGN_DEPLOYMENT_PROFILES)[number];

export type CertificationHonesty = {
  classifiedSystemApproval: false;
  governmentCertificationClaimed: false;
  governmentCertification: 'NOT_TESTED' | 'UNAVAILABLE';
  inventedCertification: false;
  architectureOnly: true;
};

export function certificationHonesty(): CertificationHonesty {
  return {
    classifiedSystemApproval: AX_LOCKS.CLASSIFIED_SYSTEM_APPROVAL_CLAIMED,
    governmentCertificationClaimed: AX_LOCKS.INVENTED_GOVERNMENT_CERTIFICATION,
    governmentCertification: 'NOT_TESTED',
    inventedCertification: false,
    architectureOnly: true,
  };
}

export function refuseCertificationClaim(claimed: unknown): {
  accepted: false;
  state: 'UNAVAILABLE';
  reason: typeof GOVERNMENT_CERTIFICATION_UNAVAILABLE;
  honesty: CertificationHonesty;
} {
  void claimed;
  return {
    accepted: false,
    state: 'UNAVAILABLE',
    reason: GOVERNMENT_CERTIFICATION_UNAVAILABLE,
    honesty: {
      ...certificationHonesty(),
      governmentCertification: 'UNAVAILABLE',
    },
  };
}

export function buildSovereignDeploymentArchitecture(input: {
  tenantId: string;
  universeId: string;
  profile: SovereignDeploymentProfile;
  claimClassifiedApproval?: boolean;
  claimGovernmentCertification?: boolean;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const honesty = certificationHonesty();
  const certificationState: AxEvidenceState =
    input.claimClassifiedApproval || input.claimGovernmentCertification ? 'UNAVAILABLE' : 'NOT_TESTED';
  return {
    tenantId: input.tenantId,
    universeId: input.universeId,
    profile: input.profile,
    architectureDocumented: true as const,
    isolatedUniverse: true as const,
    dedicatedKeys: true as const,
    dedicatedStorage: true as const,
    dedicatedNetworking: true as const,
    customerControlledKeys: input.profile === 'customer_managed_keys',
    airGapped: input.profile === 'air_gapped',
    onPrem: input.profile === 'on_prem' || input.profile === 'air_gapped' || input.profile === 'regulated_enclave',
    liveGovernmentDeployment: false as const,
    productionAuthorization: false as const,
    certification: {
      ...honesty,
      governmentCertification: certificationState === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'NOT_TESTED',
    },
    refusedClaim:
      input.claimClassifiedApproval || input.claimGovernmentCertification
        ? refuseCertificationClaim({
            classified: input.claimClassifiedApproval,
            certified: input.claimGovernmentCertification,
          })
        : null,
    note: 'Architecture only. No classified-system approval or government certification is claimed or granted.',
  };
}
