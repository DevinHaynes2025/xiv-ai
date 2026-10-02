import test from "node:test";
import assert from "node:assert/strict";
import { presentJurisdictionSourceScheduleCard } from "./xvi-jurisdiction-source-schedule-card";

function packet(sequence: number, id: string, overrides: Record<string, unknown> = {}) {
  return {
    sequence,
    sourceId: `source:${id}`,
    accessClass: "PUBLIC",
    languageTags: ["en", "sw"],
    datasetClasses: ["PUBLIC_RECORDS", "RESEARCH", "LOGISTICS"],
    refreshCadence: "WEEKLY",
    priority: 50,
    dedupKey: sequence.toString(16).padStart(64, "0"),
    requiresDatasetAdmissionFabric: true,
    requiresProvenance: true,
    requiresLicenseCompatibility: true,
    maxRetries: 2,
    retryBackoffSeconds: 60,
    canFetchExternalData: false,
    canFeedCountryCell: false,
    canFeedCore: false,
    ...overrides,
  };
}

function receipt(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "xvi-jurisdiction-source-schedule-v1",
    scheduleId: "jurisdiction-schedule:kenya",
    globalFeedPlanId: "global-feed:x6-brain",
    runMode: "ONLINE_GOVERNED",
    jurisdictionId: "jurisdiction:kenya",
    region: "AFRICA",
    languageTags: ["en", "sw"],
    datasetClasses: ["PUBLIC_RECORDS", "RESEARCH", "LOGISTICS"],
    sourceCount: 3,
    selectedForNextRunCount: 2,
    deferredSourceCount: 1,
    maxSourcesPerRun: 2,
    maxItemsPerRun: 100000,
    maxBytesPerRun: 100000000,
    maxRetries: 2,
    retryBackoffSeconds: 60,
    packets: [
      packet(1, "public"),
      packet(2, "licensed", { accessClass: "LICENSED", refreshCadence: "DAILY", dedupKey: "a".repeat(64) }),
      packet(3, "permissioned", { accessClass: "PERMISSIONED", refreshCadence: "ON_CHANGE", dedupKey: "b".repeat(64) }),
    ],
    requiresDatasetAdmissionFabric: true,
    requiresCountryCompletenessValidation: true,
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

function input(overrides: Record<string, unknown> = {}) {
  return {
    audience: "EXECUTIVE",
    receipt: receipt(),
    safeReadOnly: true,
    canFetchExternalData: false,
    canMutate: false,
    canClaimIngestion: false,
    ...overrides,
  };
}

test("presents an Africa source schedule without retrieval authority", () => {
  const card = presentJurisdictionSourceScheduleCard(input());
  assert.equal(card.region, "AFRICA");
  assert.equal(card.jurisdictionId, "jurisdiction:kenya");
  assert.equal(card.canFetchExternalData, false);
  assert.equal(card.canFeedCore, false);
  assert.equal(card.canClaimIngestion, false);
  assert.equal(card.route, "UNIVERSE");
});

test("bounded queue is visible without treating deferral as failure", () => {
  const card = presentJurisdictionSourceScheduleCard(input());
  assert.equal(card.queueState, "BOUNDED_QUEUE");
  assert.equal(card.deferredSourceCount, 1);
  assert.equal(card.primaryAction, "View deferred sources");
  assert.equal(card.askXviContext, "Explain deferred sources");
});

test("ready queue remains read-only", () => {
  const ready = receipt({
    sourceCount: 2,
    selectedForNextRunCount: 2,
    deferredSourceCount: 0,
    maxSourcesPerRun: 2,
    packets: [
      packet(1, "public"),
      packet(2, "licensed", { accessClass: "LICENSED", dedupKey: "a".repeat(64) }),
    ],
  });
  const card = presentJurisdictionSourceScheduleCard(input({ receipt: ready }));
  assert.equal(card.queueState, "READY");
  assert.equal(card.primaryAction, "Explore sources");
  assert.equal(card.canFetchExternalData, false);
});

test("access summary distinguishes public licensed and permissioned sources", () => {
  const card = presentJurisdictionSourceScheduleCard(input());
  assert.deepEqual(card.accessSummary, { publicCount: 1, licensedCount: 1, permissionedCount: 1 });
});

test("all governed modes use canonical frontend labels", () => {
  for (const [runMode, label] of [
    ["ONLINE_GOVERNED", "Online governed"],
    ["OFFLINE_GOVERNED", "Offline governed"],
    ["LOCAL_ONLY", "Local only"],
  ] as const) {
    const card = presentJurisdictionSourceScheduleCard(input({ receipt: receipt({ runMode }) }));
    assert.equal(card.modeLabel, label);
    assert.equal(card.executionAuthority, false);
  }
});

test("language and dataset scopes are visible and packet-bound", () => {
  const card = presentJurisdictionSourceScheduleCard(input());
  assert.match(card.languageLabel, /en, sw/);
  assert.match(card.datasetClassLabel, /3 data domains/);
  const bad = receipt({ packets: [
    packet(1, "public", { languageTags: ["fr"] }),
    packet(2, "licensed", { accessClass: "LICENSED", dedupKey: "a".repeat(64) }),
    packet(3, "permissioned", { accessClass: "PERMISSIONED", dedupKey: "b".repeat(64) }),
  ] });
  assert.throws(() => presentJurisdictionSourceScheduleCard(input({ receipt: bad })), /LANGUAGE_SCOPE_MISMATCH/);
});

test("forged count summary fails closed", () => {
  assert.throws(() => presentJurisdictionSourceScheduleCard(input({ receipt: receipt({ selectedForNextRunCount: 3, deferredSourceCount: 1 }) })), /COUNT_MISMATCH/);
});

test("duplicate source IDs and dedup keys fail closed", () => {
  const duplicateId = receipt({ packets: [
    packet(1, "same"),
    packet(2, "same", { dedupKey: "a".repeat(64) }),
    packet(3, "permissioned", { accessClass: "PERMISSIONED", dedupKey: "b".repeat(64) }),
  ] });
  assert.throws(() => presentJurisdictionSourceScheduleCard(input({ receipt: duplicateId })), /SOURCE_DUPLICATE/);

  const duplicateDedup = receipt({ packets: [
    packet(1, "public", { dedupKey: "a".repeat(64) }),
    packet(2, "licensed", { accessClass: "LICENSED", dedupKey: "a".repeat(64) }),
    packet(3, "permissioned", { accessClass: "PERMISSIONED", dedupKey: "b".repeat(64) }),
  ] });
  assert.throws(() => presentJurisdictionSourceScheduleCard(input({ receipt: duplicateDedup })), /DEDUP_DUPLICATE/);
});

test("packet retry policy must match receipt policy", () => {
  const bad = receipt({ packets: [
    packet(1, "public", { maxRetries: 3 }),
    packet(2, "licensed", { accessClass: "LICENSED", dedupKey: "a".repeat(64) }),
    packet(3, "permissioned", { accessClass: "PERMISSIONED", dedupKey: "b".repeat(64) }),
  ] });
  assert.throws(() => presentJurisdictionSourceScheduleCard(input({ receipt: bad })), /RETRY_MISMATCH/);
});

test("packet and card authority escalation are refused", () => {
  const badReceipt = receipt({ packets: [
    packet(1, "public", { canFetchExternalData: true }),
    packet(2, "licensed", { accessClass: "LICENSED", dedupKey: "a".repeat(64) }),
    packet(3, "permissioned", { accessClass: "PERMISSIONED", dedupKey: "b".repeat(64) }),
  ] });
  assert.throws(() => presentJurisdictionSourceScheduleCard(input({ receipt: badReceipt })), /PACKET_AUTHORITY_VIOLATION/);
  assert.throws(() => presentJurisdictionSourceScheduleCard(input({ canClaimIngestion: true })), /CARD_AUTHORITY_VIOLATION/);
});

test("accessor-bearing receipt fails without executing getter", () => {
  let hits = 0;
  const hostile: Record<string, unknown> = receipt();
  Object.defineProperty(hostile, "scheduleId", {
    enumerable: true,
    get() { hits += 1; return "jurisdiction-schedule:evil"; },
  });
  assert.throws(() => presentJurisdictionSourceScheduleCard(input({ receipt: hostile })), /ACCESSOR_FORBIDDEN/);
  assert.equal(hits, 0);
});

test("hidden card fields fail exact-schema validation", () => {
  assert.throws(() => presentJurisdictionSourceScheduleCard({ ...input(), hiddenAuthority: true }), /SCHEMA_MISMATCH/);
});
