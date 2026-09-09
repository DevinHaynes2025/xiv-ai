/**
 * 62L-EO5 — Quantum Evidence Boundary denial + honesty tests.
 *
 * Script: npm run test:62leo5
 * These tests MUST execute via `npm run test:62leo5`. Do not mark PASS without running.
 *
 * Covers: evidence class taxonomy; artifact fields; classical baseline gate;
 * proposal language gate; fabrication denies; sandbox / procurement / human
 * contract gates; L4=false; EO4 soft-wire probe.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ALLOWED_LANGUAGE_BY_EVIDENCE_CLASS,
  BLOCKED_PROPOSAL_PHRASES,
  CLASSICAL_BASELINE_FAMILIES,
  CLASSICAL_COMPARISON_DIMENSIONS,
  EO5_DB_CANDIDATES_STATUS,
  EO5_LOCKS,
  EO5_MAY,
  EO5_MUST_NOT,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  QUANTUM_EVIDENCE_ARTIFACT_FIELDS,
  QUANTUM_EVIDENCE_BOUNDARY_CYCLE,
  QUANTUM_EVIDENCE_CLASSES,
  assertEo5LocksIntact,
  eo5SoftWireSnapshot,
} from './quantum-evidence-boundary-types.ts';
import {
  attemptContractSubmission,
  attemptL4Autonomy,
  bootstrapQuantumEvidenceBoundary,
  createQuantumEvidenceArtifact,
  denyEvidenceClassConfusion,
  denyFabrication,
  findBlockedPhrases,
  gateClassicalBaselineBeforeImprovement,
  gateProcurementClaim,
  gateProposalLanguage,
  rewriteToAllowedLanguage,
  sandboxQuantumDemo,
} from './quantum-evidence-boundary-runtime.ts';
import type {
  ClassicalBaselineRecord,
  QuantumEvidenceArtifact,
} from './quantum-evidence-boundary-types.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function fullBaseline(): ClassicalBaselineRecord {
  return {
    present: true,
    families: [...CLASSICAL_BASELINE_FAMILIES],
    sameProblemDataset: true,
    comparisons: [...CLASSICAL_COMPARISON_DIMENSIONS],
    notes: 'Strong classical alternatives recorded on same problem/dataset.',
  };
}

function baseArtifact(
  overrides: Partial<QuantumEvidenceArtifact> = {},
): QuantumEvidenceArtifact {
  return {
    experimentId: 'exp-1',
    problemDefinition: 'routing optimization microbench',
    algorithm: 'qaoa-inspired heuristic',
    evidenceClass: 'QUANTUM_INSPIRED',
    dataset: 'toy-routes-v1',
    classicalBaseline: fullBaseline(),
    backendProvider: 'classical-local',
    hardwareQpu: null,
    runtime: '12ms',
    shotsOrIterations: 100,
    latency: '12ms',
    solutionQuality: '0.82',
    cost: '0',
    errorUncertainty: '±0.05',
    reproducibilitySeed: 'seed-42',
    evidenceRefs: ['bench://classical-v1'],
    verifiedAt: null,
    ...overrides,
  };
}

test('SoT label EO5; GitLab mirror not invented; next is EO6', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EO5');
  assert.match(GITHUB_SOT_TITLE, /Quantum Evidence Boundary/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EO6/);
  assert.match(NEXT_PHASE_TITLE, /Classical Baseline Requirement/);
});

test('honesty locks: L4 false + fabrication denies + DOCUMENTED≠…; DB NOT_APPLIED', () => {
  assert.equal(assertEo5LocksIntact(), true);
  assert.equal(EO5_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EO5_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EO5_LOCKS.TIP_LAND, false);
  assert.equal(EO5_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EO5_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EO5_LOCKS.FABRICATE_QPU_ACCESS, false);
  assert.equal(EO5_LOCKS.FABRICATE_FAULT_TOLERANCE, false);
  assert.equal(EO5_LOCKS.FABRICATE_QUANTUM_SUPREMACY, false);
  assert.equal(EO5_LOCKS.FABRICATE_QUANTUM_ADVANTAGE, false);
  assert.equal(EO5_LOCKS.FABRICATE_SECURITY_CLEARANCE, false);
  assert.equal(EO5_LOCKS.FABRICATE_GOVERNMENT_CERTIFICATION, false);
  assert.equal(EO5_LOCKS.FABRICATE_CLASSIFIED_ACCESS, false);
  assert.equal(EO5_LOCKS.FABRICATE_AGENCY_ENDORSEMENT, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);

  const l4 = attemptL4Autonomy();
  assert.equal(l4.state, 'DENIED');
  assert.equal(l4.l4Enabled, false);
});

test('required evidence classes taxonomy', () => {
  assert.deepEqual(
    [...QUANTUM_EVIDENCE_CLASSES],
    ['THEORETICAL', 'SIMULATED', 'QUANTUM_INSPIRED', 'PHYSICAL_QPU_VERIFIED'],
  );
});

test('artifact fields encoded + create contract', () => {
  for (const field of [
    'experimentId',
    'problemDefinition',
    'algorithm',
    'evidenceClass',
    'dataset',
    'classicalBaseline',
    'backendProvider',
    'hardwareQpu',
    'runtime',
    'shotsOrIterations',
    'latency',
    'solutionQuality',
    'cost',
    'errorUncertainty',
    'reproducibilitySeed',
    'evidenceRefs',
    'verifiedAt',
  ] as const) {
    assert.ok(QUANTUM_EVIDENCE_ARTIFACT_FIELDS.includes(field), field);
  }

  const ok = createQuantumEvidenceArtifact(baseArtifact());
  assert.ok(!('state' in ok));
  if (!('state' in ok)) {
    assert.equal(ok.evidenceClass, 'QUANTUM_INSPIRED');
  }

  const badPhysical = createQuantumEvidenceArtifact(
    baseArtifact({
      evidenceClass: 'PHYSICAL_QPU_VERIFIED',
      hardwareQpu: null,
      backendProvider: null,
      evidenceRefs: [],
      verifiedAt: null,
    }),
  );
  assert.equal('state' in badPhysical && badPhysical.state, 'DENIED');

  const goodPhysical = createQuantumEvidenceArtifact(
    baseArtifact({
      evidenceClass: 'PHYSICAL_QPU_VERIFIED',
      backendProvider: 'authorized-provider',
      hardwareQpu: 'qpu-lab-1',
      evidenceRefs: ['job://abc', 'result://abc'],
      verifiedAt: '2026-09-09T00:00:00.000Z',
    }),
  );
  assert.ok(!('state' in goodPhysical));
});

test('classical baseline gate: deny improvement without baseline; allow with full compare', () => {
  assert.ok(CLASSICAL_BASELINE_FAMILIES.includes('greedy_heuristic'));
  assert.ok(CLASSICAL_BASELINE_FAMILIES.includes('lp_ip'));
  assert.ok(CLASSICAL_BASELINE_FAMILIES.includes('constraint_programming'));
  assert.ok(CLASSICAL_BASELINE_FAMILIES.includes('graph_algorithms'));
  assert.ok(CLASSICAL_BASELINE_FAMILIES.includes('metaheuristics'));
  assert.ok(CLASSICAL_BASELINE_FAMILIES.includes('statistical_ml'));

  const noBaseline = gateClassicalBaselineBeforeImprovement({
    artifact: baseArtifact({
      classicalBaseline: {
        present: false,
        families: [],
        sameProblemDataset: false,
        comparisons: [],
      },
    }),
    claimImprovement: true,
  });
  assert.equal('state' in noBaseline && noBaseline.state, 'DENIED');
  if ('reason' in noBaseline) {
    assert.match(noBaseline.reason, /CLASSICAL_BASELINE_REQUIRED/);
  }

  const incompleteCompare = gateClassicalBaselineBeforeImprovement({
    artifact: baseArtifact({
      classicalBaseline: {
        present: true,
        families: ['greedy_heuristic'],
        sameProblemDataset: true,
        comparisons: ['solution_quality', 'runtime'],
      },
    }),
    claimImprovement: true,
  });
  assert.equal('state' in incompleteCompare && incompleteCompare.state, 'DENIED');

  const advantage = gateClassicalBaselineBeforeImprovement({
    artifact: baseArtifact(),
    claimImprovement: true,
    claimAdvantage: true,
  });
  assert.equal('state' in advantage && advantage.state, 'DENIED');
  if ('reason' in advantage) {
    assert.match(advantage.reason, /QUANTUM_ADVANTAGE/);
  }

  const ok = gateClassicalBaselineBeforeImprovement({
    artifact: baseArtifact(),
    claimImprovement: true,
  });
  assert.ok(!('state' in ok));
  if (!('state' in ok)) {
    assert.equal(ok.allowed, true);
    assert.equal(ok.advantageClaimed, false);
  }
});

test('proposal language gate: block advantage phrases; allow state templates', () => {
  assert.ok(BLOCKED_PROPOSAL_PHRASES.includes('quantum advantage achieved'));
  assert.match(ALLOWED_LANGUAGE_BY_EVIDENCE_CLASS.THEORETICAL, /researching a quantum formulation/);
  assert.match(
    ALLOWED_LANGUAGE_BY_EVIDENCE_CLASS.SIMULATED,
    /classical quantum simulator/,
  );
  assert.match(
    ALLOWED_LANGUAGE_BY_EVIDENCE_CLASS.QUANTUM_INSPIRED,
    /classical baselines/,
  );
  assert.match(
    ALLOWED_LANGUAGE_BY_EVIDENCE_CLASS.PHYSICAL_QPU_VERIFIED,
    /authorized physical quantum backend/,
  );

  const blocked = gateProposalLanguage({
    proposalText: 'Our team has quantum advantage achieved on this RFP.',
    evidenceClass: 'SIMULATED',
  });
  assert.equal(blocked.state, 'BLOCKED');
  assert.ok(findBlockedPhrases('quantum advantage achieved').length >= 1);

  const supremacy = gateProposalLanguage({
    proposalText: 'We demonstrated quantum supremacy last quarter.',
    evidenceClass: 'PHYSICAL_QPU_VERIFIED',
    hasRetainedPhysicalEvidence: true,
  });
  assert.equal(supremacy.state, 'BLOCKED');

  const ok = gateProposalLanguage({
    proposalText: rewriteToAllowedLanguage('QUANTUM_INSPIRED'),
    evidenceClass: 'QUANTUM_INSPIRED',
  });
  assert.equal(ok.state, 'PASS');

  for (const cls of QUANTUM_EVIDENCE_CLASSES) {
    const lang = gateProposalLanguage({
      proposalText: rewriteToAllowedLanguage(cls),
      evidenceClass: cls,
      hasRetainedPhysicalEvidence: cls === 'PHYSICAL_QPU_VERIFIED',
    });
    assert.equal(lang.state, 'PASS', cls);
  }
});

test('fabrication denies: QPU access, fault-tolerance, supremacy/advantage, clearance, cert, classified, endorsement', () => {
  const kinds = [
    'qpu_access',
    'fault_tolerance',
    'quantum_supremacy',
    'quantum_advantage',
    'security_clearance',
    'government_certification',
    'classified_access',
    'agency_endorsement',
  ] as const;

  for (const kind of kinds) {
    const denied = denyFabrication(kind);
    assert.equal(denied.state, 'DENIED');
    assert.equal(denied.executed, false);
  }

  assert.ok(EO5_MUST_NOT.includes('fabricate_qpu_access_fault_tolerance_supremacy_advantage'));
  assert.ok(
    EO5_MUST_NOT.includes('fabricate_clearance_certification_classified_agency_endorsement'),
  );
  assert.ok(EO5_MAY.includes('gate_proposal_language_by_evidence_class'));
});

test('evidence class confusion: SIMULATED ≠ PHYSICAL_QPU_VERIFIED', () => {
  const upgrade = denyEvidenceClassConfusion({
    claimed: 'PHYSICAL_QPU_VERIFIED',
    actual: 'SIMULATED',
  });
  assert.equal(upgrade.state, 'DENIED');

  const inspiredAsPhysical = denyEvidenceClassConfusion({
    claimed: 'PHYSICAL_QPU_VERIFIED',
    actual: 'QUANTUM_INSPIRED',
  });
  assert.equal(inspiredAsPhysical.state, 'DENIED');

  const ok = denyEvidenceClassConfusion({
    claimed: 'THEORETICAL',
    actual: 'SIMULATED',
  });
  assert.equal(ok.state, 'PASS');
});

test('government safeguards: sandboxed demos; procurement needs evidence; contracts human-approved', () => {
  const sandboxed = sandboxQuantumDemo({ demoId: 'demo-1' });
  assert.ok(!('state' in sandboxed));
  if (!('state' in sandboxed)) {
    assert.equal(sandboxed.status, 'SANDBOXED');
    assert.equal(sandboxed.productionAuthorized, false);
  }

  const unsandbox = sandboxQuantumDemo({ demoId: 'demo-2', attemptUnsandboxed: true });
  assert.equal(unsandbox.state, 'DENIED');

  const staleProcure = gateProcurementClaim({
    claimText: rewriteToAllowedLanguage('SIMULATED'),
    evidenceCurrent: false,
    evidenceClass: 'SIMULATED',
  });
  assert.equal(staleProcure.state, 'DENIED');

  const procure = gateProcurementClaim({
    claimText: rewriteToAllowedLanguage('SIMULATED'),
    evidenceCurrent: true,
    evidenceClass: 'SIMULATED',
  });
  assert.ok(!('state' in procure));
  if (!('state' in procure)) {
    assert.equal(procure.humanApprovalRequired, true);
  }

  const autoSubmit = attemptContractSubmission({ humanApproved: false });
  assert.ok('status' in autoSubmit);
  if ('status' in autoSubmit) {
    assert.equal(autoSubmit.status, 'HUMAN_APPROVAL_REQUIRED');
  }

  const human = attemptContractSubmission({ humanApproved: true });
  assert.ok('status' in human);
  if ('status' in human) {
    assert.equal(human.status, 'QUEUED_FOR_HUMAN');
  }
});

test('cycle covers taxonomy, baseline, language, fabrication, EO4 soft-wire hops', () => {
  for (const required of [
    'evidence_class_taxonomy',
    'artifact_fields_encoded',
    'classical_baseline_required',
    'deny_improvement_without_baseline',
    'allowed_language_by_state',
    'block_advantage_phrases',
    'language_gate_enforce',
    'deny_fabricate_qpu_access',
    'deny_fabricate_fault_tolerance',
    'deny_fabricate_supremacy_advantage',
    'deny_fabricate_clearance',
    'deny_fabricate_certification',
    'deny_fabricate_classified_access',
    'deny_fabricate_agency_endorsement',
    'quantum_demos_sandboxed',
    'procurement_claims_need_current_evidence',
    'contract_submissions_human_approved',
    'eo4_capability_matrix_soft_wire',
    'l4_autonomy_false',
  ] as const) {
    assert.ok(QUANTUM_EVIDENCE_BOUNDARY_CYCLE.includes(required), required);
  }
});

test('soft-wire EO4 PRESENT after rebase; classical baseline PRESENT on tip', () => {
  const snap = eo5SoftWireSnapshot(repoRoot);
  assert.equal(snap.eo4CapabilityMatrix.present, true);
  assert.equal(snap.eo4CapabilityMatrixReport.present, true);
  assert.match(snap.eo4CapabilityMatrix.note, /PRESENT/);
  // EO3/EO2 also present on EO4 lineage tip
  assert.equal(snap.eo3Watch.present, true);
  assert.equal(snap.eo2AgencyGraph.present, true);
  assert.equal(snap.classicalQuantBaseline.present, true);
  assert.equal(snap.enDealContractOs.present, true);
});

test('bootstrap cycle completes with locks intact + next EO6', () => {
  const boot = bootstrapQuantumEvidenceBoundary(repoRoot);
  assert.equal(boot.label, '62L-EO5');
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.l4AutonomyEnabled, false);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.evidenceClasses.length, 4);
  assert.ok(boot.artifactFields.length >= 17);
  assert.match(boot.nextPhase, /EO6/);
  assert.ok(boot.hops.length >= QUANTUM_EVIDENCE_BOUNDARY_CYCLE.length);
});
