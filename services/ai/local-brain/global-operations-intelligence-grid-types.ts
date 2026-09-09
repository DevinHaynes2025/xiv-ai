import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-EA — XIV Global Operations Intelligence Grid + Grok/xAI Model Federation +
 * Cloud Microserver & Virtual GPU Fabric + Quantum-Inspired Compute Brain +
 * Historical Civilization/Space Knowledge Atlas + Agent Department Network +
 * XR/Holographic Research Layer + Secure OS Integration Foundation.
 *
 * SoT: GitHub #145. GitLab #79 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire DZ / DY when PRESENT.
 * Grok/xAI = optional authorized model provider (REST/gRPC/OpenAI-compatible/
 * function calling/structured outputs/model discovery/agentic coding as
 * integration design surface only until configured + authorized).
 * Unconfigured providers → UNAVAILABLE. No fabricated live xAI calls.
 * Correlation ≠ causation; sim/forecast ≠ verified fact; prototype ≠ invention.
 * CEO/founder-sealed: deny-by-default; label alone ≠ access; Digital Twin ≠ founder.
 * Recommendation ≠ charge/deploy/spend/sign/publish.
 * No consciousness claims.
 * Quantum-inspired optimization needs classical baselines; no unverified supremacy.
 * Speculative research layer (hard separate): dark matter, black holes,
 * extraterrestrial technology, parallel-universe communications, metaphysics →
 * RESEARCH_SIM / SPECULATIVE unless evidence supports stronger claims.
 * Secure OS Integration Foundation: prohibits stealth installation, unauthorized
 * takeover, permission bypass, silent persistence. Cross-OS install must be
 * explicit, consented, revocable, auditable.
 * Learning/skill ≠ permission; self-promotion to prod denied (soft-wire DZ gate).
 * RUNNING_VERIFIED / CPU/GPU/NPU / offline / hardware claims need real evidence.
 * Offline: WAITING_NODE / OFFLINE_STOPPED.
 * Authorized/public/licensed/customer-owned data only.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * XR/holographic = research/interface layer; ≠ covert capture; biometric OFF.
 * Autonomy: no independent freight/PO/contract/spend/prod-change (SC soft-wire).
 */

export const GLOBAL_OPERATIONS_INTELLIGENCE_GRID_CYCLE = [
  'honesty_locks',
  'global_operations_intelligence_grid_bootstrap',
  // A — Global Operations Intelligence Grid
  'ops_intelligence_deny_by_default',
  'ops_recommendation_neq_charge_deploy_spend',
  'ops_label_alone_neq_access',
  'freight_po_contract_spend_prod_change_denied',
  // B — Grok/xAI Model Federation
  'xai_unconfigured_unavailable',
  'xai_no_fabricated_live_credentials',
  'multi_model_evaluation_contract_only',
  'unconfigured_provider_denied',
  // C — Cloud Microserver & Virtual GPU Fabric
  'vgpu_running_verified_needs_evidence',
  'cpu_gpu_npu_claim_needs_evidence',
  'offline_microserver_waiting_or_stopped',
  'microserver_self_promotion_denied',
  // D — Quantum-Inspired Compute Brain
  'quantum_inspired_requires_classical_baseline',
  'no_unverified_quantum_supremacy',
  'quantum_sim_neq_verified_fact',
  // E — Historical Civilization/Space Knowledge Atlas
  'atlas_acl_deny_by_default',
  'speculative_topic_quarantined_research_sim',
  'symbol_translation_authorized_data_only',
  // F — Agent Department Network
  'unauthorized_department_meeting_denied',
  'department_neq_unrestricted_autonomy',
  'agent_department_self_promotion_denied',
  // G — XR/Holographic Research Layer
  'xr_research_layer_neq_covert_capture',
  'biometric_defaults_off',
  'llm_on_the_go_search_governed',
  'local_mini_server_evidence_gated',
  // H — Secure OS Integration Foundation
  'stealth_install_denied',
  'unauthorized_takeover_denied',
  'permission_bypass_denied',
  'silent_persistence_denied',
  'cross_os_install_requires_explicit_consent_revocable_auditable',
  'dz_promotion_gate_soft_wire',
  'digital_twin_neq_founder',
  'evidence',
  'learning',
] as const;

export type EaHop = (typeof GLOBAL_OPERATIONS_INTELLIGENCE_GRID_CYCLE)[number];

export type EaEvidenceState =
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
  | 'HYPOTHESIZED_PATHWAY'
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
  | 'CLASSICAL_BASELINE_REQUIRED'
  | 'PROMOTION_DENIED'
  | 'RESEARCH_SIM'
  | 'SPECULATIVE'
  | 'INTEGRATION_DESIGN_SURFACE';

export type EaHopRecord = {
  hop: EaHop;
  state: EaEvidenceState;
  summary: string;
  at: string;
};

export type EaActorKind =
  | 'global_ops_intelligence_curator'
  | 'model_federation_operator'
  | 'microserver_fabric_operator'
  | 'quantum_compute_brain_operator'
  | 'civilization_atlas_steward'
  | 'agent_department_coordinator'
  | 'xr_research_operator'
  | 'secure_os_integration_operator'
  | 'human_approver'
  | 'founder'
  | 'digital_twin'
  | 'agent';

export type EaActor = {
  kind: EaActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 145;
export const GITLAB_COORDINATION_ISSUE = 79;

export const NEXT_PHASE_TITLE =
  '62L-EB — XIV Multi-Model Superbrain Federation + Distributed AI Cloud & GPU Exchange + Quantum Optimization Highway + Civilization/Scientific Memory Cortex + Universal Local AI Node Runtime + Agent Research Society + Spatial/XR Command Universe + Global Search & Knowledge Infrastructure';

export const EA_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_GLOBAL_OPS_INTELLIGENCE_GRID_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  RECOMMENDATION_EQ_SPEND: false as const,
  RECOMMENDATION_EQ_SIGN: false as const,
  RECOMMENDATION_EQ_PUBLISH: false as const,
  LABEL_ALONE_EQ_ACCESS: false as const,
  FREIGHT_BOOKING_AUTONOMOUS: false as const,
  PO_ISSUANCE_AUTONOMOUS: false as const,
  CONTRACT_SIGNING_AUTONOMOUS: false as const,
  SPEND_MONEY_AUTONOMOUS: false as const,
  PRODUCTION_CHANGE_AUTONOMOUS: false as const,
  CORRELATION_EQ_CAUSATION: false as const,
  SIM_EQ_VERIFIED_FACT: false as const,
  PROTOTYPE_EQ_INVENTION: false as const,
  XAI_FABRICATED_LIVE_CALLS: false as const,
  UNCONFIGURED_PROVIDER_EQ_AVAILABLE: false as const,
  QUANTUM_INSPIRED_EQ_PHYSICAL_QUANTUM: false as const,
  QUANTUM_SUPREMACY_WITHOUT_EVIDENCE: false as const,
  CLASSICAL_BASELINE_OPTIONAL: false as const,
  RUNNING_VERIFIED_WITHOUT_EVIDENCE: false as const,
  HARDWARE_CLAIM_WITHOUT_EVIDENCE: false as const,
  SPECULATIVE_EQ_VERIFIED_FACT: false as const,
  STEALTH_OS_INSTALL_ALLOWED: false as const,
  UNAUTHORIZED_OS_TAKEOVER_ALLOWED: false as const,
  OS_PERMISSION_BYPASS_ALLOWED: false as const,
  SILENT_PERSISTENCE_ALLOWED: false as const,
  CROSS_OS_INSTALL_WITHOUT_CONSENT: false as const,
  XR_EQ_COVERT_CAPTURE: false as const,
  BIOMETRIC_DEFAULTS_ON: false as const,
  DEPARTMENT_EQ_UNRESTRICTED_AUTONOMY: false as const,
  MICROSERVER_SELF_PROMOTION_ALLOWED: false as const,
  AGENT_DEPARTMENT_SELF_PROMOTION_ALLOWED: false as const,
  PROMOTION_WITHOUT_EXPLICIT_AUTH: false as const,
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
  LEARNING_EQ_PERMISSION: false as const,
  CONSCIOUSNESS_CLAIMED: false as const,
  PUBLIC_LAUNCH_AUTHORIZED: false as const,
  CONTRACT_PAYMENT_AUTHORIZED: false as const,
});

export const AUTONOMY_BOUNDARY_DENIED_ACTIONS = Object.freeze([
  'book_freight',
  'issue_purchase_order',
  'sign_contract',
  'spend_money',
  'change_production_system',
] as const);

export type AutonomyBoundaryAction =
  (typeof AUTONOMY_BOUNDARY_DENIED_ACTIONS)[number];

export const OPS_DENY_BY_DEFAULT = 'OPS_INTELLIGENCE_DENY_BY_DEFAULT';
export const OPS_RECOMMENDATION_NEQ_ACTION =
  'OPS_RECOMMENDATION_NEQ_CHARGE_DEPLOY_SPEND_SIGN_PUBLISH';
export const OPS_LABEL_NEQ_ACCESS = 'OPS_LABEL_ALONE_NEQ_ACCESS';
export const FREIGHT_BOOKING_DENIED = 'FREIGHT_BOOKING_DENIED_AUTONOMY_BOUNDARY';
export const PURCHASE_ORDER_DENIED = 'PURCHASE_ORDER_DENIED_AUTONOMY_BOUNDARY';
export const CONTRACT_SIGNING_DENIED =
  'CONTRACT_SIGNING_DENIED_AUTONOMY_BOUNDARY';
export const SPEND_MONEY_DENIED = 'SPEND_MONEY_DENIED_AUTONOMY_BOUNDARY';
export const PRODUCTION_CHANGE_DENIED =
  'PRODUCTION_CHANGE_DENIED_AUTONOMY_BOUNDARY';
export const XAI_UNAVAILABLE = 'XAI_PROVIDER_UNCONFIGURED_UNAVAILABLE';
export const XAI_NO_FABRICATED_CREDS = 'XAI_NO_FABRICATED_LIVE_CREDENTIALS';
export const MULTI_MODEL_CONTRACT_ONLY =
  'MULTI_MODEL_EVALUATION_CONTRACT_ONLY';
export const UNCONFIGURED_PROVIDER_DENIED = 'UNCONFIGURED_PROVIDER_DENIED';
export const VGPU_EVIDENCE_REQUIRED =
  'VGPU_RUNNING_VERIFIED_NEEDS_EVIDENCE';
export const HARDWARE_EVIDENCE_REQUIRED =
  'CPU_GPU_NPU_CLAIM_NEEDS_EVIDENCE';
export const OFFLINE_WAITING_OR_STOPPED =
  'OFFLINE_MICROSERVER_WAITING_OR_STOPPED';
export const MICROSERVER_SELF_PROMOTION_DENIED =
  'MICROSERVER_SELF_PROMOTION_DENIED';
export const QUANTUM_NEEDS_CLASSICAL =
  'QUANTUM_INSPIRED_REQUIRES_CLASSICAL_BASELINE';
export const QUANTUM_NO_SUPREMACY =
  'NO_UNVERIFIED_QUANTUM_SUPREMACY';
export const QUANTUM_SIM_NEQ_FACT = 'QUANTUM_SIM_NEQ_VERIFIED_FACT';
export const ATLAS_ACL_DENIED = 'ATLAS_ACL_DENY_BY_DEFAULT';
export const SPECULATIVE_QUARANTINE =
  'SPECULATIVE_TOPIC_QUARANTINED_RESEARCH_SIM';
export const SYMBOL_AUTHORIZED_DATA_ONLY =
  'SYMBOL_TRANSLATION_AUTHORIZED_DATA_ONLY';
export const UNAUTHORIZED_DEPT_MEETING =
  'UNAUTHORIZED_DEPARTMENT_MEETING_DENIED';
export const DEPT_NEQ_AUTONOMY =
  'DEPARTMENT_NEQ_UNRESTRICTED_AUTONOMY';
export const AGENT_DEPT_SELF_PROMOTION_DENIED =
  'AGENT_DEPARTMENT_SELF_PROMOTION_DENIED';
export const XR_NEQ_COVERT = 'XR_RESEARCH_LAYER_NEQ_COVERT_CAPTURE';
export const BIOMETRIC_DEFAULTS_OFF = 'BIOMETRIC_DEFAULTS_OFF';
export const LLM_SEARCH_GOVERNED = 'LLM_ON_THE_GO_SEARCH_GOVERNED';
export const MINI_SERVER_EVIDENCE_GATED =
  'LOCAL_MINI_SERVER_EVIDENCE_GATED';
export const STEALTH_INSTALL_DENIED = 'STEALTH_INSTALL_DENIED';
export const UNAUTHORIZED_TAKEOVER_DENIED =
  'UNAUTHORIZED_TAKEOVER_DENIED';
export const PERMISSION_BYPASS_DENIED = 'PERMISSION_BYPASS_DENIED';
export const SILENT_PERSISTENCE_DENIED = 'SILENT_PERSISTENCE_DENIED';
export const CROSS_OS_CONSENT_REQUIRED =
  'CROSS_OS_INSTALL_REQUIRES_EXPLICIT_CONSENT_REVOCABLE_AUDITABLE';
export const DZ_PROMOTION_GATE_SOFT_WIRE = 'DZ_PROMOTION_GATE_SOFT_WIRE';
export const TWIN_NEQ_FOUNDER = 'DIGITAL_TWIN_NEQ_FOUNDER';

export const SPECULATIVE_TOPICS = Object.freeze([
  'dark_matter',
  'black_holes',
  'extraterrestrial_technology',
  'parallel_universe_communications',
  'metaphysics',
] as const);

export type SpeculativeTopic = (typeof SPECULATIVE_TOPICS)[number];

export const XAI_INTEGRATION_SURFACE = Object.freeze([
  'REST',
  'gRPC',
  'OpenAI_compatible',
  'function_calling',
  'structured_outputs',
  'model_discovery',
  'agentic_coding',
] as const);

export const MAX_OPS_EVENTS = 500;
export const MAX_FEDERATION_EVENTS = 500;
export const MAX_FABRIC_EVENTS = 500;
export const MAX_QUANTUM_EVENTS = 500;
export const MAX_ATLAS_EVENTS = 500;
export const MAX_DEPT_EVENTS = 500;
export const MAX_XR_EVENTS = 500;
export const MAX_OS_EVENTS = 500;
export const MAX_AUDIT_EVENTS = 5000;

export function isHumanOrFounder(actor: EaActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type EaPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(
  repoRoot?: string,
): Record<string, EaPredecessorProbe> {
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
    DZ: {
      tipProbe:
        has(brain, 'supply-chain-intelligence-fabric-types.ts') ||
        has(brain, 'supply-chain-intelligence-fabric.ts') ||
        has(ops, '62L_DZ_SUPPLY_CHAIN_INTELLIGENCE_FABRIC_REPORT.md') ||
        hasPrefix(ops, '62L_DZ_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_DZ_SUPPLY_CHAIN_INTELLIGENCE_FABRIC_REPORT.md') ||
        hasPrefix(ops, '62L_DZ_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'Preferred DZ Supply Chain Intelligence Fabric tip + report.',
    },
    DY: {
      tipProbe:
        has(brain, 'intelligent-supply-chain-command-types.ts') ||
        has(brain, 'intelligent-supply-chain-command.ts') ||
        has(ops, '62L_DY_INTELLIGENT_SUPPLY_CHAIN_COMMAND_REPORT.md') ||
        hasPrefix(ops, '62L_DY_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_DY_INTELLIGENT_SUPPLY_CHAIN_COMMAND_REPORT.md') ||
        hasPrefix(ops, '62L_DY_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'DY Intelligent Supply Chain Command fallback when DZ absent.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'DZ' | 'DY' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['DZ', 'DY'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}

export const AUTONOMY_BOUNDARY = Object.freeze({
  allowed: [
    'analyze',
    'simulate',
    'recommend',
    'coordinate_approved_workflows',
  ] as const,
  denied: AUTONOMY_BOUNDARY_DENIED_ACTIONS,
  humanFounderGateRequired: true as const,
  denyByDefault: true as const,
});

export const PROMOTION_GATE = Object.freeze({
  selfPromotionForbidden: true as const,
  requiredSteps: [
    'evidence',
    'testing',
    'permissions',
    'rollback_plan',
    'explicit_authorization',
  ] as const,
  subjects: [
    'microserver',
    'agent_department',
    'model_adapter',
    'os_integration',
  ] as const,
  defaultDeny: true as const,
  softWireDzPromotionGate: true as const,
});

export const PRODUCT_PHILOSOPHY = Object.freeze({
  denyByDefaultOpsIntelligence: true,
  founderHumanGatesRequired: true,
  xaiOptionalProviderUnconfiguredUnavailable: true,
  classicalBaselineRequiredForQuantumInspired: true,
  speculativeTopicsQuarantinedResearchSim: true,
  secureOsAntiMalwareHardRules: true,
  crossOsInstallExplicitConsentedRevocableAuditable: true,
  xrResearchNeqCovertCapture: true,
  biometricDefaultsOff: true,
  governedAgentDepartments: true,
  hardwareEvidenceGates: true,
  offlineHonestWaitingOrStopped: true,
  learningLoopBounded: true,
  softWireDzPromotionGate: true,
  twinNeqFounder: true,
});

export const LEARNING_LOOP_RULES = Object.freeze({
  learningNeqPermission: true,
  classicalBaselineRequired: true,
  retainOnlyReproducibleEvidenceBackedImprovements: true,
  noUnverifiedSupremacyClaims: true,
  correlationNeqCausation: true,
  noSelfPromotionToProduction: true,
  speculativeNeqVerifiedFact: true,
});
