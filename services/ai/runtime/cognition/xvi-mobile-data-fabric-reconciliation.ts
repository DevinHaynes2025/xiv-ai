export type XviOperatingMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
export type XviCheckpointState = "OPEN" | "SEALED" | "RECONCILED" | "REVOKED";
export type XviCompactionLevel = "RAW_BATCH" | "DEVICE_WINDOW" | "TENANT_WINDOW" | "EVIDENCE_SUMMARY";

export interface XviOfflineCheckpointInput {
  readonly checkpointId: string;
  readonly tenantId: string;
  readonly deviceId: string;
  readonly mode: XviOperatingMode;
  readonly firstSequence: number;
  readonly lastSequence: number;
  readonly eventCount: number;
  readonly previousCheckpointHash: string | null;
  readonly checkpointHash: string;
  readonly replayKeys: readonly string[];
  readonly observedAt: string;
  readonly state: XviCheckpointState;
  readonly secretsPresent: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviCompactionReceiptInput {
  readonly compactionId: string;
  readonly tenantId: string;
  readonly sourceCheckpointIds: readonly string[];
  readonly shardId: string;
  readonly partitionId: string;
  readonly level: XviCompactionLevel;
  readonly sourceEventCount: number;
  readonly outputRecordCount: number;
  readonly outputContentHash: string;
  readonly createdAt: string;
  readonly promotionEligible: boolean;
  readonly quarantineReasons: readonly string[];
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviOfflineReconciliationReceipt {
  readonly schemaVersion: "xvi-offline-reconciliation-v1";
  readonly tenantId: string;
  readonly deviceId: string;
  readonly checkpointId: string;
  readonly acceptedSequenceCount: number;
  readonly replayKeyCount: number;
  readonly contiguous: boolean;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviCompactionReceipt {
  readonly schemaVersion: "xvi-mobile-compaction-v1";
  readonly compactionId: string;
  readonly tenantId: string;
  readonly shardId: string;
  readonly partitionId: string;
  readonly level: XviCompactionLevel;
  readonly sourceCheckpointCount: number;
  readonly sourceEventCount: number;
  readonly outputRecordCount: number;
  readonly compressionRatio: number;
  readonly promotionEligible: boolean;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const MODES = new Set<XviOperatingMode>(["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"]);
const STATES = new Set<XviCheckpointState>(["OPEN","SEALED","RECONCILED","REVOKED"]);
const LEVELS = new Set<XviCompactionLevel>(["RAW_BATCH","DEVICE_WINDOW","TENANT_WINDOW","EVIDENCE_SUMMARY"]);

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v === null || typeof v !== "object" || Object.getPrototypeOf(v) !== PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const k of Object.keys(v)) {
    const d = Object.getOwnPropertyDescriptor(v, k);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}
function exact(v: Record<string, unknown>, keys: readonly string[], label: string): void {
  const a = Object.keys(v).sort(), b = [...keys].sort();
  if (a.length !== b.length || a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v: string, label: string): void {
  if (typeof v !== "string" || !v.includes("T") || Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function hash(v: string, label: string): void {
  if (!/^[a-f0-9]{64}$/.test(v)) throw new Error(`${label}_INVALID`);
}
function safeInt(v: number, min: number, max: number, label: string): void {
  if (!Number.isSafeInteger(v) || v < min || v > max) throw new Error(`${label}_INVALID`);
}
function uniqueStrings(v: readonly string[], max: number, label: string, min = 0): void {
  if (!Array.isArray(v) || v.length < min || v.length > max) throw new Error(`${label}_COUNT`);
  const seen = new Set<string>();
  for (const x of v) {
    if (typeof x !== "string" || !x.trim() || x.length > 240) throw new Error(`${label}_INVALID`);
    if (seen.has(x)) throw new Error(`${label}_DUPLICATE`);
    seen.add(x);
  }
}

export function validateOfflineCheckpoint(input: unknown): Readonly<XviOfflineCheckpointInput> {
  plain(input,"CHECKPOINT");
  exact(input,["checkpointId","tenantId","deviceId","mode","firstSequence","lastSequence","eventCount","previousCheckpointHash","checkpointHash","replayKeys","observedAt","state","secretsPresent","executionAuthority","mutationAuthority","productionAuthority"],"CHECKPOINT");
  const r = input as unknown as XviOfflineCheckpointInput;
  if (!/^checkpoint:/.test(r.checkpointId) || !/^tenant:/.test(r.tenantId) || !/^device:/.test(r.deviceId)) throw new Error("CHECKPOINT_IDENTITY_INVALID");
  if (!MODES.has(r.mode) || !STATES.has(r.state)) throw new Error("CHECKPOINT_STATE_INVALID");
  safeInt(r.firstSequence,0,Number.MAX_SAFE_INTEGER,"FIRST_SEQUENCE");
  safeInt(r.lastSequence,0,Number.MAX_SAFE_INTEGER,"LAST_SEQUENCE");
  safeInt(r.eventCount,1,10_000_000,"EVENT_COUNT");
  if (r.lastSequence < r.firstSequence) throw new Error("CHECKPOINT_SEQUENCE_RANGE_INVALID");
  if (r.lastSequence - r.firstSequence + 1 !== r.eventCount) throw new Error("CHECKPOINT_SEQUENCE_COUNT_MISMATCH");
  if (r.previousCheckpointHash !== null) hash(r.previousCheckpointHash,"PREVIOUS_CHECKPOINT_HASH");
  hash(r.checkpointHash,"CHECKPOINT_HASH");
  uniqueStrings(r.replayKeys,10_000_000,"REPLAY_KEYS",1);
  if (r.replayKeys.length !== r.eventCount) throw new Error("REPLAY_KEY_COUNT_MISMATCH");
  iso(r.observedAt,"OBSERVED_AT");
  if (r.mode === "OFFLINE_GOVERNED" && r.state === "OPEN") throw new Error("OFFLINE_GOVERNED_OPEN_CHECKPOINT_FORBIDDEN");
  if (r.state === "RECONCILED" && r.previousCheckpointHash === null && r.firstSequence !== 0) throw new Error("RECONCILED_NON_GENESIS_REQUIRES_PREVIOUS_HASH");
  if (r.secretsPresent !== false || r.executionAuthority !== false || r.mutationAuthority !== false || r.productionAuthority !== false) throw new Error("CHECKPOINT_AUTHORITY_OR_SECRET_VIOLATION");
  return Object.freeze({...r,replayKeys:Object.freeze([...r.replayKeys])});
}

export function issueOfflineReconciliationReceipt(input: unknown): Readonly<XviOfflineReconciliationReceipt> {
  const r = validateOfflineCheckpoint(input);
  return Object.freeze({
    schemaVersion:"xvi-offline-reconciliation-v1",
    tenantId:r.tenantId,
    deviceId:r.deviceId,
    checkpointId:r.checkpointId,
    acceptedSequenceCount:r.eventCount,
    replayKeyCount:r.replayKeys.length,
    contiguous:r.lastSequence-r.firstSequence+1===r.eventCount,
    safeReadOnly:true,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}

export function validateCompactionReceiptInput(input: unknown): Readonly<XviCompactionReceiptInput> {
  plain(input,"COMPACTION");
  exact(input,["compactionId","tenantId","sourceCheckpointIds","shardId","partitionId","level","sourceEventCount","outputRecordCount","outputContentHash","createdAt","promotionEligible","quarantineReasons","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"COMPACTION");
  const r = input as unknown as XviCompactionReceiptInput;
  if (!/^compact:/.test(r.compactionId) || !/^tenant:/.test(r.tenantId) || !/^shard:/.test(r.shardId) || !/^partition:/.test(r.partitionId)) throw new Error("COMPACTION_IDENTITY_INVALID");
  uniqueStrings(r.sourceCheckpointIds,100_000,"SOURCE_CHECKPOINTS",1);
  if (!LEVELS.has(r.level)) throw new Error("COMPACTION_LEVEL_INVALID");
  safeInt(r.sourceEventCount,1,1_000_000_000,"SOURCE_EVENT_COUNT");
  safeInt(r.outputRecordCount,1,1_000_000_000,"OUTPUT_RECORD_COUNT");
  if (r.outputRecordCount > r.sourceEventCount) throw new Error("COMPACTION_EXPANSION_FORBIDDEN");
  hash(r.outputContentHash,"OUTPUT_CONTENT_HASH");
  iso(r.createdAt,"CREATED_AT");
  if (typeof r.promotionEligible !== "boolean") throw new Error("PROMOTION_FLAG_INVALID");
  uniqueStrings(r.quarantineReasons,64,"QUARANTINE_REASONS");
  if (r.quarantineReasons.length > 0 && r.promotionEligible) throw new Error("QUARANTINED_COMPACTION_CANNOT_PROMOTE");
  if (r.level === "RAW_BATCH" && r.promotionEligible) throw new Error("RAW_BATCH_CANNOT_PROMOTE_TO_CORE");
  if (r.safeReadOnly !== true || r.executionAuthority !== false || r.mutationAuthority !== false || r.productionAuthority !== false) throw new Error("COMPACTION_AUTHORITY_VIOLATION");
  return Object.freeze({...r,sourceCheckpointIds:Object.freeze([...r.sourceCheckpointIds]),quarantineReasons:Object.freeze([...r.quarantineReasons])});
}

export function issueCompactionReceipt(input: unknown): Readonly<XviCompactionReceipt> {
  const r = validateCompactionReceiptInput(input);
  const ratio = r.sourceEventCount / r.outputRecordCount;
  return Object.freeze({
    schemaVersion:"xvi-mobile-compaction-v1",
    compactionId:r.compactionId,
    tenantId:r.tenantId,
    shardId:r.shardId,
    partitionId:r.partitionId,
    level:r.level,
    sourceCheckpointCount:r.sourceCheckpointIds.length,
    sourceEventCount:r.sourceEventCount,
    outputRecordCount:r.outputRecordCount,
    compressionRatio:Number(ratio.toFixed(6)),
    promotionEligible:r.promotionEligible,
    requiresHumanReview:r.quarantineReasons.length>0,
    safeReadOnly:true,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
