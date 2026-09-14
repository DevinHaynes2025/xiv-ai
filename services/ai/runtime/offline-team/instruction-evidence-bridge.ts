// 12D-134 — INSTRUCTION-EVIDENCE BRIDGE (the intake that closes the loop the
// 12D-130/131 execution bridges opened, paying down 12D-132's disclosed residual).
//
// 12D-132's collector accepts a DECLARED instructionId as a reference — disclosed
// residual: nothing re-derived it, so a receipt could name an instruction that never
// existed. This module is the instruction-gated intake: it issues a 12D-132 evidence
// receipt ONLY against a presented 12D-121 EXECUTION_INSTRUCTION whose whole provenance
// re-derives, and it then records the declared outcome on the workflow's own trail
// (MEASURE_OUTCOME) and completes the ten-stage ladder (AUDIT_AND_MONITOR) — so the
// trail and the receipt carry the SAME declared outcome, bound to the SAME proposal
// digest.
//
// The trust discipline (stacked on 12D-121/130/131/132, nothing new trusted):
//   * NO presented proposal is trusted — there is no proposal input at all. The intake
//     derives the CANDIDATE proposal from the instruction and the canonical tool/risk
//     constants of the scope's execution bridge (12D-130/131), re-derives its digest,
//     and requires that digest to appear in the workflow's hash-chained trail. A
//     proposal the trail never recorded can never bind evidence.
//   * The presented workflow is UNTRUSTED: its hash chain is re-verified (genesis-bound
//     metadata), and its stage must be exactly EXECUTE_MINIMUM_ACTION — the intake does
//     the measuring, so a workflow whose outcome was already measured can never be
//     re-measured into a second receipt.
//   * TRAIL ORDER: the trail must show a receipt-backed HUMAN_APPROVAL BEFORE the
//     EXECUTE_MINIMUM_ACTION event naming the actionId — an approval can never follow
//     the act it approves.
//   * The instruction binds the decision record CROSS-CONTRACT: a scaling instruction's
//     actionId is `scaling.exec.<planDigest-16>.<count>` and a failover instruction's is
//     `failover.exec.<planDigest-16>.<bps>` — composed by the 12D-130/131 bridges from
//     re-derived values only, so the actionId prefix must re-derive from the presented
//     decision record's planDigest. A receipt cannot bind an instruction from a
//     different proposal family.
//   * An action claim is temporally bounded: EXECUTED/FAILED evidence requires the
//     after observation to fall within the instruction's validity window — an outcome
//     observed after the instruction expired was never covered by it.
//   * One declared outcome per instruction: the intake refuses a second receipt for a
//     proposal digest it has already evidenced (the operator declares the outcome once;
//     separate evidence for execution and rollback stays in 12D-132's collector).
//   * The MEASURE_OUTCOME event records the REDACTED note — a secret can never ride
//     from the receipt path into the hash-chained trail.
//
// It PERMITS NOTHING: no provider call, no traffic movement, no production mutation,
// no merge, no deployment — the intake records declarations and closes ladders.

import {
  verifyAuditChain, deriveProposalDigest, recordMeasuredOutcome, recordAuditAndMonitor,
  type DecisionSafetyWorkflow, type ExecutionInstruction,
} from './agent-decision-safety-workflow';
import {
  DeclaredEvidenceCollector, redactDeclaredNote,
  type DeclaredEvidenceReceipt, type DeclaredEvidenceStatus, type EvidenceScope,
} from './declared-evidence-collector';
import { SCALING_EXECUTION_POLICY } from './scaling-execution-bridge';
import { FAILOVER_EXECUTION_POLICY } from './failover-execution-bridge';
import type { ScalingDecisionRecord } from './measured-horizontal-scaling';
import type { FailoverDecisionRecord } from './measured-regional-failover';

export const EVIDENCE_INTAKE_POLICY = Object.freeze({
  /** Canonical actionId prefixes composed by the 12D-130/131 execution bridges. */
  actionIdPrefixes: Object.freeze({ SCALING: 'scaling.exec.', FAILOVER: 'failover.exec.' }),
  /** Outcome → 12D-121 MEASURE_OUTCOME mapping. Rollback stays in 12D-132's collector. */
  outcomeMap: Object.freeze({
    PROPOSED: 'OBSERVED_ONLY',
    NOT_EXECUTED: 'OBSERVED_ONLY',
    UNVERIFIED: 'OBSERVED_ONLY',
    EXECUTED: 'EXECUTED_BY_OPERATOR',
    FAILED: 'FAILED',
  }) as Readonly<Record<Exclude<DeclaredEvidenceStatus, 'ROLLED_BACK'>, string>>,
});

export const EVIDENCE_INTAKE_GUARDRAILS = Object.freeze({
  noPresentedProposalIsTrusted_theCandidateIsDerivedAndTrailVerified: true,
  instructionsAreTrailVerifiedBeforeEvidence: true,
  approvalMustPrecedeTheActInTheTrail: true,
  actionIdMustReDeriveFromTheDecisionRecord: true,
  actionClaimsRequireTheInstructionValidityWindow: true,
  oneDeclaredOutcomePerInstruction: true,
  trailNotesCarryOnlyRedactedText: true,
  statusesAreDeclaredNeverInferred: true,
  permitsNoProviderCall: true,
  permitsNoTrafficMovement: true,
  permitsNoProductionMutation: true,
  permitsNoMergeOrDeployment: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export type IntakeStatus = Exclude<DeclaredEvidenceStatus, 'ROLLED_BACK'>;

export interface EvidenceIntakeRecorded {
  readonly kind: 'INSTRUCTION_EVIDENCE_RECORDED';
  /** The 12D-132 receipt, bound to the trail-verified instruction reference. */
  readonly receipt: Readonly<DeclaredEvidenceReceipt>;
  /** Composed from VERIFIED objects only: `${workflowId}/${actionId}`. */
  readonly instructionId: string;
  /** Re-derived from the canonical candidate proposal and matched against the trail. */
  readonly proposalDigest: string;
  /** The workflow after MEASURE_OUTCOME + AUDIT_AND_MONITOR — the ladder completed. */
  readonly workflow: Readonly<DecisionSafetyWorkflow>;
  readonly outcomeRecorded: string;
  readonly guardrails: Readonly<typeof EVIDENCE_INTAKE_GUARDRAILS>;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);
const isFrozenKind = (v: unknown, kind: string): boolean =>
  !!v && typeof v === 'object' && Object.isFrozen(v) && (v as { kind?: unknown }).kind === kind;

/**
 * The instruction-gated evidence intake, bound to ONE 12D-132 collector (which binds
 * ONE tenant/universe). Fail-closed on unverified trails, unrecorded proposals,
 * cross-contract bindings, expired action claims, and double declarations.
 */
export class DeclaredEvidenceIntake {
  readonly #collector: DeclaredEvidenceCollector;
  readonly #evidencedProposalDigests = new Set<string>();

  constructor(input: { collector: DeclaredEvidenceCollector }) {
    if (!input || !(input.collector instanceof DeclaredEvidenceCollector))
      throw new Error('evidence intake requires a DeclaredEvidenceCollector; fail closed');
    this.#collector = input.collector;
  }

  get collector(): DeclaredEvidenceCollector {
    return this.#collector;
  }

  /**
   * Record DECLARED outcome evidence for one trail-verified instruction, measure the
   * outcome on the workflow's own trail, and complete the ladder. The status is the
   * operator's declaration; nothing is inferred, executed, or moved.
   */
  recordInstructionOutcome(input: {
    tenantId: string;
    universeId: string;
    scope: EvidenceScope;
    runId: string;
    sourceCommit: string;
    decisionId: string;
    decisionRecord: Readonly<ScalingDecisionRecord> | Readonly<FailoverDecisionRecord>;
    instruction: Readonly<ExecutionInstruction>;
    workflow: Readonly<DecisionSafetyWorkflow>;
    operatorReceiptSha256: string;
    status: IntakeStatus;
    before: Parameters<DeclaredEvidenceCollector['recordOutcomeEvidence']>[0]['before'];
    after: Parameters<DeclaredEvidenceCollector['recordOutcomeEvidence']>[0]['after'];
    note?: string;
    recordedAtMs: number;
  }): Readonly<EvidenceIntakeRecorded> {
    if (!input || typeof input !== 'object')
      throw new Error('intake input required; fail closed');
    const statusKey = input.status as string;
    if (!Object.prototype.hasOwnProperty.call(EVIDENCE_INTAKE_POLICY.outcomeMap, statusKey)
      || statusKey === 'ROLLED_BACK')
      throw new Error('intake status unknown; rollback evidence goes to the collector directly; fail closed');
    if (!safeInt(input.recordedAtMs) || input.recordedAtMs <= 0)
      throw new Error('recording timestamp invalid; fail closed');

    // The presented workflow is UNTRUSTED: chain re-verified (genesis-bound metadata),
    // and the stage must be exactly EXECUTE_MINIMUM_ACTION — the intake performs the
    // measuring, so an already-measured workflow can never produce a second receipt.
    if (!isFrozenKind(input.workflow, 'DECISION_SAFETY_WORKFLOW'))
      throw new Error('not a frozen DECISION_SAFETY_WORKFLOW; fail closed');
    const workflow = input.workflow as Readonly<DecisionSafetyWorkflow>;
    verifyAuditChain(workflow);
    if (workflow.stage !== 'EXECUTE_MINIMUM_ACTION')
      throw new Error('outcome evidence requires a workflow at exactly the EXECUTE_MINIMUM_ACTION stage; fail closed');

    // The presented instruction is UNTRUSTED and must belong to this workflow.
    if (!isFrozenKind(input.instruction, 'EXECUTION_INSTRUCTION'))
      throw new Error('not a frozen EXECUTION_INSTRUCTION; fail closed');
    const instruction = input.instruction as Readonly<ExecutionInstruction>;
    if (instruction.workflowId !== workflow.workflowId)
      throw new Error('instruction does not belong to this workflow; fail closed');

    // The presented decision record is UNTRUSTED: validate its identity BEFORE anything
    // is derived from it — the scope's record kind must match (a receipt cannot bind
    // another proposal family at the record level).
    if (!input.decisionRecord || !Object.isFrozen(input.decisionRecord))
      throw new Error('not a frozen decision record; fail closed');
    const record = input.decisionRecord as { kind: string; planDigest: string };
    if (input.scope === 'SCALING' && record.kind !== 'SCALING_DECISION_RECORD')
      throw new Error('a scaling evidence intake cannot bind a non-scaling decision record; fail closed');
    if (input.scope === 'FAILOVER' && record.kind !== 'FAILOVER_DECISION_RECORD')
      throw new Error('a failover evidence intake cannot bind a non-failover decision record; fail closed');

    // NO presented proposal: the candidate proposal is derived from the instruction and
    // the scope's CANONICAL tool/risk constants (the 12D-130/131 bridges pin these), and
    // its digest must appear in the hash-chained trail — a proposal the trail never
    // recorded can never bind evidence, whatever an instruction claims.
    const canonical = input.scope === 'SCALING' ? SCALING_EXECUTION_POLICY : FAILOVER_EXECUTION_POLICY;
    const candidate = {
      workflowId: workflow.workflowId,
      actionId: instruction.actionId,
      description: instruction.minimumAction,
      toolId: canonical.executionToolId,
      riskClass: canonical.requiredRiskClass,
    };
    const digest = deriveProposalDigest(candidate);
    if (!workflow.events.some((e) => e.detail.includes(`proposal digest ${digest}`)))
      throw new Error('the instruction does not re-derive a proposal this workflow trail recorded; fail closed');

    // TRAIL ORDER: a receipt-backed HUMAN_APPROVAL must appear BEFORE the
    // EXECUTE_MINIMUM_ACTION event naming this actionId — an approval can never follow
    // the act it approves.
    const approvalIdx = workflow.events.findIndex((e) => e.stage === 'HUMAN_APPROVAL'
      && e.detail.includes('with operator receipt'));
    const executeIdx = workflow.events.findIndex((e) => e.stage === 'EXECUTE_MINIMUM_ACTION'
      && e.detail.includes(`for ${instruction.actionId}`));
    if (approvalIdx < 0 || executeIdx < 0 || approvalIdx > executeIdx)
      throw new Error('the trail does not show receipt-backed approval preceding the instruction; fail closed');

    // CROSS-CONTRACT BINDING: the actionId prefix must re-derive from the presented
    // decision record's planDigest (the 12D-130/131 bridges compose actionIds from
    // re-derived values only) — a receipt cannot bind another proposal family.
    const prefix = EVIDENCE_INTAKE_POLICY.actionIdPrefixes[input.scope];
    if (!instruction.actionId.startsWith(`${prefix}${record.planDigest.slice(0, 16)}.`))
      throw new Error(`the instruction actionId does not re-derive from the decision record (expected ${prefix}<planDigest-16>.); fail closed`);

    // Scope is fail-closed, inherited from the bound collector.
    const scope = this.#collector.scope;
    if (input.tenantId !== scope.tenantId || input.universeId !== scope.universeId)
      throw new Error('evidence is outside this intake tenant/universe scope; fail closed');

    // An action claim is temporally bounded: the after observation must fall within the
    // instruction's validity window — an outcome observed after expiry was never
    // covered by the instruction. No-action statuses carry no such requirement.
    if ((input.status === 'EXECUTED' || input.status === 'FAILED')
      && input.after.observedAtMs > instruction.validUntilMs)
      throw new Error('the claimed outcome was observed after the instruction expired; it was never covered by it; fail closed');

    // One declared outcome per instruction: a proposal digest already evidenced in this
    // intake can never be evidenced again (the collector still dedupes digests and
    // observation ids; this gate refuses DIFFERENT receipts about the SAME instruction).
    if (this.#evidencedProposalDigests.has(digest))
      throw new Error('this instruction already has a declared outcome receipt; one declared outcome per instruction; fail closed');

    // The trail note is the REDACTED text (or none) — a secret can never ride from the
    // receipt path into the hash-chained trail. Deterministic: the receipt redacts the
    // same input note the same way, so trail and receipt carry identical text.
    const trailNote = input.note === undefined ? undefined : redactDeclaredNote(input.note).redacted;
    const outcomeRecorded = EVIDENCE_INTAKE_POLICY.outcomeMap[input.status as Exclude<IntakeStatus, never>];

    // TRAIL FIRST: measure the outcome on the workflow (the trail is the authority; if
    // the receipt below is refused, the trail honestly carries a declared outcome with
    // no evidence receipt — never the reverse: a receipt whose trail never measured).
    const measured = recordMeasuredOutcome(workflow, {
      outcome: outcomeRecorded as 'EXECUTED_BY_OPERATOR' | 'FAILED' | 'OBSERVED_ONLY',
      measuredAtMs: input.recordedAtMs,
      note: trailNote,
    });
    const audited = recordAuditAndMonitor(measured, { auditedAtMs: input.recordedAtMs });

    const receipt = this.#collector.recordOutcomeEvidence({
      tenantId: input.tenantId,
      universeId: input.universeId,
      scope: input.scope,
      runId: input.runId,
      sourceCommit: input.sourceCommit,
      decisionId: input.decisionId,
      decisionRecord: input.decisionRecord,
      instructionId: `${workflow.workflowId}/${instruction.actionId}`,
      operatorReceiptSha256: input.operatorReceiptSha256,
      status: input.status,
      before: input.before,
      after: input.after,
      note: input.note,
      recordedAtMs: input.recordedAtMs,
    });
    this.#evidencedProposalDigests.add(digest);
    return Object.freeze({
      kind: 'INSTRUCTION_EVIDENCE_RECORDED' as const,
      receipt,
      instructionId: `${workflow.workflowId}/${instruction.actionId}`,
      proposalDigest: digest,
      workflow: audited,
      outcomeRecorded,
      guardrails: EVIDENCE_INTAKE_GUARDRAILS,
      humanDecision: 'REQUIRED' as const,
      learningPromoted: false as const,
      modelCalls: 0 as const,
      remoteCalls: 0 as const,
      billionUsersProven: false as const,
      automaticRecovery: false as const,
    });
  }
}