import type { XviDatasetClass } from "./xvi-global-dataset-admission-fabric";

export type XviGlobalFeedRunMode =
  | "ONLINE_GOVERNED"
  | "OFFLINE_GOVERNED"
  | "LOCAL_ONLY";

export type XviGlobalFeedRegion =
  | "AFRICA"
  | "AMERICAS"
  | "ASIA"
  | "EUROPE"
  | "OCEANIA";

export type XviSourceAccessClass =
  | "PUBLIC"
  | "LICENSED"
  | "PERMISSIONED";

export interface XviGlobalFeedJurisdictionTarget {
  readonly jurisdictionId: string;
  readonly region: XviGlobalFeedRegion;
  readonly languageTags: readonly string[];
  readonly datasetClasses: readonly XviDatasetClass[];
  readonly targetWeight: number;
}

export interface XviGlobalDatasetFeedPlanInput {
  readonly planId: string;
  readonly runMode: XviGlobalFeedRunMode;
  readonly targets: readonly XviGlobalFeedJurisdictionTarget[];
  readonly requiredJurisdictionCount: number;
  readonly requireAllRegions: boolean;
  readonly logicalDatasetTarget: number;
  readonly maxDatasetsPerBatch: number;
  readonly maxBytesPerBatch: number;
  readonly allowedSourceAccess: readonly XviSourceAccessClass[];
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

export interface XviGlobalDatasetFeedPlanReceipt {
  readonly schemaVersion: "xvi-global-dataset-feed-plan-v1";
  readonly planId: string;
  readonly runMode: XviGlobalFeedRunMode;
  readonly targetedJurisdictionCount: number;
  readonly requiredJurisdictionCount: number;
  readonly coverageTargetComplete: boolean;
  readonly regionCounts: Readonly<Record<XviGlobalFeedRegion, number>>;
  readonly africaTargetCount: number;
  readonly logicalDatasetTarget: number;
  readonly maxDatasetsPerBatch: number;
  readonly maxBytesPerBatch: number;
  readonly estimatedBatchCount: number;
  readonly scaleClaim:
    | "TRILLION_SCALE_LOGICAL_TARGET_BOUNDED_BATCHES"
    | "BOUNDED_LOGICAL_TARGET";
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

const PLAIN = Object.getPrototypeOf({});
const MAX_JURISDICTIONS = 196;
const MAX_LOGICAL_DATASET_TARGET = 1_000_000_000_000;
const MAX_DATASETS_PER_BATCH = 100_000;
const MAX_BYTES_PER_BATCH = 4_000_000_000;
const REGIONS = new Set<XviGlobalFeedRegion>([
  "AFRICA",
  "AMERICAS",
  "ASIA",
  "EUROPE",
  "OCEANIA",
]);
const SOURCE_ACCESS = new Set<XviSourceAccessClass>([
  "PUBLIC",
  "LICENSED",
  "PERMISSIONED",
]);

function plain(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== PLAIN) {
    throw new Error(`${label}_PLAIN_REQUIRED`);
  }
  if (Object.getOwnPropertySymbols(value).length) {
    throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  }
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) {
      throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
    }
  }
}

function exact(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label}_SCHEMA_MISMATCH`);
  }
}

function safeInt(value: number, min: number, max: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${label}_INVALID`);
  }
}

function uniqueStrings(values: readonly string[], max: number, label: string, min = 0): void {
  if (!Array.isArray(values) || values.length < min || values.length > max) {
    throw new Error(`${label}_COUNT_INVALID`);
  }
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string" || !value.trim() || value.length > 240) {
      throw new Error(`${label}_INVALID`);
    }
    if (seen.has(value)) {
      throw new Error(`${label}_DUPLICATE`);
    }
    seen.add(value);
  }
}

function validateTarget(input: unknown): Readonly<XviGlobalFeedJurisdictionTarget> {
  plain(input, "GLOBAL_FEED_TARGET");
  exact(
    input,
    ["jurisdictionId", "region", "languageTags", "datasetClasses", "targetWeight"],
    "GLOBAL_FEED_TARGET"
  );
  const target = input as unknown as XviGlobalFeedJurisdictionTarget;
  if (!/^jurisdiction:/.test(target.jurisdictionId)) {
    throw new Error("GLOBAL_FEED_JURISDICTION_INVALID");
  }
  if (!REGIONS.has(target.region)) {
    throw new Error("GLOBAL_FEED_REGION_INVALID");
  }
  uniqueStrings(target.languageTags, 128, "GLOBAL_FEED_LANGUAGES", 1);
  uniqueStrings(target.datasetClasses, 32, "GLOBAL_FEED_DATASET_CLASSES", 1);
  safeInt(target.targetWeight, 1, 1_000_000, "GLOBAL_FEED_TARGET_WEIGHT");
  return Object.freeze({
    ...target,
    languageTags: Object.freeze([...target.languageTags]),
    datasetClasses: Object.freeze([...target.datasetClasses]),
  });
}

export function planGlobalDatasetFeed(
  input: unknown
): Readonly<XviGlobalDatasetFeedPlanReceipt> {
  plain(input, "GLOBAL_FEED");
  exact(
    input,
    [
      "planId",
      "runMode",
      "targets",
      "requiredJurisdictionCount",
      "requireAllRegions",
      "logicalDatasetTarget",
      "maxDatasetsPerBatch",
      "maxBytesPerBatch",
      "allowedSourceAccess",
      "requiresProvenance",
      "requiresLicenseCompatibility",
      "restrictedPersonalDataAllowed",
      "zeroSecretContext",
      "safeReadOnly",
      "canFetchExternalData",
      "canFeedCore",
      "executionAuthority",
      "mutationAuthority",
      "productionAuthority",
    ],
    "GLOBAL_FEED"
  );

  const request = input as unknown as XviGlobalDatasetFeedPlanInput;

  if (!/^global-feed:/.test(request.planId)) {
    throw new Error("GLOBAL_FEED_PLAN_ID_INVALID");
  }
  if (!["ONLINE_GOVERNED", "OFFLINE_GOVERNED", "LOCAL_ONLY"].includes(request.runMode)) {
    throw new Error("GLOBAL_FEED_RUN_MODE_INVALID");
  }

  safeInt(request.requiredJurisdictionCount, 1, MAX_JURISDICTIONS, "GLOBAL_FEED_REQUIRED_JURISDICTIONS");
  safeInt(request.logicalDatasetTarget, 1, MAX_LOGICAL_DATASET_TARGET, "GLOBAL_FEED_LOGICAL_TARGET");
  safeInt(request.maxDatasetsPerBatch, 1, MAX_DATASETS_PER_BATCH, "GLOBAL_FEED_BATCH_DATASETS");
  safeInt(request.maxBytesPerBatch, 1, MAX_BYTES_PER_BATCH, "GLOBAL_FEED_BATCH_BYTES");

  if (!Array.isArray(request.targets) || request.targets.length < 1 || request.targets.length > MAX_JURISDICTIONS) {
    throw new Error("GLOBAL_FEED_TARGET_COUNT_INVALID");
  }

  if (typeof request.requireAllRegions !== "boolean") {
    throw new Error("GLOBAL_FEED_REQUIRE_ALL_REGIONS_INVALID");
  }

  uniqueStrings(request.allowedSourceAccess, 3, "GLOBAL_FEED_SOURCE_ACCESS", 1);
  if (request.allowedSourceAccess.some((value) => !SOURCE_ACCESS.has(value as XviSourceAccessClass))) {
    throw new Error("GLOBAL_FEED_SOURCE_ACCESS_INVALID");
  }

  if (
    request.requiresProvenance !== true ||
    request.requiresLicenseCompatibility !== true ||
    request.restrictedPersonalDataAllowed !== false ||
    request.zeroSecretContext !== true ||
    request.safeReadOnly !== true ||
    request.canFetchExternalData !== false ||
    request.canFeedCore !== false ||
    request.executionAuthority !== false ||
    request.mutationAuthority !== false ||
    request.productionAuthority !== false
  ) {
    throw new Error("GLOBAL_FEED_AUTHORITY_VIOLATION");
  }

  const targetIds = new Set<string>();
  const regionCounts: Record<XviGlobalFeedRegion, number> = {
    AFRICA: 0,
    AMERICAS: 0,
    ASIA: 0,
    EUROPE: 0,
    OCEANIA: 0,
  };

  for (const raw of request.targets) {
    const target = validateTarget(raw);
    if (targetIds.has(target.jurisdictionId)) {
      throw new Error("GLOBAL_FEED_JURISDICTION_DUPLICATE");
    }
    targetIds.add(target.jurisdictionId);
    regionCounts[target.region] += 1;
  }

  if (request.targets.length > request.requiredJurisdictionCount) {
    throw new Error("GLOBAL_FEED_TARGETS_EXCEED_REQUIRED_COUNT");
  }

  if (request.requireAllRegions && Object.values(regionCounts).some((count) => count === 0)) {
    throw new Error("GLOBAL_FEED_REGION_COVERAGE_INCOMPLETE");
  }

  const estimatedBatchCount = Math.ceil(
    request.logicalDatasetTarget / request.maxDatasetsPerBatch
  );

  return Object.freeze({
    schemaVersion: "xvi-global-dataset-feed-plan-v1",
    planId: request.planId,
    runMode: request.runMode,
    targetedJurisdictionCount: request.targets.length,
    requiredJurisdictionCount: request.requiredJurisdictionCount,
    coverageTargetComplete: request.targets.length === request.requiredJurisdictionCount,
    regionCounts: Object.freeze({ ...regionCounts }),
    africaTargetCount: regionCounts.AFRICA,
    logicalDatasetTarget: request.logicalDatasetTarget,
    maxDatasetsPerBatch: request.maxDatasetsPerBatch,
    maxBytesPerBatch: request.maxBytesPerBatch,
    estimatedBatchCount,
    scaleClaim:
      request.logicalDatasetTarget >= 1_000_000_000_000
        ? "TRILLION_SCALE_LOGICAL_TARGET_BOUNDED_BATCHES"
        : "BOUNDED_LOGICAL_TARGET",
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
  });
}
