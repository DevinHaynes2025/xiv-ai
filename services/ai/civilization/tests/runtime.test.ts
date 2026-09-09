import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BEYOND_CLOUD_PLATFORMS } from '../compute';
import { adaptRecommendation, describeOperatingTime, lifecyclePosture } from '../temporal';
import { codeOf, twoUniverseWorld } from './harness';

test('an application asks for capabilities and never names a chip vendor', () => {
  const world = twoUniverseWorld();

  const intel = world.xiv.registerRuntimeNode(world.alphaFounder, {
    nodeKey: 'intel-batch-01',
    platformClass: 'cpu_intel',
    status: 'available',
  });
  const nvidia = world.xiv.registerRuntimeNode(world.alphaFounder, {
    nodeKey: 'nvidia-inference-01',
    platformClass: 'gpu_nvidia',
    status: 'available',
  });

  world.xiv.declareRuntimeCapability(world.alphaFounder, {
    nodeId: intel.id,
    capabilityKey: 'compute.cpu.general',
    verified: true,
  });
  world.xiv.declareRuntimeCapability(world.alphaFounder, {
    nodeId: nvidia.id,
    capabilityKey: 'compute.gpu.inference',
    verified: true,
  });
  world.xiv.declareRuntimeCapability(world.alphaFounder, {
    nodeId: nvidia.id,
    capabilityKey: 'security.tenant_isolated_memory',
    verified: true,
  });

  const placement = world.xiv.requestCompute(world.alphaFounder, {
    required: ['compute.gpu.inference'],
    preferred: ['security.tenant_isolated_memory'],
  });

  assert.equal(placement.node.id, nvidia.id);
  assert.deepEqual(placement.unmatchedPreferred, []);

  const cpuPlacement = world.xiv.requestCompute(world.alphaFounder, { required: ['compute.cpu.general'] });
  assert.equal(cpuPlacement.node.id, intel.id);
});

test('an unverified or missing capability is refused rather than approximated', () => {
  const world = twoUniverseWorld();

  const node = world.xiv.registerRuntimeNode(world.alphaFounder, {
    nodeKey: 'edge-01',
    platformClass: 'edge',
    status: 'available',
  });
  world.xiv.declareRuntimeCapability(world.alphaFounder, {
    nodeId: node.id,
    capabilityKey: 'compute.gpu.training',
    verified: false,
  });

  assert.equal(
    codeOf(() => world.xiv.requestCompute(world.alphaFounder, { required: ['compute.gpu.training'] })),
    'runtime_capability_unavailable',
  );
});

test('mobile, web and store-distributed runtimes are first class', () => {
  const world = twoUniverseWorld();

  for (const platformClass of ['ios', 'android', 'android_google_play', 'web', 'cpu_amd', 'cloud_cpu'] as const) {
    const node = world.xiv.registerRuntimeNode(world.alphaFounder, {
      nodeKey: `node-${platformClass}`,
      platformClass,
      status: 'available',
    });
    world.xiv.declareRuntimeCapability(world.alphaFounder, {
      nodeId: node.id,
      capabilityKey: 'runtime.foreground_ui',
      verified: true,
    });
    assert.equal(node.isExternalUnconfigured, false);
  }

  const placement = world.xiv.requestCompute(world.alphaFounder, { required: ['runtime.foreground_ui'] });
  assert.ok(placement.node.nodeKey.startsWith('node-'));
});

test('space infrastructure exists as an interface and refuses to be used', () => {
  const world = twoUniverseWorld();

  for (const platformClass of BEYOND_CLOUD_PLATFORMS) {
    const node = world.xiv.registerRuntimeNode(world.alphaFounder, {
      nodeKey: `space-${platformClass}`,
      platformClass,
      provider: 'unconfigured-external',
      status: 'available',
    });

    // The requested status is ignored. These providers stay unconfigured.
    assert.equal(node.status, 'unconfigured_external');
    assert.equal(node.isExternalUnconfigured, true);

    world.xiv.declareRuntimeCapability(world.alphaFounder, {
      nodeId: node.id,
      capabilityKey: 'network.intermittent',
      verified: true,
    });
  }

  assert.equal(
    codeOf(() => world.xiv.requestCompute(world.alphaFounder, { required: ['network.intermittent'] })),
    'runtime_external_unconfigured',
  );
});

test('runtime nodes belong to one universe', () => {
  const world = twoUniverseWorld();

  world.xiv.registerRuntimeNode(world.alphaFounder, {
    nodeKey: 'alpha-only',
    platformClass: 'cloud_cpu',
    status: 'available',
  });

  assert.equal(world.xiv.listRuntimeNodes(world.alphaFounder).length, 1);
  assert.equal(world.xiv.listRuntimeNodes(world.betaFounder).length, 0);
});

test('operational time is more than a timestamp', () => {
  const time = describeOperatingTime(new Date('2026-12-25T22:15:30.000Z'), {
    region: 'eu-west',
    utcOffsetMinutes: 60,
    fiscalYearStartMonth: 1,
    holidays: { '2026-12-25': 'Christmas Day' },
  });

  assert.equal(time.hourOfDay, 23);
  assert.equal(time.dayPhase, 'evening');
  assert.equal(time.season, 'winter');
  assert.equal(time.fiscalQuarter, 4);
  assert.equal(time.fiscalPeriodLabel, 'FY2026 Q4');
  assert.equal(time.isHoliday, true);
  assert.equal(time.holidayName, 'Christmas Day');
  assert.equal(time.region, 'eu-west');
  assert.equal(time.calendarSystem, 'gregorian');
});

test('a non-gregorian fiscal calendar shifts the quarter without shifting the date', () => {
  const april = describeOperatingTime(new Date('2026-04-02T10:00:00.000Z'), { fiscalYearStartMonth: 4 });
  assert.equal(april.fiscalQuarter, 1);
  assert.equal(april.fiscalYear, 2026);

  const march = describeOperatingTime(new Date('2026-03-31T10:00:00.000Z'), { fiscalYearStartMonth: 4 });
  assert.equal(march.fiscalQuarter, 4);
  assert.equal(march.fiscalYear, 2025);
});

test('a recommendation adapts to the lifecycle of the universe it serves', () => {
  const seed = adaptRecommendation({
    stage: 'seed',
    operatingTime: describeOperatingTime(new Date('2026-09-08T10:00:00.000Z'), { region: 'eu-west' }),
    recommendation: 'Reallocate 15 percent of volume',
  });
  const mature = adaptRecommendation({
    stage: 'mature',
    operatingTime: describeOperatingTime(new Date('2026-09-08T10:00:00.000Z'), { region: 'eu-west' }),
    recommendation: 'Reallocate 15 percent of volume',
  });

  assert.notEqual(seed.recommendation, mature.recommendation);
  assert.equal(seed.posture.approvalBias, 'conservative');
  assert.equal(mature.posture.avoids.includes('speculative expansion'), true);
  assert.equal(seed.timing, 'Execution window is open.');
});

test('timing advice defers work outside a working window', () => {
  const holiday = adaptRecommendation({
    stage: 'operational',
    operatingTime: describeOperatingTime(new Date('2026-12-25T10:00:00.000Z'), {
      region: 'eu-west',
      holidays: { '2026-12-25': 'Christmas Day' },
    }),
    recommendation: 'Send the supplier notice',
  });
  assert.equal(holiday.timing, 'Defer execution: Christmas Day in eu-west.');

  const weekend = adaptRecommendation({
    stage: 'operational',
    operatingTime: describeOperatingTime(new Date('2026-09-06T10:00:00.000Z'), { region: 'eu-west' }),
    recommendation: 'Send the supplier notice',
  });
  assert.equal(weekend.timing, 'Defer execution: outside the regional working week.');

  const overnight = adaptRecommendation({
    stage: 'operational',
    operatingTime: describeOperatingTime(new Date('2026-09-08T02:00:00.000Z'), { region: 'eu-west' }),
    recommendation: 'Send the supplier notice',
  });
  assert.equal(overnight.timing, 'Prepare now and execute in regional business hours.');
});

test('the universe lifecycle only moves through declared transitions', () => {
  const world = twoUniverseWorld();

  assert.equal(world.xiv.readUniverse(world.alphaFounder).lifecycleStage, 'created');
  assert.equal(
    codeOf(() => world.xiv.advanceLifecycle(world.alphaFounder, { to: 'operational' })),
    'universe_stage_transition_invalid',
  );

  for (const stage of ['seed', 'growth', 'operational', 'mature', 'transformation'] as const) {
    world.xiv.advanceLifecycle(world.alphaFounder, { to: stage });
    assert.equal(world.xiv.readUniverse(world.alphaFounder).lifecycleStage, stage);
    assert.equal(lifecyclePosture(stage).stage, stage);
  }

  world.xiv.advanceLifecycle(world.alphaFounder, { to: 'archive' });
  assert.equal(
    codeOf(() =>
      world.xiv.registerAgent(world.alphaFounder, {
        agentKey: 'after-archive',
        displayName: 'After Archive',
        profession: 'generic',
        modelRuntime: 'test-runtime',
        humanSupervisorId: world.alphaFounder.userId,
      }),
    ),
    'guardian_universe_archived',
  );
});
