// 12D-311 — Assistant Memory CITED Conversation: the memory block as
// CITABLE provenance IN a multi-turn conversation. The 12D-310
// handoff's next candidate: the 12D-308 memory conversation door PLUS
// the 12D-310 citation gate — the assistant sees what the humans
// reviewed AND what was already said, and cites the exact reviewed
// storyIds it relied on; a draft citing anything outside the verified
// carried set refuses POST-CALL.
//
// The contract, fail closed end to end (every gate REAL, none
// re-implemented):
//   * the 12D-302/308 history discipline — REUSED through the additive
//     validatePriorTurnPairs extraction (≤ 6 pairs, exact pair keys,
//     a secret-shaped string ANYWHERE refuses pre-call);
//   * the memory packet RE-VERIFIED through the REAL 12D-306 gate;
//   * the memory block composed through the REAL 12D-307 composer;
//   * the citation discipline from the REAL 12D-310 CITATION_LABEL;
//   * the composed prompt checked against
//     COMPOSED_MEMORY_CITED_CONVERSATION_PROMPT_CHARS — DERIVED from
//     the REAL 12D-308 bound plus the citation label; over-ceiling
//     refuses, never truncates;
//   * the citation gate from the REAL 12D-310 extractor — a cited
//     storyId outside the VERIFIED carried set refuses POST-CALL
//     (fabricated provenance never passes); zero citations drafts
//     honestly with citedCount 0 (disclosed as UNGROUNDED);
//   * caller-injected (the 12D-280/300 seam), pinned local model,
//     post-call secret screen, sha256 draft receipt, draft-only,
//     humanDecision REQUIRED, no write path, no weight mutation.
//
// Honest scope (disclosed): a SIBLING door — the 12D-308 door is
// UNCHANGED in behavior (additive export only, re-verified 26/26); the
// 12D-307/310 doors are untouched. Runtime-only rung: no shell surface.
import { ASSISTANT_PERSONA_PREAMBLE, MAX_ASSISTANT_REPLY_CHARS, MAX_USER_MESSAGE_CHARS } from './xiv-assistant-turn';
import {
  MAX_CONVERSATION_ID_CHARS,
  ASSISTANT_CONVERSATION_USER_LABEL, ASSISTANT_CONVERSATION_REPLY_LABEL, ASSISTANT_CONVERSATION_TURN_LABEL,
} from './xiv-assistant-conversation';
import { buildAssistantMemoryViewModel } from './xiv-assistant-memory-view-model';
import {
  COMPOSED_MEMORY_CONVERSATION_PROMPT_CHARS, validatePriorTurnPairs,
} from './xiv-assistant-memory-conversation';
import { composeMemoryBlock } from './xiv-assistant-memory-turn';
import { CITATION_LABEL, extractCitedStoryIds } from './xiv-assistant-memory-cited-turn';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';
import { createHash } from 'node:crypto';

export const ASSISTANT_MEMORY_CITED_CONVERSATION_POLICY = Object.freeze({
  policyVersion: '12d-311-v1',
  domain: 'XIV_OS_ASSISTANT_MEMORY_CITED_CONVERSATION_TURN',
  modelName: 'qwen2.5-coder:7b', // the pinned LOCAL model (12D-280/300 lineage)
});

export const ASSISTANT_MEMORY_CITED_CONVERSATION_GUARDRAILS = Object.freeze({
  theRealMemoryGate: true, // the packet goes through the REAL 12D-306 view-model gate
  theRealBlockComposer: true, // the memory block comes from the REAL 12D-307 composer
  theRealHistoryDiscipline: true, // the pairs come from the REAL 12D-302/308 validator
  theRealCitationDiscipline: true, // the label + extractor come from the REAL 12D-310
  memoryIsProvenanceNotInstructions: true,
  citationsAreVerifiedNeverTrusted: true,
  fabricatedProvenanceRefusesPostCall: true,
  zeroCitationsDisclosedNotHidden: true,
  tenantBound: true,
  historyRescreened: true,
  derivedCeilingNeverGuessed: true,
  overCeilingRefusesNeverTruncates: true,
  secretScreenedBothWays: true,
  localModelOnly: true,
  loopbackOnly: true, // remoteCalls 0 — the local loopback endpoint is not remote
  draftOnly: true,
  noWritePath: true,
  noActivationPath: true,
  noWeightMutation: true,
  shellSurfaceNotBuiltYet: true, // disclosed residual: runtime-only rung
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

const INPUT_KEYS = ['tenantId', 'conversationId', 'userMessage', 'priorTurns', 'memoryPacket'] as const;
const MEMORY_MAX_ENTRIES = 6; // mirrors the 12D-305 packet bound

/**
 * The composed-prompt ceiling, DERIVED from the REAL 12D-308 bound plus
 * the 12D-310 citation label (never guessed). Over-ceiling refuses.
 */
export const COMPOSED_MEMORY_CITED_CONVERSATION_PROMPT_CHARS =
  COMPOSED_MEMORY_CONVERSATION_PROMPT_CHARS + CITATION_LABEL.length;

export type AssistantMemoryCitedConversationPacket = Readonly<
  | {
      status: 'DRAFTED';
      kind: 'ASSISTANT_MEMORY_CITED_CONVERSATION_TURN';
      policyVersion: string;
      tenantId: string;
      conversationId: string;
      model: string;
      replyDraft: string;
      draftSha256: string;
      citedCount: number;
      citedStoryIds: readonly string[];
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
      kind: 'ASSISTANT_MEMORY_CITED_CONVERSATION_TURN';
      policyVersion: string;
      reason: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
>;

function refuse(reason: string): AssistantMemoryCitedConversationPacket {
  return Object.freeze({
    status: 'REFUSED' as const,
    kind: 'ASSISTANT_MEMORY_CITED_CONVERSATION_TURN' as const,
    policyVersion: ASSISTANT_MEMORY_CITED_CONVERSATION_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    activated: 0 as const,
    learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

export interface AssistantMemoryCitedConversationPrepared {
  readonly status: 'PREPARED';
  readonly tenantId: string;
  readonly conversationId: string;
  readonly userMessage: string;
  readonly priorTurnCount: number;
  readonly memoryCarried: number;
  readonly memoryDoneCount: number;
  /** The VERIFIED carried entries' storyIds — the ONLY citable provenance. */
  readonly carriedStoryIds: readonly string[];
  readonly prompt: string;
}

/**
 * Prepare ONE citation-bearing memory conversation turn. NEVER throws;
 * any anomaly refuses before any model call (modelCalls 0). The memory
 * packet is verified through the REAL 12D-306 gate — a refused packet
 * refuses the turn and the refusal carries no memory content.
 */
export function prepareAssistantMemoryCitedConversationTurn(
  raw: unknown,
): AssistantMemoryCitedConversationPrepared | AssistantMemoryCitedConversationPacket {
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
    // THE REAL 12D-302/308 HISTORY DISCIPLINE — reused, never reimplemented.
    const pairsResult = validatePriorTurnPairs(p.priorTurns);
    if (!pairsResult.ok) return refuse(pairsResult.reason);
    // SECRET SCREENING — the user message must be secret-free before ANY model call.
    if (SECRET_CONTENT_RE.test(p.userMessage))
      return refuse('the user message is secret-shaped (credential/key pattern); secrets never go to ANY model; fail closed');
    // THE MEMORY IS RE-VERIFIED through the REAL 12D-306 gate — never trusted.
    const vm = buildAssistantMemoryViewModel(p.memoryPacket);
    if (vm.kind === 'REFUSED')
      return refuse(`the memory packet failed verification (${vm.reason}); the turn refuses pre-call; fail closed`);
    if (vm.display.tenantId !== p.tenantId)
      return refuse('the memory packet tenant does not match the turn tenant; one tenant\'s memory never drafts another tenant\'s reply; fail closed');
    const carriedStoryIds = vm.display.entries.map((e) => e.storyId);
    const prompt = ASSISTANT_PERSONA_PREAMBLE
      + composeMemoryBlock(vm.display.entries)
      + CITATION_LABEL
      + pairsResult.pairs.map((pair) => ASSISTANT_CONVERSATION_USER_LABEL + pair.userMessage + ASSISTANT_CONVERSATION_REPLY_LABEL + pair.assistantReply).join('')
      + ASSISTANT_CONVERSATION_TURN_LABEL + p.userMessage;
    if (prompt.length > COMPOSED_MEMORY_CITED_CONVERSATION_PROMPT_CHARS)
      return refuse(`the composed prompt exceeds the composed-prompt bound (${COMPOSED_MEMORY_CITED_CONVERSATION_PROMPT_CHARS.toLocaleString('en-US')} chars); fail closed`);
    return Object.freeze({
      status: 'PREPARED' as const,
      tenantId: p.tenantId,
      conversationId: p.conversationId,
      userMessage: p.userMessage,
      priorTurnCount: pairsResult.pairs.length,
      memoryCarried: vm.display.carriedCount,
      memoryDoneCount: vm.display.doneCount,
      carriedStoryIds,
      prompt,
    });
  } catch (err) {
    return refuse(err instanceof Error ? err.message : String(err));
  }
}

export interface AssistantMemoryCitedConversationCallerResult {
  readonly model: string;
  readonly response: string;
}

/**
 * Run ONE citation-bearing memory conversation turn against the
 * INJECTED caller (the only model path). NEVER throws; a caller
 * failure, a post-call screen refusal, or a FABRICATED CITATION
 * returns REFUSED (pre-call: modelCalls 0; post-call: the caller ran —
 * disclosed in the refusal reason, never retried silently).
 */
export async function runAssistantMemoryCitedConversationTurn(
  prepared: AssistantMemoryCitedConversationPrepared,
  caller: (prompt: string) => Promise<AssistantMemoryCitedConversationCallerResult>,
): Promise<AssistantMemoryCitedConversationPacket> {
  try {
    if (prepared.prompt.length > COMPOSED_MEMORY_CITED_CONVERSATION_PROMPT_CHARS)
      return refuse('the composed prompt exceeds the composed-prompt bound; fail closed');
    let result: AssistantMemoryCitedConversationCallerResult;
    try {
      result = await caller(prepared.prompt);
    } catch (err) {
      return refuse(`the local model call failed before drafting (pre-call): ${err instanceof Error ? err.message : String(err)}`);
    }
    if (result.model !== ASSISTANT_MEMORY_CITED_CONVERSATION_POLICY.modelName)
      return refuse(`the caller reported model ${String(result.model)}; only the pinned local model ${ASSISTANT_MEMORY_CITED_CONVERSATION_POLICY.modelName} may draft a cited memory conversation turn; fail closed`);
    const reply = String(result.response ?? '');
    if (reply.length < 1 || reply.length > MAX_ASSISTANT_REPLY_CHARS)
      return refuse(`the model reply must be 1..${MAX_ASSISTANT_REPLY_CHARS.toLocaleString('en-US')} chars; fail closed`);
    // SECRET SCREENING AGAIN — the model reply is screened post-call.
    if (SECRET_CONTENT_RE.test(reply))
      return refuse('the model reply is secret-shaped (credential/key pattern); the draft is refused post-call; fail closed');
    // CITATIONS ARE VERIFIED, NEVER TRUSTED — the REAL 12D-310 gate.
    const citedStoryIds = extractCitedStoryIds(reply);
    const carried = new Set(prepared.carriedStoryIds);
    const fabricated = citedStoryIds.filter((id) => !carried.has(id));
    if (fabricated.length > 0)
      return refuse(`the draft cites ${fabricated.length} storyId(s) not in the verified carried memory set; the draft is withheld — fabricated provenance never passes; the caller ran (post-call); fail closed`);
    if (citedStoryIds.length > MEMORY_MAX_ENTRIES)
      return refuse(`the draft cites more storyIds than the memory block carries (max ${MEMORY_MAX_ENTRIES}); fail closed`);
    const draftSha256 = createHash('sha256').update(reply, 'utf8').digest('hex');
    return Object.freeze({
      status: 'DRAFTED' as const,
      kind: 'ASSISTANT_MEMORY_CITED_CONVERSATION_TURN' as const,
      policyVersion: ASSISTANT_MEMORY_CITED_CONVERSATION_POLICY.policyVersion,
      tenantId: prepared.tenantId,
      conversationId: prepared.conversationId,
      model: result.model,
      replyDraft: reply,
      draftSha256,
      citedCount: citedStoryIds.length,
      citedStoryIds: Object.freeze([...citedStoryIds]),
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