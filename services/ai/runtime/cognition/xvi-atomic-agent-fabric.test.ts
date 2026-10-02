
import test from "node:test";
import assert from "node:assert/strict";
import { planAtomicAgentFabric } from "./xvi-atomic-agent-fabric";

const now = "2026-10-02T07:00:00.000Z";

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    fabricId: "atomic-fabric:alpha",
    universeId: "universe:alpha",
    tenantId: "tenant:alpha",
    userScopeId: "user-scope:alpha",
    runMode: "ONLINE_GOVERNED",
    direction: "POSITIVE",
    startLayer: 0,
    requestedLayers: 4,
    atomBudgetPerLayer: 128,
    intent: "ANALYZE",
    lease: {
      leaseId: "atomic-lease:alpha",
      tenantId: "tenant:alpha",
      userScopeId: "user-scope:alpha",
      issuedAt: "2026-10-02T06:55:00.000Z",
      expiresAt: "2026-10-02T07:10:00.000Z",
      allowedIntents: ["ANALYZE", "SIMULATE"],
      zeroSecretContext: true,
      safeReadOnly: true,
      executionAuthority: false,
      mutationAuthority: false,
      productionAuthority: false,
    },
    seedDigest: "a".repeat(64),
    zeroSecretContext: true,
    safeReadOnly: true,
    canSpawnExternalProcess: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
    ...overrides,
  };
}

test("plans a bounded positive atomic layer window", () => {
  const receipt = planAtomicAgentFabric(baseInput(), now);
  assert.equal(receipt.schemaVersion, "xvi-atomic-agent-fabric-v1");
  assert.equal(receipt.layers.length, 4);
  assert.deepEqual(receipt.layers.map((x) => x.signedCoordinate), [1, 2, 3, 4]);
  assert.equal(receipt.totalAtomBudget, 512);
  assert.equal(receipt.maxLogicalLayers, 1000);
  assert.equal(receipt.executionAuthority, false);
});

test("negative expansion uses signed coordinates without unbounded recursion", () => {
  const receipt = planAtomicAgentFabric(baseInput({
    direction: "NEGATIVE",
    requestedLayers: 3,
  }), now);
  assert.deepEqual(receipt.layers.map((x) => x.signedCoordinate), [-1, -2, -3]);
  assert.equal(receipt.nextWindowRequired, true);
});

test("all governed run modes are preserved", () => {
  for (const runMode of ["ONLINE_GOVERNED", "OFFLINE_GOVERNED", "LOCAL_ONLY"] as const) {
    const receipt = planAtomicAgentFabric(baseInput({ runMode }), now);
    assert.equal(receipt.runMode, runMode);
    assert.equal(receipt.executionAuthority, false);
    assert.equal(receipt.mutationAuthority, false);
    assert.equal(receipt.productionAuthority, false);
  }
});

test("exactly 1000 logical layers are allowed when budget is bounded", () => {
  const receipt = planAtomicAgentFabric(baseInput({
    requestedLayers: 1000,
    atomBudgetPerLayer: 1000,
  }), now);
  assert.equal(receipt.layers.length, 1000);
  assert.equal(receipt.endLayer, 999);
  assert.equal(receipt.totalAtomBudget, 1_000_000);
  assert.equal(receipt.nextWindowRequired, false);
});

test("layer window beyond 1000 fails closed", () => {
  assert.throws(() => planAtomicAgentFabric(baseInput({
    startLayer: 999,
    requestedLayers: 2,
  }), now), /LAYER_WINDOW_EXCEEDS_LIMIT/);
});

test("per-layer atom budget above 10000 fails closed", () => {
  assert.throws(() => planAtomicAgentFabric(baseInput({
    atomBudgetPerLayer: 10001,
  }), now), /LAYER_BUDGET_INVALID/);
});

test("total atom budget above one million fails closed", () => {
  assert.throws(() => planAtomicAgentFabric(baseInput({
    requestedLayers: 101,
    atomBudgetPerLayer: 10000,
  }), now), /TOTAL_BUDGET_EXCEEDS_LIMIT/);
});

test("lease must match tenant and user scope", () => {
  const x = baseInput();
  assert.throws(() => planAtomicAgentFabric({
    ...x,
    lease: { ...x.lease, tenantId: "tenant:other" },
  }, now), /LEASE_SCOPE_MISMATCH/);
});

test("lease must authorize requested atomic intent", () => {
  const x = baseInput();
  assert.throws(() => planAtomicAgentFabric({
    ...x,
    intent: "PROPOSE",
  }, now), /LEASE_INTENT_NOT_AUTHORIZED/);
});

test("expired lease fails closed", () => {
  const x = baseInput();
  assert.throws(() => planAtomicAgentFabric({
    ...x,
    lease: {
      ...x.lease,
      issuedAt: "2026-10-02T06:30:00.000Z",
      expiresAt: "2026-10-02T06:45:00.000Z",
    },
  }, now), /LEASE_EXPIRED/);
});

test("lease longer than fifteen minutes fails closed", () => {
  const x = baseInput();
  assert.throws(() => planAtomicAgentFabric({
    ...x,
    lease: {
      ...x.lease,
      issuedAt: "2026-10-02T06:30:00.000Z",
      expiresAt: "2026-10-02T06:50:01.000Z",
    },
  }, "2026-10-02T06:40:00.000Z"), /LEASE_TTL_INVALID/);
});

test("authority escalation and external process spawning are refused", () => {
  assert.throws(() => planAtomicAgentFabric(baseInput({
    canSpawnExternalProcess: true,
  }), now), /AUTHORITY_VIOLATION/);
  assert.throws(() => planAtomicAgentFabric(baseInput({
    executionAuthority: true,
  }), now), /AUTHORITY_VIOLATION/);
});

test("layer digests are deterministic and chained", () => {
  const a = planAtomicAgentFabric(baseInput(), now);
  const b = planAtomicAgentFabric(baseInput(), now);
  assert.deepEqual(a.layers.map((x) => x.layerDigest), b.layers.map((x) => x.layerDigest));
  assert.notEqual(a.layers[0].layerDigest, a.layers[1].layerDigest);
});

test("changing direction changes the digest chain", () => {
  const positive = planAtomicAgentFabric(baseInput(), now);
  const negative = planAtomicAgentFabric(baseInput({ direction: "NEGATIVE" }), now);
  assert.notEqual(positive.layers[0].layerDigest, negative.layers[0].layerDigest);
});

test("accessor-bearing fabric input fails without executing getter", () => {
  let hits = 0;
  const hostile: Record<string, unknown> = baseInput();
  Object.defineProperty(hostile, "fabricId", {
    enumerable: true,
    get() {
      hits += 1;
      return "atomic-fabric:evil";
    },
  });
  assert.throws(() => planAtomicAgentFabric(hostile, now), /ACCESSOR_FORBIDDEN/);
  assert.equal(hits, 0);
});

test("hidden extra fields fail exact-schema validation", () => {
  assert.throws(() => planAtomicAgentFabric({
    ...baseInput(),
    hiddenAuthority: true,
  }, now), /SCHEMA_MISMATCH/);
});
