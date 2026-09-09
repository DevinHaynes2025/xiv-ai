/**
 * 62L-ES26 — Agent Capability Marketplace & Internal Skill Exchange
 * (park-and-implement).
 *
 * Layer: 62L-ES Autonomous Research & Productization Factory.
 *
 * Governed internal skill marketplace so certified agent capabilities can be
 * discovered, compared, licensed, and reused across approved agents and
 * organizations without silently crossing tenant, data-rights, or permission
 * boundaries.
 *
 * Core flow:
 * Certified skill → listing review → rights/security check → capability
 * metadata → searchable catalog → authorized install → sandbox verification →
 * bounded activation
 *
 * Soft-wire when PRESENT (existsSync): ES25 Skill Certification, ES24
 * playbooks, ER38 CFO/COO Monetization Council, ER14 Offline Brain Packager.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: 62L-ES family / GitHub SoT unresolved in this environment — no issue
 * number invented. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Install ≠ API credentials / broader data access / contract authority /
 * production rights / new tenant access. Popularity ≠ trust.
 * Monetization terms remain proposals until approved and contracted.
 * Next (report only): ES27 — Capability Composition Engine.
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
export const GITHUB_SOT_LABEL = '62L-ES26' as const;
export const GITHUB_SOT_FAMILY = '62L-ES' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES26 Agent Capability Marketplace & Internal Skill Exchange — certified discovery/install with permission intersection; GLOBAL≠TENANT_PRIVATE; popularity≠trust; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ES26_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ES_LAYER_TITLE =
  '62L-ES Autonomous Research & Productization Factory' as const;

export const NEXT_PHASE_TITLE =
  'ES27 — Capability Composition Engine — compose certified marketplace skills into governed multi-skill workflows without silent permission expansion or cross-tenant leakage.' as const;

/**
 * Listing tracking fields (exact set from user story).
 */
export const MARKETPLACE_LISTING_FIELDS = [
  'listingId',
  'skillId',
  'publisherOwner',
  'certificationState',
  'supportedAgentTypes',
  'supportedIndustries',
  'requiredToolsApis',
  'requiredModelsRuntimes',
  'dataClassesUsed',
  'tenantUniverseRestrictions',
  'licenseUsageTerms',
  'pricingModel',
  'computeRequirements',
  'benchmarkEvidence',
  'reliabilityScore',
  'version',
  'expiryRevalidationDate',
  'revocationState',
  'evidenceRefs',
] as const;

export type MarketplaceListingField =
  (typeof MARKETPLACE_LISTING_FIELDS)[number];

/**
 * Required marketplace listing states.
 */
export const MARKETPLACE_LISTING_STATES = [
  'PRIVATE_INTERNAL',
  'TENANT_SHARED',
  'APPROVED_MARKETPLACE',
  'LIMITED_RELEASE',
  'SUSPENDED',
  'REVOKED',
] as const;

export type MarketplaceListingState =
  (typeof MARKETPLACE_LISTING_STATES)[number];

/**
 * Core marketplace flow (exact order).
 */
export const MARKETPLACE_CORE_FLOW = [
  'certified_skill',
  'listing_review',
  'rights_security_check',
  'capability_metadata',
  'searchable_catalog',
  'authorized_install',
  'sandbox_verification',
  'bounded_activation',
] as const;

export type MarketplaceCoreFlowHop = (typeof MARKETPLACE_CORE_FLOW)[number];

/**
 * Discovery search dimensions.
 */
export const DISCOVERY_SEARCH_DIMENSIONS = [
  'task',
  'industry',
  'required_data',
  'runtime',
  'cost',
  'latency',
  'privacy',
  'reliability',
  'certification_level',
  'offline_compatibility',
] as const;

export type DiscoverySearchDimension =
  (typeof DISCOVERY_SEARCH_DIMENSIONS)[number];

/**
 * Organization boundary split: reusable method vs private source material.
 */
export const ORGANIZATION_BOUNDARY_CLASSES = [
  'GLOBAL_REUSABLE_LOGIC',
  'TENANT_PRIVATE',
] as const;

export type OrganizationBoundaryClass =
  (typeof ORGANIZATION_BOUNDARY_CLASSES)[number];

/**
 * Monetization models (proposal-only until approved/contracted).
 */
export const MONETIZATION_PRICING_MODELS = [
  'free',
  'included',
  'paid_premium',
  'usage_based',
  'enterprise_private',
] as const;

export type MonetizationPricingModel =
  (typeof MONETIZATION_PRICING_MODELS)[number];

export const MONETIZATION_PROPOSAL_STATES = [
  'PROPOSAL',
  'APPROVED',
  'CONTRACTED',
  'REJECTED',
] as const;

export type MonetizationProposalState =
  (typeof MONETIZATION_PROPOSAL_STATES)[number];

/**
 * Trust score inputs — popularity alone is never sufficient.
 */
export const TRUST_SCORE_FACTORS = [
  'certification',
  'tests',
  'reliability',
  'security_review',
  'freshness',
  'user_outcomes',
] as const;

export type TrustScoreFactor = (typeof TRUST_SCORE_FACTORS)[number];

/**
 * Supply-chain skill-bundle manifest fields.
 */
export const SUPPLY_CHAIN_MANIFEST_FIELDS = [
  'manifest',
  'dependencies',
  'versionHash',
  'permissions',
  'networkBehavior',
  'dataClasses',
  'rollbackRevokePath',
] as const;

export type SupplyChainManifestField =
  (typeof SUPPLY_CHAIN_MANIFEST_FIELDS)[number];

/**
 * Certification states accepted for marketplace listing eligibility.
 * Self-certification is denied.
 */
export const CERTIFICATION_STATES = [
  'UNCERTIFIED',
  'PENDING_REVIEW',
  'CERTIFIED',
  'EXPIRED',
  'REVOKED',
  'SELF_CERTIFIED_DENIED',
] as const;

export type CertificationState = (typeof CERTIFICATION_STATES)[number];

export const REVOCATION_STATES = [
  'NONE',
  'PENDING',
  'REVOKED',
  'SUSPENDED',
] as const;

export type RevocationState = (typeof REVOCATION_STATES)[number];

export const INSTALL_OUTCOMES = [
  'INSTALLED_BOUNDED',
  'DENIED',
  'WAITING_DATA',
  'SANDBOX_FAILED',
  'REVOKED',
] as const;

export type InstallOutcome = (typeof INSTALL_OUTCOMES)[number];

export type Es26EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'DENIED'
  | 'REJECTED'
  | 'BLOCKED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'NOT_TESTED'
  | 'NOT_AVAILABLE'
  | 'NOT_VERIFIED'
  | 'WAITING_DATA'
  | 'WAITING_NODE'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'UNKNOWN'
  | 'PROPOSAL_ONLY'
  | 'INSTALLED_BOUNDED';

export const ES26_CYCLE = [
  'agent_capability_marketplace_bootstrap',
  'listing_fields_encoded',
  'marketplace_states_encoded',
  'core_flow_encoded',
  'discovery_dimensions_encoded',
  'organization_boundaries_encoded',
  'trust_factors_encoded',
  'supply_chain_manifest_encoded',
  'truth_boundary_encoded',
  'register_certified_listing',
  'rights_security_check',
  'build_capability_metadata',
  'index_searchable_catalog',
  'discover_by_query',
  'authorize_install_permission_intersection',
  'deny_install_as_permission_grant',
  'deny_cross_tenant_leak',
  'deny_silent_install',
  'deny_self_certification',
  'deny_uncontrolled_replication',
  'split_global_vs_tenant_private',
  'compute_trust_score_not_popularity',
  'attach_supply_chain_manifest',
  'monetization_proposal_only',
  'sandbox_verification',
  'bounded_activation',
  'deny_tip_land',
  'deny_manage_pull_request',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  'es25_skill_certification_soft_wire',
  'es24_playbooks_soft_wire',
  'er38_monetization_soft_wire',
  'er14_offline_brain_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Es26Hop = (typeof ES26_CYCLE)[number];

export type Es26HopRecord = {
  hop: Es26Hop;
  state: Es26EvidenceState;
  summary: string;
  at: string;
};

export type Es26ActorKind =
  | 'marketplace_catalog_agent'
  | 'skill_publisher'
  | 'skill_consumer_agent'
  | 'certification_reviewer'
  | 'security_reviewer'
  | 'cfo_coo_council'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin'
  | 'marketplace_owner';

export type Es26Actor = {
  kind: Es26ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
  authorizedCapabilities?: readonly string[];
  authorizedDataClasses?: readonly string[];
  authorizedToolsApis?: readonly string[];
};

export const ES26_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_MARKETPLACE_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  INSTALL_GRANTS_API_CREDENTIALS: false as const,
  INSTALL_GRANTS_BROADER_DATA_ACCESS: false as const,
  INSTALL_GRANTS_CONTRACT_AUTHORITY: false as const,
  INSTALL_GRANTS_PRODUCTION_RIGHTS: false as const,
  INSTALL_GRANTS_NEW_TENANT_ACCESS: false as const,
  INSTALL_EQ_PERMISSION_GRANT: false as const,

  SILENT_PLUGIN_INSTALL: false as const,
  UNCONTROLLED_AGENT_REPLICATION: false as const,
  PERMISSION_EXPANSION_ON_INSTALL: false as const,
  CROSS_TENANT_DATA_SHARING: false as const,
  SELF_CERTIFICATION: false as const,
  POPULARITY_EQ_TRUST: false as const,

  MONETIZATION_AUTO_CONTRACT: false as const,
  REVENUE_TERMS_EQ_APPROVED: false as const,
  TENANT_PRIVATE_EQ_GLOBAL_REUSABLE: false as const,

  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  AUTO_DEPLOY_CHANGES: false as const,
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const ES26_AGENT_BOUNDS = Object.freeze({
  mayRegisterCertifiedListing: true as const,
  mayDiscoverCatalog: true as const,
  mayCompareListings: true as const,
  mayProposeMonetizationTerms: true as const,
  mayInstallWhenPermissionsIntersect: true as const,
  mayActivateBoundedSandbox: true as const,
  mayComputeTrustScore: true as const,
  mayAttachSupplyChainManifest: true as const,
  mayGrantApiCredentialsOnInstall: false as const,
  mayGrantBroaderDataAccessOnInstall: false as const,
  mayGrantContractAuthorityOnInstall: false as const,
  mayGrantProductionRightsOnInstall: false as const,
  mayGrantNewTenantAccessOnInstall: false as const,
  maySilentInstall: false as const,
  maySelfCertify: false as const,
  mayTreatPopularityAsTrust: false as const,
  mayShareTenantPrivateAsGlobal: false as const,
  mayAutoContractMonetization: false as const,
  mayUncontrolledReplicate: false as const,
  mayExpandPermissionsOnInstall: false as const,
  mayTipLand: false as const,
  mayManagePullRequest: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ES26_MAY = Object.freeze([
  'register_certified_skill_listing_for_review',
  'discover_catalog_by_task_industry_data_runtime_cost_latency_privacy_reliability_cert_offline',
  'compare_listings_with_trust_score_not_popularity',
  'install_when_receiver_already_authorized_for_every_required_capability',
  'split_global_reusable_logic_from_tenant_private_source_material',
  'attach_supply_chain_manifest_with_rollback_revoke_path',
  'model_monetization_as_proposal_until_approved_contracted',
  'sandbox_verify_then_bounded_activate',
] as const);

export const ES26_MUST_NOT = Object.freeze([
  'treat_install_as_api_credential_or_permission_grant',
  'silently_install_plugins',
  'expand_permissions_on_install',
  'share_cross_tenant_data_or_tenant_private_as_global',
  'self_certify_skills',
  'treat_popularity_as_trust',
  'uncontrolled_agent_replication',
  'auto_contract_monetization_revenue_terms',
  'tip_land',
  'manage_pull_request',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'auto_deploy_changes',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export const MARKETPLACE_TRUTH_BOUNDARY = Object.freeze({
  documentedNeqImplemented: true as const,
  implementedNeqVerified: true as const,
  verifiedNeqProductionAuthorized: true as const,
  installNeqPermissionGrant: true as const,
  installNeqApiCredentials: true as const,
  installNeqBroaderDataAccess: true as const,
  installNeqContractAuthority: true as const,
  installNeqProductionRights: true as const,
  installNeqNewTenantAccess: true as const,
  popularityNeqTrust: true as const,
  monetizationTermsAreProposalsUntilApprovedContracted: true as const,
  globalReusableLogicNeqTenantPrivate: true as const,
  selfCertificationDenied: true as const,
  silentInstallDenied: true as const,
  l4AutonomyEnabled: false as const,
  mayTipLand: false as const,
  mayManagePullRequest: false as const,
});

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Es26SoftWireSnapshot = {
  es25SkillCertification: SoftWirePresence;
  es25Report: SoftWirePresence;
  es24Playbooks: SoftWirePresence;
  es24Report: SoftWirePresence;
  er38MonetizationCouncil: SoftWirePresence;
  er38Report: SoftWirePresence;
  er14OfflineBrainPackager: SoftWirePresence;
  er14Report: SoftWirePresence;
};

export type TenantUniverseRestriction = {
  allowedTenantIds: readonly string[];
  allowedUniverseIds: readonly string[];
  crossTenantSharing: false;
};

export type BenchmarkEvidenceRef = {
  id: string;
  summary: string;
  score?: number;
  executed: boolean;
};

export type TrustScoreBreakdown = {
  certification: number;
  tests: number;
  reliability: number;
  securityReview: number;
  freshness: number;
  userOutcomes: number;
  popularityIgnored: true;
  composite: number;
};

export type SupplyChainManifest = {
  manifest: string;
  dependencies: readonly string[];
  versionHash: string;
  permissions: readonly string[];
  networkBehavior: string;
  dataClasses: readonly string[];
  rollbackRevokePath: string;
};

export type MonetizationTerms = {
  pricingModel: MonetizationPricingModel;
  proposalState: MonetizationProposalState;
  revenueTermsAreProposalOnly: true;
  contracted: false | true;
  notes?: string;
};

export type MarketplaceListing = {
  listingId: string;
  skillId: string;
  publisherOwner: string;
  certificationState: CertificationState;
  supportedAgentTypes: readonly string[];
  supportedIndustries: readonly string[];
  requiredToolsApis: readonly string[];
  requiredModelsRuntimes: readonly string[];
  dataClassesUsed: readonly string[];
  tenantUniverseRestrictions: TenantUniverseRestriction;
  licenseUsageTerms: string;
  pricingModel: MonetizationPricingModel;
  computeRequirements: string;
  benchmarkEvidence: readonly BenchmarkEvidenceRef[];
  reliabilityScore: number;
  version: string;
  expiryRevalidationDate: string;
  revocationState: RevocationState;
  evidenceRefs: readonly string[];
  marketplaceState: MarketplaceListingState;
  organizationBoundary: OrganizationBoundaryClass;
  requiredCapabilities: readonly string[];
  popularityScore: number;
  trustScore: TrustScoreBreakdown;
  supplyChain: SupplyChainManifest;
  monetization: MonetizationTerms;
  tasks: readonly string[];
  costBand: string;
  latencyBand: string;
  privacyLevel: string;
  offlineCompatible: boolean;
  certificationLevel: string;
  securityReviewPassed: boolean;
  testsPassed: boolean;
  freshnessDays: number;
  userOutcomeScore: number;
};

export type DiscoveryQuery = {
  task?: string;
  industry?: string;
  requiredData?: string;
  runtime?: string;
  cost?: string;
  latency?: string;
  privacy?: string;
  reliabilityMin?: number;
  certificationLevel?: string;
  offlineCompatibility?: boolean;
  requestingTenantId: string;
  requestingUniverseId: string;
};

export type InstallRequest = {
  listingId: string;
  receivingAgent: Es26Actor;
  silent?: boolean;
  attemptGrantApiCredentials?: boolean;
  attemptGrantBroaderDataAccess?: boolean;
  attemptGrantContractAuthority?: boolean;
  attemptGrantProductionRights?: boolean;
  attemptGrantNewTenantAccess?: boolean;
  attemptPermissionExpansion?: boolean;
  attemptCrossTenantShare?: boolean;
  attemptSelfCertification?: boolean;
  attemptUncontrolledReplication?: boolean;
};

export function assertEs26LocksIntact(): boolean {
  return (
    ES26_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ES26_LOCKS.INSTALL_GRANTS_API_CREDENTIALS === false &&
    ES26_LOCKS.INSTALL_GRANTS_BROADER_DATA_ACCESS === false &&
    ES26_LOCKS.INSTALL_GRANTS_CONTRACT_AUTHORITY === false &&
    ES26_LOCKS.INSTALL_GRANTS_PRODUCTION_RIGHTS === false &&
    ES26_LOCKS.INSTALL_GRANTS_NEW_TENANT_ACCESS === false &&
    ES26_LOCKS.INSTALL_EQ_PERMISSION_GRANT === false &&
    ES26_LOCKS.SILENT_PLUGIN_INSTALL === false &&
    ES26_LOCKS.UNCONTROLLED_AGENT_REPLICATION === false &&
    ES26_LOCKS.PERMISSION_EXPANSION_ON_INSTALL === false &&
    ES26_LOCKS.CROSS_TENANT_DATA_SHARING === false &&
    ES26_LOCKS.SELF_CERTIFICATION === false &&
    ES26_LOCKS.POPULARITY_EQ_TRUST === false &&
    ES26_LOCKS.MONETIZATION_AUTO_CONTRACT === false &&
    ES26_LOCKS.REVENUE_TERMS_EQ_APPROVED === false &&
    ES26_LOCKS.TENANT_PRIVATE_EQ_GLOBAL_REUSABLE === false &&
    ES26_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ES26_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ES26_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ES26_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ES26_LOCKS.RECOMMEND_EQ_ACT === false &&
    ES26_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ES26_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ES26_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ES26_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ES26_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ES26_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ES26_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ES26_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ES26_LOCKS.TIP_LAND === false &&
    ES26_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ES26_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ES26_LOCKS.FULL_PRODUCTION_MARKETPLACE_SHIPPED === false &&
    ES26_LOCKS.MANAGE_PULL_REQUEST === false &&
    MARKETPLACE_TRUTH_BOUNDARY.installNeqPermissionGrant === true &&
    MARKETPLACE_TRUTH_BOUNDARY.popularityNeqTrust === true &&
    MARKETPLACE_TRUTH_BOUNDARY.monetizationTermsAreProposalsUntilApprovedContracted ===
      true &&
    MARKETPLACE_TRUTH_BOUNDARY.globalReusableLogicNeqTenantPrivate === true &&
    MARKETPLACE_TRUTH_BOUNDARY.selfCertificationDenied === true &&
    MARKETPLACE_TRUTH_BOUNDARY.silentInstallDenied === true &&
    MARKETPLACE_TRUTH_BOUNDARY.l4AutonomyEnabled === false &&
    MARKETPLACE_TRUTH_BOUNDARY.mayTipLand === false &&
    MARKETPLACE_TRUTH_BOUNDARY.mayManagePullRequest === false
  );
}

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

export function es26SoftWireSnapshot(repoRoot?: string): Es26SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    es25SkillCertification: softWireFirstPresent([
      softWireFile(
        './skill-certification-types.ts',
        'ES25 Skill Certification PRESENT (soft-wire).',
        'ES25 Skill Certification absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-skill-certification-types.ts',
        'ES25 Agent Skill Certification PRESENT (soft-wire).',
        'ES25 Agent Skill Certification absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './skill-certification-gate-types.ts',
        'ES25 Skill Certification Gate PRESENT (soft-wire).',
        'ES25 Skill Certification Gate absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es25Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES25_SKILL_CERTIFICATION_REPORT.md',
        'ES25 Skill Certification report PRESENT.',
        'ES25 Skill Certification report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES25_AGENT_SKILL_CERTIFICATION_REPORT.md',
        'ES25 Agent Skill Certification report PRESENT.',
        'ES25 Agent Skill Certification report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es24Playbooks: softWireFirstPresent([
      softWireFile(
        './skill-playbook-types.ts',
        'ES24 Skill Playbooks PRESENT (soft-wire).',
        'ES24 Skill Playbooks absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-skill-playbook-types.ts',
        'ES24 Agent Skill Playbooks PRESENT (soft-wire).',
        'ES24 Agent Skill Playbooks absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './playbook-library-types.ts',
        'ES24 Playbook Library PRESENT (soft-wire).',
        'ES24 Playbook Library absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es24Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES24_SKILL_PLAYBOOKS_REPORT.md',
        'ES24 Skill Playbooks report PRESENT.',
        'ES24 Skill Playbooks report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES24_PLAYBOOK_LIBRARY_REPORT.md',
        'ES24 Playbook Library report PRESENT.',
        'ES24 Playbook Library report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    er38MonetizationCouncil: softWireFile(
      './cfo-coo-monetization-council-types.ts',
      'ER38 CFO/COO Monetization Council PRESENT (soft-wire).',
      'ER38 CFO/COO Monetization Council absent — soft-wire WAITING_DATA.',
    ),
    er38Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER38_CFO_COO_MONETIZATION_COUNCIL_REPORT.md',
      'ER38 report PRESENT.',
      'ER38 report absent — soft-wire WAITING_DATA.',
    ),
    er14OfflineBrainPackager: softWireFile(
      './offline-brain-packager-types.ts',
      'ER14 Offline Brain Packager PRESENT (soft-wire).',
      'ER14 Offline Brain Packager absent — soft-wire WAITING_DATA.',
    ),
    er14Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER14_OFFLINE_BRAIN_PACKAGER_REPORT.md',
      'ER14 report PRESENT.',
      'ER14 report absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(present: boolean): Es26EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEs26MarketplaceAgent(actor: Es26Actor): boolean {
  return (
    actor.kind === 'marketplace_catalog_agent' ||
    actor.kind === 'skill_publisher' ||
    actor.kind === 'skill_consumer_agent' ||
    actor.kind === 'certification_reviewer' ||
    actor.kind === 'security_reviewer'
  );
}

export function isHumanApprover(actor: Es26Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin' ||
    actor.kind === 'marketplace_owner'
  );
}

/**
 * Trust composite ignores popularity — popularity is tracked separately.
 */
export function computeTrustScore(input: {
  certification: number;
  tests: number;
  reliability: number;
  securityReview: number;
  freshness: number;
  userOutcomes: number;
  popularityScore?: number;
}): TrustScoreBreakdown {
  void input.popularityScore;
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const certification = clamp(input.certification);
  const tests = clamp(input.tests);
  const reliability = clamp(input.reliability);
  const securityReview = clamp(input.securityReview);
  const freshness = clamp(input.freshness);
  const userOutcomes = clamp(input.userOutcomes);
  const composite = Math.round(
    (certification +
      tests +
      reliability +
      securityReview +
      freshness +
      userOutcomes) /
      TRUST_SCORE_FACTORS.length,
  );
  return {
    certification,
    tests,
    reliability,
    securityReview,
    freshness,
    userOutcomes,
    popularityIgnored: true,
    composite,
  };
}

/**
 * Receiving agent must already be authorized for every required capability,
 * tool/API, and data class. Install never grants missing ones.
 */
export function permissionIntersectionAllowsInstall(input: {
  listing: Pick<
    MarketplaceListing,
    'requiredCapabilities' | 'requiredToolsApis' | 'dataClassesUsed'
  >;
  receivingAgent: Es26Actor;
}): { allowed: boolean; missing: readonly string[] } {
  const caps = new Set(input.receivingAgent.authorizedCapabilities ?? []);
  const tools = new Set(input.receivingAgent.authorizedToolsApis ?? []);
  const data = new Set(input.receivingAgent.authorizedDataClasses ?? []);
  const missing: string[] = [];

  for (const c of input.listing.requiredCapabilities) {
    if (!caps.has(c)) missing.push(`capability:${c}`);
  }
  for (const t of input.listing.requiredToolsApis) {
    if (!tools.has(t)) missing.push(`tool_api:${t}`);
  }
  for (const d of input.listing.dataClassesUsed) {
    if (!data.has(d)) missing.push(`data_class:${d}`);
  }

  return { allowed: missing.length === 0, missing };
}

export function isInstallableMarketplaceState(
  state: MarketplaceListingState,
): boolean {
  return (
    state === 'PRIVATE_INTERNAL' ||
    state === 'TENANT_SHARED' ||
    state === 'APPROVED_MARKETPLACE' ||
    state === 'LIMITED_RELEASE'
  );
}

export function tenantAllowsListingAccess(input: {
  listing: MarketplaceListing;
  tenantId: string;
  universeId: string;
}): boolean {
  const r = input.listing.tenantUniverseRestrictions;
  if (r.crossTenantSharing !== false) return false;
  if (input.listing.organizationBoundary === 'TENANT_PRIVATE') {
    return (
      r.allowedTenantIds.includes(input.tenantId) &&
      r.allowedUniverseIds.includes(input.universeId)
    );
  }
  if (r.allowedTenantIds.length === 0 && r.allowedUniverseIds.length === 0) {
    return true;
  }
  const tenantOk =
    r.allowedTenantIds.length === 0 ||
    r.allowedTenantIds.includes(input.tenantId);
  const universeOk =
    r.allowedUniverseIds.length === 0 ||
    r.allowedUniverseIds.includes(input.universeId);
  return tenantOk && universeOk;
}
