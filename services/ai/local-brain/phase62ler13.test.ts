/**
 * 62L-ER13 — Online Brain Index denial + honesty tests.
 *
 * Script: npm run test:62ler13
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EVIDENCE_CLASS_LABELS,
  ER13_DB_CANDIDATES_STATUS,
  ER13_LOCKS,
  ER13_MAY,
  ER13_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HOME_BASE_INTEGRATION_LOOP,
  HONESTY_BANNER,
  INDEXED_OBJECT_FIELDS,
  NEXT_PHASE_TITLE,
  ONLINE_BRAIN_AGENT_BOUNDS,
  ONLINE_BRAIN_INDEX_CYCLE,
  ONLINE_BRAIN_INDEX_STRUCTURE,
  ONLINE_BRAIN_MUST_NOT,
  PERMISSION_FIRST_FLOW,
  RESULT_TRUST_LAYER_FIELDS,
  SCALE_ARCHITECTURE_TARGETS,
  SEARCH_MODES,
  assertEr13LocksIntact,
  er13SoftWireSnapshot,
  type Er13Actor,
} from './online-brain-index-types.ts';

import {
  attemptAssumeCorpusSize,
  attemptClaimTrillionCorpus,
  attemptHiddenChainOfThoughtStorage,
  attemptPermissionBypass,
  attemptPrivatePoolingIntoPublic,
  attemptSecretIndexing,
  attemptTipLand,
  attemptUnauthorizedScraping,
  bootstrapOnlineBrainIndex,
  clearOnlineBrainIndexRegistry,
  dispatchSearchMode,
  distinguishEvidenceLabel,
  measureCorpusSize,
  permissionFirstRetrieval,
  probeGuardianRlsTenantUniverseIsolation,
  registerIndexedObject,
  requireHumanApproval,
  returnEvidenceBundleToHomeBase,
  runOnlineBrainIndexCycle,
} from './online-brain-index-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er13Actor = {
  kind: 'retrieval_agent',
  id: 'ret-1',
  orgId: 'org-er13',
  tenantId: 'ten-er13',
  universeId: 'uni-er13',
  permissions: ['draft'],
};

const human: Er13Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er13',
  tenantId: 'ten-er13',
  universeId: 'uni-er13',
  permissions: ['approve_consequential'],
};

test('SoT label ER13 / 62L-ER #162; next ER14 Offline Brain Packager', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER13');
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.match(GITHUB_SOT_TITLE, /Online Brain Index/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER14/);
  assert.match(NEXT_PHASE_TITLE, /Offline Brain Packager/);
});

test('honesty locks: L4 false; corpus assumed≠measured; tip-land false; DB NOT_APPLIED', () => {
  assert.equal(assertEr13LocksIntact(), true);
  assert.equal(ER13_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER13_LOCKS.CORPUS_SIZE_ASSUMED_EQ_MEASURED, false);
  assert.equal(ER13_LOCKS.CLAIM_TRILLION_CORPUS_WITHOUT_MEASUREMENT, false);
  assert.equal(ER13_LOCKS.TIP_LAND, false);
  assert.equal(ER13_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(ONLINE_BRAIN_AGENT_BOUNDS.mayAssumeCorpusSize, false);
  assert.equal(ONLINE_BRAIN_AGENT_BOUNDS.mayPoolPrivateIntoPublicIndex, false);
});

test('index structure + fields + search modes + permission flow + trust + home-base encoded', () => {
  assert.deepEqual([...ONLINE_BRAIN_INDEX_STRUCTURE], [
    'source',
    'document_data_object',
    'chunk_entity',
    'embedding_index',
    'knowledge_node',
    'citation',
    'agent_retrieval',
  ]);
  assert.equal(INDEXED_OBJECT_FIELDS.length, 17);
  assert.ok(INDEXED_OBJECT_FIELDS.includes('objectId'));
  assert.ok(INDEXED_OBJECT_FIELDS.includes('rightsState'));
  assert.equal(SEARCH_MODES.length, 8);
  assert.ok(SEARCH_MODES.includes('semantic_vector'));
  assert.ok(SEARCH_MODES.includes('evidence_filtered'));
  assert.deepEqual([...PERMISSION_FIRST_FLOW], [
    'agent_query',
    'identity',
    'tenant',
    'universe',
    'purpose',
    'data_class',
    'rights',
    'eligible_indexes',
    'retrieval',
    'citations',
  ]);
  assert.equal(RESULT_TRUST_LAYER_FIELDS.length, 7);
  assert.deepEqual([...EVIDENCE_CLASS_LABELS], [
    'CURRENT_OFFICIAL',
    'HISTORICAL',
    'LIVE_VERIFIED',
    'SCHOLARLY_INTERPRETATION',
    'SPECULATIVE',
  ]);
  assert.equal(HOME_BASE_INTEGRATION_LOOP.length, 7);
  assert.ok(SCALE_ARCHITECTURE_TARGETS.includes('partitioning'));
  assert.ok(ONLINE_BRAIN_MUST_NOT.includes('private_data_pooling_into_public_index'));
  assert.ok(ER13_MAY.length > 0);
  assert.ok(ER13_MUST_NOT.includes('unauthorized_scraping'));
});

test('register public object; deny private→public pooling and secret indexing', () => {
  clearOnlineBrainIndexRegistry();
  const pub = registerIndexedObject({
    actor: agent,
    objectId: 'p1',
    sourceProvider: 'gov',
    dataClass: 'PUBLIC_APPROVED',
    rightsState: 'PUBLIC_INDEX_ELIGIBLE',
    provenance: 'portal',
    domain: 'census',
    geography: 'US',
    timeRange: '2020',
    language: 'en',
    freshness: 'published',
    authorityLevel: 'high',
    contradictionState: 'none',
    embeddingIndexVersion: 'v0',
    retentionExpiry: '2030-01-01',
  });
  assert.ok(!('denied' in pub));
  assert.equal(pub.indexScope, 'GLOBAL_PUBLIC');

  const pooled = registerIndexedObject({
    actor: agent,
    objectId: 'priv1',
    sourceProvider: 'crm',
    dataClass: 'ENTERPRISE_PRIVATE',
    rightsState: 'ENTERPRISE_PRIVATE',
    provenance: 'internal',
    domain: 'crm',
    geography: 'internal',
    timeRange: '2026',
    language: 'en',
    freshness: 'live',
    authorityLevel: 'internal',
    contradictionState: 'none',
    embeddingIndexVersion: 'v0',
    retentionExpiry: '2027-01-01',
    attemptPoolPrivateIntoPublic: true,
    targetScope: 'GLOBAL_PUBLIC',
  });
  assert.equal('denied' in pooled && pooled.state, 'DENIED');

  const secret = registerIndexedObject({
    actor: agent,
    objectId: 'sec1',
    sourceProvider: 'vault',
    dataClass: 'SECRET',
    rightsState: 'SECRET',
    provenance: 'secret',
    domain: 'secrets',
    geography: 'internal',
    timeRange: '2026',
    language: 'en',
    freshness: 'live',
    authorityLevel: 'secret',
    contradictionState: 'none',
    embeddingIndexVersion: 'v0',
    retentionExpiry: '2026-12-31',
    attemptSecretIndexing: true,
  });
  assert.equal('denied' in secret && secret.state, 'DENIED');
  assert.equal(attemptSecretIndexing().state, 'DENIED');
  assert.equal(attemptPrivatePoolingIntoPublic().state, 'DENIED');
});

test('permission-first retrieval; search modes return trust-annotated evidence labels', () => {
  clearOnlineBrainIndexRegistry();
  const pub = registerIndexedObject({
    actor: agent,
    objectId: 'p2',
    sourceProvider: 'gov',
    dataClass: 'PUBLIC_APPROVED',
    rightsState: 'PUBLIC_INDEX_ELIGIBLE',
    provenance: 'portal',
    domain: 'trade',
    geography: 'global',
    timeRange: '2024',
    language: 'en',
    freshness: 'current',
    authorityLevel: 'high',
    contradictionState: 'none',
    embeddingIndexVersion: 'v0',
    retentionExpiry: '2030-01-01',
  });
  assert.ok(!('denied' in pub));

  const bypass = permissionFirstRetrieval({
    actor: agent,
    queryText: 'x',
    purpose: 'research',
    dataClass: 'PUBLIC_APPROVED',
    searchMode: 'lexical',
    attemptPermissionBypass: true,
  });
  assert.equal('denied' in bypass && bypass.state, 'DENIED');

  const ok = permissionFirstRetrieval({
    actor: agent,
    queryText: 'trade',
    purpose: 'research',
    dataClass: 'PUBLIC_APPROVED',
    searchMode: 'lexical',
  });
  assert.ok(!('denied' in ok));
  assert.equal(ok.eligible.length, 1);

  for (const mode of SEARCH_MODES) {
    const dispatched = dispatchSearchMode({
      actor: agent,
      searchMode: mode,
      evidenceClass: 'HISTORICAL',
      purpose: 'research',
      dataClass: 'PUBLIC_APPROVED',
    });
    assert.ok(!('denied' in dispatched), `mode ${mode}`);
    assert.equal(dispatched.trustLayerComplete, true);
    for (const r of dispatched.results) {
      assert.equal(r.trust.evidenceClass, 'HISTORICAL');
      assert.ok(r.trust.source);
      assert.ok(r.citation.startsWith('cite:'));
    }
  }

  for (const label of EVIDENCE_CLASS_LABELS) {
    const d = distinguishEvidenceLabel(label);
    assert.ok(!('denied' in d));
    assert.equal(d.distinguished, true);
    assert.equal(d.notConfusedWith.length, EVIDENCE_CLASS_LABELS.length - 1);
  }
});

test('measured corpus only; no assumed/trillion claims', () => {
  clearOnlineBrainIndexRegistry();
  assert.equal(measureCorpusSize().measuredObjectCount, 0);
  assert.equal(measureCorpusSize().assumed, false);
  assert.equal(attemptAssumeCorpusSize().state, 'DENIED');
  assert.equal(attemptClaimTrillionCorpus().state, 'DENIED');
  registerIndexedObject({
    actor: agent,
    objectId: 'm1',
    sourceProvider: 'gov',
    dataClass: 'PUBLIC_APPROVED',
    rightsState: 'PUBLIC_INDEX_ELIGIBLE',
    provenance: 'portal',
    domain: 'x',
    geography: 'x',
    timeRange: '2020',
    language: 'en',
    freshness: 'x',
    authorityLevel: 'x',
    contradictionState: 'none',
    embeddingIndexVersion: 'v0',
    retentionExpiry: '2030-01-01',
  });
  assert.equal(measureCorpusSize().measuredObjectCount, 1);
  assert.equal(measureCorpusSize().trillionClaimAuthorized, false);
});

test('safety denies: scrape/pool/bypass/secret/CoT/tip-land; home-base + cycle', () => {
  assert.equal(attemptUnauthorizedScraping().state, 'DENIED');
  assert.equal(attemptPrivatePoolingIntoPublic().state, 'DENIED');
  assert.equal(attemptPermissionBypass().state, 'DENIED');
  assert.equal(attemptSecretIndexing().state, 'DENIED');
  assert.equal(attemptHiddenChainOfThoughtStorage().state, 'DENIED');
  assert.equal(attemptTipLand().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  clearOnlineBrainIndexRegistry();
  const pub = registerIndexedObject({
    actor: agent,
    objectId: 'hb1',
    sourceProvider: 'gov',
    dataClass: 'RESEARCH_EVIDENCE',
    rightsState: 'PUBLIC_INDEX_ELIGIBLE',
    provenance: 'paper',
    domain: 'science',
    geography: 'global',
    timeRange: '2023',
    language: 'en',
    freshness: 'published',
    authorityLevel: 'scholarly',
    contradictionState: 'none',
    embeddingIndexVersion: 'v0',
    retentionExpiry: '2035-01-01',
  });
  assert.ok(!('denied' in pub));
  const search = dispatchSearchMode({
    actor: agent,
    searchMode: 'evidence_filtered',
    evidenceClass: 'SCHOLARLY_INTERPRETATION',
    purpose: 'research',
    dataClass: 'RESEARCH_EVIDENCE',
  });
  assert.ok(!('denied' in search));

  const bundle = returnEvidenceBundleToHomeBase({
    bundleId: 'bundle-1',
    actor: agent,
    results: search.results,
    summary: 'evidence advisory',
  });
  assert.ok(!('denied' in bundle));
  assert.equal(bundle.authorityGranted, false);
  assert.equal(bundle.neuralPathwayPromotion, 'REVIEW_REQUIRED');

  const boot = bootstrapOnlineBrainIndex(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.fields.length, 17);
  assert.equal(boot.searchModes.length, 8);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);

  const soft = er13SoftWireSnapshot(repoRoot);
  // On ER3 tip: ER3 + EM157 PRESENT; ER12–ER1 (except ER3), EQ*, EP15 → WAITING_DATA ok
  assert.equal(soft.er3PublicDataSourceRegistry.present, true);
  assert.equal(soft.em157HomeBase.present, true);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runOnlineBrainIndexCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, ONLINE_BRAIN_INDEX_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of ONLINE_BRAIN_INDEX_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  // Soft-wires may be WAITING_DATA — never FAIL when absent
  const softHops = cycle.hops.filter((h) => h.hop.endsWith('_soft_wire'));
  for (const h of softHops) {
    assert.ok(
      h.state === 'PASS' || h.state === 'WAITING_DATA',
      `soft-wire ${h.hop} must be PASS or WAITING_DATA, got ${h.state}`,
    );
  }
  assert.ok(!('denied' in cycle.registered));
  assert.equal(cycle.privateDenied.state, 'DENIED');
  assert.equal(cycle.corpus.assumed, false);
});
