/**
 * 62L-EO4 — AI & Quantum Capability Matrix denial + honesty tests.
 *
 * Script: npm run test:62leo4
 * Covers: mapping labels, multi-echelon fixture, proposal language gate,
 * auto-flags, sell-ahead denial, L4 false, soft-wires.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AI_QUANTUM_CAPABILITY_MATRIX_CYCLE,
  AUTO_FLAG_KINDS,
  BLOCKED_PROPOSAL_PHRASES,
  CAPABILITY_MAPPING_LABELS,
  CAPABILITY_RECORD_FIELDS,
  EO4_DB_CANDIDATES_STATUS,
  EO4_LOCKS,
  EO4_MAY,
  EO4_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PROPOSAL_LANGUAGE_BY_EVIDENCE,
  QUANTUM_EVIDENCE_LABELS,
  assertEo4LocksIntact,
  eo4SoftWireSnapshot,
} from './ai-quantum-capability-matrix-types.ts';
import {
  attemptAutoBid,
  attemptAutoCertify,
  attemptAutoSubmission,
  attemptEo3SolicitationDrivenUpgrade,
  attemptSellAheadOfEvidence,
  autoFlagKindsCovered,
  bootstrapAiQuantumCapabilityMatrix,
  buildMultiEchelonLogisticsFixture,
  evaluateAutoFlags,
  gateProposalLanguage,
  getCapabilitiesForRequirement,
  listCapabilityMatrix,
  registerCapabilityRecord,
  requireHumanTechnicalReview,
  resetCapabilityMatrix,
  runCapabilityMatrixCycle,
} from './ai-quantum-capability-matrix-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const proposalAgent = {
  kind: 'proposal_agent' as const,
  id: 'prop-1',
  orgId: 'org-eo4',
  tenantId: 'ten-eo4',
  universeId: 'uni-eo4',
  permissions: ['draft_proposal_language'],
};

const humanReviewer = {
  kind: 'technical_reviewer' as const,
  id: 'rev-1',
  orgId: 'org-eo4',
  tenantId: 'ten-eo4',
  universeId: 'uni-eo4',
  permissions: ['technical_review'],
};

test('SoT is GitHub #159 EO family; GitLab mirror not invented; next is EO5', () => {
  assert.equal(GITHUB_SOT_ISSUE, 159);
  assert.match(GITHUB_SOT_TITLE, /EO4 AI & Quantum Capability Matrix/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EO5 — Quantum Evidence Boundary/);
});

test('honesty locks: L4 false + sell-ahead false + theoretical≠operational; DB NOT_APPLIED', () => {
  assert.equal(assertEo4LocksIntact(), true);
  assert.equal(EO4_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EO4_LOCKS.SELL_AHEAD_OF_EVIDENCE, false);
  assert.equal(EO4_LOCKS.THEORETICAL_EQ_OPERATIONAL, false);
  assert.equal(EO4_LOCKS.AUTO_SUBMISSION, false);
  assert.equal(EO4_LOCKS.DB_CANDIDATES_APPLIED, false);
  assert.equal(EO4_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EO4_LOCKS.TIP_LAND, false);
  assert.equal(EO4_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EO4_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EO4_LOCKS.GUARDIAN_BYPASSED, false);
  assert.equal(EO4_LOCKS.RLS_BYPASSED, false);
  assert.equal(EO4_LOCKS.TENANT_SCOPE_MUTATED, false);
  assert.equal(EO4_LOCKS.UNIVERSE_SCOPE_MUTATED, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('mapping + quantum labels + capability record fields inventory', () => {
  assert.deepEqual([...CAPABILITY_MAPPING_LABELS], [
    'VERIFIED',
    'SUPPORTED',
    'CANDIDATE',
    'NOT_AVAILABLE',
  ]);
  assert.deepEqual([...QUANTUM_EVIDENCE_LABELS], [
    'PHYSICAL_QPU_VERIFIED',
    'SIMULATED',
    'QUANTUM_INSPIRED',
    'THEORETICAL',
  ]);
  for (const field of [
    'requirementId',
    'capabilityName',
    'xivModuleService',
    'evidenceState',
    'hardwareRuntimeDependency',
    'benchmarkTestEvidence',
    'classicalBaseline',
    'securityComplianceDependencies',
    'staffingPartnerDependency',
    'dataRequirements',
    'knownLimitations',
    'prototypeReadiness',
    'productionReadiness',
    'evidenceOwner',
    'lastVerifiedDate',
  ] as const) {
    assert.ok(CAPABILITY_RECORD_FIELDS.includes(field), field);
  }
});

test('fixture: multi-echelon military logistics mapping', () => {
  resetCapabilityMatrix();
  const rows = getCapabilitiesForRequirement(
    'optimize_multi_echelon_military_logistics',
  );
  assert.ok(rows.length >= 4);

  const classical = rows.find((r) => r.capabilityName === 'Classical OR optimization');
  assert.ok(classical);
  assert.equal(classical!.evidenceState, 'SUPPORTED');

  const agentic = rows.find((r) => r.capabilityName === 'Agentic scenario decomposition');
  assert.ok(agentic);
  assert.equal(agentic!.evidenceState, 'CANDIDATE');

  const agenticSupported = buildMultiEchelonLogisticsFixture({
    agenticTestsPassed: true,
  }).find((r) => r.capabilityName === 'Agentic scenario decomposition');
  assert.equal(agenticSupported!.evidenceState, 'SUPPORTED');

  const qi = rows.find((r) => r.capabilityName === 'Quantum-inspired optimization');
  assert.ok(qi);
  assert.equal(qi!.quantumEvidenceState, 'QUANTUM_INSPIRED');
  assert.equal(qi!.evidenceState, 'CANDIDATE');

  const sim = rows.find((r) =>
    r.capabilityName.includes('simulated backend'),
  );
  assert.ok(sim);
  assert.equal(sim!.quantumEvidenceState, 'SIMULATED');

  const qpu = rows.find((r) => r.capabilityName === 'Physical QPU execution');
  assert.ok(qpu);
  assert.equal(qpu!.evidenceState, 'NOT_AVAILABLE');
  assert.equal(qpu!.quantumEvidenceState, 'THEORETICAL');

  const qpuWithBackend = buildMultiEchelonLogisticsFixture({
    physicalQpuBackendEvidence: true,
  }).find((r) => r.capabilityName === 'Physical QPU execution');
  assert.notEqual(qpuWithBackend!.evidenceState, 'NOT_AVAILABLE');
});

test('proposal language gate: allow matrix-supported language; deny unsupported', () => {
  resetCapabilityMatrix();

  const allowed = gateProposalLanguage({
    requirementId: 'optimize_multi_echelon_military_logistics',
    capabilityName: 'Classical OR optimization',
    proposedLanguage: 'supported classical capability for multi-echelon routing',
    actor: proposalAgent,
  });
  assert.equal(allowed.state, 'ALLOWED');
  if (allowed.state === 'ALLOWED') {
    assert.equal(allowed.supportingEvidence, 'SUPPORTED');
    assert.equal(allowed.executed, false);
  }

  const denyOverclaim = gateProposalLanguage({
    requirementId: 'optimize_multi_echelon_military_logistics',
    capabilityName: 'Classical OR optimization',
    proposedLanguage: 'production-authorized quantum advantage for logistics',
    actor: proposalAgent,
  });
  assert.equal(denyOverclaim.state, 'DENIED');
  if (denyOverclaim.state === 'DENIED') {
    assert.equal(denyOverclaim.flag.kind, 'unsupported_proposal_language');
  }

  const denyQpu = gateProposalLanguage({
    requirementId: 'optimize_multi_echelon_military_logistics',
    capabilityName: 'Physical QPU execution',
    proposedLanguage: 'we deliver quantum optimization at scale',
    actor: proposalAgent,
  });
  assert.equal(denyQpu.state, 'DENIED');

  const denyNaOperational = gateProposalLanguage({
    requirementId: 'optimize_multi_echelon_military_logistics',
    capabilityName: 'Physical QPU execution',
    proposedLanguage: 'verified operational delivery on physical QPU',
    actor: proposalAgent,
  });
  assert.equal(denyNaOperational.state, 'DENIED');

  const allowNaHonest = gateProposalLanguage({
    requirementId: 'optimize_multi_echelon_military_logistics',
    capabilityName: 'Physical QPU execution',
    proposedLanguage: 'not available — cannot claim operational delivery',
    actor: proposalAgent,
  });
  assert.equal(allowNaHonest.state, 'ALLOWED');

  for (const phrase of BLOCKED_PROPOSAL_PHRASES) {
    const blocked = gateProposalLanguage({
      requirementId: 'optimize_multi_echelon_military_logistics',
      capabilityName: 'Classical OR optimization',
      proposedLanguage: `Proposal claims ${phrase} today`,
      actor: proposalAgent,
    });
    assert.equal(blocked.state, 'DENIED', phrase);
  }

  assert.ok(PROPOSAL_LANGUAGE_BY_EVIDENCE.SUPPORTED.length > 0);
  assert.ok(PROPOSAL_LANGUAGE_BY_EVIDENCE.NOT_AVAILABLE.length > 0);
});

test('critical: never sell ahead of evidence — theoretical ≠ operational', () => {
  const denied = attemptSellAheadOfEvidence({
    claim: 'operational quantum logistics optimizer',
    evidenceState: 'CANDIDATE',
    quantumEvidenceState: 'THEORETICAL',
  });
  assert.equal(denied.state, 'DENIED');
  assert.equal(denied.executed, false);
  assert.equal(denied.sellAhead, false);
  assert.match(denied.reason, /SELL_AHEAD_OF_EVIDENCE/);
  assert.ok(EO4_MUST_NOT.includes('sell_ahead_of_evidence'));
  assert.ok(EO4_MUST_NOT.includes('present_theoretical_as_operational'));
});

test('auto-flags cover all required kinds', () => {
  assert.deepEqual([...autoFlagKindsCovered()], [...AUTO_FLAG_KINDS]);

  resetCapabilityMatrix();
  const fixtureFlags = evaluateAutoFlags();
  const kindsSeen = new Set(fixtureFlags.map((f) => f.kind));
  assert.ok(kindsSeen.has('requirements_needing_human_technical_review'));
  assert.ok(kindsSeen.has('unverified_partner_dependencies'));
  assert.ok(kindsSeen.has('hardware_assumptions'));

  // Force each remaining flag via synthetic records
  const synthetic = [
    {
      ...buildMultiEchelonLogisticsFixture()[0]!,
      capabilityName: 'Stale verified facet',
      evidenceState: 'VERIFIED' as const,
      lastVerifiedDate: '2020-01-01T00:00:00.000Z',
      benchmarkTestEvidence: 'old suite',
      securityComplianceDependencies: 'tenant-scoped',
      productionReadiness: 'NOT_AUTHORIZED' as const,
    },
    {
      ...buildMultiEchelonLogisticsFixture()[0]!,
      capabilityName: 'Missing evidence facet',
      evidenceState: 'SUPPORTED' as const,
      benchmarkTestEvidence: 'no physical qpu backend evidence',
      lastVerifiedDate: null,
    },
    {
      ...buildMultiEchelonLogisticsFixture()[0]!,
      capabilityName: 'Cert gap facet',
      evidenceState: 'VERIFIED' as const,
      lastVerifiedDate: new Date().toISOString(),
      securityComplianceDependencies: 'tenant-scoped only',
      productionReadiness: 'PRODUCTION_AUTHORIZED' as const,
    },
    {
      ...buildMultiEchelonLogisticsFixture()[0]!,
      capabilityName: 'Hardware assumption facet',
      evidenceState: 'VERIFIED' as const,
      lastVerifiedDate: new Date().toISOString(),
      hardwareRuntimeDependency: 'QPU assumed',
      knownLimitations: 'unverified hardware assumption',
      securityComplianceDependencies: 'certification pending review',
    },
    {
      ...buildMultiEchelonLogisticsFixture()[2]!,
      capabilityName: 'Quantum without classical',
      classicalBaseline: 'none',
      quantumEvidenceState: 'QUANTUM_INSPIRED' as const,
      evidenceState: 'CANDIDATE' as const,
    },
  ];

  const forced = evaluateAutoFlags({ records: synthetic });
  const forcedKinds = new Set(forced.map((f) => f.kind));
  for (const kind of AUTO_FLAG_KINDS) {
    if (kind === 'unsupported_proposal_language') {
      // covered by gateProposalLanguage tests
      continue;
    }
    assert.ok(forcedKinds.has(kind) || kindsSeen.has(kind), `auto-flag ${kind}`);
  }

  // unsupported_proposal_language via gate
  const langDeny = gateProposalLanguage({
    requirementId: 'optimize_multi_echelon_military_logistics',
    capabilityName: 'Classical OR optimization',
    proposedLanguage: 'operational quantum advantage',
    actor: proposalAgent,
  });
  assert.equal(langDeny.state, 'DENIED');
  if (langDeny.state === 'DENIED') {
    assert.equal(langDeny.flag.kind, 'unsupported_proposal_language');
  }
});

test('autonomy denies: no auto submission/certify/bid; EO3 watch cannot upgrade', () => {
  const submit = attemptAutoSubmission();
  assert.equal(submit.state, 'DENIED');
  assert.equal(submit.autoSubmitted, false);

  const certify = attemptAutoCertify();
  assert.equal(certify.state, 'DENIED');
  assert.equal(certify.autoCertified, false);

  const bid = attemptAutoBid();
  assert.equal(bid.state, 'DENIED');
  assert.equal(bid.autoBid, false);

  const upgrade = attemptEo3SolicitationDrivenUpgrade({
    from: 'CANDIDATE',
    to: 'VERIFIED',
  });
  assert.equal(upgrade.state, 'DENIED');
  assert.equal(upgrade.upgraded, false);
  assert.equal(EO4_LOCKS.EO3_WATCH_SOLICITATION_DRIVEN_UPGRADE, false);

  const reviewDenied = requireHumanTechnicalReview(proposalAgent, 'req-1');
  assert.equal(reviewDenied.state, 'DENIED');

  const reviewOk = requireHumanTechnicalReview(
    humanReviewer,
    'optimize_multi_echelon_military_logistics',
  );
  assert.equal(reviewOk.state, 'APPROVED');

  assert.ok(EO4_MAY.includes('gate_proposal_language_to_matrix'));
  assert.ok(EO4_MUST_NOT.includes('auto_submit_proposals_or_bids'));
});

test('registerCapabilityRecord denies PHYSICAL_QPU_VERIFIED without backend evidence', () => {
  resetCapabilityMatrix();
  const denied = registerCapabilityRecord({
    requirementId: 'optimize_multi_echelon_military_logistics',
    capabilityName: 'Bogus physical QPU',
    xivModuleService: 'none',
    evidenceState: 'VERIFIED',
    hardwareRuntimeDependency: 'QPU',
    benchmarkTestEvidence: 'no physical qpu backend evidence',
    classicalBaseline: 'classical OR',
    securityComplianceDependencies: 'none',
    staffingPartnerDependency: 'none',
    dataRequirements: 'none',
    knownLimitations: 'none',
    prototypeReadiness: 'LAB_ONLY',
    productionReadiness: 'NOT_AUTHORIZED',
    evidenceOwner: 'test',
    lastVerifiedDate: null,
    quantumEvidenceState: 'PHYSICAL_QPU_VERIFIED',
  });
  assert.equal(denied.state, 'DENIED');
});

test('cycle covers matrix + gate + auto-flags + soft-wires; EN/classical present', () => {
  const boot = bootstrapAiQuantumCapabilityMatrix(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.guardianRlsTenantUniverseUnchanged, true);
  assert.ok(boot.matrixSize >= 4);

  for (const required of AI_QUANTUM_CAPABILITY_MATRIX_CYCLE) {
    assert.ok(
      boot.hops.some((h) => h.hop === required),
      `missing hop ${required}`,
    );
  }

  const soft = eo4SoftWireSnapshot(repoRoot);
  assert.equal(soft.enDealOs.present, true);
  assert.equal(soft.enReport.present, true);
  assert.equal(soft.classicalQuantBaseline.present, true);
  assert.equal(soft.emCapabilityTruth.present, true);
  // Preferred predecessor EO3 watch PRESENT on this tip; presence ≠ VERIFIED
  assert.equal(soft.eo3Watch.present, true);
  assert.equal(soft.eo3Report.present, true);
  assert.equal(typeof soft.eo1CommandCenter.present, 'boolean');
  assert.equal(EO4_LOCKS.PRESENCE_EQ_VERIFIED, false);

  const hops = runCapabilityMatrixCycle(repoRoot);
  assert.ok(hops.length >= AI_QUANTUM_CAPABILITY_MATRIX_CYCLE.length);
  assert.ok(listCapabilityMatrix().length > 0);
});
