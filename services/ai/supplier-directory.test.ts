/**
 * US-NET-01 Supplier / manufacturer directory search — stub index + RLS contract.
 * Run: npx tsx supplier-directory.test.ts
 */

import assert from 'node:assert/strict';

import {
  BUILTIN_STUB_SUPPLIERS,
  SUPPLIER_DIRECTORY_POLICY,
  bindStubSupplierSearchIndex,
  clearStubSupplierSearchIndex,
  isSupplierDirectoryIndexBound,
  listSupplierDirectoryView,
  resetSupplierDirectorySession,
  searchSupplierDirectory,
  supplierDirectoryAllowsFabricateInventory,
  supplierDirectoryAllowsFabricateRatings,
  supplierDirectoryAllowsL4,
  supplierDirectoryAllowsProductionMutation,
} from './supplier-directory';

function assertNoFabricatedInventory(inventory: {
  gate: string;
  onHandUnits: null;
  skuCount: null;
}) {
  assert.equal(inventory.gate, 'WAITING_DATA');
  assert.equal(inventory.onHandUnits, null);
  assert.equal(inventory.skuCount, null);
}

function assertNoFabricatedRatings(ratings: {
  gate: string;
  stars: null;
  reviewCount: null;
  trustScore: null;
}) {
  assert.equal(ratings.gate, 'WAITING_DATA');
  assert.equal(ratings.stars, null);
  assert.equal(ratings.reviewCount, null);
  assert.equal(ratings.trustScore, null);
}

function main() {
  assert.equal(SUPPLIER_DIRECTORY_POLICY.l4Autonomy, false);
  assert.equal(SUPPLIER_DIRECTORY_POLICY.productionMutation, false);
  assert.equal(SUPPLIER_DIRECTORY_POLICY.fabricateInventory, false);
  assert.equal(SUPPLIER_DIRECTORY_POLICY.fabricateRatings, false);
  assert.equal(SUPPLIER_DIRECTORY_POLICY.indexMode, 'stub');
  assert.equal(SUPPLIER_DIRECTORY_POLICY.rlsScoped, true);
  assert.equal(supplierDirectoryAllowsL4(), false);
  assert.equal(supplierDirectoryAllowsProductionMutation(), false);
  assert.equal(supplierDirectoryAllowsFabricateInventory(), false);
  assert.equal(supplierDirectoryAllowsFabricateRatings(), false);

  resetSupplierDirectorySession();
  assert.equal(isSupplierDirectoryIndexBound(), false);

  const unbound = listSupplierDirectoryView();
  assert.equal(unbound.status, 'WAITING_INDEX');
  assert.equal(unbound.role, 'business');
  assert.equal(unbound.l4Autonomy, false);
  assert.equal(unbound.productionMutation, false);
  assert.equal(unbound.fabricateInventory, false);
  assert.equal(unbound.fabricateRatings, false);
  assert.equal(unbound.indexMode, 'stub');
  assert.equal(unbound.rlsScoped, true);
  assert.equal(unbound.indexGate, 'WAITING_INDEX');
  assert.equal(unbound.tenantScope, null);
  assert.equal(unbound.query, null);
  assert.equal(unbound.results, null);
  assert.equal(unbound.inventory, 'WAITING_DATA');
  assert.equal(unbound.ratings, 'WAITING_DATA');
  assert.match(unbound.note, /WAITING_INDEX/);
  assert.match(unbound.note, /not fabricated|are not fabricated/i);

  assert.throws(
    () => searchSupplierDirectory({ query: 'helix', tenantId: 'tenant-a' }),
    /WAITING_INDEX/,
  );

  assert.throws(
    () => bindStubSupplierSearchIndex({ tenantId: '  ' }),
    /rls_tenant_required/,
  );

  assert.ok(BUILTIN_STUB_SUPPLIERS.length >= 2);

  const bound = bindStubSupplierSearchIndex({ tenantId: 'tenant-a' });
  assert.equal(bound.tenantId, 'tenant-a');
  assert.equal(isSupplierDirectoryIndexBound(), true);
  assert.equal(bound.entries.length, BUILTIN_STUB_SUPPLIERS.length);

  for (const entry of bound.entries) {
    assert.equal(entry.rlsTenantId, 'tenant-a');
    assert.equal(entry.stubOnly, true);
    assert.equal(entry.liveMarketplace, false);
    assertNoFabricatedInventory(entry.inventory);
    assertNoFabricatedRatings(entry.ratings);
  }

  const ready = listSupplierDirectoryView({ tenantId: 'tenant-a' });
  assert.equal(ready.status, 'READY');
  assert.equal(ready.indexGate, 'STUB_INDEX');
  assert.equal(ready.tenantScope, 'tenant-a');
  assert.ok(ready.results);
  assert.equal(ready.results!.length, BUILTIN_STUB_SUPPLIERS.length);
  assert.equal(ready.inventory, 'WAITING_DATA');
  assert.equal(ready.ratings, 'WAITING_DATA');
  assert.equal(ready.l4Autonomy, false);
  assert.equal(ready.productionMutation, false);
  assert.match(ready.note, /STUB_INDEX/);
  assert.match(ready.note, /WAITING_DATA/);

  const filtered = searchSupplierDirectory({ query: 'helix', tenantId: 'tenant-a' });
  assert.equal(filtered.length, 1);
  assert.match(filtered[0].name, /Helix/i);
  assertNoFabricatedInventory(filtered[0].inventory);
  assertNoFabricatedRatings(filtered[0].ratings);

  const manufacturers = searchSupplierDirectory({
    query: 'manufacturer',
    tenantId: 'tenant-a',
  });
  assert.ok(manufacturers.length >= 1);
  assert.ok(manufacturers.every((row) => row.kind === 'manufacturer'));

  // RLS: other tenant must not see rows
  const leaked = searchSupplierDirectory({ query: 'helix', tenantId: 'tenant-b' });
  assert.equal(leaked.length, 0);

  const mismatch = listSupplierDirectoryView({ query: 'helix', tenantId: 'tenant-b' });
  assert.equal(mismatch.status, 'WAITING_DATA');
  assert.deepEqual(mismatch.results, []);
  assert.equal(mismatch.inventory, 'WAITING_DATA');
  assert.equal(mismatch.ratings, 'WAITING_DATA');
  assert.match(mismatch.note, /RLS|tenant/i);

  // Clearing returns honest WAITING_INDEX
  clearStubSupplierSearchIndex();
  assert.equal(isSupplierDirectoryIndexBound(), false);
  const again = listSupplierDirectoryView();
  assert.equal(again.status, 'WAITING_INDEX');
  assert.equal(again.indexGate, 'WAITING_INDEX');
  assert.equal(again.results, null);
  assert.equal(again.inventory, 'WAITING_DATA');
  assert.equal(again.ratings, 'WAITING_DATA');

  resetSupplierDirectorySession();

  console.log(
    'ok - US-NET-01 supplier directory (WAITING_INDEX unbound; STUB_INDEX+RLS explicit bind; inventory/ratings null/WAITING_DATA; L4 false; no fabricate)',
  );
}

main();