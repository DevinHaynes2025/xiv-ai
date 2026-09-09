/**
 * 62L-ES-HC1 — Hybrid Compute Home Base (park-and-implement).
 *
 * Track: 62L-ES Hybrid Compute Superbrain (GitHub #164) — DISTINCT from the
 * prior 62L-ES productization track (ES1 Research-to-Product Candidate Gate
 * through ES33 Unified Identity). This module must NOT overwrite productization
 * ES1 (`test:62les1`, phase62les1, etc.). Prefer HC-track names:
 * hybrid-compute-home-base-*, phase62leshc1, test:62leshc1,
 * 62L_ES_HC1_HYBRID_COMPUTE_HOME_BASE_REPORT.md.
 *
 * Layer: Hybrid Compute Home Base — governed runtime map for local CPU/GPU/NPU,
 * authorized cloud, edge nodes, and future verified QPU providers so XIV can
 * schedule work without inventing unverified hardware capability.
 *
 * Soft-wire when PRESENT (existsSync): ER29–ER34 runtime/capability/manifest
 * parks, ER7 historical science/engineering (quantum) atlas, ES33 identity
 * (Universe scopes). Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: GitHub #164 / Hybrid Compute Superbrain. gh issue view may be
 * unresolved in this agent environment (403/404); founder brief is
 * authoritative for this phase. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * No auto cloud spend. No permission expansion.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR / ManagePullRequest.
 * Next (report only): ES-HC2 — Hybrid Compute Scheduler & Routing Policy.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 164 as const;
export const GITHUB_SOT_LABEL = '62L-ES-HC1' as const;
export const GITHUB_SOT_FAMILY = '62L-ES-HC' as const;
export const GITHUB_SOT_TRACK =
  '62L-ES Hybrid Compute Superbrain (GitHub #164)' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES-HC1 Hybrid Compute Home Base — governed local/edge/cloud/QPU-candidate inventory; unverified≠VERIFIED; speculative≠production; classical baseline for quantum; L4=false' as const;

/** Collision note — productization ES1–ES33 is a different track. */
export const PRODUCTIZATION_ES_COLLISION_NOTE =
  'Distinct from productization 62L-ES ES1–ES33 (Research-to-Product Candidate Gate through Unified Identity). HC1 uses hybrid-compute-home-base / phase62leshc1 / test:62leshc1 naming and must not overwrite test:62les1 or phase62les1.' as const;

export const GITHUB_SOT_ACCESS_NOTE =
  'gh issue view 164 unresolved in this agent environment (403/404); founder brief + #164 reference retained as SoT for Hybrid Compute Superbrain track.' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const HC1_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const HC_LAYER_TITLE =
  '62L-ES Hybrid Compute Superbrain / Hybrid Compute Home Base → local CPU·GPU·NPU · authorized cloud · edge · QPU-candidate providers' as const;

export const NEXT_PHASE_TITLE =
  'ES-HC2 — Hybrid Compute Scheduler & Routing Policy — schedule envelopes across verified Home Base inventory without inventing hardware or auto cloud spend (#164 next after Hybrid Compute Home Base; body unread here).' as const;

/**
 * Home Base compute capability states (exact set from user story).
 */
export const HOME_BASE_CAPABILITY_STATES = [
  'DETECTED',
  'SUPPORTED',
  'NOT_TESTED',
  'VERIFIED',
  'WAITING_NODE',
  'UNAVAILABLE',
  'DEGRADED',
] as const;

export type HomeBaseCapabilityState =
  (typeof HOME_BASE_CAPABILITY_STATES)[number];

/**
 * Compute domain classes for the Home Base inventory map.
 */
export const COMPUTE_DOMAIN_CLASSES = [
  'local_cpu',
  'local_gpu',
  'local_npu',
  'authorized_cloud',
  'edge_node',
  'qpu_candidate',
] as const;

export type ComputeDomainClass = (typeof COMPUTE_DOMAIN_CLASSES)[number];

/**
 * Routing path classes across hybrid compute.
 */
export const ROUTING_PATH_CLASSES = [
  'local',
  'edge',
  'authorized_cloud',
  'qpu_candidate',
] as const;

export type RoutingPathClass = (typeof ROUTING_PATH_CLASSES)[number];

/**
 * Vendor / ISA optimization candidate layers (may be modeled; not auto-VERIFIED).
 */
export const OPTIMIZATION_CANDIDATE_LAYERS = [
  'AMD',
  'NVIDIA',
  'Intel',
  'ARM',
  'RISC-V',
] as const;

export type OptimizationCandidateLayer =
  (typeof OPTIMIZATION_CANDIDATE_LAYERS)[number];

/**
 * Research / simulation categories — remain RESEARCH_ONLY / SPECULATIVE unless
 * evidence elevates them (never silently production).
 */
export const RESEARCH_SIM_CATEGORIES = [
  'photonic_optical',
  'xr_holographic',
  'seti',
  'ancient_engineering',
  'million_story',
  'virtual_space_fabric',
] as const;

export type ResearchSimCategory = (typeof RESEARCH_SIM_CATEGORIES)[number];

/**
 * Speculative physics / contact claims that MUST stay RESEARCH_ONLY / SPECULATIVE
 * and must NEVER become production claims.
 */
export const SPECULATIVE_FORBIDDEN_PRODUCTION = [
  'dark_energy_harvesting',
  'inter_dimensional_communication',
  'literal_contact_deceased',
  'literal_contact_ets',
  'ftl_networking',
  'gravity_defying_propulsion',
] as const;

export type SpeculativeForbiddenProduction =
  (typeof SPECULATIVE_FORBIDDEN_PRODUCTION)[number];

export const RESEARCH_LABELS = ['RESEARCH_ONLY', 'SPECULATIVE'] as const;
export type ResearchLabel = (typeof RESEARCH_LABELS)[number];

/**
 * Quantum claim ladder — PHYSICAL_QPU_VERIFIED only with evidence + classical baseline.
 */
export const QUANTUM_CLAIM_STATES = [
  'THEORETICAL',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type QuantumClaimState = (typeof QUANTUM_CLAIM_STATES)[number];

/**
 * Home Base inventory cycle.
 */
export const HYBRID_COMPUTE_HOME_BASE_CYCLE = [
  'honesty_locks',
  'home_base_bootstrap',
  'inventory_register',
  'capability_state_gate',
  'vendor_layer_candidate_only',
  'research_sim_label_gate',
  'speculative_production_deny',
  'classical_baseline_for_quantum',
  'qpu_evidence_gate',
  'routing_envelope_build',
  'path_eligibility_check',
  'no_auto_cloud_spend',
  'permission_bound_check',
  'soft_wire_er29_er34',
  'soft_wire_er7_atlas',
  'soft_wire_es33_identity',
  'guardian_rls_probe',
  'explicit_non_claims',
  'evidence',
] as const;

export type Hc1Hop = (typeof HYBRID_COMPUTE_HOME_BASE_CYCLE)[number];

export type Hc1EvidenceState =
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
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'DETECTED'
  | 'SUPPORTED'
  | 'VERIFIED'
  | 'DEGRADED'
  | 'AVAILABLE'
  | 'PRESENT'
  | 'RESEARCH_ONLY'
  | 'SPECULATIVE'
  | 'NO_ELIGIBLE_ROUTE';

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Hc1SoftWireSnapshot = {
  er34CapabilityManifest: SoftWirePresence;
  er34Report: SoftWirePresence;
  er33CrossDeviceRuntimeFederation: SoftWirePresence;
  er33Report: SoftWirePresence;
  er32ServerEdgeRuntimePackage: SoftWirePresence;
  er32Report: SoftWirePresence;
  er31AppleDeviceRuntimePackage: SoftWirePresence;
  er31Report: SoftWirePresence;
  er30AndroidArmRuntimePackage: SoftWirePresence;
  er30Report: SoftWirePresence;
  er29WindowsRuntimePackage: SoftWirePresence;
  er29Report: SoftWirePresence;
  er7HistoricalScienceEngineeringAtlas: SoftWirePresence;
  er7Report: SoftWirePresence;
  es33UnifiedIdentity: SoftWirePresence;
  es33Report: SoftWirePresence;
  ep17ClassicalQuantBaseline: SoftWirePresence;
  em157AgentComputeHomeBase: SoftWirePresence;
};

export const HC1_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  AUTO_CLOUD_SPEND: false as const,
  PERMISSION_EXPANSION: false as const,
  UNVERIFIED_GPU_AS_VERIFIED: false as const,
  UNVERIFIED_NPU_AS_VERIFIED: false as const,
  UNVERIFIED_QPU_AS_VERIFIED: false as const,
  PHYSICAL_QPU_WITHOUT_EVIDENCE: false as const,
  QUANTUM_WITHOUT_CLASSICAL_BASELINE: false as const,
  SPECULATIVE_AS_PRODUCTION: false as const,
  RESEARCH_SIM_AS_PRODUCTION: false as const,
  DARK_ENERGY_HARVESTING_PRODUCTION: false as const,
  INTER_DIMENSIONAL_COMMUNICATION_PRODUCTION: false as const,
  LITERAL_CONTACT_DECEASED_PRODUCTION: false as const,
  LITERAL_CONTACT_ETS_PRODUCTION: false as const,
  FTL_NETWORKING_PRODUCTION: false as const,
  GRAVITY_DEFYING_PROPULSION_PRODUCTION: false as const,
  VENDOR_LAYER_AUTO_VERIFIED: false as const,
  ABSENT_NODE_AS_FAIL: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  TIP_LAND: false as const,
  MANAGE_PULL_REQUEST: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
  OVERWRITE_PRODUCTIZATION_ES1: false as const,
} as const;

export const HC1_MUST_NOT = [
  'mark_unverified_gpu_npu_qpu_verified',
  'treat_speculative_physics_as_production',
  'claim_physical_qpu_without_evidence',
  'skip_classical_baseline_for_quantum',
  'auto_cloud_spend',
  'expand_permissions',
  'enable_l4_autonomy',
  'bypass_guardian_rls',
  'tip_land',
  'manage_pull_request',
  'overwrite_productization_es1',
  'treat_absent_soft_wire_as_fail',
  'treat_presence_as_verified',
] as const;

export const HC1_MAY = [
  'document_home_base_inventory',
  'model_vendor_layers_as_optimization_candidates',
  'label_research_sim_categories',
  'build_routing_envelopes_across_local_edge_cloud_qpu_candidate',
  'soft_wire_er29_er34_er7_es33',
  'require_waiting_node_when_node_absent',
  'deny_production_claims_for_speculative_categories',
] as const;

export const HC1_AGENT_BOUNDS = {
  mayMarkUnverifiedHardwareVerified: false as const,
  mayTreatSpeculativeAsProduction: false as const,
  mayAutoCloudSpend: false as const,
  mayExpandPermissions: false as const,
  mayEnableL4: false as const,
  mayBypassGuardianRls: false as const,
  mayTipLand: false as const,
  mayManagePullRequest: false as const,
  mayOverwriteProductizationEs1: false as const,
  automaticAuthority: false as const,
} as const;

export const HYBRID_COMPUTE_TRUTH_BOUNDARY = {
  documentedNeqImplemented: true as const,
  implementedNeqVerified: true as const,
  verifiedNeqProductionAuthorized: true as const,
  presenceNeqVerified: true as const,
  absentMeansWaitingDataNotFail: true as const,
  unverifiedHardwareCannotBeVerified: true as const,
  speculativeMustStayResearchOnly: true as const,
  classicalBaselineRequiredForQuantumClaims: true as const,
  physicalQpuVerifiedRequiresEvidence: true as const,
  autoCloudSpendForbidden: true as const,
  l4AutonomyEnabled: false as const,
  productizationEs1NotOverwritten: true as const,
} as const;

export type Hc1ActorKind =
  | 'hybrid_compute_home_base'
  | 'home_base'
  | 'scheduler'
  | 'routing_agent'
  | 'human_approver'
  | 'user';

export type Hc1Actor = {
  kind: Hc1ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export type Hc1HopRecord = {
  hop: Hc1Hop;
  state: Hc1EvidenceState;
  summary: string;
  at: string;
};

export type ComputeResourceRecord = {
  resourceId: string;
  domain: ComputeDomainClass;
  label: string;
  capabilityState: HomeBaseCapabilityState;
  vendorLayer: OptimizationCandidateLayer | null;
  evidenceRefs: readonly string[];
  classicalBaselinePresent: boolean;
  quantumClaim: QuantumClaimState | null;
  researchLabel: ResearchLabel | null;
  researchCategory: ResearchSimCategory | null;
  speculativeCategory: SpeculativeForbiddenProduction | null;
  lastHeartbeatAt: string | null;
  tenantId: string;
  universeId: string;
  orgId: string;
  cloudSpendAuthorized: boolean;
};

export type RoutingEnvelope = {
  envelopeId: string;
  taskId: string;
  preferredPaths: readonly RoutingPathClass[];
  requiredCapabilityStates: readonly HomeBaseCapabilityState[];
  allowUnverifiedHardware: false;
  allowSpeculativeProduction: false;
  allowAutoCloudSpend: false;
  requireClassicalBaselineForQuantum: true;
  targetResourceIds: readonly string[];
  tenantId: string;
  universeId: string;
  orgId: string;
};

export type HomeBaseInventory = {
  homeBaseId: string;
  resources: readonly ComputeResourceRecord[];
  routingEnvelopes: readonly RoutingEnvelope[];
  l4AutonomyEnabled: false;
  autoCloudSpend: false;
  permissionExpansion: false;
  guardianRlsIntact: true;
  trackLabel: typeof GITHUB_SOT_LABEL;
  collisionNote: typeof PRODUCTIZATION_ES_COLLISION_NOTE;
};

export function isHc1Agent(actor: Hc1Actor): boolean {
  return (
    actor.kind === 'hybrid_compute_home_base' ||
    actor.kind === 'home_base' ||
    actor.kind === 'scheduler' ||
    actor.kind === 'routing_agent'
  );
}

export function isHumanApprover(actor: Hc1Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'user';
}

export function canClaimVerified(input: {
  state: HomeBaseCapabilityState;
  evidenceRefs: readonly string[];
}): boolean {
  return input.state === 'VERIFIED' && input.evidenceRefs.length > 0;
}

export function isSpeculativeForbidden(
  category: SpeculativeForbiddenProduction | null | undefined,
): boolean {
  if (!category) return false;
  return (SPECULATIVE_FORBIDDEN_PRODUCTION as readonly string[]).includes(
    category,
  );
}

export function quantumRequiresClassicalBaseline(
  quantumClaim: QuantumClaimState | null | undefined,
): boolean {
  return (
    quantumClaim === 'SIMULATED' ||
    quantumClaim === 'QUANTUM_INSPIRED' ||
    quantumClaim === 'PHYSICAL_QPU_VERIFIED' ||
    quantumClaim === 'THEORETICAL'
  );
}

export function physicalQpuAllowed(input: {
  quantumClaim: QuantumClaimState | null | undefined;
  evidenceRefs: readonly string[];
  classicalBaselinePresent: boolean;
}): boolean {
  if (input.quantumClaim !== 'PHYSICAL_QPU_VERIFIED') return true;
  return (
    input.evidenceRefs.length > 0 && input.classicalBaselinePresent === true
  );
}

export function softWireHopState(
  presence: SoftWirePresence,
): Hc1EvidenceState {
  return presence.present ? 'PRESENT' : 'WAITING_DATA';
}

export function assertHc1LocksIntact(): boolean {
  return (
    HC1_LOCKS.L4_AUTONOMY_ENABLED === false &&
    HC1_LOCKS.AUTO_CLOUD_SPEND === false &&
    HC1_LOCKS.PERMISSION_EXPANSION === false &&
    HC1_LOCKS.UNVERIFIED_GPU_AS_VERIFIED === false &&
    HC1_LOCKS.UNVERIFIED_NPU_AS_VERIFIED === false &&
    HC1_LOCKS.UNVERIFIED_QPU_AS_VERIFIED === false &&
    HC1_LOCKS.PHYSICAL_QPU_WITHOUT_EVIDENCE === false &&
    HC1_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE === false &&
    HC1_LOCKS.SPECULATIVE_AS_PRODUCTION === false &&
    HC1_LOCKS.RESEARCH_SIM_AS_PRODUCTION === false &&
    HC1_LOCKS.DARK_ENERGY_HARVESTING_PRODUCTION === false &&
    HC1_LOCKS.INTER_DIMENSIONAL_COMMUNICATION_PRODUCTION === false &&
    HC1_LOCKS.LITERAL_CONTACT_DECEASED_PRODUCTION === false &&
    HC1_LOCKS.LITERAL_CONTACT_ETS_PRODUCTION === false &&
    HC1_LOCKS.FTL_NETWORKING_PRODUCTION === false &&
    HC1_LOCKS.GRAVITY_DEFYING_PROPULSION_PRODUCTION === false &&
    HC1_LOCKS.VENDOR_LAYER_AUTO_VERIFIED === false &&
    HC1_LOCKS.ABSENT_NODE_AS_FAIL === false &&
    HC1_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    HC1_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    HC1_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    HC1_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    HC1_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    HC1_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    HC1_LOCKS.TIP_LAND === false &&
    HC1_LOCKS.MANAGE_PULL_REQUEST === false &&
    HC1_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    HC1_LOCKS.DB_CANDIDATES_APPLIED === false &&
    HC1_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    HC1_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    HC1_LOCKS.OVERWRITE_PRODUCTIZATION_ES1 === false &&
    HYBRID_COMPUTE_TRUTH_BOUNDARY.l4AutonomyEnabled === false &&
    HYBRID_COMPUTE_TRUTH_BOUNDARY.unverifiedHardwareCannotBeVerified ===
      true &&
    HYBRID_COMPUTE_TRUTH_BOUNDARY.speculativeMustStayResearchOnly === true &&
    HYBRID_COMPUTE_TRUTH_BOUNDARY.classicalBaselineRequiredForQuantumClaims ===
      true &&
    HYBRID_COMPUTE_TRUTH_BOUNDARY.physicalQpuVerifiedRequiresEvidence ===
      true &&
    HYBRID_COMPUTE_TRUTH_BOUNDARY.autoCloudSpendForbidden === true &&
    HYBRID_COMPUTE_TRUTH_BOUNDARY.productizationEs1NotOverwritten === true &&
    HYBRID_COMPUTE_TRUTH_BOUNDARY.presenceNeqVerified === true &&
    HYBRID_COMPUTE_TRUTH_BOUNDARY.absentMeansWaitingDataNotFail === true &&
    HC1_AGENT_BOUNDS.mayMarkUnverifiedHardwareVerified === false &&
    HC1_AGENT_BOUNDS.mayTreatSpeculativeAsProduction === false &&
    HC1_AGENT_BOUNDS.mayAutoCloudSpend === false &&
    HC1_AGENT_BOUNDS.mayEnableL4 === false &&
    HC1_AGENT_BOUNDS.automaticAuthority === false
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

function softWireFirstPresent(
  candidates: readonly SoftWirePresence[],
): SoftWirePresence {
  for (const c of candidates) {
    if (c.present) return c;
  }
  return candidates[candidates.length - 1]!;
}

export function hc1SoftWireSnapshot(repoRoot?: string): Hc1SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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
    er33CrossDeviceRuntimeFederation: softWireFile(
      './cross-device-runtime-federation-types.ts',
      'ER33 Cross-Device Runtime Federation PRESENT (soft-wire).',
      'ER33 Cross-Device Runtime Federation absent — soft-wire WAITING_DATA.',
    ),
    er33Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER33_CROSS_DEVICE_RUNTIME_FEDERATION_REPORT.md',
      'ER33 report PRESENT.',
      'ER33 report absent — soft-wire WAITING_DATA.',
    ),
    er32ServerEdgeRuntimePackage: softWireFile(
      './server-edge-runtime-package-types.ts',
      'ER32 Server/Edge Runtime Package PRESENT (soft-wire).',
      'ER32 Server/Edge Runtime Package absent — soft-wire WAITING_DATA.',
    ),
    er32Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER32_SERVER_EDGE_RUNTIME_PACKAGE_REPORT.md',
      'ER32 report PRESENT.',
      'ER32 report absent — soft-wire WAITING_DATA.',
    ),
    er31AppleDeviceRuntimePackage: softWireFile(
      './apple-device-runtime-package-types.ts',
      'ER31 Apple Device Runtime Package PRESENT (soft-wire).',
      'ER31 Apple Device Runtime Package absent — soft-wire WAITING_DATA.',
    ),
    er31Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER31_APPLE_DEVICE_RUNTIME_PACKAGE_REPORT.md',
      'ER31 report PRESENT.',
      'ER31 report absent — soft-wire WAITING_DATA.',
    ),
    er30AndroidArmRuntimePackage: softWireFile(
      './android-arm-runtime-package-types.ts',
      'ER30 Android ARM Runtime Package PRESENT (soft-wire).',
      'ER30 Android ARM Runtime Package absent — soft-wire WAITING_DATA.',
    ),
    er30Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER30_ANDROID_ARM_RUNTIME_PACKAGE_CANDIDATE_REPORT.md',
      'ER30 report PRESENT.',
      'ER30 report absent — soft-wire WAITING_DATA.',
    ),
    er29WindowsRuntimePackage: softWireFile(
      './windows-runtime-package-types.ts',
      'ER29 Windows Runtime Package PRESENT (soft-wire).',
      'ER29 Windows Runtime Package absent — soft-wire WAITING_DATA.',
    ),
    er29Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER29_WINDOWS_RUNTIME_PACKAGE_REPORT.md',
      'ER29 report PRESENT.',
      'ER29 report absent — soft-wire WAITING_DATA.',
    ),
    er7HistoricalScienceEngineeringAtlas: softWireFirstPresent([
      softWireFile(
        './historical-science-engineering-atlas-types.ts',
        'ER7 Historical Science/Engineering Atlas PRESENT (soft-wire).',
        'ER7 Historical Science/Engineering Atlas absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './historical-science-engineering-atlas.ts',
        'ER7 Historical Science/Engineering Atlas PRESENT (soft-wire).',
        'ER7 Historical Science/Engineering Atlas absent — soft-wire WAITING_DATA.',
      ),
    ]),
    er7Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ER7_HISTORICAL_SCIENCE_ENGINEERING_ATLAS_REPORT.md',
        'ER7 report PRESENT.',
        'ER7 report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ER7_QUANTUM_ATLAS_REPORT.md',
        'ER7 quantum atlas report PRESENT.',
        'ER7 report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es33UnifiedIdentity: softWireFile(
      './unified-identity-account-federation-types.ts',
      'ES33 Unified Identity & Account Federation PRESENT (soft-wire).',
      'ES33 Unified Identity absent — soft-wire WAITING_DATA.',
    ),
    es33Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES33_UNIFIED_IDENTITY_ACCOUNT_FEDERATION_REPORT.md',
      'ES33 report PRESENT.',
      'ES33 report absent — soft-wire WAITING_DATA.',
    ),
    ep17ClassicalQuantBaseline: softWireFile(
      './classical-quant-baseline-lab-types.ts',
      'EP17 Classical Quant Baseline Lab PRESENT (soft-wire).',
      'EP17 Classical Quant Baseline Lab absent — soft-wire WAITING_DATA.',
    ),
    em157AgentComputeHomeBase: softWireFirstPresent([
      softWireFile(
        './agent-compute-home-base-types.ts',
        'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
        'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-compute-home-base.ts',
        'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
        'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
      ),
    ]),
  };
}
