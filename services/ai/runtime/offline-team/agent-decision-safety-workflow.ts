// 12D-121 — Agent Decision Safety WORKFLOW contract (XIV Twelve layer 09: AI Guardrails).
//
// The master plan (Investor Edition, "AI Agent Decision Safety Workflow") requires that no
// high-impact agent jumps directly from insight to irreversible action: recommendation,
// authorization and execution are SEPARATE stages, high-impact action classes use explicit
// policy gates and human authorization, and every step is auditable. This module is that
// ladder as a pure, fail-closed, receipt-gated stage machine:
//
//   USER/EVENT -> IDENTITY+POLICY -> AGENT PLANNER -> TOOL GATE -> PROPOSED ACTION ->
//   RISK CHECK -> HUMAN APPROVAL -> RE-AUTHORIZE -> EXECUTE MINIMUM ACTION ->
//   MEASURE OUTCOME -> AUDIT + MONITOR
//
// It MATERIALIZES NOTHING: the "execution" stage emits a bounded EXECUTION_INSTRUCTION
// with executedByThisRuntime: false — turning an instruction into a side effect is the
// operator's job in a separately reviewed adoption layer, exactly the 12D-119/12D-120
// pattern. The stage machine enforces transitions (one workflow authorizes ONE minimum
// action; stages cannot be skipped, replayed, or run out of order) and every workflow
// carries an append-only, hash-chained audit trail whose GENESIS binds the workflow's
// metadata (lifetime, purpose, identity, approved-tool scope) into the chain and whose
// events carry a proposal digest binding authorization to what was actually proposed; a
// tampered trail — or tampered metadata — fails closed and is never repaired.

import { createHash } from 'node:crypto';

export const DECISION_SAFETY_POLICY = Object.freeze({
  maxIdentityIdChars: 128,
  maxToolIdChars: 128,
  maxPurposeChars: 500,
  maxDescriptionChars: 2000,
  maxActionClasses: 8,
  maxEventsPerWorkflow: 64,
  minTimeLimitMs: 1_000,
  maxTimeLimitMs: 3_600_000,
  instructionValidityMs: 60_000,
  // High-impact action classes that ALWAYS require explicit human authorization,
  // regardless of the agent's action policy (master plan: payments, privileged access,
  // deletion, production configuration, employee actions, material financial decisions,
  // sensitive external communications).
  humanApprovalRequiredClasses: Object.freeze([
    'PAYMENT',
    'PRIVILEGED_ACCESS',
    'DELETION',
    'PRODUCTION_CONFIGURATION',
    'EMPLOYEE_ACTION',
    'MATERIAL_FINANCIAL',
    'SENSITIVE_EXTERNAL_COMMUNICATION',
  ]) as readonly string[],
  knownRiskClasses: Object.freeze([
    ...[
      'PAYMENT',
      'PRIVILEGED_ACCESS',
      'DELETION',
      'PRODUCTION_CONFIGURATION',
      'EMPLOYEE_ACTION',
      'MATERIAL_FINANCIAL',
      'SENSITIVE_EXTERNAL_COMMUNICATION',
    ],
    'LOW_RISK',
  ]) as readonly string[],
  knownActionPolicies: Object.freeze(['ADVISE_ONLY', 'BOUNDED_AUTOMATION']) as readonly string[],
  // Outcomes that may be recorded at MEASURE_OUTCOME — anything else fails closed.
  knownOutcomes: Object.freeze([
    'EXECUTED_BY_OPERATOR',
    'DECLINED_BY_HUMAN',
    'FAILED',
    'EXPIRED',
    'OBSERVED_ONLY',
  ]) as readonly string[],
  maxNoteChars: 500,
  workflowStages: Object.freeze([
    'IDENTITY_AND_POLICY',
    'AGENT_PLANNER',
    'TOOL_GATE',
    'PROPOSED_ACTION',
    'RISK_CHECK',
    'HUMAN_APPROVAL',
    'RE_AUTHORIZE',
    'EXECUTE_MINIMUM_ACTION',
    'MEASURE_OUTCOME',
    'AUDIT_AND_MONITOR',
  ]) as readonly string[],
});

export const DECISION_SAFETY_GUARDRAILS = Object.freeze({
  separatesRecommendationAuthorizationExecution: true,
  noInsightJumpsToIrreversibleAction: true,
  humanApprovalRequiresOperatorReceipt: true,
  executesNothing: true, // this runtime materializes no side effect, ever
  minimumActionOnly: true, // an authorized instruction is the MINIMUM viable action
  auditIsHashChained: true, // tamper-evident append-only event trail
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export const DECISION_SAFETY_CONSTITUTION = Object.freeze({
  humanDecision: 'REQUIRED' as const,
  learningPromoted: false as const,
  modelCalls: 0 as const,
  remoteCalls: 0 as const,
  realActionsExecuted: 0 as const,
  automaticRecovery: false as const,
});

export interface AgentIdentity {
  readonly identityId: string;
  /** Approved tool ids — the only tools the TOOL GATE will ever accept. */
  readonly approvedTools: readonly string[];
  /** Declared data boundaries (names only; no data ever flows through this contract). */
  readonly dataBoundaries: readonly string[];
  readonly actionPolicy: 'ADVISE_ONLY' | 'BOUNDED_AUTOMATION';
}

export interface DecisionSafetyEvent {
  readonly seq: number;
  readonly stage: string;
  readonly atMs: number;
  readonly detail: string;
  /** sha256 over (seed + prevHash + seq + stage + atMs + detail) — tamper-evident chain. */
  readonly hash: string;
}

export interface DecisionSafetyWorkflow {
  readonly kind: 'DECISION_SAFETY_WORKFLOW';
  readonly workflowId: string;
  readonly identity: Readonly<AgentIdentity>;
  readonly purpose: string;
  readonly stage: string;
  readonly openedAtMs: number;
  readonly expiresAtMs: number;
  readonly events: readonly Readonly<DecisionSafetyEvent>[];
  readonly guardrails: Readonly<typeof DECISION_SAFETY_GUARDRAILS>;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly realActionsExecuted: 0;
  readonly automaticRecovery: false;
}

export interface ActionProposal {
  readonly kind: 'GOVERNED_ACTION_PROPOSAL';
  readonly workflowId: string;
  readonly actionId: string;
  readonly description: string;
  readonly toolId: string;
  readonly riskClass: string;
  readonly humanDecision: 'REQUIRED';
  readonly automaticRecovery: false;
  readonly productionExecutionAllowed: false;
}

export interface ExecutionInstruction {
  readonly kind: 'EXECUTION_INSTRUCTION';
  readonly workflowId: string;
  readonly actionId: string;
  /** The MINIMUM viable action — never a batch, never an escalation of the proposal. */
  readonly minimumAction: string;
  readonly executedByThisRuntime: false;
  readonly productionExecutionAllowed: false;
  readonly validUntilMs: number;
  readonly humanDecision: 'REQUIRED';
  readonly automaticRecovery: false;
}

const hex64 = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const id = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.length >= 1 && v.length <= max && /^[A-Za-z0-9_.:@-]+$/.test(v);
const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

/**
 * The GENESIS hash binds the workflow's metadata (id, lifetime, purpose, identity —
 * including the exact approved-tool scope) into the chain: event 1 is chained to it, so
 * tampering with ANY metadata field — a longer time limit, a widened tool scope, a flipped
 * action policy — breaks event 1's hash and fails closed. Metadata is never free-floating.
 */
type ChainBoundMetadata = Readonly<
  Pick<DecisionSafetyWorkflow, 'workflowId' | 'openedAtMs' | 'expiresAtMs' | 'purpose' | 'identity'>
>;
const genesisHash = (w: ChainBoundMetadata): string => sha256(
  `${w.workflowId}|${w.openedAtMs}|${w.expiresAtMs}|${w.purpose}`
  + `|${w.identity.identityId}|${w.identity.actionPolicy}`
  + `|${w.identity.approvedTools.join(',')}|${w.identity.dataBoundaries.join(',')}`,
);

/** The proposal digest binds an EXECUTION_INSTRUCTION to the proposal the trail recorded. */
const proposalDigest = (p: {
  workflowId: string; actionId: string; toolId: string; riskClass: string; description: string;
}): string => sha256(`${p.workflowId}|${p.actionId}|${p.toolId}|${p.riskClass}|${p.description}`);

const describe = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.trim().length >= 1 && v.length <= max;

function assertIdentity(identity: unknown): asserts identity is AgentIdentity {
  const i = identity as AgentIdentity | null;
  if (!i || !id(i.identityId, DECISION_SAFETY_POLICY.maxIdentityIdChars))
    throw new Error('agent identity invalid; fail closed');
  if (!Array.isArray(i.approvedTools) || i.approvedTools.length === 0
    || !i.approvedTools.every((t) => id(t, DECISION_SAFETY_POLICY.maxToolIdChars)))
    throw new Error('agent identity must carry a non-empty list of approved tools; fail closed');
  if (new Set(i.approvedTools).size !== i.approvedTools.length)
    throw new Error('approved tools must be distinct; fail closed');
  if (!Array.isArray(i.dataBoundaries)
    || !i.dataBoundaries.every((b) => id(b, DECISION_SAFETY_POLICY.maxToolIdChars)))
    throw new Error('agent data boundaries invalid; fail closed');
  if (!i.actionPolicy || !DECISION_SAFETY_POLICY.knownActionPolicies.includes(i.actionPolicy))
    throw new Error('agent action policy unknown; fail closed');
}

function appendEvent(
  workflow: Readonly<DecisionSafetyWorkflow>,
  stage: string,
  atMs: number,
  detail: string,
): DecisionSafetyWorkflow {
  if (!DECISION_SAFETY_POLICY.workflowStages.includes(stage))
    throw new Error(`unknown workflow stage ${stage}; fail closed`);
  if (!safeInt(atMs) || atMs < workflow.openedAtMs)
    throw new Error('event timestamp predates the workflow; fail closed');
  const last = workflow.events[workflow.events.length - 1];
  if (last && atMs < last.atMs)
    throw new Error('event timestamp moves backwards; fail closed');
  if (workflow.events.length >= DECISION_SAFETY_POLICY.maxEventsPerWorkflow)
    throw new Error('workflow event capacity exhausted; open a new workflow; fail closed');
  const prev = workflow.events[workflow.events.length - 1];
  const seq = workflow.events.length + 1;
  // The genesis event is chained to the workflow METADATA (genesisHash), not just its id.
  const hash = sha256(
    `${workflow.workflowId}|${prev ? prev.hash : genesisHash(workflow)}|${seq}|${stage}|${atMs}|${detail}`,
  );
  return Object.freeze({
    ...workflow,
    stage,
    events: Object.freeze([...workflow.events, Object.freeze({ seq, stage, atMs, detail, hash })]),
  });
}

/**
 * Open a decision-safety workflow: the IDENTITY_AND_POLICY gate. Fails closed unless the
 * agent identity carries an explicit approved-tool scope, data boundaries and a known
 * action policy (least-privilege agents, master plan: scoped identity, approved tools,
 * data boundaries, budget, time limit, action policy).
 */
export function openDecisionWorkflow(input: {
  identity: AgentIdentity;
  purpose: string;
  nowMs: number;
  timeLimitMs: number;
}): Readonly<DecisionSafetyWorkflow> {
  assertIdentity(input?.identity);
  if (!describe(input.purpose, DECISION_SAFETY_POLICY.maxPurposeChars))
    throw new Error('workflow purpose required; fail closed');
  if (!safeInt(input.nowMs)) throw new Error('timestamp required; fail closed');
  if (!safeInt(input.timeLimitMs) || input.timeLimitMs < DECISION_SAFETY_POLICY.minTimeLimitMs
    || input.timeLimitMs > DECISION_SAFETY_POLICY.maxTimeLimitMs)
    throw new Error('time limit outside policy; fail closed');
  const workflowId = sha256(`${input.identity.identityId}|${input.purpose}|${input.nowMs}`);
  const base: DecisionSafetyWorkflow = Object.freeze({
    kind: 'DECISION_SAFETY_WORKFLOW',
    workflowId,
    // Deep-copy and freeze the tool scope: the caller's arrays are shared references, and
    // the TOOL GATE reads THIS copy — pushing a tool into the caller's array after
    // admission can never widen the admitted scope (and the scope's exact content is
    // committed to the chain via genesisHash).
    identity: Object.freeze({
      ...input.identity,
      approvedTools: Object.freeze([...input.identity.approvedTools]),
      dataBoundaries: Object.freeze([...input.identity.dataBoundaries]),
    }),
    purpose: input.purpose,
    stage: 'IDENTITY_AND_POLICY',
    openedAtMs: input.nowMs,
    expiresAtMs: input.nowMs + input.timeLimitMs,
    events: Object.freeze([]),
    guardrails: DECISION_SAFETY_GUARDRAILS,
    ...DECISION_SAFETY_CONSTITUTION,
  });
  return appendEvent(base, 'IDENTITY_AND_POLICY', input.nowMs, `identity ${input.identity.identityId} admitted under policy ${input.identity.actionPolicy}`);
}

function assertLiveWorkflow(workflow: Readonly<DecisionSafetyWorkflow>, nowMs: number): void {
  if (!workflow || workflow.kind !== 'DECISION_SAFETY_WORKFLOW' || !Object.isFrozen(workflow))
    throw new Error('not a frozen DECISION_SAFETY_WORKFLOW; fail closed');
  if (!safeInt(nowMs) || nowMs >= workflow.expiresAtMs)
    throw new Error('workflow time limit exhausted; open a new workflow; fail closed');
  verifyAuditChain(workflow);
}

/**
 * AGENT PLANNER -> TOOL GATE -> PROPOSED ACTION -> RISK CHECK. Fails closed if the
 * planner names a tool outside the identity's approved scope, if the risk class is
 * unknown, or if the workflow has expired. A proposal NEVER authorizes anything.
 * The stage machine enforces transitions: a proposal may only be planned on a freshly
 * opened workflow (one workflow authorizes ONE minimum action), and the proposal's
 * digest is committed to the hash-chained trail so authorization can be bound to what
 * was actually proposed — a forged or re-labeled proposal never matches.
 */
export function proposeGovernedAction(
  workflow: Readonly<DecisionSafetyWorkflow>,
  input: { actionId: string; description: string; toolId: string; riskClass: string; proposedAtMs: number },
): { workflow: Readonly<DecisionSafetyWorkflow>; proposal: Readonly<ActionProposal> } {
  assertLiveWorkflow(workflow, input?.proposedAtMs);
  if (workflow.stage !== 'IDENTITY_AND_POLICY')
    throw new Error('a proposal may only be planned on a freshly opened workflow; open a new workflow; fail closed');
  if (!id(input.actionId, DECISION_SAFETY_POLICY.maxToolIdChars)
    || !describe(input.description, DECISION_SAFETY_POLICY.maxDescriptionChars))
    throw new Error('action proposal invalid; fail closed');
  // TOOL GATE: only an explicitly approved tool may appear in a proposal.
  if (!workflow.identity.approvedTools.includes(input.toolId))
    throw new Error(`tool ${input.toolId} is outside the agent's approved scope; fail closed`);
  if (!DECISION_SAFETY_POLICY.knownRiskClasses.includes(input.riskClass))
    throw new Error('unknown risk class; fail closed');
  const digest = proposalDigest({
    workflowId: workflow.workflowId,
    actionId: input.actionId,
    toolId: input.toolId,
    riskClass: input.riskClass,
    description: input.description,
  });
  let next = appendEvent(workflow, 'AGENT_PLANNER', input.proposedAtMs, `proposed ${input.actionId}`);
  next = appendEvent(next, 'TOOL_GATE', input.proposedAtMs, `tool ${input.toolId} passed the approved-scope gate`);
  next = appendEvent(next, 'PROPOSED_ACTION', input.proposedAtMs, `action ${input.actionId} recorded as a proposal only (proposal digest ${digest})`);
  next = appendEvent(next, 'RISK_CHECK', input.proposedAtMs, `risk class ${input.riskClass} (proposal digest ${digest})`);
  const proposal: Readonly<ActionProposal> = Object.freeze({
    kind: 'GOVERNED_ACTION_PROPOSAL' as const,
    workflowId: workflow.workflowId,
    actionId: input.actionId,
    description: input.description,
    toolId: input.toolId,
    riskClass: input.riskClass,
    humanDecision: 'REQUIRED' as const,
    automaticRecovery: false as const,
    productionExecutionAllowed: false as const,
  });
  return { workflow: next, proposal };
}

/**
 * HUMAN APPROVAL -> RE-AUTHORIZE -> EXECUTE MINIMUM ACTION. High-impact risk classes
 * (and every ADVISE_ONLY agent) require a 64-hex sha256 operator receipt — the same
 * receipt discipline as 12D-119 adoption. Re-authorization re-checks liveness and the
 * audit chain immediately before the instruction is issued. The "execution" emits a
 * bounded instruction with executedByThisRuntime: false and productionExecutionAllowed:
 * false — this runtime materializes no side effect.
 */
export function authorizeMinimumAction(
  workflow: Readonly<DecisionSafetyWorkflow>,
  proposal: Readonly<ActionProposal>,
  input: { operatorReceiptSha256: string; approvedBy: string; nowMs: number },
): { workflow: Readonly<DecisionSafetyWorkflow>; instruction: Readonly<ExecutionInstruction> } {
  assertLiveWorkflow(workflow, input?.nowMs);
  if (!proposal || proposal.kind !== 'GOVERNED_ACTION_PROPOSAL' || proposal.workflowId !== workflow.workflowId)
    throw new Error('proposal does not belong to this workflow; fail closed');
  // Stage machine: the ladder cannot be skipped or replayed — authorization requires a
  // risk-checked proposal at exactly the RISK_CHECK stage (no authorize on a fresh
  // workflow, no double instruction, no authorize after an outcome was recorded).
  if (workflow.stage !== 'RISK_CHECK')
    throw new Error('authorization requires a risk-checked proposal at the RISK_CHECK stage; fail closed');
  // TRAIL BINDING: the caller's proposal object is untrusted. The receipt gate and the
  // instruction are derived from the proposal ONLY after its digest matches a
  // PROPOSED_ACTION/RISK_CHECK event this workflow's hash-chained trail actually
  // recorded — a forged proposal (e.g. a PAYMENT re-labeled LOW_RISK) never matches.
  const digest = proposalDigest({
    workflowId: proposal.workflowId,
    actionId: proposal.actionId,
    toolId: proposal.toolId,
    riskClass: proposal.riskClass,
    description: proposal.description,
  });
  if (!workflow.events.some((e) => e.detail.includes(`proposal digest ${digest}`)))
    throw new Error('proposal does not match the action recorded in this workflow; fail closed');
  if (!id(input.approvedBy, DECISION_SAFETY_POLICY.maxIdentityIdChars))
    throw new Error('approver identity invalid; fail closed');
  const needsReceipt = DECISION_SAFETY_POLICY.humanApprovalRequiredClasses.includes(proposal.riskClass)
    || workflow.identity.actionPolicy === 'ADVISE_ONLY';
  if (needsReceipt && !hex64(input.operatorReceiptSha256))
    throw new Error('human approval requires a 64-hex sha256 operator receipt; fail closed');
  if (!needsReceipt && input.operatorReceiptSha256 != null && !hex64(input.operatorReceiptSha256))
    throw new Error('operator receipt malformed; fail closed');
  // RE-AUTHORIZE: the gate ladder requires a fresh check immediately before execution.
  let next = appendEvent(workflow, 'HUMAN_APPROVAL', input.nowMs,
    needsReceipt ? `approved by ${input.approvedBy} with operator receipt` : `policy-delegated approval by ${input.approvedBy} (tightly bounded low-risk automation)`);
  next = appendEvent(next, 'RE_AUTHORIZE', input.nowMs, 'liveness and audit chain re-verified immediately before execution');
  const validUntilMs = Math.min(input.nowMs + DECISION_SAFETY_POLICY.instructionValidityMs, workflow.expiresAtMs);
  const instruction: Readonly<ExecutionInstruction> = Object.freeze({
    kind: 'EXECUTION_INSTRUCTION' as const,
    workflowId: workflow.workflowId,
    actionId: proposal.actionId,
    minimumAction: proposal.description,
    executedByThisRuntime: false as const,
    productionExecutionAllowed: false as const,
    validUntilMs,
    humanDecision: 'REQUIRED' as const,
    automaticRecovery: false as const,
  });
  next = appendEvent(next, 'EXECUTE_MINIMUM_ACTION', input.nowMs, `issued minimum-action instruction for ${proposal.actionId}; runtime executed nothing`);
  return { workflow: next, instruction };
}

/**
 * MEASURE OUTCOME. The outcome is DECLARED by the caller and recorded verbatim — this
 * contract never invents, infers, or promotes an outcome into learning.
 */
export function recordMeasuredOutcome(
  workflow: Readonly<DecisionSafetyWorkflow>,
  input: { outcome: 'EXECUTED_BY_OPERATOR' | 'DECLINED_BY_HUMAN' | 'FAILED' | 'EXPIRED' | 'OBSERVED_ONLY'; measuredAtMs: number; note?: string },
): Readonly<DecisionSafetyWorkflow> {
  assertLiveWorkflow(workflow, input?.measuredAtMs);
  if (workflow.stage !== 'EXECUTE_MINIMUM_ACTION')
    throw new Error('an outcome can only be measured after EXECUTE_MINIMUM_ACTION; fail closed');
  // The declared union is RUNTIME-enforced: any value outside the known outcomes fails
  // closed instead of being hashed into the audit trail as "evidence".
  if (!DECISION_SAFETY_POLICY.knownOutcomes.includes(input.outcome))
    throw new Error('measured outcome is not a declared outcome; fail closed');
  if (input.note !== undefined && !describe(input.note, DECISION_SAFETY_POLICY.maxNoteChars))
    throw new Error('outcome note invalid; fail closed');
  const note = input.note ? ` — ${input.note}` : '';
  return appendEvent(workflow, 'MEASURE_OUTCOME', input.measuredAtMs, `${input.outcome}${note}`);
}

/**
 * AUDIT + MONITOR — the ladder's terminal stage. Fails closed unless the workflow has
 * reached MEASURE_OUTCOME and its hash chain (metadata bound) verifies; then records the
 * audit event itself, so a completed workflow's trail evidences every one of the ten
 * stages. `auditTrail` remains read-only verification; THIS is the recorded step.
 */
export function recordAuditAndMonitor(
  workflow: Readonly<DecisionSafetyWorkflow>,
  input: { auditedAtMs: number },
): Readonly<DecisionSafetyWorkflow> {
  assertLiveWorkflow(workflow, input?.auditedAtMs);
  if (workflow.stage !== 'MEASURE_OUTCOME')
    throw new Error('audit and monitor can only run after MEASURE_OUTCOME; fail closed');
  verifyAuditChain(workflow);
  return appendEvent(workflow, 'AUDIT_AND_MONITOR', input.auditedAtMs,
    `audit verified: ${workflow.events.length} events, hash chain valid; ongoing monitoring is the operator's duty`);
}

/**
 * AUDIT + MONITOR. Verifies the hash chain over every event; a single tampered byte
 * anywhere in the trail fails closed. Returns the verified trail as evidence.
 */
export function auditTrail(workflow: Readonly<DecisionSafetyWorkflow>): Readonly<{
  workflowId: string;
  chainValid: boolean;
  events: readonly Readonly<DecisionSafetyEvent>[];
  stages: readonly string[];
  humanDecision: 'REQUIRED';
  automaticRecovery: false;
}> {
  if (!workflow || workflow.kind !== 'DECISION_SAFETY_WORKFLOW' || !Object.isFrozen(workflow))
    throw new Error('not a frozen DECISION_SAFETY_WORKFLOW; fail closed');
  verifyAuditChain(workflow);
  return Object.freeze({
    workflowId: workflow.workflowId,
    chainValid: true,
    events: workflow.events,
    stages: Object.freeze(workflow.events.map((e) => e.stage)),
    humanDecision: 'REQUIRED' as const,
    automaticRecovery: false as const,
  });
}

/** Verifies the event hash chain; throws on any tampering. Never repairs. */
export function verifyAuditChain(workflow: Readonly<DecisionSafetyWorkflow>): void {
  if (!workflow || !Array.isArray(workflow.events)) throw new Error('workflow event trail missing; fail closed');
  if (workflow.events.length < 1) throw new Error('workflow event trail is empty; fail closed');
  if (workflow.stage !== workflow.events[workflow.events.length - 1]!.stage)
    throw new Error('workflow stage does not match the audit trail; fail closed, never repaired');
  let prev = '';
  for (let i = 0; i < workflow.events.length; i++) {
    const e = workflow.events[i]!;
    // Event 1 is chained to the GENESIS hash of the workflow's CURRENT metadata — any
    // tampering with expiresAtMs, purpose, or the identity (tool scope, action policy)
    // changes the genesis and breaks the chain here.
    const seed = i === 0 ? genesisHash(workflow) : prev;
    const expected = sha256(
      `${workflow.workflowId}|${seed}|${e.seq}|${e.stage}|${e.atMs}|${e.detail}`,
    );
    if (e.seq !== i + 1 || e.hash !== expected)
      throw new Error(`audit trail tamper-evidence check failed at event ${e.seq}; fail closed, never repaired`);
    prev = e.hash;
  }
}