/**
 * 62L-EX11 — Quantum Evidence Ledger.
 *
 * Append-oriented scientific truth store for the quantum pathway.
 * Soft-wires EX1–EX10 / Agent Mesh / audit / existing evidence ledgers via existsSync.
 * Does not replace orchestration/local-runtime/EO5 ledgers — quantum-path extension only.
 *
 * Offline: LOCAL_PENDING_REVIEW; reconnect is revoke-first, dedupe, contradict, hash-verify, review.
 * No last-write-wins. No auto global promote. Learning never touches permissions/Guardian/RLS.
 */

import { createHash } from 'node:crypto';

import {
  createContradictionLedger,
  type ContradictionLedger,
} from './contradiction-ledger.ts';
import {
  computeIntegrityHashForItem,
  verifyIntegrityHash,
} from './evidence-integrity.ts';
import {
  createEvidenceReviewBoard,
  type ReviewBoard,
} from './evidence-review.ts';
import {
  getEvidenceById,
  isActiveRoutingCandidate,
  queryEvidence,
  type EvidenceQueryFilter,
  type EvidenceQueryScope,
} from './evidence-query.ts';
import {
  EVIDENCE_CLASSIFICATIONS,
  EVIDENCE_TYPES,
  EX11_LOCKS,
  FORBIDDEN_COLLAPSED_LABEL,
  REJECTED_SOURCE_TYPES,
  SCALE_HONESTY,
  assertEx11LocksIntact,
  type ClaimGateEvaluation,
  type CompressedEvidenceBundle,
  type EvidenceAppendInput,
  type EvidenceAppendResult,
  type EvidenceClassification,
  type EvidenceContradiction,
  type EvidenceDenial,
  type EvidenceState,
  type EvidenceType,
  type LearningAllowedTarget,
  type LearningForbiddenTarget,
  type NeuralPathwayLesson,
  type QuantumEvidenceItem,
  type ScaleCounters,
  type SourceType,
} from './evidence-types.ts';

export type QuantumEvidenceLedger = {
  append(input: EvidenceAppendInput): EvidenceAppendResult;
  supersede(input: EvidenceAppendInput & { supersedesEvidenceId: string }): EvidenceAppendResult;
  revoke(evidenceId: string, scope: EvidenceQueryScope, reason: string, now?: string): EvidenceAppendResult;
  markStale(evidenceId: string, scope: EvidenceQueryScope, now?: string): EvidenceAppendResult;
  recordContradiction(input: {
    leftEvidenceId: string;
    rightEvidenceId: string;
    topic: string;
    summary: string;
    scope: EvidenceQueryScope;
    createdAt?: string;
  }): { ok: true; contradiction: EvidenceContradiction } | EvidenceDenial;
  review: ReviewBoard;
  applyReview(
    evidenceId: string,
    scope: EvidenceQueryScope,
    input: Parameters<ReviewBoard['submit']>[0],
  ): EvidenceAppendResult;
  query(scope: EvidenceQueryScope, filter?: EvidenceQueryFilter): ReturnType<typeof queryEvidence>;
  get(evidenceId: string, scope: EvidenceQueryScope): ReturnType<typeof getEvidenceById>;
  evaluateClaimGate(
    claim: 'PHYSICAL_QPU_VERIFIED' | 'QUANTUM_ADVANTAGE_VERIFIED',
    evidenceId: string,
    scope: EvidenceQueryScope,
  ): ClaimGateEvaluation;
  applyLearningLesson(input: {
    evidenceId: string;
    scope: EvidenceQueryScope;
    target: LearningAllowedTarget | LearningForbiddenTarget;
    priorityDelta: number;
    now?: string;
  }):
    | { ok: true; lesson: NeuralPathwayLesson }
    | EvidenceDenial;
  syncOnReconnect(scope: EvidenceQueryScope, now?: string): {
    revokedFirst: number;
    deduped: number;
    contradictionsChecked: number;
    hashFailures: number;
    pendingReview: number;
    autoGlobalPromoted: false;
  };
  compress(scope: EvidenceQueryScope, evidenceIds: readonly string[], now?: string):
    | { ok: true; bundle: CompressedEvidenceBundle }
    | EvidenceDenial;
  scaleCounters(): ScaleCounters;
  listAllRawForTests(): readonly QuantumEvidenceItem[];
  contradictions: ContradictionLedger;
};

const REJECTED_SOURCES = new Set<string>(REJECTED_SOURCE_TYPES);
const VALID_TYPES = new Set<string>(EVIDENCE_TYPES);
const VALID_CLASSIFICATIONS = new Set<string>(EVIDENCE_CLASSIFICATIONS);

function classifyMustMatchType(
  evidenceType: EvidenceType,
  classification: EvidenceClassification,
): string | null {
  if (evidenceType === 'CLASSICAL_BASELINE' && classification !== 'CLASSICAL') {
    return 'CLASSICAL_BASELINE_MUST_STAY_CLASSICAL';
  }
  if (evidenceType === 'QUANTUM_INSPIRED_EXPERIMENT' && classification !== 'QUANTUM_INSPIRED') {
    return 'QUANTUM_INSPIRED_MUST_STAY_QUANTUM_INSPIRED';
  }
  if (evidenceType === 'SIMULATED_QUANTUM_RUN' && classification !== 'SIMULATED_QUANTUM') {
    return 'SIMULATOR_MUST_STAY_SIMULATED_QUANTUM';
  }
  if (
    classification === 'PHYSICAL_QPU_VERIFIED' &&
    evidenceType === 'SIMULATED_QUANTUM_RUN'
  ) {
    return 'SIMULATOR_CANNOT_BECOME_PHYSICAL_QPU_VERIFIED';
  }
  if (
    classification === 'PHYSICAL_QPU_VERIFIED' &&
    evidenceType !== 'PHYSICAL_QPU_RECEIPT' &&
    evidenceType !== 'AUTHORIZED_PROVIDER_SOURCE'
  ) {
    return 'PHYSICAL_QPU_VERIFIED_REQUIRES_PHYSICAL_RECEIPT_TYPE';
  }
  return null;
}

function rightsForSource(sourceType: SourceType): {
  ok: true;
} | EvidenceDenial {
  if (REJECTED_SOURCES.has(sourceType)) {
    return {
      ok: false,
      denied: true,
      reason: `RESTRICTED_SOURCE_${sourceType}`,
      disposition: 'QUARANTINED',
    };
  }
  return { ok: true };
}

function freshnessFromRuntime(
  now: string,
  runtimeFreshUntil: string | null | undefined,
  requested: QuantumEvidenceItem['freshnessState'] | undefined,
): QuantumEvidenceItem['freshnessState'] {
  if (runtimeFreshUntil && now > runtimeFreshUntil) return 'STALE';
  return requested ?? 'FRESH';
}

function newEvidenceId(seed: string): string {
  return `qev-${createHash('sha256').update(seed).digest('hex').slice(0, 22)}`;
}

function tenantPrivateNotGlobal(item: Pick<QuantumEvidenceItem, 'rightsClass' | 'dataClass' | 'replicationPolicy'>): boolean {
  if (item.rightsClass === 'TENANT_PRIVATE' || item.dataClass === 'TENANT_PRIVATE') {
    return item.replicationPolicy === 'TENANT_SCOPED' || item.replicationPolicy === 'LOCAL_ONLY' || item.replicationPolicy === 'REVIEW_REQUIRED_BEFORE_SYNC';
  }
  if (item.rightsClass === 'SEALED_LOCAL' || item.dataClass === 'SEALED_LOCAL') {
    return item.replicationPolicy === 'SEALED_NO_CLOUD' || item.replicationPolicy === 'LOCAL_ONLY';
  }
  return true;
}

export function createQuantumEvidenceLedger(): QuantumEvidenceLedger {
  assertEx11LocksIntact();

  /** Append-only version chains keyed by evidenceId. */
  const versions = new Map<string, QuantumEvidenceItem[]>();
  const contradictions = createContradictionLedger();
  const review = createEvidenceReviewBoard();
  const lessons: NeuralPathwayLesson[] = [];
  let measuredEdgeCount = 0;

  function latest(evidenceId: string): QuantumEvidenceItem | null {
    const chain = versions.get(evidenceId);
    if (!chain || chain.length === 0) return null;
    return chain[chain.length - 1]!;
  }

  function allLatest(): QuantumEvidenceItem[] {
    const out: QuantumEvidenceItem[] = [];
    for (const chain of versions.values()) {
      if (chain.length > 0) out.push(chain[chain.length - 1]!);
    }
    return out;
  }

  function appendVersion(item: QuantumEvidenceItem): void {
    const chain = versions.get(item.evidenceId) ?? [];
    chain.push(item);
    versions.set(item.evidenceId, chain);
  }

  function buildItem(input: EvidenceAppendInput): EvidenceAppendResult {
    const now = input.now ?? new Date().toISOString();

    if (input.hiddenCot !== undefined && input.hiddenCot !== null) {
      return {
        ok: false,
        denied: true,
        reason: 'HIDDEN_COT_PERSISTENCE_FORBIDDEN',
        disposition: 'DENIED',
      };
    }

    if (!VALID_TYPES.has(input.evidenceType)) {
      return {
        ok: false,
        denied: true,
        reason: 'INVALID_EVIDENCE_TYPE',
        disposition: 'REJECTED',
      };
    }

    if (!VALID_CLASSIFICATIONS.has(input.classification)) {
      return {
        ok: false,
        denied: true,
        reason: `INVALID_CLASSIFICATION_OR_COLLAPSED_${FORBIDDEN_COLLAPSED_LABEL}`,
        disposition: 'REJECTED',
      };
    }

    // Explicit reject of collapsed QUANTUM_RESULT if smuggled via any string cast path.
    if ((input.classification as string) === FORBIDDEN_COLLAPSED_LABEL) {
      return {
        ok: false,
        denied: true,
        reason: 'COLLAPSE_TO_QUANTUM_RESULT_FORBIDDEN',
        disposition: 'REJECTED',
      };
    }

    const typeClassErr = classifyMustMatchType(input.evidenceType, input.classification);
    if (typeClassErr) {
      return {
        ok: false,
        denied: true,
        reason: typeClassErr,
        disposition: 'REJECTED',
      };
    }

    const sourceGate = rightsForSource(input.sourceType);
    if (!sourceGate.ok) return sourceGate;

    if (!tenantPrivateNotGlobal(input)) {
      return {
        ok: false,
        denied: true,
        reason: 'TENANT_PRIVATE_OR_SEALED_REPLICATION_VIOLATION',
        disposition: 'DENIED',
      };
    }

    if (input.historicalOnly && input.classification === 'PHYSICAL_QPU_VERIFIED') {
      return {
        ok: false,
        denied: true,
        reason: 'HISTORICAL_CANNOT_BE_PHYSICAL_QPU_VERIFIED',
        disposition: 'REJECTED',
      };
    }

    if (
      input.classification === 'PHYSICAL_QPU_VERIFIED' &&
      (!input.receiptId || input.receiptId.length === 0)
    ) {
      return {
        ok: false,
        denied: true,
        reason: 'PHYSICAL_QPU_VERIFIED_REQUIRES_EX6_RECEIPT_ID',
        disposition: 'REJECTED',
      };
    }

    const freshnessState = freshnessFromRuntime(now, input.runtimeFreshUntil, input.freshnessState);
    let evidenceState: EvidenceState = input.evidenceState ?? 'UNVERIFIED';
    if (freshnessState === 'STALE' || freshnessState === 'EXPIRED') {
      evidenceState = 'STALE';
    }

    const offline = input.offline === true;
    const reviewState = offline
      ? 'LOCAL_PENDING_REVIEW'
      : (input.reviewState ?? 'NOT_SUBMITTED');
    const syncDisposition = offline
      ? 'LOCAL_PENDING_REVIEW'
      : (input.syncDisposition ?? 'LOCAL_ONLY');

    const evidenceId =
      input.evidenceId ??
      newEvidenceId(
        [input.missionId, input.taskId, input.inputHash, input.outputHash, now].join('|'),
      );

    const prior = latest(evidenceId);
    const version = input.version ?? (prior ? prior.version + 1 : 1);

    if (prior && EX11_LOCKS.SILENT_REWRITE === false) {
      // Append-only: callers must use supersede or explicit new version — never mutate prior in place.
      if (version <= prior.version) {
        return {
          ok: false,
          denied: true,
          reason: 'SILENT_REWRITE_FORBIDDEN_USE_SUPERSEDE_OR_BUMP_VERSION',
          disposition: 'DENIED',
        };
      }
    }

    const base = {
      evidenceId,
      version,
      missionId: input.missionId,
      taskId: input.taskId,
      parentEvidenceId: input.parentEvidenceId,
      agentId: input.agentId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      evidenceType: input.evidenceType,
      classification: input.classification,
      sourceType: input.sourceType,
      sourceRef: input.sourceRef,
      experimentId: input.experimentId,
      receiptId: input.receiptId,
      benchmarkId: input.benchmarkId,
      comparisonId: input.comparisonId,
      algorithmVersion: input.algorithmVersion,
      runtimeVersion: input.runtimeVersion,
      requestedDevice: input.requestedDevice,
      actualDevice: input.actualDevice,
      provider: input.provider,
      backend: input.backend,
      inputHash: input.inputHash,
      outputHash: input.outputHash,
      createdAt: input.createdAt ?? now,
      measuredAt: input.measuredAt,
      confidence: input.confidence,
      reproducibility: input.reproducibility,
      rightsClass: input.rightsClass,
      dataClass: input.dataClass,
      replicationPolicy: input.replicationPolicy,
      limitations: input.limitations,
      supersedesEvidenceId: input.supersedesEvidenceId,
      historicalOnly: input.historicalOnly,
      scaleHonesty: input.scaleHonesty ?? SCALE_HONESTY.MEASURED,
    };

    const integrityHash = computeIntegrityHashForItem(base);

    const item: QuantumEvidenceItem = {
      ...base,
      integrityHash,
      freshnessState,
      reviewState,
      evidenceState,
      syncDisposition,
      contradictions: input.contradictions ?? [],
      hiddenCot: null,
    };

    return { ok: true, item };
  }

  const ledger: QuantumEvidenceLedger = {
    contradictions,
    review,

    append(input) {
      const built = buildItem(input);
      if (!built.ok) return built;

      // Optional caller-supplied integrity hash verification path.
      if (
        typeof input.providedIntegrityHash === 'string' &&
        input.providedIntegrityHash !== built.item.integrityHash
      ) {
        const rejected: QuantumEvidenceItem = {
          ...built.item,
          evidenceState: 'REJECTED',
          reviewState: 'REJECTED',
          integrityHash: input.providedIntegrityHash,
        };
        appendVersion(rejected);
        return {
          ok: false,
          denied: true,
          reason: 'INVALID_INTEGRITY_HASH',
          disposition: 'REJECTED',
          item: rejected,
        };
      }

      const check = verifyIntegrityHash(built.item);
      if (!check.valid) {
        const rejected: QuantumEvidenceItem = {
          ...built.item,
          evidenceState: 'UNVERIFIED',
          reviewState: 'REJECTED',
        };
        appendVersion(rejected);
        return {
          ok: false,
          denied: true,
          reason: 'INVALID_INTEGRITY_HASH',
          disposition: 'UNVERIFIED',
          item: rejected,
        };
      }

      appendVersion(built.item);
      return built;
    },

    supersede(input) {
      const prior = latest(input.supersedesEvidenceId);
      if (!prior) {
        return {
          ok: false,
          denied: true,
          reason: 'SUPERSEDE_TARGET_NOT_FOUND',
          disposition: 'DENIED',
        };
      }
      if (prior.tenantId !== input.tenantId || prior.universeId !== input.universeId) {
        return {
          ok: false,
          denied: true,
          reason: prior.tenantId !== input.tenantId ? 'CROSS_TENANT_DENIED' : 'CROSS_UNIVERSE_DENIED',
          disposition: 'DENIED',
        };
      }
      return this.append({
        ...input,
        evidenceId: input.evidenceId ?? newEvidenceId(`supersede|${input.supersedesEvidenceId}|${input.now ?? ''}`),
        parentEvidenceId: input.parentEvidenceId ?? input.supersedesEvidenceId,
        supersedesEvidenceId: input.supersedesEvidenceId,
      });
    },

    revoke(evidenceId, scope, _reason, now) {
      const cur = latest(evidenceId);
      if (!cur) {
        return { ok: false, denied: true, reason: 'EVIDENCE_NOT_FOUND', disposition: 'DENIED' };
      }
      if (cur.tenantId !== scope.tenantId) {
        return { ok: false, denied: true, reason: 'CROSS_TENANT_DENIED', disposition: 'DENIED' };
      }
      if (cur.universeId !== scope.universeId) {
        return { ok: false, denied: true, reason: 'CROSS_UNIVERSE_DENIED', disposition: 'DENIED' };
      }
      return this.append({
        ...cur,
        version: cur.version + 1,
        evidenceState: 'REVOKED',
        reviewState: cur.reviewState === 'LOCAL_PENDING_REVIEW' ? 'REJECTED' : cur.reviewState,
        syncDisposition: 'REVOKED_ON_RECONNECT',
        now: now ?? new Date().toISOString(),
        createdAt: now ?? new Date().toISOString(),
        contradictions: cur.contradictions,
        offline: false,
      });
    },

    markStale(evidenceId, scope, now) {
      const cur = latest(evidenceId);
      if (!cur) {
        return { ok: false, denied: true, reason: 'EVIDENCE_NOT_FOUND', disposition: 'DENIED' };
      }
      if (cur.tenantId !== scope.tenantId) {
        return { ok: false, denied: true, reason: 'CROSS_TENANT_DENIED', disposition: 'DENIED' };
      }
      if (cur.universeId !== scope.universeId) {
        return { ok: false, denied: true, reason: 'CROSS_UNIVERSE_DENIED', disposition: 'DENIED' };
      }
      return this.append({
        ...cur,
        version: cur.version + 1,
        evidenceState: 'STALE',
        freshnessState: 'STALE',
        now: now ?? new Date().toISOString(),
        createdAt: now ?? new Date().toISOString(),
        contradictions: cur.contradictions,
        runtimeFreshUntil: '1970-01-01T00:00:00.000Z',
      });
    },

    recordContradiction(input) {
      const left = latest(input.leftEvidenceId);
      const right = latest(input.rightEvidenceId);
      if (!left || !right) {
        return { ok: false, denied: true, reason: 'EVIDENCE_NOT_FOUND', disposition: 'DENIED' };
      }
      if (
        left.tenantId !== input.scope.tenantId ||
        right.tenantId !== input.scope.tenantId
      ) {
        return { ok: false, denied: true, reason: 'CROSS_TENANT_DENIED', disposition: 'DENIED' };
      }
      if (
        left.universeId !== input.scope.universeId ||
        right.universeId !== input.scope.universeId
      ) {
        return { ok: false, denied: true, reason: 'CROSS_UNIVERSE_DENIED', disposition: 'DENIED' };
      }

      const contradiction = contradictions.record({
        tenantId: input.scope.tenantId,
        universeId: input.scope.universeId,
        leftEvidenceId: input.leftEvidenceId,
        rightEvidenceId: input.rightEvidenceId,
        topic: input.topic,
        summary: input.summary,
        createdAt: input.createdAt,
      });
      measuredEdgeCount += 1;

      // Mark both as CONTRADICTED via append (no silent rewrite).
      for (const item of [left, right]) {
        this.append({
          ...item,
          version: item.version + 1,
          evidenceState: 'CONTRADICTED',
          contradictions: [...item.contradictions, contradiction.contradictionId],
          now: input.createdAt ?? new Date().toISOString(),
          createdAt: input.createdAt ?? new Date().toISOString(),
        });
      }

      return { ok: true, contradiction };
    },

    applyReview(evidenceId, scope, input) {
      const cur = latest(evidenceId);
      if (!cur) {
        return { ok: false, denied: true, reason: 'EVIDENCE_NOT_FOUND', disposition: 'DENIED' };
      }
      if (cur.tenantId !== scope.tenantId) {
        return { ok: false, denied: true, reason: 'CROSS_TENANT_DENIED', disposition: 'DENIED' };
      }
      if (cur.universeId !== scope.universeId) {
        return { ok: false, denied: true, reason: 'CROSS_UNIVERSE_DENIED', disposition: 'DENIED' };
      }

      const submitted = review.submit({ ...input, evidenceId, tenantId: scope.tenantId, universeId: scope.universeId });
      if (!submitted.ok) return submitted;

      let nextState: EvidenceState = cur.evidenceState;
      if (submitted.nextReviewState === 'REJECTED' || submitted.nextReviewState === 'QUARANTINED') {
        nextState = 'REJECTED';
      } else if (submitted.nextReviewState === 'APPROVED') {
        if (cur.evidenceState === 'UNVERIFIED') nextState = 'SUPPORTED';
      }

      return this.append({
        ...cur,
        version: cur.version + 1,
        reviewState: submitted.nextReviewState,
        evidenceState: nextState,
        syncDisposition:
          submitted.nextReviewState === 'QUARANTINED'
            ? 'QUARANTINED'
            : cur.syncDisposition === 'LOCAL_PENDING_REVIEW'
              ? 'LOCAL_ONLY'
              : cur.syncDisposition,
        now: input.createdAt ?? new Date().toISOString(),
        createdAt: input.createdAt ?? new Date().toISOString(),
        contradictions: cur.contradictions,
      });
    },

    query(scope, filter) {
      return queryEvidence(allLatest(), scope, filter);
    },

    get(evidenceId, scope) {
      return getEvidenceById(allLatest(), evidenceId, scope);
    },

    evaluateClaimGate(claim, evidenceId, scope) {
      const got = getEvidenceById(allLatest(), evidenceId, scope);
      if (!got.ok) {
        return {
          claim,
          allowed: false,
          reason: got.reason,
          requirements: [],
        };
      }
      const item = got.item;

      if (claim === 'PHYSICAL_QPU_VERIFIED') {
        const requirements = [
          'classification=PHYSICAL_QPU_VERIFIED',
          'EX6 receiptId present',
          'not historicalOnly',
          'not SIMULATED_QUANTUM',
          'integrity valid',
          'not REVOKED/REJECTED',
        ] as const;
        const integrity = verifyIntegrityHash(item);
        const allowed =
          item.classification === 'PHYSICAL_QPU_VERIFIED' &&
          item.evidenceType === 'PHYSICAL_QPU_RECEIPT' &&
          !!item.receiptId &&
          !item.historicalOnly &&
          integrity.valid &&
          item.evidenceState !== 'REVOKED' &&
          item.evidenceState !== 'REJECTED';
        return {
          claim,
          allowed,
          reason: allowed
            ? 'PHYSICAL_QPU_VERIFIED_GATE_PASSED'
            : 'PHYSICAL_QPU_VERIFIED_REQUIRES_EX6_RECEIPT_AND_CLASSIFICATION',
          requirements,
        };
      }

      // QUANTUM_ADVANTAGE_VERIFIED: physical + baseline + EX10 + repeatability + review
      const requirements = [
        'PHYSICAL_QPU_VERIFIED gate',
        'linked classical baseline (benchmarkId)',
        'EX10 comparability (comparisonId)',
        'reproducibility REPRODUCED with repeatCount>=2',
        'review APPROVED',
      ] as const;
      const physical = this.evaluateClaimGate('PHYSICAL_QPU_VERIFIED', evidenceId, scope);
      const allowed =
        physical.allowed &&
        !!item.benchmarkId &&
        !!item.comparisonId &&
        item.reproducibility.state === 'REPRODUCED' &&
        item.reproducibility.repeatCount >= 2 &&
        item.reviewState === 'APPROVED';
      return {
        claim,
        allowed,
        reason: allowed
          ? 'QUANTUM_ADVANTAGE_VERIFIED_GATE_PASSED'
          : 'QUANTUM_ADVANTAGE_VERIFIED_REQUIRES_PHYSICAL_BASELINE_EX10_REPEATABILITY_REVIEW',
        requirements,
      };
    },

    applyLearningLesson(input) {
      const forbidden: LearningForbiddenTarget[] = [
        'PERMISSIONS',
        'GUARDIAN',
        'RLS',
        'TENANT',
        'UNIVERSE',
        'BILLING',
        'PRODUCTION',
      ];
      if ((forbidden as string[]).includes(input.target)) {
        return {
          ok: false,
          denied: true,
          reason: `LEARNING_TARGET_FORBIDDEN_${input.target}`,
          disposition: 'DENIED',
        };
      }

      const got = getEvidenceById(allLatest(), input.evidenceId, input.scope);
      if (!got.ok) return got;

      const item = got.item;
      if (item.evidenceState === 'REJECTED' || item.reviewState === 'REJECTED') {
        return {
          ok: false,
          denied: true,
          reason: 'REJECTED_CANNOT_STRENGTHEN_NEURAL_PATHWAY',
          disposition: 'DENIED',
        };
      }
      if (item.evidenceState === 'REVOKED') {
        return {
          ok: false,
          denied: true,
          reason: 'REVOKED_EXCLUDED_FROM_ACTIVE_ROUTING',
          disposition: 'DENIED',
        };
      }

      const routingOk =
        (item.evidenceState === 'VERIFIED' || item.evidenceState === 'REPRODUCIBLE') &&
        item.reproducibility.state === 'REPRODUCED' &&
        isActiveRoutingCandidate(item);

      if (!routingOk && (item.evidenceState === 'VERIFIED' || item.evidenceState === 'REPRODUCIBLE')) {
        // Verified but not reproducible yet — still allow research priority only.
        if (input.target !== 'RESEARCH_PRIORITY' && input.target !== 'RETEST_PRIORITY') {
          return {
            ok: false,
            denied: true,
            reason: 'REPRODUCIBLE_VERIFIED_REQUIRED_FOR_ROUTING_CANDIDATE',
            disposition: 'DENIED',
          };
        }
      } else if (!routingOk) {
        return {
          ok: false,
          denied: true,
          reason: 'NOT_ROUTING_CANDIDATE',
          disposition: 'DENIED',
        };
      }

      const lesson: NeuralPathwayLesson = {
        lessonId: `lesson-${createHash('sha256')
          .update([input.evidenceId, input.target, input.now ?? ''].join('|'))
          .digest('hex')
          .slice(0, 16)}`,
        evidenceId: input.evidenceId,
        tenantId: input.scope.tenantId,
        universeId: input.scope.universeId,
        target: input.target as LearningAllowedTarget,
        priorityDelta: input.priorityDelta,
        createdAt: input.now ?? new Date().toISOString(),
        allowed: true,
      };
      lessons.push(lesson);
      return { ok: true, lesson };
    },

    syncOnReconnect(scope, now) {
      const ts = now ?? new Date().toISOString();
      let revokedFirst = 0;
      let deduped = 0;
      let contradictionsChecked = 0;
      let hashFailures = 0;
      let pendingReview = 0;

      const items = allLatest().filter(
        (i) => i.tenantId === scope.tenantId && i.universeId === scope.universeId,
      );

      // 1) Revoke-first: any previously revoked stays revoked; pending with hash fail → revoke.
      for (const item of items) {
        const integrity = verifyIntegrityHash(item);
        if (!integrity.valid) {
          hashFailures += 1;
          this.revoke(item.evidenceId, scope, 'HASH_VERIFY_FAILED_ON_RECONNECT', ts);
          revokedFirst += 1;
          continue;
        }
        if (item.evidenceState === 'REVOKED') {
          revokedFirst += 1;
        }
      }

      // 2) Dedupe by integrityHash among non-revoked.
      const seenHash = new Map<string, string>();
      for (const item of allLatest().filter(
        (i) => i.tenantId === scope.tenantId && i.universeId === scope.universeId,
      )) {
        if (item.evidenceState === 'REVOKED') continue;
        const prev = seenHash.get(item.integrityHash);
        if (prev && prev !== item.evidenceId) {
          deduped += 1;
          // Keep earlier; mark later as superseded pending review — no LWW promote.
          this.append({
            ...item,
            version: item.version + 1,
            reviewState: 'LOCAL_PENDING_REVIEW',
            syncDisposition: 'LOCAL_PENDING_REVIEW',
            supersedesEvidenceId: null,
            parentEvidenceId: prev,
            limitations: [...item.limitations, 'DEDUPE_ON_RECONNECT_NO_AUTO_PROMOTE'],
            now: ts,
            createdAt: ts,
            contradictions: item.contradictions,
          });
        } else {
          seenHash.set(item.integrityHash, item.evidenceId);
        }
      }

      // 3) Contradictions remain first-class.
      contradictionsChecked = contradictions.list(scope).length;

      // 4) Offline locals stay LOCAL_PENDING_REVIEW — never auto global promote.
      for (const item of allLatest().filter(
        (i) => i.tenantId === scope.tenantId && i.universeId === scope.universeId,
      )) {
        if (
          item.syncDisposition === 'LOCAL_PENDING_REVIEW' ||
          item.reviewState === 'LOCAL_PENDING_REVIEW'
        ) {
          pendingReview += 1;
        }
      }

      return {
        revokedFirst,
        deduped,
        contradictionsChecked,
        hashFailures,
        pendingReview,
        autoGlobalPromoted: false,
      };
    },

    compress(scope, evidenceIds, now) {
      const items: QuantumEvidenceItem[] = [];
      for (const id of evidenceIds) {
        const got = getEvidenceById(allLatest(), id, scope);
        if (!got.ok) return got;
        items.push(got.item);
      }
      const createdAt = now ?? new Date().toISOString();
      const integrityHash = createHash('sha256')
        .update(
          JSON.stringify({
            tenantId: scope.tenantId,
            universeId: scope.universeId,
            evidenceIds: items.map((i) => i.evidenceId),
            hashes: items.map((i) => i.integrityHash),
            createdAt,
          }),
        )
        .digest('hex');
      const bundle: CompressedEvidenceBundle = {
        bundleId: `bundle-${integrityHash.slice(0, 20)}`,
        tenantId: scope.tenantId,
        universeId: scope.universeId,
        evidenceIds: items.map((i) => i.evidenceId),
        provenancePreserved: true,
        integrityHash,
        createdAt,
      };
      return { ok: true, bundle };
    },

    scaleCounters() {
      const measuredEvidenceCount = allLatest().length;
      return {
        measuredNodeCount: measuredEvidenceCount,
        measuredEdgeCount,
        measuredEvidenceCount,
        engineeringScaleTargetNodes: null,
        engineeringScaleTargetEdges: null,
        trillionClaimAllowed: false,
      };
    },

    listAllRawForTests() {
      return allLatest();
    },
  };

  return ledger;
}

/** Helper: classical evidence stays CLASSICAL. */
export function assertClassicalStaysClassical(item: QuantumEvidenceItem): boolean {
  return item.evidenceType === 'CLASSICAL_BASELINE' && item.classification === 'CLASSICAL';
}

/** Helper: QI stays QUANTUM_INSPIRED. */
export function assertQiStaysQi(item: QuantumEvidenceItem): boolean {
  return (
    item.evidenceType === 'QUANTUM_INSPIRED_EXPERIMENT' &&
    item.classification === 'QUANTUM_INSPIRED'
  );
}

/** Helper: simulator stays SIMULATED_QUANTUM. */
export function assertSimulatorStaysSimulated(item: QuantumEvidenceItem): boolean {
  return (
    item.evidenceType === 'SIMULATED_QUANTUM_RUN' &&
    item.classification === 'SIMULATED_QUANTUM'
  );
}

export function simulatorCanBecomePhysicalVerified(): false {
  return false;
}
