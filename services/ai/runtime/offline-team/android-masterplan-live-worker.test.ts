import { strict as assert } from 'node:assert';
import { buildAndroidStudioCapability } from './android-studio-capability';
import { MASTER_PLAN_CURRICULUM } from './master-plan-curriculum';
import { buildMissionPoolPlan } from './live-mission-worker-pool';

const android = buildAndroidStudioCapability();
assert.equal(android.state, 'UNVERIFIED');
assert.equal(android.tool, 'ANDROID_STUDIO');
assert.ok(MASTER_PLAN_CURRICULUM.length >= 7);

const plan = buildMissionPoolPlan({
  missionId: 'm-42',
  tenantId: 'xiv-internal',
  objective: 'Validate Android UX and backend integration offline',
  roles: ['Mobile Engineer', 'QA', 'Backend', 'Security'],
  evidenceRefs: ['story:12D-42'],
  confidentiality: 'CONFIDENTIAL',
});
assert.equal(plan.maxConcurrent, 4);
assert.equal(plan.assignments.every(a => a.provider === 'OLLAMA'), true);

console.log('12D-42 Android/master-plan/live worker contracts: OK');
