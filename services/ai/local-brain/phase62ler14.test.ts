/**
 * 62L-ER14 — Offline Brain Packager denial + honesty tests.
 *
 * Script: npm run test:62ler14
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ER14_AGENT_BOUNDS,
  ER14_DB_CANDIDATES_STATUS,
  ER14_LOCKS,
  ER14_MAY,
  ER14_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  OFFLINE_BRAIN_PACKAGER_CYCLE,
  OFFLINE_BRAIN_TRUTH_BOUNDARY,
  OFFLINE_PACK_CATEGORIES,
  OFFLINE_PACK_CORE_FLOW,
  OFFLINE_PACK_FIELDS,
  OFFLINE_RUNTIME_FLOW,
  OFFLINE_STORAGE_TIERS,
  OFFLINE_SYNC_RECONNECT_FLOW,
  assertEr14LocksIntact,
  er14SoftWireSnapshot,
  mayAutoPromoteLocalFindingsToGlobalBrain,
  mayPretendCachedIsLiveCurrent,
  offlineModeAlwaysReported,
  poweredOffMeansOfflineStopped,
  type Er14Actor,
} from './offline-brain-packager-types.ts';

import {
  attemptAgentsWorkingWhenPoweredOff,
  attemptAutoPromoteToGlobalBrain,
  attemptCrossTenantOrgPackLeak,
  attemptInstallWithoutAuthorization,
  attemptPackageHiddenChainOfThought,
  attemptPiratedOrRestrictedArchives,
  attemptPretendCachedIsLive,
  attemptRecommendAsAct,
  bootstrapOfflineBrainPackager,
  buildOfflinePack,
  devicePowerStatus,
  exampleCorePack,
  installOfflinePack,
  probeGuardianRlsTenantUniverseIsolation,
  queryOfflinePack,
  reconnectSyncMergeCandidate,
  requireHumanApproval,
  returnEvidenceToHomeBase,
  revokeOfflinePack,
  runOfflineBrainPackagerCycle,
} from './offline-brain-packager-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er14Actor = {
  kind: 'offline_brain_packager',
  id: 'obp-1',
  orgId: 'org-er14',
  tenantId: 'ten-er14',
  universeId: 'uni-er14',
  permissions: ['draft'],
};

const human: Er14Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er14',
  tenantId: 'ten-er14',
  universeId: 'uni-er14',
  permissions: ['approve_consequential'],
};

test('SoT label ER14 / #162; Offline Brain Packager; next ER15 sync contract', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER14');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Offline Brain Packager/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER15/);
  assert.match(NEXT_PHASE_TITLE, /Offline \/ Online Sync Contract/);
  assert.match(ER_LAYER_TITLE, /Offline\/Online Brain Sync/);
});

test('honesty locks: L4 false; no live pretence; no auto global promote; DB NOT_APPLIED', () => {
  assert.equal(assertEr14LocksIntact(), true);
  assert.equal(ER14_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER14_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER14_LOCKS.PRETEND_CACHED_IS_LIVE_CURRENT, false);
  assert.equal(ER14_LOCKS.AUTO_PROMOTE_LOCAL_FINDINGS_TO_GLOBAL_BRAIN, false);
  assert.equal(ER14_LOCKS.PACKAGE_HIDDEN_CHAIN_OF_THOUGHT, false);
  assert.equal(ER14_LOCKS.INSTALL_WITHOUT_EXPLICIT_AUTHORIZATION, false);
  assert.equal(ER14_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(offlineModeAlwaysReported(), true);
  assert.equal(mayPretendCachedIsLiveCurrent(), false);
  assert.equal(mayAutoPromoteLocalFindingsToGlobalBrain(), false);
  assert.equal(poweredOffMeansOfflineStopped(), true);
  assert.equal(ER14_AGENT_BOUNDS.mayAutoPromoteToGlobalBrain, false);
  assert.equal(OFFLINE_BRAIN_TRUTH_BOUNDARY.userDataEncryptedLocally, true);
});

test('pack fields + flow + categories + tiers + runtime/sync flows encoded', () => {
  assert.equal(OFFLINE_PACK_FIELDS.length, 18);
  assert.ok(OFFLINE_PACK_FIELDS.includes('packId'));
  assert.ok(OFFLINE_PACK_FIELDS.includes('encryptionState'));
  assert.ok(OFFLINE_PACK_FIELDS.includes('revocationState'));
  assert.deepEqual([...OFFLINE_PACK_CORE_FLOW], [
    'approved_online_knowledge',
    'rights_check',
    'select',
    'dedupe_compress',
    'encrypt',
    'sign',
    'compatibility_test',
    'user_authorized_install',
    'local_index',
  ]);
  assert.equal(OFFLINE_PACK_CATEGORIES.length, 10);
  assert.ok(OFFLINE_PACK_CATEGORIES.includes('supply_chain_knowledge'));
  assert.ok(OFFLINE_PACK_CATEGORIES.includes('quantum_research_notebooks'));
  assert.deepEqual([...OFFLINE_STORAGE_TIERS], [
    'CORE',
    'DOMAIN',
    'ORGANIZATION',
    'RESEARCH',
  ]);
  assert.deepEqual([...OFFLINE_RUNTIME_FLOW], [
    'agent',
    'local_permissions',
    'local_pack',
    'local_model_runtime',
    'structured_result',
    'checkpoint',
  ]);
  assert.deepEqual([...OFFLINE_SYNC_RECONNECT_FLOW], [
    'local_checkpoint',
    'conflict_freshness_check',
    'home_base',
    'review',
    'merge_candidate',
  ]);
  assert.ok(ER14_MAY.includes('serve_offline_queries_with_OFFLINE_MODE_true_and_local_checkpoint'));
  assert.ok(ER14_MUST_NOT.includes('automatically_promote_local_findings_into_the_global_brain'));
});

test('rights+encrypt+sign pack; install requires auth; offline query OFFLINE_MODE', () => {
  assert.equal(
    buildOfflinePack({
      actor: agent,
      packId: 'p-bad',
      packVersion: '1',
      targetPlatform: 'linux',
      architecture: 'x86_64',
      category: 'science_engineering',
      storageTier: 'RESEARCH',
      approvedDomains: ['x'],
      sourceManifests: ['s'],
      licenseId: 'none',
      rightsCleared: false,
      copyrightAuthorized: true,
    }).state,
    'DENIED',
  );

  const pack = exampleCorePack(agent);
  assert.equal(pack.encryptionState, 'SIGNED_AND_ENCRYPTED');
  assert.ok(pack.signature);
  assert.equal(pack.containsHiddenChainOfThought, false);

  assert.equal(
    installOfflinePack({
      actor: agent,
      pack,
      explicitAuthorization: false,
    }).state,
    'DENIED',
  );

  const installed = installOfflinePack({
    actor: agent,
    pack,
    explicitAuthorization: true,
    authorizerId: human.id,
  });
  assert.ok(!('denied' in installed));
  assert.equal(installed.installed, true);

  const q = queryOfflinePack({
    actor: agent,
    pack: installed,
    query: 'local-index-lookup',
  });
  assert.ok(!('denied' in q));
  assert.equal(q.OFFLINE_MODE, true);
  assert.equal(q.claimedLiveCurrent, false);
  assert.equal(q.checkpoint.offlineMode, true);

  assert.equal(
    queryOfflinePack({
      actor: agent,
      pack: installed,
      query: 'x',
      pretendLiveCurrent: true,
    }).state,
    'DENIED',
  );
});

test('reconnect merge candidate only; revoke traces dependents; OFFLINE_STOPPED', () => {
  const pack = installOfflinePack({
    actor: agent,
    pack: exampleCorePack(agent),
    explicitAuthorization: true,
  });
  assert.ok(!('denied' in pack));
  const q = queryOfflinePack({
    actor: agent,
    pack,
    query: 'checkpoint-me',
  });
  assert.ok(!('denied' in q));

  assert.equal(
    reconnectSyncMergeCandidate({
      actor: agent,
      checkpoint: q.checkpoint,
      pack,
      autoPromoteToGlobalBrain: true,
    }).state,
    'DENIED',
  );

  const merge = reconnectSyncMergeCandidate({
    actor: agent,
    checkpoint: q.checkpoint,
    pack,
  });
  assert.ok(!('denied' in merge));
  assert.equal(merge.status, 'MERGE_CANDIDATE');
  assert.equal(merge.autoPromotedToGlobalBrain, false);
  assert.equal(merge.requiresHomeBaseReview, true);

  const home = returnEvidenceToHomeBase({
    actor: agent,
    mergeCandidate: merge,
  });
  assert.ok(!('denied' in home));
  assert.equal(home.autoPromotedToGlobalBrain, false);

  const dep = {
    ...pack,
    packId: 'pack-dep',
    dependentPackIds: [] as string[],
  };
  const revoked = revokeOfflinePack({
    pack: { ...pack, dependentPackIds: ['pack-dep'] },
    revokedSourceId: 'src-core-manifest',
    dependentPacks: [dep],
  });
  assert.equal(revoked.pack.revocationState, 'REVOKED');
  assert.equal(revoked.dependents[0]?.revocationState, 'SOURCE_REVOKED_DEPENDENT');
  assert.ok(revoked.dependents[0]?.revokedSourceIds.includes('src-core-manifest'));

  const off = devicePowerStatus({ devicePowerState: 'POWERED_OFF' });
  assert.ok(!('denied' in off));
  assert.equal(off.runtimeStatus, 'OFFLINE_STOPPED');
  assert.equal(off.agentsStillWorking, false);
  assert.equal(attemptAgentsWorkingWhenPoweredOff().state, 'DENIED');
});

test('privacy/security denies + guardian isolation hold', () => {
  assert.equal(attemptPackageHiddenChainOfThought().state, 'DENIED');
  assert.equal(attemptPiratedOrRestrictedArchives().state, 'DENIED');
  assert.equal(attemptCrossTenantOrgPackLeak().state, 'DENIED');
  assert.equal(attemptInstallWithoutAuthorization().state, 'DENIED');
  assert.equal(attemptAutoPromoteToGlobalBrain().state, 'DENIED');
  assert.equal(attemptPretendCachedIsLive().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  const foreign: Er14Actor = {
    ...agent,
    tenantId: 'other-tenant',
    universeId: 'other-universe',
    orgId: 'other-org',
  };
  const pack = exampleCorePack(agent);
  assert.equal(
    installOfflinePack({
      actor: foreign,
      pack: { ...pack, storageTier: 'ORGANIZATION' },
      explicitAuthorization: true,
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; ER13/EQ14 WAITING_DATA; ER2/EQ16 PRESENT', () => {
  const boot = bootstrapOfflineBrainPackager(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.packFields.length, 18);
  assert.equal(boot.categories.length, 10);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER15/);
  assert.equal(boot.offlineModeFlags.OFFLINE_MODE, true);

  const soft = er14SoftWireSnapshot(repoRoot);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);
  assert.equal(soft.eq16SoftwareWormholeRouter.present, true);
  assert.equal(soft.eq15PathwayPlasticity.present, true);
  assert.equal(soft.eq14NeuralPathwayArchitectureGraph.present, false);
  assert.match(soft.eq14NeuralPathwayArchitectureGraph.note, /WAITING_DATA/);
  assert.equal(soft.er13OnlineBrainIndex.present, false);
  assert.match(soft.er13OnlineBrainIndex.note, /WAITING_DATA/);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runOfflineBrainPackagerCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, OFFLINE_BRAIN_PACKAGER_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of OFFLINE_BRAIN_PACKAGER_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er13Hop = cycle.hops.find((h) => h.hop === 'er13_soft_wire');
  assert.ok(er13Hop);
  assert.equal(er13Hop.state, 'WAITING_DATA');

  const eq14Hop = cycle.hops.find((h) => h.hop === 'eq14_soft_wire');
  assert.ok(eq14Hop);
  assert.equal(eq14Hop.state, 'WAITING_DATA');

  const er2Hop = cycle.hops.find((h) => h.hop === 'er2_soft_wire');
  assert.ok(er2Hop);
  assert.equal(er2Hop.state, 'PASS');

  const eq16Hop = cycle.hops.find((h) => h.hop === 'eq16_soft_wire');
  assert.ok(eq16Hop);
  assert.equal(eq16Hop.state, 'PASS');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.receipt.OFFLINE_MODE, true);
  assert.equal(cycle.receipt.autoPromotedToGlobalBrain, false);
});
