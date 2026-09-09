export type QuantSignal = {
  id: string;
  weight: number;
  confidence: number;
  direction: -1 | 0 | 1;
  evidenceRefs: string[];
};

export type QuantDecision = {
  score: number;
  confidence: number;
  recommendation: 'avoid' | 'defer' | 'investigate' | 'proceed_with_review';
  reasons: string[];
  model: 'classical_probabilistic';
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function evaluateQuantSignals(signals: QuantSignal[]): QuantDecision {
  if (!signals.length) {
    return { score: 0, confidence: 0, recommendation: 'defer', reasons: ['No signals supplied.'], model: 'classical_probabilistic' };
  }

  let numerator = 0;
  let denominator = 0;
  let confidenceMass = 0;
  for (const signal of signals) {
    const weight = Math.max(0, Math.abs(signal.weight));
    const confidence = clamp01(signal.confidence);
    numerator += signal.direction * weight * confidence;
    denominator += weight;
    confidenceMass += confidence;
  }

  const score = denominator === 0 ? 0 : Math.max(-1, Math.min(1, numerator / denominator));
  const confidence = clamp01(confidenceMass / signals.length);
  const recommendation = score <= -0.35
    ? 'avoid'
    : confidence < 0.45
      ? 'investigate'
      : score < 0.25
        ? 'defer'
        : 'proceed_with_review';

  return {
    score,
    confidence,
    recommendation,
    reasons: [
      `${signals.length} bounded evidence-weighted signals evaluated.`,
      'Security, legal, financial and human approval gates remain independent of the numerical score.',
    ],
    model: 'classical_probabilistic',
  };
}

// 'Quant logic' here means quantitative/probabilistic decision support.
// It does not claim quantum-computing behavior or quantum advantage.
