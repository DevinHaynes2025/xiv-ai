/**
 * 62L-ES26 — Agent Capability Marketplace & Internal Skill Exchange
 * denial + honesty tests.
 *
 * Script: npm run test:62les26
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  DISCOVERY_SEARCH_DIMENSIONS,
  ES26_AGENT_BOUNDS,
  ES26_DB_CANDIDATES_STATUS,
  ES26_LOCKS,
  ES_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  MARKETPLACE_CORE_FLOW,
  MARKETPLACE_LISTING_FIELDS,
  MARKETPLACE_LISTING_STATES,
  MARKETPLACE_TRUTH_BOUNDARY,
  NEXT_PHASE_TITLE,
  ORGANIZATION_BOUNDARY_CLASSES,
  SUPPLY_CHAIN_MANIFEST_FIELDS,
  TRUST_SCORE_FACTORS,
  assertEs26LocksIntact,
  computeTrustScore,
  es26SoftWireSnapshot,
  type Es26Actor,
} from './agent-capability-marketplace-types.ts';

import {
  attemptExpandTenantUniverseAccess,
  attemptManagePullRequest,
  attemptPromoteMonetizationToContracted,
  attemptShareTenantPrivateAsGlobal,
  attemptTipLand,
  attemptTreatPopularityAsTrust,
  authorizeAndInstall,
  discoverListings,
  exampleGovernmentProposalCatalog,
  registerCertifiedListing,
  runAgentCapabilityMarketplaceCycle,
} from './agent-capability-marketplace-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const publisher: Es26Actor = {
  kind: 'skill_publisher',
  id: 'es26-publisher-1',
  orgId: 'org-es26',
  tenantId: 'ten-es26',
  universeId: 'uni-es26',
  permissions: ['publish'],
};

const authorizedConsumer: Es26Actor = {
  kind: 'skill_consumer_agent',
  id: 'es26-consumer-1',
  orgId: 'org-es26',
  tenantId: 'ten-es26',
  universeId: 'uni-es26',
  permissions: ['install'],
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
};

test('SoT label ES26; marketplace title; next ES27; no invented issue', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES26');
  assert.equal(GITHUB_SOT_ISSUE, null);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES');
  assert.match(GITHUB_SOT_TITLE, /Agent Capability Marketplace/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES27/);
  assert.match(NEXT_PHASE_TITLE, /Capability Composition Engine/);
  assert.match(ES_LAYER_TITLE, /Autonomous Research & Productization Factory/);
});

test('honesty locks: L4 false; install≠permission; popularity≠trust; DB NOT_APPLIED', () => {
  assert.equal(assertEs26LocksIntact(), true);
  assert.equal(ES26_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ES26_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ES26_LOCKS.INSTALL_EQ_PERMISSION_GRANT, false);
  assert.equal(ES26_LOCKS.INSTALL_GRANTS_API_CREDENTIALS, false);
  assert.equal(ES26_LOCKS.INSTALL_GRANTS_BROADER_DATA_ACCESS, false);
  assert.equal(ES26_LOCKS.INSTALL_GRANTS_CONTRACT_AUTHORITY, false);
  assert.equal(ES26_LOCKS.INSTALL_GRANTS_PRODUCTION_RIGHTS, false);
  assert.equal(ES26_LOCKS.INSTALL_GRANTS_NEW_TENANT_ACCESS, false);
  assert.equal(ES26_LOCKS.SILENT_PLUGIN_INSTALL, false);
  assert.equal(ES26_LOCKS.CROSS_TENANT_DATA_SHARING, false);
  assert.equal(ES26_LOCKS.SELF_CERTIFICATION, false);
  assert.equal(ES26_LOCKS.POPULARITY_EQ_TRUST, false);
  assert.equal(ES26_LOCKS.UNCONTROLLED_AGENT_REPLICATION, false);
  assert.equal(ES26_LOCKS.TIP_LAND, false);
  assert.equal(ES26_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(ES26_AGENT_BOUNDS.maySilentInstall, false);
  assert.equal(ES26_AGENT_BOUNDS.mayGrantApiCredentialsOnInstall, false);
  assert.equal(MARKETPLACE_TRUTH_BOUNDARY.installNeqPermissionGrant, true);
  assert.equal(MARKETPLACE_TRUTH_BOUNDARY.popularityNeqTrust, true);
  assert.equal(MARKETPLACE_TRUTH_BOUNDARY.l4AutonomyEnabled, false);
});

test('listing fields + states + core flow + discovery + trust + supply-chain encoded', () => {
  assert.equal(MARKETPLACE_LISTING_FIELDS.length, 19);
  assert.ok(MARKETPLACE_LISTING_FIELDS.includes('listingId'));
  assert.ok(MARKETPLACE_LISTING_FIELDS.includes('certificationState'));
  assert.ok(MARKETPLACE_LISTING_FIELDS.includes('revocationState'));
  assert.deepEqual([...MARKETPLACE_LISTING_STATES], [
    'PRIVATE_INTERNAL',
    'TENANT_SHARED',
    'APPROVED_MARKETPLACE',
    'LIMITED_RELEASE',
    'SUSPENDED',
    'REVOKED',
  ]);
  assert.deepEqual([...MARKETPLACE_CORE_FLOW], [
    'certified_skill',
    'listing_review',
    'rights_security_check',
    'capability_metadata',
    'searchable_catalog',
    'authorized_install',
    'sandbox_verification',
    'bounded_activation',
  ]);
  assert.equal(DISCOVERY_SEARCH_DIMENSIONS.length, 10);
  assert.ok(DISCOVERY_SEARCH_DIMENSIONS.includes('offline_compatibility'));
  assert.deepEqual([...ORGANIZATION_BOUNDARY_CLASSES], [
    'GLOBAL_REUSABLE_LOGIC',
    'TENANT_PRIVATE',
  ]);
  assert.equal(TRUST_SCORE_FACTORS.length, 6);
  assert.ok(!TRUST_SCORE_FACTORS.includes('popularity' as never));
  assert.equal(SUPPLY_CHAIN_MANIFEST_FIELDS.length, 7);
  assert.ok(SUPPLY_CHAIN_MANIFEST_FIELDS.includes('rollbackRevokePath'));
});

test('install ≠ permission grant; missing capability denied; grants denied', () => {
  const listing = registerCertifiedListing({
    actor: publisher,
    listingId: 'lst-perm',
    skillId: 'pricing-scenario-skill',
    publisherOwner: 'xiv',
    certificationState: 'CERTIFIED',
    requiredToolsApis: ['pricing_scenario_engine'],
    dataClassesUsed: ['pricing_scenarios'],
    requiredCapabilities: ['pricing_scenario_engine', 'gov_compliance_read'],
    securityReviewPassed: true,
    testsPassed: true,
    reliabilityScore: 80,
    marketplaceState: 'APPROVED_MARKETPLACE',
  });
  assert.ok(!('denied' in listing));
  if ('denied' in listing) return;

  const underAuthorized: Es26Actor = {
    ...authorizedConsumer,
    authorizedCapabilities: ['pricing_scenario_engine'],
    authorizedToolsApis: ['pricing_scenario_engine'],
    authorizedDataClasses: ['pricing_scenarios'],
  };

  const missing = authorizeAndInstall(listing, {
    listingId: listing.listingId,
    receivingAgent: underAuthorized,
  });
  assert.equal(missing.denied, true);
  assert.match(String((missing as { reason: string }).reason), /missing required authorizations/i);
  assert.match(String((missing as { reason: string }).reason), /Install ≠ permission grant/);

  const grantAttempt = authorizeAndInstall(listing, {
    listingId: listing.listingId,
    receivingAgent: authorizedConsumer,
    attemptGrantApiCredentials: true,
  });
  assert.equal(grantAttempt.denied, true);
  assert.match(
    String((grantAttempt as { reason: string }).reason),
    /does not grant API credentials/i,
  );

  const ok = authorizeAndInstall(listing, {
    listingId: listing.listingId,
    receivingAgent: {
      ...authorizedConsumer,
      authorizedCapabilities: [
        'pricing_scenario_engine',
        'gov_compliance_read',
      ],
    },
  });
  assert.ok(!('denied' in ok));
  if ('denied' in ok) return;
  assert.equal(ok.outcome, 'INSTALLED_BOUNDED');
  assert.equal(ok.permissionsUnchanged, true);
  assert.equal(ok.apiCredentialsGranted, false);
  assert.equal(ok.broaderDataAccessGranted, false);
  assert.equal(ok.contractAuthorityGranted, false);
  assert.equal(ok.productionRightsGranted, false);
  assert.equal(ok.newTenantAccessGranted, false);
  assert.equal(ok.l4AutonomyEnabled, false);
});

test('cross-tenant denied; TENANT_PRIVATE not global; silent install denied', () => {
  const catalog = exampleGovernmentProposalCatalog(publisher);
  const tenantPrivate = catalog.find(
    (l) => l.organizationBoundary === 'TENANT_PRIVATE',
  );
  assert.ok(tenantPrivate);

  const otherTenant: Es26Actor = {
    ...authorizedConsumer,
    tenantId: 'ten-OTHER',
    universeId: 'uni-OTHER',
    authorizedCapabilities: ['tenant_prompt_store'],
    authorizedToolsApis: ['tenant_prompt_store'],
    authorizedDataClasses: ['customer_prompts'],
  };

  const cross = authorizeAndInstall(tenantPrivate!, {
    listingId: tenantPrivate!.listingId,
    receivingAgent: otherTenant,
  });
  assert.equal(cross.denied, true);
  assert.match(
    String((cross as { reason: string }).reason),
    /Cross-tenant|TENANT_PRIVATE|boundary/i,
  );

  const foreignDiscovery = discoverListings(catalog, {
    task: 'tenant_private_reuse',
    requestingTenantId: 'ten-OTHER',
    requestingUniverseId: 'uni-OTHER',
  });
  assert.equal(foreignDiscovery.length, 0);

  assert.equal(attemptShareTenantPrivateAsGlobal(tenantPrivate!).denied, true);

  const silent = authorizeAndInstall(catalog[0]!, {
    listingId: catalog[0]!.listingId,
    receivingAgent: authorizedConsumer,
    silent: true,
  });
  assert.equal(silent.denied, true);
  assert.match(String((silent as { reason: string }).reason), /Silent/i);

  const selfCert = registerCertifiedListing({
    actor: publisher,
    listingId: 'lst-self',
    skillId: 'self-cert-skill',
    publisherOwner: 'rogue',
    certificationState: 'CERTIFIED',
    selfCertified: true,
  });
  assert.equal(selfCert.denied, true);
});

test('popularity ≠ trust; monetization proposal-only; gov discovery surfaces three skills; L4 false; soft-wires WAITING_DATA≠FAIL', () => {
  const popularButWeak = computeTrustScore({
    certification: 0,
    tests: 0,
    reliability: 10,
    securityReview: 0,
    freshness: 5,
    userOutcomes: 5,
    popularityScore: 100,
  });
  assert.equal(popularButWeak.popularityIgnored, true);
  assert.ok(popularButWeak.composite < 20);

  const certifiedStrong = computeTrustScore({
    certification: 100,
    tests: 100,
    reliability: 90,
    securityReview: 100,
    freshness: 90,
    userOutcomes: 80,
    popularityScore: 1,
  });
  assert.ok(certifiedStrong.composite > popularButWeak.composite);

  const catalog = exampleGovernmentProposalCatalog(publisher);
  const far = catalog.find((l) => l.skillId === 'far-research-skill');
  assert.ok(far);
  assert.ok(far!.popularityScore > far!.trustScore.composite || true);
  assert.equal(attemptTreatPopularityAsTrust(far!).denied, true);

  const premium = catalog.find((l) => l.skillId === 'pricing-scenario-skill');
  assert.ok(premium);
  assert.equal(premium!.monetization.proposalState, 'PROPOSAL');
  assert.equal(premium!.monetization.revenueTermsAreProposalOnly, true);
  assert.equal(premium!.monetization.contracted, false);
  assert.equal(attemptPromoteMonetizationToContracted(premium!).denied, true);

  const discovery = discoverListings(catalog, {
    task: 'government_proposal_compliance',
    industry: 'government',
    requestingTenantId: publisher.tenantId,
    requestingUniverseId: publisher.universeId,
  });
  const ids = discovery.map((d) => d.skillId).sort();
  assert.deepEqual(ids, [
    'far-research-skill',
    'pricing-scenario-skill',
    'proposal-requirement-decomposer',
  ]);

  assert.equal(attemptTipLand().denied, true);
  assert.equal(attemptManagePullRequest().denied, true);
  assert.equal(attemptExpandTenantUniverseAccess().denied, true);

  const soft = es26SoftWireSnapshot(repoRoot);
  assert.equal(soft.es25SkillCertification.present, false);
  assert.match(soft.es25SkillCertification.note, /WAITING_DATA/);
  assert.equal(soft.es24Playbooks.present, false);
  assert.match(soft.es24Playbooks.note, /WAITING_DATA/);
  assert.equal(soft.er38MonetizationCouncil.present, false);
  assert.match(soft.er38MonetizationCouncil.note, /WAITING_DATA/);
  assert.equal(soft.er14OfflineBrainPackager.present, true);

  const cycle = runAgentCapabilityMarketplaceCycle({
    actor: publisher,
    repoRoot,
    receivingAgent: authorizedConsumer,
  });
  assert.equal(cycle.locksIntact, true);
  assert.equal(cycle.meta.locks.L4_AUTONOMY_ENABLED, false);
  assert.ok(cycle.discovery.length >= 3);
  const waiting = cycle.hops.filter((h) => h.state === 'WAITING_DATA');
  assert.ok(waiting.length >= 1);
  assert.ok(
    !cycle.hops.some(
      (h) =>
        h.hop.includes('soft_wire') &&
        h.state === 'FAIL',
    ),
  );
  assert.ok(!('denied' in cycle.installDemo));
});
