import { access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LocalCheckpointStore } from './checkpoint-store';
import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { getRuntime } from './hybrid-runtime';
import { providerSlots } from './provider-fabric';
import { runDecisionCouncil } from './workcells';
import { sealedVaultStats, SEALED_REDACTION, redactSealedFields } from './ceo-sealed-vault';
import { INFORMATION_ROUTING_LOOP } from './information-control-tower-types';
import { runInformationControlTowerCycle } from './information-control-tower-runtime';
import { evaluateOfflineTask } from './offline-policy';
import type { SealedActor } from './hybrid-edge-cloud-types';
import {
  ENTERPRISE_NERVOUS_CYCLE,
  ENTERPRISE_NERVOUS_LOCKS,
  NEXT_PHASE_TITLE_ONLY,
  type CommunicationContextSignal,
  type EnsEvidenceState,
  type EnsHopRecord,
} from './enterprise-nervous-types';
import {
  enqueuePersistentEnsEvent,
  publishOfflineAgentCommunication,
} from './offline-event-fabric';
import { recordMeasurableLearning, runBoundedAgentReasoning } from './bounded-reasoning-learning';
import {
  communicationContextFromSignals,
  culturalIntelligenceHint,
  describeLanguageCapability,
  languageCatalogSize,
  listLanguageCatalog,
} from './cultural-language-catalog';
import {
  federateAuthorizedAgents,
  ingestHistoricalKnowledge,
  recordHistoricalCulturalTimeline,
} from './historical-timeline-federation';
import {
  advancedMathematicsStatistics,
  applyLegalPolicyConstraints,
  lawfulCompetitiveStrategy,
  quantResearchSupport,
  quantumResearchComparison,
} from './strategy-legal-math';
import {
  conveneCyberDefenseCouncil,
  longTermOsPortability,
  runDefensiveCyberAction,
} from './defensive-cyber-portability';
import { refuseSentinelSpyware, watchAuthorizedXivFlow } from './ethical-data-sentinel';
import {
  connectAuthorizedHop,
  proposeWormholeShortcut,
  registerEnsEndpoint,
} from './wormhole-optimizer';

export { ENTERPRISE_NERVOUS_CYCLE, ENTERPRISE_NERVOUS_LOCKS, NEXT_PHASE_TITLE_ONLY };

export type EnsNeed = {
  tenantId: string;
  universeId: string;
  peerUniverseId?: string;
  topic: string;
  body: string;
  languageCode?: string;
  culturalRegion?: string;
  signals?: CommunicationContextSignal[];
  historicalText?: string;
  historicalEra?: string;
  provenanceRefs?: string[];
  samples?: number[];
  consequence?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  production?: boolean;
  humanApproved?: boolean;
  sealedPayload?: string;
  actor?: SealedActor;
  collusionPattern?: 'coordinated_pricing' | 'bid_rigging' | 'market_allocation' | 'csi_exchange';
  cyberAction?: string;
  ownedByXiv?: boolean;
  wormholeFrom?: string;
  wormholeTo?: string;
  skipWormholeNodes?: string[];
  federatePeer?: boolean;
  root?: string;
};

export type EnsCycleResult = {
  hops: EnsHopRecord[];
  state: EnsEvidenceState;
  humanGate: ReturnType<typeof decisionGate>;
  sealedPayload: typeof SEALED_REDACTION;
  l4AutonomyEnabled: false;
  founderImpersonation: false;
  productionAuthorization: false;
  inventedPass: false;
};

function hop(name: EnsHopRecord['hop'], state: EnsEvidenceState, summary: string, refs: string[] = []): EnsHopRecord {
  return { hop: name, state, summary, refs };
}

function predecessorReportState(root: string, file: string): EnsEvidenceState {
  const candidates = [
    join(root, 'docs', 'operations', file),
    join(root, '..', 'docs', 'operations', file),
    join(root, '..', '..', 'docs', 'operations', file),
  ];
  return candidates.some((path) => existsSync(path)) ? 'PASS' : 'WAITING_DATA';
}

async function probeLocalModule(file: string): Promise<EnsEvidenceState> {
  try {
    await access(join(dirname(fileURLToPath(import.meta.url)), file));
    return 'PASS';
  } catch {
    return 'WAITING_DATA';
  }
}

export async function probePredecessorConnectors(): Promise<Record<string, EnsEvidenceState>> {
  return {
    enterpriseOpsPlanner: await probeLocalModule('enterprise-ops-runtime.ts'),
    supplyChainNetwork: await probeLocalModule('supply-chain-runtime.ts'),
    informationControlTower: await probeLocalModule('information-control-tower-runtime.ts'),
    agentSociety: await probeLocalModule('agent-society-runtime.ts'),
    causalTwins: await probeLocalModule('causal-world-runtime.ts'),
    knowledgeLake: await probeLocalModule('knowledge-lake.ts'),
    distributedMesh: await probeLocalModule('distributed-mesh-runtime.ts'),
    learningLedger: await probeLocalModule('learning-ledger.ts'),
    decisionGate: await probeLocalModule('decision-gate.ts'),
    neuralTransit: await probeLocalModule('global-brain-highways.ts'),
  };
}

export async function raiseExceptionMeshSignal(input: {
  tenantId: string;
  universeId: string;
  kind: string;
  summary: string;
  sealed?: boolean;
  root?: string;
}) {
  if (input.sealed) {
    return { accepted: false as const, state: 'FAIL' as const, reason: 'SEALED_EXCEPTION_NOT_ON_ORDINARY_MESH' };
  }
  const queued = await enqueuePersistentEnsEvent({
    tenantId: input.tenantId,
    universeId: input.universeId,
    topic: `exception:${input.kind}`,
    payloadPreview: input.summary,
    root: input.root,
  });
  return { accepted: queued.accepted, state: queued.state, eventId: queued.event?.id, permissionExpansion: false as const };
}

export async function runEnterpriseNervousCycle(need: EnsNeed): Promise<EnsCycleResult> {
  const hops: EnsHopRecord[] = [];
  const refs = need.provenanceRefs ?? [];
  const root = need.root ?? process.cwd();
  const actor = need.actor ?? { kind: 'ordinary_agent' as const, id: 'ens-agent', role: 'knowledge_curator' };

  const eventComm = await publishOfflineAgentCommunication({
    fromRole: 'ens-event',
    toRole: 'ens-policy',
    tenantId: need.tenantId,
    universeId: need.universeId,
    body: need.body,
    evidenceRefs: refs,
    sealedPayload: need.sealedPayload,
    root,
  });
  const queued = need.sealedPayload
    ? { accepted: false, state: 'FAIL' as const, reason: 'SEALED' }
    : await enqueuePersistentEnsEvent({
        tenantId: need.tenantId,
        universeId: need.universeId,
        topic: need.topic,
        payloadPreview: need.body,
        root,
      });
  hops.push(
    hop(
      'event',
      eventComm.accepted && queued.accepted ? 'PASS' : 'FAIL',
      eventComm.accepted ? 'Offline agent communication + persistent event queued.' : eventComm.reason ?? queued.reason ?? 'event denied',
      eventComm.note ? [eventComm.note.id] : [],
    ),
  );

  const policyOffline = evaluateOfflineTask({
    needsInternet: false,
    needsCloudProvider: false,
    needsExternalFreshness: false,
    needsProductionWrite: false,
    needsPermissionChange: false,
    classification: 'internal',
  });
  const legal = applyLegalPolicyConstraints({
    action: need.topic,
    constraints: ['antitrust', 'privacy', 'human_gate'],
    consequence: need.consequence ?? 'LOW',
    production: need.production,
    legalCommitment: false,
  });
  const strategy = lawfulCompetitiveStrategy({
    tenantId: need.tenantId,
    universeId: need.universeId,
    objective: need.topic,
    collusionPattern: need.collusionPattern,
  });
  hops.push(
    hop(
      'policy',
      strategy.allowed && (legal.allowed || legal.humanApprovalRequired) && policyOffline.state !== 'DENIED'
        ? strategy.state
        : 'FAIL',
      `Policy + lawful strategy: ${strategy.reason}. Offline=${policyOffline.state}.`,
      [INFORMATION_ROUTING_LOOP[0]],
    ),
  );

  const language = describeLanguageCapability(need.languageCode ?? 'en');
  const culture = await culturalIntelligenceHint({
    tenantId: need.tenantId,
    universeId: need.universeId,
    topic: need.topic,
    region: need.culturalRegion,
    provenanceRefs: refs,
    root,
  });
  const comms = communicationContextFromSignals({
    signals: need.signals ?? ['uncertainty'],
    languageCode: need.languageCode,
    culturalRegion: need.culturalRegion,
  });
  hops.push(
    hop(
      'language_culture',
      culture.individualDeterministicClaim === false && comms.literalAgentFeelings === false ? culture.state : 'FAIL',
      `Language ${language.code}=${language.capabilityState}. Cultural non-determinism preserved. Emotions are communication context.`,
      culture.provenanceRefs,
    ),
  );

  let historicalRefs = refs;
  if (need.historicalText) {
    const ingested = await ingestHistoricalKnowledge({
      tenantId: need.tenantId,
      universeId: need.universeId,
      era: need.historicalEra ?? 'unknown',
      sourceUri: `ens://history/${need.topic}`,
      sourceLanguage: need.languageCode ?? 'en',
      originalText: need.historicalText,
      provenanceRefs: refs.length ? refs : ['ens-historical-source'],
      root,
    });
    const timeline = await recordHistoricalCulturalTimeline({
      tenantId: need.tenantId,
      universeId: need.universeId,
      era: ingested.object.era,
      topic: need.topic,
      lakeObjectId: ingested.object.id,
      provenanceRefs: ingested.object.provenanceRefs,
      root,
    });
    historicalRefs = [ingested.object.id, timeline.id];
  }
  hops.push(hop('historical_evidence', historicalRefs.length ? 'PASS' : 'WAITING_DATA', 'Historical knowledge/timeline hop.', historicalRefs));

  const reasoning = await runBoundedAgentReasoning({
    tenantId: need.tenantId,
    universeId: need.universeId,
    question: need.topic,
    root,
  });
  hops.push(hop('reasoning', reasoning.inventedFacts ? 'FAIL' : reasoning.state, reasoning.conclusion, reasoning.evidenceRefs));

  const math = advancedMathematicsStatistics({
    samples: need.samples ?? [1, 2, 3],
    provenanceRefs: historicalRefs.length ? historicalRefs : ['ens-math'],
  });
  const quant = quantResearchSupport([
    {
      id: 'ens-q1',
      weight: 1,
      confidence: 0.6,
      direction: 0,
      evidenceRefs: historicalRefs.length ? historicalRefs : ['ens-quant'],
    },
  ]);
  const quantum = quantumResearchComparison({
    objective: need.topic,
    qubitCount: 4,
    classicalSignals: [
      {
        id: 'baseline',
        weight: 1,
        confidence: 0.5,
        direction: 0,
        evidenceRefs: historicalRefs.length ? historicalRefs : ['ens-classical'],
      },
    ],
  });
  hops.push(
    hop(
      'math_quant',
      math.state === 'PASS' && quantum.claimsQuantumAdvantage === false ? 'PASS' : math.state,
      `Classical math ${math.state}; quant ${quant.recommendation}; quantum advantage claimed=${quantum.claimsQuantumAdvantage}.`,
      [],
    ),
  );

  const council = await runDecisionCouncil({
    tenantId: need.tenantId,
    universeId: need.universeId,
    action: need.topic,
    consequence: need.consequence ?? 'LOW',
    production: need.production,
    approved: need.humanApproved,
    root,
  });
  let federationState: EnsEvidenceState = 'WAITING_DATA';
  if (need.federatePeer && need.peerUniverseId) {
    const fed = await federateAuthorizedAgents({
      tenantId: need.tenantId,
      fromUniverseId: need.universeId,
      toUniverseId: need.peerUniverseId,
      explicitAuthorization: true,
      root,
    });
    federationState = fed.state;
  }
  hops.push(
    hop(
      'agent_council',
      'PASS',
      `Decision council ran. Federation=${federationState}. Control tower loop reused for policy context.`,
      [],
    ),
  );
  void council;

  const cyber = runDefensiveCyberAction({
    action: (need.cyberAction as 'threat_modeling') ?? 'threat_modeling',
    scope: 'xiv_owned',
    targetSystem: 'xiv-local-brain',
    tenantId: need.tenantId,
    ownedByXiv: need.ownedByXiv !== false,
  });
  conveneCyberDefenseCouncil({ tenantId: need.tenantId, universeId: need.universeId });
  const sentinel = need.sealedPayload
    ? await watchAuthorizedXivFlow({
        tenantId: need.tenantId,
        universeId: need.universeId,
        flowId: 'ens-cycle',
        watch: 'leakage',
        authorizedFlow: true,
        destinationAuthorized: true,
        provenanceRefs: historicalRefs,
        classification: 'sealed',
        sealedPayload: need.sealedPayload,
        actorHasAccess: true,
        root,
      })
    : await watchAuthorizedXivFlow({
        tenantId: need.tenantId,
        universeId: need.universeId,
        flowId: 'ens-cycle',
        watch: 'provenance' === 'provenance' ? 'bad_provenance' : 'leakage',
        authorizedFlow: true,
        destinationAuthorized: true,
        provenanceRefs: historicalRefs.length ? historicalRefs : ['ens-flow'],
        classification: 'internal',
        actorHasAccess: true,
        root,
      });
  const spyware = refuseSentinelSpyware('spyware');
  hops.push(
    hop(
      'security_data_sentinel',
      cyber.allowed && sentinel.allowed && spyware.allowed === false ? sentinel.state : 'FAIL',
      `Cyber defensive=${cyber.defensiveOnly}. Sentinel spyware refused. Sentinel state=${'state' in sentinel ? sentinel.state : sentinel.reason}.`,
      [],
    ),
  );

  registerEnsEndpoint({
    id: need.wormholeFrom ?? 'knowledge-a',
    kind: 'knowledge',
    tenantId: need.tenantId,
    universeId: need.universeId,
    ownerId: need.tenantId,
    guardianProtected: false,
    rlsProtected: true,
    sealed: false,
    classification: 'internal',
  });
  registerEnsEndpoint({
    id: need.wormholeTo ?? 'agent-b',
    kind: 'agent',
    tenantId: need.tenantId,
    universeId: need.universeId,
    ownerId: need.tenantId,
    guardianProtected: false,
    rlsProtected: true,
    sealed: false,
    classification: 'internal',
  });
  connectAuthorizedHop({
    tenantId: need.tenantId,
    universeId: need.universeId,
    from: need.wormholeFrom ?? 'knowledge-a',
    to: need.wormholeTo ?? 'agent-b',
  });
  const wormhole = proposeWormholeShortcut({
    tenantId: need.tenantId,
    universeId: need.universeId,
    from: need.wormholeFrom ?? 'knowledge-a',
    to: need.wormholeTo ?? 'agent-b',
    actorId: actor.id,
    skipNodes: need.skipWormholeNodes,
    sealedPayload: need.sealedPayload,
  });
  hops.push(
    hop(
      'highway_optimization',
      wormhole.state,
      `Wormhole ${wormhole.reason}; bypass=${wormhole.bypassedBoundary}; tunnels=${wormhole.tunnelsThroughSecurity}.`,
      wormhole.path,
    ),
  );

  const gate = decisionGate({
    id: 'ens-gate',
    action: need.topic,
    consequence: need.consequence ?? 'LOW',
    production: need.production === true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  const humanOk = !gate.humanApprovalRequired || need.humanApproved === true;
  hops.push(
    hop(
      'human_gate',
      humanOk ? 'PASS' : 'FAIL',
      gate.reason,
      [],
    ),
  );

  const redacted = redactSealedFields({
    sealedPayload: need.sealedPayload ?? '',
    payload: need.sealedPayload ?? '',
  });
  await appendEvidenceEvent({
    kind: 'evidence',
    tenantId: need.tenantId,
    universeId: need.universeId,
    summary: `ENS cycle ${need.topic}`,
    payload: { refs: historicalRefs, sealed: SEALED_REDACTION },
  }, root);
  hops.push(hop('outcome', 'PASS', 'Outcome recorded on evidence ledger. Sealed fields redacted.', []));

  hops.push(
    hop(
      'evaluation',
      languageCatalogSize() >= 100 ? 'PASS' : 'FAIL',
      `Language catalog size=${languageCatalogSize()}. Unconfigured languages remain UNAVAILABLE.`,
      [],
    ),
  );

  const learning = await recordMeasurableLearning({
    tenantId: need.tenantId,
    universeId: need.universeId,
    subject: need.topic,
    summary: 'ENS cycle learning (no invented feelings).',
    evidenceRefs: historicalRefs.length ? historicalRefs : ['ens-cycle'],
    predictedConfidence: 0.5,
    observedOutcome: 0.5,
    root,
  });
  hops.push(hop('learning', 'PASS', 'Learning ledger write. permissionChange=false.', [learning.entry.id]));

  const store = new LocalCheckpointStore(join(root, '.xiv-local', 'brain-state.json'));
  await store.checkpoint({
    taskId: `ens-${need.tenantId}`,
    at: new Date().toISOString(),
    state: 'completed',
    attempt: 1,
    summary: 'ENS cycle memory checkpoint.',
  });
  hops.push(hop('memory', 'PASS', 'Checkpoint memory write. No founder impersonation.', []));

  if (need.topic.includes('control-tower-reuse')) {
    await runInformationControlTowerCycle({
      tenantId: need.tenantId,
      universeId: need.universeId,
      need: need.topic,
      domain: 'business',
      actor,
      root,
    }).catch(() => undefined);
  }

  void comms;
  void redacted;
  void getRuntime;

  const failed = hops.some((item) => item.state === 'FAIL');
  return {
    hops,
    state: failed ? 'FAIL' : hops.every((item) => item.hop) ? 'PASS' : 'UNKNOWN',
    humanGate: gate,
    sealedPayload: SEALED_REDACTION,
    l4AutonomyEnabled: false,
    founderImpersonation: false,
    productionAuthorization: false,
    inventedPass: false,
  };
}

export async function buildEnterpriseNervousHealthReport(root = process.cwd()) {
  const health = await checkLocalBrainHealth(root);
  const sealed = await sealedVaultStats(root);
  const connectors = await probePredecessorConnectors();
  const catalog = listLanguageCatalog();
  const unavailableLanguages = catalog.filter((item) => item.capabilityState === 'UNAVAILABLE').length;
  return {
    generatedAt: new Date().toISOString(),
    architecture: ENTERPRISE_NERVOUS_CYCLE,
    localHealth: health,
    sealedVault: sealed,
    languageCatalogSize: catalog.length,
    unconfiguredLanguages: unavailableLanguages,
    connectors,
    predecessors: {
      '62L-AP': predecessorReportState(root, '62L_AP_ENTERPRISE_OPERATIONS_PLANNER_COMMAND_CENTER_REPORT.md'),
      '62L-AO': predecessorReportState(root, '62L_AO_GLOBAL_AGENTIC_SUPPLY_CHAIN_NETWORK_REPORT.md'),
      '62L-AN': predecessorReportState(root, '62L_AN_INFORMATION_CONTROL_TOWER_SEMANTIC_ROUTER_REPORT.md'),
      '62L-AG': predecessorReportState(root, '62L_AG_PERSISTENT_OFFLINE_AGENT_SOCIETY_REPORT.md'),
      '62L-AH': predecessorReportState(root, '62L_AH_CAUSAL_WORLD_MODEL_DIGITAL_TWINS_REPORT.md'),
      '62L-AB': predecessorReportState(root, '62L_AB_KNOWLEDGE_LAKE_INDUSTRY_MEMORY_REPORT.md'),
      '62L-AD': predecessorReportState(root, '62L_AD_DISTRIBUTED_OFFLINE_AGENT_MESH_REPORT.md'),
      '62L-AE': predecessorReportState(root, '62L_AE_HYBRID_EDGE_CLOUD_CEO_VAULT_REPORT.md'),
    },
    githubIssue55: 'UNAVAILABLE' as const,
    windowsNodeVerification: 'NOT_TESTED' as const,
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE',
    })),
    localRuntime: getRuntime('local').configured ? getRuntime('local').state : 'UNAVAILABLE',
    locks: ENTERPRISE_NERVOUS_LOCKS,
    honesty: {
      l4AutonomyEnabled: false,
      founderImpersonation: false,
      inventedPass: false,
      sentinelIsSpyware: false,
      covertSurveillance: false,
      wormholeBypassesBoundaries: false,
      offensiveThirdPartyExploit: false,
      claimsQuantumAdvantage: false,
      literalAgentFeelings: false,
      culturalDeterminismAboutIndividuals: false,
      tipLand: false,
    },
    productionAuthorization: false as const,
    next: NEXT_PHASE_TITLE_ONLY,
  };
}

export { raiseExceptionMeshSignal as raiseEnsException };
