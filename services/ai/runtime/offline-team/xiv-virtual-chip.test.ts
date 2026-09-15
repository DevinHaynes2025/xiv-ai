// 12D-240 tests — adversarial coverage for the XIV virtual-chip declaration
// registry. Under test: declared-not-proven honesty (promotion structurally
// refused), digest re-derivation (tamper refuses), duplicate-declaration
// refusal, allowlisted architectures, the untouched-physical-plane guardrail,
// and the honest flags. Nothing here opens a device, a driver, or a network.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  XIV_VIRTUAL_CHIP_POLICY,
  XIV_VIRTUAL_CHIP_GUARDRAILS,
  VirtualChipRegistry,
  verifyVirtualChipAdapter,
  type VirtualChipAdapter,
} from './xiv-virtual-chip';

const T0 = 1_000_000_000;
const GENESIS = 'virtual-chip-genesis-0001';

const declareCpu = (registry: VirtualChipRegistry, overrides?: { name?: string; atMs?: number }) =>
  registry.declare({
    adapterName: overrides?.name ?? 'xiv-virtual-cpu-adapter',
    architecture: 'cpu',
    declaredBy: 'devin',
    declaredAtMs: overrides?.atMs ?? T0,
  });

test('12D-240 policy and guardrails match the charter and are frozen', () => {
  assert.equal(XIV_VIRTUAL_CHIP_POLICY.policyVersion, '12d-240-v1');
  assert.deepEqual(
    XIV_VIRTUAL_CHIP_POLICY.allowedArchitectures,
    ['cpu', 'gpu', 'npu', 'fpga', 'asic', 'neuromorphic', 'quantum'],
  );
  assert.equal(XIV_VIRTUAL_CHIP_GUARDRAILS.compatibilityIsDeclaredNotProven, true);
  assert.equal(XIV_VIRTUAL_CHIP_GUARDRAILS.provenPinnedFalseUntilMeasuredDrill, true);
  assert.equal(XIV_VIRTUAL_CHIP_GUARDRAILS.quantumPathProven, false);
  assert.equal(XIV_VIRTUAL_CHIP_GUARDRAILS.promotionRefusedInThisContract, true);
  assert.equal(XIV_VIRTUAL_CHIP_GUARDRAILS.measuredDrillRequiredForProven, true);
  assert.equal(XIV_VIRTUAL_CHIP_GUARDRAILS.touchesNoPhysicalDevice, true);
  assert.equal(XIV_VIRTUAL_CHIP_GUARDRAILS.zeroModelCalls, true);
  assert.equal(XIV_VIRTUAL_CHIP_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(XIV_VIRTUAL_CHIP_GUARDRAILS.learningPromoted, false);
  assert.equal(XIV_VIRTUAL_CHIP_GUARDRAILS.automaticRecovery, false);
  assert.equal(XIV_VIRTUAL_CHIP_GUARDRAILS.billionUsersProven, false);
  assert.equal(XIV_VIRTUAL_CHIP_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(Object.isFrozen(XIV_VIRTUAL_CHIP_POLICY), true);
  assert.equal(Object.isFrozen(XIV_VIRTUAL_CHIP_GUARDRAILS), true);
});

test('12D-240 declaration pins DECLARED + proven:false and the digest re-derives', () => {
  const registry = new VirtualChipRegistry(GENESIS);
  const adapter = declareCpu(registry);
  assert.equal(adapter.compatibility, 'DECLARED');
  assert.equal(adapter.proven, false);
  assert.equal(adapter.quantumPathProven, false);
  assert.match(adapter.adapterId, /^[0-9a-f]{64}$/);
  assert.equal(adapter.adapterId, adapter.declarationDigest);
  assert.equal(Object.isFrozen(adapter), true);
  const verdict = registry.verify();
  assert.equal(verdict.ok, true);
  assert.equal(verdict.adapters, 1);
});

test('12D-240 a duplicate exact declaration refuses (declared exactly once)', () => {
  const registry = new VirtualChipRegistry(GENESIS);
  declareCpu(registry);
  assert.throws(
    () => registry.declare({
      adapterName: 'xiv-virtual-cpu-adapter',
      architecture: 'cpu', declaredBy: 'devin', declaredAtMs: T0,
    }),
    /already registered \(declared exactly once\)/,
  );
  // Any input difference is a DISTINCT digest and registers as a new adapter.
  const second = registry.declare({
    adapterName: 'xiv-virtual-cpu-adapter',
    architecture: 'cpu', declaredBy: 'devin', declaredAtMs: T0 + 1,
  });
  assert.equal(registry.size, 2);
  assert.match(second.adapterId, /^[0-9a-f]{64}$/);
});

test('12D-240 promotion to proven is structurally refused in this contract', () => {
  const registry = new VirtualChipRegistry(GENESIS);
  const adapter = declareCpu(registry);
  assert.throws(
    () => registry.promoteToProven(adapter.adapterId, 'drill-evidence-ref'),
    /requires a measured drill.*future, separately reviewed story/,
  );
  // The refusal changed nothing: still DECLARED, still unproven, still verifying.
  const after = registry.adapterFor(adapter.adapterId)!;
  assert.equal(after.compatibility, 'DECLARED');
  assert.equal(after.proven, false);
  assert.equal(registry.verify().ok, true);
});

test('12D-240 off-allowlist architectures refuse; every allowlisted arch declares honestly', () => {
  const registry = new VirtualChipRegistry(GENESIS);
  assert.throws(
    () => registry.declare({
      adapterName: 'xiv-virtual-analog-chip', architecture: 'analog',
      declaredBy: 'devin', declaredAtMs: T0,
    }),
    /architecture must be one of/,
  );
  // Every policy-listed architecture declares — including quantum AS A
  // DECLARATION, with quantumPathProven pinned false.
  for (const arch of XIV_VIRTUAL_CHIP_POLICY.allowedArchitectures) {
    const adapter = registry.declare({
      adapterName: `xiv-virtual-${arch}-adapter`,
      architecture: arch, declaredBy: 'devin', declaredAtMs: T0,
    });
    assert.equal(adapter.architecture, arch);
    assert.equal(adapter.proven, false);
    if (arch === 'quantum') assert.equal(adapter.quantumPathProven, false);
  }
  assert.equal(registry.verify().adapters, 7);
});

test('12D-240 malformed declarations fail closed without registering', () => {
  const registry = new VirtualChipRegistry(GENESIS);
  assert.throws(
    () => registry.declare({ architecture: 'cpu', declaredBy: 'devin', declaredAtMs: T0 } as never),
    /exactly the keys/,
  );
  assert.throws(
    () => registry.declare({
      adapterName: 'x', architecture: 'cpu', declaredBy: 'devin', declaredAtMs: T0,
    }),
    /adapterName/,
  );
  assert.throws(
    () => registry.declare({
      adapterName: 'xiv-virtual-cpu-adapter', architecture: 'cpu',
      declaredBy: 'devin', declaredAtMs: 1.5,
    }),
    /declaredAtMs/,
  );
  assert.throws(() => new VirtualChipRegistry('short'), /genesis/);
  assert.equal(registry.size, 0);
  assert.equal(registry.verify().adapters, 0);
});

test('12D-240 a tampered adapter record refuses verification (digest re-derivation)', () => {
  const registry = new VirtualChipRegistry(GENESIS);
  const adapter = declareCpu(registry) as VirtualChipAdapter;
  // Tamper the adapterName behind the registry's back; the digest cannot re-derive.
  const forged = { ...adapter, adapterName: 'xiv-virtual-cpu-adapter-TAMPERED' } as VirtualChipAdapter;
  assert.throws(
    () => verifyVirtualChipAdapter(forged, GENESIS),
    /declaration digest mismatch — tampered/,
  );
  // A forged proven-flag (a compatibility CLAIM) refuses on the shape gate.
  const claiming = { ...adapter, compatibility: 'PROVEN', proven: true } as unknown as VirtualChipAdapter;
  assert.throws(
    () => verifyVirtualChipAdapter(claiming, GENESIS),
    /claims proven compatibility — impossible in this contract/,
  );
  // An added field (a smuggled secret) refuses on the exact-shape gate.
  const smuggled = { ...adapter, apiKey: 'sk-abcdefghijklmnopqrstuvwxyz012345' };
  assert.throws(
    () => verifyVirtualChipAdapter(smuggled as unknown as VirtualChipAdapter, GENESIS),
    /shape mismatch/,
  );
  // The live registry is untouched and still verifies.
  assert.equal(registry.verify().ok, true);
});

test('12D-240 the registry touches no physical device (structural surface audit)', () => {
  const surface = Object.getOwnPropertyNames(VirtualChipRegistry.prototype).join(',');
  assert.match(surface, /declare/);
  assert.match(surface, /promoteToProven/); // present ONLY to refuse
  assert.match(surface, /adapterFor/);
  assert.match(surface, /listAdapters/);
  assert.match(surface, /verify/);
  assert.doesNotMatch(surface, /open|write|exec|spawn|connect/);
});

test('12D-240 honest flags are stamped on every adapter record', () => {
  const registry = new VirtualChipRegistry(GENESIS);
  const adapter = registry.declare({
    adapterName: 'xiv-virtual-quantum-chip', architecture: 'quantum',
    declaredBy: 'devin', declaredAtMs: T0,
  });
  assert.equal(adapter.guardrails.billionUsersProven, false);
  assert.equal(adapter.guardrails.humanDecision, 'REQUIRED');
  assert.equal(adapter.guardrails.zeroRemoteCalls, true);
  assert.equal(adapter.guardrails.touchesNoPhysicalDevice, true);
  assert.equal(Object.isFrozen(adapter.guardrails), true);
});

test('12D-240 the registry list is a frozen snapshot in registration order', () => {
  const registry = new VirtualChipRegistry(GENESIS);
  declareCpu(registry);
  const gpu = registry.declare({
    adapterName: 'xiv-virtual-gpu-adapter', architecture: 'gpu',
    declaredBy: 'devin', declaredAtMs: T0 + 5,
  });
  const listed = registry.listAdapters();
  assert.equal(listed.length, 2);
  assert.equal(listed[1]!.adapterId, gpu.adapterId);
  assert.equal(Object.isFrozen(listed), true);
  assert.equal(Object.isFrozen(listed[0]), true);
});

test('12D-240 a different genesis derives different digests for the same declaration', () => {
  const a = new VirtualChipRegistry(GENESIS);
  const b = new VirtualChipRegistry('another-genesis-9999');
  const input = {
    adapterName: 'xiv-virtual-cpu-adapter', architecture: 'cpu' as const,
    declaredBy: 'devin', declaredAtMs: T0,
  };
  const adapterA = a.declare(input);
  const adapterB = b.declare(input);
  assert.notEqual(adapterA.adapterId, adapterB.adapterId);
  // Cross-verification under the WRONG genesis refuses — the chain binds.
  assert.throws(() => verifyVirtualChipAdapter(adapterA, 'another-genesis-9999'), /digest mismatch/);
  assert.equal(verifyVirtualChipAdapter(adapterB, 'another-genesis-9999').ok, true);
});

test('12D-240 cpu/gpu/npu/quantum coexist honestly (no universal-compatibility claim)', () => {
  const registry = new VirtualChipRegistry(GENESIS);
  const adapters = ['cpu', 'gpu', 'npu', 'quantum'].map((arch) => registry.declare({
    adapterName: `xiv-virtual-${arch}-adapter`,
    architecture: arch, declaredBy: 'devin', declaredAtMs: T0,
  }));
  assert.equal(registry.verify().adapters, 4);
  // EVERY one stays DECLARED/unproven — "compatible with every chip" is an
  // aspiration this contract never asserts.
  for (const adapter of adapters) {
    assert.equal(adapter.compatibility, 'DECLARED');
    assert.equal(adapter.proven, false);
    assert.equal(adapter.quantumPathProven, false);
  }
});

test('12D-240 the forge surface is closed: verify re-derives, never accepts an invented digest', () => {
  const registry = new VirtualChipRegistry(GENESIS);
  declareCpu(registry);
  // A hand-forged adapter whose digest is internally CONSISTENT with a
  // DIFFERENT genesis still refuses under THIS registry's genesis.
  const foreign = new VirtualChipRegistry('a-different-genesis-99');
  const forged = foreign.declare({
    adapterName: 'xiv-virtual-cpu-adapter', architecture: 'cpu',
    declaredBy: 'devin', declaredAtMs: T0,
  });
  assert.throws(() => verifyVirtualChipAdapter(forged, GENESIS), /digest mismatch/);
  // And a re-declaration under THIS genesis in a FRESH registry is the
  // legitimate path — it succeeds and verifies (the duplicate gate only
  // applies within one registry's lifetime).
  const fresh = new VirtualChipRegistry(GENESIS);
  const redeclared = fresh.declare({
    adapterName: 'xiv-virtual-cpu-adapter', architecture: 'cpu',
    declaredBy: 'devin', declaredAtMs: T0,
  });
  assert.equal(verifyVirtualChipAdapter(redeclared, GENESIS).ok, true);
});