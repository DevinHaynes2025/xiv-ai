/**
 * US-SYS-01 System Navigator CSV/commerce demo contract.
 * Run: npx tsx system-navigator.test.ts
 */

import assert from 'node:assert/strict';

import {
  BUILTIN_COMMERCE_CSV_DEMO_ROWS,
  SYSTEM_NAVIGATOR_POLICY,
  clearCommerceCsvDemo,
  isCommerceCsvDemoLoaded,
  listSystemNavigatorView,
  loadCommerceCsvDemo,
  parseCommerceCsvDemo,
  resetSystemNavigatorSession,
  systemNavigatorAllowsL4,
  systemNavigatorAllowsLiveErp,
  systemNavigatorAllowsProductionMutation,
} from './system-navigator';

function main() {
  assert.equal(SYSTEM_NAVIGATOR_POLICY.l4Autonomy, false);
  assert.equal(SYSTEM_NAVIGATOR_POLICY.productionMutation, false);
  assert.equal(SYSTEM_NAVIGATOR_POLICY.liveErp, false);
  assert.equal(SYSTEM_NAVIGATOR_POLICY.connectorMode, 'stub');
  assert.equal(SYSTEM_NAVIGATOR_POLICY.commercePath, 'csv_demo');
  assert.equal(systemNavigatorAllowsL4(), false);
  assert.equal(systemNavigatorAllowsProductionMutation(), false);
  assert.equal(systemNavigatorAllowsLiveErp(), false);

  resetSystemNavigatorSession();
  assert.equal(isCommerceCsvDemoLoaded(), false);

  const unbound = listSystemNavigatorView();
  assert.equal(unbound.status, 'WAITING_CONNECTOR');
  assert.equal(unbound.role, 'executive');
  assert.equal(unbound.l4Autonomy, false);
  assert.equal(unbound.productionMutation, false);
  assert.equal(unbound.liveErp, false);
  assert.equal(unbound.connectorMode, 'stub');
  assert.equal(unbound.commerce.gate, 'WAITING_CONNECTOR');
  assert.equal(unbound.commerce.rows, null);
  assert.equal(unbound.commerce.totals.units, null);
  assert.equal(unbound.commerce.totals.revenueUsd, null);
  assert.equal(unbound.commerce.totals.rowCount, null);
  assert.equal(unbound.commerce.demoOnly, true);
  assert.equal(unbound.commerce.liveErp, false);
  assert.match(unbound.note, /WAITING_CONNECTOR/);
  assert.match(unbound.commerce.note, /WAITING_CONNECTOR|not fabricated/i);

  const erp = unbound.connectors.find((c) => c.kind === 'erp');
  assert.ok(erp);
  assert.equal(erp.live, false);
  assert.equal(erp.status, 'WAITING_CONNECTOR');

  const commerceStub = unbound.connectors.find((c) => c.kind === 'commerce_csv');
  assert.ok(commerceStub);
  assert.equal(commerceStub.status, 'WAITING_CONNECTOR');
  assert.equal(commerceStub.live, false);

  // Empty CSV must not invent metrics
  assert.deepEqual(parseCommerceCsvDemo(''), []);
  assert.throws(() => parseCommerceCsvDemo('foo,bar\n1,2'), /commerce_csv_headers_invalid/);

  const parsed = parseCommerceCsvDemo(
    'sku,channel,units,revenueUsd\nA1,direct,2,40\nB2,retail,1,25\n',
  );
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].sku, 'A1');
  assert.equal(parsed[0].units, 2);
  assert.equal(parsed[0].revenueUsd, 40);

  const loaded = loadCommerceCsvDemo({
    label: 'session-demo.csv',
    rows: parsed,
  });
  assert.equal(loaded.label, 'session-demo.csv');
  assert.equal(isCommerceCsvDemoLoaded(), true);

  const bound = listSystemNavigatorView();
  assert.equal(bound.status, 'READY');
  assert.equal(bound.commerce.gate, 'DEMO_CSV');
  assert.ok(bound.commerce.rows);
  assert.equal(bound.commerce.rows!.length, 2);
  assert.equal(bound.commerce.totals.units, 3);
  assert.equal(bound.commerce.totals.revenueUsd, 65);
  assert.equal(bound.commerce.totals.rowCount, 2);
  assert.equal(bound.commerce.sourceLabel, 'session-demo.csv');
  assert.equal(bound.commerce.demoOnly, true);
  assert.equal(bound.commerce.liveErp, false);
  assert.equal(bound.commerce.productionMutation, false);
  assert.match(bound.commerce.note, /DEMO_CSV/);
  assert.match(bound.note, /DEMO_CSV|not live ERP/i);

  const commerceBound = bound.connectors.find((c) => c.kind === 'commerce_csv');
  assert.ok(commerceBound);
  assert.equal(commerceBound.status, 'STUB_DEMO_CSV');
  assert.equal(commerceBound.live, false);

  // Builtin demo path
  clearCommerceCsvDemo();
  assert.equal(isCommerceCsvDemoLoaded(), false);
  const builtin = loadCommerceCsvDemo();
  assert.equal(builtin.rows.length, BUILTIN_COMMERCE_CSV_DEMO_ROWS.length);
  const builtinView = listSystemNavigatorView();
  assert.equal(builtinView.commerce.gate, 'DEMO_CSV');
  assert.equal(builtinView.commerce.totals.rowCount, BUILTIN_COMMERCE_CSV_DEMO_ROWS.length);
  assert.ok((builtinView.commerce.totals.units ?? 0) > 0);
  // Still not live ERP / L4
  assert.equal(builtinView.liveErp, false);
  assert.equal(builtinView.l4Autonomy, false);
  assert.equal(builtinView.productionMutation, false);

  clearCommerceCsvDemo();
  resetSystemNavigatorSession();
  const again = listSystemNavigatorView();
  assert.equal(again.status, 'WAITING_CONNECTOR');
  assert.equal(again.commerce.gate, 'WAITING_CONNECTOR');
  assert.equal(again.commerce.totals.units, null);
  assert.equal(again.commerce.totals.revenueUsd, null);

  console.log(
    'ok - US-SYS-01 system navigator (connector stub; WAITING_CONNECTOR unbound; DEMO_CSV only when loaded; never fabricate; L4 false; not live ERP)',
  );
}

main();
