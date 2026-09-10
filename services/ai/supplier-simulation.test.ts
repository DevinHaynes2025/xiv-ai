/**
 * US-AGT-01 propose + approval contract.
 * Run: npx tsx supplier-simulation.test.ts
 */

import assert from 'node:assert/strict';

import {
  decideSupplierSimulation,
  openAndProposeSupplierSimulation,
  SUPPLIER_SIMULATION_POLICY,
  SUPPLIER_SIMULATION_TOOL_ID,
  supplierSimulationTool,
} from './supplier-simulation';

async function main() {
  const tool = supplierSimulationTool();
  assert.equal(tool.id, SUPPLIER_SIMULATION_TOOL_ID);
  assert.equal(tool.requiresApproval, true);
  assert.equal(tool.riskLevel, 'medium');
  assert.equal(SUPPLIER_SIMULATION_POLICY.l4Autonomy, false);
  assert.equal(SUPPLIER_SIMULATION_POLICY.productionMutation, false);
  assert.equal(SUPPLIER_SIMULATION_POLICY.simulationEqualsProduction, false);

  const proposed = await openAndProposeSupplierSimulation({
    userId: 'us-agt-01-test-user',
    role: 'executive',
  });
  assert.ok(proposed.pendingAction, 'expected pending proposal');
  assert.equal(proposed.pendingAction?.toolId, SUPPLIER_SIMULATION_TOOL_ID);
  assert.equal(proposed.pendingAction?.requiresApproval, true);
  assert.equal(proposed.pendingAction?.status, 'proposed');
  assert.equal(proposed.agent.status, 'awaiting_approval');

  const rejected = await decideSupplierSimulation({
    userId: 'us-agt-01-test-user',
    agentType: 'executive_agent',
    actionId: proposed.pendingAction!.id,
    decision: 'reject',
  });
  assert.equal(rejected.pendingAction, null);
  assert.ok(rejected.actions.some((a: { status: string }) => a.status === 'rejected'));

  const proposed2 = await openAndProposeSupplierSimulation({
    userId: 'us-agt-01-test-user-2',
    role: 'executive',
  });
  const actionId = proposed2.pendingAction!.id;
  const approved = await decideSupplierSimulation({
    userId: 'us-agt-01-test-user-2',
    agentType: 'executive_agent',
    actionId,
    decision: 'approve',
  });
  assert.equal(approved.pendingAction, null);
  const done = approved.actions.find((a: { id: string }) => a.id === actionId);
  assert.ok(done, 'approved action retained');
  assert.ok(
    approved.messages.some((m: { content: string }) => /simulation completed/i.test(m.content)),
    'prototype simulation message expected',
  );
  assert.ok(
    approved.messages.every((m: { content: string }) => !/production (order|vendor|mutat)/i.test(m.content)),
    'must not claim production mutation',
  );

  console.log('ok - US-AGT-01 propose+approval supplier simulation (L4 false; sim != production)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

