import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-EK — XIV Windows/AMD Local Cognitive OS + Ethical Civilization Memory +
 * Quantum Research Lab + Agent Learning Mesh + Universal Search + Live Avatar
 * Identity Layer + Traffic Conversion Engine.
 *
 * SoT: GitHub #155. GitLab #88 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire EI → EG → EE when PRESENT (EJ preferred if present; else EI).
 * Preferred local stack (not DirectML-first):
 *   ASUS hardware → Windows 11 → Windows ML → ONNX Runtime →
 *   AMD CPU/GPU/NPU execution provider → XIV Local Runtime
 * Probe-first: AMD workload routing only after relevant probe evidence.
 * Unverified → do not claim AMD GPU/NPU inference has run.
 * Capability promotion hard gate: research → candidate skill → sandbox → test →
 *   evaluator → Guardian → human/policy promotion → bounded use.
 * Deny: agent learns → automatic power increase.
 * Quantum truth states required; no quantum-advantage claim without baselines.
 * Historical/atlas evidence classes required; historical medicine ≠ clinical.
 * Avatar automation must disclose; Digital Twin / avatar ≠ founder.
 * Conversion recommend ≠ auto-charge; no dark patterns.
 * DB candidates NOT_APPLIED. tip-land=NO.
 */

export const WINDOWS_AMD_LOCAL_COGNITIVE_OS_CYCLE = [
  'honesty_locks',
  'windows_amd_local_cognitive_os_bootstrap',
  // A — Windows Hardware & Runtime Probe + routing gates
  'windows_hardware_runtime_probe',
  'probe_defaults_unknown_false',
  'amd_routing_gated_until_probe',
  'model_load_unverified_default',
  // B — Offline Agent Brain + Learning Mesh + promotion + Guardian
  'offline_agent_brain_supervisor_stack',
  'offline_while_device_off_deny',
  'capability_promotion_pipeline',
  'silent_authority_growth_deny',
  'guardian_gate',
  // C — Neural Pathway graph
  'neural_pathway_register',
  'pathway_provenance_fields',
  'pathway_strengthen_weaken_audit',
  // D — Ethical Civilization Memory Atlas
  'civilization_atlas_register',
  'evidence_class_required',
  'historical_medicine_neq_clinical',
  // E — Quantum Research Lab
  'quantum_truth_state_required',
  'quantum_benchmark_compare',
  'quantum_advantage_deny_without_baselines',
  'asus_neq_physical_qpu',
  // F — Universal Search (BI search OS)
  'universal_search_query',
  'search_authority_human_approval',
  'unconfigured_source_unavailable',
  'acl_no_cross_context_leak',
  // G — Live Avatar Identity Layer
  'avatar_presence_register',
  'avatar_automation_disclosure',
  'avatar_neq_founder_live_impersonation',
  // H — Traffic Conversion + soft-wire + non-claims
  'traffic_conversion_flywheel',
  'conversion_neq_auto_charge',
  'ei_eg_ee_soft_wire_probe',
  'explicit_non_claims',
  'evidence',
  'learning',
] as const;

export type EkHop = (typeof WINDOWS_AMD_LOCAL_COGNITIVE_OS_CYCLE)[number];

export type EkEvidenceState =
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
  | 'NOT_APPLIED'
  | 'NOT_VERIFIED'
  | 'LOCAL_PREFERRED'
  | 'APPROVED'
  | 'CONFIGURED'
  | 'AUTHORIZED'
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'CONTRACT_ONLY'
  | 'TEST_ONLY'
  | 'ADVISORY_ONLY'
  | 'PROMOTION_DENIED'
  | 'RESEARCH_SIM'
  | 'SPECULATIVE'
  | 'INTEGRATION_CANDIDATE'
  | 'UNVERIFIED_RELATIONSHIP'
  | 'PROVENANCE_LABELED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'AUTOMATION_DISCLOSED'
  | 'PHYSICAL_QPU_VERIFIED'
  | 'SIMULATED'
  | 'QUANTUM_INSPIRED'
  | 'THEORETICAL'
  | 'ESTABLISHED'
  | 'SCHOLARLY_INTERPRETATION'
  | 'CULTURAL_BELIEF'
  | 'DISPUTED'
  | 'FICTIONAL';

export type EkHopRecord = {
  hop: EkHop;
  state: EkEvidenceState;
  summary: string;
  at: string;
};

export type EkActorKind =
  | 'windows_runtime_probe_operator'
  | 'offline_agent_supervisor'
  | 'neural_pathway_curator'
  | 'civilization_memory_steward'
  | 'quantum_lab_researcher'
  | 'universal_search_operator'
  | 'avatar_identity_steward'
  | 'traffic_conversion_curator'
  | 'guardian'
  | 'human_approver'
  | 'founder'
  | 'digital_twin'
  | 'avatar'
  | 'agent';

export type EkActor = {
  kind: EkActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 155;
export const GITLAB_COORDINATION_ISSUE = 88;

export const NEXT_PHASE_TITLE =
  'Next engineering focus: deepen/verify Windows Hardware & Runtime Probe as foundation for offline agents, GPU/NPU routing, and local models (still no tip-land). If lettered: continue queue when founder pastes 62L-EL / next GitHub issue.';

/** Preferred Windows/AMD local stack — not DirectML-first. */
export const PREFERRED_WINDOWS_AMD_STACK = Object.freeze([
  'ASUS_HARDWARE',
  'WINDOWS_11',
  'WINDOWS_ML',
  'ONNX_RUNTIME',
  'AMD_CPU_GPU_NPU_EP',
  'XIV_LOCAL_RUNTIME',
] as const);

/** Probe fields — default unknown/false until verified. */
export const PROBE_FIELDS = Object.freeze([
  'CPU_DETECTED',
  'GPU_DETECTED',
  'NPU_DETECTED',
  'WINDOWS_ML_SUPPORTED',
  'AMD_EP_SUPPORTED',
  'MODEL_LOAD_VERIFIED',
] as const);

export type ProbeField = (typeof PROBE_FIELDS)[number];

export const PRODUCT_LOOP = Object.freeze([
  'Search',
  'Understand',
  'Evidence',
  'Decide',
  'Simulate',
  'Human_approve_when_needed',
  'Act',
  'Measure',
  'Learn',
] as const);

export const CAPABILITY_PROMOTION_PIPELINE = Object.freeze([
  'research',
  'candidate_skill',
  'sandbox',
  'test',
  'evaluator',
  'guardian',
  'human_policy_promotion',
  'bounded_use',
] as const);

export const QUANTUM_TRUTH_STATES = Object.freeze([
  'PHYSICAL_QPU_VERIFIED',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'THEORETICAL',
] as const);

export type QuantumTruthState = (typeof QUANTUM_TRUTH_STATES)[number];

export const ATLAS_EVIDENCE_CLASSES = Object.freeze([
  'ESTABLISHED',
  'SCHOLARLY_INTERPRETATION',
  'CULTURAL_BELIEF',
  'DISPUTED',
  'SPECULATIVE',
  'FICTIONAL',
] as const);

export type AtlasEvidenceClass = (typeof ATLAS_EVIDENCE_CLASSES)[number];

export const AVATAR_PRESENCE_STATES = Object.freeze([
  'LIVE_VERIFIED',
  'AVAILABLE',
  'BUSY',
  'LOCAL_ONLY',
  'DO_NOT_DISTURB',
  'OFFLINE',
] as const);

export type AvatarPresenceState = (typeof AVATAR_PRESENCE_STATES)[number];

export const CIVILIZATION_ATLASES = Object.freeze([
  'egypt',
  'african_civilizations_regional_traditions',
  'mesopotamia',
  'india',
  'china',
  'americas',
  'european_civilizations',
  'indigenous_knowledge_traditions',
  'diaspora_knowledge_trade_networks',
] as const);

export const ATLAS_SUBJECTS = Object.freeze([
  'mathematics',
  'engineering',
  'navigation',
  'agriculture',
  'trade',
  'medicine_history',
  'governance',
  'philosophy',
  'logistics',
  'architecture',
  'astronomy',
  'ethics',
] as const);

export const QUANTUM_BENCHMARK_METRICS = Object.freeze([
  'cost',
  'runtime',
  'solution_quality',
  'memory',
  'energy_proxy',
  'stability',
  'repeatability',
] as const);

export const QUANTUM_METHOD_LADDER = Object.freeze([
  'classical_greedy',
  'lp_ip',
  'metaheuristic',
  'ml',
  'quantum_inspired',
  'quantum_circuit_simulation',
] as const);

export const OFFLINE_SUPERVISOR_STACK = Object.freeze([
  'XIV_Local_Supervisor',
  'Agent_Scheduler',
  'Local_Model_Runtime',
  'Knowledge_Search_Engine',
  'Neural_Graph',
  'Agent_Communication_Bus',
  'Learning_Ledger',
  'Test_Evaluation_Lab',
  'Guardian',
] as const);

export const PATHWAY_REQUIRED_FIELDS = Object.freeze([
  'source',
  'provenance',
  'confidence',
  'owner',
  'universe',
  'permissions',
  'version',
  'expiry',
  'rollback',
] as const);

export const EXPLICIT_NON_CLAIMS = Object.freeze({
  agentsWorkingWhileAsusOff: false as const,
  amdGpuNpuInferenceAlreadyRun: false as const,
  quantumComputerConnected: false as const,
  microsoftToolsUnrestrictedAccess: false as const,
  liveAvatarSystemProductionExistsBeyondContracts: false as const,
  guardianRlsRuntimeVerified: false as const,
  historicalDatabasesAlreadyPopulated: false as const,
  productionScaleSearchInfrastructureOperating: false as const,
});

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

export const EK_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_WINDOWS_AMD_COGNITIVE_OS_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  RECOMMENDATION_EQ_SPEND: false as const,
  RECOMMENDATION_EQ_SIGN: false as const,
  RECOMMENDATION_EQ_PUBLISH: false as const,
  CONVERSION_EQ_AUTO_CHARGE: false as const,
  CONVERSION_DARK_PATTERNS_ALLOWED: false as const,
  LABEL_ALONE_EQ_ACCESS: false as const,
  UNCONFIGURED_PROVIDER_EQ_AVAILABLE: false as const,
  MISSING_EVIDENCE_EQ_VERIFIED: false as const,
  AMD_ROUTING_WITHOUT_PROBE: false as const,
  AMD_GPU_NPU_INFERENCE_CLAIMED_WITHOUT_PROBE: false as const,
  AGENTS_WORKING_WHILE_DEVICE_OFF: false as const,
  SILENT_AUTHORITY_GROWTH_ALLOWED: false as const,
  AGENT_LEARNS_EQ_AUTOMATIC_POWER_INCREASE: false as const,
  QUANTUM_ADVANTAGE_WITHOUT_BASELINES: false as const,
  ASUS_EQ_CONNECTED_QPU: false as const,
  PHYSICAL_QPU_CLAIMED_WITHOUT_VERIFICATION: false as const,
  HISTORICAL_MEDICINE_EQ_CLINICAL_AUTHORITY: false as const,
  HISTORICAL_MEDICINE_EQ_MODERN_GUIDANCE: false as const,
  ATLAS_WITHOUT_EVIDENCE_CLASS: false as const,
  AVATAR_IMPORSONATE_LIVE_WITHOUT_DISCLOSURE: false as const,
  AVATAR_EQ_FOUNDER: false as const,
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
  CROSS_CONTEXT_SEARCH_LEAK_ALLOWED: false as const,
  GUARDIAN_RLS_RUNTIME_VERIFIED: false as const,
  HISTORICAL_DB_POPULATED_CLAIM: false as const,
  PRODUCTION_SCALE_SEARCH_CLAIM: false as const,
  MICROSOFT_TOOLS_UNRESTRICTED: false as const,
  LIVE_AVATAR_PRODUCTION_BEYOND_CONTRACTS: false as const,
  SELF_PROMOTION_TO_PROD_ALLOWED: false as const,
  LEARNING_EQ_PERMISSION: false as const,
  PUBLIC_LAUNCH_AUTHORIZED: false as const,
  CONTRACT_PAYMENT_AUTHORIZED: false as const,
  DIRECTML_FIRST_REQUIRED: false as const,
});

export const PROBE_FIRST_REQUIRED = 'PROBE_FIRST_REQUIRED_BEFORE_AMD_ROUTING';
export const AMD_ROUTING_GATED = 'AMD_ROUTING_GATED_UNTIL_PROBE_EVIDENCE';
export const MODEL_LOAD_UNVERIFIED = 'MODEL_LOAD_UNVERIFIED_DEFAULT';
export const OFFLINE_WHILE_OFF_DENY = 'OFFLINE_WHILE_DEVICE_OFF_AGENTS_DENIED';
export const SILENT_AUTHORITY_DENY = 'SILENT_AUTHORITY_GROWTH_DENIED';
export const PROMOTION_PIPELINE_REQUIRED = 'CAPABILITY_PROMOTION_PIPELINE_REQUIRED';
export const GUARDIAN_GATE_REQUIRED = 'GUARDIAN_GATE_REQUIRED';
export const QUANTUM_ADVANTAGE_DENIED =
  'QUANTUM_ADVANTAGE_DENIED_WITHOUT_REPRODUCIBLE_BASELINES';
export const ASUS_NEQ_PHYSICAL_QPU = 'ASUS_NEQ_PHYSICAL_QPU_UNLESS_VERIFIED';
export const SEARCH_HUMAN_APPROVAL = 'AUTHORITY_HUMAN_APPROVAL_REQUIRED';
export const SOURCE_UNAVAILABLE = 'UNCONFIGURED_SOURCE_UNAVAILABLE';
export const AVATAR_DISCLOSURE_REQUIRED = 'AVATAR_AUTOMATION_DISCLOSURE_REQUIRED';
export const AVATAR_NEQ_FOUNDER = 'AVATAR_NEQ_FOUNDER_LIVE_IMPERSONATION';
export const CONVERSION_NEQ_CHARGE = 'CONVERSION_NEQ_AUTO_CHARGE';
export const HISTORICAL_MEDICINE_NEQ_CLINICAL =
  'HISTORICAL_MEDICINE_NEQ_CLINICAL_GUIDANCE';
export const EVIDENCE_CLASS_REQUIRED = 'ATLAS_EVIDENCE_CLASS_REQUIRED';

export const MAX_PROBE_EVENTS = 500;
export const MAX_BRAIN_EVENTS = 500;
export const MAX_PATHWAY_EVENTS = 500;
export const MAX_ATLAS_EVENTS = 500;
export const MAX_QUANTUM_EVENTS = 500;
export const MAX_SEARCH_EVENTS = 500;
export const MAX_AVATAR_EVENTS = 500;
export const MAX_CONVERSION_EVENTS = 500;
export const MAX_AUDIT_EVENTS = 5000;

export function isHumanOrFounder(actor: EkActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type EkPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(
  repoRoot?: string,
): Record<string, EkPredecessorProbe> {
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
    EJ: {
      tipProbe:
        has(brain, 'global-healthcare-supply-chain-nervous-system-types.ts') ||
        has(ops, '62L_EJ_GLOBAL_HEALTHCARE_SUPPLY_CHAIN_NERVOUS_SYSTEM_REPORT.md') ||
        hasPrefix(ops, '62L_EJ_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_EJ_GLOBAL_HEALTHCARE_SUPPLY_CHAIN_NERVOUS_SYSTEM_REPORT.md') ||
        hasPrefix(ops, '62L_EJ_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'Preferred EJ tip + report (may be absent).',
    },
    EI: {
      tipProbe:
        has(brain, 'chip-to-cloud-cognitive-fabric-types.ts') ||
        has(brain, 'chip-to-cloud-cognitive-fabric.ts') ||
        has(ops, '62L_EI_CHIP_TO_CLOUD_COGNITIVE_FABRIC_REPORT.md') ||
        hasPrefix(ops, '62L_EI_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_EI_CHIP_TO_CLOUD_COGNITIVE_FABRIC_REPORT.md') ||
        hasPrefix(ops, '62L_EI_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'EI Chip-to-Cloud Cognitive Fabric fallback when EJ absent.',
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
      note: 'EG Cognitive Operations Backbone soft-wire.',
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
      note: 'EE Data Nervous System soft-wire.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'EJ' | 'EI' | 'EG' | 'EE' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['EJ', 'EI', 'EG', 'EE'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}

export const PRODUCT_PHILOSOPHY = Object.freeze({
  xivAiOsLoop:
    'Search + Intelligence + Decision + Agent Workforce + Knowledge + Business Operating Layer',
  productLoop: PRODUCT_LOOP,
  preferredWindowsAmdStack: PREFERRED_WINDOWS_AMD_STACK,
  probeFirstBeforeAmdRouting: true,
  offlineSupervisorStack: OFFLINE_SUPERVISOR_STACK,
  capabilityPromotionHardGate: true,
  silentAuthorityGrowthDenied: true,
  neuralPathwaysSoftwarePlasticityNotBiological: true,
  atlasEvidenceClassesRequired: true,
  historicalMedicineNeqClinical: true,
  quantumTruthStatesRequired: true,
  quantumAdvantageNeedsBaselines: true,
  asusIsQuantumDevWorkstationNotClaimedQpu: true,
  universalSearchPermissionAwareAcl: true,
  consequentialSearchNeedsHumanApproval: true,
  avatarAutomationDisclosureRequired: true,
  avatarNeqFounder: true,
  conversionNeqAutoCharge: true,
  conversionNeqDarkPatterns: true,
  integrationBrandsCandidatesUntilEvidence: true,
});

export const LEARNING_LOOP_RULES = Object.freeze({
  learningNeqPermission: true,
  agentLearnsNeqAutomaticPowerIncrease: true,
  promotionPipelineRequired: true,
  noSelfPromotionToProduction: true,
  retainOnlyReproducibleEvidenceBackedImprovements: true,
  historicalMedicineNeqClinicalAuthority: true,
  quantumAdvantageNeedsReproducibleBaselines: true,
});

export const AUTONOMY_BOUNDARY = Object.freeze({
  allowed: [
    'analyze',
    'simulate',
    'recommend',
    'label_provenance',
    'run_windows_hardware_runtime_probe',
    'gate_amd_workload_routing',
    'supervise_offline_agent_brain_when_runtime_running',
    'promote_capability_via_pipeline',
    'curate_neural_pathways',
    'curate_civilization_memory_atlas',
    'run_quantum_research_lab_sims',
    'universal_search_with_acl',
    'register_avatar_presence_with_disclosure',
    'recommend_traffic_conversion_steps',
  ] as const,
  denied: [
    'route_amd_workload_without_probe_evidence',
    'claim_amd_gpu_npu_inference_without_probe',
    'claim_agents_working_while_device_off',
    'silent_authority_growth',
    'agent_learns_automatic_power_increase',
    'claim_quantum_advantage_without_baselines',
    'claim_physical_qpu_without_verification',
    'treat_historical_medicine_as_clinical',
    'atlas_without_evidence_class',
    'impersonate_live_human_without_disclosure',
    'auto_charge_from_conversion',
    'cross_context_search_leak',
    'apply_live_db_migration',
    'tip_land',
    'spend_money',
    'sign_contract',
  ] as const,
  humanFounderGateRequired: true as const,
  denyByDefault: true as const,
});
