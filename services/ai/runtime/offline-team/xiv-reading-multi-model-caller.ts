// 12D-385 — THE READING CHAIN'S MULTI-MODEL CALLER, in its own module.
//
// The CEO's standing directive ("if ollama go down we need to find
// alternatives to keep the brain running lets have multiple llms",
// 2026-09-19) extends 12D-367's multi-ENDPOINT failover to
// multi-MODEL failover — still LOCAL-ONLY. What this module is:
//
//   * a DECLARED candidate list of {endpoint, model} pairs, built at
//     BUILD time through the REAL 12D-289 module's
//     buildLoopbackCallerForEndpointAndModel (composition, no fetch
//     here — this module stays off the audit's
//     AUTHORIZED_NETWORK_SURFACES exactly like 12D-367);
//   * call time: candidates tried in DECLARED order, one request
//     each — the first healthy answer settles, no retry churn;
//   * every candidate is loopback AND a declared model name; the
//     reported model must equal the candidate's model or the call
//     refuses (a mismatch report means the endpoint served something
//     undeclared — fail closed, never swallowed);
//   * all candidates down = an HONEST BLOCKER naming every measured
//     failure — never a remote/cloud fallback, never automatic
//     recovery.
//
// The DEFAULT build is the SINGLE pinned primary (the 12D-280/289
// pin, qwen2.5-coder:7b at 127.0.0.1:11434) — the default behavior is
// byte-for-byte today's until the operator explicitly declares an
// installed fallback list. A fallback model must actually be
// installed locally (census `ollama list` first) and its adoption is
// a CEO-gated declared choice, never an invented one.
//
// Fail-closed discipline (mirrors 12D-367):
//   * no *_GUARDRAILS here (this module composes a network module;
//     the honest flags ride on the packets the results feed);
//   * no fetch, no network primitive, no queue/register/store use;
//   * refuses empty, duplicate, over-cap (8), non-loopback, and
//     malformed-model candidate lists at BUILD time — pre-request;
//   * re-gates every answered model identity at CALL time.

import {
  buildLoopbackCallerForEndpointAndModel,
  READING_LOOPBACK_CALLER_POLICY,
  type ReadingLoopbackCaller,
} from './xiv-reading-loopback-caller';

export const MULTI_MODEL_READING_CALLER_POLICY = Object.freeze({
  /** 12D-386: the FIRST fallback is DECLARED — qwen2.5:3b, installed
   *  locally (census: 1.93 GB, `ollama pull` under CEO directive #2).
   *  Recorded CEO basis, directive #2 verbatim (2026-09-19): "if ollama
   *  go down we need to find alternatives to keep the brain running
   *  lets have multiple llms". Loopback-only; the declared list names
   *  a model that ACTUALLY EXISTS on this machine — never an invented
   *  availability. */
  policyVersion: '12d-386-v1',
  domain: 'XIV_OS_READING_MULTI_MODEL_CALLER',
  /** The pinned primary — 12D-280/289 verbatim. Always declared first. */
  primaryModel: READING_LOOPBACK_CALLER_POLICY.model,
  /** 12D-386 DECLARED (was EMPTY in 12d-385-v1): the installed local
   *  fallback model. Declaring does NOT install anything — the model
   *  was installed first (census `ollama list`), the declaration
   *  follows the reality. */
  declaredFallbackModels: ['qwen2.5:3b'] as readonly string[],
  defaultEndpoints: ['127.0.0.1:11434'],
  maxCandidates: 8,
  loopbackOnly: true,
  remoteCalls: 0, // loopback is not remote
  candidatesTriedInDeclaredOrder: true,
  firstHealthyAnswerSettles: true,
  noRetryChurn: true,
  allDownIsAnHonestBlockerNotRecovery: true,
  reportedModelMustEqualDeclaredModel: true,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  modelWeightMutation: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export type MultiModelCandidate = Readonly<{ endpoint: string; model: string }>;
export type MultiModelCallResult = Readonly<{ model: string; response: string; candidateIndex: number }>;

/**
 * Build the ordered multi-model caller. Every candidate is validated
 * and built NOW (build time) — an invalid list refuses before any
 * request exists.
 */
export function buildMultiModelCaller(candidates: readonly MultiModelCandidate[]): (prompt: string) => Promise<MultiModelCallResult> {
  if (!Array.isArray(candidates) || candidates.length === 0)
    throw new Error('a declared non-empty candidate list is required (primary first); fail closed');
  if (candidates.length > MULTI_MODEL_READING_CALLER_POLICY.maxCandidates)
    throw new Error(`at most ${MULTI_MODEL_READING_CALLER_POLICY.maxCandidates} candidates may be declared; fail closed`);
  const seen = new Set<string>();
  const built: { candidate: MultiModelCandidate; caller: ReadingLoopbackCaller }[] = [];
  for (const c of candidates) {
    if (!c || typeof c.endpoint !== 'string' || typeof c.model !== 'string')
      throw new Error('every candidate needs declared endpoint and model strings; fail closed');
    const key = `${c.model}@${c.endpoint}`;
    if (seen.has(key)) throw new Error(`duplicate candidate ${key}; candidates must be distinct; fail closed`);
    seen.add(key);
    // Build through the REAL 12D-289 module — its own loopback and
    // model-name validation fires here, pre-request.
    built.push({ candidate: c, caller: buildLoopbackCallerForEndpointAndModel(c.endpoint, c.model) });
  }
  return async (prompt: string) => {
    if (typeof prompt !== 'string' || prompt.trim().length === 0)
      throw new Error('a non-empty prompt is required; fail closed');
    const failures: string[] = [];
    for (let i = 0; i < built.length; i += 1) {
      const { candidate, caller } = built[i]!;
      try {
        const out = await caller(prompt);
        if (out.model !== candidate.model)
          throw new Error(`the endpoint reported model ${String(out.model)} but candidate ${i} is ${candidate.model}; a mismatch report is a refusal, never a settle; fail closed`);
        return { model: out.model, response: out.response, candidateIndex: i };
      } catch (e) {
        failures.push(`${candidate.model}@${candidate.endpoint}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    throw new Error(`all ${built.length} declared candidate(s) failed; the reading brain is honestly down (loopback only, declared models only, never a remote fallback) — ${failures.join(' | ')}`);
  };
}

/** The DEFAULT caller: the single pinned primary — today's behavior. */
export function buildMultiModelCallerDefault(): (prompt: string) => Promise<MultiModelCallResult> {
  return buildMultiModelCaller([
    { endpoint: MULTI_MODEL_READING_CALLER_POLICY.defaultEndpoints[0]!, model: MULTI_MODEL_READING_CALLER_POLICY.primaryModel },
  ]);
}

/**
 * 12D-386 — the DECLARED caller: the pinned primary FIRST, then every
 * declared fallback model at the pinned default endpoint, in declared
 * order. This is the failover-ready shape the CEO's directive #2 asks
 * for: if the primary model cannot serve, the declared local fallback
 * is tried ONCE — no retry churn, never a remote model.
 */
export function buildMultiModelCallerDeclared(): (prompt: string) => Promise<MultiModelCallResult> {
  const endpoint = MULTI_MODEL_READING_CALLER_POLICY.defaultEndpoints[0]!;
  return buildMultiModelCaller([
    { endpoint, model: MULTI_MODEL_READING_CALLER_POLICY.primaryModel },
    ...MULTI_MODEL_READING_CALLER_POLICY.declaredFallbackModels.map((model) => ({ endpoint, model })),
  ]);
}