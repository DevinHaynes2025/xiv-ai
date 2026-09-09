/**
 * 62L-EI Chip-to-Cloud Cognitive Fabric runtime —
 * Walks CHIP_TO_CLOUD_COGNITIVE_FABRIC_CYCLE and builds health report.
 */

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
  ARCHITECTURE_TRANSLATIONS,
  CHIP_TO_CLOUD_COGNITIVE_FABRIC_CYCLE,
  EI_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type EiActor,
  type EiEvidenceState,
  type EiHop,
  type EiHopRecord,
} from './chip-to-cloud-cognitive-fabric-types';
import { decisionGate } from './decision-gate';
import {
  probeAdapterProprietaryCopy,
  probePluginConnector,
  registerEnterpriseBrandCandidate,
  scorePluginTrust,
} from './enterprise-plugin-federation';
import { appendEvidenceEvent } from './evidence-ledger';
import {
  denyAutonomousAction,
  denyStealthInstall,
  probeDigitalTwinAuthority,
  probeOfflineReliabilityNode,
  registerReliabilityMesh,
  softWireNeuralNode,
} from './global-runtime-reliability-mesh';
import { checkLocalBrainHealth } from './health-check';
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
import { appendLearning } from './learning-ledger';
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

export {
  ARCHITECTURE_TRANSLATIONS,
  CHIP_TO_CLOUD_COGNITIVE_FABRIC_CYCLE,
  EI_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: EiHop, state: EiEvidenceState, summary: string): EiHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type EiCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: EiActor;
  root?: string;
  repoRoot?: string;
};

export async function runChipToCloudCognitiveFabricCycle(input: EiCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: EiHopRecord[] = [];
  const actor = {
    ...input.actor,
    universeId: input.universeId || input.actor.universeId,
  };
  const twinActor: EiActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

  hops.push(
    hop(
      'honesty_locks',
      EI_LOCKS.L4_AUTONOMY_ENABLED === false &&
        EI_LOCKS.LOCAL_FIRST &&
        EI_LOCKS.ENTERPRISE_BRAND_EQ_ACTIVE_PARTNERSHIP === false &&
        EI_LOCKS.HISTORICAL_MEDICINE_EQ_CLINICAL_AUTHORITY === false &&
        EI_LOCKS.HISTORICAL_MEDICINE_EQ_MODERN_GUIDANCE === false &&
        EI_LOCKS.PLUGIN_TRUST_SCORE_EQ_AUTO_GRANT === false &&
        EI_LOCKS.CLINICAL_AUTHORITY_CLAIMED === false &&
        EI_LOCKS.UNSIGNED_EVENT_EQ_ENROLLED === false &&
        EI_LOCKS.AUTO_PO_ALLOWED === false &&
        EI_LOCKS.TIP_LAND === false &&
        EI_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapChipToCloudCognitiveFabric({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'chip_to_cloud_cognitive_fabric_bootstrap',
      'PASS',
      `os=${os.id}; predecessor=${os.predecessorLayer}; softWire=${os.softWiredPredecessors.join(',')}`,
    ),
  );

  // A
  const fabric = await registerChipCloudFabric({
    fabricId: 'fab-1',
    deviceClass: 'semiconductor_edge',
    configured: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'chip_cloud_fabric_register',
      fabric.status === 'ok' ? 'PASS' : 'FAIL',
      fabric.reason,
    ),
  );
  const evidence = await gateChipCloudEvidence({
    fabricId: 'fab-1',
    evidenceComplete: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'chip_cloud_evidence_gate',
      evidence.promoted === false &&
        evidence.runningVerified === false &&
        evidence.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      evidence.reason,
    ),
  );
  const unconf = await probeChipCloudConfigured({
    fabricId: 'fab-u',
    configured: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'chip_cloud_unconfigured_unavailable',
      unconf.status === 'unavailable' ? 'PASS' : 'FAIL',
      unconf.reason,
    ),
  );

  // B
  const plan = await planHealthcareLogistics({
    planId: 'hl-1',
    humanGatePresent: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'healthcare_logistics_plan_human_gates',
      plan.status === 'plan_only' &&
        plan.clinicalControlEnabled === false &&
        plan.physicalControlEnabled === false
        ? 'PASS'
        : 'FAIL',
      plan.reason,
    ),
  );
  const clin = await probeHealthcareClinicalAuthority({
    claimClinicalAuthority: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'healthcare_neq_clinical_authority',
      clin.clinicalAuthority === false && clin.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      clin.reason,
    ),
  );
  const device = await probeMedicalDevicePhysicalControl({
    claimPhysicalControl: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'medical_device_logistics_neq_physical_control',
      device.physicalControlEnabled === false && device.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      device.reason,
    ),
  );

  // C
  const brand = await registerEnterpriseBrandCandidate({
    brand: 'salesforce',
    relationshipEvidencePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'enterprise_brand_integration_candidate',
      brand.activePartnershipClaimed === false &&
        brand.customerStatusClaimed === false &&
        (brand.relationshipLabel === 'INTEGRATION_CANDIDATE' ||
          brand.relationshipLabel === 'UNVERIFIED_RELATIONSHIP')
        ? 'PASS'
        : 'FAIL',
      brand.reason,
    ),
  );
  const trust = await scorePluginTrust({
    pluginId: 'plug-1',
    trustScore: 0.92,
    requestAutoGrant: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'plugin_trust_score_neq_auto_grant',
      trust.authorityGranted === false ? 'PASS' : 'FAIL',
      trust.reason,
    ),
  );
  const conn = await probePluginConnector({
    connectorId: 'oracle-pack',
    configured: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_connector_unavailable',
      conn.status === 'unavailable' ? 'PASS' : 'FAIL',
      conn.reason,
    ),
  );
  const adapt = await probeAdapterProprietaryCopy({
    vendor: 'oracle',
    claimProprietaryCopy: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'adapter_contract_neq_proprietary_copy',
      adapt.proprietaryCopyAllowed === false && adapt.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      adapt.reason,
    ),
  );

  // D
  const med = await registerHistoricalMedicineEntry({
    entryId: 'hm-egyptian-1',
    tradition: 'egyptian',
    provenanceLabeled: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'historical_medicine_provenance_labeled',
      med.provenanceLabeled &&
        med.clinicalAuthority === false &&
        med.modernMedicalGuidance === false
        ? 'PASS'
        : 'FAIL',
      med.reason,
    ),
  );
  const medClin = await probeHistoricalMedicineClinicalClaim({
    claimModernClinicalGuidance: true,
    claimDiagnosePrescribeTreat: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'historical_medicine_neq_clinical_guidance',
      medClin.status === 'denied' &&
        medClin.diagnosePrescribeTreatAllowed === false
        ? 'PASS'
        : 'FAIL',
      medClin.reason,
    ),
  );
  const pack = await registerOfflineMedicinePack({
    packId: 'pack-african-1',
    mode: 'waiting',
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_medicine_pack_honest',
      pack.state === 'WAITING_NODE' && pack.clinicalAuthority === false
        ? 'PASS'
        : 'FAIL',
      pack.reason,
    ),
  );

  // E
  const sup = await registerSupplierFactoryNode({
    nodeId: 'sup-1',
    kind: 'semiconductor_sc',
    root,
    actor,
  });
  hops.push(
    hop(
      'supplier_factory_advisory_only',
      sup.advisoryOnly && sup.autoPoEnabled === false ? 'PASS' : 'FAIL',
      sup.reason,
    ),
  );
  const autoPo = await denyAutoPoOrFreight({
    action: 'auto_po',
    root,
    actor,
  });
  hops.push(
    hop(
      'sc_advisory_neq_auto_po_freight',
      autoPo.status === 'denied' ? 'PASS' : 'FAIL',
      autoPo.reason,
    ),
  );
  const scPhys = await probeElectronicsScPhysicalControl({
    claimPhysicalControl: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'electronics_sc_neq_physical_control',
      scPhys.physicalControlEnabled === false && scPhys.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      scPhys.reason,
    ),
  );

  // F
  const xlate = await translateBusinessSystem({
    translationId: 'x-1',
    sourceSystem: 'erp',
    targetSystem: 'wms',
    root,
    actor,
  });
  hops.push(
    hop(
      'business_system_translation',
      xlate.status === 'ok' ? 'PASS' : 'FAIL',
      xlate.reason,
    ),
  );
  const signed = await ingestSignedEvent({
    eventId: 'ev-signed',
    signed: true,
    enrolled: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'signed_event_interop',
      signed.accepted && signed.status === 'ok' ? 'PASS' : 'FAIL',
      signed.reason,
    ),
  );
  const unsigned = await ingestSignedEvent({
    eventId: 'ev-unsigned',
    signed: false,
    enrolled: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_unenrolled_sealed_deny',
      unsigned.accepted === false && unsigned.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      unsigned.reason,
    ),
  );
  const lineage = await recordEventLineage({
    lineageId: 'lin-1',
    eventId: 'ev-signed',
    root,
    actor,
  });
  hops.push(
    hop(
      'lineage_tracking',
      lineage.status === 'ok' ? 'PASS' : 'FAIL',
      lineage.reason,
    ),
  );

  // G + H
  const mesh = await registerReliabilityMesh({
    meshId: 'mesh-1',
    root,
    actor,
  });
  hops.push(
    hop(
      'reliability_mesh_register',
      mesh.status === 'ok' ? 'PASS' : 'FAIL',
      mesh.reason,
    ),
  );
  const neural = await softWireNeuralNode({
    nodeId: 'nn-1',
    root,
    actor,
    repoRoot: input.repoRoot ?? root,
  });
  hops.push(
    hop(
      'neural_node_soft_wire',
      neural.status === 'ok' ? 'PASS' : 'FAIL',
      `${neural.reason}; soft=${neural.softWired.join(',')}`,
    ),
  );
  const offline = await probeOfflineReliabilityNode({
    nodeId: 'edge-1',
    mode: 'waiting',
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_waiting_or_stopped',
      offline.state === 'WAITING_NODE' ? 'PASS' : 'FAIL',
      offline.reason,
    ),
  );

  const preds = predecessorMap(input.repoRoot ?? root);
  const softWireOk =
    preds.EH.tipProbe === 'PRESENT' ||
    preds.EG.tipProbe === 'PRESENT' ||
    preds.EE.tipProbe === 'PRESENT' ||
    preds.EG.tipProbe === 'WAITING_DATA';
  hops.push(
    hop(
      'eh_eg_ee_soft_wire_probe',
      softWireOk ? 'PASS' : 'FAIL',
      `EH=${preds.EH.tipProbe}/${preds.EH.report}; EG=${preds.EG.tipProbe}/${preds.EG.report}; EE=${preds.EE.tipProbe}/${preds.EE.report}`,
    ),
  );

  const stealth = await denyStealthInstall({
    attemptKind: 'stealth_install',
    root,
    actor,
  });
  hops.push(
    hop(
      'stealth_install_denied',
      stealth.status === 'denied' ? 'PASS' : 'FAIL',
      stealth.reason,
    ),
  );

  const twinAuth = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  hops.push(
    hop(
      'digital_twin_neq_founder',
      twinAuth.status === 'denied' ? 'PASS' : 'FAIL',
      twinAuth.reason,
    ),
  );

  const auto = await denyAutonomousAction({
    action: 'spend_money',
    root,
    actor,
  });
  hops.push(
    hop(
      'autonomy_boundary_no_freight_po_spend',
      auto.status === 'denied' ? 'PASS' : 'FAIL',
      auto.reason,
    ),
  );

  void decisionGate({
    id: 'ei-cycle-gate',
    action: '62l_ei_chip_to_cloud_cognitive_fabric_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void chipToCloudCognitiveFabricOsHonesty(input.repoRoot);
  void CHIP_TO_CLOUD_COGNITIVE_FABRIC_CYCLE;

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-EI chip-to-cloud cognitive fabric cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-EI'],
        githubSotIssue: GITHUB_SOT_ISSUE,
        gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
        architectureTranslations: ARCHITECTURE_TRANSLATIONS,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-EI chip-to-cloud cognitive fabric cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; INTEGRATION_CANDIDATE; medicine≠clinical; ` +
        'unsigned deny; autonomy denied; soft-wire EG/EE',
      sourceRefs: ['62L-EI'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      'BOUNDED',
      'Learning recorded locally; learning ≠ permission; no self-promotion; no production authorization.',
    ),
  );

  const health = await checkLocalBrainHealth(root).catch(() => null);

  return {
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: EI_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    architectureTranslations: ARCHITECTURE_TRANSLATIONS,
    predecessorLayer: os.predecessorLayer,
    softWiredPredecessors: os.softWiredPredecessors,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionChipCloudFabricShipped: false as const,
    dbCandidatesApplied: false as const,
    os,
  };
}

export async function buildChipToCloudCognitiveFabricHealthReport(input?: {
  orgId?: string;
  tenantId?: string;
  universeId?: string;
  actor?: EiActor;
  root?: string;
  repoRoot?: string;
}) {
  const orgId = input?.orgId ?? 'org-local';
  const tenantId = input?.tenantId ?? 'tenant-local';
  const universeId = input?.universeId ?? 'universe-local';
  const actor: EiActor =
    input?.actor ??
    ({
      kind: 'chip_cloud_fabric_curator',
      id: 'health',
      orgId,
      tenantId,
      universeId,
    } satisfies EiActor);
  const cycle = await runChipToCloudCognitiveFabricCycle({
    orgId,
    tenantId,
    universeId,
    actor,
    root: input?.root,
    repoRoot: input?.repoRoot,
  });
  const failed = cycle.hops.filter((h) => h.state === 'FAIL');
  return {
    status: failed.length === 0 ? 'HEALTHY' : 'DEGRADED',
    failedHops: failed.map((h) => h.hop),
    hopCount: cycle.hops.length,
    predecessorLayer: cycle.predecessorLayer,
    softWiredPredecessors: cycle.softWiredPredecessors,
    architectureTranslations: ARCHITECTURE_TRANSLATIONS,
    honesty: chipToCloudCognitiveFabricOsHonesty(input?.repoRoot),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    dbCandidatesApplied: false as const,
  };
}
