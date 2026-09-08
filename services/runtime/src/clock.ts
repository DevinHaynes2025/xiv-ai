export type Clock = {
  now: () => number;
  /** Monotonic microseconds, used for scheduling-latency measurement. */
  micros: () => number;
};

export const systemClock: Clock = {
  now: () => Date.now(),
  micros: () => Math.round(performance.now() * 1000),
};

/**
 * Deterministic clock for acceptance runs. Attestation expiry, package expiry
 * and hard-termination limits are all time-based, so the suite needs to move
 * time without sleeping.
 */
export class ManualClock implements Clock {
  private current: number;
  private micro: number;

  constructor(startMs = Date.UTC(2026, 0, 1, 0, 0, 0)) {
    this.current = startMs;
    this.micro = startMs * 1000;
  }

  now() {
    return this.current;
  }

  micros() {
    this.micro += 1;
    return this.micro;
  }

  advance(ms: number) {
    this.current += ms;
    this.micro += ms * 1000;
    return this.current;
  }
}
