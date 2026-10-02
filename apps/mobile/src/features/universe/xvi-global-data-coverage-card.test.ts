import test from "node:test";
import assert from "node:assert/strict";
import { presentGlobalDataCoverageCard } from "./xvi-global-data-coverage-card";

function feed(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "xvi-global-dataset-feed-plan-v1",
    planId: "global-feed:x6-brain",
    runMode: "ONLINE_GOVERNED",
    targetedJurisdictionCount: 196,
    requiredJurisdictionCount: 196,
    coverageTargetComplete: true,
    regionCounts: { AFRICA: 54, AMERICAS: 35, ASIA: 48, EUROPE: 44, OCEANIA: 15 },
    africaTargetCount: 54,
    logicalDatasetTarget: 1_000_000_000_000,
    maxDatasetsPerBatch: 100_000,
    maxBytesPerBatch: 4_000_000_000,
    estimatedBatchCount: 10_000_000,
    scaleClaim: "TRILLION_SCALE_LOGICAL_TARGET_BOUNDED_BATCHES",
    requiresDatasetAdmissionFabric: true,
    requiresCountryCompletenessValidation: true,
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

function region(region: "AFRICA"|"AMERICAS"|"ASIA"|"EUROPE"|"OCEANIA", countryCount: number, review = false) {
  return {
    region,
    countryCount,
    domainAverages: [],
    zeroCoverageCountries: [],
    weakIndependenceCountries: [],
    languageGapCountries: [],
    quarantinedCountryCount: 0,
    disputedCountryCount: 0,
    requiresHumanReview: review,
  };
}

function completeness(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "xvi-global-completeness-rollup-v1",
    regionRollups: [
      region("AFRICA", 54),
      region("AMERICAS", 35),
      region("ASIA", 48),
      region("EUROPE", 44),
      region("OCEANIA", 15),
    ],
    totalCountries: 196,
    countriesWithAnyGap: [],
    countriesWithZeroCoverage: [],
    countriesWithLanguageGaps: [],
    globalRequiresHumanReview: false,
    averagesAreNotCompleteness: true,
    safeReadOnly: true,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
    ...overrides,
  };
}

function input(overrides: Record<string, unknown> = {}) {
  return {
    audience: "EXECUTIVE",
    feedPlan: feed(),
    completeness: completeness(),
    safeReadOnly: true,
    canFetchExternalData: false,
    canMutate: false,
    canClaimIngestion: false,
    ...overrides,
  };
}

test("presents complete global coverage without claiming ingestion", () => {
  const card = presentGlobalDataCoverageCard(input());
  assert.equal(card.reviewState, "CLEAR");
  assert.equal(card.route, "UNIVERSE");
  assert.equal(card.africaTargetCount, 54);
  assert.equal(card.canClaimIngestion, false);
  assert.match(card.disclaimer, /not claims of completed ingestion/);
});

test("trillion-scale target is labeled as logical bounded capacity", () => {
  const card = presentGlobalDataCoverageCard(input());
  assert.match(card.scaleLabel, /1,000,000,000,000 logical dataset target/);
  assert.match(card.scaleLabel, /10,000,000 bounded batches/);
});

test("Africa is explicit in coverage presentation", () => {
  const card = presentGlobalDataCoverageCard(input());
  const africa = card.regionCoverage.find((row) => row.region === "AFRICA");
  assert.equal(africa?.targetedJurisdictions, 54);
  assert.equal(africa?.observedCountries, 54);
  assert.equal(africa?.status, "COVERED");
});

test("Africa gap drives Ask XVI context and Needs You route", () => {
  const card = presentGlobalDataCoverageCard(input({
    completeness: completeness({
      regionRollups: [
        region("AFRICA", 20, true),
        region("AMERICAS", 35),
        region("ASIA", 48),
        region("EUROPE", 44),
        region("OCEANIA", 15),
      ],
      totalCountries: 162,
      countriesWithAnyGap: ["jurisdiction:africa-gap"],
      globalRequiresHumanReview: true,
    }),
  }));
  assert.equal(card.reviewState, "NEEDS_REVIEW");
  assert.equal(card.route, "NEEDS_YOU");
  assert.equal(card.askXviContext, "Explain Africa coverage");
});

test("missing region is incomplete even when completeness review flag is false", () => {
  const card = presentGlobalDataCoverageCard(input({
    feedPlan: feed({
      targetedJurisdictionCount: 181,
      coverageTargetComplete: false,
      regionCounts: { AFRICA: 54, AMERICAS: 35, ASIA: 48, EUROPE: 44, OCEANIA: 0 },
    }),
  }));
  assert.equal(card.reviewState, "INCOMPLETE");
  assert.equal(card.route, "NEEDS_YOU");
});

test("all governed modes preserve presentation-only authority", () => {
  for (const [runMode, label] of [
    ["ONLINE_GOVERNED", "Online governed"],
    ["OFFLINE_GOVERNED", "Offline governed"],
    ["LOCAL_ONLY", "Local only"],
  ] as const) {
    const card = presentGlobalDataCoverageCard(input({ feedPlan: feed({ runMode }) }));
    assert.equal(card.modeLabel, label);
    assert.equal(card.canFetchExternalData, false);
    assert.equal(card.canFeedCore, false);
    assert.equal(card.executionAuthority, false);
  }
});

test("feed region totals must match targeted jurisdiction count", () => {
  assert.throws(() => presentGlobalDataCoverageCard(input({
    feedPlan: feed({ africaTargetCount: 53 }),
  })), /REGION_TOTAL_MISMATCH/);
});

test("forged completeness review state fails closed", () => {
  assert.throws(() => presentGlobalDataCoverageCard(input({
    completeness: completeness({
      countriesWithAnyGap: ["jurisdiction:gap"],
      globalRequiresHumanReview: false,
    }),
  })), /REVIEW_STATE_MISMATCH/);
});

test("external fetch or ingestion claim authority is refused", () => {
  assert.throws(() => presentGlobalDataCoverageCard(input({ canFetchExternalData: true })), /AUTHORITY_VIOLATION/);
  assert.throws(() => presentGlobalDataCoverageCard(input({ canClaimIngestion: true })), /AUTHORITY_VIOLATION/);
});

test("Ask XVI remains explanatory only", () => {
  const card = presentGlobalDataCoverageCard(input());
  assert.equal(card.secondaryAction, "Ask XVI");
  assert.equal(card.askXviContext, "Explain global coverage");
  assert.equal(card.canFetchExternalData, false);
});

test("accessor-bearing feed fails without executing getter", () => {
  let hits = 0;
  const hostile: Record<string, unknown> = feed();
  Object.defineProperty(hostile, "planId", {
    enumerable: true,
    get() {
      hits += 1;
      return "global-feed:evil";
    },
  });
  assert.throws(() => presentGlobalDataCoverageCard(input({ feedPlan: hostile })), /ACCESSOR_FORBIDDEN/);
  assert.equal(hits, 0);
});

test("hidden card fields fail exact schema validation", () => {
  assert.throws(() => presentGlobalDataCoverageCard({ ...input(), hiddenAuthority: true }), /SCHEMA_MISMATCH/);
});
