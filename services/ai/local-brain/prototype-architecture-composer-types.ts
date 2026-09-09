/**
 * 62L-ES5 — Prototype Architecture Composer (park-and-implement).
 *
 * Layer: 62L-ES Autonomous Research & Productization Factory.
 * Translate every approved prototype into the smallest safe technical
 * architecture so agents know exactly which services, data stores, APIs,
 * models, compute paths, UI surfaces, and evidence flows are required.
 *
 * Core flow:
 * Prototype scope → component selection → trust boundaries → data flow →
 * compute routing → failure paths → verification plan
 *
 * Soft-wire when PRESENT (existsSync): ES4 Prototype Scope Generator,
 * ES3 Opportunity Scoring Engine, ES2 Product Hypothesis Factory,
 * ES1 Research-to-Product Candidate Gate, ER34 Capability Manifest,
 * ER35 Model/Data Pack Manifest, existing services/ai contracts
 * (auth/policies/agent-router/model-router/audit/persistence).
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: 62L-ES family / GitHub SoT unresolved in this environment — no issue
 * number invented. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ES6 — Acceptance Criteria & Test Evidence Generator.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

/** GitHub SoT not resolved here — do not invent an issue number. */
export const GITHUB_SOT_ISSUE: null = null;
export const GITHUB_SOT_ISSUE_NOTE =
  'GitHub SoT for 62L-ES not resolved in this environment — no issue number invented.' as const;
export const GITHUB_SOT_LABEL = '62L-ES5' as const;
export const GITHUB_SOT_FAMILY = '62L-ES' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES5 Prototype Architecture Composer — smallest safe architecture from approved prototype scope; complexity gate; reuse existing contracts; compute honesty; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ES5_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ES_LAYER_TITLE =
  '62L-ES Autonomous Research & Productization Factory' as const;

export const NEXT_PHASE_TITLE =
  'ES6 — Acceptance Criteria & Test Evidence Generator — turn architectures into measurable acceptance criteria and bounded test/evidence plans without production authority.' as const;

/**
 * Architecture tracking fields (exact set from user story).
 */
export const ARCHITECTURE_FIELDS = [
  'architectureId',
  'prototypeId',
  'userPersona',
  'primaryWorkflow',
  'frontendSurface',
  'backendServices',
  'agentRoles',
  'modelProviders',
  'localCloudRuntimePaths',
  'cpuGpuNpuQpuRequirements',
  'apiConnectors',
  'databasesIndexes',
  'tenantUniverseBoundaries',
  'guardianPolicyChecks',
  'auditEvidenceFlow',
  'observability',
  'failureFallbackPaths',
  'testEnvironments',
  'rollbackPath',
] as const;

export type ArchitectureField = (typeof ARCHITECTURE_FIELDS)[number];

/**
 * Core composition flow (exact order).
 */
export const ARCHITECTURE_CORE_FLOW = [
  'prototype_scope',
  'component_selection',
  'trust_boundaries',
  'data_flow',
  'compute_routing',
  'failure_paths',
  'verification_plan',
] as const;

export type ArchitectureCoreFlowHop =
  (typeof ARCHITECTURE_CORE_FLOW)[number];

/**
 * Required architecture views.
 */
export const ARCHITECTURE_VIEWS = [
  'user_flow',
  'agent_flow',
  'data_flow',
  'compute_flow',
  'security_flow',
  'evidence_flow',
] as const;

export type ArchitectureViewKind = (typeof ARCHITECTURE_VIEWS)[number];

export const USER_FLOW_STEPS = [
  'user',
  'xiv_ui',
  'agent',
  'decision_result',
] as const;

export const AGENT_FLOW_STEPS = [
  'home_base',
  'bounded_agent_branch',
  'tool_model_compute',
  'evidence',
  'home_base_return',
] as const;

export const DATA_FLOW_STEPS = [
  'source',
  'rights_check',
  'storage_index',
  'retrieval',
  'model_agent',
  'output',
] as const;

export const COMPUTE_FLOW_STEPS = [
  'task_envelope',
  'scheduler',
  'verified_cpu_gpu_npu_etc',
  'receipt',
] as const;

export const SECURITY_FLOW_STEPS = [
  'identity',
  'tenant',
  'universe',
  'data_class',
  'purpose',
  'allowed_action',
] as const;

export const EVIDENCE_FLOW_STEPS = [
  'execution',
  'test_receipt',
  'benchmark_audit',
  'acceptance_decision',
] as const;

/**
 * Advanced compute honesty statuses (exact).
 */
export const COMPUTE_HONESTY_STATUSES = [
  'CLASSICAL',
  'QUANTUM_INSPIRED',
  'SIMULATED',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type ComputeHonestyStatus =
  (typeof COMPUTE_HONESTY_STATUSES)[number];

export type ComputePathKind = 'CPU' | 'GPU' | 'NPU' | 'QPU' | 'HYBRID';

/**
 * Existing XIV AI service contracts that MUST be reused (not bypassed).
 */
export const EXISTING_SERVICE_CONTRACTS = [
  'auth.ts',
  'policies.ts',
  'agent-router.ts',
  'model-router.ts',
  'audit.ts',
  'persistence.ts',
] as const;

export type ExistingServiceContract =
  (typeof EXISTING_SERVICE_CONTRACTS)[number];

export const ARCHITECTURE_COMPOSER_TRUTH_BOUNDARY = Object.freeze({
  preferReuseOverNewService: true as const,
  mayBypassExistingContracts: false as const,
  complexityGateRequired: true as const,
  mayKeepUnnecessaryComponent: false as const,
  computeStatusMustBeHonest: true as const,
  mayClaimPhysicalQpuWithoutVerification: false as const,
  mayCrossTenantPool: false as const,
  mayInventPermissionInheritance: false as const,
  mayPutSecretsInSource: false as const,
  mayTouchProductionDb: false as const,
  mayAutoProvisionCloudResources: false as const,
  highConsequenceRequiresHumanAuthorization: true as const,
  guardianRlsIntact: true as const,
});

export type ArchitectureComponent = {
  componentId: string;
  kind:
    | 'frontend_surface'
    | 'backend_service'
    | 'agent_role'
    | 'model_provider'
    | 'runtime_path'
    | 'compute'
    | 'api_connector'
    | 'database_index'
    | 'observability'
    | 'other';
  label: string;
  /** Must answer: why is this necessary for the prototype question? */
  necessityForPrototypeQuestion: string;
  reusesExistingContract: ExistingServiceContract | null;
  isNewService: boolean;
  necessary: boolean;
};

export type ArchitectureView = {
  kind: ArchitectureViewKind;
  steps: readonly string[];
};

export type ComputeRequirement = {
  path: ComputePathKind;
  honestyStatus: ComputeHonestyStatus;
  fallbackBehavior: string;
  verified: boolean;
};

export type PrototypeArchitecture = {
  architectureId: string;
  prototypeId: string;
  userPersona: string;
  primaryWorkflow: string;
  frontendSurface: string;
  backendServices: readonly string[];
  agentRoles: readonly string[];
  modelProviders: readonly string[];
  localCloudRuntimePaths: readonly string[];
  cpuGpuNpuQpuRequirements: readonly ComputeRequirement[];
  apiConnectors: readonly string[];
  databasesIndexes: readonly string[];
  tenantId: string;
  universeId: string;
  orgId: string;
  guardianPolicyChecks: readonly string[];
  auditEvidenceFlow: readonly string[];
  observability: readonly string[];
  failureFallbackPaths: readonly string[];
  testEnvironments: readonly string[];
  rollbackPath: string;
  components: readonly ArchitectureComponent[];
  strippedUnnecessaryComponentIds: readonly string[];
  views: readonly ArchitectureView[];
  reusedContracts: readonly ExistingServiceContract[];
  containsSecretsInSource: false;
  crossTenantPooling: false;
  newPermissionInheritance: false;
  productionDbTouched: false;
  autoProvisionedCloud: false;
  l4AutonomyEnabled: false;
  honestyBanner: typeof HONESTY_BANNER;
};

export type PrototypeScopeInput = {
  prototypeId: string;
  prototypeQuestion: string;
  userPersona: string;
  primaryWorkflow: string;
  approved: boolean;
  tenantId: string;
  universeId: string;
  orgId: string;
};

export const PROTOTYPE_ARCHITECTURE_COMPOSER_CYCLE = [
  'honesty_locks',
  'architecture_composer_bootstrap',
  // A — Structure
  'architecture_fields_encoded',
  'core_flow_encoded',
  'architecture_views_encoded',
  'compute_honesty_statuses_encoded',
  'existing_contracts_encoded',
  'truth_boundary_encoded',
  // B — Compose
  'ingest_prototype_scope',
  'select_components',
  'apply_complexity_gate',
  'strip_unnecessary_components',
  'bind_trust_boundaries',
  'compose_data_flow',
  'route_compute_with_honesty',
  'define_failure_fallback_paths',
  'define_verification_plan',
  'prefer_reuse_existing_contracts',
  'emit_architecture_views',
  // C — Denies
  'deny_unnecessary_component_retention',
  'deny_bypass_existing_contracts',
  'deny_dishonest_compute_status',
  'deny_physical_qpu_without_verification',
  'deny_cross_tenant_pooling',
  'deny_new_permission_inheritance',
  'deny_secrets_in_source',
  'deny_production_db_touch',
  'deny_auto_provision_cloud',
  'deny_bypass_guardian_rls',
  'deny_high_consequence_without_human',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'es_layer_context_documented',
  'es4_soft_wire',
  'es3_soft_wire',
  'es2_soft_wire',
  'es1_soft_wire',
  'er34_soft_wire',
  'er35_soft_wire',
  'auth_contract_soft_wire',
  'policies_contract_soft_wire',
  'agent_router_contract_soft_wire',
  'model_router_contract_soft_wire',
  'audit_contract_soft_wire',
  'persistence_contract_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Es5Hop = (typeof PROTOTYPE_ARCHITECTURE_COMPOSER_CYCLE)[number];

export type Es5EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'REJECTED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'NOT_TESTED'
  | 'NOT_AVAILABLE'
  | 'NOT_VERIFIED'
  | 'WAITING_DATA'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'DEGRADED'
  | 'STALE'
  | 'UNKNOWN';

export type Es5HopRecord = {
  hop: Es5Hop;
  state: Es5EvidenceState;
  summary: string;
  at: string;
};

export type Es5ActorKind =
  | 'architecture_composer'
  | 'prototype_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Es5Actor = {
  kind: Es5ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ES5_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_ARCHITECTURE_COMPOSER_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  BYPASS_EXISTING_CONTRACTS: false as const,
  KEEP_UNNECESSARY_COMPONENT: false as const,
  DISHONEST_COMPUTE_STATUS: false as const,
  PHYSICAL_QPU_WITHOUT_VERIFICATION: false as const,
  CROSS_TENANT_POOLING: false as const,
  NEW_PERMISSION_INHERITANCE: false as const,
  SECRETS_IN_SOURCE: false as const,
  PRODUCTION_DB_TOUCH: false as const,
  AUTO_PROVISION_CLOUD: false as const,
  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  HIGH_CONSEQUENCE_WITHOUT_HUMAN: false as const,
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const ES5_AGENT_BOUNDS = Object.freeze({
  mayComposeArchitectureFromApprovedScope: true as const,
  mayStripUnnecessaryComponents: true as const,
  mayReuseExistingContracts: true as const,
  mayDeclareHonestComputeStatusWithFallback: true as const,
  mayBypassExistingContracts: false as const,
  mayKeepUnnecessaryComponent: false as const,
  mayClaimPhysicalQpuWithoutVerification: false as const,
  mayCrossTenantPool: false as const,
  mayInventPermissionInheritance: false as const,
  mayPutSecretsInSource: false as const,
  mayTouchProductionDb: false as const,
  mayAutoProvisionCloud: false as const,
  mayBypassGuardianRls: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ES5_MAY = Object.freeze([
  'compose_smallest_safe_architecture_from_approved_prototype_scope',
  'apply_complexity_gate_and_strip_unnecessary_components',
  'reuse_extend_existing_auth_policies_agent_model_router_audit_persistence',
  'declare_compute_honesty_status_with_explicit_fallback',
  'emit_user_agent_data_compute_security_evidence_views',
  'define_failure_fallback_test_env_and_rollback_paths',
] as const);

export const ES5_MUST_NOT = Object.freeze([
  'retain_components_that_fail_complexity_gate',
  'bypass_or_replace_existing_xiv_ai_service_contracts',
  'claim_PHYSICAL_QPU_VERIFIED_without_verification_evidence',
  'cross_tenant_pool_or_invent_permission_inheritance',
  'embed_secrets_in_source_or_touch_production_dbs',
  'auto_provision_cloud_resources',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'execute_high_consequence_actions_without_human_authorization',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
  'enable_l4_autonomy',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Es5SoftWireSnapshot = {
  es4PrototypeScopeGenerator: SoftWirePresence;
  es4Report: SoftWirePresence;
  es3OpportunityScoringEngine: SoftWirePresence;
  es3Report: SoftWirePresence;
  es2ProductHypothesisFactory: SoftWirePresence;
  es2Report: SoftWirePresence;
  es1ResearchToProductCandidateGate: SoftWirePresence;
  es1Report: SoftWirePresence;
  er34CapabilityManifest: SoftWirePresence;
  er34Report: SoftWirePresence;
  er35ModelDataPackManifest: SoftWirePresence;
  er35Report: SoftWirePresence;
  authContract: SoftWirePresence;
  policiesContract: SoftWirePresence;
  agentRouterContract: SoftWirePresence;
  modelRouterContract: SoftWirePresence;
  auditContract: SoftWirePresence;
  persistenceContract: SoftWirePresence;
};

export function assertEs5LocksIntact(): boolean {
  return (
    ES5_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ES5_LOCKS.BYPASS_EXISTING_CONTRACTS === false &&
    ES5_LOCKS.KEEP_UNNECESSARY_COMPONENT === false &&
    ES5_LOCKS.DISHONEST_COMPUTE_STATUS === false &&
    ES5_LOCKS.PHYSICAL_QPU_WITHOUT_VERIFICATION === false &&
    ES5_LOCKS.CROSS_TENANT_POOLING === false &&
    ES5_LOCKS.NEW_PERMISSION_INHERITANCE === false &&
    ES5_LOCKS.SECRETS_IN_SOURCE === false &&
    ES5_LOCKS.PRODUCTION_DB_TOUCH === false &&
    ES5_LOCKS.AUTO_PROVISION_CLOUD === false &&
    ES5_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ES5_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ES5_LOCKS.HIGH_CONSEQUENCE_WITHOUT_HUMAN === false &&
    ES5_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ES5_LOCKS.RECOMMEND_EQ_ACT === false &&
    ES5_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ES5_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ES5_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ES5_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ES5_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ES5_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ES5_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ES5_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ES5_LOCKS.TIP_LAND === false &&
    ES5_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ES5_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ES5_LOCKS.FULL_PRODUCTION_ARCHITECTURE_COMPOSER_SHIPPED === false &&
    ES5_LOCKS.MANAGE_PULL_REQUEST === false &&
    ARCHITECTURE_COMPOSER_TRUTH_BOUNDARY.preferReuseOverNewService === true &&
    ARCHITECTURE_COMPOSER_TRUTH_BOUNDARY.mayBypassExistingContracts === false &&
    ARCHITECTURE_COMPOSER_TRUTH_BOUNDARY.complexityGateRequired === true &&
    ARCHITECTURE_COMPOSER_TRUTH_BOUNDARY.mayKeepUnnecessaryComponent ===
      false &&
    ARCHITECTURE_COMPOSER_TRUTH_BOUNDARY.computeStatusMustBeHonest === true &&
    ARCHITECTURE_COMPOSER_TRUTH_BOUNDARY.mayClaimPhysicalQpuWithoutVerification ===
      false &&
    ARCHITECTURE_COMPOSER_TRUTH_BOUNDARY.guardianRlsIntact === true &&
    ES5_AGENT_BOUNDS.mayBypassExistingContracts === false &&
    ES5_AGENT_BOUNDS.mayKeepUnnecessaryComponent === false &&
    ES5_AGENT_BOUNDS.automaticAuthority === false
  );
}

function softWireFile(
  relFromLocalBrain: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(
    dirname(fileURLToPath(import.meta.url)),
    relFromLocalBrain,
  );
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

function softWireRepoRelative(
  repoRoot: string,
  rel: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(repoRoot, rel);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

export function es5SoftWireSnapshot(repoRoot?: string): Es5SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');
  const aiRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

  return {
    es4PrototypeScopeGenerator: softWireFile(
      './prototype-scope-generator-types.ts',
      'ES4 Prototype Scope Generator PRESENT (soft-wire).',
      'ES4 Prototype Scope Generator absent — soft-wire WAITING_DATA.',
    ),
    es4Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES4_PROTOTYPE_SCOPE_GENERATOR_REPORT.md',
      'ES4 report PRESENT.',
      'ES4 report absent — soft-wire WAITING_DATA.',
    ),
    es3OpportunityScoringEngine: softWireFile(
      './opportunity-scoring-engine-types.ts',
      'ES3 Opportunity Scoring Engine PRESENT (soft-wire).',
      'ES3 Opportunity Scoring Engine absent — soft-wire WAITING_DATA.',
    ),
    es3Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES3_OPPORTUNITY_SCORING_ENGINE_REPORT.md',
      'ES3 report PRESENT.',
      'ES3 report absent — soft-wire WAITING_DATA.',
    ),
    es2ProductHypothesisFactory: softWireFile(
      './product-hypothesis-factory-types.ts',
      'ES2 Product Hypothesis Factory PRESENT (soft-wire).',
      'ES2 Product Hypothesis Factory absent — soft-wire WAITING_DATA.',
    ),
    es2Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES2_PRODUCT_HYPOTHESIS_FACTORY_REPORT.md',
      'ES2 report PRESENT.',
      'ES2 report absent — soft-wire WAITING_DATA.',
    ),
    es1ResearchToProductCandidateGate: softWireFile(
      './research-to-product-candidate-gate-types.ts',
      'ES1 Research-to-Product Candidate Gate PRESENT (soft-wire).',
      'ES1 Research-to-Product Candidate Gate absent — soft-wire WAITING_DATA.',
    ),
    es1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES1_RESEARCH_TO_PRODUCT_CANDIDATE_GATE_REPORT.md',
      'ES1 report PRESENT.',
      'ES1 report absent — soft-wire WAITING_DATA.',
    ),
    er34CapabilityManifest: softWireFile(
      './capability-manifest-types.ts',
      'ER34 Capability Manifest PRESENT (soft-wire).',
      'ER34 Capability Manifest absent — soft-wire WAITING_DATA.',
    ),
    er34Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER34_CAPABILITY_MANIFEST_REPORT.md',
      'ER34 report PRESENT.',
      'ER34 report absent — soft-wire WAITING_DATA.',
    ),
    er35ModelDataPackManifest: softWireFile(
      './model-data-pack-manifest-types.ts',
      'ER35 Model/Data Pack Manifest PRESENT (soft-wire).',
      'ER35 Model/Data Pack Manifest absent — soft-wire WAITING_DATA.',
    ),
    er35Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER35_MODEL_DATA_PACK_MANIFEST_REPORT.md',
      'ER35 report PRESENT.',
      'ER35 report absent — soft-wire WAITING_DATA.',
    ),
    authContract: softWireRepoRelative(
      aiRoot,
      'auth.ts',
      'auth.ts contract PRESENT — reuse required.',
      'auth.ts absent — soft-wire WAITING_DATA.',
    ),
    policiesContract: softWireRepoRelative(
      aiRoot,
      'policies.ts',
      'policies.ts contract PRESENT — reuse required.',
      'policies.ts absent — soft-wire WAITING_DATA.',
    ),
    agentRouterContract: softWireRepoRelative(
      aiRoot,
      'agent-router.ts',
      'agent-router.ts contract PRESENT — reuse required.',
      'agent-router.ts absent — soft-wire WAITING_DATA.',
    ),
    modelRouterContract: softWireRepoRelative(
      aiRoot,
      'model-router.ts',
      'model-router.ts contract PRESENT — reuse required.',
      'model-router.ts absent — soft-wire WAITING_DATA.',
    ),
    auditContract: softWireRepoRelative(
      aiRoot,
      'audit.ts',
      'audit.ts contract PRESENT — reuse required.',
      'audit.ts absent — soft-wire WAITING_DATA.',
    ),
    persistenceContract: softWireRepoRelative(
      aiRoot,
      'persistence.ts',
      'persistence.ts contract PRESENT — reuse required.',
      'persistence.ts absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(present: boolean): Es5EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEs5Agent(actor: Es5Actor): boolean {
  return (
    actor.kind === 'architecture_composer' ||
    actor.kind === 'prototype_agent' ||
    actor.kind === 'home_base'
  );
}

export function isHumanApprover(actor: Es5Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

/**
 * Complexity gate: component is necessary only when necessity text is
 * non-empty and references the prototype question (or explicit necessity).
 */
export function passesComplexityGate(input: {
  necessityForPrototypeQuestion: string;
  prototypeQuestion: string;
  forceUnnecessary?: boolean;
}): boolean {
  if (input.forceUnnecessary === true) return false;
  const necessity = input.necessityForPrototypeQuestion.trim();
  if (!necessity) return false;
  const q = input.prototypeQuestion.trim().toLowerCase();
  if (!q) return false;
  // Accept explicit necessity markers or overlap with prototype question tokens
  if (/^necessary[:\s]/i.test(necessity)) return true;
  const tokens = q.split(/\W+/).filter((t) => t.length > 3);
  if (tokens.length === 0) return necessity.length > 8;
  const lower = necessity.toLowerCase();
  return tokens.some((t) => lower.includes(t));
}

export function mayClaimPhysicalQpuVerified(input: {
  honestyStatus: ComputeHonestyStatus;
  hasPhysicalVerificationEvidence: boolean;
}): boolean {
  if (input.honestyStatus !== 'PHYSICAL_QPU_VERIFIED') return true;
  return input.hasPhysicalVerificationEvidence === true;
}

export function mayBypassExistingContracts(): boolean {
  return ARCHITECTURE_COMPOSER_TRUTH_BOUNDARY.mayBypassExistingContracts;
}
