import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  bindFederationMember,
  declareOrgNeuralFederation,
  denyFounderSealedFromFederation,
  orgNeuralFederationHonesty,
  probeFederationAuthorityTransfer,
} from './org-neural-federation';
import {
  declareSynapseContract,
  exchangeKnowledgeProduct,
  knowledgeExchangeHonesty,
} from './cross-universe-knowledge-exchange';
import {
  expandSynapseLayers,
  synapseExpansionHonesty,
} from './multi-layer-synapse-expansion';
import {
  biNervousHonesty,
  emitBiAnomaly,
  emitBiForecast,
  executiveDecisionSupport,
  indexBiNervousCoverage,
} from './global-bi-nervous-system';
import {
  ANOMALY_NON_VERIFIED,
  AUTHORITY_NON_TRANSFER,
  BM_LOCKS,
  FORECAST_NON_VERIFIED,
  FOUNDER_SEALED_DENIED,
  HONESTY_BANNER,
  LAYER_RESOURCE_BOUND,
  NEXT_PHASE_TITLE,
  ORG_NEURAL_FEDERATION_CYCLE,
  RAW_PRIVATE_EXCHANGE_DENIED,
  SPARSE_BOUNDS,
  UNBOUNDED_SPAWN_DENIED,
  predecessorMap,
  type BmActor,
} from './org-neural-federation-types';
import {
  buildOrgNeuralFederationHealthReport,
  runOrgNeuralFederationCycle,
} from './org-neural-federation-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbm-'));
const orgA = 'org-alpha';
const orgB = 'org-beta';
const tenantA = 'tenant-alpha';
const tenantB = 'tenant-beta';
const universeA = 'univ-alpha';
const universeB = 'univ-beta';
const SECRET = 'SEALED_BM_FOUNDER_TOKEN_DO_NOT_LEAK';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actorA: BmActor = {
  kind: 'org_admin',
  id: 'admin-a',
  orgId: orgA,
  tenantId: tenantA,
  universeId: universeA,
  role: 'org_admin',
};

const actorB: BmActor = {
  kind: 'ordinary_agent',
  id: 'agent-b',
  orgId: orgB,
  tenantId: tenantB,
  universeId: universeB,
  role: 'analyst',
};

try {
  check(
    'US-BM1-cycle',
    ORG_NEURAL_FEDERATION_CYCLE.join(' → ') ===
      'federation_declare → member_universe_bind → private_boundary_seal → authority_boundary_seal → synapse_contract_declare → derived_product_classify → raw_private_deny → knowledge_exchange → layer_expand_sparse → resource_bound_enforce → bi_node_index → pathway_route → forecast_label → anomaly_label → executive_decision_support → founder_sealed_deny → evidence → learning',
    'Org neural federation + knowledge exchange + BI nervous cycle is recorded in order.',
  );

  check(
    'US-BM-locks',
    BM_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BM_LOCKS.TIP_LAND === false &&
      BM_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      BM_LOCKS.RAW_PRIVATE_GLOBAL_POOL_DEFAULT === false &&
      BM_LOCKS.RAW_PRIVATE_EXCHANGE_DEFAULT === 'DENIED' &&
      BM_LOCKS.DERIVED_ONLY_VIA_EXPLICIT_CONTRACT === true &&
      BM_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      BM_LOCKS.FEDERATION_TRANSFERS_ORG_AUTHORITY === false &&
      BM_LOCKS.FORECAST_IS_VERIFIED_FACT === false &&
      BM_LOCKS.ANOMALY_IS_VERIFIED_FACT === false &&
      BM_LOCKS.NEURONS_ARE_LIVE_PROCESS_SPAWN === false &&
      BM_LOCKS.NEURONS_ARE_SPARSE_LOGICAL_NODES === true &&
      BM_LOCKS.UNBOUNDED_LAYER_EXPANSION === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, raw pool denied, sparse logical neurons, forecast≠fact.',
  );

  const fed = await declareOrgNeuralFederation({
    name: 'Alpha-Beta Neural Federation',
    actor: actorA,
    root,
  });
  check(
    'US-BM-federation',
    fed.accepted === true &&
      fed.federation?.rawPrivateGlobalPool === false &&
      fed.federation.authorityBoundariesPreserved === true &&
      fed.federation.productionAuthorized === false,
    'Organization Neural Federation declared; private data not pooled.',
  );
  const federationId = fed.accepted ? fed.federation.id : 'missing';
  actorA.federationId = federationId;

  const mA = await bindFederationMember({
    federationId,
    orgId: orgA,
    universeId: universeA,
    tenantId: tenantA,
    actor: actorA,
    root,
  });
  const mB = await bindFederationMember({
    federationId,
    orgId: orgB,
    universeId: universeB,
    tenantId: tenantB,
    actor: actorB,
    root,
  });
  check(
    'US-BM-members',
    mA.accepted === true &&
      mB.accepted === true &&
      mA.member?.privateDataPooled === false &&
      mA.member.authorityTransferred === false &&
      mB.member?.privateDataPooled === false,
    'Federation members keep private data and authority boundaries.',
  );

  // Required: raw private company data exchange DENIED by default
  const raw = await exchangeKnowledgeProduct({
    federationId,
    fromOrgId: orgA,
    toOrgId: orgB,
    kind: 'raw_private_company_data',
    classification: 'raw_private',
    payload: { privateCompanyDump: { customers: ['a', 'b'], revenue: 1_000_000 } },
    actor: actorA,
    root,
  });
  check(
    'US-BM-raw-private-denied',
    raw.allowed === false &&
      raw.rawPooled === false &&
      raw.reason === RAW_PRIVATE_EXCHANGE_DENIED,
    'Raw private company data exchange DENIED by default.',
  );

  // Required: approved derived knowledge product can pass explicit synapse contract
  const contract = await declareSynapseContract({
    federationId,
    fromOrgId: orgA,
    toOrgId: orgB,
    fromUniverseId: universeA,
    toUniverseId: universeB,
    kind: 'benchmark',
    schemaRef: 'schema://derived/benchmark-v1',
    actor: actorA,
    root,
  });
  check('US-BM-contract', contract.accepted === true, 'Explicit synapse contract declared.');

  const noContract = await exchangeKnowledgeProduct({
    federationId,
    fromOrgId: orgA,
    toOrgId: orgB,
    kind: 'lesson',
    classification: 'derived',
    payload: { lesson: 'Prefer verified local routes' },
    actor: actorA,
    root,
  });
  check(
    'US-BM-derived-needs-contract',
    noContract.allowed === false && noContract.state === 'UNAVAILABLE',
    'Derived product without matching contract is UNAVAILABLE.',
  );

  const derived = await exchangeKnowledgeProduct({
    federationId,
    fromOrgId: orgA,
    toOrgId: orgB,
    kind: 'benchmark',
    classification: 'derived',
    payload: { benchmark: { name: 'supply-latency-p95', value: 120 } },
    actor: actorA,
    contractId: contract.accepted ? contract.contract.id : undefined,
    root,
  });
  check(
    'US-BM-derived-pass',
    derived.allowed === true &&
      derived.rawPooled === false &&
      derived.authorityTransferred === false &&
      derived.sealedLeaked === false &&
      derived.body?.benchmark != null,
    'Approved derived knowledge product passes explicit synapse contract.',
  );

  // Required: cross-org authority does not transfer via federation synapse
  const auth = await probeFederationAuthorityTransfer({
    federationId,
    fromOrgId: orgA,
    toOrgId: orgB,
    actor: actorA,
    root,
  });
  const authXchg = await exchangeKnowledgeProduct({
    federationId,
    fromOrgId: orgA,
    toOrgId: orgB,
    kind: 'signal',
    classification: 'authority_grant',
    payload: { authorityGrant: true, role: 'org_admin' },
    actor: actorA,
    root,
  });
  check(
    'US-BM-authority-non-transfer',
    auth.allowed === false &&
      auth.authorityTransferred === false &&
      auth.reason === AUTHORITY_NON_TRANSFER &&
      authXchg.allowed === false &&
      authXchg.authorityTransferred === false,
    'Cross-org authority does not transfer via federation synapse.',
  );

  // Required: sealed founder route remains deny-by-default from org federation
  const sealed = await denyFounderSealedFromFederation({
    federationId,
    actor: actorA,
    surface: 'federation_synapse',
    payload: SECRET,
    root,
  });
  const sealedXchg = await exchangeKnowledgeProduct({
    federationId,
    fromOrgId: orgA,
    toOrgId: orgB,
    kind: 'derived_knowledge_product',
    classification: 'founder_sealed',
    payload: { sealedFounderToken: SECRET, derivedProduct: { name: 'x' } },
    actor: actorA,
    root,
  });
  check(
    'US-BM-founder-sealed-deny',
    sealed.allowed === false &&
      sealed.payloadWritten === false &&
      sealed.reason === FOUNDER_SEALED_DENIED &&
      sealedXchg.allowed === false &&
      sealedXchg.sealedLeaked === false,
    'Sealed founder route remains deny-by-default from org federation.',
  );

  // Required: sparse layer expansion enforces resource/activation bounds
  const expandOk = await expandSynapseLayers({
    federationId,
    layers: 2,
    nodesPerLayer: 8,
    liveProcessSpawn: 0,
    activate: true,
    actor: actorA,
    root,
  });
  check(
    'US-BM-sparse-expand',
    expandOk.accepted === true &&
      expandOk.liveProcessesSpawned === 0 &&
      expandOk.nodes.every((n) => n.liveProcess === false),
    'Sparse logical layer expansion creates nodes without live process spawn.',
  );

  const expandSpawn = await expandSynapseLayers({
    federationId,
    layers: 1,
    nodesPerLayer: 4,
    liveProcessSpawn: 1_000_000,
    actor: actorA,
    root,
  });
  check(
    'US-BM-unbounded-spawn-denied',
    expandSpawn.accepted === false && expandSpawn.reason === UNBOUNDED_SPAWN_DENIED,
    'Unbounded live process spawn DENIED.',
  );

  const expandOver = await expandSynapseLayers({
    federationId,
    layers: SPARSE_BOUNDS.maxLayers + 3,
    nodesPerLayer: 4,
    actor: actorA,
    root,
  });
  check(
    'US-BM-layer-bounds',
    expandOver.accepted === false && expandOver.reason === LAYER_RESOURCE_BOUND,
    'Sparse layer expansion enforces resource/activation bounds.',
  );

  check(
    'US-BM-expansion-honesty',
    synapseExpansionHonesty().neuronsAreLiveProcessSpawn === false &&
      synapseExpansionHonesty().neuronsAreSparseLogicalNodes === true &&
      synapseExpansionHonesty().maxLiveProcessSpawn === 0,
    'Expansion honesty: neurons are sparse logical nodes, not process farms.',
  );

  // Required: forecast/anomaly outputs labeled non-verified
  const bi = await indexBiNervousCoverage({ federationId, actor: actorA, root });
  check(
    'US-BM-bi-coverage',
    bi.accepted === true &&
      bi.domainsCovered.length === 9 &&
      bi.liveProcessesSpawned === 0 &&
      bi.pathways.every((p) => p.liveProcess === false),
    'Global BI Nervous System sparse coverage across 9 domains.',
  );

  const forecast = await emitBiForecast({
    federationId,
    summary: 'Revenue may increase (hypothesis)',
    actor: actorA,
    root,
  });
  const anomaly = await emitBiAnomaly({
    federationId,
    summary: 'Latency spike detected (candidate)',
    actor: actorA,
    root,
  });
  check(
    'US-BM-forecast-anomaly-non-verified',
    forecast.verifiedFact === false &&
      forecast.label === FORECAST_NON_VERIFIED &&
      anomaly.verifiedFact === false &&
      anomaly.label === ANOMALY_NON_VERIFIED &&
      biNervousHonesty().forecastIsVerifiedFact === false &&
      biNervousHonesty().anomalyIsVerifiedFact === false,
    'Forecast/anomaly outputs labeled non-verified where appropriate.',
  );

  const exec = await executiveDecisionSupport({
    federationId,
    topic: 'Expand APAC logistics',
    actor: actorA,
    root,
  });
  check(
    'US-BM-exec-recommend-only',
    exec.recommendationOnly === true &&
      exec.chargeOrDeploy === false &&
      exec.productionAuthorization === false,
    'Executive decision support is recommendation-only; not charge/deploy.',
  );

  const cycle = await runOrgNeuralFederationCycle({
    federationName: 'Cycle Federation',
    orgId: orgA,
    peerOrgId: orgB,
    tenantId: tenantA,
    peerTenantId: tenantB,
    universeId: universeA,
    peerUniverseId: universeB,
    actor: actorA,
    peerActor: actorB,
    sealedPayload: SECRET,
    root,
  });
  check(
    'US-BM-cycle-run',
    cycle.productionAuthorization === false &&
      cycle.l4AutonomyEnabled === false &&
      cycle.hops.length === ORG_NEURAL_FEDERATION_CYCLE.length &&
      cycle.hops.every((h) => h.state === 'PASS' || h.state === 'DENIED'),
    'Full BM cycle walks all hops without production authorization.',
  );

  const health = await buildOrgNeuralFederationHealthReport(repoRoot);
  check(
    'US-BM-health',
    health.productionAuthorization === false &&
      health.tipLand === false &&
      health.githubIssue === 77 &&
      health.gitlabIssue === 11 &&
      health.nextPhaseTitle === NEXT_PHASE_TITLE,
    'Health report: productionAuthorization=false; cites GitHub #77 / GitLab #11.',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-BM-predecessor-bl',
    preds.BL.module === 'AVAILABLE' && preds.BL.report === 'PASS',
    'BL predecessor module + report PRESENT.',
  );
  check(
    'US-BM-waiting-bk',
    preds.BK.module === 'WAITING_DATA' || preds.BK.report === 'WAITING_DATA',
    'BK remains WAITING_DATA (not invented PASS).',
  );

  check(
    'US-BM-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-BN — Superbrain Neural Growth Engine'),
    'Next queue title is 62L-BN (title only).',
  );

  check(
    'US-BM-honesty-helpers',
    orgNeuralFederationHonesty().rawPrivateGlobalPool === false &&
      knowledgeExchangeHonesty().rawPrivateDefault === 'DENIED' &&
      knowledgeExchangeHonesty().derivedOnlyViaExplicitContract === true,
    'Honesty helpers encode raw-deny and derived-contract locks.',
  );

  if (failures.length) {
    console.error('\nFAILURES:');
    for (const f of failures) console.error(`- ${f}`);
    process.exitCode = 1;
  } else {
    console.log('\nAll 62L-BM org neural federation / BI nervous checks passed (unit). NOT production authorization.');
  }
} finally {
  await rm(root, { recursive: true, force: true });
}
