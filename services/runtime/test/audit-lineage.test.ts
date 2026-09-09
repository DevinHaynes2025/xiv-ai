import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AuditLedger } from '../src/audit';
import { ManualClock } from '../src/clock';
import { IdFactory } from '../src/ids';
import { LineageStore, REQUIRED_LINEAGE_STAGES } from '../src/lineage';

const TENANT = { organizationId: 'org_a', universeId: 'uni_a' };
const OTHER = { organizationId: 'org_b', universeId: 'uni_a' };

function ledger() {
  return new AuditLedger(new ManualClock(), new IdFactory());
}

test('audit chain verifies and breaks on edit', () => {
  const audit = ledger();
  for (let index = 0; index < 5; index += 1) {
    audit.append({ tenant: TENANT, category: 'node', kind: 'test_event', subjectId: `n${index}` });
  }
  assert.equal(audit.verifyChain().intact, true);

  const events = [...audit.export()];
  const third = events[2];
  assert.ok(third);
  audit.restore([...events.slice(0, 2), { ...third, detail: { tampered: true } }, ...events.slice(3)]);

  const verdict = audit.verifyChain();
  assert.equal(verdict.intact, false);
  assert.equal(verdict.brokenAt, 3);
});

test('audit chain breaks on deletion', () => {
  const audit = ledger();
  for (let index = 0; index < 4; index += 1) {
    audit.append({ tenant: TENANT, category: 'node', kind: 'test_event', subjectId: `n${index}` });
  }
  const events = [...audit.export()];
  audit.restore([...events.slice(0, 1), ...events.slice(2)]);
  assert.equal(audit.verifyChain().intact, false);
});

test('audit reads are tenant filtered and exclude plane-level events', () => {
  const audit = ledger();
  audit.append({ tenant: TENANT, category: 'node', kind: 'mine', subjectId: 'a' });
  audit.append({ tenant: OTHER, category: 'node', kind: 'theirs', subjectId: 'b' });
  audit.append({ tenant: null, category: 'security', kind: 'plane', subjectId: 'c' });

  const mine = audit.listForTenant(TENANT);
  assert.deepEqual(
    mine.map((event) => event.kind),
    ['mine'],
  );
});

test('lineage reconstruction reports exactly the missing stages', () => {
  const lineage = new LineageStore(new ManualClock(), new IdFactory());
  for (const stage of REQUIRED_LINEAGE_STAGES) {
    if (stage === 'model') continue;
    lineage.record({ workloadId: 'wl_1', tenant: TENANT, stage, reference: `ref_${stage}`, detail: 'detail' });
  }

  const reconstruction = lineage.reconstruct('wl_1', { approvalMandatory: false });
  assert.equal(reconstruction.complete, false);
  assert.deepEqual(reconstruction.missingStages, ['model']);
  assert.equal(reconstruction.unknownModel, true);
  assert.equal(reconstruction.chainIntact, true);
});

test('lineage requires an approval stage when approval is mandatory', () => {
  const lineage = new LineageStore(new ManualClock(), new IdFactory());
  for (const stage of REQUIRED_LINEAGE_STAGES) {
    lineage.record({ workloadId: 'wl_2', tenant: TENANT, stage, reference: `ref_${stage}`, detail: 'detail' });
  }
  assert.equal(lineage.reconstruct('wl_2', { approvalMandatory: false }).complete, true);
  assert.equal(lineage.reconstruct('wl_2', { approvalMandatory: true }).complete, false);

  lineage.record({ workloadId: 'wl_2', tenant: TENANT, stage: 'approval', reference: 'apr_1', detail: 'approved' });
  assert.equal(lineage.reconstruct('wl_2', { approvalMandatory: true }).complete, true);
});

test('lineage detects a tampered chain', () => {
  const lineage = new LineageStore(new ManualClock(), new IdFactory());
  for (const stage of REQUIRED_LINEAGE_STAGES) {
    lineage.record({ workloadId: 'wl_3', tenant: TENANT, stage, reference: `ref_${stage}`, detail: 'detail' });
  }
  const chain = lineage.chainFor('wl_3');
  const second = chain[1];
  assert.ok(second);
  lineage.restore({ wl_3: [chain[0] as never, { ...second, reference: 'rewritten' }, ...chain.slice(2)] });
  assert.equal(lineage.reconstruct('wl_3', { approvalMandatory: false }).chainIntact, false);
});
