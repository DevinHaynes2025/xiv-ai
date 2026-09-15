// 12D-232 — Offline-sync EXECUTION-INSTRUCTION bridge (the transport layer 12D-231's
// charter reserves — the sync sibling of 12D-130's scaling bridge and 12D-131's
// failover bridge).
//
// 12D-231's charter states: synchronization requires a fresh single-use operator
// receipt, and "the network connector that would move bytes is a future story."
// This module is the bridge to that story: it takes a RECORDED sync outcome from a
// 12D-231 runtime and drives the 12D-121 gate ladder for exactly one bounded
// reconciliation-transport proposal, emitting a 12D-121 EXECUTION_INSTRUCTION with
// `executedByThisRuntime: false`.
//
// Trust discipline — identical to the 12D-130/131 bridges, applied to sync:
//   * The presented runtime is UNTRUSTED: its hash-chained ledger must verify
//     (`verifyLedger()`), the presented outcome must RE-DERIVE from that trail
//     (exactly one SYNC_PROPOSED entry matching universe/batch/applied/conflicts at
//     the presented proposal time, plus one SYNC_APPLIED entry per claimed task), and
//     every task id must re-derive from the runtime's live task states (COMPLETED
//     with a result digest, in the SAME universe, never quarantined).
//   * A SYNC_CONFLICT outcome is a final state: quarantined tasks are owned by human
//     review and NOTHING from a conflicting batch is transportable.
//   * The proposal's risk class is PINNED to PRODUCTION_CONFIGURATION and the tool to
//     the single canonical sync-transport tool — the bridge never down-labels and
//     never widens: the purpose-built workflow identity is ADVISE_ONLY with exactly
//     one approved tool.
//   * The instruction is a TRANSPORT work order ONLY: it names the reconciled task
//     ids and universe and forbids everything else. The minimumAction text is
//     composed by THIS module from re-derived values — the caller never authors
//     instruction text.
//   * The execution grant is a SEPARATE human act: its receipt must differ from the
//     sync-authorization receipt, and it cannot chronologically predate the sync
//     proposal it transports.
//   * Classified work (CONFIDENTIAL/TOP_SECRET) NEVER leaves the local plane — the
//     runtime is offline-only and the instruction forbids classified transport.
//
// It MATERIALIZES NOTHING and MOVES NO BYTES: `bytesMovedByThisRuntime: false` and
// `remoteCalls: 0` remain structural. Disclosed residual (the 12D-130/131
// discipline): receipts authenticate OUT-OF-BAND via the operator custody registry —
// this module binds the declared receipt strings for separation and ordering only;
// a recomputed digest is self-consistent and authenticates nothing by itself.

import {
  authorizeMinimumAction, openDecisionWorkflow, proposeGovernedAction,
  type AgentIdentity, type DecisionSafetyWorkflow, type ExecutionInstruction,
} from './agent-decision-safety-workflow';
import {
  OfflineAgentRuntime, OFFLINE_RUNTIME_POLICY, type OfflineRuntimeEvent,
} from './offline-agent-runtime';

export const OFFLINE_SYNC_EXECUTION_POLICY = Object.freeze({
  policyVersion: '12d-232-v1',
  /** The ONLY tool a sync-execution workflow identity may carry. */
  executionToolId: 'xiv.sync.transport',
  /** Data transport out of the local plane is production configuration — always human-authorized. */
  requiredRiskClass: 'PRODUCTION_CONFIGURATION',
  /** This runtime advises; the workflow identity must be an ADVISE_ONLY agent. */
  requiredActionPolicy: 'ADVISE_ONLY',
  maxIdChars: 128,
});

export const OFFLINE_SYNC_EXECUTION_GUARDRAILS = Object.freeze({
  instructionRequiresAVerifiedRuntimeTrail: true, // the presented runtime is never trusted
  conflictBatchesAreNeverTransportable: true, // quarantined tasks are owned by human review
  riskClassPinnedToProductionConfiguration: true,
  singlePurposeWorkflowIdentity: true,
  classifiedNeverLeavesTheLocalPlane: true,
  executionGrantIsASeparateHumanAct: true,
  oneInstructionPerReconciledBatch: true, // binding disclosed below: out-of-band custody
  executesNothing: true,
  movesNoBytes: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export interface SyncExecutionIssued {
  readonly kind: 'SYNC_EXECUTION_ISSUED';
  readonly workflowId: string;
  readonly actionId: string;
  readonly universeId: string;
  readonly transportableTaskIds: readonly string[];
  readonly minimumAction: string;
  readonly instruction: Readonly<ExecutionInstruction>;
  readonly workflow: Readonly<DecisionSafetyWorkflow>;
  readonly guardrails: Readonly<typeof OFFLINE_SYNC_EXECUTION_GUARDRAILS>;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly bytesMovedByThisRuntime: false;
  readonly productionExecutionAllowed: false;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

const hex64 = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);
const UNIVERSE_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/;
const TASK_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

/** The 12D-231 aggregate ledger entry template — parsed back, never trusted blindly. */
const SYNC_PROPOSED_RE =
  /^universe (\S+) batch (\d+) reconciled (\d+) conflicts (\d+); single operator grant consumed; no bytes moved$/;

function rederiveFromTrail(
  runtime: OfflineAgentRuntime,
  universeId: string,
  syncAtMs: number,
  outcome: { status: string; conflicts: readonly string[]; applied: number },
  taskIds: readonly string[],
): void {
  const entries = runtime.ledgerEntries();
  // Exactly ONE SYNC_PROPOSED entry at the presented proposal time whose parsed
  // aggregate matches the presented outcome — a forged outcome has no trail.
  const proposals = entries.filter(
    (e: OfflineRuntimeEvent) => e.kind === 'SYNC_PROPOSED' && e.atMs === syncAtMs,
  );
  if (proposals.length !== 1) throw new Error('no unique SYNC_PROPOSED trail entry at the presented proposal time; fail closed');
  const m = SYNC_PROPOSED_RE.exec(proposals[0].detail);
  if (!m) throw new Error('the SYNC_PROPOSED trail entry does not re-parse; fail closed');
  const [, ledgerUniverse, batch, reconciled, conflicts] = m;
  if (ledgerUniverse !== universeId) throw new Error('the trail entry names a different universe; fail closed');
  if (Number(batch) !== taskIds.length + outcome.conflicts.length) throw new Error('the trail batch size does not match the presented batch; fail closed');
  if (Number(reconciled) !== outcome.applied) throw new Error('the trail reconciled count does not match the presented outcome; fail closed');
  if (Number(conflicts) !== outcome.conflicts.length) throw new Error('the trail conflicts count does not match the presented outcome; fail closed');
  // Per-task re-derivation: each transportable task has its own SYNC_APPLIED entry
  // in the same trail — digests reconcile per task, never in aggregate only.
  for (const taskId of taskIds) {
    const applied = entries.some(
      (e: OfflineRuntimeEvent) => e.kind === 'SYNC_APPLIED' && e.taskId === taskId && e.atMs === syncAtMs,
    );
    if (!applied) throw new Error(`task ${taskId} has no SYNC_APPLIED trail entry at the proposal time; fail closed`);
  }
}

/**
 * Issue the bounded transport EXECUTION_INSTRUCTION for a RECORDED 12D-231 sync
 * outcome. Pure: reads the presented runtime, re-derives the outcome from its
 * hash-chained trail fail-closed, drives the 12D-121 ladder, and returns frozen
 * packets. Executes nothing; moves no bytes; calls nothing.
 */
export function issueSyncExecutionInstruction(input: {
  runtime: OfflineAgentRuntime;
  syncOutcome: Readonly<{ status: 'SYNC_PROPOSED' | 'SYNC_CONFLICT'; conflicts: readonly string[]; applied: number }>;
  syncUniverseId: string;
  /** The sync proposal's timestamp (the nowMs the 12D-231 runtime recorded it at). */
  syncAtMs: number;
  /** Declared receipt of the sync authorization — authenticated out-of-band (disclosed). */
  syncGrantReceiptSha256: string;
  taskIds: readonly string[];
  executionGrant: { operatorReceiptSha256: string; approvedBy: string };
  identity: AgentIdentity;
  nowMs: number;
  timeLimitMs: number;
}): Readonly<SyncExecutionIssued> {
  if (!input || typeof input !== 'object')
    throw new Error('sync execution input required; fail closed');
  if (!(input.runtime instanceof OfflineAgentRuntime))
    throw new Error('a live 12D-231 OfflineAgentRuntime is required; fail closed');
  if (!safeInt(input.nowMs) || input.nowMs <= 0 || !safeInt(input.timeLimitMs) || input.timeLimitMs <= 0)
    throw new Error('execution reference time or time limit invalid; fail closed');
  if (!safeInt(input.syncAtMs) || input.syncAtMs < 0)
    throw new Error('sync proposal time invalid; fail closed');
  // Ordering: an execution grant cannot predate the sync proposal it executes.
  if (input.nowMs < input.syncAtMs)
    throw new Error('the execution grant predates the sync proposal; fail closed');
  if (!input.syncUniverseId || !UNIVERSE_RE.test(input.syncUniverseId))
    throw new Error('malformed sync universeId; fail closed');
  if (!hex64(input.syncGrantReceiptSha256))
    throw new Error('the sync grant receipt must be 64-hex sha256; fail closed');
  const outcome = input.syncOutcome as { status?: string; conflicts?: unknown; applied?: number } | null;
  if (!outcome || typeof outcome !== 'object'
    || (outcome.status !== 'SYNC_PROPOSED' && outcome.status !== 'SYNC_CONFLICT')
    || !Array.isArray(outcome.conflicts)
    || !outcome.conflicts.every((c) => typeof c === 'string' && TASK_RE.test(c))
    || !safeInt(outcome.applied) || outcome.applied < 0)
    throw new Error('malformed sync outcome; fail closed');
  if (!Array.isArray(input.taskIds)
    || input.taskIds.length < 1
    || input.taskIds.length > OFFLINE_RUNTIME_POLICY.maxAdmittedTasksPerAgent
    || !input.taskIds.every((t) => typeof t === 'string' && TASK_RE.test(t)))
    throw new Error('malformed transportable task ids; fail closed');
  if (new Set(input.taskIds).size !== input.taskIds.length)
    throw new Error('transportable task ids must be distinct; fail closed');

  // The shape checks above are the narrowing proof — bind it once for re-derivation.
  const validatedOutcome: {
    status: 'SYNC_PROPOSED' | 'SYNC_CONFLICT';
    conflicts: readonly string[];
    applied: number;
  } = {
    status: outcome.status,
    conflicts: outcome.conflicts as readonly string[],
    applied: outcome.applied,
  };

  // Conflict batches are final states — quarantined tasks are owned by human review.
  if (validatedOutcome.status === 'SYNC_CONFLICT' || validatedOutcome.conflicts.length > 0)
    throw new Error('a conflicting sync batch is quarantined for human review; nothing from it is transportable; fail closed');
  if (validatedOutcome.applied !== input.taskIds.length)
    throw new Error('the presented applied count does not match the transportable task set; fail closed');

  // The presented runtime is UNTRUSTED: its trail must verify first.
  if (!input.runtime.verifyLedger().ok)
    throw new Error('the presented runtime ledger failed verification; fail closed');

  // Re-derivation from the trail: aggregate + per-task, fail-closed.
  rederiveFromTrail(input.runtime, input.syncUniverseId, input.syncAtMs, validatedOutcome, input.taskIds);

  // Task-state re-derivation against the LIVE runtime: COMPLETED with a result
  // digest, in the SAME universe, never quarantined — the trail alone can lie only
  // as loudly as the live state; both must agree.
  for (const taskId of input.taskIds) {
    const task = input.runtime.taskState(taskId);
    if (!task) throw new Error(`task ${taskId} does not exist in the runtime; fail closed`);
    if (task.universeId !== input.syncUniverseId)
      throw new Error(`task ${taskId} belongs to universe ${task.universeId}, not ${input.syncUniverseId}; fail closed`);
    if (task.state === 'QUARANTINED')
      throw new Error(`task ${taskId} is QUARANTINED for human review; never transportable; fail closed`);
    if (task.state !== 'COMPLETED' || !task.resultDigest)
      throw new Error(`task ${taskId} is ${task.state} without a reconciled result; nothing to transport; fail closed`);
  }

  // Identity gates: an ADVISE_ONLY agent whose approved scope is EXACTLY the
  // canonical sync-transport tool — a purpose-built workflow never carries a wider
  // tool scope.
  const identity = input.identity as AgentIdentity | null;
  if (!identity || !Array.isArray(identity.approvedTools))
    throw new Error('workflow identity required; fail closed');
  if (identity.actionPolicy !== OFFLINE_SYNC_EXECUTION_POLICY.requiredActionPolicy)
    throw new Error(`a sync-execution workflow identity must be ${OFFLINE_SYNC_EXECUTION_POLICY.requiredActionPolicy}; fail closed`);
  if (identity.approvedTools.length !== 1
    || identity.approvedTools[0] !== OFFLINE_SYNC_EXECUTION_POLICY.executionToolId)
    throw new Error(`a sync-execution workflow identity carries exactly one approved tool: ${OFFLINE_SYNC_EXECUTION_POLICY.executionToolId}; fail closed`);
  if (!Array.isArray(identity.dataBoundaries) || !identity.dataBoundaries.includes(input.syncUniverseId))
    throw new Error('the workflow identity data boundaries must include the sync universe; fail closed');

  // The execution grant is a SEPARATE human act: its receipt cannot reuse the
  // sync-authorization receipt — one receipt authorizing two gates collapses the
  // separation the decision-safety ladder exists to keep.
  if (!hex64(input.executionGrant?.operatorReceiptSha256))
    throw new Error('the execution grant receipt must be 64-hex sha256; fail closed');
  if (typeof input.executionGrant.approvedBy !== 'string'
    || input.executionGrant.approvedBy.length < 1
    || input.executionGrant.approvedBy.length > OFFLINE_SYNC_EXECUTION_POLICY.maxIdChars)
    throw new Error('malformed execution approver; fail closed');
  if (input.executionGrant.operatorReceiptSha256 === input.syncGrantReceiptSha256)
    throw new Error('the execution grant receipt must differ from the sync-authorization receipt; execution is a separate human authorization; fail closed');

  const universe = input.syncUniverseId;
  const ids = [...input.taskIds].sort();
  // The minimum action is composed by THIS module from re-derived values only — a
  // transport work order naming the reconciled tasks and forbidding everything else.
  const minimumAction = `Transport the reconciled result digests for universe ${universe}: tasks ${ids.join(',')}`
    + `; transport NO other data, NO quarantined task, NO classified workload (CONFIDENTIAL/TOP_SECRET never leave the local plane)`
    + `, invoke NO provider without a separate grant`;
  const purpose = `Transport reconciliation for universe ${universe} (${ids.length} tasks); requires decision-safety workflow before any action`;
  const actionId = `sync.exec.${universe}.${input.syncAtMs}`;

  let workflow = openDecisionWorkflow({
    identity,
    purpose,
    nowMs: input.nowMs,
    timeLimitMs: input.timeLimitMs,
  });
  const proposed = proposeGovernedAction(workflow, {
    actionId,
    description: minimumAction,
    toolId: OFFLINE_SYNC_EXECUTION_POLICY.executionToolId,
    riskClass: OFFLINE_SYNC_EXECUTION_POLICY.requiredRiskClass,
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
    kind: 'SYNC_EXECUTION_ISSUED' as const,
    workflowId: workflow.workflowId,
    actionId,
    universeId: universe,
    transportableTaskIds: Object.freeze([...ids]),
    minimumAction,
    instruction: authorized.instruction,
    workflow,
    guardrails: OFFLINE_SYNC_EXECUTION_GUARDRAILS,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    bytesMovedByThisRuntime: false as const,
    productionExecutionAllowed: false as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
}