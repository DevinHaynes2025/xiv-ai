import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  gateConsequentialOps,
  probeLabelAccess,
  registerGovernedOpsBackbone,
} from './cognitive-operations-backbone';
import {
  bootstrapCognitiveOperationsBackbone,
  cognitiveOperationsBackboneOsHonesty,
} from './cognitive-operations-backbone-os';
import {
  ARCHITECTURE_TRANSLATIONS,
  AUTONOMY_BOUNDARY_DENIED,
  CLASSICAL_BASELINE_REQUIRED,
  COGNITIVE_OPERATIONS_BACKBONE_CYCLE,
  COMPRESSED_LOGICAL_MICRO_AGENTS,
  COMPUTE_ECONOMICS_ANALYTICAL,
  CONSEQUENTIAL_OPS_GATED,
  EG_LOCKS,
  ENERGY_NEQ_POWER_CONTROL,
  FEDERATED_BUNDLE_NOT_APPLIED,
  GENOME_NEQ_PROPRIETARY,
  GOVERNED_OPS_DENY_BY_DEFAULT,
  GPU_CHIP_NEQ_FAB,
  HONESTY_BANNER,
  HOSPITAL_PLANNING_HUMAN_GATES,
  ISOLATED_SIM_NEQ_LITERAL,
  LABEL_ALONE_NEQ_ACCESS,
  LAKEHOUSE_NOT_APPLIED,
  LEARNING_LOOP_RULES,
  MARKETING_NEQ_DECEPTIVE,
  MARKETING_NEQ_PUBLISH,
  MARKETING_NEQ_SPEND,
  NANO_SCALE_TARGET_NEQ_OWNERSHIP,
  NEQ_CLINICAL_AUTHORITY,
  NEQ_PHYSICAL_CONTROL,
  NEXT_PHASE_TITLE,
  OFFLINE_WAITING_OR_STOPPED,
  PRODUCT_PHILOSOPHY,
  SEMICONDUCTOR_AUTHORIZED_SOURCES,
  SIM_NEQ_FACT,
  STEALTH_INSTALL_DENIED,
  SYNTHETIC_NEQ_PHYSICAL_ATOM,
  TREND_NEQ_GUARANTEED_FUTURE,
  TWIN_NEQ_FOUNDER,
  WORMHOLE_EQ_ROUTING_SHORTCUT,
  predecessorMap,
  type EgActor,
} from './cognitive-operations-backbone-types';
import {
  buildCognitiveOperationsBackboneHealthReport,
  runCognitiveOperationsBackboneCycle,
} from './cognitive-operations-backbone-runtime';
import {
  adviseEnergySchedule,
  analyzeGpuChipQuant,
  denyAutonomousAction,
  denyStealthInstall,
  probeDigitalTwinAuthority,
  probeOfflineEnergyNode,
  runQuantumInspiredOpt,
} from './energy-aware-edge-cloud-runtime';
import {
  probeGenomeCopy,
  proposeFederatedDbBundle,
  proposeLakehouseCandidate,
} from './federated-database-bundles';
import {
  planHospitalEnterpriseOps,
  probeClinicalAuthority,
  probePhysicalHospitalControl,
} from './hospital-enterprise-operations-grid';
import {
  gateMarketingPublish,
  probeMarketingClaim,
  recommendMarketingCampaign,
} from './marketing-intelligence-team';
import {
  analyzeComputeEconomics,
  projectSemiconductorTrend,
  recordSemiconductorHistory,
} from './moores-law-semiconductor-history-cortex';
import {
  probeSimAsFact,
  registerIsolatedSimBranch,
  registerWormholeShortcut,
} from './multi-universe-simulation-network';
import {
  registerCompressedMicroAgent,
  registerNanoScaleTarget,
  registerSyntheticPopulation,
} from './nano-agent-simulation-fabric';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62leg-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: EgActor = {
  kind: 'cognitive_ops_curator',
  id: 'test-curator',
  orgId: 'org-eg',
  tenantId: 'tenant-eg',
  universeId: 'universe-eg',
};
const twinActor: EgActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      EG_LOCKS.L4_AUTONOMY_ENABLED === false &&
      EG_LOCKS.TIP_LAND === false &&
      EG_LOCKS.PHYSICAL_ATOM_AGENTS_CLAIMED === false &&
      EG_LOCKS.WORMHOLE_EQ_SPACETIME === false &&
      EG_LOCKS.UNIVERSE_EQ_LITERAL_REALITY === false &&
      EG_LOCKS.SIM_EQ_VERIFIED_FACT === false &&
      EG_LOCKS.TREND_EQ_GUARANTEED_FUTURE === false &&
      EG_LOCKS.CLINICAL_AUTHORITY_CLAIMED === false &&
      EG_LOCKS.MARKETING_AUTO_SPEND_ALLOWED === false &&
      EG_LOCKS.MARKETING_AUTO_PUBLISH_ALLOWED === false &&
      EG_LOCKS.ENERGY_EQ_UNAUTHORIZED_POWER_CONTROL === false &&
      EG_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
      EG_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false &&
      PRODUCT_PHILOSOPHY.compressedLogicalMicroAgentsOnly === true &&
      LEARNING_LOOP_RULES.trendNeqGuaranteedFuture === true &&
      COGNITIVE_OPERATIONS_BACKBONE_CYCLE.includes(
        'wormhole_eq_routing_cache_index_shortcut',
      ) &&
      ARCHITECTURE_TRANSLATIONS.atomSizedTrillionsOfAgentsMeans.includes(
        'compressed_logical',
      ) &&
      ARCHITECTURE_TRANSLATIONS.wormholesMeans.includes('routing') &&
      ARCHITECTURE_TRANSLATIONS.parallelUniversesMeans.includes(
        'isolated_simulation',
      ) &&
      NEXT_PHASE_TITLE.includes('62L-EH'),
    'locks + translations + cycle + next EH present',
  );

  const os = await bootstrapCognitiveOperationsBackbone({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_cognitive_operations_backbone',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.publicLaunchAuthorized === false &&
      (os.predecessorLayer === 'EE' ||
        os.predecessorLayer === 'ED' ||
        os.predecessorLayer === 'EF') &&
      (os.softWiredPredecessors.includes('EE') ||
        os.softWiredPredecessors.includes('ED') ||
        os.softWiredPredecessors.includes('EF')),
    `os=${os.id}; predecessor=${os.predecessorLayer}; soft=${os.softWiredPredecessors.join(',')}`,
  );

  // A
  const ops = await registerGovernedOpsBackbone({
    opsId: 'ops-ok',
    founderSealed: true,
    root,
    actor,
  });
  check(
    'governed_ops_backbone_deny_by_default',
    ops.status === 'ok' && ops.reason === GOVERNED_OPS_DENY_BY_DEFAULT,
    ops.reason,
  );
  const gate = await gateConsequentialOps({
    opsId: 'ops-ok',
    evidenceComplete: false,
    root,
    actor,
  });
  check(
    'consequential_ops_gated',
    gate.promoted === false &&
      gate.status === 'denied' &&
      gate.reason === CONSEQUENTIAL_OPS_GATED,
    gate.reason,
  );
  const label = await probeLabelAccess({
    label: 'ceo',
    claimAccessFromLabelAlone: true,
    root,
    actor,
  });
  check(
    'label_alone_neq_access',
    label.accessGranted === false &&
      label.status === 'denied' &&
      label.reason === LABEL_ALONE_NEQ_ACCESS,
    label.reason,
  );

  // B
  const hist = await recordSemiconductorHistory({
    topic: 'moores_law',
    sourceAuthorized: true,
    root,
    actor,
  });
  check(
    'semiconductor_history_authorized_sources',
    hist.status === 'ok' && hist.reason === SEMICONDUCTOR_AUTHORIZED_SOURCES,
    hist.reason,
  );
  const histDenied = await recordSemiconductorHistory({
    topic: 'rumor',
    sourceAuthorized: false,
    root,
    actor,
  });
  check(
    'unauthorized_source_denied',
    histDenied.status === 'denied',
    histDenied.reason,
  );
  const trend = await projectSemiconductorTrend({
    topic: 'density',
    claimGuaranteedFuture: true,
    root,
    actor,
  });
  check(
    'trend_neq_guaranteed_future',
    trend.guaranteed === false &&
      trend.status === 'denied' &&
      trend.reason === TREND_NEQ_GUARANTEED_FUTURE,
    trend.reason,
  );
  const econ = await analyzeComputeEconomics({
    subject: 'tco',
    claimFabControl: true,
    root,
    actor,
  });
  check(
    'compute_economics_analytical_only',
    econ.fabControlEnabled === false &&
      econ.status === 'denied' &&
      econ.reason === COMPUTE_ECONOMICS_ANALYTICAL,
    econ.reason,
  );

  // C — translations: micro-agents
  const microOk = await registerCompressedMicroAgent({
    agentClass: 'logical',
    representation: 'compressed_logical',
    root,
    actor,
  });
  check(
    'compressed_logical_micro_agents_only',
    microOk.physicalAtomAgents === false &&
      microOk.status === 'ok' &&
      microOk.reason === COMPRESSED_LOGICAL_MICRO_AGENTS,
    microOk.reason,
  );
  const microDeny = await registerCompressedMicroAgent({
    agentClass: 'atom',
    representation: 'physical_atom_claimed',
    root,
    actor,
  });
  check(
    'physical_atom_agent_claim_denied',
    microDeny.status === 'denied' && microDeny.physicalAtomAgents === false,
    microDeny.reason,
  );
  const pop = await registerSyntheticPopulation({
    populationId: 'p1',
    claimPhysicalAtomAgents: true,
    root,
    actor,
  });
  check(
    'synthetic_population_neq_physical_atom_agents',
    pop.physicalAtomAgents === false &&
      pop.status === 'denied' &&
      pop.reason === SYNTHETIC_NEQ_PHYSICAL_ATOM &&
      pop.translation ===
        ARCHITECTURE_TRANSLATIONS.atomSizedTrillionsOfAgentsMeans,
    pop.reason,
  );
  const scale = await registerNanoScaleTarget({
    targetLabel: 'trillions',
    claimCurrentOwnership: true,
    root,
    actor,
  });
  check(
    'nano_agent_scale_target_neq_ownership',
    scale.owned === false &&
      scale.status === 'denied' &&
      scale.reason === NANO_SCALE_TARGET_NEQ_OWNERSHIP,
    scale.reason,
  );

  // D — hospital ≠ clinical control
  const plan = await planHospitalEnterpriseOps({
    planId: 'hp1',
    humanGatePresent: true,
    root,
    actor,
  });
  check(
    'hospital_enterprise_planning_human_gates',
    plan.status === 'plan_only' &&
      plan.clinicalControlEnabled === false &&
      plan.physicalControlEnabled === false &&
      plan.reason === HOSPITAL_PLANNING_HUMAN_GATES,
    plan.reason,
  );
  const planDenied = await planHospitalEnterpriseOps({
    planId: 'hp2',
    humanGatePresent: false,
    root,
    actor,
  });
  check(
    'hospital_plan_without_human_gate_denied',
    planDenied.status === 'denied',
    planDenied.reason,
  );
  const clin = await probeClinicalAuthority({
    claimClinicalAuthority: true,
    root,
    actor,
  });
  check(
    'neq_clinical_authority',
    clin.clinicalAuthority === false &&
      clin.medicalAdviceAuthority === false &&
      clin.status === 'denied' &&
      clin.reason === NEQ_CLINICAL_AUTHORITY,
    clin.reason,
  );
  const phys = await probePhysicalHospitalControl({
    claimPhysicalControl: true,
    root,
    actor,
  });
  check(
    'neq_physical_control',
    phys.physicalControlEnabled === false &&
      phys.status === 'denied' &&
      phys.reason === NEQ_PHYSICAL_CONTROL,
    phys.reason,
  );

  // E — marketing ≠ spend/publish
  const spend = await recommendMarketingCampaign({
    campaignId: 'm1',
    autoSpendRequested: true,
    root,
    actor,
  });
  check(
    'marketing_recommend_neq_spend',
    spend.spent === false &&
      spend.status === 'denied' &&
      spend.reason === MARKETING_NEQ_SPEND,
    spend.reason,
  );
  const pub = await gateMarketingPublish({
    campaignId: 'm1',
    autoPublishRequested: true,
    root,
    actor,
  });
  check(
    'marketing_recommend_neq_publish',
    pub.published === false &&
      pub.status === 'denied' &&
      pub.reason === MARKETING_NEQ_PUBLISH,
    pub.reason,
  );
  const claim = await probeMarketingClaim({
    claimText: 'deceptive',
    deceptive: true,
    root,
    actor,
  });
  check(
    'marketing_neq_deceptive_claims',
    claim.status === 'denied' && claim.reason === MARKETING_NEQ_DECEPTIVE,
    claim.reason,
  );

  // F
  const bundle = await proposeFederatedDbBundle({
    bundleId: 'b1',
    kind: 'mini_server',
    root,
    actor,
  });
  check(
    'federated_bundle_candidates_not_applied',
    bundle.applied === false &&
      bundle.state === 'NOT_APPLIED' &&
      bundle.reason === FEDERATED_BUNDLE_NOT_APPLIED,
    bundle.reason,
  );
  const lake = await proposeLakehouseCandidate({
    lakehouseId: 'lh1',
    root,
    actor,
  });
  check(
    'lakehouse_candidate_not_applied',
    lake.applied === false && lake.reason === LAKEHOUSE_NOT_APPLIED,
    lake.reason,
  );
  const genome = await probeGenomeCopy({
    claimProprietaryCopy: true,
    root,
    actor,
  });
  check(
    'genome_neq_proprietary_copy',
    genome.proprietaryCopyAllowed === false &&
      genome.status === 'denied' &&
      genome.reason === GENOME_NEQ_PROPRIETARY,
    genome.reason,
  );

  // G — wormholes / universes translations + sim ≠ fact
  const branch = await registerIsolatedSimBranch({
    branchId: 'br1',
    claimLiteralUniverse: true,
    root,
    actor,
  });
  check(
    'isolated_sim_branches_neq_literal_universes',
    branch.literalUniverse === false &&
      branch.status === 'denied' &&
      branch.reason === ISOLATED_SIM_NEQ_LITERAL &&
      branch.translation === ARCHITECTURE_TRANSLATIONS.parallelUniversesMeans,
    branch.reason,
  );
  const branchOk = await registerIsolatedSimBranch({
    branchId: 'br2',
    claimLiteralUniverse: false,
    root,
    actor,
  });
  check(
    'isolated_sim_branch_ok',
    branchOk.status === 'isolated_sim' && branchOk.literalUniverse === false,
    branchOk.reason,
  );
  const wh = await registerWormholeShortcut({
    shortcutId: 'wh1',
    kind: 'index',
    claimSpacetimeWormhole: true,
    root,
    actor,
  });
  check(
    'wormhole_eq_routing_cache_index_shortcut',
    wh.spacetimeWormhole === false &&
      wh.status === 'denied' &&
      wh.reason === WORMHOLE_EQ_ROUTING_SHORTCUT &&
      wh.translation === ARCHITECTURE_TRANSLATIONS.wormholesMeans,
    wh.reason,
  );
  const whOk = await registerWormholeShortcut({
    shortcutId: 'wh2',
    kind: 'routing',
    claimSpacetimeWormhole: false,
    root,
    actor,
  });
  check(
    'wormhole_routing_shortcut_ok',
    whOk.status === 'routing_shortcut' && whOk.spacetimeWormhole === false,
    whOk.reason,
  );
  const sim = await probeSimAsFact({
    simId: 's1',
    claimVerifiedFact: true,
    root,
    actor,
  });
  check(
    'sim_neq_verified_fact',
    sim.verifiedFact === false &&
      sim.status === 'denied' &&
      sim.reason === SIM_NEQ_FACT,
    sim.reason,
  );

  // H
  const energy = await adviseEnergySchedule({
    scheduleId: 'e1',
    claimUnauthorizedPowerControl: true,
    root,
    actor,
  });
  check(
    'energy_schedule_recommend_neq_power_control',
    energy.powerControlEnabled === false &&
      energy.status === 'denied' &&
      energy.reason === ENERGY_NEQ_POWER_CONTROL,
    energy.reason,
  );
  const chip = await analyzeGpuChipQuant({
    subject: 'chip',
    claimFabControl: true,
    root,
    actor,
  });
  check(
    'gpu_chip_quant_advisory_neq_fab_control',
    chip.fabControlEnabled === false &&
      chip.status === 'denied' &&
      chip.reason === GPU_CHIP_NEQ_FAB,
    chip.reason,
  );
  const qi = await runQuantumInspiredOpt({
    name: 'qi1',
    quantumInspired: true,
    classicalBaselinePresent: false,
    root,
    actor,
  });
  check(
    'quantum_inspired_classical_baseline',
    qi.state === 'CLASSICAL_BASELINE_REQUIRED' &&
      qi.supremacyClaimed === false &&
      qi.reason === CLASSICAL_BASELINE_REQUIRED,
    qi.reason,
  );
  const offline = await probeOfflineEnergyNode({
    nodeId: 'n1',
    mode: 'stopped',
    root,
    actor,
  });
  check(
    'offline_waiting_or_stopped',
    offline.state === 'OFFLINE_STOPPED' &&
      offline.reason === OFFLINE_WAITING_OR_STOPPED,
    offline.reason,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'ef_ee_ed_soft_wire_probe',
    preds.EE.tipProbe === 'PRESENT' ||
      preds.ED.tipProbe === 'PRESENT' ||
      preds.EF.tipProbe === 'PRESENT',
    `EF=${preds.EF.tipProbe}/${preds.EF.report}; EE=${preds.EE.tipProbe}/${preds.EE.report}; ED=${preds.ED.tipProbe}/${preds.ED.report}`,
  );

  const stealth = await denyStealthInstall({
    attemptKind: 'stealth_install',
    root,
    actor,
  });
  check(
    'stealth_install_denied',
    stealth.status === 'denied' && stealth.reason === STEALTH_INSTALL_DENIED,
    stealth.reason,
  );
  const twinAuth = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  check(
    'digital_twin_neq_founder',
    twinAuth.status === 'denied' && twinAuth.reason === TWIN_NEQ_FOUNDER,
    twinAuth.reason,
  );
  const auto = await denyAutonomousAction({
    action: 'spend_money',
    root,
    actor,
  });
  check(
    'autonomy_boundary_no_freight_po_spend',
    auto.status === 'denied' && auto.reason === AUTONOMY_BOUNDARY_DENIED,
    auto.reason,
  );

  const cycle = await runCognitiveOperationsBackboneCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'runtime_cycle',
    failedHops.length === 0 &&
      cycle.productionAuthorized === false &&
      cycle.tipLand === false &&
      cycle.dbCandidatesApplied === false &&
      cycle.githubSotIssue === 151 &&
      cycle.gitlabCoordinationIssue === 84 &&
      cycle.architectureTranslations.wormholesMeans ===
        ARCHITECTURE_TRANSLATIONS.wormholesMeans,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildCognitiveOperationsBackboneHealthReport({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'health_report',
    health.status === 'HEALTHY' &&
      health.productionAuthorized === false &&
      health.dbCandidatesApplied === false &&
      health.nextPhaseTitle.includes('62L-EH'),
    `status=${health.status}; hops=${health.hopCount}`,
  );

  const honesty = cognitiveOperationsBackboneOsHonesty(repoRoot);
  check(
    'system_honesty',
    honesty.l4AutonomyEnabled === false &&
      honesty.dbCandidatesApplied === false &&
      honesty.physicalAtomAgentsClaimed === false &&
      honesty.wormholeEqSpacetime === false &&
      honesty.universeEqLiteralReality === false &&
      honesty.marketingAutoSpendAllowed === false &&
      honesty.clinicalAuthorityClaimed === false &&
      honesty.nextPhaseTitle.includes('62L-EH'),
    `predecessor=${honesty.predecessorLayer}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} stories:`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('ALL 62L-EG STORIES PASSED');
