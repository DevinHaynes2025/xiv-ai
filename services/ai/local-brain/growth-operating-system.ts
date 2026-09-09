/**
 * 62L-DT Growth Operating System —
 * Governed growth/revenue OS soft-wired over DS→DR→DQ→DP when PRESENT.
 */

import { aiRevenueFactoryHonesty } from './ai-revenue-factory';
import { customerAcquisitionPartnershipBrainHonesty } from './customer-acquisition-partnership-brain';
import { enterpriseDealDeskHonesty } from './enterprise-deal-desk';
import { executivePerformanceNervousSystemHonesty } from './executive-performance-nervous-system';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DT_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PRODUCT_PHILOSOPHY,
  detectPredecessorLayer,
  type DtActor,
} from './growth-operating-system-types';
import { launchMissionControlHonesty } from './launch-mission-control';
import {
  detectDpSoftWire,
  neuralGrowthNodesHonesty,
} from './neural-growth-nodes';
import { pricingOptimizationLabHonesty } from './pricing-optimization-lab';
import { retentionExpansionIntelligenceHonesty } from './retention-expansion-intelligence';

export type GrowthOperatingSystem = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: ReturnType<typeof detectPredecessorLayer>;
  dpSoftWired: boolean;
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  publicLaunchAuthorized: false;
  contractPaymentAuthorized: false;
  fullProductionGrowthOsShipped: false;
  productPhilosophy: typeof PRODUCT_PHILOSOPHY;
  createdAt: string;
};

type Store = {
  systems: GrowthOperatingSystem[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'growth-operating-system.json');
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

export function growthOperatingSystemHonesty(repoRoot?: string) {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DT_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DT_LOCKS.TIP_LAND,
    productionAuthorization: DT_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DT_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DT_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    fullProductionGrowthOsShipped: DT_LOCKS.FULL_PRODUCTION_GROWTH_OS_SHIPPED,
    liveSupabaseApply: DT_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DT_LOCKS.DB_CANDIDATES_APPLIED,
    recommendEqCharge: DT_LOCKS.RECOMMENDATION_EQ_CHARGE,
    pricingExperimentAutoPrice: DT_LOCKS.PRICING_EXPERIMENT_AUTO_PRICE,
    dealApprovalAutoSign: DT_LOCKS.DEAL_APPROVAL_AUTO_SIGN,
    launchCountdownEqPublicLaunch: DT_LOCKS.LAUNCH_COUNTDOWN_EQ_PUBLIC_LAUNCH,
    renewalRiskAutoRenew: DT_LOCKS.RENEWAL_RISK_AUTO_RENEW,
    decisionOutcomeGuaranteedCausation: DT_LOCKS.DECISION_OUTCOME_GUARANTEED_CAUSATION,
    digitalTwinEqFounder: DT_LOCKS.DIGITAL_TWIN_EQ_FOUNDER,
    publicLaunchAuthorized: DT_LOCKS.PUBLIC_LAUNCH_AUTHORIZED,
    contractPaymentAuthorized: DT_LOCKS.CONTRACT_PAYMENT_AUTHORIZED,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    dpSoftWired: detectDpSoftWire(repoRoot),
    subsystems: {
      revenueFactory: aiRevenueFactoryHonesty(),
      acquisitionPartnership: customerAcquisitionPartnershipBrainHonesty(),
      dealDesk: enterpriseDealDeskHonesty(),
      pricingLab: pricingOptimizationLabHonesty(),
      launchMissionControl: launchMissionControlHonesty(),
      retentionExpansion: retentionExpansionIntelligenceHonesty(),
      executivePerformance: executivePerformanceNervousSystemHonesty(),
      neuralGrowthNodes: neuralGrowthNodesHonesty(repoRoot),
    },
  };
}

export async function bootstrapGrowthOperatingSystem(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DtActor;
  repoRoot?: string;
}): Promise<GrowthOperatingSystem> {
  const store = await load(input.root);
  void input.actor;
  const os: GrowthOperatingSystem = {
    id: id('dtgos'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer: detectPredecessorLayer(input.repoRoot),
    dpSoftWired: detectDpSoftWire(input.repoRoot),
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    publicLaunchAuthorized: false,
    contractPaymentAuthorized: false,
    fullProductionGrowthOsShipped: false,
    productPhilosophy: PRODUCT_PHILOSOPHY,
    createdAt: new Date().toISOString(),
  };
  store.systems.push(os);
  await save(input.root, store);
  return os;
}
