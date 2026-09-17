// 12D-308 — Assistant Memory Conversation Turn: the memory seam and the
// conversation seam in ONE door. The 12D-307 handoff's named next rung:
// the reviewed memory block (12D-305/306/307 lineage) composed WITH the
// disclosed prior turns (12D-302) into a single draft turn — the local
// assistant sees what the humans reviewed AND the disclosed history.
//
// The contract, fail closed end to end:
//   * THE MEMORY IS RE-VERIFIED, NEVER TRUSTED: the packet goes through
//     the REAL 12D-306 view-model gate; a REFUSED packet refuses the
//     turn pre-call (modelCalls 0) with no memory content in the
//     refusal. THE MEMORY BLOCK IS COMPOSED THROUGH THE REAL 12D-307
//     composer (composeMemoryBlock — additive export), never
//     reimplemented.
//   * THE HISTORY IS RE-SCREENED (the 12D-302 discipline): at most 6
//     prior pairs, each exactly {userMessage, assistantReply}, message
//     ≤ 4,000 chars, reply ≤ 8,000 chars, a secret-shaped string
//     ANYWHERE refuses pre-call.
//   * TENANT BOUND: the turn tenantId must equal the memory packet's.
//   * THE COMPOSED PROMPT IS BOUNDED AGAINST A DERIVED CEILING (the
//     12D-302/307 discipline): the REAL exported COMPOSED_CONVERSATION
//     _PROMPT_CHARS plus the REAL exported memory-block components —
//     derived from exported constants, never guessed. Over the ceiling
//     refuses — never truncates.
//   * SECRET SCREENING BOTH WAYS: user message, history, memory block,
//     and the model reply are all screened.
//   * CALLER-INJECTED (the 12D-280/300 seam): the module never touches
//     the network; the reported model must be the pinned local model;
//     remoteCalls 0 (loopback is not remote); modelCalls 1 on a draft.
//   * DRAFT-ONLY: the turn returns a draft reply + sha256 with
//     humanDecision REQUIRED. No write path, no activation, no weight
//     mutation (learningPromoted false).
//
// Honest scope (disclosed): the 12D-302 and 12D-307 doors are UNCHANGED
// in behavior (12D-307 gains additive exports only — the established
// discipline); this is a sibling door composing both seams. The memory
// is provenance context, NOT instructions — the block label says so
// verbatim in the prompt.
import { createHash } from 'node:crypto';
import {
  ASSISTANT_PERSONA_PREAMBLE, MAX_ASSISTANT_REPLY_CHARS, MAX_USER_MESSAGE_CHARS,
} from './xiv-assistant-turn';
import {
  MAX_PRIOR_TURNS, MAX_CONVERSATION_ID_CHARS, COMPOSED_CONVERSATION_PROMPT_CHARS,
  ASSISTANT_CONVERSATION_USER_LABEL, ASSISTANT_CONVERSATION_REPLY_LABEL, ASSISTANT_CONVERSATION_TURN_LABEL,
} from './xiv-assistant-conversation';
import {
  composeMemoryBlock, ASSISTANT_MEMORY_BLOCK_LABEL, ASSISTANT_MEMORY_MAX_ENTRIES,
  ASSISTANT_MEMORY_OBJECTIVE_CAP, ASSISTANT_MEMORY_ENTRY_OVERHEAD,
} from './xiv-assistant-memory-turn';
import { buildAssistantMemoryViewModel } from './xiv-assistant-memory-view-model';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const ASSISTANT_MEMORY_CONVERSATION_POLICY = Object.freeze({
  policyVersion: '12d-308-v1',
  domain: 'XIV_OS_ASSISTANT_MEMORY_CONVERSATION_TURN',
  modelName: 'qwen2.5-coder:7b', // the pinned LOCAL model (12D-280/300 lineage)
});

export const ASSISTANT_MEMORY_CONVERSATION_GUARDRAILS = Object.freeze({
  theRealMemoryGate: true, // the packet goes through the REAL 12D-306 view-model gate
  theRealBlockComposer: true, // the memory block comes from the REAL 12D-307 composer
  memoryIsProvenanceNotInstructions: true,
  tenantBound: true, // the turn tenant must equal the memory tenant
  historyRescreened: true, // every prior pair re-screened pre-call (12D-302)
  derivedCeilingNeverGuessed: true, // composed from REAL exported constants
  overCeilingRefusesNeverTruncates: true,
  secretScreenedBothWays: true,
  localModelOnly: true, // the pinned local model; caller-injected, never a fetch
  loopbackOnly: true, // remoteCalls 0 — the local loopback endpoint is not remote
  draftOnly: true, // the assistant drafts; the human decides
  noWritePath: true,
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

const INPUT_KEYS = ['tenantId', 'conversationId', 'userMessage', 'priorTurns', 'memoryPacket'] as const;
const PAIR_KEYS = ['userMessage', 'assistantReply'] as const;

// 12D-311 (additive export, the established discipline): the history
// validation is EXTRACTED verbatim from this module's prepare so the
// cited conversation contract reuses the REAL 12D-302/308 history
// discipline — never a reimplementation. The 12D-308 behavior is
// unchanged (the refusal messages are byte-identical; the suite
// re-verifies).
export type PriorTurnPairsResult =
  | Readonly<{ ok: true; pairs: readonly { userMessage: string; assistantReply: string }[] }>
  | Readonly<{ ok: false; reason: string }>;

/**
 * The 12D-302 history discipline: at most MAX_PRIOR_TURNS pairs, each
 * exactly {userMessage, assistantReply}, bounded, and a secret-shaped
 * string ANYWHERE refuses. PURE; never throws.
 */
export function validatePriorTurnPairs(value: unknown): PriorTurnPairsResult {
  if (!Array.isArray(value) || value.length > MAX_PRIOR_TURNS)
    return { ok: false, reason: `priorTurns must be an array of at most ${MAX_PRIOR_TURNS} pairs; fail closed` };
  const pairs: { userMessage: string; assistantReply: string }[] = [];
  for (const t of value) {
    if (t === null || typeof t !== 'object' || Array.isArray(t))
      return { ok: false, reason: 'every prior turn must be an object; fail closed' };
    const tk = Object.keys(t as Record<string, unknown>);
    if (tk.length !== PAIR_KEYS.length || !PAIR_KEYS.every((k, i) => tk[i] === k))
      return { ok: false, reason: 'every prior turn must have exactly the keys [userMessage, assistantReply] in order; fail closed' };
    const tp = t as Readonly<Record<string, unknown>>;
    if (typeof tp.userMessage !== 'string' || tp.userMessage.length < 1 || tp.userMessage.length > MAX_USER_MESSAGE_CHARS)
      return { ok: false, reason: `every prior userMessage must be a bounded string (1..${MAX_USER_MESSAGE_CHARS.toLocaleString('en-US')} chars); fail closed` };
    if (typeof tp.assistantReply !== 'string' || tp.assistantReply.length < 1 || tp.assistantReply.length > MAX_ASSISTANT_REPLY_CHARS)
      return { ok: false, reason: `every prior assistantReply must be a bounded string (1..${MAX_ASSISTANT_REPLY_CHARS.toLocaleString('en-US')} chars); fail closed` };
    // HISTORY RESCREEN — a secret-shaped string ANYWHERE refuses pre-call.
    if (SECRET_CONTENT_RE.test(tp.userMessage) || SECRET_CONTENT_RE.test(tp.assistantReply))
      return { ok: false, reason: 'a prior turn is secret-shaped (credential/key pattern); secrets never go to ANY model; fail closed' };
    pairs.push({ userMessage: tp.userMessage, assistantReply: tp.assistantReply });
  }
  return { ok: true, pairs };
}

/**
 * The composed-prompt ceiling, DERIVED from the REAL exported constants
 * (never guessed): the 12D-302 conversation ceiling (persona + 6 ×
 * (pair overhead + message cap + reply cap) + turn label + message
 * cap) plus the 12D-307 memory block (label + 6 × (entry overhead +
 * objective cap)).
 */
export const COMPOSED_MEMORY_CONVERSATION_PROMPT_CHARS =
  COMPOSED_CONVERSATION_PROMPT_CHARS
  + ASSISTANT_MEMORY_BLOCK_LABEL.length
  + ASSISTANT_MEMORY_MAX_ENTRIES * (ASSISTANT_MEMORY_ENTRY_OVERHEAD + ASSISTANT_MEMORY_OBJECTIVE_CAP);

export type AssistantMemoryConversationPacket = Readonly<
  | {
      status: 'DRAFTED';
      kind: 'ASSISTANT_MEMORY_CONVERSATION_TURN';
      policyVersion: string;
      tenantId: string;
      conversationId: string;
      model: string;
      replyDraft: string;
      draftSha256: string;
      priorTurnCount: number;
      memoryCarried: number;
      memoryDoneCount: number;
      modelCalls: 1;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      stoppedBefore: string;
      humanDecision: 'REQUIRED';
    }
  | {
      status: 'REFUSED';
      kind: 'ASSISTANT_MEMORY_CONVERSATION_TURN';
      policyVersion: string;
      reason: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
>;

function refuse(reason: string): AssistantMemoryConversationPacket {
  return Object.freeze({
    status: 'REFUSED' as const,
    kind: 'ASSISTANT_MEMORY_CONVERSATION_TURN' as const,
    policyVersion: ASSISTANT_MEMORY_CONVERSATION_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    activated: 0 as const,
    learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

export interface AssistantMemoryConversationPrepared {
  readonly status: 'PREPARED';
  readonly tenantId: string;
  readonly conversationId: string;
  readonly userMessage: string;
  readonly priorTurnCount: number;
  readonly memoryCarried: number;
  readonly memoryDoneCount: number;
  readonly prompt: string;
}

/**
 * Prepare ONE memory-bearing conversation turn. NEVER throws; any
 * anomaly refuses before any model call (modelCalls 0). The memory
 * packet is verified through the REAL 12D-306 gate — a refused packet
 * refuses the turn and the refusal carries no memory content.
 */
export function prepareAssistantMemoryConversationTurn(
  raw: unknown,
): AssistantMemoryConversationPrepared | AssistantMemoryConversationPacket {
  try {
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
    if (typeof p.userMessage !== 'string' || p.userMessage.length < 1 || p.userMessage.length > MAX_USER_MESSAGE_CHARS)
      return refuse(`userMessage must be a bounded string (1..${MAX_USER_MESSAGE_CHARS.toLocaleString('en-US')} chars); fail closed`);
    const pairsResult = validatePriorTurnPairs(p.priorTurns);
    if (!pairsResult.ok) return refuse(pairsResult.reason);
    const pairs = pairsResult.pairs;
    // SECRET SCREENING — the user message must be secret-free before ANY model call.
    if (SECRET_CONTENT_RE.test(p.userMessage))
      return refuse('the user message is secret-shaped (credential/key pattern); secrets never go to ANY model; fail closed');
    // THE MEMORY IS RE-VERIFIED through the REAL 12D-306 gate — never trusted.
    const vm = buildAssistantMemoryViewModel(p.memoryPacket);
    if (vm.kind === 'REFUSED')
      return refuse(`the memory packet failed verification (${vm.reason}); the turn refuses pre-call; fail closed`);
    if (vm.display.tenantId !== p.tenantId)
      return refuse('the memory packet tenant does not match the turn tenant; one tenant\'s memory never drafts another tenant\'s reply; fail closed');
    // The memory block comes from the REAL 12D-307 composer (it screens
    // every objective — a secret-shaped one throws, caught → refusal).
    const prompt = ASSISTANT_PERSONA_PREAMBLE
      + composeMemoryBlock(vm.display.entries)
      + pairs.map((pair) => ASSISTANT_CONVERSATION_USER_LABEL + pair.userMessage + ASSISTANT_CONVERSATION_REPLY_LABEL + pair.assistantReply).join('')
      + ASSISTANT_CONVERSATION_TURN_LABEL + p.userMessage;
    if (prompt.length > COMPOSED_MEMORY_CONVERSATION_PROMPT_CHARS)
      return refuse(`the composed prompt exceeds the composed-prompt bound (${COMPOSED_MEMORY_CONVERSATION_PROMPT_CHARS.toLocaleString('en-US')} chars); fail closed`);
    return Object.freeze({
      status: 'PREPARED' as const,
      tenantId: p.tenantId,
      conversationId: p.conversationId,
      userMessage: p.userMessage,
      priorTurnCount: pairs.length,
      memoryCarried: vm.display.carriedCount,
      memoryDoneCount: vm.display.doneCount,
      prompt,
    });
  } catch (err) {
    return refuse(err instanceof Error ? err.message : String(err));
  }
}

export interface AssistantMemoryConversationCallerResult {
  readonly model: string;
  readonly response: string;
}

/**
 * Run ONE memory-bearing conversation turn against the INJECTED caller
 * (the only model path). NEVER throws; a caller failure or post-call
 * screen refusal returns REFUSED (pre-call: modelCalls 0; post-call:
 * the caller ran — disclosed in the refusal reason, never retried
 * silently).
 */
export async function runAssistantMemoryConversationTurn(
  prepared: AssistantMemoryConversationPrepared,
  caller: (prompt: string) => Promise<AssistantMemoryConversationCallerResult>,
): Promise<AssistantMemoryConversationPacket> {
  try {
    if (prepared.prompt.length > COMPOSED_MEMORY_CONVERSATION_PROMPT_CHARS)
      return refuse('the composed prompt exceeds the composed-prompt bound; fail closed');
    let result: AssistantMemoryConversationCallerResult;
    try {
      result = await caller(prepared.prompt);
    } catch (err) {
      return refuse(`the local model call failed before drafting (pre-call): ${err instanceof Error ? err.message : String(err)}`);
    }
    if (result.model !== ASSISTANT_MEMORY_CONVERSATION_POLICY.modelName)
      return refuse(`the caller reported model ${String(result.model)}; only the pinned local model ${ASSISTANT_MEMORY_CONVERSATION_POLICY.modelName} may draft a memory conversation turn; fail closed`);
    const reply = String(result.response ?? '');
    if (reply.length < 1 || reply.length > MAX_ASSISTANT_REPLY_CHARS)
      return refuse(`the model reply must be 1..${MAX_ASSISTANT_REPLY_CHARS.toLocaleString('en-US')} chars; fail closed`);
    // SECRET SCREENING AGAIN — the model reply is screened post-call.
    if (SECRET_CONTENT_RE.test(reply))
      return refuse('the model reply is secret-shaped (credential/key pattern); the draft is refused post-call; fail closed');
    const draftSha256 = createHash('sha256').update(reply, 'utf8').digest('hex');
    return Object.freeze({
      status: 'DRAFTED' as const,
      kind: 'ASSISTANT_MEMORY_CONVERSATION_TURN' as const,
      policyVersion: ASSISTANT_MEMORY_CONVERSATION_POLICY.policyVersion,
      tenantId: prepared.tenantId,
      conversationId: prepared.conversationId,
      model: result.model,
      replyDraft: reply,
      draftSha256,
      priorTurnCount: prepared.priorTurnCount,
      memoryCarried: prepared.memoryCarried,
      memoryDoneCount: prepared.memoryDoneCount,
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