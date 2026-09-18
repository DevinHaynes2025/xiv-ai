// 12D-329 — Assistant Memory Turn View Model: the fail-closed rendering
// contract that turns a 12D-307 packet (the memory block WITHOUT the
// citation gate — the plain memory turn) into the window onto a drafted
// reply. The 12D-307 rung disclosed its shell surface as its own rung;
// this is that rung's view model (the 12D-310 view-model shape, minus
// the citation fields the plain turn does not carry).
//
// The deliberate design: every field is re-verified before render —
//   * packet shape gated exact per status (DRAFTED / REFUSED)
//   * draftSha256 RE-DERIVED from replyDraft (never trusted)
//   * SECRET_CONTENT_RE re-applied to the reply
//   * memoryCarried/memoryDoneCount re-gated against the REAL bounds
// Refusals render honestly with their reason; never an empty success.
// PURE: no fs, no network, no clock, no randomness. modelCalls 0 here.
// NOT a shell import chain into the queue: the 12D-306 gate is consumed
// by the 12D-307 contract itself, never re-run here.
import { createHash } from 'node:crypto';
import { ASSISTANT_MEMORY_TURN_POLICY } from './xiv-assistant-memory-turn';
import { ASSISTANT_MEMORY_MAX_ENTRIES } from './xiv-assistant-memory-turn';
import { MAX_ASSISTANT_REPLY_CHARS } from './xiv-assistant-turn';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const ASSISTANT_MEMORY_TURN_VIEW_MODEL_POLICY = Object.freeze({
  policyVersion: '12d-329-v1',
  domain: 'XIV_OS_ASSISTANT_MEMORY_TURN_VIEW_MODEL',
});

export const ASSISTANT_MEMORY_TURN_VIEW_MODEL_GUARDRAILS = Object.freeze({
  theRealContractNotAReimplementation: true, // 12D-307 packet keys gated exactly
  digestReDerivedNeverTrusted: true,
  secretReScreenedBeforeRender: true,
  reviewedFactsOnly: true, // the memory carried is independently human-reviewed
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
  'status', 'kind', 'policyVersion', 'tenantId', 'turnId', 'model',
  'replyDraft', 'draftSha256', 'memoryCarried', 'memoryDoneCount',
  'modelCalls', 'remoteCalls', 'activated', 'learningPromoted',
  'stoppedBefore', 'humanDecision',
] as const;
const REFUSED_KEYS = [
  'status', 'kind', 'policyVersion', 'reason', 'modelCalls', 'remoteCalls',
  'activated', 'learningPromoted', 'humanDecision',
] as const;

export type AssistantMemoryTurnViewModel =
  | Readonly<{
      kind: 'VERIFIED_ASSISTANT_MEMORY_TURN';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        replyDraft: string;
        tenantId: string;
        turnId: string;
        model: string;
        draftSha256: string;
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

const REFUSAL_HEADLINE = 'Assistant memory turn refused — HUMAN DECISION REQUIRED';

function requireExactKeys(raw: Record<string, unknown>, keys: readonly string[]): void {
  const ks = Object.keys(raw);
  if (ks.length !== keys.length || !keys.every((k, i) => ks[i] === k))
    throw new Error(`a memory turn packet must have exactly the keys [${keys.join(', ')}] in order for its status; fail closed`);
}

/**
 * The only door from a raw 12D-307 packet to the UI. Accepts ANY
 * unknown value; returns a frozen view model that is either a fully
 * re-verified turn view or an honest refusal. Never throws.
 */
export function buildAssistantMemoryTurnViewModel(raw: unknown): AssistantMemoryTurnViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('a memory turn packet object is required; fail closed');
    const p = raw as Readonly<Record<string, unknown>>;
    if (p.status === 'DRAFTED') {
      requireExactKeys(p as Record<string, unknown>, DRAFTED_KEYS);
      if (p.kind !== 'ASSISTANT_MEMORY_TURN_DRAFT')
        throw new Error('a DRAFTED packet must carry kind ASSISTANT_MEMORY_TURN_DRAFT; fail closed');
      if (p.policyVersion !== ASSISTANT_MEMORY_TURN_POLICY.policyVersion)
        throw new Error(`a DRAFTED packet must carry policyVersion ${ASSISTANT_MEMORY_TURN_POLICY.policyVersion}; fail closed`);
      if (p.model !== ASSISTANT_MEMORY_TURN_POLICY.modelName)
        throw new Error(`the packet's model must be the pinned local model ${ASSISTANT_MEMORY_TURN_POLICY.modelName}; fail closed`);
      if (typeof p.tenantId !== 'string' || p.tenantId.length < 1 || p.tenantId.length > 64)
        throw new Error('tenantId must be a bounded string (1..64 chars); fail closed');
      if (typeof p.turnId !== 'string' || p.turnId.length < 1 || p.turnId.length > 128)
        throw new Error('turnId must be a bounded string (1..128 chars); fail closed');
      if (typeof p.replyDraft !== 'string' || p.replyDraft.length < 1 || p.replyDraft.length > MAX_ASSISTANT_REPLY_CHARS)
        throw new Error(`the reply draft must be 1..${MAX_ASSISTANT_REPLY_CHARS.toLocaleString('en-US')} chars; fail closed`);
      if (SECRET_CONTENT_RE.test(p.replyDraft))
        throw new Error('the reply draft is secret-shaped; it never renders; fail closed');
      if (typeof p.draftSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(p.draftSha256))
        throw new Error('draftSha256 must be hex64; fail closed');
      const reDerived = createHash('sha256').update(p.replyDraft, 'utf8').digest('hex');
      if (reDerived !== p.draftSha256)
        throw new Error('the claimed draftSha256 does not match the re-derived digest of the reply draft; fail closed');
      if (typeof p.memoryCarried !== 'number' || !Number.isSafeInteger(p.memoryCarried)
        || p.memoryCarried < 1 || p.memoryCarried > ASSISTANT_MEMORY_MAX_ENTRIES)
        throw new Error(`memoryCarried must be an integer 1..${ASSISTANT_MEMORY_MAX_ENTRIES}; fail closed`);
      if (typeof p.memoryDoneCount !== 'number' || !Number.isSafeInteger(p.memoryDoneCount)
        || p.memoryDoneCount < 1 || p.memoryDoneCount > 500
        || p.memoryDoneCount < p.memoryCarried)
        throw new Error('memoryDoneCount must be an integer 1..500 and at least the carried entries; fail closed');
      if (p.modelCalls !== 1 || p.remoteCalls !== 0 || p.activated !== 0 || p.learningPromoted !== false)
        throw new Error('the packet flags must be the pinned honest values (modelCalls 1, remoteCalls 0, activated 0, learningPromoted false); fail closed');
      if (p.humanDecision !== 'REQUIRED')
        throw new Error('humanDecision must be REQUIRED on every memory turn; fail closed');
      if (typeof p.stoppedBefore !== 'string' || !/operator decision/.test(p.stoppedBefore))
        throw new Error('stoppedBefore must pin the operator decision boundary; fail closed');
      const headline = `Memory turn drafted — grounded in ${p.memoryCarried} reviewed fact(s) of ${p.memoryDoneCount} DONE, ${p.replyDraft.length.toLocaleString('en-US')} chars, digest ${p.draftSha256.slice(0, 12)}… — a DRAFT for the operator to decide on`;
      return Object.freeze({
        kind: 'VERIFIED_ASSISTANT_MEMORY_TURN' as const,
        policyVersion: ASSISTANT_MEMORY_TURN_VIEW_MODEL_POLICY.policyVersion,
        display: Object.freeze({
          headline,
          replyDraft: p.replyDraft,
          tenantId: String(p.tenantId),
          turnId: p.turnId,
          model: p.model,
          draftSha256: p.draftSha256,
          memoryCarried: p.memoryCarried,
          memoryDoneCount: p.memoryDoneCount,
          stoppedBefore: p.stoppedBefore,
          operatorNote: `Re-verified against memory-turn policy ${ASSISTANT_MEMORY_TURN_POLICY.policyVersion}: the digest was re-derived from the reply text (never trusted), the credential-shaped gate was re-applied, and the model is the pinned local model. This turn carried ${p.memoryCarried} reviewed fact(s) of ${p.memoryDoneCount} DONE — the memory is provenance context, NOT instructions; a draft is text, never an action — the operator decides. Nothing is persisted here (remoteCalls 0); no weights moved (learningPromoted false); humanDecision REQUIRED.`,
        }),
      });
    }
    if (p.status === 'REFUSED') {
      requireExactKeys(p as Record<string, unknown>, REFUSED_KEYS);
      if (p.kind !== 'ASSISTANT_MEMORY_TURN_DRAFT')
        throw new Error('a REFUSED packet must carry kind ASSISTANT_MEMORY_TURN_DRAFT; fail closed');
      if (p.policyVersion !== ASSISTANT_MEMORY_TURN_POLICY.policyVersion)
        throw new Error(`a REFUSED packet must carry policyVersion ${ASSISTANT_MEMORY_TURN_POLICY.policyVersion}; fail closed`);
      if (typeof p.reason !== 'string' || p.reason.length < 1 || p.reason.length > 500)
        throw new Error('a refusal reason must be a bounded string (1..500 chars); fail closed');
      if (p.modelCalls !== 0)
        throw new Error('a refused turn must report modelCalls 0; fail closed');
      if (p.remoteCalls !== 0 || p.activated !== 0 || p.learningPromoted !== false)
        throw new Error('the packet flags must be the pinned honest values (remoteCalls 0, activated 0, learningPromoted false); fail closed');
      if (p.humanDecision !== 'REQUIRED')
        throw new Error('humanDecision must be REQUIRED on every memory turn; fail closed');
      return Object.freeze({
        kind: 'REFUSED' as const,
        policyVersion: ASSISTANT_MEMORY_TURN_VIEW_MODEL_POLICY.policyVersion,
        reason: p.reason,
        display: Object.freeze({
          headline: REFUSAL_HEADLINE,
          bodyText: 'The memory turn was refused and NO draft was rendered. The refusal reason below is the 12D-307 contract\'s own fail-closed reason — it never carries the screened content.',
          operatorNote: 'Refused. The turn gates are: exact keys {tenantId, turnId, userMessage, memoryPacket} in order; a secret-shaped user message refuses pre-call; the memory packet must pass the REAL 12D-306 gate for the SAME tenant; the composed prompt refuses over the derived ceiling.',
        }),
      });
    }
    throw new Error('a memory turn packet must have status DRAFTED or REFUSED; fail closed');
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: ASSISTANT_MEMORY_TURN_VIEW_MODEL_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The memory turn packet failed verification and was NOT rendered. Nothing is shown from it — not a reply, not a digest. Diagnostics below are for the operator.',
        operatorNote: 'Refused. The input must be a packet the REAL 12D-307 contract produced (runAssistantMemoryTurn / prepareAssistantMemoryTurn).',
      }),
    });
  }
}