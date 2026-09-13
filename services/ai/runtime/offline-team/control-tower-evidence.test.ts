import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import { preparePathwayCandidateFromQueue, type PathwayEvidencePacket } from './pathway-evidence-bridge';
import { buildControlTowerEvidence, renderControlTowerReport, type DeviceAssessmentLike } from './control-tower-evidence';
import { enrollDevice, assessDeviceActivation } from './device-fleet-enrollment';
import { verifyCompatibility, TARGET_MATRIX } from './universal-device-compatibility';

const tenantId = 'tower-tenant';
const outputHash = 'f'.repeat(64);
const story: OfflineStory = {
  id: 'story-1', tenantId, roleId: 'load_test', objective: 'synthetic reviewed story for the control tower',
  acceptance: ['reviewed result is hash-bound'], dependencies: [], sourceRevision: 'a'.repeat(40),
  masterPlanSha256: 'b'.repeat(64), securityClass: 'ORDINARY', kind: 'PRODUCT_STORY',
};
const packetReq = () => ({
  tenantId, storyId: 'story-1', expectedOutputHash: outputHash, pathwayId: 'pathway-1', domain: 'OPERATIONS' as const,
  version: 1, confidence: 0.93, evaluationScore: 0.95, evidenceRefs: ['run:synthetic-1'],
  reviewRefs: ['review:one', 'review:two'], rollbackRef: 'rollback:pathway-1',
});

function makePacket(): PathwayEvidencePacket {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-tower-'));
  try {
    const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
    try {
      q.enqueue([story]);
      const lease = q.claimNext(tenantId, 'load_test', 'worker-1', 120000);
      assert.ok(lease);
      q.settle(lease!, { outcome: 'DRAFT', outputHash, providerSettled: true });
      q.applyReviewDecision({ tenantId, storyId: 'story-1', reviewerId: 'secure_code_reviewer', expectedOutputHash: outputHash, decision: 'APPROVED', reviewRef: 'review:queue-approved' });
      return preparePathwayCandidateFromQueue(q, packetReq());
    } finally { q.close(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const deviceAssessment = (state: 'eligible' | 'unverified'): DeviceAssessmentLike => {
  const r = enrollDevice({
    tenantId, userId: 'user-a', deviceId: 'phone-a', deviceFamily: 'PHONE' as const, osFamily: 'ANDROID' as const,
    cpuFamily: 'ARM64' as const, requestedSurfaces: ['REACT_NATIVE'] as const, purposes: ['LOCAL_ASSISTANCE'] as const,
    consentRefs: ['consent:user-a:1'], enrolledAtMs: 1_800_000_000_000, expiresAtMs: 1_800_000_000_000 + 86_400_000,
    computeSharingOptIn: false, backgroundWorkOptIn: false,
  });
  if (state === 'eligible') {
    const target = TARGET_MATRIX.find(p => p.deviceFamily === 'PHONE' && p.osFamily === 'ANDROID' && p.cpuFamily === 'ARM64')!;
    const verified = { ...r, compatibility: verifyCompatibility(target, ['lab:android']) } as typeof r;
    return assessDeviceActivation(verified, {
      nowMs: 1_800_000_001_000, networkAvailable: false, batteryPercent: 80, thermalState: 'NOMINAL' as const,
      localModelAvailable: true, appForeground: true, userPaused: false, consentRevoked: false,
    });
  }
  return assessDeviceActivation(r, {
    nowMs: 1_800_000_001_000, networkAvailable: false, batteryPercent: 80, thermalState: 'NOMINAL' as const,
    localModelAvailable: true, appForeground: true, userPaused: false, consentRevoked: false,
  });
};

test('control-tower surface aggregates reviewed pathway packets and device assessments with honest flags', () => {
  const p = buildControlTowerEvidence({
    tenantId, generatedAtMs: 1_800_000_002_000,
    pathwayPackets: [makePacket()],
    deviceAssessments: [deviceAssessment('eligible'), deviceAssessment('unverified')],
  });
  assert.equal(p.kind, 'CONTROL_TOWER_EVIDENCE');
  assert.equal(p.pathway.packetsConsidered, 1);
  assert.equal(p.pathway.eligibleNow, 0); // candidate is humanApproved:false, so it stays blocked
  assert.equal(p.pathway.blocked, 1);
  assert.ok(p.pathway.topBlockReasons.some(r => r.reason.includes('human approval')));
  assert.equal(p.devices.byState.ELIGIBLE_FOR_LOCAL_TASKS, 1);
  assert.equal(p.devices.byState.UNVERIFIED_COMPATIBILITY, 1);
  assert.equal(p.devices.observedLocalWorkers, 0);
  assert.equal(p.devices.workersStartedByThisSurface, 0);
  assert.equal(p.guardrails.activatesCandidates, false);
  assert.equal(p.guardrails.countsLogicalTargetsAsLiveAgents, false);
});

test('an empty surface renders honestly as empty and requires no fabricated decisions', () => {
  const p = buildControlTowerEvidence({ tenantId, generatedAtMs: 1, pathwayPackets: [], deviceAssessments: [] });
  assert.equal(p.pathway.packetsConsidered, 0);
  assert.ok(p.pathway.humanActionsRequired[0].includes('empty by design'));
});

test('the surface renders through the governed report composer in CLEAN mode without grammar issues', () => {
  const p = buildControlTowerEvidence({
    tenantId, generatedAtMs: 1, pathwayPackets: [makePacket()], deviceAssessments: [deviceAssessment('eligible')],
  });
  const report = renderControlTowerReport(p, { mode: 'CLEAN' });
  assert.equal(report.grammar.issueCount, 0);
  assert.equal(report.generatedByModel, false);
  assert.equal(report.wordCount > 0, true);
});

test('cross-tenant packets, wrong kinds, guardrail violations, and duplicates fail closed', () => {
  const good = makePacket();
  assert.throws(() => buildControlTowerEvidence({
    tenantId: 'other-tenant', generatedAtMs: 1, pathwayPackets: [good], deviceAssessments: [],
  }), /cross-tenant/);
  assert.throws(() => buildControlTowerEvidence({
    tenantId, generatedAtMs: 1, pathwayPackets: [{ ...good, kind: 'OTHER' } as unknown as PathwayEvidencePacket], deviceAssessments: [],
  }), /unexpected packet kind/);
  assert.throws(() => buildControlTowerEvidence({
    tenantId, generatedAtMs: 1, pathwayPackets: [good, makePacket()], deviceAssessments: [],
  }), /duplicate/);
  assert.throws(() => buildControlTowerEvidence({
    tenantId, generatedAtMs: 1, pathwayPackets: [],
    deviceAssessments: [{ ...deviceAssessment('eligible'), localWorkerStarted: true } as unknown as DeviceAssessmentLike],
  }), /guardrails/);
});

test('policy bounds reject oversized surfaces', () => {
  const many = Array.from({ length: 101 }, () => makePacket());
  assert.throws(() => buildControlTowerEvidence({
    tenantId, generatedAtMs: 1, pathwayPackets: many, deviceAssessments: [],
  }), /too many/);
});