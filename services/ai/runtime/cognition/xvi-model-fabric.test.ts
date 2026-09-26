import assert from "node:assert/strict";
import test from "node:test";

import {
  XVI_MODEL_FAMILIES,
  XVI_MODEL_REGISTRY,
  getXviModelForBrain,
} from "./xvi-model-fabric";

test("model fabric contains exactly twelve model families", () => {
  assert.equal(XVI_MODEL_FAMILIES.length, 12);
  assert.equal(XVI_MODEL_REGISTRY.length, 12);
});

test("every model family maps to one unique brain", () => {
  const brains = XVI_MODEL_REGISTRY.map(
    (model) => model.brain,
  );

  assert.equal(new Set(brains).size, 12);
});

test("all models begin as defined, not observed running", () => {
  for (const model of XVI_MODEL_REGISTRY) {
    assert.equal(model.evidenceState, "DEFINED");
  }
});

test("models have zero execution authority", () => {
  for (const model of XVI_MODEL_REGISTRY) {
    assert.equal(model.executionAuthority, "NONE");
  }
});

test("security brain maps to security model", () => {
  const model = getXviModelForBrain("SECURITY");

  assert.equal(model.modelFamily, "XVI_SECURITY_MODEL");
  assert.equal(model.capability, "SECURITY_ANALYSIS");
});

test("verification brain maps to verification model", () => {
  const model = getXviModelForBrain("VERIFICATION");

  assert.equal(model.modelFamily, "XVI_VERIFICATION_MODEL");
  assert.equal(model.capability, "VERIFICATION");
});
