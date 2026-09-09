/**
 * 62L-EI Chip-to-Cloud Cognitive Fabric —
 * Governed OS soft-wired over EH→EG→EE when PRESENT.
 */

import { chipToCloudCognitiveFabricHonesty } from './chip-to-cloud-cognitive-fabric';
import {
  ARCHITECTURE_TRANSLATIONS,
  AUTONOMY_BOUNDARY,
  EI_LOCKS,
  HONESTY_BANNER,
  LEARNING_LOOP_RULES,
  NEXT_PHASE_TITLE,
  PRODUCT_PHILOSOPHY,
  detectPredecessorLayer,
  predecessorMap,
  type EiActor,
} from './chip-to-cloud-cognitive-fabric-types';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { enterprisePluginFederationHonesty } from './enterprise-plugin-federation';
import { globalRuntimeReliabilityMeshHonesty } from './global-runtime-reliability-mesh';
import { healthcareLogisticsIntegrationHonesty } from './healthcare-logistics-integration';
import { historicalMedicineKnowledgeAtlasHonesty } from './historical-medicine-knowledge-atlas';
import { neuralDataExpansionHonesty } from './neural-data-expansion';
import { supplierFactoryIntelligenceGraphHonesty } from './supplier-factory-intelligence-graph';

export type ChipToCloudCognitiveFabricOs = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: ReturnType<typeof detectPredecessorLayer>;
  softWiredPredecessors: string[];
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  publicLaunchAuthorized: false;
  contractPaymentAuthorized: false;
  fullProductionChipCloudFabricShipped: false;
  architectureTranslations: typeof ARCHITECTURE_TRANSLATIONS;
  productPhilosophy: typeof PRODUCT_PHILOSOPHY;
  learningLoopRules: typeof LEARNING_LOOP_RULES;
  autonomyBoundary: typeof AUTONOMY_BOUNDARY;
  createdAt: string;
};

type Store = {
  systems: ChipToCloudCognitiveFabricOs[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'chip-to-cloud-cognitive-fabric-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { systems: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function softWireList(repoRoot?: string): string[] {
  const preds = predecessorMap(repoRoot);
  return Object.entries(preds)
    .filter(([, v]) => v.tipProbe === 'PRESENT')
    .map(([k]) => k);
}

export function chipToCloudCognitiveFabricOsHonesty(repoRoot?: string) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: EI_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: EI_LOCKS.TIP_LAND,
    productionAuthorization: EI_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: EI_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: EI_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionChipCloudFabricShipped:
      EI_LOCKS.FULL_PRODUCTION_CHIP_CLOUD_FABRIC_SHIPPED,
    liveSupabaseApply: EI_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: EI_LOCKS.DB_CANDIDATES_APPLIED,
    enterpriseBrandEqActivePartnership:
      EI_LOCKS.ENTERPRISE_BRAND_EQ_ACTIVE_PARTNERSHIP,
    historicalMedicineEqClinicalAuthority:
      EI_LOCKS.HISTORICAL_MEDICINE_EQ_CLINICAL_AUTHORITY,
    historicalMedicineEqModernGuidance:
      EI_LOCKS.HISTORICAL_MEDICINE_EQ_MODERN_GUIDANCE,
    pluginTrustScoreEqAutoGrant: EI_LOCKS.PLUGIN_TRUST_SCORE_EQ_AUTO_GRANT,
    adapterContractEqProprietaryCopy:
      EI_LOCKS.ADAPTER_CONTRACT_EQ_PROPRIETARY_COPY,
    clinicalAuthorityClaimed: EI_LOCKS.CLINICAL_AUTHORITY_CLAIMED,
    medicalDevicePhysicalControlAllowed:
      EI_LOCKS.MEDICAL_DEVICE_PHYSICAL_CONTROL_ALLOWED,
    unsignedEventEqEnrolled: EI_LOCKS.UNSIGNED_EVENT_EQ_ENROLLED,
    autoPoAllowed: EI_LOCKS.AUTO_PO_ALLOWED,
    autoFreightAllowed: EI_LOCKS.AUTO_FREIGHT_ALLOWED,
    stealthInstallAllowed: EI_LOCKS.STEALTH_INSTALL_ALLOWED,
    digitalTwinEqFounder: EI_LOCKS.DIGITAL_TWIN_EQ_FOUNDER,
    publicLaunchAuthorized: EI_LOCKS.PUBLIC_LAUNCH_AUTHORIZED,
    contractPaymentAuthorized: EI_LOCKS.CONTRACT_PAYMENT_AUTHORIZED,
    architectureTranslations: ARCHITECTURE_TRANSLATIONS,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    autonomyBoundary: AUTONOMY_BOUNDARY,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    softWiredPredecessors: softWireList(repoRoot),
    predecessors: predecessorMap(repoRoot),
    subsystems: {
      chipCloudFabric: chipToCloudCognitiveFabricHonesty(),
      healthcareLogistics: healthcareLogisticsIntegrationHonesty(),
      enterprisePlugins: enterprisePluginFederationHonesty(),
      historicalMedicine: historicalMedicineKnowledgeAtlasHonesty(),
      supplierFactory: supplierFactoryIntelligenceGraphHonesty(),
      neuralData: neuralDataExpansionHonesty(),
      reliabilityMesh: globalRuntimeReliabilityMeshHonesty(repoRoot),
    },
  };
}

export async function bootstrapChipToCloudCognitiveFabric(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: EiActor;
  repoRoot?: string;
}): Promise<ChipToCloudCognitiveFabricOs> {
  void input.actor;
  const store = await load(input.root);
  const system: ChipToCloudCognitiveFabricOs = {
    id: id('eiccf'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer: detectPredecessorLayer(input.repoRoot),
    softWiredPredecessors: softWireList(input.repoRoot),
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    publicLaunchAuthorized: false,
    contractPaymentAuthorized: false,
    fullProductionChipCloudFabricShipped: false,
    architectureTranslations: ARCHITECTURE_TRANSLATIONS,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    autonomyBoundary: AUTONOMY_BOUNDARY,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(system);
  await save(input.root, store);
  return system;
}
