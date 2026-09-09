/**
 * 62L-ES33 — Unified Identity & Account Federation Core (park-and-implement).
 *
 * Layer: 62L-ES Autonomous Research & Productization Factory /
 * Home Base Identity Core → Account Federation → Universe Isolation.
 *
 * Right model: One XIV Identity → many authorized connections → separate
 * Universes/scopes → one governed XIV Brain.
 * Not: merge every account and all its data into one unrestricted database.
 *
 * Soft-wire when PRESENT (existsSync): ES32 Mission Decomposition, ES31
 * Dynamic Agent Team Builder, ES30 Reputation & Domain Trust, ES25 Skill
 * Certification, ER16 / Home Base, ER14 Offline Brain Packager, Guardian/RLS
 * patterns. Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: 62L-ES family / GitHub SoT unresolved in this environment — no issue
 * number invented. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR / ManagePullRequest.
 * Provider tokens / secrets never committed to Git.
 * Next (report only): ES34 — Identity-Aware Context Router.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

/** GitHub SoT not resolved here — do not invent an issue number. */
export const GITHUB_SOT_ISSUE: null = null;
export const GITHUB_SOT_ISSUE_NOTE =
  'GitHub SoT for 62L-ES not resolved in this environment — no issue number invented.' as const;
export const GITHUB_SOT_LABEL = '62L-ES33' as const;
export const GITHUB_SOT_FAMILY = '62L-ES' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES33 Unified Identity & Account Federation Core — one XIV identity → many authorized connections → separate Universes; no silent link; no cross-Universe credential share; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ES33_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ES_LAYER_TITLE =
  '62L-ES Autonomous Research & Productization Factory / Home Base Identity Core → Account Federation → Universe Isolation' as const;

export const NEXT_PHASE_TITLE =
  'ES34 — Identity-Aware Context Router — route agent/context requests by verified XIV identity, Universe scope, and authorized connections without collapsing boundaries.' as const;

/**
 * XIV identity tracking fields (exact set from user story).
 */
export const XIV_IDENTITY_FIELDS = [
  'xivIdentityId',
  'primaryUserIdentity',
  'verifiedEmailIdentities',
  'verifiedPhoneIdentities',
  'linkedProviderAccounts',
  'personalUniverse',
  'organizationMemberships',
  'deviceEnrollments',
  'agentIdentities',
  'roles',
  'permissions',
  'dataSharingScopes',
  'authenticationStrength',
  'providerAuthorizationState',
  'consentRecords',
  'lastVerification',
  'revocationUnlinkState',
  'auditHistory',
] as const;

export type XivIdentityField = (typeof XIV_IDENTITY_FIELDS)[number];

/**
 * Candidate providers (exact set from user story).
 */
export const CANDIDATE_PROVIDERS = [
  'microsoft',
  'google',
  'apple',
  'github',
  'gitlab',
  'slack',
  'crm',
  'erp',
  'cloud',
  'storage',
  'business_systems',
] as const;

export type CandidateProvider = (typeof CANDIDATE_PROVIDERS)[number];

/**
 * Per-connection lifecycle (exact order from user story).
 * TARGET → DOCUMENTED → CONFIGURED → AUTHORIZED → VERIFIED → DEGRADED / REVOKED
 */
export const CONNECTION_LIFECYCLE_STATES = [
  'TARGET',
  'DOCUMENTED',
  'CONFIGURED',
  'AUTHORIZED',
  'VERIFIED',
  'DEGRADED',
  'REVOKED',
] as const;

export type ConnectionLifecycleState =
  (typeof CONNECTION_LIFECYCLE_STATES)[number];

/**
 * Consent disclosure shown before linking (exact set from user story).
 */
export const CONSENT_DISCLOSURE_FIELDS = [
  'provider',
  'permissionsRequested',
  'dataTypesAccessed',
  'purpose',
  'whereDataCanBeUsed',
  'retention',
  'howToRevoke',
] as const;

export type ConsentDisclosureField =
  (typeof CONSENT_DISCLOSURE_FIELDS)[number];

/**
 * User account-linking actions.
 */
export const ACCOUNT_LINKING_ACTIONS = [
  'connect',
  'disconnect',
  'pause_sync',
  'change_scopes',
  'export_relevant_xiv_data',
  'revoke_account',
  'choose_universe_routing',
] as const;

export type AccountLinkingAction = (typeof ACCOUNT_LINKING_ACTIONS)[number];

/**
 * XIV Brain coordination path (boundaries intact).
 */
export const XIV_BRAIN_CORE_PATH = [
  'user',
  'xiv_identity_core',
  'personal_universe',
  'organization_universes',
  'agent_home_base',
  'connected_apps_apis',
  'local_devices',
  'cpu_gpu_npu_runtime',
  'offline_brain',
  'authorized_cloud',
  'knowledge_graph',
] as const;

export type XivBrainCorePathHop = (typeof XIV_BRAIN_CORE_PATH)[number];

/**
 * Agent identity fields (exact set from user story).
 */
export const AGENT_IDENTITY_FIELDS = [
  'agentId',
  'homeIdentity',
  'homeUniverse',
  'owner',
  'skills',
  'tools',
  'computeBudget',
  'dataScopes',
  'heartbeat',
  'returnPath',
] as const;

export type AgentIdentityField = (typeof AGENT_IDENTITY_FIELDS)[number];

/**
 * Neural identity graph nodes (exact chain from user story).
 * Person → Accounts → Organizations → Devices → Agents → Skills → Data →
 * Tasks → Decisions → Outcomes — permissions checked at every edge.
 */
export const NEURAL_IDENTITY_GRAPH_NODES = [
  'person',
  'accounts',
  'organizations',
  'devices',
  'agents',
  'skills',
  'data',
  'tasks',
  'decisions',
  'outcomes',
] as const;

export type NeuralIdentityGraphNode =
  (typeof NEURAL_IDENTITY_GRAPH_NODES)[number];

/**
 * Universe kinds — Personal / Company A / Startup B / Government project
 * remain separate with own RLS, Guardian, agents, documents, credentials.
 */
export const UNIVERSE_KINDS = [
  'personal',
  'company',
  'startup',
  'government_project',
] as const;

export type UniverseKind = (typeof UNIVERSE_KINDS)[number];

/**
 * Federation truth boundary — identity ≠ blanket provider auth.
 */
export const FEDERATION_TRUTH_BOUNDARY = Object.freeze({
  oneXivIdentityManyAuthorizedConnections: true as const,
  separateUniversesNotMergedPool: true as const,
  xivAccountDoesNotAuthorizeAllProviders: true as const,
  personalDriveDoesNotFlowToEmployerUniverse: true as const,
  companyErpDoesNotFlowToPersonalBrain: true as const,
  silentAccountLinkingForbidden: true as const,
  crossUniverseCredentialShareForbidden: true as const,
  automaticScopeExpansionForbidden: true as const,
  crossTenantPoolingForbidden: true as const,
  providerTokensNeverInGit: true as const,
  encryptedTokenStorageRequired: true as const,
  mfaPasskeysWhereSupported: true as const,
  guardianRlsMandatory: true as const,
  completeUnlinkRevocationRequired: true as const,
  auditableAccessDecisionsRequired: true as const,
  permissionsCheckedAtEveryGraphEdge: true as const,
  l4AutonomyEnabled: false as const,
});

/**
 * Security requirements encoded as may/must-not.
 */
export const ES33_MAY = Object.freeze([
  'create_xiv_identity_with_personal_universe',
  'disclose_consent_before_linking',
  'link_provider_under_user_authorization_only',
  'advance_connection_lifecycle_independently_per_provider',
  'associate_provider_identities_under_one_verified_xiv_identity',
  'enroll_devices_and_agent_identities_in_home_universe',
  'pause_sync_change_scopes_export_relevant_data',
  'unlink_and_revoke_provider_connections_completely',
  'check_permissions_at_every_neural_identity_graph_edge',
  'coordinate_brain_across_universes_without_collapsing_permissions',
] as const);

export const ES33_MUST_NOT = Object.freeze([
  'treat_xiv_account_as_authorization_for_all_providers',
  'route_personal_drive_into_employer_universe',
  'route_company_erp_into_personal_xiv_brain',
  'silently_link_accounts_without_user_authorization',
  'share_credentials_across_universes',
  'automatically_expand_scopes',
  'pool_data_across_tenants_or_universes',
  'commit_provider_tokens_or_secrets_to_git',
  'bypass_guardian_rls_or_weaken_isolation',
  'enable_L4_autonomy',
  'tip_land_or_open_pr_without_founder_ask',
] as const);

export const ES33_FEDERATION_CYCLE = [
  'honesty_locks',
  'federation_bootstrap',
  'identity_fields_encoded',
  'connection_lifecycle_encoded',
  'consent_disclosure_encoded',
  'brain_path_encoded',
  'agent_identity_encoded',
  'neural_graph_encoded',
  'create_xiv_identity',
  'consent_before_link',
  'link_authorized_provider',
  'deny_xiv_account_blanket_provider_auth',
  'deny_personal_drive_to_employer',
  'deny_erp_to_personal_brain',
  'deny_silent_linking',
  'deny_cross_universe_credential_share',
  'deny_auto_scope_expansion',
  'unlink_revoke_path',
  'graph_edge_permission_check',
  'soft_wire_priors',
  'deny_bypass_guardian_rls',
  'guardian_rls_tenant_universe_isolation',
  'provider_tokens_not_in_source',
  'l4_autonomy_false',
  'evidence_return_home_base',
] as const;

export type Es33FederationCycleHop =
  (typeof ES33_FEDERATION_CYCLE)[number];

export type Es33EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'DENIED'
  | 'WAITING_DATA'
  | 'AVAILABLE'
  | 'REVOKED'
  | 'AUTHORIZED'
  | 'VERIFIED';

export type Es33HopRecord = {
  hop: Es33FederationCycleHop;
  state: Es33EvidenceState;
  summary: string;
  at: string;
};

export type Es33ActorKind =
  | 'identity_federation_core'
  | 'home_base'
  | 'user'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'agent'
  | 'tenant_admin';

export type Es33Actor = {
  kind: Es33ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ES33_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_FEDERATION_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,
  AUTO_OPEN_PR: false as const,

  XIV_ACCOUNT_AUTHORIZES_ALL_PROVIDERS: false as const,
  PERSONAL_DRIVE_TO_EMPLOYER_UNIVERSE: false as const,
  ERP_TO_PERSONAL_BRAIN: false as const,
  SILENT_ACCOUNT_LINKING: false as const,
  CROSS_UNIVERSE_CREDENTIAL_SHARE: false as const,
  AUTOMATIC_SCOPE_EXPANSION: false as const,
  CROSS_TENANT_POOLING: false as const,
  PROVIDER_TOKENS_IN_GIT: false as const,
  PLAINTEXT_TOKEN_STORAGE: false as const,

  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,
  MFA_PASSKEYS_WHERE_SUPPORTED: true as const,
  ENCRYPTED_TOKEN_STORAGE: true as const,
  COMPLETE_UNLINK_REVOCATION: true as const,
  AUDITABLE_ACCESS_DECISIONS: true as const,
  PERMISSIONS_CHECKED_AT_EVERY_GRAPH_EDGE: true as const,

  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const ES33_AGENT_BOUNDS = Object.freeze({
  mayCreateXivIdentity: true as const,
  mayDiscloseConsentBeforeLink: true as const,
  mayLinkWithUserAuthorization: true as const,
  mayAdvanceConnectionLifecycleIndependently: true as const,
  mayUnlinkAndRevoke: true as const,
  mayCheckGraphEdgePermissions: true as const,
  mayTreatXivAccountAsAllProvidersAuthorized: false as const,
  mayRoutePersonalDriveToEmployer: false as const,
  mayRouteErpToPersonalBrain: false as const,
  maySilentLink: false as const,
  mayShareCredentialsAcrossUniverses: false as const,
  mayAutoExpandScopes: false as const,
  mayCrossTenantPool: false as const,
  mayCommitProviderTokensToGit: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export function assertEs33LocksIntact(): boolean {
  return (
    ES33_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ES33_LOCKS.XIV_ACCOUNT_AUTHORIZES_ALL_PROVIDERS === false &&
    ES33_LOCKS.PERSONAL_DRIVE_TO_EMPLOYER_UNIVERSE === false &&
    ES33_LOCKS.ERP_TO_PERSONAL_BRAIN === false &&
    ES33_LOCKS.SILENT_ACCOUNT_LINKING === false &&
    ES33_LOCKS.CROSS_UNIVERSE_CREDENTIAL_SHARE === false &&
    ES33_LOCKS.AUTOMATIC_SCOPE_EXPANSION === false &&
    ES33_LOCKS.CROSS_TENANT_POOLING === false &&
    ES33_LOCKS.PROVIDER_TOKENS_IN_GIT === false &&
    ES33_LOCKS.PLAINTEXT_TOKEN_STORAGE === false &&
    ES33_LOCKS.TIP_LAND === false &&
    ES33_LOCKS.MANAGE_PULL_REQUEST === false &&
    ES33_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ES33_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ES33_LOCKS.ENCRYPTED_TOKEN_STORAGE === true &&
    ES33_LOCKS.PERMISSIONS_CHECKED_AT_EVERY_GRAPH_EDGE === true &&
    FEDERATION_TRUTH_BOUNDARY.xivAccountDoesNotAuthorizeAllProviders ===
      true &&
    FEDERATION_TRUTH_BOUNDARY.silentAccountLinkingForbidden === true &&
    FEDERATION_TRUTH_BOUNDARY.l4AutonomyEnabled === false
  );
}

export function isEs33Agent(actor: Es33Actor): boolean {
  return (
    actor.kind === 'identity_federation_core' ||
    actor.kind === 'home_base' ||
    actor.kind === 'agent' ||
    actor.kind === 'user'
  );
}

export function isHumanApprover(actor: Es33Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export type ConsentDisclosure = {
  provider: CandidateProvider;
  permissionsRequested: readonly string[];
  dataTypesAccessed: readonly string[];
  purpose: string;
  whereDataCanBeUsed: readonly string[];
  retention: string;
  howToRevoke: string;
  userAcknowledged: boolean;
};

export type EncryptedTokenRef = {
  /** Opaque vault reference — never a raw provider token. */
  vaultRef: string;
  algorithm: 'AES-256-GCM' | 'sealed-box';
  ciphertextPresentInRepo: false;
  plaintextPresentInRepo: false;
};

export type ProviderConnection = {
  connectionId: string;
  xivIdentityId: string;
  provider: CandidateProvider;
  providerSubjectId: string;
  lifecycle: ConnectionLifecycleState;
  scopes: readonly string[];
  targetUniverseId: string;
  consent: ConsentDisclosure;
  tokenRef: EncryptedTokenRef | null;
  syncPaused: boolean;
  lastVerification: string | null;
  revokedAt: string | null;
  auditTrail: readonly string[];
};

export type UniverseRecord = {
  universeId: string;
  kind: UniverseKind;
  ownerXivIdentityId: string;
  tenantId: string;
  orgId: string;
  rlsEnforced: true;
  guardianEnforced: true;
  ownAgents: true;
  ownDocuments: true;
  ownCredentials: true;
  ownAudit: true;
  ownContracts: true;
};

export type AgentIdentityRecord = {
  agentId: string;
  homeIdentity: string;
  homeUniverse: string;
  owner: string;
  skills: readonly string[];
  tools: readonly string[];
  computeBudget: number;
  dataScopes: readonly string[];
  heartbeat: string | null;
  returnPath: string;
};

export type XivIdentity = {
  xivIdentityId: string;
  primaryUserIdentity: string;
  verifiedEmailIdentities: readonly string[];
  verifiedPhoneIdentities: readonly string[];
  linkedProviderAccounts: readonly ProviderConnection[];
  personalUniverse: UniverseRecord;
  organizationMemberships: readonly UniverseRecord[];
  deviceEnrollments: readonly string[];
  agentIdentities: readonly AgentIdentityRecord[];
  roles: readonly string[];
  permissions: readonly string[];
  dataSharingScopes: readonly string[];
  authenticationStrength: 'password' | 'mfa' | 'passkey' | 'mfa_passkey';
  providerAuthorizationState: Readonly<
    Partial<Record<CandidateProvider, ConnectionLifecycleState>>
  >;
  consentRecords: readonly ConsentDisclosure[];
  lastVerification: string | null;
  revocationUnlinkState: 'active' | 'partially_revoked' | 'fully_revoked';
  auditHistory: readonly string[];
};

export type NeuralGraphEdge = {
  from: NeuralIdentityGraphNode;
  to: NeuralIdentityGraphNode;
  permissionRequired: string;
  grantedPermissions: readonly string[];
  universeId: string;
  allowed: boolean;
  reason: string;
};

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Es33SoftWireSnapshot = {
  es32MissionDecomposition: SoftWirePresence;
  es32Report: SoftWirePresence;
  es31DynamicAgentTeamBuilder: SoftWirePresence;
  es31Report: SoftWirePresence;
  es30ReputationDomainTrust: SoftWirePresence;
  es30Report: SoftWirePresence;
  es25SkillCertification: SoftWirePresence;
  es25Report: SoftWirePresence;
  er16HomeBase: SoftWirePresence;
  er16HomeBaseReport: SoftWirePresence;
  er14OfflineBrain: SoftWirePresence;
  er14Report: SoftWirePresence;
  guardianRlsPattern: SoftWirePresence;
};

function softWireFile(
  relFromLocalBrain: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(
    dirname(fileURLToPath(import.meta.url)),
    relFromLocalBrain,
  );
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

function softWireRepoRelative(
  repoRoot: string,
  rel: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(repoRoot, rel);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

function softWireFirstPresent(
  candidates: readonly SoftWirePresence[],
): SoftWirePresence {
  for (const c of candidates) {
    if (c.present) return c;
  }
  return candidates[candidates.length - 1]!;
}

export function softWireHopState(
  presence: SoftWirePresence,
): Es33EvidenceState {
  return presence.present ? 'AVAILABLE' : 'WAITING_DATA';
}

export function es33SoftWireSnapshot(repoRoot?: string): Es33SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    es32MissionDecomposition: softWireFirstPresent([
      softWireFile(
        './mission-decomposition-dependency-planner-types.ts',
        'ES32 Mission Decomposition & Dependency Planner PRESENT (soft-wire).',
        'ES32 Mission Decomposition absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './mission-decomposition-dependency-planner.ts',
        'ES32 Mission Decomposition & Dependency Planner PRESENT (soft-wire).',
        'ES32 Mission Decomposition absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './mission-decomposition-types.ts',
        'ES32 Mission Decomposition PRESENT (soft-wire).',
        'ES32 Mission Decomposition absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es32Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES32_MISSION_DECOMPOSITION_DEPENDENCY_PLANNER_REPORT.md',
        'ES32 report PRESENT.',
        'ES32 report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES32_MISSION_DECOMPOSITION_REPORT.md',
        'ES32 report PRESENT.',
        'ES32 report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es31DynamicAgentTeamBuilder: softWireFirstPresent([
      softWireFile(
        './dynamic-agent-team-builder-types.ts',
        'ES31 Dynamic Agent Team Builder PRESENT (soft-wire).',
        'ES31 Dynamic Agent Team Builder absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './dynamic-agent-team-builder.ts',
        'ES31 Dynamic Agent Team Builder PRESENT (soft-wire).',
        'ES31 Dynamic Agent Team Builder absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es31Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES31_DYNAMIC_AGENT_TEAM_BUILDER_REPORT.md',
      'ES31 report PRESENT.',
      'ES31 report absent — soft-wire WAITING_DATA.',
    ),
    es30ReputationDomainTrust: softWireFirstPresent([
      softWireFile(
        './agent-reputation-domain-trust-graph-types.ts',
        'ES30 Reputation & Domain Trust PRESENT (soft-wire).',
        'ES30 Reputation & Domain Trust absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-reputation-domain-trust-graph.ts',
        'ES30 Reputation & Domain Trust PRESENT (soft-wire).',
        'ES30 Reputation & Domain Trust absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es30Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES30_AGENT_REPUTATION_DOMAIN_TRUST_GRAPH_REPORT.md',
      'ES30 report PRESENT.',
      'ES30 report absent — soft-wire WAITING_DATA.',
    ),
    es25SkillCertification: softWireFirstPresent([
      softWireFile(
        './skill-certification-types.ts',
        'ES25 Skill Certification PRESENT (soft-wire).',
        'ES25 Skill Certification absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-skill-certification-types.ts',
        'ES25 Skill Certification PRESENT (soft-wire).',
        'ES25 Skill Certification absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './certified-skill-registry-types.ts',
        'ES25 Skill Certification PRESENT (soft-wire).',
        'ES25 Skill Certification absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es25Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES25_SKILL_CERTIFICATION_REPORT.md',
      'ES25 report PRESENT.',
      'ES25 report absent — soft-wire WAITING_DATA.',
    ),
    er16HomeBase: softWireFirstPresent([
      softWireFile(
        './agent-home-base-types.ts',
        'ER16 / Home Base types PRESENT (soft-wire).',
        'ER16 / Home Base absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-home-base-contract.ts',
        'ER16 / Home Base contract PRESENT (soft-wire).',
        'ER16 / Home Base absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-compute-home-base.ts',
        'Home Base compute surface PRESENT (soft-wire).',
        'ER16 / Home Base absent — soft-wire WAITING_DATA.',
      ),
    ]),
    er16HomeBaseReport: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_EM1_AGENT_HOME_BASE_CONTRACT_REPORT.md',
        'Home Base contract report PRESENT.',
        'ER16 / Home Base report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_EM_AGENT_COMPUTE_HOME_BASE_REPORT.md',
        'Home Base compute report PRESENT.',
        'ER16 / Home Base report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ER16_HOME_BASE_REPORT.md',
        'ER16 report PRESENT.',
        'ER16 / Home Base report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    er14OfflineBrain: softWireFirstPresent([
      softWireFile(
        './offline-brain-packager-types.ts',
        'ER14 Offline Brain Packager PRESENT (soft-wire).',
        'ER14 Offline Brain Packager absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './offline-brain-packager.ts',
        'ER14 Offline Brain Packager PRESENT (soft-wire).',
        'ER14 Offline Brain Packager absent — soft-wire WAITING_DATA.',
      ),
    ]),
    er14Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER14_OFFLINE_BRAIN_PACKAGER_REPORT.md',
      'ER14 report PRESENT.',
      'ER14 report absent — soft-wire WAITING_DATA.',
    ),
    guardianRlsPattern: softWireFirstPresent([
      softWireFile(
        './draft-pr-mr-evidence-packager-types.ts',
        'Guardian/RLS lock pattern PRESENT via ES10 packager types (soft-wire).',
        'Guardian/RLS pattern absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './executable-implementation-plan-generator-types.ts',
        'Guardian/RLS lock pattern PRESENT via ES7 plan types (soft-wire).',
        'Guardian/RLS pattern absent — soft-wire WAITING_DATA.',
      ),
    ]),
  };
}

/**
 * Connection lifecycle helpers — independent per provider.
 */
export function nextConnectionLifecycle(
  current: ConnectionLifecycleState,
  event:
    | 'document'
    | 'configure'
    | 'authorize'
    | 'verify'
    | 'degrade'
    | 'revoke',
): ConnectionLifecycleState {
  if (event === 'revoke') return 'REVOKED';
  if (event === 'degrade') {
    if (current === 'REVOKED') return 'REVOKED';
    return 'DEGRADED';
  }
  if (current === 'REVOKED') return 'REVOKED';
  if (event === 'document' && current === 'TARGET') return 'DOCUMENTED';
  if (event === 'configure' && current === 'DOCUMENTED') return 'CONFIGURED';
  if (event === 'authorize' && current === 'CONFIGURED') return 'AUTHORIZED';
  if (event === 'verify' && current === 'AUTHORIZED') return 'VERIFIED';
  if (event === 'verify' && current === 'DEGRADED') return 'AUTHORIZED';
  return current;
}

export function connectionIsAuthorizedForUse(
  lifecycle: ConnectionLifecycleState,
): boolean {
  return lifecycle === 'AUTHORIZED' || lifecycle === 'VERIFIED';
}

export function xivAccountAuthorizesAllProviders(): boolean {
  return (
    FEDERATION_TRUTH_BOUNDARY.xivAccountDoesNotAuthorizeAllProviders ===
      false || ES33_LOCKS.XIV_ACCOUNT_AUTHORIZES_ALL_PROVIDERS === true
  );
}
