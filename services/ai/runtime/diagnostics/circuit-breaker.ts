import type { XivAgentId } from '../agents';
import type { CircuitBreakerRecord, CircuitBreakerState, CircuitSignal } from './types';

const OPEN_THRESHOLD = 3;

export function evaluateCircuitBreaker(input: {
  agentId: XivAgentId | 'unknown';
  signals: readonly CircuitSignal[];
  previousState?: CircuitBreakerState;
}): CircuitBreakerRecord {
  const unique = [...new Set(input.signals)];
  let state: CircuitBreakerState = 'closed';
  if (unique.length >= OPEN_THRESHOLD || input.signals.length >= OPEN_THRESHOLD) {
    state = 'open';
  } else if (unique.length > 0) {
    state = 'warning';
  } else if (input.previousState === 'open') {
    state = 'half_open';
  }

  return {
    agentId: input.agentId,
    state,
    signals: unique,
    reason:
      state === 'open'
        ? 'Deterministic circuit breaker opened. Agent cannot accept new work until a policy-defined re-enable.'
        : state === 'warning'
          ? 'Circuit breaker warning: signals observed below the open threshold.'
          : state === 'half_open'
            ? 'Circuit breaker is half-open. Probe traffic only; re-enable remains policy-defined.'
            : 'Circuit breaker closed.',
    acceptsWork: state === 'closed' || state === 'warning',
    reenableRequiresPolicy: true,
  };
}

export function circuitIsOpen(record: CircuitBreakerRecord) {
  return record.state === 'open' && record.acceptsWork === false;
}
