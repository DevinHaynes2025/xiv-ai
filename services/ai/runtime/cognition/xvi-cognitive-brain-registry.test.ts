import assert from "node:assert/strict";
import test from "node:test";

import {
  XVI_BRAIN_IDS,
  XVI_BRAIN_REGISTRY,
  XVI_COGNITIVE_LAYERS,
  countXviCognitiveLayers,
  getXviBrain,
} from "./xvi-cognitive-brain-registry";

test("registry contains exactly twelve brains", () => {
  assert.equal(XVI_BRAIN_IDS.length, 12);
  assert.equal(XVI_BRAIN_REGISTRY.length, 12);
});

test("every brain contains exactly twelve cognitive layers", () => {
  assert.equal(XVI_COGNITIVE_LAYERS.length, 12);

  for (const brain of XVI_BRAIN_REGISTRY) {
    assert.equal(brain.layers.length, 12);
  }
});

test("registry exposes 144 logical cognitive layers", () => {
  assert.equal(countXviCognitiveLayers(), 144);
});

test("brains carry zero execution authority", () => {
  for (const brain of XVI_BRAIN_REGISTRY) {
    assert.equal(brain.authority, "NONE");
  }
});

test("verification brain is independently addressable", () => {
  const brain = getXviBrain("VERIFICATION");

  assert.equal(brain.id, "VERIFICATION");
  assert.equal(brain.layers.includes("CRITIC"), true);
  assert.equal(brain.layers.includes("VERIFICATION"), true);
});

test("learning layer is proposal-only by contract name", () => {
  assert.equal(
    XVI_COGNITIVE_LAYERS.at(-1),
    "LEARNING_PROPOSAL",
  );
});
