// 12D-267 — Custody Decision View: the fail-closed rendering contract that
// turns a completed 12D-247 approval custody submission (verified packet +
// decision custody plan) into a display surface for the story shell. This is
// the operator's window into the human side of the governance loop the arena
// verdict view (12D-262) opened the machine side of: "a decision was RECORDED
// out of band, it binds to THIS packet, here is what it says."
//
// The UI NEVER sees raw custody material: it renders ONLY the frozen view
// model this module returns. Every input is re-verified through the real
// contracts — verifyStoryShellPacket (12D-242 wire) and verifyApprovalCustodyPlan
// (12D-247 record re-derivation) — before a single byte is shown. Any anomaly
// yields an honest refusal carrying ZERO packet or plan content.
//
// The property that is NEW here and exists NOWHERE else in the OS: the
// CROSS-BINDING gate. verifyApprovalCustodyPlan alone proves a plan is
// internally consistent — it accepts ANY hex64 packetId in its record. This
// view additionally proves the record is ABOUT the packet it is submitted
// with: the record's packetId must equal the wire verifier's re-derived id
// and its storyId must equal the packet's storyId. A decision recorded over
// packet B pasted in beside packet A refuses, even though both halves are
// individually perfect.
//
// Rules, structurally enforced:
//   * ALL-OR-NOTHING: the whole submission (packet + plan) verifies as ONE
//     unit or refuses as ONE unit — a half-verified decision never renders.
//   * NO DECIDE, NO APPROVE CONTROL: this view REPORTS a decision a human
//     already stated out of band. It renders no affordance to decide, and it
//     never decides — a submission with no plan refuses.
//   * NOT A JOURNAL AUTHENTICATION: this proves the BINDING (plan re-derives
//     its receipt and binds to this packet). Authenticating the custody
//     JOURNAL — that the receipt was registered under the operator's seed —
//     stays with verifyCustodySession (12D-244), out of band, unchanged.
//   * PURE: no fs, no network, no clock, no randomness. Reads nothing but its
//     argument. modelCalls: 0, remoteCalls: 0.
//
// Disclosed residuals:
//   * The view authenticates the BYTES and the binding, not the operator's
//     identity — registration is not issuance proof (12D-233 residual
//     verbatim); the journal proves the decision was RECORDED, not who
//     stated it (12D-247 residual verbatim).
//   * A verified decision proves the record re-derives from its own fields;
//     it does not prove the story's content is true.

import {
  XIV_APPROVAL_CUSTODY_POLICY,
  verifyApprovalCustodyPlan,
} from './xiv-approval-custody';
import { verifyStoryShellPacket, type StoryShellPacket } from './xiv-os-wire-contract';

export const CUSTODY_DECISION_VIEW_POLICY = Object.freeze({
  policyVersion: '12d-267-v1',
  domain: 'XIV_OS_CUSTODY_DECISION_VIEW',
});

export const CUSTODY_DECISION_VIEW_GUARDRAILS = Object.freeze({
  verifyBeforeRender: true, // all-or-nothing; no partial renders
  wholeSubmissionOneUnit: true, // packet + plan verify together
  crossBindingGate: true, // the record must be ABOUT the submitted packet
  reportsDontDecide: true, // renders a recorded decision; never decides
  noApproveControl: true, // the shell never offers an affordance
  refusedRendersAsRefused: true, // never an empty success
  journalAuthenticationStaysOutOfBand: true, // verifyCustodySession, unchanged
  pureModule: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const INPUT_KEYS = ['packet', 'plan'] as const;

export type CustodyDecisionViewModel =
  | Readonly<{
      kind: 'VERIFIED_CUSTODY_DECISION';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        storyId: string;
        packetId: string;
        decision: string;
        decidedBy: string;
        decidedAtMs: number;
        decisionReceipt: string;
        purpose: string;
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

const REFUSAL_HEADLINE = 'Custody decision refused — HUMAN DECISION REQUIRED';

/**
 * The only door from raw custody-decision material to the UI. Accepts ANY
 * unknown value; returns a frozen view model that is either a fully verified
 * recorded decision or an honest refusal. Never throws.
 */
export function buildCustodyDecisionViewModel(raw: unknown): CustodyDecisionViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('a custody decision submission object is required; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
      throw new Error(`a custody decision submission must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
    const s = raw as Readonly<Record<string, unknown>>;
    // The whole submission verifies as ONE unit, in gate order: packet wire
    // check → plan record re-derivation → the cross-binding gate.
    const wireVerdict = verifyStoryShellPacket(s.packet as Readonly<StoryShellPacket>);
    if (!wireVerdict.ok)
      throw new Error('the story packet failed wire verification; nothing is rendered; fail closed');
    const verifiedPlan = verifyApprovalCustodyPlan(s.plan as Parameters<typeof verifyApprovalCustodyPlan>[0]);
    const planObj = s.plan as Readonly<Record<string, unknown>>;
    const record = planObj.decisionRecord as Readonly<Record<string, unknown>>;
    // The cross-binding gate: a plan about a DIFFERENT packet never renders,
    // even though both halves are individually consistent.
    if (record.packetId !== wireVerdict.packetId)
      throw new Error('the decision record is not about the submitted packet (packetId mismatch); fail closed');
    if (record.storyId !== (s.packet as Readonly<Record<string, unknown>>).storyId)
      throw new Error('the decision record is not about the submitted packet (storyId mismatch); fail closed');
    const packet = s.packet as Readonly<Record<string, unknown>>;
    return Object.freeze({
      kind: 'VERIFIED_CUSTODY_DECISION' as const,
      policyVersion: CUSTODY_DECISION_VIEW_POLICY.policyVersion,
      display: Object.freeze({
        headline: `Custody decision recorded: ${String(record.decision)} — ${String(packet.headline)}`,
        storyId: String(record.storyId),
        packetId: wireVerdict.packetId,
        decision: String(record.decision),
        decidedBy: String(record.decidedBy),
        decidedAtMs: Number(record.decidedAtMs),
        decisionReceipt: verifiedPlan.decisionReceiptSha256,
        purpose: XIV_APPROVAL_CUSTODY_POLICY.purpose,
        operatorNote: `Verified against approval custody policy ${XIV_APPROVAL_CUSTODY_POLICY.policyVersion}: the decision record re-derives its receipt, and the cross-binding gate proves it is about THIS packet. Journal authentication with the operator's seed remains OUT OF BAND (12D-244) — this surface proved the binding, not the journal. The decision was already made by a human; this shell offers no approve control and decides nothing.`,
      }),
    });
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: CUSTODY_DECISION_VIEW_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The custody decision submission failed verification and was NOT rendered. Nothing is shown from it — not the packet, not the plan, not the receipt. Diagnostics below are for the operator.',
        operatorNote: 'Refused. Deliver a fully consistent custody decision submission, or record the decision in the custody stack.',
      }),
    });
  }
}