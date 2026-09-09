/**
 * 62L-EX18 — Quantum Research Wormhole Router.
 * Security gate first. Cache hit NEVER bypasses authorization.
 */

import { compareFingerprints, compareInputHashes } from './fingerprint.ts';
import { evaluateFreshness, highwayAfterFreshness } from './freshness.ts';
import {
  denyIfQuarantined,
  quarantineOnIntegrityMismatch,
} from './quarantine.ts';
import {
  emitWormholeReceipt,
  type BenefitMeasurement,
  type WormholeReceipt,
} from './receipt.ts';
import {
  findCompatibleWormholes,
  getWormhole,
  updateWormhole,
} from './registry.ts';
import {
  EX18_LOCKS,
  ex18Deny,
  type Ex18Denial,
  type QuantumTruthLabel,
  type RouteDisposition,
  type ScaleTelemetry,
  type WormholeLookupRequest,
  type WormholeLookupResult,
  type WormholeType,
  type XivWormholeRoute,
} from './types.ts';

export type RouterState = {
  telemetry: ScaleTelemetry;
};

export function createRouterState(): RouterState {
  return {
    telemetry: {
      measuredOnly: true,
      fabricated: false,
      hits: 0,
      misses: 0,
      denials: 0,
      quarantines: 0,
      regressions: 0,
      benefitVerified: 0,
    },
  };
}

function result(partial: Omit<WormholeLookupResult, 'authChecksPerformed' | 'guardianBypassed'>): WormholeLookupResult {
  return {
    ...partial,
    authChecksPerformed: true,
    guardianBypassed: false,
  };
}

function securityGate(req: WormholeLookupRequest): Ex18Denial | null {
  if (
    req.attemptBypassGuardian ||
    !req.auth.guardianApproved ||
    EX18_LOCKS.SKIP_GUARDIAN_CHECKS === true ||
    EX18_LOCKS.CACHE_HIT_BYPASSES_AUTHORIZATION === true ||
    EX18_LOCKS.SECURITY_SHORTCUT_ALLOWED === true
  ) {
    return ex18Deny(
      'Unauthorized shortcut DENIED — cache hit never bypasses Guardian/authorization.',
    );
  }
  if (!req.auth.authorized || !req.auth.userId) {
    return ex18Deny('Policy gate DENIED — actor not authorized.');
  }
  if (
    req.attemptCrossTenant ||
    EX18_LOCKS.CROSS_TENANT_PRIVATE_REUSE === true
  ) {
    return ex18Deny('Cross-tenant private wormhole reuse DENIED.');
  }
  if (
    req.attemptCrossUniverse ||
    EX18_LOCKS.CROSS_UNIVERSE_PRIVATE_REUSE === true
  ) {
    return ex18Deny('Cross-Universe private wormhole reuse DENIED.');
  }
  if (req.attemptSkipRoot || EX18_LOCKS.ROOT_BYPASS === true) {
    return ex18Deny('Roots never bypassed — ROOT_BYPASS DENIED.');
  }
  if (
    req.attemptRunUntrustedArtifact ||
    EX18_LOCKS.RUN_UNTRUSTED_COMPILED_ARTIFACT === true
  ) {
    return ex18Deny(
      'Compiled artifact cache — never run untrusted executables just because they exist.',
    );
  }
  if (
    req.attemptLanPropagate ||
    EX18_LOCKS.ARBITRARY_LAN_PROPAGATION === true
  ) {
    return ex18Deny('No arbitrary LAN propagation of wormholes.');
  }
  if (
    req.plasticityAttemptAlterPermissions ||
    EX18_LOCKS.PLASTICITY_ALTERS_PERMISSIONS === true
  ) {
    return ex18Deny(
      'Learning/plasticity cannot alter permissions/Guardian/RLS/authority.',
    );
  }
  return null;
}

function offlineGate(req: WormholeLookupRequest): WormholeLookupResult | null {
  if (req.offline && req.requiresLiveWeb) {
    return result({
      disposition: 'WAITING_DATA',
      route: null,
      reason: 'Offline + live-web dependency → WAITING_DATA (not FAIL).',
      evidenceRefs: ['evidence:waiting-data:live-web'],
      quantumTruthLabel: null,
      benefitState: 'NOT_TESTED',
      waitingKind: 'WAITING_DATA',
      fallback: 'NONE',
    });
  }
  if (req.offline && req.requiresProvider) {
    return result({
      disposition: 'WAITING_PROVIDER',
      route: null,
      reason: 'Offline + provider dependency → WAITING_PROVIDER (not FAIL).',
      evidenceRefs: ['evidence:waiting-provider'],
      quantumTruthLabel: null,
      benefitState: 'NOT_TESTED',
      waitingKind: 'WAITING_PROVIDER',
      fallback: 'NONE',
    });
  }
  return null;
}

/**
 * Primary lookup. Order: security → offline → quarantine → fingerprint →
 * freshness/evidence → eligibility.
 */
export function lookupWormhole(
  state: RouterState,
  req: WormholeLookupRequest,
  opts?: { wormholeId?: string; providedIntegrityHash?: string },
): WormholeLookupResult {
  const denied = securityGate(req);
  if (denied) {
    state.telemetry.denials += 1;
    return result({
      disposition: 'DENIED',
      route: null,
      reason: denied.reason,
      evidenceRefs: [`evidence:denied:${denied.reason.slice(0, 48)}`],
      quantumTruthLabel: null,
      benefitState: 'NOT_TESTED',
      waitingKind: null,
      fallback: 'NONE',
    });
  }

  const offline = offlineGate(req);
  if (offline) return offline;

  if (req.hardwareAvailable === false) {
    state.telemetry.misses += 1;
    return result({
      disposition: 'FALLBACK_NORMAL',
      route: null,
      reason: 'Hardware unavailable → fallback normally (NORMAL_PATH).',
      evidenceRefs: ['evidence:hardware-unavailable-fallback'],
      quantumTruthLabel: null,
      benefitState: 'NOT_TESTED',
      waitingKind: null,
      fallback: 'NORMAL_PATH',
    });
  }

  let candidates: XivWormholeRoute[] = [];
  if (opts?.wormholeId) {
    const one = getWormhole(opts.wormholeId);
    if (one) candidates = [one];
  } else {
    candidates = findCompatibleWormholes({
      tenantId: req.auth.tenantId,
      universeId: req.auth.universeId,
      wormholeType: req.wormholeType,
      workloadFingerprint: req.workloadFingerprint,
      inputHash: req.inputHash,
    });
  }

  // Tenant / Universe isolation even if wormholeId forced.
  candidates = candidates.filter((c) => {
    if (c.tenantId !== req.auth.tenantId) return false;
    if (c.universeId !== req.auth.universeId) return false;
    return true;
  });

  if (candidates.length === 0) {
    // Check if any route exists with different fingerprint under same type/scope
    // for clearer NO_DIRECT_REUSE vs miss — handled by caller registering first.
    state.telemetry.misses += 1;
    return result({
      disposition: 'NORMAL_PATH_REQUIRED',
      route: null,
      reason: 'No compatible wormhole → NORMAL_PATH_REQUIRED.',
      evidenceRefs: [],
      quantumTruthLabel: null,
      benefitState: 'NOT_TESTED',
      waitingKind: null,
      fallback: 'NORMAL_PATH',
    });
  }

  const route = candidates[0]!;

  // Cross-tenant/universe explicit deny if mismatch somehow present
  if (route.tenantId !== req.auth.tenantId) {
    state.telemetry.denials += 1;
    return result({
      disposition: 'DENIED',
      route: null,
      reason: 'Cross-tenant DENIED — no private embeddings/docs/results reuse.',
      evidenceRefs: ['evidence:cross-tenant-denied'],
      quantumTruthLabel: null,
      benefitState: 'NOT_TESTED',
      waitingKind: null,
      fallback: 'NONE',
    });
  }
  if (route.universeId !== req.auth.universeId) {
    state.telemetry.denials += 1;
    return result({
      disposition: 'DENIED',
      route: null,
      reason: 'Cross-Universe DENIED — isolation intact.',
      evidenceRefs: ['evidence:cross-universe-denied'],
      quantumTruthLabel: null,
      benefitState: 'NOT_TESTED',
      waitingKind: null,
      fallback: 'NONE',
    });
  }

  const q = denyIfQuarantined(route.wormholeId);
  if (q) {
    state.telemetry.quarantines += 1;
    return result({
      disposition: 'QUARANTINED',
      route: null,
      reason: q.reason,
      evidenceRefs: [`evidence:quarantine:${route.wormholeId}`],
      quantumTruthLabel: null,
      benefitState: 'NOT_TESTED',
      waitingKind: null,
      fallback: 'NORMAL_PATH',
    });
  }

  if (opts?.providedIntegrityHash) {
    const qRec = quarantineOnIntegrityMismatch({
      route,
      expectedHash: route.integrityHash,
      actualHash: opts.providedIntegrityHash,
      atIso: req.nowIso,
    });
    if (qRec) {
      state.telemetry.quarantines += 1;
      updateWormhole(route.wormholeId, {
        freshness: 'INVALID',
        quarantineReason: qRec.reason,
        highwayState: 'DEGRADED',
        updatedAtIso: req.nowIso,
      });
      return result({
        disposition: 'QUARANTINED',
        route: null,
        reason: qRec.reason,
        evidenceRefs: [`evidence:integrity-quarantine:${route.wormholeId}`],
        quantumTruthLabel: null,
        benefitState: 'NOT_TESTED',
        waitingKind: null,
        fallback: 'NORMAL_PATH',
      });
    }
  }

  const fp = compareFingerprints(route.workloadFingerprint, req.workloadFingerprint);
  if (!fp.compatible) {
    state.telemetry.misses += 1;
    return result({
      disposition: 'NO_DIRECT_REUSE',
      route: null,
      reason: fp.reason,
      evidenceRefs: [],
      quantumTruthLabel: route.quantumTruthLabel,
      benefitState: 'NOT_TESTED',
      waitingKind: null,
      fallback: 'NORMAL_PATH',
    });
  }

  const ih = compareInputHashes(route.inputHash, req.inputHash);
  if (!ih.compatible) {
    state.telemetry.misses += 1;
    return result({
      disposition: 'NORMAL_PATH_REQUIRED',
      route: null,
      reason: ih.reason,
      evidenceRefs: [],
      quantumTruthLabel: route.quantumTruthLabel,
      benefitState: 'NOT_TESTED',
      waitingKind: null,
      fallback: 'NORMAL_PATH',
    });
  }

  // Failure wormholes
  if (route.failureHint === 'AVOID_ROUTE_HINT' || route.retestRequired) {
    return result({
      disposition: route.retestRequired ? 'RETEST_REQUIRED' : 'AVOID_ROUTE_HINT',
      route,
      reason: route.retestRequired
        ? 'Failure wormhole → RETEST_REQUIRED after updates.'
        : 'Failure wormhole → AVOID_ROUTE_HINT.',
      evidenceRefs: [...route.evidenceRefs, `evidence:failure-hint:${route.wormholeId}`],
      quantumTruthLabel: route.quantumTruthLabel,
      benefitState: route.benefitState,
      waitingKind: null,
      fallback: 'NORMAL_PATH',
    });
  }

  // Warm model session — always re-check authorization (already passed securityGate)
  if (route.wormholeType === 'WARM_MODEL_SESSION') {
    if (!req.auth.authorized || !req.auth.guardianApproved) {
      state.telemetry.denials += 1;
      return result({
        disposition: 'DENIED',
        route: null,
        reason: 'Warm-model session requires authorization re-check; no stale privilege inheritance.',
        evidenceRefs: [`evidence:warm-session-recheck:${route.wormholeId}`],
        quantumTruthLabel: route.quantumTruthLabel,
        benefitState: 'NOT_TESTED',
        waitingKind: null,
        fallback: 'NONE',
      });
    }
  }

  // Compiled artifacts must be trusted
  if (
    (route.wormholeType === 'COMPILED_MODEL' ||
      route.wormholeType === 'COMPILED_CIRCUIT') &&
    !route.compiledArtifactTrusted
  ) {
    state.telemetry.denials += 1;
    return result({
      disposition: 'DENIED',
      route: null,
      reason: 'Untrusted compiled artifact — will not execute merely because it exists.',
      evidenceRefs: [`evidence:untrusted-artifact:${route.wormholeId}`],
      quantumTruthLabel: route.quantumTruthLabel,
      benefitState: 'NOT_TESTED',
      waitingKind: null,
      fallback: 'NORMAL_PATH',
    });
  }

  // INDEXED_ROUTE_SHORTCUT still passes policy/resource/heartbeat
  if (
    route.wormholeType === 'ROUTE_CACHE' &&
    EX18_LOCKS.INDEXED_ROUTE_SKIP_POLICY_RESOURCE_HEARTBEAT === true
  ) {
    return result({
      disposition: 'DENIED',
      route: null,
      reason: 'INDEXED_ROUTE_SHORTCUT must still pass policy/resource/heartbeat.',
      evidenceRefs: [],
      quantumTruthLabel: null,
      benefitState: 'NOT_TESTED',
      waitingKind: null,
      fallback: 'NORMAL_PATH',
    });
  }

  // Roots never bypassed — presence of rootRefs required for eligible
  if (!route.rootRefs.length) {
    return result({
      disposition: 'DENIED',
      route: null,
      reason: 'Roots missing — roots never bypassed.',
      evidenceRefs: [],
      quantumTruthLabel: null,
      benefitState: 'NOT_TESTED',
      waitingKind: null,
      fallback: 'NORMAL_PATH',
    });
  }

  const fresh = evaluateFreshness({
    registeredFreshness: route.freshness,
    ttlExpiryIso: route.ttlExpiryIso,
    nowIso: req.nowIso,
    sourceRevoked: route.freshness === 'REVOKED',
    integrityValid: true,
  });

  if (!fresh.eligibleForShortcutPreference) {
    state.telemetry.misses += 1;
    const disposition: RouteDisposition =
      fresh.freshness === 'REVOKED'
        ? 'NORMAL_PATH_REQUIRED'
        : fresh.freshness === 'INVALID'
          ? 'QUARANTINED'
          : 'NORMAL_PATH_REQUIRED';
    return result({
      disposition,
      route,
      reason: fresh.reason,
      evidenceRefs: [...route.evidenceRefs, `evidence:freshness:${fresh.freshness}`],
      quantumTruthLabel: labelForRoute(route),
      benefitState: route.benefitState,
      waitingKind: null,
      fallback: 'NORMAL_PATH',
    });
  }

  // Simulation cache remains SIMULATED_QUANTUM
  const quantumTruthLabel = labelForRoute(route);

  // Historical QPU receipt cannot verify new physical run
  if (
    route.historicalQpuOnly ||
    route.quantumTruthLabel === 'PHYSICAL_QPU_HISTORICAL'
  ) {
    // Eligible as historical shortcut seed only — label stays historical
    if (quantumTruthLabel === 'PHYSICAL_QPU_VERIFIED') {
      return result({
        disposition: 'DENIED',
        route: null,
        reason: 'Invariant: historical QPU cannot become PHYSICAL_QPU_VERIFIED.',
        evidenceRefs: [],
        quantumTruthLabel: 'PHYSICAL_QPU_HISTORICAL',
        benefitState: 'NOT_TESTED',
        waitingKind: null,
        fallback: 'NORMAL_PATH',
      });
    }
  }

  // Algorithm warm start is STARTING_HINT
  if (route.wormholeType === 'ALGORITHM_WARM_START') {
    if (EX18_LOCKS.ALGORITHM_WARM_START_EQ_OPTIMAL === true) {
      return result({
        disposition: 'DENIED',
        route: null,
        reason: 'Algorithm warm start must remain STARTING_HINT not optimal.',
        evidenceRefs: [],
        quantumTruthLabel,
        benefitState: 'NOT_TESTED',
        waitingKind: null,
        fallback: 'NORMAL_PATH',
      });
    }
  }

  // Device enrollment gate
  if (route.deviceEnrollment) {
    const d = route.deviceEnrollment;
    if (!d.enrolled || !d.rightsGranted) {
      return result({
        disposition: 'DENIED',
        route: null,
        reason: 'Multi-device wormhole requires platform/arch/runtime rights + enrollment.',
        evidenceRefs: [`evidence:device-enrollment:${d.deviceId}`],
        quantumTruthLabel,
        benefitState: 'NOT_TESTED',
        waitingKind: null,
        fallback: 'NORMAL_PATH',
      });
    }
  }

  const highway = highwayAfterFreshness(route.highwayState, fresh.freshness);
  updateWormhole(route.wormholeId, {
    freshness: fresh.freshness,
    highwayState: highway,
    updatedAtIso: req.nowIso,
  });

  state.telemetry.hits += 1;
  return result({
    disposition: 'WORMHOLE_ELIGIBLE',
    route: { ...route, freshness: fresh.freshness, highwayState: highway },
    reason: 'Safe cache hit after auth + freshness/evidence → WORMHOLE_ELIGIBLE.',
    evidenceRefs: route.evidenceRefs,
    quantumTruthLabel,
    benefitState: route.benefitState,
    waitingKind: null,
    fallback: 'NONE',
  });
}

function labelForRoute(route: XivWormholeRoute): QuantumTruthLabel {
  if (route.wormholeType === 'SIMULATION_RESULT_CACHE') {
    return 'SIMULATED_QUANTUM';
  }
  if (route.historicalQpuOnly) return 'PHYSICAL_QPU_HISTORICAL';
  return route.quantumTruthLabel;
}

/** Previous QPU receipt cannot verify a new PHYSICAL_QPU run. */
export function physicalQpuVerificationFromHistorical(
  historical: XivWormholeRoute,
): { verified: false; label: 'PHYSICAL_QPU_HISTORICAL'; needsNewEvidence: true } {
  void historical;
  return {
    verified: false,
    label: 'PHYSICAL_QPU_HISTORICAL',
    needsNewEvidence: true,
  };
}

export function completeWithReceipt(
  state: RouterState,
  lookup: WormholeLookupResult,
  req: WormholeLookupRequest,
  measurement?: BenefitMeasurement,
  failureEvidenceCreated?: boolean,
): { lookup: WormholeLookupResult; receipt: WormholeReceipt } {
  const pathUsed = lookup.disposition === 'WORMHOLE_ELIGIBLE' ? 'WORMHOLE' : 'NORMAL';
  const receipt = emitWormholeReceipt({
    route: lookup.route,
    tenantId: req.auth.tenantId,
    universeId: req.auth.universeId,
    disposition: lookup.disposition,
    wormholeType: req.wormholeType,
    pathUsed,
    freshnessOk: lookup.disposition === 'WORMHOLE_ELIGIBLE',
    quantumTruthLabel: lookup.quantumTruthLabel,
    measurement,
    failureEvidenceCreated,
    evidenceRefs: lookup.evidenceRefs,
    atIso: req.nowIso,
  });
  if (receipt.benefitState === 'REGRESSION') state.telemetry.regressions += 1;
  if (receipt.benefitState === 'BENEFIT_VERIFIED') state.telemetry.benefitVerified += 1;
  return { lookup, receipt };
}

/** Record failed shortcut as evidence + avoid hint. */
export function recordShortcutFailure(
  state: RouterState,
  route: XivWormholeRoute,
  nowIso: string,
  reason: string,
): WormholeReceipt {
  updateWormhole(route.wormholeId, {
    failureHint: 'AVOID_ROUTE_HINT',
    retestRequired: true,
    highwayState: 'DEGRADED',
    evidenceRefs: [...route.evidenceRefs, `evidence:shortcut-failure:${route.wormholeId}`],
    updatedAtIso: nowIso,
  });
  state.telemetry.misses += 1;
  return emitWormholeReceipt({
    route: getWormhole(route.wormholeId),
    tenantId: route.tenantId,
    universeId: route.universeId,
    disposition: 'AVOID_ROUTE_HINT',
    wormholeType: route.wormholeType,
    pathUsed: 'NORMAL',
    freshnessOk: false,
    quantumTruthLabel: route.quantumTruthLabel,
    failureEvidenceCreated: true,
    evidenceRefs: [`evidence:shortcut-failure:${reason}`],
    atIso: nowIso,
  });
}

export function scaleTelemetryMeasuredOnly(state: RouterState): boolean {
  return state.telemetry.measuredOnly === true && state.telemetry.fabricated === false;
}

export function localPreferredWhenMeetsRequirements(): true {
  return EX18_LOCKS.CLOUD_AUTO_BETTER_THAN_LOCAL === false
    ? true
    : (false as never);
}

export type { WormholeType };
