/**
 * US-AGT-02 approval + audit trail contract.
 * Run: npx tsx approval-audit.test.ts
 */

import assert from 'node:assert/strict';

import {
  APPROVAL_AUDIT_POLICY,
  approvalAuditAllowsProductionWrite,
  listApprovalAuditTrail,
  recordApprovalDecisionAudit,
} from './approval-audit';
import { bindAgentPersistence, isAgentPersistenceBound } from './persistence';
import {
  decideSupplierSimulation,
  openAndProposeSupplierSimulation,
  SUPPLIER_SIMULATION_TOOL_ID,
} from './supplier-simulation';
import { getPrototypeAuditStore } from './runtime/audit';

async function main() {
  assert.equal(APPROVAL_AUDIT_POLICY.l4Autonomy, false);
  assert.equal(APPROVAL_AUDIT_POLICY.productionMutation, false);
  assert.equal(APPROVAL_AUDIT_POLICY.productionWritesWithoutApproval, false);
  assert.equal(approvalAuditAllowsProductionWrite(true), false);

  bindAgentPersistence(null);
  assert.equal(isAgentPersistenceBound(), false);
  const empty = listApprovalAuditTrail();
  assert.equal(empty.status, 'WAITING_DATA');
  assert.equal(empty.persistenceBound, false);
  assert.match(empty.note, /WAITING_DATA/);

  const proposed = await openAndProposeSupplierSimulation({
    userId: 'us-agt-02-audit-user',
    role: 'executive',
  });
  assert.ok(proposed.pendingAction);
  assert.equal(proposed.pendingAction?.toolId, SUPPLIER_SIMULATION_TOOL_ID);

  const rejected = await decideSupplierSimulation({
    userId: 'us-agt-02-audit-user',
    agentType: 'executive_agent',
    actionId: proposed.pendingAction!.id,
    decision: 'reject',
  });
  assert.ok(rejected.approvals.length >= 1);
  assert.ok(rejected.intents.some((i: { kind: string }) => i.kind === 'reject'));

  const trail = listApprovalAuditTrail({
    approvals: rejected.approvals,
    intents: rejected.intents,
  });
  assert.equal(trail.l4Autonomy, false);
  assert.equal(trail.productionWritesWithoutApproval, false);
  assert.ok(trail.sessionApprovals.some((a) => a.decision === 'reject'));
  assert.ok(trail.sessionDecisionEvents.some((e) => e.kind === 'reject'));
  assert.ok(trail.governedApprovals.some((a) => a.actionId === proposed.pendingAction!.id));
  assert.ok(
    trail.governedEvents.some(
      (e) => e.actionId === proposed.pendingAction!.id && (e.status === 'denied' || e.verdict === 'denied'),
    ),
  );
  assert.equal(trail.status, 'READY');
  assert.match(trail.note, /WAITING_DATA for durable|in-memory/);

  const proposed2 = await openAndProposeSupplierSimulation({
    userId: 'us-agt-02-audit-user-2',
    role: 'executive',
  });
  const actionId = proposed2.pendingAction!.id;
  const approved = await decideSupplierSimulation({
    userId: 'us-agt-02-audit-user-2',
    agentType: 'executive_agent',
    actionId,
    decision: 'approve',
  });
  assert.ok(approved.approvals.some((a: { decision: string }) => a.decision === 'approve'));
  assert.ok(approved.intents.some((i: { kind: string }) => i.kind === 'approve'));
  const store = getPrototypeAuditStore();
  assert.ok(store.getApproval(actionId));
  assert.equal(store.getApproval(actionId)?.decision, 'approved');

  const manual = recordApprovalDecisionAudit({
    actionId: 'manual-action',
    agentId: 'executive_agent',
    toolId: SUPPLIER_SIMULATION_TOOL_ID,
    decision: 'approve',
    reviewedBy: 'tester',
    reason: 'manual audit probe',
  });
  assert.equal(manual.decision, 'approved');
  assert.equal(approvalAuditAllowsProductionWrite(true), false);

  bindAgentPersistence({
    async insert() {
      return { error: null };
    },
    async upsert() {
      return { error: null };
    },
    async update() {
      return { error: null };
    },
  });
  assert.equal(isAgentPersistenceBound(), true);
  const boundTrail = listApprovalAuditTrail({
    approvals: approved.approvals,
    intents: approved.intents,
  });
  assert.equal(boundTrail.persistenceBound, true);
  assert.equal(boundTrail.status, 'READY');

  bindAgentPersistence(null);

  console.log('ok - US-AGT-02 approval+audit trail (WAITING_DATA when unbound; L4 false; approve/deny audited)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
