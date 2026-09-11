import { validateRuntimeConvergence } from './runtime-convergence-validator';

const storage = `localFirst: true\nautonomousCloudCreation: false\nautonomousProductionReplication: false\ncrossTenantReplicationAllowed: false\nstatus: 'PLANNED'`;
const community = `simulationOnly: true\ncrossTenantPrivateDataAllowed: false\nautonomousProductionMutationAllowed: false`;
const barrel = [
  "export * from './storage-compiler';",
  "export * from './mission-scheduler';",
  "export * from './community-universe';",
  "export * from './runtime-convergence-validator';",
].join('\n');

const ok = validateRuntimeConvergence({
  missionSchedulerSource: 'return Object.freeze(roles.map((role) => Object.freeze({ role })));',
  barrelSource: barrel,
  availableModules: ['storage-compiler', 'mission-scheduler', 'community-universe', 'runtime-convergence-validator'],
  storageCompilerSource: storage,
  communityUniverseSource: community,
});
if (!ok.ok || !ok.localFirst || ok.cloudExecutionVerified || ok.productionMutationAllowed) throw new Error('expected safe convergence pass');

const broken = validateRuntimeConvergence({
  missionSchedulerSource: 'return Object.freeze(roles.map((role) => Object.freeze({ role }))));',
  barrelSource: '',
  availableModules: ['mission-scheduler'],
  storageCompilerSource: "status: 'CLOUD_CONFIRMED'",
  communityUniverseSource: '',
});
if (broken.ok) throw new Error('broken runtime should fail convergence');
if (!broken.findings.some((f) => f.code === 'SYNTAX_RISK')) throw new Error('syntax risk not detected');
if (!broken.findings.some((f) => f.code === 'EXPORT_GAP')) throw new Error('export gap not detected');
if (!broken.findings.some((f) => f.code === 'GUARDRAIL_MISSING')) throw new Error('guardrail gap not detected');

console.log('12D-85 runtime convergence contracts: OK');
