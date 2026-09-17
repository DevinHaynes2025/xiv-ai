// 12D-320 — Conversation Summary Card VIEW MODEL: the frozen render of
// the measured summary. Fail closed like its siblings: exact keys in
// order for each status, and the ENTIRE card re-derived from the
// packet's OWN inputs through ONLY real contracts — the REAL 12D-306
// memory gate re-runs, the REAL 12D-302/308 history discipline
// re-validates the pairs, the REAL 12D-310 extractor re-reads every
// reply's citations against the re-derived carried set, and the digest
// is recomputed — a packet whose rows, verdict, excerpts or digest do
// not match that re-derivation renders NOTHING.
import {
  CONVERSATION_SUMMARY_CARD_POLICY, SUMMARY_EXCERPT_CHARS,
  type ConversationSummaryVerdict,
} from './xiv-conversation-summary-card';
import { validatePriorTurnPairs } from './xiv-assistant-memory-conversation';
import { buildAssistantMemoryViewModel } from './xiv-assistant-memory-view-model';
import { extractCitedStoryIds } from './xiv-assistant-memory-cited-turn';
import { createHash } from 'node:crypto';

export const CONVERSATION_SUMMARY_CARD_VIEW_MODEL_POLICY = Object.freeze({
  policyVersion: '12d-320-v1',
  domain: 'XIV_OS_CONVERSATION_SUMMARY_CARD_VIEW_MODEL',
});

export const CONVERSATION_SUMMARY_CARD_VIEW_MODEL_GUARDRAILS = Object.freeze({
  cardReDerivedFromTheInputs: true,
  onlyRealContractsReRun: true,
  verdictIsMeasurementNotOpinion: true,
  fabricatedDisclosedById: true,
  zeroCitationsDisclosedNotHidden: true,
  exactKeysInOrder: true,
  honestFlagsEnforced: true,
  modelCalls: 0,
  remoteCalls: 0,
  activated: 0,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const VERIFIED_KEYS = [
  'status', 'kind', 'policyVersion', 'tenantId', 'conversationId',
  'userMessage', 'priorTurns', 'memoryPacket', 'priorTurnCount', 'userMessageChars',
  'firstUserMessageExcerpt', 'lastReplyExcerpt', 'verdict', 'rows',
  'totalCitedCount', 'totalGroundedCount', 'totalFabricatedCount', 'uncitedReplyCount',
  'memoryCarried', 'memoryDoneCount', 'summaryDigestSha256',
  'modelCalls', 'remoteCalls', 'activated', 'learningPromoted', 'stoppedBefore', 'humanDecision',
] as const;

const REFUSED_KEYS = [
  'status', 'kind', 'policyVersion', 'reason', 'modelCalls', 'remoteCalls',
  'activated', 'learningPromoted', 'humanDecision',
] as const;

const ROW_KEYS = ['turnIndex', 'citedStoryIds', 'groundedStoryIds', 'fabricatedStoryIds'] as const;
const VERDICTS = ['ALL_REPLIES_GROUNDED', 'PARTIALLY_GROUNDED', 'UNGROUNDED_NO_CITATIONS', 'FABRICATED_CITATIONS_PRESENT', 'NO_REPLIES_YET'] as const;

export type ConversationSummaryCardViewModel =
  | Readonly<{
      kind: 'VERIFIED_CONVERSATION_SUMMARY';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        tenantId: string;
        conversationId: string;
        priorTurnCount: number;
        verdict: string;
        verdictNote: string;
        rows: readonly Readonly<{
          turnIndex: number;
          citedStoryIds: readonly string[];
          groundedStoryIds: readonly string[];
          fabricatedStoryIds: readonly string[];
        }>[];
        totalCitedCount: number;
        totalGroundedCount: number;
        totalFabricatedCount: number;
        uncitedReplyCount: number;
        memoryCarried: number;
        memoryDoneCount: number;
        firstUserMessageExcerpt: string;
        lastReplyExcerpt: string;
        summaryDigestSha256: string;
        operatorNote: string;
      }>;
    }>
  | Readonly<{
      kind: 'REFUSED';
      policyVersion: string;
      reason: string;
      display: Readonly<{
        headline: string;
        bodyText: string;
        operatorNote: string;
      }>;
    }>;

const REFUSAL_HEADLINE = 'Conversation summary refused — HUMAN DECISION REQUIRED';

function requireExactKeys(raw: Record<string, unknown>, keys: readonly string[], what: string): void {
  const ks = Object.keys(raw);
  if (ks.length !== keys.length || !keys.every((k, i) => ks[i] === k))
    throw new Error(`${what} must have exactly the keys [${keys.join(', ')}] in order; fail closed`);
}

const excerptOf = (s: string): string => (s.length <= SUMMARY_EXCERPT_CHARS ? s : s.slice(0, SUMMARY_EXCERPT_CHARS));

/**
 * The only door from a raw summary packet to the UI. Accepts ANY
 * unknown value; returns a frozen view model that is either a fully
 * re-verified view or an honest refusal. Never throws.
 */
export function buildConversationSummaryCardViewModel(raw: unknown): ConversationSummaryCardViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return Object.freeze({
        kind: 'REFUSED' as const,
        policyVersion: CONVERSATION_SUMMARY_CARD_VIEW_MODEL_POLICY.policyVersion,
        reason: 'the summary input is not an object; fail closed',
        display: Object.freeze({
          headline: REFUSAL_HEADLINE,
          bodyText: 'NO summary was rendered: the packet could not be verified.',
          operatorNote: 'Paste the conversation turns and the REAL 12D-305 memory packet.',
        }),
      });
    }
    const p = raw as Readonly<Record<string, unknown>>;
    if (p.status === 'VERIFIED') {
      requireExactKeys(p as Record<string, unknown>, VERIFIED_KEYS, 'a VERIFIED summary');
      if (p.kind !== 'CONVERSATION_SUMMARY_CARD')
        throw new Error('a VERIFIED summary must carry kind CONVERSATION_SUMMARY_CARD; fail closed');
      if (p.policyVersion !== CONVERSATION_SUMMARY_CARD_POLICY.policyVersion)
        throw new Error(`a VERIFIED summary must carry policyVersion ${CONVERSATION_SUMMARY_CARD_POLICY.policyVersion}; fail closed`);

      // THE ENTIRE CARD IS RE-DERIVED from the packet's own inputs —
      // through ONLY real contracts.
      const memoryVm = buildAssistantMemoryViewModel(p.memoryPacket);
      if (memoryVm.kind === 'REFUSED')
        throw new Error(`the carried memory packet failed re-verification (${memoryVm.reason}); the summary is refused`);
      if (memoryVm.display.tenantId !== p.tenantId)
        throw new Error('the summary tenantId must match the memory packet tenant; one tenant never measures another tenant; fail closed');
      if (p.memoryCarried !== memoryVm.display.carriedCount || p.memoryDoneCount !== memoryVm.display.doneCount)
        throw new Error('the memory counts do not match the re-verified packet; fail closed');
      const carriedStoryIds = memoryVm.display.entries.map((e) => e.storyId);
      const pairsResult = validatePriorTurnPairs(p.priorTurns);
      if (!pairsResult.ok)
        throw new Error(`the carried prior turns failed the REAL history discipline (${pairsResult.reason}); fail closed`);
      if (pairsResult.pairs.length !== p.priorTurnCount)
        throw new Error('the prior-turn count does not match the re-derived one; fail closed');
      if (typeof p.userMessage !== 'string' || p.userMessage.length < 1 || p.userMessageChars !== p.userMessage.length)
        throw new Error('the userMessage does not match the disclosed length; fail closed');

      const reRows = pairsResult.pairs.map((pair, i) => {
        const cited = extractCitedStoryIds(pair.assistantReply);
        return {
          turnIndex: i + 1,
          citedStoryIds: cited,
          groundedStoryIds: cited.filter((id) => carriedStoryIds.includes(id)),
          fabricatedStoryIds: cited.filter((id) => !carriedStoryIds.includes(id)),
        };
      });
      const rows = p.rows;
      if (!Array.isArray(rows) || rows.length !== reRows.length)
        throw new Error('the disclosed rows do not match the re-derived row count; fail closed');
      rows.forEach((r, i) => {
        if (r === null || typeof r !== 'object' || Array.isArray(r))
          throw new Error('every row must be an object; fail closed');
        const rk = Object.keys(r as Record<string, unknown>);
        if (rk.length !== ROW_KEYS.length || !ROW_KEYS.every((k, j) => rk[j] === k))
          throw new Error('every row must have exactly the keys [turnIndex, citedStoryIds, groundedStoryIds, fabricatedStoryIds] in order; fail closed');
        const rr = r as Readonly<Record<string, unknown>>;
        if (rr.turnIndex !== reRows[i]!.turnIndex
          || JSON.stringify(rr.citedStoryIds) !== JSON.stringify(reRows[i]!.citedStoryIds)
          || JSON.stringify(rr.groundedStoryIds) !== JSON.stringify(reRows[i]!.groundedStoryIds)
          || JSON.stringify(rr.fabricatedStoryIds) !== JSON.stringify(reRows[i]!.fabricatedStoryIds))
          throw new Error(`the disclosed row ${i + 1} does not match the re-derived citations; fail closed`);
      });
      const reTotalCited = reRows.reduce((acc, r) => acc + r.citedStoryIds.length, 0);
      const reTotalGrounded = reRows.reduce((acc, r) => acc + r.groundedStoryIds.length, 0);
      const reTotalFabricated = reRows.reduce((acc, r) => acc + r.fabricatedStoryIds.length, 0);
      const reUncited = reRows.filter((r) => r.citedStoryIds.length === 0).length;
      if (p.totalCitedCount !== reTotalCited || p.totalGroundedCount !== reTotalGrounded
        || p.totalFabricatedCount !== reTotalFabricated || p.uncitedReplyCount !== reUncited)
        throw new Error('the disclosed totals do not match the re-derived ones; fail closed');

      const reVerdict: ConversationSummaryVerdict =
        reRows.length === 0 ? 'NO_REPLIES_YET'
        : reTotalFabricated > 0 ? 'FABRICATED_CITATIONS_PRESENT'
        : reTotalGrounded === reRows.length && reTotalGrounded > 0 ? 'ALL_REPLIES_GROUNDED'
        : reTotalGrounded > 0 ? 'PARTIALLY_GROUNDED'
        : 'UNGROUNDED_NO_CITATIONS';
      if (p.verdict !== reVerdict)
        throw new Error(`the disclosed verdict (${String(p.verdict)}) does not match the re-derived one (${reVerdict}); fail closed`);
      if (typeof p.verdict === 'string' && !(VERDICTS as readonly string[]).includes(p.verdict))
        throw new Error('the verdict is not one of the measured verdicts; fail closed');

      const reFirstExcerpt = excerptOf(pairsResult.pairs[0]?.userMessage ?? p.userMessage);
      const reLastExcerpt = pairsResult.pairs.length > 0
        ? excerptOf(pairsResult.pairs[pairsResult.pairs.length - 1]!.assistantReply)
        : '';
      if (p.firstUserMessageExcerpt !== reFirstExcerpt || p.lastReplyExcerpt !== reLastExcerpt)
        throw new Error('the disclosed excerpts do not match the re-derived bounded windows; fail closed');
      if (p.firstUserMessageExcerpt.length > SUMMARY_EXCERPT_CHARS
        || p.lastReplyExcerpt.length > SUMMARY_EXCERPT_CHARS)
        throw new Error('excerpts exceed the bounded window; fail closed');

      const reDigest = createHash('sha256').update(JSON.stringify({
        policyVersion: CONVERSATION_SUMMARY_CARD_POLICY.policyVersion,
        tenantId: p.tenantId, conversationId: p.conversationId,
        priorTurnCount: pairsResult.pairs.length, userMessageChars: p.userMessage.length,
        firstUserMessageExcerpt: reFirstExcerpt, lastReplyExcerpt: reLastExcerpt, verdict: reVerdict,
        rows: reRows,
        totalCitedCount: reTotalCited, totalGroundedCount: reTotalGrounded,
        totalFabricatedCount: reTotalFabricated, uncitedReplyCount: reUncited,
        memoryCarried: p.memoryCarried, memoryDoneCount: p.memoryDoneCount,
      }), 'utf8').digest('hex');
      if (p.summaryDigestSha256 !== reDigest)
        throw new Error('the summary digest does not match the re-derived derivation; fail closed');

      if (p.modelCalls !== 0 || p.remoteCalls !== 0 || p.activated !== 0 || p.learningPromoted !== false)
        throw new Error('the honest flags are pinned (modelCalls 0, remoteCalls 0, activated 0, learningPromoted false); fail closed');
      if (typeof p.stoppedBefore !== 'string' || !p.stoppedBefore.includes('measurement only'))
        throw new Error('stoppedBefore must disclose that this is measurement only; fail closed');
      if (p.humanDecision !== 'REQUIRED')
        throw new Error('humanDecision must be REQUIRED; fail closed');

      // The digest re-derivation above already binds the tenant, the
      // memory counts and every measured value — checked before render.
      const verdictNote =
        reVerdict === 'ALL_REPLIES_GROUNDED' ? 'every reply cites carried, reviewed memory'
        : reVerdict === 'PARTIALLY_GROUNDED' ? 'some replies cite carried memory; others do not — disclosed'
        : reVerdict === 'UNGROUNDED_NO_CITATIONS' ? 'no reply cites any memory fact — UNGROUNDED, disclosed not hidden'
        : reVerdict === 'FABRICATED_CITATIONS_PRESENT' ? 'at least one reply cites a storyId the memory does NOT carry — disclosed BY ID'
        : 'no replies yet — the conversation has one pending user message';
      return Object.freeze({
        kind: 'VERIFIED_CONVERSATION_SUMMARY' as const,
        policyVersion: CONVERSATION_SUMMARY_CARD_VIEW_MODEL_POLICY.policyVersion,
        display: Object.freeze({
          headline: `Conversation summary — ${String(p.priorTurnCount)} prior turn(s), ${reVerdict.replace(/_/g, ' ').toLowerCase()} (measurement only, no model called)`,
          tenantId: String(p.tenantId),
          conversationId: String(p.conversationId),
          priorTurnCount: pairsResult.pairs.length,
          verdict: reVerdict,
          verdictNote,
          rows: Object.freeze(reRows.map((r) => Object.freeze({
            turnIndex: r.turnIndex,
            citedStoryIds: Object.freeze(r.citedStoryIds),
            groundedStoryIds: Object.freeze(r.groundedStoryIds),
            fabricatedStoryIds: Object.freeze(r.fabricatedStoryIds),
          }))),
          totalCitedCount: reTotalCited,
          totalGroundedCount: reTotalGrounded,
          totalFabricatedCount: reTotalFabricated,
          uncitedReplyCount: reUncited,
          memoryCarried: memoryVm.display.carriedCount,
          memoryDoneCount: memoryVm.display.doneCount,
          firstUserMessageExcerpt: reFirstExcerpt,
          lastReplyExcerpt: reLastExcerpt,
          summaryDigestSha256: reDigest,
          operatorNote: 'A summary is a MEASUREMENT of citation grounding — not an opinion, not a generated text. Fabricated citations are disclosed by id; zero citations render as UNGROUNDED.',
        }),
      });
    }
    if (p.status === 'REFUSED') {
      requireExactKeys(p as Record<string, unknown>, REFUSED_KEYS, 'a REFUSED summary');
      if (p.kind !== 'CONVERSATION_SUMMARY_CARD')
        throw new Error('a REFUSED summary must carry kind CONVERSATION_SUMMARY_CARD; fail closed');
      if (typeof p.reason !== 'string' || p.reason.length < 1)
        throw new Error('a REFUSED summary must carry a reason; fail closed');
      if (p.modelCalls !== 0 || p.remoteCalls !== 0 || p.activated !== 0 || p.learningPromoted !== false)
        throw new Error('the honest flags are pinned on a refusal too; fail closed');
      if (p.humanDecision !== 'REQUIRED')
        throw new Error('humanDecision must be REQUIRED; fail closed');
      return Object.freeze({
        kind: 'REFUSED' as const,
        policyVersion: CONVERSATION_SUMMARY_CARD_VIEW_MODEL_POLICY.policyVersion,
        reason: p.reason,
        display: Object.freeze({
          headline: REFUSAL_HEADLINE,
          bodyText: `NO summary was rendered: ${p.reason}`,
          operatorNote: 'The input refused before anything was measured. Fix the input and re-run — nothing was stored.',
        }),
      });
    }
    throw new Error('the summary status must be VERIFIED or REFUSED; fail closed');
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: CONVERSATION_SUMMARY_CARD_VIEW_MODEL_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: `NO summary was rendered: ${err instanceof Error ? err.message : String(err)}`,
        operatorNote: 'The packet did not survive re-derivation. Nothing was rendered from it.',
      }),
    });
  }
}