/**
 * Phase 2I-G offline + discovery + workspace foundations.
 * Deterministic. No network. Does not weaken 2I-F or tenant tests.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { companyEntersGlobalBrainAutomatically } from './fabric';
import { globalDataFabricProductionLive } from './network-os';
import {
  recordSecValidatedRetrieval,
  resetSecAdapterStatusForTests,
  resetSourceRegistryForTests,
  seedDeclaredBusinessDataProviders,
  secAdapterCapabilityStatus,
} from './sources';
import {
  recordWorldBankValidatedRetrieval,
  resetWorldBankAdapterStatusForTests,
  worldBankAdapterCapabilityStatus,
} from './sources/world-bank-status';
import { clientSelectorIsNotAuthority, evaluateTenantActivation } from './tenant';
import {
  analyzeIdeaRoom,
  applyOfflineMutation,
  contradictionAgentChallenge,
  createCompanyInvitation,
  createDiscoveryCandidate,
  distinguishFounderFromVerified,
  enqueueOfflineMutation,
  evaluateXivFormula,
  evaluateXivFormulaCode,
  forecastRemainsSeparateFromFact,
  invitationRequiresReview,
  ideaRoomGuaranteesSuccess,
  investmentLanguageAllowed,
  offlineBypassesTenantPolicy,
  offlineSyncEngineProductionLive,
  privateDataEntersGlobalBrainAutomatically,
  promoteClaimToVerified,
  publishDailyArticle,
  requestZoneTransition,
  RESEARCH_AGENT_ROLES,
  sheetEvidencePreservesProvenance,
  unsupportedGlobalProvidersRemainNotConfigured,
  verifiedIntelligenceRequiresProvenance,
  workspaceCrossOrgDenied,
  workspaceL4Disabled,
  workspaceProviderTruth,
  workspaceTenantSelectorsAreNotAuthority,
} from './workspace';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('private data cannot automatically enter Global Brain; zone transitions require authorization', () => {
  assert.equal(privateDataEntersGlobalBrainAutomatically(), false);
  assert.equal(companyEntersGlobalBrainAutomatically(), false);
  const denied = requestZoneTransition({ from: 'COMPANY', to: 'GLOBAL', authorized: false });
  assert.equal(denied.allowed, false);
  const personal = requestZoneTransition({ from: 'PERSONAL', to: 'TEAM', authorized: false });
  assert.equal(personal.allowed, false);
});

test('offline queued actions still require server authorization; CLOUD_ONLY cannot be cached', () => {
  assert.equal(offlineSyncEngineProductionLive(), false);
  const blocked = enqueueOfflineMutation({
    mutationId: 'm1',
    organizationId: 'org_a',
    capability: 'documents',
    policy: 'CLOUD_ONLY',
  });
  assert.equal(blocked.allowed, false);
  const queued = enqueueOfflineMutation({
    mutationId: 'm2',
    organizationId: 'org_a',
    capability: 'drafts',
    policy: 'OFFLINE_ENCRYPTED',
  });
  assert.equal(queued.allowed, true);
  if (queued.allowed) {
    assert.equal(queued.mutation.requiresServerAuthorization, true);
    assert.equal(applyOfflineMutation(queued.mutation).allowed, false);
    assert.equal(
      applyOfflineMutation({ ...queued.mutation, serverAuthorized: true, tenantValidated: true }).allowed,
      true,
    );
  }
  assert.equal(offlineBypassesTenantPolicy(), false);
});

test('unsupported global providers remain NOT_CONFIGURED; World Bank and SEC remain truthful; fabric not production-live', () => {
  resetWorldBankAdapterStatusForTests();
  resetSecAdapterStatusForTests();
  resetSourceRegistryForTests();
  seedDeclaredBusinessDataProviders();
  recordWorldBankValidatedRetrieval();
  recordSecValidatedRetrieval();
  assert.equal(worldBankAdapterCapabilityStatus(), 'LIVE');
  assert.equal(secAdapterCapabilityStatus(), 'LIVE');
  const truth = workspaceProviderTruth();
  assert.equal(truth.worldBank, 'LIVE');
  assert.equal(truth.sec, 'LIVE');
  assert.equal(truth.fabric, false);
  assert.equal(globalDataFabricProductionLive(), false);
  assert.equal(unsupportedGlobalProvidersRemainNotConfigured(), true);
  resetWorldBankAdapterStatusForTests();
  resetSecAdapterStatusForTests();
});

test('contradiction agent flags conflicts; unverified cannot become verified; forecasts stay separate', () => {
  assert.equal(RESEARCH_AGENT_ROLES.includes('Contradiction'), true);
  const a = {
    claimId: 'c1',
    subject: 'revenue',
    period: '2024',
    stance: 'FACT' as const,
    value: '10',
    status: 'UNVERIFIED' as const,
    evidence: [{ evidenceId: 'e1', sourceId: 'press', retrievedAt: '2026-01-01T00:00:00.000Z', summary: 'Press release' }],
  };
  const b = {
    claimId: 'c2',
    subject: 'revenue',
    period: '2024',
    stance: 'FACT' as const,
    value: '4',
    status: 'UNVERIFIED' as const,
    evidence: [{ evidenceId: 'e2', sourceId: 'filing', retrievedAt: '2026-01-01T00:00:00.000Z', summary: 'Filing' }],
  };
  assert.equal(contradictionAgentChallenge(a, b).status, 'CONTRADICTED');
  assert.equal(promoteClaimToVerified(a).allowed, false);
  assert.equal(forecastRemainsSeparateFromFact('FORECAST'), true);
  assert.equal(forecastRemainsSeparateFromFact('FACT'), false);
});

test('provenance required for verified intelligence; investment language bounded', () => {
  assert.equal(verifiedIntelligenceRequiresProvenance({ sourceId: null, status: 'SUPPORTED' }).allowed, false);
  assert.equal(verifiedIntelligenceRequiresProvenance({ sourceId: 'us_sec_edgar', status: 'SUPPORTED' }).allowed, true);
  assert.equal(investmentLanguageAllowed('BUY').allowed, false);
  assert.equal(investmentLanguageAllowed('WATCH').allowed, true);
});

test('XIV Sheets formulas are bounded; arbitrary code denied; evidence bindings preserve provenance', () => {
  const sum = evaluateXivFormula({ name: 'SUM', values: [1, 2, 3] });
  assert.equal(sum.allowed, true);
  if (sum.allowed) assert.equal(sum.value, 6);
  assert.equal(evaluateXivFormula({ name: 'eval', values: [1] }).allowed, false);
  assert.equal(evaluateXivFormulaCode('process.exit(0)').allowed, false);
  assert.equal(
    sheetEvidencePreservesProvenance({
      address: 'B1',
      value: 42,
      evidence: {
        sourceId: 'us_sec_edgar',
        period: 'FY2025',
        retrievedAt: '2026-01-01T00:00:00.000Z',
        confidence: 'high',
        stance: 'FACT',
      },
    }).allowed,
    true,
  );
  assert.equal(sheetEvidencePreservesProvenance({ address: 'B2', value: 1 }).allowed, false);
});

test('founder claims remain distinguishable; AI drafts require review; Idea Room does not guarantee success', () => {
  const founder = distinguishFounderFromVerified({
    claimId: 's1',
    text: 'We are growing fast',
    origin: 'founder',
    verification: 'UNVERIFIED',
  });
  assert.equal(founder.verifiedFact, false);
  const article = publishDailyArticle({
    articleId: 'a1',
    channel: 'XIV Business',
    title: 'Draft',
    claims: [{ text: 'Claim', sourceId: 'world_bank_open_data' }],
    reviewState: 'AI_GENERATED_DRAFT',
    fabricatedBreakingNews: false,
  });
  assert.equal(article.allowed, false);
  const idea = { ideaId: 'i1', problem: 'Waste', idea: 'Cold chain', stage: 'Prototype', region: 'KE', guaranteedSuccess: false as const };
  assert.equal(ideaRoomGuaranteesSuccess(idea), false);
  assert.equal(analyzeIdeaRoom(idea).guaranteedSuccess, false);
});

test('company invitations require review; demo/live stay separate; L4 disabled; selectors not authority; cross-org denied', () => {
  const invite = createCompanyInvitation('cand_1', 'Emerging operator in a DEMO watchlist.');
  assert.equal(invitationRequiresReview(invite), true);
  const demo = createDiscoveryCandidate({ candidateId: 'd1', legalName: 'Sample Co', country: 'NG', surface: 'DEMO' });
  assert.equal(demo.surface, 'DEMO');
  assert.equal(demo.investmentRecommendation, null);
  assert.equal(demo.guaranteedWinner, false);
  assert.equal(globalDataFabricProductionLive(), false);
  assert.equal(workspaceL4Disabled(), true);
  assert.equal(boundedAutonomyEnabled(), false);
  assert.equal(workspaceTenantSelectorsAreNotAuthority('org_ui').allowed, false);
  assert.equal(clientSelectorIsNotAuthority('universe_ui').allowed, false);
  assert.equal(workspaceCrossOrgDenied('org_a', 'org_b').allowed, false);
  assert.equal(evaluateTenantActivation().tenantPersistence, 'blocked');
  assert.equal(offlineBypassesTenantPolicy(), false);
});

console.log('All Phase 2I-G workspace foundation unit cases passed.');
