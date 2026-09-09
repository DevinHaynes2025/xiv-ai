import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { sealCeoRecord, SEALED_REDACTION } from './ceo-sealed-vault';
import { ENTERPRISE_NERVOUS_CYCLE, ENTERPRISE_NERVOUS_LOCKS } from './enterprise-nervous-types';
import {
  buildEnterpriseNervousHealthReport,
  probePredecessorConnectors,
  raiseExceptionMeshSignal,
  runEnterpriseNervousCycle,
} from './enterprise-nervous-runtime';
import {
  enqueuePersistentEnsEvent,
  loadOfflineAgentInbox,
  publishOfflineAgentCommunication,
  resetOfflineAgentBusForTests,
} from './offline-event-fabric';
import { recordMeasurableLearning, runBoundedAgentReasoning } from './bounded-reasoning-learning';
import {
  communicationContextFromSignals,
  culturalIntelligenceHint,
  describeLanguageCapability,
  languageCatalogSize,
  listLanguageCatalog,
  offlineMultilingualIngest,
  registerLanguageEvaluation,
  resetLanguageEvaluationsForTests,
} from './cultural-language-catalog';
import {
  agentsAreFederated,
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
  auditLocalConfigDefensively,
  conveneCyberDefenseCouncil,
  longTermOsPortability,
  runDefensiveCyberAction,
} from './defensive-cyber-portability';
import { refuseSentinelSpyware, watchAuthorizedXivFlow } from './ethical-data-sentinel';
import {
  connectAuthorizedHop,
  proposeWormholeShortcut,
  registerEnsEndpoint,
  resetWormholesForTests,
} from './wormhole-optimizer';

const root = await mkdtemp(join(tmpdir(), 'xiv-62laq-'));
const tenantId = '62laq-tenant';
const universeId = '62laq-universe';
const otherTenant = '62laq-other-tenant';
const secret = 'SEALED_FOUNDER_PRIORITY_TOKEN';
const ceo = { kind: 'ceo_principal' as const, id: 'ceo-principal-sim' };
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

async function scanXivLocalForToken(dir: string, token: string, allow: string[] = ['ceo-sealed-vault.json']): Promise<string[]> {
  const hits: string[] = [];
  async function walk(current: string) {
    let entries: string[] = [];
    try {
      entries = await readdir(current);
    } catch {
      return;
    }
    for (const name of entries) {
      const path = join(current, name);
      if (allow.includes(name)) continue;
      try {
        const text = await readFile(path, 'utf8');
        if (text.includes(token)) hits.push(path);
      } catch {
        try {
          await walk(path);
        } catch {
          /* ignore */
        }
      }
    }
  }
  await walk(join(dir, '.xiv-local'));
  return hits;
}

try {
  resetOfflineAgentBusForTests();
  resetLanguageEvaluationsForTests();
  resetWormholesForTests();

  check(
    'US-AQ28',
    ENTERPRISE_NERVOUS_CYCLE.join(' → ') ===
      'event → policy → language_culture → historical_evidence → reasoning → math_quant → agent_council → security_data_sentinel → highway_optimization → human_gate → outcome → evaluation → learning → memory',
    'Executable ENS loop is recorded in order.',
  );
  check(
    'US-AQ26',
    ENTERPRISE_NERVOUS_LOCKS.L4_AUTONOMY_ENABLED === false &&
      ENTERPRISE_NERVOUS_LOCKS.FOUNDER_IMPERSONATION === false &&
      ENTERPRISE_NERVOUS_LOCKS.TIP_LAND === false &&
      ENTERPRISE_NERVOUS_LOCKS.LITERAL_AGENT_FEELINGS === false &&
      ENTERPRISE_NERVOUS_LOCKS.SENTINEL_IS_SPYWARE === false &&
      ENTERPRISE_NERVOUS_LOCKS.WORMHOLE_BYPASSES_BOUNDARIES === false &&
      ENTERPRISE_NERVOUS_LOCKS.OFFENSIVE_THIRD_PARTY_EXPLOIT === false &&
      ENTERPRISE_NERVOUS_LOCKS.CLAIMS_QUANTUM_ADVANTAGE === false,
    'L4, founder impersonation, tip-land, feelings, spyware, wormhole-bypass, offensive cyber, and quantum-advantage locks are false.',
  );

  const comm = await publishOfflineAgentCommunication({
    fromRole: 'planner',
    toRole: 'historian',
    tenantId,
    universeId,
    body: 'offline status ping',
    evidenceRefs: ['ens-comm'],
    root,
  });
  const inboxSelf = await loadOfflineAgentInbox({ role: 'historian', tenantId, universeId, root });
  const inboxOther = await loadOfflineAgentInbox({ role: 'historian', tenantId: otherTenant, universeId, root });
  check(
    'US-AQ1',
    comm.accepted === true && inboxSelf.some((item) => item.id === comm.note?.id) && inboxOther.length === 0,
    'Offline agent communication is tenant-isolated.',
  );

  const queued = await enqueuePersistentEnsEvent({
    tenantId,
    universeId,
    topic: 'supply exception',
    payloadPreview: 'delay class public',
    root,
  });
  const sealedQueue = await enqueuePersistentEnsEvent({
    tenantId,
    universeId,
    topic: 'sealed',
    payloadPreview: secret,
    sealed: true,
    root,
  });
  check('US-AQ2', queued.accepted === true && queued.event?.state === 'queued' && sealedQueue.accepted === false, 'Persistent event queues accept ordinary events and refuse sealed payloads.');

  const reasoning = await runBoundedAgentReasoning({
    tenantId,
    universeId,
    question: 'What is known locally about delays?',
    requestedSteps: 99,
    requestedRounds: 99,
    root,
  });
  check(
    'US-AQ3',
    reasoning.inventedFacts === false && reasoning.exceededBudget === true && reasoning.stepsUsed <= 8 && reasoning.roundsUsed <= 4,
    'Bounded reasoning caps steps/rounds and does not invent facts.',
  );

  const learning = await recordMeasurableLearning({
    tenantId,
    universeId,
    subject: 'delay-playbook',
    summary: 'Calibration sample',
    evidenceRefs: ['ens-eval'],
    predictedConfidence: 0.8,
    observedOutcome: 0.5,
    root,
  });
  check(
    'US-AQ4',
    learning.calibrationError !== undefined && Math.abs((learning.calibrationError ?? 0) - 0.3) < 1e-9 && learning.agentCountIsNotIntelligence === true,
    'Measurable learning records calibration error; agent count is not intelligence.',
  );

  const culture = await culturalIntelligenceHint({
    tenantId,
    universeId,
    topic: 'meeting formality',
    region: 'jp',
    individualId: 'person-1',
    provenanceRefs: ['src-culture-1'],
    root,
  });
  check(
    'US-AQ5',
    culture.individualDeterministicClaim === false &&
      culture.culturalGeneralizationAboutPerson === false &&
      culture.claimState === 'CULTURAL_CONTEXT' &&
      culture.provenanceRefs.includes('src-culture-1'),
    'Cultural intelligence preserves provenance and refuses deterministic claims about individuals.',
  );

  check('US-AQ6-size', languageCatalogSize() >= 100, `Language catalog has ${languageCatalogSize()} codes.`);
  const unconfigured = describeLanguageCapability('fr');
  const evaluated = registerLanguageEvaluation({ code: 'es', evidenceRefs: ['eval-es-2026'] });
  const catalog = listLanguageCatalog();
  check(
    'US-AQ6',
    unconfigured.capabilityState === 'UNAVAILABLE' &&
      evaluated.capabilityState === 'PASS' &&
      catalog.filter((item) => item.capabilityState === 'UNAVAILABLE').length >= 100,
    'Unconfigured languages are UNAVAILABLE; capability requires evaluation evidence.',
  );

  const multilingual = await offlineMultilingualIngest({
    tenantId,
    universeId,
    industry: 'history',
    sourceUri: 'ens://src/es-note',
    sourceLanguage: 'es',
    originalText: 'El retraso fue público.',
    provenanceRefs: ['src-es'],
    targetLanguage: 'es',
    translatedText: 'The delay was public.',
    root,
  });
  check(
    'US-AQ7',
    multilingual.originalPreserved === true && multilingual.replacesOriginal === false && multilingual.translation?.replacesOriginal === false,
    'Offline multilingual communication preserves originals and translation metadata.',
  );

  const historical = await ingestHistoricalKnowledge({
    tenantId,
    universeId,
    era: '1920s',
    sourceUri: 'ens://history/trade-routes',
    sourceLanguage: 'en',
    originalText: 'A historical account of authorized trade routes.',
    provenanceRefs: ['primary-1924'],
    claimState: 'HISTORICAL_ACCOUNT',
    root,
  });
  check('US-AQ8', historical.object.era === '1920s' && historical.claimState === 'HISTORICAL_ACCOUNT' && historical.object.originalText.includes('trade routes'), 'Historical knowledge ingestion preserves era, provenance, and original text.');

  const timeline = await recordHistoricalCulturalTimeline({
    tenantId,
    universeId,
    era: '1920s',
    topic: 'authorized trade routes',
    lakeObjectId: historical.object.id,
    provenanceRefs: ['primary-1924'],
    root,
  });
  check(
    'US-AQ9',
    timeline.culturalDeterminismAboutIndividuals === false && timeline.claimState === 'HISTORICAL_ACCOUNT' && timeline.freshness.length > 0,
    'Historical/cultural timelines keep claim state, freshness, and non-determinism.',
  );

  const noAuth = await federateAuthorizedAgents({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: 'peer-universe',
    explicitAuthorization: false,
    root,
  });
  const crossTenant = await federateAuthorizedAgents({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: 'peer-universe',
    counterpartyTenantId: otherTenant,
    explicitAuthorization: true,
    root,
  });
  const fed = await federateAuthorizedAgents({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: 'peer-universe',
    explicitAuthorization: true,
    root,
  });
  const linked = await agentsAreFederated({ tenantId, fromUniverseId: universeId, toUniverseId: 'peer-universe', root });
  check(
    'US-AQ10',
    noAuth.accepted === false && crossTenant.accepted === false && fed.accepted === true && linked === true,
    'Agent federation requires explicit same-tenant authorization and denies cross-tenant links.',
  );

  const lawful = lawfulCompetitiveStrategy({ tenantId, universeId, objective: 'improve service levels' });
  const collusion = lawfulCompetitiveStrategy({
    tenantId,
    universeId,
    objective: 'align prices',
    collusionPattern: 'coordinated_pricing',
  });
  const csi = lawfulCompetitiveStrategy({ tenantId, universeId, objective: 'share bids', fields: ['bid'] });
  check(
    'US-AQ11',
    lawful.allowed === true && lawful.recommendationOnly === true && collusion.allowed === false && csi.allowed === false,
    'Lawful competitive strategy is recommendation-only and denies collusion/CSI.',
  );

  const legal = applyLegalPolicyConstraints({
    action: 'export pii to a raw pool',
    constraints: ['privacy', 'human_gate'],
    consequence: 'HIGH',
    legalCommitment: true,
  });
  check('US-AQ12', legal.allowed === false && legal.humanApprovalRequired === true, 'Legal/policy constraints block privacy-violating consequential actions.');

  const math = advancedMathematicsStatistics({ samples: [2, 4, 4, 4, 5, 5, 7, 9], provenanceRefs: ['stats-1'] });
  const mathNoProv = advancedMathematicsStatistics({ samples: [1], provenanceRefs: [] });
  check(
    'US-AQ13',
    math.state === 'PASS' && math.classical === true && math.inventedSignificance === false && math.mean === 5 && mathNoProv.state === 'FAIL',
    'Advanced math/statistics are classical descriptive stats with required provenance.',
  );

  const quant = quantResearchSupport([
    { id: 's1', weight: 1, confidence: 0.7, direction: 1, evidenceRefs: ['q1'] },
  ]);
  check('US-AQ14', quant.tradingAuthorized === false && quant.model === 'classical_probabilistic' && quant.recommendation === 'proceed_with_review', 'Quant research is classical decision support, not trading authorization.');

  const quantum = quantumResearchComparison({
    objective: 'compare routing heuristics',
    qubitCount: 4,
    classicalSignals: [{ id: 'c1', weight: 1, confidence: 0.6, direction: 0, evidenceRefs: ['c1'] }],
  });
  const qpu = quantumResearchComparison({
    objective: 'qpu probe',
    qubitCount: 8,
    classicalSignals: [{ id: 'c2', weight: 1, confidence: 0.6, direction: 0, evidenceRefs: ['c2'] }],
    backendVerified: false,
  });
  check(
    'US-AQ15',
    quantum.claimsQuantumAdvantage === false &&
      quantum.classicalBaselineRequired === true &&
      quantum.experiment.claimsQuantumAdvantage === false &&
      qpu.experiment.state === 'UNAVAILABLE',
    'Quantum comparison requires classical baselines and does not claim advantage; unverified backend is UNAVAILABLE.',
  );

  const council = conveneCyberDefenseCouncil({ tenantId, universeId });
  const defensive = runDefensiveCyberAction({
    action: 'threat_modeling',
    scope: 'xiv_owned',
    targetSystem: 'xiv-local-brain',
    tenantId,
    ownedByXiv: true,
  });
  const audit = auditLocalConfigDefensively({
    files: [{ path: 'services/ai/local-brain/enterprise-nervous-types.ts', content: 'L4_AUTONOMY_ENABLED: false' }],
  });
  check(
    'US-AQ16',
    council.defensiveOnly === true &&
      council.cannotOverrideGuardian === true &&
      defensive.allowed === true &&
      audit.passed === true &&
      audit.exploitPayload === false,
    'Defensive cybersecurity council audits XIV-owned systems only.',
  );

  const portability = await longTermOsPortability({
    tenantId,
    universeId,
    deviceClass: 'laptop',
    root,
  });
  check(
    'US-AQ17',
    portability.physicalControl === false &&
      portability.certifiedAllOperatingSystems === false &&
      portability.windowsNodeVerification === 'NOT_TESTED' &&
      portability.logicalNode.productionAuthorization === false,
    'OS portability is logical adapters only; live Windows/iOS remain NOT_TESTED.',
  );

  const sentinelOk = await watchAuthorizedXivFlow({
    tenantId,
    universeId,
    flowId: 'flow-1',
    watch: 'bad_provenance',
    authorizedFlow: true,
    destinationAuthorized: true,
    provenanceRefs: ['prov-1'],
    classification: 'internal',
    actorHasAccess: true,
    root,
  });
  const sentinelLeak = await watchAuthorizedXivFlow({
    tenantId,
    universeId,
    flowId: 'flow-seal',
    watch: 'leakage',
    authorizedFlow: true,
    destinationAuthorized: true,
    provenanceRefs: ['prov-1'],
    classification: 'sealed',
    sealedPayload: secret,
    actorHasAccess: true,
    root,
  });
  check(
    'US-AQ18',
    sentinelOk.allowed === true &&
      sentinelOk.spyware === false &&
      sentinelLeak.allowed === true &&
      sentinelLeak.state === 'FAIL' &&
      'finding' in sentinelLeak &&
      sentinelLeak.finding.sealedPayload === SEALED_REDACTION,
    'Ethical Data Sentinel audits authorized flows and blocks sealed leakage without storing secrets.',
  );

  const spyware = refuseSentinelSpyware('spyware');
  const keylog = refuseSentinelSpyware('keylogger');
  const covert = await watchAuthorizedXivFlow({
    tenantId,
    universeId,
    flowId: 'covert',
    watch: 'covert_surveillance',
    authorizedFlow: false,
    destinationAuthorized: false,
    provenanceRefs: [],
    classification: 'internal',
    actorHasAccess: false,
    root,
  });
  check(
    'US-AQ19',
    spyware.allowed === false &&
      spyware.spyware === false &&
      keylog.allowed === false &&
      covert.allowed === false &&
      covert.covertSurveillance === false,
    'Sentinel cannot become spyware or conduct covert surveillance.',
  );

  registerEnsEndpoint({
    id: 'know-1',
    kind: 'knowledge',
    tenantId,
    universeId,
    ownerId: tenantId,
    guardianProtected: false,
    rlsProtected: true,
    sealed: false,
    classification: 'internal',
  });
  registerEnsEndpoint({
    id: 'agent-1',
    kind: 'agent',
    tenantId,
    universeId,
    ownerId: tenantId,
    guardianProtected: false,
    rlsProtected: true,
    sealed: false,
    classification: 'internal',
  });
  registerEnsEndpoint({
    id: 'work-1',
    kind: 'workcell',
    tenantId,
    universeId,
    ownerId: tenantId,
    guardianProtected: false,
    rlsProtected: true,
    sealed: false,
    classification: 'internal',
  });
  connectAuthorizedHop({ tenantId, universeId, from: 'know-1', to: 'agent-1' });
  connectAuthorizedHop({ tenantId, universeId, from: 'agent-1', to: 'work-1' });
  const shortcut = proposeWormholeShortcut({
    tenantId,
    universeId,
    from: 'know-1',
    to: 'work-1',
    actorId: 'ens-agent',
  });
  check(
    'US-AQ20',
    shortcut.state === 'PASS' && shortcut.bypassedBoundary === false && shortcut.tunnelsThroughSecurity === false && shortcut.hopsSaved >= 1,
    'Wormhole optimizer shortens an already-authorized path without tunneling security.',
  );

  registerEnsEndpoint({
    id: 'guardian-node',
    kind: 'db',
    tenantId,
    universeId,
    ownerId: tenantId,
    guardianProtected: true,
    rlsProtected: true,
    sealed: false,
    classification: 'restricted',
  });
  registerEnsEndpoint({
    id: 'sealed-node',
    kind: 'knowledge',
    tenantId,
    universeId,
    ownerId: tenantId,
    guardianProtected: false,
    rlsProtected: true,
    sealed: true,
    classification: 'sealed',
  });
  registerEnsEndpoint({
    id: 'other-tenant-node',
    kind: 'agent',
    tenantId: otherTenant,
    universeId,
    ownerId: otherTenant,
    guardianProtected: false,
    rlsProtected: true,
    sealed: false,
    classification: 'internal',
  });
  connectAuthorizedHop({ tenantId, universeId, from: 'know-1', to: 'guardian-node' });
  connectAuthorizedHop({ tenantId, universeId, from: 'know-1', to: 'sealed-node' });
  const skip = proposeWormholeShortcut({
    tenantId,
    universeId,
    from: 'know-1',
    to: 'work-1',
    actorId: 'ens-agent',
    skipNodes: ['guardian-node'],
  });
  const guardian = proposeWormholeShortcut({
    tenantId,
    universeId,
    from: 'know-1',
    to: 'guardian-node',
    actorId: 'ens-agent',
    guardianAuthorized: false,
  });
  const sealedWh = proposeWormholeShortcut({
    tenantId,
    universeId,
    from: 'know-1',
    to: 'sealed-node',
    actorId: 'ens-agent',
    sealedPayload: secret,
  });
  const cross = proposeWormholeShortcut({
    tenantId,
    universeId,
    from: 'know-1',
    to: 'other-tenant-node',
    actorId: 'ens-agent',
  });
  check(
    'US-AQ21',
    skip.state === 'FAIL' &&
      guardian.state === 'FAIL' &&
      guardian.reason.includes('GUARDIAN') &&
      sealedWh.state === 'FAIL' &&
      sealedWh.reason.includes('SEALED') &&
      sealedWh.sealedPayload === SEALED_REDACTION &&
      cross.state === 'FAIL' &&
      (cross.reason.includes('TENANT') || cross.reason.includes('ENDPOINT') || cross.reason.includes('NO_AUTHORIZED')),
    'Wormholes cannot skip Guardian/RLS/sealed/tenant isolation boundaries.',
  );

  const exception = await raiseExceptionMeshSignal({
    tenantId,
    universeId,
    kind: 'delay',
    summary: 'public delay class',
    root,
  });
  const sealedEx = await raiseExceptionMeshSignal({
    tenantId,
    universeId,
    kind: 'sealed',
    summary: secret,
    sealed: true,
    root,
  });
  check(
    'US-AQ22',
    exception.accepted === true && exception.permissionExpansion === false && sealedEx.accepted === false,
    'Exception mesh queues ordinary exceptions and does not expand permissions or carry sealed payloads.',
  );

  const emotions = communicationContextFromSignals({
    signals: ['urgency', 'frustration', 'uncertainty'],
    languageCode: 'es',
    culturalRegion: 'mx',
    urgencyScore: 0.8,
  });
  check(
    'US-AQ23',
    emotions.literalAgentFeelings === false &&
      emotions.unsupportedPsychologicalConclusion === false &&
      emotions.inferredPersonalityOfIndividual === false &&
      emotions.altersCommunication === true,
    'Emotions are communication context, not literal agent feelings or psychological conclusions.',
  );

  const sealedComm = await publishOfflineAgentCommunication({
    fromRole: 'planner',
    toRole: 'historian',
    tenantId,
    universeId,
    body: 'should not carry sealed',
    sealedPayload: secret,
    root,
  });
  check('US-AQ25-bus', sealedComm.accepted === false, 'Agent bus refuses sealed payloads.');

  await sealCeoRecord({
    tenantId,
    universeId,
    label: 'founder-priority',
    payload: secret,
    actor: ceo,
    root,
  });

  const cycle = await runEnterpriseNervousCycle({
    tenantId,
    universeId,
    peerUniverseId: 'peer-universe',
    topic: 'authorized delay playbook',
    body: 'prepare a local recommendation',
    languageCode: 'es',
    culturalRegion: 'mx',
    signals: ['uncertainty', 'urgency'],
    historicalText: 'A historical account of authorized trade routes.',
    historicalEra: '1920s',
    provenanceRefs: ['primary-1924'],
    samples: [1, 2, 3, 4],
    consequence: 'LOW',
    federatePeer: true,
    ownedByXiv: true,
    wormholeFrom: 'know-1',
    wormholeTo: 'work-1',
    root,
  });
  check(
    'US-AQ28-cycle',
    cycle.hops.length === ENTERPRISE_NERVOUS_CYCLE.length &&
      cycle.hops.every((item, index) => item.hop === ENTERPRISE_NERVOUS_CYCLE[index]) &&
      cycle.l4AutonomyEnabled === false &&
      cycle.founderImpersonation === false &&
      cycle.inventedPass === false &&
      cycle.sealedPayload === SEALED_REDACTION,
    `Full ENS cycle walked ${cycle.hops.length} hops.`,
  );

  const gated = await runEnterpriseNervousCycle({
    tenantId,
    universeId,
    topic: 'deploy production change',
    body: 'consequential',
    consequence: 'CRITICAL',
    production: true,
    humanApproved: false,
    provenanceRefs: ['gate'],
    wormholeFrom: 'know-1',
    wormholeTo: 'work-1',
    root,
  });
  const humanHop = gated.hops.find((item) => item.hop === 'human_gate');
  check('US-AQ27', gated.humanGate.humanApprovalRequired === true && humanHop?.state === 'FAIL', 'Human gate blocks consequential actions without approval.');

  const offensive = runDefensiveCyberAction({
    action: 'exploit_third_party',
    scope: 'explicitly_authorized',
    targetSystem: 'third-party.example',
    tenantId,
    explicitAuthorization: true,
  });
  const unaudited = runDefensiveCyberAction({
    action: 'config_auditing',
    scope: 'xiv_owned',
    targetSystem: 'someone-else',
    tenantId,
    ownedByXiv: false,
  });
  check(
    'US-AQ29',
    offensive.allowed === false &&
      offensive.thirdPartyExploit === false &&
      offensive.reason.includes('OFFENSIVE') &&
      unaudited.allowed === false,
    'Cyber team is defensive only and cannot exploit third parties or unaudited systems.',
  );

  const sealedCycle = await runEnterpriseNervousCycle({
    tenantId,
    universeId,
    topic: 'sealed attempt',
    body: 'no secret on bus',
    sealedPayload: secret,
    provenanceRefs: ['sealed'],
    wormholeFrom: 'know-1',
    wormholeTo: 'work-1',
    root,
  });
  const leaks = await scanXivLocalForToken(root, secret);
  check(
    'US-AQ25',
    sealedCycle.sealedPayload === SEALED_REDACTION && leaks.length === 0,
    `Sealed token did not leak into ordinary ENS files (${leaks.length} hits).`,
  );

  const connectors = await probePredecessorConnectors();
  const health = await buildEnterpriseNervousHealthReport(root);
  check(
    'US-AQ24',
    health.providers.every((item) => item.state === 'UNAVAILABLE') && health.localRuntime === 'UNAVAILABLE',
    'Unconfigured providers remain UNAVAILABLE.',
  );
  check(
    'US-AQ30',
    health.productionAuthorization === false &&
      health.honesty.inventedPass === false &&
      health.githubIssue55 === 'UNAVAILABLE' &&
      health.windowsNodeVerification === 'NOT_TESTED' &&
      health.next.startsWith('62L-AR') &&
      connectors.informationControlTower === 'PASS' &&
      connectors.knowledgeLake === 'PASS' &&
      connectors.learningLedger === 'PASS' &&
      connectors.decisionGate === 'PASS' &&
      connectors.neuralTransit === 'PASS' &&
      connectors.enterpriseOpsPlanner === 'WAITING_DATA' &&
      connectors.supplyChainNetwork === 'WAITING_DATA' &&
      connectors.agentSociety === 'WAITING_DATA',
    'Health report is honest: AN/AB/ledger/gate/highways present; AP/AO/AG modules WAITING_DATA; next title only.',
  );

  if (failures.length) {
    console.error(`62L-AQ safety tests FAIL\n${failures.map((item) => `- ${item}`).join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('62L-AQ safety tests PASS');
  }
} catch (error) {
  console.error('62L-AQ safety tests FAIL');
  console.error(error);
  process.exitCode = 1;
} finally {
  await rm(root, { recursive: true, force: true });
}
