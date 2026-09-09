/**
 * 62L-EK Windows/AMD Local Cognitive OS —
 * Governed OS soft-wired over EJ→EI→EG→EE when PRESENT.
 */

import { ethicalCivilizationMemoryAtlasHonesty } from './ethical-civilization-memory-atlas';
import { liveAvatarIdentityLayerHonesty } from './live-avatar-identity-layer';
import { neuralPathwayGraphHonesty } from './neural-pathway-graph';
import { offlineAgentBrainHonesty } from './offline-agent-brain';
import { quantumResearchLabHonesty } from './quantum-research-lab';
import { trafficConversionEngineHonesty } from './traffic-conversion-engine';
import { universalSearchBiOsHonesty } from './universal-search-bi-os';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { windowsHardwareRuntimeProbeHonesty } from './windows-hardware-runtime-probe';
import {
  ARCHITECTURE_TRANSLATIONS,
  AUTONOMY_BOUNDARY,
  EK_LOCKS,
  HONESTY_BANNER,
  LEARNING_LOOP_RULES,
  NEXT_PHASE_TITLE,
  PREFERRED_WINDOWS_AMD_STACK,
  PRODUCT_LOOP,
  PRODUCT_PHILOSOPHY,
  detectPredecessorLayer,
  predecessorMap,
  type EkActor,
} from './windows-amd-local-cognitive-os-types';

export type WindowsAmdLocalCognitiveOs = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: ReturnType<typeof detectPredecessorLayer>;
  softWiredPredecessors: string[];
  preferredStack: typeof PREFERRED_WINDOWS_AMD_STACK;
  productLoop: typeof PRODUCT_LOOP;
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  publicLaunchAuthorized: false;
  contractPaymentAuthorized: false;
  fullProductionWindowsAmdCognitiveOsShipped: false;
  probeFirstRequired: true;
  architectureTranslations: typeof ARCHITECTURE_TRANSLATIONS;
  productPhilosophy: typeof PRODUCT_PHILOSOPHY;
  learningLoopRules: typeof LEARNING_LOOP_RULES;
  autonomyBoundary: typeof AUTONOMY_BOUNDARY;
  createdAt: string;
};

type Store = {
  systems: WindowsAmdLocalCognitiveOs[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'windows-amd-local-cognitive-os.json');
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

export function windowsAmdLocalCognitiveOsHonesty(repoRoot?: string) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: EK_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: EK_LOCKS.TIP_LAND,
    productionAuthorization: EK_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: EK_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: EK_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionWindowsAmdCognitiveOsShipped:
      EK_LOCKS.FULL_PRODUCTION_WINDOWS_AMD_COGNITIVE_OS_SHIPPED,
    liveSupabaseApply: EK_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: EK_LOCKS.DB_CANDIDATES_APPLIED,
    amdRoutingWithoutProbe: EK_LOCKS.AMD_ROUTING_WITHOUT_PROBE,
    agentsWorkingWhileDeviceOff: EK_LOCKS.AGENTS_WORKING_WHILE_DEVICE_OFF,
    silentAuthorityGrowthAllowed: EK_LOCKS.SILENT_AUTHORITY_GROWTH_ALLOWED,
    quantumAdvantageWithoutBaselines:
      EK_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_BASELINES,
    asusEqConnectedQpu: EK_LOCKS.ASUS_EQ_CONNECTED_QPU,
    historicalMedicineEqClinicalAuthority:
      EK_LOCKS.HISTORICAL_MEDICINE_EQ_CLINICAL_AUTHORITY,
    avatarImpersonateWithoutDisclosure:
      EK_LOCKS.AVATAR_IMPORSONATE_LIVE_WITHOUT_DISCLOSURE,
    conversionEqAutoCharge: EK_LOCKS.CONVERSION_EQ_AUTO_CHARGE,
    digitalTwinEqFounder: EK_LOCKS.DIGITAL_TWIN_EQ_FOUNDER,
    publicLaunchAuthorized: EK_LOCKS.PUBLIC_LAUNCH_AUTHORIZED,
    contractPaymentAuthorized: EK_LOCKS.CONTRACT_PAYMENT_AUTHORIZED,
    preferredStack: PREFERRED_WINDOWS_AMD_STACK,
    productLoop: PRODUCT_LOOP,
    architectureTranslations: ARCHITECTURE_TRANSLATIONS,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    learningLoopRules: LEARNING_LOOP_RULES,
    autonomyBoundary: AUTONOMY_BOUNDARY,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    softWiredPredecessors: softWireList(repoRoot),
    predecessors: predecessorMap(repoRoot),
    subsystems: {
      windowsProbe: windowsHardwareRuntimeProbeHonesty(),
      offlineBrain: offlineAgentBrainHonesty(),
      neuralPathways: neuralPathwayGraphHonesty(),
      civilizationAtlas: ethicalCivilizationMemoryAtlasHonesty(),
      quantumLab: quantumResearchLabHonesty(),
      universalSearch: universalSearchBiOsHonesty(),
      liveAvatar: liveAvatarIdentityLayerHonesty(),
      trafficConversion: trafficConversionEngineHonesty(),
    },
  };
}

export async function bootstrapWindowsAmdLocalCognitiveOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: EkActor;
  repoRoot?: string;
}): Promise<WindowsAmdLocalCognitiveOs> {
  void input.actor;
  const store = await load(input.root);
  const system: WindowsAmdLocalCognitiveOs = {
    id: id('ekwacos'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer: detectPredecessorLayer(input.repoRoot),
    softWiredPredecessors: softWireList(input.repoRoot),
    preferredStack: PREFERRED_WINDOWS_AMD_STACK,
    productLoop: PRODUCT_LOOP,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    publicLaunchAuthorized: false,
    contractPaymentAuthorized: false,
    fullProductionWindowsAmdCognitiveOsShipped: false,
    probeFirstRequired: true,
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
