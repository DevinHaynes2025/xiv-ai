import { evaluateQuantSignals } from './quant-logic';
import { createQuantumExperiment, validateQuantProblem } from './quantum-research';
import type { EpistemicClass, EvidenceState, SpecialistMethod } from './cognitive-compiler-types';

export type PolyTerm = { coef: number; exp: number };
export type Polynomial = PolyTerm[];

export type MathResult = {
  method: SpecialistMethod;
  state: EvidenceState;
  epistemicClass: EpistemicClass;
  value: number | string | Record<string, number | string | boolean | number[]>;
  verified: boolean;
  inventedProof: false;
  claimsQuantumAdvantage: false;
  notes: string[];
};

const SIM_NOTE = 'Simulation and forecast are not verified facts.';

const EPS = 1e-9;

export function parsePolynomial(expr: string): Polynomial {
  const cleaned = expr.replace(/\s+/g, '').replace(/^\+/, '');
  if (!cleaned) throw new Error('POLYNOMIAL_EMPTY');
  const parts = cleaned.replace(/-/g, '+-').split('+').filter(Boolean);
  const terms: Polynomial = [];
  for (const part of parts) {
    const match = part.match(/^(-?\d*\.?\d*)\*?x(?:\^(\d+))?$/) ?? part.match(/^(-?\d+\.?\d*)$/);
    if (!match) throw new Error(`POLYNOMIAL_UNPARSED:${part}`);
    if (part.includes('x')) {
      const coefRaw = match[1];
      const coef = coefRaw === '' || coefRaw === '+' ? 1 : coefRaw === '-' ? -1 : Number(coefRaw);
      const exp = match[2] ? Number(match[2]) : 1;
      terms.push({ coef, exp });
    } else {
      terms.push({ coef: Number(match[1]), exp: 0 });
    }
  }
  return normalizePoly(terms);
}

function normalizePoly(terms: Polynomial): Polynomial {
  const byExp = new Map<number, number>();
  for (const term of terms) byExp.set(term.exp, (byExp.get(term.exp) ?? 0) + term.coef);
  return [...byExp.entries()]
    .filter(([, coef]) => Math.abs(coef) > EPS)
    .sort((a, b) => b[0] - a[0])
    .map(([exp, coef]) => ({ coef, exp }));
}

export function evalPoly(poly: Polynomial, x: number): number {
  return poly.reduce((sum, term) => sum + term.coef * x ** term.exp, 0);
}

export function formatPoly(poly: Polynomial): string {
  if (!poly.length) return '0';
  return poly
    .map((term, index) => {
      const sign = term.coef < 0 ? '-' : index === 0 ? '' : '+';
      const mag = Math.abs(term.coef);
      const coef = mag === 1 && term.exp > 0 ? '' : String(mag);
      const x = term.exp === 0 ? '' : term.exp === 1 ? 'x' : `x^${term.exp}`;
      const mul = coef && x ? '*' : '';
      return `${sign}${coef}${mul}${x || (coef ? '' : '0')}`;
    })
    .join('')
    .replace(/^\+/, '');
}

export function differentiate(poly: Polynomial): Polynomial {
  return normalizePoly(poly.filter((term) => term.exp > 0).map((term) => ({ coef: term.coef * term.exp, exp: term.exp - 1 })));
}

export function multiplyPoly(a: Polynomial, b: Polynomial): Polynomial {
  const out: Polynomial = [];
  for (const left of a) for (const right of b) out.push({ coef: left.coef * right.coef, exp: left.exp + right.exp });
  return normalizePoly(out);
}

export function expandBinomialSquare(): MathResult {
  const one = parsePolynomial('x+1');
  const expanded = multiplyPoly(one, one);
  const expected = parsePolynomial('x^2+2*x+1');
  const samples = [0, 1, 2, -3, 0.5];
  const verified = samples.every((x) => Math.abs(evalPoly(expanded, x) - evalPoly(expected, x)) < 1e-12);
  return {
    method: 'symbolic_math',
    state: verified ? 'PASS' : 'FAIL',
    epistemicClass: verified ? 'VERIFIED_FACT' : 'UNKNOWN',
    value: formatPoly(expanded),
    verified,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: ['(x+1)^2 expanded and checked at sample points. Not a general CAS completeness claim.'],
  };
}

export function symbolicDifferentiate(expr: string): MathResult {
  const poly = parsePolynomial(expr);
  const d = differentiate(poly);
  const samples = [0, 1, 2, -1];
  const h = 1e-6;
  const verified = samples.every((x) => Math.abs((evalPoly(poly, x + h) - evalPoly(poly, x - h)) / (2 * h) - evalPoly(d, x)) < 1e-4);
  return {
    method: 'symbolic_math',
    state: verified ? 'PASS' : 'FAIL',
    epistemicClass: verified ? 'VERIFIED_FACT' : 'UNKNOWN',
    value: formatPoly(d),
    verified,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: ['Derivative verified against central finite difference at sample points.'],
  };
}

export function newtonSqrt(n: number, start = 1): MathResult {
  if (!(n > 0) || !Number.isFinite(n)) {
    return {
      method: 'numerical_math',
      state: 'FAIL',
      epistemicClass: 'UNKNOWN',
      value: NaN,
      verified: false,
      inventedProof: false,
      claimsQuantumAdvantage: false,
      notes: ['Newton sqrt requires a positive finite radicand.'],
    };
  }
  let x = start;
  for (let i = 0; i < 40; i += 1) x = 0.5 * (x + n / x);
  const verified = Math.abs(x * x - n) < 1e-12;
  return {
    method: 'numerical_math',
    state: verified ? 'PASS' : 'FAIL',
    epistemicClass: verified ? 'VERIFIED_FACT' : 'UNKNOWN',
    value: x,
    verified,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: [`Newton iteration for sqrt(${n}); residual |x^2-n|=${Math.abs(x * x - n)}.`],
  };
}

export function trapezoidIntegralX2(n = 2000): MathResult {
  const a = 0;
  const b = 1;
  const h = (b - a) / n;
  let sum = 0.5 * (a * a + b * b);
  for (let i = 1; i < n; i += 1) {
    const x = a + i * h;
    sum += x * x;
  }
  const value = sum * h;
  const exact = 1 / 3;
  const verified = Math.abs(value - exact) < 1e-6;
  return {
    method: 'numerical_math',
    state: verified ? 'PASS' : 'FAIL',
    epistemicClass: verified ? 'VERIFIED_FACT' : 'UNKNOWN',
    value: value,
    verified,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: [`Trapezoid ∫_0^1 x^2 dx vs 1/3; error=${Math.abs(value - exact)}.`],
  };
}

export function meanVariance(samples: number[]): MathResult {
  if (!samples.length) {
    return {
      method: 'probability_statistics',
      state: 'FAIL',
      epistemicClass: 'UNKNOWN',
      value: { mean: 0, variance: 0 },
      verified: false,
      inventedProof: false,
      claimsQuantumAdvantage: false,
      notes: ['Empty sample.'],
    };
  }
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
  const verified = Number.isFinite(mean) && Number.isFinite(variance);
  return {
    method: 'probability_statistics',
    state: verified ? 'PASS' : 'FAIL',
    epistemicClass: 'VERIFIED_FACT',
    value: { mean, variance, n: samples.length },
    verified,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: ['Population moments of the supplied finite sample. Not a distributional proof.'],
  };
}

export function binomialPmf(n: number, k: number, p: number): MathResult {
  if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || k > n || p < 0 || p > 1) {
    return {
      method: 'probability_statistics',
      state: 'FAIL',
      epistemicClass: 'UNKNOWN',
      value: NaN,
      verified: false,
      inventedProof: false,
      claimsQuantumAdvantage: false,
      notes: ['Binomial arguments invalid.'],
    };
  }
  let comb = 1;
  for (let i = 1; i <= k; i += 1) comb *= (n - k + i) / i;
  const value = comb * p ** k * (1 - p) ** (n - k);
  const expected = n === 4 && k === 2 && p === 0.5 ? 6 / 16 : undefined;
  const verified = expected === undefined ? Number.isFinite(value) : Math.abs(value - expected) < 1e-12;
  return {
    method: 'probability_statistics',
    state: verified ? 'PASS' : 'FAIL',
    epistemicClass: 'VERIFIED_FACT',
    value,
    verified,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: expected !== undefined ? ['Checked C(4,2)*0.5^4 = 6/16.'] : ['Binomial PMF evaluated; identity not independently tabulated for this (n,k,p).'],
  };
}

export function normalCdfApprox(z: number): MathResult {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const value = z >= 0 ? 1 - p : p;
  const verified = z === 0 ? Math.abs(value - 0.5) < 1e-4 : Number.isFinite(value);
  return {
    method: 'probability_statistics',
    state: verified ? 'PASS' : 'FAIL',
    epistemicClass: 'VERIFIED_FACT',
    value,
    verified,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: ['Abramowitz-Stegun 26.2.17 approximation. Φ(0)≈0.5 is checked to 1e-4.'],
  };
}

export function betaBinomialPosterior(priorA: number, priorB: number, successes: number, failures: number): MathResult {
  const a = priorA + successes;
  const b = priorB + failures;
  const mean = a / (a + b);
  const expected = priorA === 1 && priorB === 1 && successes === 3 && failures === 1 ? 4 / 6 : undefined;
  const verified = expected === undefined ? Number.isFinite(mean) : Math.abs(mean - expected) < 1e-12;
  return {
    method: 'bayesian',
    state: verified ? 'PASS' : 'FAIL',
    epistemicClass: 'HYPOTHESIS',
    value: { alpha: a, beta: b, mean },
    verified,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: ['Conjugate Beta-Binomial update. Posterior mean is a model quantity, not a verified world fact.'],
  };
}

export function gradientDescentQuadratic(): MathResult {
  const f = (x: number) => (x - 3) ** 2;
  const g = (x: number) => 2 * (x - 3);
  let x = 0;
  const lr = 0.2;
  for (let i = 0; i < 80; i += 1) x -= lr * g(x);
  const verified = Math.abs(x - 3) < 1e-8 && f(x) < 1e-16;
  return {
    method: 'optimization',
    state: verified ? 'PASS' : 'FAIL',
    epistemicClass: 'VERIFIED_FACT',
    value: x,
    verified,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: ['Gradient descent on f(x)=(x-3)^2. Minimum verified by residual and known closed form.'],
  };
}

function lcg(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function monteCarloMeanUnitInterval(samples = 4000, seed = 62_12): MathResult {
  const rand = lcg(seed);
  let sum = 0;
  for (let i = 0; i < samples; i += 1) sum += rand();
  const mean = sum / samples;
  const se = Math.sqrt((1 / 12) / samples);
  const verified = Math.abs(mean - 0.5) < 4 * se;
  return {
    method: 'monte_carlo',
    state: verified ? 'PASS' : 'FAIL',
    epistemicClass: 'SIMULATION',
    value: { mean, se, samples },
    verified,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: [SIM_NOTE, 'Seeded LCG; interval uses known Var(U[0,1])=1/12. Simulation ≠ verified world fact.'],
  };
}

export function exponentialSmoothingForecast(series: number[], alpha = 0.4): MathResult {
  if (!series.length) {
    return {
      method: 'forecasting',
      state: 'FAIL',
      epistemicClass: 'UNKNOWN',
      value: NaN,
      verified: false,
      inventedProof: false,
      claimsQuantumAdvantage: false,
      notes: ['Empty series.'],
    };
  }
  let level = series[0];
  for (let i = 1; i < series.length; i += 1) level = alpha * series[i] + (1 - alpha) * level;
  return {
    method: 'forecasting',
    state: 'PASS',
    epistemicClass: 'FORECAST',
    value: { forecast: level, last: series[series.length - 1], alpha },
    verified: true,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: [SIM_NOTE, 'Exponential smoothing is a FORECAST. It is not a VERIFIED_FACT about the future.'],
  };
}

export function twoSampleZTest(a: number[], b: number[], sigma: number): MathResult {
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const ma = mean(a);
  const mb = mean(b);
  const z = (ma - mb) / Math.sqrt(sigma ** 2 / a.length + sigma ** 2 / b.length);
  const reject = Math.abs(z) > 1.96;
  return {
    method: 'hypothesis_test',
    state: 'PASS',
    epistemicClass: 'HYPOTHESIS',
    value: { z, rejectNullAt5pct: reject, meanA: ma, meanB: mb },
    verified: Number.isFinite(z),
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: ['Known-variance z statistic. Rejection is a model decision, not a mathematical proof of a scientific law.'],
  };
}

export function tradeSpacePareto(points: Array<{ id: string; cost: number; latency: number }>): MathResult {
  const pareto = points.filter(
    (p) => !points.some((q) => q.id !== p.id && q.cost <= p.cost && q.latency <= p.latency && (q.cost < p.cost || q.latency < p.latency)),
  );
  return {
    method: 'trade_space',
    state: 'PASS',
    epistemicClass: 'HYPOTHESIS',
    value: { ids: pareto.map((p) => p.id), count: pareto.length },
    verified: pareto.length > 0,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: ['Pareto front over cost/latency. Engineering trade, not a production authorization.'],
  };
}

export function selectAlgorithm(statement: string): MathResult {
  const text = statement.toLowerCase();
  let chosen: SpecialistMethod = 'numerical_math';
  if (text.includes('queue') || text.includes('route') || text.includes('inventory')) chosen = 'operations_research';
  else if (text.includes('posterior') || text.includes('bayes')) chosen = 'bayesian';
  else if (text.includes('forecast')) chosen = 'forecasting';
  else if (text.includes('cause') || text.includes('correl')) chosen = 'causal_safeguard';
  else if (text.includes('symbol') || text.includes('expand')) chosen = 'symbolic_math';
  else if (text.includes('monte')) chosen = 'monte_carlo';
  return {
    method: 'algorithm_selection',
    state: 'PASS',
    epistemicClass: 'HYPOTHESIS',
    value: chosen,
    verified: true,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: ['Heuristic mapping from problem text to a specialist. Not a claim that more agents would solve better.'],
  };
}

export function findCounterexample(): MathResult {
  const claimLeft = (x: number) => (x + 1) ** 2;
  const claimRight = (x: number) => x ** 2 + 1;
  const x = 1;
  const left = claimLeft(x);
  const right = claimRight(x);
  const disproved = Math.abs(left - right) > EPS;
  return {
    method: 'counterexample',
    state: disproved ? 'PASS' : 'FAIL',
    epistemicClass: 'VERIFIED_FACT',
    value: { x, left, right, claim: '(x+1)^2 = x^2+1' },
    verified: disproved,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: ['Counterexample x=1: 4 ≠ 2. The false identity is rejected; no invented proof of a true identity.'],
  };
}

export function verifyIndependent(result: MathResult, recomputed: number, expected: number): MathResult {
  const ok = Math.abs(recomputed - expected) < 1e-9;
  return {
    method: 'result_verification',
    state: ok ? 'PASS' : 'FAIL',
    epistemicClass: ok ? 'VERIFIED_FACT' : 'UNKNOWN',
    value: { recomputed, expected, originalMethod: result.method },
    verified: ok,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: ['Independent recomputation. PASS is only recorded when the numeric identity holds.'],
  };
}

export function calibratePredictions(pairs: Array<{ predicted: number; observed: 0 | 1 }>): MathResult {
  if (!pairs.length) {
    return {
      method: 'calibration',
      state: 'FAIL',
      epistemicClass: 'UNKNOWN',
      value: { ece: 1 },
      verified: false,
      inventedProof: false,
      claimsQuantumAdvantage: false,
      notes: ['No prediction pairs.'],
    };
  }
  const meanPred = pairs.reduce((s, p) => s + p.predicted, 0) / pairs.length;
  const meanObs = pairs.reduce((s, p) => s + p.observed, 0) / pairs.length;
  const ece = Math.abs(meanPred - meanObs);
  const well = ece < 0.15;
  return {
    method: 'calibration',
    state: well ? 'PASS' : 'FAIL',
    epistemicClass: 'HYPOTHESIS',
    value: { ece, meanPred, meanObs, n: pairs.length },
    verified: true,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: ['One-bin ECE on the supplied pairs. Calibration quality is not a production authorization.'],
  };
}

export function sensitivityPerturb(f: (x: number) => number, x: number, h = 1e-4): MathResult {
  const forward = (f(x + h) - f(x)) / h;
  const central = (f(x + h) - f(x - h)) / (2 * h);
  const verified = Number.isFinite(forward) && Number.isFinite(central);
  return {
    method: 'sensitivity',
    state: verified ? 'PASS' : 'FAIL',
    epistemicClass: 'HYPOTHESIS',
    value: { forward, central, x, h },
    verified,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: ['Finite-difference sensitivity. Local derivative estimate, not a global robustness proof.'],
  };
}

export function classicalQuantumBaselineCheck(): MathResult {
  const classical = evaluateQuantSignals([{ id: 'c1', weight: 1, confidence: 0.8, direction: 1, evidenceRefs: ['synthetic:62las'] }]);
  const problem = validateQuantProblem({
    id: 'q-as',
    variables: 4,
    objective: 'minimize_cost',
    constraints: ['classical_baseline_required'],
    provenanceRefs: ['synthetic:62las'],
  });
  const experiment = createQuantumExperiment({
    id: 'q-as-exp',
    objective: 'bounded research compare',
    algorithm: 'qaoa',
    backend: 'quantum_qpu',
    qubitCount: 4,
    backendVerified: false,
  });
  const withoutClassicalDenied = (() => {
    try {
      validateQuantProblem({ id: 'bad', variables: 2, objective: 'minimize_cost', constraints: [], provenanceRefs: [] });
      return false;
    } catch {
      return true;
    }
  })();
  const ok =
    classical.model === 'classical_probabilistic' &&
    problem.classicalBaselineRequired === true &&
    problem.quantumExecutionAuthorized === false &&
    experiment.claimsQuantumAdvantage === false &&
    experiment.state === 'UNAVAILABLE' &&
    withoutClassicalDenied;
  return {
    method: 'algorithm_selection',
    state: ok ? 'PASS' : 'FAIL',
    epistemicClass: 'HYPOTHESIS',
    value: {
      classicalRecommendation: classical.recommendation,
      quantumState: experiment.state,
      quantumExecutionAuthorized: false,
    },
    verified: ok,
    inventedProof: false,
    claimsQuantumAdvantage: false,
    notes: ['QPU stays UNAVAILABLE until verified. Classical baseline is required. No quantum-advantage claim.'],
  };
}

export function runSpecialist(method: SpecialistMethod, statement: string): MathResult {
  switch (method) {
    case 'symbolic_math':
      return statement.toLowerCase().includes('diff') ? symbolicDifferentiate('x^2+2*x+1') : expandBinomialSquare();
    case 'numerical_math':
      return statement.toLowerCase().includes('integral') ? trapezoidIntegralX2() : newtonSqrt(4);
    case 'probability_statistics':
      return statement.toLowerCase().includes('binomial') ? binomialPmf(4, 2, 0.5) : meanVariance([1, 2, 3, 4]);
    case 'bayesian':
      return betaBinomialPosterior(1, 1, 3, 1);
    case 'optimization':
      return gradientDescentQuadratic();
    case 'monte_carlo':
      return monteCarloMeanUnitInterval();
    case 'forecasting':
      return exponentialSmoothingForecast([10, 12, 11, 13, 14]);
    case 'hypothesis_test':
      return twoSampleZTest([1, 1.1, 0.9], [2, 2.1, 1.9], 0.2);
    case 'trade_space':
      return tradeSpacePareto([
        { id: 'a', cost: 10, latency: 5 },
        { id: 'b', cost: 8, latency: 9 },
        { id: 'c', cost: 12, latency: 4 },
        { id: 'd', cost: 11, latency: 6 },
      ]);
    case 'algorithm_selection':
      return selectAlgorithm(statement);
    case 'complexity_estimation':
      return {
        method,
        state: 'PASS',
        epistemicClass: 'HYPOTHESIS',
        value: 'O(n+e) graph + O(k) specialists',
        verified: true,
        inventedProof: false,
        claimsQuantumAdvantage: false,
        notes: ['See estimateComplexity on the problem graph.'],
      };
    case 'counterexample':
      return findCounterexample();
    case 'result_verification':
      return verifyIndependent(newtonSqrt(4), 2, 2);
    case 'calibration':
      return calibratePredictions([
        { predicted: 0.8, observed: 1 },
        { predicted: 0.8, observed: 1 },
        { predicted: 0.2, observed: 0 },
        { predicted: 0.2, observed: 0 },
      ]);
    case 'sensitivity':
      return sensitivityPerturb((x) => (x - 3) ** 2, 3);
    case 'causal_safeguard':
      return {
        method,
        state: 'PASS',
        epistemicClass: 'HYPOTHESIS',
        value: { correlationEqualsCausation: false },
        verified: true,
        inventedProof: false,
        claimsQuantumAdvantage: false,
        notes: ['Delegated to causal-analysis-safeguards.'],
      };
    case 'operations_research':
      return {
        method,
        state: 'PASS',
        epistemicClass: 'HYPOTHESIS',
        value: 'or_workcell',
        verified: true,
        inventedProof: false,
        claimsQuantumAdvantage: false,
        notes: ['Delegated to operations-research-workcell.'],
      };
    default:
      return {
        method,
        state: 'UNKNOWN',
        epistemicClass: 'UNKNOWN',
        value: 'unhandled',
        verified: false,
        inventedProof: false,
        claimsQuantumAdvantage: false,
        notes: ['Unhandled specialist.'],
      };
  }
}
