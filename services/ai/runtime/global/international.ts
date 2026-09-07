export type InternationalClaimKind =
  | 'verified'
  | 'current_external'
  | 'historical'
  | 'analysis'
  | 'scenario'
  | 'recommendation';

export function classifyInternationalClaim(kind: InternationalClaimKind) {
  return {
    kind,
    isFact: kind === 'verified',
    legalCertainty: false,
    taxCertainty: false,
    regulatoryCertainty: false,
  };
}

export function markUnsupportedLegalClaim(topic: 'legal' | 'tax' | 'regulatory') {
  return {
    topic,
    supported: false,
    certainty: 'unsupported' as const,
    stance: 'recommended' as const,
    reason: `International Business Agent cannot issue ${topic} certainty without a licensed professional and verified current sources.`,
  };
}

export function internationalClaimIsLegalAdvice() {
  return false;
}
