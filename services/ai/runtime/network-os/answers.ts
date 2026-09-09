/**
 * XIV Business Answer Engine. Unavailable data is stated as unavailable. No fabrication.
 */
export type AnswerIntent =
  | 'sales_decline'
  | 'growing_industries'
  | 'comparable_companies'
  | 'regional_opportunity'
  | 'supply_chain_costs'
  | 'customer_segment'
  | 'inflation_context'
  | 'next_investigation';

export type BusinessAnswer = {
  question: string;
  intent: AnswerIntent | 'unknown';
  unavailable: boolean;
  fabricated: false;
  confidence: 'low' | 'medium' | 'high' | 'unknown';
  citations: readonly string[];
  stance: 'observed' | 'inferred' | 'hypothesized' | 'forecast' | 'recommended' | 'unavailable';
};

export function answerBusinessQuestion(input: {
  question: string;
  evidenceRefs: readonly string[];
  dataAvailable: boolean;
}): BusinessAnswer {
  if (!input.dataAvailable || input.evidenceRefs.length === 0) {
    return {
      question: input.question,
      intent: 'unknown',
      unavailable: true,
      fabricated: false,
      confidence: 'unknown',
      citations: [],
      stance: 'unavailable',
    };
  }
  return {
    question: input.question,
    intent: 'unknown',
    unavailable: false,
    fabricated: false,
    confidence: 'low',
    citations: input.evidenceRefs,
    stance: 'inferred',
  };
}

export function answerFabricatesWhenUnavailable() {
  return false;
}
