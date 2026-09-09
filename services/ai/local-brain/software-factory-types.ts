export const FACTORY_CYCLE = [
  'approved_story_or_verified_discovery',
  'requirements',
  'architecture',
  'engineering_workcell',
  'protected_sandbox',
  'code',
  'tests',
  'security',
  'api_ui_review',
  'evidence',
  'plugin_manifest',
  'registry',
  'human_release_gate',
  'candidate_artifact',
] as const;

export type FactoryHop = (typeof FACTORY_CYCLE)[number];

export type FactoryEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED';

export type FactoryJobState =
  | 'queued'
  | 'running'
  | 'completed'
  | 'denied'
  | 'waiting_data'
  | 'unavailable'
  | 'failed';

export type PlatformProfileKind = 'mobile' | 'desktop';

export const FACTORY_HONESTY = Object.freeze({
  l4AutonomyEnabled: false as const,
  autoProductionDeploy: false as const,
  productionDatabaseWrite: false as const,
  productionGitPush: false as const,
  autoPermissionExpansion: false as const,
  autoDatabaseMigration: false as const,
  founderImpersonation: false as const,
  ceoSealedNonReplicating: true as const,
  physicalInfraControl: false as const,
  tipLand: false as const,
  inventedPass: false as const,
  compileAndTestsDoNotAuthorizeRelease: true as const,
  agentGeneratedAppIsBuildCandidateOnly: true as const,
  unconfiguredProvidersUnavailable: true as const,
});

export type FactoryHopRecord = {
  hop: FactoryHop;
  state: FactoryEvidenceState;
  summary: string;
  at: string;
};

export type FactoryCandidateArtifact = {
  id: string;
  kind: 'build_candidate';
  compilePass: boolean;
  testsPass: boolean;
  securityPass: boolean;
  eligible: boolean;
  released: false;
  published: false;
  productionDeployed: false;
  customerUseAuthorized: false;
  newPermissionsGranted: false;
  productionDatabaseChanged: false;
};

export class FactorySimulatedCrash extends Error {
  constructor(public readonly hop: FactoryHop) {
    super(`FACTORY_SIMULATED_CRASH:${hop}`);
    this.name = 'FactorySimulatedCrash';
  }
}
