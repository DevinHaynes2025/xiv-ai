export type XviGlobalCoverageAudience = "CONSUMER" | "ENTREPRENEUR" | "EXECUTIVE";
export type XviGlobalCoverageRunMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
export type XviGlobalCoverageRegion = "AFRICA" | "AMERICAS" | "ASIA" | "EUROPE" | "OCEANIA";

export interface XviGlobalFeedPlanReceiptMirror {
  readonly schemaVersion: "xvi-global-dataset-feed-plan-v1";
  readonly planId: string;
  readonly runMode: XviGlobalCoverageRunMode;
  readonly targetedJurisdictionCount: number;
  readonly requiredJurisdictionCount: number;
  readonly coverageTargetComplete: boolean;
  readonly regionCounts: Readonly<Record<XviGlobalCoverageRegion, number>>;
  readonly africaTargetCount: number;
  readonly logicalDatasetTarget: number;
  readonly maxDatasetsPerBatch: number;
  readonly maxBytesPerBatch: number;
  readonly estimatedBatchCount: number;
  readonly scaleClaim: "TRILLION_SCALE_LOGICAL_TARGET_BOUNDED_BATCHES" | "BOUNDED_LOGICAL_TARGET";
  readonly requiresDatasetAdmissionFabric: true;
  readonly requiresCountryCompletenessValidation: true;
  readonly requiresProvenance: true;
  readonly requiresLicenseCompatibility: true;
  readonly restrictedPersonalDataAllowed: false;
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly canFetchExternalData: false;
  readonly canFeedCore: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviRegionCompletenessRollupMirror {
  readonly region: XviGlobalCoverageRegion;
  readonly countryCount: number;
  readonly domainAverages: readonly unknown[];
  readonly zeroCoverageCountries: readonly unknown[];
  readonly weakIndependenceCountries: readonly unknown[];
  readonly languageGapCountries: readonly string[];
  readonly quarantinedCountryCount: number;
  readonly disputedCountryCount: number;
  readonly requiresHumanReview: boolean;
}

export interface XviGlobalCompletenessRollupReceiptMirror {
  readonly schemaVersion: "xvi-global-completeness-rollup-v1";
  readonly regionRollups: readonly XviRegionCompletenessRollupMirror[];
  readonly totalCountries: number;
  readonly countriesWithAnyGap: readonly string[];
  readonly countriesWithZeroCoverage: readonly string[];
  readonly countriesWithLanguageGaps: readonly string[];
  readonly globalRequiresHumanReview: boolean;
  readonly averagesAreNotCompleteness: true;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviGlobalDataCoverageCardInput {
  readonly audience: XviGlobalCoverageAudience;
  readonly feedPlan: XviGlobalFeedPlanReceiptMirror;
  readonly completeness: XviGlobalCompletenessRollupReceiptMirror;
  readonly safeReadOnly: true;
  readonly canFetchExternalData: false;
  readonly canMutate: false;
  readonly canClaimIngestion: false;
}

export interface XviRegionCoveragePresentation {
  readonly region: XviGlobalCoverageRegion;
  readonly targetedJurisdictions: number;
  readonly observedCountries: number;
  readonly status: "COVERED" | "PARTIAL" | "MISSING";
}

export interface XviGlobalDataCoverageCardPresentation {
  readonly schemaVersion: "xvi-global-data-coverage-card-v1";
  readonly audience: XviGlobalCoverageAudience;
  readonly title: "Global data coverage";
  readonly eyebrow: string;
  readonly modeLabel: "Online governed" | "Offline governed" | "Local only";
  readonly targetedJurisdictionCount: number;
  readonly requiredJurisdictionCount: number;
  readonly observedCountryCount: number;
  readonly africaTargetCount: number;
  readonly regionCoverage: readonly XviRegionCoveragePresentation[];
  readonly gapCountryCount: number;
  readonly zeroCoverageCountryCount: number;
  readonly languageGapCountryCount: number;
  readonly scaleLabel: string;
  readonly trustLabel: "Provenance + license compatibility required";
  readonly reviewState: "CLEAR" | "NEEDS_REVIEW" | "INCOMPLETE";
  readonly route: "UNIVERSE" | "NEEDS_YOU";
  readonly primaryAction: "Explore global data" | "Review coverage gaps";
  readonly secondaryAction: "Ask XVI";
  readonly askXviContext:
    | "Explain global coverage"
    | "Explain Africa coverage"
    | "Explain data gaps";
  readonly disclaimer: "Coverage targets are plans and receipts, not claims of completed ingestion.";
  readonly accessibilityLabel: string;
  readonly safeReadOnly: true;
  readonly canFetchExternalData: false;
  readonly canFeedCore: false;
  readonly canMutate: false;
  readonly canClaimIngestion: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const AUDIENCES = new Set<XviGlobalCoverageAudience>(["CONSUMER", "ENTREPRENEUR", "EXECUTIVE"]);
const MODES = new Set<XviGlobalCoverageRunMode>(["ONLINE_GOVERNED", "OFFLINE_GOVERNED", "LOCAL_ONLY"]);
const REGIONS = ["AFRICA", "AMERICAS", "ASIA", "EUROPE", "OCEANIA"] as const;

function plain(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== PLAIN) {
    throw new Error(`${label}_PLAIN_REQUIRED`);
  }
  if (Object.getOwnPropertySymbols(value).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const key of Object.keys(value)) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}

function exact(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, i) => key !== expected[i])) {
    throw new Error(`${label}_SCHEMA_MISMATCH`);
  }
}

function safeInt(value: number, max: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > max) throw new Error(`${label}_INVALID`);
}

function uniqueStrings(values: readonly string[], max: number, label: string): void {
  if (!Array.isArray(values) || values.length > max) throw new Error(`${label}_COUNT_INVALID`);
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string" || !value.trim() || value.length > 240) throw new Error(`${label}_INVALID`);
    if (seen.has(value)) throw new Error(`${label}_DUPLICATE`);
    seen.add(value);
  }
}

function validateFeedPlan(input: unknown): Readonly<XviGlobalFeedPlanReceiptMirror> {
  plain(input, "GLOBAL_COVERAGE_FEED");
  exact(input, [
    "schemaVersion","planId","runMode","targetedJurisdictionCount","requiredJurisdictionCount",
    "coverageTargetComplete","regionCounts","africaTargetCount","logicalDatasetTarget",
    "maxDatasetsPerBatch","maxBytesPerBatch","estimatedBatchCount","scaleClaim",
    "requiresDatasetAdmissionFabric","requiresCountryCompletenessValidation","requiresProvenance",
    "requiresLicenseCompatibility","restrictedPersonalDataAllowed","zeroSecretContext","safeReadOnly",
    "canFetchExternalData","canFeedCore","executionAuthority","mutationAuthority","productionAuthority"
  ], "GLOBAL_COVERAGE_FEED");
  const r = input as unknown as XviGlobalFeedPlanReceiptMirror;
  if (r.schemaVersion !== "xvi-global-dataset-feed-plan-v1" || !/^global-feed:/.test(r.planId) || !MODES.has(r.runMode)) {
    throw new Error("GLOBAL_COVERAGE_FEED_IDENTITY_INVALID");
  }
  safeInt(r.targetedJurisdictionCount, 196, "GLOBAL_COVERAGE_TARGETED");
  safeInt(r.requiredJurisdictionCount, 196, "GLOBAL_COVERAGE_REQUIRED");
  safeInt(r.logicalDatasetTarget, 1_000_000_000_000, "GLOBAL_COVERAGE_LOGICAL_TARGET");
  safeInt(r.maxDatasetsPerBatch, 100_000, "GLOBAL_COVERAGE_BATCH_DATASETS");
  safeInt(r.maxBytesPerBatch, 4_000_000_000, "GLOBAL_COVERAGE_BATCH_BYTES");
  safeInt(r.estimatedBatchCount, 10_000_000, "GLOBAL_COVERAGE_BATCH_COUNT");
  plain(r.regionCounts, "GLOBAL_COVERAGE_REGION_COUNTS");
  exact(r.regionCounts, REGIONS, "GLOBAL_COVERAGE_REGION_COUNTS");
  let regionTotal = 0;
  for (const region of REGIONS) {
    const count = r.regionCounts[region];
    safeInt(count, 196, `GLOBAL_COVERAGE_${region}_COUNT`);
    regionTotal += count;
  }
  if (regionTotal !== r.targetedJurisdictionCount || r.africaTargetCount !== r.regionCounts.AFRICA) {
    throw new Error("GLOBAL_COVERAGE_REGION_TOTAL_MISMATCH");
  }
  if (r.coverageTargetComplete !== (r.targetedJurisdictionCount === r.requiredJurisdictionCount)) {
    throw new Error("GLOBAL_COVERAGE_TARGET_STATE_MISMATCH");
  }
  if (
    r.requiresDatasetAdmissionFabric !== true ||
    r.requiresCountryCompletenessValidation !== true ||
    r.requiresProvenance !== true ||
    r.requiresLicenseCompatibility !== true ||
    r.restrictedPersonalDataAllowed !== false ||
    r.zeroSecretContext !== true ||
    r.safeReadOnly !== true ||
    r.canFetchExternalData !== false ||
    r.canFeedCore !== false ||
    r.executionAuthority !== false ||
    r.mutationAuthority !== false ||
    r.productionAuthority !== false
  ) {
    throw new Error("GLOBAL_COVERAGE_FEED_AUTHORITY_VIOLATION");
  }
  return Object.freeze({ ...r });
}

function validateCompleteness(input: unknown): Readonly<XviGlobalCompletenessRollupReceiptMirror> {
  plain(input, "GLOBAL_COVERAGE_COMPLETENESS");
  exact(input, [
    "schemaVersion","regionRollups","totalCountries","countriesWithAnyGap","countriesWithZeroCoverage",
    "countriesWithLanguageGaps","globalRequiresHumanReview","averagesAreNotCompleteness","safeReadOnly",
    "executionAuthority","mutationAuthority","productionAuthority"
  ], "GLOBAL_COVERAGE_COMPLETENESS");
  const r = input as unknown as XviGlobalCompletenessRollupReceiptMirror;
  if (r.schemaVersion !== "xvi-global-completeness-rollup-v1") throw new Error("GLOBAL_COVERAGE_COMPLETENESS_SCHEMA_INVALID");
  safeInt(r.totalCountries, 196, "GLOBAL_COVERAGE_COUNTRY_COUNT");
  uniqueStrings(r.countriesWithAnyGap, 196, "GLOBAL_COVERAGE_GAP_COUNTRIES");
  uniqueStrings(r.countriesWithZeroCoverage, 196, "GLOBAL_COVERAGE_ZERO_COUNTRIES");
  uniqueStrings(r.countriesWithLanguageGaps, 196, "GLOBAL_COVERAGE_LANGUAGE_GAPS");
  if (!Array.isArray(r.regionRollups) || r.regionRollups.length > 5) throw new Error("GLOBAL_COVERAGE_REGION_ROLLUP_COUNT_INVALID");
  const seen = new Set<XviGlobalCoverageRegion>();
  for (const raw of r.regionRollups) {
    plain(raw, "GLOBAL_COVERAGE_REGION_ROLLUP");
    const row = raw as unknown as XviRegionCompletenessRollupMirror;
    if (!REGIONS.includes(row.region) || seen.has(row.region)) throw new Error("GLOBAL_COVERAGE_REGION_ROLLUP_INVALID");
    seen.add(row.region);
    safeInt(row.countryCount, 196, "GLOBAL_COVERAGE_REGION_COUNTRY_COUNT");
    safeInt(row.quarantinedCountryCount, 196, "GLOBAL_COVERAGE_REGION_QUARANTINE_COUNT");
    safeInt(row.disputedCountryCount, 196, "GLOBAL_COVERAGE_REGION_DISPUTED_COUNT");
    if (typeof row.requiresHumanReview !== "boolean") throw new Error("GLOBAL_COVERAGE_REGION_REVIEW_INVALID");
  }
  if (
    r.averagesAreNotCompleteness !== true ||
    r.safeReadOnly !== true ||
    r.executionAuthority !== false ||
    r.mutationAuthority !== false ||
    r.productionAuthority !== false
  ) {
    throw new Error("GLOBAL_COVERAGE_COMPLETENESS_AUTHORITY_VIOLATION");
  }
  const expectedReview =
    r.countriesWithAnyGap.length > 0 ||
    r.regionRollups.some((row) => row.requiresHumanReview);
  if (r.globalRequiresHumanReview !== expectedReview) {
    throw new Error("GLOBAL_COVERAGE_REVIEW_STATE_MISMATCH");
  }
  return Object.freeze({ ...r });
}

function modeLabel(mode: XviGlobalCoverageRunMode): "Online governed" | "Offline governed" | "Local only" {
  return mode === "ONLINE_GOVERNED" ? "Online governed" : mode === "OFFLINE_GOVERNED" ? "Offline governed" : "Local only";
}

function audienceEyebrow(audience: XviGlobalCoverageAudience): string {
  return audience === "CONSUMER"
    ? "World knowledge"
    : audience === "ENTREPRENEUR"
      ? "Global opportunity coverage"
      : "Executive global intelligence";
}

export function presentGlobalDataCoverageCard(
  input: unknown
): Readonly<XviGlobalDataCoverageCardPresentation> {
  plain(input, "GLOBAL_COVERAGE_CARD");
  exact(input, ["audience","feedPlan","completeness","safeReadOnly","canFetchExternalData","canMutate","canClaimIngestion"], "GLOBAL_COVERAGE_CARD");
  const r = input as unknown as XviGlobalDataCoverageCardInput;
  if (!AUDIENCES.has(r.audience)) throw new Error("GLOBAL_COVERAGE_AUDIENCE_INVALID");
  if (
    r.safeReadOnly !== true ||
    r.canFetchExternalData !== false ||
    r.canMutate !== false ||
    r.canClaimIngestion !== false
  ) {
    throw new Error("GLOBAL_COVERAGE_CARD_AUTHORITY_VIOLATION");
  }

  const feed = validateFeedPlan(r.feedPlan);
  const completeness = validateCompleteness(r.completeness);

  const regionCoverage = REGIONS.map((region) => {
    const targetedJurisdictions = feed.regionCounts[region];
    const observedCountries =
      completeness.regionRollups.find((row) => row.region === region)?.countryCount ?? 0;
    const status: XviRegionCoveragePresentation["status"] =
      targetedJurisdictions === 0
        ? "MISSING"
        : observedCountries >= targetedJurisdictions
          ? "COVERED"
          : "PARTIAL";
    return Object.freeze({ region, targetedJurisdictions, observedCountries, status });
  });

  const missingRegion = regionCoverage.some((row) => row.status === "MISSING");
  const incomplete = !feed.coverageTargetComplete || missingRegion;
  const needsReview = completeness.globalRequiresHumanReview;
  const reviewState = incomplete ? "INCOMPLETE" : needsReview ? "NEEDS_REVIEW" : "CLEAR";
  const route = reviewState === "CLEAR" ? "UNIVERSE" : "NEEDS_YOU";
  const primaryAction = reviewState === "CLEAR" ? "Explore global data" : "Review coverage gaps";
  const askXviContext =
    feed.regionCounts.AFRICA === 0 || regionCoverage.find((row) => row.region === "AFRICA")?.status !== "COVERED"
      ? "Explain Africa coverage"
      : reviewState === "CLEAR"
        ? "Explain global coverage"
        : "Explain data gaps";

  const scaleLabel =
    feed.scaleClaim === "TRILLION_SCALE_LOGICAL_TARGET_BOUNDED_BATCHES"
      ? `${feed.logicalDatasetTarget.toLocaleString("en-US")} logical dataset target · ${feed.estimatedBatchCount.toLocaleString("en-US")} bounded batches`
      : `${feed.logicalDatasetTarget.toLocaleString("en-US")} logical dataset target`;

  return Object.freeze({
    schemaVersion: "xvi-global-data-coverage-card-v1",
    audience: r.audience,
    title: "Global data coverage",
    eyebrow: audienceEyebrow(r.audience),
    modeLabel: modeLabel(feed.runMode),
    targetedJurisdictionCount: feed.targetedJurisdictionCount,
    requiredJurisdictionCount: feed.requiredJurisdictionCount,
    observedCountryCount: completeness.totalCountries,
    africaTargetCount: feed.africaTargetCount,
    regionCoverage: Object.freeze(regionCoverage),
    gapCountryCount: completeness.countriesWithAnyGap.length,
    zeroCoverageCountryCount: completeness.countriesWithZeroCoverage.length,
    languageGapCountryCount: completeness.countriesWithLanguageGaps.length,
    scaleLabel,
    trustLabel: "Provenance + license compatibility required",
    reviewState,
    route,
    primaryAction,
    secondaryAction: "Ask XVI",
    askXviContext,
    disclaimer: "Coverage targets are plans and receipts, not claims of completed ingestion.",
    accessibilityLabel:
      `Global data coverage. ${modeLabel(feed.runMode)}. ${feed.targetedJurisdictionCount} jurisdictions targeted. ` +
      `${completeness.totalCountries} completeness snapshots observed. Africa target count ${feed.africaTargetCount}. ` +
      `${completeness.countriesWithAnyGap.length} jurisdictions have gaps. ${scaleLabel}. ` +
      `Coverage targets are plans and receipts, not claims of completed ingestion.`,
    safeReadOnly: true,
    canFetchExternalData: false,
    canFeedCore: false,
    canMutate: false,
    canClaimIngestion: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
  });
}
