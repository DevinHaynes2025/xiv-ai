// 12D-262 — Arena Verdict View: the fail-closed rendering contract that turns
// a completed 12D-258 arena verdict (transcript + judge-bound packet + custody
// record) into a display surface for the story shell. This is the operator's
// window into the arena↔custody loop: "a consensus was reached, the receipt
// is in the custody chain, the packet is ready for HUMAN review."
//
// The UI NEVER sees raw arena material: it renders ONLY the frozen view
// model this module returns. Every input is re-verified through the real
// contracts — verifyArenaTranscript (12D-253 hash-chain replay), gateConsensus
// (AUTHORIZED only), verifyStoryShellPacket (12D-242 wire), and
// verifyArenaVerdictRecord (12D-258 byte-exact re-derivation) — before a
// single byte of content is shown. Any anomaly yields an honest refusal
// carrying ZERO packet or transcript content.
//
// Rules, structurally enforced:
//   * ALL-OR-NOTHING: the whole submission (transcript + packet + verdict
//     record + operator identity + clock) verifies as ONE unit or refuses
//     as ONE unit — a half-verified verdict never renders.
//   * NO APPROVE CONTROL: a verified verdict says "ready for human review"
//     — it carries no action descriptors, no endpoints, no approve/deny
//     affordances. The decision is made in the custody stack (12D-247).
//   * PURE: no fs, no network, no clock, no randomness. Reads nothing but
//     its argument. modelCalls: 0, remoteCalls: 0.
//
// Disclosed residuals:
//   * The view authenticates the BYTES and the consensus STRUCTURE, not the
//     honesty of the agents (12D-253 residual verbatim) — registration is
//     not issuance proof (12D-233 residual verbatim).
//   * A verified verdict proves the record re-derives from its own
//     transcript; it does not prove the story's content is true.

import {
  gateConsensus,
  verifyArenaTranscript,
  type ArenaTranscript,
} from './xiv-multi-agent-arena';
import {
  verifyStoryShellPacket, type StoryShellPacket,
} from './xiv-os-wire-contract';
import {
  ARENA_CUSTODY_POLICY,
  verifyArenaVerdictRecord,
} from './xiv-arena-custody';

export const ARENA_VERDICT_VIEW_POLICY = Object.freeze({
  policyVersion: '12d-262-v1',
  domain: 'XIV_OS_ARENA_VERDICT_VIEW',
});

export const ARENA_VERDICT_VIEW_GUARDRAILS = Object.freeze({
  verifyBeforeRender: true, // all-or-nothing; no partial renders
  wholeSubmissionOneUnit: true, // transcript + packet + verdict + identity verify together
  noApproveControl: true, // the shell never decides
  refusedRendersAsRefused: true, // never an empty success
  pureModule: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const INPUT_KEYS = ['transcript', 'packet', 'verdict', 'registeredBy', 'nowMs'] as const;
const REGISTERED_BY_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

export type ArenaVerdictViewModel =
  | Readonly<{
      kind: 'VERIFIED_ARENA_VERDICT';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        storyId: string;
        packetId: string;
        decidingOver: string;
        arenaReceipt: string;
        transcriptDigest: string;
        purpose: string;
        registeredBy: string;
        registeredAtMs: number;
        /** Display-only reminder; the shell renders this, never an approve button. */
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

const REFUSAL_HEADLINE = 'Arena verdict refused — HUMAN DECISION REQUIRED';

/**
 * The only door from raw arena-verdict material to the UI. Accepts ANY
 * unknown value; returns a frozen view model that is either a fully
 * verified verdict or an honest refusal. Never throws.
 */
export function buildArenaVerdictViewModel(raw: unknown): ArenaVerdictViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('an arena verdict submission object is required; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
      throw new Error(`an arena verdict submission must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
    const s = raw as Readonly<Record<string, unknown>>;
    if (typeof s.registeredBy !== 'string' || !REGISTERED_BY_RE.test(s.registeredBy))
      throw new Error("registeredBy must match ^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$; fail closed");
    if (typeof s.nowMs !== 'number' || !Number.isSafeInteger(s.nowMs) || s.nowMs < 0)
      throw new Error('nowMs must be a safe non-negative integer; fail closed');
    const sources = {
      transcript: s.transcript as Readonly<ArenaTranscript>,
      packet: s.packet as Readonly<StoryShellPacket>,
      registeredBy: s.registeredBy,
      nowMs: s.nowMs,
    };
    // The whole submission verifies as ONE unit, in gate order: chain
    // replay → consensus gate → packet wire check → record re-derivation.
    verifyArenaTranscript(sources.transcript);
    const gate = gateConsensus(sources.transcript);
    if (gate.outcome !== 'AUTHORIZED')
      throw new Error(`arena consensus was not reached (${gate.reason}); nothing is rendered; fail closed`);
    verifyStoryShellPacket(sources.packet);
    verifyArenaVerdictRecord(s.verdict, sources);
    const verdict = s.verdict as Readonly<Record<string, unknown>>;
    const packet = sources.packet;
    return Object.freeze({
      kind: 'VERIFIED_ARENA_VERDICT' as const,
      policyVersion: ARENA_VERDICT_VIEW_POLICY.policyVersion,
      display: Object.freeze({
        headline: `Arena-authorized: ${packet.headline}`,
        storyId: packet.storyId,
        packetId: String(verdict.packetId),
        decidingOver: packet.decisionSurface.decidingOver,
        arenaReceipt: String(verdict.arenaReceipt),
        transcriptDigest: String(verdict.transcriptDigest),
        purpose: ARENA_CUSTODY_POLICY.purpose,
        registeredBy: sources.registeredBy,
        registeredAtMs: sources.nowMs,
        operatorNote: `Verified against arena custody policy ${ARENA_CUSTODY_POLICY.policyVersion}: the record re-derives from its own transcript, the consensus is AUTHORIZED, and the receipt is in the custody chain. Ready for HUMAN review — decide in the custody stack, never through this shell.`,
      }),
    });
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: ARENA_VERDICT_VIEW_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The arena verdict failed verification and was NOT rendered. Nothing is shown from it — not the packet, not the transcript, not the receipt. Diagnostics below are for the operator.',
        operatorNote: 'Refused. Deliver a fully consistent verdict submission, or decide in the custody stack.',
      }),
    });
  }
}