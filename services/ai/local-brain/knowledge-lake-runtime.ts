import { publishAgentMessage } from './agent-bus';
import { createFounderDigitalTwin } from './founder-digital-twin';
import { GlobalBrainHighways } from './global-brain-highways';
import { NeuralFabric } from './neural-fabric';
import { evaluateOfflineTask } from './offline-policy';
import { providerSlots } from './provider-fabric';
import { getRuntime } from './hybrid-runtime';
import { checkLocalBrainHealth } from './health-check';
import { decisionGate } from './decision-gate';
import { appendLearning } from './learning-ledger';
import { knowledgeLakeStats } from './knowledge-lake';
import { ingestIndustrySource, federateIndustryMemory } from './industry-memory-federation';
import { offlineIndexStats } from './offline-intelligence-index';
import { attachTranslationMetadata, multilingualStats } from './multilingual-source';
import {
  evidenceGraphStats,
  linkLakeSourceToClaim,
  promoteLakeClaim,
  recordLakeContradiction,
} from './evidence-graph';
import { executeLogicalRetrieval, planLogicalRetrieval, LOGICAL_CORPUS_CEILING } from './logical-retrieval';
import { worldKnowledgeStats } from './world-knowledge-graph';
import { cortexMemoryStats } from './memory-cortex';
import { buildFounderReport } from './founder-report';

export const KNOWLEDGE_LAKE_ARCHITECTURE = [
  'founder_digital_twin',
  'neural_highways',
  'global_brain_highways',
  'agent_bus',
  'context_vault',
  'knowledge_lake',
  'multilingual_preservation',
  'industry_memory_federation',
  'offline_intelligence_index',
  'evidence_graph',
  'contradiction',
  'logical_retrieval',
  'evidence_promotion_gate',
  'decision_gate',
  'learning_ledger',
  'memory_cortex',
] as const;

export const KNOWLEDGE_LAKE_LOCKS = {
  L4_AUTONOMY_ENABLED: false,
  AUTO_PRODUCTION_DEPLOY: false,
  PRODUCTION_DATABASE_WRITE: false,
  PRODUCTION_GIT_PUSH: false,
  AUTO_PERMISSION_EXPANSION: false,
  PRODUCTION_AUTHORIZATION: false,
} as const;

export async function runKnowledgeLakePathway(input: {
  tenantId: string;
  universeId: string;
  founderId?: string;
  industry: string;
  sourceLanguage: string;
  originalText: string;
  sourceUri: string;
  contradictingText?: string;
  translationLanguage?: string;
  translatedText?: string;
  estimatedRecords?: number;
  needsExternalFreshness?: boolean;
  needsCloudProvider?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const offline = evaluateOfflineTask({
    needsInternet: input.needsExternalFreshness === true,
    needsCloudProvider: input.needsCloudProvider === true,
    needsExternalFreshness: input.needsExternalFreshness === true,
    needsProductionWrite: false,
    needsPermissionChange: false,
    classification: 'internal',
  });

  const twin = createFounderDigitalTwin({
    founderId: input.founderId ?? 'founder-sim',
    tenantId: input.tenantId,
    universeId: input.universeId,
    displayName: 'Founder Digital Twin (not the real founder)',
  });
  const highways = new GlobalBrainHighways();
  const fabric = new NeuralFabric();
  fabric.registerNode({
    id: `lake:${input.tenantId}`,
    kind: 'knowledge',
    label: 'Knowledge Lake',
    tenantId: input.tenantId,
    universeId: input.universeId,
    trust: 'UNKNOWN',
    provenanceRefs: ['knowledge-lake'],
  });
  const routed = highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'founder_twin',
    toLane: 'knowledge',
    topic: `Industry memory ${input.industry}`,
    body: input.originalText.slice(0, 500),
    evidenceRefs: [input.sourceUri],
  });
  const bus = publishAgentMessage({
    fromRole: 'knowledge_librarian',
    toRole: 'evidence_verifier',
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'evidence',
    body: `Knowledge Lake ingest for ${input.industry}`,
    evidenceRefs: [input.sourceUri],
    requiresHumanApproval: false,
  });
  const gate = decisionGate({
    id: `lake-decision-${bus.id}`,
    action: `Publish ${input.industry} lake memory`,
    consequence: 'HIGH',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: true,
  });

  if (!offline.allowed) {
    return {
      steps: KNOWLEDGE_LAKE_ARCHITECTURE,
      twin: { id: twin.id, twinIsRealFounder: false as const, authority: twin.authority },
      highwayAccepted: routed.accepted,
      neuralFabric: fabric.stats(),
      agentBusMessageId: bus.id,
      state: offline.state === 'DENIED' ? 'UNAVAILABLE' as const : offline.state,
      ingested: null,
      translation: null,
      contradiction: null,
      federation: null,
      logical: {
        plan: planLogicalRetrieval({
          query: input.industry,
          estimatedRecords: input.estimatedRecords ?? LOGICAL_CORPUS_CEILING,
        }),
        catalogSize: 0,
        hits: [],
        federation: null,
        materializedFilesCreated: 0 as const,
        materializedEmbeddingsCreated: 0 as const,
        materializedAgentsCreated: 0 as const,
        inventedFacts: false as const,
        state: 'AVAILABLE' as const,
        reason: offline.reason,
      },
      promotion: null,
      decision: gate,
      learningId: null,
      locks: KNOWLEDGE_LAKE_LOCKS,
      productionAuthorization: false as const,
      inventedFacts: false as const,
      reason: offline.reason,
      next: '62L-AC — next knowledge-ops / executive-memory child after Y/Z/AA reports exist',
    };
  }

  const ingested = await ingestIndustrySource({
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: input.industry,
    partition: 'business',
    sourceUri: input.sourceUri,
    sourceLanguage: input.sourceLanguage,
    originalText: input.originalText,
    provenanceRefs: [input.sourceUri],
    root,
  });
  const translation = input.translationLanguage
    ? await attachTranslationMetadata({
      lakeObjectId: ingested.object.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      targetLanguage: input.translationLanguage,
      translatedText: input.translatedText,
      translator: input.translatedText ? 'human' : 'local_model',
      localModelConfigured: Boolean(input.translatedText),
      root,
    })
    : null;

  const claimA = `claim-${ingested.object.contentHash.slice(0, 12)}-a`;
  await linkLakeSourceToClaim({
    tenantId: input.tenantId,
    universeId: input.universeId,
    lakeObjectId: ingested.object.id,
    claimId: claimA,
    claimLabel: `${input.industry} source claim`,
    claimSummary: input.originalText.slice(0, 200),
    claimState: 'HISTORICAL_ACCOUNT',
    partition: 'business',
    domain: 'history',
    evidenceRefs: [`lake:${ingested.object.id}`],
    root,
  });

  let contradiction = null;
  if (input.contradictingText) {
    const other = await ingestIndustrySource({
      tenantId: input.tenantId,
      universeId: input.universeId,
      industry: input.industry,
      partition: 'business',
      sourceUri: `${input.sourceUri}#dispute`,
      sourceLanguage: input.sourceLanguage,
      originalText: input.contradictingText,
      provenanceRefs: [`${input.sourceUri}#dispute`],
      root,
    });
    const claimB = `claim-${other.object.contentHash.slice(0, 12)}-b`;
    await linkLakeSourceToClaim({
      tenantId: input.tenantId,
      universeId: input.universeId,
      lakeObjectId: other.object.id,
      claimId: claimB,
      claimLabel: `${input.industry} disputing claim`,
      claimSummary: input.contradictingText.slice(0, 200),
      claimState: 'DISPUTED',
      partition: 'business',
      domain: 'history',
      evidenceRefs: [`lake:${other.object.id}`],
      root,
    });
    contradiction = await recordLakeContradiction({
      tenantId: input.tenantId,
      universeId: input.universeId,
      partition: 'business',
      claimA,
      claimB,
      lakeObjectA: ingested.object.id,
      lakeObjectB: other.object.id,
      evidenceRefs: [`lake:${ingested.object.id}`, `lake:${other.object.id}`],
      root,
    });
  }

  const federation = await federateIndustryMemory({
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: input.industry,
    query: input.originalText.slice(0, 80),
    root,
  });
  const logical = await executeLogicalRetrieval({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.industry,
    industry: input.industry,
    estimatedRecords: input.estimatedRecords ?? LOGICAL_CORPUS_CEILING,
    root,
  });
  const promotion = await promoteLakeClaim({
    text: input.originalText.slice(0, 120),
    tenantId: input.tenantId,
    universeId: input.universeId,
    lakeObjectId: ingested.object.id,
    root,
  });
  const learning = await appendLearning({
    domain: input.industry,
    subject: 'knowledge-lake-ingest',
    claimState: 'HISTORICAL_ACCOUNT',
    summary: `Ingested local industry source ${ingested.object.id}. Promotion is not PASS.`,
    sourceRefs: [input.sourceUri],
    evidence: [`lake:${ingested.object.id}`],
  }, root);

  return {
    steps: KNOWLEDGE_LAKE_ARCHITECTURE,
    twin: { id: twin.id, twinIsRealFounder: false as const, authority: twin.authority },
    highwayAccepted: routed.accepted,
    neuralFabric: fabric.stats(),
    agentBusMessageId: bus.id,
    state: 'AVAILABLE' as const,
    ingested,
    translation,
    contradiction,
    federation,
    logical,
    promotion,
    decision: gate,
    learningId: learning.id,
    locks: KNOWLEDGE_LAKE_LOCKS,
    productionAuthorization: false as const,
    inventedFacts: false as const,
    reason: 'Local Knowledge Lake pathway completed against the durable catalog only.',
    next: '62L-AC — next knowledge-ops / executive-memory child after Y/Z/AA reports exist',
  };
}

export async function buildKnowledgeLakeHealthReport(root = process.cwd()) {
  const [health, lake, index, multilingual, evidence, world, memory, founder] = await Promise.all([
    checkLocalBrainHealth(root),
    knowledgeLakeStats(root),
    offlineIndexStats(root),
    multilingualStats(root),
    evidenceGraphStats(root),
    worldKnowledgeStats(root),
    cortexMemoryStats(root),
    buildFounderReport(root),
  ]);
  const cloud = ['aws', 'azure', 'gcp'] as const;
  return {
    generatedAt: new Date().toISOString(),
    architecture: KNOWLEDGE_LAKE_ARCHITECTURE,
    localHealth: health,
    lake,
    index,
    multilingual,
    evidence,
    worldKnowledge: world,
    memoryCortex: memory,
    logicalPlan: planLogicalRetrieval({
      query: 'health-probe',
      estimatedRecords: LOGICAL_CORPUS_CEILING,
    }),
    predecessorReports: {
      '62L-X': 'PRESENT',
      '62L-V': 'PRESENT',
      '62L-U': 'PRESENT',
      '62L-O': 'PRESENT',
      '62L-Y': 'PRESENT',
      '62L-Z': 'WAITING_DATA',
      '62L-AA': 'WAITING_DATA',
    },
    windowsNodeVerification: 'NOT_TESTED',
    githubIssue39: 'UNAVAILABLE',
    founderTwinIsRealFounder: false as const,
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE',
      configured: slot.configured,
    })),
    cloudRuntimes: cloud.map((provider) => {
      const runtime = getRuntime(provider);
      return { provider, state: runtime.configured ? runtime.state : 'UNAVAILABLE' };
    }),
    locks: KNOWLEDGE_LAKE_LOCKS,
    quantumProductionDependency: false as const,
    darkMatterEnergy: 'RESEARCH_ONLY' as const,
    planetaryGalactic: 'SIMULATION_ONLY' as const,
    safety: founder.safety,
    productionAuthorization: false as const,
    inventedPass: false as const,
    next: '62L-AC — next knowledge-ops / executive-memory child after Y/Z/AA reports exist',
  };
}
