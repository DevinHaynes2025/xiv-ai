/**
 * Hardware Truth Matrix — per vendor / device / accelerator class.
 * Same truth rule across all vendors. No fabricated VERIFIED claims.
 */

import {
  ACCELERATOR_CLASSES,
  CHIP_VENDORS,
  HC3_LOCKS,
  amdGpuVerificationStatus,
  canAdvanceTruthLadder,
  scopesMatch,
  type AcceleratorClass,
  type ChipVendor,
  type HardwareTruthState,
  type TenantScope,
  type TruthLadderState,
} from './types.ts';

export type HardwareMatrixEntry = {
  entryId: string;
  vendor: ChipVendor;
  deviceId: string;
  deviceLabel: string;
  acceleratorClass: AcceleratorClass;
  architecture: string;
  truthState: HardwareTruthState;
  evidenceIds: readonly string[];
  lastEvidenceAt: string | null;
  stale: boolean;
  fallbackOf: string | null;
  /** When this entry is a fallback path, claimed accelerator is never auto-VERIFIED. */
  isFallbackPath: boolean;
  scope: TenantScope;
};

export type RegisterMatrixEntryInput = {
  entryId: string;
  vendor: ChipVendor;
  deviceId: string;
  deviceLabel: string;
  acceleratorClass: AcceleratorClass;
  architecture: string;
  initialState?: HardwareTruthState;
  isFallbackPath?: boolean;
  fallbackOf?: string | null;
  scope: TenantScope;
};

export type AdvanceResult =
  | {
      ok: true;
      entry: HardwareMatrixEntry;
      from: HardwareTruthState;
      to: HardwareTruthState;
    }
  | {
      ok: false;
      denied: true;
      reason: string;
      from: HardwareTruthState;
      to: HardwareTruthState;
    };

export class HardwareTruthMatrix {
  private readonly entries = new Map<string, HardwareMatrixEntry>();

  register(input: RegisterMatrixEntryInput): HardwareMatrixEntry {
    const initial: HardwareTruthState =
      input.initialState ??
      (input.vendor === 'AMD' && input.acceleratorClass === 'GPU'
        ? amdGpuVerificationStatus().state
        : 'DOCUMENTED');

    // Never allow fabricating AMD GPU VERIFIED at registration.
    let truthState = initial;
    if (
      input.vendor === 'AMD' &&
      input.acceleratorClass === 'GPU' &&
      truthState === 'VERIFIED' &&
      !HC3_LOCKS.FABRICATE_AMD_GPU_VERIFIED
    ) {
      const status = amdGpuVerificationStatus({
        freshEvidencePresent: false,
        boundedInferenceSucceeded: false,
      });
      truthState = status.state;
    }

    const entry: HardwareMatrixEntry = {
      entryId: input.entryId,
      vendor: input.vendor,
      deviceId: input.deviceId,
      deviceLabel: input.deviceLabel,
      acceleratorClass: input.acceleratorClass,
      architecture: input.architecture,
      truthState,
      evidenceIds: [],
      lastEvidenceAt: null,
      stale: false,
      fallbackOf: input.fallbackOf ?? null,
      isFallbackPath: input.isFallbackPath ?? false,
      scope: { ...input.scope },
    };
    this.entries.set(entry.entryId, entry);
    return entry;
  }

  get(entryId: string, scope: TenantScope): HardwareMatrixEntry | null {
    const entry = this.entries.get(entryId);
    if (!entry) return null;
    if (!scopesMatch(entry.scope, scope)) return null;
    return entry;
  }

  list(scope: TenantScope, vendor?: ChipVendor): readonly HardwareMatrixEntry[] {
    const out: HardwareMatrixEntry[] = [];
    for (const entry of this.entries.values()) {
      if (!scopesMatch(entry.scope, scope)) continue;
      if (vendor && entry.vendor !== vendor) continue;
      out.push(entry);
    }
    return out;
  }

  /**
   * Advance one ladder step only. Skipping denied.
   * Fallback paths cannot claim target accelerator VERIFIED.
   */
  advance(input: {
    entryId: string;
    to: TruthLadderState;
    evidenceId: string;
    scope: TenantScope;
    boundedRunSucceeded?: boolean;
    /** AMD GPU only — must not be set true without real environment evidence. */
    amdGpuEnvironmentEvidence?: boolean;
  }): AdvanceResult {
    const entry = this.get(input.entryId, input.scope);
    if (!entry) {
      return {
        ok: false,
        denied: true,
        reason: 'ENTRY_NOT_FOUND_OR_CROSS_TENANT',
        from: 'UNAVAILABLE',
        to: input.to,
      };
    }

    const from = entry.truthState;
    if (!canAdvanceTruthLadder(from, input.to)) {
      return {
        ok: false,
        denied: true,
        reason: `TRUTH_LADDER_SKIP_DENIED:${from}->${input.to}`,
        from,
        to: input.to,
      };
    }

    if (input.to === 'VERIFIED') {
      if (entry.isFallbackPath && !HC3_LOCKS.FALLBACK_EQ_ACCELERATOR_VERIFIED) {
        return {
          ok: false,
          denied: true,
          reason: 'FALLBACK_PATH_CANNOT_CLAIM_ACCELERATOR_VERIFIED',
          from,
          to: input.to,
        };
      }
      if (!input.boundedRunSucceeded) {
        return {
          ok: false,
          denied: true,
          reason: 'VERIFIED_REQUIRES_BOUNDED_RUN_EVIDENCE',
          from,
          to: input.to,
        };
      }
      if (
        entry.vendor === 'AMD' &&
        entry.acceleratorClass === 'GPU' &&
        !HC3_LOCKS.FABRICATE_AMD_GPU_VERIFIED
      ) {
        const status = amdGpuVerificationStatus({
          freshEvidencePresent: Boolean(input.amdGpuEnvironmentEvidence),
          boundedInferenceSucceeded: input.boundedRunSucceeded,
          environmentEvidence: Boolean(input.amdGpuEnvironmentEvidence),
        });
        if (!status.verified) {
          return {
            ok: false,
            denied: true,
            reason: 'AMD_GPU_VERIFICATION_NO_WITHOUT_FRESH_EVIDENCE',
            from,
            to: input.to,
          };
        }
      }
    }

    if (entry.stale && input.to === 'VERIFIED') {
      return {
        ok: false,
        denied: true,
        reason: 'STALE_EVIDENCE_BLOCKS_VERIFIED',
        from,
        to: input.to,
      };
    }

    const updated: HardwareMatrixEntry = {
      ...entry,
      truthState: input.to,
      evidenceIds: [...entry.evidenceIds, input.evidenceId],
      lastEvidenceAt: new Date().toISOString(),
      stale: false,
    };
    this.entries.set(updated.entryId, updated);
    return { ok: true, entry: updated, from, to: input.to };
  }

  markHonestyState(
    entryId: string,
    scope: TenantScope,
    state: HardwareTruthState,
  ): HardwareMatrixEntry | null {
    const entry = this.get(entryId, scope);
    if (!entry) return null;
    const updated: HardwareMatrixEntry = {
      ...entry,
      truthState: state,
      stale: state === 'STALE' || state === 'REVALIDATION_REQUIRED',
    };
    this.entries.set(updated.entryId, updated);
    return updated;
  }

  /** Seed default cross-vendor skeleton (DOCUMENTED / NOT_TESTED honesty). */
  seedDefaultCrossVendorSkeleton(scope: TenantScope): readonly HardwareMatrixEntry[] {
    const seeded: HardwareMatrixEntry[] = [];
    for (const vendor of CHIP_VENDORS) {
      for (const cls of ACCELERATOR_CLASSES) {
        if (cls === 'OTHER_ACCELERATOR' && vendor !== 'FUTURE_ACCELERATOR') {
          continue;
        }
        const entryId = `${vendor.toLowerCase()}-${cls.toLowerCase()}-skeleton`;
        if (this.entries.has(entryId)) continue;
        const initial =
          vendor === 'AMD' && cls === 'GPU'
            ? ('NOT_TESTED' as const)
            : ('DOCUMENTED' as const);
        seeded.push(
          this.register({
            entryId,
            vendor,
            deviceId: `${vendor}-${cls}-skeleton`,
            deviceLabel: `${vendor} ${cls} (skeleton)`,
            acceleratorClass: cls,
            architecture: 'common-path-graph',
            initialState: initial,
            scope,
          }),
        );
      }
    }
    return seeded;
  }
}

export function createHardwareTruthMatrix(): HardwareTruthMatrix {
  return new HardwareTruthMatrix();
}
