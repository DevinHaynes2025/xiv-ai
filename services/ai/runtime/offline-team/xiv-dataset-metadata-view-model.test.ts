// 12D-297 — adversarial tests for the dataset metadata census view
// model. Central properties under attack:
//   1. VERIFY BEFORE RENDER: malformed, reordered, or internally
//      inconsistent packets refuse with ZERO dataset content.
//   2. THE PACKET AGREES WITH ITSELF: geometry_types sums to
//      feature_count; nulls/distincts are bounded by feature_count;
//      bbox is ordered.
//   3. THE MEASURED CEILING IS STRUCTURAL: feature_count over
//      2,000,000 refuses — never rendered as achieved usage.
//   4. MEASURED COUNTS ONLY: the happy path renders exactly what the
//      REAL packet measured (the CEO's 2026-05 AGO railways numbers).

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DATASET_METADATA_VIEW_MODEL_GUARDRAILS,
  DATASET_METADATA_VIEW_MODEL_POLICY,
  MAX_MEASURED_FEATURES,
  buildDatasetMetadataViewModel,
} from './xiv-dataset-metadata-view-model';

/** The REAL AGO railways packet (CEO-supplied 2026-05-10 Geofabrik extract),
 *  trimmed to 3 representative columns with all measured values intact. */
function railwaysPacket(): Record<string, unknown> {
  return {
    source_name: 'osm',
    snapshot_label: '2026-05-10',
    dataset_source: 'OpenStreetMap (Geofabrik AGO 2026-05-10)',
    generated_utc: '2026-05-12T12:05:31Z',
    oex_version: '0.2.1',
    license_label: 'hdx-odc-odbl',
    license_url: 'https://opendatacommons.org/licenses/odbl/1-0/',
    pcode_source_date: '2025-07-29',
    boundary: 'geoBoundaries CGAZ ADM0 (buffered +5000m)',
    metadata: {
      feature_count: 1322,
      geometry_types: { LINESTRING: 1155, POINT: 149, POLYGON: 18 },
      bbox: [12.1391752, -17.679937, 22.3358649, -5.8287274],
      columns: [
        { name: 'id', type: 'VARCHAR', null_count: 0, null_percent: 0.0, distinct_count: 1322, top_values: [] },
        { name: 'name', type: 'VARCHAR', null_count: 752, null_percent: 56.88, distinct_count: 165, top_values: [{ value: 'Caminho de Ferro de Moçâmedes (CFM)', count: 285 }] },
        { name: 'railway', type: 'VARCHAR', null_count: 0, null_percent: 0.0, distinct_count: 2, top_values: [{ value: 'rail', count: 1155 }, { value: 'station', count: 167 }] },
      ],
      summary: '1,322 features. geometry types: 1,155 LINESTRING, 149 POINT, 18 POLYGON.',
      temporal: null,
    },
  };
}

test('12d-297: the REAL AGO railways packet renders VERIFIED with measured counts', () => {
  const vm = buildDatasetMetadataViewModel(railwaysPacket());
  assert.equal(vm.status, 'VERIFIED');
  assert.equal(vm.policyVersion, DATASET_METADATA_VIEW_MODEL_POLICY.policyVersion);
  if (vm.status !== 'VERIFIED') return assert.fail('unreachable');
  assert.equal(vm.featureCount, 1322);
  assert.equal(vm.sourceName, 'osm');
  assert.equal(vm.snapshotLabel, '2026-05-10');
  assert.deepEqual(vm.geometryTypes, { LINESTRING: 1155, POINT: 149, POLYGON: 18 });
  assert.deepEqual(vm.bbox, [12.1391752, -17.679937, 22.3358649, -5.8287274]);
  assert.equal(vm.columnCount, 3);
  assert.equal(vm.majorityNullColumns, 1, 'name (56.88% null) is the only majority-null column in the fixture');
  assert.equal(vm.license.label, 'hdx-odc-odbl');
  assert.equal(vm.license.url, 'https://opendatacommons.org/licenses/odbl/1-0/');
  assert.match(vm.headline, /1,322 features from osm \(2026-05-10\)/);
  assert.match(vm.operatorNote, /registered is NOT read|measured/i);
  assert.equal(vm.modelCalls, 0);
  assert.equal(vm.remoteCalls, 0);
  assert.equal(vm.activated, 0);
  assert.equal(vm.learningPromoted, false);
  assert.equal(vm.humanDecision, 'REQUIRED');
});

test('12d-297: the REAL AGO education-facilities packet renders VERIFIED', () => {
  const p = railwaysPacket();
  const meta = p.metadata as Record<string, unknown>;
  const changed = {
    ...p,
    dataset_source: 'OpenStreetMap (Geofabrik AGO 2026-05-10)',
    generated_utc: '2026-05-12T12:06:10Z',
    metadata: {
      ...meta,
      feature_count: 2015,
      geometry_types: { POLYGON: 1753, POINT: 261, MULTIPOLYGON: 1 },
      bbox: [11.8210999, -18.0585617, 24.0382699, -5.1673442],
      columns: [
        { name: 'id', type: 'VARCHAR', null_count: 0, null_percent: 0.0, distinct_count: 2015, top_values: [] },
        { name: 'amenity', type: 'VARCHAR', null_count: 713, null_percent: 35.38, distinct_count: 5, top_values: [{ value: 'school', count: 1051 }] },
      ],
    },
  };
  const vm = buildDatasetMetadataViewModel(changed);
  assert.equal(vm.status, 'VERIFIED');
  if (vm.status !== 'VERIFIED') return assert.fail('unreachable');
  assert.equal(vm.featureCount, 2015);
  assert.equal(vm.majorityNullColumns, 0, 'id and amenity (35.38%) are not majority-null');
});

test('12d-297: a geometry sum that disagrees with feature_count refuses — the packet must agree with itself', () => {
  const p = railwaysPacket();
  const meta = p.metadata as Record<string, unknown>;
  const tampered = { ...p, metadata: { ...meta, geometry_types: { LINESTRING: 1155, POINT: 149, POLYGON: 19 } } };
  const vm = buildDatasetMetadataViewModel(tampered);
  assert.equal(vm.status, 'REFUSED');
  assert.match(vm.reason ?? '', /does not equal feature_count/);
  assert.equal((vm as { records?: readonly unknown[] }).records?.length, 0, 'zero content');
  assert.match((vm as { headline: string }).headline, /REFUSED/);
});

test('12d-297: feature_count over the measured ceiling refuses', () => {
  const p = railwaysPacket();
  const meta = p.metadata as Record<string, unknown>;
  const oversized = { ...p, metadata: { ...meta, feature_count: 2_000_001, geometry_types: { POINT: 2_000_001 } } };
  const vm = buildDatasetMetadataViewModel(oversized);
  assert.equal(vm.status, 'REFUSED');
  assert.match(vm.reason ?? '', /measured ceiling \(2,000,000 rows\)/);
  assert.equal(MAX_MEASURED_FEATURES, 2_000_000);
});

test('12d-297: per-column bounds — nulls or distincts above feature_count refuse', () => {
  const p = railwaysPacket();
  const meta = p.metadata as Record<string, unknown>;
  const cols = (meta.columns as Record<string, unknown>[]).slice();
  cols[0] = { ...cols[0], null_count: 1323 };
  const vm = buildDatasetMetadataViewModel({ ...p, metadata: { ...meta, columns: cols } });
  assert.equal(vm.status, 'REFUSED');
  assert.match(vm.reason ?? '', /null_count must be an integer in 0..feature_count/);
  const cols2 = (meta.columns as Record<string, unknown>[]).slice();
  cols2[1] = { ...cols2[1], distinct_count: 9999 };
  const vm2 = buildDatasetMetadataViewModel({ ...p, metadata: { ...meta, columns: cols2 } });
  assert.equal(vm2.status, 'REFUSED');
  assert.match(vm2.reason ?? '', /distinct_count/);
  const cols3 = (meta.columns as Record<string, unknown>[]).slice();
  cols3[1] = { ...cols3[1], null_percent: 100.5 };
  const vm3 = buildDatasetMetadataViewModel({ ...p, metadata: { ...meta, columns: cols3 } });
  assert.equal(vm3.status, 'REFUSED');
  assert.match(vm3.reason ?? '', /null_percent/);
});

test('12d-297: a reordered or extra top-level key refuses; junk inputs refuse with zero content', () => {
  const p = railwaysPacket();
  const reordered: Record<string, unknown> = {};
  for (const k of Object.keys(p)) reordered[k] = p[k];
  const first = Object.keys(reordered)[0];
  const values = Object.keys(reordered).map((k) => reordered[k]);
  const keys = Object.keys(reordered);
  keys.push(keys.shift()!);
  const rotated: Record<string, unknown> = {};
  values.forEach((v, i) => { rotated[keys[i]!] = v; });
  rotated[first as string] = p[first as string];
  // rotate two keys for a genuine order change
  const vmRot = buildDatasetMetadataViewModel(rotated);
  assert.equal(vmRot.status, 'REFUSED');
  assert.match(vmRot.reason ?? '', /in order; fail closed/);
  const extra = { ...p, smuggled: true };
  const vmExtra = buildDatasetMetadataViewModel(extra);
  assert.equal(vmExtra.status, 'REFUSED');
  assert.match(vmExtra.reason ?? '', /in order; fail closed/);
  for (const bad of [null, undefined, 42, 'text', [], true]) {
    const vm = buildDatasetMetadataViewModel(bad);
    assert.equal(vm.status, 'REFUSED');
    assert.equal((vm as { records?: readonly unknown[] }).records?.length, 0);
  }
  const noLicense = { ...p, license_url: 'http://insecure.example/' };
  const noLicenseVm = buildDatasetMetadataViewModel(noLicense);
  assert.match((noLicenseVm as { reason?: string }).reason ?? '', /https/);
});

test('12d-297: an inverted bbox refuses', () => {
  const p = railwaysPacket();
  const meta = p.metadata as Record<string, unknown>;
  const vm = buildDatasetMetadataViewModel({ ...p, metadata: { ...meta, bbox: [12.1, -5.8, 22.3, -17.6] } });
  assert.equal(vm.status, 'REFUSED');
  assert.match(vm.reason ?? '', /inverted/);
});

test('12d-297: never throws, and REFUSED packets carry zero dataset content', () => {
  const junk: unknown[] = [null, 0, -1, { metadata: null }, Symbol.iterator, () => 1, { source_name: 42 }];
  for (const j of junk) {
    const vm = buildDatasetMetadataViewModel(j);
    assert.equal(vm.status, 'REFUSED');
    assert.equal((vm as { records?: readonly unknown[] }).records?.length, 0);
    assert.equal((vm as { modelCalls: number }).modelCalls, 0);
    assert.equal((vm as { humanDecision: string }).humanDecision, 'REQUIRED');
  }
});

test('12d-297: guardrails and policy are pinned and frozen — measured, license-disclosed, no write path', () => {
  assert.ok(Object.isFrozen(DATASET_METADATA_VIEW_MODEL_POLICY));
  assert.ok(Object.isFrozen(DATASET_METADATA_VIEW_MODEL_GUARDRAILS));
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.verifyBeforeRender, true);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.geometrySumsToFeatures, true);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.measuredCountsOnly, true);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.measuredCeilingTwoMillion, true);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.licenseDisclosed, true);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.registeredIsNotRead, true);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.nullsDisclosed, true);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.noWritePath, true);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.noActivationPath, true);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.noTruncation, true);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.refusedRendersAsRefused, true);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.pureModule, true);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.remoteCalls, 0);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.collectsNothing, true);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.activated, 0);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.automaticRecovery, false);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.billionUsersProven, false);
  assert.equal(DATASET_METADATA_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
});

test('12d-297: source-level purity — pure module, no fs, no network primitive', () => {
  const src = readFileSync(new URL('./xiv-dataset-metadata-view-model.ts', import.meta.url), 'utf8');
  for (const forbidden of ['require(', 'from \'node:fs\'', 'from "node:fs"', 'node:path', 'fetch(', 'http://', '127.0.0.1', 'Date.now', 'Math.random', 'child_process']) {
    assert.ok(!src.includes(forbidden), `no ${forbidden} in the view model`);
  }
});