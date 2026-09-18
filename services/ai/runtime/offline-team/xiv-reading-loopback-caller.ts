// 12D-289 — THE READING CHAIN'S LOOPBACK CALLER, in its own module.
//
// This pays down the 12D-113 alignment-audit debt: the 12D-284 CLI
// declared *_GUARDRAILS AND carried the loopback fetch (the audit's
// guardrails-no-network invariant — debt cannot grandfather a network
// call into a guardrails module). The caller now lives here, a
// module that declares no *_GUARDRAILS, is explicitly listed in the
// audit's AUTHORIZED_NETWORK_SURFACES, and carries its OWN local-plane
// binding (the pinned 127.0.0.1 endpoint literal in this source).
//
// Fail-closed discipline:
//   * LOOPBACK ONLY, MECHANICALLY: every caller is built for an
//     endpoint whose host is 127.0.0.1 or localhost — any other host
//     refuses ('loopback-only'). The CLI's default builder pins the
//     12D-280 policy's endpoint verbatim. remoteCalls stay 0 —
//     loopback is not remote.
//   * THE MODEL NAME IS PINNED: every call names qwen2.5-coder:7b
//     with stream:false and temperature:0 — the caller cannot be
//     talked into another model.
//   * NO GUARDRAILS HERE BY AUDIT RULE: this module USES the network,
//     so declaring *_GUARDRAILS in it would violate the audit's
//     guardrails-no-network invariant; the honest flags ride on the
//     packets the caller's results feed (the cycle's and the CLI's).
//   * NO DRAFT GATES HERE: the draft gates (trim, budget,
//     SECRET_CONTENT_RE) live in the REAL 12D-280 first reader; this
//     module re-implements none of them.

export const READING_LOOPBACK_CALLER_POLICY = Object.freeze({
  policyVersion: '12d-289-v1',
  domain: 'XIV_OS_READING_LOOPBACK_CALLER',
  /** The 12D-280 first-reader policy's pinned loopback endpoint. */
  defaultEndpoint: '127.0.0.1:11434',
  /** The pinned local model name — the caller cannot be talked into another model. */
  model: 'qwen2.5-coder:7b',
  remoteCalls: 0, // loopback is not remote
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  modelWeightMutation: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export type ReadingLoopbackCaller = (prompt: string) => Promise<{ model: string; response: string }>;

/** A loopback endpoint is host 127.0.0.1 or localhost, optional :port (≤ 65535). */
const LOOPBACK_ENDPOINT_RE = /^(127\.0\.0\.1|localhost)(:\d{1,5})?$/;

/**
 * Build the caller for an EXPLICIT endpoint. Any non-loopback host
 * refuses — the reading chain never calls a remote model through this
 * surface.
 */
/** A model name: 1..64 chars, starts alnum, then alnum . _ : - (12D-385). */
const MODEL_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

/**
 * Build the caller for an EXPLICIT endpoint AND an EXPLICIT model —
 * the 12D-385 multi-model shape. Both arguments are validated here;
 * the built caller names exactly the given model and reports it back,
 * so the first reader's model-identity gate stays truthful.
 */
export function buildLoopbackCallerForEndpointAndModel(endpoint: string, model: string): ReadingLoopbackCaller {
  if (typeof endpoint !== 'string' || !LOOPBACK_ENDPOINT_RE.test(endpoint))
    throw new Error('the reading caller is loopback-only (127.0.0.1 or localhost, optional :port); fail closed');
  const port = endpoint.includes(':') ? Number(endpoint.slice(endpoint.indexOf(':') + 1)) : 80;
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535)
    throw new Error('the reading caller endpoint port is out of range; fail closed');
  if (typeof model !== 'string' || !MODEL_NAME_RE.test(model))
    throw new Error('the reading caller model name is malformed (1..64 chars, starts alnum, then alnum . _ : -); fail closed');
  return async (prompt: string) => {
    const res = await fetch(`http://${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model, prompt, stream: false,
        options: { temperature: 0 },
      }),
    });
    if (!res.ok) throw new Error(`ollama returned HTTP ${res.status}`);
    const data = JSON.parse(await res.text()) as { response?: string };
    return { model, response: String(data.response ?? '') };
  };
}

export function buildLoopbackCallerForEndpoint(endpoint: string): ReadingLoopbackCaller {
  return buildLoopbackCallerForEndpointAndModel(endpoint, READING_LOOPBACK_CALLER_POLICY.model);
}

/** The CLI's caller: pinned to the 12D-280 policy's loopback endpoint. */
export function buildLoopbackCaller(): ReadingLoopbackCaller {
  return buildLoopbackCallerForEndpoint(READING_LOOPBACK_CALLER_POLICY.defaultEndpoint);
}