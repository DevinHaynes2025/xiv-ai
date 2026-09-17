// 12D-299 — Dataset Census Reading Bridge: the fail-closed contract that
// turns a VERIFIED dataset census (12D-297 metadata packet census or
// 12D-298 CSV census) into a BOUNDED reading document the supervised
// cycle can ingest — the directive-#7 pipeline loop closing: extracted
// data feeds the brain at METADATA level, never as raw cell content.
//
//   * VERIFIED-ONLY GATE: the census must be a VERIFIED view model with
//     the exact shape of its policy (12d-297-v1 or 12d-298-v1) — a
//     REFUSED census, a tampered field, or a foreign policy refuses.
//   * CROSS-BINDING (the 12D-275 lesson): the census must agree with
//     itself — columns.length === columnCount.
//   * METADATA LEVEL ONLY: the rendered document carries MEASURED
//     COUNTS (rows, per-column nulls/distincts), the license line, and
//     the census's own operatorNote. It NEVER carries cell content,
//     top values, or raw CSV text — the brain reads ABOUT the dataset,
//     not the dataset.
//   * BOUNDED: the rendered document is capped at 10,000 chars — a
//     census needing more than ~60 rendered columns refuses (fail
//     closed, no truncation); the reading document must also respect
//     the REAL ingest bound (100,000 chars, re-derived downstream by
//     prepareDocumentStories — this module never truncates).
//   * NO WRITE PATH, PURE MODULE: no fs, no network, no clock, no
//     randomness, no model calls. The module RETURNS the document;
//     ingestion runs through the REAL 12D-274 door, admission through
//     the REAL 12D-295 bound door, reading through the REAL 12D-283
//     cycle — this bridge only PREPARES.
//
// Disclosed residuals:
//   * The bridge trusts the census's verification (12D-297/298) — it
//     re-checks shape and self-consistency but re-runs no dataset
//     extraction; the human-supervised extraction step remains the
//     trust point.
//   * 10,000 chars is a MEASURED bound for census reading documents
//     (NOT the 2,000,000-row ceiling, which stays a dataset-bound
//     policy); a larger census is an operator-review artifact, not
//     brain-reading material.

import {
  DATASET_CSV_VIEW_MODEL_POLICY, MAX_MEASURED_CSV_ROWS,
} from './xiv-dataset-csv-view-model';
import {
  DATASET_METADATA_VIEW_MODEL_POLICY, MAX_MEASURED_FEATURES,
} from './xiv-dataset-metadata-view-model';

export const DATASET_CENSUS_READING_POLICY = Object.freeze({
  policyVersion: '12d-299-v1',
  domain: 'XIV_OS_DATASET_CENSUS_READING_BRIDGE',
});

export const DATASET_CENSUS_READING_GUARDRAILS = Object.freeze({
  verifiedOnly: true, // a REFUSED or foreign census refuses
  crossBindingSelfAgreement: true, // columns.length === columnCount
  metadataLevelOnly: true, // measured counts, never cell content or top values
  boundedDocument: true, // MAX_CENSUS_DOC_CHARS; no truncation — over refuses
  preparesThroughRealDoors: true, // 12D-274 ingest + 12D-295 admission stay the doors
  noWritePath: true,
  noActivationPath: true,
  pureModule: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export const MAX_CENSUS_DOC_CHARS = 10_000;

const INPUT_KEYS = ['tenantId', 'documentId', 'sourceId', 'census'] as const;
const METADATA_VM_KEYS = ['status', 'headline', 'sourceName', 'snapshotLabel', 'datasetSource', 'featureCount', 'geometryTypes', 'bbox', 'columns', 'majorityNullColumns', 'columnCount', 'license', 'records', 'operatorNote', 'policyVersion', 'modelCalls', 'remoteCalls', 'activated', 'learningPromoted', 'humanDecision'] as const;
const CSV_VM_KEYS = ['status', 'headline', 'fileName', 'rowCount', 'columnCount', 'columns', 'majorityNullColumns', 'measuredChars', 'records', 'operatorNote', 'policyVersion', 'modelCalls', 'remoteCalls', 'activated', 'learningPromoted', 'humanDecision'] as const;

export type DatasetCensusReadingDocument = Readonly<
  | {
      status: 'PREPARED';
      kind: 'DATASET_CENSUS_READING_DOCUMENT';
      policyVersion: string;
      tenantId: string;
      documentId: string;
      sourceId: string;
      title: string;
      bodyText: string;
      censusPolicyVersion: string;
      censusColumnCount: number;
      renderedColumnCount: number;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
  | {
      status: 'REFUSED';
      kind: 'DATASET_CENSUS_READING_DOCUMENT';
      policyVersion: string;
      reason: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
>;

function refuse(reason: string): DatasetCensusReadingDocument {
  return Object.freeze({
    status: 'REFUSED' as const,
    kind: 'DATASET_CENSUS_READING_DOCUMENT' as const,
    policyVersion: DATASET_CENSUS_READING_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const, remoteCalls: 0 as const,
    activated: 0 as const, learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

const isBounded = (v: unknown, lo: number, hi: number): v is string =>
  typeof v === 'string' && v.length >= lo && v.length <= hi;

const VM_KEYS_BY_POLICY: Record<string, readonly string[]> = {
  [DATASET_METADATA_VIEW_MODEL_POLICY.policyVersion]: METADATA_VM_KEYS,
  [DATASET_CSV_VIEW_MODEL_POLICY.policyVersion]: CSV_VM_KEYS,
};

/**
 * Prepare the bounded, metadata-level reading document for a VERIFIED
 * dataset census. NEVER throws; any anomaly refuses with zero census
 * content beyond the headline.
 */
export function prepareDatasetCensusReadingDocument(raw: unknown): DatasetCensusReadingDocument {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      return refuse('the input must be an object; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
      return refuse(`the input must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
    const p = raw as Readonly<Record<string, unknown>>;
    if (!isBounded(p.tenantId, 1, 64))
      return refuse('tenantId must be a bounded string (1..64 chars); fail closed');
    if (!isBounded(p.documentId, 1, 128))
      return refuse('documentId must be a bounded string (1..128 chars); fail closed');
    if (!isBounded(p.sourceId, 1, 128))
      return refuse('sourceId must be a bounded string (1..128 chars); fail closed');
    const census = p.census;
    if (census === null || typeof census !== 'object' || Array.isArray(census))
      return refuse('census must be an object; fail closed');
    const vm = census as Readonly<Record<string, unknown>>;
    if (vm.status !== 'VERIFIED')
      return refuse('the census must be VERIFIED; a refused census prepares nothing; fail closed');
    const policy = vm.policyVersion;
    if (typeof policy !== 'string')
      return refuse('the census policyVersion must be a string; fail closed');
    const expectedKeys = VM_KEYS_BY_POLICY[policy];
    if (expectedKeys === undefined)
      return refuse(`the census policyVersion must be '${DATASET_METADATA_VIEW_MODEL_POLICY.policyVersion}' or '${DATASET_CSV_VIEW_MODEL_POLICY.policyVersion}'; fail closed`);
    const vmKeys = Object.keys(vm);
    if (vmKeys.length !== expectedKeys.length || !expectedKeys.every((k, i) => vmKeys[i] === k))
      return refuse(`the census must have exactly the ${policy} keys in order; fail closed`);
    // CROSS-BINDING: the census agrees with itself.
    if (typeof vm.columnCount !== 'number' || !Number.isSafeInteger(vm.columnCount) || vm.columnCount < 1)
      return refuse('the census columnCount must be a positive integer; fail closed');
    if (!Array.isArray(vm.columns) || vm.columns.length !== vm.columnCount)
      return refuse(`the census disagrees with itself: columns.length (${Array.isArray(vm.columns) ? vm.columns.length : 'not-an-array'}) !== columnCount (${String(vm.columnCount)}); fail closed`);
    if (typeof vm.majorityNullColumns !== 'number' || !Number.isSafeInteger(vm.majorityNullColumns) || vm.majorityNullColumns < 0 || vm.majorityNullColumns > vm.columnCount)
      return refuse('the census majorityNullColumns must be an integer in 0..columnCount; fail closed');
    // The measured ceiling the census verified under must be re-asserted here.
    const rowsKey = policy === DATASET_CSV_VIEW_MODEL_POLICY.policyVersion ? 'rowCount' : 'featureCount';
    if (typeof vm[rowsKey] !== 'number' || !Number.isSafeInteger(vm[rowsKey]) || (vm[rowsKey] as number) < 1)
      return refuse(`the census ${rowsKey} must be a positive integer; fail closed`);
    if ((vm[rowsKey] as number) > (policy === DATASET_CSV_VIEW_MODEL_POLICY.policyVersion ? MAX_MEASURED_CSV_ROWS : MAX_MEASURED_FEATURES))
      return refuse(`the census ${rowsKey} exceeds the only measured ceiling (2,000,000); fail closed`);
    // Render the METADATA-LEVEL document — measured counts, never cell content.
    const who = policy === DATASET_CSV_VIEW_MODEL_POLICY.policyVersion
      ? `local CSV ${String(vm.fileName)}`
      : `${String(vm.sourceName)} (${String(vm.snapshotLabel)})`;
    const lines: string[] = [];
    lines.push(`Dataset census reading — ${who}. Metadata-level document prepared by ${DATASET_CENSUS_READING_POLICY.policyVersion} from a ${policy} VERIFIED census for tenant ${p.tenantId}, source ${p.sourceId}. The brain reads ABOUT the dataset (measured counts); it never receives cell content, top values, or raw rows.`);
    lines.push(`Headline: ${String(vm.headline)}`);
    lines.push(`Measured scale: ${rowsKey} ${String(vm[rowsKey])}, columns ${String(vm.columnCount)}, majority-null columns ${String(vm.majorityNullColumns)} (disclosed, never hidden).`);
    const colLines = (vm.columns as readonly unknown[]).map((c, i) => {
      if (c === null || typeof c !== 'object' || Array.isArray(c))
        throw new Error(`census column ${i} must be an object; fail closed`);
      const col = c as Readonly<Record<string, unknown>>;
      const name = col.name;
      if (typeof name !== 'string' || name.length < 1 || name.length > 128)
        throw new Error(`census column ${i + 1} name must be bounded (1..128 chars); fail closed`);
      const nullCount = col.nullCount ?? col.null_count;
      const nullPercent = col.nullPercent ?? col.null_percent;
      const distinctCount = col.distinctCount ?? col.distinct_count;
      for (const [label, v] of [['nullCount', nullCount], ['nullPercent', nullPercent], ['distinctCount', distinctCount]] as const) {
        if (typeof v !== 'number' || !Number.isFinite(v) || (v as number) < 0)
          throw new Error(`census column ${i + 1} ${label} must be a non-negative number; fail closed`);
      }
      return `column ${i + 1} ${name} — null ${String(nullCount)} (${String(nullPercent)}%), distinct ${String(distinctCount)}`;
    });
    lines.push(`Per-column measured census (${String(vm.columnCount)} columns):`);
    lines.push(...colLines);
    lines.push(`Census operator note: ${String(vm.operatorNote)}`);
    if (policy === DATASET_METADATA_VIEW_MODEL_POLICY.policyVersion) {
      const license = vm.license;
      if (license === null || typeof license !== 'object' || Array.isArray(license))
        throw new Error('a metadata census must carry a license object; fail closed');
      const lic = license as Readonly<Record<string, unknown>>;
      if (typeof lic.label !== 'string' || typeof lic.url !== 'string')
        throw new Error('the license must carry label and url strings; fail closed');
      lines.push(`License: ${lic.label} (${lic.url}) — attribution terms apply before any reuse.`);
    } else {
      if (typeof vm.measuredChars !== 'number' || !Number.isSafeInteger(vm.measuredChars) || (vm.measuredChars as number) < 1)
        throw new Error('the CSV census measuredChars must be a positive integer; fail closed');
      lines.push(`Source file: ${String(vm.fileName)} (${String(vm.measuredChars)} chars measured); upstream provenance is whatever the operator disclosed at census time.`);
    }
    const title = `Dataset census reading — ${who}`;
    if (title.length > 200)
      return refuse(`the derived reading title is ${title.length} chars, over the 200-char ingest title bound — fail closed, no truncation`);
    const bodyText = lines.join('\n');
    if (bodyText.length > MAX_CENSUS_DOC_CHARS)
      return refuse(`the rendered census document is ${bodyText.length} chars, over the ${MAX_CENSUS_DOC_CHARS.toLocaleString('en-US')}-char census-reading bound — fail closed, no truncation (a larger census is an operator-review artifact, not brain-reading material)`);
    return Object.freeze({
      status: 'PREPARED' as const,
      kind: 'DATASET_CENSUS_READING_DOCUMENT' as const,
      policyVersion: DATASET_CENSUS_READING_POLICY.policyVersion,
      tenantId: p.tenantId,
      documentId: p.documentId,
      sourceId: p.sourceId,
      title,
      bodyText,
      censusPolicyVersion: policy,
      censusColumnCount: vm.columnCount,
      renderedColumnCount: (vm.columns as readonly unknown[]).length,
      modelCalls: 0 as const, remoteCalls: 0 as const,
      activated: 0 as const, learningPromoted: false as const,
      humanDecision: 'REQUIRED' as const,
    });
  } catch (err) {
    return refuse(err instanceof Error ? err.message : String(err));
  }
}