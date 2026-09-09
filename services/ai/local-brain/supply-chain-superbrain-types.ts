import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DW — XIV Supply Chain Superbrain + Universal Data Lakehouse OS +
 * Digital Twin Simulation Factory + Semiconductor/Edge Compute Control Tower +
 * Personal Knowledge Vault + Agent Memory Highway +
 * Global Industry Knowledge Graph + Secure Multimodal Experience Layer.
 *
 * SoT: GitHub #140. GitLab #74 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire DV / DU / DT when PRESENT.
 * Recommendation ≠ charge / deploy / spend / sign / publish.
 * Broader industry expansion stays behind supply-chain pilot (wedge-first) — gate, not fake GA.
 * Lakehouse / data-quality agents ≠ auto-prod DDL or live migration (DB candidates NOT_APPLIED).
 * Calibrated digital twins ≠ guaranteed accuracy or physical control; sim/forecast ≠ verified fact.
 * Semiconductor/edge control tower ≠ unauthorized remote hardware control; proof before hardware-support claims.
 * Encrypted personal knowledge + signed agent memory highways; sealed deny on unsigned/unenrolled.
 * Multimodal: biometric/camera defaults OFF / opt-in / preferably local / revocable;
 * no surveillance / profiling / covert emotion / cross-context tracking.
 * Adult trust-circle soft-wire: 18+ only; no minors; no non-consensual imagery.
 * CEO/founder-sealed: deny-by-default; label alone ≠ access; Digital Twin ≠ founder.
 * RUNNING_VERIFIED needs heartbeat/runtime evidence.
 * Offline: WAITING_NODE / OFFLINE_STOPPED when no powered authorized node.
 * tip-land=NO. No PR / no prod deploy / no DB migration / no public launch.
 */

export const SUPPLY_CHAIN_SUPERBRAIN_CYCLE = [
  'honesty_locks',
  'supply_chain_superbrain_bootstrap',
  // A — Supply Chain Superbrain
  'sc_advisory_neq_deploy_spend',
  'sc_human_gate_required',
  'unconfigured_sc_provider_unavailable',
  // B — Universal Data Lakehouse OS
  'lakehouse_ddl_neq_auto_prod',
  'data_quality_agent_neq_live_migration',
  'db_candidates_not_applied',
  // C — Digital Twin Simulation Factory
  'sim_neq_verified_fact',
  'twin_neq_physical_control',
  'accuracy_claim_requires_proof',
  // D — Semiconductor / Edge Compute Control Tower
  'hardware_support_requires_proof',
  'edge_neq_unauthorized_remote_control',
  'chip_running_verified_needs_evidence',
  // E — Personal Knowledge Vault
  'vault_encrypted_permission_aware',
  'vault_cross_context_denied',
  // F — Agent Memory Highway
  'unsigned_memory_highway_denied',
  'unenrolled_memory_peer_denied',
  // G — Global Industry Knowledge Graph
  'industry_pack_behind_supply_chain_pilot',
  'wedge_first_broader_industry_gated',
  // H — Secure Multimodal Experience Layer
  'multimodal_biometric_defaults_off',
  'covert_emotion_surveillance_denied',
  'adult_trust_circle_minors_denied',
  'neural_node_sealed_deny_by_default',
  'offline_without_powered_node_waiting_or_stopped',
  'digital_twin_neq_founder',
  'running_verified_requires_heartbeat',
  'evidence',
  'learning',
] as const;

export type DwHop = (typeof SUPPLY_CHAIN_SUPERBRAIN_CYCLE)[number];

export type DwEvidenceState =
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
  | 'ADVISORY_ONLY';

export type DwHopRecord = {
  hop: DwHop;
  state: DwEvidenceState;
  summary: string;
  at: string;
};

export type DwActorKind =
  | 'supply_chain_curator'
  | 'lakehouse_governor'
  | 'digital_twin_sim_operator'
  | 'edge_compute_tower_operator'
  | 'knowledge_vault_curator'
  | 'memory_highway_operator'
  | 'industry_graph_curator'
  | 'multimodal_experience_curator'
  | 'neural_superbrain_curator'
  | 'human_approver'
  | 'founder'
  | 'digital_twin'
  | 'agent';

export type DwActor = {
  kind: DwActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 140;
export const GITLAB_COORDINATION_ISSUE = 74;

export const NEXT_PHASE_TITLE =
  '62L-DX — XIV Autonomous Supply Chain Operations Brain + Global Data Fabric & Retrieval Engine + Digital Twin Experiment Laboratory + Edge/Chip Runtime Federation + Personal/Enterprise Memory Cortex + Agent-to-Agent Knowledge Bus + Industry Pack Marketplace + Launch Reliability Command Center';

export const DW_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_SUPPLY_CHAIN_SUPERBRAIN_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  RECOMMENDATION_EQ_SPEND: false as const,
  RECOMMENDATION_EQ_SIGN: false as const,
  RECOMMENDATION_EQ_PUBLISH: false as const,
  LAKEHOUSE_AUTO_PROD_DDL: false as const,
  DATA_QUALITY_AUTO_LIVE_MIGRATION: false as const,
  SIM_EQ_VERIFIED_FACT: false as const,
  TWIN_EQ_PHYSICAL_CONTROL: false as const,
  ACCURACY_WITHOUT_PROOF: false as const,
  HARDWARE_SUPPORT_WITHOUT_PROOF: false as const,
  UNAUTHORIZED_REMOTE_HARDWARE_CONTROL: false as const,
  UNSIGNED_MEMORY_HIGHWAY_ALLOWED: false as const,
  BROADER_INDUSTRY_BEFORE_SUPPLY_CHAIN_PILOT: false as const,
  BIOMETRIC_CAMERA_DEFAULT_ON: false as const,
  COVERT_EMOTION_SURVEILLANCE: false as const,
  CROSS_CONTEXT_TRACKING: false as const,
  MINORS_IN_TRUST_CIRCLE: false as const,
  NON_CONSENSUAL_IMAGERY: false as const,
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
  LABEL_ALONE_EQ_ACCESS: false as const,
  CONSCIOUSNESS_CLAIMED: false as const,
  PUBLIC_LAUNCH_AUTHORIZED: false as const,
  CONTRACT_PAYMENT_AUTHORIZED: false as const,
});

export const SC_ADVISORY_NEQ_DEPLOY = 'SC_ADVISORY_NEQ_DEPLOY_SPEND';
export const SC_HUMAN_GATE_REQUIRED = 'SC_HUMAN_GATE_REQUIRED';
export const UNCONFIGURED_SC_PROVIDER = 'UNCONFIGURED_SC_PROVIDER_UNAVAILABLE';
export const LAKEHOUSE_DDL_NEQ_AUTO = 'LAKEHOUSE_DDL_NEQ_AUTO_PROD';
export const DQ_NEQ_LIVE_MIGRATION = 'DATA_QUALITY_AGENT_NEQ_LIVE_MIGRATION';
export const DB_CANDIDATES_NOT_APPLIED = 'DB_CANDIDATES_NOT_APPLIED';
export const SIM_NEQ_FACT = 'SIM_NEQ_VERIFIED_FACT';
export const TWIN_NEQ_PHYSICAL = 'TWIN_NEQ_PHYSICAL_CONTROL';
export const ACCURACY_PROOF_REQUIRED = 'ACCURACY_CLAIM_REQUIRES_PROOF';
export const HARDWARE_PROOF_REQUIRED = 'HARDWARE_SUPPORT_REQUIRES_PROOF';
export const EDGE_NEQ_REMOTE = 'EDGE_NEQ_UNAUTHORIZED_REMOTE_CONTROL';
export const CHIP_HEARTBEAT_REQUIRED = 'CHIP_RUNNING_VERIFIED_NEEDS_EVIDENCE';
export const VAULT_ENCRYPTED = 'VAULT_ENCRYPTED_PERMISSION_AWARE';
export const VAULT_CROSS_CONTEXT = 'VAULT_CROSS_CONTEXT_DENIED';
export const UNSIGNED_HIGHWAY = 'UNSIGNED_MEMORY_HIGHWAY_DENIED';
export const UNENROLLED_PEER = 'UNENROLLED_MEMORY_PEER_DENIED';
export const INDUSTRY_BEHIND_PILOT = 'INDUSTRY_PACK_BEHIND_SUPPLY_CHAIN_PILOT';
export const WEDGE_FIRST_GATED = 'WEDGE_FIRST_BROADER_INDUSTRY_GATED';
export const BIOMETRIC_DEFAULTS_OFF = 'MULTIMODAL_BIOMETRIC_DEFAULTS_OFF';
export const COVERT_DENIED = 'COVERT_EMOTION_SURVEILLANCE_DENIED';
export const MINORS_DENIED = 'ADULT_TRUST_CIRCLE_MINORS_DENIED';
export const NEURAL_SEALED_DENIED = 'NEURAL_NODE_SEALED_DENY_BY_DEFAULT';
export const OFFLINE_WAITING_OR_STOPPED = 'OFFLINE_WITHOUT_POWERED_NODE_WAITING_OR_STOPPED';
export const TWIN_NEQ_FOUNDER = 'DIGITAL_TWIN_NEQ_FOUNDER';
export const HEARTBEAT_REQUIRED = 'RUNNING_VERIFIED_REQUIRES_HEARTBEAT';

export const MAX_SC_NODES = 2000;
export const MAX_LAKEHOUSE_CANDIDATES = 500;
export const MAX_SIM_RUNS = 500;
export const MAX_EDGE_PROBES = 500;
export const MAX_VAULT_ENTRIES = 2000;
export const MAX_MEMORY_HOPS = 2000;
export const MAX_INDUSTRY_PACKS = 300;
export const MAX_MULTIMODAL_SESSIONS = 500;
export const MAX_NEURAL_NODES = 2000;
export const MAX_AUDIT_EVENTS = 5000;

export function isHumanOrFounder(actor: DwActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type DwPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(repoRoot?: string): Record<string, DwPredecessorProbe> {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const ops = join(root, 'docs/operations');
  const brain = join(root, 'services/ai/local-brain');
  const has = (dir: string, file: string) => existsSync(join(dir, file));

  return {
    DV: {
      tipProbe:
        has(brain, 'universal-data-industry-cortex-types.ts') ||
        has(brain, 'universal-data-industry-cortex.ts') ||
        has(ops, '62L_DV_UNIVERSAL_DATA_INDUSTRY_CORTEX_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DV_UNIVERSAL_DATA_INDUSTRY_CORTEX_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred DV Universal Data & Industry Cortex tip + report.',
    },
    DU: {
      tipProbe:
        has(brain, 'universal-industry-intelligence-os-types.ts') ||
        has(brain, 'universal-industry-intelligence-os.ts') ||
        has(ops, '62L_DU_UNIVERSAL_INDUSTRY_INTELLIGENCE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DU_UNIVERSAL_INDUSTRY_INTELLIGENCE_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'DU Universal Industry Intelligence OS fallback when DV absent.',
    },
    DT: {
      tipProbe:
        has(brain, 'growth-operating-system-types.ts') ||
        has(brain, 'growth-operating-system.ts') ||
        has(ops, '62L_DT_GROWTH_OPERATING_SYSTEM_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DT_GROWTH_OPERATING_SYSTEM_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DT Growth Operating System base @ 0a057aa when DV/DU WAITING_DATA.',
    },
    DS: {
      tipProbe:
        has(brain, 'revenue-intelligence-os-types.ts') ||
        has(brain, 'revenue-intelligence-os.ts') ||
        has(ops, '62L_DS_REVENUE_INTELLIGENCE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DS_REVENUE_INTELLIGENCE_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DS Revenue Intelligence OS soft-wire in DT lineage.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'DV' | 'DU' | 'DT' | 'DS' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['DV', 'DU', 'DT', 'DS'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}

export const PRODUCT_PHILOSOPHY = Object.freeze({
  specializedGovernedAgents: true,
  storyBeforeDashboard: true,
  measurableOutcomes: true,
  privateUniverses: true,
  humanControl: true,
  wedgeFirstSupplyChainPilot: true,
  broaderIndustryRequiresSupplyChainPilotProof: true,
  integrateWithCustomerExistingSystems: true,
  proofBeforeCompatibilityClaims: true,
  proofBeforeHardwareSupportClaims: true,
  proofBeforeSimulationAccuracyClaims: true,
  proofBeforeOfflineOperationClaims: true,
});
