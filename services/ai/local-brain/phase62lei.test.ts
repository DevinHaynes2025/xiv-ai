import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  gateChipCloudEvidence,
  probeChipCloudConfigured,
  registerChipCloudFabric,
} from './chip-to-cloud-cognitive-fabric';
import {
  bootstrapChipToCloudCognitiveFabric,
  chipToCloudCognitiveFabricOsHonesty,
} from './chip-to-cloud-cognitive-fabric-os';
import {
  ADAPTER_NEQ_PROPRIETARY,
  ARCHITECTURE_TRANSLATIONS,
  AUTONOMY_BOUNDARY_DENIED,
  CHIP_CLOUD_EVIDENCE_GATE,
  CHIP_CLOUD_FABRIC_REGISTERED,
  CHIP_CLOUD_UNCONFIGURED,
  CHIP_TO_CLOUD_COGNITIVE_FABRIC_CYCLE,
  EI_LOCKS,
  ELECTRONICS_SC_NEQ_PHYSICAL,
  HEALTHCARE_NEQ_CLINICAL,
  HEALTHCARE_PLAN_HUMAN_GATES,
  HISTORICAL_MEDICINE_NEQ_CLINICAL,
  HISTORICAL_MEDICINE_PROVENANCE,
  HONESTY_BANNER,
  INTEGRATION_CANDIDATE_LABEL,
  LEARNING_LOOP_RULES,
  LINEAGE_TRACKING,
  MEDICAL_DEVICE_NEQ_PHYSICAL,
  NEXT_PHASE_TITLE,
  OFFLINE_MEDICINE_PACK_HONEST,
  OFFLINE_WAITING_OR_STOPPED,
  PLUGIN_TRUST_NEQ_AUTO_GRANT,
  PRODUCT_PHILOSOPHY,
  RELIABILITY_MESH_REGISTERED,
  SC_NEQ_AUTO_PO_FREIGHT,
  SIGNED_EVENT_INTEROP,
  STEALTH_INSTALL_DENIED,
  SUPPLIER_FACTORY_ADVISORY,
  TWIN_NEQ_FOUNDER,
  UNCONFIGURED_CONNECTOR_UNAVAILABLE,
  UNSIGNED_UNENROLLED_DENY,
  UNVERIFIED_RELATIONSHIP_LABEL,
  predecessorMap,
  type EiActor,
} from './chip-to-cloud-cognitive-fabric-types';
import {
  buildChipToCloudCognitiveFabricHealthReport,
  runChipToCloudCognitiveFabricCycle,
} from './chip-to-cloud-cognitive-fabric-runtime';
import {
  probeAdapterProprietaryCopy,
  probePluginConnector,
  registerEnterpriseBrandCandidate,
  scorePluginTrust,
} from './enterprise-plugin-federation';
import {
  denyAutonomousAction,
  denyStealthInstall,
  probeDigitalTwinAuthority,
  probeOfflineReliabilityNode,
  registerReliabilityMesh,
  softWireNeuralNode,
} from './global-runtime-reliability-mesh';
import {
  planHealthcareLogistics,
  probeHealthcareClinicalAuthority,
  probeMedicalDevicePhysicalControl,
} from './healthcare-logistics-integration';
import {
  probeHistoricalMedicineClinicalClaim,
  registerHistoricalMedicineEntry,
  registerOfflineMedicinePack,
} from './historical-medicine-knowledge-atlas';
import {
  ingestSignedEvent,
  recordEventLineage,
  translateBusinessSystem,
} from './neural-data-expansion';
import {
  denyAutoPoOrFreight,
  probeElectronicsScPhysicalControl,
  registerSupplierFactoryNode,
} from './supplier-factory-intelligence-graph';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lei-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: EiActor = {
  kind: 'chip_cloud_fabric_curator',
  id: 'test-curator',
  orgId: 'org-ei',
  tenantId: 'tenant-ei',
  universeId: 'universe-ei',
};
const twinActor: EiActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      EI_LOCKS.L4_AUTONOMY_ENABLED === false &&
      EI_LOCKS.TIP_LAND === false &&
      EI_LOCKS.ENTERPRISE_BRAND_EQ_ACTIVE_PARTNERSHIP === false &&
      EI_LOCKS.HISTORICAL_MEDICINE_EQ_CLINICAL_AUTHORITY === false &&
      EI_LOCKS.HISTORICAL_MEDICINE_EQ_MODERN_GUIDANCE === false &&
      EI_LOCKS.PLUGIN_TRUST_SCORE_EQ_AUTO_GRANT === false &&
      EI_LOCKS.ADAPTER_CONTRACT_EQ_PROPRIETARY_COPY === false &&
      EI_LOCKS.CLINICAL_AUTHORITY_CLAIMED === false &&
      EI_LOCKS.UNSIGNED_EVENT_EQ_ENROLLED === false &&
      EI_LOCKS.AUTO_PO_ALLOWED === false &&
      EI_LOCKS.AUTO_FREIGHT_ALLOWED === false &&
      EI_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
      EI_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false &&
      PRODUCT_PHILOSOPHY.enterpriseBrandIntegrationCandidateUntilEvidence ===
        true &&
      LEARNING_LOOP_RULES.historicalMedicineNeqClinicalAuthority === true &&
      CHIP_TO_CLOUD_COGNITIVE_FABRIC_CYCLE.includes(
        'unsigned_unenrolled_sealed_deny',
      ) &&
      ARCHITECTURE_TRANSLATIONS.wormholesMeans.includes('routing') &&
      NEXT_PHASE_TITLE.includes('62L-EJ'),
    'locks + cycle + next EJ present',
  );

  const os = await bootstrapChipToCloudCognitiveFabric({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_chip_to_cloud_cognitive_fabric',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.publicLaunchAuthorized === false &&
      (os.predecessorLayer === 'EH' ||
        os.predecessorLayer === 'EG' ||
        os.predecessorLayer === 'EE') &&
      (os.softWiredPredecessors.includes('EG') ||
        os.softWiredPredecessors.includes('EE') ||
        os.softWiredPredecessors.includes('EH')),
    `os=${os.id}; predecessor=${os.predecessorLayer}; soft=${os.softWiredPredecessors.join(',')}`,
  );

  // A
  const fabric = await registerChipCloudFabric({
    fabricId: 'fab-ok',
    deviceClass: 'device_edge',
    configured: true,
    root,
    actor,
  });
  check(
    'chip_cloud_fabric_register',
    fabric.status === 'ok' && fabric.reason === CHIP_CLOUD_FABRIC_REGISTERED,
    fabric.reason,
  );
  const evidence = await gateChipCloudEvidence({
    fabricId: 'fab-ok',
    evidenceComplete: false,
    root,
    actor,
  });
  check(
    'chip_cloud_evidence_gate',
    evidence.promoted === false &&
      evidence.runningVerified === false &&
      evidence.status === 'denied' &&
      evidence.reason === CHIP_CLOUD_EVIDENCE_GATE,
    evidence.reason,
  );
  const unconf = await probeChipCloudConfigured({
    fabricId: 'fab-u',
    configured: false,
    root,
    actor,
  });
  check(
    'chip_cloud_unconfigured_unavailable',
    unconf.status === 'unavailable' &&
      unconf.reason === CHIP_CLOUD_UNCONFIGURED,
    unconf.reason,
  );

  // B
  const plan = await planHealthcareLogistics({
    planId: 'hl1',
    humanGatePresent: true,
    root,
    actor,
  });
  check(
    'healthcare_logistics_plan_human_gates',
    plan.status === 'plan_only' &&
      plan.clinicalControlEnabled === false &&
      plan.physicalControlEnabled === false &&
      plan.reason === HEALTHCARE_PLAN_HUMAN_GATES,
    plan.reason,
  );
  const planDenied = await planHealthcareLogistics({
    planId: 'hl2',
    humanGatePresent: false,
    root,
    actor,
  });
  check(
    'healthcare_plan_without_human_gate_denied',
    planDenied.status === 'denied',
    planDenied.reason,
  );
  const clin = await probeHealthcareClinicalAuthority({
    claimClinicalAuthority: true,
    root,
    actor,
  });
  check(
    'healthcare_neq_clinical_authority',
    clin.clinicalAuthority === false &&
      clin.medicalAdviceAuthority === false &&
      clin.status === 'denied' &&
      clin.reason === HEALTHCARE_NEQ_CLINICAL,
    clin.reason,
  );
  const device = await probeMedicalDevicePhysicalControl({
    claimPhysicalControl: true,
    root,
    actor,
  });
  check(
    'medical_device_logistics_neq_physical_control',
    device.physicalControlEnabled === false &&
      device.status === 'denied' &&
      device.reason === MEDICAL_DEVICE_NEQ_PHYSICAL,
    device.reason,
  );

  // C — INTEGRATION_CANDIDATE / brand honesty
  const sf = await registerEnterpriseBrandCandidate({
    brand: 'salesforce',
    relationshipEvidencePresent: false,
    root,
    actor,
  });
  check(
    'enterprise_brand_integration_candidate_salesforce',
    sf.activePartnershipClaimed === false &&
      sf.customerStatusClaimed === false &&
      sf.relationshipLabel === UNVERIFIED_RELATIONSHIP_LABEL &&
      sf.reason === INTEGRATION_CANDIDATE_LABEL,
    `${sf.relationshipLabel}/${sf.reason}`,
  );
  const amazon = await registerEnterpriseBrandCandidate({
    brand: 'amazon',
    relationshipEvidencePresent: true,
    root,
    actor,
  });
  check(
    'enterprise_brand_still_candidate_with_flag',
    amazon.activePartnershipClaimed === false &&
      amazon.customerStatusClaimed === false &&
      amazon.status === 'candidate',
    amazon.relationshipLabel,
  );
  const walmart = await registerEnterpriseBrandCandidate({
    brand: 'walmart',
    relationshipEvidencePresent: false,
    root,
    actor,
  });
  const oracle = await registerEnterpriseBrandCandidate({
    brand: 'oracle',
    relationshipEvidencePresent: false,
    root,
    actor,
  });
  check(
    'retail_and_oracle_integration_candidates',
    walmart.activePartnershipClaimed === false &&
      oracle.activePartnershipClaimed === false,
    `${walmart.brand},${oracle.brand}`,
  );
  const trust = await scorePluginTrust({
    pluginId: 'p1',
    trustScore: 0.99,
    requestAutoGrant: true,
    root,
    actor,
  });
  check(
    'plugin_trust_score_neq_auto_grant',
    trust.authorityGranted === false &&
      trust.marketplaceListingEqTrust === false &&
      trust.reason === PLUGIN_TRUST_NEQ_AUTO_GRANT,
    trust.reason,
  );
  const conn = await probePluginConnector({
    connectorId: 'sf-pack',
    configured: false,
    root,
    actor,
  });
  check(
    'unconfigured_connector_unavailable',
    conn.status === 'unavailable' &&
      conn.reason === UNCONFIGURED_CONNECTOR_UNAVAILABLE,
    conn.reason,
  );
  const adapt = await probeAdapterProprietaryCopy({
    vendor: 'salesforce',
    claimProprietaryCopy: true,
    root,
    actor,
  });
  check(
    'adapter_contract_neq_proprietary_copy',
    adapt.proprietaryCopyAllowed === false &&
      adapt.status === 'denied' &&
      adapt.reason === ADAPTER_NEQ_PROPRIETARY,
    adapt.reason,
  );

  // D — historical medicine ≠ clinical
  const egyptian = await registerHistoricalMedicineEntry({
    entryId: 'eg1',
    tradition: 'egyptian',
    provenanceLabeled: true,
    root,
    actor,
  });
  const african = await registerHistoricalMedicineEntry({
    entryId: 'af1',
    tradition: 'african',
    provenanceLabeled: true,
    root,
    actor,
  });
  const chinese = await registerHistoricalMedicineEntry({
    entryId: 'ch1',
    tradition: 'chinese',
    provenanceLabeled: true,
    root,
    actor,
  });
  check(
    'historical_medicine_provenance_labeled',
    egyptian.reason === HISTORICAL_MEDICINE_PROVENANCE &&
      african.modernMedicalGuidance === false &&
      chinese.clinicalAuthority === false,
    `${egyptian.tradition},${african.tradition},${chinese.tradition}`,
  );
  const medClin = await probeHistoricalMedicineClinicalClaim({
    claimModernClinicalGuidance: true,
    claimDiagnosePrescribeTreat: true,
    root,
    actor,
  });
  check(
    'historical_medicine_neq_clinical_guidance',
    medClin.status === 'denied' &&
      medClin.diagnosePrescribeTreatAllowed === false &&
      medClin.reason === HISTORICAL_MEDICINE_NEQ_CLINICAL,
    medClin.reason,
  );
  const packWait = await registerOfflineMedicinePack({
    packId: 'pack1',
    mode: 'waiting',
    root,
    actor,
  });
  const packStop = await registerOfflineMedicinePack({
    packId: 'pack2',
    mode: 'stopped',
    root,
    actor,
  });
  check(
    'offline_medicine_pack_honest',
    packWait.state === 'WAITING_NODE' &&
      packStop.state === 'OFFLINE_STOPPED' &&
      packWait.reason === OFFLINE_MEDICINE_PACK_HONEST,
    `${packWait.state}/${packStop.state}`,
  );

  // E
  const sup = await registerSupplierFactoryNode({
    nodeId: 's1',
    kind: 'factory',
    root,
    actor,
  });
  check(
    'supplier_factory_advisory_only',
    sup.advisoryOnly &&
      sup.autoPoEnabled === false &&
      sup.reason === SUPPLIER_FACTORY_ADVISORY,
    sup.reason,
  );
  const autoPo = await denyAutoPoOrFreight({
    action: 'auto_freight',
    root,
    actor,
  });
  check(
    'sc_advisory_neq_auto_po_freight',
    autoPo.status === 'denied' && autoPo.reason === SC_NEQ_AUTO_PO_FREIGHT,
    autoPo.reason,
  );
  const scPhys = await probeElectronicsScPhysicalControl({
    claimPhysicalControl: true,
    root,
    actor,
  });
  check(
    'electronics_sc_neq_physical_control',
    scPhys.physicalControlEnabled === false &&
      scPhys.reason === ELECTRONICS_SC_NEQ_PHYSICAL,
    scPhys.reason,
  );

  // F — unsigned deny + lineage
  const xlate = await translateBusinessSystem({
    translationId: 't1',
    sourceSystem: 'crm',
    targetSystem: 'erp',
    root,
    actor,
  });
  check('business_system_translation', xlate.status === 'ok', xlate.reason);
  const signed = await ingestSignedEvent({
    eventId: 'e1',
    signed: true,
    enrolled: true,
    root,
    actor,
  });
  check(
    'signed_event_interop',
    signed.accepted &&
      signed.status === 'ok' &&
      signed.reason === SIGNED_EVENT_INTEROP,
    signed.reason,
  );
  const unsigned = await ingestSignedEvent({
    eventId: 'e2',
    signed: false,
    enrolled: true,
    root,
    actor,
  });
  const unenrolled = await ingestSignedEvent({
    eventId: 'e3',
    signed: true,
    enrolled: false,
    root,
    actor,
  });
  check(
    'unsigned_unenrolled_sealed_deny',
    unsigned.accepted === false &&
      unenrolled.accepted === false &&
      unsigned.reason === UNSIGNED_UNENROLLED_DENY &&
      unenrolled.reason === UNSIGNED_UNENROLLED_DENY,
    unsigned.reason,
  );
  const lineage = await recordEventLineage({
    lineageId: 'l1',
    eventId: 'e1',
    root,
    actor,
  });
  check(
    'lineage_tracking',
    lineage.status === 'ok' && lineage.reason === LINEAGE_TRACKING,
    lineage.reason,
  );

  // G
  const mesh = await registerReliabilityMesh({
    meshId: 'm1',
    root,
    actor,
  });
  check(
    'reliability_mesh_register',
    mesh.status === 'ok' && mesh.reason === RELIABILITY_MESH_REGISTERED,
    mesh.reason,
  );
  const neural = await softWireNeuralNode({
    nodeId: 'n1',
    root,
    actor,
    repoRoot,
  });
  check(
    'neural_node_soft_wire',
    neural.status === 'ok' &&
      (neural.softWired.includes('EG') || neural.softWired.includes('EE')),
    `soft=${neural.softWired.join(',')}`,
  );
  const offline = await probeOfflineReliabilityNode({
    nodeId: 'off1',
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

  // H denial / soft-wire
  const preds = predecessorMap(repoRoot);
  check(
    'eh_eg_ee_soft_wire_probe',
    preds.EG.tipProbe === 'PRESENT' ||
      preds.EE.tipProbe === 'PRESENT' ||
      preds.EH.tipProbe === 'PRESENT',
    `EH=${preds.EH.tipProbe}/${preds.EH.report}; EG=${preds.EG.tipProbe}/${preds.EG.report}; EE=${preds.EE.tipProbe}/${preds.EE.report}`,
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
    action: 'issue_purchase_order',
    root,
    actor,
  });
  check(
    'autonomy_boundary_no_freight_po_spend',
    auto.status === 'denied' && auto.reason === AUTONOMY_BOUNDARY_DENIED,
    auto.reason,
  );

  const cycle = await runChipToCloudCognitiveFabricCycle({
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
      cycle.githubSotIssue === 153 &&
      cycle.gitlabCoordinationIssue === 86 &&
      cycle.nextPhaseTitle.includes('62L-EJ'),
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildChipToCloudCognitiveFabricHealthReport({
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
      health.nextPhaseTitle.includes('62L-EJ'),
    `status=${health.status}; hops=${health.hopCount}`,
  );

  const honesty = chipToCloudCognitiveFabricOsHonesty(repoRoot);
  check(
    'system_honesty',
    honesty.l4AutonomyEnabled === false &&
      honesty.dbCandidatesApplied === false &&
      honesty.enterpriseBrandEqActivePartnership === false &&
      honesty.historicalMedicineEqClinicalAuthority === false &&
      honesty.pluginTrustScoreEqAutoGrant === false &&
      honesty.nextPhaseTitle.includes('62L-EJ'),
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

console.log('ALL 62L-EI STORIES PASSED');
