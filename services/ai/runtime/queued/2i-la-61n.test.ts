import assert from 'node:assert/strict';
import {
  AUTO_FLAGS,
  CANDIDATE_TABLES,
  CAPABILITY_FLAGS,
  DEPLOYMENT_STATE,
  ENGINEERING_AGENT_ROLES,
  ENGINEERING_DEPARTMENTS,
  GIT_SURFACES,
  GPU_PROVIDERS,
  HARDWARE_STATES,
  IDE_ADAPTERS,
  IMPLEMENTATION_SLICES,
  IMPLEMENTATION_STARTED,
  INVARIANTS,
  L4_AUTONOMY_ENABLED,
  NEXT_STORY,
  PARALLEL_FILE_WRITE_DEFAULT,
  PLUGIN_TYPES,
  PROVIDER_STATES,
  QUEUE_AFTER,
  REPOSITORY_GRAPH_NODES,
  SOFTWARE_FACTORY_PIPELINE,
  STORY_ID,
  STORY_REVISION,
  STORY_VERSION,
  SUPER_BRAIN_COORDINATES,
  TIP_LANDED,
  agentRoleGrantsPermission,
  allAutoFlagsFalse,
  allCapabilityFlagsFalse,
  cliIsCloudRoot,
  engineeringBrainHasProductionAuthority,
  generatedCodeIsValidated,
  gpuProviderIsPartnership,
  moreAgentsExpandAuthority,
  parallelFileWriteAllowedByDefault,
  privateDataMayTrainModels,
  qpuIsGpu,
  sdkBypassesGuardian,
  storyIsImplemented,
} from './2i-la-61n';

assert.equal(STORY_ID, '2I-LA-61N');
assert.equal(STORY_VERSION, 'V740');
assert.equal(STORY_REVISION, 'C');
assert.equal(DEPLOYMENT_STATE, 'QUEUED');
assert.equal(IMPLEMENTATION_STARTED, false);
assert.equal(L4_AUTONOMY_ENABLED, false);
assert.equal(PARALLEL_FILE_WRITE_DEFAULT, false);
assert.equal(TIP_LANDED, false);
assert.equal(QUEUE_AFTER, '2I-LA-61M');
assert.equal(NEXT_STORY, '2I-LA-61O');
assert.equal(storyIsImplemented(), false);
assert.equal(allCapabilityFlagsFalse(), true);
assert.equal(allAutoFlagsFalse(), true);

for (const [flag, value] of Object.entries(CAPABILITY_FLAGS)) {
  assert.equal(value, false, `${flag} must remain false while queued`);
}

for (const [flag, value] of Object.entries(AUTO_FLAGS)) {
  assert.equal(value, false, `${flag} must remain false`);
}

assert.equal(AUTO_FLAGS.AUTO_PRODUCTION_CODE_WRITE, false);
assert.equal(AUTO_FLAGS.AUTO_MAIN_PUSH, false);
assert.equal(AUTO_FLAGS.AUTO_FORCE_PUSH, false);
assert.equal(AUTO_FLAGS.AUTO_PRIVATE_CODE_CROSS_TENANT_REUSE, false);
assert.equal(AUTO_FLAGS.AUTO_PRIVATE_DATA_TRAINING, false);
assert.equal(AUTO_FLAGS.AUTO_GUARDIAN_OVERRIDE, false);

assert.equal(SUPER_BRAIN_COORDINATES.length, 16);
assert.ok(SUPER_BRAIN_COORDINATES.includes('ArchitectureBrain'));
assert.ok(SUPER_BRAIN_COORDINATES.includes('GPUComputeBrain'));

assert.equal(ENGINEERING_DEPARTMENTS.length, 20);
assert.ok(ENGINEERING_DEPARTMENTS.includes('SECURITY'));
assert.ok(ENGINEERING_DEPARTMENTS.includes('RELEASE_ENGINEERING'));

assert.ok(ENGINEERING_AGENT_ROLES.includes('ChiefArchitectAgent'));
assert.ok(ENGINEERING_AGENT_ROLES.includes('RLSAgent'));
assert.ok(ENGINEERING_AGENT_ROLES.includes('PromptInjectionSecurityAgent'));
assert.ok(ENGINEERING_AGENT_ROLES.includes('CodeMemoryAgent'));
assert.equal(agentRoleGrantsPermission('ChiefArchitectAgent'), false);
assert.equal(agentRoleGrantsPermission('ReleaseAgent'), false);
assert.equal(engineeringBrainHasProductionAuthority(), false);
assert.equal(moreAgentsExpandAuthority(ENGINEERING_AGENT_ROLES.length), false);

assert.deepEqual(REPOSITORY_GRAPH_NODES[0], 'REPOSITORY');
assert.ok(REPOSITORY_GRAPH_NODES.includes('MIGRATION'));
assert.ok(REPOSITORY_GRAPH_NODES.includes('ARTIFACT'));

assert.equal(SOFTWARE_FACTORY_PIPELINE[0], 'REQUIREMENT');
assert.equal(SOFTWARE_FACTORY_PIPELINE.at(-1), 'RELEASE_CANDIDATE');
assert.ok(!SOFTWARE_FACTORY_PIPELINE.includes('PRODUCTION' as never));

assert.equal(generatedCodeIsValidated('any-candidate'), false);

assert.deepEqual([...GPU_PROVIDERS], ['AMD', 'NVIDIA', 'INTEL', 'APPLE', 'QUALCOMM', 'OTHER_VERIFIED']);
for (const provider of GPU_PROVIDERS) {
  assert.equal(gpuProviderIsPartnership(provider), false);
}

assert.equal(HARDWARE_STATES[0], 'UNKNOWN');
assert.ok(HARDWARE_STATES.indexOf('DETECTED') < HARDWARE_STATES.indexOf('SUPPORTED'));
assert.ok(HARDWARE_STATES.indexOf('SUPPORTED') < HARDWARE_STATES.indexOf('OPTIMIZED'));
assert.equal(PROVIDER_STATES[0], 'NOT_CONFIGURED');
assert.ok(!PROVIDER_STATES.includes('LIVE' as never));
assert.equal(qpuIsGpu(), false);
assert.equal(privateDataMayTrainModels(), false);
assert.equal(parallelFileWriteAllowedByDefault(), false);
assert.equal(sdkBypassesGuardian(), false);
assert.equal(cliIsCloudRoot(), false);

assert.deepEqual([...GIT_SURFACES], ['LOCAL', 'GITHUB', 'GITLAB']);
assert.ok(IDE_ADAPTERS.includes('CURSOR'));
assert.ok(IDE_ADAPTERS.includes('VS_CODE'));
assert.ok(PLUGIN_TYPES.includes('CONTROL_TOWER'));
assert.ok(PLUGIN_TYPES.includes('INDUSTRY_PACK'));

assert.equal(IMPLEMENTATION_SLICES.length, 58);
assert.equal(IMPLEMENTATION_SLICES[0], 'SoftwareEngineeringSuperBrain');
assert.equal(IMPLEMENTATION_SLICES.at(-1), 'ReleaseIntelligenceBrain');
assert.equal(CANDIDATE_TABLES.includes('engineering_audit_events'), true);
assert.equal(CANDIDATE_TABLES.includes('development_locks'), true);

for (const [name, value] of Object.entries(INVARIANTS)) {
  assert.equal(value, false, `invariant ${name} must stay denied`);
}

assert.equal(INVARIANTS.engineeringBrainIsProductionAuthority, false);
assert.equal(INVARIANTS.agentRoleIsPermission, false);
assert.equal(INVARIANTS.codeMemoryIsCopyRights, false);
assert.equal(INVARIANTS.gpuProviderIsPartnership, false);
assert.equal(INVARIANTS.qpuIsGpu, false);
assert.equal(INVARIANTS.sdkIsAuthorityBypass, false);
assert.equal(INVARIANTS.cliIsCloudRoot, false);
assert.equal(INVARIANTS.developerIsProdAdmin, false);
assert.equal(INVARIANTS.failureLabIsProductionAttack, false);

console.log('2I-LA-61N Revision C queued architecture contracts hold (NOT IMPLEMENTED).');
