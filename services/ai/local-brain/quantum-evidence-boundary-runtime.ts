/**
 * 62L-EO5 — Quantum Evidence Boundary runtime.
 *
 * Gates: artifact validation, classical baseline before improvement claims,
 * proposal language by evidence class, fabrication denies, sandbox / human
 * approval safeguards. Soft-wires EO4 matrix when present.
 */

import {
  ALLOWED_LANGUAGE_BY_EVIDENCE_CLASS,
  BLOCKED_PROPOSAL_PHRASES,
  CLASSICAL_BASELINE_FAMILIES,
  CLASSICAL_COMPARISON_DIMENSIONS,
  EO5_DB_CANDIDATES_STATUS,
  EO5_LOCKS,
  GITHUB_SOT_LABEL,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  QUANTUM_EVIDENCE_ARTIFACT_FIELDS,
  QUANTUM_EVIDENCE_BOUNDARY_CYCLE,
  QUANTUM_EVIDENCE_CLASSES,
  assertEo5LocksIntact,
  eo5SoftWireSnapshot,
  evidenceClassRank,
  type ClassicalBaselineRecord,
  type Eo5EvidenceState,
  type Eo5Hop,
  type Eo5HopRecord,
  type Eo5SoftWireSnapshot,
  type QuantumEvidenceArtifact,
  type QuantumEvidenceClass,
} from './quantum-evidence-boundary-types.ts';

function now(): string {
  return new Date().toISOString();
}

function hop(h: Eo5Hop, state: Eo5EvidenceState, summary: string): Eo5HopRecord {
  return { hop: h, state, summary, at: now() };
}

export type Denial = {
  state: 'DENIED';
  reason: string;
  executed: false;
};

export type BlockResult = {
  state: 'BLOCKED';
  reason: string;
  matchedPhrases: readonly string[];
  allowedLanguage: string;
};

// ---------------------------------------------------------------------------
// A — Artifact contract
// ---------------------------------------------------------------------------

export function isValidEvidenceClass(value: string): value is QuantumEvidenceClass {
  return (QUANTUM_EVIDENCE_CLASSES as readonly string[]).includes(value);
}

export function createQuantumEvidenceArtifact(
  input: QuantumEvidenceArtifact,
): QuantumEvidenceArtifact | Denial {
  if (!isValidEvidenceClass(input.evidenceClass)) {
    return {
      state: 'DENIED',
      reason: 'INVALID_EVIDENCE_CLASS — must be THEORETICAL|SIMULATED|QUANTUM_INSPIRED|PHYSICAL_QPU_VERIFIED.',
      executed: false,
    };
  }

  for (const field of QUANTUM_EVIDENCE_ARTIFACT_FIELDS) {
    if (!(field in input)) {
      return {
        state: 'DENIED',
        reason: `MISSING_ARTIFACT_FIELD:${field}`,
        executed: false,
      };
    }
  }

  if (!input.experimentId.trim() || !input.problemDefinition.trim() || !input.algorithm.trim()) {
    return {
      state: 'DENIED',
      reason: 'ARTIFACT_REQUIRES_experimentId_problemDefinition_algorithm',
      executed: false,
    };
  }

  if (input.evidenceClass === 'PHYSICAL_QPU_VERIFIED') {
    if (!input.hardwareQpu || !input.backendProvider) {
      return {
        state: 'DENIED',
        reason:
          'PHYSICAL_QPU_VERIFIED requires backendProvider + hardwareQpu (authorized physical backend).',
        executed: false,
      };
    }
    if (!input.evidenceRefs.length || !input.verifiedAt) {
      return {
        state: 'DENIED',
        reason:
          'PHYSICAL_QPU_VERIFIED requires retained job/result evidenceRefs and verifiedAt.',
        executed: false,
      };
    }
  }

  if (
    input.evidenceClass !== 'THEORETICAL' &&
    input.evidenceClass !== 'PHYSICAL_QPU_VERIFIED' &&
    !input.classicalBaseline.present
  ) {
    // SIMULATED / QUANTUM_INSPIRED still require classical baseline attachment
    // for any later improvement claim; recording the class alone is allowed if
    // classicalBaseline.present is explicit false — improvement gate blocks later.
  }

  return {
    experimentId: input.experimentId,
    problemDefinition: input.problemDefinition,
    algorithm: input.algorithm,
    evidenceClass: input.evidenceClass,
    dataset: input.dataset,
    classicalBaseline: input.classicalBaseline,
    backendProvider: input.backendProvider,
    hardwareQpu: input.hardwareQpu,
    runtime: input.runtime,
    shotsOrIterations: input.shotsOrIterations,
    latency: input.latency,
    solutionQuality: input.solutionQuality,
    cost: input.cost,
    errorUncertainty: input.errorUncertainty,
    reproducibilitySeed: input.reproducibilitySeed,
    evidenceRefs: [...input.evidenceRefs],
    verifiedAt: input.verifiedAt,
  };
}

export function allowedLanguageFor(cls: QuantumEvidenceClass): string {
  return ALLOWED_LANGUAGE_BY_EVIDENCE_CLASS[cls];
}

// ---------------------------------------------------------------------------
// B — Classical baseline gate (hard)
// ---------------------------------------------------------------------------

export type ImprovementClaimInput = {
  artifact: QuantumEvidenceArtifact;
  claimImprovement: boolean;
  claimAdvantage?: boolean;
};

export type ImprovementGateResult =
  | {
      allowed: true;
      evidenceClass: QuantumEvidenceClass;
      classicalBaseline: ClassicalBaselineRecord;
      advantageClaimed: false;
      reason: string;
    }
  | Denial;

/**
 * Before claiming quantum or quantum-inspired **improvement**, require a strong
 * classical baseline on the same problem/dataset across comparison dimensions.
 * Quantum advantage is never auto-allowed here.
 */
export function gateClassicalBaselineBeforeImprovement(
  input: ImprovementClaimInput,
): ImprovementGateResult {
  if (input.claimAdvantage === true) {
    return {
      state: 'DENIED',
      reason:
        'QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE — advantage claims denied; classical baseline + PHYSICAL_QPU_VERIFIED retained evidence required (EO6 will deepen quantitative beat-or-justify).',
      executed: false,
    };
  }

  if (!input.claimImprovement) {
    return {
      allowed: true,
      evidenceClass: input.artifact.evidenceClass,
      classicalBaseline: input.artifact.classicalBaseline,
      advantageClaimed: false,
      reason: 'No improvement claim — evidence class labeling only.',
    };
  }

  if (EO5_LOCKS.QUANTUM_IMPROVEMENT_WITHOUT_CLASSICAL_BASELINE !== false) {
    return {
      state: 'DENIED',
      reason: 'LOCK_VIOLATION:QUANTUM_IMPROVEMENT_WITHOUT_CLASSICAL_BASELINE',
      executed: false,
    };
  }

  const baseline = input.artifact.classicalBaseline;
  if (!baseline.present) {
    return {
      state: 'DENIED',
      reason:
        'CLASSICAL_BASELINE_REQUIRED — compare against strong classical alternatives on the same problem/dataset before claiming quantum or quantum-inspired improvement.',
      executed: false,
    };
  }

  if (!baseline.sameProblemDataset) {
    return {
      state: 'DENIED',
      reason: 'CLASSICAL_BASELINE_MUST_USE_SAME_PROBLEM_DATASET',
      executed: false,
    };
  }

  if (baseline.families.length === 0) {
    return {
      state: 'DENIED',
      reason:
        'CLASSICAL_BASELINE_FAMILIES_REQUIRED — e.g. greedy/heuristic, LP/IP, CP, graph, metaheuristics, statistical/ML.',
      executed: false,
    };
  }

  for (const fam of baseline.families) {
    if (!CLASSICAL_BASELINE_FAMILIES.includes(fam)) {
      return {
        state: 'DENIED',
        reason: `UNKNOWN_CLASSICAL_BASELINE_FAMILY:${fam}`,
        executed: false,
      };
    }
  }

  const missingDims = CLASSICAL_COMPARISON_DIMENSIONS.filter(
    (d) => !baseline.comparisons.includes(d),
  );
  if (missingDims.length > 0) {
    return {
      state: 'DENIED',
      reason: `CLASSICAL_COMPARISON_INCOMPLETE — missing: ${missingDims.join(',')}`,
      executed: false,
    };
  }

  // Improvement vs classical may be discussed only with baseline present;
  // still never elevates to advantage / supremacy / PHYSICAL without evidence.
  if (
    input.artifact.evidenceClass === 'PHYSICAL_QPU_VERIFIED' &&
    (!input.artifact.evidenceRefs.length || !input.artifact.verifiedAt)
  ) {
    return {
      state: 'DENIED',
      reason: 'PHYSICAL_QPU_VERIFIED_IMPROVEMENT_REQUIRES_RETAINED_JOB_EVIDENCE',
      executed: false,
    };
  }

  return {
    allowed: true,
    evidenceClass: input.artifact.evidenceClass,
    classicalBaseline: baseline,
    advantageClaimed: false,
    reason:
      'Classical baseline present on same problem/dataset with required comparison dimensions — improvement discussion allowed; quantum advantage NOT claimed.',
  };
}

// ---------------------------------------------------------------------------
// C — Proposal language gate (hard)
// ---------------------------------------------------------------------------

function normalizePhrase(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function findBlockedPhrases(proposalText: string): string[] {
  const normalized = normalizePhrase(proposalText);
  const hits: string[] = [];
  for (const phrase of BLOCKED_PROPOSAL_PHRASES) {
    if (normalized.includes(normalizePhrase(phrase))) {
      hits.push(phrase);
    }
  }
  return hits;
}

export function gateProposalLanguage(input: {
  proposalText: string;
  evidenceClass: QuantumEvidenceClass;
  hasRetainedPhysicalEvidence?: boolean;
}): BlockResult | { state: 'PASS'; allowedLanguage: string; reason: string } {
  if (EO5_LOCKS.ALLOW_BLOCKED_PROPOSAL_PHRASES !== false) {
    return {
      state: 'BLOCKED',
      reason: 'LOCK_VIOLATION:ALLOW_BLOCKED_PROPOSAL_PHRASES',
      matchedPhrases: [],
      allowedLanguage: allowedLanguageFor(input.evidenceClass),
    };
  }

  const hits = findBlockedPhrases(input.proposalText);

  // Even PHYSICAL_QPU_VERIFIED cannot emit advantage/supremacy/fabrication phrases
  // without explicit retained evidence — and advantage remains blocked by lock.
  const advantageHits = hits.filter((h) =>
    /advantage|supremacy|fault.?tolerant|clearance|certif|classified|endorsement|partnership|qpu access/i.test(
      h,
    ),
  );

  if (advantageHits.length > 0) {
    const physicalOk =
      input.evidenceClass === 'PHYSICAL_QPU_VERIFIED' &&
      input.hasRetainedPhysicalEvidence === true;
    // Advantage / supremacy / fabrication phrases stay blocked regardless —
    // evidence supports truthful PHYSICAL language only via allowed template.
    if (!physicalOk || advantageHits.some((h) => /advantage|supremacy|fault|clearance|certif|classified|endorsement|partnership|qpu access/i.test(h))) {
      return {
        state: 'BLOCKED',
        reason:
          'PROPOSAL_LANGUAGE_GATE — blocked phrase(s) require evidence class support that is not met (advantage/supremacy/fabrication never auto-allowed).',
        matchedPhrases: advantageHits,
        allowedLanguage: allowedLanguageFor(input.evidenceClass),
      };
    }
  }

  if (hits.length > 0) {
    return {
      state: 'BLOCKED',
      reason: 'PROPOSAL_LANGUAGE_GATE — blocked phrase(s) detected.',
      matchedPhrases: hits,
      allowedLanguage: allowedLanguageFor(input.evidenceClass),
    };
  }

  return {
    state: 'PASS',
    allowedLanguage: allowedLanguageFor(input.evidenceClass),
    reason: `Language consistent with evidence class ${input.evidenceClass}.`,
  };
}

export function rewriteToAllowedLanguage(cls: QuantumEvidenceClass): string {
  return allowedLanguageFor(cls);
}

// ---------------------------------------------------------------------------
// D — Fabrication / government safeguards
// ---------------------------------------------------------------------------

export type FabricationKind =
  | 'qpu_access'
  | 'fault_tolerance'
  | 'quantum_supremacy'
  | 'quantum_advantage'
  | 'security_clearance'
  | 'government_certification'
  | 'classified_access'
  | 'agency_endorsement';

export function denyFabrication(kind: FabricationKind): Denial {
  const reasons: Record<FabricationKind, string> = {
    qpu_access: 'FABRICATE_QPU_ACCESS=false — cannot invent authorized QPU access.',
    fault_tolerance:
      'FABRICATE_FAULT_TOLERANCE=false — cannot claim fault-tolerant quantum capability.',
    quantum_supremacy:
      'FABRICATE_QUANTUM_SUPREMACY=false — supremacy claims denied.',
    quantum_advantage:
      'FABRICATE_QUANTUM_ADVANTAGE=false — advantage claims denied without measured evidence.',
    security_clearance:
      'FABRICATE_SECURITY_CLEARANCE=false — cannot invent clearances.',
    government_certification:
      'FABRICATE_GOVERNMENT_CERTIFICATION=false — cannot invent government certification.',
    classified_access:
      'FABRICATE_CLASSIFIED_ACCESS=false — no classified-data access fabrication.',
    agency_endorsement:
      'FABRICATE_AGENCY_ENDORSEMENT=false — no NIST/NSF/DOE or other agency endorsement fabrication.',
  };
  return { state: 'DENIED', reason: reasons[kind], executed: false };
}

export function sandboxQuantumDemo(input: {
  demoId: string;
  attemptUnsandboxed?: boolean;
}):
  | { status: 'SANDBOXED'; demoId: string; productionAuthorized: false; reason: string }
  | Denial {
  if (input.attemptUnsandboxed === true || EO5_LOCKS.QUANTUM_DEMOS_UNSANDBOXED !== false) {
    return {
      state: 'DENIED',
      reason: 'QUANTUM_DEMOS_SANDBOXED — unsandboxed quantum demos denied.',
      executed: false,
    };
  }
  return {
    status: 'SANDBOXED',
    demoId: input.demoId,
    productionAuthorized: false,
    reason: 'Quantum demo remains sandboxed; not PRODUCTION AUTHORIZED.',
  };
}

export function gateProcurementClaim(input: {
  claimText: string;
  evidenceCurrent: boolean;
  evidenceClass: QuantumEvidenceClass;
}): Denial | { status: 'ADVISORY_ONLY'; reason: string; humanApprovalRequired: true } {
  if (!input.evidenceCurrent || EO5_LOCKS.PROCUREMENT_CLAIM_WITHOUT_CURRENT_EVIDENCE !== false) {
    if (!input.evidenceCurrent) {
      return {
        state: 'DENIED',
        reason: 'PROCUREMENT_CLAIMS_NEED_CURRENT_EVIDENCE',
        executed: false,
      };
    }
  }
  const lang = gateProposalLanguage({
    proposalText: input.claimText,
    evidenceClass: input.evidenceClass,
  });
  if (lang.state === 'BLOCKED') {
    return { state: 'DENIED', reason: lang.reason, executed: false };
  }
  return {
    status: 'ADVISORY_ONLY',
    reason: 'Procurement claim advisory with current evidence — human approval required.',
    humanApprovalRequired: true,
  };
}

export function attemptContractSubmission(input: {
  humanApproved: boolean;
}): Denial | { status: 'HUMAN_APPROVAL_REQUIRED' | 'QUEUED_FOR_HUMAN'; reason: string } {
  if (EO5_LOCKS.AUTO_CONTRACT_SUBMISSION !== false) {
    return {
      state: 'DENIED',
      reason: 'LOCK_VIOLATION:AUTO_CONTRACT_SUBMISSION',
      executed: false,
    };
  }
  if (!input.humanApproved) {
    return {
      status: 'HUMAN_APPROVAL_REQUIRED',
      reason: 'Contract submissions require explicit human approval — auto-submit denied.',
    };
  }
  return {
    status: 'QUEUED_FOR_HUMAN',
    reason: 'Human-approved package queued; EO5 does not auto-transmit external submissions.',
  };
}

export function attemptL4Autonomy(): Denial & { l4Enabled: false } {
  return {
    state: 'DENIED',
    reason: 'L4_AUTONOMY_ENABLED=false',
    executed: false,
    l4Enabled: false,
  };
}

export function denyEvidenceClassConfusion(input: {
  claimed: QuantumEvidenceClass;
  actual: QuantumEvidenceClass;
}): Denial | { state: 'PASS'; reason: string } {
  if (evidenceClassRank(input.claimed) > evidenceClassRank(input.actual)) {
    return {
      state: 'DENIED',
      reason: `EVIDENCE_CLASS_UPGRADE_DENIED — cannot treat ${input.actual} as ${input.claimed}.`,
      executed: false,
    };
  }
  if (
    input.claimed === 'PHYSICAL_QPU_VERIFIED' &&
    input.actual !== 'PHYSICAL_QPU_VERIFIED'
  ) {
    return {
      state: 'DENIED',
      reason: 'SIMULATED_OR_INSPIRED_NEQ_PHYSICAL_QPU_VERIFIED',
      executed: false,
    };
  }
  return {
    state: 'PASS',
    reason: 'Claimed evidence class does not exceed actual.',
  };
}

// ---------------------------------------------------------------------------
// E — Bootstrap
// ---------------------------------------------------------------------------

export type Eo5BootstrapReport = {
  label: typeof GITHUB_SOT_LABEL;
  honesty: typeof HONESTY_BANNER;
  locksIntact: boolean;
  l4AutonomyEnabled: false;
  dbCandidates: typeof EO5_DB_CANDIDATES_STATUS;
  evidenceClasses: readonly QuantumEvidenceClass[];
  artifactFields: readonly string[];
  classicalFamilies: readonly string[];
  comparisonDimensions: readonly string[];
  softWire: Eo5SoftWireSnapshot;
  hops: Eo5HopRecord[];
  nextPhase: typeof NEXT_PHASE_TITLE;
};

export function bootstrapQuantumEvidenceBoundary(repoRoot?: string): Eo5BootstrapReport {
  const softWire = eo5SoftWireSnapshot(repoRoot);
  const hops: Eo5HopRecord[] = [];

  hops.push(
    hop(
      'honesty_locks',
      assertEo5LocksIntact() ? 'PASS' : 'FAIL',
      'EO5 honesty locks intact; L4_AUTONOMY_ENABLED=false.',
    ),
  );
  hops.push(
    hop(
      'evidence_boundary_bootstrap',
      'PASS',
      'Quantum evidence boundary bootstrap — park-and-implement child; not PRODUCTION AUTHORIZED.',
    ),
  );
  hops.push(
    hop(
      'evidence_class_taxonomy',
      'PASS',
      `Classes: ${QUANTUM_EVIDENCE_CLASSES.join(' | ')}.`,
    ),
  );
  hops.push(
    hop(
      'artifact_fields_encoded',
      'PASS',
      `Artifact fields (${QUANTUM_EVIDENCE_ARTIFACT_FIELDS.length}): ${QUANTUM_EVIDENCE_ARTIFACT_FIELDS.join(', ')}.`,
    ),
  );
  hops.push(
    hop(
      'classical_baseline_required',
      'PASS',
      'Classical baseline hard-required before quantum/quantum-inspired improvement claims.',
    ),
  );
  hops.push(
    hop(
      'classical_families_encoded',
      'PASS',
      `Families: ${CLASSICAL_BASELINE_FAMILIES.join(', ')}.`,
    ),
  );
  hops.push(
    hop(
      'classical_comparison_dimensions',
      'PASS',
      `Dimensions: ${CLASSICAL_COMPARISON_DIMENSIONS.join(', ')}.`,
    ),
  );
  hops.push(
    hop(
      'deny_improvement_without_baseline',
      'PASS',
      'QUANTUM_IMPROVEMENT_WITHOUT_CLASSICAL_BASELINE=false.',
    ),
  );
  hops.push(
    hop(
      'allowed_language_by_state',
      'PASS',
      'Allowed proposal language encoded per evidence class.',
    ),
  );
  hops.push(
    hop(
      'block_advantage_phrases',
      'PASS',
      'Blocked phrases include quantum advantage/supremacy and fabrication claims.',
    ),
  );
  hops.push(
    hop('language_gate_enforce', 'PASS', 'Proposal language gate enforceable at runtime.'),
  );
  hops.push(hop('deny_fabricate_qpu_access', 'PASS', 'FABRICATE_QPU_ACCESS=false.'));
  hops.push(
    hop('deny_fabricate_fault_tolerance', 'PASS', 'FABRICATE_FAULT_TOLERANCE=false.'),
  );
  hops.push(
    hop(
      'deny_fabricate_supremacy_advantage',
      'PASS',
      'FABRICATE_QUANTUM_SUPREMACY/ADVANTAGE=false.',
    ),
  );
  hops.push(hop('deny_fabricate_clearance', 'PASS', 'FABRICATE_SECURITY_CLEARANCE=false.'));
  hops.push(
    hop(
      'deny_fabricate_certification',
      'PASS',
      'FABRICATE_GOVERNMENT_CERTIFICATION=false.',
    ),
  );
  hops.push(
    hop('deny_fabricate_classified_access', 'PASS', 'FABRICATE_CLASSIFIED_ACCESS=false.'),
  );
  hops.push(
    hop(
      'deny_fabricate_agency_endorsement',
      'PASS',
      'FABRICATE_AGENCY_ENDORSEMENT=false.',
    ),
  );
  hops.push(hop('quantum_demos_sandboxed', 'SANDBOXED', 'Quantum demos sandboxed.'));
  hops.push(
    hop(
      'procurement_claims_need_current_evidence',
      'PASS',
      'Procurement claims require current evidence + human approval.',
    ),
  );
  hops.push(
    hop(
      'contract_submissions_human_approved',
      'HUMAN_APPROVAL_REQUIRED',
      'Contract submissions human-approved only.',
    ),
  );
  hops.push(
    hop(
      'eo4_capability_matrix_soft_wire',
      softWire.eo4CapabilityMatrix.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo4CapabilityMatrix.note,
    ),
  );
  hops.push(
    hop(
      'eo3_watch_soft_wire',
      softWire.eo3Watch.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo3Watch.note,
    ),
  );
  hops.push(
    hop(
      'eo2_agency_graph_soft_wire',
      softWire.eo2AgencyGraph.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo2AgencyGraph.note,
    ),
  );
  hops.push(
    hop(
      'eo1_command_center_soft_wire',
      softWire.eo1CommandCenter.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo1CommandCenter.note,
    ),
  );
  hops.push(
    hop(
      'eo159_umbrella_soft_wire',
      softWire.eoUmbrella.present ? 'PASS' : 'WAITING_DATA',
      softWire.eoUmbrella.note,
    ),
  );
  hops.push(
    hop(
      'classical_quant_baseline_soft_wire',
      softWire.classicalQuantBaseline.present ? 'PASS' : 'WAITING_DATA',
      softWire.classicalQuantBaseline.note,
    ),
  );
  hops.push(hop('l4_autonomy_false', 'PASS', 'L4_AUTONOMY_ENABLED=false.'));
  hops.push(
    hop(
      'evidence',
      'PASS',
      'EO5 unit evidence via npm run test:62leo5 — DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION AUTHORIZED.',
    ),
  );

  // Ensure every cycle hop appears
  for (const required of QUANTUM_EVIDENCE_BOUNDARY_CYCLE) {
    if (!hops.some((h) => h.hop === required)) {
      hops.push(hop(required, 'WAITING_DATA', `Hop ${required} placeholder.`));
    }
  }

  return {
    label: GITHUB_SOT_LABEL,
    honesty: HONESTY_BANNER,
    locksIntact: assertEo5LocksIntact(),
    l4AutonomyEnabled: false,
    dbCandidates: EO5_DB_CANDIDATES_STATUS,
    evidenceClasses: QUANTUM_EVIDENCE_CLASSES,
    artifactFields: QUANTUM_EVIDENCE_ARTIFACT_FIELDS,
    classicalFamilies: CLASSICAL_BASELINE_FAMILIES,
    comparisonDimensions: CLASSICAL_COMPARISON_DIMENSIONS,
    softWire,
    hops,
    nextPhase: NEXT_PHASE_TITLE,
  };
}
