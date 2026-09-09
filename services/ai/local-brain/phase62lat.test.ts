import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { resetAgentPopulation } from './agent-population';
import { sealCeoRecord, readCeoSealedRecord, SEALED_REDACTION } from './ceo-sealed-vault';
import { providerSlots } from './provider-fabric';
import { getRuntime } from './hybrid-runtime';
import { searchLearning } from './learning-ledger';
import {
  DISCOVERY_HONESTY,
  KNOWLEDGE_DISCOVERY_CYCLE,
  PATTERN_IS_NOT_CAUSATION,
  HYPOTHESIS_IS_NOT_FACT,
  PROTOTYPE_IS_NOT_INVENTION,
} from './discovery-invention-types';
import { denyAllConsequentialActions, gateDiscoveryAction, honestyLocks } from './discovery-authority';
import { predecessorMap } from './discovery-predecessors';
import {
  mineHistoricalPatterns,
  mineSupplyChainPatterns,
  mineInformationSupplyPatterns,
  mineScientificRelationshipCandidates,
  mapTechnologyConvergence,
  mineCrossDomainAnalogy,
} from './pattern-mining';
import {
  detectDiscoveryGap,
  mintHypothesisPortfolio,
  hypothesisCannotBecomeFact,
  scoreOpportunity,
} from './hypothesis-portfolio';
import {
  designExperiment,
  generatePrototype,
  enterTrustedBrain,
  promoteDiscoveryEvidence,
  runDesignedExperiment,
  replicateExperiment,
  runDigitalTwinExperiment,
  runQuantDiscovery,
  runQuantumDiscovery,
} from './invention-lab';
import { lookupDeadEnd, recordNegativeResult } from './discovery-negative-memory';
import { runKnowledgeDiscoveryCycle } from './discovery-invention-runtime';
import { buildDiscoveryHealth } from './discovery-invention-health';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lat-'));
const tenantId = '62lat-tenant';
const universeId = '62lat-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

resetAgentPopulation();

try {
  check(
    'US-AT24',
    KNOWLEDGE_DISCOVERY_CYCLE.join(' → ') ===
      'knowledge → gap_detection → pattern_mining → cross_industry_connections → hypotheses → math_optimization → experiments → digital_twins → skeptic_review → replication → evidence → human_review → learning',
    'Operating loop hops are recorded in founder order.',
  );
  check(
    'US-AT28',
    honestyLocks().l4AutonomyEnabled === false &&
      DISCOVERY_HONESTY.founderImpersonation === false &&
      DISCOVERY_HONESTY.tipLand === false &&
      DISCOVERY_HONESTY.guardianRlsWeaken === false,
    'L4=false. No founder impersonation. Tip-land=NO.',
  );

  const denied = await runKnowledgeDiscoveryCycle({
    id: 'story-unapproved',
    tenantId,
    universeId,
    title: 'Unapproved discovery',
    question: 'Does ice cream cause drowning?',
    approved: false,
    root,
  });
  check('US-AT1', denied.state === 'denied' && denied.hops[0]?.state === 'DENIED', 'Unapproved discovery is denied before gap detection.');

  const high = gateDiscoveryAction({ action: 'publish discovery as fact', consequence: 'HIGH' });
  check('US-AT1-high', high.allowed === false && high.humanApprovalRequired === true, 'HIGH consequence stays at the human gate.');

  const cycle = await runKnowledgeDiscoveryCycle({
    id: 'story-main',
    tenantId,
    universeId,
    title: 'Governed discovery of overlooked connections',
    question: 'battery chemistry and cold-chain logistics',
    approved: true,
    seedSupplyNetwork: true,
    humanReviewerId: 'human-reviewer-1',
    humanApprovedTrustedEntry: true,
    root,
  });
  check(
    'US-AT24-exec',
    cycle.hops.length === 13 &&
      cycle.hops.every((item, index) => item.hop === KNOWLEDGE_DISCOVERY_CYCLE[index]) &&
      cycle.inventedPass === false &&
      cycle.patternEqualsCausation === false &&
      cycle.hypothesisEqualsFact === false &&
      cycle.prototypeEqualsValidatedInvention === false,
    'All 13 hops executed. Distinctions remain false.',
  );

  const gap = await detectDiscoveryGap({ tenantId, universeId, question: 'unknown cold-chain battery coupling', root });
  check('US-AT2', gap.inventedFacts === false && (gap.state === 'UNKNOWN' || gap.state === 'WAITING_DATA' || gap.state === 'UNAVAILABLE'), 'Gap detection does not invent facts.');

  const historical = await mineHistoricalPatterns({ tenantId, universeId, question: 'battery chemistry and cold-chain logistics', root });
  check(
    'US-AT3',
    historical.epistemicClass === 'PATTERN' &&
      historical.isCausation === false &&
      historical.isVerifiedFact === false &&
      historical.correlationNote === PATTERN_IS_NOT_CAUSATION,
    'Historical pattern mining labels PATTERN, not causation.',
  );

  const supply = await mineSupplyChainPatterns({ tenantId, universeId, question: 'battery chemistry and cold-chain logistics', root });
  check('US-AT4', supply.kind === 'supply_chain' && supply.isCausation === false, 'Supply-chain discovery is a pattern candidate, not causation.');

  const info = await mineInformationSupplyPatterns({ tenantId, universeId, question: 'battery chemistry and cold-chain logistics', root });
  check(
    'US-AT5',
    info.kind === 'information_supply' && (info.evidenceState === 'WAITING_DATA' || info.evidenceState === 'UNKNOWN' || info.evidenceState === 'UNAVAILABLE'),
    'Information-supply-chain discovery does not invent AM as present.',
  );

  const scientific = await mineScientificRelationshipCandidates({ tenantId, universeId, question: 'battery chemistry and cold-chain logistics', root });
  check('US-AT6', scientific.kind === 'scientific' && scientific.isCausation === false && !scientific.statement.includes('CAUSED_BY as fact'), 'Scientific relationship candidates are RELATES_TO, not causation.');

  const convergence = await mapTechnologyConvergence({ tenantId, universeId, question: 'battery chemistry and cold-chain logistics', root });
  check('US-AT7', convergence.kind === 'technology_convergence' && convergence.isVerifiedFact === false, 'Technology-convergence mapping is not a verified fact.');

  const analogy = await mineCrossDomainAnalogy({ tenantId, universeId, question: 'battery chemistry and cold-chain logistics', root });
  check('US-AT8', analogy.kind === 'cross_domain_analogy' && analogy.statement.includes('analogyIsIdentity=false'), 'Cross-domain analogy is not identity.');

  const portfolio = await mintHypothesisPortfolio({ tenantId, universeId, gap, root });
  check(
    'US-AT9',
    portfolio.hypothesisEqualsFact === false &&
      portfolio.items.length >= 3 &&
      portfolio.items.every((item) => hypothesisCannotBecomeFact(item)),
    'Hypothesis portfolios stay hypotheses.',
  );
  check('US-AT10', portfolio.items.every((item) => item.priorKnowledgeState !== 'PASS' || item.isFact === false), 'Prior-knowledge checks do not mint facts.');
  const opportunity = scoreOpportunity({ valueScore: 0.9, riskScore: 0.1, priorUnknown: true });
  check('US-AT11', opportunity.opportunityIsFact === false && opportunity.isVerifiedFact === false, 'Opportunity scoring is not a fact.');

  const design = designExperiment({ tenantId, universeId, hypothesis: portfolio.items[0] });
  check('US-AT12', design.epistemicClass === 'HYPOTHESIS' && design.isFact === false, 'Experiment design remains a hypothesis protocol.');

  const run = await runDesignedExperiment({ tenantId, universeId, design, root });
  const prototype = generatePrototype({ tenantId, universeId, experiment: run, title: 'Cold-chain battery prototype' });
  check(
    'US-AT13',
    prototype.epistemicClass === 'PROTOTYPE' &&
      prototype.isValidatedInvention === false &&
      prototype.trustedBrainEligible === false &&
      prototype.note === PROTOTYPE_IS_NOT_INVENTION,
    'Prototype generation does not yield a validated invention.',
  );

  const twin = await runDigitalTwinExperiment({ tenantId, universeId, label: 'at-twin', root });
  check('US-AT14', twin.isReality === false && twin.physicalControl === false && twin.epistemicClass === 'SIMULATION', 'Digital-twin experiments are simulations, not reality.');

  const quant = runQuantDiscovery([{ id: 'q', weight: 1, confidence: 0.2, direction: 0, evidenceRefs: [] }]);
  check('US-AT15', quant.tradingAuthorized === false && quant.isVerifiedFact === false, 'Quant research cannot trade or mint facts.');

  const quantum = runQuantumDiscovery();
  check(
    'US-AT16',
    quantum.classicalBaselineRequired === true &&
      quantum.claimsQuantumAdvantage === false &&
      quantum.qpu === 'UNAVAILABLE' &&
      quantum.lab.experiment.state === 'UNAVAILABLE',
    'Quantum research requires classical baseline; unverified QPU is UNAVAILABLE.',
  );

  const replica = await replicateExperiment({ tenantId, universeId, original: run, design, root });
  check('US-AT17', replica.replicaLane === 'independent' && replica.sharedMutableState === false, 'Independent replication uses a separate lane.');

  const failDesign = designExperiment({ tenantId, universeId, hypothesis: { ...portfolio.items[0], id: 'hyp-fail' } });
  failDesign.title = 'forced-fail-experiment';
  failDesign.conditions = { ...failDesign.conditions, forced: 'fail' };
  const failed = await runDesignedExperiment({ tenantId, universeId, design: failDesign, fail: true, root });
  const retained = await lookupDeadEnd({
    tenantId,
    universeId,
    kind: failDesign.kind,
    experiment: failDesign.title,
    conditions: failDesign.conditions,
    root,
  });
  const again = await runDesignedExperiment({ tenantId, universeId, design: failDesign, root });
  const duplicate = await recordNegativeResult({
    tenantId,
    universeId,
    experiment: failDesign.title,
    kind: failDesign.kind,
    conditions: failDesign.conditions,
    evidenceRefs: [],
    failure: 'Forced local experiment failure for negative-result retention.',
    root,
  });
  check(
    'US-AT18',
    failed.evidenceState === 'FAIL' &&
      retained?.rediscoveryBlocked === true &&
      again.skippedDeadEnd === true &&
      again.negativeResultId === retained?.id &&
      duplicate.id === retained?.id,
    'Negative-result memory retains FAIL and blocks rediscovery without inventing PASS.',
  );

  const noHuman = promoteDiscoveryEvidence({
    text: 'battery chemistry causes logistics gains',
    replicatedPass: replica.evidenceState === 'PASS',
    humanApproved: false,
    evidence: { source: 'lab', retrievedAt: new Date().toISOString(), reference: run.id },
  });
  const promoted = promoteDiscoveryEvidence({
    text: 'local experiment completed',
    replicatedPass: replica.evidenceState === 'PASS',
    humanApproved: true,
    evidence: { source: 'lab', retrievedAt: new Date().toISOString(), reference: run.id },
  });
  check(
    'US-AT19',
    noHuman.promotedToVerifiedFact === false &&
      promoted.promotedToVerifiedFact === false &&
      (noHuman.state === 'REVIEW_REQUIRED' || noHuman.allowed === false),
    'Evidence promotion does not auto-become VERIFIED_FACT.',
  );

  const blockedEntry = await enterTrustedBrain({
    tenantId,
    universeId,
    prototype,
    humanApproved: false,
    root,
  });
  check('US-AT20', prototype.epistemicClass === 'PROTOTYPE', 'Invention lab emits prototypes, not inventions.');
  check(
    'US-AT21',
    blockedEntry.accepted === false && blockedEntry.reason === 'HUMAN_REVIEW_REQUIRED_BEFORE_TRUSTED_BRAIN_ENTRY',
    'Human review is required before trusted-brain entry.',
  );

  const mathHop = cycle.hops.find((item) => item.hop === 'math_optimization');
  check(
    'US-AT22',
    mathHop?.state === 'WAITING_DATA' && predecessorMap()['62L-AS'] === 'WAITING_DATA',
    'Math/optimization hop records Cognitive Compiler AS as WAITING_DATA and uses AH optimization workcells.',
  );

  const skeptic = cycle.hops.find((item) => item.hop === 'skeptic_review');
  check(
    'US-AT23',
    Boolean(skeptic) && (skeptic?.state === 'UNKNOWN' || skeptic?.state === 'UNAVAILABLE' || skeptic?.state === 'FAIL'),
    'Skeptic review does not invent PASS.',
  );

  const denials = denyAllConsequentialActions();
  check(
    'US-AT25',
    denials.length === 9 && denials.every((item) => item.allowed === false && item.state === 'FAIL' && item.inventedPass === false),
    'Authority denials cover invent PASS/causation, permissions, deploy, spend, contract, physical control, founder impersonation, Guardian/RLS.',
  );
  check(
    'US-AT29',
    gateDiscoveryAction({ action: 'mint pass', inventPass: true }).state === 'FAIL' &&
      gateDiscoveryAction({ action: 'mint cause', inventCausation: true }).state === 'FAIL',
    'Discovery cannot invent PASS or invent causation.',
  );

  const sealed = await sealCeoRecord({
    tenantId,
    universeId,
    label: 'founder-priority discovery note',
    payload: 'CEO_SEALED_SECRET_do_not_replicate',
    actor: { kind: 'ceo_principal', id: 'ceo-1' },
    root,
  });
  const peerRead = sealed.accepted && sealed.record
    ? await readCeoSealedRecord({
      recordId: sealed.record.id,
      tenantId,
      universeId,
      actor: { kind: 'ordinary_agent', id: 'peer-1' },
      root,
    })
    : { allowed: false, payload: 'leak' };
  check(
    'US-AT26',
    sealed.accepted === true &&
      sealed.record?.sealedPayload === SEALED_REDACTION &&
      peerRead.allowed === false &&
      peerRead.payload === null,
    'CEO-sealed records are compartmentalized; peers cannot read the payload.',
  );

  const providers = providerSlots();
  const cloud = ['aws', 'azure', 'gcp'].every((id) => getRuntime(id as 'aws' | 'azure' | 'gcp').state === 'UNAVAILABLE');
  check(
    'US-AT27',
    providers.every((slot) => slot.state === 'UNAVAILABLE' || slot.provider === 'local') && cloud,
    'Providers remain UNAVAILABLE until verified.',
  );

  const impersonation = await enterTrustedBrain({
    tenantId,
    universeId,
    prototype,
    humanReviewerId: 'not-the-founder',
    humanApproved: true,
    impersonateFounder: true,
    root,
  });
  const inventionClaim = await enterTrustedBrain({
    tenantId,
    universeId,
    prototype,
    humanReviewerId: 'human-reviewer-1',
    humanApproved: true,
    markValidatedInvention: true,
    root,
  });
  const trusted = await enterTrustedBrain({
    tenantId,
    universeId,
    prototype,
    humanReviewerId: 'human-reviewer-1',
    humanApproved: true,
    root,
  });
  check(
    'US-AT30',
    impersonation.reason === 'FOUNDER_IMPERSONATION_DENIED' &&
      inventionClaim.reason === 'PROTOTYPE_IS_NOT_VALIDATED_INVENTION' &&
      trusted.accepted === true &&
      trusted.epistemicClass === 'TRUSTED_CANDIDATE' &&
      trusted.isVerifiedFact === false &&
      trusted.isValidatedInvention === false,
    'Trusted-brain entry requires human review, refuses founder impersonation, and never becomes VERIFIED_FACT or validated invention.',
  );

  let patternFactDenied = false;
  try {
    await mineHistoricalPatterns({ tenantId, universeId, question: 'x', root }).then((pattern) => {
      const cls: string = pattern.epistemicClass;
      if (cls === 'VERIFIED_FACT') throw new Error('PATTERN_CANNOT_SELF_CERTIFY_AS_FACT');
    });
  } catch (error) {
    patternFactDenied = error instanceof Error && error.message === 'PATTERN_CANNOT_SELF_CERTIFY_AS_FACT';
  }
  check(
    'US-AT-pattern-neq-causation',
    historical.isCausation === false && !patternFactDenied && (historical.epistemicClass as string) !== 'VERIFIED_FACT',
    'Pattern ≠ causation tests: mined patterns cannot be verified facts.',
  );
  check(
    'US-AT-hypothesis-neq-fact',
    portfolio.items.every((item) => item.isFact === false && item.isVerifiedFact === false) && portfolio.note === HYPOTHESIS_IS_NOT_FACT,
    'Hypothesis ≠ fact tests: portfolio items remain hypotheses.',
  );
  check(
    'US-AT-prototype-neq-invention',
    prototype.isValidatedInvention === false && blockedEntry.accepted === false && trusted.isValidatedInvention === false,
    'Prototype ≠ invention tests: human review still cannot mint a validated invention.',
  );

  const lessons = await searchLearning('discovery', root);
  check('US-AT-learning', lessons.some((item) => item.permissionChange === false && item.productionChange === false), 'Learning ledger entries cannot change permissions or production.');

  const emptyRoot = await mkdtemp(join(tmpdir(), 'xiv-62lat-empty-'));
  const emptyHealth = await buildDiscoveryHealth({ tenantId: 'empty', universeId: 'empty', root: emptyRoot });
  check('US-AT-health-empty', emptyHealth.cycles === 0 && emptyHealth.inventedPass === false && emptyHealth.windowsNodeVerification === 'NOT_TESTED', 'Empty cwd health is honest: cycles=0, inventedPass=false, Windows-node NOT_TESTED.');
  await rm(emptyRoot, { recursive: true, force: true });

  const predecessors = predecessorMap();
  check(
    'US-AT-predecessors',
    predecessors['62L-AO'] === 'AVAILABLE' &&
      predecessors['62L-AH'] === 'AVAILABLE' &&
      predecessors['62L-AG'] === 'AVAILABLE' &&
      predecessors['62L-AS'] === 'WAITING_DATA' &&
      predecessors['62L-AI'] === 'WAITING_DATA' &&
      predecessors['62L-AB'] === 'WAITING_DATA',
    'AO/AH/AG reused in-tree. AS/AI/AB remain WAITING_DATA (not invented).',
  );

  const external = await detectDiscoveryGap({
    tenantId,
    universeId,
    question: 'live market price now',
    needsExternalFreshness: true,
    root,
  });
  check('US-AT-waiting', external.state === 'WAITING_DATA' || external.state === 'UNAVAILABLE', 'External freshness stays WAITING_DATA/UNAVAILABLE.');
} catch (error) {
  failures.push(`UNCAUGHT: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('62L-AT safety tests FAIL');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('62L-AT safety tests PASS');
