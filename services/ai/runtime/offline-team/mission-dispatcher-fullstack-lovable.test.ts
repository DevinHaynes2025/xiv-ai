import assert from 'node:assert/strict';
import { buildLeanAgentFleet } from './hybrid-agent-fleet';
import { dispatchMission } from './mission-dispatcher';
import { XIV_FULL_STACK_TEAM } from './full-stack-team';
import { LOVABLE_XIV_RECEIPT, canUseLovable } from './lovable-capability-bridge';
import { buildParallelScenarios } from './parallel-scenario-lab';

const fleet = buildLeanAgentFleet();
assert.equal(fleet.length, 100);

const assignment = dispatchMission({
  missionId: 'm-ux-001',
  tenantId: 'xiv-internal',
  objective: 'Improve XIV mobile and desktop UX',
  domain: 'UX',
  priority: 'HIGH',
  confidentiality: 'INTERNAL',
}, fleet);
assert.ok(assignment.selectedAgentIds.length >= 2);
assert.ok(assignment.selectedAgentIds.length <= 8);
assert.ok(assignment.maxConcurrent <= 8);

assert.equal(XIV_FULL_STACK_TEAM.length, 10);
assert.equal(LOVABLE_XIV_RECEIPT.connected, true);
assert.equal(LOVABLE_XIV_RECEIPT.visibility, 'PRIVATE');
assert.equal(canUseLovable('INTERNAL'), true);
assert.equal(canUseLovable('TOP_SECRET'), false);

const sim = buildParallelScenarios('m-ux-001', Array.from({ length: 40 }, (_, i) => `scenario-${i}`), ['TEST:EVIDENCE']);
assert.equal(sim.actualScenarioCount, 32);
assert.equal(sim.scaleTarget, 'SHARDED_TRILLION_TARGET');
assert.ok(sim.scenarios.every(s => s.status === 'SIMULATION'));

assert.throws(() => dispatchMission({
  missionId: 'm-secret',
  tenantId: 'xiv-internal',
  objective: 'secret task',
  domain: 'SECURITY',
  priority: 'CRITICAL_REVIEW',
  requiresOnline: true,
  confidentiality: 'TOP_SECRET',
}, fleet));

console.log('12D-41 mission dispatcher/full-stack/Lovable contracts: OK');
