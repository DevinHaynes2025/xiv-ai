// 12D-298 — Dataset CSV Census View Model: the pure, fail-closed
// renderer for LOCAL CSV files (directive #7's in-house local data
// pipeline; the inspected CEO CSV — aggregate Angola agriculture
// indicators, no PII — is the reference shape). The operator drops a
// CSV; THIS view model parses it (RFC 4180 quoted fields), measures
// per-column nulls and distincts, and renders a MEASURED census.
// 12D-297's verify-before-render discipline applied to CSV content:
// the CSV is data, never a command; nothing renders without
// verification.
//
//   * EXACT-SHAPE GATE: the input must be exactly { fileName, csvText }
//     (keys in order); fileName bounded 1..200 chars; csvText bounded
//     1..2,000,000 chars.
//   * RFC 4180 PARSING: quoted fields, "" escapes, CRLF/LF. A ragged
//     row (wrong field count) refuses WITH INDEX ONLY — cell content
//     never appears in a refusal reason.
//   * HEADER DISCIPLINE: unique bounded names (1..128 chars, <= 512
//     columns); duplicates refuse (ambiguous census keys).
//   * PII-SHAPE REFUSAL (the 12D-283/HRDATA lesson): a column whose
//     header looks like PII/credential data (ssn, email, password,
//     date of birth, phone, credit card, ...) refuses WHOLE — the
//     census never renders PII-shaped content.
//   * THE MEASURED CEILING IS STRUCTURAL: data rows over 2,000,000
//     (the only measured ceiling) refuse.
//   * MEASURED COUNTS ONLY: the census renders what the CSV MEASURES
//     (rows, per-column nulls, distincts, majority-null count —
//     disclosed, never hidden). It never claims a reading happened,
//     never claims capacity usage, never renders the ceiling as
//     achieved.
//   * NO WRITE PATH: the transient store's save throws (12D-293/297
//     pattern); pure module — no fs, no network, no clock, no
//     randomness, no model calls; the shell may import it.
//
// Disclosed residuals:
//   * A census is NOT an ingest: no CSV content is persisted, uploaded,
//     or fed to a model here — measured counts only.
//   * The parser measures the TEXT as given; it cannot prove the text
//     was honestly exported from an upstream system — the
//     human-supervised extraction step remains the trust point.
//   * 'distinct' is measured over the raw cell text (case-sensitive,
//     untrimmed); the operatorNote discloses this so counts are never
//     mistaken for semantic cardinality.

export const DATASET_CSV_VIEW_MODEL_POLICY = Object.freeze({
  policyVersion: '12d-298-v1',
  domain: 'XIV_OS_DATASET_CSV_CENSUS_VIEW_MODEL',
});

export const DATASET_CSV_VIEW_MODEL_GUARDRAILS = Object.freeze({
  verifyBeforeRender: true, // nothing renders without structural re-verification
  rfc4180Parsing: true, // quoted fields, "" escapes, CRLF/LF
  raggedRowsRefuse: true, // a wrong field count refuses, index only
  piiShapedRefuses: true, // PII/credential-shaped headers refuse WHOLE
  measuredCountsOnly: true, // the ceiling is a POLICY bound, never achieved usage
  measuredCeilingTwoMillion: true, // data rows > 2,000,000 refuse
  noContentEchoInRefusals: true, // a refusal names indexes and counts, never cell text
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

export const MAX_MEASURED_CSV_ROWS = 2_000_000;
export const MAX_MEASURED_CSV_CHARS = 2_000_000;

const INPUT_KEYS = ['fileName', 'csvText'] as const;
const MAX_COLUMNS = 512;
const PII_PHRASES = [
  'ssn', 'social security', 'socialsecurity', 'email', 'e mail', 'password', 'passwd',
  'passphrase', 'date of birth', 'dateofbirth', 'dob', 'phone', 'credit card', 'creditcard',
  'card number', 'cardnumber', 'passport', 'driver license', 'drivers license',
] as const;

export interface ViewStore {
  load(): readonly string[] | null;
  save(lines: readonly string[]): void;
}

export type DatasetCsvViewModel = Readonly<
  | {
      status: 'VERIFIED';
      headline: string;
      fileName: string;
      rowCount: number;
      columnCount: number;
      columns: readonly { name: string; nullCount: number; nullPercent: number; distinctCount: number }[];
      majorityNullColumns: number;
      measuredChars: number;
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
  save(): void { throw new Error('a dataset CSV census view never writes to a register; fail closed'); }
}

function refuse(reason: string): DatasetCsvViewModel {
  return Object.freeze({
    status: 'REFUSED' as const,
    headline: 'Dataset CSV census REFUSED — zero content rendered',
    reason,
    records: Object.freeze([]) as readonly never[],
    policyVersion: DATASET_CSV_VIEW_MODEL_POLICY.policyVersion,
    modelCalls: 0 as const, remoteCalls: 0 as const,
    activated: 0 as const, learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

/** RFC 4180 parse: returns rows of raw cell text (quotes resolved). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const push = () => { row.push(cell); cell = ''; };
  const endRow = () => { push(); rows.push(row); row = []; };
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 1; } else { inQuotes = false; }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      push();
    } else if (ch === '\r') {
      if (text[i + 1] === '\n') i += 1;
      endRow();
    } else if (ch === '\n') {
      endRow();
    } else {
      cell += ch;
    }
  }
  if (inQuotes) throw new Error('unterminated quoted field; fail closed');
  if (cell.length > 0 || row.length > 0) endRow();
  // a trailing newline yields an empty last row — drop it
  while (rows.length > 0 && rows[rows.length - 1]!.length === 1 && rows[rows.length - 1]![0] === '') rows.pop();
  return rows;
}

/** Normalize a header name for PII matching: lowercase, non-alnum -> space. */
function normalizeHeader(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Build the census view model from a raw local CSV input (as received).
 * NEVER throws: any anomaly returns REFUSED with zero CSV content, and
 * a refusal reason never echoes cell content.
 */
export function buildDatasetCsvViewModel(raw: unknown): DatasetCsvViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      return refuse('the CSV input must be an object; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
      return refuse(`the input must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
    const p = raw as Readonly<Record<string, unknown>>;
    if (typeof p.fileName !== 'string' || p.fileName.length < 1 || p.fileName.length > 200)
      return refuse('fileName must be a bounded string (1..200 chars); fail closed');
    if (typeof p.csvText !== 'string' || p.csvText.length < 1 || p.csvText.length > MAX_MEASURED_CSV_CHARS)
      return refuse(`csvText must be a bounded string (1..${MAX_MEASURED_CSV_CHARS.toLocaleString('en-US')} chars); fail closed`);
    const rows = parseCsv(p.csvText);
    if (rows.length < 2)
      return refuse('the CSV must carry a header row and at least one data row; fail closed');
    const header = rows[0]!;
    if (header.length < 1 || header.length > MAX_COLUMNS)
      return refuse(`the header must carry 1..${MAX_COLUMNS} columns; fail closed`);
    for (const name of header) {
      if (name.length < 1 || name.length > 128)
        return refuse('every header name must be bounded (1..128 chars); fail closed');
      const normalized = normalizeHeader(name);
      if (PII_PHRASES.some((phrase) => normalized === phrase || normalized.includes(phrase)))
        return refuse(`header column ${header.indexOf(name) + 1} looks like PII/credential data; the census never renders PII-shaped content; fail closed`);
    }
    const seen = new Set<string>();
    for (const name of header) {
      if (seen.has(name))
        return refuse('duplicate header names refuse (ambiguous census keys); fail closed');
      seen.add(name);
    }
    // THE MEASURED CEILING IS STRUCTURAL.
    const dataRows = rows.slice(1);
    if (dataRows.length > MAX_MEASURED_CSV_ROWS)
      return refuse(`data rows exceed the only measured ceiling (${MAX_MEASURED_CSV_ROWS.toLocaleString('en-US')} rows); fail closed`);
    // Ragged rows refuse — index only, never cell content.
    for (let r = 0; r < dataRows.length; r += 1) {
      if (dataRows[r]!.length !== header.length)
        return refuse(`data row ${r + 1} has ${dataRows[r]!.length} fields but the header has ${header.length}; ragged rows refuse; fail closed`);
    }
    // Measured per-column census.
    const columns = header.map((name, c) => {
      let nullCount = 0;
      const distinct = new Set<string>();
      for (const row of dataRows) {
        const cell = row[c] ?? '';
        if (cell === '') nullCount += 1;
        distinct.add(cell);
      }
      return {
        name,
        nullCount,
        nullPercent: dataRows.length === 0 ? 0 : Math.round((nullCount / dataRows.length) * 10000) / 100,
        distinctCount: distinct.size,
      };
    });
    const majorityNull = columns.filter((c) => c.nullPercent >= 50).length;
    // The transient store proves the view has no write path.
    const store = new TransientViewStore(null);
    void store.load();
    return Object.freeze({
      status: 'VERIFIED' as const,
      headline: `CSV census: ${dataRows.length.toLocaleString('en-US')} rows × ${columns.length} columns from ${p.fileName} — measured counts only, nothing persisted`,
      fileName: p.fileName,
      rowCount: dataRows.length,
      columnCount: columns.length,
      columns: Object.freeze(columns),
      majorityNullColumns: majorityNull,
      measuredChars: p.csvText.length,
      records: Object.freeze([]),
      operatorNote: `Measured counts only: 'distinct' is over the raw cell text (case-sensitive, untrimmed) — never mistake it for semantic cardinality. ${columns.length} columns, ${majorityNull} of ${columns.length} columns are >=50% null (disclosed, never hidden). The ${MAX_MEASURED_CSV_ROWS.toLocaleString('en-US')}-row ceiling is the only measured bound. A census is NOT an ingest: nothing is persisted, uploaded, or fed to a model here, and refusal reasons never echo cell content.`,
      policyVersion: DATASET_CSV_VIEW_MODEL_POLICY.policyVersion,
      modelCalls: 0 as const, remoteCalls: 0 as const,
      activated: 0 as const, learningPromoted: false as const,
      humanDecision: 'REQUIRED' as const,
    });
  } catch (err) {
    return refuse(err instanceof Error ? err.message : String(err));
  }
}