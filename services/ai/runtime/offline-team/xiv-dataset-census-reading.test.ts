// 12D-299 adversarial suite — dataset census reading bridge.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareDatasetCensusReadingDocument, DATASET_CENSUS_READING_POLICY, DATASET_CENSUS_READING_GUARDRAILS, MAX_CENSUS_DOC_CHARS } from './xiv-dataset-census-reading';
import { buildDatasetCsvViewModel } from './xiv-dataset-csv-view-model';
import { buildDatasetMetadataViewModel } from './xiv-dataset-metadata-view-model';

// REAL censuses built through the REAL 12D-297/298 doors.
const agoCsv = [
  'Country Name,Country ISO3,Year,Indicator Name,Indicator Code,Value',
  'Angola,AGO,2023,Fertilizer consumption (kg per hectare),AG.CON.FERT.ZS,5.99',
  'Angola,AGO,2022,Fertilizer consumption (kg per hectare),AG.CON.FERT.ZS,13.22',
].join('\n');
const csvCensus = buildDatasetCsvViewModel({ fileName: 'agriculture-and-rural-development_ago.csv', csvText: agoCsv });
assert.equal(csvCensus.status, 'VERIFIED');

const railwaysPacket = {
  source_name: 'osm', snapshot_label: 'Geofabrik AGO 2026-05-10', dataset_source: 'hdx',
  generated_utc: '2026-05-10T00:00:00Z', oex_version: '0.2.1',
  license_label: 'hdx-odc-odbl', license_url: 'https://opendatacommons.org/licenses/odbl/1-0/',
  pcode_source_date: '2026-05-10', boundary: 'geoBoundaries CGAZ ADM0',
  metadata: {
    feature_count: 1322,
    geometry_types: { LINESTRING: 1155, POINT: 149, POLYGON: 18 },
    bbox: [12.1391752, -17.679937, 22.3358649, -5.8287274],
    columns: [
      { name: 'id', type: 'string', null_count: 0, null_percent: 0, distinct_count: 1322, top_values: [] },
      { name: 'name', type: 'string', null_count: 752, null_percent: 56.88, distinct_count: 165, top_values: [{ value: 'Caminho de Ferro de Moçâmedes (CFM)', count: 285 }] },
    ],
    summary: 'OpenStreetMap railways for Angola',
    temporal: '2026-05-10',
  },
};
const metadataCensus = buildDatasetMetadataViewModel(railwaysPacket);
assert.equal(metadataCensus.status, 'VERIFIED');

const base = { tenantId: 'xiv-os', documentId: 'ago-agriculture-census-1', sourceId: 'wb-ago-agriculture-indicators', census: csvCensus };
const reasonOf = (vm: ReturnType<typeof prepareDatasetCensusReadingDocument>) => (vm as { reason?: string }).reason ?? '';

test('12d-299: a VERIFIED CSV census prepares a metadata-level reading document', () => {
  const vm = prepareDatasetCensusReadingDocument(base);
  assert.equal(vm.status, 'PREPARED');
  if (vm.status !== 'PREPARED') return assert.fail('unreachable');
  assert.equal(vm.kind, 'DATASET_CENSUS_READING_DOCUMENT');
  assert.equal(vm.censusPolicyVersion, '12d-298-v1');
  assert.equal(vm.censusColumnCount, 6);
  assert.equal(vm.renderedColumnCount, 6);
  assert.equal(vm.modelCalls, 0);
  assert.equal(vm.remoteCalls, 0);
  assert.equal(vm.humanDecision, 'REQUIRED');
  assert.ok(vm.title.startsWith('Dataset census reading — local CSV agriculture-and-rural-development_ago.csv'));
  assert.ok(vm.title.length <= 200);
  assert.ok(vm.bodyText.includes('Measured scale: rowCount 2, columns 6'));
  assert.ok(vm.bodyText.includes('column 1 Country Name — null 0 (0%), distinct 1'));
  assert.ok(vm.bodyText.includes('majority-null columns 0'));
  // METADATA LEVEL ONLY: no cell content crosses — 'Angola' is a cell VALUE.
  assert.ok(!vm.bodyText.includes('Angola'), 'cell values must never enter the reading document');
  assert.ok(!vm.bodyText.includes('5.99'), 'cell values must never enter the reading document');
});

test('12d-299: a VERIFIED metadata census prepares with its license line and no top values', () => {
  const vm = prepareDatasetCensusReadingDocument({ ...base, census: metadataCensus, documentId: 'ago-railways-census-1' });
  assert.equal(vm.status, 'PREPARED');
  if (vm.status !== 'PREPARED') return assert.fail('unreachable');
  assert.equal(vm.censusPolicyVersion, '12d-297-v1');
  assert.ok(vm.bodyText.includes('License: hdx-odc-odbl (https://opendatacommons.org/licenses/odbl/1-0/)'));
  // top values and bbox coordinates are content — never enter the document
  assert.ok(!vm.bodyText.includes('Caminho de Ferro'), 'top values must never enter the reading document');
  assert.ok(!vm.bodyText.includes('12.1391752'), 'bbox coordinates must never enter the reading document');
  assert.ok(vm.bodyText.includes('Measured scale: featureCount 1322, columns 2'));
});

test('12d-299: a REFUSED census prepares nothing', () => {
  const refusedCensus = buildDatasetCsvViewModel(null);
  assert.equal(refusedCensus.status, 'REFUSED');
  const vm = prepareDatasetCensusReadingDocument({ ...base, census: refusedCensus });
  assert.equal(vm.status, 'REFUSED');
  assert.match(reasonOf(vm), /census must be VERIFIED/);
});

test('12d-299: a census that disagrees with itself refuses (cross-binding)', () => {
  const c = csvCensus as unknown as Record<string, unknown>;
  const tampered = { ...c, columnCount: 7 };
  const vm = prepareDatasetCensusReadingDocument({ ...base, census: tampered });
  assert.equal(vm.status, 'REFUSED');
  assert.match(reasonOf(vm), /disagrees with itself/);
});

test('12d-299: a foreign or reordered census refuses', () => {
  const foreign = { ...csvCensus, policyVersion: '12d-999-v1' } as unknown as Record<string, unknown>;
  assert.match(reasonOf(prepareDatasetCensusReadingDocument({ ...base, census: foreign })), /policyVersion must be/);
  // a genuinely reordered key list (first key moved to the end) refuses on order
  const ks = Object.keys(csvCensus);
  const rotated: Record<string, unknown> = {};
  for (const k of [...ks.slice(1), ks[0]!]) rotated[k] = (csvCensus as unknown as Record<string, unknown>)[k];
  assert.match(reasonOf(prepareDatasetCensusReadingDocument({ ...base, census: rotated })), /keys in order/);
});

test('12d-299: the measured ceiling is re-asserted on the census rows claim', () => {
  const over = { ...csvCensus, rowCount: 2_000_001 } as unknown as Record<string, unknown>;
  const vm = prepareDatasetCensusReadingDocument({ ...base, census: over });
  assert.equal(vm.status, 'REFUSED');
  assert.match(reasonOf(vm), /exceeds the only measured ceiling/);
  const metaOver = { ...metadataCensus, featureCount: 2_000_001 } as unknown as Record<string, unknown>;
  const vm2 = prepareDatasetCensusReadingDocument({ ...base, census: metaOver });
  assert.equal(vm2.status, 'REFUSED');
  assert.match(reasonOf(vm2), /exceeds the only measured ceiling/);
});

test('12d-299: an over-budget census document refuses — no truncation', () => {
  // 512 columns of maximal-name census rows -> body far over 10,000 chars.
  const cols = Array.from({ length: 512 }, (_, i) => ({
    name: `c${i}` + 'x'.repeat(120), nullCount: 0, nullPercent: 0, distinctCount: 1,
  }));
  const bigCensus = {
    status: 'VERIFIED', headline: 'h', fileName: 'big.csv', rowCount: 1, columnCount: 512,
    columns: cols, majorityNullColumns: 0, measuredChars: 10, records: [],
    operatorNote: 'n', policyVersion: '12d-298-v1', modelCalls: 0, remoteCalls: 0,
    activated: 0, learningPromoted: false, humanDecision: 'REQUIRED',
  };
  const vm = prepareDatasetCensusReadingDocument({ ...base, census: bigCensus });
  assert.equal(vm.status, 'REFUSED');
  assert.match(reasonOf(vm), /census-reading bound/);
  assert.match(reasonOf(vm), /no truncation/);
});

test('12d-299: junk inputs and bad ids refuse; never throws; zero content', () => {
  const junk: unknown[] = [null, undefined, 42, 'text', [], true, { tenantId: 'xiv-os' }, () => 1];
  for (const j of junk) {
    const vm = prepareDatasetCensusReadingDocument(j);
    assert.equal(vm.status, 'REFUSED');
    assert.equal((vm as { modelCalls: number }).modelCalls, 0);
    assert.equal((vm as { humanDecision: string }).humanDecision, 'REQUIRED');
  }
  assert.match(reasonOf(prepareDatasetCensusReadingDocument({ ...base, tenantId: '' })), /tenantId/);
  assert.match(reasonOf(prepareDatasetCensusReadingDocument({ ...base, documentId: 'd'.repeat(129) })), /documentId/);
  assert.match(reasonOf(prepareDatasetCensusReadingDocument({ ...base, sourceId: 42 })), /sourceId/);
});

test('12d-299: guardrails, policy, and the census-reading bound are pinned and frozen', () => {
  assert.ok(Object.isFrozen(DATASET_CENSUS_READING_POLICY));
  assert.ok(Object.isFrozen(DATASET_CENSUS_READING_GUARDRAILS));
  assert.equal(DATASET_CENSUS_READING_GUARDRAILS.verifiedOnly, true);
  assert.equal(DATASET_CENSUS_READING_GUARDRAILS.metadataLevelOnly, true);
  assert.equal(DATASET_CENSUS_READING_GUARDRAILS.boundedDocument, true);
  assert.equal(DATASET_CENSUS_READING_GUARDRAILS.preparesThroughRealDoors, true);
  assert.equal(DATASET_CENSUS_READING_GUARDRAILS.noWritePath, true);
  assert.equal(DATASET_CENSUS_READING_GUARDRAILS.pureModule, true);
  assert.equal(DATASET_CENSUS_READING_GUARDRAILS.modelCalls, 0);
  assert.equal(DATASET_CENSUS_READING_GUARDRAILS.remoteCalls, 0);
  assert.equal(DATASET_CENSUS_READING_GUARDRAILS.collectsNothing, true);
  assert.equal(DATASET_CENSUS_READING_GUARDRAILS.learningPromoted, false);
  assert.equal(DATASET_CENSUS_READING_GUARDRAILS.activated, 0);
  assert.equal(DATASET_CENSUS_READING_GUARDRAILS.automaticRecovery, false);
  assert.equal(DATASET_CENSUS_READING_GUARDRAILS.billionUsersProven, false);
  assert.equal(DATASET_CENSUS_READING_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(MAX_CENSUS_DOC_CHARS, 10_000);
  assert.equal(DATASET_CENSUS_READING_POLICY.policyVersion, '12d-299-v1');
});

test('12d-299: source purity — no fs, network, clock, randomness, or model-call primitive', () => {
  const text = readFileSync(new URL('./xiv-dataset-census-reading.ts', import.meta.url), 'utf8');
  for (const forbidden of [
    'from \'node:fs\'', 'from "node:fs"', 'node:path', 'fetch(', 'http://127.0.0.1', '11434',
    'Date.now', 'Math.random', 'child_process', 'XMLHttpRequest', 'WebSocket', 'require(',
  ]) {
    assert.ok(!text.includes(forbidden), `forbidden primitive in pure module: ${forbidden}`);
  }
});