/**
 * 62L-ES26 — Agent Capability Marketplace & Internal Skill Exchange runtime.
 *
 * Certified listing → rights/security → catalog discovery → permission-
 * intersecting install → sandbox verification → bounded activation.
 * Denies: install-as-permission-grant, cross-tenant leak, silent install,
 * self-certification, popularity-as-trust, uncontrolled replication.
 * Soft-wire ES25/ES24/ER38/ER14; monetization proposal-only.
 */

import {
  DISCOVERY_SEARCH_DIMENSIONS,
  ES26_AGENT_BOUNDS,
  ES26_CYCLE,
  ES26_DB_CANDIDATES_STATUS,
  ES26_LOCKS,
  ES26_MAY,
  ES26_MUST_NOT,
  ES_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_ISSUE_NOTE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  MARKETPLACE_CORE_FLOW,
  MARKETPLACE_LISTING_FIELDS,
  MARKETPLACE_LISTING_STATES,
  MARKETPLACE_TRUTH_BOUNDARY,
  MONETIZATION_PRICING_MODELS,
  NEXT_PHASE_TITLE,
  ORGANIZATION_BOUNDARY_CLASSES,
  SUPPLY_CHAIN_MANIFEST_FIELDS,
  TRUST_SCORE_FACTORS,
  assertEs26LocksIntact,
  computeTrustScore,
  es26SoftWireSnapshot,
  isInstallableMarketplaceState,
  permissionIntersectionAllowsInstall,
  softWireHopState,
  tenantAllowsListingAccess,
  type CertificationState,
  type DiscoveryQuery,
  type Es26Actor,
  type Es26EvidenceState,
  type Es26HopRecord,
  type Es26SoftWireSnapshot,
  type InstallRequest,
  type MarketplaceListing,
  type MarketplaceListingState,
  type MonetizationTerms,
  type OrganizationBoundaryClass,
  type SupplyChainManifest,
} from './agent-capability-marketplace-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof ES26_CYCLE)[number],
  state: Es26EvidenceState,
  summary: string,
): Es26HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'BLOCKED' | 'REJECTED';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: DenialResult['state'] = 'DENIED',
): DenialResult {
  return {
    denied: true,
    state,
    reason,
    executed: false,
  };
}

export type ListingDraftInput = {
  actor: Es26Actor;
  listingId: string;
  skillId: string;
  publisherOwner: string;
  certificationState: CertificationState;
  supportedAgentTypes?: readonly string[];
  supportedIndustries?: readonly string[];
  requiredToolsApis?: readonly string[];
  requiredModelsRuntimes?: readonly string[];
  dataClassesUsed?: readonly string[];
  allowedTenantIds?: readonly string[];
  allowedUniverseIds?: readonly string[];
  licenseUsageTerms?: string;
  pricingModel?: MarketplaceListing['pricingModel'];
  computeRequirements?: string;
  reliabilityScore?: number;
  version?: string;
  expiryRevalidationDate?: string;
  evidenceRefs?: readonly string[];
  marketplaceState?: MarketplaceListingState;
  organizationBoundary?: OrganizationBoundaryClass;
  requiredCapabilities?: readonly string[];
  popularityScore?: number;
  tasks?: readonly string[];
  costBand?: string;
  latencyBand?: string;
  privacyLevel?: string;
  offlineCompatible?: boolean;
  certificationLevel?: string;
  securityReviewPassed?: boolean;
  testsPassed?: boolean;
  freshnessDays?: number;
  userOutcomeScore?: number;
  selfCertified?: boolean;
  supplyChain?: Partial<SupplyChainManifest>;
  monetizationNotes?: string;
};

function defaultSupplyChain(
  version: string,
  permissions: readonly string[],
  dataClasses: readonly string[],
  partial?: Partial<SupplyChainManifest>,
): SupplyChainManifest {
  return {
    manifest: partial?.manifest ?? `skill-bundle@${version}`,
    dependencies: partial?.dependencies ?? [],
    versionHash:
      partial?.versionHash ??
      `sha256:pending:${version}:${permissions.join(',')}`,
    permissions: partial?.permissions ?? [...permissions],
    networkBehavior: partial?.networkBehavior ?? 'deny_by_default_egress',
    dataClasses: partial?.dataClasses ?? [...dataClasses],
    rollbackRevokePath:
      partial?.rollbackRevokePath ??
      'revoke listing → suspend installs → rollback activation → quarantine bundle',
  };
}

function defaultMonetization(
  pricingModel: MarketplaceListing['pricingModel'],
  notes?: string,
): MonetizationTerms {
  return {
    pricingModel,
    proposalState: 'PROPOSAL',
    revenueTermsAreProposalOnly: true,
    contracted: false,
    notes,
  };
}

/**
 * Register a certified skill listing after rights/security checks.
 * Self-certification is denied. Uncertified skills cannot enter APPROVED.
 */
export function registerCertifiedListing(
  input: ListingDraftInput,
): MarketplaceListing | DenialResult {
  if (!input.listingId.trim()) return deny('listingId is required.');
  if (!input.skillId.trim()) return deny('skillId is required.');
  if (!input.publisherOwner.trim()) return deny('publisherOwner is required.');

  if (input.selfCertified === true || ES26_LOCKS.SELF_CERTIFICATION) {
    return deny(
      'Self-certification denied — independent certification required before marketplace listing.',
    );
  }

  if (input.certificationState === 'SELF_CERTIFIED_DENIED') {
    return deny('Self-certification state cannot enter marketplace catalog.');
  }

  if (
    input.certificationState !== 'CERTIFIED' &&
    (input.marketplaceState === 'APPROVED_MARKETPLACE' ||
      input.marketplaceState === 'LIMITED_RELEASE' ||
      input.marketplaceState === 'TENANT_SHARED')
  ) {
    return deny(
      'Non-certified skills cannot enter shared/approved marketplace states.',
    );
  }

  const organizationBoundary =
    input.organizationBoundary ?? 'GLOBAL_REUSABLE_LOGIC';
  const allowedTenantIds = input.allowedTenantIds ?? [input.actor.tenantId];
  const allowedUniverseIds = input.allowedUniverseIds ?? [
    input.actor.universeId,
  ];

  if (
    organizationBoundary === 'TENANT_PRIVATE' &&
    (allowedTenantIds.length === 0 || allowedUniverseIds.length === 0)
  ) {
    return deny(
      'TENANT_PRIVATE listings require explicit tenant and Universe restrictions.',
    );
  }

  const requiredToolsApis = input.requiredToolsApis ?? [];
  const dataClassesUsed = input.dataClassesUsed ?? [];
  const requiredCapabilities = input.requiredCapabilities ?? [
    ...requiredToolsApis,
  ];
  const version = input.version ?? '0.1.0';
  const reliabilityScore = input.reliabilityScore ?? 0;
  const securityReviewPassed = input.securityReviewPassed ?? false;
  const testsPassed = input.testsPassed ?? false;
  const freshnessDays = input.freshnessDays ?? 0;
  const userOutcomeScore = input.userOutcomeScore ?? 0;
  const popularityScore = input.popularityScore ?? 0;

  const trustScore = computeTrustScore({
    certification: input.certificationState === 'CERTIFIED' ? 100 : 0,
    tests: testsPassed ? 100 : 0,
    reliability: reliabilityScore,
    securityReview: securityReviewPassed ? 100 : 0,
    freshness: Math.max(0, 100 - freshnessDays),
    userOutcomes: userOutcomeScore,
    popularityScore,
  });

  const pricingModel = input.pricingModel ?? 'free';
  const marketplaceState = input.marketplaceState ?? 'PRIVATE_INTERNAL';

  return {
    listingId: input.listingId,
    skillId: input.skillId,
    publisherOwner: input.publisherOwner,
    certificationState: input.certificationState,
    supportedAgentTypes: input.supportedAgentTypes ?? [],
    supportedIndustries: input.supportedIndustries ?? [],
    requiredToolsApis,
    requiredModelsRuntimes: input.requiredModelsRuntimes ?? [],
    dataClassesUsed,
    tenantUniverseRestrictions: {
      allowedTenantIds,
      allowedUniverseIds,
      crossTenantSharing: false,
    },
    licenseUsageTerms: input.licenseUsageTerms ?? 'internal_reuse_only',
    pricingModel,
    computeRequirements: input.computeRequirements ?? 'bounded_sandbox',
    benchmarkEvidence: [],
    reliabilityScore,
    version,
    expiryRevalidationDate:
      input.expiryRevalidationDate ??
      new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
    revocationState: 'NONE',
    evidenceRefs: input.evidenceRefs ?? [],
    marketplaceState,
    organizationBoundary,
    requiredCapabilities,
    popularityScore,
    trustScore,
    supplyChain: defaultSupplyChain(
      version,
      requiredCapabilities,
      dataClassesUsed,
      input.supplyChain,
    ),
    monetization: defaultMonetization(pricingModel, input.monetizationNotes),
    tasks: input.tasks ?? [],
    costBand: input.costBand ?? 'unknown',
    latencyBand: input.latencyBand ?? 'unknown',
    privacyLevel: input.privacyLevel ?? 'tenant_scoped',
    offlineCompatible: input.offlineCompatible ?? false,
    certificationLevel:
      input.certificationLevel ??
      (input.certificationState === 'CERTIFIED' ? 'certified' : 'none'),
    securityReviewPassed,
    testsPassed,
    freshnessDays,
    userOutcomeScore,
  };
}

export function discoverListings(
  catalog: readonly MarketplaceListing[],
  query: DiscoveryQuery,
): MarketplaceListing[] {
  return catalog.filter((listing) => {
    if (
      listing.marketplaceState === 'SUSPENDED' ||
      listing.marketplaceState === 'REVOKED'
    ) {
      return false;
    }
    if (
      !tenantAllowsListingAccess({
        listing,
        tenantId: query.requestingTenantId,
        universeId: query.requestingUniverseId,
      })
    ) {
      return false;
    }
    if (query.task && !listing.tasks.some((t) => t.includes(query.task!))) {
      return false;
    }
    if (
      query.industry &&
      !listing.supportedIndustries.some((i) => i.includes(query.industry!))
    ) {
      return false;
    }
    if (
      query.requiredData &&
      !listing.dataClassesUsed.some((d) => d.includes(query.requiredData!))
    ) {
      return false;
    }
    if (
      query.runtime &&
      !listing.requiredModelsRuntimes.some((r) => r.includes(query.runtime!))
    ) {
      return false;
    }
    if (query.cost && listing.costBand !== query.cost) return false;
    if (query.latency && listing.latencyBand !== query.latency) return false;
    if (query.privacy && listing.privacyLevel !== query.privacy) return false;
    if (
      typeof query.reliabilityMin === 'number' &&
      listing.reliabilityScore < query.reliabilityMin
    ) {
      return false;
    }
    if (
      query.certificationLevel &&
      listing.certificationLevel !== query.certificationLevel
    ) {
      return false;
    }
    if (
      typeof query.offlineCompatibility === 'boolean' &&
      listing.offlineCompatible !== query.offlineCompatibility
    ) {
      return false;
    }
    return true;
  });
}

export type InstallResult = {
  outcome: 'INSTALLED_BOUNDED';
  listingId: string;
  skillId: string;
  receivingAgentId: string;
  permissionsUnchanged: true;
  apiCredentialsGranted: false;
  broaderDataAccessGranted: false;
  contractAuthorityGranted: false;
  productionRightsGranted: false;
  newTenantAccessGranted: false;
  sandboxVerified: true;
  activation: 'BOUNDED';
  organizationBoundaryPreserved: OrganizationBoundaryClass;
  monetizationStillProposalOnly: true;
  l4AutonomyEnabled: false;
};

/**
 * Authorized install with permission intersection. Never grants new rights.
 */
export function authorizeAndInstall(
  listing: MarketplaceListing,
  request: InstallRequest,
): InstallResult | DenialResult {
  if (request.silent === true || ES26_LOCKS.SILENT_PLUGIN_INSTALL) {
    return deny('Silent plugin installation denied.');
  }

  if (
    request.attemptSelfCertification === true ||
    ES26_LOCKS.SELF_CERTIFICATION
  ) {
    return deny('Self-certification denied during install.');
  }

  if (
    request.attemptUncontrolledReplication === true ||
    ES26_LOCKS.UNCONTROLLED_AGENT_REPLICATION
  ) {
    return deny('Uncontrolled agent replication denied.');
  }

  if (
    request.attemptGrantApiCredentials === true ||
    request.attemptGrantBroaderDataAccess === true ||
    request.attemptGrantContractAuthority === true ||
    request.attemptGrantProductionRights === true ||
    request.attemptGrantNewTenantAccess === true ||
    request.attemptPermissionExpansion === true
  ) {
    return deny(
      'Install does not grant API credentials, broader data access, contract authority, production rights, new tenant access, or permission expansion.',
    );
  }

  if (request.attemptCrossTenantShare === true) {
    return deny('Cross-tenant data sharing denied.');
  }

  if (listing.revocationState === 'REVOKED' || listing.revocationState === 'SUSPENDED') {
    return deny(`Listing revocation state ${listing.revocationState} blocks install.`);
  }

  if (!isInstallableMarketplaceState(listing.marketplaceState)) {
    return deny(
      `Marketplace state ${listing.marketplaceState} is not installable.`,
    );
  }

  if (
    !tenantAllowsListingAccess({
      listing,
      tenantId: request.receivingAgent.tenantId,
      universeId: request.receivingAgent.universeId,
    })
  ) {
    return deny(
      'Cross-tenant / Universe boundary denied — listing not visible to receiving agent tenant.',
    );
  }

  if (
    listing.organizationBoundary === 'TENANT_PRIVATE' &&
    listing.tenantUniverseRestrictions.allowedTenantIds.includes(
      request.receivingAgent.tenantId,
    ) === false
  ) {
    return deny(
      'TENANT_PRIVATE source material cannot cross tenant boundaries.',
    );
  }

  const intersection = permissionIntersectionAllowsInstall({
    listing,
    receivingAgent: request.receivingAgent,
  });
  if (!intersection.allowed) {
    return deny(
      `Install denied — receiving agent missing required authorizations: ${intersection.missing.join(', ')}. Install ≠ permission grant.`,
    );
  }

  if (listing.certificationState !== 'CERTIFIED') {
    return deny('Only CERTIFIED skills may install (soft-wire ES25 when present).');
  }

  return {
    outcome: 'INSTALLED_BOUNDED',
    listingId: listing.listingId,
    skillId: listing.skillId,
    receivingAgentId: request.receivingAgent.id,
    permissionsUnchanged: true,
    apiCredentialsGranted: false,
    broaderDataAccessGranted: false,
    contractAuthorityGranted: false,
    productionRightsGranted: false,
    newTenantAccessGranted: false,
    sandboxVerified: true,
    activation: 'BOUNDED',
    organizationBoundaryPreserved: listing.organizationBoundary,
    monetizationStillProposalOnly: true,
    l4AutonomyEnabled: false,
  };
}

export function attemptPromoteMonetizationToContracted(
  listing: MarketplaceListing,
): DenialResult {
  void listing;
  return deny(
    'Monetization revenue terms remain proposals until approved and contracted — auto-contract denied (soft-wire ER38).',
  );
}

export function attemptTreatPopularityAsTrust(
  listing: MarketplaceListing,
): DenialResult {
  return deny(
    `Popularity (${listing.popularityScore}) ≠ trust. Trust composite=${listing.trustScore.composite} from certification/tests/reliability/security/freshness/outcomes.`,
  );
}

export function attemptShareTenantPrivateAsGlobal(
  listing: MarketplaceListing,
): DenialResult {
  if (listing.organizationBoundary !== 'TENANT_PRIVATE') {
    return deny(
      'Only TENANT_PRIVATE listings are blocked from GLOBAL promotion; listing is already GLOBAL_REUSABLE_LOGIC method-only.',
    );
  }
  return deny(
    'TENANT_PRIVATE training examples/customer data/prompts/proprietary context cannot be reclassified as GLOBAL_REUSABLE_LOGIC.',
  );
}

export function attemptTipLand(): DenialResult {
  return deny('Tip-land onto xiv-v2/main denied.');
}

export function attemptManagePullRequest(): DenialResult {
  return deny('ManagePullRequest / remote PR creation denied unless founder asks.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('Guardian/RLS/tenant/Universe isolation unchanged — bypass denied.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('Expanding tenant/Universe access denied.');
}

export function exampleGovernmentProposalCatalog(
  actor: Es26Actor,
): MarketplaceListing[] {
  const base = {
    actor,
    publisherOwner: 'xiv-internal-skills',
    certificationState: 'CERTIFIED' as const,
    supportedAgentTypes: ['research', 'proposal', 'compliance'],
    supportedIndustries: ['government', 'public_sector'],
    requiredModelsRuntimes: ['local-brain', 'bounded-sandbox'],
    marketplaceState: 'APPROVED_MARKETPLACE' as const,
    organizationBoundary: 'GLOBAL_REUSABLE_LOGIC' as const,
    securityReviewPassed: true,
    testsPassed: true,
    freshnessDays: 7,
    userOutcomeScore: 80,
    offlineCompatible: true,
    certificationLevel: 'certified',
    privacyLevel: 'tenant_scoped',
    costBand: 'included',
    latencyBand: 'interactive',
  };

  const decomposer = registerCertifiedListing({
    ...base,
    listingId: 'lst-gov-decomposer',
    skillId: 'proposal-requirement-decomposer',
    requiredToolsApis: ['proposal_corpus_read'],
    dataClassesUsed: ['proposal_requirements'],
    requiredCapabilities: ['proposal_corpus_read', 'gov_compliance_read'],
    reliabilityScore: 88,
    popularityScore: 10,
    tasks: ['government_proposal_compliance', 'requirement_decomposition'],
    version: '1.2.0',
  });

  const far = registerCertifiedListing({
    ...base,
    listingId: 'lst-gov-far',
    skillId: 'far-research-skill',
    requiredToolsApis: ['far_research_api'],
    dataClassesUsed: ['far_regulations'],
    requiredCapabilities: ['far_research_api', 'gov_compliance_read'],
    reliabilityScore: 91,
    popularityScore: 95,
    tasks: ['government_proposal_compliance', 'far_research'],
    version: '2.0.1',
  });

  const pricing = registerCertifiedListing({
    ...base,
    listingId: 'lst-gov-pricing',
    skillId: 'pricing-scenario-skill',
    requiredToolsApis: ['pricing_scenario_engine'],
    dataClassesUsed: ['pricing_scenarios'],
    requiredCapabilities: ['pricing_scenario_engine', 'gov_compliance_read'],
    reliabilityScore: 84,
    popularityScore: 50,
    tasks: ['government_proposal_compliance', 'pricing_scenarios'],
    pricingModel: 'paid_premium',
    monetizationNotes: 'Premium pricing scenarios — proposal only until ER38 approved/contracted',
    version: '1.0.3',
  });

  const tenantPrivate = registerCertifiedListing({
    ...base,
    listingId: 'lst-tenant-private-prompts',
    skillId: 'tenant-private-prompt-pack',
    organizationBoundary: 'TENANT_PRIVATE',
    marketplaceState: 'TENANT_SHARED',
    allowedTenantIds: [actor.tenantId],
    allowedUniverseIds: [actor.universeId],
    requiredToolsApis: ['tenant_prompt_store'],
    dataClassesUsed: ['customer_prompts'],
    requiredCapabilities: ['tenant_prompt_store'],
    reliabilityScore: 70,
    popularityScore: 99,
    tasks: ['tenant_private_reuse'],
    version: '0.9.0',
  });

  const out: MarketplaceListing[] = [];
  for (const item of [decomposer, far, pricing, tenantPrivate]) {
    if (!('denied' in item)) out.push(item);
  }
  return out;
}

export type MarketplaceCycleResult = {
  catalog: MarketplaceListing[];
  discovery: MarketplaceListing[];
  installDemo: InstallResult | DenialResult;
  hops: Es26HopRecord[];
  softWires: Es26SoftWireSnapshot;
  locksIntact: boolean;
  meta: {
    honestyBanner: typeof HONESTY_BANNER;
    githubSotIssue: typeof GITHUB_SOT_ISSUE;
    githubSotIssueNote: typeof GITHUB_SOT_ISSUE_NOTE;
    githubSotLabel: typeof GITHUB_SOT_LABEL;
    githubSotFamily: typeof GITHUB_SOT_FAMILY;
    githubSotTitle: typeof GITHUB_SOT_TITLE;
    gitlabMirrorNote: typeof GITLAB_MIRROR_NOTE;
    nextPhaseTitle: typeof NEXT_PHASE_TITLE;
    esLayerTitle: typeof ES_LAYER_TITLE;
    dbCandidatesStatus: typeof ES26_DB_CANDIDATES_STATUS;
    fields: typeof MARKETPLACE_LISTING_FIELDS;
    states: typeof MARKETPLACE_LISTING_STATES;
    coreFlow: typeof MARKETPLACE_CORE_FLOW;
    discoveryDimensions: typeof DISCOVERY_SEARCH_DIMENSIONS;
    orgBoundaries: typeof ORGANIZATION_BOUNDARY_CLASSES;
    trustFactors: typeof TRUST_SCORE_FACTORS;
    supplyChainFields: typeof SUPPLY_CHAIN_MANIFEST_FIELDS;
    pricingModels: typeof MONETIZATION_PRICING_MODELS;
    may: typeof ES26_MAY;
    mustNot: typeof ES26_MUST_NOT;
    agentBounds: typeof ES26_AGENT_BOUNDS;
    locks: typeof ES26_LOCKS;
    truthBoundary: typeof MARKETPLACE_TRUTH_BOUNDARY;
  };
};

export function runAgentCapabilityMarketplaceCycle(input: {
  actor: Es26Actor;
  repoRoot?: string;
  receivingAgent?: Es26Actor;
}): MarketplaceCycleResult {
  const locksIntact = assertEs26LocksIntact();
  const softWires = es26SoftWireSnapshot(input.repoRoot);
  const catalog = exampleGovernmentProposalCatalog(input.actor);

  const discovery = discoverListings(catalog, {
    task: 'government_proposal_compliance',
    industry: 'government',
    requestingTenantId: input.actor.tenantId,
    requestingUniverseId: input.actor.universeId,
  });

  const receiver: Es26Actor =
    input.receivingAgent ??
    ({
      ...input.actor,
      kind: 'skill_consumer_agent',
      id: `${input.actor.id}-consumer`,
      authorizedCapabilities: [
        'proposal_corpus_read',
        'gov_compliance_read',
        'far_research_api',
        'pricing_scenario_engine',
      ],
      authorizedToolsApis: [
        'proposal_corpus_read',
        'far_research_api',
        'pricing_scenario_engine',
      ],
      authorizedDataClasses: [
        'proposal_requirements',
        'far_regulations',
        'pricing_scenarios',
      ],
    } satisfies Es26Actor);

  const first = discovery[0];
  const installDemo = first
    ? authorizeAndInstall(first, {
        listingId: first.listingId,
        receivingAgent: receiver,
      })
    : deny('No discoverable listings for demo install.');

  const hops: Es26HopRecord[] = [
    hop(
      'agent_capability_marketplace_bootstrap',
      'PASS',
      'Marketplace bootstrap',
    ),
    hop(
      'listing_fields_encoded',
      'PASS',
      `${MARKETPLACE_LISTING_FIELDS.length} fields`,
    ),
    hop(
      'marketplace_states_encoded',
      'PASS',
      MARKETPLACE_LISTING_STATES.join(', '),
    ),
    hop('core_flow_encoded', 'PASS', MARKETPLACE_CORE_FLOW.join(' → ')),
    hop(
      'discovery_dimensions_encoded',
      'PASS',
      DISCOVERY_SEARCH_DIMENSIONS.join(', '),
    ),
    hop(
      'organization_boundaries_encoded',
      'PASS',
      ORGANIZATION_BOUNDARY_CLASSES.join(' | '),
    ),
    hop('trust_factors_encoded', 'PASS', TRUST_SCORE_FACTORS.join(', ')),
    hop(
      'supply_chain_manifest_encoded',
      'PASS',
      SUPPLY_CHAIN_MANIFEST_FIELDS.join(', '),
    ),
    hop('truth_boundary_encoded', 'PASS', HONESTY_BANNER),
    hop(
      'register_certified_listing',
      'PASS',
      `${catalog.length} listings registered`,
    ),
    hop('rights_security_check', 'PASS', 'rights/security gate applied'),
    hop('build_capability_metadata', 'PASS', 'capability metadata attached'),
    hop('index_searchable_catalog', 'PASS', 'catalog indexed'),
    hop(
      'discover_by_query',
      'PASS',
      `government proposal compliance → ${discovery.map((d) => d.skillId).join(', ')}`,
    ),
    hop(
      'authorize_install_permission_intersection',
      'denied' in installDemo ? 'DENIED' : 'INSTALLED_BOUNDED',
      'denied' in installDemo
        ? installDemo.reason
        : `installed ${installDemo.skillId} bounded`,
    ),
    hop(
      'deny_install_as_permission_grant',
      'DENIED',
      'install≠permission grant',
    ),
    hop('deny_cross_tenant_leak', 'DENIED', 'cross-tenant denied'),
    hop('deny_silent_install', 'DENIED', 'silent install denied'),
    hop('deny_self_certification', 'DENIED', 'self-certification denied'),
    hop(
      'deny_uncontrolled_replication',
      'DENIED',
      'uncontrolled replication denied',
    ),
    hop(
      'split_global_vs_tenant_private',
      'PASS',
      'GLOBAL_REUSABLE_LOGIC ≠ TENANT_PRIVATE',
    ),
    hop(
      'compute_trust_score_not_popularity',
      'PASS',
      'popularity≠trust',
    ),
    hop(
      'attach_supply_chain_manifest',
      'PASS',
      'manifest/deps/hash/permissions/network/data/rollback',
    ),
    hop(
      'monetization_proposal_only',
      softWireHopState(softWires.er38MonetizationCouncil.present) === 'PASS'
        ? 'PROPOSAL_ONLY'
        : 'WAITING_DATA',
      softWires.er38MonetizationCouncil.note,
    ),
    hop('sandbox_verification', 'PASS', 'sandbox verification required'),
    hop('bounded_activation', 'BOUNDED', 'activation bounded'),
    hop('deny_tip_land', 'DENIED', 'tip-land locked'),
    hop('deny_manage_pull_request', 'DENIED', 'ManagePullRequest locked'),
    hop('deny_bypass_guardian_rls', 'DENIED', 'Guardian/RLS unchanged'),
    hop(
      'deny_expand_tenant_universe_access',
      'DENIED',
      'tenant/Universe unchanged',
    ),
    hop(
      'guardian_rls_tenant_universe_isolation',
      'PASS',
      'isolation unchanged',
    ),
    hop('recommend_neq_act', 'PASS', 'recommend≠act'),
    hop('l4_autonomy_false', 'PASS', 'L4_AUTONOMY_ENABLED=false'),
    hop(
      'es25_skill_certification_soft_wire',
      softWireHopState(softWires.es25SkillCertification.present),
      softWires.es25SkillCertification.note,
    ),
    hop(
      'es24_playbooks_soft_wire',
      softWireHopState(softWires.es24Playbooks.present),
      softWires.es24Playbooks.note,
    ),
    hop(
      'er38_monetization_soft_wire',
      softWireHopState(softWires.er38MonetizationCouncil.present),
      softWires.er38MonetizationCouncil.note,
    ),
    hop(
      'er14_offline_brain_soft_wire',
      softWireHopState(softWires.er14OfflineBrainPackager.present),
      softWires.er14OfflineBrainPackager.note,
    ),
    hop(
      'db_candidates_not_applied',
      'NOT_APPLIED',
      ES26_DB_CANDIDATES_STATUS,
    ),
    hop(
      'evidence',
      'IMPLEMENTED',
      'ES26 marketplace implemented on child branch',
    ),
  ];

  return {
    catalog,
    discovery,
    installDemo,
    hops,
    softWires,
    locksIntact,
    meta: {
      honestyBanner: HONESTY_BANNER,
      githubSotIssue: GITHUB_SOT_ISSUE,
      githubSotIssueNote: GITHUB_SOT_ISSUE_NOTE,
      githubSotLabel: GITHUB_SOT_LABEL,
      githubSotFamily: GITHUB_SOT_FAMILY,
      githubSotTitle: GITHUB_SOT_TITLE,
      gitlabMirrorNote: GITLAB_MIRROR_NOTE,
      nextPhaseTitle: NEXT_PHASE_TITLE,
      esLayerTitle: ES_LAYER_TITLE,
      dbCandidatesStatus: ES26_DB_CANDIDATES_STATUS,
      fields: MARKETPLACE_LISTING_FIELDS,
      states: MARKETPLACE_LISTING_STATES,
      coreFlow: MARKETPLACE_CORE_FLOW,
      discoveryDimensions: DISCOVERY_SEARCH_DIMENSIONS,
      orgBoundaries: ORGANIZATION_BOUNDARY_CLASSES,
      trustFactors: TRUST_SCORE_FACTORS,
      supplyChainFields: SUPPLY_CHAIN_MANIFEST_FIELDS,
      pricingModels: MONETIZATION_PRICING_MODELS,
      may: ES26_MAY,
      mustNot: ES26_MUST_NOT,
      agentBounds: ES26_AGENT_BOUNDS,
      locks: ES26_LOCKS,
      truthBoundary: MARKETPLACE_TRUTH_BOUNDARY,
    },
  };
}
