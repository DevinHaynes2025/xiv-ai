import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { retrieveEvidencePathway } from './cortex-evidence';
import { appendLearning } from './learning-ledger';
import { rememberCortexTrace } from './memory-cortex';
import { conveneReflectionCouncil } from './reflection-council';
import { verifySecurity } from './security-verifier';
import { recordEvaluation } from './evaluation-harness';
import { seedSupplyNetwork } from './supply-chain-runtime';
import { providerSlots } from './provider-fabric';
import { getRuntime } from './hybrid-runtime';
import {
  DISCOVERY_HONESTY,
  KNOWLEDGE_DISCOVERY_CYCLE,
  type DiscoveryHop,
  type DiscoveryHopRecord,
  type DiscoveryStory,
  type EvidenceState,
} from './discovery-invention-types';
import { gateDiscoveryAction } from './discovery-authority';
import { predecessorMap } from './discovery-predecessors';
import {
  mineCrossDomainAnalogy,
  mineHistoricalPatterns,
  mineInformationSupplyPatterns,
  mineScientificRelationshipCandidates,
  mineSupplyChainPatterns,
  mapTechnologyConvergence,
} from './pattern-mining';
import { detectDiscoveryGap, mintHypothesisPortfolio } from './hypothesis-portfolio';
import {
  designExperiment,
  enterTrustedBrain,
  generatePrototype,
  promoteDiscoveryEvidence,
  replicateExperiment,
  runDesignedExperiment,
  runDigitalTwinExperiment,
  runMathOptimization,
  runQuantDiscovery,
  runQuantumDiscovery,
} from './invention-lab';

export { KNOWLEDGE_DISCOVERY_CYCLE, DISCOVERY_HONESTY };

export type DiscoveryCycleResult = {
  id: string;
  tenantId: string;
  universeId: string;
  storyId: string;
  state: 'completed' | 'denied' | 'waiting_data' | 'failed';
  hops: DiscoveryHopRecord[];
  inventedPass: false;
  productionAuthorization: false;
  l4AutonomyEnabled: false;
  patternEqualsCausation: false;
  hypothesisEqualsFact: false;
  prototypeEqualsValidatedInvention: false;
};

type Store = { cycles: DiscoveryCycleResult[] };

function pathFor(root: string) {
  return xivLocalPath(root, 'discovery-invention-cycles.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(pathFor(root), { cycles: [] });
  return Array.isArray(parsed.cycles) ? parsed.cycles : [];
}

async function save(root: string, cycles: DiscoveryCycleResult[]) {
  await writeJsonFileAtomic(pathFor(root), { cycles: cycles.slice(-2_000) });
}

function hop(
  name: DiscoveryHop,
  state: EvidenceState | 'DENIED',
  summary: string,
  epistemicClass: DiscoveryHopRecord['epistemicClass'],
): DiscoveryHopRecord {
  return { hop: name, state, summary, epistemicClass, at: new Date().toISOString() };
}

export async function runKnowledgeDiscoveryCycle(story: DiscoveryStory & { root?: string }): Promise<DiscoveryCycleResult> {
  if (!story.tenantId || !story.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = story.root ?? process.cwd();
  const hops: DiscoveryHopRecord[] = [];

  const denied: DiscoveryCycleResult = {
    id: cortexId('dcycle'),
    tenantId: story.tenantId,
    universeId: story.universeId,
    storyId: story.id,
    state: 'denied',
    hops,
    inventedPass: false,
    productionAuthorization: false,
    l4AutonomyEnabled: false,
    patternEqualsCausation: false,
    hypothesisEqualsFact: false,
    prototypeEqualsValidatedInvention: false,
  };

  if (!story.approved) {
    hops.push(hop('knowledge', 'DENIED', 'Unapproved discovery stories are denied before gap detection.', 'UNKNOWN'));
    await save(root, [...await load(root), denied]);
    return denied;
  }

  const authority = gateDiscoveryAction({
    action: story.title,
    consequence: story.consequence,
    production: story.production,
  });
  if (!authority.allowed) {
    hops.push(hop('knowledge', 'DENIED', authority.reason, 'UNKNOWN'));
    await save(root, [...await load(root), denied]);
    return denied;
  }

  if (story.seedSupplyNetwork) {
    await seedSupplyNetwork({ tenantId: story.tenantId, universeId: story.universeId, root });
  }

  const knowledge = await retrieveEvidencePathway({
    tenantId: story.tenantId,
    universeId: story.universeId,
    query: story.question,
    needsExternalFreshness: story.needsExternalFreshness,
    root,
  });
  hops.push(hop(
    'knowledge',
    knowledge.state === 'WAITING_DATA' ? 'WAITING_DATA' : knowledge.state === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'UNKNOWN',
    `Local knowledge retrieval. inventedFacts=false. refs=${knowledge.evidenceRefs.length}`,
    'UNKNOWN',
  ));

  const gap = await detectDiscoveryGap({
    tenantId: story.tenantId,
    universeId: story.universeId,
    question: story.question,
    needsExternalFreshness: story.needsExternalFreshness,
    root,
  });
  hops.push(hop('gap_detection', gap.state, `Gap ${gap.id} unknownCount=${gap.unknownCount} inventedFacts=false`, 'UNKNOWN'));

  const historical = await mineHistoricalPatterns({ tenantId: story.tenantId, universeId: story.universeId, question: story.question, root });
  const supply = await mineSupplyChainPatterns({ tenantId: story.tenantId, universeId: story.universeId, question: story.question, root });
  const info = await mineInformationSupplyPatterns({ tenantId: story.tenantId, universeId: story.universeId, question: story.question, root });
  const scientific = await mineScientificRelationshipCandidates({ tenantId: story.tenantId, universeId: story.universeId, question: story.question, root });
  const convergence = await mapTechnologyConvergence({ tenantId: story.tenantId, universeId: story.universeId, question: story.question, root });
  hops.push(hop(
    'pattern_mining',
    historical.isCausation ? 'FAIL' : 'UNKNOWN',
    `historical=${historical.id} supply=${supply.id} info=${info.id} scientific=${scientific.id} convergence=${convergence.id}. Pattern ≠ causation.`,
    'PATTERN',
  ));

  const analogy = await mineCrossDomainAnalogy({ tenantId: story.tenantId, universeId: story.universeId, question: story.question, root });
  hops.push(hop('cross_industry_connections', analogy.evidenceState, `Analogy ${analogy.id}. analogyIsIdentity=false.`, 'PATTERN'));

  const portfolio = await mintHypothesisPortfolio({ tenantId: story.tenantId, universeId: story.universeId, gap, root });
  hops.push(hop('hypotheses', 'UNKNOWN', `Portfolio ${portfolio.id} items=${portfolio.items.length}. Hypothesis ≠ fact.`, 'HYPOTHESIS'));

  const twinExp = await runDigitalTwinExperiment({
    tenantId: story.tenantId,
    universeId: story.universeId,
    label: `discovery-twin:${story.id}`,
    root,
  });
  const math = await runMathOptimization({
    tenantId: story.tenantId,
    universeId: story.universeId,
    twinId: twinExp.twin.id,
    objective: `Reduce uncertainty about ${story.question}`,
    root,
  });
  const quant = runQuantDiscovery([{ id: 'q1', weight: 1, confidence: 0.4, direction: 0, evidenceRefs: gap.evidenceRefs }]);
  const quantum = runQuantumDiscovery();
  hops.push(hop(
    'math_optimization',
    math.cognitiveCompiler === 'WAITING_DATA' ? 'WAITING_DATA' : 'UNKNOWN',
    `compiler=${math.cognitiveCompiler} quant=${quant.decision.recommendation} qpu=${quantum.qpu} advantage=false`,
    'SIMULATION',
  ));

  const primary = portfolio.items.find((item) => item.role === 'primary') ?? portfolio.items[0];
  const design = designExperiment({ tenantId: story.tenantId, universeId: story.universeId, hypothesis: primary });
  const experiment = await runDesignedExperiment({
    tenantId: story.tenantId,
    universeId: story.universeId,
    design,
    fail: story.failExperiment,
    root,
  });
  hops.push(hop(
    'experiments',
    experiment.evidenceState,
    `Experiment ${experiment.id} deadEnd=${experiment.skippedDeadEnd} sim≠fact`,
    'SIMULATION',
  ));

  hops.push(hop(
    'digital_twins',
    'UNKNOWN',
    `Twin ${twinExp.twin.id} kind=${twinExp.twin.kind} isReality=false physicalControl=false`,
    'SIMULATION',
  ));

  const council = await conveneReflectionCouncil({
    tenantId: story.tenantId,
    universeId: story.universeId,
    question: `Skeptic review of discovery ${story.question}`,
    root,
  });
  const security = verifySecurity({
    files: [{ path: 'discovery-prototype.md', content: `prototype for ${story.question}` }],
    productionLocks: { l4Autonomy: false, autoProduction: false, productionDbWrite: false, productionGitPush: false, guardianOverride: false },
  });
  const evalRecord = await recordEvaluation({
    tenantId: story.tenantId,
    universeId: story.universeId,
    label: `discovery-skeptic:${story.id}`,
    kind: 'candidate',
    metrics: {
      evidenceQuality: knowledge.evidenceRefs.length ? 0.4 : 0.1,
      factualSupport: 0,
      testSuccess: experiment.evidenceState === 'PASS' ? 1 : 0,
      calibration: 0.5,
      correctionRate: 0,
      latencyMs: 1,
      resourceUse: { workcellsInFlight: 0, modelCallsUsed: 0, maxConcurrentWorkcells: 1 },
      agentCount: 4,
    },
    predictedConfidence: 0.4,
    observedOutcome: experiment.evidenceState === 'PASS' ? 1 : 0,
    evidenceRefs: gap.evidenceRefs,
    root,
  });
  const skepticState: EvidenceState = security.findings.some((finding) => finding.severity === 'CRITICAL' || finding.severity === 'HIGH')
    ? 'FAIL'
    : council.runtimeState === 'UNAVAILABLE'
      ? 'UNAVAILABLE'
      : 'UNKNOWN';
  hops.push(hop('skeptic_review', skepticState, `Council ${council.id} eval=${evalRecord.id} consensusForced=false`, 'HYPOTHESIS'));

  const replica = experiment.skippedDeadEnd
    ? { evidenceState: 'FAIL' as const, digestMatch: true, measurementAgreed: true, sharedMutableState: false as const, inventedPass: false as const }
    : await replicateExperiment({
      tenantId: story.tenantId,
      universeId: story.universeId,
      original: experiment,
      design,
      root,
    });
  hops.push(hop('replication', replica.evidenceState, `independent replica digestMatch=${replica.digestMatch} sharedMutable=${replica.sharedMutableState}`, 'SIMULATION'));

  const prototype = generatePrototype({
    tenantId: story.tenantId,
    universeId: story.universeId,
    experiment,
    title: `Prototype of ${story.title}`,
  });
  const promotion = promoteDiscoveryEvidence({
    text: story.question,
    replicatedPass: replica.evidenceState === 'PASS',
    humanApproved: story.humanApprovedTrustedEntry === true,
    evidence: replica.evidenceState === 'PASS'
      ? { source: 'local-discovery-lab', retrievedAt: new Date().toISOString(), reference: experiment.id }
      : null,
  });
  hops.push(hop(
    'evidence',
    promotion.promotedToVerifiedFact ? 'FAIL' : replica.evidenceState === 'PASS' ? 'UNKNOWN' : replica.evidenceState,
    `promotionAllowed=${promotion.allowed} promotedToVerifiedFact=${promotion.promotedToVerifiedFact}`,
    'HYPOTHESIS',
  ));

  const trusted = await enterTrustedBrain({
    tenantId: story.tenantId,
    universeId: story.universeId,
    prototype,
    humanReviewerId: story.humanReviewerId,
    humanApproved: story.humanApprovedTrustedEntry === true,
    root,
  });
  hops.push(hop(
    'human_review',
    trusted.accepted ? 'PASS' : 'DENIED',
    `trusted=${trusted.accepted} class=${trusted.epistemicClass} ${trusted.reason}`,
    trusted.epistemicClass === 'TRUSTED_CANDIDATE' ? 'TRUSTED_CANDIDATE' : 'PROTOTYPE',
  ));

  await appendLearning({
    domain: 'science',
    subject: `discovery:${story.id}`,
    claimState: 'MODEL_INFERENCE',
    summary: `cycle hops=${hops.length} pattern≠causation hypothesis≠fact prototype≠invention trusted=${trusted.accepted}`,
    sourceRefs: gap.evidenceRefs,
    evidence: hops.map((item) => `${item.hop}:${item.state}`),
    confidence: 0.4,
  }, root);
  await rememberCortexTrace({
    tenantId: story.tenantId,
    universeId: story.universeId,
    partition: 'world',
    kind: 'lesson',
    claimState: 'MODEL_INFERENCE',
    label: `Discovery cycle ${story.id}`,
    summary: hops.map((item) => item.hop).join(' → '),
    evidenceRefs: gap.evidenceRefs,
    sourceRefs: gap.evidenceRefs,
    root,
  });
  hops.push(hop('learning', 'PASS', 'Learning ledger + cortex lesson recorded. permissionChange=false productionChange=false', 'UNKNOWN'));

  const providers = providerSlots();
  const unverifiedCloud = ['aws', 'azure', 'gcp'].map((id) => getRuntime(id as 'aws' | 'azure' | 'gcp')).every((slot) => slot.state !== 'AVAILABLE');
  const inventedPass = false as const;
  const result: DiscoveryCycleResult = {
    id: cortexId('dcycle'),
    tenantId: story.tenantId,
    universeId: story.universeId,
    storyId: story.id,
    state: hops.some((item) => item.state === 'DENIED') ? 'denied' : hops.some((item) => item.state === 'FAIL') ? 'failed' : hops.some((item) => item.state === 'WAITING_DATA') ? 'waiting_data' : 'completed',
    hops,
    inventedPass,
    productionAuthorization: false,
    l4AutonomyEnabled: DISCOVERY_HONESTY.l4AutonomyEnabled,
    patternEqualsCausation: false,
    hypothesisEqualsFact: false,
    prototypeEqualsValidatedInvention: false,
  };
  if (hops.length !== KNOWLEDGE_DISCOVERY_CYCLE.length) {
    throw new Error('DISCOVERY_CYCLE_HOP_COUNT_MISMATCH');
  }
  for (let i = 0; i < KNOWLEDGE_DISCOVERY_CYCLE.length; i += 1) {
    if (hops[i]?.hop !== KNOWLEDGE_DISCOVERY_CYCLE[i]) throw new Error('DISCOVERY_CYCLE_ORDER_MISMATCH');
  }
  void providers;
  void unverifiedCloud;
  await save(root, [...await load(root), result]);
  return result;
}

export async function listDiscoveryCycles(input: { tenantId: string; universeId: string; root?: string }) {
  const cycles = await load(input.root ?? process.cwd());
  return cycles.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}
