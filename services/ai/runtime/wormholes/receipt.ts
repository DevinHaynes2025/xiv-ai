/**
 * 62L-EX18 — WormholeReceipt feedback loop + benefit verification.
 * BENEFIT_VERIFIED requires measured evidence only.
 */

import { createHash } from 'node:crypto';
import { updateWormhole } from './registry.ts';
import {
  EX18_LOCKS,
  type BenefitState,
  type QuantumTruthLabel,
  type RouteDisposition,
  type WormholeType,
  type XivWormholeRoute,
} from './types.ts';

export type WormholeReceipt = {
  receiptId: string;
  wormholeId: string | null;
  tenantId: string;
  universeId: string;
  disposition: RouteDisposition;
  wormholeType: WormholeType | null;
  pathUsed: 'WORMHOLE' | 'NORMAL';
  authChecksPerformed: true;
  guardianBypassed: false;
  freshnessOk: boolean;
  quantumTruthLabel: QuantumTruthLabel | null;
  benefitState: BenefitState;
  benefitMeasured: boolean;
  latencySavedMs: number | null;
  confidenceAfter: number;
  evidenceRefs: readonly string[];
  failureEvidenceCreated: boolean;
  returnedToHomeBase: true;
  plasticityAlteredPermissions: false;
  atIso: string;
};

export type BenefitMeasurement = {
  measured: boolean;
  baselineLatencyMs: number | null;
  shortcutLatencyMs: number | null;
  regressionDetected: boolean;
  comparable: boolean;
};

export function createReceiptId(parts: string): string {
  return createHash('sha256').update(`receipt:${parts}`).digest('hex').slice(0, 24);
}

export function verifyBenefit(measurement: BenefitMeasurement): BenefitState {
  if (EX18_LOCKS.BENEFIT_VERIFIED_WITHOUT_MEASUREMENT === true) {
    return 'NOT_TESTED';
  }
  if (!measurement.measured) return 'NOT_TESTED';
  if (!measurement.comparable) return 'NOT_COMPARABLE';
  if (measurement.regressionDetected) return 'REGRESSION';
  if (
    measurement.baselineLatencyMs == null ||
    measurement.shortcutLatencyMs == null
  ) {
    return 'NOT_COMPARABLE';
  }
  if (measurement.shortcutLatencyMs < measurement.baselineLatencyMs) {
    return 'BENEFIT_VERIFIED';
  }
  if (measurement.shortcutLatencyMs === measurement.baselineLatencyMs) {
    return 'NO_MEASURABLE_BENEFIT';
  }
  return 'REGRESSION';
}

export function claimBenefitVerifiedWithoutMeasurement(): never | BenefitState {
  if (EX18_LOCKS.BENEFIT_VERIFIED_WITHOUT_MEASUREMENT) {
    return 'BENEFIT_VERIFIED';
  }
  return 'NOT_TESTED';
}

export function emitWormholeReceipt(input: {
  route: XivWormholeRoute | null;
  tenantId: string;
  universeId: string;
  disposition: RouteDisposition;
  wormholeType: WormholeType | null;
  pathUsed: 'WORMHOLE' | 'NORMAL';
  freshnessOk: boolean;
  quantumTruthLabel: QuantumTruthLabel | null;
  measurement?: BenefitMeasurement;
  failureEvidenceCreated?: boolean;
  evidenceRefs?: readonly string[];
  atIso: string;
}): WormholeReceipt {
  const benefitState = input.measurement
    ? verifyBenefit(input.measurement)
    : input.route?.benefitState ?? 'NOT_TESTED';
  const benefitMeasured = input.measurement?.measured ?? false;

  let confidenceAfter = input.route?.confidence ?? 0.5;
  if (benefitState === 'REGRESSION' && input.route) {
    confidenceAfter = Math.max(0, confidenceAfter - 0.25);
    updateWormhole(input.route.wormholeId, {
      confidence: confidenceAfter,
      benefitState: 'REGRESSION',
      benefitMeasured: true,
      highwayState: 'DEGRADED',
      updatedAtIso: input.atIso,
      evidenceRefs: [
        ...(input.route.evidenceRefs ?? []),
        ...(input.evidenceRefs ?? []),
        `evidence:regression:${input.route.wormholeId}`,
      ],
    });
  } else if (benefitState === 'BENEFIT_VERIFIED' && input.route && benefitMeasured) {
    updateWormhole(input.route.wormholeId, {
      benefitState: 'BENEFIT_VERIFIED',
      benefitMeasured: true,
      latencySavedMs:
        input.measurement?.baselineLatencyMs != null &&
        input.measurement?.shortcutLatencyMs != null
          ? input.measurement.baselineLatencyMs - input.measurement.shortcutLatencyMs
          : input.route.latencySavedMs,
      highwayState: input.route.highwayState === 'CANDIDATE' ? 'MEASURED' : input.route.highwayState,
      updatedAtIso: input.atIso,
    });
  }

  const receipt: WormholeReceipt = {
    receiptId: createReceiptId(
      `${input.tenantId}|${input.universeId}|${input.disposition}|${input.atIso}`,
    ),
    wormholeId: input.route?.wormholeId ?? null,
    tenantId: input.tenantId,
    universeId: input.universeId,
    disposition: input.disposition,
    wormholeType: input.wormholeType,
    pathUsed: input.pathUsed,
    authChecksPerformed: true,
    guardianBypassed: false,
    freshnessOk: input.freshnessOk,
    quantumTruthLabel: input.quantumTruthLabel,
    benefitState,
    benefitMeasured,
    latencySavedMs:
      benefitMeasured &&
      input.measurement?.baselineLatencyMs != null &&
      input.measurement?.shortcutLatencyMs != null
        ? input.measurement.baselineLatencyMs - input.measurement.shortcutLatencyMs
        : null,
    confidenceAfter,
    evidenceRefs: [
      ...(input.route?.evidenceRefs ?? []),
      ...(input.evidenceRefs ?? []),
      ...(input.failureEvidenceCreated
        ? [`evidence:shortcut-failure:${input.route?.wormholeId ?? 'none'}`]
        : []),
    ],
    failureEvidenceCreated: input.failureEvidenceCreated ?? false,
    returnedToHomeBase: true,
    plasticityAlteredPermissions: false,
    atIso: input.atIso,
  };
  return receipt;
}

/** Plasticity soft-wire: learning may adjust confidence/highway — never permissions. */
export function applyPlasticityFeedback(input: {
  wormholeId: string;
  strengthen: boolean;
  atIso: string;
  attemptAlterPermissions?: boolean;
}):
  | { ok: true; permissionsAltered: false }
  | { ok: false; denied: true; reason: string; permissionsAltered: false } {
  if (
    input.attemptAlterPermissions ||
    EX18_LOCKS.PLASTICITY_ALTERS_PERMISSIONS === true ||
    EX18_LOCKS.PLASTICITY_ALTERS_AUTHORITY === true ||
    EX18_LOCKS.PLASTICITY_ALTERS_GUARDIAN === true ||
    EX18_LOCKS.PLASTICITY_ALTERS_RLS === true
  ) {
    return {
      ok: false,
      denied: true,
      reason:
        'Plasticity must never modify authority/permissions/Guardian/RLS/billing/contracts/prod rights.',
      permissionsAltered: false,
    };
  }
  // Bounded confidence nudge only — no authority surface.
  updateWormhole(input.wormholeId, {
    confidence: input.strengthen ? 0.6 : 0.4,
    updatedAtIso: input.atIso,
  });
  return { ok: true, permissionsAltered: false };
}
