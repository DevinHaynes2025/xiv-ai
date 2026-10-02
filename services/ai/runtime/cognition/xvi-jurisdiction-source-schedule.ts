import { createHash } from "node:crypto";
import type { XviDatasetClass } from "./xvi-global-dataset-admission-fabric";

export type XviJurisdictionScheduleRunMode =
  | "ONLINE_GOVERNED"
  | "OFFLINE_GOVERNED"
  | "LOCAL_ONLY";

export type XviJurisdictionScheduleRegion =
  | "AFRICA"
  | "AMERICAS"
  | "ASIA"
  | "EUROPE"
  | "OCEANIA";

export type XviJurisdictionSourceAccess =
  | "PUBLIC"
  | "LICENSED"
  | "PERMISSIONED";

export type XviJurisdictionRefreshCadence =
  | "STATIC"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "ON_CHANGE";

export type XviJurisdictionPersonalDataClass =
  | "NONE"
  | "AGGREGATED"
  | "PUBLIC_PROFESSIONAL"
  | "RESTRICTED";

export interface XviJurisdictionSourceDescriptor {
  readonly sourceId: string;
  readonly sourceLocatorHash: string;
  readonly accessClass: XviJurisdictionSourceAccess;
  readonly licenseId: string | null;
  readonly permissionReceiptHash: string | null;
  readonly provenanceHash: string;
  readonly allowedUse: readonly string[];
  readonly languageTags: readonly string[];
  readonly datasetClasses: readonly XviDatasetClass[];
  readonly refreshCadence: XviJurisdictionRefreshCadence;
  readonly personalDataClass: XviJurisdictionPersonalDataClass;
  readonly priority: number;
}

export interface XviJurisdictionSourceScheduleInput {
  readonly scheduleId: string;
  readonly globalFeedPlanId: string;
  readonly runMode: XviJurisdictionScheduleRunMode;
  readonly jurisdictionId: string;
  readonly region: XviJurisdictionScheduleRegion;
  readonly languageTags: readonly string[];
  readonly datasetClasses: readonly XviDatasetClass[];
  readonly sources: readonly XviJurisdictionSourceDescriptor[];
  readonly maxSourcesPerRun: number;
  readonly maxItemsPerRun: number;
  readonly maxBytesPerRun: number;
  readonly maxRetries: number;
  readonly retryBackoffSeconds: number;
  readonly observedAt: string;
  readonly requiresProvenance: true;
  readonly requiresLicenseCompatibility: true;
  readonly restrictedPersonalDataAllowed: false;
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly canFetchExternalData: false;
  readonly canFeedCountryCell: false;
  readonly canFeedCore: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviJurisdictionSourceWorkPacket {
  readonly sequence: number;
  readonly sourceId: string;
  readonly accessClass: XviJurisdictionSourceAccess;
  readonly languageTags: readonly string[];
  readonly datasetClasses: readonly XviDatasetClass[];
  readonly refreshCadence: XviJurisdictionRefreshCadence;
  readonly priority: number;
  readonly dedupKey: string;
  readonly requiresDatasetAdmissionFabric: true;
  readonly requiresProvenance: true;
  readonly requiresLicenseCompatibility: true;
  readonly maxRetries: number;
  readonly retryBackoffSeconds: number;
  readonly canFetchExternalData: false;
  readonly canFeedCountryCell: false;
  readonly canFeedCore: false;
}

export interface XviJurisdictionSourceScheduleReceipt {
  readonly schemaVersion: "xvi-jurisdiction-source-schedule-v1";
  readonly scheduleId: string;
  readonly globalFeedPlanId: string;
  readonly runMode: XviJurisdictionScheduleRunMode;
  readonly jurisdictionId: string;
  readonly region: XviJurisdictionScheduleRegion;
  readonly languageTags: readonly string[];
  readonly datasetClasses: readonly XviDatasetClass[];
  readonly sourceCount: number;
  readonly selectedForNextRunCount: number;
  readonly deferredSourceCount: number;
  readonly maxSourcesPerRun: number;
  readonly maxItemsPerRun: number;
  readonly maxBytesPerRun: number;
  readonly maxRetries: number;
  readonly retryBackoffSeconds: number;
  readonly packets: readonly XviJurisdictionSourceWorkPacket[];
  readonly requiresDatasetAdmissionFabric: true;
  readonly requiresCountryCompletenessValidation: true;
  readonly restrictedPersonalDataAllowed: false;
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly canFetchExternalData: false;
  readonly canFeedCountryCell: false;
  readonly canFeedCore: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const REGIONS = new Set<XviJurisdictionScheduleRegion>([
  "AFRICA",
  "AMERICAS",
  "ASIA",
  "EUROPE",
  "OCEANIA",
]);
const MODES = new Set<XviJurisdictionScheduleRunMode>([
  "ONLINE_GOVERNED",
  "OFFLINE_GOVERNED",
  "LOCAL_ONLY",
]);
const ACCESS = new Set<XviJurisdictionSourceAccess>([
  "PUBLIC",
  "LICENSED",
  "PERMISSIONED",
]);
const CADENCES = new Set<XviJurisdictionRefreshCadence>([
  "STATIC",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "ON_CHANGE",
]);
const PERSONAL = new Set<XviJurisdictionPersonalDataClass>([
  "NONE",
  "AGGREGATED",
  "PUBLIC_PROFESSIONAL",
  "RESTRICTED",
]);
const DATASET_CLASSES = new Set<XviDatasetClass>([
  "PUBLIC_RECORDS",
  "RESEARCH",
  "ECONOMIC",
  "INFRASTRUCTURE",
  "ORGANIZATION",
  "LANGUAGE",
  "CIVIL_SOCIETY",
  "ENVIRONMENT",
  "HEALTH",
  "EDUCATION",
  "LOGISTICS",
  "ENERGY",
  "TELECOM",
  "OTHER",
]);

const MAX_SOURCES = 256;
const MAX_SOURCES_PER_RUN = 64;
const MAX_ITEMS_PER_RUN = 1_000_000;
const MAX_BYTES_PER_RUN = 4_000_000_000;
const MAX_RETRIES = 3;
const MAX_BACKOFF_SECONDS = 3600;

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

function iso(value: string, label: string): void {
  if (typeof value !== "string" || !value.includes("T") || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label}_INVALID`);
  }
}

function hash(value: string, label: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${label}_INVALID`);
  }
}

function uniqueStrings(
  values: readonly string[],
  max: number,
  label: string,
  min = 0
): void {
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

function validateLanguages(values: readonly string[], label: string): void {
  uniqueStrings(values, 128, label, 1);
  if (values.some((tag) => !/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(tag))) {
    throw new Error(`${label}_INVALID`);
  }
}

function validateDatasetClasses(values: readonly XviDatasetClass[], label: string): void {
  uniqueStrings(values, DATASET_CLASSES.size, label, 1);
  if (values.some((value) => !DATASET_CLASSES.has(value))) {
    throw new Error(`${label}_INVALID`);
  }
}

function dedupKey(
  jurisdictionId: string,
  source: XviJurisdictionSourceDescriptor
): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        jurisdictionId,
        sourceLocatorHash: source.sourceLocatorHash,
        accessClass: source.accessClass,
        languageTags: [...source.languageTags].sort(),
        datasetClasses: [...source.datasetClasses].sort(),
      }),
      "utf8"
    )
    .digest("hex");
}

function validateSource(
  input: unknown,
  scheduleLanguages: ReadonlySet<string>,
  scheduleClasses: ReadonlySet<XviDatasetClass>
): Readonly<XviJurisdictionSourceDescriptor> {
  plain(input, "JURISDICTION_SOURCE");
  exact(
    input,
    [
      "sourceId",
      "sourceLocatorHash",
      "accessClass",
      "licenseId",
      "permissionReceiptHash",
      "provenanceHash",
      "allowedUse",
      "languageTags",
      "datasetClasses",
      "refreshCadence",
      "personalDataClass",
      "priority",
    ],
    "JURISDICTION_SOURCE"
  );

  const source = input as unknown as XviJurisdictionSourceDescriptor;
  if (!/^source:/.test(source.sourceId)) {
    throw new Error("JURISDICTION_SOURCE_ID_INVALID");
  }
  hash(source.sourceLocatorHash, "JURISDICTION_SOURCE_LOCATOR_HASH");
  hash(source.provenanceHash, "JURISDICTION_SOURCE_PROVENANCE_HASH");

  if (!ACCESS.has(source.accessClass)) {
    throw new Error("JURISDICTION_SOURCE_ACCESS_INVALID");
  }
  if (!CADENCES.has(source.refreshCadence)) {
    throw new Error("JURISDICTION_SOURCE_CADENCE_INVALID");
  }
  if (!PERSONAL.has(source.personalDataClass)) {
    throw new Error("JURISDICTION_SOURCE_PERSONAL_DATA_INVALID");
  }
  if (source.personalDataClass === "RESTRICTED") {
    throw new Error("JURISDICTION_SOURCE_RESTRICTED_DATA_FORBIDDEN");
  }

  if (source.accessClass === "LICENSED") {
    if (typeof source.licenseId !== "string" || !source.licenseId.trim()) {
      throw new Error("JURISDICTION_SOURCE_LICENSE_REQUIRED");
    }
  } else if (source.licenseId !== null && (typeof source.licenseId !== "string" || !source.licenseId.trim())) {
    throw new Error("JURISDICTION_SOURCE_LICENSE_INVALID");
  }

  if (source.accessClass === "PERMISSIONED") {
    if (typeof source.permissionReceiptHash !== "string") {
      throw new Error("JURISDICTION_SOURCE_PERMISSION_REQUIRED");
    }
    hash(source.permissionReceiptHash, "JURISDICTION_SOURCE_PERMISSION_HASH");
  } else if (source.permissionReceiptHash !== null) {
    if (typeof source.permissionReceiptHash !== "string") {
      throw new Error("JURISDICTION_SOURCE_PERMISSION_INVALID");
    }
    hash(source.permissionReceiptHash, "JURISDICTION_SOURCE_PERMISSION_HASH");
  }

  uniqueStrings(source.allowedUse, 64, "JURISDICTION_SOURCE_ALLOWED_USE", 1);
  validateLanguages(source.languageTags, "JURISDICTION_SOURCE_LANGUAGES");
  validateDatasetClasses(source.datasetClasses, "JURISDICTION_SOURCE_DATASET_CLASSES");
  safeInt(source.priority, 1, 100, "JURISDICTION_SOURCE_PRIORITY");

  if (source.languageTags.some((tag) => !scheduleLanguages.has(tag))) {
    throw new Error("JURISDICTION_SOURCE_LANGUAGE_SCOPE_MISMATCH");
  }
  if (source.datasetClasses.some((value) => !scheduleClasses.has(value))) {
    throw new Error("JURISDICTION_SOURCE_DATASET_SCOPE_MISMATCH");
  }

  return Object.freeze({
    ...source,
    allowedUse: Object.freeze([...source.allowedUse]),
    languageTags: Object.freeze([...source.languageTags]),
    datasetClasses: Object.freeze([...source.datasetClasses]),
  });
}

export function planJurisdictionSourceSchedule(
  input: unknown
): Readonly<XviJurisdictionSourceScheduleReceipt> {
  plain(input, "JURISDICTION_SCHEDULE");
  exact(
    input,
    [
      "scheduleId",
      "globalFeedPlanId",
      "runMode",
      "jurisdictionId",
      "region",
      "languageTags",
      "datasetClasses",
      "sources",
      "maxSourcesPerRun",
      "maxItemsPerRun",
      "maxBytesPerRun",
      "maxRetries",
      "retryBackoffSeconds",
      "observedAt",
      "requiresProvenance",
      "requiresLicenseCompatibility",
      "restrictedPersonalDataAllowed",
      "zeroSecretContext",
      "safeReadOnly",
      "canFetchExternalData",
      "canFeedCountryCell",
      "canFeedCore",
      "executionAuthority",
      "mutationAuthority",
      "productionAuthority",
    ],
    "JURISDICTION_SCHEDULE"
  );

  const request = input as unknown as XviJurisdictionSourceScheduleInput;

  if (!/^jurisdiction-schedule:/.test(request.scheduleId)) {
    throw new Error("JURISDICTION_SCHEDULE_ID_INVALID");
  }
  if (!/^global-feed:/.test(request.globalFeedPlanId)) {
    throw new Error("JURISDICTION_SCHEDULE_FEED_PLAN_ID_INVALID");
  }
  if (!/^jurisdiction:/.test(request.jurisdictionId)) {
    throw new Error("JURISDICTION_SCHEDULE_JURISDICTION_INVALID");
  }
  if (!MODES.has(request.runMode)) {
    throw new Error("JURISDICTION_SCHEDULE_RUN_MODE_INVALID");
  }
  if (!REGIONS.has(request.region)) {
    throw new Error("JURISDICTION_SCHEDULE_REGION_INVALID");
  }

  validateLanguages(request.languageTags, "JURISDICTION_SCHEDULE_LANGUAGES");
  validateDatasetClasses(request.datasetClasses, "JURISDICTION_SCHEDULE_DATASET_CLASSES");

  if (!Array.isArray(request.sources) || request.sources.length < 1 || request.sources.length > MAX_SOURCES) {
    throw new Error("JURISDICTION_SCHEDULE_SOURCE_COUNT_INVALID");
  }

  safeInt(request.maxSourcesPerRun, 1, MAX_SOURCES_PER_RUN, "JURISDICTION_SCHEDULE_MAX_SOURCES");
  safeInt(request.maxItemsPerRun, 1, MAX_ITEMS_PER_RUN, "JURISDICTION_SCHEDULE_MAX_ITEMS");
  safeInt(request.maxBytesPerRun, 1, MAX_BYTES_PER_RUN, "JURISDICTION_SCHEDULE_MAX_BYTES");
  safeInt(request.maxRetries, 0, MAX_RETRIES, "JURISDICTION_SCHEDULE_MAX_RETRIES");
  safeInt(request.retryBackoffSeconds, 1, MAX_BACKOFF_SECONDS, "JURISDICTION_SCHEDULE_RETRY_BACKOFF");
  iso(request.observedAt, "JURISDICTION_SCHEDULE_OBSERVED_AT");

  if (
    request.requiresProvenance !== true ||
    request.requiresLicenseCompatibility !== true ||
    request.restrictedPersonalDataAllowed !== false ||
    request.zeroSecretContext !== true ||
    request.safeReadOnly !== true ||
    request.canFetchExternalData !== false ||
    request.canFeedCountryCell !== false ||
    request.canFeedCore !== false ||
    request.executionAuthority !== false ||
    request.mutationAuthority !== false ||
    request.productionAuthority !== false
  ) {
    throw new Error("JURISDICTION_SCHEDULE_AUTHORITY_VIOLATION");
  }

  const scheduleLanguages = new Set(request.languageTags);
  const scheduleClasses = new Set(request.datasetClasses);
  const sourceIds = new Set<string>();
  const dedupKeys = new Set<string>();

  const validated = request.sources.map((raw) => {
    const source = validateSource(raw, scheduleLanguages, scheduleClasses);
    if (sourceIds.has(source.sourceId)) {
      throw new Error("JURISDICTION_SCHEDULE_SOURCE_ID_DUPLICATE");
    }
    sourceIds.add(source.sourceId);

    const key = dedupKey(request.jurisdictionId, source);
    if (dedupKeys.has(key)) {
      throw new Error("JURISDICTION_SCHEDULE_DEDUP_COLLISION");
    }
    dedupKeys.add(key);
    return { source, key };
  });

  validated.sort((a, b) => {
    if (a.source.priority !== b.source.priority) {
      return b.source.priority - a.source.priority;
    }
    return a.source.sourceId.localeCompare(b.source.sourceId);
  });

  const packets = validated.map(({ source, key }, index) =>
    Object.freeze({
      sequence: index + 1,
      sourceId: source.sourceId,
      accessClass: source.accessClass,
      languageTags: Object.freeze([...source.languageTags]),
      datasetClasses: Object.freeze([...source.datasetClasses]),
      refreshCadence: source.refreshCadence,
      priority: source.priority,
      dedupKey: key,
      requiresDatasetAdmissionFabric: true as const,
      requiresProvenance: true as const,
      requiresLicenseCompatibility: true as const,
      maxRetries: request.maxRetries,
      retryBackoffSeconds: request.retryBackoffSeconds,
      canFetchExternalData: false as const,
      canFeedCountryCell: false as const,
      canFeedCore: false as const,
    })
  );

  const selectedForNextRunCount = Math.min(
    request.maxSourcesPerRun,
    packets.length
  );

  return Object.freeze({
    schemaVersion: "xvi-jurisdiction-source-schedule-v1",
    scheduleId: request.scheduleId,
    globalFeedPlanId: request.globalFeedPlanId,
    runMode: request.runMode,
    jurisdictionId: request.jurisdictionId,
    region: request.region,
    languageTags: Object.freeze([...request.languageTags]),
    datasetClasses: Object.freeze([...request.datasetClasses]),
    sourceCount: packets.length,
    selectedForNextRunCount,
    deferredSourceCount: packets.length - selectedForNextRunCount,
    maxSourcesPerRun: request.maxSourcesPerRun,
    maxItemsPerRun: request.maxItemsPerRun,
    maxBytesPerRun: request.maxBytesPerRun,
    maxRetries: request.maxRetries,
    retryBackoffSeconds: request.retryBackoffSeconds,
    packets: Object.freeze(packets),
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
  });
}
