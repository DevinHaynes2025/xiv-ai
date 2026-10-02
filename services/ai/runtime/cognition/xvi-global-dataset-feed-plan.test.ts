import test from "node:test";
import assert from "node:assert/strict";
import { planGlobalDatasetFeed } from "./xvi-global-dataset-feed-plan";

function target(
  id: number,
  region: "AFRICA" | "AMERICAS" | "ASIA" | "EUROPE" | "OCEANIA"
) {
  return {
    jurisdictionId: `jurisdiction:${id}`,
    region,
    languageTags: ["en"],
    datasetClasses: ["PUBLIC_RECORDS", "RESEARCH", "LOGISTICS"],
    targetWeight: 1,
  } as const;
}

function completeTargets() {
  const regions = ["AFRICA", "AMERICAS", "ASIA", "EUROPE", "OCEANIA"] as const;
  return Array.from({ length: 196 }, (_, index) =>
    target(index + 1, regions[index % regions.length])
  );
}

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    planId: "global-feed:x6-brain",
    runMode: "ONLINE_GOVERNED",
    targets: completeTargets(),
    requiredJurisdictionCount: 196,
    requireAllRegions: true,
    logicalDatasetTarget: 1_000_000_000_000,
    maxDatasetsPerBatch: 100_000,
    maxBytesPerBatch: 4_000_000_000,
    allowedSourceAccess: ["PUBLIC", "LICENSED", "PERMISSIONED"],
    requiresProvenance: true,
    requiresLicenseCompatibility: true,
    restrictedPersonalDataAllowed: false,
    zeroSecretContext: true,
    safeReadOnly: true,
    canFetchExternalData: false,
    canFeedCore: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
    ...overrides,
  };
}

test("plans all configured jurisdictions including Africa without claiming ingestion", () => {
  const receipt = planGlobalDatasetFeed(baseInput());
  assert.equal(receipt.targetedJurisdictionCount, 196);
  assert.equal(receipt.coverageTargetComplete, true);
  assert.ok(receipt.africaTargetCount > 0);
  assert.equal(receipt.canFetchExternalData, false);
  assert.equal(receipt.canFeedCore, false);
});

test("trillion-scale target is logical capacity with bounded batches", () => {
  const receipt = planGlobalDatasetFeed(baseInput());
  assert.equal(receipt.logicalDatasetTarget, 1_000_000_000_000);
  assert.equal(receipt.maxDatasetsPerBatch, 100_000);
  assert.equal(receipt.estimatedBatchCount, 10_000_000);
  assert.equal(receipt.scaleClaim, "TRILLION_SCALE_LOGICAL_TARGET_BOUNDED_BATCHES");
});

test("all governed modes preserve zero authority", () => {
  for (const runMode of ["ONLINE_GOVERNED", "OFFLINE_GOVERNED", "LOCAL_ONLY"] as const) {
    const receipt = planGlobalDatasetFeed(baseInput({ runMode }));
    assert.equal(receipt.runMode, runMode);
    assert.equal(receipt.executionAuthority, false);
    assert.equal(receipt.mutationAuthority, false);
    assert.equal(receipt.productionAuthority, false);
  }
});

test("missing a required region fails closed when all regions are required", () => {
  const targets = Array.from({ length: 50 }, (_, index) => target(index + 1, "AFRICA"));
  assert.throws(() => planGlobalDatasetFeed(baseInput({
    targets,
    requiredJurisdictionCount: 50,
  })), /REGION_COVERAGE_INCOMPLETE/);
});

test("duplicate jurisdiction targets fail closed", () => {
  const targets = [target(1, "AFRICA"), target(1, "ASIA")];
  assert.throws(() => planGlobalDatasetFeed(baseInput({
    targets,
    requiredJurisdictionCount: 2,
    requireAllRegions: false,
  })), /JURISDICTION_DUPLICATE/);
});

test("targets cannot exceed configured jurisdiction count", () => {
  assert.throws(() => planGlobalDatasetFeed(baseInput({
    targets: [target(1, "AFRICA"), target(2, "ASIA")],
    requiredJurisdictionCount: 1,
    requireAllRegions: false,
  })), /TARGETS_EXCEED_REQUIRED_COUNT/);
});

test("logical target above one trillion fails closed", () => {
  assert.throws(() => planGlobalDatasetFeed(baseInput({
    logicalDatasetTarget: 1_000_000_000_001,
  })), /LOGICAL_TARGET_INVALID/);
});

test("batch size above governed ceiling fails closed", () => {
  assert.throws(() => planGlobalDatasetFeed(baseInput({
    maxDatasetsPerBatch: 100_001,
  })), /BATCH_DATASETS_INVALID/);
});

test("only public, licensed, or permissioned source access is accepted", () => {
  assert.throws(() => planGlobalDatasetFeed(baseInput({
    allowedSourceAccess: ["PUBLIC", "UNRESTRICTED_SCRAPING"],
  })), /SOURCE_ACCESS_INVALID/);
});

test("restricted personal data and direct CORE feeding are refused", () => {
  assert.throws(() => planGlobalDatasetFeed(baseInput({
    restrictedPersonalDataAllowed: true,
  })), /AUTHORITY_VIOLATION/);
  assert.throws(() => planGlobalDatasetFeed(baseInput({
    canFeedCore: true,
  })), /AUTHORITY_VIOLATION/);
});

test("direct external fetching authority is refused", () => {
  assert.throws(() => planGlobalDatasetFeed(baseInput({
    canFetchExternalData: true,
  })), /AUTHORITY_VIOLATION/);
});

test("accessor-bearing input fails without executing getter", () => {
  let hits = 0;
  const hostile: Record<string, unknown> = baseInput();
  Object.defineProperty(hostile, "planId", {
    enumerable: true,
    get() {
      hits += 1;
      return "global-feed:evil";
    },
  });
  assert.throws(() => planGlobalDatasetFeed(hostile), /ACCESSOR_FORBIDDEN/);
  assert.equal(hits, 0);
});
