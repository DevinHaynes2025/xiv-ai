/**
 * 62L-ER5 — Global Historical Knowledge Ingestion Pipeline denial + honesty tests.
 *
 * Script: npm run test:62ler5
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  BRAIN_EXPANSION_TARGETS,
  EVIDENCE_CLASSES,
  ER5_AGENT_BOUNDS,
  ER5_DB_CANDIDATES_STATUS,
  ER5_LOCKS,
  ER5_MAY,
  ER5_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GLOBAL_HISTORICAL_KNOWLEDGE_INGESTION_CYCLE,
  HONESTY_BANNER,
  INGESTION_BOUNDARY,
  INGESTION_CORE_PROGRESSION,
  INGESTION_JOB_FIELDS,
  INGESTION_PIPELINE_STAGES,
  INGESTION_PROMOTION_STATES,
  NEXT_PHASE_TITLE,
  PROMOTED_CLAIM_FIELDS,
  assertEr5LocksIntact,
  er5SoftWireSnapshot,
  type Er5Actor,
} from './global-historical-knowledge-ingestion-types.ts';

import {
  advanceIngestionState,
  attemptAutoPromoteDiscoveryToTruth,
  attemptCrossTenantPrivatePooling,
  attemptPersistHiddenChainOfThought,
  attemptPiratedFullWorks,
  attemptPrivateOrLeakedDatabases,
  attemptRecommendAsAct,
  attemptRightsBypass,
  bootstrapGlobalHistoricalKnowledgeIngestion,
  createDiscoveredJob,
  dedupeClusterClaims,
  exampleReviewReadyJob,
  probeGuardianRlsTenantUniverseIsolation,
  promoteAfterReview,
  rightsCheckGate,
  requireHumanApproval,
  returnEr5EvidenceToHomeBase,
  runGlobalHistoricalKnowledgeIngestionCycle,
} from './global-historical-knowledge-ingestion-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er5Actor = {
  kind: 'ingestion_pipeline',
  id: 'ghki-1',
  orgId: 'org-er5',
  tenantId: 'ten-er5',
  universeId: 'uni-er5',
  permissions: ['draft'],
};

const human: Er5Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er5',
  tenantId: 'ten-er5',
  universeId: 'uni-er5',
  permissions: ['approve_consequential'],
};

test('SoT label ER5 / #162; Global Historical Knowledge Ingestion; next ER6 Atlas v2', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER5');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Global Historical Knowledge Ingestion/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER6/);
  assert.match(NEXT_PHASE_TITLE, /Historical Business Case Atlas/);
  assert.match(ER_LAYER_TITLE, /Global Historical Knowledge Ingestion/);
});

test('honesty locks: L4 false; no rights bypass; no auto-promote-to-truth; DB NOT_APPLIED', () => {
  assert.equal(assertEr5LocksIntact(), true);
  assert.equal(ER5_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER5_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER5_LOCKS.RIGHTS_BYPASS, false);
  assert.equal(ER5_LOCKS.AUTO_PROMOTE_DISCOVERY_TO_TRUTH, false);
  assert.equal(ER5_LOCKS.PIRATED_FULL_WORKS, false);
  assert.equal(ER5_LOCKS.PRIVATE_OR_LEAKED_DATABASES, false);
  assert.equal(ER5_LOCKS.CROSS_TENANT_PRIVATE_DATA_POOLING, false);
  assert.equal(ER5_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT, false);
  assert.equal(ER5_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(INGESTION_BOUNDARY.mayBypassRightsCheck, false);
  assert.equal(ER5_AGENT_BOUNDS.mayAutoPromoteDiscoveryToTruth, false);
});

test('states + pipeline + job fields + evidence classes + brain targets encoded', () => {
  assert.deepEqual([...INGESTION_PROMOTION_STATES], [
    'DISCOVERED',
    'RIGHTS_APPROVED',
    'PARSED',
    'NORMALIZED',
    'DEDUPED',
    'REVIEW_REQUIRED',
    'PROMOTED',
    'QUARANTINED',
    'REJECTED',
    'STALE',
  ]);
  assert.deepEqual([...INGESTION_CORE_PROGRESSION], [
    'DISCOVERED',
    'RIGHTS_APPROVED',
    'PARSED',
    'NORMALIZED',
    'DEDUPED',
    'REVIEW_REQUIRED',
    'PROMOTED',
  ]);
  assert.equal(INGESTION_PIPELINE_STAGES.length, 10);
  assert.equal(INGESTION_PIPELINE_STAGES[0], 'Retrieve');
  assert.equal(INGESTION_PIPELINE_STAGES[9], 'Promote');
  assert.equal(INGESTION_JOB_FIELDS.length, 17);
  assert.ok(INGESTION_JOB_FIELDS.includes('contradictionFlags'));
  assert.equal(EVIDENCE_CLASSES.length, 6);
  assert.ok(EVIDENCE_CLASSES.includes('primary_evidence'));
  assert.ok(EVIDENCE_CLASSES.includes('speculation'));
  assert.equal(PROMOTED_CLAIM_FIELDS.length, 8);
  assert.equal(BRAIN_EXPANSION_TARGETS.length, 10);
  assert.ok(ER5_MAY.includes('promote_only_after_human_review_gate'));
  assert.ok(ER5_MUST_NOT.includes('auto_promote_from_source_discovery_to_truth'));
});

test('progression + rights gate; UNKNOWN→QUARANTINE; skip-to-PROMOTED denied', () => {
  const discovered = createDiscoveredJob({
    actor: agent,
    ingestionId: 'ing-1',
    sourceId: 'src-1',
    sourceType: 'public_archive',
    domain: 'science',
    geography: 'global',
    eraTimeRange: '1900-1950',
    language: 'en',
    licenseRightsState: 'APPROVED_LICENSED',
  });
  assert.ok(!('denied' in discovered));
  assert.equal(discovered.promotionState, 'DISCOVERED');

  assert.equal(
    advanceIngestionState({
      actor: agent,
      job: discovered,
      to: 'PROMOTED',
      reason: 'skip',
      evidenceReference: 'x',
    }).state,
    'DENIED',
  );
  assert.equal(attemptAutoPromoteDiscoveryToTruth().state, 'DENIED');
  assert.equal(attemptRightsBypass().state, 'DENIED');

  const unknown = createDiscoveredJob({
    actor: agent,
    ingestionId: 'ing-u',
    sourceId: 'src-u',
    sourceType: 'other',
    domain: 'x',
    geography: 'x',
    eraTimeRange: 'x',
    language: 'en',
    licenseRightsState: 'UNKNOWN',
  });
  assert.ok(!('denied' in unknown));
  const q = rightsCheckGate({
    actor: agent,
    job: unknown,
    evidenceReference: 'rights://unknown',
  });
  assert.ok(!('denied' in q));
  assert.equal(q.promotionState, 'QUARANTINED');

  const { reviewRequired, claimNode } = exampleReviewReadyJob(agent);
  assert.equal(reviewRequired.promotionState, 'REVIEW_REQUIRED');
  assert.ok(claimNode.sourceIds.length >= 2);
  assert.equal(claimNode.claimId, reviewRequired.claimClusterId);
});

test('dedupe clusters; promote only after review; pirated/leaked/cross-tenant denied', () => {
  const { reviewRequired, claimNode } = exampleReviewReadyJob(agent);
  assert.equal(claimNode.sourceIds.length >= 2, true);

  const agentPromote = promoteAfterReview({
    actor: agent,
    job: reviewRequired,
    reason: 'agent try',
    evidenceReference: 'promote://agent',
  });
  assert.equal(agentPromote.state, 'DENIED');

  const promoted = promoteAfterReview({
    actor: human,
    job: reviewRequired,
    reason: 'approved historical claim',
    evidenceReference: 'promote://human',
    brainDestinations: [
      'Historical Business Atlas',
      'Logistics/Supply Chain brain',
    ],
  });
  assert.ok(!('denied' in promoted));
  assert.equal(promoted.job.promotionState, 'PROMOTED');
  assert.equal(promoted.autoPromotedToTruth, false);
  assert.ok(promoted.brainDestinations.includes('Historical Business Atlas'));

  // Cross-tenant pool denied
  const a = createDiscoveredJob({
    actor: agent,
    ingestionId: 'a',
    sourceId: 's-a',
    sourceType: 'public_archive',
    domain: 'd',
    geography: 'g',
    eraTimeRange: 'e',
    language: 'en',
  });
  const otherActor: Er5Actor = {
    ...agent,
    id: 'other',
    tenantId: 'ten-OTHER',
  };
  const b = createDiscoveredJob({
    actor: otherActor,
    ingestionId: 'b',
    sourceId: 's-b',
    sourceType: 'public_archive',
    domain: 'd',
    geography: 'g',
    eraTimeRange: 'e',
    language: 'en',
  });
  assert.ok(!('denied' in a) && !('denied' in b));
  assert.equal(
    dedupeClusterClaims({
      actor: agent,
      jobs: [a, b],
      claimText: 'same claim',
      evidenceClass: 'primary_evidence',
      confidence: 0.5,
    }).state,
    'DENIED',
  );

  assert.equal(attemptPiratedFullWorks().state, 'DENIED');
  assert.equal(attemptPrivateOrLeakedDatabases().state, 'DENIED');
  assert.equal(attemptCrossTenantPrivatePooling().state, 'DENIED');
  assert.equal(attemptPersistHiddenChainOfThought().state, 'DENIED');
});

test('authority denies + guardian isolation hold', () => {
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('bootstrap + soft-wire + cycle; ER2/ER1 PRESENT; ER3 WAITING_DATA; EQ14 WAITING_DATA', () => {
  const boot = bootstrapGlobalHistoricalKnowledgeIngestion(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.promotionStates.length, 10);
  assert.equal(boot.pipelineStages.length, 10);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER6/);

  const soft = er5SoftWireSnapshot(repoRoot);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);
  assert.equal(soft.er3PublicDataSourceRegistry.present, false);
  assert.equal(soft.eq14NeuralPathwayArchitectureGraph.present, false);
  // ER4: types may exist untracked in workspace → PRESENT; else WAITING_DATA
  // Presence ≠ VERIFIED either way.

  const { reviewRequired } = exampleReviewReadyJob(agent);
  const ev = returnEr5EvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    job: reviewRequired,
    summary: 'ingestion advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.autoPromotedToTruth, false);
  assert.equal(ev.hiddenChainOfThoughtStored, false);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runGlobalHistoricalKnowledgeIngestionCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(
    cycle.hops.length,
    GLOBAL_HISTORICAL_KNOWLEDGE_INGESTION_CYCLE.length,
  );
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of GLOBAL_HISTORICAL_KNOWLEDGE_INGESTION_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er3Hop = cycle.hops.find((h) => h.hop === 'er3_soft_wire');
  assert.ok(er3Hop);
  assert.equal(er3Hop.state, 'WAITING_DATA');

  const er4Hop = cycle.hops.find((h) => h.hop === 'er4_soft_wire');
  assert.ok(er4Hop);
  assert.equal(
    er4Hop.state,
    soft.er4RightsProvenanceGate.present ? 'PASS' : 'WAITING_DATA',
  );

  const eq14Hop = cycle.hops.find((h) => h.hop === 'eq14_soft_wire');
  assert.ok(eq14Hop);
  assert.equal(eq14Hop.state, 'WAITING_DATA');

  const er2Hop = cycle.hops.find((h) => h.hop === 'er2_soft_wire');
  assert.ok(er2Hop);
  assert.equal(er2Hop.state, 'PASS');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.job.promotionState, 'PROMOTED');
});
