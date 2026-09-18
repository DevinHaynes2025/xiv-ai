// 12D-367 — THE READING CHAIN'S MULTI-REASONER FAILOVER CALLER.
//
// CEO directive 2026-09-19 (verbatim): "and if ollama go down we need
// to find alternatives to keep the brain running lets have multiple
// llms and kekep continue working 24/7".
//
// Honest mapping, fail-closed:
//   * FAILOVER IS SELECTION, NOT RECOVERY: candidates are tried in
//     DECLARED order; the first candidate that answers settles the
//     call. An all-down refusal is the honest measured state (the
//     12D-288 operator recovery door exists downstream). This module
//     does not retry in a loop and never invents availability.
//   * LOOPBACK ONLY, BY CONSTRUCTION: every candidate is built through
//     the REAL 12D-289 buildLoopbackCallerForEndpoint — a non-loopback
//     endpoint refuses at BUILD time, before any request. remoteCalls
//     stay 0 (loopback is not remote). A remote/cloud fallback is
//     NEVER taken — all-down is an honest blocker, disclosed.
//   * THE MODEL PIN SURVIVES: every candidate serves the SAME pinned
//     12D-280/289 model (qwen2.5-coder:7b). The 12D-280 first reader's
//     model-identity gate (only the policy model settles a draft) is
//     UNCHANGED — failover between endpoints cannot change which
//     model's draft enters the queue. Adopting a DIFFERENT local model
//     is a separate, CEO-gated policy change (it touches the pinned
//     modelName), never a side effect of this module.
//   * NO NETWORK PRIMITIVE HERE BY AUDIT RULE: this module declares no
//     *_GUARDRAILS and calls no fetch — it composes the authorized
//     12D-289 builders and orchestrates; the honest flags ride on the
//     packets the caller's results feed.
//   * ENDPOINT IDENTITY IS NOT DRAFT PROVENANCE: the caller result
//     stays exactly {model, response} (the 12D-280 exact-key gate),
//     and the settled draft's identity is its re-derived sha256 over
//     the draft TEXT — identical across candidates because the model
//     is identical. Disclosed here, not hidden.

import {
  buildLoopbackCallerForEndpoint,
  READING_LOOPBACK_CALLER_POLICY,
  type ReadingLoopbackCaller,
} from './xiv-reading-loopback-caller';

export const READING_FAILOVER_CALLER_POLICY = Object.freeze({
  policyVersion: '12d-367-v1',
  domain: 'XIV_OS_READING_FAILOVER_CALLER',
  /** Re-pinned from the 12D-289 policy — one model everywhere, always. */
  model: READING_LOOPBACK_CALLER_POLICY.model,
  /** The 12D-289 default endpoint alone, declared in order. */
  defaultEndpoints: Object.freeze(['127.0.0.1:11434']),
  maxCandidates: 8,
  loopbackOnly: true,
  remoteCalls: 0, // loopback is not remote
  candidatesTriedInDeclaredOrder: true,
  allDownIsAnHonestBlockerNotRecovery: true,
  modelIdentityGateUnchanged: true,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  modelWeightMutation: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

/**
 * Build the failover caller for an EXPLICIT, ordered list of loopback
 * endpoints. The list refuses unless it is non-empty, within the
 * declared cap, duplicate-free, and — via the REAL 12D-289 builder —
 * every endpoint is loopback with a valid port. All candidates are
 * built at BUILD time, so an invalid entry refuses before any request.
 */
export function buildFailoverLoopbackCaller(endpoints: readonly string[]): ReadingLoopbackCaller {
  if (!Array.isArray(endpoints) || endpoints.length === 0)
    throw new Error('the failover caller needs at least one declared loopback endpoint; fail closed');
  if (endpoints.length > READING_FAILOVER_CALLER_POLICY.maxCandidates)
    throw new Error(`the failover list exceeds ${READING_FAILOVER_CALLER_POLICY.maxCandidates} candidates; fail closed`);
  const seen = new Set<string>();
  for (const e of endpoints) {
    if (typeof e !== 'string' || seen.has(e))
      throw new Error('the failover list must be distinct declared endpoint strings; fail closed');
    seen.add(e);
  }
  const candidates = endpoints.map((e) => {
    const caller = buildLoopbackCallerForEndpoint(e); // loopback-only + port check, throws at build
    return { endpoint: e, caller };
  });
  return async (prompt: string) => {
    if (typeof prompt !== 'string' || prompt.length === 0)
      throw new Error('the reading caller takes a non-empty prompt string; fail closed');
    const failures: string[] = [];
    for (const { endpoint, caller } of candidates) {
      try {
        const out = await caller(prompt);
        if (out.model !== READING_LOOPBACK_CALLER_POLICY.model)
          throw new Error(`candidate served ${String(out.model)}; only the pinned model may answer; fail closed`);
        return { model: READING_LOOPBACK_CALLER_POLICY.model, response: out.response };
      } catch (err) {
        failures.push(`${endpoint}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    throw new Error(
      `all ${candidates.length} loopback candidate(s) failed; the reading brain is honestly down (loopback only, never a remote fallback) — ${failures.join(' | ')}`,
    );
  };
}

/** The default failover caller: the 12D-289 pinned endpoint alone, declared in order. */
export function buildFailoverLoopbackCallerDefault(): ReadingLoopbackCaller {
  return buildFailoverLoopbackCaller(READING_FAILOVER_CALLER_POLICY.defaultEndpoints);
}