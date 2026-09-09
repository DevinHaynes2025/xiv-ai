import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ingestLakeSource, listLakeObjects, assignLakeTier, hashLakeContent } from './knowledge-lake';
import { indexLakeObject, sparseRetrieve, tokenizeForIndex } from './offline-intelligence-index';
import { attachTranslationMetadata, preserveOriginalSource, readPreservedSource } from './multilingual-source';
import { federateIndustryMemory, ingestIndustrySource } from './industry-memory-federation';
import { linkLakeSourceToClaim, promoteLakeClaim, recordLakeContradiction, listContradictions } from './evidence-graph';
import { executeLogicalRetrieval, planLogicalRetrieval, LOGICAL_CORPUS_CEILING } from './logical-retrieval';
import {
  KNOWLEDGE_LAKE_ARCHITECTURE,
  KNOWLEDGE_LAKE_LOCKS,
  buildKnowledgeLakeHealthReport,
  runKnowledgeLakePathway,
} from './knowledge-lake-runtime';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lab-'));
const tenantId = '62lab-tenant';
const universeId = '62lab-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  check(
    'US-AB-architecture',
    KNOWLEDGE_LAKE_ARCHITECTURE.join(' → ') ===
      'founder_digital_twin → neural_highways → global_brain_highways → agent_bus → context_vault → knowledge_lake → multilingual_preservation → industry_memory_federation → offline_intelligence_index → evidence_graph → contradiction → logical_retrieval → evidence_promotion_gate → decision_gate → learning_ledger → memory_cortex',
    'Knowledge Lake architecture is recorded in order.',
  );
  check('US-AB-locks', KNOWLEDGE_LAKE_LOCKS.L4_AUTONOMY_ENABLED === false && KNOWLEDGE_LAKE_LOCKS.PRODUCTION_AUTHORIZATION === false, 'L4 and production locks are false.');

  const textile = await ingestIndustrySource({
    tenantId,
    universeId,
    industry: 'textiles',
    era: '1800s',
    partition: 'business',
    sourceUri: 'synthetic:62lab/textiles-en',
    sourceLanguage: 'en',
    originalText: 'Manchester mills shipped cotton textiles across the Atlantic in the nineteenth century.',
    provenanceRefs: ['synthetic:62lab/textiles-en'],
    root,
  });
  const recalled = await listLakeObjects({ tenantId, universeId, industry: 'textiles', root });
  const otherTenant = await listLakeObjects({ tenantId: 'other-tenant', universeId, industry: 'textiles', root });
  check('US-AB1', recalled.some((item) => item.id === textile.object.id) && textile.object.productionAuthorization === false, 'Knowledge Lake persists a durable local source catalog.');
  check('US-AB1', otherTenant.length === 0, 'Knowledge Lake is tenant/Universe scoped.');

  const shipbuilding = await ingestIndustrySource({
    tenantId,
    universeId,
    industry: 'shipbuilding',
    era: '1800s',
    partition: 'business',
    sourceUri: 'synthetic:62lab/shipbuilding',
    sourceLanguage: 'en',
    originalText: 'Clyde shipyards launched iron-hulled steamers for transatlantic trade.',
    provenanceRefs: ['synthetic:62lab/shipbuilding'],
    root,
  });
  const textilesOnly = await federateIndustryMemory({
    tenantId,
    universeId,
    industry: 'textiles',
    query: 'cotton mills',
    root,
  });
  check('US-AB2', textilesOnly.hits.some((item) => item.id === textile.object.id), 'Industry Memory Federation returns the matching industry.');
  check('US-AB2', textilesOnly.hits.every((item) => item.id !== shipbuilding.object.id), 'Industry Memory Federation does not leak a different industry.');
  const waitingFederation = await federateIndustryMemory({
    tenantId,
    universeId,
    industry: 'textiles',
    needsExternalFreshness: true,
    root,
  });
  check('US-AB2', waitingFederation.state === 'WAITING_DATA' && waitingFederation.inventedFacts === false, 'Federation requiring external freshness is WAITING_DATA.');

  const sparse = await sparseRetrieve({
    tenantId,
    universeId,
    query: 'cotton textiles atlantic',
    industry: 'textiles',
    root,
  });
  const miss = await sparseRetrieve({
    tenantId,
    universeId,
    query: 'unobtainium zetabyte corpus',
    industry: 'textiles',
    root,
  });
  check('US-AB3', sparse.hits.some((item) => item.id === textile.object.id) && tokenizeForIndex('cotton textiles').includes('cotton'), 'Offline Intelligence Index sparse-retrieves indexed tokens.');
  check('US-AB3', miss.hits.length === 0 && miss.inventedFacts === false, 'Sparse miss returns empty hits and does not invent facts.');

  const japanese = await preserveOriginalSource({
    tenantId,
    universeId,
    industry: 'textiles',
    era: '1900s',
    partition: 'world',
    sourceUri: 'synthetic:62lab/textiles-ja',
    sourceLanguage: 'ja',
    originalText: '大阪の織物商は綿布を輸出した。',
    provenanceRefs: ['synthetic:62lab/textiles-ja'],
    root,
  });
  await indexLakeObject(japanese.object, root);
  const translation = await attachTranslationMetadata({
    lakeObjectId: japanese.object.id,
    tenantId,
    universeId,
    targetLanguage: 'en',
    translatedText: 'Osaka textile merchants exported cotton cloth.',
    translator: 'human',
    root,
  });
  const unavailableTranslation = await attachTranslationMetadata({
    lakeObjectId: japanese.object.id,
    tenantId,
    universeId,
    targetLanguage: 'fr',
    translator: 'local_model',
    localModelConfigured: false,
    root,
  });
  const waitingTranslation = await attachTranslationMetadata({
    lakeObjectId: japanese.object.id,
    tenantId,
    universeId,
    targetLanguage: 'de',
    needsExternalTranslator: true,
    root,
  });
  const preserved = await readPreservedSource({
    lakeObjectId: japanese.object.id,
    tenantId,
    universeId,
    preferLanguage: 'en',
    root,
  });
  check('US-AB4', preserved.originalText === '大阪の織物商は綿布を輸出した。' && preserved.usedTranslation === false, 'Original multilingual source is preserved and not replaced by translation.');
  check('US-AB4', translation.replacesOriginal === false && translation.state === 'AVAILABLE', 'Translation metadata is attached without replacing the original.');
  check('US-AB4', unavailableTranslation.state === 'UNAVAILABLE' && waitingTranslation.state === 'WAITING_DATA', 'Unconfigured local translator is UNAVAILABLE; external translator is WAITING_DATA.');

  await linkLakeSourceToClaim({
    tenantId,
    universeId,
    lakeObjectId: textile.object.id,
    claimId: 'claim-textiles-export',
    claimLabel: 'Nineteenth-century cotton export',
    claimSummary: textile.object.originalText,
    claimState: 'HISTORICAL_ACCOUNT',
    partition: 'business',
    domain: 'history',
    evidenceRefs: [`lake:${textile.object.id}`],
    root,
  });
  const promoted = await promoteLakeClaim({
    text: 'Nineteenth-century cotton export',
    tenantId,
    universeId,
    lakeObjectId: textile.object.id,
    root,
  });
  check('US-AB5', promoted.allowed === true && promoted.promotedToVerified === false && promoted.inventedPass === false, 'Evidence graph promotion reuses the gate and does not auto-VERIFY or invent PASS.');

  const duplicate = await ingestLakeSource({
    tenantId,
    universeId,
    industry: 'textiles',
    partition: 'business',
    sourceUri: 'synthetic:62lab/textiles-en-copy',
    sourceLanguage: 'en',
    originalText: 'Manchester mills shipped cotton textiles across the Atlantic in the nineteenth century.',
    provenanceRefs: ['synthetic:62lab/textiles-en-copy'],
    root,
  });
  const hashed = hashLakeContent('en', textile.object.originalText);
  const cold = await assignLakeTier({
    id: shipbuilding.object.id,
    tenantId,
    universeId,
    tier: 'cold',
    root,
  });
  check('US-AB6', duplicate.duplicate === true && duplicate.object.id === textile.object.id && duplicate.object.contentHash === hashed, 'Content hashing deduplicates the same tenant source.');
  check('US-AB6', textile.object.shard.length === 2 && cold.tier === 'cold', 'Partitioned shard prefix and tiered storage are recorded.');

  const dispute = await ingestIndustrySource({
    tenantId,
    universeId,
    industry: 'textiles',
    era: '1800s',
    partition: 'business',
    sourceUri: 'synthetic:62lab/textiles-dispute',
    sourceLanguage: 'en',
    originalText: 'Manchester mills never shipped cotton textiles across the Atlantic.',
    provenanceRefs: ['synthetic:62lab/textiles-dispute'],
    root,
  });
  await linkLakeSourceToClaim({
    tenantId,
    universeId,
    lakeObjectId: dispute.object.id,
    claimId: 'claim-textiles-no-export',
    claimLabel: 'Denial of cotton export',
    claimSummary: dispute.object.originalText,
    claimState: 'DISPUTED',
    partition: 'business',
    domain: 'history',
    evidenceRefs: [`lake:${dispute.object.id}`],
    root,
  });
  const contradiction = await recordLakeContradiction({
    tenantId,
    universeId,
    partition: 'business',
    claimA: 'claim-textiles-export',
    claimB: 'claim-textiles-no-export',
    lakeObjectA: textile.object.id,
    lakeObjectB: dispute.object.id,
    evidenceRefs: [`lake:${textile.object.id}`, `lake:${dispute.object.id}`],
    root,
  });
  const stillThere = await listLakeObjects({ tenantId, universeId, industry: 'textiles', root });
  const open = await listContradictions({ tenantId, universeId, root });
  check('US-AB7', contradiction.bothSourcesRetained === true && contradiction.contradiction.forgotten === false, 'Contradiction handling keeps both claims and does not forget history.');
  check('US-AB7', stillThere.some((item) => item.id === textile.object.id) && stillThere.some((item) => item.id === dispute.object.id) && open.some((item) => item.id === contradiction.contradiction.id), 'Both lake sources and the contradiction record remain.');

  const plan = planLogicalRetrieval({ query: 'global industry memory', estimatedRecords: LOGICAL_CORPUS_CEILING });
  const logical = await executeLogicalRetrieval({
    tenantId,
    universeId,
    query: 'cotton',
    industry: 'textiles',
    estimatedRecords: LOGICAL_CORPUS_CEILING,
    root,
  });
  check('US-AB8', plan.materializedFiles === 0 && plan.materializedEmbeddings === 0 && plan.materializedAgents === 0 && plan.materialized === false, 'Trillion-scale logical retrieval does not materialize files, embeddings, or agents.');
  check('US-AB8', logical.materializedFilesCreated === 0 && logical.hits.length >= 1 && logical.inventedFacts === false, 'Logical execution searches only the local sparse catalog.');

  const noEvidence = await promoteLakeClaim({
    text: 'Unsourced rumor',
    tenantId,
    universeId,
    root,
  });
  const waitingPromote = await promoteLakeClaim({
    text: 'Needs live web',
    tenantId,
    universeId,
    needsExternalFreshness: true,
    root,
  });
  const cloudPromote = await promoteLakeClaim({
    text: 'Needs cloud ranker',
    tenantId,
    universeId,
    needsCloudProvider: true,
    root,
  });
  const agreementOnly = await promoteLakeClaim({
    text: 'Agents agreed',
    tenantId,
    universeId,
    aiAgreementOnly: true,
    root,
  });
  check('US-AB9', noEvidence.allowed === false && noEvidence.state === 'UNVERIFIED' && noEvidence.inventedPass === false, 'Promotion without evidence stays UNVERIFIED.');
  check('US-AB9', waitingPromote.state === 'WAITING_DATA' && cloudPromote.state === 'UNAVAILABLE' && agreementOnly.allowed === false, 'Promotion gate uses WAITING_DATA / UNAVAILABLE / no AI-agreement VERIFIED.');

  let envDenied = false;
  try {
    await ingestLakeSource({
      tenantId,
      universeId,
      industry: 'textiles',
      partition: 'business',
      sourceUri: '.env',
      sourceLanguage: 'en',
      originalText: 'SECRET=1',
      provenanceRefs: ['synthetic:env'],
      root,
    });
  } catch (error) {
    envDenied = (error as Error).message === 'LAKE_SOURCE_PATH_DENIED';
  }
  let secretDenied = false;
  try {
    await ingestLakeSource({
      tenantId,
      universeId,
      industry: 'textiles',
      partition: 'business',
      sourceUri: 'synthetic:key',
      sourceLanguage: 'en',
      originalText: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
      provenanceRefs: ['synthetic:key'],
      root,
    });
  } catch (error) {
    secretDenied = (error as Error).message === 'LAKE_SECRET_MATERIAL_DENIED';
  }
  let privatePublicDenied = false;
  try {
    await ingestLakeSource({
      tenantId,
      universeId,
      industry: 'textiles',
      partition: 'company',
      sourceUri: 'synthetic:private',
      sourceLanguage: 'en',
      originalText: 'Internal margin notes',
      provenanceRefs: ['synthetic:private'],
      classification: 'public',
      root,
    });
  } catch (error) {
    privatePublicDenied = (error as Error).message === 'PRIVATE_LAKE_OBJECT_CANNOT_PROMOTE_TO_WORLD';
  }
  check('US-AB10', envDenied && secretDenied && privatePublicDenied, 'Context-like path, secret material, and private→world promotion are denied.');

  const pathway = await runKnowledgeLakePathway({
    tenantId,
    universeId,
    industry: 'steel',
    sourceLanguage: 'en',
    originalText: 'Bessemer converters made bulk steel cheaper for rails.',
    sourceUri: 'synthetic:62lab/steel',
    contradictingText: 'Bessemer converters never made bulk steel cheaper.',
    translationLanguage: 'es',
    translatedText: 'Los convertidores Bessemer abaratarón el acero a granel para rieles.',
    estimatedRecords: LOGICAL_CORPUS_CEILING,
    root,
  });
  const health = await buildKnowledgeLakeHealthReport(root);
  check('US-AB11', pathway.twin.twinIsRealFounder === false && pathway.productionAuthorization === false && pathway.decision.humanApprovalRequired === true, 'Pathway reuses Founder Twin and Decision Gate; publication is not agent-executable.');
  check('US-AB11', pathway.logical.plan.materializedFiles === 0 && pathway.contradiction?.bothSourcesRetained === true, 'Pathway keeps logical scale honest and retains contradictions.');
  check('US-AB11', health.inventedPass === false && health.windowsNodeVerification === 'NOT_TESTED' && health.locks.L4_AUTONOMY_ENABLED === false, 'Health report does not invent PASS and keeps L4 false.');
  check('US-AB11', health.predecessorReports['62L-Y'] === 'WAITING_DATA' && health.githubIssue39 === 'UNAVAILABLE', 'Missing Y/Z/AA reports and unread Issue #39 stay WAITING_DATA/UNAVAILABLE.');

  const offlinePathway = await runKnowledgeLakePathway({
    tenantId,
    universeId,
    industry: 'steel',
    sourceLanguage: 'en',
    originalText: 'Needs a live market tape.',
    sourceUri: 'synthetic:62lab/live',
    needsExternalFreshness: true,
    root,
  });
  check('US-AB11', offlinePathway.state === 'WAITING_DATA' && offlinePathway.ingested === null, 'Pathway with external freshness does not ingest invented live data.');
} catch (error) {
  failures.push(`UNCAUGHT: ${(error as Error).stack ?? (error as Error).message}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exitCode = 1;
} else {
  console.log('62L-AB safety tests PASS');
}
