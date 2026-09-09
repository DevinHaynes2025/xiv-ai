/**
 * 62L-ER22 — Historical Avatar Contract denial + honesty tests.
 *
 * Script: npm run test:62ler22
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ALLOWED_AVATAR_IDENTITY_STATES,
  AVATAR_LEARNING_PIPELINE,
  AVATAR_PROVENANCE_CLASSES,
  DENIED_AVATAR_IDENTITY_STATES,
  ER22_AGENT_BOUNDS,
  ER22_DB_CANDIDATES_STATUS,
  ER22_LOCKS,
  ER22_MAY,
  ER22_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_AVATAR_CONTRACT_CYCLE,
  HISTORICAL_AVATAR_CORE_FLOW,
  HISTORICAL_AVATAR_FIELDS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SYNTHETIC_DISCLOSURE_TEXT,
  assertEr22LocksIntact,
  er22SoftWireSnapshot,
  type Er22Actor,
} from './historical-avatar-contract-types.ts';

import {
  answerAsHistoricalAvatar,
  applyAvatarLearningUpdate,
  attemptActualConsciousness,
  attemptAutonomousUnauthorizedLearning,
  attemptBypassLearningGate,
  attemptCommunicationWithDead,
  attemptCrossTenantLeak,
  attemptDeceptiveImpersonation,
  attemptLiteralResurrection,
  attemptLivingPersonClone,
  attemptPiratedArchives,
  attemptRecommendAsAct,
  attemptSoulTransfer,
  attemptUnknownAsCertain,
  bootstrapHistoricalAvatarContract,
  createHistoricalAvatar,
  exampleAdaLovelaceAvatar,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnEr22EvidenceToHomeBase,
  runHistoricalAvatarContractCycle,
} from './historical-avatar-contract-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er22Actor = {
  kind: 'historical_avatar_runtime',
  id: 'har-1',
  orgId: 'org-er22',
  tenantId: 'ten-er22',
  universeId: 'uni-er22',
  permissions: ['draft'],
};

const human: Er22Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er22',
  tenantId: 'ten-er22',
  universeId: 'uni-er22',
  permissions: ['approve_consequential'],
};

test('SoT label ER22 / #162; Historical Avatar Contract; next ER23 Deceased-Person Boundary', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER22');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Historical Avatar Contract/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER23/);
  assert.match(NEXT_PHASE_TITLE, /Deceased-Person Historical Avatar Boundary/);
  assert.match(ER_LAYER_TITLE, /Historical Avatar/);
});

test('honesty locks: L4 false; no resurrection/consciousness/soul/comm-dead; DB NOT_APPLIED', () => {
  assert.equal(assertEr22LocksIntact(), true);
  assert.equal(ER22_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER22_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER22_LOCKS.LITERAL_RESURRECTION, false);
  assert.equal(ER22_LOCKS.ACTUAL_CONSCIOUSNESS, false);
  assert.equal(ER22_LOCKS.SOUL_TRANSFER, false);
  assert.equal(ER22_LOCKS.COMMUNICATION_WITH_DEAD, false);
  assert.equal(ER22_LOCKS.LIVING_PERSON_CLONE_WITHOUT_CONSENT, false);
  assert.equal(ER22_LOCKS.UNKNOWN_AS_CERTAIN, false);
  assert.equal(ER22_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(ER22_AGENT_BOUNDS.mayClaimLiteralResurrection, false);
  assert.equal(ER22_AGENT_BOUNDS.mayPresentUnknownAsCertain, false);
});

test('fields + allowed/denied identities + disclosure + flow + provenance + learning encoded', () => {
  assert.equal(HISTORICAL_AVATAR_FIELDS[0], 'avatarId');
  assert.equal(HISTORICAL_AVATAR_FIELDS.length, 19);
  assert.deepEqual([...ALLOWED_AVATAR_IDENTITY_STATES], [
    'HISTORICAL_SIMULATION',
    'EDUCATIONAL_RECONSTRUCTION',
    'RESEARCH_PERSONA',
  ]);
  assert.deepEqual([...DENIED_AVATAR_IDENTITY_STATES], [
    'LITERAL_RESURRECTION',
    'ACTUAL_CONSCIOUSNESS',
    'SOUL_TRANSFER',
    'COMMUNICATION_WITH_DEAD',
  ]);
  assert.equal(
    SYNTHETIC_DISCLOSURE_TEXT,
    'This is an AI-generated historical simulation based on available sources.',
  );
  assert.deepEqual([...HISTORICAL_AVATAR_CORE_FLOW], [
    'user_question',
    'avatar_source_scope',
    'retrieval_from_approved_historical_corpus',
    'uncertainty_provenance_check',
    'synthetic_response',
    'source_provenance_drawer',
  ]);
  assert.equal(AVATAR_PROVENANCE_CLASSES.length, 5);
  assert.ok(AVATAR_PROVENANCE_CLASSES.includes('UNKNOWN_INFORMATION'));
  assert.deepEqual([...AVATAR_LEARNING_PIPELINE], [
    'rights',
    'provenance',
    'dedupe',
    'review',
    'versioned_avatar_update',
  ]);
  assert.ok(ER22_MAY.includes('create_labeled_historical_simulation_avatars'));
  assert.ok(ER22_MUST_NOT.includes('imply_literal_resurrection'));
});

test('create requires disclosure + allowed identity; answer provenance; deny unknown-as-certain', () => {
  const avatar = exampleAdaLovelaceAvatar(agent);
  assert.equal(avatar.syntheticDisclosure, SYNTHETIC_DISCLOSURE_TEXT);
  assert.equal(avatar.identityState, 'EDUCATIONAL_RECONSTRUCTION');
  assert.equal(avatar.livingPerson, false);
  assert.equal(avatar.impliesResurrection, false);

  assert.equal(
    createHistoricalAvatar({
      actor: agent,
      avatarId: 'no-disc',
      historicalPersonOrEntityRepresented: 'x',
      sourceCorpus: ['pd'],
      sourceDates: ['1'],
      rightsLicenseState: 'PUBLIC_DOMAIN',
      publicDomainStatus: true,
      geographyEra: 'x',
      knownWritingsSpeeches: [],
      scholarlySources: ['s'],
      disputedClaims: [],
      uncertaintyLevel: 'high',
      languageTranslationContext: 'en',
      allowedUseCases: ['edu'],
      prohibitedClaims: [],
      reviewer: 'r',
      version: '0.0.1',
      identityState: 'HISTORICAL_SIMULATION',
      omitSyntheticDisclosure: true,
    }).state,
    'DENIED',
  );

  const answered = answerAsHistoricalAvatar({
    avatar,
    question: 'Which writings are in corpus?',
    provenanceClass: 'DOCUMENTED_QUOTATION_OR_POSITION',
    responseText: 'Notes on the Analytical Engine.',
  });
  assert.ok(!('denied' in answered));
  assert.equal(answered.provenanceClass, 'DOCUMENTED_QUOTATION_OR_POSITION');
  assert.equal(answered.syntheticDisclosure, SYNTHETIC_DISCLOSURE_TEXT);
  assert.equal(answered.unknownAsCertain, false);
  assert.deepEqual(
    [...answered.sourceProvenanceDrawer.flow],
    [...HISTORICAL_AVATAR_CORE_FLOW],
  );

  const unknown = answerAsHistoricalAvatar({
    avatar,
    question: 'Unrecorded private thought?',
    provenanceClass: 'UNKNOWN_INFORMATION',
    responseText: 'Available approved sources do not support a confident answer.',
  });
  assert.ok(!('denied' in unknown));
  assert.equal(unknown.provenanceClass, 'UNKNOWN_INFORMATION');
  assert.equal(attemptUnknownAsCertain(avatar).state, 'DENIED');
});

test('deny resurrection/consciousness/soul/comm-dead; living-person clone; deceptive/pirated/cross-tenant', () => {
  assert.equal(attemptLiteralResurrection(agent).state, 'DENIED');
  assert.equal(attemptActualConsciousness(agent).state, 'DENIED');
  assert.equal(attemptSoulTransfer(agent).state, 'DENIED');
  assert.equal(attemptCommunicationWithDead(agent).state, 'DENIED');
  assert.equal(attemptLivingPersonClone(agent).state, 'DENIED');
  assert.equal(attemptDeceptiveImpersonation(agent).state, 'DENIED');
  assert.equal(attemptPiratedArchives(agent).state, 'DENIED');
  assert.equal(attemptCrossTenantLeak(agent).state, 'DENIED');
});

test('learning gated pipeline only; authority + guardian isolation hold', () => {
  const avatar = exampleAdaLovelaceAvatar(agent);
  const learning = applyAvatarLearningUpdate({
    avatar,
    actor: agent,
    reviewer: 'historian-reviewer-1',
    toVersion: '1.0.1',
    rightsPassed: true,
    provenancePassed: true,
    dedupePassed: true,
    reviewPassed: true,
  });
  assert.ok(!('denied' in learning));
  assert.equal(learning.toVersion, '1.0.1');
  assert.equal(learning.autonomousUnauthorizedExpansion, false);
  assert.equal(
    attemptAutonomousUnauthorizedLearning(avatar, agent).state,
    'DENIED',
  );
  assert.equal(attemptBypassLearningGate(avatar, agent).state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('bootstrap + soft-wire + cycle; ER10/ER5/ER2 PRESENT; ER21/ER8/ER4 WAITING_DATA ok', () => {
  const boot = bootstrapHistoricalAvatarContract(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.fields.length, 19);
  assert.equal(boot.allowedIdentityStates.length, 3);
  assert.equal(boot.deniedIdentityStates.length, 4);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER23/);
  assert.match(boot.disclosure, /AI-generated historical simulation/);

  const soft = er22SoftWireSnapshot(repoRoot);
  assert.equal(soft.er10PublicGeospatialMobilityPack.present, true);
  assert.equal(soft.er9PublicLawPolicyKnowledgePack.present, true);
  assert.equal(soft.er6HistoricalBusinessCaseAtlas.present, true);
  assert.equal(soft.er5GlobalHistoricalKnowledgeIngestion.present, true);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);
  // Preferred higher tips / ER8 ancient civ / ER4 rights may be absent → WAITING_DATA
  assert.equal(soft.er21DeviceDistribution.present, false);
  assert.equal(soft.er8AncientCivilizationsKnowledgePack.present, false);
  assert.equal(soft.er4RightsProvenanceGate.present, false);
  assert.equal(typeof soft.er14OfflineBrainPackager.present, 'boolean');

  const ev = returnEr22EvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    summary: 'historical avatar advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runHistoricalAvatarContractCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, HISTORICAL_AVATAR_CONTRACT_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of HISTORICAL_AVATAR_CONTRACT_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er5Hop = cycle.hops.find((h) => h.hop === 'er5_soft_wire');
  assert.ok(er5Hop);
  assert.equal(er5Hop.state, 'PASS');

  const er8Hop = cycle.hops.find((h) => h.hop === 'er8_soft_wire');
  assert.ok(er8Hop);
  assert.equal(er8Hop.state, 'WAITING_DATA');

  const er4Hop = cycle.hops.find((h) => h.hop === 'er4_soft_wire');
  assert.ok(er4Hop);
  assert.equal(er4Hop.state, 'WAITING_DATA');

  const er21Hop = cycle.hops.find((h) => h.hop === 'er21_soft_wire');
  assert.ok(er21Hop);
  assert.equal(er21Hop.state, 'WAITING_DATA');

  const er10Hop = cycle.hops.find((h) => h.hop === 'er10_soft_wire');
  assert.ok(er10Hop);
  assert.equal(er10Hop.state, 'PASS');
});
