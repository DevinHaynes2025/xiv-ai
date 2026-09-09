import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-EI — XIV Chip-to-Cloud Cognitive Fabric + Healthcare/Logistics
 * Integration OS + Enterprise Plugin Federation + Historical Medicine
 * Knowledge Atlas + Supplier/Factory Intelligence Graph + Neural Data
 * Expansion + Global Runtime Reliability Mesh.
 *
 * SoT: GitHub #153. GitLab #86 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire EH → EG → EE when PRESENT (EH preferred; else EG; else EE).
 * Unconfigured providers UNAVAILABLE.
 * Correlation ≠ causation; sim/forecast ≠ verified fact; prototype ≠ invention.
 * CEO/founder-sealed: deny-by-default; label alone ≠ access; Digital Twin ≠ founder.
 * Recommendation ≠ charge/deploy/spend/sign/publish.
 *
 * Enterprise brand honesty (hard): Amazon, Walmart, Salesforce, Oracle, and
 * similar = INTEGRATION_CANDIDATE / UNVERIFIED_RELATIONSHIP until evidence of
 * actual customer/partnership. Unconfigured connectors → UNAVAILABLE.
 * Oracle/Salesforce-compatible = authorized adapter contracts, not proprietary
 * source/schema copy.
 *
 * Historical medicine (hard): Egyptian/African/Chinese and other traditions =
 * cultural/research knowledge with provenance + evidence labels. NOT automatic
 * modern medical guidance or clinical authority. Recommend ≠ diagnose/prescribe/treat.
 *
 * Hospital tech ops / medical-device logistics = planning/intelligence with human
 * gates — ≠ unauthorized clinical/physical device control.
 * Plugin trust scoring ≠ auto-grant; marketplace listing ≠ trust.
 * Supplier/factory/electronics/semiconductor SC = advisory; ≠ physical control /
 * auto PO/freight.
 * Offline historical knowledge packs honest; WAITING_NODE / OFFLINE_STOPPED.
 * Signed event interoperability + lineage: unsigned/unenrolled sealed deny.
 * Learning/skill ≠ permission; self-promotion denied.
 * RUNNING_VERIFIED needs evidence.
 * DB candidates NOT_APPLIED.
 * Autonomy: no independent freight/PO/contract/spend/prod-change.
 * Architecture translations from EG soft-wire if present.
 * Anti-malware OS soft-wire preserved if present.
 * tip-land=NO.
 */

export const CHIP_TO_CLOUD_COGNITIVE_FABRIC_CYCLE = [
  'honesty_locks',
  'chip_to_cloud_cognitive_fabric_bootstrap',
  // A — Chip-to-Cloud Cognitive Fabric
  'chip_cloud_fabric_register',
  'chip_cloud_evidence_gate',
  'chip_cloud_unconfigured_unavailable',
  // B — Healthcare/Logistics Integration OS
  'healthcare_logistics_plan_human_gates',
  'healthcare_neq_clinical_authority',
  'medical_device_logistics_neq_physical_control',
  // C — Enterprise Plugin Federation
  'enterprise_brand_integration_candidate',
  'plugin_trust_score_neq_auto_grant',
  'unconfigured_connector_unavailable',
  'adapter_contract_neq_proprietary_copy',
  // D — Historical Medicine Knowledge Atlas
  'historical_medicine_provenance_labeled',
  'historical_medicine_neq_clinical_guidance',
  'offline_medicine_pack_honest',
  // E — Supplier/Factory Intelligence Graph
  'supplier_factory_advisory_only',
  'sc_advisory_neq_auto_po_freight',
  'electronics_sc_neq_physical_control',
  // F — Neural Data Expansion
  'business_system_translation',
  'signed_event_interop',
  'unsigned_unenrolled_sealed_deny',
  'lineage_tracking',
  // G — Global Runtime Reliability Mesh
  'reliability_mesh_register',
  'neural_node_soft_wire',
  'offline_waiting_or_stopped',
  // H — Denial / honesty
  'eh_eg_ee_soft_wire_probe',
  'stealth_install_denied',
  'digital_twin_neq_founder',
  'autonomy_boundary_no_freight_po_spend',
  'evidence',
  'learning',
] as const;

export type EiHop = (typeof CHIP_TO_CLOUD_COGNITIVE_FABRIC_CYCLE)[number];

export type EiEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'STALE'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED'
  | 'REJECTED'
  | 'SANDBOXED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'LABELED_SIMULATION'
  | 'LABELED_FORECAST'
  | 'LABELED_EXPERIMENT'
  | 'NOT_APPLIED'
  | 'NOT_VERIFIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'LOCAL_PREFERRED'
  | 'APPROVED'
  | 'CONFIGURED'
  | 'AUTHORIZED'
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'CONTRACT_ONLY'
  | 'TEST_ONLY'
  | 'LOGICAL'
  | 'ARCHITECTURE_TARGET'
  | 'CORRELATION_ONLY'
  | 'ADVISORY_ONLY'
  | 'PROMOTION_DENIED'
  | 'RESEARCH_SIM'
  | 'SPECULATIVE'
  | 'DEFENSIVE_ONLY'
  | 'INTEGRATION_CANDIDATE'
  | 'UNVERIFIED_RELATIONSHIP'
  | 'CULTURAL_RESEARCH_KNOWLEDGE'
  | 'PROVENANCE_LABELED'
  | 'UNSIGNED_DENIED'
  | 'LINEAGE_RECORDED'
  | 'TRUST_SCORED_NO_GRANT'
  | 'ADAPTER_CONTRACT_ONLY';

export type EiHopRecord = {
  hop: EiHop;
  state: EiEvidenceState;
  summary: string;
  at: string;
};

export type EiActorKind =
  | 'chip_cloud_fabric_curator'
  | 'healthcare_logistics_planner'
  | 'enterprise_plugin_curator'
  | 'historical_medicine_steward'
  | 'supplier_factory_analyst'
  | 'neural_data_operator'
  | 'reliability_mesh_operator'
  | 'human_approver'
  | 'founder'
  | 'digital_twin'
  | 'agent';

export type EiActor = {
  kind: EiActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 153;
export const GITLAB_COORDINATION_ISSUE = 86;

export const NEXT_PHASE_TITLE =
  '62L-EJ — XIV Global Healthcare & Supply Chain Nervous System + Universal Enterprise Integration Gateway + Factory-to-Retail Digital Twin Network + Semiconductor/Device Lifecycle Brain + Civilization Medicine Research Cortex + Federated Knowledge Graph + Offline Edge Intelligence Packs + Enterprise Reliability Control Tower';

/** Soft-wire EG architecture translations when present. */
export const ARCHITECTURE_TRANSLATIONS = Object.freeze({
  atomSizedTrillionsOfAgentsMeans:
    'highly_compressed_logical_micro_agents_and_synthetic_populations' as const,
  atomSizedTrillionsOfAgentsDoesNotMean:
    'physical_atom_scale_agents_or_nonexistent_hardware' as const,
  wormholesMeans:
    'low_latency_routing_cache_index_shortcuts' as const,
  wormholesDoesNotMean: 'literal_spacetime_wormholes' as const,
  parallelUniversesMeans: 'isolated_simulation_branches' as const,
  parallelUniversesDoesNotMean: 'literal_alternate_realities' as const,
});

export const EI_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_CHIP_CLOUD_FABRIC_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  RECOMMENDATION_EQ_SPEND: false as const,
  RECOMMENDATION_EQ_SIGN: false as const,
  RECOMMENDATION_EQ_PUBLISH: false as const,
  LABEL_ALONE_EQ_ACCESS: false as const,
  UNCONFIGURED_PROVIDER_EQ_AVAILABLE: false as const,
  FABRICATED_PROVIDER_CREDS_ALLOWED: false as const,
  MISSING_EVIDENCE_EQ_VERIFIED: false as const,
  CORRELATION_EQ_CAUSATION: false as const,
  SIM_EQ_VERIFIED_FACT: false as const,
  PROTOTYPE_EQ_INVENTION: false as const,
  ENTERPRISE_BRAND_EQ_ACTIVE_PARTNERSHIP: false as const,
  ENTERPRISE_BRAND_EQ_CUSTOMER_WITHOUT_EVIDENCE: false as const,
  ADAPTER_CONTRACT_EQ_PROPRIETARY_COPY: false as const,
  PLUGIN_TRUST_SCORE_EQ_AUTO_GRANT: false as const,
  MARKETPLACE_LISTING_EQ_TRUST: false as const,
  HISTORICAL_MEDICINE_EQ_CLINICAL_AUTHORITY: false as const,
  HISTORICAL_MEDICINE_EQ_MODERN_GUIDANCE: false as const,
  RECOMMEND_EQ_DIAGNOSE_PRESCRIBE_TREAT: false as const,
  CLINICAL_AUTHORITY_CLAIMED: false as const,
  HOSPITAL_PHYSICAL_CONTROL_ALLOWED: false as const,
  MEDICAL_DEVICE_PHYSICAL_CONTROL_ALLOWED: false as const,
  MEDICAL_ADVICE_AUTHORITY: false as const,
  SUPPLIER_ADVISORY_EQ_PHYSICAL_CONTROL: false as const,
  AUTO_PO_ALLOWED: false as const,
  AUTO_FREIGHT_ALLOWED: false as const,
  UNSIGNED_EVENT_EQ_ENROLLED: false as const,
  RUNNING_VERIFIED_WITHOUT_EVIDENCE: false as const,
  OFFENSIVE_EXPLOIT_TOOLING_ALLOWED: false as const,
  STEALTH_INSTALL_ALLOWED: false as const,
  UNAUTHORIZED_TAKEOVER_ALLOWED: false as const,
  PERMISSION_BYPASS_ALLOWED: false as const,
  SILENT_PERSISTENCE_ALLOWED: false as const,
  SELF_PROMOTION_TO_PROD_ALLOWED: false as const,
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
  LEARNING_EQ_PERMISSION: false as const,
  FREIGHT_BOOKING_AUTONOMOUS: false as const,
  PO_ISSUANCE_AUTONOMOUS: false as const,
  CONTRACT_SIGNING_AUTONOMOUS: false as const,
  SPEND_MONEY_AUTONOMOUS: false as const,
  PRODUCTION_CHANGE_AUTONOMOUS: false as const,
  PUBLIC_LAUNCH_AUTHORIZED: false as const,
  CONTRACT_PAYMENT_AUTHORIZED: false as const,
});

export const CHIP_CLOUD_FABRIC_REGISTERED = 'CHIP_CLOUD_FABRIC_REGISTERED';
export const CHIP_CLOUD_EVIDENCE_GATE = 'CHIP_CLOUD_EVIDENCE_GATE_REQUIRED';
export const CHIP_CLOUD_UNCONFIGURED = 'CHIP_CLOUD_UNCONFIGURED_UNAVAILABLE';
export const HEALTHCARE_PLAN_HUMAN_GATES =
  'HEALTHCARE_LOGISTICS_PLAN_HUMAN_GATES';
export const HEALTHCARE_NEQ_CLINICAL = 'HEALTHCARE_NEQ_CLINICAL_AUTHORITY';
export const MEDICAL_DEVICE_NEQ_PHYSICAL =
  'MEDICAL_DEVICE_LOGISTICS_NEQ_PHYSICAL_CONTROL';
export const INTEGRATION_CANDIDATE_LABEL = 'INTEGRATION_CANDIDATE';
export const UNVERIFIED_RELATIONSHIP_LABEL = 'UNVERIFIED_RELATIONSHIP';
export const PLUGIN_TRUST_NEQ_AUTO_GRANT =
  'PLUGIN_TRUST_SCORE_NEQ_AUTO_GRANT';
export const UNCONFIGURED_CONNECTOR_UNAVAILABLE =
  'UNCONFIGURED_CONNECTOR_UNAVAILABLE';
export const ADAPTER_NEQ_PROPRIETARY =
  'ADAPTER_CONTRACT_NEQ_PROPRIETARY_COPY';
export const HISTORICAL_MEDICINE_PROVENANCE =
  'HISTORICAL_MEDICINE_PROVENANCE_LABELED';
export const HISTORICAL_MEDICINE_NEQ_CLINICAL =
  'HISTORICAL_MEDICINE_NEQ_CLINICAL_GUIDANCE';
export const OFFLINE_MEDICINE_PACK_HONEST = 'OFFLINE_MEDICINE_PACK_HONEST';
export const SUPPLIER_FACTORY_ADVISORY = 'SUPPLIER_FACTORY_ADVISORY_ONLY';
export const SC_NEQ_AUTO_PO_FREIGHT = 'SC_ADVISORY_NEQ_AUTO_PO_FREIGHT';
export const ELECTRONICS_SC_NEQ_PHYSICAL =
  'ELECTRONICS_SC_NEQ_PHYSICAL_CONTROL';
export const BUSINESS_SYSTEM_TRANSLATION = 'BUSINESS_SYSTEM_TRANSLATION';
export const SIGNED_EVENT_INTEROP = 'SIGNED_EVENT_INTEROP';
export const UNSIGNED_UNENROLLED_DENY = 'UNSIGNED_UNENROLLED_SEALED_DENY';
export const LINEAGE_TRACKING = 'LINEAGE_TRACKING';
export const RELIABILITY_MESH_REGISTERED = 'RELIABILITY_MESH_REGISTERED';
export const NEURAL_NODE_SOFT_WIRE = 'NEURAL_NODE_SOFT_WIRE';
export const OFFLINE_WAITING_OR_STOPPED =
  'OFFLINE_WAITING_NODE_OR_OFFLINE_STOPPED';
export const STEALTH_INSTALL_DENIED = 'STEALTH_INSTALL_DENIED';
export const TWIN_NEQ_FOUNDER = 'DIGITAL_TWIN_NEQ_FOUNDER';
export const AUTONOMY_BOUNDARY_DENIED =
  'AUTONOMY_BOUNDARY_NO_FREIGHT_PO_SPEND';

export const MAX_FABRIC_EVENTS = 500;
export const MAX_HEALTHCARE_EVENTS = 500;
export const MAX_PLUGIN_EVENTS = 500;
export const MAX_MEDICINE_EVENTS = 500;
export const MAX_SUPPLIER_EVENTS = 500;
export const MAX_NEURAL_EVENTS = 500;
export const MAX_RELIABILITY_EVENTS = 500;
export const MAX_AUDIT_EVENTS = 5000;

export const ENTERPRISE_BRAND_CANDIDATES = Object.freeze([
  'amazon',
  'walmart',
  'salesforce',
  'oracle',
] as const);

export function isHumanOrFounder(actor: EiActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type EiPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(
  repoRoot?: string,
): Record<string, EiPredecessorProbe> {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const ops = join(root, 'docs/operations');
  const brain = join(root, 'services/ai/local-brain');
  const has = (dir: string, file: string) => existsSync(join(dir, file));
  const hasPrefix = (dir: string, prefix: string) => {
    try {
      return readdirSync(dir).some((f) => f.startsWith(prefix));
    } catch {
      return false;
    }
  };

  return {
    EH: {
      tipProbe:
        has(brain, 'semiconductor-intelligence-superhighway-types.ts') ||
        has(brain, 'semiconductor-intelligence-superhighway.ts') ||
        has(ops, '62L_EH_SEMICONDUCTOR_INTELLIGENCE_SUPERHIGHWAY_REPORT.md') ||
        hasPrefix(ops, '62L_EH_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_EH_SEMICONDUCTOR_INTELLIGENCE_SUPERHIGHWAY_REPORT.md') ||
        hasPrefix(ops, '62L_EH_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'Preferred EH Semiconductor Intelligence Superhighway tip + report (may be absent).',
    },
    EG: {
      tipProbe:
        has(brain, 'cognitive-operations-backbone-types.ts') ||
        has(brain, 'cognitive-operations-backbone.ts') ||
        has(ops, '62L_EG_COGNITIVE_OPERATIONS_BACKBONE_REPORT.md') ||
        hasPrefix(ops, '62L_EG_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_EG_COGNITIVE_OPERATIONS_BACKBONE_REPORT.md') ||
        hasPrefix(ops, '62L_EG_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'EG Cognitive Operations Backbone fallback when EH absent.',
    },
    EE: {
      tipProbe:
        has(brain, 'data-nervous-system-types.ts') ||
        has(brain, 'data-nervous-system.ts') ||
        has(ops, '62L_EE_DATA_NERVOUS_SYSTEM_REPORT.md') ||
        hasPrefix(ops, '62L_EE_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_EE_DATA_NERVOUS_SYSTEM_REPORT.md') ||
        hasPrefix(ops, '62L_EE_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'EE Data Nervous System fallback when EH+EG absent.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'EH' | 'EG' | 'EE' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['EH', 'EG', 'EE'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}

export const PRODUCT_PHILOSOPHY = Object.freeze({
  chipCloudFabricEvidenceGated: true,
  unconfiguredProvidersUnavailable: true,
  healthcareLogisticsHumanGates: true,
  healthcareNeqClinicalAuthority: true,
  medicalDeviceLogisticsNeqPhysicalControl: true,
  enterpriseBrandIntegrationCandidateUntilEvidence: true,
  pluginTrustScoreNeqAutoGrant: true,
  adapterContractNeqProprietaryCopy: true,
  historicalMedicineProvenanceLabeled: true,
  historicalMedicineNeqClinicalGuidance: true,
  offlineMedicinePacksHonest: true,
  supplierFactoryAdvisoryOnly: true,
  scAdvisoryNeqAutoPoFreight: true,
  signedEventInteropRequired: true,
  unsignedUnenrolledSealedDeny: true,
  lineageTrackingRequired: true,
  reliabilityMeshSoftWireEgEe: true,
  offlineHonestWaitingOrStopped: true,
  antiMalwareNoStealthInstall: true,
  denyByDefaultFounderSealed: true,
  digitalTwinNeqFounder: true,
});

export const LEARNING_LOOP_RULES = Object.freeze({
  learningNeqPermission: true,
  correlationNeqCausation: true,
  retainOnlyReproducibleEvidenceBackedImprovements: true,
  noSelfPromotionToProduction: true,
  simForecastNeqVerifiedFact: true,
  historicalMedicineNeqClinicalAuthority: true,
  integrationCandidateUntilEvidence: true,
});

export const AUTONOMY_BOUNDARY = Object.freeze({
  allowed: [
    'analyze',
    'simulate',
    'recommend',
    'label_provenance',
    'register_chip_cloud_fabric',
    'plan_healthcare_logistics',
    'score_plugin_trust',
    'curate_historical_medicine_atlas',
    'advise_supplier_factory_graph',
    'translate_business_systems',
    'track_signed_event_lineage',
    'register_reliability_mesh',
  ] as const,
  denied: [
    'book_freight',
    'issue_purchase_order',
    'sign_contract',
    'spend_money',
    'change_production_system',
    'claim_active_enterprise_partnership_without_evidence',
    'auto_grant_plugin_authority',
    'copy_proprietary_oracle_salesforce_schema',
    'diagnose_prescribe_treat',
    'clinical_control',
    'physical_medical_device_control',
    'physical_hospital_control',
    'accept_unsigned_unenrolled_events',
    'apply_live_db_migration',
    'stealth_install',
  ] as const,
  humanFounderGateRequired: true as const,
  denyByDefault: true as const,
});
