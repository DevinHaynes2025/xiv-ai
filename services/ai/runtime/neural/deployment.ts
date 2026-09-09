export type EnvironmentConfig = { lane: 'development' | 'test' | 'staging' | 'production' };
export type FeatureFlag = { flag: string; highRiskSecurity: boolean };
export type ReleaseManifest = { version: string };
export type MinimumClientVersion = { ios?: string; android?: string; web?: string };
export type KillSwitch = { enabled: boolean };
export type MigrationPlan = { planId: string };
export type RollbackPlan = { planId: string };
export type HealthCheck = { name: string };
export type ReadinessCheck = { name: string };
export type BuildArtifact = { artifactId: string; signed: boolean };
export type SBOMReference = { referenceId: string };
export type ArtifactSignature = { valid: boolean };
export type ReleaseApproval = { approved: boolean };

export type DeploymentReadiness = {
  productionDeployed: false;
  appStorePublished: false;
  playStorePublished: false;
  testFlightUploaded: false;
  playInternalTestingUploaded: false;
  publicHostingEnabled: false;
};

export function deploymentReadiness(): DeploymentReadiness {
  return {
    productionDeployed: false,
    appStorePublished: false,
    playStorePublished: false,
    testFlightUploaded: false,
    playInternalTestingUploaded: false,
    publicHostingEnabled: false,
  };
}

export function evaluateReleaseFlag(input: FeatureFlag) {
  if (input.highRiskSecurity) {
    return { allowed: false as const, reason: 'feature_flag_cannot_change_security_policy' };
  }
  return { allowed: true as const };
}

export function productionDeploymentAllowed(): false {
  return false;
}
