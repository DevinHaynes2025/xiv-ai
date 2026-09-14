// 12D-131 — Failover-plan EXECUTION-INSTRUCTION bridge (the adoption layer 12D-127/128's
// decision records name — the failover sibling of 12D-130's scaling bridge).
//
// 12D-127/128's failover decision records carry
// `requiresDecisionSafetyWorkflowBeforeAnyAction: true` — a REQUIREMENT. This module
// performs that handoff: it takes a recorded ACCEPTED failover decision and drives the
// 12D-121 gate ladder for exactly one bounded CANARY traffic-shift proposal, emitting a
// 12D-121 EXECUTION_INSTRUCTION with `executedByThisRuntime: false`.
//
// Trust discipline — identical to the 12D-130 scaling bridge, applied to failover:
//   * The presented decision record is UNTRUSTED: the plan is re-composed from the
//     declared provenance and the decision RE-RECORDED through 12D-128's own
//     receipt-gated, provenance-verified contract; the presented record must match
//     EXACTLY (including its recordDigest — the 12D-130 self-binding) before anything
//     is opened.
//   * A DECLINED_BY_HUMAN record is a final state: no instruction can ever be issued
//     from a decline.
//   * The proposal's risk class is PINNED to PRODUCTION_CONFIGURATION and the tool to
//     the single canonical failover tool — the bridge never down-labels and never
//     widens: the purpose-built workflow identity is ADVISE_ONLY with exactly one
//     approved tool.
//   * The instruction is a CANARY-shift work order ONLY: it names the recorded
//     requestedTrafficBps (already bounded by the policy canary ceiling at plan time)
//     and forbids everything else. The minimumAction text is composed by THIS module
//     from re-derived values — the caller never authors instruction text.
//   * The execution grant is a SEPARATE human act: its receipt must differ from the
//     plan-approval receipt, and it cannot chronologically predate the decision it
//     executes.
//
// It MATERIALIZES NOTHING and MOVES NO TRAFFIC: `trafficMoved: false` and
// `authorizedTrafficBps: 0` remain structural; the emitted instruction is the
// operator's work order in a system outside this runtime.

import {
  authorizeMinimumAction, openDecisionWorkflow, proposeGovernedAction,
  type AgentIdentity, type DecisionSafetyWorkflow, type ExecutionInstruction,
} from './agent-decision-safety-workflow';
import {
  planMeasuredRegionalFailover, recordFailoverDecision,
  type FailoverDecisionRecord, type FailoverPlanProvenance,
  type MeasuredFailoverPlan,
} from './measured-regional-failover';

export const FAILOVER_EXECUTION_POLICY = Object.freeze({
  /** The ONLY tool a failover-execution workflow identity may carry. */
  executionToolId: 'xiv.traffic.failover',
  /** Traffic shifting is production configuration — always human-authorized. */
  requiredRiskClass: 'PRODUCTION_CONFIGURATION',
  /** This runtime advises; the workflow identity must be an ADVISE_ONLY agent. */
  requiredActionPolicy: 'ADVISE_ONLY',
  maxApprovedByIdChars: 128,
});

export const FAILOVER_EXECUTION_GUARDRAILS = Object.freeze({
  instructionRequiresAReDerivedDecisionRecord: true, // a presented record is never trusted
  declinedPlansAreFinalStates: true,
  riskClassPinnedToProductionConfiguration: true,
  singlePurposeWorkflowIdentity: true,
  canaryShiftOnly: true, // the instruction names the recorded canary bps and nothing else
  executionGrantIsASeparateHumanAct: true,
  executesNothing: true,
  movesNoTraffic: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export interface FailoverExecutionIssued {
  readonly kind: 'FAILOVER_EXECUTION_ISSUED';
  readonly workflowId: string;
  readonly actionId: string;
  readonly planDigest: string;
  readonly candidateRegionId: string;
  readonly requestedTrafficBps: number;
  readonly minimumAction: string;
  readonly instruction: Readonly<ExecutionInstruction>;
  readonly workflow: Readonly<DecisionSafetyWorkflow>;
  readonly verifiedDecisionRecord: Readonly<FailoverDecisionRecord>;
  readonly guardrails: Readonly<typeof FAILOVER_EXECUTION_GUARDRAILS>;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly trafficMoved: false;
  readonly authorizedTrafficBps: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

/** Records are fixed-shape primitives: canonical JSON equality is exact equality. */
const sameRecord = (a: Readonly<FailoverDecisionRecord>, b: Readonly<FailoverDecisionRecord>): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Issue the bounded CANARY-shift EXECUTION_INSTRUCTION for an ACCEPTED 12D-127/128
 * failover decision. Pure: reads the presented record and its provenance, re-derives
 * both fail-closed, drives the 12D-121 ladder, and returns frozen packets. Executes
 * nothing; moves no traffic.
 */
export function issueFailoverExecutionInstruction(input: {
  decisionRecord: Readonly<FailoverDecisionRecord>;
  decisionProvenance: FailoverPlanProvenance;
  executionGrant: { operatorReceiptSha256: string; approvedBy: string };
  identity: AgentIdentity;
  nowMs: number;
  timeLimitMs: number;
}): Readonly<FailoverExecutionIssued> {
  if (!input || typeof input !== 'object')
    throw new Error('failover execution input required; fail closed');
  const presented = input.decisionRecord as FailoverDecisionRecord | null;
  if (!presented || presented.kind !== 'FAILOVER_DECISION_RECORD' || !Object.isFrozen(presented))
    throw new Error('not a frozen FAILOVER_DECISION_RECORD; fail closed');
  if (!safeInt(input.nowMs) || input.nowMs <= 0)
    throw new Error('execution reference time invalid; fail closed');
  if (!safeInt(input.timeLimitMs))
    throw new Error('workflow time limit invalid; fail closed');
  // Ordering: an execution grant cannot predate the human decision it executes.
  if (input.nowMs < presented.decidedAtMs)
    throw new Error('the execution grant predates the human decision; fail closed');

  // RE-DERIVATION (the 12D-128 discipline, one layer up): the plan is re-composed from
  // the declared provenance and the decision RE-RECORDED through 12D-128's own
  // receipt-gated contract; the presented record must match EXACTLY — including its
  // recordDigest, so a post-hoc field swap fails closed (the 12D-130 discipline).
  const v = input.decisionProvenance as FailoverPlanProvenance | null;
  if (!v || typeof v !== 'object')
    throw new Error('decision provenance required; fail closed');
  const recomposed: MeasuredFailoverPlan = planMeasuredRegionalFailover(
    v.policy, v.request, v.nowMs, v.primary ?? null, v.secondary ?? null,
  );
  const reDerived = recordFailoverDecision(recomposed, {
    decision: presented.decision,
    operatorReceiptSha256: presented.operatorReceiptSha256,
    decidedBy: presented.decidedBy,
    decidedAtMs: presented.decidedAtMs,
  }, v);
  if (!sameRecord(reDerived, presented))
    throw new Error('the presented decision record does not re-derive from its provenance; fail closed');
  if (recomposed.disposition !== 'HUMAN_APPROVAL_REQUIRED')
    throw new Error('the re-composed failover plan is not an eligible plan; fail closed');
  // A decline is a final state — no instruction can ever be manufactured from one.
  if (presented.decision !== 'ACCEPTED_FOR_HUMAN_REVIEW')
    throw new Error('only an ACCEPTED_FOR_HUMAN_REVIEW decision can receive an execution instruction; a decline is final; fail closed');

  // Identity gates: an ADVISE_ONLY agent whose approved scope is EXACTLY the canonical
  // failover tool — a purpose-built workflow never carries a wider tool scope.
  const identity = input.identity as AgentIdentity | null;
  if (!identity || !Array.isArray(identity.approvedTools))
    throw new Error('workflow identity required; fail closed');
  if (identity.actionPolicy !== FAILOVER_EXECUTION_POLICY.requiredActionPolicy)
    throw new Error(`a failover-execution workflow identity must be ${FAILOVER_EXECUTION_POLICY.requiredActionPolicy}; fail closed`);
  if (identity.approvedTools.length !== 1
    || identity.approvedTools[0] !== FAILOVER_EXECUTION_POLICY.executionToolId)
    throw new Error(`a failover-execution workflow identity carries exactly one approved tool: ${FAILOVER_EXECUTION_POLICY.executionToolId}; fail closed`);

  // The execution grant is a SEPARATE human act: its receipt cannot reuse the
  // plan-approval receipt — one receipt authorizing two gates collapses the separation
  // the decision-safety ladder exists to keep.
  if (input.executionGrant?.operatorReceiptSha256 === presented.operatorReceiptSha256)
    throw new Error('the execution grant receipt must differ from the plan-approval receipt; execution is a separate human authorization; fail closed');

  const planDigest = presented.planDigest;
  const region = presented.candidateRegionId;
  const bps = presented.requestedTrafficBps;
  // The minimum action is composed by THIS module from re-derived values only — a
  // CANARY-shift work order naming the recorded bps and forbidding everything else.
  const purpose = `Execute failover plan ${planDigest}: shift ${bps} bps canary to ${region}; requires decision-safety workflow before any action`;
  const minimumAction = `Shift ${bps} bps (canary) of the planned shard traffic to ${region} as proposed by plan ${planDigest}; shift NO other traffic, move NO classified workload, invoke NO provider without a separate grant`;
  const actionId = `failover.exec.${planDigest.slice(0, 16)}.${bps}`;

  let workflow = openDecisionWorkflow({
    identity,
    purpose,
    nowMs: input.nowMs,
    timeLimitMs: input.timeLimitMs,
  });
  const proposed = proposeGovernedAction(workflow, {
    actionId,
    description: minimumAction,
    toolId: FAILOVER_EXECUTION_POLICY.executionToolId,
    riskClass: FAILOVER_EXECUTION_POLICY.requiredRiskClass,
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
    kind: 'FAILOVER_EXECUTION_ISSUED' as const,
    workflowId: workflow.workflowId,
    actionId,
    planDigest,
    candidateRegionId: region,
    requestedTrafficBps: bps,
    minimumAction,
    instruction: authorized.instruction,
    workflow,
    verifiedDecisionRecord: reDerived,
    guardrails: FAILOVER_EXECUTION_GUARDRAILS,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    trafficMoved: false as const,
    authorizedTrafficBps: 0 as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
}