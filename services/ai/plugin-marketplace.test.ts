/**
 * US-PLG-01 Plugin marketplace install (signed) — in-memory stub + WAITING_SIGNING contract.
 * Run: npx tsx plugin-marketplace.test.ts
 */

import assert from 'node:assert/strict';

import {
  BUILTIN_STUB_PACKAGES,
  PLUGIN_MARKETPLACE_POLICY,
  bindInMemoryPluginMarketplace,
  clearInMemoryPluginMarketplace,
  decidePluginInstallProposal,
  isPluginMarketplaceBound,
  listPluginMarketplaceView,
  pluginMarketplaceAllowsL4,
  pluginMarketplaceAllowsProductionMutation,
  pluginMarketplaceClaimsCryptographicVerification,
  pluginMarketplaceRequiresApproval,
  proposePluginInstall,
  resetPluginMarketplaceSession,
} from './plugin-marketplace';

function assertNeverVerified(signature: {
  gate: string;
  cryptographicallyVerified: false;
  signatureDigest: null;
  signerId: null;
}) {
  assert.equal(signature.cryptographicallyVerified, false);
  assert.equal(signature.signatureDigest, null);
  assert.equal(signature.signerId, null);
  assert.ok(signature.gate === 'WAITING_SIGNING' || signature.gate === 'STUB_UNSIGNED');
}

function main() {
  assert.equal(PLUGIN_MARKETPLACE_POLICY.l4Autonomy, false);
  assert.equal(PLUGIN_MARKETPLACE_POLICY.productionMutation, false);
  assert.equal(PLUGIN_MARKETPLACE_POLICY.requiresApproval, true);
  assert.equal(PLUGIN_MARKETPLACE_POLICY.cryptographicallyVerified, false);
  assert.equal(PLUGIN_MARKETPLACE_POLICY.marketplaceMode, 'in_memory_stub');
  assert.equal(PLUGIN_MARKETPLACE_POLICY.signingMode, 'waiting_real_verifier');
  assert.equal(pluginMarketplaceAllowsL4(), false);
  assert.equal(pluginMarketplaceAllowsProductionMutation(), false);
  assert.equal(pluginMarketplaceRequiresApproval(), true);
  assert.equal(pluginMarketplaceClaimsCryptographicVerification(), false);

  resetPluginMarketplaceSession();
  assert.equal(isPluginMarketplaceBound(), false);

  const unbound = listPluginMarketplaceView();
  assert.equal(unbound.status, 'WAITING_SIGNING');
  assert.equal(unbound.role, 'builder');
  assert.equal(unbound.l4Autonomy, false);
  assert.equal(unbound.productionMutation, false);
  assert.equal(unbound.requiresApproval, true);
  assert.equal(unbound.cryptographicallyVerified, false);
  assert.equal(unbound.marketplaceMode, 'in_memory_stub');
  assert.equal(unbound.signingGate, 'WAITING_SIGNING');
  assert.equal(unbound.tenantScope, null);
  assert.equal(unbound.packages, null);
  assert.deepEqual(unbound.proposals, []);
  assert.match(unbound.note, /WAITING_SIGNING/);
  assert.match(unbound.note, /not claimed|no cryptographic/i);

  assert.throws(
    () => proposePluginInstall({ packageId: 'stub-plugin-ops-brief-tools', tenantId: 'tenant-a' }),
    /WAITING_SIGNING/,
  );

  assert.throws(
    () => bindInMemoryPluginMarketplace({ tenantId: '  ' }),
    /tenant_required/,
  );

  assert.ok(BUILTIN_STUB_PACKAGES.length >= 2);

  const bound = bindInMemoryPluginMarketplace({ tenantId: 'tenant-a' });
  assert.equal(bound.tenantId, 'tenant-a');
  assert.equal(isPluginMarketplaceBound(), true);
  assert.equal(bound.packages.length, BUILTIN_STUB_PACKAGES.length);

  for (const pkg of bound.packages) {
    assert.equal(pkg.stubOnly, true);
    assert.equal(pkg.liveSignedPackage, false);
    assertNeverVerified(pkg.signature);
    assert.equal(pkg.signature.gate, 'STUB_UNSIGNED');
  }

  const ready = listPluginMarketplaceView({ tenantId: 'tenant-a' });
  assert.equal(ready.status, 'READY');
  assert.equal(ready.signingGate, 'STUB_UNSIGNED');
  assert.equal(ready.tenantScope, 'tenant-a');
  assert.ok(ready.packages);
  assert.equal(ready.packages!.length, BUILTIN_STUB_PACKAGES.length);
  assert.equal(ready.cryptographicallyVerified, false);
  assert.equal(ready.requiresApproval, true);
  assert.equal(ready.l4Autonomy, false);
  assert.equal(ready.productionMutation, false);
  assert.match(ready.note, /STUB_UNSIGNED/);
  assert.match(ready.note, /cryptographicallyVerified=false/);

  for (const pkg of ready.packages!) {
    assertNeverVerified(pkg.signature);
  }

  const proposal = proposePluginInstall({
    packageId: 'stub-plugin-ops-brief-tools',
    tenantId: 'tenant-a',
  });
  assert.equal(proposal.requiresApproval, true);
  assert.equal(proposal.productionMutation, false);
  assert.equal(proposal.l4Autonomy, false);
  assert.equal(proposal.cryptographicallyVerified, false);
  assert.equal(proposal.status, 'pending_approval');
  assert.equal(proposal.signatureGate, 'STUB_UNSIGNED');
  assert.equal(proposal.packageId, 'stub-plugin-ops-brief-tools');

  assert.throws(
    () => proposePluginInstall({ packageId: 'does-not-exist', tenantId: 'tenant-a' }),
    /plugin_package_not_found/,
  );

  assert.throws(
    () => proposePluginInstall({ packageId: 'stub-plugin-ops-brief-tools', tenantId: 'tenant-b' }),
    /WAITING_DATA|tenant/,
  );

  const mismatch = listPluginMarketplaceView({ tenantId: 'tenant-b' });
  assert.equal(mismatch.status, 'WAITING_DATA');
  assert.deepEqual(mismatch.packages, []);
  assert.deepEqual(mismatch.proposals, []);
  assert.equal(mismatch.cryptographicallyVerified, false);
  assert.match(mismatch.note, /tenant|WAITING_DATA/i);

  const approved = decidePluginInstallProposal({
    proposalId: proposal.id,
    tenantId: 'tenant-a',
    decision: 'approve',
  });
  assert.equal(approved.status, 'approved_session');
  assert.equal(approved.productionMutation, false);
  assert.equal(approved.cryptographicallyVerified, false);
  assert.match(approved.note, /Not a production mutation|no production/i);

  const proposal2 = proposePluginInstall({
    packageId: 'stub-plugin-csv-connector',
    tenantId: 'tenant-a',
  });
  const rejected = decidePluginInstallProposal({
    proposalId: proposal2.id,
    tenantId: 'tenant-a',
    decision: 'reject',
  });
  assert.equal(rejected.status, 'rejected');
  assert.equal(rejected.productionMutation, false);

  const after = listPluginMarketplaceView({ tenantId: 'tenant-a' });
  assert.ok(after.proposals.length >= 2);
  assert.ok(after.proposals.every((row) => row.requiresApproval === true));
  assert.ok(after.proposals.every((row) => row.cryptographicallyVerified === false));
  assert.ok(after.proposals.every((row) => row.productionMutation === false));
  assert.ok(after.proposals.every((row) => row.l4Autonomy === false));

  clearInMemoryPluginMarketplace();
  assert.equal(isPluginMarketplaceBound(), false);
  const again = listPluginMarketplaceView();
  assert.equal(again.status, 'WAITING_SIGNING');
  assert.equal(again.signingGate, 'WAITING_SIGNING');
  assert.equal(again.packages, null);
  assert.equal(again.cryptographicallyVerified, false);

  resetPluginMarketplaceSession();

  console.log(
    'ok - US-PLG-01 plugin marketplace (WAITING_SIGNING unbound; STUB_UNSIGNED in-memory bind; requiresApproval install proposals; cryptographicallyVerified=false; L4 false; no production mutations)',
  );
}

main();
