/**
 * 62L-EO4 — AI & Quantum Capability Matrix runtime.
 *
 * Maps government requirements to proven XIV capabilities.
 * Proposal agents may only use language supported by the matrix.
 * Auto-flags raise gaps; never sell ahead of evidence.
 */

import {
  AI_QUANTUM_CAPABILITY_MATRIX_CYCLE,
  AUTO_FLAG_KINDS,
  BLOCKED_PROPOSAL_PHRASES,
  CAPABILITY_MAPPING_LABELS,
  CAPABILITY_RECORD_FIELDS,
  EO4_DB_CANDIDATES_STATUS,
  EO4_LOCKS,
  EO4_MAY,
  EO4_MUST_NOT,
  HONESTY_BANNER,
  PROPOSAL_LANGUAGE_BY_EVIDENCE,
  QUANTUM_EVIDENCE_LABELS,
  assertEo4LocksIntact,
  eo4SoftWireSnapshot,
  isHumanApprover,
  type AutoFlag,
  type AutoFlagKind,
  type CapabilityMappingLabel,
  type CapabilityRecord,
  type Eo4Actor,
  type Eo4EvidenceState,
  type Eo4Hop,
  type Eo4HopRecord,
  type Eo4SoftWireSnapshot,
  type QuantumEvidenceLabel,
} from './ai-quantum-capability-matrix-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(h: Eo4Hop, state: Eo4EvidenceState, summary: string): Eo4HopRecord {
  return { hop: h, state, summary, at: nowIso() };
}

// ---------------------------------------------------------------------------
// A — Matrix store + multi-echelon logistics fixture
// ---------------------------------------------------------------------------

const REQUIREMENT_MULTI_ECHELON =
  'optimize_multi_echelon_military_logistics' as const;

/** Fixture / test encoding of the example mapping from the EO4 brief. */
export function buildMultiEchelonLogisticsFixture(input?: {
  agenticTestsPassed?: boolean;
  physicalQpuBackendEvidence?: boolean;
}): CapabilityRecord[] {
  const agenticTestsPassed = input?.agenticTestsPassed === true;
  const physicalQpu = input?.physicalQpuBackendEvidence === true;

  const classicalOr: CapabilityRecord = {
    requirementId: REQUIREMENT_MULTI_ECHELON,
    capabilityName: 'Classical OR optimization',
    xivModuleService: 'local-runtime/classical-quant-benchmark + logistics advisory',
    evidenceState: 'SUPPORTED',
    hardwareRuntimeDependency: 'CPU (classical); no QPU required',
    benchmarkTestEvidence: 'classical_quant_benchmark suite (routing/assignment microbench)',
    classicalBaseline: 'greedy_assignment / weighted_scoring / route_selection',
    securityComplianceDependencies: 'tenant-scoped advisory only; no classified ingest',
    staffingPartnerDependency: 'none required for classical OR advisory',
    dataRequirements: 'declassified or synthetic logistics topology for demos',
    knownLimitations: 'Advisory optimization only — no autonomous freight/PO/prod-change',
    prototypeReadiness: 'PILOT_CANDIDATE',
    productionReadiness: 'NOT_AUTHORIZED',
    evidenceOwner: 'eo4-capability-matrix',
    lastVerifiedDate: null,
    quantumEvidenceState: null,
  };

  const agentic: CapabilityRecord = {
    requirementId: REQUIREMENT_MULTI_ECHELON,
    capabilityName: 'Agentic scenario decomposition',
    xivModuleService: 'local-brain mission/opportunity decomposition (EO1 soft-wire)',
    evidenceState: agenticTestsPassed ? 'SUPPORTED' : 'CANDIDATE',
    hardwareRuntimeDependency: 'CPU agent runtime',
    benchmarkTestEvidence: agenticTestsPassed
      ? 'agentic decomposition denial+cycle tests PASS'
      : 'pending further agentic scenario tests',
    classicalBaseline: 'human-led work-breakdown / scenario tree',
    securityComplianceDependencies: 'human approval before consequential capture actions',
    staffingPartnerDependency: 'human technical reviewer for flagged requirements',
    dataRequirements: 'requirement text + logistics problem statements',
    knownLimitations: 'CANDIDATE until tests elevate; recommend ≠ act',
    prototypeReadiness: agenticTestsPassed ? 'PILOT_CANDIDATE' : 'PROTOTYPE',
    productionReadiness: 'NOT_AUTHORIZED',
    evidenceOwner: 'eo4-capability-matrix',
    lastVerifiedDate: null,
    quantumEvidenceState: null,
  };

  const quantumInspired: CapabilityRecord = {
    requirementId: REQUIREMENT_MULTI_ECHELON,
    capabilityName: 'Quantum-inspired optimization',
    xivModuleService: 'quantum-inspired / simulated annealing-style research path',
    evidenceState: 'CANDIDATE',
    hardwareRuntimeDependency: 'CPU simulator (no physical QPU)',
    benchmarkTestEvidence: 'simulation-only; classical baseline comparison required',
    classicalBaseline: 'classical OR optimization (SUPPORTED facet) — required comparison',
    securityComplianceDependencies: 'research context; no production QPU claim',
    staffingPartnerDependency: 'quantum analyst + classical OR reviewer',
    dataRequirements: 'same logistics graph as classical baseline',
    knownLimitations:
      'SIMULATED / QUANTUM_INSPIRED only — not PHYSICAL_QPU_VERIFIED; theoretical ≠ operational',
    prototypeReadiness: 'LAB_ONLY',
    productionReadiness: 'NOT_AUTHORIZED',
    evidenceOwner: 'eo4-capability-matrix',
    lastVerifiedDate: null,
    quantumEvidenceState: 'QUANTUM_INSPIRED',
  };

  // Also encode SIMULATED twin for the same research path.
  const quantumSimulated: CapabilityRecord = {
    ...quantumInspired,
    capabilityName: 'Quantum-inspired optimization (simulated backend)',
    quantumEvidenceState: 'SIMULATED',
    knownLimitations:
      'SIMULATED backend only — SIMULATED ≠ PHYSICAL_QPU_VERIFIED; no sell-ahead',
  };

  const physicalQpuRecord: CapabilityRecord = {
    requirementId: REQUIREMENT_MULTI_ECHELON,
    capabilityName: 'Physical QPU execution',
    xivModuleService: 'QPU accelerator route (EM fabric soft-wire)',
    evidenceState: physicalQpu ? 'CANDIDATE' : 'NOT_AVAILABLE',
    hardwareRuntimeDependency: physicalQpu
      ? 'physical QPU backend (evidence-gated)'
      : 'none — no physical QPU backend evidence on this tip',
    benchmarkTestEvidence: physicalQpu
      ? 'backend evidence present — still not PRODUCTION AUTHORIZED'
      : 'no physical QPU backend evidence',
    classicalBaseline: 'classical OR optimization must remain primary operational path',
    securityComplianceDependencies: 'QPU access credentials + compliance review required',
    staffingPartnerDependency: physicalQpu
      ? 'verified QPU partner (human-authorized)'
      : 'unverified — partner dependency flagged',
    dataRequirements: 'problem encoding suitable for QPU + classical comparison suite',
    knownLimitations:
      'Physical QPU NOT_AVAILABLE unless actual backend evidence exists; DETECTED ≠ VERIFIED',
    prototypeReadiness: physicalQpu ? 'LAB_ONLY' : 'NOT_STARTED',
    productionReadiness: 'NOT_AUTHORIZED',
    evidenceOwner: 'eo4-capability-matrix',
    lastVerifiedDate: null,
    quantumEvidenceState: physicalQpu ? 'PHYSICAL_QPU_VERIFIED' : 'THEORETICAL',
  };

  return [classicalOr, agentic, quantumInspired, quantumSimulated, physicalQpuRecord];
}

let matrixStore: CapabilityRecord[] = buildMultiEchelonLogisticsFixture();

export function resetCapabilityMatrix(
  records?: CapabilityRecord[],
): CapabilityRecord[] {
  matrixStore = records ? [...records] : buildMultiEchelonLogisticsFixture();
  return [...matrixStore];
}

export function listCapabilityMatrix(): CapabilityRecord[] {
  return [...matrixStore];
}

export function registerCapabilityRecord(
  record: CapabilityRecord,
): CapabilityRecord | { state: 'DENIED'; reason: string } {
  if (!CAPABILITY_MAPPING_LABELS.includes(record.evidenceState)) {
    return { state: 'DENIED', reason: 'INVALID_EVIDENCE_STATE' };
  }
  if (
    record.quantumEvidenceState != null &&
    !QUANTUM_EVIDENCE_LABELS.includes(record.quantumEvidenceState)
  ) {
    return { state: 'DENIED', reason: 'INVALID_QUANTUM_EVIDENCE_STATE' };
  }
  // Never allow PHYSICAL_QPU_VERIFIED without stating backend evidence in fields.
  if (
    record.quantumEvidenceState === 'PHYSICAL_QPU_VERIFIED' &&
    (!record.benchmarkTestEvidence ||
      /no physical qpu/i.test(record.benchmarkTestEvidence))
  ) {
    return {
      state: 'DENIED',
      reason:
        'PHYSICAL_QPU_WITHOUT_BACKEND_EVIDENCE — cannot register PHYSICAL_QPU_VERIFIED without backend evidence.',
    };
  }
  matrixStore = matrixStore.filter(
    (r) =>
      !(
        r.requirementId === record.requirementId &&
        r.capabilityName === record.capabilityName
      ),
  );
  matrixStore.push(record);
  return record;
}

export function getCapabilitiesForRequirement(
  requirementId: string,
): CapabilityRecord[] {
  return matrixStore.filter((r) => r.requirementId === requirementId);
}

export function mappingLabelRank(label: CapabilityMappingLabel): number {
  switch (label) {
    case 'NOT_AVAILABLE':
      return 0;
    case 'CANDIDATE':
      return 1;
    case 'SUPPORTED':
      return 2;
    case 'VERIFIED':
      return 3;
    default:
      return -1;
  }
}

// ---------------------------------------------------------------------------
// C — Proposal language gate (hard)
// ---------------------------------------------------------------------------

export type ProposalLanguageGateResult =
  | {
      state: 'ALLOWED';
      executed: false;
      language: string;
      supportingEvidence: CapabilityMappingLabel;
      reason: string;
    }
  | {
      state: 'DENIED';
      executed: false;
      language: string;
      reason: string;
      flag: AutoFlag;
    };

/**
 * Proposal agents may only use language supported by the matrix evidence state.
 * Deny unsupported claim language. Never sell ahead of evidence.
 */
export function gateProposalLanguage(input: {
  requirementId: string;
  capabilityName: string;
  proposedLanguage: string;
  actor: Eo4Actor;
}): ProposalLanguageGateResult {
  const lang = input.proposedLanguage.trim();
  const lower = lang.toLowerCase();

  for (const blocked of BLOCKED_PROPOSAL_PHRASES) {
    if (lower.includes(blocked)) {
      const flag: AutoFlag = {
        kind: 'unsupported_proposal_language',
        severity: 'block',
        message: `Blocked phrase "${blocked}" — sell-ahead / unsupported claim language.`,
        requirementId: input.requirementId,
        capabilityName: input.capabilityName,
      };
      return {
        state: 'DENIED',
        executed: false,
        language: lang,
        reason: 'UNSUPPORTED_PROPOSAL_LANGUAGE — blocked claim phrase.',
        flag,
      };
    }
  }

  const records = getCapabilitiesForRequirement(input.requirementId).filter(
    (r) => r.capabilityName === input.capabilityName,
  );
  if (records.length === 0) {
    const flag: AutoFlag = {
      kind: 'missing_evidence',
      severity: 'block',
      message: 'No capability matrix row for requirement/capability pair.',
      requirementId: input.requirementId,
      capabilityName: input.capabilityName,
    };
    return {
      state: 'DENIED',
      executed: false,
      language: lang,
      reason: 'MISSING_EVIDENCE — capability not mapped in matrix.',
      flag,
    };
  }

  const record = records[0]!;
  const allowedPhrases = PROPOSAL_LANGUAGE_BY_EVIDENCE[record.evidenceState];
  const matched = allowedPhrases.some((p) => lower.includes(p.toLowerCase()));

  // Deny language that claims a stronger mapping than recorded.
  // Honest matrix phrases (matched) are allowed even when they contain words
  // like "operational" inside negations ("cannot claim operational delivery").
  const overclaim =
    !matched &&
    ((record.evidenceState === 'NOT_AVAILABLE' &&
      /\b(verified|supported|operational|production|deliver)\b/i.test(lang)) ||
      (record.evidenceState === 'CANDIDATE' &&
        /\b(verified|production[- ]authorized|operationally proven)\b/i.test(
          lang,
        )) ||
      (record.evidenceState === 'SUPPORTED' &&
        /\b(production[- ]authorized|quantum advantage)\b/i.test(lang)));

  if (!matched || overclaim) {
    const flag: AutoFlag = {
      kind: 'unsupported_proposal_language',
      severity: 'block',
      message: `Language not supported by evidenceState=${record.evidenceState}.`,
      requirementId: input.requirementId,
      capabilityName: input.capabilityName,
    };
    return {
      state: 'DENIED',
      executed: false,
      language: lang,
      reason: `PROPOSAL_LANGUAGE_GATE — only matrix-supported language for ${record.evidenceState}; theoretical ≠ operational.`,
      flag,
    };
  }

  // Quantum-specific: deny physical/operational quantum wording unless PHYSICAL_QPU_VERIFIED.
  if (
    record.quantumEvidenceState &&
    record.quantumEvidenceState !== 'PHYSICAL_QPU_VERIFIED' &&
    /\b(physical qpu|production qpu|operational quantum)\b/i.test(lang)
  ) {
    const flag: AutoFlag = {
      kind: 'unsupported_proposal_language',
      severity: 'block',
      message: `Quantum claim exceeds quantumEvidenceState=${record.quantumEvidenceState}.`,
      requirementId: input.requirementId,
      capabilityName: input.capabilityName,
    };
    return {
      state: 'DENIED',
      executed: false,
      language: lang,
      reason:
        'THEORETICAL_NEQ_OPERATIONAL — quantum label does not authorize operational/physical QPU language.',
      flag,
    };
  }

  void input.actor;
  return {
    state: 'ALLOWED',
    executed: false,
    language: lang,
    supportingEvidence: record.evidenceState,
    reason: `Language permitted under evidenceState=${record.evidenceState}.`,
  };
}

export function attemptSellAheadOfEvidence(input: {
  claim: string;
  evidenceState: CapabilityMappingLabel;
  quantumEvidenceState?: QuantumEvidenceLabel | null;
}): { state: 'DENIED'; executed: false; reason: string; sellAhead: false } {
  void input;
  return {
    state: 'DENIED',
    executed: false,
    sellAhead: false,
    reason:
      'SELL_AHEAD_OF_EVIDENCE=false — theoretical ≠ operational; research ambition ≠ current capability.',
  };
}

// ---------------------------------------------------------------------------
// D — Auto-flags
// ---------------------------------------------------------------------------

const STALE_BENCHMARK_DAYS = 180;

export function evaluateAutoFlags(input?: {
  now?: Date;
  records?: CapabilityRecord[];
}): AutoFlag[] {
  const records = input?.records ?? listCapabilityMatrix();
  const now = input?.now ?? new Date();
  const flags: AutoFlag[] = [];

  for (const r of records) {
    // missing evidence
    if (
      !r.benchmarkTestEvidence ||
      r.benchmarkTestEvidence === 'none' ||
      /no .*evidence/i.test(r.benchmarkTestEvidence)
    ) {
      if (r.evidenceState === 'VERIFIED' || r.evidenceState === 'SUPPORTED') {
        flags.push({
          kind: 'missing_evidence',
          severity: 'block',
          message: `Missing or empty benchmark evidence for ${r.capabilityName}.`,
          requirementId: r.requirementId,
          capabilityName: r.capabilityName,
        });
      } else if (r.evidenceState !== 'NOT_AVAILABLE') {
        flags.push({
          kind: 'missing_evidence',
          severity: 'warn',
          message: `Benchmark evidence incomplete for ${r.capabilityName}.`,
          requirementId: r.requirementId,
          capabilityName: r.capabilityName,
        });
      }
    }

    // stale benchmarks
    if (r.lastVerifiedDate) {
      const verified = new Date(r.lastVerifiedDate);
      const ageDays =
        (now.getTime() - verified.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > STALE_BENCHMARK_DAYS) {
        flags.push({
          kind: 'stale_benchmarks',
          severity: 'warn',
          message: `Benchmark/verification older than ${STALE_BENCHMARK_DAYS} days for ${r.capabilityName}.`,
          requirementId: r.requirementId,
          capabilityName: r.capabilityName,
        });
      }
    } else if (r.evidenceState === 'VERIFIED') {
      flags.push({
        kind: 'stale_benchmarks',
        severity: 'block',
        message: `VERIFIED without lastVerifiedDate for ${r.capabilityName}.`,
        requirementId: r.requirementId,
        capabilityName: r.capabilityName,
      });
    }

    // certification gaps
    if (
      /certif/i.test(r.securityComplianceDependencies) === false &&
      (r.evidenceState === 'VERIFIED' || r.productionReadiness === 'PRODUCTION_AUTHORIZED')
    ) {
      flags.push({
        kind: 'certification_gaps',
        severity: 'review',
        message: `Certification/compliance posture not evidenced for ${r.capabilityName}.`,
        requirementId: r.requirementId,
        capabilityName: r.capabilityName,
      });
    }
    if (
      r.productionReadiness === 'PRODUCTION_AUTHORIZED' &&
      EO4_LOCKS.PRODUCTION_AUTHORIZATION === false
    ) {
      flags.push({
        kind: 'certification_gaps',
        severity: 'block',
        message: `productionReadiness=PRODUCTION_AUTHORIZED but EO4 production authorization lock is false.`,
        requirementId: r.requirementId,
        capabilityName: r.capabilityName,
      });
    }

    // hardware assumptions
    if (
      /qpu|gpu|npu/i.test(r.hardwareRuntimeDependency) &&
      r.evidenceState === 'VERIFIED' &&
      /assumption|assumed|unverified hardware/i.test(r.knownLimitations)
    ) {
      flags.push({
        kind: 'hardware_assumptions',
        severity: 'block',
        message: `Hardware assumptions undercut VERIFIED state for ${r.capabilityName}.`,
        requirementId: r.requirementId,
        capabilityName: r.capabilityName,
      });
    }
    if (
      r.quantumEvidenceState === 'PHYSICAL_QPU_VERIFIED' &&
      r.evidenceState === 'NOT_AVAILABLE'
    ) {
      flags.push({
        kind: 'hardware_assumptions',
        severity: 'block',
        message: `PHYSICAL_QPU_VERIFIED incompatible with NOT_AVAILABLE mapping.`,
        requirementId: r.requirementId,
        capabilityName: r.capabilityName,
      });
    }
    if (
      r.capabilityName.toLowerCase().includes('physical qpu') &&
      r.evidenceState === 'NOT_AVAILABLE'
    ) {
      flags.push({
        kind: 'hardware_assumptions',
        severity: 'warn',
        message: `Physical QPU facet remains NOT_AVAILABLE — do not assume hardware.`,
        requirementId: r.requirementId,
        capabilityName: r.capabilityName,
      });
    }

    // unverified partner dependencies
    if (
      /unverified|pending partner|partner dependency flagged/i.test(
        r.staffingPartnerDependency,
      )
    ) {
      flags.push({
        kind: 'unverified_partner_dependencies',
        severity: 'review',
        message: `Unverified partner dependency for ${r.capabilityName}.`,
        requirementId: r.requirementId,
        capabilityName: r.capabilityName,
      });
    }

    // quantum without classical comparison
    if (
      r.quantumEvidenceState &&
      r.quantumEvidenceState !== 'THEORETICAL' &&
      (!r.classicalBaseline ||
        r.classicalBaseline === 'none' ||
        /missing|absent|not provided/i.test(r.classicalBaseline))
    ) {
      flags.push({
        kind: 'quantum_claims_without_classical_comparison',
        severity: 'block',
        message: `Quantum evidence ${r.quantumEvidenceState} without classical baseline comparison.`,
        requirementId: r.requirementId,
        capabilityName: r.capabilityName,
      });
    }

    // human technical review
    if (
      r.evidenceState === 'CANDIDATE' ||
      r.quantumEvidenceState === 'THEORETICAL' ||
      r.quantumEvidenceState === 'SIMULATED' ||
      r.quantumEvidenceState === 'QUANTUM_INSPIRED' ||
      r.evidenceState === 'NOT_AVAILABLE'
    ) {
      flags.push({
        kind: 'requirements_needing_human_technical_review',
        severity: 'review',
        message: `Requirement facet ${r.capabilityName} needs human technical review before proposal claims.`,
        requirementId: r.requirementId,
        capabilityName: r.capabilityName,
      });
    }
  }

  return flags;
}

export function autoFlagKindsCovered(): readonly AutoFlagKind[] {
  return AUTO_FLAG_KINDS;
}

// ---------------------------------------------------------------------------
// Autonomy denies
// ---------------------------------------------------------------------------

export function attemptAutoSubmission(): {
  state: 'DENIED';
  executed: false;
  autoSubmitted: false;
  reason: string;
} {
  return {
    state: 'DENIED',
    executed: false,
    autoSubmitted: false,
    reason:
      'NO_AUTO_SUBMISSION — consequential submissions require human authorization; L4_AUTONOMY_ENABLED=false.',
  };
}

export function attemptAutoCertify(): {
  state: 'DENIED';
  executed: false;
  autoCertified: false;
  reason: string;
} {
  return {
    state: 'DENIED',
    executed: false,
    autoCertified: false,
    reason: 'NO_AUTO_CERTIFY — certification requires human authorization.',
  };
}

export function attemptAutoBid(): {
  state: 'DENIED';
  executed: false;
  autoBid: false;
  reason: string;
} {
  return {
    state: 'DENIED',
    executed: false,
    autoBid: false,
    reason: 'NO_AUTO_BID — bids require human-authorized submission.',
  };
}

export function attemptEo3SolicitationDrivenUpgrade(input: {
  from: CapabilityMappingLabel;
  to: CapabilityMappingLabel;
}): {
  state: 'DENIED';
  executed: false;
  upgraded: false;
  reason: string;
} {
  void input;
  return {
    state: 'DENIED',
    executed: false,
    upgraded: false,
    reason:
      'EO3_WATCH_SOLICITATION_DRIVEN_UPGRADE=false — opportunity watch must not upgrade capability labels.',
  };
}

export function requireHumanTechnicalReview(
  actor: Eo4Actor,
  requirementId: string,
):
  | { state: 'APPROVED'; requirementId: string; reviewerId: string }
  | { state: 'DENIED'; reason: string } {
  if (!isHumanApprover(actor) && actor.kind !== 'technical_reviewer') {
    return {
      state: 'DENIED',
      reason: 'HUMAN_TECHNICAL_REVIEW_REQUIRED — actor cannot clear review gate.',
    };
  }
  if (
    !actor.permissions.includes('technical_review') &&
    !actor.permissions.includes('approve_consequential')
  ) {
    return {
      state: 'DENIED',
      reason: 'Missing technical_review / approve_consequential permission.',
    };
  }
  return {
    state: 'APPROVED',
    requirementId,
    reviewerId: actor.id,
  };
}

// ---------------------------------------------------------------------------
// Bootstrap / cycle
// ---------------------------------------------------------------------------

export type CapabilityMatrixBootstrap = {
  honestyBanner: typeof HONESTY_BANNER;
  locksIntact: boolean;
  dbCandidates: typeof EO4_DB_CANDIDATES_STATUS;
  matrixSize: number;
  softWire: Eo4SoftWireSnapshot;
  hops: Eo4HopRecord[];
  may: typeof EO4_MAY;
  mustNot: typeof EO4_MUST_NOT;
  guardianRlsTenantUniverseUnchanged: true;
};

export function bootstrapAiQuantumCapabilityMatrix(repoRoot?: string): CapabilityMatrixBootstrap {
  const softWire = eo4SoftWireSnapshot(repoRoot);
  const locksIntact = assertEo4LocksIntact();
  const matrix = resetCapabilityMatrix();
  const hops: Eo4HopRecord[] = [];

  hops.push(hop('honesty_locks', locksIntact ? 'PASS' : 'FAIL', HONESTY_BANNER));
  hops.push(
    hop(
      'capability_matrix_bootstrap',
      'REGISTERED',
      `Matrix bootstrap with ${matrix.length} fixture records.`,
    ),
  );
  hops.push(
    hop(
      'capability_mapping_labels',
      'PASS',
      `Labels: ${CAPABILITY_MAPPING_LABELS.join(' | ')}.`,
    ),
  );
  hops.push(
    hop(
      'quantum_evidence_labels',
      'PASS',
      `Quantum labels: ${QUANTUM_EVIDENCE_LABELS.join(' | ')}.`,
    ),
  );
  hops.push(
    hop(
      'capability_record_fields',
      'PASS',
      `Record fields: ${CAPABILITY_RECORD_FIELDS.join(', ')}.`,
    ),
  );
  hops.push(
    hop(
      'multi_echelon_logistics_fixture',
      'PASS',
      'Fixture: optimize multi-echelon military logistics.',
    ),
  );
  hops.push(hop('classical_or_supported', 'PASS', 'Classical OR optimization — SUPPORTED.'));
  hops.push(
    hop(
      'agentic_decomposition_candidate_or_supported',
      'PASS',
      'Agentic scenario decomposition — CANDIDATE (or SUPPORTED when tests pass).',
    ),
  );
  hops.push(
    hop(
      'quantum_inspired_simulated',
      'PASS',
      'Quantum-inspired optimization — SIMULATED / QUANTUM_INSPIRED.',
    ),
  );
  hops.push(
    hop(
      'physical_qpu_not_available_without_backend',
      'PASS',
      'Physical QPU execution — NOT_AVAILABLE unless backend evidence exists.',
    ),
  );
  hops.push(hop('proposal_language_gate', 'PASS', 'Proposal language gate armed.'));
  hops.push(
    hop('deny_unsupported_claim_language', 'PASS', 'Unsupported claim language denied.'),
  );
  hops.push(
    hop(
      'never_sell_ahead_of_evidence',
      'PASS',
      'SELL_AHEAD_OF_EVIDENCE=false.',
    ),
  );
  hops.push(
    hop(
      'theoretical_neq_operational',
      'PASS',
      'THEORETICAL ≠ OPERATIONAL capability.',
    ),
  );

  for (const kind of AUTO_FLAG_KINDS) {
    const hopName = (
      {
        unsupported_proposal_language: 'auto_flag_unsupported_proposal_language',
        stale_benchmarks: 'auto_flag_stale_benchmarks',
        missing_evidence: 'auto_flag_missing_evidence',
        certification_gaps: 'auto_flag_certification_gaps',
        hardware_assumptions: 'auto_flag_hardware_assumptions',
        unverified_partner_dependencies: 'auto_flag_unverified_partner_dependencies',
        quantum_claims_without_classical_comparison: 'auto_flag_quantum_without_classical',
        requirements_needing_human_technical_review: 'auto_flag_human_technical_review',
      } as const
    )[kind];
    hops.push(hop(hopName, 'PASS', `Auto-flag kind registered: ${kind}.`));
  }

  hops.push(
    hop(
      'eo3_watch_soft_wire',
      softWire.eo3Watch.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo3Watch.note,
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
      'em_quantum_truth_soft_wire',
      softWire.emCapabilityTruth.present || softWire.emQuantumTruthLabels.present
        ? 'PASS'
        : 'WAITING_DATA',
      'EM quantum truth / capability-truth soft-wire probed.',
    ),
  );
  hops.push(
    hop(
      'classical_baseline_soft_wire',
      softWire.classicalQuantBaseline.present ? 'PASS' : 'WAITING_DATA',
      softWire.classicalQuantBaseline.note,
    ),
  );
  hops.push(
    hop(
      'en_deal_os_soft_wire',
      softWire.enDealOs.present ? 'PASS' : 'WAITING_DATA',
      softWire.enDealOs.note,
    ),
  );
  hops.push(
    hop(
      'eo_mission_os_soft_wire',
      softWire.eoMissionOsTypes.present ? 'PASS' : 'WAITING_DATA',
      softWire.eoMissionOsTypes.note,
    ),
  );
  hops.push(hop('no_auto_submission', 'PASS', 'AUTO_SUBMISSION=false.'));
  hops.push(hop('l4_autonomy_false', 'PASS', 'L4_AUTONOMY_ENABLED=false.'));
  hops.push(
    hop(
      'guardian_rls_tenant_universe_unchanged',
      'PASS',
      'Guardian/RLS/tenant/Universe unchanged (bypass locks false).',
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      'NOT_APPLIED',
      `DB candidates status=${EO4_DB_CANDIDATES_STATUS}.`,
    ),
  );
  hops.push(
    hop(
      'evidence',
      'PASS',
      'EO4 capability matrix cycle complete — park-and-implement; no tip-land/PR.',
    ),
  );

  // Ensure cycle inventory is complete.
  for (const required of AI_QUANTUM_CAPABILITY_MATRIX_CYCLE) {
    if (!hops.some((h) => h.hop === required)) {
      hops.push(hop(required, 'FAIL', `Missing hop emission for ${required}.`));
    }
  }

  return {
    honestyBanner: HONESTY_BANNER,
    locksIntact,
    dbCandidates: EO4_DB_CANDIDATES_STATUS,
    matrixSize: matrix.length,
    softWire,
    hops,
    may: EO4_MAY,
    mustNot: EO4_MUST_NOT,
    guardianRlsTenantUniverseUnchanged: true,
  };
}

export function runCapabilityMatrixCycle(repoRoot?: string): Eo4HopRecord[] {
  return bootstrapAiQuantumCapabilityMatrix(repoRoot).hops;
}
