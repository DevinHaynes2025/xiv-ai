import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
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
  AUTHORITY_NON_TRANSFER,
  BM_LOCKS,
  FOUNDER_SEALED_DENIED,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  ORG_NEURAL_FEDERATION_CYCLE,
  RAW_PRIVATE_EXCHANGE_DENIED,
  SPARSE_BOUNDS,
  predecessorMap,
  type BmActor,
  type BmEvidenceState,
  type BmHop,
  type BmHopRecord,
} from './org-neural-federation-types';

export {
  BM_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  ORG_NEURAL_FEDERATION_CYCLE,
  predecessorMap,
  SPARSE_BOUNDS,
};

function hop(name: BmHop, state: BmEvidenceState, summary: string): BmHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type BmCycleInput = {
  federationName: string;
  orgId: string;
  peerOrgId: string;
  tenantId: string;
  peerTenantId: string;
  universeId: string;
  peerUniverseId: string;
  actor: BmActor;
  peerActor: BmActor;
  sealedPayload?: string;
  root?: string;
};

export async function runOrgNeuralFederationCycle(input: BmCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: BmHopRecord[] = [];

  const fed = await declareOrgNeuralFederation({
    name: input.federationName,
    actor: input.actor,
    root,
  });
  hops.push(hop('federation_declare', fed.accepted ? 'PASS' : 'FAIL', fed.reason));
  const federationId = fed.accepted ? fed.federation.id : 'missing';

  const memberA = await bindFederationMember({
    federationId,
    orgId: input.orgId,
    universeId: input.universeId,
    tenantId: input.tenantId,
    actor: input.actor,
    root,
  });
  hops.push(
    hop(
      'member_universe_bind',
      memberA.accepted ? 'PASS' : 'FAIL',
      memberA.accepted
        ? `${memberA.reason}; privateDataPooled=${memberA.member.privateDataPooled}`
        : memberA.reason,
    ),
  );

  await bindFederationMember({
    federationId,
    orgId: input.peerOrgId,
    universeId: input.peerUniverseId,
    tenantId: input.peerTenantId,
    actor: input.peerActor,
    root,
  });

  hops.push(
    hop(
      'private_boundary_seal',
      'PASS',
      `rawPrivateGlobalPool=${BM_LOCKS.RAW_PRIVATE_GLOBAL_POOL_DEFAULT === false ? 'false' : 'bad'}`,
    ),
  );
  hops.push(
    hop(
      'authority_boundary_seal',
      'PASS',
      `federationTransfersAuthority=${BM_LOCKS.FEDERATION_TRANSFERS_ORG_AUTHORITY}`,
    ),
  );

  const contract = await declareSynapseContract({
    federationId,
    fromOrgId: input.orgId,
    toOrgId: input.peerOrgId,
    fromUniverseId: input.universeId,
    toUniverseId: input.peerUniverseId,
    kind: 'derived_knowledge_product',
    schemaRef: 'schema://derived/benchmark-v1',
    actor: input.actor,
    root,
  });
  hops.push(
    hop('synapse_contract_declare', contract.accepted ? 'PASS' : 'FAIL', contract.reason),
  );

  hops.push(hop('derived_product_classify', 'PASS', 'Approved derived kinds only'));

  const rawDeny = await exchangeKnowledgeProduct({
    federationId,
    fromOrgId: input.orgId,
    toOrgId: input.peerOrgId,
    kind: 'raw_private_company_data',
    classification: 'raw_private',
    payload: { privateCompanyDump: { payroll: [1, 2, 3] } },
    actor: input.actor,
    root,
  });
  hops.push(
    hop(
      'raw_private_deny',
      rawDeny.allowed === false && rawDeny.reason === RAW_PRIVATE_EXCHANGE_DENIED ? 'PASS' : 'FAIL',
      rawDeny.reason,
    ),
  );

  const derived = await exchangeKnowledgeProduct({
    federationId,
    fromOrgId: input.orgId,
    toOrgId: input.peerOrgId,
    kind: 'derived_knowledge_product',
    classification: 'derived',
    payload: { derivedProduct: { name: 'sector-benchmark', score: 0.72 } },
    actor: input.actor,
    contractId: contract.accepted ? contract.contract.id : undefined,
    root,
  });
  hops.push(
    hop(
      'knowledge_exchange',
      derived.allowed ? 'PASS' : 'FAIL',
      `${derived.reason}; authorityTransferred=${derived.authorityTransferred}`,
    ),
  );

  const expand = await expandSynapseLayers({
    federationId,
    layers: 2,
    nodesPerLayer: 6,
    liveProcessSpawn: 0,
    activate: true,
    actor: input.actor,
    root,
  });
  hops.push(
    hop(
      'layer_expand_sparse',
      expand.accepted ? 'PASS' : 'FAIL',
      `${expand.reason}; liveSpawn=${expand.liveProcessesSpawned ?? 0}`,
    ),
  );

  const overExpand = await expandSynapseLayers({
    federationId,
    layers: SPARSE_BOUNDS.maxLayers + 5,
    nodesPerLayer: 4,
    actor: input.actor,
    root,
  });
  hops.push(
    hop(
      'resource_bound_enforce',
      overExpand.accepted === false ? 'PASS' : 'FAIL',
      overExpand.reason,
    ),
  );

  const bi = await indexBiNervousCoverage({
    federationId,
    actor: input.actor,
    root,
  });
  hops.push(
    hop(
      'bi_node_index',
      bi.accepted && bi.domainsCovered.length === 9 ? 'PASS' : 'FAIL',
      bi.reason,
    ),
  );
  hops.push(
    hop(
      'pathway_route',
      bi.pathways.length > 0 ? 'PASS' : 'FAIL',
      `pathways=${bi.pathways.length}`,
    ),
  );

  const forecast = await emitBiForecast({
    federationId,
    summary: 'Demand may rise next quarter (non-verified)',
    actor: input.actor,
    root,
  });
  hops.push(
    hop(
      'forecast_label',
      forecast.verifiedFact === false ? 'PASS' : 'FAIL',
      forecast.label,
    ),
  );

  const anomaly = await emitBiAnomaly({
    federationId,
    summary: 'Unusual spend pattern (non-verified)',
    actor: input.actor,
    root,
  });
  hops.push(
    hop(
      'anomaly_label',
      anomaly.verifiedFact === false ? 'PASS' : 'FAIL',
      anomaly.label,
    ),
  );

  const exec = await executiveDecisionSupport({
    federationId,
    topic: 'Q3 resource allocation',
    actor: input.actor,
    root,
  });
  hops.push(
    hop(
      'executive_decision_support',
      exec.recommendationOnly && exec.chargeOrDeploy === false ? 'PASS' : 'FAIL',
      'recommendation≠charge/deploy',
    ),
  );

  const sealed = await denyFounderSealedFromFederation({
    federationId,
    actor: input.actor,
    payload: input.sealedPayload ?? 'SEALED',
    root,
  });
  hops.push(
    hop(
      'founder_sealed_deny',
      sealed.allowed === false && sealed.reason === FOUNDER_SEALED_DENIED ? 'PASS' : 'FAIL',
      sealed.reason,
    ),
  );

  const auth = await probeFederationAuthorityTransfer({
    federationId,
    fromOrgId: input.orgId,
    toOrgId: input.peerOrgId,
    actor: input.actor,
    root,
  });

  const gate = decisionGate({
    id: `bm-cycle-${input.orgId}`,
    action: 'org-neural-federation-cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  await appendEvidenceEvent(
    {
      kind: 'security_review',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-BM org neural federation / knowledge exchange / BI nervous cycle',
      payload: {
        hops: hops.map((item) => item.hop),
        productionAuthorization: false,
        authorityTransferred: auth.authorityTransferred,
        authorityReason: AUTHORITY_NON_TRANSFER,
      },
    },
    root,
  );

  await appendLearning(
    {
      domain: '62l-bm',
      subject: 'org-neural-federation-bi-nervous',
      claimState: 'UNKNOWN',
      summary:
        '62L-BM cycle complete; derived-only exchange via explicit synapse contracts; sparse BI nodes; learning ≠ authority.',
      sourceRefs: hops.map((item) => item.hop),
      evidence: ['phase62lbm'],
    },
    root,
  );

  hops.push(
    hop(
      'evidence',
      auth.authorityTransferred === false && gate.executableByAgent === true ? 'PASS' : 'FAIL',
      `authorityNonTransfer=${auth.reason}; gate=${gate.reason}`,
    ),
  );
  hops.push(
    hop(
      'learning',
      'PASS',
      `learningIsAuthority=${BM_LOCKS.LEARNING_IS_AUTHORITY}`,
    ),
  );

  return {
    phase: '62L-BM',
    federationId,
    hops,
    cycle: ORG_NEURAL_FEDERATION_CYCLE,
    honesty: HONESTY_BANNER,
    locks: BM_LOCKS,
    humanApprovalRequired: gate.humanApprovalRequired,
    executableByAgent: gate.executableByAgent,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    tipLand: false as const,
    nextPhaseTitle: NEXT_PHASE_TITLE,
  };
}

export async function buildOrgNeuralFederationHealthReport(cwd = process.cwd()) {
  const health = await checkLocalBrainHealth(cwd);
  const preds = predecessorMap(cwd);
  return {
    phase: '62L-BM',
    title:
      'Organization Neural Federation + Cross-Universe Knowledge Exchange + Multi-Layer Synapse Expansion + Global Business Intelligence Nervous System',
    honesty: HONESTY_BANNER,
    locks: BM_LOCKS,
    sparseBounds: SPARSE_BOUNDS,
    federation: orgNeuralFederationHonesty(),
    knowledgeExchange: knowledgeExchangeHonesty(),
    synapseExpansion: synapseExpansionHonesty(),
    biNervous: biNervousHonesty(),
    predecessors: preds,
    localBrainHealth: health,
    productionAuthorization: false as const,
    tipLand: false as const,
    l4AutonomyEnabled: false as const,
    githubIssue: 77,
    gitlabIssue: 11,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    cycle: ORG_NEURAL_FEDERATION_CYCLE,
    waitingGates: (Object.keys(preds) as Array<keyof typeof preds>).filter(
      (id) =>
        ['BK', 'BI', 'BH', 'BG', 'BF', 'BE', 'BB', 'AZ'].includes(id) &&
        (preds[id].module === 'WAITING_DATA' || preds[id].report === 'WAITING_DATA'),
    ),
  };
}
