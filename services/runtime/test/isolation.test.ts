import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AuditLedger } from '../src/audit';
import { ManualClock } from '../src/clock';
import { IdFactory } from '../src/ids';
import { BypassRegistry, TenantStore, sameTenant, tenantKey } from '../src/isolation';

const A = { organizationId: 'org_a', universeId: 'uni_ops' };
const A_OTHER_UNIVERSE = { organizationId: 'org_a', universeId: 'uni_research' };
const B = { organizationId: 'org_b', universeId: 'uni_ops' };

type Row = { tenant: typeof A; id: string };

function store() {
  const clock = new ManualClock();
  const audit = new AuditLedger(clock, new IdFactory());
  const counters = { deniedReads: 0, deniedWrites: 0, allowedReads: 0, allowedWrites: 0 };
  return { audit, counters, table: new TenantStore<Row>('rows', audit, counters) };
}

test('tenant and universe both scope identity', () => {
  assert.equal(sameTenant(A, A), true);
  assert.equal(sameTenant(A, A_OTHER_UNIVERSE), false);
  assert.equal(sameTenant(A, B), false);
  assert.notEqual(tenantKey(A), tenantKey(A_OTHER_UNIVERSE));
});

test('a row from another tenant reads as absent and is audited', () => {
  const { table, counters, audit } = store();
  table.put(A, 'row_1', { tenant: A, id: 'row_1' });

  assert.equal(table.get(B, 'row_1'), undefined);
  assert.equal(table.get(A_OTHER_UNIVERSE, 'row_1'), undefined);
  assert.equal(counters.deniedReads, 2);
  assert.equal(audit.has((event) => event.kind === 'cross_tenant_read_denied'), true);
});

test('require raises not_found rather than leaking existence', () => {
  const { table } = store();
  table.put(A, 'row_1', { tenant: A, id: 'row_1' });
  assert.throws(
    () => table.require(B, 'row_1'),
    (error: { code?: string; message?: string }) =>
      error.code === 'not_found' && !String(error.message).includes('org_a'),
  );
});

test('writes outside the caller scope are refused', () => {
  const { table, counters } = store();
  assert.throws(
    () => table.put(B, 'row_2', { tenant: A, id: 'row_2' }),
    (error: { code?: string }) => error.code === 'isolation_violation',
  );
  table.put(A, 'row_3', { tenant: A, id: 'row_3' });
  assert.throws(
    () => table.put(B, 'row_3', { tenant: B as typeof A, id: 'row_3' }),
    (error: { code?: string }) => error.code === 'isolation_violation',
  );
  assert.equal(counters.deniedWrites, 2);
});

test('listing is scoped and never mixes tenants', () => {
  const { table } = store();
  table.put(A, 'a1', { tenant: A, id: 'a1' });
  table.put(A, 'a2', { tenant: A, id: 'a2' });
  table.put(B, 'b1', { tenant: B as typeof A, id: 'b1' });
  table.put(A_OTHER_UNIVERSE, 'u1', { tenant: A_OTHER_UNIVERSE, id: 'u1' });

  assert.deepEqual(table.list(A).map((row) => row.id).sort(), ['a1', 'a2']);
  assert.deepEqual(table.list(B).map((row) => row.id), ['b1']);
  assert.deepEqual(table.list(A_OTHER_UNIVERSE).map((row) => row.id), ['u1']);
  assert.equal(table.size, 4);
});

test('a privileged whole-table read requires a documented path', () => {
  const { table, audit } = store();
  const bypass = new BypassRegistry();
  table.put(A, 'a1', { tenant: A, id: 'a1' });
  table.put(B, 'b1', { tenant: B as typeof A, id: 'b1' });

  assert.throws(
    () => table.listPrivileged(bypass, 'undocumented', 'principal_1'),
    (error: { code?: string }) => error.code === 'bypass_unjustified',
  );

  bypass.register({
    pathId: 'backup_restore',
    justification: 'Backup must read every tenant row for a consistent snapshot.',
    approvedByPrincipalId: 'founder',
    reviewedAt: 0,
  });
  assert.equal(table.listPrivileged(bypass, 'backup_restore', 'principal_1').length, 2);
  assert.equal(audit.has((event) => event.kind === 'privileged_bypass_used'), true);
});

test('a bypass path without a justification or approver cannot be registered', () => {
  const bypass = new BypassRegistry();
  assert.throws(
    () => bypass.register({ pathId: 'p', justification: 'too short', approvedByPrincipalId: 'x', reviewedAt: 0 }),
    (error: { code?: string }) => error.code === 'bypass_unjustified',
  );
  assert.throws(
    () =>
      bypass.register({
        pathId: 'p',
        justification: 'A sufficiently long written justification.',
        approvedByPrincipalId: '  ',
        reviewedAt: 0,
      }),
    (error: { code?: string }) => error.code === 'bypass_unjustified',
  );
  assert.equal(bypass.list().length, 0);
});

test('restore rebuilds the tenant index without merging tenants', () => {
  const { table } = store();
  table.put(A, 'a1', { tenant: A, id: 'a1' });
  table.put(B, 'b1', { tenant: B as typeof A, id: 'b1' });
  const exported = table.exportAll();

  const fresh = store();
  fresh.table.restoreAll(exported);
  assert.deepEqual(fresh.table.list(A).map((row) => row.id), ['a1']);
  assert.equal(fresh.table.get(A, 'b1'), undefined);
});
