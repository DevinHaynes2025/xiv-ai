export type XviJurisdictionScheduleCardAudience =
  | "CONSUMER"
  | "ENTREPRENEUR"
  | "EXECUTIVE";

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

export interface XviJurisdictionSourceWorkPacketMirror {
  readonly sequence: number;
  readonly sourceId: string;
  readonly accessClass: XviJurisdictionSourceAccess;
  readonly languageTags: readonly string[];
  readonly datasetClasses: readonly string[];
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

export interface XviJurisdictionSourceScheduleReceiptMirror {
  readonly schemaVersion: "xvi-jurisdiction-source-schedule-v1";
  readonly scheduleId: string;
  readonly globalFeedPlanId: string;
  readonly runMode: XviJurisdictionScheduleRunMode;
  readonly jurisdictionId: string;
  readonly region: XviJurisdictionScheduleRegion;
  readonly languageTags: readonly string[];
  readonly datasetClasses: readonly string[];
  readonly sourceCount: number;
  readonly selectedForNextRunCount: number;
  readonly deferredSourceCount: number;
  readonly maxSourcesPerRun: number;
  readonly maxItemsPerRun: number;
  readonly maxBytesPerRun: number;
  readonly maxRetries: number;
  readonly retryBackoffSeconds: number;
  readonly packets: readonly XviJurisdictionSourceWorkPacketMirror[];
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

export interface XviJurisdictionSourceScheduleCardInput {
  readonly audience: XviJurisdictionScheduleCardAudience;
  readonly receipt: XviJurisdictionSourceScheduleReceiptMirror;
  readonly safeReadOnly: true;
  readonly canFetchExternalData: false;
  readonly canMutate: false;
  readonly canClaimIngestion: false;
}

export interface XviJurisdictionSourceAccessSummary {
  readonly publicCount: number;
  readonly licensedCount: number;
  readonly permissionedCount: number;
}

export interface XviJurisdictionSourceScheduleCardPresentation {
  readonly schemaVersion: "xvi-jurisdiction-source-schedule-card-v1";
  readonly audience: XviJurisdictionScheduleCardAudience;
  readonly eyebrow: string;
  readonly title: string;
  readonly jurisdictionId: string;
  readonly region: XviJurisdictionScheduleRegion;
  readonly modeLabel: "Online governed" | "Offline governed" | "Local only";
  readonly languageLabel: string;
  readonly datasetClassLabel: string;
  readonly sourceCount: number;
  readonly selectedForNextRunCount: number;
  readonly deferredSourceCount: number;
  readonly accessSummary: XviJurisdictionSourceAccessSummary;
  readonly refreshCadences: readonly XviJurisdictionRefreshCadence[];
  readonly queueState: "READY" | "BOUNDED_QUEUE";
  readonly retryLabel: string;
  readonly budgetLabel: string;
  readonly trustLabel: "Provenance + license compatibility required";
  readonly primaryAction: "Explore sources" | "View deferred sources";
  readonly secondaryAction: "Ask XVI";
  readonly askXviContext:
    | "Explain source schedule"
    | "Explain deferred sources"
    | "Explain source access";
  readonly route: "UNIVERSE";
  readonly disclaimer: "This is a governed source schedule, not a claim of retrieval or ingestion.";
  readonly accessibilityLabel: string;
  readonly safeReadOnly: true;
  readonly requiresUserGesture: true;
  readonly canAutoNavigate: false;
  readonly navigationAuthority: false;
  readonly canFetchExternalData: false;
  readonly canFeedCountryCell: false;
  readonly canFeedCore: false;
  readonly canMutate: false;
  readonly canClaimIngestion: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const AUDIENCES = new Set<XviJurisdictionScheduleCardAudience>([
  "CONSUMER",
  "ENTREPRENEUR",
  "EXECUTIVE",
]);
const MODES = new Set<XviJurisdictionScheduleRunMode>([
  "ONLINE_GOVERNED",
  "OFFLINE_GOVERNED",
  "LOCAL_ONLY",
]);
const REGIONS = new Set<XviJurisdictionScheduleRegion>([
  "AFRICA",
  "AMERICAS",
  "ASIA",
  "EUROPE",
  "OCEANIA",
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

function plain(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== PLAIN) {
    throw new Error(`${label}_PLAIN_REQUIRED`);
  }
  if (Object.getOwnPropertySymbols(value).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
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
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${label}_INVALID`);
}

function uniqueStrings(values: readonly string[], max: number, label: string, min = 0): void {
  if (!Array.isArray(values) || values.length < min || values.length > max) throw new Error(`${label}_COUNT_INVALID`);
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string" || !value.trim() || value.length > 240) throw new Error(`${label}_INVALID`);
    if (seen.has(value)) throw new Error(`${label}_DUPLICATE`);
    seen.add(value);
  }
}

function hash(value: string, label: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(`${label}_INVALID`);
}

function modeLabel(mode: XviJurisdictionScheduleRunMode): "Online governed" | "Offline governed" | "Local only" {
  if (mode === "ONLINE_GOVERNED") return "Online governed";
  if (mode === "OFFLINE_GOVERNED") return "Offline governed";
  return "Local only";
}

function audienceEyebrow(audience: XviJurisdictionScheduleCardAudience): string {
  if (audience === "CONSUMER") return "World knowledge sources";
  if (audience === "ENTREPRENEUR") return "Market intelligence sources";
  return "Executive source coverage";
}

function validatePacket(input: unknown, receipt: XviJurisdictionSourceScheduleReceiptMirror, expectedSequence: number): Readonly<XviJurisdictionSourceWorkPacketMirror> {
  plain(input, "JURISDICTION_SCHEDULE_CARD_PACKET");
  exact(input, [
    "sequence","sourceId","accessClass","languageTags","datasetClasses","refreshCadence","priority","dedupKey",
    "requiresDatasetAdmissionFabric","requiresProvenance","requiresLicenseCompatibility","maxRetries","retryBackoffSeconds",
    "canFetchExternalData","canFeedCountryCell","canFeedCore"
  ], "JURISDICTION_SCHEDULE_CARD_PACKET");

  const packet = input as unknown as XviJurisdictionSourceWorkPacketMirror;
  if (packet.sequence !== expectedSequence || !/^source:/.test(packet.sourceId) || !ACCESS.has(packet.accessClass) || !CADENCES.has(packet.refreshCadence)) {
    throw new Error("JURISDICTION_SCHEDULE_CARD_PACKET_IDENTITY_INVALID");
  }
  uniqueStrings(packet.languageTags, 128, "JURISDICTION_SCHEDULE_CARD_PACKET_LANGUAGES", 1);
  uniqueStrings(packet.datasetClasses, 32, "JURISDICTION_SCHEDULE_CARD_PACKET_CLASSES", 1);
  if (packet.languageTags.some((tag) => !receipt.languageTags.includes(tag))) throw new Error("JURISDICTION_SCHEDULE_CARD_PACKET_LANGUAGE_SCOPE_MISMATCH");
  if (packet.datasetClasses.some((value) => !receipt.datasetClasses.includes(value))) throw new Error("JURISDICTION_SCHEDULE_CARD_PACKET_CLASS_SCOPE_MISMATCH");
  safeInt(packet.priority, 1, 100, "JURISDICTION_SCHEDULE_CARD_PACKET_PRIORITY");
  hash(packet.dedupKey, "JURISDICTION_SCHEDULE_CARD_PACKET_DEDUP");
  if (packet.maxRetries !== receipt.maxRetries || packet.retryBackoffSeconds !== receipt.retryBackoffSeconds) {
    throw new Error("JURISDICTION_SCHEDULE_CARD_PACKET_RETRY_MISMATCH");
  }
  if (packet.requiresDatasetAdmissionFabric !== true || packet.requiresProvenance !== true || packet.requiresLicenseCompatibility !== true || packet.canFetchExternalData !== false || packet.canFeedCountryCell !== false || packet.canFeedCore !== false) {
    throw new Error("JURISDICTION_SCHEDULE_CARD_PACKET_AUTHORITY_VIOLATION");
  }
  return Object.freeze({ ...packet, languageTags: Object.freeze([...packet.languageTags]), datasetClasses: Object.freeze([...packet.datasetClasses]) });
}

function validateReceipt(input: unknown): Readonly<XviJurisdictionSourceScheduleReceiptMirror> {
  plain(input, "JURISDICTION_SCHEDULE_CARD_RECEIPT");
  exact(input, [
    "schemaVersion","scheduleId","globalFeedPlanId","runMode","jurisdictionId","region","languageTags","datasetClasses",
    "sourceCount","selectedForNextRunCount","deferredSourceCount","maxSourcesPerRun","maxItemsPerRun","maxBytesPerRun",
    "maxRetries","retryBackoffSeconds","packets","requiresDatasetAdmissionFabric","requiresCountryCompletenessValidation",
    "restrictedPersonalDataAllowed","zeroSecretContext","safeReadOnly","canFetchExternalData","canFeedCountryCell","canFeedCore",
    "executionAuthority","mutationAuthority","productionAuthority"
  ], "JURISDICTION_SCHEDULE_CARD_RECEIPT");

  const receipt = input as unknown as XviJurisdictionSourceScheduleReceiptMirror;
  if (receipt.schemaVersion !== "xvi-jurisdiction-source-schedule-v1" || !/^jurisdiction-schedule:/.test(receipt.scheduleId) || !/^global-feed:/.test(receipt.globalFeedPlanId) || !/^jurisdiction:/.test(receipt.jurisdictionId) || !MODES.has(receipt.runMode) || !REGIONS.has(receipt.region)) {
    throw new Error("JURISDICTION_SCHEDULE_CARD_RECEIPT_IDENTITY_INVALID");
  }

  uniqueStrings(receipt.languageTags, 128, "JURISDICTION_SCHEDULE_CARD_LANGUAGES", 1);
  uniqueStrings(receipt.datasetClasses, 32, "JURISDICTION_SCHEDULE_CARD_CLASSES", 1);
  safeInt(receipt.sourceCount, 1, 256, "JURISDICTION_SCHEDULE_CARD_SOURCE_COUNT");
  safeInt(receipt.selectedForNextRunCount, 0, 64, "JURISDICTION_SCHEDULE_CARD_SELECTED_COUNT");
  safeInt(receipt.deferredSourceCount, 0, 256, "JURISDICTION_SCHEDULE_CARD_DEFERRED_COUNT");
  safeInt(receipt.maxSourcesPerRun, 1, 64, "JURISDICTION_SCHEDULE_CARD_MAX_SOURCES");
  safeInt(receipt.maxItemsPerRun, 1, 1_000_000, "JURISDICTION_SCHEDULE_CARD_MAX_ITEMS");
  safeInt(receipt.maxBytesPerRun, 1, 4_000_000_000, "JURISDICTION_SCHEDULE_CARD_MAX_BYTES");
  safeInt(receipt.maxRetries, 0, 3, "JURISDICTION_SCHEDULE_CARD_MAX_RETRIES");
  safeInt(receipt.retryBackoffSeconds, 1, 3600, "JURISDICTION_SCHEDULE_CARD_RETRY_BACKOFF");

  if (receipt.sourceCount !== receipt.selectedForNextRunCount + receipt.deferredSourceCount || receipt.selectedForNextRunCount > Math.min(receipt.maxSourcesPerRun, receipt.sourceCount)) {
    throw new Error("JURISDICTION_SCHEDULE_CARD_COUNT_MISMATCH");
  }
  if (!Array.isArray(receipt.packets) || receipt.packets.length !== receipt.sourceCount) throw new Error("JURISDICTION_SCHEDULE_CARD_PACKET_COUNT_MISMATCH");

  const sourceIds = new Set<string>();
  const dedupKeys = new Set<string>();
  const packets = receipt.packets.map((packet, index) => {
    const valid = validatePacket(packet, receipt, index + 1);
    if (sourceIds.has(valid.sourceId)) throw new Error("JURISDICTION_SCHEDULE_CARD_SOURCE_DUPLICATE");
    if (dedupKeys.has(valid.dedupKey)) throw new Error("JURISDICTION_SCHEDULE_CARD_DEDUP_DUPLICATE");
    sourceIds.add(valid.sourceId);
    dedupKeys.add(valid.dedupKey);
    return valid;
  });

  if (receipt.requiresDatasetAdmissionFabric !== true || receipt.requiresCountryCompletenessValidation !== true || receipt.restrictedPersonalDataAllowed !== false || receipt.zeroSecretContext !== true || receipt.safeReadOnly !== true || receipt.canFetchExternalData !== false || receipt.canFeedCountryCell !== false || receipt.canFeedCore !== false || receipt.executionAuthority !== false || receipt.mutationAuthority !== false || receipt.productionAuthority !== false) {
    throw new Error("JURISDICTION_SCHEDULE_CARD_RECEIPT_AUTHORITY_VIOLATION");
  }

  return Object.freeze({ ...receipt, languageTags: Object.freeze([...receipt.languageTags]), datasetClasses: Object.freeze([...receipt.datasetClasses]), packets: Object.freeze(packets) });
}

export function presentJurisdictionSourceScheduleCard(input: unknown): Readonly<XviJurisdictionSourceScheduleCardPresentation> {
  plain(input, "JURISDICTION_SCHEDULE_CARD");
  exact(input, ["audience","receipt","safeReadOnly","canFetchExternalData","canMutate","canClaimIngestion"], "JURISDICTION_SCHEDULE_CARD");

  const request = input as unknown as XviJurisdictionSourceScheduleCardInput;
  if (!AUDIENCES.has(request.audience)) throw new Error("JURISDICTION_SCHEDULE_CARD_AUDIENCE_INVALID");
  if (request.safeReadOnly !== true || request.canFetchExternalData !== false || request.canMutate !== false || request.canClaimIngestion !== false) {
    throw new Error("JURISDICTION_SCHEDULE_CARD_AUTHORITY_VIOLATION");
  }

  const receipt = validateReceipt(request.receipt);
  const accessSummary: XviJurisdictionSourceAccessSummary = {
    publicCount: receipt.packets.filter((packet) => packet.accessClass === "PUBLIC").length,
    licensedCount: receipt.packets.filter((packet) => packet.accessClass === "LICENSED").length,
    permissionedCount: receipt.packets.filter((packet) => packet.accessClass === "PERMISSIONED").length,
  };
  const refreshCadences = [...new Set(receipt.packets.map((packet) => packet.refreshCadence))].sort();
  const queueState = receipt.deferredSourceCount > 0 ? "BOUNDED_QUEUE" : "READY";
  const primaryAction = queueState === "BOUNDED_QUEUE" ? "View deferred sources" : "Explore sources";
  const askXviContext = queueState === "BOUNDED_QUEUE"
    ? "Explain deferred sources"
    : accessSummary.licensedCount + accessSummary.permissionedCount > 0
      ? "Explain source access"
      : "Explain source schedule";

  return Object.freeze({
    schemaVersion: "xvi-jurisdiction-source-schedule-card-v1",
    audience: request.audience,
    eyebrow: audienceEyebrow(request.audience),
    title: `${receipt.jurisdictionId.replace(/^jurisdiction:/, "")} source schedule`,
    jurisdictionId: receipt.jurisdictionId,
    region: receipt.region,
    modeLabel: modeLabel(receipt.runMode),
    languageLabel: `${receipt.languageTags.length} language${receipt.languageTags.length === 1 ? "" : "s"} · ${receipt.languageTags.join(", ")}`,
    datasetClassLabel: `${receipt.datasetClasses.length} data domain${receipt.datasetClasses.length === 1 ? "" : "s"}`,
    sourceCount: receipt.sourceCount,
    selectedForNextRunCount: receipt.selectedForNextRunCount,
    deferredSourceCount: receipt.deferredSourceCount,
    accessSummary: Object.freeze(accessSummary),
    refreshCadences: Object.freeze(refreshCadences),
    queueState,
    retryLabel: `${receipt.maxRetries} retr${receipt.maxRetries === 1 ? "y" : "ies"} max · ${receipt.retryBackoffSeconds}s governed backoff`,
    budgetLabel: `${receipt.maxSourcesPerRun} sources/run · ${receipt.maxItemsPerRun.toLocaleString("en-US")} items/run · ${receipt.maxBytesPerRun.toLocaleString("en-US")} bytes/run`,
    trustLabel: "Provenance + license compatibility required",
    primaryAction,
    secondaryAction: "Ask XVI",
    askXviContext,
    route: "UNIVERSE",
    disclaimer: "This is a governed source schedule, not a claim of retrieval or ingestion.",
    accessibilityLabel: `${receipt.jurisdictionId.replace(/^jurisdiction:/, "")} source schedule. ${modeLabel(receipt.runMode)}. ${receipt.region}. ${receipt.sourceCount} sources. ${receipt.selectedForNextRunCount} selected for the next governed run. ${receipt.deferredSourceCount} deferred by bounded capacity. Provenance and license compatibility required. No retrieval or ingestion is claimed.`,
    safeReadOnly: true,
    requiresUserGesture: true,
    canAutoNavigate: false,
    navigationAuthority: false,
    canFetchExternalData: false,
    canFeedCountryCell: false,
    canFeedCore: false,
    canMutate: false,
    canClaimIngestion: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
  });
}
