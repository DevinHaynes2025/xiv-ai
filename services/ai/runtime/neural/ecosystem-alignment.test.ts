import assert from 'node:assert/strict';
import './alignment-receipt.test';
import '../community/join-preview.test';
import {
  ECOSYSTEM_TARGETS,
  LOGICAL_PATHWAY_TARGET,
  defaultEcosystemAlignment,
  evaluateEcosystemAlignment,
  pathwayTargetIsCurrentCapacity,
  ecosystemAlignmentReport,
  ECOSYSTEM_ALIGNMENT_PROTOCOL,
  type AlignmentRequest,
} from './ecosystem-alignment';
import '../feedback/intake-preview.test';
import '../feedback/encrypted-ledger.test';
import '../feedback/moderation-receipt.test';
import './authenticated-alignment-report.test';
import './alignment-evidence-ledger.test';
import './alignment-key-rotation.test';
import './alignment-trust-store.test';
import './alignment-key-rollback.test';
import './alignment-trust-audit.test';
import './alignment-audit-checkpoint.test';
import './alignment-checkpoint-store.test';
import './alignment-checkpoint-reconciliation.test';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

const approved: AlignmentRequest = {
  tenantId: 'tenant-a',
  universeId: 'universe-a',
  target: 'OLLAMA',
  actorAuthorized: true,
  humanApproved: true,
  participantOptIn: true,
  organizationAuthorized: true,
  termsAccepted: true,
  dataPolicyApproved: true,
  capabilityEvidenceVerified: true,
};

test('every named ecosystem target defaults to NOT_CONFIGURED', () => {
  assert.equal(ECOSYSTEM_TARGETS.length, 17);
  for (const target of ECOSYSTEM_TARGETS) {
    const decision = defaultEcosystemAlignment(target);
    assert.equal(decision.state, 'NOT_CONFIGURED');
    assert.equal(decision.allowed, false);
    assert.equal(decision.partnershipClaimed, false);
  }
});

test('one protocol covers tools, source control, providers, devices, OEMs, and chips without partnership claims', () => {
  const report = ecosystemAlignmentReport();
  assert.equal(report.targets.length, 17);
  assert.equal(new Set(report.targets.map((item) => item.layer)).size, 6);
  assert.equal(report.summary.configuredCount, 0);
  assert.equal(report.summary.productionLiveCount, 0);
  assert.equal(report.summary.partnershipCount, 0);
  assert.equal(report.summary.universallyInstalled, false);
  assert.equal(report.targets.every((item) => item.state === 'NOT_CONFIGURED' && !item.partnershipClaimed && !item.installedOnDevices), true);
  assert.equal(ECOSYSTEM_ALIGNMENT_PROTOCOL.authorityPath.includes('Guardian policy'), true);
  assert.equal(ECOSYSTEM_ALIGNMENT_PROTOCOL.automaticAgentAuthority, false);
});

test('people require explicit opt-in', () => {
  const decision = evaluateEcosystemAlignment({ ...approved, participantOptIn: false });
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, 'participant_opt_in_required');
});

test('organizations require their own authority', () => {
  const decision = evaluateEcosystemAlignment({ ...approved, organizationAuthorized: false });
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, 'organization_authority_required');
});

test('vendor name never substitutes for terms and capability evidence', () => {
  for (const target of ECOSYSTEM_TARGETS) {
    assert.equal(evaluateEcosystemAlignment({ ...approved, target, termsAccepted: false }).allowed, false);
    assert.equal(evaluateEcosystemAlignment({ ...approved, target, capabilityEvidenceVerified: false }).allowed, false);
  }
});

test('human approval is required after technical checks', () => {
  const decision = evaluateEcosystemAlignment({ ...approved, humanApproved: false });
  assert.equal(decision.state, 'REVIEW_REQUIRED');
  assert.equal(decision.allowed, false);
});

test('configured means bounded compatibility, not production or partnership', () => {
  const decision = evaluateEcosystemAlignment(approved);
  assert.equal(decision.state, 'CONFIGURED');
  assert.equal(decision.allowed, true);
  assert.equal(decision.productionLive, false);
  assert.equal(decision.partnershipClaimed, false);
  assert.equal(decision.grantsAuthority, false);
});

test('pathway goal is sparse and never reported as measured capacity', () => {
  assert.equal(LOGICAL_PATHWAY_TARGET.decimal, '4000000000000000000');
  assert.equal(LOGICAL_PATHWAY_TARGET.materialization, 'SPARSE_ON_DEMAND');
  assert.equal(LOGICAL_PATHWAY_TARGET.claimedAchieved, false);
  assert.equal(LOGICAL_PATHWAY_TARGET.measuredCapacity, false);
  assert.equal(pathwayTargetIsCurrentCapacity(), false);
});

console.log('Ecosystem alignment contracts: OK');
