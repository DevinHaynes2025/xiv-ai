/**
 * 12D-105: Governed runtime-mode state machine (OFFLINE / HYBRID / ONLINE / AUTOPILOT).
 *
 * Trust is graduated: OFFLINE→ONLINE must pass through HYBRID; every escalation carries an
 * evidence ref; AUTOPILOT additionally requires a PRIOR human operator authorization with a
 * bounded expiry. The governor never grants authority by itself — it only checks receipts.
 * All de-escalations (including fail-toward-OFFLINE) are always allowed. A TOP_SECRET
 * classification ceiling locks the mode to OFFLINE: TOP_SECRET never routes externally.
 * Authorization expiry degrades the effective mode automatically (fail-safe degradation,
 * NOT automatic recovery); re-engagement always needs a fresh human receipt.
 */
export type RuntimeMode = 'OFFLINE' | 'HYBRID' | 'ONLINE' | 'AUTOPILOT';
export type ClassificationCeiling = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export const MODE_GOVERNOR_POLICY = Object.freeze({
  maxAutopilotWindowMs: 7 * 24 * 60 * 60 * 1000,
  maxRefChars: 256,
});

export const MODE_GOVERNOR_GUARDRAILS = Object.freeze({
  graduatedTrustRequired: true,
  autopilotRequiresPriorHumanAuthorization: true,
  autopilotWindowBounded: true,
  automaticRecovery: false,
  expiryDegradesAutomatically: true,
  topSecretOfflineOnly: true,
  deEscalationAlwaysAllowed: true,
  learningPromoted: false,
});

export interface ModeTransitionRequest {
  to: RuntimeMode;
  evidenceRef: string;
  operatorAuthorizationRef?: string;
  authorizationExpiresAtMs?: number;
  classificationCeiling?: ClassificationCeiling;
}

export interface ModeTransitionPacket {
  from: RuntimeMode;
  to: RuntimeMode;
  effectiveMode: RuntimeMode;
  evidenceRef: string;
  operatorAuthorizationRef: string | null;
  authorizationExpiresAtMs: number | null;
  humanDecision: 'REQUIRED' | 'SATISFIED_BY_PRIOR_RECEIPT';
  automaticRecovery: false;
  learningPromoted: false;
}

const ORDER: readonly RuntimeMode[] = ['OFFLINE', 'HYBRID', 'ONLINE', 'AUTOPILOT'];
const ref = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= MODE_GOVERNOR_POLICY.maxRefChars;

export class ModeGovernor {
  readonly #clock: () => number;
  #mode: RuntimeMode = 'OFFLINE';
  #enteredFrom: RuntimeMode = 'OFFLINE';
  #enteredAtMs: number;
  #authorizationRef: string | null = null;
  #authorizationExpiresAtMs: number | null = null;
  #classificationCeiling: ClassificationCeiling = 'INTERNAL';
  #lastEvidenceRef: string | null = null;

  constructor(clock: () => number = Date.now) {
    if (typeof clock !== 'function') throw new Error('clock required');
    this.#clock = clock;
    this.#enteredAtMs = this.#clock();
  }

  requestTransition(input: ModeTransitionRequest): Readonly<ModeTransitionPacket> {
    if (!input || !ref(input.evidenceRef)) throw new Error('evidence ref required for every transition');
    const to = input.to;
    if (!ORDER.includes(to)) throw new Error(`unknown mode: ${String(to)}`);
    const now = this.#clock();
    const from = this.#mode;
    const escalate = (to: RuntimeMode) => ORDER.indexOf(to) > ORDER.indexOf(from);
    // A declared TOP_SECRET ceiling locks the runtime to OFFLINE — on ANY transition, not
    // just escalations; a ceiling declared while de-escalating must still bind.
    if ((input.classificationCeiling === 'TOP_SECRET' || this.#classificationCeiling === 'TOP_SECRET') && to !== 'OFFLINE')
      throw new Error('TOP_SECRET classification ceiling locks the runtime to OFFLINE; no external routing is permitted');
    if (escalate(to)) {
      if (to === 'ONLINE' && from === 'OFFLINE') throw new Error('graduated trust required: OFFLINE must pass through HYBRID before ONLINE');
      if (to === 'AUTOPILOT') {
        if (from !== 'ONLINE') throw new Error('AUTOPILOT can only be engaged from ONLINE');
        if (!ref(input.operatorAuthorizationRef)) throw new Error('AUTOPILOT requires a prior human operator authorization receipt');
        const exp = input.authorizationExpiresAtMs;
        if (exp === undefined || !Number.isSafeInteger(exp) || exp <= now) throw new Error('AUTOPILOT authorization expiry must be in the future');
        if (exp - now > MODE_GOVERNOR_POLICY.maxAutopilotWindowMs) throw new Error('AUTOPILOT authorization window exceeds policy cap');
        this.#authorizationRef = input.operatorAuthorizationRef;
        this.#authorizationExpiresAtMs = exp;
      }
    }
    if (input.classificationCeiling) this.#classificationCeiling = input.classificationCeiling;
    this.#enteredFrom = from;
    this.#mode = to;
    this.#lastEvidenceRef = input.evidenceRef;
    if (to === 'OFFLINE') { this.#authorizationRef = null; this.#authorizationExpiresAtMs = null; }
    return Object.freeze({ from, to, effectiveMode: this.effectiveMode().mode, evidenceRef: input.evidenceRef,
      operatorAuthorizationRef: this.#authorizationRef, authorizationExpiresAtMs: this.#authorizationExpiresAtMs,
      humanDecision: to === 'AUTOPILOT' ? 'SATISFIED_BY_PRIOR_RECEIPT' : 'REQUIRED',
      automaticRecovery: false, learningPromoted: false });
  }

  /** Effective mode: an expired AUTOPILOT authorization degrades to ONLINE automatically (fail-safe, not recovery). */
  effectiveMode(): { mode: RuntimeMode; degraded: boolean; reason: string | null; authorizationExpiresAtMs: number | null } {
    const now = this.#clock();
    if (this.#mode === 'AUTOPILOT' && this.#authorizationExpiresAtMs !== null && now >= this.#authorizationExpiresAtMs)
      return { mode: 'ONLINE', degraded: true, reason: 'authorizationExpired', authorizationExpiresAtMs: this.#authorizationExpiresAtMs };
    return { mode: this.#mode, degraded: false, reason: null, authorizationExpiresAtMs: this.#authorizationExpiresAtMs };
  }

  /** Explicit acknowledgment of expiry; re-authorization is a fresh human receipt. */
  acknowledgeExpiry(): Readonly<ModeTransitionPacket> {
    if (this.effectiveMode().reason !== 'authorizationExpired') throw new Error('no expired authorization to acknowledge');
    const from = this.#mode;
    this.#mode = 'ONLINE';
    this.#authorizationRef = null;
    this.#authorizationExpiresAtMs = null;
    return Object.freeze({ from, to: 'ONLINE', effectiveMode: 'ONLINE', evidenceRef: `expiry:${from.toLowerCase()}:acknowledged`,
      operatorAuthorizationRef: null, authorizationExpiresAtMs: null, humanDecision: 'REQUIRED',
      automaticRecovery: false, learningPromoted: false });
  }

  snapshot() {
    return Object.freeze({ mode: this.#mode, effectiveMode: this.effectiveMode(),
      enteredFrom: this.#enteredFrom, enteredAtMs: this.#enteredAtMs,
      classificationCeiling: this.#classificationCeiling, lastEvidenceRef: this.#lastEvidenceRef,
      humanDecision: 'REQUIRED' as const, automaticRecovery: false, learningPromoted: false,
      guardrails: MODE_GOVERNOR_GUARDRAILS });
  }
}