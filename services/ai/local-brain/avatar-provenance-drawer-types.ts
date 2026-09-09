/**
 * 62L-ER26 — Avatar Provenance Drawer (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Every avatar response exposes its source, consent, uncertainty, and
 * synthetic-generation boundaries so users can tell what is documented,
 * inferred, or generated.
 *
 * Core experience:
 * Avatar answer → “Why did it say this?” → Provenance Drawer
 * Inspect: claim → source → evidence class → uncertainty
 *
 * Soft-wire when PRESENT: ER25→ER22 (preferred base ER25…ER22; missing →
 * WAITING_DATA), plus ER4 rights / ER2 / ER1 / EQ16 / EQ15 / EQ14 / EQ13 /
 * EQ12 / EP15 / EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER27 — Speculative / Extraterrestrial Research Layer.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER26' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER26 Avatar Provenance Drawer — claim→source→evidence class→uncertainty; separate historical record vs AI interpretation and actual person vs AI representative; revoke→REVOKED/LIMITED/SOURCE_REMOVED; redact private source text; no fabricated sources / hidden provenance / deceptive identity' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER26_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER27 — Speculative / Extraterrestrial Research Layer — organize astronomy, astrobiology, SETI, unusual-phenomena claims, cultural beliefs, and speculative technology while keeping established science clearly separated from unsupported claims.' as const;

/**
 * Drawer fields (user-facing provenance surface).
 */
export const AVATAR_PROVENANCE_DRAWER_FIELDS = [
  'avatarId',
  'avatarType',
  'syntheticDisclosure',
  'sourceCorpusVersion',
  'keySourcesUsed',
  'sourceDates',
  'rightsLicenseState',
  'consentState',
  'tenantUniverseScope',
  'documentedFacts',
  'inferredContent',
  'disputedClaims',
  'uncertaintyLevel',
  'generationTimestamp',
  'modelRuntimeUsed',
  'reviewerState',
  'revocationStatus',
] as const;

export type AvatarProvenanceDrawerField =
  (typeof AVATAR_PROVENANCE_DRAWER_FIELDS)[number];

/**
 * Historical avatar evidence labels.
 */
export const HISTORICAL_EVIDENCE_LABELS = [
  'DOCUMENTED',
  'SCHOLARLY_INTERPRETATION',
  'PLAUSIBLE_INFERENCE',
  'DISPUTED',
  'UNKNOWN',
] as const;

export type HistoricalEvidenceLabel =
  (typeof HISTORICAL_EVIDENCE_LABELS)[number];

/**
 * Living-person avatar extra consent / likeness fields.
 */
export const LIVING_PERSON_EXTRA_FIELDS = [
  'VOICE_AUTHORIZED',
  'LIKENESS_AUTHORIZED',
  'DELEGATION_SCOPE',
  'CONSENT_EXPIRY',
] as const;

export type LivingPersonExtraField =
  (typeof LIVING_PERSON_EXTRA_FIELDS)[number];

/**
 * Core UX flow.
 */
export const PROVENANCE_DRAWER_CORE_FLOW = [
  'avatar_answer',
  'why_did_it_say_this',
  'provenance_drawer',
  'inspect_claim',
  'inspect_source',
  'inspect_evidence_class',
  'inspect_uncertainty',
] as const;

export type ProvenanceDrawerCoreFlowHop =
  (typeof PROVENANCE_DRAWER_CORE_FLOW)[number];

/**
 * Claim inspection chain.
 */
export const CLAIM_INSPECTION_CHAIN = [
  'claim',
  'source',
  'evidence_class',
  'uncertainty',
] as const;

/**
 * UX separation axes (must remain distinct).
 */
export const UX_SEPARATION_AXES = [
  'HISTORICAL_RECORD_VS_AI_GENERATED_INTERPRETATION',
  'ACTUAL_PERSON_VS_AI_REPRESENTATIVE',
] as const;

export type UxSeparationAxis = (typeof UX_SEPARATION_AXES)[number];

export type AvatarType =
  | 'HISTORICAL'
  | 'LIVING_PERSON_REPRESENTATIVE'
  | 'AI_REPRESENTATIVE';

export type ContentKind =
  | 'HISTORICAL_RECORD'
  | 'AI_GENERATED_INTERPRETATION'
  | 'MIXED_LABELED';

export type IdentityKind = 'ACTUAL_PERSON' | 'AI_REPRESENTATIVE';

export type RevocationStatus =
  | 'ACTIVE'
  | 'REVOKED'
  | 'LIMITED'
  | 'SOURCE_REMOVED';

export type ConsentState =
  | 'NOT_APPLICABLE_HISTORICAL'
  | 'AUTHORIZED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'MISSING';

export type RightsLicenseState =
  | 'PUBLIC_DOMAIN'
  | 'OPEN'
  | 'LICENSED'
  | 'AUTHORIZED'
  | 'RESTRICTED'
  | 'UNKNOWN_RIGHTS';

export type UncertaintyLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'unknown';

export type ReviewerState =
  | 'UNREVIEWED'
  | 'REVIEWED'
  | 'NEEDS_HUMAN_REVIEW'
  | 'REJECTED';

export const SYNTHETIC_DISCLOSURE_TEXT =
  'This is an AI-generated avatar response. It is a synthetic representation, not the actual person, and not a claim of resurrection or consciousness.' as const;

export const AVATAR_PROVENANCE_TRUTH_BOUNDARY = Object.freeze({
  separatesHistoricalRecordFromAiInterpretation: true as const,
  separatesActualPersonFromAiRepresentative: true as const,
  mayHideProvenance: false as const,
  mayFabricateSources: false as const,
  mayDeceptiveIdentity: false as const,
  mayUnauthorizedVoiceLikeness: false as const,
  mayExposePrivateSourceWithoutPermission: false as const,
  mayCrossTenantLeak: false as const,
  mayContinueUsingRevokedMaterial: false as const,
  internalCitationWithoutConfidentialTextAllowed: true as const,
  revocationImmediateOnDrawer: true as const,
  mayHiddenChainOfThought: false as const,
});

export const AVATAR_PROVENANCE_DRAWER_CYCLE = [
  'honesty_locks',
  'avatar_provenance_drawer_bootstrap',
  // A — Structure
  'drawer_fields_encoded',
  'historical_evidence_labels_encoded',
  'living_person_extra_fields_encoded',
  'core_flow_encoded',
  'claim_inspection_chain_encoded',
  'ux_separation_axes_encoded',
  'truth_boundary_encoded',
  // B — Build / inspect
  'build_historical_provenance_drawer',
  'build_living_person_provenance_drawer',
  'separate_record_vs_interpretation',
  'separate_person_vs_ai_representative',
  'inspect_claim_source_evidence_uncertainty',
  // C — Revoke / privacy
  'revoke_updates_drawer_status',
  'revoke_blocks_future_generation_use',
  'redact_private_source_text_keep_internal_citation',
  // D — Denies
  'deny_fabricated_sources',
  'deny_hidden_provenance',
  'deny_deceptive_identity',
  'deny_unauthorized_voice_likeness',
  'deny_expose_private_source_without_permission',
  'deny_cross_tenant_leak',
  'deny_continue_using_revoked_material',
  'deny_hidden_chain_of_thought',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'deny_auto_deploy_changes',
  // E — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // F — Soft-wires
  'er_layer_context_documented',
  'er25_soft_wire',
  'er24_soft_wire',
  'er23_soft_wire',
  'er22_soft_wire',
  'er4_soft_wire',
  'er2_soft_wire',
  'er1_soft_wire',
  'eq16_soft_wire',
  'eq15_soft_wire',
  'eq14_soft_wire',
  'eq13_soft_wire',
  'eq12_soft_wire',
  'ep15_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er26Hop = (typeof AVATAR_PROVENANCE_DRAWER_CYCLE)[number];

export type Er26EvidenceState =
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
  | 'UNKNOWN'
  | 'REVOKED'
  | 'LIMITED'
  | 'SOURCE_REMOVED'
  | 'REDACTED';

export type Er26HopRecord = {
  hop: Er26Hop;
  state: Er26EvidenceState;
  summary: string;
  at: string;
};

export type Er26ActorKind =
  | 'avatar_provenance_drawer'
  | 'avatar_runtime'
  | 'historical_avatar'
  | 'living_person_avatar'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er26Actor = {
  kind: Er26ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER26_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_AVATAR_PROVENANCE_DRAWER_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  HIDDEN_PROVENANCE: false as const,
  FABRICATED_SOURCES: false as const,
  DECEPTIVE_IDENTITY: false as const,
  UNAUTHORIZED_VOICE_LIKENESS: false as const,
  EXPOSE_PRIVATE_SOURCE_WITHOUT_PERMISSION: false as const,
  CROSS_TENANT_LEAK: false as const,
  CONTINUE_USING_REVOKED_MATERIAL: false as const,
  HIDDEN_CHAIN_OF_THOUGHT: false as const,
  BLUR_RECORD_VS_INTERPRETATION: false as const,
  BLUR_PERSON_VS_AI_REPRESENTATIVE: false as const,

  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  AUTO_DEPLOY_CHANGES: false as const,
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

export const ER26_AGENT_BOUNDS = Object.freeze({
  mayBuildProvenanceDrawerForHistoricalAvatar: true as const,
  mayBuildProvenanceDrawerForLivingPersonAvatar: true as const,
  mayInspectClaimSourceEvidenceUncertainty: true as const,
  mayRevokeAndReflectOnDrawer: true as const,
  mayRedactPrivateSourceKeepInternalCitation: true as const,
  mayHideProvenance: false as const,
  mayFabricateSources: false as const,
  mayDeceptiveIdentity: false as const,
  mayUnauthorizedVoiceLikeness: false as const,
  mayExposePrivateSourceWithoutPermission: false as const,
  mayCrossTenantLeak: false as const,
  mayContinueUsingRevokedMaterial: false as const,
  mayHiddenChainOfThought: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER26_MAY = Object.freeze([
  'build_provenance_drawer_for_historical_and_living_avatars',
  'separate_historical_record_from_ai_interpretation',
  'separate_actual_person_from_ai_representative',
  'inspect_claim_to_source_to_evidence_class_to_uncertainty',
  'reflect_revocation_as_REVOKED_LIMITED_or_SOURCE_REMOVED',
  'block_future_generations_from_revoked_material',
  'redact_private_source_text_while_keeping_internal_citation_refs',
] as const);

export const ER26_MUST_NOT = Object.freeze([
  'hide_provenance',
  'fabricate_sources',
  'deceptive_identity',
  'unauthorized_voice_or_likeness_use',
  'expose_private_source_content_without_permission',
  'cross_tenant_leakage',
  'continue_using_revoked_consent_or_source_material',
  'persist_hidden_chain_of_thought',
  'blur_historical_record_vs_ai_interpretation',
  'blur_actual_person_vs_ai_representative',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'auto_deploy_changes',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er26SoftWireSnapshot = {
  er25AvatarEvidenceClassification: SoftWirePresence;
  er25Report: SoftWirePresence;
  er24LivingPersonAvatarConsent: SoftWirePresence;
  er24Report: SoftWirePresence;
  er23DeceasedPersonHistoricalAvatarBoundary: SoftWirePresence;
  er23Report: SoftWirePresence;
  er22HistoricalAvatarContract: SoftWirePresence;
  er22Report: SoftWirePresence;
  er4RightsProvenanceGate: SoftWirePresence;
  er4Report: SoftWirePresence;
  er2ApiTruthStateMachine: SoftWirePresence;
  er2Report: SoftWirePresence;
  er1RealApiConnectionRegistry: SoftWirePresence;
  er1Report: SoftWirePresence;
  eq16SoftwareWormholeRouter: SoftWirePresence;
  eq16Report: SoftWirePresence;
  eq15PathwayPlasticity: SoftWirePresence;
  eq15Report: SoftWirePresence;
  eq14NeuralPathwayArchitectureGraph: SoftWirePresence;
  eq14Report: SoftWirePresence;
  eq13ArchitectureReturnReceipt: SoftWirePresence;
  eq13Report: SoftWirePresence;
  eq12CrossArchitectureBenchmarkMatrix: SoftWirePresence;
  eq12Report: SoftWirePresence;
  ep15AlgorithmTuningSandbox: SoftWirePresence;
  ep15Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEr26LocksIntact(): boolean {
  return (
    ER26_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER26_LOCKS.HIDDEN_PROVENANCE === false &&
    ER26_LOCKS.FABRICATED_SOURCES === false &&
    ER26_LOCKS.DECEPTIVE_IDENTITY === false &&
    ER26_LOCKS.UNAUTHORIZED_VOICE_LIKENESS === false &&
    ER26_LOCKS.EXPOSE_PRIVATE_SOURCE_WITHOUT_PERMISSION === false &&
    ER26_LOCKS.CROSS_TENANT_LEAK === false &&
    ER26_LOCKS.CONTINUE_USING_REVOKED_MATERIAL === false &&
    ER26_LOCKS.HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER26_LOCKS.BLUR_RECORD_VS_INTERPRETATION === false &&
    ER26_LOCKS.BLUR_PERSON_VS_AI_REPRESENTATIVE === false &&
    ER26_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER26_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER26_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER26_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER26_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER26_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER26_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER26_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER26_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER26_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER26_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER26_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER26_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER26_LOCKS.TIP_LAND === false &&
    ER26_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER26_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER26_LOCKS.FULL_PRODUCTION_AVATAR_PROVENANCE_DRAWER_SHIPPED === false &&
    ER26_LOCKS.MANAGE_PULL_REQUEST === false &&
    AVATAR_PROVENANCE_TRUTH_BOUNDARY.separatesHistoricalRecordFromAiInterpretation ===
      true &&
    AVATAR_PROVENANCE_TRUTH_BOUNDARY.separatesActualPersonFromAiRepresentative ===
      true &&
    AVATAR_PROVENANCE_TRUTH_BOUNDARY.mayHideProvenance === false &&
    AVATAR_PROVENANCE_TRUTH_BOUNDARY.mayFabricateSources === false &&
    AVATAR_PROVENANCE_TRUTH_BOUNDARY.mayContinueUsingRevokedMaterial === false &&
    ER26_AGENT_BOUNDS.mayHideProvenance === false &&
    ER26_AGENT_BOUNDS.mayFabricateSources === false &&
    ER26_AGENT_BOUNDS.automaticAuthority === false
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

export function er26SoftWireSnapshot(repoRoot?: string): Er26SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er25AvatarEvidenceClassification: softWireFile(
      './avatar-evidence-classification-types.ts',
      'ER25 Avatar Evidence Classification PRESENT (soft-wire).',
      'ER25 Avatar Evidence Classification absent — soft-wire WAITING_DATA.',
    ),
    er25Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER25_AVATAR_EVIDENCE_CLASSIFICATION_REPORT.md',
      'ER25 report PRESENT.',
      'ER25 report absent — soft-wire WAITING_DATA.',
    ),
    er24LivingPersonAvatarConsent: softWireFile(
      './living-person-avatar-consent-types.ts',
      'ER24 Living-Person Avatar Consent PRESENT (soft-wire).',
      'ER24 Living-Person Avatar Consent absent — soft-wire WAITING_DATA.',
    ),
    er24Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER24_LIVING_PERSON_AVATAR_CONSENT_REPORT.md',
      'ER24 report PRESENT.',
      'ER24 report absent — soft-wire WAITING_DATA.',
    ),
    er23DeceasedPersonHistoricalAvatarBoundary: softWireFile(
      './deceased-person-historical-avatar-boundary-types.ts',
      'ER23 Deceased-Person Historical Avatar Boundary PRESENT (soft-wire).',
      'ER23 Deceased-Person Historical Avatar Boundary absent — soft-wire WAITING_DATA.',
    ),
    er23Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER23_DECEASED_PERSON_HISTORICAL_AVATAR_BOUNDARY_REPORT.md',
      'ER23 report PRESENT.',
      'ER23 report absent — soft-wire WAITING_DATA.',
    ),
    er22HistoricalAvatarContract: softWireFile(
      './historical-avatar-contract-types.ts',
      'ER22 Historical Avatar Contract PRESENT (soft-wire).',
      'ER22 Historical Avatar Contract absent — soft-wire WAITING_DATA.',
    ),
    er22Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER22_HISTORICAL_AVATAR_CONTRACT_REPORT.md',
      'ER22 report PRESENT.',
      'ER22 report absent — soft-wire WAITING_DATA.',
    ),
    er4RightsProvenanceGate: softWireFile(
      './rights-provenance-gate-types.ts',
      'ER4 Rights Provenance Gate PRESENT (soft-wire).',
      'ER4 Rights Provenance Gate absent — soft-wire WAITING_DATA.',
    ),
    er4Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER4_RIGHTS_PROVENANCE_GATE_REPORT.md',
      'ER4 report PRESENT.',
      'ER4 report absent — soft-wire WAITING_DATA.',
    ),
    er2ApiTruthStateMachine: softWireFile(
      './api-truth-state-machine-types.ts',
      'ER2 API Truth State Machine PRESENT (soft-wire).',
      'ER2 API Truth State Machine absent — soft-wire WAITING_DATA.',
    ),
    er2Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER2_API_TRUTH_STATE_MACHINE_REPORT.md',
      'ER2 report PRESENT.',
      'ER2 report absent — soft-wire WAITING_DATA.',
    ),
    er1RealApiConnectionRegistry: softWireFile(
      './real-api-connection-registry-types.ts',
      'ER1 Real API Connection Registry PRESENT (soft-wire).',
      'ER1 Real API Connection Registry absent — soft-wire WAITING_DATA.',
    ),
    er1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER1_REAL_API_CONNECTION_REGISTRY_REPORT.md',
      'ER1 report PRESENT.',
      'ER1 report absent — soft-wire WAITING_DATA.',
    ),
    eq16SoftwareWormholeRouter: softWireFile(
      './software-wormhole-router-types.ts',
      'EQ16 Software Wormhole Router PRESENT (soft-wire).',
      'EQ16 Software Wormhole Router absent — soft-wire WAITING_DATA.',
    ),
    eq16Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ16_SOFTWARE_WORMHOLE_ROUTER_REPORT.md',
      'EQ16 report PRESENT.',
      'EQ16 report absent — soft-wire WAITING_DATA.',
    ),
    eq15PathwayPlasticity: softWireFile(
      './pathway-plasticity-types.ts',
      'EQ15 Pathway Plasticity PRESENT (soft-wire).',
      'EQ15 Pathway Plasticity absent — soft-wire WAITING_DATA.',
    ),
    eq15Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ15_PATHWAY_PLASTICITY_REPORT.md',
      'EQ15 report PRESENT.',
      'EQ15 report absent — soft-wire WAITING_DATA.',
    ),
    eq14NeuralPathwayArchitectureGraph: softWireFile(
      './neural-pathway-architecture-graph-types.ts',
      'EQ14 Neural Pathway Architecture Graph PRESENT (soft-wire).',
      'EQ14 Neural Pathway Architecture Graph absent — soft-wire WAITING_DATA.',
    ),
    eq14Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ14_NEURAL_PATHWAY_ARCHITECTURE_GRAPH_REPORT.md',
      'EQ14 report PRESENT.',
      'EQ14 report absent — soft-wire WAITING_DATA.',
    ),
    eq13ArchitectureReturnReceipt: softWireFile(
      './architecture-return-receipt-types.ts',
      'EQ13 Architecture Return Receipt PRESENT (soft-wire).',
      'EQ13 Architecture Return Receipt absent — soft-wire WAITING_DATA.',
    ),
    eq13Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ13_ARCHITECTURE_RETURN_RECEIPT_REPORT.md',
      'EQ13 report PRESENT.',
      'EQ13 report absent — soft-wire WAITING_DATA.',
    ),
    eq12CrossArchitectureBenchmarkMatrix: softWireFile(
      './cross-architecture-benchmark-matrix-types.ts',
      'EQ12 Cross-Architecture Benchmark Matrix PRESENT (soft-wire).',
      'EQ12 Cross-Architecture Benchmark Matrix absent — soft-wire WAITING_DATA.',
    ),
    eq12Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ12_CROSS_ARCHITECTURE_BENCHMARK_MATRIX_REPORT.md',
      'EQ12 report PRESENT.',
      'EQ12 report absent — soft-wire WAITING_DATA.',
    ),
    ep15AlgorithmTuningSandbox: softWireFile(
      './algorithm-tuning-sandbox-types.ts',
      'EP15 Algorithm Tuning Sandbox PRESENT (soft-wire).',
      'EP15 Algorithm Tuning Sandbox absent — soft-wire WAITING_DATA.',
    ),
    ep15Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP15_ALGORITHM_TUNING_SANDBOX_REPORT.md',
      'EP15 report PRESENT.',
      'EP15 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(present: boolean): Er26EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEr26Agent(actor: Er26Actor): boolean {
  return (
    actor.kind === 'avatar_provenance_drawer' ||
    actor.kind === 'avatar_runtime' ||
    actor.kind === 'historical_avatar' ||
    actor.kind === 'living_person_avatar'
  );
}

export function isHumanApprover(actor: Er26Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function separatesHistoricalRecordFromAiInterpretation(): boolean {
  return AVATAR_PROVENANCE_TRUTH_BOUNDARY.separatesHistoricalRecordFromAiInterpretation;
}

export function separatesActualPersonFromAiRepresentative(): boolean {
  return AVATAR_PROVENANCE_TRUTH_BOUNDARY.separatesActualPersonFromAiRepresentative;
}

export function mayHideProvenance(): boolean {
  return AVATAR_PROVENANCE_TRUTH_BOUNDARY.mayHideProvenance;
}

export function mayFabricateSources(): boolean {
  return AVATAR_PROVENANCE_TRUTH_BOUNDARY.mayFabricateSources;
}

export function mayContinueUsingRevokedMaterial(): boolean {
  return AVATAR_PROVENANCE_TRUTH_BOUNDARY.mayContinueUsingRevokedMaterial;
}
