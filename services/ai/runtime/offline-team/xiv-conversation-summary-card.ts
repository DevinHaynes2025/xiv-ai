// 12D-320 — the tenant-bound conversation summary card: a MEASURED,
// model-free digest of a conversation's grounding state, built through
// ONLY real contracts. The 12D-302/308 history discipline validates the
// prior turns, the REAL 12D-306 gate re-verifies the memory packet, and
// the REAL 12D-310 extractor reads each reply's [mem:<storyId>]
// citations against the verified carried set — so the card's verdict
// (ALL_REPLIES_GROUNDED / PARTIALLY_GROUNDED / UNGROUNDED_NO_CITATIONS /
// FABRICATED_CITATIONS_PRESENT / NO_REPLIES_YET) is a MEASUREMENT, not
// an opinion: no model is called (modelCalls 0), no prose is generated,
// nothing is stored. Fabricated citations are disclosed BY ID; zero
// citations render honestly as UNGROUNDED. The summary digest binds the
// whole derivation tamper-evidently; the view model re-derives the
// ENTIRE card from the packet's own inputs before it renders anything.
import { createHash } from 'node:crypto';
import {
  validatePriorTurnPairs,
} from './xiv-assistant-memory-conversation';
import { buildAssistantMemoryViewModel } from './xiv-assistant-memory-view-model';
import { extractCitedStoryIds } from './xiv-assistant-memory-cited-turn';
import { MAX_USER_MESSAGE_CHARS } from './xiv-assistant-turn';
import { MAX_CONVERSATION_ID_CHARS } from './xiv-assistant-conversation';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const CONVERSATION_SUMMARY_CARD_POLICY = Object.freeze({
  policyVersion: '12d-320-v1',
  domain: 'XIV_OS_CONVERSATION_SUMMARY_CARD',
});

export const CONVERSATION_SUMMARY_CARD_GUARDRAILS = Object.freeze({
  measurementOnly: true, // a summary is MEASURED, never generated — no prose, no model
  theRealHistoryDiscipline: true, // the pairs come from the REAL 12D-302/308 validator
  theRealMemoryGate: true, // the packet goes through the REAL 12D-306 view-model gate
  theRealCitationExtractor: true, // citations read by the REAL 12D-310 extractor
  citationsAreVerifiedNeverTrusted: true,
  fabricatedDisclosedById: true, // the 12D-314 discipline, per conversation turn
  zeroCitationsDisclosedNotHidden: true,
  tenantBound: true,
  secretScreened: true,
  excerptBounded: true, // excerpts are bounded windows, never whole-turn dumps
  digestTamperEvident: true,
  nothingStored: true,
  noCaller: true,
  pureModule: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const INPUT_KEYS = ['tenantId', 'conversationId', 'userMessage', 'priorTurns', 'memoryPacket'] as const;
export const SUMMARY_EXCERPT_CHARS = 120;

export type ConversationSummaryCardRow = Readonly<{
  turnIndex: number;
  citedStoryIds: readonly string[];
  groundedStoryIds: readonly string[];
  fabricatedStoryIds: readonly string[];
}>;

export type ConversationSummaryVerdict =
  | 'ALL_REPLIES_GROUNDED'
  | 'PARTIALLY_GROUNDED'
  | 'UNGROUNDED_NO_CITATIONS'
  | 'FABRICATED_CITATIONS_PRESENT'
  | 'NO_REPLIES_YET';

export type ConversationSummaryCardPacket = Readonly<
  | {
      status: 'VERIFIED';
      kind: 'CONVERSATION_SUMMARY_CARD';
      policyVersion: string;
      tenantId: string;
      conversationId: string;
      /** The packet carries its OWN inputs so the view model can re-derive everything (the 12D-316 convention). */
      userMessage: string;
      priorTurns: readonly { userMessage: string; assistantReply: string }[];
      memoryPacket: unknown;
      priorTurnCount: number;
      userMessageChars: number;
      firstUserMessageExcerpt: string;
      lastReplyExcerpt: string; // '' when no replies — disclosed, never padded
      verdict: ConversationSummaryVerdict;
      rows: readonly ConversationSummaryCardRow[];
      totalCitedCount: number;
      totalGroundedCount: number;
      totalFabricatedCount: number;
      uncitedReplyCount: number;
      memoryCarried: number;
      memoryDoneCount: number;
      summaryDigestSha256: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      stoppedBefore: string;
      humanDecision: 'REQUIRED';
    }
  | {
      status: 'REFUSED';
      kind: 'CONVERSATION_SUMMARY_CARD';
      policyVersion: string;
      reason: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
>;

function refuse(reason: string): ConversationSummaryCardPacket {
  return Object.freeze({
    status: 'REFUSED' as const,
    kind: 'CONVERSATION_SUMMARY_CARD' as const,
    policyVersion: CONVERSATION_SUMMARY_CARD_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    activated: 0 as const,
    learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

const excerptOf = (s: string): string => (s.length <= SUMMARY_EXCERPT_CHARS ? s : s.slice(0, SUMMARY_EXCERPT_CHARS));

/**
 * Measure ONE conversation's grounding state. NEVER throws; any anomaly
 * refuses before anything else (modelCalls 0 — there is no model path
 * at all). The memory packet is verified through the REAL 12D-306 gate;
 * the prior turns pass the REAL 12D-302/308 discipline; every reply's
 * citations are read by the REAL 12D-310 extractor and checked against
 * the VERIFIED carried set — never trusted.
 */
export function prepareConversationSummaryCard(
  raw: unknown,
): ConversationSummaryCardPrepared | ConversationSummaryCardPacket {
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
    if (SECRET_CONTENT_RE.test(p.userMessage))
      return refuse('the user message is secret-shaped (credential/key pattern); secrets never enter any surface; fail closed');
    // THE REAL 12D-302/308 HISTORY DISCIPLINE — reused, never reimplemented.
    const pairsResult = validatePriorTurnPairs(p.priorTurns);
    if (!pairsResult.ok) return refuse(pairsResult.reason);
    // THE MEMORY IS RE-VERIFIED through the REAL 12D-306 gate — never trusted.
    const vm = buildAssistantMemoryViewModel(p.memoryPacket);
    if (vm.kind === 'REFUSED')
      return refuse(`the memory packet failed verification (${vm.reason}); the summary refuses; fail closed`);
    if (vm.display.tenantId !== p.tenantId)
      return refuse('the memory packet tenant does not match the summary tenant; one tenant\'s memory never measures another tenant\'s conversation; fail closed');
    const carriedStoryIds = vm.display.entries.map((e) => e.storyId);

    return Object.freeze({
      status: 'PREPARED' as const,
      tenantId: p.tenantId,
      conversationId: p.conversationId,
      priorTurnCount: pairsResult.pairs.length,
      userMessage: p.userMessage,
      priorTurns: pairsResult.pairs,
      memoryPacket: p.memoryPacket,
      carriedStoryIds: Object.freeze(carriedStoryIds),
      memoryCarried: vm.display.carriedCount,
      memoryDoneCount: vm.display.doneCount,
    });
  } catch (err) {
    return refuse(err instanceof Error ? err.message : String(err));
  }
}

export interface ConversationSummaryCardPrepared {
  readonly status: 'PREPARED';
  readonly tenantId: string;
  readonly conversationId: string;
  readonly priorTurnCount: number;
  readonly userMessage: string;
  readonly priorTurns: readonly { userMessage: string; assistantReply: string }[];
  readonly memoryPacket: unknown;
  readonly carriedStoryIds: readonly string[];
  readonly memoryCarried: number;
  readonly memoryDoneCount: number;
}

/**
 * Freeze the measured card. The digest is RE-DERIVED here from the
 * prepared fields (not trusted from the caller); the frozen packet is
 * the only thing a surface may render.
 */
export function buildConversationSummaryCardPacket(
  prepared: ConversationSummaryCardPrepared,
): ConversationSummaryCardPacket {
  if (prepared === null || typeof prepared !== 'object' || Array.isArray(prepared))
    return refuse('a prepared conversation summary is required; fail closed');
  const rows: ConversationSummaryCardRow[] = prepared.priorTurns.map((pair, i) => {
    const cited = extractCitedStoryIds(pair.assistantReply);
    return Object.freeze({
      turnIndex: i + 1,
      citedStoryIds: Object.freeze(cited),
      groundedStoryIds: Object.freeze(cited.filter((id) => prepared.carriedStoryIds.includes(id))),
      fabricatedStoryIds: Object.freeze(cited.filter((id) => !prepared.carriedStoryIds.includes(id))),
    });
  });
  const totalCited = rows.reduce((acc, r) => acc + r.citedStoryIds.length, 0);
  const totalGrounded = rows.reduce((acc, r) => acc + r.groundedStoryIds.length, 0);
  const totalFabricated = rows.reduce((acc, r) => acc + r.fabricatedStoryIds.length, 0);
  const uncitedReplyCount = rows.filter((r) => r.citedStoryIds.length === 0).length;
  const verdict: ConversationSummaryVerdict =
    rows.length === 0 ? 'NO_REPLIES_YET'
    : totalFabricated > 0 ? 'FABRICATED_CITATIONS_PRESENT'
    : totalGrounded === rows.length && totalGrounded > 0 ? 'ALL_REPLIES_GROUNDED'
    : totalGrounded > 0 ? 'PARTIALLY_GROUNDED'
    : 'UNGROUNDED_NO_CITATIONS';
  const firstUserMessageExcerpt = excerptOf(prepared.priorTurns[0]?.userMessage ?? prepared.userMessage);
  const lastReplyExcerpt = prepared.priorTurns.length > 0
    ? excerptOf(prepared.priorTurns[prepared.priorTurns.length - 1]!.assistantReply)
    : '';
  const summaryDigestSha256 = createHash('sha256').update(JSON.stringify({
    policyVersion: CONVERSATION_SUMMARY_CARD_POLICY.policyVersion,
    tenantId: prepared.tenantId, conversationId: prepared.conversationId,
    priorTurnCount: prepared.priorTurns.length, userMessageChars: prepared.userMessage.length,
    firstUserMessageExcerpt, lastReplyExcerpt, verdict, rows,
    totalCitedCount: totalCited, totalGroundedCount: totalGrounded, totalFabricatedCount: totalFabricated,
    uncitedReplyCount, memoryCarried: prepared.memoryCarried, memoryDoneCount: prepared.memoryDoneCount,
  }), 'utf8').digest('hex');
  return Object.freeze({
    status: 'VERIFIED' as const,
    kind: 'CONVERSATION_SUMMARY_CARD' as const,
    policyVersion: CONVERSATION_SUMMARY_CARD_POLICY.policyVersion,
    tenantId: prepared.tenantId,
    conversationId: prepared.conversationId,
    userMessage: prepared.userMessage,
    priorTurns: prepared.priorTurns,
    memoryPacket: prepared.memoryPacket,
    priorTurnCount: prepared.priorTurns.length,
    userMessageChars: prepared.userMessage.length,
    firstUserMessageExcerpt,
    lastReplyExcerpt,
    verdict,
    rows,
    totalCitedCount: totalCited,
    totalGroundedCount: totalGrounded,
    totalFabricatedCount: totalFabricated,
    uncitedReplyCount,
    memoryCarried: prepared.memoryCarried,
    memoryDoneCount: prepared.memoryDoneCount,
    summaryDigestSha256,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    activated: 0 as const,
    learningPromoted: false as const,
    stoppedBefore: 'measurement only — no model called, nothing stored, the operator decides' as const,
    humanDecision: 'REQUIRED' as const,
  });
}