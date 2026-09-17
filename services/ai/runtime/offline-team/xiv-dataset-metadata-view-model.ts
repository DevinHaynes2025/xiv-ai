// 12D-297 — Dataset Metadata Census View Model: the pure, fail-closed
// renderer for OEX-style dataset metadata packets (the CEO's 2026-09-17
// directive #7 — an in-house local data pipeline; frontend + backend).
// The operator pastes a metadata packet (the kind OpenStreetMap/HDX
// extractors emit — the CEO supplied two: AGO railways 1,322 features
// and AGO education facilities 2,015 features, license hdx-odc-odbl);
// THIS view model re-verifies it structurally and renders a MEASURED
// census. 12D-293's view-model discipline applied to dataset packets:
// the packet is data, never a command; nothing renders without
// verification.
//
//   * EXACT-SHAPE GATE: the packet must be exactly the OEX shape (top
//     keys in order, metadata keys in order, every column exact) — a
//     reordered, extra, or missing field refuses.
//   * CROSS-BINDING (the 12D-275 lesson): the geometry_types counts
//     must SUM to the packet's own feature_count — a packet whose
//     geometry census disagrees with its own feature claim refuses.
//   * PER-COLUMN BOUNDS: null_count <= feature_count; distinct_count <=
//     feature_count; null_percent 0..100. A packet claiming more nulls
//     than features is internally inconsistent and refuses.
//   * THE MEASURED CEILING IS STRUCTURAL: feature_count over
//     2,000,000 (the only measured ceiling) refuses — a packet can
//     never render as if the ceiling were achieved or exceeded.
//   * LICENSE DISCLOSED: the license label + URL render with the
//     census (hdx-odc-odbl -> ODC-ODbL 1.0). A packet without an
//     https license URL refuses.
//   * MEASURED COUNTS ONLY: the view renders what the packet MEASURES
//     (features, nulls, distincts, majority-null column count). It
//     never claims a reading happened (registered is NOT read), never
//     claims capacity usage, never renders the ceiling as achieved.
//   * NO WRITE PATH: the transient store's save throws (12D-293
//     pattern); pure module — no fs, no network, no clock, no
//     randomness, no model calls; the shell may import it.
//
// Disclosed residuals:
//   * The view verifies the packet's INTERNAL consistency; it cannot
//     prove the packet was honestly generated from the underlying
//     dataset — the human-supervised extraction step remains the
//     trust point (the same residual as 12D-277/278/295).
//   * Rendering a packet is NOT ingesting the dataset; no dataset
//     bytes pass through this view model, only measured metadata.

export const DATASET_METADATA_VIEW_MODEL_POLICY = Object.freeze({
  policyVersion: '12d-297-v1',
  domain: 'XIV_OS_DATASET_METADATA_CENSUS_VIEW_MODEL',
});

export const DATASET_METADATA_VIEW_MODEL_GUARDRAILS = Object.freeze({
  verifyBeforeRender: true, // nothing renders without structural re-verification
  geometrySumsToFeatures: true, // cross-binding: the packet agrees with itself
  measuredCountsOnly: true, // the ceiling is a POLICY bound, never achieved usage
  measuredCeilingTwoMillion: true, // feature_count > 2,000,000 refuses
  licenseDisclosed: true, // license label + https URL render with the census
  registeredIsNotRead: true, // a metadata packet is not a dataset read
  nullsDisclosed: true, // majority-null columns are counted and shown
  noWritePath: true, // a view never writes to a register or a dataset
  noActivationPath: true,
  noTruncation: true, // columns render in full; silent truncation is refused upstream
  refusedRendersAsRefused: true,
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

export const MAX_MEASURED_FEATURES = 2_000_000;

const PACKET_KEYS = [
  'source_name', 'snapshot_label', 'dataset_source', 'generated_utc', 'oex_version',
  'license_label', 'license_url', 'pcode_source_date', 'boundary', 'metadata',
] as const;
const META_KEYS = ['feature_count', 'geometry_types', 'bbox', 'columns', 'summary', 'temporal'] as const;
const COLUMN_KEYS = ['name', 'type', 'null_count', 'null_percent', 'distinct_count', 'top_values'] as const;
const TOP_VALUE_KEYS = ['value', 'count'] as const;
const GEOMETRY_CLASSES = ['POINT', 'LINESTRING', 'POLYGON', 'MULTIPOLYGON'] as const;
const URL_RE = /^https:\/\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+$/;

export interface ViewStore {
  load(): readonly string[] | null;
  save(lines: readonly string[]): void;
}

export type DatasetMetadataViewModel = Readonly<
  | {
      status: 'VERIFIED';
      headline: string;
      sourceName: string;
      snapshotLabel: string;
      datasetSource: string;
      featureCount: number;
      geometryTypes: Readonly<Record<string, number>>;
      bbox: readonly [number, number, number, number];
      columns: readonly { name: string; type: string; nullCount: number; nullPercent: number; distinctCount: number }[];
      majorityNullColumns: number;
      columnCount: number;
      license: Readonly<{ label: string; url: string }>;
      records: readonly unknown[];
      operatorNote: string;
      policyVersion: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
  | {
      status: 'REFUSED';
      headline: string;
      reason: string;
      records: readonly never[];
      policyVersion: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
>;

/** Transient read-only store — a census view never writes to a register. */
class TransientViewStore implements ViewStore {
  private lines: readonly string[] | null;
  constructor(lines: readonly string[] | null) { this.lines = lines; }
  load(): readonly string[] | null { return this.lines; }
  save(): void { throw new Error('a dataset metadata census view never writes to a register; fail closed'); }
}

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function refuse(reason: string): DatasetMetadataViewModel {
  return Object.freeze({
    status: 'REFUSED' as const,
    headline: 'Dataset metadata census REFUSED — zero content rendered',
    reason,
    records: Object.freeze([]) as readonly never[],
    policyVersion: DATASET_METADATA_VIEW_MODEL_POLICY.policyVersion,
    modelCalls: 0 as const, remoteCalls: 0 as const,
    activated: 0 as const, learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

/**
 * Build the census view model from a raw OEX-style metadata packet
 * (as received). NEVER throws: any anomaly returns REFUSED with zero
 * dataset content.
 */
export function buildDatasetMetadataViewModel(raw: unknown): DatasetMetadataViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      return refuse('the metadata packet must be an object; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== PACKET_KEYS.length || !PACKET_KEYS.every((k, i) => keys[i] === k))
      return refuse(`the packet must have exactly the keys [${PACKET_KEYS.join(', ')}] in order; fail closed`);
    const p = raw as Readonly<Record<string, unknown>>;
    for (const k of ['source_name', 'snapshot_label', 'dataset_source', 'generated_utc', 'oex_version', 'license_label', 'pcode_source_date', 'boundary'] as const) {
      const v = p[k];
      if (typeof v !== 'string' || v.length < 1 || v.length > 200)
        return refuse(`packet field ${k} must be a bounded string (1..200 chars); fail closed`);
    }
    if (typeof p.license_url !== 'string' || !URL_RE.test(p.license_url) || p.license_url.length > 2000)
      return refuse('the license_url must be an https URL (<= 2000 chars); fail closed');
    const meta = p.metadata;
    if (meta === null || typeof meta !== 'object' || Array.isArray(meta))
      return refuse('metadata must be an object; fail closed');
    const mKeys = Object.keys(meta as Record<string, unknown>);
    if (mKeys.length !== META_KEYS.length || !META_KEYS.every((k, i) => mKeys[i] === k))
      return refuse(`metadata must have exactly the keys [${META_KEYS.join(', ')}] in order; fail closed`);
    const m = meta as Readonly<Record<string, unknown>>;
    if (typeof m.feature_count !== 'number' || !Number.isSafeInteger(m.feature_count) || m.feature_count < 1)
      return refuse('feature_count must be a positive integer; fail closed');
    // THE MEASURED CEILING IS STRUCTURAL.
    if (m.feature_count > MAX_MEASURED_FEATURES)
      return refuse(`feature_count exceeds the only measured ceiling (${MAX_MEASURED_FEATURES.toLocaleString('en-US')} rows); fail closed`);
    // geometry_types: exactly the measured classes, counts summing to feature_count.
    const geo = m.geometry_types;
    if (geo === null || typeof geo !== 'object' || Array.isArray(geo))
      return refuse('geometry_types must be an object; fail closed');
    const geoKeys = Object.keys(geo as Record<string, unknown>);
    if (geoKeys.length < 1 || geoKeys.length > GEOMETRY_CLASSES.length || !geoKeys.every((k) => (GEOMETRY_CLASSES as readonly string[]).includes(k)))
      return refuse(`geometry_types must carry only measured classes from [${GEOMETRY_CLASSES.join(', ')}]; fail closed`);
    const geometryTypes: Record<string, number> = {};
    let geoSum = 0;
    for (const k of geoKeys) {
      const v = (geo as Readonly<Record<string, unknown>>)[k];
      if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0)
        return refuse(`geometry_types.${k} must be a non-negative integer; fail closed`);
      geometryTypes[k] = v;
      geoSum += v;
    }
    // CROSS-BINDING: the geometry census must agree with the feature claim.
    if (geoSum !== m.feature_count)
      return refuse(`geometry_types sum (${geoSum}) does not equal feature_count (${m.feature_count}); the packet disagrees with itself; fail closed`);
    // bbox: exactly 4 finite numbers, ordered.
    if (!Array.isArray(m.bbox) || m.bbox.length !== 4 || !m.bbox.every(isFiniteNumber))
      return refuse('bbox must be exactly 4 finite numbers; fail closed');
    const [minX, minY, maxX, maxY] = m.bbox as number[];
    if (maxX < minX || maxY < minY)
      return refuse('bbox bounds are inverted (max < min); fail closed');
    // columns: bounded array of exact-shape rows with per-column bounds.
    if (!Array.isArray(m.columns) || m.columns.length < 1 || m.columns.length > 512)
      return refuse('columns must be a non-empty array (<= 512); fail closed');
    const featureCount = m.feature_count;
    const columns = m.columns.map((c): { name: string; type: string; nullCount: number; nullPercent: number; distinctCount: number } => {
      if (c === null || typeof c !== 'object' || Array.isArray(c))
        throw new Error('every column must be an object; fail closed');
      const ck = Object.keys(c as Record<string, unknown>);
      if (ck.length !== COLUMN_KEYS.length || !COLUMN_KEYS.every((k, i) => ck[i] === k))
        throw new Error(`a column must have exactly the keys [${COLUMN_KEYS.join(', ')}] in order; fail closed`);
      const col = c as Readonly<Record<string, unknown>>;
      if (typeof col.name !== 'string' || col.name.length < 1 || col.name.length > 128)
        throw new Error('a column name must be bounded (1..128 chars); fail closed');
      if (typeof col.type !== 'string' || col.type.length < 1 || col.type.length > 64)
        throw new Error('a column type must be bounded (1..64 chars); fail closed');
      if (typeof col.null_count !== 'number' || !Number.isSafeInteger(col.null_count) || col.null_count < 0 || col.null_count > featureCount)
        throw new Error(`column ${col.name}: null_count must be an integer in 0..feature_count; fail closed`);
      if (typeof col.null_percent !== 'number' || !Number.isFinite(col.null_percent) || col.null_percent < 0 || col.null_percent > 100)
        throw new Error(`column ${col.name}: null_percent must be a number in 0..100; fail closed`);
      if (typeof col.distinct_count !== 'number' || !Number.isSafeInteger(col.distinct_count) || col.distinct_count < 0 || col.distinct_count > featureCount)
        throw new Error(`column ${col.name}: distinct_count must be an integer in 0..feature_count; fail closed`);
      if (!Array.isArray(col.top_values))
        throw new Error(`column ${col.name}: top_values must be an array; fail closed`);
      if (col.top_values.length > 64)
        throw new Error(`column ${col.name}: top_values is unbounded (<= 64); fail closed`);
      for (const tv of col.top_values) {
        if (tv === null || typeof tv !== 'object' || Array.isArray(tv))
          throw new Error(`column ${col.name}: every top value must be an object; fail closed`);
        const tk = Object.keys(tv as Record<string, unknown>);
        if (tk.length !== TOP_VALUE_KEYS.length || !TOP_VALUE_KEYS.every((k, i) => tk[i] === k))
          throw new Error(`column ${col.name}: a top value must have exactly the keys [${TOP_VALUE_KEYS.join(', ')}] in order; fail closed`);
        const t = tv as Readonly<Record<string, unknown>>;
        if (typeof t.value !== 'string' || t.value.length > 500)
          throw new Error(`column ${col.name}: a top value must be a bounded string (<= 500 chars); fail closed`);
        if (typeof t.count !== 'number' || !Number.isSafeInteger(t.count) || t.count < 0)
          throw new Error(`column ${col.name}: a top value count must be a non-negative integer; fail closed`);
      }
      return { name: col.name, type: col.type, nullCount: col.null_count, nullPercent: col.null_percent, distinctCount: col.distinct_count };
    });
    if (typeof m.summary !== 'string' || m.summary.length > 2000)
      return refuse('the summary must be a bounded string (<= 2000 chars); fail closed');
    if (m.temporal !== null && (typeof m.temporal !== 'string' || m.temporal.length > 200))
      return refuse('temporal must be null or a bounded string (<= 200 chars); fail closed');
    // The transient store proves the view has no write path.
    const store = new TransientViewStore(null);
    void store.load();
    const majorityNull = columns.filter((c) => c.nullPercent >= 50).length;
    return Object.freeze({
      status: 'VERIFIED' as const,
      headline: `Dataset census: ${m.feature_count.toLocaleString('en-US')} features from ${p.source_name} (${p.snapshot_label}) — measured packet, registered is NOT read`,
      sourceName: p.source_name as string,
      snapshotLabel: p.snapshot_label as string,
      datasetSource: p.dataset_source as string,
      featureCount,
      geometryTypes: Object.freeze(geometryTypes),
      bbox: Object.freeze([minX, minY, maxX, maxY]) as readonly [number, number, number, number],
      columns: Object.freeze(columns),
      majorityNullColumns: majorityNull,
      columnCount: columns.length,
      license: Object.freeze({ label: p.license_label as string, url: p.license_url }),
      records: Object.freeze([]),
      operatorNote: `Measured counts only: ${columns.length} columns, ${majorityNull} of ${columns.length} columns are >=50% null (disclosed, never hidden). The ${MAX_MEASURED_FEATURES.toLocaleString('en-US')}-row ceiling is the only measured bound. License ${p.license_label} (${p.license_url}) renders with the census. A metadata packet is NOT a dataset read; the human-supervised extraction step remains the trust point. Boundary: ${p.boundary}.`,
      policyVersion: DATASET_METADATA_VIEW_MODEL_POLICY.policyVersion,
      modelCalls: 0 as const, remoteCalls: 0 as const,
      activated: 0 as const, learningPromoted: false as const,
      humanDecision: 'REQUIRED' as const,
    });
  } catch (err) {
    return refuse(err instanceof Error ? err.message : String(err));
  }
}