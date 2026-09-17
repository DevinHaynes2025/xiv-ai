// 12D-85 — runtime convergence validator contracts.
// 12D-291 paydown: converted from a bare tsx script (custom OK output, no
// node:test summary) to a REAL node:test suite — every original scenario
// preserved; the suite is now chain-measurable.

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { validateRuntimeConvergence } from './runtime-convergence-validator';

const storage = `localFirst: true\nautonomousCloudCreation: false\nautonomousProductionReplication: false\ncrossTenantReplicationAllowed: false\nstatus: 'PLANNED'`;
const community = `simulationOnly: true\ncrossTenantPrivateDataAllowed: false\nautonomousProductionMutationAllowed: false`;
const barrel = [
  "export * from './storage-compiler';",
  "export * from './mission-scheduler';",
  "export * from './community-universe';",
  "export * from './runtime-convergence-validator';",
].join('\n');

test('12d-85 the safe converged runtime passes with every guardrail held', () => {
  const ok = validateRuntimeConvergence({
    missionSchedulerSource: 'return Object.freeze(roles.map((role) => Object.freeze({ role })));',
    barrelSource: barrel,
    availableModules: ['storage-compiler', 'mission-scheduler', 'community-universe', 'runtime-convergence-validator'],
    storageCompilerSource: storage,
    communityUniverseSource: community,
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.localFirst, true);
  assert.equal(ok.cloudExecutionVerified, false);
  assert.equal(ok.productionMutationAllowed, false);
});

test('12d-85 a broken runtime fails convergence with each gap detected', () => {
  const broken = validateRuntimeConvergence({
    missionSchedulerSource: 'return Object.freeze(roles.map((role) => Object.freeze({ role }))));',
    barrelSource: '',
    availableModules: ['mission-scheduler'],
    storageCompilerSource: "status: 'CLOUD_CONFIRMED'",
    communityUniverseSource: '',
  });
  assert.equal(broken.ok, false);
  assert.ok(broken.findings.some((f) => f.code === 'SYNTAX_RISK'), 'syntax risk not detected');
  assert.ok(broken.findings.some((f) => f.code === 'EXPORT_GAP'), 'export gap not detected');
  assert.ok(broken.findings.some((f) => f.code === 'GUARDRAIL_MISSING'), 'guardrail gap not detected');
});