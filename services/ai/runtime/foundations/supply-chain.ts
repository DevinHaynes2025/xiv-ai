export type SoftwareSupplyStage =
  | 'source'
  | 'signed_commit'
  | 'dependency_scan'
  | 'secret_scan'
  | 'sast'
  | 'tests'
  | 'build'
  | 'sbom'
  | 'artifact_signature'
  | 'release_approval'
  | 'deployment'
  | 'runtime_attestation'
  | 'monitoring';

export type SbomContract = { artifactId: string; complete: boolean };
export type ArtifactSignature = { artifactId: string; valid: boolean };
export type DependencyTrust = { name: string; state: 'TRUSTED' | 'UNKNOWN' | 'DENIED' };
export type RuntimeIntegrity = { attested: boolean; hostProvided: boolean };

export function evaluateArtifact(input: { signed: boolean; signatureValid: boolean }) {
  if (input.signed !== true || input.signatureValid !== true) {
    return { allowed: false as const, reason: 'artifact_without_valid_signature_denied' };
  }
  return { allowed: true as const, stage: 'deployment' as const };
}

export function dependencyTrustState(state: DependencyTrust['state']): { trusted: boolean } {
  return { trusted: state === 'TRUSTED' };
}

export function unknownDependencyIsTrusted(): false {
  return false;
}

export function runtimeAttestationClaimed(input: { hostProvided: boolean }): RuntimeIntegrity {
  return { hostProvided: input.hostProvided, attested: input.hostProvided === true };
}
