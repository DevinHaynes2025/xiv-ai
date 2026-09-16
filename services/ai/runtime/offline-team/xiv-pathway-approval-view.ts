// 12D-270 — Pathway Approval View: the fail-closed rendering contract that
// turns a 12D-269 pathway approval submission (bridge packet + recorded
// decision custody plan) into a display surface for the story shell. This
// is the operator's window into the brain's recorded approvals: "a decision
// was RECORDED over these exact candidate bytes; here is what it says and
// where it can and cannot go."
//
// The UI NEVER sees raw approval material: it renders ONLY the frozen view
// model this module returns. Every input is re-verified through the REAL
// 12D-269 contracts — the packet gates, verifyPathwayApprovalPlan (receipt
// re-derivation, fixed purpose, secret re-gate), the candidate-bytes
// cross-binding, and the fresh 12D-89 eligibility re-evaluation inside
// applyRecordedApproval — before a single byte is shown. Any anomaly yields
// an honest refusal carrying ZERO packet or plan content.
//
// Rules, structurally enforced:
//   * ALL-OR-NOTHING: the whole submission (packet + plan) verifies as ONE
//     unit or refuses as ONE unit — a half-verified approval never renders.
//   * BOTH DECISIONS RENDER AS RECORDED FACTS: an APPROVED renders as
//     ledger-ready (the ledger path exists, and it is still
//     ledgered-never-activated); a REJECTED renders the honest closed path.
//     Neither is an affordance — the shell reports what a human already
//     recorded out of band, it decides nothing.
//   * NO ACTIVATION, EVER: the view has no activation path and renders no
//     activation claim; the census's `activated` stays the literal 0.
//   * PURE: no fs, no network, no clock, no randomness. Reads nothing but
//     its argument. modelCalls: 0, remoteCalls: 0.
//
// Disclosed residuals:
//   * The view authenticates the BYTES and the binding, not the approver's
//     identity — registration is not issuance proof (the 12D-233 residual
//     verbatim); the ledger records, never verifies who approved (12D-264
//     residual verbatim).
//   * A verified approval proves the record re-derives and binds; it does
//     not prove the story's content is true.

import {
  PATHWAY_APPROVAL_POLICY,
  applyRecordedApproval,
  type PathwayEvidencePacketInput,
} from './xiv-pathway-approval-link';
import {
  PATHWAY_LEDGER_POLICY,
} from './xiv-pathway-ledger';

export const PATHWAY_APPROVAL_VIEW_POLICY = Object.freeze({
  policyVersion: '12d-270-v1',
  domain: 'XIV_OS_PATHWAY_APPROVAL_VIEW',
});

export const PATHWAY_APPROVAL_VIEW_GUARDRAILS = Object.freeze({
  verifyBeforeRender: true, // all-or-nothing; no partial renders
  wholeSubmissionOneUnit: true, // packet + plan verify together
  crossBindingGate: true, // the decision must be about THESE candidate bytes
  eligibilityReEvaluatedInPath: true, // the real 12D-89 gate runs fresh
  reportsDontDecide: true, // renders a recorded decision; never decides
  noActivationPath: true, // the view renders; it never activates
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

const INPUT_KEYS = ['packet', 'plan'] as const;

export type PathwayApprovalViewModel =
  | Readonly<{
      kind: 'VERIFIED_PATHWAY_DECISION';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        pathwayId: string;
        version: number;
        tenantId: string;
        domain: string;
        decision: string;
        decidedBy: string;
        decidedAtMs: number;
        decisionReceipt: string;
        purpose: string;
        ledgerPathOpen: string;
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

const REFUSAL_HEADLINE = 'Pathway decision refused — HUMAN DECISION REQUIRED';

/**
 * The only door from raw pathway-approval material to the UI. Accepts ANY
 * unknown value; returns a frozen view model that is either a fully
 * verified recorded decision (approved OR rejected) or an honest refusal.
 * Never throws.
 */
export function buildPathwayApprovalViewModel(raw: unknown): PathwayApprovalViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('a pathway decision submission object is required; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
      throw new Error(`a pathway decision submission must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
    const s = raw as Readonly<Record<string, unknown>>;
    // The whole submission verifies as ONE unit: the REAL 12D-269 apply path
    // runs the packet gates, the plan verifier, the cross-binding gate, and
    // the fresh eligibility re-evaluation, in that order — a refusal at any
    // layer refuses the render.
    const outcome = applyRecordedApproval(s.packet as Readonly<PathwayEvidencePacketInput>, s.plan);
    // The plan verified inside applyRecordedApproval — the record's fields
    // render as recorded facts, exactly like the 12D-267 custody surface.
    const record = (s.plan as Readonly<Record<string, unknown>>).decisionRecord as Readonly<{
      pathwayId: string; version: number; tenantId: string;
      decision: string; decidedBy: string; decidedAtMs: number;
    }>;
    if (outcome.kind === 'CANDIDATE_REJECTED_RECORDED') {
      return Object.freeze({
        kind: 'VERIFIED_PATHWAY_DECISION' as const,
        policyVersion: PATHWAY_APPROVAL_VIEW_POLICY.policyVersion,
        display: Object.freeze({
          headline: `Pathway decision recorded: REJECTED — ${outcome.pathwayId} v${outcome.version}`,
          pathwayId: outcome.pathwayId,
          version: outcome.version,
          tenantId: record.tenantId,
          domain: 'n/a — a rejected candidate renders no domain claims',
          decision: 'REJECTED',
          decidedBy: record.decidedBy,
          decidedAtMs: record.decidedAtMs,
          decisionReceipt: outcome.decisionReceiptSha256,
          purpose: 'xiv-os-pathway-approval',
          ledgerPathOpen: 'CLOSED — a rejected candidate has no ledger path',
          operatorNote: `Verified against pathway approval policy ${PATHWAY_APPROVAL_POLICY.policyVersion}: the rejection record re-derives its receipt and binds to the candidate bytes. The ledger path is structurally closed. humanDecision: 'REQUIRED' — the shell decides nothing.`,
        }),
      });
    }
    const c = outcome.candidate;
    return Object.freeze({
      kind: 'VERIFIED_PATHWAY_DECISION' as const,
      policyVersion: PATHWAY_APPROVAL_VIEW_POLICY.policyVersion,
      display: Object.freeze({
        headline: `Pathway decision recorded: APPROVED — ${c.pathwayId} v${c.version}`,
        pathwayId: c.pathwayId,
        version: c.version,
        tenantId: c.tenantId,
        domain: String(c.domain),
        decision: 'APPROVED',
        decidedBy: record.decidedBy,
        decidedAtMs: record.decidedAtMs,
        decisionReceipt: outcome.decisionReceiptSha256,
        purpose: 'xiv-os-pathway-approval',
        ledgerPathOpen: `open — the candidate is ready for the 12D-264 ledger, where it stays EVIDENCE AWAITING HUMAN REVIEW (ledgered, never activated; ${PATHWAY_LEDGER_POLICY.maxEntriesPerLedger} entries hard cap per ledger)`,
        operatorNote: `Verified against pathway approval policy ${PATHWAY_APPROVAL_POLICY.policyVersion}: the decision record re-derives its receipt, the cross-binding gate proves it is about THESE candidate bytes, and the REAL 12D-89 eligibility gate re-ran fresh in this view's path. The ledger records the approval — it never verifies who approved (the 12D-233 residual), and nothing is activated here or anywhere in this chain. The shell offers no approve control and decides nothing.`,
      }),
    });
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: PATHWAY_APPROVAL_VIEW_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The pathway decision submission failed verification and was NOT rendered. Nothing is shown from it — not the packet, not the plan, not the receipt, not the pathway identity. Diagnostics below are for the operator.',
        operatorNote: 'Refused. Deliver a fully consistent pathway decision submission, or record the decision in the custody stack.',
      }),
    });
  }
}