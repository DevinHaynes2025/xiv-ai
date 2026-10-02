import test from "node:test";
import assert from "node:assert/strict";
import { planJurisdictionSourceSchedule } from "./xvi-jurisdiction-source-schedule";

function source(
  id: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    sourceId: `source:${id}`,
    sourceLocatorHash: "a".repeat(64),
    accessClass: "PUBLIC",
    licenseId: null,
    permissionReceiptHash: null,
    provenanceHash: "b".repeat(64),
    allowedUse: ["research", "analysis"],
    languageTags: ["en", "sw"],
    datasetClasses: ["PUBLIC_RECORDS", "RESEARCH", "LOGISTICS"],
    refreshCadence: "WEEKLY",
    personalDataClass: "NONE",
    priority: 50,
    ...overrides,
  };
}

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    scheduleId: "jurisdiction-schedule:kenya",
    globalFeedPlanId: "global-feed:x6-brain",
    runMode: "ONLINE_GOVERNED",
    jurisdictionId: "jurisdiction:kenya",
    region: "AFRICA",
    languageTags: ["en", "sw"],
    datasetClasses: ["PUBLIC_RECORDS", "RESEARCH", "LOGISTICS"],
    sources: [
      source("kenya-public"),
      source("kenya-licensed", {
        sourceLocatorHash: "c".repeat(64),
        accessClass: "LICENSED",
        licenseId: "license:kenya-1",
        priority: 80,
      }),
      source("kenya-permissioned", {
        sourceLocatorHash: "d".repeat(64),
        accessClass: "PERMISSIONED",
        permissionReceiptHash: "e".repeat(64),
        priority: 70,
      }),
    ],
    maxSourcesPerRun: 2,
    maxItemsPerRun: 100_000,
    maxBytesPerRun: 500_000_000,
    maxRetries: 3,
    retryBackoffSeconds: 60,
    observedAt: "2026-10-02T07:15:00.000Z",
    requiresProvenance: true,
    requiresLicenseCompatibility: true,
    restrictedPersonalDataAllowed: false,
    zeroSecretContext: true,
    safeReadOnly: true,
    canFetchExternalData: false,
    canFeedCountryCell: false,
    canFeedCore: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
    ...overrides,
  };
}

test("plans an Africa jurisdiction schedule with bounded next-run selection", () => {
  const receipt = planJurisdictionSourceSchedule(baseInput());
  assert.equal(receipt.region, "AFRICA");
  assert.equal(receipt.sourceCount, 3);
  assert.equal(receipt.selectedForNextRunCount, 2);
  assert.equal(receipt.deferredSourceCount, 1);
  assert.equal(receipt.packets[0].sourceId, "source:kenya-licensed");
  assert.equal(receipt.packets[1].sourceId, "source:kenya-permissioned");
  assert.equal(receipt.packets[2].sourceId, "source:kenya-public");
});

test("all world regions are accepted", () => {
  for (const region of ["AFRICA", "AMERICAS", "ASIA", "EUROPE", "OCEANIA"] as const) {
    const receipt = planJurisdictionSourceSchedule(baseInput({ region }));
    assert.equal(receipt.region, region);
  }
});

test("all governed modes preserve zero fetch and zero CORE authority", () => {
  for (const runMode of ["ONLINE_GOVERNED", "OFFLINE_GOVERNED", "LOCAL_ONLY"] as const) {
    const receipt = planJurisdictionSourceSchedule(baseInput({ runMode }));
    assert.equal(receipt.runMode, runMode);
    assert.equal(receipt.canFetchExternalData, false);
    assert.equal(receipt.canFeedCountryCell, false);
    assert.equal(receipt.canFeedCore, false);
    assert.equal(receipt.executionAuthority, false);
  }
});

test("multilingual source scope must remain within jurisdiction language scope", () => {
  assert.throws(() => planJurisdictionSourceSchedule(baseInput({
    sources: [source("bad-language", { languageTags: ["en", "fr"] })],
  })), /LANGUAGE_SCOPE_MISMATCH/);
});

test("source dataset classes must remain within jurisdiction schedule scope", () => {
  assert.throws(() => planJurisdictionSourceSchedule(baseInput({
    sources: [source("bad-class", { datasetClasses: ["PUBLIC_RECORDS", "ENERGY"] })],
  })), /DATASET_SCOPE_MISMATCH/);
});

test("licensed source requires license identity", () => {
  assert.throws(() => planJurisdictionSourceSchedule(baseInput({
    sources: [source("licensed", { accessClass: "LICENSED", licenseId: null })],
  })), /LICENSE_REQUIRED/);
});

test("permissioned source requires a hash-bound permission receipt", () => {
  assert.throws(() => planJurisdictionSourceSchedule(baseInput({
    sources: [source("permissioned", { accessClass: "PERMISSIONED", permissionReceiptHash: null })],
  })), /PERMISSION_REQUIRED/);
});

test("restricted personal data is refused", () => {
  assert.throws(() => planJurisdictionSourceSchedule(baseInput({
    sources: [source("restricted", { personalDataClass: "RESTRICTED" })],
  })), /RESTRICTED_DATA_FORBIDDEN/);
});

test("duplicate source IDs fail closed", () => {
  assert.throws(() => planJurisdictionSourceSchedule(baseInput({
    sources: [
      source("dup"),
      source("dup", { sourceLocatorHash: "c".repeat(64) }),
    ],
  })), /SOURCE_ID_DUPLICATE/);
});

test("duplicate dedup keys fail closed", () => {
  assert.throws(() => planJurisdictionSourceSchedule(baseInput({
    sources: [
      source("one"),
      source("two"),
    ],
  })), /DEDUP_COLLISION/);
});

test("dedup key changes with source locator identity", () => {
  const receipt = planJurisdictionSourceSchedule(baseInput({
    sources: [
      source("one"),
      source("two", { sourceLocatorHash: "c".repeat(64) }),
    ],
  }));
  assert.notEqual(receipt.packets[0].dedupKey, receipt.packets[1].dedupKey);
});

test("retry ceiling above three fails closed", () => {
  assert.throws(() => planJurisdictionSourceSchedule(baseInput({
    maxRetries: 4,
  })), /MAX_RETRIES_INVALID/);
});

test("source-per-run ceiling above 64 fails closed", () => {
  assert.throws(() => planJurisdictionSourceSchedule(baseInput({
    maxSourcesPerRun: 65,
  })), /MAX_SOURCES_INVALID/);
});

test("direct fetch, country-cell feed, and CORE feed authority are refused", () => {
  assert.throws(() => planJurisdictionSourceSchedule(baseInput({
    canFetchExternalData: true,
  })), /AUTHORITY_VIOLATION/);
  assert.throws(() => planJurisdictionSourceSchedule(baseInput({
    canFeedCountryCell: true,
  })), /AUTHORITY_VIOLATION/);
  assert.throws(() => planJurisdictionSourceSchedule(baseInput({
    canFeedCore: true,
  })), /AUTHORITY_VIOLATION/);
});

test("accessor-bearing source fails without executing getter", () => {
  let hits = 0;
  const hostile: Record<string, unknown> = source("hostile");
  Object.defineProperty(hostile, "sourceId", {
    enumerable: true,
    get() {
      hits += 1;
      return "source:evil";
    },
  });
  assert.throws(() => planJurisdictionSourceSchedule(baseInput({
    sources: [hostile],
  })), /ACCESSOR_FORBIDDEN/);
  assert.equal(hits, 0);
});

test("hidden schedule fields fail exact schema validation", () => {
  assert.throws(() => planJurisdictionSourceSchedule({
    ...baseInput(),
    hiddenAuthority: true,
  }), /SCHEMA_MISMATCH/);
});
