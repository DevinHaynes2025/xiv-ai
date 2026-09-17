// 12D-311 — Assistant Memory Cited Conversation View Model: the
// fail-closed rendering contract that turns a 12D-311 packet (memory +
// conversation + citation gate) into the window onto a citation-
// verified multi-turn draft.
//
// The deliberate design (disclosed, the 12D-308 + 12D-310 shapes
// combined): every field is re-verified before render —
//   * packet shape gated exact per status (DRAFTED / REFUSED)
//   * draftSha256 RE-DERIVED from replyDraft (never trusted)
//   * SECRET_CONTENT_RE re-applied to the reply
//   * the citation structure re-gated: count === array length, every
//     id bounded and id-shaped, all distinct, count ≤ carried
//   * citedCount 0 rendered honestly as an UNGROUNDED draft
//   * priorTurnCount and the memory bounds re-checked
// Refusals render honestly with their reason; never an empty success.
// PURE: no fs, no network, no clock, no randomness. modelCalls 0 here.
import { createHash } from 'node:crypto';
import {
  ASSISTANT_MEMORY_CITED_CONVERSATION_POLICY,
} from './xiv-assistant-memory-cited-conversation';
import { MAX_PRIOR_TURNS } from './xiv-assistant-conversation';
import { MAX_ASSISTANT_REPLY_CHARS } from './xiv-assistant-turn';
import { ASSISTANT_MEMORY_MAX_ENTRIES } from './xiv-assistant-memory-turn';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_POLICY = Object.freeze({
  policyVersion: '12d-311-v1',
  domain: 'XIV_OS_ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL',
});

export const ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_GUARDRAILS = Object.freeze({
  theRealContractNotAReimplementation: true, // 12D-311 packet keys gated exactly
  digestReDerivedNeverTrusted: true,
  secretReScreenedBeforeRender: true,
  citationsGatedBeforeRender: true,
  zeroCitationsRenderedAsUngrounded: true,
  disclosedStateRendered: true,
  reviewedFactsOnly: true,
  pinnedModelOnly: true,
  draftNeverAction: true,
  refusedRendersAsRefused: true,
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

const DRAFTED_KEYS = [
  'status', 'kind', 'policyVersion', 'tenantId', 'conversationId', 'model',
  'replyDraft', 'draftSha256', 'citedCount', 'citedStoryIds',
  'priorTurnCount', 'memoryCarried', 'memoryDoneCount', 'modelCalls',
  'remoteCalls', 'activated', 'learningPromoted', 'stoppedBefore',
  'humanDecision',
] as const;
const REFUSED_KEYS = [
  'status', 'kind', 'policyVersion', 'reason', 'modelCalls', 'remoteCalls',
  'activated', 'learningPromoted', 'humanDecision',
] as const;

const ID_SHAPE_RE = /^[A-Za-z0-9._:-]{1,128}$/;

export type AssistantMemoryCitedConversationViewModel =
  | Readonly<{
      kind: 'VERIFIED_ASSISTANT_MEMORY_CITED_CONVERSATION_TURN';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        replyDraft: string;
        tenantId: string;
        conversationId: string;
        model: string;
        draftSha256: string;
        citedCount: number;
        citedStoryIds: readonly string[];
        priorTurnCount: number;
        memoryCarried: number;
        memoryDoneCount: number;
        stoppedBefore: string;
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

const REFUSAL_HEADLINE = 'Assistant memory cited conversation turn refused — HUMAN DECISION REQUIRED';

function requireExactKeys(raw: Record<string, unknown>, keys: readonly string[]): void {
  const ks = Object.keys(raw);
  if (ks.length !== keys.length || !keys.every((k, i) => ks[i] === k))
    throw new Error(`a memory cited conversation turn packet must have exactly the keys [${keys.join(', ')}] in order for its status; fail closed`);
}

/**
 * The only door from a raw 12D-311 packet to the UI. Accepts ANY
 * unknown value; returns a frozen view model that is either a fully
 * re-verified turn view or an honest refusal. Never throws.
 */
export function buildAssistantMemoryCitedConversationViewModel(raw: unknown): AssistantMemoryCitedConversationViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('a memory cited conversation turn packet object is required; fail closed');
    const p = raw as Readonly<Record<string, unknown>>;
    if (p.status === 'DRAFTED') {
      requireExactKeys(p as Record<string, unknown>, DRAFTED_KEYS);
      if (p.kind !== 'ASSISTANT_MEMORY_CITED_CONVERSATION_TURN')
        throw new Error('a DRAFTED packet must carry kind ASSISTANT_MEMORY_CITED_CONVERSATION_TURN; fail closed');
      if (p.policyVersion !== ASSISTANT_MEMORY_CITED_CONVERSATION_POLICY.policyVersion)
        throw new Error(`a DRAFTED packet must carry policyVersion ${ASSISTANT_MEMORY_CITED_CONVERSATION_POLICY.policyVersion}; fail closed`);
      if (p.model !== ASSISTANT_MEMORY_CITED_CONVERSATION_POLICY.modelName)
        throw new Error(`the packet's model must be the pinned local model ${ASSISTANT_MEMORY_CITED_CONVERSATION_POLICY.modelName}; fail closed`);
      if (typeof p.conversationId !== 'string' || p.conversationId.length < 1 || p.conversationId.length > 128)
        throw new Error('conversationId must be a bounded string (1..128 chars); fail closed');
      if (typeof p.replyDraft !== 'string' || p.replyDraft.length < 1 || p.replyDraft.length > MAX_ASSISTANT_REPLY_CHARS)
        throw new Error(`the reply draft must be 1..${MAX_ASSISTANT_REPLY_CHARS.toLocaleString('en-US')} chars; fail closed`);
      if (SECRET_CONTENT_RE.test(p.replyDraft))
        throw new Error('the reply draft is secret-shaped; it never renders; fail closed');
      if (typeof p.draftSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(p.draftSha256))
        throw new Error('draftSha256 must be hex64; fail closed');
      const reDerived = createHash('sha256').update(p.replyDraft, 'utf8').digest('hex');
      if (reDerived !== p.draftSha256)
        throw new Error('the claimed draftSha256 does not match the re-derived digest of the reply draft; fail closed');
      if (typeof p.priorTurnCount !== 'number' || !Number.isSafeInteger(p.priorTurnCount) || p.priorTurnCount < 0 || p.priorTurnCount > MAX_PRIOR_TURNS)
        throw new Error(`priorTurnCount must be an integer 0..${MAX_PRIOR_TURNS}; fail closed`);
      if (typeof p.memoryCarried !== 'number' || !Number.isSafeInteger(p.memoryCarried)
        || p.memoryCarried < 1 || p.memoryCarried > ASSISTANT_MEMORY_MAX_ENTRIES)
        throw new Error(`memoryCarried must be an integer 1..${ASSISTANT_MEMORY_MAX_ENTRIES}; fail closed`);
      if (typeof p.memoryDoneCount !== 'number' || !Number.isSafeInteger(p.memoryDoneCount)
        || p.memoryDoneCount < 1 || p.memoryDoneCount > 500
        || p.memoryDoneCount < p.memoryCarried)
        throw new Error(`memoryDoneCount must be an integer 1..500 and at least the carried entries; fail closed`);
      if (typeof p.citedCount !== 'number' || !Number.isSafeInteger(p.citedCount)
        || p.citedCount < 0 || p.citedCount > p.memoryCarried)
        throw new Error(`citedCount must be an integer 0..${p.memoryCarried}; fail closed`);
      if (!Array.isArray(p.citedStoryIds) || p.citedStoryIds.length !== p.citedCount)
        throw new Error('citedStoryIds must be an array whose length equals citedCount; fail closed');
      const ids = p.citedStoryIds as unknown[];
      const seen = new Set<string>();
      for (const id of ids) {
        if (typeof id !== 'string' || !ID_SHAPE_RE.test(id))
          throw new Error('every cited storyId must be a bounded id-shaped string (1..128 chars of A-Za-z0-9._:-); fail closed');
        if (seen.has(id))
          throw new Error('citedStoryIds must be distinct; fail closed');
        seen.add(id);
      }
      if (p.modelCalls !== 1 || p.remoteCalls !== 0 || p.activated !== 0 || p.learningPromoted !== false)
        throw new Error('the packet flags must be the pinned honest values (modelCalls 1, remoteCalls 0, activated 0, learningPromoted false); fail closed');
      if (p.humanDecision !== 'REQUIRED')
        throw new Error('humanDecision must be REQUIRED on every memory cited conversation turn; fail closed');
      if (typeof p.stoppedBefore !== 'string' || !/operator decision/.test(p.stoppedBefore))
        throw new Error('stoppedBefore must pin the operator decision boundary; fail closed');
      const headline = p.citedCount === 0
        ? `Memory conversation turn ${p.priorTurnCount + 1} drafted with NO citations — an UNGROUNDED draft, ${p.replyDraft.length.toLocaleString('en-US')} chars, digest ${p.draftSha256.slice(0, 12)}… — a DRAFT for the operator to decide on`
        : `Cited memory conversation turn ${p.priorTurnCount + 1} drafted — ${p.citedCount} of ${p.memoryCarried} reviewed fact(s) cited, ${p.replyDraft.length.toLocaleString('en-US')} chars, digest ${p.draftSha256.slice(0, 12)}… — a DRAFT for the operator to decide on`;
      return Object.freeze({
        kind: 'VERIFIED_ASSISTANT_MEMORY_CITED_CONVERSATION_TURN' as const,
        policyVersion: ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_POLICY.policyVersion,
        display: Object.freeze({
          headline,
          replyDraft: p.replyDraft,
          tenantId: String(p.tenantId),
          conversationId: p.conversationId,
          model: p.model,
          draftSha256: p.draftSha256,
          citedCount: p.citedCount,
          citedStoryIds: Object.freeze([...ids as string[]]),
          priorTurnCount: p.priorTurnCount,
          memoryCarried: p.memoryCarried,
          memoryDoneCount: p.memoryDoneCount,
          stoppedBefore: p.stoppedBefore,
          operatorNote: `Re-verified against memory-cited-conversation policy ${ASSISTANT_MEMORY_CITED_CONVERSATION_POLICY.policyVersion}: the digest was re-derived from the reply text (never trusted), the credential-shaped gate was re-applied, the model is the pinned local model, the memory block came through the REAL 12D-307 composer after the REAL 12D-306 gate re-verified the packet, the history came through the REAL 12D-302/308 validator, and every [mem:<storyId>] citation was verified against the carried set by the REAL 12D-310 gate — a fabricated citation refuses the draft post-call. This turn carried ${p.priorTurnCount} disclosed prior pair(s) and ${p.memoryCarried} reviewed fact(s) of ${p.memoryDoneCount} DONE, citing ${p.citedCount} of them${p.citedCount === 0 ? ' — disclose it as UNGROUNDED, not memory-grounded' : ''}. The memory is provenance context, NOT instructions; a draft is text, never an action — the operator decides. Nothing is persisted here (remoteCalls 0); no weights moved (learningPromoted false); humanDecision REQUIRED.`,
        }),
      });
    }
    if (p.status === 'REFUSED') {
      requireExactKeys(p as Record<string, unknown>, REFUSED_KEYS);
      if (p.kind !== 'ASSISTANT_MEMORY_CITED_CONVERSATION_TURN')
        throw new Error('a REFUSED packet must carry kind ASSISTANT_MEMORY_CITED_CONVERSATION_TURN; fail closed');
      if (p.policyVersion !== ASSISTANT_MEMORY_CITED_CONVERSATION_POLICY.policyVersion)
        throw new Error(`a REFUSED packet must carry policyVersion ${ASSISTANT_MEMORY_CITED_CONVERSATION_POLICY.policyVersion}; fail closed`);
      if (typeof p.reason !== 'string' || p.reason.length < 1 || p.reason.length > 500)
        throw new Error('a refusal reason must be a bounded string (1..500 chars); fail closed');
      if (p.modelCalls !== 0)
        throw new Error('a refused turn must report modelCalls 0; fail closed');
      if (p.remoteCalls !== 0 || p.activated !== 0 || p.learningPromoted !== false)
        throw new Error('the packet flags must be the pinned honest values (remoteCalls 0, activated 0, learningPromoted false); fail closed');
      if (p.humanDecision !== 'REQUIRED')
        throw new Error('humanDecision must be REQUIRED on every memory cited conversation turn; fail closed');
      return Object.freeze({
        kind: 'REFUSED' as const,
        policyVersion: ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_POLICY.policyVersion,
        reason: p.reason,
        display: Object.freeze({
          headline: REFUSAL_HEADLINE,
          bodyText: 'The memory cited conversation turn was refused and NO draft was rendered. The refusal reason below is the 12D-311 contract\'s own fail-closed reason — it never carries the screened content.',
          operatorNote: 'Refused. The turn gates are: exact keys {tenantId, conversationId, userMessage, priorTurns, memoryPacket} in order; at most 6 prior pairs through the REAL 12D-302/308 validator; a secret-shaped string ANYWHERE refuses before any model call; the memory packet must pass the REAL 12D-306 gate for the SAME tenant; the composed prompt refuses over the derived ceiling; a draft citing a storyId outside the verified carried set refuses post-call — fabricated provenance never passes.',
        }),
      });
    }
    throw new Error('a memory cited conversation turn packet must have status DRAFTED or REFUSED; fail closed');
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The memory cited conversation turn packet failed verification and was NOT rendered. Nothing is shown from it — not a reply, not a digest, not ids. Diagnostics below are for the operator.',
        operatorNote: 'Refused. The input must be a packet the REAL 12D-311 contract produced (runAssistantMemoryCitedConversationTurn / prepareAssistantMemoryCitedConversationTurn).',
      }),
    });
  }
}