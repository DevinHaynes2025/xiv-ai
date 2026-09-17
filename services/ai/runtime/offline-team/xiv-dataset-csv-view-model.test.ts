// 12D-298 adversarial suite — dataset CSV census view model.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildDatasetCsvViewModel, DATASET_CSV_VIEW_MODEL_POLICY, DATASET_CSV_VIEW_MODEL_GUARDRAILS,
  MAX_MEASURED_CSV_ROWS, MAX_MEASURED_CSV_CHARS,
} from './xiv-dataset-csv-view-model';

// A small AGO-shaped fixture (aggregate indicators, no PII) — the shape
// of the inspected CEO CSV, not its bytes.
const agoCsv = [
  'Country Name,Country ISO3,Year,Indicator Name,Indicator Code,Value',
  'Angola,AGO,2023,Fertilizer consumption (kg per hectare),AG.CON.FERT.ZS,5.99',
  'Angola,AGO,2022,Fertilizer consumption (kg per hectare),AG.CON.FERT.ZS,13.22',
  'Angola,AGO,2021,"Cereal yield (kg per hectare)",AG.YLD.CREL.HA,"1,234"',
].join('\n');

test('12d-298: the AGO-shaped CSV verifies with measured counts', () => {
  const vm = buildDatasetCsvViewModel({ fileName: 'agriculture-and-rural-development_ago.csv', csvText: agoCsv });
  assert.equal(vm.status, 'VERIFIED');
  if (vm.status !== 'VERIFIED') return assert.fail('unreachable');
  assert.equal(vm.rowCount, 3);
  assert.equal(vm.columnCount, 6);
  assert.equal(vm.columns[0]!.name, 'Country Name');
  assert.equal(vm.columns[0]!.nullCount, 0);
  assert.equal(vm.columns[0]!.distinctCount, 1);
  // quoted "1,234" parses as one cell; the Value column has 3 distinct raw cells
  assert.equal(vm.columns[5]!.name, 'Value');
  assert.equal(vm.columns[5]!.distinctCount, 3);
  assert.equal(vm.majorityNullColumns, 0);
  assert.equal(vm.measuredChars, agoCsv.length);
  assert.equal(vm.modelCalls, 0);
  assert.equal(vm.remoteCalls, 0);
  assert.equal(vm.humanDecision, 'REQUIRED');
});

test('12d-298: CRLF line endings and "" escapes measure identically', () => {
  const crlf = agoCsv.replace(/\n/g, '\r\n').replace(/""/, '"""');
  const vm = buildDatasetCsvViewModel({ fileName: 'ago.csv', csvText: crlf });
  assert.equal(vm.status, 'VERIFIED');
  if (vm.status !== 'VERIFIED') return assert.fail('unreachable');
  assert.equal(vm.rowCount, 3);
  assert.equal(vm.columns[4]!.name, 'Indicator Code');
});

test('12d-298: an empty cell measures as null and is disclosed', () => {
  const csv = 'A,B\nx,\n,x2\n';
  const vm = buildDatasetCsvViewModel({ fileName: 'gaps.csv', csvText: csv });
  assert.equal(vm.status, 'VERIFIED');
  if (vm.status !== 'VERIFIED') return assert.fail('unreachable');
  assert.equal(vm.columns[1]!.nullCount, 1);
  assert.equal(vm.columns[1]!.nullPercent, 50);
  // the >=50% majority-null rule counts BOTH exactly-50% columns — disclosed
  assert.equal(vm.majorityNullColumns, 2);
});

test('12d-298: a ragged row refuses with index only — cell content never echoed', () => {
  const csv = 'A,B\nx,y\nz\n';
  const vm = buildDatasetCsvViewModel({ fileName: 'ragged.csv', csvText: csv });
  assert.equal(vm.status, 'REFUSED');
  if (vm.status !== 'REFUSED') return assert.fail('unreachable');
  assert.match(vm.reason, /data row 2 has 1 fields but the header has 2/);
  assert.ok(!vm.reason.includes('x') && !vm.reason.includes('z'), 'cell content must never appear in a refusal');
});

test('12d-298: a PII-shaped header refuses WHOLE', () => {
  for (const header of ['A,email,B', 'ssn,A', 'Password,A', 'date of birth,A', 'credit_card_no,A']) {
    const vm = buildDatasetCsvViewModel({ fileName: 'p.csv', csvText: `${header}\nx,y\n` });
    assert.equal(vm.status, 'REFUSED');
    if (vm.status !== 'REFUSED') return assert.fail('unreachable');
    assert.match(vm.reason, /looks like PII\/credential data/);
  }
  // and the refusal carries zero content
  const vm = buildDatasetCsvViewModel({ fileName: 'p.csv', csvText: 'email,A\nx,y\n' });
  assert.equal(vm.status, 'REFUSED');
  assert.equal((vm as { records?: readonly unknown[] }).records?.length, 0);
});

test('12d-298: duplicate header names refuse', () => {
  const vm = buildDatasetCsvViewModel({ fileName: 'dup.csv', csvText: 'A,A\nx,y\n' });
  assert.equal(vm.status, 'REFUSED');
  if (vm.status !== 'REFUSED') return assert.fail('unreachable');
  assert.match(vm.reason, /duplicate header names/);
});

test('12d-298: header-only CSV, junk inputs, and oversized text refuse', () => {
  const reasonOf = (vm: ReturnType<typeof buildDatasetCsvViewModel>) => (vm as { reason?: string }).reason ?? '';
  assert.match(reasonOf(buildDatasetCsvViewModel({ fileName: 'h.csv', csvText: 'A,B' })), /header row and at least one data row/);
  assert.match(reasonOf(buildDatasetCsvViewModel({ fileName: '', csvText: agoCsv })), /fileName must be a bounded string/);
  assert.match(reasonOf(buildDatasetCsvViewModel({ fileName: 'x.csv', csvText: 42 })), /csvText must be a bounded string/);
  assert.match(reasonOf(buildDatasetCsvViewModel({ fileName: 'x.csv', csvText: 'A,B\nx,"unterminated\n' })), /unterminated quoted field/);
  assert.match(reasonOf(buildDatasetCsvViewModel(null)), /must be an object/);
  const extra = { ...{ fileName: 'x.csv', csvText: agoCsv }, smuggled: true };
  assert.match(reasonOf(buildDatasetCsvViewModel(extra)), /in order; fail closed/);
  const big = 'A,B\n' + 'x,y\n'.repeat(700_000); // > 2,000,000 chars
  assert.match(reasonOf(buildDatasetCsvViewModel({ fileName: 'big.csv', csvText: big })), /csvText must be a bounded string/);
});

test('12d-298: never throws, and REFUSED carries zero content with pinned flags', () => {
  const junk: unknown[] = [null, undefined, 42, 'text', [], true, { fileName: 'x' }, () => 1, Symbol.iterator];
  for (const j of junk) {
    const vm = buildDatasetCsvViewModel(j);
    assert.equal(vm.status, 'REFUSED');
    assert.equal((vm as { records?: readonly unknown[] }).records?.length, 0);
    assert.equal((vm as { modelCalls: number }).modelCalls, 0);
    assert.equal((vm as { remoteCalls: number }).remoteCalls, 0);
    assert.equal((vm as { humanDecision: string }).humanDecision, 'REQUIRED');
  }
});

test('12d-298: guardrails, policy, and the measured ceilings are pinned and frozen', () => {
  assert.ok(Object.isFrozen(DATASET_CSV_VIEW_MODEL_POLICY));
  assert.ok(Object.isFrozen(DATASET_CSV_VIEW_MODEL_GUARDRAILS));
  assert.equal(DATASET_CSV_VIEW_MODEL_GUARDRAILS.verifyBeforeRender, true);
  assert.equal(DATASET_CSV_VIEW_MODEL_GUARDRAILS.piiShapedRefuses, true);
  assert.equal(DATASET_CSV_VIEW_MODEL_GUARDRAILS.noContentEchoInRefusals, true);
  assert.equal(DATASET_CSV_VIEW_MODEL_GUARDRAILS.measuredCeilingTwoMillion, true);
  assert.equal(DATASET_CSV_VIEW_MODEL_GUARDRAILS.noWritePath, true);
  assert.equal(DATASET_CSV_VIEW_MODEL_GUARDRAILS.pureModule, true);
  assert.equal(DATASET_CSV_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(DATASET_CSV_VIEW_MODEL_GUARDRAILS.remoteCalls, 0);
  assert.equal(DATASET_CSV_VIEW_MODEL_GUARDRAILS.collectsNothing, true);
  assert.equal(DATASET_CSV_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(DATASET_CSV_VIEW_MODEL_GUARDRAILS.activated, 0);
  assert.equal(DATASET_CSV_VIEW_MODEL_GUARDRAILS.automaticRecovery, false);
  assert.equal(DATASET_CSV_VIEW_MODEL_GUARDRAILS.billionUsersProven, false);
  assert.equal(DATASET_CSV_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(MAX_MEASURED_CSV_ROWS, 2_000_000);
  assert.equal(MAX_MEASURED_CSV_CHARS, 2_000_000);
  assert.equal(DATASET_CSV_VIEW_MODEL_POLICY.policyVersion, '12d-298-v1');
});

test('12d-298: source purity — the module carries no fs, network, clock, randomness, or model-call primitive', () => {
  const text = readFileSync(new URL('./xiv-dataset-csv-view-model.ts', import.meta.url), 'utf8');
  for (const forbidden of [
    'from \'node:fs\'', 'from "node:fs"', 'node:path', 'fetch(', 'http://', 'https://',
    '127.0.0.1', 'Date.now', 'Math.random', 'child_process', 'XMLHttpRequest', 'WebSocket',
    'require(', 'localStorage', 'document.',
  ]) {
    assert.ok(!text.includes(forbidden), `forbidden primitive in pure module: ${forbidden}`);
  }
});