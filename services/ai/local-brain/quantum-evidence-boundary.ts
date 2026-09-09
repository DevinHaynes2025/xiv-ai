/**
 * 62L-EO5 — Quantum Evidence Boundary public surface.
 */

export {
  ALLOWED_LANGUAGE_BY_EVIDENCE_CLASS,
  BLOCKED_PROPOSAL_PHRASES,
  CLASSICAL_BASELINE_FAMILIES,
  CLASSICAL_COMPARISON_DIMENSIONS,
  EO5_DB_CANDIDATES_STATUS,
  EO5_LOCKS,
  EO5_MAY,
  EO5_MUST_NOT,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  QUANTUM_EVIDENCE_ARTIFACT_FIELDS,
  QUANTUM_EVIDENCE_BOUNDARY_CYCLE,
  QUANTUM_EVIDENCE_CLASSES,
  SOFT_WIRE_EO_ISSUE,
  assertEo5LocksIntact,
  eo5SoftWireSnapshot,
  evidenceClassRank,
} from './quantum-evidence-boundary-types.ts';

export type {
  ClassicalBaselineFamily,
  ClassicalBaselineRecord,
  ClassicalComparisonDimension,
  Eo5EvidenceState,
  Eo5Hop,
  Eo5HopRecord,
  Eo5SoftWireSnapshot,
  QuantumEvidenceArtifact,
  QuantumEvidenceArtifactField,
  QuantumEvidenceClass,
  SoftWirePresence,
} from './quantum-evidence-boundary-types.ts';

export {
  allowedLanguageFor,
  attemptContractSubmission,
  attemptL4Autonomy,
  bootstrapQuantumEvidenceBoundary,
  createQuantumEvidenceArtifact,
  denyEvidenceClassConfusion,
  denyFabrication,
  findBlockedPhrases,
  gateClassicalBaselineBeforeImprovement,
  gateProcurementClaim,
  gateProposalLanguage,
  isValidEvidenceClass,
  rewriteToAllowedLanguage,
  sandboxQuantumDemo,
} from './quantum-evidence-boundary-runtime.ts';

export type {
  BlockResult,
  Denial,
  Eo5BootstrapReport,
  FabricationKind,
  ImprovementClaimInput,
  ImprovementGateResult,
} from './quantum-evidence-boundary-runtime.ts';
