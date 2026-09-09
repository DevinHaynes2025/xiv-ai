import assert from 'node:assert/strict';
import {
  AUTO_FLAGS,
  CANONICAL_HOME,
  CAPABILITY_FLAGS,
  CONSUMER_SURFACES,
  CORE_COMPONENTS,
  DEPLOYMENT_STATE,
  IMPLEMENTATION_STARTED,
  INVARIANTS,
  L4_AUTONOMY_ENABLED,
  STORY_ID,
  STORY_TITLE,
  copyFullStoryIntoEnterpriseOs,
  engineeringCivilizationOwnsCanonicalStory,
  enterpriseOsOwnsCanonicalStory,
  mobileOwnsCanonicalStory,
  allAutoFlagsFalse,
  allCapabilityFlagsFalse,
  storyIsImplemented,
} from './xiv-gob-166';
import {
  canonicalHomeForStory,
  nextStoryDefaultSurface,
  surfaceOwnsCanonicalComputeInfra,
  SURFACE_OWNS,
} from './xiv-work-surface-routing';

assert.equal(STORY_ID, 'XIV-GOB-166');
assert.equal(STORY_TITLE, 'Core Compute / Agent Infrastructure');
assert.equal(DEPLOYMENT_STATE, 'QUEUED');
assert.equal(IMPLEMENTATION_STARTED, false);
assert.equal(L4_AUTONOMY_ENABLED, false);
assert.equal(storyIsImplemented(), false);
assert.equal(allCapabilityFlagsFalse(), true);
assert.equal(allAutoFlagsFalse(), true);

assert.equal(CANONICAL_HOME, 'GLOBAL_OPERATIONS_BRAIN');
assert.equal(canonicalHomeForStory('CORE_COMPUTE_AGENT_INFRASTRUCTURE'), 'GLOBAL_OPERATIONS_BRAIN');
assert.equal(canonicalHomeForStory('ENTERPRISE_CUSTOMER_WORKFLOW'), 'ENTERPRISE_OPERATING_SYSTEM');
assert.equal(canonicalHomeForStory('ENGINEERING_RD'), 'ENGINEERING_CIVILIZATION_ARCHITECTURE');
assert.equal(canonicalHomeForStory('MOBILE_PRODUCT_UI'), 'MOBILE_PRODUCT');
assert.equal(nextStoryDefaultSurface(), 'GLOBAL_OPERATIONS_BRAIN');

assert.equal(surfaceOwnsCanonicalComputeInfra('GLOBAL_OPERATIONS_BRAIN'), true);
assert.equal(surfaceOwnsCanonicalComputeInfra('ENTERPRISE_OPERATING_SYSTEM'), false);
assert.equal(surfaceOwnsCanonicalComputeInfra('ENGINEERING_CIVILIZATION_ARCHITECTURE'), false);
assert.equal(surfaceOwnsCanonicalComputeInfra('MOBILE_PRODUCT'), false);

assert.equal(enterpriseOsOwnsCanonicalStory(), false);
assert.equal(engineeringCivilizationOwnsCanonicalStory(), false);
assert.equal(mobileOwnsCanonicalStory(), false);
assert.equal(copyFullStoryIntoEnterpriseOs(), false);

assert.ok(CONSUMER_SURFACES.includes('ENTERPRISE_OPERATING_SYSTEM'));
assert.ok(CORE_COMPONENTS.includes('AmdSoftwareAccelerationAdapterV100'));
assert.ok(CORE_COMPONENTS.includes('CpuGpuNpuRouterV100'));
assert.ok(CORE_COMPONENTS.includes('XivMessageBusV100'));
assert.ok(CORE_COMPONENTS.includes('XivTaskGraphV100'));
assert.ok(CORE_COMPONENTS.includes('HomeBaseReceiptLedgerV100'));

assert.ok(SURFACE_OWNS.GLOBAL_OPERATIONS_BRAIN.includes('cpu_gpu_npu_routing'));
assert.ok(SURFACE_OWNS.GLOBAL_OPERATIONS_BRAIN.includes('home_base_receipts'));
assert.ok(SURFACE_OWNS.ENTERPRISE_OPERATING_SYSTEM.includes('erp_crm'));
assert.ok(!SURFACE_OWNS.ENTERPRISE_OPERATING_SYSTEM.includes('cpu_gpu_npu_routing' as never));
assert.ok(SURFACE_OWNS.ENGINEERING_CIVILIZATION_ARCHITECTURE.includes('quantum_research'));
assert.ok(SURFACE_OWNS.MOBILE_PRODUCT.includes('onboarding'));

for (const [flag, value] of Object.entries(CAPABILITY_FLAGS)) {
  assert.equal(value, false, `${flag} must remain false while queued`);
}
for (const [flag, value] of Object.entries(AUTO_FLAGS)) {
  assert.equal(value, false, `${flag} must remain false`);
}
for (const [name, value] of Object.entries(INVARIANTS)) {
  assert.equal(value, false, `invariant ${name} must stay denied`);
}

console.log('XIV-GOB-166 canonical home is Global operations brain (NOT IMPLEMENTED; Enterprise OS depends, does not copy).');
