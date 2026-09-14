// 12D-222 — INSTRUCTION-SIDE ADOPTION & LINEAGE RECONCILIATION (follows 12D-136).
//
// The adoption layers so far each trusted their own slice: 12D-119 adopted routing,
// 12D-135 adopted the event plane, 12D-136 adopted the cell placement and bound the
// plane to it, and 12D-134 verified one instruction's provenance. But NOTHING bound
// an EXECUTION_INSTRUCTION to the adopted placement lineage in ONE recomposed,
// fail-closed record — the gate this module closes.
//
// The trust discipline: EVERY presented packet is UNTRUSTED — instruction, workflow,
// decision record, provenance, cell-placement plan, operator adoption, event-plane
// plan, binding, digests, receipts, identities, and timestamps. The gate RECOMPOSES
// and revalidates the complete chain and refuses any packet that disagrees:
//
//   source instruction (12D-121 EXECUTION_INSTRUCTION, owned by a re-verified
//     hash-chained workflow sitting at exactly EXECUTE_MINIMUM_ACTION, whose trail
//     recorded the re-derived proposal BEFORE a receipt-backed approval and a
//     RE_AUTHORIZE that both precede the act)
//   → instruction plan (the ACCEPTED 12D-129/12D-126 decision record, recordDigest
//     re-derived AND the plan recomposed from its full provenance, scope-matched)
//   → cell-placement plan (12D-120, invariants re-asserted)
//   → operator adoption (12D-136 record whose content digest re-derives against the
//     presented composing plan, and whose timestamp is FRESH — never stale)
//   → event-plane plan (12D-123 plan re-asserted through its own invariants)
//   → event-plane binding (re-derived, never trusted: the presented binding must
//     field-match the one the gate recomputes — canonical field comparison, not
//     key-order-sensitive serialization)
//   → bounded instruction adoption (the OUTPUT: an immutable ADVISORY record).
//
// STRUCTURED TRAIL EVIDENCE, never substring probes: the proposal must appear in a
// PROPOSED_ACTION event whose detail EXACTLY equals the canonical recording; the
// approval must EXACTLY equal the canonical approval detail naming the presented
// execution grant's approver; a RE_AUTHORIZE event must sit between approval and the
// EXECUTE_MINIMUM_ACTION event whose detail EXACTLY equals the canonical issuance.
// One action/digest cannot impersonate another through prefix or substring collisions.
//
// DISCLOSED LIMITATIONS (honest, fail-closed):
//   * storyId carries NO upstream lineage evidence — no 12D contract in the chain
//     (12D-121/129/126/120/123/136) records a story id. The presented storyId is
//     shape-validated and bound VERBATIM, and the record marks it
//     `storyIdIsAnUnverifiedCallerAssertion: true`; no consumer may treat it as
//     lineage evidence. (Same discipline as the 12D-124 storyId declarations.)
//   * The 12D-121 trail intentionally never records the RAW execution-grant receipt
//     value (secrets never ride the hash-chained trail); the receipt is authenticated
//     out-of-band by the operator custody registry. This gate binds the approval event
//     to its canonical detail and the presented grant's approver — the strongest
//     recomposition available without altering the upstream ladder.
//   * tenantId, universeId, and sourceRevision are re-checked across EVERY artifact in
//     the presented chain that carries them — the 12D-129/126 decision provenance
//     request (the only such artifact). The placement-layer packets (12D-120/123/136)
//     carry epoch-scoped placement only and no tenant/universe/revision fields.
//   * Replay protection is an in-memory, PROCESS-LOCAL set. It is NOT durable and NOT
//     crash-safe: a restarted gate process forgets prior adoptions, and a second
//     process has its own set. Cross-process or durable replay protection requires a
//     durable atomic replay store — a future, separately reviewed story.
//
// The output record binds tenant, universe, story, source revision, instruction
// identity, the full digest chain, a fresh per-call 64-hex operator receipt, the
// policy version, and an expiration bounded by the instruction's own validity
// window. It EXECUTES NOTHING and grants NO production authority — it is a decision
// record for downstream, separately reviewed layers, with the structural safety
// values (trafficMoved false, authorizedTrafficBps 0, executionStarted false,
// productionMutationAllowed false, realCellsProvisioned 0) structural and frozen.

import {
  verifyAuditChain, deriveProposalDigest, type DecisionSafetyWorkflow, type ExecutionInstruction,
} from './agent-decision-safety-workflow';
import {
  SCALING_EXECUTION_POLICY,
} from './scaling-execution-bridge';
import {
  planMeasuredHorizontalScaling, deriveScalingRecordDigest,
  type ScalingDecisionRecord, type ScalingPlanProvenance,
} from './measured-horizontal-scaling';
import {
  FAILOVER_EXECUTION_POLICY,
} from './failover-execution-bridge';
import {
  planMeasuredRegionalFailover, deriveFailoverRecordDigest,
  type FailoverDecisionRecord, type FailoverPlanProvenance,
} from './measured-regional-failover';
import {
  assertCellPlanInvariants, type RegionalCellPlacementPlan,
} from './regional-cell-contract';
import {
  assertEventPlaneInvariants, type DistributedEventPlanePlan,
} from './event-plane-contract';
import {
  eventPlanePlanDigestOf,
} from './event-plane-adapter';
import {
  cellPlanDigestOf, bindEventPlaneToAdoptedCells,
  type CellPlacementOperativeAdoption, type EventPlaneCellBinding,
} from './cell-placement-adapter';
import { createHash } from 'node:crypto';

const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

export const INSTRUCTION_ADOPTION_POLICY = Object.freeze({
  policyVersion: '12d-222-v1',
  supportedScopes: ['SCALING', 'FAILOVER'],
  /** Canonical actionId prefixes composed by the 12D-130/131 execution bridges. */
  actionIdPrefixes: Object.freeze({ SCALING: 'scaling.exec.', FAILOVER: 'failover.exec.' }),
  maxStoryIdChars: 32,
  maxAdoptedByIdChars: 128,
  maxApproverIdChars: 128,
  /** An operator adoption older than this is STALE for the adoption record. */
  maxAdoptionAgeMs: 300_000,
  /** The advisory record's own validity bound. */
  recordValidityMs: 300_000,
});

export const INSTRUCTION_ADOPTION_GUARDRAILS = Object.freeze({
  everyPresentedPacketIsUntrusted: true,
  theWholeChainIsRecomposedNeverTrusted: true,
  trailEvidenceIsStructuredNotSubstringProbed: true,
  approvalIsBoundToTheCanonicalApprovalDetailAndItsApprover: true,
  presentedBindingsMustMatchReDerivedBindings: true,
  wildcardScopeIsRefused: true,
  oneAdoptionPerInstructionLineage: true,
  declinedPlansAreFinalStates: true,
  staleOperatorAdoptionsAreRefused: true,
  mixedTenantUniverseOrRevisionIsRefused: true,
  storyIdCarriesNoUpstreamLineageEvidence: true,
  replayProtectionIsProcessLocalNotDurable: true,
  executesNothing: true,
  authorizesNoProductionAuthority: true,
  trafficMoved: false,
  authorizedTrafficBps: 0,
  executionStarted: false,
  productionMutationAllowed: false,
  realCellsProvisioned: 0,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export interface InstructionAdoptionRecord {
  readonly kind: 'INSTRUCTION_ADOPTION_RECORD';
  readonly tenantId: string;
  readonly universeId: string;
  readonly storyId: string;
  /** HONEST DISCLOSURE: no upstream 12D contract carries a story id. */
  readonly storyIdIsAnUnverifiedCallerAssertion: true;
  readonly sourceRevision: string;
  /** Derived by THIS gate: `${workflowId}:${actionId}` — never a caller-controlled value. */
  readonly instructionId: string;
  readonly workflowId: string;
  readonly actionId: string;
  /** The trail-verified proposal digest the instruction re-derives. */
  readonly instructionDigest: string;
  /** The composing cell-placement plan's content digest. */
  readonly cellPlanDigest: string;
  /** Digest over the operator adoption record's bound fields. */
  readonly cellAdoptionDigest: string;
  /** The event-plane plan's canonical content digest. */
  readonly eventPlaneDigest: string;
  /** Digest over the RE-DERIVED event-plane binding's bound fields. */
  readonly bindingDigest: string;
  readonly operatorReceiptSha256: string;
  readonly policyVersion: string;
  readonly adoptedAtMs: number;
  readonly expiresAtMs: number;
  // Structural safety values — the record authorizes nothing.
  readonly trafficMoved: false;
  readonly authorizedTrafficBps: 0;
  readonly executionStarted: false;
  readonly productionMutationAllowed: false;
  readonly realCellsProvisioned: 0;
  readonly databasesProvisioned: 0;
  readonly rowsMoved: 0;
  // Honest flags.
  readonly guardrails: Readonly<typeof INSTRUCTION_ADOPTION_GUARDRAILS>;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

const hex64 = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const hex40 = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{40}$/.test(v);
const id = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.length >= 1 && v.length <= max && /^[A-Za-z0-9_.:@-]+$/.test(v);
const storyId = (v: unknown): v is string =>
  typeof v === 'string' && v.length >= 5 && v.length <= INSTRUCTION_ADOPTION_POLICY.maxStoryIdChars
  && /^12D-[0-9]{1,4}$/.test(v);
const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);
const isFrozenKind = (v: unknown, kind: string): boolean =>
  !!v && typeof v === 'object' && Object.isFrozen(v) && (v as { kind?: unknown }).kind === kind;

const cellAdoptionDigestOf = (a: Readonly<CellPlacementOperativeAdoption>): string =>
  sha256(JSON.stringify({
    planDigestSha256: a.planDigestSha256, epoch: a.epoch, cellCount: a.cellCount,
    shardCount: a.shardCount, totals: a.totals, adoptedBy: a.adoptedBy,
    adoptedAtMs: a.adoptedAtMs, operatorReceiptSha256: a.operatorReceiptSha256,
  }));

const bindingDigestOf = (b: Readonly<EventPlaneCellBinding>): string =>
  sha256(JSON.stringify({
    kind: b.kind, planEpoch: b.planEpoch, cellPlanDigestSha256: b.cellPlanDigestSha256,
    cellCount: b.cellCount, shardCount: b.shardCount, streamCount: b.streamCount,
    replicatedStreamCount: b.replicatedStreamCount,
  }));

/**
 * Canonical, FIELD-EXPLICIT comparison of the presented binding against the
 * re-derived one — never key-order-sensitive serialization. Every semantic field
 * must match exactly.
 */
const sameBinding = (
  presented: Readonly<EventPlaneCellBinding>,
  rederived: Readonly<EventPlaneCellBinding>,
): boolean =>
  presented.kind === rederived.kind
  && presented.planEpoch === rederived.planEpoch
  && presented.cellPlanDigestSha256 === rederived.cellPlanDigestSha256
  && presented.cellCount === rederived.cellCount
  && presented.shardCount === rederived.shardCount
  && presented.streamCount === rederived.streamCount
  && presented.replicatedStreamCount === rederived.replicatedStreamCount
  && presented.streamsReDerivedAgainstAdoptedCells === rederived.streamsReDerivedAgainstAdoptedCells
  && presented.infrastructureMaterializedByThisBinding === rederived.infrastructureMaterializedByThisBinding
  && presented.guardrails === rederived.guardrails
  && presented.humanDecision === rederived.humanDecision
  && presented.learningPromoted === rederived.learningPromoted
  && presented.modelCalls === rederived.modelCalls
  && presented.remoteCalls === rederived.remoteCalls
  && presented.realEventStreamsActivated === rederived.realEventStreamsActivated
  && presented.billionUsersProven === rederived.billionUsersProven
  && presented.automaticRecovery === rederived.automaticRecovery;

/**
 * The instruction-side adoption gate. Constructed with no ambient authority; scope,
 * receipts, and the whole chain come per call, and one adoption per instruction
 * lineage per gate instance (replay refused — process-local, not durable).
 */
export class InstructionAdoptionGate {
  readonly #adopted = new Set<string>();

  adoptInstruction(input: {
    scope: 'SCALING' | 'FAILOVER';
    tenantId: string;
    universeId: string;
    storyId: string;
    sourceRevision: string;
    decisionRecord: Readonly<ScalingDecisionRecord> | Readonly<FailoverDecisionRecord>;
    decisionProvenance: Readonly<ScalingPlanProvenance> | Readonly<FailoverPlanProvenance>;
    /** The 12D-121 execution grant (a separate human act) whose approval is being adopted. */
    executionGrant: { operatorReceiptSha256: string; approvedBy: string };
    instruction: Readonly<ExecutionInstruction>;
    workflow: Readonly<DecisionSafetyWorkflow>;
    cellPlacementPlan: Readonly<RegionalCellPlacementPlan>;
    cellAdoption: Readonly<CellPlacementOperativeAdoption>;
    eventPlanePlan: Readonly<DistributedEventPlanePlan>;
    cellBinding: Readonly<EventPlaneCellBinding>;
    operatorReceiptSha256: string;
    recordedAtMs: number;
  }): Readonly<InstructionAdoptionRecord> {
    if (!input || typeof input !== 'object')
      throw new Error('instruction adoption input required; fail closed');
    const scope = input.scope as string;
    if (scope !== 'SCALING' && scope !== 'FAILOVER')
      throw new Error('adoption scope unknown; fail closed');
    if (!safeInt(input.recordedAtMs) || input.recordedAtMs <= 0)
      throw new Error('recording timestamp invalid; fail closed');
    // Wildcards are a scope refusal: the id charset already excludes them, and the
    // story id must be a concrete 12D-number.
    if (!id(input.tenantId, INSTRUCTION_ADOPTION_POLICY.maxAdoptedByIdChars))
      throw new Error('tenantId invalid or wildcard-scoped; fail closed');
    if (!id(input.universeId, INSTRUCTION_ADOPTION_POLICY.maxAdoptedByIdChars))
      throw new Error('universeId invalid or wildcard-scoped; fail closed');
    if (!storyId(input.storyId))
      throw new Error('storyId malformed; a concrete 12D story id is required; fail closed');
    if (!hex40(input.sourceRevision))
      throw new Error('sourceRevision must be a 40-hex source revision; fail closed');
    if (!hex64(input.operatorReceiptSha256))
      throw new Error('instruction adoption requires a fresh, correctly scoped, 64-hex sha256 operator receipt; fail closed');
    // The execution grant is presented UNTRUSTED and is bound to the trail's canonical
    // approval detail below — a forged approver or malformed receipt can never match.
    const grant = input.executionGrant as { operatorReceiptSha256?: string; approvedBy?: string } | null;
    if (!grant || typeof grant !== 'object')
      throw new Error('the 12D-121 execution grant is required; fail closed');
    if (!hex64(grant.operatorReceiptSha256))
      throw new Error('the execution grant requires a 64-hex sha256 operator receipt; fail closed');
    if (!id(grant.approvedBy, INSTRUCTION_ADOPTION_POLICY.maxApproverIdChars))
      throw new Error('the execution grant approver identity is invalid; fail closed');

    // ── INSTRUCTION PLAN: the decision record is UNTRUSTED — identity first, digest
    // second, declined final states third.
    if (!input.decisionRecord || !Object.isFrozen(input.decisionRecord))
      throw new Error('not a frozen decision record; fail closed');
    const record = input.decisionRecord as {
      kind: string; planDigest: string; decision: string; decidedAtMs: number; recordDigest: string;
    };
    if (scope === 'SCALING' && input.decisionRecord.kind !== 'SCALING_DECISION_RECORD')
      throw new Error('a scaling instruction adoption cannot bind a non-scaling decision record; fail closed');
    if (scope === 'FAILOVER' && input.decisionRecord.kind !== 'FAILOVER_DECISION_RECORD')
      throw new Error('a failover instruction adoption cannot bind a non-failover decision record; fail closed');
    const recomputedRecordDigest = scope === 'SCALING'
      ? deriveScalingRecordDigest(input.decisionRecord as ScalingDecisionRecord)
      : deriveFailoverRecordDigest(input.decisionRecord as FailoverDecisionRecord);
    if (recomputedRecordDigest !== record.recordDigest)
      throw new Error('the presented decision record does not re-derive its recordDigest; tampering; fail closed');
    if (input.decisionRecord.decision !== 'ACCEPTED_FOR_HUMAN_REVIEW')
      throw new Error('a declined plan is a final state; an adoption record can never bind it; fail closed');
    if (!safeInt(record.decidedAtMs))
      throw new Error('the decision timestamp is invalid; fail closed');

    // RECOMPOSITION: the plan is re-derived from its FULL provenance — the record's
    // planDigest must re-derive, and the provenance's tenant/universe/revision MUST
    // equal the presented scope (mixed tenants/universes/revisions are refused). The
    // decision-provenance request is the ONLY artifact in the presented chain that
    // carries tenant/universe/sourceRevision — every carrier is re-checked.
    if (scope === 'SCALING') {
      const provenance = input.decisionProvenance as ScalingPlanProvenance;
      const recomposed = planMeasuredHorizontalScaling(
        provenance.policy, provenance.request, provenance.nowMs, provenance.evidence);
      if (recomposed.disposition !== 'HUMAN_APPROVAL_REQUIRED' || recomposed.planDigest !== record.planDigest)
        throw new Error('the scaling plan does not recompose from its presented provenance; fail closed');
      if (provenance.request.tenantId !== input.tenantId || provenance.request.universeId !== input.universeId)
        throw new Error('the provenance tenant/universe does not match the presented scope; mixed scope; fail closed');
      if (provenance.request.sourceCommit !== input.sourceRevision)
        throw new Error('the provenance source revision does not match the presented sourceRevision; mixed revision; fail closed');
    } else {
      const provenance = input.decisionProvenance as FailoverPlanProvenance;
      const recomposed = planMeasuredRegionalFailover(
        provenance.policy, provenance.request, provenance.nowMs, provenance.primary, provenance.secondary);
      if (recomposed.disposition !== 'HUMAN_APPROVAL_REQUIRED' || recomposed.planDigest !== record.planDigest)
        throw new Error('the failover plan does not recompose from its presented provenance; fail closed');
      if (provenance.request.tenantId !== input.tenantId || provenance.request.universeId !== input.universeId)
        throw new Error('the provenance tenant/universe does not match the presented scope; mixed scope; fail closed');
      if (provenance.request.sourceCommit !== input.sourceRevision)
        throw new Error('the provenance source revision does not match the presented sourceRevision; mixed revision; fail closed');
    }

    // ── INSTRUCTION CHAIN: the workflow and instruction are UNTRUSTED and re-verified
    // exactly as 12D-134's intake re-verifies them.
    if (!isFrozenKind(input.workflow, 'DECISION_SAFETY_WORKFLOW'))
      throw new Error('not a frozen DECISION_SAFETY_WORKFLOW; fail closed');
    const workflow = input.workflow as Readonly<DecisionSafetyWorkflow>;
    verifyAuditChain(workflow);
    if (workflow.stage !== 'EXECUTE_MINIMUM_ACTION')
      throw new Error('instruction adoption requires a workflow at exactly the EXECUTE_MINIMUM_ACTION stage; fail closed');
    if (!isFrozenKind(input.instruction, 'EXECUTION_INSTRUCTION'))
      throw new Error('not a frozen EXECUTION_INSTRUCTION; fail closed');
    const instruction = input.instruction as Readonly<ExecutionInstruction>;
    if (instruction.workflowId !== workflow.workflowId)
      throw new Error('instruction does not belong to this workflow; fail closed');
    if (instruction.executedByThisRuntime !== false || instruction.productionExecutionAllowed !== false
      || instruction.humanDecision !== 'REQUIRED' || instruction.automaticRecovery !== false)
      throw new Error('the instruction carries dishonest governance flags; fail closed');
    if (!safeInt(instruction.validUntilMs) || instruction.validUntilMs <= 0)
      throw new Error('instruction validity window invalid; fail closed');
    if (input.recordedAtMs > instruction.validUntilMs)
      throw new Error('the recording falls outside the instruction validity window; fail closed');
    if (input.recordedAtMs < record.decidedAtMs)
      throw new Error('the recording predates the human decision it adopts; fail closed');

    // The instruction binds the decision record CROSS-CONTRACT: the actionId is
    // `<prefix><planDigest-16>.<count|bps>` — composed by the 12D-130/131 bridges from
    // re-derived values only, so it must re-derive EXACTLY from the presented record's
    // planDigest and bound value. A receipt cannot bind another proposal family.
    const canonical = scope === 'SCALING' ? SCALING_EXECUTION_POLICY : FAILOVER_EXECUTION_POLICY;
    const prefix = INSTRUCTION_ADOPTION_POLICY.actionIdPrefixes[scope];
    const boundTail = scope === 'SCALING'
      ? String((input.decisionRecord as ScalingDecisionRecord).proposedNewDatabaseCount)
      : String((input.decisionRecord as FailoverDecisionRecord).requestedTrafficBps);
    const expectedActionId = `${prefix}${record.planDigest.slice(0, 16)}.${boundTail}`;
    if (instruction.actionId !== expectedActionId)
      throw new Error(`the instruction actionId does not re-derive from the decision record (expected ${prefix}<planDigest-16>.<bound value>); fail closed`);

    // STRUCTURED TRAIL EVIDENCE: the proposal must appear in a PROPOSED_ACTION event
    // whose detail EXACTLY equals the canonical recording — never a substring probe,
    // so one action/digest cannot impersonate another through prefix collisions.
    const instructionDigest = deriveProposalDigest({
      workflowId: workflow.workflowId,
      actionId: instruction.actionId,
      description: instruction.minimumAction,
      toolId: canonical.executionToolId,
      riskClass: canonical.requiredRiskClass,
    });
    if (!workflow.events.some((e) => e.stage === 'PROPOSED_ACTION'
      && e.detail === `action ${instruction.actionId} recorded as a proposal only (proposal digest ${instructionDigest})`))
      throw new Error('the instruction does not re-derive a proposal this workflow trail recorded; fail closed');

    // TRAIL ORDER, structured and exact: the canonical approval detail naming the
    // presented grant's approver must appear BEFORE the RE_AUTHORIZE event, which must
    // appear BEFORE the EXECUTE_MINIMUM_ACTION event whose detail EXACTLY equals the
    // canonical issuance for this actionId. An approval can never follow the act it
    // approves, and no substring can stand in for the exact canonical evidence.
    // (The RAW grant receipt value is out-of-band by the 12D-121 contract — the trail
    // never records it; the receipt is authenticated by the operator custody registry.)
    const approvalDetail = `approved by ${grant.approvedBy} with operator receipt`;
    const approvalIdx = workflow.events.findIndex((e) => e.stage === 'HUMAN_APPROVAL'
      && e.detail === approvalDetail);
    const reAuthIdx = workflow.events.findIndex((e) => e.stage === 'RE_AUTHORIZE'
      && e.detail === 'liveness and audit chain re-verified immediately before execution');
    const executeIdx = workflow.events.findIndex((e) => e.stage === 'EXECUTE_MINIMUM_ACTION'
      && e.detail === `issued minimum-action instruction for ${instruction.actionId}; runtime executed nothing`);
    if (approvalIdx < 0)
      throw new Error(`the trail does not show a receipt-backed approval by the presented execution grant's approver (${grant.approvedBy}); fail closed`);
    if (reAuthIdx < 0 || reAuthIdx < approvalIdx)
      throw new Error('the trail does not show re-authorization after the approval; fail closed');
    if (executeIdx < 0 || executeIdx < reAuthIdx)
      throw new Error('the trail does not show the re-authorized minimum-action instruction for this actionId; fail closed');

    // ── PLACEMENT CHAIN: the cell plan, its operator adoption, the event-plane plan,
    // and the binding are UNTRUSTED packets that must all re-derive together.
    if (!isFrozenKind(input.cellPlacementPlan, 'REGIONAL_CELL_PLACEMENT_PLAN'))
      throw new Error('not a frozen REGIONAL_CELL_PLACEMENT_PLAN; fail closed');
    assertCellPlanInvariants(input.cellPlacementPlan);
    if (!input.cellAdoption || input.cellAdoption.kind !== 'CELL_PLACEMENT_OPERATIVE_ADOPTION'
      || !Object.isFrozen(input.cellAdoption))
      throw new Error('a frozen CELL_PLACEMENT_OPERATIVE_ADOPTION is required; a non-adopted placement can never bind');
    if (!hex64(input.cellAdoption.operatorReceiptSha256))
      throw new Error('the presented operator adoption carries a malformed receipt; fail closed');
    if (!safeInt(input.cellAdoption.adoptedAtMs) || input.cellAdoption.adoptedAtMs <= 0)
      throw new Error('the presented operator adoption carries an invalid timestamp; fail closed');
    if (!id(input.cellAdoption.adoptedBy, INSTRUCTION_ADOPTION_POLICY.maxAdoptedByIdChars))
      throw new Error('the presented operator adoption carries an invalid adopter identity; fail closed');
    const cellPlanDigest = cellPlanDigestOf(input.cellPlacementPlan);
    if (cellPlanDigest !== input.cellAdoption.planDigestSha256)
      throw new Error('the presented cell plan does not match the operator adoption record; fail closed');
    if (input.cellAdoption.adoptedAtMs > input.recordedAtMs
      || input.recordedAtMs - input.cellAdoption.adoptedAtMs > INSTRUCTION_ADOPTION_POLICY.maxAdoptionAgeMs)
      throw new Error('the operator adoption is stale for this instruction adoption; fail closed');
    if (!isFrozenKind(input.eventPlanePlan, 'DISTRIBUTED_EVENT_PLANE_PLAN'))
      throw new Error('not a frozen DISTRIBUTED_EVENT_PLANE_PLAN; fail closed');
    assertEventPlaneInvariants(input.eventPlanePlan);

    // RE-DERIVE the binding — the presented one is NEVER trusted on its own word:
    // it must field-match (canonical, order-insensitive) the binding the gate
    // recomputes from the presented plane, adoption, and composing plan.
    const recomputedBinding = bindEventPlaneToAdoptedCells(
      input.eventPlanePlan, input.cellAdoption, input.cellPlacementPlan);
    if (!sameBinding(input.cellBinding, recomputedBinding))
      throw new Error('the presented event-plane binding does not match the re-derived binding; fail closed');

    const cellAdoptionDigest = cellAdoptionDigestOf(input.cellAdoption);
    const eventPlaneDigest = eventPlanePlanDigestOf(input.eventPlanePlan);
    const bindingDigest = bindingDigestOf(recomputedBinding);

    // One adoption per instruction lineage per gate instance: the same scope, tenant,
    // instruction identity, digest chain, and binding cannot be adopted twice. The set
    // is PROCESS-LOCAL and NOT durable (disclosed): a restarted or second process
    // forgets prior adoptions — durable replay protection is a future reviewed story.
    const replayKey = `${scope}|${input.tenantId}|${input.universeId}|${instructionDigest}`
      + `|${cellAdoptionDigest}|${bindingDigest}`;
    if (this.#adopted.has(replayKey))
      throw new Error('this instruction lineage has already been adopted by this gate; replay refused; fail closed');
    this.#adopted.add(replayKey);

    const expiresAtMs = Math.min(instruction.validUntilMs, input.recordedAtMs + INSTRUCTION_ADOPTION_POLICY.recordValidityMs);
    return Object.freeze({
      kind: 'INSTRUCTION_ADOPTION_RECORD' as const,
      tenantId: input.tenantId,
      universeId: input.universeId,
      storyId: input.storyId,
      storyIdIsAnUnverifiedCallerAssertion: true as const,
      sourceRevision: input.sourceRevision,
      instructionId: `${workflow.workflowId}:${instruction.actionId}`,
      workflowId: workflow.workflowId,
      actionId: instruction.actionId,
      instructionDigest,
      cellPlanDigest,
      cellAdoptionDigest,
      eventPlaneDigest,
      bindingDigest,
      operatorReceiptSha256: input.operatorReceiptSha256,
      policyVersion: INSTRUCTION_ADOPTION_POLICY.policyVersion,
      adoptedAtMs: input.recordedAtMs,
      expiresAtMs,
      trafficMoved: false as const,
      authorizedTrafficBps: 0 as const,
      executionStarted: false as const,
      productionMutationAllowed: false as const,
      realCellsProvisioned: 0 as const,
      databasesProvisioned: 0 as const,
      rowsMoved: 0 as const,
      guardrails: INSTRUCTION_ADOPTION_GUARDRAILS,
      humanDecision: 'REQUIRED' as const,
      learningPromoted: false as const,
      modelCalls: 0 as const,
      remoteCalls: 0 as const,
      billionUsersProven: false as const,
      automaticRecovery: false as const,
    });
  }
}