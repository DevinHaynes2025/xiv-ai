import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { sendSignedMemoryHop } from './agent-memory-highway';
import {
  claimTwinAccuracy,
  probeTwinPhysicalControl,
  runCalibratedTwinSimulation,
} from './digital-twin-simulation-factory';
import {
  evaluateBroaderIndustryGate,
  registerIndustryPack,
} from './global-industry-knowledge-graph';
import { accessVaultEntry, storeEncryptedKnowledge } from './personal-knowledge-vault';
import {
  attemptEdgeRemoteControl,
  claimHardwareSupport,
  probeChipRunningVerified,
} from './semiconductor-edge-compute-control-tower';
import {
  accessSealedNeuralNode,
  createNeuralSuperbrainNode,
  openMultimodalSession,
  probeAdultTrustCircle,
  probeCovertSurveillance,
  probeDigitalTwinAuthority,
  probeOfflineNeuralNode,
  probeRunningVerified,
} from './secure-multimodal-experience-layer';
import {
  probeSupplyChainProvider,
  recommendSupplyChainAction,
  requireSupplyChainHumanGate,
} from './supply-chain-superbrain-core';
import {
  bootstrapSupplyChainSuperbrainOs,
  supplyChainSuperbrainOsHonesty,
} from './supply-chain-superbrain';
import {
  ACCURACY_PROOF_REQUIRED,
  BIOMETRIC_DEFAULTS_OFF,
  CHIP_HEARTBEAT_REQUIRED,
  COVERT_DENIED,
  DB_CANDIDATES_NOT_APPLIED,
  DQ_NEQ_LIVE_MIGRATION,
  DW_LOCKS,
  EDGE_NEQ_REMOTE,
  HARDWARE_PROOF_REQUIRED,
  HEARTBEAT_REQUIRED,
  HONESTY_BANNER,
  INDUSTRY_BEHIND_PILOT,
  LAKEHOUSE_DDL_NEQ_AUTO,
  MINORS_DENIED,
  NEURAL_SEALED_DENIED,
  NEXT_PHASE_TITLE,
  OFFLINE_WAITING_OR_STOPPED,
  PRODUCT_PHILOSOPHY,
  SC_ADVISORY_NEQ_DEPLOY,
  SC_HUMAN_GATE_REQUIRED,
  SIM_NEQ_FACT,
  SUPPLY_CHAIN_SUPERBRAIN_CYCLE,
  TWIN_NEQ_FOUNDER,
  TWIN_NEQ_PHYSICAL,
  UNCONFIGURED_SC_PROVIDER,
  UNENROLLED_PEER,
  UNSIGNED_HIGHWAY,
  VAULT_CROSS_CONTEXT,
  VAULT_ENCRYPTED,
  WEDGE_FIRST_GATED,
  predecessorMap,
  type DwActor,
} from './supply-chain-superbrain-types';
import {
  buildSupplyChainSuperbrainHealthReport,
  runSupplyChainSuperbrainCycle,
} from './supply-chain-superbrain-runtime';
import {
  probeDbCandidatesApplied,
  proposeLakehouseDdl,
  runDataQualityAgent,
} from './universal-data-lakehouse-os';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldw-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DwActor = {
  kind: 'supply_chain_curator',
  id: 'test-curator',
  orgId: 'org-dw',
  tenantId: 'tenant-dw',
  universeId: 'universe-dw',
};
const agentActor: DwActor = { ...actor, kind: 'agent', id: 'agent-1' };
const twinActor: DwActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      DW_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DW_LOCKS.TIP_LAND === false &&
      DW_LOCKS.RECOMMENDATION_EQ_CHARGE === false &&
      DW_LOCKS.BROADER_INDUSTRY_BEFORE_SUPPLY_CHAIN_PILOT === false &&
      DW_LOCKS.BIOMETRIC_CAMERA_DEFAULT_ON === false &&
      PRODUCT_PHILOSOPHY.wedgeFirstSupplyChainPilot === true &&
      SUPPLY_CHAIN_SUPERBRAIN_CYCLE.includes('sc_advisory_neq_deploy_spend'),
    'locks + philosophy + cycle present',
  );

  const os = await bootstrapSupplyChainSuperbrainOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_supply_chain_superbrain',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.predecessorLayer === 'DT',
    `os=${os.id}; predecessor=${os.predecessorLayer}`,
  );

  // A
  const advisory = await recommendSupplyChainAction({
    nodeKind: 'warehouse',
    summary: 'slotting advisory',
    attemptDeploySpend: true,
    root,
    actor,
  });
  check(
    'sc_advisory_neq_deploy_spend',
    advisory.deploysSpend === false &&
      advisory.chargesCustomer === false &&
      advisory.status === 'recommendation_only' &&
      advisory.reason === SC_ADVISORY_NEQ_DEPLOY,
    advisory.reason,
  );

  const gate = await requireSupplyChainHumanGate({
    advisoryId: advisory.id,
    humanGatePresent: false,
    attemptAutoExecute: true,
    root,
    actor: agentActor,
  });
  check(
    'sc_human_gate_required',
    gate.status === 'denied' &&
      gate.autoExecuted === false &&
      gate.reason === SC_HUMAN_GATE_REQUIRED,
    gate.reason,
  );

  const provider = await probeSupplyChainProvider({
    providerId: 'tms-stub',
    configured: false,
    claimAvailable: true,
    root,
    actor,
  });
  check(
    'unconfigured_sc_provider_unavailable',
    provider.availability === 'UNAVAILABLE' &&
      provider.status === 'denied' &&
      provider.reason === UNCONFIGURED_SC_PROVIDER,
    provider.reason,
  );

  // B
  const ddl = await proposeLakehouseDdl({
    name: 'dw_history_archive',
    attemptAutoApply: true,
    root,
    actor,
  });
  check(
    'lakehouse_ddl_neq_auto_prod',
    ddl.autoApplied === false &&
      ddl.appliedToProduction === false &&
      ddl.reason === LAKEHOUSE_DDL_NEQ_AUTO,
    ddl.reason,
  );

  const dq = await runDataQualityAgent({
    checkName: 'duplicate-keys',
    attemptLiveMigration: true,
    root,
    actor,
  });
  check(
    'data_quality_agent_neq_live_migration',
    dq.liveMigrationApplied === false && dq.reason === DQ_NEQ_LIVE_MIGRATION,
    dq.reason,
  );

  const db = await probeDbCandidatesApplied({ claimApplied: true, root, actor });
  check(
    'db_candidates_not_applied',
    db.applied === false &&
      db.status === 'NOT_APPLIED' &&
      db.reason === DB_CANDIDATES_NOT_APPLIED,
    db.reason,
  );

  // C
  const sim = await runCalibratedTwinSimulation({
    scenario: 'lane-capacity',
    claimVerifiedFact: true,
    root,
    actor,
  });
  check(
    'sim_neq_verified_fact',
    sim.verifiedFact === false &&
      sim.labeledSimulation === true &&
      sim.reason === SIM_NEQ_FACT,
    sim.reason,
  );

  const phys = await probeTwinPhysicalControl({
    twinId: sim.id,
    attemptPhysicalControl: true,
    root,
    actor,
  });
  check(
    'twin_neq_physical_control',
    phys.physicalControlGranted === false &&
      phys.status === 'denied' &&
      phys.reason === TWIN_NEQ_PHYSICAL,
    phys.reason,
  );

  const acc = await claimTwinAccuracy({
    claim: 'calibrated ETA',
    calibrationProofPresent: false,
    root,
    actor,
  });
  check(
    'accuracy_claim_requires_proof',
    acc.state === 'DENIED' && acc.reason === ACCURACY_PROOF_REQUIRED,
    acc.reason,
  );

  // D
  const hw = await claimHardwareSupport({
    vendor: 'AMD',
    proofPresent: false,
    root,
    actor,
  });
  check(
    'hardware_support_requires_proof',
    hw.state === 'UNAVAILABLE' && hw.reason === HARDWARE_PROOF_REQUIRED,
    hw.reason,
  );

  const edge = await attemptEdgeRemoteControl({
    targetNodeId: 'gpu-rack-1',
    authorized: false,
    root,
    actor,
  });
  check(
    'edge_neq_unauthorized_remote_control',
    edge.remoteControlGranted === false &&
      edge.status === 'denied' &&
      edge.reason === EDGE_NEQ_REMOTE,
    edge.reason,
  );

  const chip = await probeChipRunningVerified({
    nodeId: 'edge-node-1',
    heartbeatFresh: false,
    runtimeEvidencePresent: true,
    root,
    actor,
  });
  check(
    'chip_running_verified_needs_evidence',
    chip.state === 'DENIED' && chip.reason === CHIP_HEARTBEAT_REQUIRED,
    chip.reason,
  );

  // E
  const entry = await storeEncryptedKnowledge({
    ownerId: actor.id,
    contextId: 'personal',
    label: 'notes',
    root,
    actor,
  });
  check(
    'vault_encrypted_permission_aware',
    entry.encrypted === true &&
      entry.plaintextStored === false &&
      entry.permissionAware === true &&
      entry.reason === VAULT_ENCRYPTED,
    entry.reason,
  );

  const cross = await accessVaultEntry({
    entryId: entry.id,
    requesterId: 'peer',
    requesterContextId: 'other-context',
    entryContextId: entry.contextId,
    explicitGrant: false,
    root,
    actor,
  });
  check(
    'vault_cross_context_denied',
    cross.status === 'denied' && cross.reason === VAULT_CROSS_CONTEXT,
    cross.reason,
  );

  // F
  const unsigned = await sendSignedMemoryHop({
    fromAgentId: 'agent-a',
    toAgentId: 'agent-b',
    signed: false,
    enrolledPeer: true,
    root,
    actor,
  });
  check(
    'unsigned_memory_highway_denied',
    unsigned.status === 'denied' && unsigned.reason === UNSIGNED_HIGHWAY,
    unsigned.reason,
  );

  const unenrolled = await sendSignedMemoryHop({
    fromAgentId: 'agent-a',
    toAgentId: 'agent-c',
    signed: true,
    enrolledPeer: false,
    root,
    actor,
  });
  check(
    'unenrolled_memory_peer_denied',
    unenrolled.status === 'denied' && unenrolled.reason === UNENROLLED_PEER,
    unenrolled.reason,
  );

  // G
  const pack = await registerIndustryPack({
    packId: 'healthcare-pack',
    industry: 'healthcare',
    supplyChainPilotProven: false,
    root,
    actor,
  });
  check(
    'industry_pack_behind_supply_chain_pilot',
    pack.status === 'gated' && pack.reason === INDUSTRY_BEHIND_PILOT,
    pack.reason,
  );

  const wedge = await evaluateBroaderIndustryGate({
    supplyChainPilotProofPresent: false,
    attemptBroaderIndustry: true,
    root,
    actor,
  });
  check(
    'wedge_first_broader_industry_gated',
    wedge.status === 'denied' && wedge.reason === WEDGE_FIRST_GATED,
    wedge.reason,
  );

  // H
  const mm = await openMultimodalSession({
    optIn: false,
    attemptEnableBiometric: true,
    attemptEnableCamera: true,
    root,
    actor,
  });
  check(
    'multimodal_biometric_defaults_off',
    mm.biometricEnabled === false &&
      mm.cameraEnabled === false &&
      mm.reason === BIOMETRIC_DEFAULTS_OFF,
    mm.reason,
  );

  const covert = await probeCovertSurveillance({
    attemptCovertEmotion: true,
    attemptProfiling: true,
    root,
    actor,
  });
  check(
    'covert_emotion_surveillance_denied',
    covert.status === 'denied' && covert.reason === COVERT_DENIED,
    covert.reason,
  );

  const minor = await probeAdultTrustCircle({ ageYears: 15, root, actor });
  check(
    'adult_trust_circle_minors_denied',
    minor.status === 'denied' && minor.reason === MINORS_DENIED,
    minor.reason,
  );

  const node = await createNeuralSuperbrainNode({
    kind: 'lakehouse',
    universeId: actor.universeId,
    sealed: true,
    root,
    actor,
    repoRoot,
  });
  const sealed = await accessSealedNeuralNode({
    nodeId: node.id,
    explicitGrant: false,
    root,
    actor,
  });
  check(
    'neural_node_sealed_deny_by_default',
    sealed.status === 'denied' &&
      node.grantsAuthority === false &&
      sealed.reason === NEURAL_SEALED_DENIED,
    sealed.reason,
  );

  const offline = await probeOfflineNeuralNode({
    poweredAuthorizedNode: false,
    preferWaiting: true,
    root,
    actor,
  });
  check(
    'offline_without_powered_node_waiting_or_stopped',
    offline.state === 'WAITING_NODE' && offline.reason === OFFLINE_WAITING_OR_STOPPED,
    offline.reason,
  );

  const twin = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  check(
    'digital_twin_neq_founder',
    twin.status === 'denied' && twin.reason === TWIN_NEQ_FOUNDER,
    twin.reason,
  );

  const running = await probeRunningVerified({
    heartbeatFresh: false,
    runtimeEvidencePresent: false,
    root,
    actor,
  });
  check(
    'running_verified_requires_heartbeat',
    running.state === 'DENIED' && running.reason === HEARTBEAT_REQUIRED,
    running.reason,
  );

  const cycle = await runSupplyChainSuperbrainCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'runtime_cycle_all_required_stories',
    failedHops.length === 0 &&
      cycle.tipLand === false &&
      cycle.productionAuthorized === false &&
      cycle.dbCandidatesApplied === false,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildSupplyChainSuperbrainHealthReport({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'health_report_healthy',
    health.status === 'HEALTHY' && health.nextPhaseTitle === NEXT_PHASE_TITLE,
    `status=${health.status}`,
  );

  const honesty = supplyChainSuperbrainOsHonesty(repoRoot);
  const preds = predecessorMap(repoRoot);
  check(
    'honesty_and_predecessor_probe',
    honesty.banner === HONESTY_BANNER &&
      honesty.l4AutonomyEnabled === false &&
      preds.DT.tipProbe === 'PRESENT' &&
      preds.DS.tipProbe === 'PRESENT' &&
      preds.DV.tipProbe === 'WAITING_DATA' &&
      preds.DU.tipProbe === 'WAITING_DATA',
    `predecessor=${honesty.predecessorLayer}; DV=${preds.DV.tipProbe}; DU=${preds.DU.tipProbe}; DT=${preds.DT.tipProbe}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-DW stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DW Supply Chain Superbrain stories passed');
