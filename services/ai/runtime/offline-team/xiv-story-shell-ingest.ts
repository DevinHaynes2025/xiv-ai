// 12D-259 — Story-Shell Packet Ingest: the raw-text door into the 12D-254
// view model. An operator drops or pastes a packet JSON document (a single
// packet or a bounded batch array); this module parses it fail-closed and
// hands EVERY packet to the 12D-254 verifier before anything is returned.
//
// Why this module exists separately from the 12D-254 view model: the wire
// verifier re-derives sha256 digests through node:crypto, so verification
// can NEVER run inside a browser bundle. The ingest runs in the LOCAL
// server process (services/xiv-story-shell route handler); the browser
// receives ONLY frozen view models. That gives the shell its strongest
// honest property: a REFUSED packet's content never crosses from the
// verifier process to the browser — the refusal view models carry zero
// packet content by construction (12D-254), so nothing is rendered from a
// tampered packet anywhere, client or server.
//
// Rules, structurally enforced:
//   * PARSE BEFORE VERIFY: unparseable text is an UNPARSEABLE result with
//     honest diagnostics — never a crash, never a partial render.
//   * PER-PACKET ALL-OR-NOTHING: a batch judges each packet independently;
//     one tampered packet refuses ITSELF, never its neighbors.
//   * BOUNDED: text length and batch size are capped; anything over the
//     cap refuses the whole submission (fail closed, never truncated).
//   * This module is PURE: no fs, no network, no clock, no randomness.
//     modelCalls: 0, remoteCalls: 0. It reads nothing but its argument.
//
// Disclosed residuals:
//   * The ingest authenticates the BYTES of a packet, not its truth — a
//     verified packet's claims are rendered as claims (12D-254 residual
//     carries over verbatim).
//   * Parse diagnostics quote the JSON parser's message, never packet
//     content — unparseable input yields zero content anywhere.

import {
  buildStoryShellViewModel, STORY_SHELL_VIEW_MODEL_POLICY,
  type StoryShellViewModel,
} from './xiv-story-shell-view-model';

export const STORY_SHELL_INGEST_POLICY = Object.freeze({
  policyVersion: '12d-259-v1',
  domain: 'XIV_OS_STORY_SHELL_INGEST',
  /** Hard cap on the raw packet text accepted for a single submission. */
  maxPacketTextChars: 1_000_000,
  /** Hard cap on how many packets one submission may carry. */
  maxBatchSize: 100,
});

export const STORY_SHELL_INGEST_GUARDRAILS = Object.freeze({
  parseBeforeVerify: true, // unparseable text refuses honestly, never crashes
  perPacketAllOrNothing: true, // one tampered packet refuses itself only
  refusedContentStaysServerSide: true, // refused view models carry zero packet content
  boundedInput: true,
  boundedBatch: true,
  verifyBeforeRender: true, // every packet passes the 12D-254 gate first
  noApproveControl: true, // the shell never decides
  pureModule: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export type StoryShellIngestResult = Readonly<{
  kind: 'INGESTED' | 'UNPARSEABLE';
  policyVersion: string;
  /** INGESTED: one frozen view model per submitted packet, in order. */
  items: readonly StoryShellViewModel[];
  /** UNPARSEABLE: honest parse diagnostics (zero packet content); INGESTED: empty. */
  parseReasons: readonly string[];
}>;

/**
 * The only door from raw packet TEXT to the shell's view models. Accepts a
 * JSON document holding ONE packet object or an ARRAY of them (a bounded
 * batch). Returns a frozen result that is either INGESTED (one view model
 * per packet, each fully verified or an honest refusal) or UNPARSEABLE
 * (honest diagnostics, zero packet content). Never throws.
 */
export function ingestStoryShellPacketJson(rawText: unknown): StoryShellIngestResult {
  try {
    if (typeof rawText !== 'string' || rawText.length === 0)
      throw new Error('packet text must be a non-empty string; fail closed');
    if (rawText.length > STORY_SHELL_INGEST_POLICY.maxPacketTextChars)
      throw new Error(`packet text exceeds ${STORY_SHELL_INGEST_POLICY.maxPacketTextChars} chars; fail closed`);
    const parseAttempt: Readonly<{ ok: true; value: unknown } | { ok: false; message: string }> = (() => {
      try {
        return { ok: true as const, value: JSON.parse(rawText) as unknown };
      } catch (err) {
        return { ok: false as const, message: err instanceof Error ? err.message : String(err) };
      }
    })();
    if (!parseAttempt.ok)
      throw new Error(`packet text is not valid JSON: ${parseAttempt.message}`);
    const parsed: unknown = parseAttempt.value;
    const isBatch = Array.isArray(parsed);
    if (isBatch && parsed.length === 0)
      throw new Error('a batch submission must contain at least one packet; fail closed');
    if (isBatch && parsed.length > STORY_SHELL_INGEST_POLICY.maxBatchSize)
      throw new Error(`a batch submission exceeds ${STORY_SHELL_INGEST_POLICY.maxBatchSize} packets; fail closed`);
    const rawItems: readonly unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    // Every packet — no exceptions — goes through the 12D-254 gate. The view
    // model factory never throws, so INGESTED always carries a full list.
    const items = rawItems.map((el) => buildStoryShellViewModel(el));
    return Object.freeze({
      kind: 'INGESTED' as const,
      policyVersion: STORY_SHELL_VIEW_MODEL_POLICY.policyVersion,
      items: Object.freeze(items),
      parseReasons: Object.freeze([]),
    });
  } catch (err) {
    return Object.freeze({
      kind: 'UNPARSEABLE' as const,
      policyVersion: STORY_SHELL_VIEW_MODEL_POLICY.policyVersion,
      items: Object.freeze([]),
      parseReasons: Object.freeze([err instanceof Error ? err.message : String(err)]),
    });
  }
}