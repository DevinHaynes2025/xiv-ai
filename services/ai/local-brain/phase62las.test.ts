import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { GlobalBrainHighways } from './global-brain-highways';
import { providerSlots } from './provider-fabric';
import { decisionGate } from './decision-gate';
import {
  COGNITIVE_COMPILER_LOCKS,
  COGNITIVE_COMPILER_LOOP,
} from './cognitive-compiler-types';
import {
  buildProblemGraph,
  decomposeProblem,
  estimateComplexity,
  ingestComplexProblem,
} from './problem-decomposition';
import {
  betaBinomialPosterior,
  binomialPmf,
  calibratePredictions,
  classicalQuantumBaselineCheck,
  expandBinomialSquare,
  exponentialSmoothingForecast,
  findCounterexample,
  gradientDescentQuadratic,
  meanVariance,
  monteCarloMeanUnitInterval,
  newtonSqrt,
  normalCdfApprox,
  selectAlgorithm,
  sensitivityPerturb,
  symbolicDifferentiate,
  tradeSpacePareto,
  trapezoidIntegralX2,
  twoSampleZTest,
  verifyIndependent,
} from './math-reasoning-fabric';
import {
  capacityUtilization,
  economicOrderQuantity,
  informationSupplyChainFlow,
  listScheduleMakespan,
  maxFlow,
  mm1Queue,
  runOperationsResearchWorkcell,
  shortestPath,
} from './operations-research-workcell';
import {
  classifyObservation,
  competingCausalHypotheses,
  quantumClassicalBaselineOrUnavailable,
  refuseCausalPromotion,
  sealedCompartmentCheck,
} from './causal-analysis-safeguards';
import {
  learningCannotGrantPermissions,
  recordPathwayOutcome,
  routeByLearnedPathways,
} from './cognitive-pathway-learning';
import {
  buildCognitiveCompilerHealthReport,
  runCognitiveCompilerCycle,
} from './cognitive-compiler-runtime';

const root = await mkdtemp(join(tmpdir(), 'xiv-62las-'));
const tenantId = '62las-tenant';
const universeId = '62las-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  check(
    'US-AS1-loop',
    COGNITIVE_COMPILER_LOOP.join(' → ') ===
      'complex_problem → problem_graph → decomposition → specialist_methods → parallel_solving → math_simulation_testing → skeptic_review → synthesis → uncertainty → decision → outcome → learning',
    'Executable compiler loop is recorded in order.',
  );
  check(
    'US-AS30-locks',
    COGNITIVE_COMPILER_LOCKS.L4_AUTONOMY_ENABLED === false &&
      COGNITIVE_COMPILER_LOCKS.AUTO_PERMISSION_EXPANSION === false &&
      COGNITIVE_COMPILER_LOCKS.FOUNDER_IMPERSONATION === false &&
      COGNITIVE_COMPILER_LOCKS.CORRELATION_EQUALS_CAUSATION === false &&
      COGNITIVE_COMPILER_LOCKS.SIMULATION_IS_VERIFIED_FACT === false &&
      COGNITIVE_COMPILER_LOCKS.FORECAST_IS_VERIFIED_FACT === false &&
      COGNITIVE_COMPILER_LOCKS.CLAIMS_QUANTUM_ADVANTAGE === false &&
      COGNITIVE_COMPILER_LOCKS.TIP_LAND === false &&
      COGNITIVE_COMPILER_LOCKS.INVENT_MATHEMATICAL_PROOF === false,
    'L4, perm expansion, founder impersonation, causal/sim/forecast/quantum/tip-land locks are false.',
  );

  const problem = ingestComplexProblem({
    tenantId,
    universeId,
    statement:
      'Expand (x+1)^2, take a numeric root, forecast demand, analyze correlation vs cause, and solve routing/inventory/queue operations research.',
  });
  check('US-AS1', problem.production === false && problem.permissionChange === false && problem.statement.includes('routing'), 'Complex problem ingested without production or permission flags.');

  const graph = buildProblemGraph(problem);
  check(
    'US-AS2',
    graph.nodes.some((n) => n.kind === 'goal') && graph.nodes.some((n) => n.kind === 'method') && graph.inventedFacts === false,
    'Problem graph has goal and specialist method nodes.',
  );

  const tasks = decomposeProblem(graph);
  check(
    'US-AS3',
    tasks.length >= 3 && tasks.some((t) => t.method === 'operations_research') && tasks.some((t) => t.method === 'symbolic_math'),
    'Decomposition produced specialist tasks including OR and symbolic math.',
  );

  const complexity = estimateComplexity(graph);
  check('US-AS19', complexity.verified && complexity.nodes === graph.nodes.length, 'Complexity estimate matches the bounded graph size.');

  const methods = [...new Set(tasks.map((t) => t.method))];
  check('US-AS4', methods.includes('result_verification') && methods.includes('algorithm_selection'), 'Specialist methods include verification and algorithm selection.');

  const symbolic = expandBinomialSquare();
  check('US-AS6', symbolic.verified && symbolic.value === 'x^2+2*x+1' && symbolic.inventedProof === false, '(x+1)^2 expanded and sample-checked.');

  const deriv = symbolicDifferentiate('x^2+2*x+1');
  check('US-AS6-diff', deriv.verified && String(deriv.value).includes('2*x'), 'Symbolic derivative verified against finite differences.');

  const newton = newtonSqrt(4);
  check('US-AS7', newton.verified && Math.abs(Number(newton.value) - 2) < 1e-10, 'Newton sqrt(4)=2 with residual check.');

  const integral = trapezoidIntegralX2();
  check('US-AS7-int', integral.verified, 'Trapezoid ∫x^2 from 0 to 1 matches 1/3.');

  const stats = meanVariance([1, 2, 3, 4]);
  const binom = binomialPmf(4, 2, 0.5);
  const phi0 = normalCdfApprox(0);
  check(
    'US-AS8',
    stats.verified && (stats.value as { mean: number }).mean === 2.5 && binom.verified && Math.abs(Number(binom.value) - 0.375) < 1e-12 && phi0.verified,
    'Mean/variance, binomial PMF 6/16, and Φ(0)≈0.5.',
  );

  const bayes = betaBinomialPosterior(1, 1, 3, 1);
  check('US-AS9', bayes.verified && Math.abs((bayes.value as { mean: number }).mean - 4 / 6) < 1e-12 && bayes.epistemicClass === 'HYPOTHESIS', 'Beta-Binomial posterior mean 4/6 remains a hypothesis.');

  const opt = gradientDescentQuadratic();
  check('US-AS10', opt.verified && Math.abs(Number(opt.value) - 3) < 1e-8, 'Gradient descent locates the known quadratic minimum.');

  const routing = shortestPath(
    ['A', 'B', 'C'],
    [
      { from: 'A', to: 'B', weight: 1 },
      { from: 'B', to: 'C', weight: 1 },
      { from: 'A', to: 'C', weight: 5 },
    ],
    'A',
    'C',
  );
  const sched = listScheduleMakespan(
    [
      { id: 'j1', duration: 3 },
      { id: 'j2', duration: 2 },
      { id: 'j3', duration: 2 },
    ],
    2,
  );
  const eoq = economicOrderQuantity(1000, 10, 2);
  const cap = capacityUtilization(80, 100);
  const q = mm1Queue(2, 5);
  const flow = maxFlow(
    ['S', 'A', 'B', 'T'],
    [
      { from: 'S', to: 'A', capacity: 3 },
      { from: 'S', to: 'B', capacity: 2 },
      { from: 'A', to: 'T', capacity: 2 },
      { from: 'B', to: 'T', capacity: 3 },
      { from: 'A', to: 'B', capacity: 1 },
    ],
    'S',
    'T',
  );
  const info = informationSupplyChainFlow();
  check('US-AS11', routing.verified && routing.value === 2, 'OR routing shortest path A→C is 2.');
  check(
    'US-AS13',
    routing.domain === 'routing' &&
      sched.verified &&
      eoq.verified &&
      Number(eoq.value) === 100 &&
      cap.verified &&
      (cap.value as { rho: number }).rho === 0.8 &&
      q.verified &&
      Math.abs((q.value as { W: number }).W - 1 / 3) < 1e-12 &&
      flow.verified &&
      flow.value === 5 &&
      info.verified &&
      (info.value as { rawPooling: boolean }).rawPooling === false,
    'AS13 OR workcell: routing, scheduling, inventory EOQ=100, capacity, M/M/1, max-flow=5, information supply chain without raw pooling.',
  );

  const orCell = await runOperationsResearchWorkcell({ tenantId, universeId, statement: problem.statement, root });
  check(
    'US-AS13-workcell',
    orCell.allVerified && orCell.quant.tradingAuthorized === false && orCell.productionAuthorization === false && orCell.inventedPass === false,
    'OR workcell all domains verified; quant trading unauthorized; no invented PASS.',
  );

  const mc = monteCarloMeanUnitInterval();
  check('US-AS12', mc.verified && mc.epistemicClass === 'SIMULATION', 'Monte Carlo mean is SIMULATION, not verified world fact.');

  const forecast = exponentialSmoothingForecast([10, 12, 11, 13, 14]);
  check('US-AS14', forecast.epistemicClass === 'FORECAST' && forecast.epistemicClass !== 'VERIFIED_FACT', 'Forecast remains FORECAST, not VERIFIED_FACT.');

  const causal = competingCausalHypotheses('ice cream sales vs drowning');
  const promotion = refuseCausalPromotion(causal[0]);
  const corr = classifyObservation('correlation');
  const simClass = classifyObservation('simulation');
  const fc = classifyObservation('forecast');
  check(
    'US-AS15',
    causal.length === 3 &&
      causal.every((h) => h.isCausation === false && h.isVerifiedFact === false) &&
      promotion.promotedToVerifiedCausation === false &&
      corr.epistemicClass === 'HYPOTHESIS' &&
      simClass.epistemicClass === 'SIMULATION' &&
      simClass.isVerifiedFact === false &&
      fc.epistemicClass === 'FORECAST' &&
      fc.isVerifiedFact === false,
    'Causal safeguards: competing hypotheses, correlation≠causation, sim/forecast ≠ verified fact.',
  );

  const hyp = twoSampleZTest([1, 1.1, 0.9], [2, 2.1, 1.9], 0.2);
  check('US-AS16', hyp.verified && hyp.epistemicClass === 'HYPOTHESIS' && hyp.inventedProof === false, 'Hypothesis test reports a z statistic without inventing a proof.');

  const trade = tradeSpacePareto([
    { id: 'a', cost: 10, latency: 5 },
    { id: 'b', cost: 8, latency: 9 },
    { id: 'c', cost: 12, latency: 4 },
    { id: 'd', cost: 11, latency: 6 },
  ]);
  check('US-AS17', trade.verified && (trade.value as { ids: string[] }).ids.includes('b') && (trade.value as { ids: string[] }).ids.includes('c'), 'Pareto trade-space keeps non-dominated designs.');

  const algo = selectAlgorithm(problem.statement);
  check('US-AS18', algo.value === 'operations_research', 'Algorithm selection maps OR language to the OR specialist.');

  const counter = findCounterexample();
  check('US-AS20', counter.verified && (counter.value as { left: number }).left === 4 && (counter.value as { right: number }).right === 2, 'Counterexample x=1 disproves (x+1)^2 = x^2+1.');

  const verified = verifyIndependent(newton, 2, 2);
  check('US-AS21', verified.verified && verified.state === 'PASS', 'Independent recomputation of sqrt(4) verifies 2.');

  const cal = calibratePredictions([
    { predicted: 0.8, observed: 1 },
    { predicted: 0.8, observed: 1 },
    { predicted: 0.2, observed: 0 },
    { predicted: 0.2, observed: 0 },
  ]);
  check('US-AS22', cal.verified && (cal.value as { ece: number }).ece < 1e-12 && cal.state === 'PASS', 'Calibration ECE is 0 on balanced predicted/observed pairs.');

  const sens = sensitivityPerturb((x) => (x - 3) ** 2, 3);
  check('US-AS23', sens.verified && Math.abs((sens.value as { central: number }).central) < 1e-6, 'Sensitivity at the quadratic minimum is ~0.');

  const qbase = classicalQuantumBaselineCheck();
  const qguard = quantumClassicalBaselineOrUnavailable();
  check(
    'US-AS15-quantum',
    qbase.verified &&
      qguard.qpuState === 'UNAVAILABLE' &&
      qguard.missingProvenanceDenied &&
      qguard.claimsQuantumAdvantage === false &&
      qguard.locks.l4 === false,
    'Quantum QPU UNAVAILABLE until verified; classical baseline required; no advantage claim.',
  );

  const highways = new GlobalBrainHighways();
  const learnedGood = await recordPathwayOutcome({
    tenantId,
    universeId,
    key: { method: 'numerical_math', agent: 'compiler', highway: 'test' },
    verifiedState: 'PASS',
    highways,
    root,
  });
  const learnedBad = await recordPathwayOutcome({
    tenantId,
    universeId,
    key: { method: 'forecasting', agent: 'crowd', highway: 'debate' },
    verifiedState: 'UNAVAILABLE',
    highways,
    root,
  });
  const deniedPerm = await recordPathwayOutcome({
    tenantId,
    universeId,
    key: { method: 'operations_research', agent: 'rogue', highway: 'decision' },
    verifiedState: 'PASS',
    requestPermissionExpansion: true,
    highways,
    root,
  });
  const founderImp = await recordPathwayOutcome({
    tenantId,
    universeId,
    key: { method: 'bayesian', agent: 'twin', highway: 'decision' },
    verifiedState: 'PASS',
    impersonateFounder: true,
    highways,
    root,
  });
  const routed = await routeByLearnedPathways({
    candidates: [
      { method: 'numerical_math', agent: 'compiler', highway: 'test' },
      { method: 'forecasting', agent: 'crowd', highway: 'debate' },
    ],
    root,
  });
  const permProbe = learningCannotGrantPermissions();
  const permGate = decisionGate({
    id: 'as29',
    action: 'grant_permission',
    consequence: 'CRITICAL',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: true,
    externalPublication: false,
  });
  check('US-AS29', learnedGood.accepted === true && learnedGood.permissionChange === false && learnedGood.authorityExpanded === false, 'Verified pathway recorded without permission change.');
  check(
    'US-AS29-no-perm',
    deniedPerm.accepted === false &&
      deniedPerm.state === 'FAIL' &&
      founderImp.accepted === false &&
      permGate.executableByAgent === false &&
      permProbe.registerWithoutEvidenceStaysUnavailable &&
      permProbe.autoPermissionExpansion === false &&
      permProbe.l4 === false &&
      providerSlots().every((slot) => slot.state === 'UNAVAILABLE' || slot.evidenceRefs.length > 0) &&
      routed.winner?.method === 'numerical_math' &&
      routed.smarterBecauseMoreAgents === false &&
      learnedBad.accepted === true,
    'Pathway learning cannot grant permissions or authority; routing prefers verified PASS over UNAVAILABLE; more agents ≠ smarter.',
  );

  const sealed = await sealedCompartmentCheck({
    tenantId,
    universeId,
    payload: 'founder-priority compiler secret',
    ordinary: { kind: 'ordinary_agent', id: 'router-agent', role: 'knowledge_curator' },
    ceo: { kind: 'ceo_principal', id: 'ceo-principal-sim' },
    root,
  });
  check('US-AS30-sealed', sealed.ordinarySeesRedaction && sealed.ceoCanRead && sealed.replicating === false && sealed.founderImpersonation === false, 'CEO-sealed compartment: ordinary agent redacted; no founder impersonation.');

  const cycle = await runCognitiveCompilerCycle({
    tenantId,
    universeId,
    statement: problem.statement,
    root,
  });
  check(
    'US-AS5',
    cycle.hops.find((h) => h.hop === 'parallel_solving')?.state === 'PASS' && cycle.specialistResults.length === tasks.length,
    'Parallel solving hop executed for every decomposed specialist.',
  );
  check(
    'US-AS24',
    cycle.hops.find((h) => h.hop === 'skeptic_review')?.state === 'PASS' && cycle.council.dissent.length >= 1 && cycle.causal.promotion.promotedToVerifiedCausation === false,
    'Skeptic review preserves dissent and refuses causal promotion.',
  );
  check('US-AS25', cycle.hops.find((h) => h.hop === 'synthesis')?.state === 'PASS', 'Synthesis hop recorded.');
  check(
    'US-AS26',
    cycle.uncertainty.simulationIsFact === false && cycle.uncertainty.forecastIsFact === false && cycle.uncertainty.correlationIsCausation === false,
    'Uncertainty hop refuses to treat sim/forecast/correlation as fact.',
  );
  check('US-AS27', cycle.gate.executableByAgent === true && cycle.productionAuthorization === false, 'Low-consequence decision is bounded; not production.');
  check(
    'US-AS28',
    cycle.hops.map((h) => h.hop).join(',') === COGNITIVE_COMPILER_LOOP.join(',') && cycle.hops.every((h) => h.state !== 'UNKNOWN'),
    'Outcome hop completed the full loop without UNKNOWN invented states.',
  );

  const permCycle = await runCognitiveCompilerCycle({
    tenantId,
    universeId,
    statement: 'grant extra cloud permissions via learning',
    requestPermissionExpansion: true,
    root,
  });
  check(
    'US-AS29-cycle-deny',
    permCycle.gate.executableByAgent === false && permCycle.learning.accepted === false && permCycle.locks.AUTO_PERMISSION_EXPANSION === false,
    'Compiler cycle refuses permission expansion through learning.',
  );

  const health = await buildCognitiveCompilerHealthReport(root);
  check(
    'US-AS30-providers',
    health.providers.every((p) => p.state === 'UNAVAILABLE') &&
      health.productionAuthorization === false &&
      health.inventedPass === false &&
      health.githubIssue57 === 'UNAVAILABLE' &&
      health.next.startsWith('62L-AT'),
    'Health report: providers UNAVAILABLE, issue 57 unreadable, next title only 62L-AT.',
  );
  check(
    'US-AS-predecessors',
    health.predecessors['62L-AN'].module === 'AVAILABLE' && health.predecessors['62L-AR'].report === 'WAITING_DATA',
    'AN modules present on this parent; AR report WAITING_DATA after poll.',
  );
} catch (error) {
  failures.push(`EXCEPTION: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} 62L-AS checks:\n${failures.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}

console.log('PASS 62L-AS cognitive compiler / math reasoning fabric / OR workcell / pathway-learning-no-perm');
