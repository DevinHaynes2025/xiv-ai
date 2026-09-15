// 12D-130 — Scaling-plan EXECUTION-INSTRUCTION bridge (the adoption layer 12D-129's
// decision records name).
//
// 12D-129's scaling decision records carry `requiresDecisionSafetyWorkflowBeforeAnyAction:
// true` — a REQUIREMENT, never a past-tense claim. This module is the separately
// reviewed layer that performs that handoff: it takes a recorded ACCEPTED decision and
// drives the 12D-121 gate ladder (IDENTITY_AND_POLICY → … → EXECUTE_MINIMUM_ACTION)
// for exactly one bounded database-provisioning proposal, emitting a
// 12D-121 EXECUTION_INSTRUCTION with `executedByThisRuntime: false`.
//
// Trust discipline (the 12D-124→129 lessons, applied at this boundary):
//   * The presented decision record is UNTRUSTED. The bridge re-composes the plan from
//     the declared provenance and RE-RECORDS the decision through 12D-129's own
//     receipt-gated, provenance-verified contract; a presented record that does not
//     re-derive EXACTLY is refused before anything is opened — a forged record can no
//     more obtain an execution instruction here than a forged plan could obtain a
//     decision record in 12D-128.
//   * A DECLINED_BY_HUMAN record is a final state: no instruction can ever be issued
//     from a decline — that would manufacture authorization no human gave.
//   * The proposal's risk class is PINNED to PRODUCTION_CONFIGURATION and the tool to
//     the single canonical provisioning tool — the bridge never down-labels and never
//     widens: the purpose-built workflow identity carries exactly one approved tool.
//   * The execution grant is a SEPARATE human act: its operator receipt must differ
//     from the plan-approval receipt that produced the decision record — one receipt
//     authorizing two separate gates would collapse the separation the master plan
//     requires.
//   * Ordering: the execution grant cannot chronologically predate the human decision
//     it executes (the 12D-127/129 temporal rule, one layer up).
//
// It MATERIALIZES NOTHING: no database is provisioned, no data is moved, no provider
// is invoked. The emitted instruction is the operator's work order in a system outside
// this runtime; outcome recording (EXECUTED_BY_OPERATOR etc.) stays DECLARED in
// 12D-121's MEASURE_OUTCOME stage.
//
// Receipt custody (12D-235): both receipts MUST be registered in a 12D-233
// OperatorCustodyRegistry and are CONSUMED exactly once at issue time — the
// plan-approval receipt under `xiv.scaling.decision`, the execution grant under the
// execution tool id. The receipt-separation residual ("one receipt authorizing two
// gates") is now ENFORCED, not disclosed. The 12D-233 process-local/not-durable and
// registration-is-not-issuance-proof disclosures stand verbatim.

import {
  DECISION_SAFETY_POLICY, authorizeMinimumAction, openDecisionWorkflow,
  proposeGovernedAction, type AgentIdentity, type DecisionSafetyWorkflow,
  type ExecutionInstruction,
} from './agent-decision-safety-workflow';
import {
  planMeasuredHorizontalScaling, recordScalingDecision,
  type MeasuredScalingPlan, type ScalingDecisionRecord, type ScalingPlanProvenance,
} from './measured-horizontal-scaling';
import { OperatorCustodyRegistry } from './operator-custody-registry';

export const SCALING_EXECUTION_POLICY = Object.freeze({
  policyVersion: '12d-235-v1',
  /** The ONLY tool a scaling-execution workflow identity may carry. */
  executionToolId: 'xiv.database.provision',
  /** The custody purpose the plan-approval receipt is registered under. */
  planApprovalPurpose: 'xiv.scaling.decision',
  /** Provisioning databases is production configuration — always human-authorized. */
  requiredRiskClass: 'PRODUCTION_CONFIGURATION',
  /** This runtime advises; the workflow identity must be an ADVISE_ONLY agent. */
  requiredActionPolicy: 'ADVISE_ONLY',
  maxApprovedByIdChars: DECISION_SAFETY_POLICY.maxIdentityIdChars,
});

export const SCALING_EXECUTION_GUARDRAILS = Object.freeze({
  instructionRequiresAReDerivedDecisionRecord: true, // a presented record is never trusted
  declinedPlansAreFinalStates: true,
  riskClassPinnedToProductionConfiguration: true,
  singlePurposeWorkflowIdentity: true,
  executionGrantIsASeparateHumanAct: true,
  custodyEnforced: true, // 12D-235: both receipts consumed exactly once via 12D-233
  executesNothing: true,
  movesNoRows: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export interface ScalingExecutionIssued {
  readonly kind: 'SCALING_EXECUTION_ISSUED';
  readonly workflowId: string;
  readonly actionId: string;
  readonly planDigest: string;
  readonly proposedNewDatabaseCount: number;
  readonly minimumAction: string;
  readonly instruction: Readonly<ExecutionInstruction>;
  readonly workflow: Readonly<DecisionSafetyWorkflow>;
  readonly verifiedDecisionRecord: Readonly<ScalingDecisionRecord>;
  readonly guardrails: Readonly<typeof SCALING_EXECUTION_GUARDRAILS>;
  /** 12D-235: both receipts were custody-authenticated and consumed exactly once. */
  readonly custodyEnforced: true;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly databasesProvisioned: 0;
  readonly rowsMoved: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

/** Records are fixed-shape primitives: canonical JSON equality is exact equality. */
const sameRecord = (a: Readonly<ScalingDecisionRecord>, b: Readonly<ScalingDecisionRecord>): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Issue the bounded EXECUTION_INSTRUCTION for an ACCEPTED 12D-129 scaling decision.
 * Pure: reads the presented record and its provenance, re-derives both fail-closed,
 * drives the 12D-121 ladder, and returns frozen packets. Executes nothing.
 */
export function issueScalingExecutionInstruction(input: {
  decisionRecord: Readonly<ScalingDecisionRecord>;
  decisionProvenance: ScalingPlanProvenance;
  executionGrant: { operatorReceiptSha256: string; approvedBy: string };
  /** 12D-233 custody registry — REQUIRED (12D-235): both receipts are consumed exactly once here. */
  custody: OperatorCustodyRegistry;
  identity: AgentIdentity;
  nowMs: number;
  timeLimitMs: number;
}): Readonly<ScalingExecutionIssued> {
  if (!input || typeof input !== 'object')
    throw new Error('scaling execution input required; fail closed');
  const presented = input.decisionRecord as ScalingDecisionRecord | null;
  if (!presented || presented.kind !== 'SCALING_DECISION_RECORD' || !Object.isFrozen(presented))
    throw new Error('not a frozen SCALING_DECISION_RECORD; fail closed');
  if (!safeInt(input.nowMs) || input.nowMs <= 0)
    throw new Error('execution reference time invalid; fail closed');
  if (!safeInt(input.timeLimitMs))
    throw new Error('workflow time limit invalid; fail closed');
  // Ordering: an execution grant cannot predate the human decision it executes.
  if (input.nowMs < presented.decidedAtMs)
    throw new Error('the execution grant predates the human decision; fail closed');

  // RE-DERIVATION (the 12D-128 discipline, one layer up): the plan is re-composed from
  // the declared provenance and the decision RE-RECORDED through 12D-129's own
  // receipt-gated contract; the presented record must match EXACTLY.
  const v = input.decisionProvenance as ScalingPlanProvenance | null;
  if (!v || typeof v !== 'object')
    throw new Error('decision provenance required; fail closed');
  const recomposed: MeasuredScalingPlan = planMeasuredHorizontalScaling(v.policy, v.request, v.nowMs, v.evidence);
  const reDerived = recordScalingDecision(recomposed, {
    decision: presented.decision,
    operatorReceiptSha256: presented.operatorReceiptSha256,
    decidedBy: presented.decidedBy,
    decidedAtMs: presented.decidedAtMs,
  }, v);
  if (!sameRecord(reDerived, presented))
    throw new Error('the presented decision record does not re-derive from its provenance; fail closed');
  if (recomposed.disposition !== 'HUMAN_APPROVAL_REQUIRED')
    throw new Error('the re-composed scaling plan is not an eligible plan; fail closed');
  // A decline is a final state — no instruction can ever be manufactured from one.
  if (presented.decision !== 'ACCEPTED_FOR_HUMAN_REVIEW')
    throw new Error('only an ACCEPTED_FOR_HUMAN_REVIEW decision can receive an execution instruction; a decline is final; fail closed');

  // Identity gates: an ADVISE_ONLY agent whose approved scope is EXACTLY the canonical
  // provisioning tool — a purpose-built workflow never carries a wider tool scope.
  const identity = input.identity as AgentIdentity | null;
  if (!identity || !Array.isArray(identity.approvedTools))
    throw new Error('workflow identity required; fail closed');
  if (identity.actionPolicy !== SCALING_EXECUTION_POLICY.requiredActionPolicy)
    throw new Error(`a scaling-execution workflow identity must be ${SCALING_EXECUTION_POLICY.requiredActionPolicy}; fail closed`);
  if (identity.approvedTools.length !== 1
    || identity.approvedTools[0] !== SCALING_EXECUTION_POLICY.executionToolId)
    throw new Error(`a scaling-execution workflow identity carries exactly one approved tool: ${SCALING_EXECUTION_POLICY.executionToolId}; fail closed`);

  // The execution grant is a SEPARATE human act: its receipt cannot reuse the
  // plan-approval receipt — one receipt authorizing two gates collapses the separation
  // the decision-safety ladder exists to keep.
  if (typeof input.executionGrant?.operatorReceiptSha256 !== 'string'
    || !/^[0-9a-f]{64}$/.test(input.executionGrant.operatorReceiptSha256))
    throw new Error('the execution grant operator receipt must be 64-hex sha256; fail closed');
  if (input.executionGrant?.operatorReceiptSha256 === presented.operatorReceiptSha256)
    throw new Error('the execution grant receipt must differ from the plan-approval receipt; execution is a separate human authorization; fail closed');

  // Custody enforcement (12D-233 via 12D-235): the registry is REQUIRED and BOTH
  // receipts are CONSUMED exactly once — a replayed, cross-purpose, or
  // already-consumed receipt refuses here. Consumption happens only AFTER every
  // validation gate above has passed, so a refused instruction burns neither
  // receipt; a FAILED INSTRUCTION after this point does burn them (fail-closed:
  // fresh receipts for every attempt).
  if (!(input.custody instanceof OperatorCustodyRegistry))
    throw new Error('the operator custody registry (12D-233) is required; fail closed');
  input.custody.authenticate({
    receiptSha256: presented.operatorReceiptSha256,
    purpose: SCALING_EXECUTION_POLICY.planApprovalPurpose,
    nowMs: input.nowMs,
  });
  input.custody.authenticate({
    receiptSha256: input.executionGrant.operatorReceiptSha256,
    purpose: SCALING_EXECUTION_POLICY.executionToolId,
    nowMs: input.nowMs,
  });

  const count = presented.proposedNewDatabaseCount;
  const planDigest = presented.planDigest;
  // The minimum action is composed by THIS module from re-derived values only — the
  // caller never authors the instruction text.
  const purpose = `Execute scaling plan ${planDigest}: provision ${count} new databases for ${v.request.tenantId}/${v.request.universeId} (post-plan fleet ${recomposed.postPlanFleetDatabaseCount}); requires decision-safety workflow before any action`;
  const minimumAction = `Provision ${count} empty database(s) as proposed by plan ${planDigest}; provision NOTHING else, move NO rows, invoke NO provider without a separate grant`;
  const actionId = `scaling.exec.${planDigest.slice(0, 16)}.${count}`;

  let workflow = openDecisionWorkflow({
    identity,
    purpose,
    nowMs: input.nowMs,
    timeLimitMs: input.timeLimitMs,
  });
  const proposed = proposeGovernedAction(workflow, {
    actionId,
    description: minimumAction,
    toolId: SCALING_EXECUTION_POLICY.executionToolId,
    riskClass: SCALING_EXECUTION_POLICY.requiredRiskClass,
    proposedAtMs: input.nowMs,
  });
  workflow = proposed.workflow;
  const authorized = authorizeMinimumAction(workflow, proposed.proposal, {
    operatorReceiptSha256: input.executionGrant.operatorReceiptSha256,
    approvedBy: input.executionGrant.approvedBy,
    nowMs: input.nowMs,
  });
  workflow = authorized.workflow;

  return Object.freeze({
    kind: 'SCALING_EXECUTION_ISSUED' as const,
    workflowId: workflow.workflowId,
    actionId,
    planDigest,
    proposedNewDatabaseCount: count,
    minimumAction,
    instruction: authorized.instruction,
    workflow,
    verifiedDecisionRecord: reDerived,
    guardrails: SCALING_EXECUTION_GUARDRAILS,
    custodyEnforced: true as const,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    databasesProvisioned: 0 as const,
    rowsMoved: 0 as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
}