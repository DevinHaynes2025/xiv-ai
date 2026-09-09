/**
 * 62L-ER37 — Federated Learning Research Candidate denial + honesty tests.
 *
 * Script: npm run test:62ler37
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ER37_LOCKS,
  ER_LAYER_TITLE,
  FEDERATED_LEARNING_JOB_FIELDS,
  FEDERATED_LEARNING_JOB_STATES,
  FEDERATED_LEARNING_RESEARCH_CANDIDATE_CYCLE,
  FEDERATED_PRIVACY_HONESTY,
  FEDERATED_TENANT_SCOPES,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PROMOTION_BOUNDARY,
  TENANT_ISOLATION_BOUNDARY,
  VEHICLE_MOBILE_BOUNDARY,
  assertEr37LocksIntact,
  er37SoftWireSnapshot,
  federatedLearningIsAutomaticallyPrivate,
  type Er37Actor,
} from './federated-learning-research-candidate-types.ts';

import {
  aggregateAcceptedUpdates,
  attemptAggregateQuarantined,
  attemptAssumeVehicleTelemetry,
  attemptAutomaticGlobalDeploy,
  attemptClaimFlAutomaticallyPrivate,
  attemptEnableL4Autonomy,
  attemptOrgSignalAutoGlobal,
  attemptPoolRawPrivateData,
  attemptSelfDrivingWithoutAuthorization,
  bootstrapFederatedLearningResearchCandidate,
  createFederatedLearningJob,
  enrollOptInDevice,
  evaluateFederatedCandidate,
  exampleResearchJob,
  probeGuardianRlsTenantUniverseIsolation,
  promoteFederatedCandidate,
  requireHumanApproval,
  returnEr37EvidenceToHomeBase,
  runFederatedLearningResearchCandidateCycle,
  runLocalTraining,
  submitBoundedUpdate,
} from './federated-learning-research-candidate-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er37Actor = {
  kind: 'federated_learning_coordinator',
  id: 'fl-coord-1',
  orgId: 'org-er37',
  tenantId: 'ten-er37',
  universeId: 'uni-er37',
  permissions: ['draft', 'coordinate'],
};

const human: Er37Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er37',
  tenantId: 'ten-er37',
  universeId: 'uni-er37',
  permissions: ['approve_consequential', 'promote_candidate'],
};

test('SoT label ER37 / #162; Federated Learning Research; next ER38 Monetization Council', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER37');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Federated Learning Research Candidate/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER38/);
  assert.match(NEXT_PHASE_TITLE, /Monetization Council/);
  assert.match(ER_LAYER_TITLE, /Real API Data Fabric/);
});

test('honesty locks: L4 false; FL ≠ auto-private; org ≠ auto-global; no auto global deploy', () => {
  assert.equal(assertEr37LocksIntact(), true);
  assert.equal(ER37_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER37_LOCKS.FEDERATED_LEARNING_AUTOMATICALLY_PRIVATE, false);
  assert.equal(ER37_LOCKS.ORG_PRIVATE_SIGNAL_AUTO_INFLUENCES_GLOBAL, false);
  assert.equal(ER37_LOCKS.AUTOMATIC_GLOBAL_DEPLOYMENT, false);
  assert.equal(ER37_LOCKS.AGGREGATE_QUARANTINED_UPDATES_AUTOMATICALLY, false);
  assert.equal(ER37_LOCKS.ASSUME_RAW_VEHICLE_TELEMETRY_AVAILABLE, false);
  assert.equal(ER37_LOCKS.TIP_LAND, false);
  assert.equal(ER37_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(federatedLearningIsAutomaticallyPrivate(), false);
  assert.equal(
    FEDERATED_PRIVACY_HONESTY.federatedLearningAutomaticallyPrivate,
    false,
  );
  assert.equal(
    TENANT_ISOLATION_BOUNDARY.orgPrivateTrainingSignalAutoInfluencesGlobal,
    false,
  );
  assert.equal(PROMOTION_BOUNDARY.automaticGlobalDeployment, false);
  assert.equal(
    VEHICLE_MOBILE_BOUNDARY.rawVehicleTelemetryAssumedAvailable,
    false,
  );
  assert.equal(attemptEnableL4Autonomy().denied, true);
  assert.equal(attemptClaimFlAutomaticallyPrivate().state, 'DENIED');
  assert.equal(attemptOrgSignalAutoGlobal().state, 'DENIED');
});

test('raw approved data stays local; only bounded artifacts exchanged', () => {
  const job = exampleResearchJob(agent);
  assert.equal(job.rawSourceRemainsLocal, true);
  assert.equal(job.privacyControls.claimsAutomaticallyPrivate, false);
  assert.equal(FEDERATED_LEARNING_JOB_FIELDS.length, 16);
  assert.equal(FEDERATED_LEARNING_JOB_STATES.length, 10);
  assert.equal(FEDERATED_TENANT_SCOPES.length, 3);

  const enrolled = enrollOptInDevice({
    job,
    deviceId: 'dev-a',
    explicitConsent: true,
    consentScope: 'ORGANIZATION_FEDERATED',
  });
  assert.ok(!('denied' in enrolled));
  assert.equal(enrolled.state, 'ENROLLED');

  const local = runLocalTraining({ job, deviceId: 'dev-a' });
  assert.ok(!('denied' in local));
  assert.equal(local.rawArtifactsExchanged, false);
  assert.ok(local.rawSourceClassesKeptLocal.includes('telemetry'));

  assert.equal(
    runLocalTraining({ job, deviceId: 'dev-a', attemptExfiltrateRaw: true })
      .state,
    'DENIED',
  );
  assert.equal(attemptPoolRawPrivateData().state, 'DENIED');

  const bounded = submitBoundedUpdate({
    job,
    deviceId: 'dev-a',
    updateId: 'u1',
    artifactType: 'model_deltas',
  });
  assert.ok(!('denied' in bounded));
  assert.equal(bounded.containsRawSourceData, false);
  assert.equal(bounded.disposition, 'ACCEPTED_FOR_AGGREGATION');

  assert.equal(
    submitBoundedUpdate({
      job,
      deviceId: 'dev-a',
      updateId: 'u-raw',
      artifactType: 'model_deltas',
      containsRawSourceData: true,
    }).state,
    'DENIED',
  );
});

test('org federated signal cannot automatically influence global; scopes isolated', () => {
  const orgJob = createFederatedLearningJob({
    actor: agent,
    campaignId: 'org-1',
    modelOrPolicyVersion: 'v1',
    participatingDeviceClass: 'laptop',
    consentScope: 'ORGANIZATION_FEDERATED',
    approvedDataClass: 'approved_local_features',
    localTrainingObjective: 'ranker',
    localEpochsOrSteps: 1,
    updateType: 'model_delta',
    aggregationMethod: 'fedavg',
    minimumParticipantCount: 1,
    evaluationDataset: 'holdout',
    rollbackVersion: 'v0',
    attemptOrgAutoGlobal: true,
  });
  assert.equal('denied' in orgJob && orgJob.state, 'DENIED');

  const globalDenied = createFederatedLearningJob({
    actor: agent,
    campaignId: 'global-1',
    modelOrPolicyVersion: 'v1',
    participatingDeviceClass: 'laptop',
    consentScope: 'GLOBAL_OPT_IN_RESEARCH',
    approvedDataClass: 'approved_local_features',
    localTrainingObjective: 'ranker',
    localEpochsOrSteps: 1,
    updateType: 'model_delta',
    aggregationMethod: 'fedavg',
    minimumParticipantCount: 1,
    evaluationDataset: 'holdout',
    rollbackVersion: 'v0',
  });
  assert.equal('denied' in globalDenied && globalDenied.state, 'DENIED');

  const globalActor: Er37Actor = {
    ...agent,
    permissions: [...agent.permissions, 'global_opt_in_research'],
  };
  const globalOk = createFederatedLearningJob({
    actor: globalActor,
    campaignId: 'global-2',
    modelOrPolicyVersion: 'v1',
    participatingDeviceClass: 'laptop',
    consentScope: 'GLOBAL_OPT_IN_RESEARCH',
    approvedDataClass: 'approved_local_features',
    localTrainingObjective: 'ranker',
    localEpochsOrSteps: 1,
    updateType: 'model_delta',
    aggregationMethod: 'fedavg',
    minimumParticipantCount: 1,
    evaluationDataset: 'holdout',
    rollbackVersion: 'v0',
  });
  assert.ok(!('denied' in globalOk));
  assert.equal(globalOk.consentScope, 'GLOBAL_OPT_IN_RESEARCH');
  assert.equal(attemptOrgSignalAutoGlobal().state, 'DENIED');
});

test('suspicious contributions → QUARANTINED; not aggregated automatically', () => {
  const job = exampleResearchJob(agent);
  const good = submitBoundedUpdate({
    job,
    deviceId: 'd1',
    updateId: 'good',
    artifactType: 'evaluation_metrics',
  });
  const bad = submitBoundedUpdate({
    job,
    deviceId: 'd-sybil',
    updateId: 'bad',
    artifactType: 'gradients_or_aggregates',
    adversarialFlags: ['sybil_like_abuse', 'extreme_outlier_updates'],
  });
  assert.ok(!('denied' in good));
  assert.ok(!('denied' in bad));
  assert.equal(bad.disposition, 'QUARANTINED');

  const stale = submitBoundedUpdate({
    job,
    deviceId: 'd-stale',
    updateId: 'stale',
    artifactType: 'model_deltas',
    staleModelVersion: true,
  });
  assert.ok(!('denied' in stale));
  assert.equal(stale.disposition, 'QUARANTINED');

  assert.equal(attemptAggregateQuarantined().state, 'DENIED');

  const good2 = submitBoundedUpdate({
    job,
    deviceId: 'd2',
    updateId: 'good2',
    artifactType: 'model_deltas',
  });
  assert.ok(!('denied' in good2));

  const forced = aggregateAcceptedUpdates({
    job,
    submissions: [good, bad, good2],
    forceIncludeQuarantined: true,
  });
  assert.equal(forced.state, 'DENIED');

  const agg = aggregateAcceptedUpdates({
    job,
    submissions: [good, bad, good2, stale],
  });
  assert.ok(!('denied' in agg));
  assert.equal(agg.includedQuarantined, false);
  assert.deepEqual([...agg.aggregatedUpdateIds].sort(), ['good', 'good2']);
  assert.ok(agg.quarantinedUpdateIds.includes('bad'));
  assert.ok(agg.quarantinedUpdateIds.includes('stale'));
});

test('promotion requires evidence + human/policy; no automatic global deployment', () => {
  const job = exampleResearchJob(agent);
  const s1 = submitBoundedUpdate({
    job,
    deviceId: 'd1',
    updateId: 'a',
    artifactType: 'model_deltas',
  });
  const s2 = submitBoundedUpdate({
    job,
    deviceId: 'd2',
    updateId: 'b',
    artifactType: 'model_deltas',
  });
  assert.ok(!('denied' in s1) && !('denied' in s2));
  const agg = aggregateAcceptedUpdates({ job, submissions: [s1, s2] });
  assert.ok(!('denied' in agg));

  const rejected = evaluateFederatedCandidate({
    job,
    aggregation: agg,
    measurableQualityImprovement: false,
    unacceptableRegression: true,
    privacySecurityEvidenceAccepted: false,
    reproducible: false,
    candidateVersion: 'x',
  });
  assert.ok(!('denied' in rejected));
  assert.equal(rejected.state, 'REJECTED');

  const candidate = evaluateFederatedCandidate({
    job,
    aggregation: agg,
    measurableQualityImprovement: true,
    unacceptableRegression: false,
    privacySecurityEvidenceAccepted: true,
    reproducible: true,
    candidateVersion: 'routing-policy-v0.3.2-fl-candidate',
  });
  assert.ok(!('denied' in candidate));
  assert.equal(candidate.state, 'CANDIDATE');

  assert.equal(
    promoteFederatedCandidate({
      job,
      evaluation: candidate,
      actor: agent,
      skipHumanOrPolicy: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptAutomaticGlobalDeploy().state, 'DENIED');
  assert.equal(
    promoteFederatedCandidate({
      job,
      evaluation: candidate,
      actor: human,
      attemptAutomaticGlobalDeploy: true,
    }).state,
    'DENIED',
  );

  const promoted = promoteFederatedCandidate({
    job,
    evaluation: candidate,
    actor: human,
  });
  assert.ok(!('denied' in promoted));
  assert.equal(promoted.automaticGlobalDeployment, false);
  assert.equal(promoted.humanOrPolicyApproved, true);
});

test('vehicle telemetry not assumed; self-driving remains research unless authorized', () => {
  const job = exampleResearchJob(agent);
  assert.equal(job.vehicleTelemetryAssumed, false);
  assert.equal(attemptAssumeVehicleTelemetry().state, 'DENIED');
  assert.equal(attemptSelfDrivingWithoutAuthorization().state, 'DENIED');
  assert.equal(
    createFederatedLearningJob({
      actor: agent,
      campaignId: 'veh',
      modelOrPolicyVersion: 'v1',
      participatingDeviceClass: 'vehicle',
      consentScope: 'DEVICE_ONLY',
      approvedDataClass: 'approved_sim_features',
      localTrainingObjective: 'sim',
      localEpochsOrSteps: 1,
      updateType: 'policy_delta',
      aggregationMethod: 'none',
      minimumParticipantCount: 1,
      evaluationDataset: 'sim',
      rollbackVersion: 'v0',
      attemptAssumeVehicleTelemetry: true,
    }).state,
    'DENIED',
  );
  assert.equal(
    runLocalTraining({
      job,
      deviceId: 'car-1',
      attemptUseAssumedVehicleTelemetry: true,
    }).state,
    'DENIED',
  );
  assert.equal(
    runLocalTraining({
      job,
      deviceId: 'car-1',
      attemptMobilityWithoutOptIn: true,
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; ER36/ER35/ER34/ER33/ER32/ER4 WAITING_DATA ok', () => {
  const boot = bootstrapFederatedLearningResearchCandidate(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.fields.length, 16);
  assert.equal(boot.states.length, 10);
  assert.equal(boot.scopes.length, 3);
  assert.equal(boot.flAutomaticallyPrivate, false);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER38/);

  const soft = er37SoftWireSnapshot(repoRoot);
  // Preferred predecessors absent on this tip → WAITING_DATA (not FAIL)
  assert.equal(soft.er36PrivacySafeContribution.present, false);
  assert.equal(soft.er35ModelDataPackManifest.present, false);
  assert.equal(soft.er34CapabilityManifest.present, false);
  assert.equal(soft.er33RuntimeUpdateChannel.present, false);
  assert.equal(soft.er32EdgeVehicleRuntimeCandidate.present, false);
  assert.equal(soft.er4RightsProvenanceGate.present, false);

  const ev = returnEr37EvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    summary: 'federated learning research advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  const cycle = runFederatedLearningResearchCandidateCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(
    cycle.hops.length,
    FEDERATED_LEARNING_RESEARCH_CANDIDATE_CYCLE.length,
  );
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of FEDERATED_LEARNING_RESEARCH_CANDIDATE_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  for (const softHop of [
    'er36_soft_wire',
    'er35_soft_wire',
    'er34_soft_wire',
    'er33_soft_wire',
    'er32_soft_wire',
    'er4_soft_wire',
  ] as const) {
    const found = cycle.hops.find((h) => h.hop === softHop);
    assert.ok(found, softHop);
    assert.equal(found.state, 'WAITING_DATA');
  }

  const quarantineHop = cycle.hops.find(
    (h) => h.hop === 'quarantine_suspicious_contribution',
  );
  assert.ok(quarantineHop);
  assert.equal(quarantineHop.state, 'QUARANTINED');

  const l4Hop = cycle.hops.find((h) => h.hop === 'l4_autonomy_false');
  assert.ok(l4Hop);
  assert.equal(l4Hop.state, 'PASS');
});
