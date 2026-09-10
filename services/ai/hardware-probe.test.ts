/**
 * EY3 Hardware capability probe — honesty contract.
 * Run: npx tsx hardware-probe.test.ts
 */

import assert from 'node:assert/strict';

import {
  HARDWARE_PROBE_POLICY,
  assertNoFakeVerifiedSilicon,
  clampSiliconState,
  collectHardwareProbe,
  hardwareProbeAllowsL4,
  inferCpuVendor,
  inferGpuVendor,
} from './hardware-probe';

async function main() {
  assert.equal(HARDWARE_PROBE_POLICY.l4Autonomy, false);
  assert.equal(HARDWARE_PROBE_POLICY.allowsFakeVerifiedSilicon, false);
  assert.equal(HARDWARE_PROBE_POLICY.productionMutation, false);
  assert.equal(hardwareProbeAllowsL4(), false);

  assert.equal(inferCpuVendor('AMD Ryzen 7 260 w/ Radeon 780M Graphics'), 'AMD');
  assert.equal(inferGpuVendor('AMD Radeon 780M Graphics'), 'AMD');
  assert.equal(clampSiliconState('VERIFIED', 'WAITING'), 'DETECTED');
  assert.equal(clampSiliconState('SUPPORTED', 'WAITING'), 'DETECTED');
  assert.equal(clampSiliconState('WAITING', 'DETECTED'), 'WAITING');

  const amd = await collectHardwareProbe({
    host: {
      cpuModel: 'AMD Ryzen 7 260 w/ Radeon 780M Graphics',
      gpuNames: ['AMD Radeon 780M Graphics'],
      npuNames: ['NPU Compute Accelerator Device'],
      source: 'windows_cim',
    },
    ollamaCheck: async () => ({
      reachable: true,
      models: ['qwen2.5-coder:7b'],
      notes: 'injected reachable',
    }),
  });

  assert.equal(amd.storyId, 'EY3');
  assert.equal(amd.l4Autonomy, false);
  assert.equal(amd.cpu.vendor, 'AMD');
  assert.equal(amd.cpu.state, 'DETECTED');
  assert.equal(amd.gpu.vendor, 'AMD');
  assert.equal(amd.gpu.state, 'DETECTED');
  assert.equal(amd.npu.state, 'DETECTED');
  assert.equal(amd.ollama.reachable, true);
  assert.equal(amd.ollama.state, 'DETECTED');
  assert.deepEqual(amd.ollama.models, ['qwen2.5-coder:7b']);
  assertNoFakeVerifiedSilicon(amd);
  assert.notEqual(String(amd.gpu.state).toUpperCase(), 'VERIFIED');
  assert.notEqual(String(amd.npu.state).toUpperCase(), 'VERIFIED');

  const waiting = await collectHardwareProbe({
    host: { cpuModel: 'AMD Ryzen 7 260', gpuNames: [], npuNames: [], source: 'none' },
    ollamaCheck: async () => ({
      reachable: false,
      models: [],
      notes: 'injected unreachable',
    }),
  });
  assert.equal(waiting.gpu.state, 'WAITING');
  assert.equal(waiting.npu.state, 'WAITING');
  assert.equal(waiting.ollama.reachable, false);
  assert.equal(waiting.ollama.state, 'UNAVAILABLE');
  assertNoFakeVerifiedSilicon(waiting);

  const prevGpu = process.env.XIV_GPU_STATE;
  const prevNpu = process.env.XIV_NPU_STATE;
  process.env.XIV_GPU_STATE = 'VERIFIED';
  process.env.XIV_NPU_STATE = 'VERIFIED';
  try {
    const clamped = await collectHardwareProbe({
      host: {
        cpuModel: 'AMD Ryzen 7 260',
        gpuNames: ['AMD Radeon 780M Graphics'],
        npuNames: ['NPU Compute Accelerator Device'],
        source: 'env',
      },
      ollamaCheck: async () => ({ reachable: false, models: [], notes: 'down' }),
    });
    assert.equal(clamped.gpu.state, 'DETECTED');
    assert.equal(clamped.npu.state, 'DETECTED');
    assertNoFakeVerifiedSilicon(clamped);
  } finally {
    if (prevGpu === undefined) delete process.env.XIV_GPU_STATE;
    else process.env.XIV_GPU_STATE = prevGpu;
    if (prevNpu === undefined) delete process.env.XIV_NPU_STATE;
    else process.env.XIV_NPU_STATE = prevNpu;
  }

  console.log('hardware-probe.test.ts: all assertions passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
