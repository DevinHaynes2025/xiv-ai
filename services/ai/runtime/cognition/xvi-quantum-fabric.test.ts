import assert from "node:assert/strict";
import test from "node:test";

import {
  XVI_Q_BRAIN_ROLES,
  XVI_Q_CORE_IDS,
  XVI_Q_CORE_REGISTRY,
  canClaimVerifiedQpuExecution,
  countXviQBrains,
  getXviQCore,
} from "./xvi-quantum-fabric";

test("quantum fabric contains exactly twelve Q-Cores", () => {
  assert.equal(XVI_Q_CORE_IDS.length, 12);
  assert.equal(XVI_Q_CORE_REGISTRY.length, 12);
});

test("every Q-Core contains exactly twelve logical Q-Brains", () => {
  assert.equal(XVI_Q_BRAIN_ROLES.length, 12);

  for (const core of XVI_Q_CORE_REGISTRY) {
    assert.equal(core.brains.length, 12);
  }
});

test("quantum fabric exposes 144 logical Q-Brains", () => {
  assert.equal(countXviQBrains(), 144);
});

test("Q-Cores begin with unverified hardware state", () => {
  for (const core of XVI_Q_CORE_REGISTRY) {
    assert.equal(core.hardwareState, "NOT_VERIFIED");
  }
});

test("Q-Cores and Q-Brains carry zero execution authority", () => {
  for (const core of XVI_Q_CORE_REGISTRY) {
    assert.equal(core.authority, "NONE");

    for (const brain of core.brains) {
      assert.equal(brain.authority, "NONE");
    }
  }
});

test("optimization Q-Core is independently addressable", () => {
  const core = getXviQCore("Q_OPTIMIZATION");

  assert.equal(core.id, "Q_OPTIMIZATION");
  assert.equal(core.brains.length, 12);
});

test("simulation cannot be mislabeled as verified QPU execution", () => {
  assert.equal(
    canClaimVerifiedQpuExecution(
      "QUANTUM_SIMULATED",
      false,
    ),
    false,
  );
});

test("QPU verification requires both execution class and hardware evidence", () => {
  assert.equal(
    canClaimVerifiedQpuExecution(
      "QPU_VERIFIED",
      false,
    ),
    false,
  );

  assert.equal(
    canClaimVerifiedQpuExecution(
      "QPU_VERIFIED",
      true,
    ),
    true,
  );
});
