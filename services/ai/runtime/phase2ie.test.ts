/**
 * Phase 2I-E Premium Business Network + Intelligence OS.
 * Deterministic. No network. Not LIVE. No migrations. No RLS changes.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { agentDebuggerCanDeploy } from './diagnostics';
import { companyEntersGlobalBrainAutomatically, evaluateBrainTransfer } from './fabric';
import { learningMayMutateAgentAuthority } from './learning';
import { evaluateModulePolicy, requestModulePermissions } from './modules';
import {
  adIsVisiblySponsored,
  articleClaimRequiresEvidence,
  articlesAutoPublish,
  classifyBusinessData,
  consumerCannotAccessPrivateCompanyMeeting,
  createBusinessAd,
  createBusinessStory,
  createConversation,
  createPromotionCampaign,
  cursorCloudAgentIsProductionAuthority,
  databaseCredentialsExposedClientSide,
  distinguishStoryStances,
  fakeLiveSignalsEnabled,
  hiddenPaidRankingEnabled,
  knowledgePipelineStages,
  messageCannotCrossTenant,
  nvidiaInfrastructureLive,
  nvidiaProvider,
  oracleDefaultsReadOnly,
  paidAdMasqueradingAsOrganic,
  paidPromotionCannotMasqueradeAsOrganic,
  privateMeetingCannotExposeCompanyBrain,
  publishBusinessArticle,
  realtimeSignalCard,
  unknownDatabaseSourceDenied,
  unknownHistoricalLicenseDenied,
  videoMeetingInfrastructureLive,
  videoProvider,
} from './network-os';
import { publishingWritesEnabled } from './publishing/policy';
import { evaluateTenantActivation } from './tenant';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('business ads are visibly sponsored', () => {
  const ad = createBusinessAd({
    adId: 'ad1',
    campaignId: 'c1',
    category: 'b2b_software',
    placement: 'network_feed',
    creative: { headline: 'Warehouse OS', body: 'B2B operations software.', disclosure: 'Sponsored' },
  });
  assert.equal('adId' in ad && adIsVisiblySponsored(ad as never), true);
});

test('paid promotion cannot masquerade as organic', () => {
  const campaign = createPromotionCampaign({
    campaignId: 'p1',
    target: { product: 'promoted_company', subjectId: 'org1' },
    disclosure: 'Promoted',
  });
  assert.equal('campaignId' in campaign, true);
  if (!('campaignId' in campaign)) return;
  const ok = paidPromotionCannotMasqueradeAsOrganic(campaign);
  assert.equal(ok.allowed, true);
  assert.equal(hiddenPaidRankingEnabled(), false);
  const disguised = paidAdMasqueradingAsOrganic({
    paid: true,
    organic: true,
    creative: { disclosure: 'Sponsored' },
  });
  assert.equal(disguised.allowed, false);
});

test('video provider remains not_configured unless real', () => {
  assert.equal(videoProvider().status, 'not_configured');
  assert.equal(videoMeetingInfrastructureLive(), false);
});

test('messages cannot cross tenant boundaries', () => {
  const conversation = createConversation({ conversationId: 'm1', organizationId: 'org_a' });
  assert.equal(conversation.realtimeLive, false);
  assert.equal(messageCannotCrossTenant({ senderOrganizationId: 'org_a', conversationOrganizationId: 'org_a' }).allowed, true);
  assert.equal(messageCannotCrossTenant({ senderOrganizationId: 'org_a', conversationOrganizationId: 'org_b' }).allowed, false);
});

test('private meeting cannot expose Company Brain; consumer cannot access private company meeting', () => {
  assert.equal(privateMeetingCannotExposeCompanyBrain({ meetingClassification: 'confidential', exposeCompanyBrain: true }).allowed, false);
  assert.equal(consumerCannotAccessPrivateCompanyMeeting({ actorRole: 'consumer', meetingClassification: 'internal', sameOrganization: false }).allowed, false);
});

test('module wildcard permission remains denied', () => {
  assert.equal(requestModulePermissions(['*']).allowed, false);
  assert.equal(
    evaluateModulePolicy({
      actorOrganizationId: 'org_a',
      requestedOrganizationId: 'org_a',
      requestedPermissions: ['*'],
    }).allowed,
    false,
  );
});

test('database credentials never exposed client-side; Oracle connector defaults read-only; unknown database source denied', () => {
  assert.equal(databaseCredentialsExposedClientSide(), false);
  assert.equal(oracleDefaultsReadOnly(), true);
  assert.equal(unknownDatabaseSourceDenied('mystery_db').allowed, false);
});

test('unknown historical license denied', () => {
  assert.equal(unknownHistoricalLicenseDenied('unknown').allowed, false);
  assert.equal(unknownHistoricalLicenseDenied(null).allowed, false);
  assert.equal(unknownHistoricalLicenseDenied('us_government_public').allowed, true);
});

test('Company Brain does not auto-enter Global Brain', () => {
  assert.equal(companyEntersGlobalBrainAutomatically(), false);
  assert.equal(evaluateBrainTransfer({ from: 'company', to: 'global' }).allowed, false);
  const classified = classifyBusinessData({ category: 'Finance', sourceRecordId: 'sec:1', provenancePresent: true });
  assert.equal('provenanceDiscarded' in classified && classified.provenanceDiscarded === false, true);
});

test('articles cannot publish without approval; article claims require evidence', () => {
  assert.equal(articlesAutoPublish(), false);
  const denied = publishBusinessArticle({
    approval: 'draft',
    autoPublished: false,
    claims: [{ claimId: 'c1', text: 'Revenue rose', stance: 'observed', evidenceIds: ['e1'] }],
  });
  assert.equal(denied.allowed, false);
  const claim = articleClaimRequiresEvidence({ claimId: 'c1', text: 'x', stance: 'observed', evidenceIds: [] });
  assert.equal(claim.allowed, false);
});

test('Story Engine distinguishes fact/inference/forecast', () => {
  const story = createBusinessStory({
    storyId: 's1',
    title: 'Fulfillment delay',
    evidence: [{ evidenceId: 'e1', sourceId: 'us_sec_edgar', sourceRecordId: 'sec:1', summary: 'Public filing metadata' }],
    observed: 'Public filings were retrieved.',
    inferred: 'Filing activity changed across periods.',
    hypothesized: 'Demand mix may have shifted. Not a diagnosis.',
    recommended: 'Investigate warehouse congestion. Not an autonomous action.',
  });
  assert.equal('storyId' in story, true);
  if (!('storyId' in story)) return;
  const stances = distinguishStoryStances(story);
  assert.equal(stances.observed, true);
  assert.equal(stances.hypothesized, true);
  assert.equal(stances.recommended, true);
  assert.equal(knowledgePipelineStages().includes('learning'), true);
});

test('agents cannot change own authority; L4 stays disabled; Guardian deploy remains denied; unrestricted writes remain denied', () => {
  assert.equal(learningMayMutateAgentAuthority(), false);
  assert.equal(boundedAutonomyEnabled(), false);
  assert.equal(agentDebuggerCanDeploy(), false);
  assert.equal(publishingWritesEnabled(), false);
  assert.equal(evaluateTenantActivation().tenantPersistence, 'blocked');
  assert.equal(cursorCloudAgentIsProductionAuthority(), false);
  assert.equal(nvidiaProvider().status, 'not_configured');
  assert.equal(nvidiaInfrastructureLive(), false);
  assert.equal(fakeLiveSignalsEnabled(), false);
  const card = realtimeSignalCard({
    kind: 'market',
    source: 'none',
    timestamp: '2026-09-07T00:00:00.000Z',
    connected: false,
  });
  assert.equal(card.liveLabel, 'NOT CONNECTED');
});

console.log('All Phase 2I-E premium business network unit cases passed.');
