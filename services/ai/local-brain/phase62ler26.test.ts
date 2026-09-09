/**
 * 62L-ER26 — Avatar Provenance Drawer denial + honesty tests.
 *
 * Script: npm run test:62ler26
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  AVATAR_PROVENANCE_DRAWER_CYCLE,
  AVATAR_PROVENANCE_DRAWER_FIELDS,
  AVATAR_PROVENANCE_TRUTH_BOUNDARY,
  CLAIM_INSPECTION_CHAIN,
  ER26_AGENT_BOUNDS,
  ER26_DB_CANDIDATES_STATUS,
  ER26_LOCKS,
  ER26_MAY,
  ER26_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_EVIDENCE_LABELS,
  HONESTY_BANNER,
  LIVING_PERSON_EXTRA_FIELDS,
  NEXT_PHASE_TITLE,
  PROVENANCE_DRAWER_CORE_FLOW,
  UX_SEPARATION_AXES,
  assertEr26LocksIntact,
  er26SoftWireSnapshot,
  type Er26Actor,
} from './avatar-provenance-drawer-types.ts';

import {
  attemptContinueUsingRevokedMaterial,
  attemptCrossTenantLeak,
  attemptDeceptiveIdentity,
  attemptFabricatedSources,
  attemptHiddenProvenance,
  attemptUnauthorizedVoiceLikeness,
  bootstrapAvatarProvenanceDrawer,
  buildLivingPersonProvenanceDrawer,
  exampleHistoricalDrawer,
  exampleLivingDrawer,
  inspectClaimChain,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  revokeSourceOrConsent,
  runAvatarProvenanceDrawerCycle,
} from './avatar-provenance-drawer-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er26Actor = {
  kind: 'avatar_provenance_drawer',
  id: 'apd-1',
  orgId: 'org-er26',
  tenantId: 'ten-er26',
  universeId: 'uni-er26',
  permissions: ['draft'],
};

const human: Er26Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er26',
  tenantId: 'ten-er26',
  universeId: 'uni-er26',
  permissions: ['approve_consequential'],
};

test('SoT label ER26 / #162; Avatar Provenance Drawer; next ER27 Speculative / Extraterrestrial', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER26');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Avatar Provenance Drawer/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER27/);
  assert.match(NEXT_PHASE_TITLE, /Speculative \/ Extraterrestrial Research Layer/);
  assert.match(ER_LAYER_TITLE, /Historical Avatar/);
});

test('honesty locks: L4 false; no hidden/fabricated provenance; separations; DB NOT_APPLIED', () => {
  assert.equal(assertEr26LocksIntact(), true);
  assert.equal(ER26_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER26_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER26_LOCKS.HIDDEN_PROVENANCE, false);
  assert.equal(ER26_LOCKS.FABRICATED_SOURCES, false);
  assert.equal(ER26_LOCKS.DECEPTIVE_IDENTITY, false);
  assert.equal(ER26_LOCKS.UNAUTHORIZED_VOICE_LIKENESS, false);
  assert.equal(ER26_LOCKS.CONTINUE_USING_REVOKED_MATERIAL, false);
  assert.equal(ER26_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    AVATAR_PROVENANCE_TRUTH_BOUNDARY.separatesHistoricalRecordFromAiInterpretation,
    true,
  );
  assert.equal(
    AVATAR_PROVENANCE_TRUTH_BOUNDARY.separatesActualPersonFromAiRepresentative,
    true,
  );
  assert.equal(ER26_AGENT_BOUNDS.mayHideProvenance, false);
  assert.equal(ER26_AGENT_BOUNDS.automaticAuthority, false);
  assert.ok(ER26_MAY.length >= 5);
  assert.ok(ER26_MUST_NOT.includes('fabricate_sources'));
});

test('drawer fields + evidence labels + living extras + flow + UX axes encoded', () => {
  assert.equal(AVATAR_PROVENANCE_DRAWER_FIELDS[0], 'avatarId');
  assert.equal(AVATAR_PROVENANCE_DRAWER_FIELDS.length, 17);
  assert.deepEqual([...HISTORICAL_EVIDENCE_LABELS], [
    'DOCUMENTED',
    'SCHOLARLY_INTERPRETATION',
    'PLAUSIBLE_INFERENCE',
    'DISPUTED',
    'UNKNOWN',
  ]);
  assert.deepEqual([...LIVING_PERSON_EXTRA_FIELDS], [
    'VOICE_AUTHORIZED',
    'LIKENESS_AUTHORIZED',
    'DELEGATION_SCOPE',
    'CONSENT_EXPIRY',
  ]);
  assert.equal(PROVENANCE_DRAWER_CORE_FLOW[0], 'avatar_answer');
  assert.equal(PROVENANCE_DRAWER_CORE_FLOW[2], 'provenance_drawer');
  assert.deepEqual([...CLAIM_INSPECTION_CHAIN], [
    'claim',
    'source',
    'evidence_class',
    'uncertainty',
  ]);
  assert.equal(UX_SEPARATION_AXES.length, 2);
});

test('historical + living drawers; record vs interpretation; person vs AI representative', () => {
  const hist = exampleHistoricalDrawer(agent);
  assert.equal(hist.avatarType, 'HISTORICAL');
  assert.equal(hist.identityKind, 'AI_REPRESENTATIVE');
  assert.equal(hist.consentState, 'NOT_APPLICABLE_HISTORICAL');
  assert.ok(hist.contentKindSeparation.historicalRecord.length > 0);
  assert.ok(hist.contentKindSeparation.aiGeneratedInterpretation.length > 0);
  assert.equal(hist.hiddenProvenance, false);
  assert.equal(hist.fabricatedSources, false);

  const privateSrc = hist.sources.find((s) => s.sourceId === 'src-sketch-engine');
  assert.ok(privateSrc);
  assert.equal(privateSrc.privateText, null);
  assert.match(privateSrc.internalCitationRef, /^cite:\/\//);

  const living = exampleLivingDrawer(agent);
  assert.equal(living.avatarType, 'LIVING_PERSON_REPRESENTATIVE');
  assert.equal(living.identityKind, 'AI_REPRESENTATIVE');
  assert.ok(living.livingPersonExtras);
  assert.equal(living.livingPersonExtras.VOICE_AUTHORIZED, true);
  assert.equal(living.livingPersonExtras.LIKENESS_AUTHORIZED, true);

  const deceptive = buildLivingPersonProvenanceDrawer({
    actor: agent,
    avatarId: 'avatar-bad',
    sourceCorpusVersion: 'v0',
    keySourcesUsed: ['s1'],
    sourceDates: ['2024'],
    rightsLicenseState: 'AUTHORIZED',
    consentState: 'AUTHORIZED',
    documentedFacts: ['x'],
    inferredContent: [],
    disputedClaims: [],
    uncertaintyLevel: 'low',
    modelRuntimeUsed: 'm',
    reviewerState: 'UNREVIEWED',
    livingPersonExtras: {
      VOICE_AUTHORIZED: true,
      LIKENESS_AUTHORIZED: true,
      DELEGATION_SCOPE: 'x',
      CONSENT_EXPIRY: null,
    },
    claims: [],
    sources: [],
    representAsActualPerson: true,
  });
  assert.equal('denied' in deceptive, true);

  const inspected = inspectClaimChain({ drawer: hist, claimId: 'c2' });
  assert.ok(!('denied' in inspected));
  assert.equal(inspected.evidenceClass, 'PLAUSIBLE_INFERENCE');
  assert.equal(inspected.contentKind, 'AI_GENERATED_INTERPRETATION');
});

test('revocation updates drawer + blocks future use; private text stays redacted', () => {
  const hist = exampleHistoricalDrawer(agent);
  const revoked = revokeSourceOrConsent({
    actor: agent,
    avatarId: hist.avatarId,
    sourceId: 'src-sketch-engine',
    mode: 'SOURCE_REMOVED',
  });
  assert.ok(!('denied' in revoked));
  assert.equal(revoked.revocationStatus, 'SOURCE_REMOVED');
  assert.ok(
    revoked.blockedSourceIdsForFutureGeneration.includes('src-sketch-engine'),
  );

  const cont = attemptContinueUsingRevokedMaterial({
    actor: agent,
    avatarId: hist.avatarId,
    sourceId: 'src-sketch-engine',
  });
  assert.equal(cont.denied, true);

  const living = exampleLivingDrawer(agent);
  const consentRevoked = revokeSourceOrConsent({
    actor: agent,
    avatarId: living.avatarId,
    revokeConsent: true,
    mode: 'REVOKED',
  });
  assert.ok(!('denied' in consentRevoked));
  assert.equal(consentRevoked.revocationStatus, 'REVOKED');
  assert.equal(consentRevoked.consentState, 'REVOKED');
});

test('boundary denies: fabricated / hidden / deceptive / voice-likeness / cross-tenant', () => {
  assert.equal(attemptFabricatedSources({ actor: agent }).denied, true);
  assert.equal(attemptHiddenProvenance({ actor: agent }).denied, true);
  assert.equal(attemptDeceptiveIdentity({ actor: agent }).denied, true);
  assert.equal(attemptUnauthorizedVoiceLikeness({ actor: agent }).denied, true);

  const hist = exampleHistoricalDrawer(agent);
  const foreign: Er26Actor = {
    ...agent,
    id: 'foreign',
    tenantId: 'ten-other',
    universeId: 'uni-other',
  };
  assert.equal(
    attemptCrossTenantLeak({ actor: foreign, drawer: hist }).denied,
    true,
  );
  const iso = probeGuardianRlsTenantUniverseIsolation({
    actor: agent,
    foreign,
    drawer: hist,
  });
  assert.ok('isolated' in iso && iso.isolated);
});

test('bootstrap + soft-wire + cycle; ER25/ER24/ER23 WAITING_DATA; ER22 PRESENT', () => {
  const boot = bootstrapAvatarProvenanceDrawer(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.drawerFields.length, 17);
  assert.equal(boot.historicalEvidenceLabels.length, 5);
  assert.equal(boot.livingPersonExtraFields.length, 4);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER27/);

  const soft = er26SoftWireSnapshot(repoRoot);
  assert.equal(soft.er22HistoricalAvatarContract.present, true);
  assert.equal(soft.er22Report.present, true);
  assert.equal(soft.er23DeceasedPersonHistoricalAvatarBoundary.present, false);
  assert.match(
    soft.er23DeceasedPersonHistoricalAvatarBoundary.note,
    /WAITING_DATA/,
  );
  assert.equal(soft.er24LivingPersonAvatarConsent.present, false);
  assert.match(soft.er24LivingPersonAvatarConsent.note, /WAITING_DATA/);
  assert.equal(soft.er25AvatarEvidenceClassification.present, false);
  assert.match(soft.er25AvatarEvidenceClassification.note, /WAITING_DATA/);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runAvatarProvenanceDrawerCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, AVATAR_PROVENANCE_DRAWER_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of AVATAR_PROVENANCE_DRAWER_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er25Hop = cycle.hops.find((h) => h.hop === 'er25_soft_wire');
  assert.ok(er25Hop);
  assert.equal(er25Hop.state, 'WAITING_DATA');

  const er24Hop = cycle.hops.find((h) => h.hop === 'er24_soft_wire');
  assert.ok(er24Hop);
  assert.equal(er24Hop.state, 'WAITING_DATA');

  const er23Hop = cycle.hops.find((h) => h.hop === 'er23_soft_wire');
  assert.ok(er23Hop);
  assert.equal(er23Hop.state, 'WAITING_DATA');

  const er22Hop = cycle.hops.find((h) => h.hop === 'er22_soft_wire');
  assert.ok(er22Hop);
  assert.equal(er22Hop.state, 'PASS');

  const er2Hop = cycle.hops.find((h) => h.hop === 'er2_soft_wire');
  assert.ok(er2Hop);
  assert.equal(er2Hop.state, 'PASS');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.receipt.L4_AUTONOMY_ENABLED, false);
  assert.equal(cycle.receipt.futureGenerationBlocked, true);
  assert.equal(cycle.receipt.privateTextExposed, false);
  assert.equal(cycle.receipt.revocationStatus, 'SOURCE_REMOVED');
});
