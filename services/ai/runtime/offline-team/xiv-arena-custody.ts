// 12D-258 — Arena Custody Wiring: closes the loop the 12D-253 spec demanded —
// "ONLY the Judge can output the final packet into the custody journal."
//
// This module is the ONE bridge from a completed arena debate to the
// operator custody chain (12D-233/12D-236). It takes an AUTHORIZED arena
// transcript plus the judge-bound 12D-241 packet, derives the arena receipt
// (which cryptographically binds packetId ← transcriptDigest), and
// REGISTERS that receipt in the operator custody registry under a FIXED
// purpose — the register op then lands in the hash-chained custody journal
// (12D-236: the registry call happens FIRST; a refused op is never
// journaled, so a journal replay can never diverge from the live contract).
//
// What this module does NOT do:
//   * It never AUTHENTICATES/CONSUMES the receipt — consumption is the
//     operator's single-use, out-of-band action through the custody stack
//     (12D-233), never an automatic step.
//   * It never decides anything: an AUTHORIZED arena verdict is
//     authorization FOR HUMAN REVIEW. The registered receipt is evidence
//     that a consensus was reached, not an approval.
//   * It never calls a model or the network: modelCalls 0, remoteCalls 0.
//
// Disclosed residuals (verbatim carry-overs):
//   * Registration is not issuance proof: a registry fed by an impostor
//     records an impostor's receipts (12D-233). The arena authenticates the
//     STRUCTURE of consensus, not the honesty of the agents (12D-253).
//   * The custody journal is single-writer-per-file (operator discipline).
//   * humanDecision: 'REQUIRED', learningPromoted: false,
//     remoteCalls: 0, modelCalls: 0, billionUsersProven: false.

import {
  verifyArenaTranscript,
  gateConsensus,
  deriveArenaReceipt,
  type ArenaTranscript,
} from './xiv-multi-agent-arena';
import {
  verifyStoryShellPacket, type StoryShellPacket,
} from './xiv-os-wire-contract';
import { OperatorCustodyRegistry } from './operator-custody-registry';
import { appendCustodyOp, type CustodyJournalStore } from './operator-custody-journal';

export const ARENA_CUSTODY_POLICY = Object.freeze({
  policyVersion: '12d-258-v1',
  domain: 'XIV_OS_ARENA_CUSTODY',
  /** The FIXED purpose every arena receipt is registered under. */
  purpose: 'xiv-os-arena-consensus',
  maxRegisteredByChars: 128,
});

export const ARENA_CUSTODY_GUARDRAILS = Object.freeze({
  onlyJudgeReleasedPacketsAreJournaled: true, // receipt binding + full verify
  registerOnlyNeverConsumes: true, // consumption stays with the operator
  registryFirstNothingJournaledOnRefusal: true,
  fixedPurpose: true,
  authorizedMeansReadyForHumanReview: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const REGISTERED_BY_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const INPUT_KEYS = ['registry', 'store', 'journalGenesis', 'transcript', 'packet', 'registeredBy', 'nowMs'] as const;
const RECORD_KEYS = ['policyVersion', 'transcriptDigest', 'packetId', 'arenaReceipt', 'purpose', 'registeredBy', 'registeredAtMs', 'guardrails'] as const;

/**
 * Journal ONE authorized arena verdict. Requires: the transcript to fully
 * verify (hash-chain replay), the gate to be AUTHORIZED, the packet to
 * fully verify, the judge step to bind exactly this packetId (all through
 * deriveArenaReceipt), and a live 12D-233 registry. The arena receipt is
 * registered once under the fixed purpose; the register op is journaled.
 * Returns the frozen verdict record. Throws on ANY anomaly.
 */
export function journalArenaVerdict(opts: Readonly<{
  registry: OperatorCustodyRegistry;
  store: CustodyJournalStore;
  journalGenesis: string;
  transcript: Readonly<ArenaTranscript>;
  packet: Readonly<StoryShellPacket>;
  registeredBy: string;
  nowMs: number;
}>): Readonly<{
  policyVersion: string;
  transcriptDigest: string;
  packetId: string;
  arenaReceipt: string;
  purpose: string;
  registeredBy: string;
  registeredAtMs: number;
  guardrails: typeof ARENA_CUSTODY_GUARDRAILS;
}> {
  if (!opts || typeof opts !== 'object' || Array.isArray(opts))
    throw new Error('journalArenaVerdict expects an options object; fail closed');
  const keys = Object.keys(opts);
  if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
    throw new Error(`journalArenaVerdict options must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
  if (!(opts.registry instanceof OperatorCustodyRegistry))
    throw new Error('a live 12D-233 OperatorCustodyRegistry is required; fail closed');
  if (typeof opts.journalGenesis !== 'string' || opts.journalGenesis.length < 8)
    throw new Error('the journal genesis must be a string of at least 8 chars; fail closed');
  if (typeof opts.registeredBy !== 'string' || !REGISTERED_BY_RE.test(opts.registeredBy))
    throw new Error("registeredBy must match ^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$; fail closed");
  if (typeof opts.nowMs !== 'number' || !Number.isSafeInteger(opts.nowMs) || opts.nowMs < 0)
    throw new Error('nowMs must be a safe non-negative integer; fail closed');

  // Full arena verification: replay + gate. A tampered or unfinished
  // transcript refuses here, before anything is registered.
  verifyArenaTranscript(opts.transcript);
  const gate = gateConsensus(opts.transcript);
  if (gate.outcome !== 'AUTHORIZED')
    throw new Error(`consensus was not reached (${gate.reason}); nothing is registered; fail closed`);

  // The receipt derivation is the whole release gate: it re-verifies the
  // packet (throws on tamper), re-gates the transcript, and requires the
  // judge step to bind exactly this packetId.
  const arena = deriveArenaReceipt({ transcript: opts.transcript, packet: opts.packet });

  // Register the receipt in the custody registry FIRST (12D-236 discipline:
  // a refused op is never journaled). issuedAtMs = registeredAtMs = nowMs:
  // the arena receipt is "issued" by the consensus it certifies.
  appendCustodyOp(opts.registry, opts.store, opts.journalGenesis, 'register', {
    receiptSha256: arena.receipt,
    purpose: ARENA_CUSTODY_POLICY.purpose,
    registeredBy: opts.registeredBy,
    issuedAtMs: opts.nowMs,
    registeredAtMs: opts.nowMs,
  });

  return Object.freeze({
    policyVersion: ARENA_CUSTODY_POLICY.policyVersion,
    transcriptDigest: arena.transcriptDigest,
    packetId: arena.packetId,
    arenaReceipt: arena.receipt,
    purpose: ARENA_CUSTODY_POLICY.purpose,
    registeredBy: opts.registeredBy,
    registeredAtMs: opts.nowMs,
    guardrails: ARENA_CUSTODY_GUARDRAILS,
  });
}

/**
 * The verdict record verifier: re-derives the arena receipt from the
 * transcript+packet and byte-compares every field. A verdict record that
 * does not re-derive from its own transcript refuses.
 */
export function verifyArenaVerdictRecord(record: unknown, sources: Readonly<{
  transcript: Readonly<ArenaTranscript>;
  packet: Readonly<StoryShellPacket>;
  registeredBy: string;
  nowMs: number;
}>): Readonly<{ ok: true }> {
  if (!record || typeof record !== 'object' || Array.isArray(record))
    throw new Error('an arena verdict record is required; fail closed');
  const rec = record as Record<string, unknown>;
  const keys = Object.keys(rec);
  if (keys.length !== RECORD_KEYS.length || !RECORD_KEYS.every((k, i) => keys[i] === k))
    throw new Error(`an arena verdict record must have exactly the keys [${RECORD_KEYS.join(', ')}] in order; fail closed`);
  if (rec.policyVersion !== ARENA_CUSTODY_POLICY.policyVersion)
    throw new Error('unknown arena custody policy version; fail closed');
  const packetId = typeof rec.packetId === 'string' ? rec.packetId : 'no-packet-id';
  const rederived = journalArenaVerdict({
    registry: new OperatorCustodyRegistry(`rederive-${packetId}`),
    store: { load: () => null, save: () => undefined },
    journalGenesis: 'replay-genesis',
    transcript: sources.transcript,
    packet: sources.packet,
    registeredBy: sources.registeredBy,
    nowMs: sources.nowMs,
  });
  if (JSON.stringify(rederived) !== JSON.stringify(record))
    throw new Error('arena verdict record mismatch — tampered, foreign, or stale; fail closed');
  return Object.freeze({ ok: true });
}