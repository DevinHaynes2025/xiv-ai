// 12D-301 — Assistant Turn View Model: the fail-closed rendering
// contract that turns a 12D-300 assistant-turn packet into the story
// shell's window onto the LOCAL assistant (the CEO's "mini grok bot"
// seed made interactive in the shell).
//
// Unlike the 12D-286 receipt view (where the draft text is NEVER
// echoed), an assistant turn's replyDraft IS the operator's answer: the
// 12D-300 contract already secret-screened it post-call, bounded it to
// 8,000 chars, and pinned humanDecision REQUIRED. This module re-verifies
// EVERYTHING before render — the digest is re-derived from the reply
// text (never trusted), the credential-shaped gate is re-applied to the
// reply, the model label is checked against the pinned local model, and
// the packet shape is gated exact. Only then does the reply render.
// Refusals render as refusals with their reason — never an empty success.
//
// Rules, structurally enforced:
//   * THE REAL CONTRACT, NOT A RE-IMPLEMENTATION: the packet must carry
//     the 12D-300 packet's exact keys for its status; anything else
//     refuses. This module adds no policy of its own — it re-verifies
//     the 12D-300 invariants (digest, secret gate, model pin, counts).
//   * DRAFT, NEVER ACTION: the view renders the reply draft plus its
//     digest and the stoppedBefore line; there is no approval control,
//     no write path, no persistence — the operator decides.
//   * REFUSALS ARE HONEST: a refused turn renders its refusal reason
//     (the 12D-300 reasons never echo the screened content).
//   * PURE: no fs, no network, no clock, no randomness. modelCalls: 0
//     here (the turn's model call happened in the caller — this module
//     renders the packet it produced), remoteCalls: 0.
import { createHash } from 'node:crypto';
import {
  ASSISTANT_TURN_POLICY, MAX_ASSISTANT_REPLY_CHARS,
  type AssistantTurnPacket,
} from './xiv-assistant-turn';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const ASSISTANT_TURN_VIEW_MODEL_POLICY = Object.freeze({
  policyVersion: '12d-301-v1',
  domain: 'XIV_OS_LOCAL_ASSISTANT_TURN_VIEW_MODEL',
});

export const ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS = Object.freeze({
  theRealContractNotAReimplementation: true, // 12D-300 packet keys gated exactly
  digestReDerivedNeverTrusted: true, // sha256(replyDraft) must equal draftSha256
  secretReScreenedBeforeRender: true, // SECRET_CONTENT_RE re-applied to the reply
  pinnedModelOnly: true, // the packet's model must be the 12D-300 pinned model
  draftNeverAction: true, // rendered as a draft; no approval control, no write path
  refusedRendersAsRefused: true, // never an empty success
  pureModule: true,
  modelCalls: 0, // the view model calls no model; the turn's call is counted in the packet
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const DRAFTED_KEYS = [
  'status', 'kind', 'policyVersion', 'tenantId', 'turnId', 'model', 'replyDraft',
  'draftSha256', 'modelCalls', 'remoteCalls', 'activated', 'learningPromoted',
  'stoppedBefore', 'humanDecision',
] as const;
const REFUSED_KEYS = [
  'status', 'kind', 'policyVersion', 'reason', 'modelCalls', 'remoteCalls',
  'activated', 'learningPromoted', 'humanDecision',
] as const;

export type AssistantTurnViewModel =
  | Readonly<{
      kind: 'VERIFIED_ASSISTANT_TURN_DRAFT';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        replyDraft: string;
        tenantId: string;
        turnId: string;
        model: string;
        draftSha256: string;
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

const REFUSAL_HEADLINE = 'Assistant turn refused — HUMAN DECISION REQUIRED';

function requireExactKeys(raw: Record<string, unknown>, keys: readonly string[]): void {
  const ks = Object.keys(raw);
  if (ks.length !== keys.length || !keys.every((k, i) => ks[i] === k))
    throw new Error(`an assistant turn packet must have exactly the keys [${keys.join(', ')}] in order for its status; fail closed`);
}

/**
 * The only door from a raw 12D-300 assistant-turn packet to the UI.
 * Accepts ANY unknown value; returns a frozen view model that is either
 * a fully re-verified draft view or an honest refusal. Never throws.
 */
export function buildAssistantTurnViewModel(raw: unknown): AssistantTurnViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('an assistant turn packet object is required; fail closed');
    const p = raw as Readonly<Record<string, unknown>>;
    const status = p.status;
    if (status === 'DRAFTED') {
      requireExactKeys(p as Record<string, unknown>, DRAFTED_KEYS);
      if (p.kind !== 'ASSISTANT_TURN_DRAFT')
        throw new Error('a DRAFTED assistant turn packet must carry kind ASSISTANT_TURN_DRAFT; fail closed');
      if (p.policyVersion !== ASSISTANT_TURN_POLICY.policyVersion)
        throw new Error(`a DRAFTED assistant turn packet must carry policyVersion ${ASSISTANT_TURN_POLICY.policyVersion}; fail closed`);
      if (p.model !== ASSISTANT_TURN_POLICY.modelName)
        throw new Error(`the packet's model must be the pinned local model ${ASSISTANT_TURN_POLICY.modelName}; fail closed`);
      if (typeof p.replyDraft !== 'string' || p.replyDraft.length < 1 || p.replyDraft.length > MAX_ASSISTANT_REPLY_CHARS)
        throw new Error(`the reply draft must be 1..${MAX_ASSISTANT_REPLY_CHARS.toLocaleString('en-US')} chars; fail closed`);
      if (SECRET_CONTENT_RE.test(p.replyDraft))
        throw new Error('the reply draft is secret-shaped; it never renders; fail closed');
      if (typeof p.draftSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(p.draftSha256))
        throw new Error('draftSha256 must be hex64; fail closed');
      const reDerived = createHash('sha256').update(p.replyDraft, 'utf8').digest('hex');
      if (reDerived !== p.draftSha256)
        throw new Error('the claimed draftSha256 does not match the re-derived digest of the reply draft; fail closed');
      if (p.modelCalls !== 1 || p.remoteCalls !== 0 || p.activated !== 0 || p.learningPromoted !== false)
        throw new Error('the packet flags must be the pinned honest values (modelCalls 1, remoteCalls 0, activated 0, learningPromoted false); fail closed');
      if (p.humanDecision !== 'REQUIRED')
        throw new Error('humanDecision must be REQUIRED on every assistant turn; fail closed');
      if (typeof p.stoppedBefore !== 'string' || !/operator decision/.test(p.stoppedBefore))
        throw new Error('stoppedBefore must pin the operator decision boundary; fail closed');
      return Object.freeze({
        kind: 'VERIFIED_ASSISTANT_TURN_DRAFT' as const,
        policyVersion: ASSISTANT_TURN_VIEW_MODEL_POLICY.policyVersion,
        display: Object.freeze({
          headline: `Assistant draft returned — ${p.replyDraft.length.toLocaleString('en-US')} chars, digest ${p.draftSha256.slice(0, 12)}… — a DRAFT for the operator to decide on`,
          replyDraft: p.replyDraft,
          tenantId: String(p.tenantId),
          turnId: String(p.turnId),
          model: p.model,
          draftSha256: p.draftSha256,
          stoppedBefore: p.stoppedBefore,
          operatorNote: `Re-verified against assistant-turn policy ${ASSISTANT_TURN_POLICY.policyVersion}: the digest was re-derived from the reply text (never trusted), the credential-shaped gate was re-applied, and the model is the pinned local model. This is a DRAFT — model text can be wrong; the operator decides what (if anything) happens next. Nothing is persisted; nothing left this machine (remoteCalls 0); no weights moved (learningPromoted false); humanDecision REQUIRED.`,
        }),
      });
    }
    if (status === 'REFUSED') {
      requireExactKeys(p as Record<string, unknown>, REFUSED_KEYS);
      if (p.kind !== 'ASSISTANT_TURN_DRAFT')
        throw new Error('a REFUSED assistant turn packet must carry kind ASSISTANT_TURN_DRAFT; fail closed');
      if (p.policyVersion !== ASSISTANT_TURN_POLICY.policyVersion)
        throw new Error(`a REFUSED assistant turn packet must carry policyVersion ${ASSISTANT_TURN_POLICY.policyVersion}; fail closed`);
      if (typeof p.reason !== 'string' || p.reason.length < 1 || p.reason.length > 500)
        throw new Error('a refusal reason must be a bounded string (1..500 chars); fail closed');
      if (p.modelCalls !== 0)
        throw new Error('a refused turn must report modelCalls 0; fail closed');
      if (p.remoteCalls !== 0 || p.activated !== 0 || p.learningPromoted !== false)
        throw new Error('the packet flags must be the pinned honest values (remoteCalls 0, activated 0, learningPromoted false); fail closed');
      if (p.humanDecision !== 'REQUIRED')
        throw new Error('humanDecision must be REQUIRED on every assistant turn; fail closed');
      return Object.freeze({
        kind: 'REFUSED' as const,
        policyVersion: ASSISTANT_TURN_VIEW_MODEL_POLICY.policyVersion,
        reason: p.reason,
        display: Object.freeze({
          headline: REFUSAL_HEADLINE,
          bodyText: 'The assistant turn was refused and NO draft was rendered. The refusal reason below is the 12D-300 contract\'s own fail-closed reason — it never carries the screened content.',
          operatorNote: 'Refused. The turn gates are: exact keys {tenantId, turnId, userMessage} in order; tenantId 1..64 chars; turnId 1..128 chars; userMessage 1..4,000 chars; the user message must be secret-free BEFORE any model call; the reply must be 1..8,000 chars and secret-free after the call; only the pinned local model drafts.',
        }),
      });
    }
    throw new Error('an assistant turn packet must have status DRAFTED or REFUSED; fail closed');
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: ASSISTANT_TURN_VIEW_MODEL_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The assistant turn packet failed verification and was NOT rendered. Nothing is shown from it — not a reply, not a digest, not ids. Diagnostics below are for the operator.',
        operatorNote: 'Refused. The input must be a packet the REAL 12D-300 contract produced (runAssistantTurn / prepareAssistantTurn).',
      }),
    });
  }
}

export type { AssistantTurnPacket };