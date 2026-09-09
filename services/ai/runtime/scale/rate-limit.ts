export type RateLimitDimension =
  | 'user'
  | 'organization'
  | 'universe'
  | 'ip_session'
  | 'agent'
  | 'tool'
  | 'api'
  | 'livestream'
  | 'media'
  | 'ai_token_budget';

export type RateLimitRule = {
  dimension: RateLimitDimension;
  limit: number;
  windowSeconds: number;
};

export function createRateLimitRule(input: Partial<RateLimitRule> & { dimension: RateLimitDimension }) {
  if (input.limit === undefined || input.limit === Number.POSITIVE_INFINITY || input.limit <= 0) {
    return { allowed: false as const, reason: 'Rate-limit layer rejects unlimited defaults: DENY' };
  }
  if (!input.windowSeconds || input.windowSeconds <= 0) {
    return { allowed: false as const, reason: 'Rate-limit window must be a positive finite value: DENY' };
  }
  return {
    allowed: true as const,
    rule: {
      dimension: input.dimension,
      limit: input.limit,
      windowSeconds: input.windowSeconds,
    } satisfies RateLimitRule,
  };
}

export function unlimitedRateLimitAllowed() {
  return false;
}
