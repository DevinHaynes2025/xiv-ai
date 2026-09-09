/**
 * 62L-EO GitHub #159 — Government Quantum AI Mission OS denial + honesty tests.
 *
 * Script: npm run test:62leo
 * Covers: no autonomous bids/pricing/spend/sign; logistics freight/PO/prod-change
 * denies; L4=false; Digital Twin≠founder; QPU evidence gates; NQI labels;
 * Starlink UNCONNECTED; SAM/FAR UNAVAILABLE; EM/EN soft-wire probes.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CFO_COUNCIL_ANALYSIS_SURFACES,
  EO_DB_CANDIDATES_STATUS,
  EO_LOCKS,
  EO_MAY,
  EO_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOVERNMENT_QUANTUM_AI_MISSION_OS_CYCLE,
  HONESTY_BANNER,
  MISSION_PACK_IDS,
  NEXT_PHASE_TITLE,
  NQI_RESEARCH_CONTEXT_LABELS,
  OPPORTUNITY_DECOMPOSITION_FACETS,
  OPPORTUNITY_JURISDICTIONS,
  QPU_EVIDENCE_STATES,
  assertEoLocksIntact,
  eoSoftWireSnapshot,
} from './government-quantum-ai-mission-os-types.ts';
import {
  adviseLogisticsModernization,
  attemptAutoCertifyRepresentAccept,
  attemptAutonomousBid,
  attemptAutonomousFreight,
  attemptAutonomousPricingCommitment,
  attemptAutonomousProductionChange,
  attemptAutonomousPurchaseOrder,
  attemptAutonomousSignContract,
  attemptAutonomousSpend,
  attemptDigitalTwinAsFounder,
  attemptL4Autonomy,
  bootstrapGovernmentQuantumAiMissionOs,
  decomposeGovOpportunity,
  listMissionPacks,
  nqiPartnershipLabel,
  probeFarResearchAdapter,
  probeSamGovAdapter,
  probeStarlinkAdapter,
  recommendAcceleratorRoute,
  registerGovContractsOpportunity,
  registerMissionPack,
  registerQuantumAgenticRd,
  requireHumanContractsApproval,
  runCfoDailyRevenueCouncil,
} from './government-quantum-ai-mission-os-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const analyst = {
  kind: 'contracts_analyst' as const,
  id: 'analyst-1',
  orgId: 'org-eo',
  tenantId: 'ten-eo',
  universeId: 'uni-eo',
  permissions: ['register_gov_opportunities', 'decompose'],
};

const human = {
  ...analyst,
  kind: 'human_approver' as const,
  id: 'human-1',
  permissions: ['approve_consequential', 'authorize_submission'],
};

const twin = {
  ...analyst,
  kind: 'digital_twin' as const,
  id: 'twin-1',
  permissions: ['recommend'],
};

test('SoT is GitHub #159; GitLab mirror not invented', () => {
  assert.equal(GITHUB_SOT_ISSUE, 159);
  assert.match(GITHUB_SOT_TITLE, /Government Quantum AI Mission OS/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EO1/);
});

test('honesty locks: L4 false + DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; DB NOT_APPLIED', () => {
  assert.equal(assertEoLocksIntact(), true);
  assert.equal(EO_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EO_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EO_LOCKS.TIP_LAND, false);
  assert.equal(EO_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EO_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EO_LOCKS.DOCUMENTED_EQ_IMPLEMENTED, false);
  assert.equal(EO_LOCKS.IMPLEMENTED_EQ_VERIFIED, false);
  assert.equal(EO_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);

  const l4 = attemptL4Autonomy();
  assert.equal(l4.state, 'DENIED');
  assert.equal(l4.l4Enabled, false);
});

test('hard autonomy denies: no bids / pricing commitments / spend / sign + may/must-not', () => {
  assert.equal(EO_LOCKS.AUTO_SEND_BID, false);
  assert.equal(EO_LOCKS.AUTO_PRICING_COMMITMENT, false);
  assert.equal(EO_LOCKS.AUTO_SPEND, false);
  assert.equal(EO_LOCKS.AUTO_SIGN_CONTRACT, false);

  const bid = attemptAutonomousBid();
  assert.equal(bid.state, 'DENIED');
  assert.equal(bid.executed, false);
  assert.equal(bid.autoBidSent, false);

  const price = attemptAutonomousPricingCommitment();
  assert.equal(price.state, 'DENIED');
  assert.equal(price.pricingCommitmentMade, false);

  const spend = attemptAutonomousSpend();
  assert.equal(spend.state, 'DENIED');
  assert.equal(spend.spendExecuted, false);

  const sign = attemptAutonomousSignContract();
  assert.equal(sign.state, 'DENIED');
  assert.equal(sign.contractSigned, false);

  assert.ok(EO_MAY.includes('cfo_daily_pipeline_pricing_renewals_analysis'));
  assert.ok(EO_MUST_NOT.includes('autonomously_send_bids'));
  assert.ok(EO_MUST_NOT.includes('make_pricing_commitments'));
  assert.ok(EO_MUST_NOT.includes('spend_money'));
  assert.ok(EO_MUST_NOT.includes('sign_contracts'));
});

test('cycle covers A–H mission OS hops', () => {
  for (const required of [
    'gov_contracts_command_center_register',
    'mission_pack_register',
    'qpu_evidence_gated',
    'quantum_agentic_rd_register',
    'classical_baseline_required',
    'no_quantum_advantage_without_evidence',
    'nqi_research_context_labels',
    'logistics_modernization_advise',
    'no_autonomous_freight',
    'no_autonomous_purchase_order',
    'no_autonomous_prod_change',
    'cfo_daily_revenue_council',
    'no_autonomous_bids',
    'no_autonomous_pricing_commitments',
    'no_autonomous_spend',
    'no_autonomous_sign_contracts',
    'en_deal_gov_contracting_soft_wire',
    'em1_em10_pricing_home_base_soft_wire',
    'starlink_unconnected_until_credentials',
    'digital_twin_neq_founder',
    'detected_neq_verified',
    'db_candidates_not_applied',
  ] as const) {
    assert.ok(GOVERNMENT_QUANTUM_AI_MISSION_OS_CYCLE.includes(required), required);
  }
});

test('A: Government Contracts Command Center registers + decomposes; human gate', () => {
  assert.deepEqual(
    [...OPPORTUNITY_JURISDICTIONS],
    ['federal', 'state', 'local', 'corporate', 'strategic_industry'],
  );
  assert.ok(OPPORTUNITY_DECOMPOSITION_FACETS.includes('requirements'));
  assert.ok(OPPORTUNITY_DECOMPOSITION_FACETS.includes('human_approvals'));
  assert.ok(OPPORTUNITY_DECOMPOSITION_FACETS.includes('contract_performance_tracking'));

  const opp = registerGovContractsOpportunity({
    opportunityId: 'gov-1',
    jurisdiction: 'federal',
    title: 'Federal logistics modernization RFP',
    actor: analyst,
  });
  assert.equal(opp.status, 'REGISTERED');
  assert.equal(opp.autoBidSent, false);
  assert.equal(opp.autoSigned, false);

  const decomposed = decomposeGovOpportunity(opp, 'requirements', ['R1', 'R2']);
  assert.equal(decomposed.status, 'DECOMPOSING');
  assert.deepEqual(decomposed.facets.requirements, ['R1', 'R2']);

  const denied = requireHumanContractsApproval({ opportunity: decomposed, actor: twin });
  assert.equal(denied.status, 'DENIED');

  const approved = requireHumanContractsApproval({ opportunity: decomposed, actor: human });
  assert.equal(approved.status, 'APPROVED_PACKAGE');
  if (approved.status === 'APPROVED_PACKAGE') {
    assert.equal(approved.authorizedSubmission, false);
  }
});

test('B: mission packs + QPU evidence-gated routing; DETECTED≠VERIFIED', () => {
  const packs = listMissionPacks();
  assert.equal(packs.length, MISSION_PACK_IDS.length);
  assert.ok(packs.every((p) => p.advisoryOnly === true && p.productionAuthorized === false));

  const quantum = registerMissionPack('quantum_ai');
  assert.equal(quantum.packId, 'quantum_ai');

  assert.deepEqual(
    [...QPU_EVIDENCE_STATES],
    ['PHYSICAL_QPU_VERIFIED', 'SIMULATED', 'QUANTUM_INSPIRED', 'THEORETICAL'],
  );

  const detectedClaim = recommendAcceleratorRoute({
    accelerator: 'QPU',
    qpuClaimedState: 'PHYSICAL_QPU_VERIFIED',
    detectedOnly: true,
    classicalBaselinePresent: true,
  });
  assert.equal('state' in detectedClaim && detectedClaim.state, 'DENIED');

  const noBaseline = recommendAcceleratorRoute({
    accelerator: 'QPU',
    qpuClaimedState: 'QUANTUM_INSPIRED',
    classicalBaselinePresent: false,
  });
  assert.equal('state' in noBaseline && noBaseline.state, 'DENIED');

  const okSim = recommendAcceleratorRoute({
    accelerator: 'QPU',
    qpuClaimedState: 'SIMULATED',
    classicalBaselinePresent: true,
  });
  assert.ok(!('state' in okSim));
  if (!('state' in okSim)) {
    assert.equal(okSim.verified, false);
    assert.equal(okSim.detectedEqualsVerified, false);
    assert.equal(okSim.mayExecuteAutonomously, false);
  }

  const cpu = recommendAcceleratorRoute({
    accelerator: 'CPU',
    classicalBaselinePresent: false,
  });
  assert.ok(!('state' in cpu));
});

test('C: Quantum/Agentic R&D — classical baseline + NQI research context; no fake advantage', () => {
  assert.equal(NQI_RESEARCH_CONTEXT_LABELS.officialPartnershipClaimed, false);
  assert.equal(nqiPartnershipLabel(), 'RESEARCH_CONTEXT');

  const noBaseline = registerQuantumAgenticRd({
    programId: 'qrd-1',
    title: 'No baseline',
    classicalBaselineAttached: false,
  });
  assert.equal('state' in noBaseline && noBaseline.state, 'DENIED');

  const fakeAdv = registerQuantumAgenticRd({
    programId: 'qrd-2',
    title: 'Fake advantage',
    classicalBaselineAttached: true,
    claimQuantumAdvantage: true,
  });
  assert.equal('state' in fakeAdv && fakeAdv.state, 'DENIED');
  if ('quantumAdvantageClaimed' in fakeAdv) {
    assert.equal(fakeAdv.quantumAdvantageClaimed, false);
  }

  const fakePartner = registerQuantumAgenticRd({
    programId: 'qrd-3',
    title: 'Fake NQI partnership',
    classicalBaselineAttached: true,
    claimOfficialPartnership: true,
  });
  assert.equal('state' in fakePartner && fakePartner.state, 'DENIED');

  const ok = registerQuantumAgenticRd({
    programId: 'qrd-4',
    title: 'NQI-aware classical-first R&D',
    classicalBaselineAttached: true,
  });
  assert.ok(!('state' in ok));
  if (!('state' in ok)) {
    assert.equal(ok.partnershipClaim, 'RESEARCH_CONTEXT');
    assert.equal(ok.quantumAdvantageClaimed, false);
    assert.deepEqual([...ok.nqiAgencies], ['NIST', 'NSF', 'DOE']);
  }
});

test('D: logistics advisory; deny freight / PO / prod-change', () => {
  const advice = adviseLogisticsModernization({
    topic: 'supply-chain resilience',
    recommendations: ['dual-source critical SKUs', 'buffer advisory'],
  });
  assert.equal(advice.status, 'ADVISORY_ONLY');
  assert.equal(advice.autoFreight, false);
  assert.equal(advice.autoPurchaseOrder, false);
  assert.equal(advice.autoProductionChange, false);

  const freight = attemptAutonomousFreight();
  assert.equal(freight.state, 'DENIED');
  assert.equal(freight.autoFreight, false);

  const po = attemptAutonomousPurchaseOrder();
  assert.equal(po.state, 'DENIED');
  assert.equal(po.autoPurchaseOrder, false);

  const prod = attemptAutonomousProductionChange();
  assert.equal(prod.state, 'DENIED');
  assert.equal(prod.autoProductionChange, false);
});

test('E: CFO Daily Revenue Council analyzes; cannot bid/price/spend/sign', () => {
  const council = runCfoDailyRevenueCouncil({
    notes: { pipeline: 'Q3 pipeline advisory' },
  });
  assert.equal(council.status, 'ADVISORY_ONLY');
  assert.equal(council.l4AutonomyEnabled, false);
  assert.equal(council.autoBidSent, false);
  assert.equal(council.pricingCommitmentMade, false);
  assert.equal(council.spendExecuted, false);
  assert.equal(council.contractSigned, false);
  for (const surface of CFO_COUNCIL_ANALYSIS_SURFACES) {
    assert.ok(surface in council.analyses, surface);
  }
  assert.match(council.analyses.pipeline, /Q3 pipeline advisory/);
});

test('F/G: EN SAM/FAR UNAVAILABLE; Starlink UNCONNECTED; no auto certify/represent/accept', () => {
  const sam = probeSamGovAdapter();
  assert.equal(sam.status, 'UNAVAILABLE');
  assert.equal(sam.configured, false);

  const far = probeFarResearchAdapter();
  assert.equal(far.status, 'UNAVAILABLE');

  const certify = attemptAutoCertifyRepresentAccept();
  assert.equal(certify.state, 'DENIED');
  assert.equal(certify.autoCertified, false);
  assert.equal(certify.autoRepresented, false);
  assert.equal(certify.autoAccepted, false);

  const starlink = probeStarlinkAdapter();
  assert.ok('status' in starlink);
  if ('status' in starlink) {
    assert.equal(starlink.status, 'UNCONNECTED');
    assert.equal(starlink.liveControl, false);
  }

  const fakeConnect = probeStarlinkAdapter({ claimConnectedWithoutCredentials: true });
  assert.equal(fakeConnect.state, 'DENIED');

  const sat = probeStarlinkAdapter({ attemptSatelliteControl: true });
  assert.equal(sat.state, 'DENIED');

  const vehicle = probeStarlinkAdapter({ attemptVehicleControl: true });
  assert.equal(vehicle.state, 'DENIED');
});

test('H: Digital Twin ≠ founder; recommend ≠ charge/deploy/spend/sign', () => {
  assert.equal(EO_LOCKS.DIGITAL_TWIN_EQ_FOUNDER, false);
  for (const action of ['charge', 'deploy', 'spend', 'sign', 'approve'] as const) {
    const result = attemptDigitalTwinAsFounder({ actor: twin, action });
    assert.equal(result.state, 'DENIED');
    assert.equal(result.executed, false);
    assert.match(result.reason, /DIGITAL_TWIN_NEQ_FOUNDER/);
  }
});

test('soft-wire EM1/EM10/#157 + EN PRESENT on EO2/EN base; classical baseline PRESENT', () => {
  const snap = eoSoftWireSnapshot(repoRoot);
  assert.equal(snap.em1HomeBase.present, true);
  assert.equal(snap.em10UserAccessEconomy.present, true);
  assert.equal(snap.em9MarketSimulator.present, true);
  assert.equal(snap.em3Registry.present, true);
  assert.equal(snap.classicalQuantBaseline.present, true);
  assert.equal(snap.em157HomeBase.present, true);
  assert.equal(snap.starlinkAdapterSurface.present, true);
  // Rebased onto EO2 tip containing sealed EN #158
  assert.equal(snap.enDealContractRuntime.present, true);
  assert.equal(snap.enDealContractOs.present, true);
  assert.equal(snap.enReport.present, true);
});

test('bootstrap cycle completes with locks intact + CFO denies encoded', () => {
  const boot = bootstrapGovernmentQuantumAiMissionOs(repoRoot);
  assert.equal(boot.sotIssue, 159);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.cfoCouncil.status, 'ADVISORY_ONLY');
  assert.equal(boot.sam.status, 'UNAVAILABLE');
  assert.equal(boot.far.status, 'UNAVAILABLE');
  assert.ok(boot.hops.length >= GOVERNMENT_QUANTUM_AI_MISSION_OS_CYCLE.length - 5);
  assert.match(boot.nextPhase, /EO1/);
  assert.equal(boot.nqi.officialPartnershipClaimed, false);
});
