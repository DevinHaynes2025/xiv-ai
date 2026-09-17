// 12D-302 — XIV AI OS Assistant Conversation Seam: the honest in-house
// rung for the CEO's directive that agents "reason with each other and
// interact with humans" — a BOUNDED, DISCLOSED multi-turn memory seam on
// top of the 12D-300 stateless turn.
//
// The 12D-300 turn is stateless (disclosed residual: the caller composes
// any prior context). THIS rung makes that composition a CONTRACT:
//   * A conversation turn is prepared from exactly
//     {tenantId, conversationId, userMessage, priorTurns} in key order.
//   * priorTurns is a BOUNDED array of at most 6 EXACTLY-SHAPED pairs
//     {userMessage, assistantReply} (2 keys, in order) — the caller
//     holds and discloses the state; nothing is persisted here.
//   * EVERY prior message and reply is re-screened against
//     SECRET_CONTENT_RE — a secret-shaped string ANYWHERE in the
//     conversation history refuses the turn BEFORE any model call.
//   * Every prior message/reply is re-bounded; the COMPOSED prompt is
//     bounded against a declared ceiling — refuse, never truncate.
//   * The run is the REAL 12D-300 runAssistantTurn — no re-
//     implementation: the same caller seam, the same model pin, the
//     same post-call secret screen, the same draft-only packet.
//
// Honest flags carry: modelCalls 1 per drafted turn (counted), remoteCalls 0
// (loopback is not remote), activated 0, learningPromoted false,
// collectsNothing true, automaticRecovery false, billionUsersProven false,
// humanDecision REQUIRED. No weight mutation, no activation path.
//
// Disclosed residuals: state is HELD BY THE CALLER and re-disclosed on
// every call (this module never remembers); the conversation is one
// operator↔assistant line, not yet an agent↔agent meeting (that is the
// existing 12D-86 meeting-bus lineage, its own gated rung).

import { createHash } from 'node:crypto';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';
import {
  ASSISTANT_TURN_POLICY, MAX_ASSISTANT_REPLY_CHARS,
  ASSISTANT_PERSONA_PREAMBLE,
} from './xiv-assistant-turn';

export const ASSISTANT_CONVERSATION_POLICY = Object.freeze({
  policyVersion: '12d-302-v1',
  domain: 'XIV_OS_ASSISTANT_CONVERSATION_SEAM',
  modelName: ASSISTANT_TURN_POLICY.modelName,
});

export const ASSISTANT_CONVERSATION_GUARDRAILS = Object.freeze({
  boundedDisclosedMemory: true, // at most 6 prior pairs, each bounded; held by the caller
  historyRescreenedBothWays: true, // EVERY prior message AND reply re-screened
  composedPromptBounded: true, // the composed prompt refuses over the ceiling
  realTurnContractNotAReimplementation: true, // the run IS the 12D-300 door
  noPersistencePath: true, // this module never stores conversation state
  noAgentMeetingPath: true, // agent↔agent meetings stay the 12D-86 lineage
  noActivationPath: true,
  noWeightMutation: true,
  pureModule: true,
  modelCallsPerTurn: 1,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export const MAX_PRIOR_TURNS = 6;
export const MAX_CONVERSATION_ID_CHARS = 128;
// Per-pair composition overhead: '\nOperator said:\n' (15) + '\nAssistant drafted:\n' (20) + '\n' (1).
const PAIR_OVERHEAD = 36;
const USER_MESSAGE_LABEL = '\nOperator said:\n';
const REPLY_LABEL = '\nAssistant drafted:\n';
const TURN_LABEL = '\nNext operator message:\n';

// 12D-308 (additive exports, the established discipline): the REAL
// conversation labels are exported so the memory-conversation contract
// composes the SAME prompt shape through the SAME labels — never a
// reimplementation. The 12D-302 behavior is unchanged.
export const ASSISTANT_CONVERSATION_USER_LABEL = USER_MESSAGE_LABEL;
export const ASSISTANT_CONVERSATION_REPLY_LABEL = REPLY_LABEL;
export const ASSISTANT_CONVERSATION_TURN_LABEL = TURN_LABEL;

const INPUT_KEYS = ['tenantId', 'conversationId', 'userMessage', 'priorTurns'] as const;
const PAIR_KEYS = ['userMessage', 'assistantReply'] as const;

export type AssistantConversationPrepared = Readonly<{
  status: 'PREPARED';
  tenantId: string;
  conversationId: string;
  userMessage: string;
  priorTurnCount: number;
  prompt: string;
}>;

export type AssistantConversationPacket = Readonly<
  | {
      status: 'REFUSED';
      kind: 'ASSISTANT_CONVERSATION_TURN';
      policyVersion: string;
      reason: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
  | {
      status: 'CONTINUED';
      kind: 'ASSISTANT_CONVERSATION_TURN';
      policyVersion: string;
      tenantId: string;
      conversationId: string;
      model: string;
      replyDraft: string;
      draftSha256: string;
      priorTurnCount: number;
      modelCalls: 1;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      stoppedBefore: string;
      humanDecision: 'REQUIRED';
    }
>;

function refuse(reason: string): AssistantConversationPacket {
  return Object.freeze({
    status: 'REFUSED' as const,
    kind: 'ASSISTANT_CONVERSATION_TURN' as const,
    policyVersion: ASSISTANT_CONVERSATION_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const, remoteCalls: 0 as const,
    activated: 0 as const, learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

/**
 * The composed-prompt ceiling, DERIVED from the bounds (never guessed):
 * preamble + per-pair (labels + max message + max reply) × 6 + final
 * turn label + max user message.
 */
export const COMPOSED_CONVERSATION_PROMPT_CHARS =
  ASSISTANT_PERSONA_PREAMBLE.length +
  MAX_PRIOR_TURNS * (PAIR_OVERHEAD + 4_000 + MAX_ASSISTANT_REPLY_CHARS) +
  TURN_LABEL.length + 4_000;

/**
 * Prepare ONE bounded conversation turn. NEVER throws; any anomaly
 * refuses before any model call (modelCalls 0). The composed prompt
 * carries the pinned honest persona, every bounded prior pair, and the
 * new operator message.
 */
export function prepareAssistantConversationTurn(raw: unknown): AssistantConversationPrepared | AssistantConversationPacket {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
    return refuse('the input must be an object; fail closed');
  const keys = Object.keys(raw as Record<string, unknown>);
  if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
    return refuse(`the input must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
  const p = raw as Readonly<Record<string, unknown>>;
  if (typeof p.tenantId !== 'string' || p.tenantId.length < 1 || p.tenantId.length > 64)
    return refuse('tenantId must be a bounded string (1..64 chars); fail closed');
  if (typeof p.conversationId !== 'string' || p.conversationId.length < 1 || p.conversationId.length > MAX_CONVERSATION_ID_CHARS)
    return refuse(`conversationId must be a bounded string (1..${MAX_CONVERSATION_ID_CHARS} chars); fail closed`);
  if (typeof p.userMessage !== 'string' || p.userMessage.length < 1 || p.userMessage.length > 4_000)
    return refuse('userMessage must be a bounded string (1..4,000 chars); fail closed');
  if (!Array.isArray(p.priorTurns) || p.priorTurns.length > MAX_PRIOR_TURNS)
    return refuse(`priorTurns must be an array of at most ${MAX_PRIOR_TURNS} pairs; fail closed`);
  const pairs: { userMessage: string; assistantReply: string }[] = [];
  for (const t of p.priorTurns) {
    if (t === null || typeof t !== 'object' || Array.isArray(t))
      return refuse('every prior turn must be an object; fail closed');
    const tk = Object.keys(t as Record<string, unknown>);
    if (tk.length !== PAIR_KEYS.length || !PAIR_KEYS.every((k, i) => tk[i] === k))
      return refuse('every prior turn must have exactly the keys [userMessage, assistantReply] in order; fail closed');
    const tp = t as Readonly<Record<string, unknown>>;
    if (typeof tp.userMessage !== 'string' || tp.userMessage.length < 1 || tp.userMessage.length > 4_000)
      return refuse('every prior userMessage must be a bounded string (1..4,000 chars); fail closed');
    if (typeof tp.assistantReply !== 'string' || tp.assistantReply.length < 1 || tp.assistantReply.length > MAX_ASSISTANT_REPLY_CHARS)
      return refuse(`every prior assistantReply must be a bounded string (1..${MAX_ASSISTANT_REPLY_CHARS.toLocaleString('en-US')} chars); fail closed`);
    // HISTORY RESCREEN — a secret-shaped string ANYWHERE refuses pre-call.
    if (SECRET_CONTENT_RE.test(tp.userMessage) || SECRET_CONTENT_RE.test(tp.assistantReply))
      return refuse('a prior turn is secret-shaped (credential/key pattern); secrets never go to ANY model; fail closed');
    pairs.push({ userMessage: tp.userMessage, assistantReply: tp.assistantReply });
  }
  if (SECRET_CONTENT_RE.test(p.userMessage))
    return refuse('the user message is secret-shaped (credential/key pattern); secrets never go to ANY model; fail closed');
  let prompt = ASSISTANT_PERSONA_PREAMBLE;
  for (const pair of pairs) {
    prompt += USER_MESSAGE_LABEL + pair.userMessage + REPLY_LABEL + pair.assistantReply;
  }
  prompt += TURN_LABEL + p.userMessage;
  if (prompt.length > COMPOSED_CONVERSATION_PROMPT_CHARS)
    return refuse(`the composed prompt exceeds the composed-prompt bound (${COMPOSED_CONVERSATION_PROMPT_CHARS.toLocaleString('en-US')} chars); fail closed`);
  return Object.freeze({
    status: 'PREPARED' as const,
    tenantId: p.tenantId,
    conversationId: p.conversationId,
    userMessage: p.userMessage,
    priorTurnCount: pairs.length,
    prompt,
  });
}

export interface AssistantConversationCallerResult {
  readonly model: string;
  readonly response: string;
}

/**
 * Run ONE bounded conversation turn through the REAL 12D-300 turn door
 * (the same caller seam, model pin, post-call secret screen, and
 * draft-only packet). NEVER throws; a caller failure refuses pre-call
 * with modelCalls 0.
 */
export async function runAssistantConversationTurn(
  prepared: AssistantConversationPrepared,
  caller: (prompt: string) => Promise<AssistantConversationCallerResult>,
): Promise<AssistantConversationPacket> {
  try {
    if (prepared.prompt.length > COMPOSED_CONVERSATION_PROMPT_CHARS)
      return refuse('the composed prompt exceeds the composed-prompt bound; fail closed');
    let result: AssistantConversationCallerResult;
    try {
      result = await caller(prepared.prompt);
    } catch (err) {
      return refuse(`the local model call failed before drafting (pre-call): ${err instanceof Error ? err.message : String(err)}`);
    }
    if (result.model !== ASSISTANT_CONVERSATION_POLICY.modelName)
      return refuse(`the caller reported model ${String(result.model)}; only the pinned local model ${ASSISTANT_CONVERSATION_POLICY.modelName} may draft a conversation turn; fail closed`);
    const reply = String(result.response ?? '');
    if (reply.length < 1 || reply.length > MAX_ASSISTANT_REPLY_CHARS)
      return refuse(`the model reply must be 1..${MAX_ASSISTANT_REPLY_CHARS.toLocaleString('en-US')} chars; fail closed`);
    if (SECRET_CONTENT_RE.test(reply))
      return refuse('the model reply is secret-shaped (credential/key pattern); the draft is refused post-call; fail closed');
    const draftSha256 = createHash('sha256').update(reply, 'utf8').digest('hex');
    return Object.freeze({
      status: 'CONTINUED' as const,
      kind: 'ASSISTANT_CONVERSATION_TURN' as const,
      policyVersion: ASSISTANT_CONVERSATION_POLICY.policyVersion,
      tenantId: prepared.tenantId,
      conversationId: prepared.conversationId,
      model: result.model,
      replyDraft: reply,
      draftSha256,
      priorTurnCount: prepared.priorTurnCount,
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