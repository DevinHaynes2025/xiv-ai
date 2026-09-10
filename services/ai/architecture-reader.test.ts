/**
 * US-ARCH-01 Architecture Reader + Council queue — product-lane honesty contract.
 * Run: npx tsx architecture-reader.test.ts
 */

import assert from 'node:assert/strict';

import {
  ARCHITECTURE_READER_POLICY,
  BUILTIN_ARCHITECTURE_FIXTURE,
  DEFAULT_WAITING_PROVIDERS,
  architectureReaderAllowsL4,
  architectureReaderAllowsProductionAutoApply,
  architectureReaderIsReadOnly,
  bindArchitectureReaderFixture,
  clearArchitectureReaderFixture,
  isArchitectureReaderFabricBound,
  listArchitectureReaderView,
  resetArchitectureReaderSession,
} from './architecture-reader';

function main() {
  assert.equal(ARCHITECTURE_READER_POLICY.l4Autonomy, false);
  assert.equal(ARCHITECTURE_READER_POLICY.productionAutoApply, false);
  assert.equal(ARCHITECTURE_READER_POLICY.readOnly, true);
  assert.equal(ARCHITECTURE_READER_POLICY.layerKind, 'SIMULATION');
  assert.equal(architectureReaderAllowsL4(), false);
  assert.equal(architectureReaderAllowsProductionAutoApply(), false);
  assert.equal(architectureReaderIsReadOnly(), true);

  resetArchitectureReaderSession();
  assert.equal(isArchitectureReaderFabricBound(), false);

  const unbound = listArchitectureReaderView();
  assert.equal(unbound.status, 'WAITING_DATA');
  assert.equal(unbound.fabricGate, 'WAITING_DATA');
  assert.equal(unbound.role, 'executive');
  assert.equal(unbound.readOnly, true);
  assert.equal(unbound.l4Autonomy, false);
  assert.equal(unbound.productionAutoApply, false);
  assert.equal(unbound.layerKind, 'SIMULATION');
  assert.equal(unbound.tenantScope, null);
  assert.equal(unbound.universeScope, null);
  assert.equal(unbound.architectureCard, null);
  assert.equal(unbound.councilTop, null);
  assert.deepEqual(unbound.waitingProviders, [...DEFAULT_WAITING_PROVIDERS]);
  assert.ok(unbound.readyProviders.includes('LOCAL_RULES'));
  assert.match(unbound.note, /WAITING_DATA/);
  assert.match(unbound.note, /null/);

  assert.throws(
    () => bindArchitectureReaderFixture({ universeId: '  ', tenantId: 'xiv' }),
    /universe_required/,
  );
  assert.throws(
    () => bindArchitectureReaderFixture({ universeId: 'demo-cc', tenantId: '  ' }),
    /tenant_required/,
  );

  assert.ok(BUILTIN_ARCHITECTURE_FIXTURE.councilTop.length >= 5);
  assert.equal(BUILTIN_ARCHITECTURE_FIXTURE.architectureCard.liveFabric, false);
  assert.equal(BUILTIN_ARCHITECTURE_FIXTURE.architectureCard.layerKind, 'SIMULATION');

  const bound = bindArchitectureReaderFixture({ universeId: 'demo-cc', tenantId: 'xiv' });
  assert.equal(bound.universeId, 'demo-cc');
  assert.equal(bound.tenantId, 'xiv');
  assert.equal(isArchitectureReaderFabricBound(), true);
  assert.equal(bound.architectureCard.liveFabric, false);
  assert.equal(bound.architectureCard.routeTarget, null);

  const view = listArchitectureReaderView({ tenantId: 'xiv', universeId: 'demo-cc' });
  assert.equal(view.fabricGate, 'FIXTURE_SIMULATION');
  assert.equal(view.status, 'WAITING_PROVIDER');
  assert.equal(view.readOnly, true);
  assert.equal(view.l4Autonomy, false);
  assert.equal(view.productionAutoApply, false);
  assert.equal(view.tenantScope, 'xiv');
  assert.equal(view.universeScope, 'demo-cc');
  assert.ok(view.architectureCard);
  assert.equal(view.architectureCard!.liveFabric, false);
  assert.equal(view.architectureCard!.layerKind, 'SIMULATION');
  assert.equal(view.architectureCard!.companyCount, 2);
  assert.equal(view.architectureCard!.agentPopulationTotal, 18);
  assert.ok(view.councilTop);
  assert.equal(view.councilTop!.length, BUILTIN_ARCHITECTURE_FIXTURE.councilTop.length);
  assert.ok(view.waitingProviders.includes('GROK'));
  assert.match(view.note, /FIXTURE_SIMULATION|WAITING_PROVIDER/);
  assert.match(view.note, /liveFabric=false/);

  for (const row of view.councilTop!) {
    assert.ok(row.waitingProviders.includes('GROK'));
    assert.ok(row.readyProviders.includes('LOCAL_RULES'));
    assert.equal(typeof row.composite, 'number');
  }

  const mismatch = listArchitectureReaderView({ tenantId: 'other-tenant' });
  assert.equal(mismatch.status, 'WAITING_DATA');
  assert.equal(mismatch.architectureCard, null);
  assert.equal(mismatch.councilTop, null);
  assert.match(mismatch.note, /WAITING_DATA|mismatch|tenant/i);

  clearArchitectureReaderFixture();
  assert.equal(isArchitectureReaderFabricBound(), false);
  const again = listArchitectureReaderView();
  assert.equal(again.status, 'WAITING_DATA');
  assert.equal(again.architectureCard, null);
  assert.equal(again.councilTop, null);
  assert.equal(again.productionAutoApply, false);
  assert.equal(again.l4Autonomy, false);

  resetArchitectureReaderSession();

  console.log(
    'ok - US-ARCH-01 architecture reader (WAITING_DATA unbound; FIXTURE_SIMULATION bind; WAITING_PROVIDER cloud; liveFabric=false; productionAutoApply=false; L4 false; no fabricated fabric metrics)',
  );
}

main();