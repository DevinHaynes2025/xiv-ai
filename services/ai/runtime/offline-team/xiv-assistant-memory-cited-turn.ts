// 12D-310 — Assistant Memory CITED Turn: the memory block is now
// CITABLE provenance. The 12D-309 handoff's design rung: the assistant
// turn not only SEES the reviewed memory (12D-307) — the draft cites
// the exact reviewed storyIds it relied on, and the door FAILS CLOSED
// against fabricated provenance.
//
// The contract, fail closed end to end (the 12D-307 shape, plus):
//   * THE PROMPT INSTRUCTS CITATION, BOUNDED: the composed prompt
//     carries the REAL 12D-307 memory block (the same composer — one
//     real composer, never a reimplementation) plus a citation label
//     telling the model to cite as [mem:<storyId>] using ONLY the
//     storyIds listed in the block — never to invent or modify an id.
//   * THE CEILING IS DERIVED: the 12D-307 composed-prompt bound PLUS
//     the citation label, derived from the REAL exported constants —
//     never guessed. Over-ceiling refuses, never truncates.
//   * CITATIONS ARE VERIFIED, NEVER TRUSTED: after the call, every
//     [mem:<storyId>] in the reply is extracted with a strict pattern
//     and checked against the VERIFIED carried entries' storyIds. A
//     cited id that is not in the carried set refuses the draft
//     POST-CALL (the caller ran — disclosed in the reason, never
//     retried): a draft with fabricated provenance never passes.
//   * ZERO CITATIONS IS HONEST, DISCLOSED: a draft citing nothing is
//     drafted with citedCount 0 — the render discloses it as an
//     ungrounded draft rather than pretending memory was used.
//   * THE MEMORY IS RE-VERIFIED, NEVER TRUSTED (the REAL 12D-306 gate);
//     tenant bound; secret-screened both ways; caller-injected (the
//     12D-280/300 seam); pinned local model; draft-only, humanDecision
//     REQUIRED; no write path, no activation, no weight mutation.
//
// Honest scope (disclosed): this is a SIBLING door in the 12D-300
// lineage — the 12D-307 and 12D-308 doors are UNCHANGED (additive-only
// discipline; no committed module is edited). Prior-turn conversation
// composition is 12D-308's; a cited CONVERSATION door is a later rung.
// Runtime-only rung: no shell surface yet (the 12D-307 precedent).
import {
  ASSISTANT_PERSONA_PREAMBLE,
  MAX_ASSISTANT_REPLY_CHARS,
  MAX_USER_MESSAGE_CHARS,
} from './xiv-assistant-turn';
import {
  buildAssistantMemoryViewModel,
} from './xiv-assistant-memory-view-model';
import {
  COMPOSED_MEMORY_TURN_PROMPT_CHARS,
  composeMemoryBlock,
} from './xiv-assistant-memory-turn';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';
import { createHash } from 'node:crypto';

export const ASSISTANT_MEMORY_CITED_TURN_POLICY = Object.freeze({
  policyVersion: '12d-310-v1',
  domain: 'XIV_OS_ASSISTANT_MEMORY_CITED_TURN',
  modelName: 'qwen2.5-coder:7b', // the pinned LOCAL model (12D-280/300 lineage)
});

export const ASSISTANT_MEMORY_CITED_TURN_GUARDRAILS = Object.freeze({
  theRealMemoryGate: true, // the packet goes through the REAL 12D-306 view-model gate
  memoryIsProvenanceNotInstructions: true,
  citationsAreVerifiedNeverTrusted: true, // every [mem:<id>] checked against the carried set
  fabricatedProvenanceRefusesPostCall: true,
  zeroCitationsDisclosedNotHidden: true,
  tenantBound: true, // the turn tenant must equal the memory tenant
  derivedCeilingNeverGuessed: true, // the composed-prompt bound is derived from the bounds
  overCeilingRefusesNeverTruncates: true,
  secretScreenedBothWays: true, // memory block AND model reply re-screened
  localModelOnly: true, // the pinned local model; caller-injected, never a fetch
  loopbackOnly: true, // remoteCalls 0 — the local loopback endpoint is not remote
  draftOnly: true, // the assistant drafts; the human decides
  noWritePath: true,
  noActivationPath: true,
  noWeightMutation: true, // learningPromoted false; learning promotion stays CEO-gated
  conversationNotComposedHere: true, // disclosed residual: cited conversation = later rung
  shellSurfaceNotBuiltYet: true, // disclosed residual: runtime-only rung
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

const INPUT_KEYS = ['tenantId', 'turnId', 'userMessage', 'memoryPacket'] as const;

const OPERATOR_LABEL = '\nOperator message:\n';
const MEMORY_MAX_ENTRIES = 6; // mirrors the 12D-305 packet bound
const MAX_STORY_ID_CHARS = 128; // mirrors the queue's story-id bound

/**
 * The citation instruction — OUR OWN label (never untrusted content):
 * the model may cite ONLY the storyIds listed in the memory block, in
 * the exact [mem:<storyId>] form, and must never invent or modify an
 * id; an uncited fact is disclosed as unverified reasoning.
 */
export const CITATION_LABEL =
  '\nCitation discipline: when your reply relies on a reviewed memory fact above, cite it inline as [mem:<storyId>] using ONLY the storyIds listed in the memory block — never invent or modify a storyId; a fact you do not cite is your own unverified reasoning, not reviewed memory.\n';

/**
 * The composed-prompt ceiling, DERIVED from the REAL 12D-307 bound plus
 * the citation label (never guessed). Over-ceiling refuses.
 */
export const COMPOSED_MEMORY_CITED_TURN_PROMPT_CHARS =
  COMPOSED_MEMORY_TURN_PROMPT_CHARS + CITATION_LABEL.length;

/** The strict citation pattern: [mem:<storyId>] with a bounded id. */
const CITATION_RE = /\[mem:([A-Za-z0-9._:-]{1,128})\]/g;

export type AssistantMemoryCitedTurnPacket = Readonly<
  | {
      status: 'DRAFTED';
      kind: 'ASSISTANT_MEMORY_CITED_TURN_DRAFT';
      policyVersion: string;
      tenantId: string;
      turnId: string;
      model: string;
      replyDraft: string;
      draftSha256: string;
      citedCount: number;
      citedStoryIds: readonly string[];
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
      kind: 'ASSISTANT_MEMORY_CITED_TURN_DRAFT';
      policyVersion: string;
      reason: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
>;

function refuse(reason: string): AssistantMemoryCitedTurnPacket {
  return Object.freeze({
    status: 'REFUSED' as const,
    kind: 'ASSISTANT_MEMORY_CITED_TURN_DRAFT' as const,
    policyVersion: ASSISTANT_MEMORY_CITED_TURN_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    activated: 0 as const,
    learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

export interface AssistantMemoryCitedTurnPrepared {
  readonly status: 'PREPARED';
  readonly tenantId: string;
  readonly turnId: string;
  readonly userMessage: string;
  readonly memoryCarried: number;
  readonly memoryDoneCount: number;
  /** The VERIFIED carried entries' storyIds — the ONLY citable provenance. */
  readonly carriedStoryIds: readonly string[];
  readonly prompt: string;
}

/**
 * Prepare ONE citation-bearing memory turn. NEVER throws; any anomaly
 * refuses before any model call (modelCalls 0). The memory packet is
 * verified through the REAL 12D-306 gate — a refused packet refuses the
 * turn and the refusal carries no memory content.
 */
export function prepareAssistantMemoryCitedTurn(raw: unknown): AssistantMemoryCitedTurnPrepared | AssistantMemoryCitedTurnPacket {
  try {
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
      + OPERATOR_LABEL + p.userMessage;
    if (prompt.length > COMPOSED_MEMORY_CITED_TURN_PROMPT_CHARS)
      return refuse(`the composed prompt exceeds the composed-prompt bound (${COMPOSED_MEMORY_CITED_TURN_PROMPT_CHARS.toLocaleString('en-US')} chars); fail closed`);
    return Object.freeze({
      status: 'PREPARED' as const,
      tenantId: p.tenantId,
      turnId: p.turnId,
      userMessage: p.userMessage,
      memoryCarried: vm.display.carriedCount,
      memoryDoneCount: vm.display.doneCount,
      carriedStoryIds,
      prompt,
    });
  } catch (err) {
    return refuse(err instanceof Error ? err.message : String(err));
  }
}

export interface AssistantMemoryCitedTurnCallerResult {
  readonly model: string;
  readonly response: string;
}

/**
 * Extract the citations from a reply: distinct storyIds, in order of
 * first appearance, each bounded to the story-id shape. Unbounded or
 * malformed bracket text is not a citation — the strict pattern only.
 */
export function extractCitedStoryIds(reply: string): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const match of reply.matchAll(CITATION_RE)) {
    const id = match[1]!;
    if (id.length > MAX_STORY_ID_CHARS) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * Run ONE citation-bearing memory turn against the INJECTED caller (the
 * only model path). NEVER throws; a caller failure, a post-call screen
 * refusal, or a FABRICATED CITATION returns REFUSED (pre-call:
 * modelCalls 0; post-call: the caller ran — disclosed in the refusal
 * reason, never retried silently).
 */
export async function runAssistantMemoryCitedTurn(
  prepared: AssistantMemoryCitedTurnPrepared,
  caller: (prompt: string) => Promise<AssistantMemoryCitedTurnCallerResult>,
): Promise<AssistantMemoryCitedTurnPacket> {
  try {
    if (prepared.prompt.length > COMPOSED_MEMORY_CITED_TURN_PROMPT_CHARS)
      return refuse('the composed prompt exceeds the composed-prompt bound; fail closed');
    let result: AssistantMemoryCitedTurnCallerResult;
    try {
      result = await caller(prepared.prompt);
    } catch (err) {
      return refuse(`the local model call failed before drafting (pre-call): ${err instanceof Error ? err.message : String(err)}`);
    }
    if (result.model !== ASSISTANT_MEMORY_CITED_TURN_POLICY.modelName)
      return refuse(`the caller reported model ${String(result.model)}; only the pinned local model ${ASSISTANT_MEMORY_CITED_TURN_POLICY.modelName} may draft a cited memory turn; fail closed`);
    const reply = String(result.response ?? '');
    if (reply.length < 1 || reply.length > MAX_ASSISTANT_REPLY_CHARS)
      return refuse(`the model reply must be 1..${MAX_ASSISTANT_REPLY_CHARS.toLocaleString('en-US')} chars; fail closed`);
    // SECRET SCREENING AGAIN — the model reply is screened post-call.
    if (SECRET_CONTENT_RE.test(reply))
      return refuse('the model reply is secret-shaped (credential/key pattern); the draft is refused post-call; fail closed');
    // CITATIONS ARE VERIFIED, NEVER TRUSTED: every cited storyId must be
    // in the VERIFIED carried set — a citation to anything else is
    // fabricated provenance and the draft is withheld post-call.
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
      kind: 'ASSISTANT_MEMORY_CITED_TURN_DRAFT' as const,
      policyVersion: ASSISTANT_MEMORY_CITED_TURN_POLICY.policyVersion,
      tenantId: prepared.tenantId,
      turnId: prepared.turnId,
      model: result.model,
      replyDraft: reply,
      draftSha256,
      citedCount: citedStoryIds.length,
      citedStoryIds: Object.freeze([...citedStoryIds]),
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