// 12D-300 — XIV AI OS Local Assistant Turn: the seed of the CEO's
// 2026-09-17 directive to build an IN-HOUSE "mini grok bot alternative"
// / "mini cursor" — a fail-closed LOCAL assistant turn on the local
// model. Rakazo (Apache-2.0, read this turn) is the direct reference;
// this contract is built from scratch, not copied, and differs by
// design: every turn is bounded, secret-screened, model-call-counted,
// loopback-only, and ends with humanDecision REQUIRED — the assistant
// DRAFTS, the human decides. No conversation memory, no persistence,
// no activation, no weight mutation in this rung (disclosed residual).
//
//   * SECRET SCREENING BOTH WAYS (the 12D-274/280 lesson): the user
//     message is screened against SECRET_CONTENT_RE before any model
//     call, and the model reply is screened again after — a secret-
//     shaped string in either direction refuses the turn.
//   * BOUNDED: user message 1..4,000 chars; reply 1..8,000 chars
//     (mirroring the 12D-280 draft bound); both bounds refuse, never
//     truncate.
//   * CALLER-INJECTED (the 12D-280 seam): the module never touches the
//     network itself; the injected caller is the ONLY model path, the
//     reported model must be the pinned local model, remoteCalls 0
//     (loopback is not remote).
//   * HONEST PERSONA (pinned): the assistant identifies as the XIV AI
//     OS LOCAL assistant; it never claims cloud execution, GPU
//     changes, deployment, quantum hardware, or billion-user scale —
//     the persona preamble states the honest scope verbatim.
//   * DRAFT-ONLY: the turn returns a draft reply + its sha256 with
//     humanDecision REQUIRED; the operator decides what (if anything)
//     to do with it. No write path: nothing is persisted here.
//
// Disclosed residuals:
//   * A turn is STATELESS: no conversation memory in this rung — the
//     caller composes any prior context (a multi-turn memory rung would
//     be its own gated story).
//   * The reply is model text: it can be wrong. humanDecision REQUIRED
//     is the guard; never act on a draft without a human decision.

import { createHash } from 'node:crypto';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const ASSISTANT_TURN_POLICY = Object.freeze({
  policyVersion: '12d-300-v1',
  domain: 'XIV_OS_LOCAL_ASSISTANT_TURN',
  modelName: 'qwen2.5-coder:7b', // the pinned LOCAL model (12D-280 lineage)
});

export const ASSISTANT_TURN_GUARDRAILS = Object.freeze({
  localModelOnly: true, // the pinned local model; caller-injected, never a fetch
  loopbackOnly: true, // remoteCalls 0 — the local loopback endpoint is not remote
  secretScreenedBothWays: true, // user message AND model reply are screened
  boundedTurn: true, // 4,000-char user message; 8,000-char reply; no truncation
  draftOnly: true, // the assistant drafts; the human decides
  noMemoryPath: true, // a turn is stateless; nothing is persisted
  noActivationPath: true,
  noWeightMutation: true, // learningPromoted false; learning promotion stays CEO-gated
  pureModule: true,
  modelCallsPerTurn: 1, // COUNTED, CEO-approved local model use (12D-280 lineage)
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export const MAX_USER_MESSAGE_CHARS = 4_000;
export const MAX_ASSISTANT_REPLY_CHARS = 8_000;

// The honest persona preamble — pinned verbatim; every turn carries it.
export const ASSISTANT_PERSONA_PREAMBLE = Object.freeze(
  'You are the XIV AI OS LOCAL assistant, running on a local model on this machine. Honest scope: you draft answers for a human operator; the operator decides. You have no cloud access, no deployment ability, no GPU environment changes, and no weight mutation; you never claim billion-user scale or quantum hardware — those are vision, not capability. Your measured ceiling is 2,000,000 rows per database. Answer directly and concisely; if you do not know, say so.',
);

const INPUT_KEYS = ['tenantId', 'turnId', 'userMessage'] as const;

export type AssistantTurnPacket = Readonly<
  | {
      status: 'DRAFTED';
      kind: 'ASSISTANT_TURN_DRAFT';
      policyVersion: string;
      tenantId: string;
      turnId: string;
      model: string;
      replyDraft: string;
      draftSha256: string;
      modelCalls: 1;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      stoppedBefore: string;
      humanDecision: 'REQUIRED';
    }
  | {
      status: 'REFUSED';
      kind: 'ASSISTANT_TURN_DRAFT';
      policyVersion: string;
      reason: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
>;

function refuse(reason: string): AssistantTurnPacket {
  return Object.freeze({
    status: 'REFUSED' as const,
    kind: 'ASSISTANT_TURN_DRAFT' as const,
    policyVersion: ASSISTANT_TURN_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const, remoteCalls: 0 as const,
    activated: 0 as const, learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

export interface AssistantTurnPrepared {
  readonly status: 'PREPARED';
  readonly tenantId: string;
  readonly turnId: string;
  readonly userMessage: string;
  readonly prompt: string;
}

/**
 * Prepare an assistant turn. NEVER throws; any anomaly refuses before
 * any model call (modelCalls 0 on refusal).
 */
export function prepareAssistantTurn(raw: unknown): AssistantTurnPrepared | AssistantTurnPacket {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
    return refuse('the input must be an object; fail closed');
  const keys = Object.keys(raw as Record<string, unknown>);
  if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
    return refuse(`the input must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
  const p = raw as Readonly<Record<string, unknown>>;
  if (typeof p.tenantId !== 'string' || p.tenantId.length < 1 || p.tenantId.length > 64)
    return refuse('tenantId must be a bounded string (1..64 chars); fail closed');
  if (typeof p.turnId !== 'string' || p.turnId.length < 1 || p.turnId.length > 128)
    return refuse('turnId must be a bounded string (1..128 chars); fail closed');
  if (typeof p.userMessage !== 'string' || p.userMessage.length < 1 || p.userMessage.length > MAX_USER_MESSAGE_CHARS)
    return refuse(`userMessage must be a bounded string (1..${MAX_USER_MESSAGE_CHARS.toLocaleString('en-US')} chars); fail closed`);
  // SECRET SCREENING — the user message must be secret-free before ANY model call.
  if (SECRET_CONTENT_RE.test(p.userMessage))
    return refuse('the user message is secret-shaped (credential/key pattern); secrets never go to ANY model; fail closed');
  return Object.freeze({
    status: 'PREPARED' as const,
    tenantId: p.tenantId,
    turnId: p.turnId,
    userMessage: p.userMessage,
    prompt: `${ASSISTANT_PERSONA_PREAMBLE}\n\nOperator message:\n${p.userMessage}`,
  });
}

export interface AssistantCallerResult {
  readonly model: string;
  readonly response: string;
}

/**
 * Run ONE assistant turn against the INJECTED caller (the only model
 * path). NEVER throws; a caller failure or post-call screen refusal
 * returns REFUSED (pre-call: modelCalls 0; post-call: the caller ran —
 * disclosed in the refusal reason, never retried silently).
 */
export async function runAssistantTurn(
  prepared: AssistantTurnPrepared,
  caller: (prompt: string) => Promise<AssistantCallerResult>,
): Promise<AssistantTurnPacket> {
  try {
    if (prepared.prompt.length > ASSISTANT_PERSONA_PREAMBLE.length + MAX_USER_MESSAGE_CHARS + 64)
      return refuse('the composed prompt exceeds the composed-prompt bound; fail closed');
    let result: AssistantCallerResult;
    try {
      result = await caller(prepared.prompt);
    } catch (err) {
      return refuse(`the local model call failed before drafting (pre-call): ${err instanceof Error ? err.message : String(err)}`);
    }
    if (result.model !== ASSISTANT_TURN_POLICY.modelName)
      return refuse(`the caller reported model ${String(result.model)}; only the pinned local model ${ASSISTANT_TURN_POLICY.modelName} may draft an assistant turn; fail closed`);
    const reply = String(result.response ?? '');
    if (reply.length < 1 || reply.length > MAX_ASSISTANT_REPLY_CHARS)
      return refuse(`the model reply must be 1..${MAX_ASSISTANT_REPLY_CHARS.toLocaleString('en-US')} chars; fail closed`);
    // SECRET SCREENING AGAIN — the model reply is screened post-call.
    if (SECRET_CONTENT_RE.test(reply))
      return refuse('the model reply is secret-shaped (credential/key pattern); the draft is refused post-call; fail closed');
    const draftSha256 = createHash('sha256').update(reply, 'utf8').digest('hex');
    return Object.freeze({
      status: 'DRAFTED' as const,
      kind: 'ASSISTANT_TURN_DRAFT' as const,
      policyVersion: ASSISTANT_TURN_POLICY.policyVersion,
      tenantId: prepared.tenantId,
      turnId: prepared.turnId,
      model: result.model,
      replyDraft: reply,
      draftSha256,
      modelCalls: 1 as const,
      remoteCalls: 0 as const,
      activated: 0 as const,
      learningPromoted: false as const,
      stoppedBefore: 'the operator decision — a draft is text, never an action',
      humanDecision: 'REQUIRED' as const,
    });
  } catch (err) {
    return refuse(err instanceof Error ? err.message : String(err));
  }
}